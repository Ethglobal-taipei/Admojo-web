"use client"

import { useState, useEffect, useRef, useCallback } from "react"
import { Filter, ChevronDown, Plus, Minus, MapPin } from "lucide-react"
import { Button } from "@/components/ui/button"
import dynamic from "next/dynamic"
import type { Icon, IconOptions } from "leaflet"
import { toast } from "sonner"
import { useRouter } from "next/navigation"
import { useBlockchainService, useBoothRegistry, usePerformanceOracle } from "@/hooks"
import { Booth, BoothStatus } from "@/lib/blockchain"
import { createPortal } from "react-dom"

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

// Create active display marker icon
const createActiveMarkerIcon = (allocation: number, isAnimating?: boolean): Icon<IconOptions> | undefined => {
  if (typeof window === "undefined") {
    return undefined;
  }
  
  try {
    // Different sizes based on allocation amount
    const size = allocation > 900 ? 36 : allocation > 600 ? 32 : allocation > 300 ? 28 : 24;
    
    // Apply the animation effect if needed
    const pulseEffect = isAnimating ? "marker-active-pulse.svg" : "marker-active.svg";
    
    return window.L?.icon({
      iconUrl: `/${pulseEffect}`,
      iconSize: [size, size],
      iconAnchor: [size/2, size/2],
      popupAnchor: [0, -size/2]
    });
  } catch (error) {
    console.error("Error creating active marker icon:", error);
    return undefined;
  }
};

// Create inactive display marker icon
const createInactiveMarkerIcon = (isAnimating?: boolean): Icon<IconOptions> | undefined => {
  if (typeof window === "undefined") {
    return undefined;
  }
  
  try {
    // Apply the animation effect if needed
    const pulseEffect = isAnimating ? "marker-inactive-pulse.svg" : "marker-inactive.svg";
    
    return window.L?.icon({
      iconUrl: `/${pulseEffect}`,
      iconSize: [24, 24],
      iconAnchor: [12, 12],
      popupAnchor: [0, -12]
    });
  } catch (error) {
    console.error("Error creating inactive marker icon:", error);
    return undefined;
  }
};

// Define DisplayLocation interface to replace the imported one
interface DisplayLocation {
  id: number;
  deviceId: number;
  name: string;
  location: string;
  displaySize: string;
  additionalInfo?: string;
  lat: number;
  lng: number;
  status: 'active' | 'inactive' | 'maintenance';
  views: number;
  taps: number;
  type: string;
  performance: 'high' | 'medium' | 'low';
  isAnimating?: boolean;
}

// At the top of your component file, add this interface
interface EnhancedDisplayLocation extends DisplayLocation {
  allocation: number;
  impressions: number;
  cpi: number;
  isAnimating?: boolean;
  locationId?: number;
}

