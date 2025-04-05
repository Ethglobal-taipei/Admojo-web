"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { usePrivy } from "@privy-io/react-auth";
import { useAdContract } from "./use-ad-contract-compat";
import { BoothStatus , BoothMetadata } from "@/lib/blockchain";
// Helper function to convert string to 0x prefixed string
function toHexString(value: string): `0x${string}` {
  if (!value.startsWith('0x')) {
    return `0x${value}` as `0x${string}`;
  }
  return value as `0x${string}`;
}

export type LocationData = {
  id: string;
  name: string;
  city?: string;
  area?: string;
  address?: string;
  deviceId: number;
  displayType?: string;
  displaySize?: string;
  dailyTraffic?: number;
  pricePerDay: number | string;
  isActive: boolean;
  status: string;
  owner?: string;
  impressions?: number;
  earnings?: number;
  campaigns?: number;
  coordinates?: { lat: number; lng: number };
  images?: string[];
  metadata?: any;
  description?: string;
};

// Cache timeout in milliseconds (5 minutes)
const CACHE_TIMEOUT = 5 * 60 * 1000;

// Status map for booth status
const BOOTH_STATUS_MAP = {
  [BoothStatus.Unbooked]: "UNBOOKED",
  [BoothStatus.Booked]: "BOOKED",
  [BoothStatus.UnderMaintenance]: "UNDER_MAINTENANCE"
};

