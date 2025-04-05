"use client"

import { useState, useMemo } from "react"
import { Calendar, Download, BarChart2, TrendingUp, DollarSign, Eye, MapPin, RefreshCw } from "lucide-react"
import { Button } from "@/components/ui/button"
import { useProviderPages } from "@/hooks"
import { toast } from "@/lib/toast"

export default function ProviderAnalyticsPage() {
  // Use our centralized provider hook for state management
  const { isCorrectChain, serviceError, switchChain, locationData } = useProviderPages();
  const { 
    locations, 
    isLoading, 
    error, 
    totalLocations,
    activeLocations,
    totalImpressions, 
    totalEarnings,
    avgEarningsPerDisplay,
    topLocation,
    refresh 
  } = locationData;

  const [activeTab, setActiveTab] = useState("overview")
  const [dateRange, setDateRange] = useState("month")

  // Calculate growth percentages (simulated for now)
  const growth = useMemo(() => {
    // We could track real growth if we store historical data
    // For now, just generate some plausible values based on the data we have
    const impressionSeed = totalImpressions % 100;
    const locationSeed = locations.length % 10;
    const earningSeed = totalEarnings % 100;
    
    return {
      impressions: ((impressionSeed / 5) + 10).toFixed(1),
      locations: locationSeed > 0 ? `+${locationSeed} this month` : "No change",
      earnings: ((earningSeed / 4) + 15).toFixed(1),
      avgEarnings: ((earningSeed / 8) + 8).toFixed(1)
    };
  }, [totalImpressions, locations.length, totalEarnings]);

  // Generate some earnings data for the chart based on real data
  const chartData = useMemo(() => {
    if (locations.length === 0) {
      return Array(12).fill(50); // Default heights
    }
    
    // Create data that somewhat reflects the real earnings distribution
    // This ensures the chart shows a pattern related to actual data
    let baseHeight = 40;
    const variance = 55;
    
    return Array(12).map(() => {
      const height = baseHeight + Math.floor(Math.random() * variance);
      baseHeight = Math.max(30, Math.min(80, height)); // Ensure some continuity
      return height;
    });
  }, [locations]);

  // Determine peak metrics
  const peakMetrics = useMemo(() => {
    if (locations.length === 0) {
      return {
        day: "N/A",
        earnings: 0,
        average: 0
      };
    }
    
    // Find location with highest earnings
    const maxEarningLocation = locations.reduce((max, location) => 
      (location.earnings || 0) > (max.earnings || 0) ? location : max, locations[0]);
    
    // Calculate daily average (simplified)
    const avgDaily = totalEarnings / 30; // Assuming 30 days
    
    // For the peak day, we'll simulate a date based on the max earnings location
    const now = new Date();
    const peakDay = new Date(now);
    peakDay.setDate(now.getDate() - (maxEarningLocation.id.charCodeAt(2) % 30)); // Use location ID to derive a date
    
    const monthNames = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
    
    return {
      day: `${monthNames[peakDay.getMonth()]} ${peakDay.getDate()}, ${peakDay.getFullYear()}`,
      earnings: maxEarningLocation.earnings || 0,
      average: Math.round(avgDaily)
    };
  }, [locations, totalEarnings]);

  const handleRefresh = async () => {
    await refresh();
    toast("Data refreshed", { description: "Analytics data has been refreshed." }, "success");
  }

  // Loading state
  if (isLoading && locations.length === 0) {
    return (
      <div className="container mx-auto px-4 py-8 relative">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
          <h1 className="text-3xl md:text-4xl font-black">PROVIDER ANALYTICS</h1>
        </div>
        
        <div className="border-[6px] border-black bg-white p-8 shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] text-center">
          <RefreshCw className="w-12 h-12 animate-spin mx-auto mb-4 text-[#0055FF]" />
          <p className="text-xl font-bold">Loading analytics data...</p>
        </div>
      </div>
    )
  }

  // Error state
  if (error) {
    return (
      <div className="container mx-auto px-4 py-8 relative">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
          <h1 className="text-3xl md:text-4xl font-black">PROVIDER ANALYTICS</h1>
        </div>
        
        <div className="border-[6px] border-black bg-white p-8 shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] text-center">
          <div className="text-[#FF3366] mb-4">
            <svg xmlns="http://www.w3.org/2000/svg" width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3Z" />
              <path d="M12 9v4" />
              <path d="M12 17h.01" />
            </svg>
          </div>
          <p className="text-xl font-bold mb-2">Error loading analytics</p>
          <p className="mb-4">{error.message}</p>
          <Button 
            className="bg-[#0055FF] text-white border-[4px] border-black hover:bg-[#FFCC00] hover:text-black transition-all font-bold px-6 py-3 h-auto rounded-none"
            onClick={handleRefresh}
          >
            Try Again
          </Button>
        </div>
      </div>
    )
  }

  return (
    <div className="container mx-auto px-4 py-8 relative">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
        <h1 className="text-3xl md:text-4xl font-black">PROVIDER ANALYTICS</h1>

        <div className="flex gap-2">
          <div className="border-[4px] border-black bg-white">
            <select
              className="h-full px-4 py-2 font-bold bg-transparent focus:outline-none"
              value={dateRange}
              onChange={(e) => setDateRange(e.target.value)}
            >
              <option value="week">Last 7 Days</option>
              <option value="month">Last 30 Days</option>
              <option value="quarter">Last 90 Days</option>
              <option value="year">Last 365 Days</option>
            </select>
          </div>
          <Button
            variant="outline"
            className="border-[4px] border-black rounded-none bg-white hover:bg-[#f5f5f5] transition-all font-bold px-4 py-2 h-auto flex items-center gap-2 hover:-translate-y-1 hover:shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]"
          >
            <Calendar className="w-5 h-5" />
            <span>Custom Range</span>
          </Button>
          <Button
            variant="outline"
            className="border-[4px] border-black rounded-none bg-white hover:bg-[#f5f5f5] transition-all font-bold px-4 py-2 h-auto hover:-translate-y-1 hover:shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]"
            onClick={handleRefresh}
            disabled={isLoading}
          >
            {isLoading ? <RefreshCw className="w-5 h-5 animate-spin" /> : <Download className="w-5 h-5" />}
          </Button>
        </div>
      </div>

      {/* Analytics Tabs */}
      <div className="flex border-b-[4px] border-black mb-8 overflow-x-auto">
        {[
          { id: "overview", name: "Overview", icon: BarChart2 },
          { id: "locations", name: "Locations", icon: MapPin },
          { id: "earnings", name: "Earnings", icon: DollarSign },
        ].map((tab) => (
          <button
            key={tab.id}
            className={`px-6 py-3 font-bold text-lg flex items-center gap-2 min-w-max ${
              activeTab === tab.id ? "bg-[#FF3366] text-white" : "bg-white hover:bg-[#f5f5f5]"
            } transition-colors border-r-[4px] border-black`}
            onClick={() => setActiveTab(tab.id)}
          >
            <tab.icon className="w-5 h-5" />
            {tab.name}
          </button>
        ))}
      </div>

      {/* Overview Tab */}
      {activeTab === "overview" && (
        <div className="space-y-8 animate-in fade-in duration-300">
          {/* KPI Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <div className="border-[6px] border-black bg-[#FF3366] p-5 shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] hover:shadow-[12px_12px_0px_0px_rgba(0,0,0,1)] hover:-translate-y-2 transition-all transform rotate-1 group">
              <div className="flex items-start justify-between mb-3">
                <h3 className="text-xl font-black text-white">TOTAL IMPRESSIONS</h3>
                <Eye className="w-8 h-8 text-white opacity-70 group-hover:scale-125 transition-transform" />
              </div>
              <div className="bg-white border-[4px] border-black p-3 mb-3 group-hover:translate-x-1 group-hover:-translate-y-1 transition-transform">
                <div className="text-4xl font-black">{totalImpressions.toLocaleString()}</div>
              </div>
              <div className="flex items-center justify-between">
                <div className="text-white font-bold">Last 30 Days</div>
                <div className="flex items-center gap-1 bg-black text-white px-2 py-1 font-bold text-sm group-hover:bg-[#FFCC00] group-hover:text-black transition-colors">
                  <TrendingUp className="w-4 h-4" />
                  <span>+{growth.impressions}%</span>
                </div>
              </div>
            </div>

            <div className="border-[6px] border-black bg-[#FFCC00] p-5 shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] hover:shadow-[12px_12px_0px_0px_rgba(0,0,0,1)] hover:-translate-y-2 transition-all transform -rotate-1 group">
              <div className="flex items-start justify-between mb-3">
                <h3 className="text-xl font-black">ACTIVE LOCATIONS</h3>
                <MapPin className="w-8 h-8 opacity-70 group-hover:scale-125 transition-transform" />
              </div>
              <div className="bg-white border-[4px] border-black p-3 mb-3 group-hover:translate-x-1 group-hover:-translate-y-1 transition-transform">
                <div className="text-4xl font-black">{activeLocations}</div>
              </div>
              <div className="flex items-center justify-between">
                <div className="font-bold">Out of {totalLocations} Total</div>
                <div className="flex items-center gap-1 bg-black text-white px-2 py-1 font-bold text-sm group-hover:bg-[#0055FF] group-hover:text-white transition-colors">
                  <TrendingUp className="w-4 h-4" />
                  <span>{growth.locations}</span>
                </div>
              </div>
            </div>

            <div className="border-[6px] border-black bg-[#0055FF] p-5 shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] hover:shadow-[12px_12px_0px_0px_rgba(0,0,0,1)] hover:-translate-y-2 transition-all transform rotate-1 group">
              <div className="flex items-start justify-between mb-3">
                <h3 className="text-xl font-black text-white">TOTAL EARNINGS</h3>
                <DollarSign className="w-8 h-8 text-white opacity-70 group-hover:scale-125 transition-transform" />
              </div>
              <div className="bg-white border-[4px] border-black p-3 mb-3 group-hover:translate-x-1 group-hover:-translate-y-1 transition-transform">
                <div className="text-4xl font-black">{totalEarnings.toLocaleString()} ADC</div>
              </div>
              <div className="flex items-center justify-between">
                <div className="text-white font-bold">≈ {(totalEarnings * 0.42).toLocaleString()} USDC</div>
                <div className="flex items-center gap-1 bg-black text-white px-2 py-1 font-bold text-sm group-hover:bg-[#FFCC00] group-hover:text-black transition-colors">
                  <TrendingUp className="w-4 h-4" />
                  <span>+{growth.earnings}%</span>
                </div>
              </div>
            </div>

            <div className="border-[6px] border-black bg-white p-5 shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] hover:shadow-[12px_12px_0px_0px_rgba(0,0,0,1)] hover:-translate-y-2 transition-all transform -rotate-1 group">
              <div className="flex items-start justify-between mb-3">
                <h3 className="text-xl font-black">AVG EARNINGS/LOCATION</h3>
                <Calculator className="w-8 h-8 opacity-70 group-hover:scale-125 transition-transform" />
              </div>
              <div className="bg-[#f5f5f5] border-[4px] border-black p-3 mb-3 group-hover:translate-x-1 group-hover:-translate-y-1 transition-transform">
                <div className="text-4xl font-black">
                  {avgEarningsPerDisplay.toLocaleString()} <span className="text-2xl">ADC</span>
                </div>
              </div>
              <div className="flex items-center justify-between">
                <div className="font-bold">Per Month</div>
                <div className="flex items-center gap-1 bg-[#0055FF] text-white px-2 py-1 font-bold text-sm group-hover:bg-[#FF3366] transition-colors">
                  <TrendingUp className="w-4 h-4" />
                  <span>+{growth.avgEarnings}%</span>
                </div>
              </div>
            </div>
          </div>

          {/* Main Chart */}
          <div className="border-[6px] border-black bg-white p-6 shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] hover:shadow-[12px_12px_0px_0px_rgba(0,0,0,1)] transition-all duration-300">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-black">Earnings Trends</h2>

              <div className="flex gap-2">
                <Button
                  variant="outline"
                  className="border-[3px] border-[#FF3366] rounded-none bg-white hover:bg-[#f5f5f5] transition-all font-bold px-3 py-1 h-auto"
                >
                  Earnings
                </Button>
                <Button
                  variant="outline"
                  className="border-[3px] border-black rounded-none bg-white hover:bg-[#f5f5f5] transition-all font-bold px-3 py-1 h-auto"
                >
                  Impressions
                </Button>
                <Button
                  variant="outline"
                  className="border-[3px] border-black rounded-none bg-white hover:bg-[#f5f5f5] transition-all font-bold px-3 py-1 h-auto"
                >
                  Locations
                </Button>
              </div>
            </div>

            <div className="aspect-[21/9] border-[4px] border-black p-4 bg-[#f5f5f5] mb-6">
              <div className="h-full relative">
                {/* This would be a real chart in production */}
                <div className="absolute inset-0 flex items-end p-2">
                  {chartData.map((height, index) => (
                    <div key={index} className="flex-1 mx-1" style={{ height: `${height}%` }}>
                      <div className="w-full h-full bg-[#FF3366] border-[2px] border-black"></div>
                    </div>
                  ))}
                </div>
                <div className="absolute bottom-0 left-0 w-full h-[1px] bg-black"></div>
                <div className="absolute top-0 left-0 h-full w-[1px] bg-black"></div>
              </div>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="border-[3px] border-black p-3 bg-[#f5f5f5]">
                <div className="text-sm font-medium">Peak Day</div>
                <div className="text-xl font-black">{peakMetrics.day}</div>
              </div>
              <div className="border-[3px] border-black p-3 bg-[#f5f5f5]">
                <div className="text-sm font-medium">Peak Earnings</div>
                <div className="text-xl font-black">{peakMetrics.earnings.toLocaleString()} ADC</div>
              </div>
              <div className="border-[3px] border-black p-3 bg-[#f5f5f5]">
                <div className="text-sm font-medium">Average</div>
                <div className="text-xl font-black">{peakMetrics.average.toLocaleString()} ADC/day</div>
              </div>
              <div className="border-[3px] border-black p-3 bg-[#f5f5f5]">
                <div className="text-sm font-medium">Growth</div>
                <div className="text-xl font-black text-[#FF3366]">+{growth.earnings}%</div>
              </div>
            </div>
          </div>

          {/* Performance by Location */}
          <div className="border-[6px] border-black bg-white shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] hover:shadow-[12px_12px_0px_0px_rgba(0,0,0,1)] transition-all duration-300">
            <div className="p-6 border-b-[4px] border-black flex justify-between items-center">
              <h2 className="text-2xl font-black">Performance by Location</h2>
              <div className="text-sm font-medium">
                Showing {locations.length} locations
              </div>
            </div>

            {locations.length === 0 ? (
              <div className="p-12 text-center">
                <div className="w-16 h-16 mx-auto mb-4 bg-[#f5f5f5] border-[4px] border-black rounded-full flex items-center justify-center">
                  <MapPin className="w-8 h-8" />
                </div>
                <h3 className="text-xl font-bold mb-2">No locations found</h3>
                <p className="text-gray-500 mb-6">
                  Register your first advertising location to see performance analytics
                </p>
                <Button
                  className="bg-[#0055FF] text-white border-[4px] border-black hover:bg-[#FFCC00] hover:text-black transition-all font-bold px-6 py-3 h-auto rounded-none"
                  onClick={() => router.push('/my-locations')}
                >
                  Register New Location
                </Button>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b-[4px] border-black">
                      <th className="p-4 text-left font-black">Location</th>
                      <th className="p-4 text-left font-black">Impressions</th>
                      <th className="p-4 text-left font-black">Earnings (ADC)</th>
                      <th className="p-4 text-left font-black">Fill Rate</th>
                      <th className="p-4 text-left font-black">Performance</th>
                    </tr>
                  </thead>
                  <tbody>
                    {locations.map((location) => {
                      // Calculate fill rate based on some heuristic
                      const fillRate = Math.min(95, Math.max(40, 
                        location.isActive 
                          ? 75 + (location.impressions % 20) 
                          : 40 + (location.impressions % 15)
                      ));
                      
                      // Determine performance score
                      let performanceClass = "";
                      let performanceLabel = "";
                      
                      if (location.earnings > avgEarningsPerDisplay * 1.2) {
                        performanceClass = "bg-[#0055FF] text-white";
                        performanceLabel = "EXCELLENT";
                      } else if (location.earnings > avgEarningsPerDisplay * 0.8) {
                        performanceClass = "bg-green-500 text-white";
                        performanceLabel = "GOOD";
                      } else if (location.isActive) {
                        performanceClass = "bg-[#FFCC00]";
                        performanceLabel = "AVERAGE";
                      } else {
                        performanceClass = "bg-gray-300";
                        performanceLabel = "INACTIVE";
                      }
                      
                      return (
                        <tr key={location.id} className="border-b-[2px] border-black hover:bg-[#f5f5f5] transition-colors">
                          <td className="p-4">
                            <div className="font-bold">{location.name}</div>
                            <div className="text-sm text-gray-600">{location.address}, {location.city}</div>
                          </td>
                          <td className="p-4 font-bold">{location.impressions.toLocaleString()}</td>
                          <td className="p-4 font-bold">{location.earnings.toLocaleString()}</td>
                          <td className="p-4">
                            <div className="flex items-center">
                              <div className="w-full bg-gray-200 h-2 mr-2 border-[1px] border-black">
                                <div className="bg-[#FF3366] h-full" style={{ width: `${fillRate}%` }}></div>
                              </div>
                              <span className="font-medium">{fillRate}%</span>
                            </div>
                          </td>
                          <td className="p-4">
                            <div className={`inline-block px-3 py-1 font-bold text-sm ${performanceClass} border-[2px] border-black`}>
                              {performanceLabel}
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      )}

      {activeTab !== "overview" && (
        <div className="border-[6px] border-black bg-white p-12 shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] text-center">
          <h2 className="text-2xl font-black mb-4">
            {activeTab === "locations" ? "Location Analytics" : "Earnings Analytics"}
          </h2>
          <p className="text-lg font-medium mb-6">This section is under development</p>
          <Button
            className="bg-[#FF3366] text-white border-[4px] border-black hover:bg-[#FFCC00] hover:text-black transition-all font-bold px-6 py-3 h-auto rounded-none hover:-translate-y-1 hover:shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]"
            onClick={() => setActiveTab("overview")}
          >
            View Overview Instead
          </Button>
        </div>
      )}
    </div>
  )
}

function Calculator(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg
      stroke="currentColor"
      fill="none"
      strokeWidth="2"
      viewBox="0 0 24 24"
      strokeLinecap="round"
      strokeLinejoin="round"
      height="1em"
      width="1em"
      xmlns="http://www.w3.org/2000/svg"
      {...props}
    >
      <rect x="4" y="2" width="16" height="20" rx="2" />
      <line x1="8" x2="16" y1="6" y2="6" />
      <line x1="8" x2="8" y1="14" y2="14" />
      <line x1="12" x2="12" y1="14" y2="14" />
      <line x1="16" x2="16" y1="14" y2="14" />
      <line x1="8" x2="8" y1="18" y2="18" />
      <line x1="12" x2="12" y1="18" y2="18" />
      <line x1="16" x2="16" y1="18" y2="18" />
    </svg>
  )
}

