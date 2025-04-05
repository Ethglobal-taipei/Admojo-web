"use client"

import { useState, useEffect, useCallback } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Search, Filter, ArrowLeft, CheckSquare, MapPin } from "lucide-react"
import { useLocationStore } from "@/lib/store/useLocationStore"
import { useCampaignStore } from "@/lib/store/useCampaignStore"
import { toast } from "@/lib/toast"
import { useLocationData, type LocationData } from "@/hooks/use-location-data"
import { useAdContract } from "@/hooks/use-ad-contract"
import { Location } from "@/lib/store/useLocationStore"
import { useBoothRegistry } from "@/hooks/use-booth-registry"
import dynamic from "next/dynamic"

// Dynamically import the map component with no SSR
const CampaignLocationsMap = dynamic(
  () => import("@/components/map/campaign-locations-map"),
  { ssr: false }
)

// Simple list view component
const LocationsList = ({ 
  locations = [], 
  isLocationSelected, 
  onLocationToggle 
}: { 
  locations: LocationData[],
  isLocationSelected: (id: string | number) => boolean,
  onLocationToggle: (location: LocationData) => void
}) => {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 overflow-y-auto max-h-[500px]">
      {locations.map(location => (
        <div 
          key={location.id}
          className={`border-2 p-4 rounded-lg cursor-pointer hover:shadow-md ${
            isLocationSelected(location.id) ? 'border-blue-500 bg-blue-50' : 'border-gray-200'
          }`}
          onClick={() => onLocationToggle(location)}
        >
          <div className="font-bold">{location.name}</div>
          <div className="text-sm text-gray-600">{location.city || 'Unknown location'}</div>
          {location.displayType && (
            <div className="text-xs bg-gray-100 inline-block px-2 py-1 rounded mt-2">
              {location.displayType}
            </div>
          )}
          <div className="mt-2 text-xs text-gray-500">
            Views: {location.impressions?.toLocaleString() || 0} | Price: {location.pricePerDay} ADC/day
          </div>
        </div>
      ))}
    </div>
  );
};

