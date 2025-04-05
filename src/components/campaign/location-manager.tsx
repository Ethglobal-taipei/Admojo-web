"use client"

import { useState } from "react"
import { 
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
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { 
  Dialog, 
  DialogContent, 
  DialogDescription, 
  DialogHeader, 
  DialogTitle, 
  DialogFooter 
} from "@/components/ui/dialog"
import { useLocationStore } from "@/lib/store"
import { useAdContract } from "@/hooks/use-ad-contract"
import { toast } from "@/lib/toast"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"

// Campaign type definition from blockchain
interface Campaign {
  id: string;
  metadata: {
    name: string;
    description: string;
    contentURI: string;
    startDate: bigint;
    duration: number;
    additionalInfo?: string;
  };
  owner: string;
  active: boolean;
  bookedLocations: number[];
}

// Define location type from store
interface Location {
  id: number;
  name: string;
  city?: string;
  area?: string;
  deviceId?: number;
  type?: string;
  displaySize?: string;
  displayType?: string;
  isActive: boolean;
}

interface LocationManagerProps {
  campaignId: number | string;
  campaign: Campaign | null;
  onLocationChange?: () => void;
  compact?: boolean;
}

export function LocationManager({ 
  campaignId, 
  campaign, 
  onLocationChange, 
  compact = false 
}: LocationManagerProps) {
  const numericCampaignId = typeof campaignId === 'string' ? parseInt(campaignId) : campaignId;
  
  // States
  const [searchQuery, setSearchQuery] = useState("")
  const [selectedLocationIds, setSelectedLocationIds] = useState<number[]>([])
  const [showAddDialog, setShowAddDialog] = useState(false)
  const [isAddingLocations, setIsAddingLocations] = useState(false)
  const [isRemovingLocation, setIsRemovingLocation] = useState<number | null>(null)
  
  // Hooks
  const { operations } = useAdContract()
  const { locations } = useLocationStore()
  
  // Filter locations based on search query and exclude already booked locations
  const filteredLocations = locations.filter(location => {
    // Skip locations without deviceId
    if (location.deviceId === undefined) return false;
    
    const isAlreadyBooked = campaign?.bookedLocations?.includes(location.deviceId)
    const matchesSearch = location.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
                         (location.city && location.city.toLowerCase().includes(searchQuery.toLowerCase()))
    
    return !isAlreadyBooked && matchesSearch
  })
  
  // Add selected locations to campaign
  const handleAddLocations = async () => {
    if (selectedLocationIds.length === 0 || !campaign) return
    
    try {
      setIsAddingLocations(true)
      
      // Sequential addition of locations (could be parallelized, but this is safer)
      for (const locationId of selectedLocationIds) {
        const hash = await operations.addLocationToCampaign.execute(
          numericCampaignId,
          locationId
        )
        
        if (!hash) {
          throw new Error(`Failed to add location ${locationId}`)
        }
      }
      
      toast("Locations Added", { 
        description: `Successfully added ${selectedLocationIds.length} location(s) to your campaign.` 
      }, "success")
      
      // Reset selection
      setSelectedLocationIds([])
      setShowAddDialog(false)
      
      // Notify parent component about the change
      if (onLocationChange) {
        onLocationChange()
      }
      
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
    if (!campaign) return;
    
    try {
      setIsRemovingLocation(deviceId)
      
      // Check if this is the last location
      if (campaign.bookedLocations.length <= 1) {
        toast("Cannot Remove", { 
          description: "A campaign must have at least one location. Add a new location before removing this one." 
        }, "warning")
        return
      }
      
      const hash = await operations.removeLocationFromCampaign.execute(
        numericCampaignId,
        deviceId
      )
      
      if (!hash) {
        throw new Error("Transaction failed")
      }
      
      toast("Location Removed", { 
        description: "The location has been removed from your campaign." 
      }, "success")
      
      // Notify parent component about the change
      if (onLocationChange) {
        onLocationChange()
      }
      
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
  
  if (!campaign) {
    return (
      <div className="border-[3px] border-black rounded-none p-4">
        <div className="text-center p-4">
          <AlertCircle className="h-8 w-8 mx-auto mb-2 text-amber-500" />
          <p className="text-gray-600">Campaign information not available</p>
        </div>
      </div>
    )
  }

  return (
    <>
      {!compact && (
        <Alert className="border-[3px] border-[#FFCC00] bg-[#FFCC00]/10 mb-4">
          <AlertCircle className="h-5 w-5" />
          <AlertTitle className="font-bold">Manage Campaign Locations</AlertTitle>
          <AlertDescription>
            Add or remove display locations for your campaign. Campaigns must always have at least one location.
            Changes will be processed on the blockchain and may take a few moments to complete.
          </AlertDescription>
        </Alert>
      )}
      
      <div className="flex justify-between items-center mb-4">
        <h3 className="font-bold text-lg flex items-center">
          <MapPin className="mr-2 h-5 w-5" />
          {compact ? "Campaign Locations" : "Current Locations"} ({campaign.bookedLocations.length})
        </h3>
        
        <Button
          onClick={() => setShowAddDialog(true)}
          className={compact 
            ? "bg-[#0055FF] text-white border-[2px] border-black hover:bg-[#0044CC] h-8 text-xs py-0 px-2"
            : "bg-[#0055FF] text-white border-[3px] border-black hover:bg-[#0044CC]"}
          size={compact ? "sm" : "default"}
        >
          <Plus className={`mr-1 ${compact ? 'h-3 w-3' : 'h-4 w-4'}`} />
          Add {compact ? "" : "Locations"}
        </Button>
      </div>
      
      {campaign.bookedLocations.length === 0 ? (
        <div className="text-center p-6 bg-gray-50">
          <p className="text-gray-500">No locations currently assigned to this campaign.</p>
        </div>
      ) : (
        <div className={`grid grid-cols-1 ${compact ? 'md:grid-cols-2' : 'md:grid-cols-2 lg:grid-cols-3'} gap-4`}>
          {campaign.bookedLocations.map((deviceId: number) => {
            const locationDetails = locations.find(loc => loc.deviceId === deviceId);
            return (
              <div 
                key={deviceId} 
                className="border-[2px] border-black p-4 bg-white relative group"
              >
                <div className="font-bold text-lg mb-1">
                  {locationDetails?.name || `Location #${deviceId}`}
                </div>
                <div className="text-sm text-gray-600 mb-2">
                  {locationDetails?.city || 'Unknown location'} • ID: {deviceId}
                </div>
                {!compact && (
                  <div className="flex flex-wrap gap-2 mb-3">
                    <Badge className="bg-blue-100 text-blue-800 border-blue-200 hover:bg-blue-100">
                      {locationDetails?.type || 'Unknown type'}
                    </Badge>
                    <Badge className="bg-purple-100 text-purple-800 border-purple-200 hover:bg-purple-100">
                      {locationDetails?.displaySize || 'Standard'}
                    </Badge>
                  </div>
                )}
                <Button
                  variant="outline"
                  size="sm"
                  className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 border-[2px] border-red-500 text-red-500 hover:bg-red-50 hover:text-red-600 rounded-full w-8 h-8 p-0"
                  onClick={() => handleRemoveLocation(deviceId)}
                  disabled={isRemovingLocation === deviceId || campaign.bookedLocations.length <= 1}
                >
                  {isRemovingLocation === deviceId ? (
                    <RefreshCw className="h-4 w-4 animate-spin" />
                  ) : (
                    <Trash className="h-4 w-4" />
                  )}
                </Button>
              </div>
            );
          })}
        </div>
      )}
      
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
    </>
  )
} 