"use client"

import { useState, useEffect, useRef } from "react"
import { Plus, Minus, Layers, Search, X } from "lucide-react"
import { Button } from "@/components/ui/button"
import { useLocationStore } from "@/lib/store/useLocationStore"
import { useCampaignStore } from "@/lib/store/useCampaignStore"
import { useUserStore } from "@/lib/store/useUserStore"
import { toast } from "@/lib/toast"

interface InteractiveMapProps {
  height?: string
  width?: string
  initialZoom?: number
  showControls?: boolean
  showLegend?: boolean
  selectable?: boolean
  onLocationSelect?: (locationId: string) => void
  selectedLocations?: string[]
  campaignMode?: boolean
  campaignId?: string
}

export default function InteractiveMap({
  height = "600px",
  width = "100%",
  initialZoom = 1,
  showControls = true,
  showLegend = true,
  selectable = false,
  onLocationSelect,
  selectedLocations = [],
  campaignMode = false,
  campaignId,
}: InteractiveMapProps) {
  const { locations, fetchLocations, selectedLocationId, selectLocation } = useLocationStore()
  const { isConnected } = useUserStore()
  const { addLocationToCampaign } = useCampaignStore()

  const [mapZoom, setMapZoom] = useState(initialZoom)
  const [isLoading, setIsLoading] = useState(true)
  const [hoveredLocation, setHoveredLocation] = useState<string | null>(null)
  const [showLocationDetails, setShowLocationDetails] = useState(false)
  const [selectedSlots, setSelectedSlots] = useState(1)
  const mapRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const loadLocations = async () => {
      setIsLoading(true)
      try {
        await fetchLocations()
      } catch (error) {
        toast("Error", { description: "Failed to load locations" }, "error")
      } finally {
        setIsLoading(false)
      }
    }

    loadLocations()
  }, [fetchLocations])

  const handleZoomIn = () => {
    setMapZoom(Math.min(mapZoom + 0.2, 2))
  }

  const handleZoomOut = () => {
    setMapZoom(Math.max(mapZoom - 0.2, 0.6))
  }

  const handleLocationClick = (locationId: string) => {
    if (selectable) {
      onLocationSelect?.(locationId)
    } else {
      selectLocation(locationId)
      setShowLocationDetails(true)
    }
  }

  const handleAddToCampaign = async (locationId: string) => {
    if (!isConnected) {
      toast("Connect Wallet", { description: "Please connect your wallet first" }, "warning")
      return
    }

    if (!campaignId) {
      toast("No Campaign Selected", { description: "Please select a campaign first" }, "warning")
      return
    }

    try {
      await addLocationToCampaign(campaignId, locationId, selectedSlots)
      setShowLocationDetails(false)
    } catch (error) {
      // Error is handled in the store action
    }
  }

  const getLocationStatusColor = (status: string, verificationStatus: string) => {
    if (status === "inactive") return "bg-gray-300 border-gray-500"
    if (status === "pending") return "bg-[#FFCC00] border-black"
    if (verificationStatus !== "verified") return "bg-[#FF3366] border-black"
    return "bg-[#0055FF] border-black"
  }

  const isLocationSelected = (locationId: string) => {
    return selectedLocations.includes(locationId)
  }

  return (
    <div
      className="border-[6px] border-black bg-white shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] hover:shadow-[12px_12px_0px_0px_rgba(0,0,0,1)] transition-all duration-300"
      style={{ height, width }}
    >
      <div className="p-4 border-b-[4px] border-black flex justify-between items-center">
        <h2 className="text-xl font-black">DISPLAY LOCATIONS</h2>
        {showControls && (
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="icon"
              className="h-10 w-10 border-[3px] border-black rounded-none bg-white hover:bg-[#f5f5f5]"
              onClick={handleZoomIn}
            >
              <Plus className="h-5 w-5" />
            </Button>
            <Button
              variant="outline"
              size="icon"
              className="h-10 w-10 border-[3px] border-black rounded-none bg-white hover:bg-[#f5f5f5]"
              onClick={handleZoomOut}
            >
              <Minus className="h-5 w-5" />
            </Button>
            <Button
              variant="outline"
              size="icon"
              className="h-10 w-10 border-[3px] border-black rounded-none bg-white hover:bg-[#f5f5f5]"
            >
              <Layers className="h-5 w-5" />
            </Button>
          </div>
        )}
      </div>

      <div className="relative">
        <div ref={mapRef} className="aspect-[16/9] relative bg-[#f5f5f5] border-[4px] border-black overflow-hidden">
          {isLoading ? (
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="animate-spin h-12 w-12 border-4 border-[#0055FF] border-t-transparent rounded-full"></div>
            </div>
          ) : (
            <div
              className="w-full h-full transition-transform duration-300"
              style={{
                transform: `scale(${mapZoom})`,
                backgroundImage: "url('/placeholder.svg?height=600&width=1200')",
                backgroundSize: "cover",
                backgroundPosition: "center",
              }}
            >
              {/* Display markers */}
              {locations.map((location) => (
                <button
                  key={location.id}
                  className={`absolute w-8 h-8 group transform hover:scale-125 transition-transform focus:outline-none -translate-x-1/2 -translate-y-1/2 ${
                    isLocationSelected(location.id) ? "scale-125" : ""
                  }`}
                  style={{
                    left: `${location.coordinates.lng * 100}%`,
                    top: `${location.coordinates.lat * 100}%`,
                    zIndex: hoveredLocation === location.id || selectedLocationId === location.id ? 10 : 5,
                  }}
                  onClick={() => handleLocationClick(location.id)}
                  onMouseEnter={() => setHoveredLocation(location.id)}
                  onMouseLeave={() => setHoveredLocation(null)}
                >
                  <div
                    className={`w-8 h-8 rounded-full border-[3px] ${getLocationStatusColor(
                      location.status,
                      location.verificationStatus,
                    )} ${isLocationSelected(location.id) ? "ring-4 ring-[#FFCC00]" : ""}`}
                    style={{
                      borderWidth:
                        location.dailyImpressions > 0
                          ? location.dailyImpressions > 100000
                            ? "5px"
                            : location.dailyImpressions > 50000
                              ? "4px"
                              : "3px"
                          : "2px",
                    }}
                  ></div>

                  {/* Display popup on hover */}
                  {(hoveredLocation === location.id || (selectedLocationId === location.id && showLocationDetails)) && (
                    <div className="absolute top-full left-1/2 -translate-x-1/2 mt-2 bg-white border-[4px] border-black p-3 w-64 z-20 shadow-[6px_6px_0px_0px_rgba(0,0,0,1)]">
                      <p className="font-bold text-lg">{location.name}</p>
                      <p className="font-medium mb-2">
                        Status:{" "}
                        <span className={location.status === "active" ? "text-green-600 font-bold" : "text-gray-500"}>
                          {location.status.toUpperCase()}
                        </span>
                      </p>

                      <div className="mb-2">
                        <div className="font-bold">Daily Impressions</div>
                        <div className="text-xl font-black">{location.dailyImpressions.toLocaleString()}</div>
                      </div>

                      {location.status === "active" && (
                        <>
                          <div className="mb-3">
                            <div className="font-bold mb-1">Performance</div>
                            <div className="flex items-center gap-1">
                              <div
                                className="h-4 bg-[#0055FF] border-[2px] border-black"
                                style={{ width: `${(location.dailyImpressions / 200000) * 100}%` }}
                              ></div>
                              <span className="font-bold">{location.dailyImpressions.toLocaleString()}</span>
                            </div>
                            <div className="text-sm font-medium">
                              Cost per impression: {location.costPerView.toFixed(4)} ADC
                            </div>
                          </div>

                          <div className="grid grid-cols-2 gap-2">
                            {campaignMode && (
                              <>
                                <div className="col-span-2 mb-2">
                                  <label className="block text-sm font-bold mb-1">Slots to Book:</label>
                                  <select
                                    className="w-full border-[3px] border-black p-1 text-sm"
                                    value={selectedSlots}
                                    onChange={(e) => setSelectedSlots(Number(e.target.value))}
                                  >
                                    {Array.from({ length: Math.min(location.availableSlots, 10) }, (_, i) => i + 1).map(
                                      (num) => (
                                        <option key={num} value={num}>
                                          {num} slot{num > 1 ? "s" : ""}
                                        </option>
                                      ),
                                    )}
                                  </select>
                                </div>
                                <Button
                                  className="col-span-2 bg-[#0055FF] text-white border-[3px] border-black hover:bg-[#FFCC00] hover:text-black transition-all font-bold text-sm py-1 h-auto rounded-none relative overflow-hidden group hover:-translate-y-1 hover:shadow-[3px_3px_0px_0px_rgba(0,0,0,1)]"
                                  onClick={() => handleAddToCampaign(location.id)}
                                  disabled={isLocationSelected(location.id)}
                                >
                                  <span className="relative z-10 flex items-center">
                                    <Plus className="w-4 h-4 mr-1" />
                                    {isLocationSelected(location.id) ? "Already Added" : "Add to Campaign"}
                                  </span>
                                </Button>
                              </>
                            )}
                            {!campaignMode && (
                              <>
                                <Button className="bg-[#0055FF] text-white border-[3px] border-black hover:bg-[#FFCC00] hover:text-black transition-all font-bold text-sm py-1 h-auto rounded-none relative overflow-hidden group hover:-translate-y-1 hover:shadow-[3px_3px_0px_0px_rgba(0,0,0,1)]">
                                  <span className="relative z-10 flex items-center">
                                    <Plus className="w-4 h-4 mr-1" />
                                    Add to Campaign
                                  </span>
                                </Button>
                                <Button className="bg-white text-black border-[3px] border-black hover:bg-[#FF3366] hover:text-white transition-all font-bold text-sm py-1 h-auto rounded-none relative overflow-hidden group hover:-translate-y-1 hover:shadow-[3px_3px_0px_0px_rgba(0,0,0,1)]">
                                  <span className="relative z-10 flex items-center">
                                    <Search className="w-4 h-4 mr-1" />
                                    View Details
                                  </span>
                                </Button>
                              </>
                            )}
                          </div>
                        </>
                      )}

                      {location.status === "inactive" && (
                        <Button className="w-full bg-[#FFCC00] text-black border-[3px] border-black hover:bg-[#0055FF] hover:text-white transition-all font-bold text-sm py-1 h-auto rounded-none hover:-translate-y-1 hover:shadow-[3px_3px_0px_0px_rgba(0,0,0,1)]">
                          Activate Display
                        </Button>
                      )}
                    </div>
                  )}
                </button>
              ))}

              {/* Map legend */}
              {showLegend && (
                <div className="absolute bottom-4 left-4 bg-white border-[3px] border-black p-3 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] hover:shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] transition-all">
                  <div className="text-lg font-bold mb-2">Legend</div>
                  <div className="flex flex-col gap-2">
                    <div className="flex items-center gap-2">
                      <div className="w-4 h-4 bg-[#0055FF] border-[2px] border-black rounded-full"></div>
                      <span className="font-medium">Active Display</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="w-4 h-4 bg-[#FFCC00] border-[2px] border-black rounded-full"></div>
                      <span className="font-medium">Pending Display</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="w-4 h-4 bg-gray-300 border-[2px] border-gray-500 rounded-full"></div>
                      <span className="font-medium">Inactive Display</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="w-4 h-4 bg-[#FF3366] border-[2px] border-black rounded-full"></div>
                      <span className="font-medium">Unverified Display</span>
                    </div>
                    {selectable && (
                      <div className="flex items-center gap-2">
                        <div className="w-4 h-4 bg-[#0055FF] border-[2px] border-black rounded-full ring-2 ring-[#FFCC00]"></div>
                        <span className="font-medium">Selected Display</span>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Selected location details panel */}
        {selectedLocationId && showLocationDetails && (
          <div className="mt-4 border-[4px] border-black p-4 bg-[#f5f5f5]">
            {locations
              .filter((loc) => loc.id === selectedLocationId)
              .map((location) => (
                <div key={location.id}>
                  <div className="flex justify-between items-start mb-4">
                    <div>
                      <h3 className="text-2xl font-black">{location.name}</h3>
                      <div className="flex items-center gap-2">
                        <div
                          className={`px-2 py-1 text-xs font-bold ${
                            location.status === "active" ? "bg-green-500 text-white" : "bg-gray-400 text-white"
                          } border-[2px] border-black`}
                        >
                          {location.status.toUpperCase()}
                        </div>
                        <div className="px-2 py-1 text-xs font-bold bg-[#0055FF] text-white border-[2px] border-black">
                          {location.type.toUpperCase()}
                        </div>
                        <div className="px-2 py-1 text-xs font-bold bg-[#FFCC00] text-black border-[2px] border-black">
                          {location.visibility.toUpperCase()} VISIBILITY
                        </div>
                      </div>
                    </div>
                    <Button
                      variant="outline"
                      size="sm"
                      className="border-[3px] border-black rounded-none bg-white hover:bg-[#f5f5f5]"
                      onClick={() => {
                        setShowLocationDetails(false)
                        selectLocation(null)
                      }}
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                    <div className="border-[3px] border-black p-3 bg-white">
                      <div className="text-sm font-medium">Daily Impressions</div>
                      <div className="text-xl font-black">{location.dailyImpressions.toLocaleString()}</div>
                    </div>
                    <div className="border-[3px] border-black p-3 bg-white">
                      <div className="text-sm font-medium">Available Slots</div>
                      <div className="text-xl font-black">{location.availableSlots}</div>
                    </div>
                    <div className="border-[3px] border-black p-3 bg-white">
                      <div className="text-sm font-medium">Cost per Impression</div>
                      <div className="text-xl font-black">{location.costPerView.toFixed(4)} ADC</div>
                    </div>
                  </div>

                  <div className="flex gap-4">
                    {campaignMode ? (
                      <>
                        <div className="flex-1">
                          <label className="block font-bold mb-2">Slots to Book:</label>
                          <select
                            className="w-full border-[3px] border-black p-2 font-medium"
                            value={selectedSlots}
                            onChange={(e) => setSelectedSlots(Number(e.target.value))}
                          >
                            {Array.from({ length: Math.min(location.availableSlots, 10) }, (_, i) => i + 1).map(
                              (num) => (
                                <option key={num} value={num}>
                                  {num} slot{num > 1 ? "s" : ""}
                                </option>
                              ),
                            )}
                          </select>
                        </div>
                        <Button
                          className="flex-1 bg-[#0055FF] text-white border-[4px] border-black hover:bg-[#FFCC00] hover:text-black transition-all font-bold px-4 py-2 h-auto rounded-none hover:-translate-y-1 hover:shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]"
                          onClick={() => handleAddToCampaign(location.id)}
                          disabled={isLocationSelected(location.id)}
                        >
                          {isLocationSelected(location.id) ? "Already Added to Campaign" : "Add to Campaign"}
                        </Button>
                      </>
                    ) : (
                      <>
                        <Button className="flex-1 bg-[#0055FF] text-white border-[4px] border-black hover:bg-[#FFCC00] hover:text-black transition-all font-bold px-4 py-2 h-auto rounded-none hover:-translate-y-1 hover:shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">
                          Add to Campaign
                        </Button>
                        <Button className="flex-1 bg-white text-black border-[4px] border-black hover:bg-[#FF3366] hover:text-white transition-all font-bold px-4 py-2 h-auto rounded-none hover:-translate-y-1 hover:shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">
                          View Analytics
                        </Button>
                      </>
                    )}
                  </div>
                </div>
              ))}
          </div>
        )}
      </div>
    </div>
  )
}

