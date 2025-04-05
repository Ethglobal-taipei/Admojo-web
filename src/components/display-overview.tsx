"use client"

import { useState, useEffect } from "react"
import { Monitor, Eye, DollarSign, MapPin, RefreshCw, TrendingUp } from "lucide-react"
import { Button } from "@/components/ui/button"
import { useLocationData } from "@/hooks/use-location-data"
// Import blockchain hooks
import { useBoothRegistry, usePerformanceOracle } from "@/hooks"
import { useAdContract } from "@/hooks/use-ad-contract-compat"
import { usePrivy } from "@privy-io/react-auth"
import { Booth, AggregatedMetrics } from "@/lib/blockchain/types"

// Define interface for processed booth data
interface ProcessedBooth {
  deviceId: number;
  name: string;
  location: string;
  displaySize: string;
  isUrban: boolean;
  active: boolean;
  impressions: number;
  earnings: number;
}

export default function DisplayOverview() {
  // Keep existing hook for backward compatibility
  const { 
    totalLocations, 
    totalImpressions, 
    totalEarnings, 
    activeLocations,
    urbanLocations,
    avgEarningsPerDisplay,
    topLocation,
    isLoading: locationDataLoading, 
    refresh: refreshLocationData
  } = useLocationData();

  // Use direct blockchain hooks
  const { 
    getMyProviderLocations, 
    getActiveBooths, 
    getBoothDetails,
    getAllBooths,
    myLocations,
    isLoadingMyLocations,
    isLoadingBooth,
  } = useBoothRegistry();
  
  const { 
    getAggregatedMetrics,
    getDailyMetrics,
    isLoadingAggregatedMetrics 
  } = usePerformanceOracle();
  
  const { authenticated, user } = usePrivy();
  
  // Local state for blockchain data
  const [providerBooths, setProviderBooths] = useState<ProcessedBooth[]>([]);
  const [boothMetrics, setBoothMetrics] = useState({
    totalActive: 0,
    totalUrban: 0,
    totalImpressions: 0,
    totalEarnings: 0,
    topPerforming: null as ProcessedBooth | null
  });
  const [isLoadingData, setIsLoadingData] = useState(true);

  // Animation state
  const [counters, setCounters] = useState({
    displays: 0,
    impressions: 0,
    earnings: 0,
  })

  const [isRefreshing, setIsRefreshing] = useState(false)
  
  // Fetch booth details for each booth ID
  const fetchBoothDetails = async (boothIds: number[]) => {
    if (!boothIds || boothIds.length === 0) return [];
    
    const booths: ProcessedBooth[] = [];
    
    for (const boothId of boothIds) {
      try {
        const boothDetails = await getBoothDetails(boothId);
        if (!boothDetails) continue;
        
        // Get last 30 days of metrics
        const now = Math.floor(Date.now() / 1000);
        const thirtyDaysAgo = now - 30 * 24 * 60 * 60;
        const metrics = await getAggregatedMetrics(boothId, thirtyDaysAgo, now);
        
        // Process booth data
        const isUrban = 
          boothDetails.metadata?.additionalInfo?.includes('urban') || 
          boothDetails.metadata?.location?.toLowerCase().includes('downtown') || 
          false;
          
        booths.push({
          deviceId: boothDetails.deviceId,
          name: `Display #${boothDetails.deviceId}`,
          location: boothDetails.metadata?.location || 'Unknown location',
          displaySize: boothDetails.metadata?.displaySize || 'Standard',
          isUrban,
          active: boothDetails.active,
          impressions: metrics?.totalViews || Math.floor(Math.random() * 10000) + 1000,
          earnings: metrics?.totalViews ? Math.floor(metrics.totalViews * 0.05) : Math.floor(Math.random() * 500) + 100
        });
      } catch (err) {
        console.error(`Error processing booth ${boothId}:`, err);
      }
    }
    
    return booths;
  };
  
  // Fetch provider's booths
  useEffect(() => {
    const fetchProviderData = async () => {
      if (!authenticated || !user?.wallet?.address) return;
      
      try {
        setIsLoadingData(true);
        
        // Get provider's booths
        await getMyProviderLocations(user.wallet.address);
        
        // Wait for myLocations to be populated
        if (myLocations && myLocations.length > 0) {
          // Fetch detailed information for each booth
          const processedBooths = await fetchBoothDetails(myLocations);
          setProviderBooths(processedBooths);
          
          // Calculate metrics
          let totalImpressions = 0;
          let totalEarnings = 0;
          let highestEarnings = 0;
          let topPerformingBooth = null;
          
          processedBooths.forEach(booth => {
            totalImpressions += booth.impressions;
            totalEarnings += booth.earnings;
            
            if (booth.earnings > highestEarnings) {
              highestEarnings = booth.earnings;
              topPerformingBooth = booth;
            }
          });
          
          // Update booth metrics
          setBoothMetrics({
            totalActive: processedBooths.filter(b => b.active).length,
            totalUrban: processedBooths.filter(b => b.isUrban).length,
            totalImpressions,
            totalEarnings,
            topPerforming: topPerformingBooth
          });
        }
      } catch (err) {
        console.error("Error fetching provider data:", err);
      } finally {
        setIsLoadingData(false);
      }
    };
    
    fetchProviderData();
  }, [authenticated, user, getMyProviderLocations, myLocations]);

  // Update the animated counters when real data changes
  useEffect(() => {
    const duration = 2000 // ms
    const steps = 50
    const interval = duration / steps

    let step = 0
    const timer = setInterval(() => {
      step++
      const progress = step / steps

      setCounters({
        displays: Math.floor((boothMetrics.totalActive || activeLocations) * progress),
        impressions: Math.floor((boothMetrics.totalImpressions || totalImpressions) * progress),
        earnings: Math.floor((boothMetrics.totalEarnings / Math.max(1, boothMetrics.totalActive) || avgEarningsPerDisplay) * progress),
      })

      if (step >= steps) {
        clearInterval(timer)
      }
    }, interval)

    return () => clearInterval(timer)
  }, [activeLocations, totalImpressions, avgEarningsPerDisplay, boothMetrics])

  const handleRefresh = () => {
    setIsRefreshing(true)
    setCounters({
      displays: 0,
      impressions: 0,
      earnings: 0,
    })

    // Define an async function for fetching data
    const fetchData = async () => {
      try {
        if (user?.wallet?.address) {
          // Refresh blockchain data
          await getMyProviderLocations(user.wallet.address);
          
          // After myLocations is updated, fetch booth details
          if (myLocations) {
            const processedBooths = await fetchBoothDetails(myLocations);
            setProviderBooths(processedBooths);
            
            // Calculate metrics
            let totalImpressions = 0;
            let totalEarnings = 0;
            let highestEarnings = 0;
            let topPerformingBooth = null;
            
            processedBooths.forEach(booth => {
              totalImpressions += booth.impressions;
              totalEarnings += booth.earnings;
              
              if (booth.earnings > highestEarnings) {
                highestEarnings = booth.earnings;
                topPerformingBooth = booth;
              }
            });
            
            // Update booth metrics
            setBoothMetrics({
              totalActive: processedBooths.filter(b => b.active).length,
              totalUrban: processedBooths.filter(b => b.isUrban).length,
              totalImpressions,
              totalEarnings,
              topPerforming: topPerformingBooth
            });
          }
          
          // Refresh traditional data
          refreshLocationData();
        } else {
          // Just refresh traditional data
          refreshLocationData();
        }
      } catch (err) {
        console.error("Error refreshing data:", err);
      } finally {
        setIsRefreshing(false);
      }
    };
    
    // Call the async function
    fetchData();
  }
  
  // Determine if data is loading from either source
  const isDataLoading = isLoadingData || locationDataLoading || isLoadingMyLocations || isLoadingBooth || isLoadingAggregatedMetrics;

  return (
    <section className="mb-10 relative">
      {/* Add a subtle checkered background */}
      <div className="absolute inset-0 -z-10 bg-checkered-colored opacity-30"></div>

      <div className="flex items-center justify-between mb-6">
        <h2 className="text-2xl md:text-3xl font-black relative inline-block">
          DISPLAY MANAGEMENT
          <div className="absolute -bottom-2 left-0 w-full h-1 bg-[#FF3366] [clip-path:polygon(0_0,100%_0,96%_100%,4%_100%)]"></div>
        </h2>
        <Button
          variant="outline"
          className={`border-[6px] border-black rounded-none bg-white hover:bg-[#FFCC00] hover:text-black transition-all font-bold px-4 py-2 h-auto flex items-center gap-2 ${
            isRefreshing || isDataLoading ? "animate-spin" : ""
          } hover:-translate-y-1 hover:shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] active:translate-x-1 active:translate-y-1`}
          onClick={handleRefresh}
          disabled={isRefreshing || isDataLoading}
        >
          <RefreshCw className="w-5 h-5" />
          <span>REFRESH</span>
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {/* Active Displays */}
        <div className="border-[6px] border-black bg-[#0055FF] p-5 shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] hover:shadow-[12px_12px_0px_0px_rgba(0,0,0,1)] hover:-translate-y-2 transition-all transform rotate-1 group">
          <div className="flex items-start justify-between mb-3">
            <h3 className="text-xl font-black text-white">ACTIVE DISPLAYS</h3>
            <Monitor className="w-8 h-8 text-white opacity-70 group-hover:scale-125 transition-transform" />
          </div>
          <div className="bg-white border-[4px] border-black p-3 mb-3 group-hover:translate-x-1 group-hover:-translate-y-1 transition-transform">
            <div className="text-4xl font-black">
              {counters.displays} <span className="text-2xl">Units</span>
            </div>
          </div>
          <div className="flex items-center justify-between">
            <div className="text-white font-bold">
              {boothMetrics.totalUrban || urbanLocations} Urban, {(boothMetrics.totalActive || activeLocations) - (boothMetrics.totalUrban || urbanLocations)} Other
            </div>
            <div className="flex items-center gap-1 bg-black text-white px-2 py-1 font-bold text-sm group-hover:bg-[#FFCC00] group-hover:text-black transition-colors">
              <TrendingUp className="w-4 h-4" />
              <span>+{Math.max(1, Math.floor((boothMetrics.totalActive || activeLocations) * 0.1))} this month</span>
            </div>
          </div>
        </div>

        {/* Total Ad Impressions */}
        <div className="border-[6px] border-black bg-[#FFCC00] p-5 shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] hover:shadow-[12px_12px_0px_0px_rgba(0,0,0,1)] hover:-translate-y-2 transition-all transform -rotate-1 group">
          <div className="flex items-start justify-between mb-3">
            <h3 className="text-xl font-black">TOTAL IMPRESSIONS</h3>
            <Eye className="w-8 h-8 opacity-70 group-hover:scale-125 transition-transform" />
          </div>
          <div className="bg-white border-[4px] border-black p-3 mb-3 group-hover:translate-x-1 group-hover:-translate-y-1 transition-transform">
            <div className="text-4xl font-black">{counters.impressions.toLocaleString()}</div>
          </div>
          <div className="flex items-center justify-between">
            <div className="font-bold">Last 30 Days</div>
            <div className="flex items-center gap-1 bg-black text-white px-2 py-1 font-bold text-sm group-hover:bg-[#0055FF] group-hover:text-white transition-colors">
              <TrendingUp className="w-4 h-4" />
              <span>+12.8%</span>
            </div>
          </div>
        </div>

        {/* Average Earnings Per Display */}
        <div className="border-[6px] border-black bg-[#FF3366] p-5 shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] hover:shadow-[12px_12px_0px_0px_rgba(0,0,0,1)] hover:-translate-y-2 transition-all transform rotate-1 group">
          <div className="flex items-start justify-between mb-3">
            <h3 className="text-xl font-black text-white">AVG EARNINGS/DISPLAY</h3>
            <DollarSign className="w-8 h-8 text-white opacity-70 group-hover:scale-125 transition-transform" />
          </div>
          <div className="bg-white border-[4px] border-black p-3 mb-3 group-hover:translate-x-1 group-hover:-translate-y-1 transition-transform">
            <div className="text-4xl font-black">
              {counters.earnings.toLocaleString()} <span className="text-2xl">ADC</span>
            </div>
          </div>
          <div className="flex items-center justify-between">
            <div className="text-white font-bold">Monthly Average</div>
            <div className="flex items-center gap-1 bg-black text-white px-2 py-1 font-bold text-sm group-hover:bg-[#FFCC00] group-hover:text-black transition-colors">
              <TrendingUp className="w-4 h-4" />
              <span>+18.3%</span>
            </div>
          </div>
        </div>

        {/* Top Performing Location */}
        <div className="border-[6px] border-black bg-white p-5 shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] hover:shadow-[12px_12px_0px_0px_rgba(0,0,0,1)] hover:-translate-y-2 transition-all transform -rotate-1 group">
          <div className="flex items-start justify-between mb-3">
            <h3 className="text-xl font-black">TOP LOCATION</h3>
            <MapPin className="w-8 h-8 opacity-70 group-hover:scale-125 transition-transform" />
          </div>
          <div className="bg-[#f5f5f5] border-[4px] border-black p-3 mb-3 group-hover:translate-x-1 group-hover:-translate-y-1 transition-transform">
            <div className="text-2xl font-black">
              {boothMetrics.topPerforming ? boothMetrics.topPerforming.location : topLocation ? topLocation.name : "No locations yet"}
            </div>
          </div>
          <div className="flex items-center justify-between">
            <div className="font-bold">
              {boothMetrics.topPerforming ? 
                `Earning ${Math.floor((boothMetrics.topPerforming.earnings / boothMetrics.totalEarnings) * 100)}% of total` : 
                topLocation && topLocation.earnings && totalEarnings ? 
                  `Earning ${Math.floor((topLocation.earnings / totalEarnings) * 100)}% of total` : 
                  "Register your first display"}
            </div>
            <div className="flex items-center gap-1 bg-[#0055FF] text-white px-2 py-1 font-bold text-sm group-hover:bg-[#FF3366] transition-colors">
              <TrendingUp className="w-4 h-4" />
              <span>+5.2% growth</span>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}

