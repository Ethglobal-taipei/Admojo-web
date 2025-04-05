"use client"

import { useState, useEffect, useRef } from "react"
import { Search, Filter, MapPin, Plus, Minus, Layers, Check, Info, AlertCircle } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"
import { toast } from "@/lib/toast"
import { useLocationStore, Location } from "@/lib/store/useLocationStore"
import { useCampaignStore } from "@/lib/store/useCampaignStore"
import { useRouter } from "next/navigation"
import dynamic from "next/dynamic"
import { usePrivy } from "@privy-io/react-auth"
import type { LatLngBounds, Icon, DivIcon, IconOptions } from "leaflet"
import type { PrivyAuthData } from "@/lib/store/useCampaignStore"
import { useLocationData, LocationData } from "@/hooks/use-location-data"
// Import Leaflet CSS in a client component
const LeafletStyles = () => {
  return (
    <link
      rel="stylesheet"
      href="https://unpkg.com/leaflet@1.9.4/dist/leaflet.css"
      integrity="sha256-p4NxAoJBhIIN+hmNHrzRCf9tD/miZyoHS5obTRR9BMY="
      crossOrigin=""
    />
  )
}

// Dynamically import the Map components with no SSR
const MapContainer = dynamic(
  () => import("react-leaflet").then((mod) => mod.MapContainer),
  { ssr: false }
)

const TileLayer = dynamic(
  () => import("react-leaflet").then((mod) => mod.TileLayer),
  { ssr: false }
)

const Marker = dynamic(
  () => import("react-leaflet").then((mod) => mod.Marker),
  { ssr: false }
)

const Popup = dynamic(
  () => import("react-leaflet").then((mod) => mod.Popup),
  { ssr: false }
)

const ZoomControl = dynamic(
  () => import("react-leaflet").then((mod) => mod.ZoomControl),
  { ssr: false }
)

// We need to handle the useMap hook differently because it's not a component
// Instead, we'll create a component that uses it
const MapBoundsUpdater = dynamic(
  () => import('./map-bounds-updater').then(mod => mod.MapBoundsUpdater),
  { ssr: false }
)

// Create custom marker icon - this will be done on the client side
const createMarkerIcon = (selected: boolean, active: boolean): Icon<IconOptions> | undefined => {
  // This will only run on the client side where L is defined
  if (typeof window === "undefined") {
    return undefined;
  }
  
  try {
    return window.L?.icon({
      iconUrl: selected 
        ? "/marker-selected.svg" 
        : active 
          ? "/marker-active.svg" 
          : "/marker-inactive.svg",
      iconSize: [30, 30],
      iconAnchor: [15, 15],
      popupAnchor: [0, -15]
    });
  } catch (error) {
    console.error("Error creating map icon:", error);
    return undefined;
  }
};

interface CampaignLocationsMapProps {
  height?: string;
  width?: string;
  campaignId?: number;
  editable?: boolean;
  showControls?: boolean;
  showStats?: boolean;
  showFilters?: boolean;
  className?: string;
  passedLocations?: LocationData[];
}

