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
import { LocationData } from "@/hooks/use-location-data"

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

interface CampaignLocationsMapStaticProps {
  height?: string;
  width?: string;
  campaignId: number;
  editable?: boolean;
  showControls?: boolean;
  showStats?: boolean;
  showFilters?: boolean;
  className?: string;
  locations: LocationData[] | Location[]; // Pass locations directly to avoid fetching
}

export default function CampaignLocationsMapStatic({
  height = "500px",
  width = "100%",
  campaignId,
  editable = false,
  showControls = true,
  showStats = true,
  showFilters = false,
  className = "",
  locations = [] // Default to empty array
}: CampaignLocationsMapStaticProps) {
  const router = useRouter()
  const [isMounted, setIsMounted] = useState(false)
  const [leafletLoaded, setLeafletLoaded] = useState(false)
  const { user, authenticated, ready } = usePrivy();
  const privyAuth = user ? 
    { 
      user: { id: user.id as string }, 
      wallet: { 
        address: user.wallet?.address as string, 
        provider: user.wallet?.provider
      }, 
      authenticated, 
      ready 
    } : null;

  // State management
  const [searchTerm, setSearchTerm] = useState("")
  const [filterType, setFilterType] = useState("all")
  const [hoveredLocation, setHoveredLocation] = useState<number | null>(null)
  
  // Get store data
  const { selectedLocationIds } = useLocationStore()
  
  const { 
    draftCampaign, 
    campaigns,
    isSelectingLocations, 
    addLocationToCampaign,
    removeLocationFromCampaign
  } = useCampaignStore()
  
  // Determine which locations to display
  const currentCampaign = campaignId 
    ? campaigns.find(c => c.id === String(campaignId)) 
    : isSelectingLocations ? draftCampaign : null
  
  // Filter locations based on search and filters
  const filteredLocations = locations.filter(location => {
    // Search filter
    const matchesSearch = searchTerm === "" || 
      location.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (location.city && location.city.toLowerCase().includes(searchTerm.toLowerCase()));
    
    // Type filter
    const matchesType = filterType === "all" || 
      (filterType === "selected" && isLocationSelected(Number(location.id))) ||
      (location.displayType && location.displayType.toLowerCase().includes(filterType.toLowerCase()));
    
    return matchesSearch && matchesType;
  });
  
  // Check if a location is selected for the campaign
  function isLocationSelected(locationId: number): boolean {
    if (isSelectingLocations && draftCampaign) {
      return draftCampaign.targetLocationIds.includes(locationId);
    } else if (currentCampaign) {
      return currentCampaign.targetLocationIds.includes(locationId);
    }
    return selectedLocationIds.includes(locationId);
  }
  
  // Initialize map on mount
  useEffect(() => {
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
  }, []);
  
  // Location interactions
  const handleLocationClick = (locationId: number) => {
    if (editable && isSelectingLocations) {
      toggleLocationSelection(locationId);
    } else {
      router.push(`/locations/${locationId}`);
    }
  };
  
  const toggleLocationSelection = (locationId: number) => {
    if (!privyAuth) return;
    
    const location = locations.find(loc => {
      // Handle both string and number IDs
      const locId = typeof loc.id === 'string' ? parseInt(loc.id) : loc.id;
      return locId === locationId;
    });
    
    if (!location) return;
    
    if (isLocationSelected(locationId)) {
      // Remove location
      if (isSelectingLocations) {
        if (campaignId && campaignId > 0) {
          removeLocationFromCampaign(campaignId, locationId, privyAuth);
        } else {
          // For draft campaign, use the store directly
          const { removeLocationFromDraftCampaign } = useCampaignStore.getState();
          removeLocationFromDraftCampaign(locationId);
        }
        toast("Location Removed", { description: `${location.name} removed from campaign` }, "success");
      }
    } else {
      // Add location
      if (isSelectingLocations) {
        if (campaignId && campaignId > 0) {
          addLocationToCampaign(campaignId, locationId, privyAuth);
        } else {
          // For draft campaign, use the store directly
          const { addLocationToDraftCampaign } = useCampaignStore.getState();
          addLocationToDraftCampaign(locationId);
        }
        toast("Location Added", { description: `${location.name} added to campaign` }, "success");
      }
    }
  };
  
  // Get default coordinates for map center (New York City as default)
  const getDefaultMapCenter = (): [number, number] => {
    // If we have locations with coordinates, center on first selected or first in list
    const locationsWithCoords = locations.filter(loc => 
      loc.coordinates && 
      typeof loc.coordinates.lat === 'number' && 
      typeof loc.coordinates.lng === 'number'
    );
    
    if (locationsWithCoords.length > 0) {
      const selectedLoc = locationsWithCoords.find(loc => {
        const locId = typeof loc.id === 'string' ? parseInt(loc.id) : loc.id;
        return isLocationSelected(locId);
      });
      const centerLoc = selectedLoc || locationsWithCoords[0];
      
      if (centerLoc.coordinates && 
          typeof centerLoc.coordinates.lat === 'number' && 
          typeof centerLoc.coordinates.lng === 'number') {
        return [centerLoc.coordinates.lat, centerLoc.coordinates.lng];
      }
    }
    
    // Default to New York City
    return [40.7128, -74.0060];
  };
  
  // Prepare for render - we need client-side rendering for Leaflet
  if (!isMounted || !leafletLoaded) {
    return (
      <div 
        className={`border-[4px] border-black bg-white shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] ${className}`} 
        style={{ height, width }}
      >
        <div className="h-full w-full flex items-center justify-center">
          <div className="animate-spin h-10 w-10 border-4 border-[#0055FF] border-t-transparent rounded-full"></div>
          <p className="font-bold">Loading Map...</p>
        </div>
      </div>
    );
  }

  // Render the map
  return (
    <div 
      className={`border-[4px] border-black bg-white shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] ${className}`} 
      style={{ height, width }}
    >
      <LeafletStyles />
      
      {/* Map Controls and Filters */}
      {showControls && (
        <div className="bg-white border-b-[4px] border-black p-3 flex items-center justify-between flex-wrap gap-2">
          {showFilters && (
            <>
              <div className="relative w-full sm:w-auto flex-grow">
                <Search className="absolute left-3 top-[14px] w-4 h-4" />
                <Input
                  placeholder="Search locations..."
                  className="pl-10 border-[2px] border-black rounded-none h-10"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>
              
              <div className="flex gap-2 overflow-x-auto">
                {["all", "selected", "billboard", "digital"].map((type) => (
                  <Button
                    key={type}
                    variant="outline"
                    className={`h-10 border-[2px] rounded-none whitespace-nowrap ${
                      filterType === type
                        ? "bg-black text-white border-black"
                        : "border-black"
                    }`}
                    onClick={() => setFilterType(type)}
                  >
                    {type === "all" ? "All" : type === "selected" ? "Selected" : type}
                  </Button>
                ))}
              </div>
            </>
          )}
          
          {!showFilters && (
            <div className="font-bold">
              <Badge variant="outline" className="border-[2px] border-black">
                {filteredLocations.length} locations
              </Badge>
            </div>
          )}
          
          {showStats && (
            <div className="flex gap-2">
              <Badge variant="outline" className="border-[2px] border-black">
                {filteredLocations.filter(loc => isLocationSelected(Number(loc.id))).length} selected
              </Badge>
            </div>
          )}
        </div>
      )}
      
      {/* The Map */}
      <div className="relative w-full h-[calc(100%-56px)]">
        <MapContainer
          center={getDefaultMapCenter()}
          zoom={11}
          style={{ height: "100%", width: "100%" }}
          zoomControl={false}
        >
          <TileLayer
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          />
          <ZoomControl position="bottomright" />
          
          {/* Map Markers */}
          {filteredLocations.map((location) => {
            // Get marker properties
            const isSelected = isLocationSelected(Number(location.id));
            const isActive = location.isActive || false;
            const markerIcon = createMarkerIcon(isSelected, isActive);
            const isHovered = hoveredLocation === Number(location.id);
            
            // Make sure we have coordinates
            if (!location.coordinates || !location.coordinates.lat || !location.coordinates.lng) {
              return null;
            }
            
            return (
              <Marker 
                key={location.id}
                position={[location.coordinates.lat, location.coordinates.lng]}
                icon={markerIcon}
                eventHandlers={{
                  click: () => handleLocationClick(Number(location.id)),
                  mouseover: () => setHoveredLocation(Number(location.id)),
                  mouseout: () => setHoveredLocation(null),
                }}
              >
                {/* Enhanced Popup */}
                <Popup closeButton={false} className="custom-popup">
                  <div className="p-1">
                    <h3 className="font-bold text-sm">{location.name}</h3>
                    <div className="text-xs mt-1">{location.city}</div>
                    <div className="flex items-center gap-1 mt-1">
                      <Badge variant="outline" className="text-xs px-1 py-0 h-5 border rounded-sm">
                        {location.displayType || "Display"}
                      </Badge>
                      <Badge variant={isActive ? "default" : "secondary"} className="text-xs px-1 py-0 h-5 rounded-sm">
                        {isActive ? "Active" : "Inactive"}
                      </Badge>
                    </div>
                    {editable && isSelectingLocations && (
                      <Button
                        variant={isSelected ? "destructive" : "default"}
                        size="sm"
                        className="w-full mt-2 h-7 text-xs"
                        onClick={(e) => {
                          e.stopPropagation();
                          toggleLocationSelection(Number(location.id));
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
          
          {/* Bounds updater to fit all markers */}
          {filteredLocations.length > 0 && (
            <MapBoundsUpdater 
              locations={filteredLocations
                .filter(loc => loc.coordinates && loc.coordinates.lat && loc.coordinates.lng)
                .map(loc => ({ 
                  lat: loc.coordinates!.lat, 
                  lng: loc.coordinates!.lng 
                }))} 
            />
          )}
        </MapContainer>
        
        {/* Zoom Buttons - Custom controls for better styling */}
        <div className="absolute right-3 bottom-20 flex flex-col z-[1000]">
          <Button
            variant="default"
            size="sm"
            className="mb-1 w-8 h-8 p-0 rounded-sm border-[2px] border-black"
            onClick={() => {
              if (typeof window !== "undefined" && window.L) {
                const map = window.L.DomUtil.get('map');
                if (map && map._leaflet_id) {
                  map.zoomIn();
                }
              }
            }}
          >
            <Plus className="w-4 h-4" />
          </Button>
          <Button
            variant="default"
            size="sm"
            className="w-8 h-8 p-0 rounded-sm border-[2px] border-black"
            onClick={() => {
              if (typeof window !== "undefined" && window.L) {
                const map = window.L.DomUtil.get('map');
                if (map && map._leaflet_id) {
                  map.zoomOut();
                }
              }
            }}
          >
            <Minus className="w-4 h-4" />
          </Button>
        </div>
        
        {/* Legend */}
        <div className="absolute left-3 bottom-3 bg-white p-2 rounded-sm border-[2px] border-black z-[1000]">
          <div className="text-xs font-bold mb-1">Map Legend</div>
          <div className="flex items-center text-xs mb-1">
            <div className="w-3 h-3 bg-blue-500 rounded-full mr-1"></div>
            Available Locations
          </div>
          <div className="flex items-center text-xs mb-1">
            <div className="w-3 h-3 bg-green-500 rounded-full mr-1"></div>
            Selected Locations
          </div>
          <div className="flex items-center text-xs">
            <div className="w-3 h-3 bg-gray-400 rounded-full mr-1"></div>
            Inactive Locations
          </div>
        </div>
      </div>
    </div>
  );
} 