export default function DisplayMap() {
  const [isMounted, setIsMounted] = useState(false)
  const [selectedDisplay, setSelectedDisplay] = useState<number | null>(null)
  const [filters, setFilters] = useState({
    performance: "all",
    locationType: "all",
    allocation: "all",
  })
  const [isFilterOpen, setIsFilterOpen] = useState(false)
  const [isAllocationModalOpen, setIsAllocationModalOpen] = useState(false)
  const [currentDisplayId, setCurrentDisplayId] = useState<number | null>(null)
  const [allocationAmount, setAllocationAmount] = useState(100)
  const router = useRouter()
  const [leafletLoaded, setLeafletLoaded] = useState(false)
  const modalRef = useRef<HTMLDivElement>(null)
  const filterRef = useRef<HTMLDivElement>(null)
  const hasDataBeenFetchedRef = useRef(false)

  // Use data from blockchain services using the new hooks
  const { service } = useBlockchainService()
  const { getAllBooths, activateBooth, deactivateBooth } = useBoothRegistry()
  const { getDailyMetrics } = usePerformanceOracle()
  
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [localDisplayLocations, setLocalDisplayLocations] = useState<EnhancedDisplayLocation[]>([])
  
  // Fetch booth data
  useEffect(() => {
    if (service && !hasDataBeenFetchedRef.current) {
      fetchBoothData();
      hasDataBeenFetchedRef.current = true;
    }
  }, [service]);
  
  // Define fetchBoothData with useCallback to stabilize it
  const fetchBoothData = useCallback(async () => {
    try {
      setIsLoading(true);
      
      if (!service) {
        throw new Error("Blockchain service not initialized");
      }
      
      // Get all booths
      const booths = await getAllBooths();
      
      if (!booths || booths.length === 0) {
        setLocalDisplayLocations([]);
        setIsLoading(false);
        return;
      }
      
      // Transform booth details to display locations
      const locations: EnhancedDisplayLocation[] = booths.map((booth, index) => {
        // Map BoothStatus to UI status
        let status: 'active' | 'inactive' | 'maintenance';
        if (!booth.active) {
          status = 'inactive';
        } else if (booth.status === BoothStatus.UnderMaintenance) {
          status = 'maintenance';
        } else {
          status = 'active';
        }
        
        // Extract lat/lng from metadata or use defaults
        const lat = parseFloat(booth.metadata.additionalInfo?.split('lat:')[1]?.split(',')[0] || '40.7');
        const lng = parseFloat(booth.metadata.additionalInfo?.split('lng:')[1]?.split(',')[0] || '-74.0');
        
        // Generate random metrics for demo purposes
        // In a real implementation, you would fetch these from the blockchain
        const views = Math.floor(Math.random() * 1000);
        const taps = Math.floor(Math.random() * 200);
        
        // Determine performance rating based on tap-through rate (taps/views)
        let performance: 'high' | 'medium' | 'low';
        const tapRate = views > 0 ? taps / views : 0;
        
        if (tapRate > 0.05) performance = 'high';
        else if (tapRate > 0.02) performance = 'medium';
        else performance = 'low';
        
        return {
          id: booth.deviceId,
          deviceId: booth.deviceId,
          name: `Booth #${booth.deviceId}`,
          location: booth.metadata.location || 'Unknown',
          displaySize: booth.metadata.displaySize || 'Medium',
          additionalInfo: booth.metadata.additionalInfo,
          lat,
          lng,
          status,
          views,
          taps,
          type: booth.metadata.displaySize === 'Large' ? 'billboard' : 
                booth.metadata.displaySize === 'Medium' ? 'transit' : 'street',
          performance,
          isAnimating: false,
          // Demo values
          allocation: Math.floor(Math.random() * 1000),
          impressions: views,
          cpi: 0.05,
          locationId: booth.deviceId
        };
      });
      
      setLocalDisplayLocations(locations);
      setIsLoading(false);
    } catch (err: any) {
      console.error("Error fetching booth data:", err);
      setError(err.message || "Failed to fetch booth data");
      setIsLoading(false);
    }
  }, [service]); // Only depend on service

  // Mount detection for client-side only features
  useEffect(() => {
    setIsMounted(true)
    
    // Check if Leaflet is loaded
    if (typeof window !== "undefined" && window.L) {
      setLeafletLoaded(true)
    }

    return () => {
      setIsMounted(false)
    }
  }, [])

  // Focus trap for modal
  useEffect(() => {
    if (isAllocationModalOpen && modalRef.current) {
      modalRef.current.focus()
      
      const handleKeyDown = (e: KeyboardEvent) => {
        // Close on escape key
        if (e.key === 'Escape') {
          setIsAllocationModalOpen(false)
        }
      }
      
      window.addEventListener('keydown', handleKeyDown)
      return () => window.removeEventListener('keydown', handleKeyDown)
    }
  }, [isAllocationModalOpen])

  // Handle filter dropdown outside clicks
  useEffect(() => {
    if (isFilterOpen && filterRef.current) {
      const handleClickOutside = (event: MouseEvent) => {
        if (filterRef.current && !filterRef.current.contains(event.target as Node)) {
          setIsFilterOpen(false)
        }
      }
      
      document.addEventListener('mousedown', handleClickOutside)
      return () => document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [isFilterOpen])

  // Filter dropdown position state
  const [filterButtonRect, setFilterButtonRect] = useState<DOMRect | null>(null)
  const filterButtonRef = useRef<HTMLButtonElement>(null)
  
  // Update filter button position when filter opens
  useEffect(() => {
    if (isFilterOpen && filterButtonRef.current) {
      setFilterButtonRect(filterButtonRef.current.getBoundingClientRect())
    }
  }, [isFilterOpen])

  // Apply filters to the display locations
  const filteredLocations = localDisplayLocations.filter((location) => {
    // Skip filtering if all filters are set to "all"
    if (filters.performance === "all" && filters.locationType === "all" && filters.allocation === "all") {
      return true
    }

    // Performance filter
    if (filters.performance !== "all" && location.performance !== filters.performance) {
      return false
    }

    // Location type filter
    if (filters.locationType !== "all" && location.type !== filters.locationType) {
      return false
    }

    // Allocation filter
    if (filters.allocation !== "all") {
      if (filters.allocation === "high" && location.allocation < 800) {
        return false
      } else if (filters.allocation === "medium" && (location.allocation < 400 || location.allocation >= 800)) {
        return false
      } else if (filters.allocation === "low" && location.allocation >= 400) {
        return false
      }
    }

    return true
  })

  const handleDisplayClick = (displayId: number) => {
    // Toggle selection
    if (selectedDisplay === displayId) {
      setSelectedDisplay(null)
    } else {
      setSelectedDisplay(displayId)

      // Mark the selected location as animating for visual effect
      setLocalDisplayLocations((prev) =>
        prev.map((loc) => ({
          ...loc,
          isAnimating: loc.id === displayId,
        }))
      )

      // After 2 seconds, turn off the animation
      setTimeout(() => {
        setLocalDisplayLocations((prev) =>
          prev.map((loc) => ({
            ...loc,
            isAnimating: false,
          }))
        )
      }, 2000)
    }
  }

  const handleFilterChange = (filterType: string, value: string) => {
    setFilters((prev) => ({
      ...prev,
      [filterType]: value,
    }))
  }

  const handleAllocateMore = (displayId: number) => {
    setCurrentDisplayId(displayId)
    setAllocationAmount(100) // Default allocation amount
    setIsAllocationModalOpen(true)
  }

  const handleConfirmAllocation = async () => {
    if (!currentDisplayId) return

    try {
      toast.loading('Processing blockchain transaction...')
      
      // Find the current display location
      const currentDisplay = localDisplayLocations.find(loc => loc.id === currentDisplayId)
      
      if (!currentDisplay || !service) {
        toast.error('Failed to allocate funds. Display or contract not found.')
        setIsAllocationModalOpen(false)
        return
      }
      
      const locationId = currentDisplay.locationId
      
      if (!locationId) {
        toast.error('Location ID not found')
        setIsAllocationModalOpen(false)
        return
      }
      
      // In a real implementation, we would call the smart contract
      // Since we're simulating, update the local state to reflect changes
      
      // Wait simulating blockchain transaction time
      await new Promise(resolve => setTimeout(resolve, 1500))
      
      // Update local display state
      setLocalDisplayLocations((prev) =>
        prev.map((loc) => {
          if (loc.id === currentDisplayId) {
            return {
              ...loc,
              allocation: loc.allocation + allocationAmount,
              status: 'active', // Ensure the display is marked active
              isAnimating: true, // Animate to show the change
            }
          }
          return loc
        })
      )
      
      toast.success(`Successfully allocated ${allocationAmount} ADC to ${currentDisplay.name}`)
      
      // Turn off animation after a delay
      setTimeout(() => {
        setLocalDisplayLocations((prev) =>
          prev.map((loc) => ({
            ...loc,
            isAnimating: false,
          }))
        )
      }, 2000)
    } catch (error) {
      console.error('Error allocating funds:', error)
      toast.error('Failed to allocate funds. Please try again.')
    } finally {
      setIsAllocationModalOpen(false)
    }
  }

  const handleReduceBudget = (displayId: number) => {
    try {
      // Show loading toast
      toast.loading('Processing budget reduction...')
      
      // Update local display state
      setLocalDisplayLocations((prev) =>
        prev.map((loc) => {
          if (loc.id === displayId) {
            // Reduce by a percentage
            const reductionAmount = Math.round(loc.allocation * 0.1) // 10% reduction
            const newAllocation = Math.max(0, loc.allocation - reductionAmount)
            
            return {
              ...loc,
              allocation: newAllocation,
              status: newAllocation > 0 ? 'active' : 'inactive', // Update status if needed
              isAnimating: true,
            }
          }
          return loc
        })
      )
      
      // Show success message
      setTimeout(() => {
        toast.success('Budget successfully reduced')
        
        // Turn off animation after a delay
        setLocalDisplayLocations((prev) =>
          prev.map((loc) => ({
            ...loc,
            isAnimating: false,
          }))
        )
      }, 1500)
    } catch (error) {
      console.error('Error reducing budget:', error)
      toast.error('Failed to reduce budget. Please try again.')
    }
  }

  const handleActivateDisplay = (displayId: number) => {
    try {
      toast.loading('Activating display...')
      
      // Find the current display location
      const currentDisplay = localDisplayLocations.find(loc => loc.id === displayId)
      
      if (!currentDisplay) {
        toast.error('Display not found')
        return
      }
      
      // Update local state
      setLocalDisplayLocations((prev) =>
        prev.map((loc) => {
          if (loc.id === displayId) {
            return {
              ...loc,
              allocation: 100, // Provide a small initial allocation
              status: 'active',
              isAnimating: true,
            }
          }
          return loc
        })
      )
      
      // Show success message
      setTimeout(() => {
        toast.success(`${currentDisplay.name} activated successfully`)
        
        // Turn off animation after a delay
        setLocalDisplayLocations((prev) =>
          prev.map((loc) => ({
            ...loc,
            isAnimating: false,
          }))
        )
      }, 1500)
    } catch (error) {
      console.error('Error activating display:', error)
      toast.error('Failed to activate display. Please try again.')
    }
  }
  
  const handleAddToCampaign = () => {
    if (!selectedDisplay) {
      toast.error('Please select a display first')
      return
    }
    
    // In a real implementation, we would navigate to the campaign page
    // and add the selected display to the campaign
    toast.success('Selected display added to your campaign')
    
    // Clear selection
    setSelectedDisplay(null)
  }
  
  // Render loading state
  if (isLoading) {
    return (
      <div className="border-[6px] border-black bg-white p-6 aspect-[16/9] flex items-center justify-center">
        <div className="flex flex-col items-center">
          <div className="w-12 h-12 border-4 border-black border-t-[#0055FF] rounded-full animate-spin mb-4"></div>
          <div className="font-bold">Loading display data from blockchain...</div>
        </div>
      </div>
    )
  }
  
  // Render error state
  if (error) {
    return (
      <div className="border-[6px] border-black bg-[#FF3366] text-white p-6">
        <h3 className="font-bold mb-2">Error Loading Map Data</h3>
        <p className="mb-4">{error}</p>
        <Button 
          onClick={() => {
            // Implement refresh logic
          }}
          className="bg-white text-black border-[3px] border-black hover:bg-[#f5f5f5] transition-all font-bold px-4 py-2 h-auto rounded-none hover:-translate-y-1"
        >
          Try Again
        </Button>
      </div>
    )
  }

  // Placeholder for server-side rendering
  if (!isMounted) {
    return (
      <div className="border-[6px] border-black bg-white p-6 aspect-[16/9] flex items-center justify-center">
        <div className="text-lg font-bold">Loading map...</div>
      </div>
    )
  }

  return (
    <div className="border-[6px] border-black bg-white shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] hover:shadow-[12px_12px_0px_0px_rgba(0,0,0,1)] transition-all duration-300">
      <div className="p-4 border-b-[4px] border-black flex justify-between items-center">
        <h2 className="text-xl font-black">Active Displays Map</h2>

        <div className="relative">
          <Button
            ref={filterButtonRef}
            variant="outline"
            className="border-[4px] border-black rounded-none bg-white hover:bg-[#f5f5f5] transition-all font-bold px-4 py-2 h-auto flex items-center gap-2 hover:-translate-y-1 hover:shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]"
            onClick={() => setIsFilterOpen(!isFilterOpen)}
            aria-expanded={isFilterOpen}
            aria-controls="filter-dropdown"
          >
            <Filter className="w-5 h-5" />
            <span>FILTER</span>
            <ChevronDown className={`w-5 h-5 transition-transform ${isFilterOpen ? "rotate-180" : ""}`} />
          </Button>

          {/* Render filter dropdown with portal */}
          {isFilterOpen && isMounted && filterButtonRect && createPortal(
            <div 
              id="filter-dropdown"
              ref={filterRef}
              style={{
                position: 'absolute',
                top: `${filterButtonRect.bottom + window.scrollY + 8}px`,
                right: `${window.innerWidth - filterButtonRect.right}px`,
              }}
              className="w-64 bg-white border-[4px] border-black shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] z-[5000]"
            >
              <div className="p-4">
                <div className="flex justify-between items-center mb-2">
                  <h3 className="font-bold">Filter Options</h3>
                  <button 
                    onClick={() => setIsFilterOpen(false)}
                    className="text-black hover:text-gray-700 text-sm"
                    aria-label="Close filter menu"
                  >
                    ✕
                  </button>
                </div>
                
                <div className="mb-4">
                  <h3 className="font-bold mb-2">Performance</h3>
                  <div className="grid grid-cols-2 gap-2">
                    {["all", "high", "medium", "low"].map((option) => (
                      <button
                        key={option}
                        className={`border-[2px] border-black px-2 py-1 font-bold text-xs transition-all hover:-translate-y-1 ${
                          filters.performance === option
                            ? "bg-[#0055FF] text-white"
                            : "bg-white hover:bg-[#f5f5f5]"
                        }`}
                        onClick={() => handleFilterChange("performance", option)}
                      >
                        {option === "all" ? "ALL" : option.toUpperCase()}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="mb-4">
                  <h3 className="font-bold mb-2">Location Type</h3>
                  <div className="grid grid-cols-2 gap-2">
                    {["all", "urban", "suburban", "rural"].map((option) => (
                      <button
                        key={option}
                        className={`border-[2px] border-black px-2 py-1 font-bold text-xs transition-all hover:-translate-y-1 ${
                          filters.locationType === option
                            ? "bg-[#0055FF] text-white"
                            : "bg-white hover:bg-[#f5f5f5]"
                        }`}
                        onClick={() => handleFilterChange("locationType", option)}
                      >
                        {option === "all" ? "ALL" : option.toUpperCase()}
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <h3 className="font-bold mb-2">Allocation</h3>
                  <div className="grid grid-cols-2 gap-2">
                    {["all", "high", "medium", "low"].map((option) => (
                      <button
                        key={option}
                        className={`border-[2px] border-black px-2 py-1 font-bold text-xs transition-all hover:-translate-y-1 ${
                          filters.allocation === option
                            ? "bg-[#0055FF] text-white"
                            : "bg-white hover:bg-[#f5f5f5]"
                        }`}
                        onClick={() => handleFilterChange("allocation", option)}
                      >
                        {option === "all"
                          ? "ALL"
                          : option === "high"
                          ? "HIGH (800+)"
                          : option === "medium"
                          ? "MEDIUM (400-800)"
                          : "LOW (<400)"}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            </div>,
            document.body
          )}
        </div>
      </div>

      <div className="relative aspect-[16/9]">
        <LeafletStyles />
        
        {/* Loading Indicator for Leaflet */}
        {!leafletLoaded && (
          <div className="absolute inset-0 bg-white flex items-center justify-center z-10">
            <div className="w-12 h-12 border-4 border-black border-t-[#0055FF] rounded-full animate-spin"></div>
          </div>
        )}

        {typeof window !== "undefined" && (
          <MapContainer
            center={[39.8283, -98.5795]} // Center of the US
            zoom={4}
            style={{ height: "100%", width: "100%" }}
            zoomControl={false}
          >
            <TileLayer
              attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
              url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            />
            <ZoomControl position="bottomright" />

            {/* Display Markers */}
            {filteredLocations.map((location) => {
              const markerIcon =
                location.status === "active"
                  ? createActiveMarkerIcon(location.allocation, location.isAnimating)
                  : createInactiveMarkerIcon(location.isAnimating)

              return (
                <Marker
                  key={location.id}
                  position={[location.lat, location.lng]}
                  icon={markerIcon}
                  eventHandlers={{
                    click: () => handleDisplayClick(location.id),
                  }}
                >
                  <Popup>
                    <div className="font-bold text-lg mb-2">{location.name}</div>
                    <div className="grid grid-cols-2 gap-x-4 gap-y-2 mb-4 text-sm">
                      <div>
                        <span className="font-bold">Status:</span>{" "}
                        <span
                          className={`${
                            location.status === "active" ? "text-green-600" : "text-gray-500"
                          } font-medium`}
                        >
                          {location.status === "active" ? "Active" : "Inactive"}
                        </span>
                      </div>
                      <div>
                        <span className="font-bold">Type:</span>{" "}
                        <span className="capitalize">{location.type}</span>
                      </div>
                      <div>
                        <span className="font-bold">Allocation:</span>{" "}
                        <span>{location.allocation > 0 ? `${location.allocation} ADC` : "None"}</span>
                      </div>
                      <div>
                        <span className="font-bold">Impressions:</span>{" "}
                        <span>{location.impressions > 0 ? location.impressions.toLocaleString() : "None"}</span>
                      </div>
                      <div>
                        <span className="font-bold">CPI:</span>{" "}
                        <span>{location.cpi > 0 ? location.cpi.toFixed(4) : "N/A"}</span>
                      </div>
                      <div>
                        <span className="font-bold">Performance:</span>{" "}
                        <span className="capitalize">{location.performance}</span>
                      </div>
                    </div>

                    <div className="flex flex-col gap-2">
                      {location.status === "active" ? (
                        <>
                          <Button
                            onClick={() => handleAllocateMore(location.id)}
                            className="bg-[#0055FF] text-white border-[2px] border-black hover:bg-[#FFCC00] hover:text-black transition-all font-bold text-sm px-2 py-1 h-auto rounded-none w-full hover:-translate-y-1"
                          >
                            <Plus className="w-4 h-4 mr-1" />
                            Add Budget
                          </Button>
                          <Button
                            onClick={() => handleReduceBudget(location.id)}
                            className="bg-white text-black border-[2px] border-black hover:bg-[#f5f5f5] transition-all font-bold text-sm px-2 py-1 h-auto rounded-none w-full hover:-translate-y-1"
                          >
                            <Minus className="w-4 h-4 mr-1" />
                            Reduce Budget
                          </Button>
                        </>
                      ) : (
                        <Button
                          onClick={() => handleActivateDisplay(location.id)}
                          className="bg-[#0055FF] text-white border-[2px] border-black hover:bg-[#FFCC00] hover:text-black transition-all font-bold text-sm px-2 py-1 h-auto rounded-none w-full hover:-translate-y-1"
                        >
                          Activate Display
                        </Button>
                      )}
                    </div>
                  </Popup>
                </Marker>
              )
            })}
          </MapContainer>
        )}

        {/* Selected Display Sidebar */}
        {selectedDisplay && isMounted && createPortal(
          <div className="fixed z-[5000]" style={{ top: '4rem', left: '4rem' }}>
            <div className="w-72 bg-white border-[4px] border-black shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] p-4">
              {/* Find the selected location */}
              {(() => {
                const location = localDisplayLocations.find((loc) => loc.id === selectedDisplay)
                if (!location) return null

                return (
                  <>
                    <div className="flex justify-between items-center mb-4">
                      <h3 className="font-bold">{location.name}</h3>
                      <button
                        className="text-gray-500 hover:text-black"
                        onClick={() => setSelectedDisplay(null)}
                        aria-label="Close sidebar"
                      >
                        ✕
                      </button>
                    </div>

                    <div className="grid grid-cols-2 gap-x-4 gap-y-2 mb-4 text-sm">
                      <div>
                        <span className="font-bold">Status:</span>{" "}
                        <span
                          className={`${
                            location.status === "active" ? "text-green-600" : "text-gray-500"
                          } font-medium`}
                        >
                          {location.status === "active" ? "Active" : "Inactive"}
                        </span>
                      </div>
                      <div>
                        <span className="font-bold">Type:</span>{" "}
                        <span className="capitalize">{location.type}</span>
                      </div>
                      <div>
                        <span className="font-bold">Allocation:</span>{" "}
                        <span>{location.allocation > 0 ? `${location.allocation} ADC` : "None"}</span>
                      </div>
                      <div>
                        <span className="font-bold">Impressions:</span>{" "}
                        <span>{location.impressions > 0 ? location.impressions.toLocaleString() : "None"}</span>
                      </div>
                      <div>
                        <span className="font-bold">CPI:</span>{" "}
                        <span>{location.cpi > 0 ? location.cpi.toFixed(4) : "N/A"}</span>
                      </div>
                      <div>
                        <span className="font-bold">Performance:</span>{" "}
                        <span className="capitalize">{location.performance}</span>
                      </div>
                    </div>

                    <div className="flex flex-col gap-2">
                      <Button
                        onClick={handleAddToCampaign}
                        className="bg-[#FF3366] text-white border-[2px] border-black hover:bg-[#FFCC00] hover:text-black transition-all font-bold text-sm px-2 py-1 h-auto rounded-none w-full hover:-translate-y-1"
                      >
                        Add to Campaign
                      </Button>
                      {location.status === "active" ? (
                        <>
                          <Button
                            onClick={() => handleAllocateMore(location.id)}
                            className="bg-[#0055FF] text-white border-[2px] border-black hover:bg-[#FFCC00] hover:text-black transition-all font-bold text-sm px-2 py-1 h-auto rounded-none w-full hover:-translate-y-1"
                          >
                            <Plus className="w-4 h-4 mr-1" />
                            Add Budget
                          </Button>
                          <Button
                            onClick={() => handleReduceBudget(location.id)}
                            className="bg-white text-black border-[2px] border-black hover:bg-[#f5f5f5] transition-all font-bold text-sm px-2 py-1 h-auto rounded-none w-full hover:-translate-y-1"
                          >
                            <Minus className="w-4 h-4 mr-1" />
                            Reduce Budget
                          </Button>
                        </>
                      ) : (
                        <Button
                          onClick={() => handleActivateDisplay(location.id)}
                          className="bg-[#0055FF] text-white border-[2px] border-black hover:bg-[#FFCC00] hover:text-black transition-all font-bold text-sm px-2 py-1 h-auto rounded-none w-full hover:-translate-y-1"
                        >
                          Activate Display
                        </Button>
                      )}
                    </div>
                  </>
                )
              })()}
            </div>
          </div>,
          document.body
        )}
      </div>

      {/* Statistics Ribbon */}
      <div className="grid grid-cols-4 text-sm">
        <div className="p-3 border-t-[4px] border-r-[2px] border-black bg-[#f5f5f5] flex items-center justify-center">
          <span className="font-bold mr-2">Total Displays:</span>
          <span>{localDisplayLocations.length}</span>
        </div>
        <div className="p-3 border-t-[4px] border-r-[2px] border-black bg-[#f5f5f5] flex items-center justify-center">
          <span className="font-bold mr-2">Active:</span>
          <span>{localDisplayLocations.filter((loc) => loc.status === "active").length}</span>
        </div>
        <div className="p-3 border-t-[4px] border-r-[2px] border-black bg-[#f5f5f5] flex items-center justify-center">
          <span className="font-bold mr-2">Avg CPI:</span>
          <span>
            {(
              localDisplayLocations.reduce(
                (sum, loc) => (loc.status === "active" ? sum + loc.cpi : sum),
                0
              ) / Math.max(localDisplayLocations.filter((loc) => loc.status === "active").length, 1)
            ).toFixed(4)}
          </span>
        </div>
        <div className="p-3 border-t-[4px] border-black bg-[#f5f5f5] flex items-center justify-center">
          <span className="font-bold mr-2">Total Allocated:</span>
          <span>
            {localDisplayLocations
              .reduce((sum, loc) => sum + loc.allocation, 0)
              .toLocaleString()}{" "}
            ADC
          </span>
        </div>
      </div>

      {/* Allocation Modal - Render with Portal */}
      {isAllocationModalOpen && isMounted && createPortal(
        <div 
          className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-[9999]"
          onClick={(e) => {
            // Close modal when clicking on backdrop
            if (e.target === e.currentTarget) {
              setIsAllocationModalOpen(false)
            }
          }}
        >
          <div 
            ref={modalRef}
            className="bg-white border-[6px] border-black shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] w-96 p-6 max-h-[90vh] overflow-auto relative"
            tabIndex={-1} // Make div focusable for keyboard trap
          >
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-xl font-bold">Add Budget to Display</h3>
              <button 
                onClick={() => setIsAllocationModalOpen(false)}
                className="text-black hover:text-gray-700"
                aria-label="Close modal"
              >
                ✕
              </button>
            </div>
            
            <p className="mb-4">
              Add ADC tokens to increase visibility for this display location.
            </p>
            
            <div className="mb-6">
              <label htmlFor="allocation-amount" className="font-bold mb-2 block">Allocation Amount (ADC)</label>
              <input
                id="allocation-amount"
                type="number"
                min="50"
                max="5000"
                value={allocationAmount}
                onChange={(e) => setAllocationAmount(parseInt(e.target.value))}
                className="w-full border-[3px] border-black p-2 text-lg font-bold"
              />
            </div>
            
            <div className="flex gap-3">
              <Button
                onClick={handleConfirmAllocation}
                className="bg-[#0055FF] text-white border-[3px] border-black hover:bg-[#FFCC00] hover:text-black transition-all font-bold px-4 py-2 h-auto rounded-none flex-1 hover:-translate-y-1 hover:shadow-[3px_3px_0px_0px_rgba(0,0,0,1)]"
              >
                Confirm
              </Button>
              <Button
                onClick={() => setIsAllocationModalOpen(false)}
                className="bg-white text-black border-[3px] border-black hover:bg-[#f5f5f5] transition-all font-bold px-4 py-2 h-auto rounded-none flex-1 hover:-translate-y-1 hover:shadow-[3px_3px_0px_0px_rgba(0,0,0,1)]"
              >
                Cancel
              </Button>
            </div>
          </div>
        </div>,
        document.body
      )}
    </div>
  )
}

