"use client"

import { useState, useEffect } from "react"
import { useParams, useRouter } from "next/navigation"
import {
  ArrowLeft,
  Edit,
  Trash2,
  MapPin,
  Calendar,
  Clock,
  Eye,
  DollarSign,
  BarChart2,
  Users,
  CheckCircle,
  AlertTriangle,
  Settings,
  ImageIcon,
  Maximize,
  ChevronLeft,
  ChevronRight,
  X,
  XCircle,
  Hammer,
  RefreshCw,
  AlertCircle,
  Newspaper
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { useLocationStore, getStatusString } from "@/lib/store/useLocationStore"
import { useRoleStore, useUserStore } from "@/lib/store"
import { toast } from "@/lib/toast"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { usePrivy } from "@privy-io/react-auth"
import { useAdContract } from "@/hooks/use-ad-contract"
import { Skeleton } from "@/components/ui/skeleton"
import { Badge } from "@/components/ui/badge"
import { AdContractSystem, BoothStatus } from "@/lib/AdCampaignSystem/AdCampaignSystem"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog"
import { Progress } from "@/components/ui/progress"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { format } from "date-fns"
import { LocationStatusDisplay } from "@/components/campaign/LocationStatusDisplay"
import { LocationCampaignHistory } from "@/components/campaign/LocationCampaignHistory"

export default function LocationDetailPage() {
  const params = useParams()
  const router = useRouter()
  const { isConnected } = useUserStore()
  const { currentRole: activeRole, isProviderRegistered } = useRoleStore()
  const { currentLocation, fetchLocationById, isLoading, error, setLocationStatus, deleteLocation } = useLocationStore()
  const { authenticated, ready, user } = usePrivy()
  const { operations, adContract, isCorrectChain, switchChain } = useAdContract()

  const [currentImageIndex, setCurrentImageIndex] = useState(0)
  const [showImageModal, setShowImageModal] = useState(false)
  const [location, setLocation] = useState<any>(null)
  const [campaignHistory, setCampaignHistory] = useState<any[]>([])
  const [currentCampaigns, setCurrentCampaigns] = useState<any[]>([])
  const [isLoadingCampaigns, setIsLoadingCampaigns] = useState(false)
  const [isUpdatingStatus, setIsUpdatingStatus] = useState(false)
  const [refreshing, setRefreshing] = useState(false)

  // Fetch location data
  useEffect(() => {
    if (params.id) {
      fetchLocationById(params.id as string)
    }
  }, [params.id, fetchLocationById])

  // Redirect if not connected or not a registered provider
  useEffect(() => {
    if (!isConnected) {
      toast(
        "Connect wallet first",
        { description: "You need to connect your wallet to view your locations." },
        "warning",
      )
      router.push("/dashboard")
      return
    }

    if (isConnected && activeRole !== "provider") {
      toast(
        "Switch to provider mode",
        { description: "You need to be in provider mode to view your locations." },
        "warning",
      )
      router.push("/dashboard")
      return
    }

    if (isConnected && activeRole === "provider" && !isProviderRegistered) {
      toast(
        "Register as provider",
        { description: "You need to register as a provider to view your locations." },
        "warning",
      )
      router.push("/provider-registration")
      return
    }
  }, [isConnected, activeRole, isProviderRegistered, router])

  // Handle errors
  useEffect(() => {
    if (error) {
      toast("Error", { description: error }, "error")
    }
  }, [error])

  // Fetch location data
  useEffect(() => {
    const fetchLocationDetails = async () => {
      try {
        // Try to find location in store first
        const storeLocation = locations.find(loc => loc.id.toString() === params.id)
        
        if (storeLocation) {
          setLocation(storeLocation)
          
          // If location has a deviceId, fetch blockchain data
          if (storeLocation.deviceId && adContract) {
            try {
              // Get booth details from blockchain
              const boothDetails = await adContract.getBoothDetails(storeLocation.deviceId)
              
              // Get campaign history for this location
              await fetchCampaignHistory(storeLocation.deviceId)
              
              // Update local state with blockchain data
              setLocation(prev => ({
                ...prev,
                status: boothDetails.status,
                isActive: boothDetails.active,
                owner: boothDetails.owner
              }))
            } catch (err) {
              console.error("Error fetching blockchain data:", err)
            }
          }
        } else {
          // If location not in store, refresh locations first
          if (authenticated && ready) {
            await fetchLocations()
            
            // Try again after locations are fetched
            const refreshedLocation = locations.find(loc => loc.id.toString() === params.id)
            if (refreshedLocation) {
              setLocation(refreshedLocation)
              
              // If location has a deviceId, fetch blockchain data
              if (refreshedLocation.deviceId && adContract) {
                try {
                  // Get booth details from blockchain
                  const boothDetails = await adContract.getBoothDetails(refreshedLocation.deviceId)
                  
                  // Get campaign history for this location
                  await fetchCampaignHistory(refreshedLocation.deviceId)
                  
                  // Update local state with blockchain data
                  setLocation(prev => ({
                    ...prev,
                    status: boothDetails.status,
                    isActive: boothDetails.active,
                    owner: boothDetails.owner
                  }))
                } catch (err) {
                  console.error("Error fetching blockchain data:", err)
                }
              }
            } else {
              toast("Location Not Found", {
                description: "The requested location could not be found."
              }, "error")
              router.push("/provider/locations")
            }
          }
        }
      } catch (error) {
        console.error("Error fetching location details:", error)
        toast("Error", {
          description: "Failed to load location details. Please try again."
        }, "error")
      }
    }
    
    fetchLocationDetails()
  }, [params.id, locations, adContract, authenticated, ready, fetchLocations, router])
  
  // Fetch campaign history for this location
  const fetchCampaignHistory = async (deviceId: number) => {
    if (!adContract) return
    
    try {
      setIsLoadingCampaigns(true)
      
      const history = await adContract.getDevicePreviousCampaigns(deviceId)
      
      // Transform the history data
      const transformedHistory = history.campaignIds.map((id: number, index: number) => ({
        id,
        advertiser: history.advertisers[index],
        metadata: history.metadatas[index],
        active: history.activeStatus[index]
      }))
      
      // Sort active campaigns first, then by ID (most recent first)
      const sortedHistory = transformedHistory.sort((a, b) => {
        if (a.active && !b.active) return -1
        if (!a.active && b.active) return 1
        return Number(b.id) - Number(a.id)
      })
      
      // Get current (active) campaigns
      const active = sortedHistory.filter(campaign => campaign.active)
      
      setCampaignHistory(sortedHistory)
      setCurrentCampaigns(active)
    } catch (error) {
      console.error("Error fetching campaign history:", error)
    } finally {
      setIsLoadingCampaigns(false)
    }
  }
  
  // Update location status on blockchain
  const updateLocationStatus = async (newStatus: "activate" | "deactivate" | "maintenance") => {
    if (!location?.deviceId || !adContract) return
    
    try {
      setIsUpdatingStatus(true)
      
      if (!isCorrectChain) {
        toast("Wrong Network", {
          description: "Please switch to the correct network."
        }, "warning")
        await switchChain()
        return
      }
      
      let hash
      
      switch (newStatus) {
        case "activate":
          hash = await operations.activateBooth.execute(location.deviceId)
          break
        case "deactivate":
          hash = await operations.deactivateBooth.execute(location.deviceId)
          break
        case "maintenance":
          hash = await operations.updateBoothStatus.execute(location.deviceId, BoothStatus.UnderMaintenance)
          break
      }
      
      if (hash) {
        toast("Status Updated", {
          description: `Location status has been updated to ${newStatus === "maintenance" ? "maintenance" : newStatus === "activate" ? "active" : "inactive"}`
        }, "success")
        
        // Refresh location data
        if (location.deviceId) {
          const boothDetails = await adContract.getBoothDetails(location.deviceId)
          
          setLocation(prev => ({
            ...prev,
            status: boothDetails.status,
            isActive: boothDetails.active
          }))
        }
      } else {
        throw new Error("Transaction failed")
      }
    } catch (error) {
      console.error("Failed to update status:", error)
      toast("Update Failed", {
        description: "Failed to update location status. Please try again."
      }, "error")
    } finally {
      setIsUpdatingStatus(false)
    }
  }
  
  // Handle refresh button
  const handleRefresh = async () => {
    if (!location?.deviceId || !adContract) return
    
    try {
      setRefreshing(true)
      
      // Refresh booth details from blockchain
      const boothDetails = await adContract.getBoothDetails(location.deviceId)
      
      // Refresh campaign history
      await fetchCampaignHistory(location.deviceId)
      
      // Update location with new data
      setLocation(prev => ({
        ...prev,
        status: boothDetails.status,
        isActive: boothDetails.active,
        owner: boothDetails.owner
      }))
      
      toast("Refreshed", {
        description: "Location information has been updated."
      }, "success")
    } catch (error) {
      console.error("Error refreshing location data:", error)
      toast("Refresh Failed", {
        description: "Failed to refresh location data. Please try again."
      }, "error")
    } finally {
      setRefreshing(false)
    }
  }
  
  // Helper function to get status badge
  const getStatusBadge = (status?: number, isActive?: boolean) => {
    if (!isActive) {
      return <Badge className="bg-gray-100 text-gray-800 border-gray-200">Inactive</Badge>
    }
    
    switch (status) {
      case BoothStatus.Unbooked:
        return <Badge className="bg-green-100 text-green-800 border-green-200">Available</Badge>
      case BoothStatus.Booked:
        return <Badge className="bg-blue-100 text-blue-800 border-blue-200">Booked</Badge>
      case BoothStatus.UnderMaintenance:
        return <Badge className="bg-orange-100 text-orange-800 border-orange-200">Maintenance</Badge>
      default:
        return <Badge className="bg-gray-100 text-gray-800 border-gray-200">Unknown</Badge>
    }
  }
  
  // Format timestamp to readable date
  const formatDate = (timestamp: number) => {
    return format(new Date(timestamp * 1000), "PPP")
  }

  const handleEdit = () => {
    if (location) {
      router.push(`/provider/locations/edit/${location.id}`)
    }
  }

  const handleDelete = async () => {
    if (!location) return

    // Show confirmation dialog
    if (confirm("Are you sure you want to delete this location? This action cannot be undone.")) {
      try {
        await deleteLocation(location.id)
        toast("Location Deleted", { description: "Your location has been successfully deleted." }, "success")
        router.push("/provider/locations")
      } catch (error) {
        // Error is handled in the store action
      }
    }
  }

  const handleToggleStatus = async () => {
    if (!location) return

    try {
      const newStatus = location.status === "active" ? "inactive" : "active"
      await setLocationStatus(location.id, newStatus)
    } catch (error) {
      // Error is handled in the store action
    }
  }

  const handlePrevImage = () => {
    if (!location || !location.images.length) return
    setCurrentImageIndex((prev) => (prev === 0 ? location.images.length - 1 : prev - 1))
  }

  const handleNextImage = () => {
    if (!location || !location.images.length) return
    setCurrentImageIndex((prev) => (prev === location.images.length - 1 ? 0 : prev + 1))
  }

  if (isLoading || !location) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="mb-6">
          <Button
            variant="outline"
            onClick={() => router.back()}
            className="border-[3px] border-black rounded-none bg-white hover:bg-[#f5f5f5]"
          >
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back
          </Button>
        </div>
        
        <div className="space-y-8">
          <div className="border-[4px] border-black">
            <div className="p-6 border-b-[4px] border-black">
              <Skeleton className="h-8 w-3/4 bg-gray-200 mb-2" />
              <Skeleton className="h-4 w-1/2 bg-gray-200" />
            </div>
            <div className="p-6">
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <div className="lg:col-span-2 space-y-6">
                  <Skeleton className="h-48 w-full bg-gray-200" />
                  <Skeleton className="h-24 w-full bg-gray-200" />
                </div>
                <div>
                  <Skeleton className="h-72 w-full bg-gray-200" />
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex items-center justify-between mb-6">
        <Button
          variant="outline"
          onClick={() => router.push("/provider/locations")}
          className="border-[3px] border-black rounded-none bg-white hover:bg-[#f5f5f5]"
        >
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back to Locations
        </Button>
        
        <div className="flex gap-2">
          <Button
            variant="outline"
            onClick={handleRefresh}
            disabled={refreshing || !location.deviceId}
            className="border-[3px] border-black rounded-none bg-white hover:bg-[#f5f5f5]"
          >
            <RefreshCw className={`mr-2 h-4 w-4 ${refreshing ? "animate-spin" : ""}`} />
            Refresh
          </Button>
          
          <Button
            onClick={() => router.push(`/provider/locations/edit/${params.id}`)}
            className="bg-[#0055FF] text-white border-[3px] border-black hover:bg-[#0044CC]"
          >
            <Edit className="mr-2 h-4 w-4" />
            Edit Location
          </Button>
        </div>
      </div>
      
      {/* Location Header Card */}
      <Card className="border-[6px] border-black shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] mb-8">
        <CardHeader className="pb-4 border-b-[3px] border-black">
          <div className="flex justify-between items-start">
            <div>
              <CardTitle className="text-3xl font-black">{location.name}</CardTitle>
              <CardDescription className="text-lg">
                <div className="flex items-center gap-2 mt-1">
                  <MapPin className="h-4 w-4" />
                  {location.city || "Unknown location"}
                  {location.area && `, ${location.area}`}
                </div>
              </CardDescription>
            </div>
            <div className="flex items-center gap-3">
              <div className="text-sm font-medium">
                Location ID: {location.deviceId || "Not Registered"}
              </div>
              {location.deviceId ? (
                <LocationStatusDisplay deviceId={location.deviceId} />
              ) : (
                <Badge variant="outline" className="bg-gray-100 text-gray-800">
                  Not Registered
                </Badge>
              )}
            </div>
          </div>
        </CardHeader>
        
        <CardContent className="p-6">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            <div className="lg:col-span-2 space-y-8">
              {/* Location Information */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="border-[3px] border-black p-4">
                  <div className="flex items-center gap-2 mb-3">
                    <DollarSign className="h-5 w-5" />
                    <h3 className="font-bold">Display Details</h3>
                  </div>
                  <div className="space-y-2">
                    <div className="grid grid-cols-2">
                      <div className="text-gray-600">Display Type:</div>
                      <div className="font-medium">{location.displayType || "Standard"}</div>
                    </div>
                    <div className="grid grid-cols-2">
                      <div className="text-gray-600">Display Size:</div>
                      <div className="font-medium">{location.displaySize || "Standard"}</div>
                    </div>
                    <div className="grid grid-cols-2">
                      <div className="text-gray-600">Daily Rate:</div>
                      <div className="font-medium">{location.pricePerDay || 0} ADC</div>
                    </div>
                  </div>
                </div>
                
                <div className="border-[3px] border-black p-4">
                  <div className="flex items-center gap-2 mb-3">
                    <Newspaper className="h-5 w-5" />
                    <h3 className="font-bold">Visibility & Metrics</h3>
                  </div>
                  <div className="space-y-2">
                    <div className="grid grid-cols-2">
                      <div className="text-gray-600">Daily Traffic:</div>
                      <div className="font-medium">{location.dailyTraffic?.toLocaleString() || "Unknown"}</div>
                    </div>
                    <div className="grid grid-cols-2">
                      <div className="text-gray-600">Impressions:</div>
                      <div className="font-medium">{location.dailyImpressions?.toLocaleString() || "0"}</div>
                    </div>
                    <div className="grid grid-cols-2">
                      <div className="text-gray-600">Area:</div>
                      <div className="font-medium">{location.area || "Unknown"}</div>
                    </div>
                  </div>
                </div>
              </div>
              
              {/* Current Status Management */}
              <div className="border-[3px] border-black p-6">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-xl font-bold">Current Status</h3>
                  {location.deviceId ? (
                    <LocationStatusDisplay deviceId={location.deviceId} />
                  ) : (
                    <Badge variant="outline" className="bg-gray-100 text-gray-800">
                      Not Registered
                    </Badge>
                  )}
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                  <div className="text-center p-3 border-[2px] border-gray-200 bg-gray-50">
                    <div className="text-sm text-gray-600 mb-1">Device ID</div>
                    <div className="font-bold">{location.deviceId || "Not Registered"}</div>
                  </div>
                  
                  <div className="text-center p-3 border-[2px] border-gray-200 bg-gray-50">
                    <LocationStatusDisplay 
                      deviceId={location.deviceId} 
                      variant="block" 
                      showActive={false}
                      refreshInterval={30000} 
                    />
                  </div>
                  
                  <div className="text-center p-3 border-[2px] border-gray-200 bg-gray-50">
                    <div className="text-sm text-gray-600 mb-1">Current Campaigns</div>
                    <div className="font-bold">{currentCampaigns.length}</div>
                  </div>
                </div>
                
                <div className="flex flex-wrap gap-3">
                  <Button
                    variant="outline"
                    disabled={isUpdatingStatus || !location.deviceId || location.isActive}
                    onClick={() => updateLocationStatus("activate")}
                    className="border-[2px] border-black rounded-none bg-green-50 hover:bg-green-100 text-green-800"
                  >
                    {isUpdatingStatus ? (
                      <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
                    ) : (
                      <CheckCircle className="mr-2 h-4 w-4" />
                    )}
                    Activate Location
                  </Button>
                  
                  <Button
                    variant="outline"
                    disabled={isUpdatingStatus || !location.deviceId || !location.isActive}
                    onClick={() => updateLocationStatus("deactivate")}
                    className="border-[2px] border-black rounded-none bg-red-50 hover:bg-red-100 text-red-800"
                  >
                    {isUpdatingStatus ? (
                      <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
                    ) : (
                      <XCircle className="mr-2 h-4 w-4" />
                    )}
                    Deactivate Location
                  </Button>
                  
                  <Button
                    variant="outline"
                    disabled={isUpdatingStatus || !location.deviceId || !location.isActive || location.status === BoothStatus.UnderMaintenance}
                    onClick={() => updateLocationStatus("maintenance")}
                    className="border-[2px] border-black rounded-none bg-orange-50 hover:bg-orange-100 text-orange-800"
                  >
                    {isUpdatingStatus ? (
                      <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
                    ) : (
                      <Hammer className="mr-2 h-4 w-4" />
                    )}
                    Set Maintenance Mode
                  </Button>
                </div>
              </div>
              
              {/* Campaigns Section */}
              {location.deviceId ? (
                <LocationCampaignHistory deviceId={location.deviceId} variant="full" />
              ) : (
                <div className="border-[3px] border-black">
                  <div className="p-4 border-b-[3px] border-black bg-gray-50">
                    <h3 className="font-bold text-lg">Campaigns History</h3>
                  </div>
                  
                  <div className="p-4">
                    <div className="text-center py-8 border-[2px] border-dashed border-gray-300 rounded-md">
                      <AlertCircle className="h-10 w-10 mx-auto mb-2 text-gray-400" />
                      <p className="text-gray-500 font-medium">Register this location on blockchain to view campaign history</p>
                    </div>
                  </div>
                </div>
              )}
            </div>
            
            {/* Sidebar */}
            <div className="space-y-6">
              {/* Location Map/Preview */}
              <Card className="border-[3px] border-black overflow-hidden">
                <CardHeader className="p-4 border-b-[3px] border-black bg-gray-50">
                  <CardTitle className="text-lg">Location Preview</CardTitle>
                </CardHeader>
                <CardContent className="p-0">
                  {location.images && location.images.length > 0 ? (
                    <img 
                      src={location.images[0]} 
                      alt={location.name} 
                      className="w-full h-64 object-cover"
                    />
                  ) : (
                    <div className="h-64 bg-gray-200 flex items-center justify-center">
                      <MapPin className="h-12 w-12 text-gray-400" />
                    </div>
                  )}
                </CardContent>
              </Card>
              
              {/* Blockchain Info */}
              <Card className="border-[3px] border-black">
                <CardHeader className="p-4 border-b-[3px] border-black bg-gray-50">
                  <CardTitle className="text-lg">Blockchain Information</CardTitle>
                </CardHeader>
                <CardContent className="p-4">
                  <div className="space-y-4">
                    <div>
                      <div className="text-sm text-gray-600 mb-1">Device ID:</div>
                      <div className="font-medium">{location.deviceId || "Not Registered"}</div>
                    </div>
                    
                    <div>
                      <div className="text-sm text-gray-600 mb-1">Owner Address:</div>
                      <div className="font-medium break-all">
                        {location.owner ? (
                          <>
                            {location.owner.slice(0, 8)}...{location.owner.slice(-6)}
                          </>
                        ) : (
                          "Not Registered"
                        )}
                      </div>
                    </div>
                    
                    <div>
                      <div className="text-sm text-gray-600 mb-1">Status:</div>
                      <div className="font-medium">{getStatusString(location.status)}</div>
                    </div>
                    
                    <div>
                      <div className="text-sm text-gray-600 mb-1">Active:</div>
                      <div className="font-medium">{location.isActive ? "Yes" : "No"}</div>
                    </div>
                    
                    {!location.deviceId && (
                      <div className="mt-4 p-3 bg-yellow-50 border-[2px] border-yellow-200 text-sm text-yellow-800">
                        <div className="flex gap-2 items-start">
                          <AlertCircle className="h-5 w-5 mt-0.5 text-yellow-600 flex-shrink-0" />
                          <div>
                            <p className="font-medium mb-1">Not registered on blockchain</p>
                            <p>This location has not been registered on the blockchain yet. Edit this location to add a Device ID and register it.</p>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
              
              {/* Current Campaign Info */}
              {currentCampaigns.length > 0 && (
                <Card className="border-[3px] border-black">
                  <CardHeader className="p-4 border-b-[3px] border-black bg-blue-50">
                    <CardTitle className="text-lg">Active Campaign</CardTitle>
                  </CardHeader>
                  <CardContent className="p-4">
                    <div className="space-y-3">
                      <div>
                        <div className="text-sm text-gray-600 mb-1">Campaign Name:</div>
                        <div className="font-medium">{currentCampaigns[0].metadata.name || `Campaign #${currentCampaigns[0].id}`}</div>
                      </div>
                      
                      <div>
                        <div className="text-sm text-gray-600 mb-1">Advertiser:</div>
                        <div className="font-medium">{currentCampaigns[0].advertiser.slice(0, 6)}...{currentCampaigns[0].advertiser.slice(-4)}</div>
                      </div>
                      
                      {currentCampaigns[0].metadata.startDate && (
                        <div>
                          <div className="text-sm text-gray-600 mb-1">Period:</div>
                          <div className="font-medium">
                            {format(new Date(Number(currentCampaigns[0].metadata.startDate) * 1000), "MMM d, yyyy")}
                            {currentCampaigns[0].metadata.duration && (
                              <> - {format(new Date(Number(currentCampaigns[0].metadata.startDate) * 1000 + (currentCampaigns[0].metadata.duration * 24 * 60 * 60 * 1000)), "MMM d, yyyy")}</>
                            )}
                          </div>
                        </div>
                      )}
                      
                      {currentCampaigns[0].metadata.duration && currentCampaigns[0].metadata.startDate && (
                        <div>
                          <div className="text-sm text-gray-600 mb-1">Progress:</div>
                          <div className="space-y-1">
                            {(() => {
                              const startTime = Number(currentCampaigns[0].metadata.startDate) * 1000;
                              const duration = currentCampaigns[0].metadata.duration * 24 * 60 * 60 * 1000;
                              const elapsed = Date.now() - startTime;
                              const progress = Math.min(100, Math.max(0, (elapsed / duration) * 100));
                              
                              return (
                                <>
                                  <Progress value={progress} className="h-2" />
                                  <div className="text-xs text-right">{Math.round(progress)}% complete</div>
                                </>
                              );
                            })()}
                          </div>
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>
              )}
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