export default function CampaignLocationsMap({
  height = "500px",
  width = "100%",
  campaignId,
  editable = false,
  showControls = true,
  showStats = true,
  showFilters = false,
  className = "",
  passedLocations
}: CampaignLocationsMapProps) {
  const router = useRouter()
  const [isMounted, setIsMounted] = useState(false)
  const [leafletLoaded, setLeafletLoaded] = useState(false)
  const { user, authenticated, ready } = usePrivy();
  const privyAuth: PrivyAuthData | null = user ? 
    { user, wallet: user.wallet, authenticated, ready } : null;

  // State management
  const [searchTerm, setSearchTerm] = useState("")
  const [filterType, setFilterType] = useState("all")
  const [hoveredLocation, setHoveredLocation] = useState<number | null>(null)
  
  // Get store data
  const locationStore = useLocationStore()
  
  // Get the latest location data from hooks
  const locationData = useLocationData()
  
  const { 
    draftCampaign, 
    campaigns,
    isSelectingLocations, 
    addLocationToCampaign,
    removeLocationFromCampaign
  } = useCampaignStore()
  
  // Determine which locations to display - prioritize passed locations, then hook data, then store data
  const locationsToUse = passedLocations || locationData.locations || locationStore.locations || [];
  
  // Determine which campaign data to use
  const currentCampaign = campaignId && typeof campaignId === 'number' && campaignId > 0
    ? campaigns.find(c => c.onChainId === campaignId || c.id === String(campaignId))
    : isSelectingLocations ? draftCampaign : null
  
  // Filter locations based on search and filters
  const filteredLocations = locationsToUse.filter(location => {
    // Search filter
    const matchesSearch = searchTerm === "" || 
      location.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (location.city && location.city.toLowerCase().includes(searchTerm.toLowerCase()));
    
    // Type filter
    const matchesType = filterType === "all" || 
      (filterType === "selected" && isLocationSelected(location.deviceId)) ||
      (location.displayType && location.displayType.toLowerCase().includes(filterType.toLowerCase()));
    
    return matchesSearch && matchesType;
  });
  
  // Check if a location is selected for the campaign
  function isLocationSelected(locationId: number | string): boolean {
    // Convert to number if possible
    const deviceId = typeof locationId === 'string' ? parseInt(locationId) : locationId;
    
    if (isSelectingLocations && draftCampaign) {
      return draftCampaign.targetLocationIds.includes(deviceId);
    } else if (currentCampaign) {
      return currentCampaign.targetLocationIds.includes(deviceId);
    }
    return locationStore.selectedLocationIds.includes(deviceId);
  }
  
  // Load locations on mount
  useEffect(() => {
    if (locationData.refresh && !passedLocations) {
      locationData.refresh();
    }
    setIsMounted(true);
    
    // Load Leaflet on client-side
    if (typeof window !== "undefined") {
      // Add Leaflet script if not already added
      const script = document.createElement('script');
      script.src = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.js';
      script.integrity = 'sha256-20nQCchB9co0qIjJZRGuk2/Z9VM+kNiyxNV1lvTlZBo=';
      script.crossOrigin = '';
      script.onload = () => {
        setLeafletLoaded(true);
      };
      
      document.head.appendChild(script);
    }
  }, [locationData.refresh, passedLocations]);
  
  // Location interactions
  const handleLocationClick = (locationId: number | string) => {
    if (editable && isSelectingLocations) {
      toggleLocationSelection(locationId);
    } else {
      router.push(`/locations/${locationId}`);
    }
  };
  
  // Toggle a location's selection status (when in selection mode)
  const toggleLocationSelection = async (locationId: number | string) => {
    if (!editable || !isSelectingLocations) return;
    
    // Convert to number if it's a string
    const deviceId = typeof locationId === 'string' ? parseInt(locationId) : locationId;
    
    // Find the location object
    const location = filteredLocations.find(loc => 
      loc.deviceId === deviceId || loc.id === String(deviceId)
    );
    
    if (!location) {
      console.error("Location not found:", locationId);
      return;
    }
    
    if (isLocationSelected(deviceId)) {
      // Remove from draft campaign
      const currentLocations = draftCampaign.targetLocations || [];
      const updatedLocations = currentLocations.filter(
        loc => loc.deviceId !== deviceId && loc.id !== String(deviceId)
      );
      const updatedLocationIds = draftCampaign.targetLocationIds.filter(
        id => id !== deviceId
      );
      
      useCampaignStore.getState().updateDraftCampaign({
        targetLocations: updatedLocations,
        targetLocationIds: updatedLocationIds,
      });
      
      toast("Location Removed", { description: `${location.name} removed from campaign` }, "info");
    } else {
      // Add to draft campaign
      const locationItem = {
        ...location,
        deviceId: deviceId,
      };
      
      useCampaignStore.getState().updateDraftCampaign({
        targetLocations: [...(draftCampaign.targetLocations || []), locationItem],
        targetLocationIds: [...draftCampaign.targetLocationIds, deviceId],
      });
      
      toast("Location Added", { description: `${location.name} added to campaign` }, "success");
    }
  };
  
  if (!isMounted) {
    return (
      <div 
        className={`bg-white border-[4px] border-black overflow-hidden ${className}`}
        style={{ height, width }}
      >
        <div className="flex items-center justify-center h-full">
          <div className="animate-spin h-8 w-8 border-4 border-[#0055FF] border-t-transparent rounded-full"></div>
        </div>
      </div>
    );
  }
  
  return (
    <div 
      className={`bg-white border-[4px] border-black overflow-hidden ${className}`}
      style={{ height, width }}
    >
      <LeafletStyles />

      {showFilters && (
        <div className="p-3 border-b-2 border-black flex flex-wrap justify-between items-center gap-2">
          <div className="relative flex-grow max-w-md">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500" />
            <Input
              placeholder="Search locations..."
              className="border-2 border-black rounded-none pl-10 h-9"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          
          <div className="flex space-x-2">
            {["all", "billboard", "digital"].map((type) => (
              <Button
                key={type}
                size="sm"
                variant="outline"
                className={`border-2 h-9 px-2 text-xs ${
                  filterType === type 
                    ? "bg-[#0055FF] text-white border-[#0055FF]" 
                    : "border-black text-black bg-white"
                }`}
                onClick={() => setFilterType(type)}
              >
                {type.toUpperCase()}
              </Button>
            ))}
          </div>
        </div>
      )}
      
      <div className="relative h-full">
        {!leafletLoaded ? (
          <div className="h-full flex items-center justify-center bg-white">
            <div className="flex flex-col items-center">
              <div className="animate-spin h-8 w-8 border-4 border-[#0055FF] border-t-transparent rounded-full"></div>
              <p className="mt-2 text-gray-600">Loading map...</p>
            </div>
          </div>
        ) : (
          <MapContainer
            center={[40.7128, -74.0060]} // Default to New York
            zoom={12}
            style={{ height: "100%", width: "100%" }}
            zoomControl={false}
          >
            <TileLayer
              url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
              attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
            />
            
            {showControls && <ZoomControl position="bottomright" />}
            
            {filteredLocations.map((location) => {
              // Skip locations without coordinates
              if (!location.coordinates || !location.coordinates.lat || !location.coordinates.lng) {
                return null;
              }
              
              const isSelected = isLocationSelected(location.deviceId);
              const isActive = location.isActive;
              
              return (
                <Marker
                  key={location.id}
                  position={[location.coordinates.lat, location.coordinates.lng]}
                  icon={createMarkerIcon(isSelected, isActive)}
                  eventHandlers={{
                    click: () => handleLocationClick(location.deviceId),
                    mouseover: () => setHoveredLocation(
                      typeof location.deviceId === 'string' 
                        ? parseInt(location.deviceId) 
                        : location.deviceId
                    ),
                    mouseout: () => setHoveredLocation(null),
                  }}
                >
                  <Popup>
                    <div className="min-w-[200px]">
                      <h4 className="font-bold text-base">{location.name}</h4>
                      <p>{location.city || "Unknown location"}</p>
                      {location.displayType && 
                        <span className="inline-block px-2 py-1 bg-gray-100 text-xs rounded mt-1">
                          {location.displayType}
                        </span>
                      }
                      {location.pricePerDay && 
                        <p className="text-sm mt-2">Price: {location.pricePerDay} ADC per day</p>
                      }
                      
                      {editable && isSelectingLocations && (
                        <Button
                          className={`w-full mt-2 text-sm border-2 font-bold ${
                            isSelected
                              ? "bg-red-500 text-white border-red-500 hover:bg-red-600"
                              : "bg-[#0055FF] text-white border-[#0055FF] hover:bg-[#0044CC]"
                          }`}
                          onClick={(e) => {
                            e.stopPropagation();
                            toggleLocationSelection(location.deviceId);
                          }}
                        >
                          {isSelected ? "Remove" : "Add to Campaign"}
                        </Button>
                      )}
                    </div>
                  </Popup>
                </Marker>
              );
            })}
            
            <MapBoundsUpdater locations={filteredLocations} />
          </MapContainer>
        )}
      </div>
      
      {/* Stats bar */}
      {showStats && (
        <div className="p-3 flex flex-wrap justify-between items-center text-sm gap-2">
          <div className="flex items-center gap-2">
            <Badge variant="outline" className="border-[2px] border-black font-bold">
              {filteredLocations.length} Locations
            </Badge>
            
            <Badge variant="outline" className="border-[2px] border-black font-bold bg-[#0055FF] text-white">
              {isSelectingLocations 
                ? draftCampaign.targetLocationIds.length 
                : currentCampaign?.targetLocationIds.length || 0} Selected
            </Badge>
          </div>
          
          {editable && isSelectingLocations && (
            <div className="flex items-center gap-2">
              <AlertCircle className="h-4 w-4 text-amber-500" />
              <span className="text-xs text-gray-600">
                Click on map markers to select locations for your campaign
              </span>
            </div>
          )}
        </div>
      )}
    </div>
  );
} 