export default function BrowseLocations() {
  const router = useRouter()
  const { isLoading: storeLoading } = useLocationStore()
  const { 
    locations: fetchedLocations, 
    isLoading: contractLoading,
    error: locationError,
    refresh
  } = useLocationData()
  
  const { 
    draftCampaign, 
    isSelectingLocations, 
    finishLocationSelection,
    updateDraftCampaign
  } = useCampaignStore()

  const { operations, isCorrectChain, switchChain } = useAdContract()
  
  const [searchTerm, setSearchTerm] = useState("")
  const [filterType, setFilterType] = useState("all")
  const [isBooking, setIsBooking] = useState(false)
  const [hasFetched, setHasFetched] = useState(false)
  const [viewMode, setViewMode] = useState<"map" | "list">("map")
  
  // Helper function to cast LocationData to be compatible with Location type for campaign store
  const asLocationCompatible = (location: LocationData): Location | LocationData => {
    return location as unknown as Location;
  }
  
  // Handle redirecting if not selecting locations
  useEffect(() => {
    if (!isSelectingLocations) {
      router.push("/dashboard")
    }
  }, [isSelectingLocations, router])
  
  // Fetch locations when component mounts, wrapped in useCallback to prevent dependency changes
  const fetchLocations = useCallback(async () => {
    console.log("Fetching locations...");
    if (!hasFetched && refresh) {
      console.log("Executing refresh...");
      try {
        await refresh();
        setHasFetched(true);
        console.log("Locations fetched successfully");
      } catch (error) {
        console.error("Error fetching locations:", error);
        toast("Error", { description: "Failed to load locations from blockchain." }, "error");
        setHasFetched(true); // Mark as fetched to prevent infinite retries
      }
    }
  }, [refresh, hasFetched]);
  
  // Only fetch on mount
  useEffect(() => {
    fetchLocations();
  }, [fetchLocations]);
  
  // Check if a location is already selected
  const isLocationSelected = (locationId: string | number) => {
    if (!draftCampaign.targetLocations) return false
    
    // Convert ID to string for consistent comparison
    const idStr = String(locationId);
    
    return draftCampaign.targetLocations.some((loc: any) => String(loc.id) === idStr);
  }
  
  // Filter locations based on search and filters
  const filteredLocations = fetchedLocations.filter(location => {
    // Search filter
    const matchesSearch = searchTerm === "" || 
      location.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (location.city && location.city.toLowerCase().includes(searchTerm.toLowerCase()));
    
    // Type filter
    const matchesType = filterType === "all" || 
      (filterType === "selected" && isLocationSelected(location.id)) ||
      (location.displayType && location.displayType.toLowerCase().includes(filterType.toLowerCase()));
    
    return matchesSearch && matchesType;
  });
  
  // Toggle the selection of a location
  const handleLocationToggle = (location: LocationData) => {
    const currentLocations = draftCampaign.targetLocations || []
    const deviceId = typeof location.deviceId === 'string' 
      ? parseInt(location.deviceId) 
      : location.deviceId
    
    if (isLocationSelected(location.id)) {
      // Remove location
      updateDraftCampaign({
        targetLocations: currentLocations.filter((loc: any) => loc.id !== location.id),
        targetLocationIds: draftCampaign.targetLocationIds.filter(id => id !== deviceId)
      })
      toast("Location Removed", { description: `${location.name} removed from campaign` }, "info")
    } else {
      // Add location
      updateDraftCampaign({
        targetLocations: [...currentLocations, asLocationCompatible(location)],
        targetLocationIds: [...draftCampaign.targetLocationIds, deviceId]
      })
      toast("Location Added", { description: `${location.name} added to campaign` }, "success")
    }
  }
  
  // Finalize the location selection and redirect to dashboard
  const handleFinishSelection = () => {
    if (!draftCampaign.targetLocations || draftCampaign.targetLocations.length === 0) {
      toast("No Locations Selected", { description: "Please select at least one location" }, "error")
      return
    }
    
    finishLocationSelection()
    toast("Locations Selected", { description: `${draftCampaign.targetLocations.length} locations added to campaign` }, "success")
    router.push("/dashboard")
  }

  // This will be true during initial load but once we've attempted to fetch and switched to mock data,
  // we won't keep showing a loading indicator indefinitely
  const isLoading = (storeLoading || contractLoading) && !hasFetched;
  
  // Handle manual refresh of locations
  const handleRefresh = async () => {
    setHasFetched(false);
    await fetchLocations();
  };
  
  return (
    <main className="min-h-screen bg-white">
      <div className="container mx-auto px-4 py-8">
        <div className="flex items-center mb-6">
          <Button 
            variant="outline" 
            className="mr-3 border-[2px] border-black rounded-none"
            onClick={() => router.push('/dashboard')}
          >
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back
          </Button>
          <h1 className="text-3xl font-black flex-grow">{isSelectingLocations ? "Select Locations" : "Browse Locations"}</h1>
          
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              className="border-[2px] border-black rounded-none"
              onClick={handleRefresh}
              disabled={contractLoading}
            >
              {contractLoading ? "Refreshing..." : "Refresh"}
            </Button>
            
            {isSelectingLocations && (
              <Button
                className="bg-[#0055FF] text-white border-[3px] border-black hover:bg-[#0044CC] font-bold"
                onClick={handleFinishSelection}
              >
                Done ({draftCampaign.targetLocations?.length || 0} selected)
              </Button>
            )}
          </div>
        </div>
        
        {locationError && !isLoading && fetchedLocations.length === 0 && (
          <div className="mb-4 p-3 bg-yellow-50 border border-yellow-200 rounded-md">
            <p className="text-sm text-yellow-800">
              {locationError.message} Please try again or contact support if the issue persists.
            </p>
          </div>
        )}
        
        {/* Search and filters */}
        <div className="mb-4 border-[4px] border-black bg-white p-4 flex flex-col gap-4 shadow-[6px_6px_0px_0px_rgba(0,0,0,1)]">
          <div className="flex flex-wrap gap-4 justify-between">
            <div className="relative flex-grow min-w-[200px] max-w-md">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500" />
              <Input
                placeholder="Search locations..."
                className="border-[2px] border-black rounded-none pl-10 py-1"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            
            <div className="flex gap-2">
              <Button
                variant="outline"
                className={`h-10 border-[2px] rounded-none ${
                  viewMode === "map" 
                    ? "bg-[#0055FF] text-white border-[#0055FF]" 
                    : "bg-white text-black border-black hover:bg-[#f5f5f5]"
                }`}
                onClick={() => setViewMode("map")}
              >
                <MapPin className="mr-1 h-4 w-4" />
                MAP
              </Button>
              
              <Button
                variant="outline"
                className={`h-10 border-[2px] rounded-none ${
                  viewMode === "list" 
                    ? "bg-[#0055FF] text-white border-[#0055FF]" 
                    : "bg-white text-black border-black hover:bg-[#f5f5f5]"
                }`}
                onClick={() => setViewMode("list")}
              >
                <Filter className="mr-1 h-4 w-4" />
                LIST
              </Button>
            </div>
          </div>
          
          <div className="flex gap-2 overflow-x-auto">
            {["all", "selected", "digital", "billboard"].map((type) => (
              <Button
                key={type}
                variant="outline"
                className={`h-10 border-[2px] rounded-none ${
                  filterType === type
                    ? "bg-[#0055FF] text-white border-[#0055FF]"
                    : "bg-white text-black border-black hover:bg-[#f5f5f5]"
                }`}
                onClick={() => setFilterType(type)}
              >
                {type.toUpperCase()}
              </Button>
            ))}
          </div>
        </div>
        
        <div className="grid grid-cols-1 gap-4">
          {/* Main content - either map or list */}
          <div className="border-[4px] border-black bg-white p-4 shadow-[6px_6px_0px_0px_rgba(0,0,0,1)]">
            {isLoading ? (
              <div className="h-[600px] w-full flex items-center justify-center">
                <div className="animate-spin h-10 w-10 border-4 border-[#0055FF] border-t-transparent rounded-full mr-3"></div>
                <p className="font-bold">Loading Locations...</p>
              </div>
            ) : fetchedLocations.length === 0 ? (
              <div className="h-[300px] flex flex-col items-center justify-center">
                <div className="text-3xl font-bold mb-4">No Locations Available</div>
                <p className="text-gray-500 mb-6">No location data could be found from the blockchain.</p>
                <Button 
                  onClick={handleRefresh}
                  className="bg-[#0055FF] text-white border-[3px] border-black hover:bg-[#0044CC]"
                >
                  Retry Loading Locations
                </Button>
              </div>
            ) : (
              <div>
                <h2 className="font-bold text-xl mb-4">
                  Available Locations ({filteredLocations.length})
                </h2>
                
                {viewMode === "map" ? (
                  <div className="h-[600px] w-full">
                    <CampaignLocationsMap
                      height="600px"
                      width="100%"
                      editable={isSelectingLocations}
                      showControls={true}
                      showStats={true}
                      showFilters={false}
                      passedLocations={fetchedLocations}
                    />
                  </div>
                ) : (
                  <LocationsList 
                    locations={filteredLocations}
                    isLocationSelected={isLocationSelected}
                    onLocationToggle={handleLocationToggle}
                  />
                )}
              </div>
            )}
          </div>
          
          {/* Selected locations summary */}
          {isSelectingLocations && draftCampaign.targetLocations && draftCampaign.targetLocations.length > 0 && (
            <div className="border-[4px] border-black bg-white p-4 shadow-[6px_6px_0px_0px_rgba(0,0,0,1)]">
              <h2 className="font-bold text-lg mb-4">Selected Locations ({draftCampaign.targetLocations.length})</h2>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                {draftCampaign.targetLocations.map((loc: any) => (
                  <div key={loc.id} className="border border-blue-500 bg-blue-50 p-3 rounded-md flex justify-between items-center">
                    <div>
                      <div className="font-semibold">{loc.name}</div>
                      <div className="text-xs text-gray-600">{loc.city || 'Unknown'}</div>
                    </div>
                    <Button 
                      size="sm" 
                      variant="ghost"
                      className="h-8 w-8 p-0 rounded-full hover:bg-blue-100"
                      onClick={() => handleLocationToggle(loc as LocationData)}
                    >
                      <CheckSquare className="h-4 w-4" />
                    </Button>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </main>
  )
}

