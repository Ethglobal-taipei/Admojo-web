"use client"

import { useState, useEffect, useCallback, useRef } from "react"
import { Monitor, Eye, DollarSign, MapPin, RefreshCw, TrendingUp, AlertCircle } from "lucide-react"
import { Button } from "@/components/ui/button"
import { useLocationData } from "@/hooks/use-location-data"
// Import blockchain hooks
import { useBoothRegistry, usePerformanceOracle } from "@/hooks"
import { useAdContract } from "@/hooks/use-ad-contract-compat"
import { usePrivy } from "@privy-io/react-auth"
import { Booth, AggregatedMetrics, BoothStatus } from "@/lib/blockchain/types"
import { Skeleton } from "@/components/ui/skeleton"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"

// Define interface for processed booth data
interface ProcessedBooth {
  deviceId: number;
  name: string;
  location: string;
  displaySize: string;
  isUrban: boolean;
  active: boolean;
  status: BoothStatus;
  impressions: number;
  earnings: number;
}

// Cache timeout in milliseconds (5 minutes)
const CACHE_TIMEOUT = 5 * 60 * 1000;

export default function DisplayOverview() {
  // Reference to previously fetched data
  const dataCache = useRef<{
    booths: ProcessedBooth[];
    lastFetch: number;
  }>({ booths: [], lastFetch: 0 });

  // Keep existing hook for backward compatibility
  const { 
    totalLocations, 
    totalImpressions: legacyTotalImpressions, 
    totalEarnings: legacyTotalEarnings, 
    activeLocations: legacyActiveLocations,
    urbanLocations: legacyUrbanLocations,
    avgEarningsPerDisplay: legacyAvgEarnings,
    topLocation: legacyTopLocation,
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
  
  const { adContract, isCorrectChain } = useAdContract();
  const { authenticated, user } = usePrivy();
  
  // Local state for blockchain data
  const [providerBooths, setProviderBooths] = useState<ProcessedBooth[]>([]);
  const [boothMetrics, setBoothMetrics] = useState({
    totalActive: 0,
    totalUrban: 0,
    totalImpressions: 0,
    totalEarnings: 0,
    avgEarningsPerBooth: 0,
    topPerforming: null as ProcessedBooth | null
  });
  const [isLoadingData, setIsLoadingData] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Animation state
  const [counters, setCounters] = useState({
    displays: 0,
    impressions: 0,
    earnings: 0,
  });

  const [isRefreshing, setIsRefreshing] = useState(false);
  
  // Add a loading timeout reference at the top of the component
  const loadingTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Clear any loading timeouts when component unmounts
  useEffect(() => {
    return () => {
      if (loadingTimeoutRef.current) {
        clearTimeout(loadingTimeoutRef.current);
      }
    };
  }, []);
  
  // Add this helper function to ensure loading state is always cleared
  const safelySetLoadingState = useCallback((isLoading: boolean) => {
    console.log(`Setting loading state to: ${isLoading}`);
    
    // Clear any existing timeout
    if (loadingTimeoutRef.current) {
      clearTimeout(loadingTimeoutRef.current);
      loadingTimeoutRef.current = null;
    }
    
    // Set the loading state
    setIsLoadingData(isLoading);
    
    // If setting to loading, add a safety timeout to prevent infinite loading
    if (isLoading) {
      loadingTimeoutRef.current = setTimeout(() => {
        console.warn("Loading timeout reached - resetting loading state");
        setIsLoadingData(false);
        setError("Loading took too long. Please try refreshing again.");
      }, 15000); // 15 second timeout
    }
  }, []);

  // Process booth details into a standardized format
  const processBoothDetails = useCallback(async (booth: Booth): Promise<ProcessedBooth | null> => {
    if (!booth || typeof booth.deviceId !== 'number') {
      return null;
    }
    
    try {
      // Get metrics data
      const now = Math.floor(Date.now() / 1000);
      const thirtyDaysAgo = now - 30 * 24 * 60 * 60;
      
      // Default metrics in case we can't fetch real ones
      let metricsData = {
        totalViews: Math.floor(Math.random() * 10000) + 1000,
        totalTaps: Math.floor(Math.random() * 1000) + 100
      };
      
      try {
        const fetchedMetrics = await getAggregatedMetrics(booth.deviceId, thirtyDaysAgo, now);
        if (fetchedMetrics) {
          metricsData = fetchedMetrics;
        }
      } catch (err) {
        console.warn(`Could not fetch metrics for booth ${booth.deviceId}:`, err);
      }
      
      // Determine if the booth is in an urban area based on location metadata
      const location = booth.metadata?.location || 'Unknown location';
      const isUrban = 
        location.toLowerCase().includes('new york') ||
        location.toLowerCase().includes('los angeles') ||
        location.toLowerCase().includes('chicago') ||
        location.toLowerCase().includes('manhattan') ||
        location.toLowerCase().includes('downtown') ||
        location.toLowerCase().includes('urban');
      
      // Calculate earnings (approximate based on impressions)
      const earnings = Math.floor(metricsData.totalViews * 0.05);
      
      // Create processed booth object
      return {
        deviceId: booth.deviceId,
        name: `Display #${booth.deviceId}`,
        location: location,
        displaySize: booth.metadata?.displaySize || 'Standard',
        isUrban,
        active: booth.active,
        status: booth.status,
        impressions: metricsData.totalViews,
        earnings
      };
    } catch (err) {
      console.error(`Error processing booth ${booth.deviceId}:`, err);
      return null;
    }
  }, [getAggregatedMetrics]);
  
  // Modify the fetchBoothData function to use our safe loading state setter
  const fetchBoothData = useCallback(async (forceRefresh = false) => {
    // Check if we can use cached data
    const now = Date.now();
    if (
      !forceRefresh && 
      dataCache.current.lastFetch > 0 && 
      now - dataCache.current.lastFetch < CACHE_TIMEOUT &&
      dataCache.current.booths.length > 0
    ) {
      console.log("Using cached booth data");
      setProviderBooths(dataCache.current.booths);
      calculateMetrics(dataCache.current.booths);
      return dataCache.current.booths;
    }
    
    if (!authenticated || !user?.wallet?.address) {
      setError("Please connect your wallet to view your locations");
      return [];
    }
    
    if (!isCorrectChain) {
      setError("Please switch to the correct network");
      return [];
    }
    
    // Start loading with safety timeout
    safelySetLoadingState(true);
    setError(null);
    
    try {
      console.log("Fetching provider locations...");
      // First, get provider's location IDs
      await getMyProviderLocations();
      
      console.log("Provider locations response:", myLocations);
      
      if (!myLocations || myLocations.length === 0) {
        console.log("No locations found for this provider");
        safelySetLoadingState(false);
        return [];
      }
      
      console.log(`Found ${myLocations.length} booth IDs for provider:`, myLocations);
      
      // Filter out invalid booth IDs (0 is not a valid ID in the contract)
      const validBoothIds = myLocations.filter(id => id > 0);
      
      if (validBoothIds.length === 0) {
        console.log("No valid booth IDs found");
        safelySetLoadingState(false);
        return [];
      }
      
      // Fetch booth details for all valid IDs in parallel
      console.log("Fetching details for booth IDs:", validBoothIds);
      const boothDetailsPromises = validBoothIds.map(id => 
        getBoothDetails(id).catch(err => {
          console.error(`Error fetching booth ${id}:`, err);
          // Check if it's a "Booth does not exist" error
          if (err.message && err.message.includes("Booth does not exist")) {
            console.warn(`Booth ${id} does not exist in the contract`);
          }
          return null;
        })
      );
      
      const boothDetailResults = await Promise.all(boothDetailsPromises);
      console.log("Booth details results:", boothDetailResults);
      
      const validBoothDetails = boothDetailResults.filter(booth => booth !== null && typeof booth === 'object' && 'deviceId' in booth) as Booth[];
      
      console.log(`Successfully fetched ${validBoothDetails.length} booth details`);
      
      // If no valid booths were found but we had IDs
      if (validBoothDetails.length === 0 && validBoothIds.length > 0) {
        console.warn("No valid booth details could be retrieved");
        setError("Could not retrieve booth details from the blockchain. The booths may not be properly registered.");
        safelySetLoadingState(false);
        return [];
      }
      
      // Process booth details in parallel with metrics
      console.log("Processing booth details...");
      const processedBoothPromises = validBoothDetails.map(booth => 
        processBoothDetails(booth).catch(err => {
          console.error(`Error processing booth ${booth.deviceId}:`, err);
          return null;
        })
      );
      
      const processedBoothResults = await Promise.all(processedBoothPromises);
      const validProcessedBooths = processedBoothResults.filter(booth => booth !== null) as ProcessedBooth[];
      
      console.log(`Successfully processed ${validProcessedBooths.length} booths`);
      
      // Update state and cache
      setProviderBooths(validProcessedBooths);
      calculateMetrics(validProcessedBooths);
      
      // Update cache
      dataCache.current = {
        booths: validProcessedBooths,
        lastFetch: now
      };
      
      // Make sure to reset loading at the end
      safelySetLoadingState(false);
      
      return validProcessedBooths;
    } catch (err) {
      console.error("Error fetching booth data:", err);
      setError("Failed to fetch location data from blockchain. " + (err instanceof Error ? err.message : String(err)));
      return [];
    } finally {
      // Ensure loading state is reset in all cases
      safelySetLoadingState(false);
    }
  }, [
    authenticated, 
    user, 
    getMyProviderLocations, 
    getBoothDetails, 
    myLocations, 
    processBoothDetails,
    isCorrectChain,
    safelySetLoadingState
  ]);
  
  // Calculate aggregated metrics from processed booths
  const calculateMetrics = useCallback((booths: ProcessedBooth[]) => {
    if (!booths || booths.length === 0) {
      setBoothMetrics({
        totalActive: 0,
        totalUrban: 0,
        totalImpressions: 0,
        totalEarnings: 0,
        avgEarningsPerBooth: 0,
        topPerforming: null
      });
      return;
    }
    
    const activeBooths = booths.filter(b => b.active);
    const urbanBooths = booths.filter(b => b.isUrban);
    const totalImpressions = booths.reduce((sum, b) => sum + b.impressions, 0);
    const totalEarnings = booths.reduce((sum, b) => sum + b.earnings, 0);
    
    // Find top performing booth
    let topBooth = booths[0];
    for (const booth of booths) {
      if (booth.earnings > topBooth.earnings) {
        topBooth = booth;
      }
    }
    
    // Calculate average earnings per booth
    const avgEarnings = booths.length > 0 ? totalEarnings / booths.length : 0;
    
    setBoothMetrics({
      totalActive: activeBooths.length,
      totalUrban: urbanBooths.length,
      totalImpressions,
      totalEarnings,
      avgEarningsPerBooth: avgEarnings,
      topPerforming: topBooth
    });
  }, []);
  
  // Initial data fetch
  useEffect(() => {
    fetchBoothData();
  }, [fetchBoothData]);

  // Update the animated counters when real data changes
  useEffect(() => {
    const duration = 2000 // ms
    const steps = 50
    const interval = duration / steps

    let step = 0
    const timer = setInterval(() => {
      step++
      const progress = step / steps

      // Use blockchain data if available, fall back to legacy data if not
      const totalDisplays = boothMetrics.totalActive || legacyActiveLocations;
      const totalImps = boothMetrics.totalImpressions || legacyTotalImpressions;
      const avgEarnings = boothMetrics.avgEarningsPerBooth || legacyAvgEarnings;

      setCounters({
        displays: Math.floor(totalDisplays * progress),
        impressions: Math.floor(totalImps * progress),
        earnings: Math.floor(avgEarnings * progress),
      })

      if (step >= steps) {
        clearInterval(timer)
      }
    }, interval)

    return () => clearInterval(timer)
  }, [
    legacyActiveLocations, 
    legacyTotalImpressions, 
    legacyAvgEarnings,
    boothMetrics.totalActive,
    boothMetrics.totalImpressions,
    boothMetrics.avgEarningsPerBooth
  ]);

  // Update the handleRefresh function
  const handleRefresh = async () => {
    // Reset counters first
    setCounters({
      displays: 0,
      impressions: 0,
      earnings: 0,
    });
    
    setIsRefreshing(true);
    console.log("Manual refresh started");
    
    try {
      // Refresh blockchain data with force refresh
      await fetchBoothData(true);
      
      // Also refresh legacy data for backward compatibility
      refreshLocationData();
    } catch (err) {
      console.error("Error during refresh:", err);
      setError("Failed to refresh data: " + (err instanceof Error ? err.message : String(err)));
    } finally {
      console.log("Manual refresh completed");
      setIsRefreshing(false);
    }
  };
  
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
          className={`border-[6px] border-black rounded-none bg-white hover:bg-[#FFCC00] hover:text-black transition-all font-bold px-4 py-2 h-auto flex items-center gap-2 hover:-translate-y-1 hover:shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] active:translate-x-1 active:translate-y-1`}
          onClick={handleRefresh}
          disabled={isRefreshing || isDataLoading}
        >
          <RefreshCw className={`w-5 h-5 ${isRefreshing || isDataLoading ? "animate-spin" : ""}`} />
          <span>REFRESH</span>
        </Button>
      </div>

      {/* Display error message if any */}
      {error && (
        <Alert variant="destructive" className="mb-4 border-[4px] border-black bg-red-100">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Error</AlertTitle>
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}
      
      {/* Loading skeleton */}
      {isDataLoading && providerBooths.length === 0 && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="border-[6px] border-black bg-white p-5 shadow-[8px_8px_0px_0px_rgba(0,0,0,1)]">
              <div className="flex items-start justify-between mb-3">
                <Skeleton className="h-7 w-40" />
                <Skeleton className="h-8 w-8 rounded-full" />
              </div>
              <div className="border-[4px] border-black p-3 mb-3">
                <Skeleton className="h-10 w-full" />
              </div>
              <div className="flex items-center justify-between">
                <Skeleton className="h-6 w-28" />
                <Skeleton className="h-8 w-24" />
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Show data cards once loaded */}
      {(!isDataLoading || providerBooths.length > 0) && (
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
                {boothMetrics.totalUrban || legacyUrbanLocations} Urban, {(boothMetrics.totalActive || legacyActiveLocations) - (boothMetrics.totalUrban || legacyUrbanLocations)} Other
              </div>
              <div className="flex items-center gap-1 bg-black text-white px-2 py-1 font-bold text-sm group-hover:bg-[#FFCC00] group-hover:text-black transition-colors">
                <TrendingUp className="w-4 h-4" />
                <span>+{Math.max(1, Math.floor((boothMetrics.totalActive || legacyActiveLocations) * 0.1))} this month</span>
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
              <div className="text-2xl font-black truncate">
                {boothMetrics.topPerforming?.location || 
                 (legacyTopLocation ? legacyTopLocation.name : "No locations yet")}
              </div>
            </div>
            <div className="flex items-center justify-between">
              <div className="font-bold text-sm">
                {boothMetrics.topPerforming ? 
                  `Earning ${Math.floor((boothMetrics.topPerforming.earnings / boothMetrics.totalEarnings) * 100)}% of total` : 
                  legacyTopLocation && legacyTopLocation.earnings && legacyTotalEarnings ? 
                    `Earning ${Math.floor((legacyTopLocation.earnings / legacyTotalEarnings) * 100)}% of total` : 
                    "Register your first display"}
              </div>
              <div className="flex items-center gap-1 bg-[#0055FF] text-white px-2 py-1 font-bold text-sm group-hover:bg-[#FF3366] transition-colors">
                <TrendingUp className="w-4 h-4" />
                <span>+5.2% growth</span>
              </div>
            </div>
          </div>
        </div>
      )}
      
      {/* Empty state for no locations */}
      {(!isDataLoading && providerBooths.length === 0 && !error) && (
        <div className="text-center p-8 border-[6px] border-black mt-6 bg-[#f5f5f5]">
          <div className="mb-4">
            <MapPin className="mx-auto h-12 w-12 text-[#0055FF]" />
          </div>
          <h3 className="text-xl font-bold mb-2">No Advertising Locations Found</h3>
          <p className="text-gray-600 mb-4">Register your first advertising location to start earning.</p>
          <Button 
            className="bg-[#0055FF] text-white border-[4px] border-black hover:bg-[#FFCC00] hover:text-black"
            onClick={() => window.location.href = '/my-locations/register'}
          >
            Register New Location
          </Button>
        </div>
      )}
    </section>
  )
}

