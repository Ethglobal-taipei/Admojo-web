"use client"

import { useState } from "react"
import Image from "next/image"
import { Eye, DollarSign, BarChart3, Settings, ChevronDown, TrendingUp, TrendingDown } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Switch } from "@/components/ui/switch"
import { useLocationData, LocationData } from "@/hooks/use-location-data"
import { useAdContract } from "@/hooks/use-ad-contract"
import { toast } from "@/lib/toast"

export default function DisplayPerformance() {
  const { locations, isLoading, error, refresh } = useLocationData();
  const { operations } = useAdContract();
  const [activeDisplay, setActiveDisplay] = useState<string | null>(null);
  const [expandedMetrics, setExpandedMetrics] = useState(false);
  const [displayStatuses, setDisplayStatuses] = useState<Record<string, boolean>>({});

  // Set the active display to the first one if none is selected
  if (locations.length > 0 && !activeDisplay) {
    setActiveDisplay(locations[0].id);
  }

  const selectedDisplay = locations.find(d => d.id === activeDisplay) || (locations.length > 0 ? locations[0] : null);

  const handleStatusChange = async (locationId: string, newStatus: boolean) => {
    try {
      let hash;
      if (newStatus) {
        // Call reactivateLocation function
        hash = await operations.reactivateLocation.execute(locationId.slice(2));
      } else {
        // Call deactivateLocation function
        hash = await operations.deactivateLocation.execute(locationId.slice(2));
      }

      // Update local state optimistically
      setDisplayStatuses(prev => ({
        ...prev,
        [locationId]: newStatus
      }));

      if (hash) {
        toast(
          newStatus ? "Display Activated" : "Display Deactivated",
          { description: `The display is now ${newStatus ? "online" : "offline"}.` },
          newStatus ? "success" : "info"
        );
        
        // Refresh data after a delay to allow transaction to complete
        setTimeout(() => {
          refresh();
        }, 2000);
      }
    } catch (err) {
      console.error("Error updating display status:", err);
      toast(
        "Status Update Failed",
        { description: err instanceof Error ? err.message : "Unknown error occurred" },
        "error"
      );
    }
  };

  // Return loading state
  if (isLoading && locations.length === 0) {
    return (
      <section className="mb-10 relative">
        <h2 className="text-2xl md:text-3xl font-black relative inline-block mb-6">
          DISPLAY PERFORMANCE
          <div className="absolute -bottom-2 left-0 w-full h-1 bg-[#0055FF] [clip-path:polygon(0_0,100%_0,96%_100%,4%_100%)]"></div>
        </h2>
        <div className="border-[6px] border-black bg-white p-6 shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] text-center">
          <p className="text-lg font-bold py-8">Loading display data...</p>
        </div>
      </section>
    );
  }

  // Return empty state
  if (!isLoading && locations.length === 0) {
    return (
      <section className="mb-10 relative">
        <h2 className="text-2xl md:text-3xl font-black relative inline-block mb-6">
          DISPLAY PERFORMANCE
          <div className="absolute -bottom-2 left-0 w-full h-1 bg-[#0055FF] [clip-path:polygon(0_0,100%_0,96%_100%,4%_100%)]"></div>
        </h2>
        <div className="border-[6px] border-black bg-white p-6 shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] text-center">
          <p className="text-lg font-bold py-4">No displays registered yet.</p>
          <p className="mb-4">Register your first display to see performance metrics.</p>
        </div>
      </section>
    );
  }

  return (
    <section className="mb-10 relative">
      {/* Add a subtle checkered background */}
      <div className="absolute inset-0 -z-10 bg-checkered-yellow opacity-20"></div>

      <h2 className="text-2xl md:text-3xl font-black relative inline-block mb-6">
        DISPLAY PERFORMANCE
        <div className="absolute -bottom-2 left-0 w-full h-1 bg-[#0055FF] [clip-path:polygon(0_0,100%_0,96%_100%,4%_100%)]"></div>
      </h2>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        {locations.map((location) => (
          <div
            key={location.id}
            className={`border-[6px] border-black bg-white p-4 shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] hover:shadow-[12px_12px_0px_0px_rgba(0,0,0,1)] hover:-translate-y-2 transition-all ${
              activeDisplay === location.id ? "ring-[6px] ring-[#0055FF] ring-offset-2" : ""
            } cursor-pointer`}
            onClick={() => setActiveDisplay(location.id)}
          >
            <div className="relative mb-4 border-[4px] border-black overflow-hidden">
              <Image
                src={`/placeholder.svg?height=200&width=300&text=${encodeURIComponent(location.name)}`}
                alt={location.name}
                width={300}
                height={200}
                className="w-full h-48 object-cover"
              />
              <div
                className={`absolute top-3 right-3 px-3 py-1 font-bold text-sm border-[2px] border-black ${
                  displayStatuses[location.id] ?? location.isActive ? "bg-green-500 text-white" : "bg-gray-400 text-white"
                }`}
              >
                {(displayStatuses[location.id] ?? location.isActive) ? "ACTIVE" : "INACTIVE"}
              </div>
            </div>

            <h3 className="text-xl font-black mb-1">{location.name}</h3>
            <p className="font-medium text-gray-600 mb-3">{location.address}, {location.city}</p>

            <div className="grid grid-cols-3 gap-2 mb-4">
              <div className="border-[3px] border-black p-2 bg-[#f5f5f5]">
                <div className="text-xs font-medium">Impressions</div>
                <div className="text-lg font-black">{location.impressions.toLocaleString()}</div>
              </div>
              <div className="border-[3px] border-black p-2 bg-[#f5f5f5]">
                <div className="text-xs font-medium">Earnings</div>
                <div className="text-lg font-black">{location.earnings}</div>
              </div>
              <div className="border-[3px] border-black p-2 bg-[#f5f5f5]">
                <div className="text-xs font-medium">Campaigns</div>
                <div className="text-lg font-black">{location.campaigns}</div>
              </div>
            </div>

            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Switch
                  id={`display-status-${location.id}`}
                  checked={displayStatuses[location.id] ?? location.isActive}
                  onCheckedChange={(checked) => {
                    handleStatusChange(location.id, checked);
                  }}
                  className="data-[state=checked]:bg-green-500 data-[state=unchecked]:bg-gray-400 h-6 w-12 border-[3px] border-black"
                />
                <label htmlFor={`display-status-${location.id}`} className="font-bold">
                  {(displayStatuses[location.id] ?? location.isActive) ? "Online" : "Offline"}
                </label>
              </div>
              <Button
                variant="outline"
                size="sm"
                className="border-[3px] border-black rounded-none hover:bg-[#f5f5f5] transition-all"
              >
                <Settings className="w-4 h-4" />
              </Button>
            </div>
          </div>
        ))}
      </div>

      {selectedDisplay && (
        <div className="border-[6px] border-black bg-white p-6 shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] hover:shadow-[12px_12px_0px_0px_rgba(0,0,0,1)] transition-all duration-300 relative mb-8">
          <h3 className="text-2xl font-black mb-4 flex items-center justify-between">
            <span>Detailed Metrics: {selectedDisplay.name}</span>
            <Button
              variant="outline"
              className="border-[3px] border-black rounded-none bg-white hover:bg-[#f5f5f5] transition-all font-bold px-3 py-1 h-auto flex items-center gap-1"
              onClick={() => setExpandedMetrics(!expandedMetrics)}
            >
              {expandedMetrics ? "Show Less" : "Show More"}
              <ChevronDown className={`w-4 h-4 transition-transform ${expandedMetrics ? "rotate-180" : ""}`} />
            </Button>
          </h3>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
            <div className="border-[4px] border-black p-4 bg-[#f5f5f5]">
              <div className="flex items-center justify-between mb-3">
                <h4 className="font-bold text-lg flex items-center gap-2">
                  <Eye className="w-5 h-5" /> Daily Impressions
                </h4>
                <div className="flex items-center gap-1 bg-[#0055FF] text-white px-2 py-1 font-bold text-sm">
                  <TrendingUp className="w-4 h-4" />
                  <span>+8.3%</span>
                </div>
              </div>
              <div className="h-32 relative border-[3px] border-black bg-white p-2">
                {/* Raw chart visualization */}
                <div className="absolute inset-0 flex items-end p-2">
                  {[40, 65, 45, 70, 55, 80, 95].map((height, index) => (
                    <div key={index} className="flex-1 mx-1" style={{ height: `${height}%` }}>
                      <div className="w-full h-full bg-[#0055FF] border-[2px] border-black"></div>
                    </div>
                  ))}
                </div>
              </div>
              <div className="flex justify-between mt-2 text-xs font-medium">
                <div>Mon</div>
                <div>Tue</div>
                <div>Wed</div>
                <div>Thu</div>
                <div>Fri</div>
                <div>Sat</div>
                <div>Sun</div>
              </div>
            </div>

            <div className="border-[4px] border-black p-4 bg-[#f5f5f5]">
              <div className="flex items-center justify-between mb-3">
                <h4 className="font-bold text-lg flex items-center gap-2">
                  <BarChart3 className="w-5 h-5" /> Engagement Rate
                </h4>
                <div className="flex items-center gap-1 bg-[#FF3366] text-white px-2 py-1 font-bold text-sm">
                  <TrendingDown className="w-4 h-4" />
                  <span>-2.1%</span>
                </div>
              </div>
              <div className="space-y-3">
                <div>
                  <div className="flex justify-between mb-1">
                    <span className="font-medium">QR Scans</span>
                    <span className="font-bold">4.2%</span>
                  </div>
                  <div className="h-6 bg-white border-[3px] border-black">
                    <div className="h-full bg-[#0055FF] border-r-[2px] border-black" style={{ width: "42%" }}></div>
                  </div>
                </div>
                <div>
                  <div className="flex justify-between mb-1">
                    <span className="font-medium">NFC Taps</span>
                    <span className="font-bold">2.8%</span>
                  </div>
                  <div className="h-6 bg-white border-[3px] border-black">
                    <div className="h-full bg-[#FFCC00] border-r-[2px] border-black" style={{ width: "28%" }}></div>
                  </div>
                </div>
                <div>
                  <div className="flex justify-between mb-1">
                    <span className="font-medium">URL Visits</span>
                    <span className="font-bold">5.7%</span>
                  </div>
                  <div className="h-6 bg-white border-[3px] border-black">
                    <div className="h-full bg-[#FF3366] border-r-[2px] border-black" style={{ width: "57%" }}></div>
                  </div>
                </div>
              </div>
            </div>

            <div className="border-[4px] border-black p-4 bg-[#f5f5f5]">
              <div className="flex items-center justify-between mb-3">
                <h4 className="font-bold text-lg flex items-center gap-2">
                  <DollarSign className="w-5 h-5" /> Earnings Breakdown
                </h4>
                <div className="flex items-center gap-1 bg-[#0055FF] text-white px-2 py-1 font-bold text-sm">
                  <TrendingUp className="w-4 h-4" />
                  <span>+12.5%</span>
                </div>
              </div>
              <div className="space-y-3">
                <div className="flex items-center justify-between border-b-2 border-dashed border-black pb-2">
                  <span className="font-bold">Base Impressions</span>
                  <span className="font-black">{Math.round(selectedDisplay.earnings * 0.65)} ADC</span>
                </div>
                <div className="flex items-center justify-between border-b-2 border-dashed border-black pb-2">
                  <span className="font-bold">Engagement Bonus</span>
                  <span className="font-black">{Math.round(selectedDisplay.earnings * 0.15)} ADC</span>
                </div>
                <div className="flex items-center justify-between border-b-2 border-dashed border-black pb-2">
                  <span className="font-bold">Premium Location</span>
                  <span className="font-black">{Math.round(selectedDisplay.earnings * 0.20)} ADC</span>
                </div>
                <div className="flex items-center justify-between pt-1">
                  <span className="font-black text-lg">TOTAL</span>
                  <span className="font-black text-lg">{selectedDisplay.earnings} ADC</span>
                </div>
              </div>
            </div>
          </div>

          {expandedMetrics && (
            <div className="pt-4 border-t-2 border-dashed border-gray-300">
              <h4 className="font-bold text-lg mb-4">Display Specifications</h4>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <div className="border-[3px] border-black p-3 bg-white">
                  <div className="text-sm font-medium text-gray-600">Display Type</div>
                  <div className="font-bold">{selectedDisplay.displayType.charAt(0).toUpperCase() + selectedDisplay.displayType.slice(1)}</div>
                </div>
                <div className="border-[3px] border-black p-3 bg-white">
                  <div className="text-sm font-medium text-gray-600">Size Category</div>
                  <div className="font-bold">{selectedDisplay.size.charAt(0).toUpperCase() + selectedDisplay.size.slice(1)}</div>
                </div>
                <div className="border-[3px] border-black p-3 bg-white">
                  <div className="text-sm font-medium text-gray-600">Daily Rate</div>
                  <div className="font-bold">{selectedDisplay.pricePerDay} ADC</div>
                </div>
                <div className="border-[3px] border-black p-3 bg-white">
                  <div className="text-sm font-medium text-gray-600">Avg. Daily Foot Traffic</div>
                  <div className="font-bold">{selectedDisplay.footTraffic.toLocaleString()}</div>
                </div>
              </div>
            </div>
          )}
        </div>
      )}
    </section>
  )
}