export function useLocationData() {
  const { adContract, isCorrectChain } = useAdContract();
  const { authenticated, user } = usePrivy();
  const [locations, setLocations] = useState<LocationData[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  const [totalImpressions, setTotalImpressions] = useState(0);
  const [totalEarnings, setTotalEarnings] = useState(0);
  const [lastFetchTime, setLastFetchTime] = useState<number>(0);
  const [retryCount, setRetryCount] = useState(0);
  
  // Use refs to prevent unnecessary re-renders
  const locationsRef = useRef<LocationData[]>([]);

  // Function to fetch locations directly from blockchain
  const fetchLocations = useCallback(async (forceRefresh = false) => {
    // If data was fetched recently and not forcing refresh, use the cached data
    const now = Date.now();
    if (!forceRefresh && lastFetchTime > 0 && now - lastFetchTime < CACHE_TIMEOUT) {
      console.log("Using cached location data");
      return;
    }
    
    try {
      setIsLoading(true);
      setError(null);
      
      // If user is authenticated and contract is available, fetch directly from blockchain
      if (authenticated && user?.wallet?.address && adContract && isCorrectChain) {
        console.log("Fetching locations directly from blockchain...");
        
        let allLocations: LocationData[] = [];
        
        try {
          // First try to get active locations that are available for booking
          const activeDeviceIds = await adContract.boothRegistry.getActiveLocations();
          
          // Also get all active locations regardless of booking status
          const allActiveBoothIds = await adContract.boothRegistry.getActiveLocations();
          
          // Combine both sets of IDs, removing duplicates
          const deviceIdsSet = new Set([...activeDeviceIds, ...allActiveBoothIds]);
          const deviceIds = Array.from(deviceIdsSet);
          console.log(`Found ${deviceIds.length} device IDs from blockchain`);
          
          if (deviceIds.length > 0) {
            // Fetch details for each location directly from blockchain
            try {
              // Properly handle API expectations - if it expects a single ID, we'll fetch one by one
              // If it accepts an array, we'll pass the array
              let fetchedBooths: any[] = [];
              
              // Check if the getBoothDetails method exists and what type it expects
              if (typeof adContract.boothRegistry.getBoothDetails === 'function') {
                try {
                  // Try to fetch all at once (if API supports arrays)
                  fetchedBooths = await adContract.boothRegistry.getBoothDetails(deviceIds);
                  console.log(`Fetched ${fetchedBooths.length} booth details at once`);
                } catch (batchError) {
                  console.warn("Batch fetch failed, trying individual fetches:", batchError);
                  
                  // If batch fetch fails, try individual fetches
                  const boothPromises = deviceIds.map(id => 
                    adContract.boothRegistry.getBoothDetails(id)
                      .catch(e => {
                        console.error(`Failed to fetch booth ${id}:`, e);
                        return null;
                      })
                  );
                  fetchedBooths = (await Promise.all(boothPromises)).filter(Boolean);
                  console.log(`Fetched ${fetchedBooths.length} booth details individually`);
                }
              } else {
                console.error("getBoothDetails method not found on boothRegistry");
                throw new Error("Contract method not available");
              }
              
              // Convert booth data to LocationData format - handle both array and single object responses
              const processBoothData = async (booth: any) => {
                if (!booth) return null;
                
                try {
                  // Generate/fetch metrics for each location
                  let impressions = Math.floor(Math.random() * 100000) + 5000;
                  let earnings = Math.floor(Math.random() * 500) + 50;
                  let deviceId = booth.deviceId;
                  
                  // Ensure we have a valid device ID
                  if (deviceId === undefined && booth.id !== undefined) {
                    deviceId = booth.id;
                  }
                  
                  if (deviceId === undefined) {
                    console.error("Missing device ID in booth data:", booth);
                    return null;
                  }
                  
                  // Try to get real metrics if available
                  try {
                    const today = new Date();
                    const dailyMetrics = await adContract.performanceOracle.getDailyMetrics(deviceId, today);
                    impressions = dailyMetrics.totalViews;
                    earnings = Math.floor(impressions * 0.05); // Approximate earnings based on views
                  } catch (metricsError) {
                    console.warn(`Couldn't fetch metrics for device ${deviceId}, using simulated data`, metricsError);
                  }
                  
                  // Safely handle metadata
                  const metadata = (booth.metadata || {}) as Partial<BoothMetadata>;
                  
                  // Get status as string - safely handle potential undefined status
                  let statusString = "UNKNOWN";
                  if (booth.status !== undefined && typeof booth.status === 'number' && 
                      booth.status >= 0 && booth.status <= 2) {
                    statusString = BOOTH_STATUS_MAP[booth.status as BoothStatus];
                  }
                  
                  // Get campaigns count if possible
                  let campaignsCount = 0;
                  try {
                    const deviceCampaigns = await adContract.boothRegistry.getCampaignLocations(deviceId);
                    campaignsCount = Array.isArray(deviceCampaigns) ? deviceCampaigns.length : 0;
                  } catch (campaignsError) {
                    console.warn(`Couldn't fetch campaigns for device ${deviceId}`, campaignsError);
                    campaignsCount = Math.floor(Math.random() * 10) + 1; // Fallback
                  }
                  
                  // Create location object
                  return {
                    id: String(deviceId),
                    deviceId: deviceId,
                    name: getLocationName(metadata as BoothMetadata, deviceId),
                    city: getCity(metadata as BoothMetadata),
                    area: getArea(metadata as BoothMetadata),
                    address: metadata.location || "Unknown location",
                    displayType: metadata.displaySize?.includes("Large") ? "Billboard" : "Digital",
                    displaySize: metadata.displaySize || "Medium",
                    dailyTraffic: parseTrafficFromAdditionalInfo(metadata.additionalInfo),
                    pricePerDay: 100, // Default price
                    isActive: booth.active === true,
                    status: statusString,
                    owner: booth.owner,
                    impressions,
                    earnings,
                    campaigns: campaignsCount,
                    // Try to parse coordinates from additionalInfo
                    coordinates: parseCoordinates(metadata.additionalInfo),
                    description: `A ${metadata.displaySize || 'standard'} display located in ${metadata.location || 'an unknown area'}.`
                  };
                } catch (error) {
                  console.error(`Error processing booth data:`, error);
                  return null;
                }
              };
              
              // Process booth data, handling both array and single object responses
              let convertedLocations: (LocationData | null)[] = [];
              
              if (Array.isArray(fetchedBooths)) {
                convertedLocations = await Promise.all(fetchedBooths.map(processBoothData));
              } else if (fetchedBooths && typeof fetchedBooths === 'object') {
                // Handle case where API returned a single booth object
                const singleBooth = await processBoothData(fetchedBooths);
                convertedLocations = singleBooth ? [singleBooth] : [];
              }
              
              // Filter out null results (failed conversions)
              allLocations = convertedLocations.filter(Boolean) as LocationData[];
              console.log(`Successfully converted ${allLocations.length} locations`);
            } catch (detailsError) {
              console.error("Error fetching booth details:", detailsError);
            }
          }
          
          // If user is a provider, try to get their specific locations
          if (user?.wallet?.address) {
            try {
              // Convert wallet address to 0x format for API call
              const walletAddress = toHexString(user.wallet.address);
              const providerLocations = await adContract.boothRegistry.getProviderLocations(walletAddress);
              console.log(`Found ${providerLocations.length} locations owned by the current user`);
              
              // If we found provider locations, we'd process them here
              // For now, we're just logging them
            } catch (providerError) {
              console.warn("Error fetching provider locations:", providerError);
            }
          }
        } catch (contractError) {
          console.error("Error fetching from blockchain:", contractError);
          throw new Error(`Blockchain fetch error: ${contractError instanceof Error ? contractError.message : String(contractError)}`);
        }
        
        // Always update state regardless of whether locations were found
        // Calculate metrics (will be zero for empty array)
        const totalImp = allLocations.reduce((sum, loc) => sum + (loc.impressions || 0), 0);
        const totalEarn = allLocations.reduce((sum, loc) => sum + (loc.earnings || 0), 0);
        
        // Update state
        setLocations(allLocations);
        setTotalImpressions(totalImp);
        setTotalEarnings(totalEarn);
        
        // Update ref for direct access without re-renders
        locationsRef.current = allLocations;
        
        // Update last fetch time
        setLastFetchTime(now);
        // Reset retry count on success
        setRetryCount(0);
        
        if (allLocations.length === 0) {
          console.log("No locations found from blockchain");
          setError(new Error("No locations found. Try again later or contact support if the issue persists."));
        }
      } else {
        // Not authenticated or contract not ready, return empty locations array
        console.log("Cannot fetch locations: not authenticated or contract not ready");
        if (!authenticated) console.log("  - User not authenticated");
        if (!adContract) console.log("  - Contract not available");
        if (!isCorrectChain) console.log("  - Not on correct chain");
        
        // Set empty locations
        setLocations([]);
        locationsRef.current = [];
        setTotalImpressions(0);
        setTotalEarnings(0);
        
        // Also update last fetch time
        setLastFetchTime(now);
        
        // Set an error to inform the user why locations couldn't be fetched
        if (!authenticated) {
          setError(new Error("Please connect your wallet to view locations"));
        } else if (!isCorrectChain) {
          setError(new Error("Please switch to the correct network to view locations"));
        } else {
          setError(new Error("Contract not available. Please try again later."));
        }
      }
    } catch (err) {
      console.error("Error fetching locations:", err);
      
      // Increment retry count
      const newRetryCount = retryCount + 1;
      setRetryCount(newRetryCount);
      
      // Set more descriptive error
      let errorMessage = "Unknown error fetching locations";
      if (err instanceof Error) {
        errorMessage = err.message;
      } else if (typeof err === 'string') {
        errorMessage = err;
      }
      
      // If there was a previous successful fetch, keep using that data
      if (locationsRef.current.length > 0) {
        console.log("Error fetching, but using previously fetched data");
        // Still set error for UI feedback
        setError(new Error(`${errorMessage} (using cached data)`));
      } else {
        // Set empty locations when there's no previous data
        setLocations([]);
        locationsRef.current = [];
        setTotalImpressions(0);
        setTotalEarnings(0);
        setError(new Error(errorMessage));
      }
      
      // If we have fewer than 3 retries, automatically try again after a delay
      if (newRetryCount < 3) {
        console.log(`Auto-retrying fetch (attempt ${newRetryCount})`);
        // Exponential backoff: 2^retryCount * 1000ms
        const delay = Math.min(2 ** newRetryCount * 1000, 10000);
        setTimeout(() => fetchLocations(true), delay);
      }
    } finally {
      setIsLoading(false);
    }
  }, [authenticated, user, adContract, isCorrectChain, retryCount, lastFetchTime]);

  // Initial fetch on mount and when dependencies change
  useEffect(() => {
    fetchLocations();
  }, [fetchLocations]);
  
  // Helper functions to safely extract metadata properties
  function getLocationName(metadata: BoothMetadata, deviceId: number): string {
    try {
      // Try to extract name from various potential sources
      const locationStr = metadata.location || '';
      const displayStr = metadata.displaySize || '';
      
      // If location exists, use it to create a name
      if (locationStr) {
        const cityPart = locationStr.split(',')[0]?.trim();
        return cityPart ? `${cityPart} Display #${deviceId}` : `Location #${deviceId}`;
      }
      
      // Default name with display size if available
      return displayStr ? `${displayStr} Display #${deviceId}` : `Location #${deviceId}`;
    } catch (e) {
      return `Location #${deviceId}`;
    }
  }
  
  function getCity(metadata: BoothMetadata): string | undefined {
    try {
      return metadata.location?.split(',')[0]?.trim();
    } catch (e) {
      return undefined;
    }
  }
  
  function getArea(metadata: BoothMetadata): string | undefined {
    try {
      return metadata.location?.split(',')[1]?.trim();
    } catch (e) {
      return undefined;
    }
  }
  
  function parseTrafficFromAdditionalInfo(additionalInfo?: string): number | undefined {
    if (!additionalInfo) return undefined;
    
    try {
      const trafficMatch = additionalInfo.match(/traffic:(\d+)/);
      return trafficMatch ? parseInt(trafficMatch[1], 10) : undefined;
    } catch (e) {
      return undefined;
    }
  }
  
  // Helper function to parse coordinates from additionalInfo string
  function parseCoordinates(additionalInfo?: string): { lat: number; lng: number } | undefined {
    if (!additionalInfo) return undefined;
    
    try {
      const latMatch = additionalInfo.match(/lat:(-?\d+\.\d+)/);
      const lngMatch = additionalInfo.match(/lng:(-?\d+\.\d+)/);
      
      if (latMatch && lngMatch) {
        return {
          lat: parseFloat(latMatch[1]),
          lng: parseFloat(lngMatch[1])
        };
      }
      
      return undefined;
    } catch (e) {
      console.error("Error parsing coordinates:", e);
      return undefined;
    }
  }
  
  // Helper to safely find a location by ID
  const getLocationById = useCallback((id: string | number): LocationData | null => {
    // Convert to string for consistency
    const idStr = String(id);
    return locationsRef.current.find(loc => String(loc.id) === idStr) || null;
  }, []);

  // Find top performing location based on highest earnings with safe handling
  const topLocation = locations.length > 0 
    ? locations.reduce((prev, current) => {
        const prevEarnings = prev.earnings || 0;
        const currentEarnings = current.earnings || 0;
        return prevEarnings > currentEarnings ? prev : current;
      }) 
    : null;

  // Enhanced refresh function that properly handles state updates
  const refresh = useCallback(async () => {
    try {
      setIsLoading(true);
      console.log("Manually refreshing location data...");
      await fetchLocations(true); // Force refresh
      return true; // Indicate successful refresh
    } catch (error) {
      console.error("Error during manual refresh:", error);
      // The fetchLocations function will already set error state
      return false; // Indicate failed refresh
    }
  }, [fetchLocations]);

  return {
    locations,
    getLocationById,
    isLoading,
    error,
    totalLocations: locations.length,
    totalImpressions,
    totalEarnings,
    topLocation,
    lastFetchTime,
    // Add computed stats
    activeLocations: locations.filter(loc => loc.isActive).length,
    urbanLocations: locations.filter(loc => {
      const cityLower = (loc.city || "").toLowerCase();
      return cityLower.includes("new york") || 
             cityLower.includes("los angeles") ||
             cityLower.includes("chicago") ||
             cityLower.includes("san francisco");
    }).length,
    avgEarningsPerDisplay: locations.length > 0 ? totalEarnings / locations.length : 0,
    // Returns a map of count by displayType
    displayTypeBreakdown: locations.reduce((acc, loc) => {
      const type = (loc.displayType || "Other").toLowerCase();
      acc[type] = (acc[type] || 0) + 1;
      return acc;
    }, {} as Record<string, number>),
    refresh
  };
} 