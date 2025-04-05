"use client"

import { useEffect, useState } from "react"
import { useParams, useRouter } from "next/navigation"
import {
  ArrowLeft,
  MapPin,
  Plus,
  Trash,
  Search,
  RefreshCw,
  AlertCircle,
  CheckCircle2,
  XCircle
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { useCampaignStore } from "@/lib/store"
import { toast } from "@/lib/toast"
import { usePrivy } from "@privy-io/react-auth"
import { useAdContract } from "@/hooks/use-ad-contract"
import { Input } from "@/components/ui/input"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { useLocationStore, Location } from "@/lib/store"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
  DialogClose,
} from "@/components/ui/dialog"
import { Badge } from "@/components/ui/badge"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Skeleton } from "@/components/ui/skeleton"
import { LocationManager } from "@/components/campaign/location-manager"

// Campaign type definition from blockchain
interface Campaign {
  id: number;
  metadata: {
    name: string;
    description: string;
    contentURI: string;
    startDate: bigint;
    duration: number;
    additionalInfo: string;
  };
  owner: string;
  active: boolean;
  bookedLocations: number[];
}

export default function CampaignManagePage() {
  const params = useParams()
  const router = useRouter()
  const campaignId = params.id as string
  
  const [currentCampaign, setCurrentCampaign] = useState<Campaign | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState("")
  const [selectedLocationIds, setSelectedLocationIds] = useState<number[]>([])
  const [showAddDialog, setShowAddDialog] = useState(false)
  const [isAddingLocations, setIsAddingLocations] = useState(false)
  const [isRemovingLocation, setIsRemovingLocation] = useState<number | null>(null)
  
  const { authenticated, user, ready } = usePrivy()
  const { operations, isCorrectChain, switchChain, adContract } = useAdContract()
  const { locations, fetchLocations } = useLocationStore()
  
  // Helper function to get wallet data
  const getPrivyAuth = () => {
    if (authenticated && ready && user && user.wallet) {
      return {
        authenticated,
        ready,
        user,
        wallet: {
          address: user.wallet.address,
          provider: window.ethereum
        }
      }
    }
    return null
  }

  // Helper function to refresh campaign data
  const refreshCampaignData = async () => {
    try {
      if (!adContract || !authenticated) return;
      
      // Get campaign details
      const campaignDetails = await operations.getCampaignDetails.execute(parseInt(campaignId))
      
      if (campaignDetails) {
        setCurrentCampaign(campaignDetails)
      } else {
        toast("Campaign Not Found", { description: "The campaign you're looking for could not be found." }, "error")
      }
    } catch (error) {
      console.error("Error fetching campaign:", error)
      toast("Error", { description: "Failed to refresh campaign details." }, "error")
    }
  }

  // Fetch campaign data
  useEffect(() => {
    const fetchCampaignData = async () => {
      try {
        setIsLoading(true)
        
        if (!adContract || !authenticated) {
          setTimeout(() => fetchCampaignData(), 1000) // retry if not ready
          return
        }
        
        // Get campaign details
        await refreshCampaignData()
      } catch (error) {
        console.error("Error fetching campaign:", error)
        toast("Error", { description: "Failed to load campaign details." }, "error")
      } finally {
        setIsLoading(false)
      }
    }
    
    if (campaignId) {
      fetchCampaignData()
    }
  }, [campaignId, adContract, authenticated])
  
  // Fetch available locations
  useEffect(() => {
    const fetchAvailableLocations = async () => {
      try {
        if (!adContract) return
        
        const privyAuth = getPrivyAuth()
        await fetchLocations(privyAuth)
        
      } catch (error) {
        console.error("Error fetching locations:", error)
      }
    }
    
    fetchAvailableLocations()
  }, [adContract, fetchLocations])
  
  // Filter locations based on search query and exclude already booked locations
  const filteredLocations = locations.filter(location => {
    // Skip locations without deviceId
    if (location.deviceId === undefined) return false;
    
    const isAlreadyBooked = currentCampaign?.bookedLocations?.includes(location.deviceId)
    const matchesSearch = location.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
                         (location.city && location.city.toLowerCase().includes(searchQuery.toLowerCase()))
    
    return !isAlreadyBooked && matchesSearch
  })
  
  // Add selected locations to campaign
  const handleAddLocations = async () => {
    if (selectedLocationIds.length === 0) return
    
    try {
      setIsAddingLocations(true)
      const privyAuth = getPrivyAuth()
      
      if (!privyAuth) {
        toast("Authentication Error", { description: "Please connect your wallet to continue." }, "error")
        return
      }
      
      // Sequential addition of locations (could be parallelized, but this is safer)
      for (const locationId of selectedLocationIds) {
        const hash = await operations.addLocationToCampaign.execute(
          parseInt(campaignId),
          locationId
        )
        
        if (!hash) {
          throw new Error(`Failed to add location ${locationId}`)
        }
      }
      
      // Refresh campaign data
      await refreshCampaignData()
      
      toast("Locations Added", { 
        description: `Successfully added ${selectedLocationIds.length} location(s) to your campaign.` 
      }, "success")
      
      // Reset selection
      setSelectedLocationIds([])
      setShowAddDialog(false)
      
    } catch (error) {
      console.error("Error adding locations:", error)
      toast("Error", { 
        description: "Failed to add locations to campaign. Please try again." 
      }, "error")
    } finally {
      setIsAddingLocations(false)
    }
  }
  
  // Remove a location from campaign
  const handleRemoveLocation = async (deviceId: number) => {
    try {
      setIsRemovingLocation(deviceId)
      const privyAuth = getPrivyAuth()
      
      if (!privyAuth) {
        toast("Authentication Error", { description: "Please connect your wallet to continue." }, "error")
        return
      }
      
      // Check if this is the last location
      if (currentCampaign && currentCampaign.bookedLocations.length <= 1) {
        toast("Cannot Remove", { 
          description: "A campaign must have at least one location. Add a new location before removing this one." 
        }, "warning")
        return
      }
      
      const hash = await operations.removeLocationFromCampaign.execute(
        parseInt(campaignId),
        deviceId
      )
      
      if (!hash) {
        throw new Error("Transaction failed")
      }
      
      // Refresh campaign data
      await refreshCampaignData()
      
      toast("Location Removed", { 
        description: "The location has been removed from your campaign." 
      }, "success")
      
    } catch (error) {
      console.error("Error removing location:", error)
      toast("Error", { 
        description: "Failed to remove location from campaign. Please try again." 
      }, "error")
    } finally {
      setIsRemovingLocation(null)
    }
  }
  
  // Toggle location selection in add dialog
  const toggleLocationSelection = (deviceId: number) => {
    if (selectedLocationIds.includes(deviceId)) {
      setSelectedLocationIds(selectedLocationIds.filter(id => id !== deviceId))
    } else {
      setSelectedLocationIds([...selectedLocationIds, deviceId])
    }
  }
  
  // Render loading state
  if (isLoading) {
    return (
      <div className="container mx-auto px-4 py-8 max-w-6xl">
        <div className="flex items-center mb-6">
          <Button
            variant="outline"
            onClick={() => router.back()}
            className="border-[3px] border-black rounded-none bg-white hover:bg-[#f5f5f5]"
          >
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back
          </Button>
        </div>
        
        <Card className="border-[6px] border-black shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] mb-8">
          <CardHeader>
            <Skeleton className="h-8 w-64 bg-gray-200 mb-2" />
            <Skeleton className="h-4 w-48 bg-gray-200" />
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <Skeleton className="h-40 bg-gray-200 w-full" />
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <Skeleton className="h-20 bg-gray-200" />
                <Skeleton className="h-20 bg-gray-200" />
                <Skeleton className="h-20 bg-gray-200" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }
  
  // Render not found state
  if (!currentCampaign) {
    return (
      <div className="container mx-auto px-4 py-8 max-w-6xl">
        <div className="flex items-center mb-6">
          <Button
            variant="outline"
            onClick={() => router.back()}
            className="border-[3px] border-black rounded-none bg-white hover:bg-[#f5f5f5]"
          >
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back
          </Button>
        </div>
        
        <Card className="border-[6px] border-black shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] mb-8">
          <CardContent className="pt-6">
            <div className="text-center py-8">
              <AlertCircle className="h-16 w-16 mx-auto mb-4 text-red-500" />
              <h2 className="text-2xl font-bold mb-2">Campaign Not Found</h2>
              <p className="mb-6 text-gray-600">The campaign you're looking for doesn't exist or you don't have access to it.</p>
              <Button
                onClick={() => router.push("/campaigns")}
                className="bg-[#0055FF] text-white border-[3px] border-black hover:bg-[#0044CC]"
              >
                View All Campaigns
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="container mx-auto px-4 py-8 max-w-6xl">
      {/* Header with back button */}
      <div className="flex items-center justify-between mb-6">
        <Button
          variant="outline"
          onClick={() => router.push(`/campaigns/${campaignId}`)}
          className="border-[3px] border-black rounded-none bg-white hover:bg-[#f5f5f5]"
        >
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back to Campaign
        </Button>
        
        <Button
          onClick={() => setShowAddDialog(true)}
          className="bg-[#0055FF] text-white border-[3px] border-black hover:bg-[#0044CC] rounded-none"
        >
          <Plus className="mr-2 h-4 w-4" />
          Add Locations
        </Button>
      </div>

      {/* Campaign Header Card */}
      <Card className="border-[6px] border-black shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] mb-8">
        <CardHeader className="pb-4">
          <div className="flex justify-between items-start">
            <div>
              <CardTitle className="text-3xl font-black">{currentCampaign.metadata.name}</CardTitle>
              <CardDescription className="text-lg">
                {currentCampaign.metadata.description || "No description provided"}
              </CardDescription>
            </div>
            <div
              className={`px-3 py-1 font-bold text-white border-[3px] border-black ${
                currentCampaign.active
                  ? "bg-green-500"
                  : "bg-yellow-500"
              }`}
            >
              {currentCampaign.active ? "ACTIVE" : "INACTIVE"}
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <LocationManager 
            campaignId={campaignId} 
            campaign={currentCampaign} 
            onLocationChange={refreshCampaignData}
          />
        </CardContent>
      </Card>
      
      {/* Add Locations Dialog */}
      <Dialog open={showAddDialog} onOpenChange={setShowAddDialog}>
        <DialogContent className="border-[6px] border-black p-0 max-w-4xl max-h-[90vh] w-[90vw]">
          <DialogHeader className="bg-[#0055FF] text-white p-6 border-b-[4px] border-black">
            <DialogTitle className="text-2xl font-black">Add Locations to Campaign</DialogTitle>
            <DialogDescription className="text-white/90">
              Select display locations to add to your campaign
            </DialogDescription>
          </DialogHeader>
          
          <div className="p-6 overflow-y-auto max-h-[60vh]">
            <div className="mb-4 relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500" />
              <Input
                placeholder="Search by name or city..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="border-[3px] border-black rounded-none pl-10"
              />
            </div>
            
            {filteredLocations.length === 0 ? (
              <div className="text-center p-10 bg-gray-50 border-[2px] border-dashed border-gray-300">
                <AlertCircle className="h-8 w-8 mx-auto mb-2 text-gray-400" />
                <p className="text-gray-500 font-bold">No available locations found</p>
                <p className="text-gray-400 text-sm mt-1">Try a different search term or check back later</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {filteredLocations.map((location) => {
                  // Skip locations without deviceId
                  if (location.deviceId === undefined) return null;
                  
                  return (
                    <div 
                      key={location.deviceId} 
                      className={`border-[2px] p-4 transition-all cursor-pointer ${
                        selectedLocationIds.includes(location.deviceId)
                          ? "border-[#0055FF] bg-blue-50"
                          : "border-black bg-white hover:bg-gray-50"
                      }`}
                      onClick={() => toggleLocationSelection(location.deviceId as number)}
                    >
                      <div className="flex justify-between items-start">
                        <div>
                          <div className="font-bold text-lg mb-1">{location.name}</div>
                          <div className="text-sm text-gray-600 mb-2">
                            {location.city || 'Unknown location'} • ID: {location.deviceId}
                          </div>
                          <div className="flex flex-wrap gap-2">
                            <Badge className="bg-blue-100 text-blue-800 border-blue-200 hover:bg-blue-100">
                              {location.type || 'Unknown type'}
                            </Badge>
                            <Badge className="bg-purple-100 text-purple-800 border-purple-200 hover:bg-purple-100">
                              {location.displaySize || 'Standard'}
                            </Badge>
                          </div>
                        </div>
                        <div className="w-6 h-6 border-2 rounded-full flex items-center justify-center bg-white">
                          {selectedLocationIds.includes(location.deviceId) && (
                            <CheckCircle2 className="h-5 w-5 text-[#0055FF]" />
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
          
          <DialogFooter className="p-6 border-t-[3px] border-black bg-gray-50">
            <div className="flex justify-between w-full">
              <Button
                variant="outline"
                onClick={() => {
                  setSelectedLocationIds([])
                  setShowAddDialog(false)
                }}
                className="border-[3px] border-black rounded-none bg-white hover:bg-[#f5f5f5]"
              >
                <XCircle className="mr-2 h-4 w-4" />
                Cancel
              </Button>
              
              <Button
                onClick={handleAddLocations}
                disabled={selectedLocationIds.length === 0 || isAddingLocations}
                className="bg-[#0055FF] text-white border-[3px] border-black hover:bg-[#0044CC] rounded-none"
              >
                {isAddingLocations ? (
                  <>
                    <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
                    Adding Locations...
                  </>
                ) : (
                  <>
                    <Plus className="mr-2 h-4 w-4" />
                    Add {selectedLocationIds.length} Location{selectedLocationIds.length !== 1 ? 's' : ''}
                  </>
                )}
              </Button>
            </div>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
} 