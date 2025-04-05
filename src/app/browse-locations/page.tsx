"use client"

import { useState, useEffect, useCallback, useRef } from "react"
import { useRouter } from "next/navigation"
import { Search, Filter, MapPin, Plus, Check } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { useCampaignStore, useLocationStore } from "@/lib/store"
import { useBlockchainService } from "@/hooks/use-blockchain-service"
import { useBoothRegistry } from "@/hooks/use-booth-registry"
import { toast } from "@/lib/toast"
import { Location, getCoordinates, getLocationName, getStatusString } from "@/lib/store/useLocationStore"

export default function BrowseLocations() {
  const router = useRouter()
  const { service, address, isCorrectChain, switchChain } = useBlockchainService()
  
  // Get hooks for location data
  const locationStore = useLocationStore()
  const { 
    getAllBooths, 
    allBooths, 
    isLoadingAllBooths,
    getActiveBooths, 
    activeBooths,
    isLoadingActiveBooths,
    addLocationToCampaign, 
    isAddingLocation
  } = useBoothRegistry()
  
  const { 
    isSelectingLocations, 
    draftCampaign, 
    updateDraftCampaign, 
    finishLocationSelection 
  } = useCampaignStore()

  // Local state
  const [mounted, setMounted] = useState(false)
  const [searchTerm, setSearchTerm] = useState("")
  const [selectedFilter, setSelectedFilter] = useState("all")
  const [isBooking, setIsBooking] = useState(false)
  const [renderError, setRenderError] = useState<Error | null>(null)
  const [hasAttemptedRefresh, setHasAttemptedRefresh] = useState(false)
  const [locations, setLocations] = useState<Location[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<Error | null>(null)
  const [loadingProgress, setLoadingProgress] = useState(0)
  
  // Use refs to track state without triggering renders
  const locationsRef = useRef<Location[]>([])
  const processingRef = useRef(false)
  const fetchedRef = useRef(false)
  const processingTimeoutRef = useRef<NodeJS.Timeout | null>(null)

  // Cache constants
  const CACHE_KEY = 'ad-net-locations-cache';
  const CACHE_EXPIRY = 15 * 60 * 1000; // 15 minutes in milliseconds
  
  // Add helper functions to handle BigInt serialization for JSON
  const serializeBigInt = (data: any): any => {
    if (data === null || data === undefined) {
      return data;
    }
    
    if (typeof data === 'bigint') {
      return data.toString();
    }
    
    if (Array.isArray(data)) {
      return data.map(serializeBigInt);
    }
    
    if (typeof data === 'object') {
      const result: Record<string, any> = {};
      for (const key in data) {
        if (Object.prototype.hasOwnProperty.call(data, key)) {
          result[key] = serializeBigInt(data[key]);
        }
      }
      return result;
    }
    
    return data;
  };

  // Load cached data on mount
  const loadCachedData = useCallback(() => {
    if (typeof window === 'undefined') return null;
    
    try {
      const cachedData = localStorage.getItem(CACHE_KEY);
      if (!cachedData) return null;
      
      const { data, timestamp } = JSON.parse(cachedData);
      const isExpired = Date.now() - timestamp > CACHE_EXPIRY;
      
      if (isExpired) {
        localStorage.removeItem(CACHE_KEY);
        return null;
      }
      
      return data;
    } catch (err) {
      console.error('Error loading cached data:', err);
      return null;
    }
  }, []);
  
  // Modified save cache function
  const saveToCache = useCallback((data: Location[]) => {
    if (typeof window === 'undefined' || !data || data.length === 0) return;
    
    try {
      // Prepare data for caching by converting BigInt to strings
      const processedData = serializeBigInt(data);
      
      const cacheData = {
        data: processedData,
        timestamp: Date.now()
      };
      
      localStorage.setItem(CACHE_KEY, JSON.stringify(cacheData));
      console.log(`Saved ${data.length} locations to cache`);
    } catch (err) {
      console.error('Error saving to cache:', err);
    }
  }, []);

  // Additional cache functions to improve reliability
  const clearExpiredCache = useCallback(() => {
    if (typeof window === 'undefined') return;
    
    try {
      const cachedData = localStorage.getItem(CACHE_KEY);
      if (!cachedData) return;
      
      const { timestamp } = JSON.parse(cachedData);
      const isExpired = Date.now() - timestamp > CACHE_EXPIRY;
      
      if (isExpired) {
        console.log('Clearing expired cache');
        localStorage.removeItem(CACHE_KEY);
      }
    } catch (err) {
      console.error('Error checking cache expiry:', err);
    }
  }, []);

  // Force clear cache method for troubleshooting
  const forceClearCache = useCallback(() => {
    if (typeof window === 'undefined') return;
    
    try {
      localStorage.removeItem(CACHE_KEY);
      console.log('Cache forcefully cleared');
    } catch (err) {
      console.error('Error clearing cache:', err);
    }
  }, []);

  // Only render client-specific content after mounting
  useEffect(() => {
    setMounted(true)
  }, [])
  
  // Reset function to clear state on unmount or before retrying
  const resetState = useCallback(() => {
    if (processingTimeoutRef.current) {
      clearTimeout(processingTimeoutRef.current)
      processingTimeoutRef.current = null
    }
    locationsRef.current = []
    processingRef.current = false
  }, [])
  
  // Cleanup on unmount
  useEffect(() => {
    return () => {
      resetState()
    }
  }, [resetState])
  
  // Call this when component mounts to check for stale cache
  useEffect(() => {
    if (mounted) {
      clearExpiredCache();
    }
  }, [mounted, clearExpiredCache]);
  
  // Override existing fetchAndProcessData with improved error handling
  const fetchAndProcessData = useCallback(async (forceFresh = false) => {
    if (!service || processingRef.current || !mounted) return;
    
    // Immediately clear cache if forcing fresh data
    if (forceFresh && typeof window !== 'undefined') {
      localStorage.removeItem(CACHE_KEY);
    }
    
    // First, try to load from cache if not forcing fresh data
    if (!forceFresh) {
      const cachedLocations = loadCachedData();
      if (cachedLocations && cachedLocations.length > 0) {
        console.log(`Loaded ${cachedLocations.length} locations from cache`);
        setLocations(cachedLocations);
        locationsRef.current = cachedLocations;
        locationStore.setLocations(cachedLocations);
        setIsLoading(false);
        setLoadingProgress(100);
        fetchedRef.current = true;
        setError(null);
        return;
      }
    }
    
    // Set loading state if we're actually fetching
    setIsLoading(true);
    setLoadingProgress(0);
    processingRef.current = true;
    
    // If we had an error before, we'll retry up to 3 times
    let retryCount = 0;
    const maxRetries = 3;
    
    const attemptFetch = async () => {
      try {
        // First, fetch all the data we need
        const [activeFetchResult, allFetchResult] = await Promise.all([
          getActiveBooths(),
          getAllBooths()
        ]);
        
        // Additional validation to ensure data was actually returned
        if (!activeFetchResult || !allFetchResult) {
          throw new Error('Blockchain data returned empty results');
        }
        
        // Now that we have the data, process it
        if (!activeBooths || !allBooths) {
          console.warn('Booth data is undefined:', 
            { activeBoothsExist: !!activeBooths, allBoothsExist: !!allBooths });
          throw new Error('Failed to fetch booth data');
        }
        
        // Log empty data but don't treat it as an error
        if (activeBooths.length === 0) {
          console.log('No active booths found in the blockchain. This is normal if none have been registered yet.');
          
          // Set empty state without throwing an error
          setLocations([]);
          locationsRef.current = [];
          locationStore.setLocations([]);
          setIsLoading(false);
          processingRef.current = false;
          setLoadingProgress(100);
          fetchedRef.current = true;
          
          // Show toast notification to the user
          toast(
            "No Locations Found", 
            { description: "There are no active locations available on the blockchain yet." },
            "info"
          );
          
          return; // Exit processing gracefully
        }
        
        console.log(`Processing ${activeBooths.length} active booths from ${allBooths.length} total booths`);
        
        // Create set for O(1) lookups
        const activeBoothIds = new Set(activeBooths);
        
        // Pre-filter booths
        const filteredBooths = allBooths.filter(booth => 
          activeBoothIds.has(booth.deviceId)
        );
        
        // Clear existing locations
        locationsRef.current = [];
        setLocations([]);
        
        // Process in batches
        const totalBooths = filteredBooths.length;
        const processBatchSize = 10; // Process more booths at once
        const processBatchDelay = 5; // Use a smaller delay between batches
        const locationStatusCounts = {
          available: 0,
          booked: 0,
          maintenance: 0,
          active: 0,
          inactive: 0
        };
        
        // If there are no booths, show empty state immediately
        if (totalBooths === 0) {
          setIsLoading(false);
          processingRef.current = false;
          setLoadingProgress(100);
          
          // Save completed data to cache
          if (locationsRef.current.length > 0) {
            saveToCache(locationsRef.current);
          }
          return;
        }
        
        const processNextBatch = (startIndex: number) => {
          // Clear any existing timeouts
          if (processingTimeoutRef.current) {
            clearTimeout(processingTimeoutRef.current);
          }
          
          if (startIndex >= totalBooths || !mounted) {
            // Done processing
            setIsLoading(false);
            processingRef.current = false;
            setLoadingProgress(100);
            
            // Log status counts
            console.log('Location status counts:', locationStatusCounts);
            
            // Save completed data to cache
            if (locationsRef.current.length > 0) {
              saveToCache(locationsRef.current);
            }
            return;
          }
          
          const endIndex = Math.min(startIndex + processBatchSize, totalBooths);
          const batch = filteredBooths.slice(startIndex, endIndex);
          
          // Create new locations
          const newLocations = batch.map(booth => {
            // Track status counts
            if (booth.status === 0) locationStatusCounts.available++;
            else if (booth.status === 1) locationStatusCounts.booked++;
            else if (booth.status === 2) locationStatusCounts.maintenance++;
            
            if (booth.active) locationStatusCounts.active++;
            else locationStatusCounts.inactive++;
            
            const impressions = Math.floor(Math.random() * 10000) + 1000;
            
            return {
              ...booth,
              city: booth.metadata?.location?.split(',')[0]?.trim() || "Unknown",
              area: booth.metadata?.location?.split(',')[1]?.trim(),
              displayType: booth.metadata?.displaySize?.includes("Large") ? "Billboard" : "Display",
              displaySize: booth.metadata?.displaySize || "Medium",
              pricePerDay: 100,
              impressions,
              earnings: Math.floor(impressions * 0.05),
              coordinates: getCoordinates(booth),
              images: []
            } as Location;
          });
          
          // Update our ref without triggering a render
          locationsRef.current = [...locationsRef.current, ...newLocations];
          
          // Update progress with smoother transitions
          const progress = Math.min(Math.round((endIndex / totalBooths) * 100), 100);
          setLoadingProgress(progress);
          
          // Only update state on meaningful batch completions to reduce renders
          if (endIndex === totalBooths || endIndex % 20 === 0 || startIndex === 0) {
            // Make a copy to avoid reference issues
            setLocations([...locationsRef.current]);
            
            // Only update the store when we have a significant amount or are done
            if (endIndex === totalBooths || endIndex % 50 === 0) {
              // Update the location store with processed data
              locationStore.setLocations([...locationsRef.current]);
            }
          }
          
          // Schedule next batch with shorter delay for smoother experience
          processingTimeoutRef.current = setTimeout(() => {
            processNextBatch(endIndex);
          }, processBatchDelay);
        };
        
        // Start processing from the beginning
        processNextBatch(0);
        
        // Mark as fetched
        fetchedRef.current = true;
        setError(null);
        
      } catch (err) {
        console.error(`Error fetching or processing location data (Attempt ${retryCount + 1}/${maxRetries}):`, err);
        
        // Retry logic
        if (retryCount < maxRetries) {
          retryCount++;
          console.log(`Retrying fetch (${retryCount}/${maxRetries})...`);
          
          // Exponential backoff for retries
          const backoffTime = Math.min(1000 * Math.pow(2, retryCount), 8000);
          
          setTimeout(() => {
            attemptFetch();
          }, backoffTime);
        } else {
          // All retries failed
          setError(err instanceof Error ? err : new Error('Failed to load locations after multiple attempts'));
          setIsLoading(false);
          processingRef.current = false;
          
          // Try to load from cache as fallback, even if it's expired
          try {
            const lastResortCache = localStorage.getItem(CACHE_KEY);
            if (lastResortCache) {
              const { data } = JSON.parse(lastResortCache);
              if (data && data.length > 0) {
                console.log('Loading expired cache as fallback after fetch failures');
                setLocations(data);
                locationsRef.current = data;
                locationStore.setLocations(data);
              }
            }
          } catch (cacheErr) {
            console.error('Failed to load fallback cache:', cacheErr);
          }
        }
      }
    };
    
    // Start the fetch process
    attemptFetch();
    
  }, [service, allBooths, activeBooths, mounted, getActiveBooths, getAllBooths, locationStore, loadCachedData, saveToCache]);
  
  // Set up data fetching when component mounts and dependencies are available
  useEffect(() => {
    if (!fetchedRef.current && service && mounted && !processingRef.current) {
      fetchAndProcessData()
    }
  }, [service, mounted, fetchAndProcessData])

  // Auto-refresh if we get an error and haven't tried to refresh yet
  useEffect(() => {
    if (error && !hasAttemptedRefresh) {
      console.log("Detected error, attempting automatic refresh...");
      setHasAttemptedRefresh(true);
      
      // Slight delay before triggering refresh
      const timer = setTimeout(() => {
        handleRetry();
      }, 2000);
      
      return () => clearTimeout(timer);
    }
  }, [error, hasAttemptedRefresh]);

  // Check if a location is selected in the campaign
  const isLocationSelected = useCallback((deviceId: number) => {
    if (!draftCampaign.targetLocations) return false
    
    return draftCampaign.targetLocations.some(loc => {
      // Handle both old and new formats
      if (typeof loc === 'object') {
        return (loc.deviceId === deviceId) || (loc.id !== undefined && Number(loc.id) === deviceId)
      }
      return false
    })
  }, [draftCampaign.targetLocations]);

  // Toggle location selection for campaign
  const handleLocationToggle = useCallback((location: Location) => {
    if (!isSelectingLocations) {
      router.push(`/locations/${location.deviceId}`)
      return
    }

    const currentLocations = draftCampaign.targetLocations || []
    const deviceId = location.deviceId

    if (isLocationSelected(deviceId)) {
      // Remove location
      updateDraftCampaign({
        targetLocations: currentLocations.filter(loc => 
          (typeof loc === 'object') && (loc.deviceId !== deviceId) && (loc.id === undefined || Number(loc.id) !== deviceId)
        ),
        targetLocationIds: (draftCampaign.targetLocationIds || [])
          .filter(id => id !== deviceId)
      })
      toast("Location Removed", { description: `${getLocationName(location)} removed from campaign` }, "info")
    } else {
      // Add location
      updateDraftCampaign({
        targetLocations: [...currentLocations, location],
        targetLocationIds: [...(draftCampaign.targetLocationIds || []), deviceId]
      })
      toast("Location Added", { description: `${getLocationName(location)} added to campaign` }, "success")
    }
  }, [isSelectingLocations, router, draftCampaign, updateDraftCampaign, isLocationSelected]);

  // Finish location selection and go to dashboard
  const handleFinishSelection = () => {
    if (!draftCampaign.targetLocations?.length) {
      toast("No Locations", { description: "Please select at least one location for your campaign" }, "warning")
      return
    }
    
    finishLocationSelection()
    router.push("/dashboard")
  }

  // Retry fetching data
  const handleRetry = () => {
    // Reset state
    setError(null);
    setRenderError(null);
    setIsLoading(true);
    setHasAttemptedRefresh(true);
    
    // Reset refs
    resetState();
    fetchedRef.current = false;
    
    // Force a fresh fetch
    fetchAndProcessData(true);
    
    toast("Retrying", { description: "Reloading location data..." }, "info");
  };

  // Filter locations based on search and filter criteria
  const filteredLocations = locations && locations.length > 0
    ? locations.filter(location => {
        try {
          const searchTermLower = searchTerm.toLowerCase()
          
          // Search matching
          const matchesSearch = 
            searchTerm === "" || 
            (location.metadata?.location || "").toLowerCase().includes(searchTermLower) ||
            (location.metadata?.displaySize || "").toLowerCase().includes(searchTermLower) ||
            (location.city || "").toLowerCase().includes(searchTermLower) ||
            (location.name || "").toLowerCase().includes(searchTermLower) ||
            (location.deviceId?.toString() || "").includes(searchTermLower)
          
          // Filter matching - improve filter functionality
          let matchesFilter = true
          if (selectedFilter !== "all") {
            switch(selectedFilter) {
              case "indoor":
                matchesFilter = (location.metadata?.location || "").toLowerCase().includes("indoor") ||
                               (location.metadata?.additionalInfo || "").toLowerCase().includes("indoor")
                break
              case "outdoor":
                matchesFilter = (location.metadata?.location || "").toLowerCase().includes("outdoor") ||
                               (location.metadata?.additionalInfo || "").toLowerCase().includes("outdoor")
                break
              case "digital":
                matchesFilter = (location.displayType || "").toLowerCase().includes("digital") ||
                               (location.metadata?.displaySize || "").toLowerCase().includes("digital")
                break
              case "static":
                matchesFilter = (location.displayType || "").toLowerCase().includes("static") ||
                               (location.metadata?.displaySize || "").toLowerCase().includes("static")
                break
              case "available":
                matchesFilter = location.status === 0 // Unbooked status
                break
              case "booked":
                matchesFilter = location.status === 1 // Booked status
                break
            }
          }
          
          // Campaign selection filtering - only show locations that can be selected
          if (isSelectingLocations && draftCampaign) {
            // Don't show already booked locations for campaign selection
            if (location.status === 1) { // Booked status
              return false
            }
          }
          
          return matchesSearch && matchesFilter
        } catch (err) {
          console.error("Error filtering location:", err)
          return false
        }
      })
    : []

  // Safe rendering function for location cards to prevent crashes
  const renderLocationCard = (location: Location) => {
    try {
      const name = getLocationName(location)
      const id = location.deviceId
      const statusText = getStatusString(location.status)
      
      // Determine status style based on status
      let statusStyle = ""
      let statusTextColor = ""
      
      switch(location.status) {
        case 0: // Unbooked
          statusStyle = "bg-green-100"
          statusTextColor = "text-green-800"
          break
        case 1: // Booked
          statusStyle = "bg-blue-100" 
          statusTextColor = "text-blue-800"
          break
        case 2: // Under Maintenance
          statusStyle = "bg-yellow-100"
          statusTextColor = "text-yellow-800"
          break
        default:
          statusStyle = "bg-gray-100"
          statusTextColor = "text-gray-800"
      }
      
      return (
        <div
          key={id}
          className={`border-[4px] ${
            isLocationSelected(id) ? "border-[#0055FF]" : "border-black"
          } bg-white p-4 cursor-pointer hover:shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] transition-all hover:-translate-y-1 relative`}
          onClick={() => handleLocationToggle(location)}
        >
          {isLocationSelected(id) && (
            <div className="absolute top-2 right-2 bg-[#0055FF] text-white p-1 rounded-full">
              <Check className="h-4 w-4" />
            </div>
          )}

          <div className="aspect-video bg-gray-200 mb-4 relative overflow-hidden">
            {/* Placeholder for location image */}
            <div className="absolute inset-0 flex items-center justify-center">
              <MapPin className="h-12 w-12 text-gray-400" />
            </div>
          </div>

          <h3 className="text-xl font-bold mb-1">{name}</h3>
          <p className="text-gray-600 mb-2">
            {location.city || "Unknown location"}
          </p>
          
          {location.metadata?.additionalInfo && (
            <p className="text-xs text-gray-500 mb-2 italic">
              {location.metadata.additionalInfo}
            </p>
          )}
          
          <div className="flex justify-between mb-2">
            <span className="text-xs font-semibold">ID: {location.deviceId}</span>
            <span className="text-xs font-semibold">{statusText}</span>
          </div>
          
          <div className="flex flex-wrap gap-2 mb-3">
            <span className="px-2 py-1 text-xs bg-gray-100 rounded-full">
              {location.displayType || "Display"}
            </span>
            <span className="px-2 py-1 text-xs bg-gray-100 rounded-full">
              {location.displaySize || "Medium"}
            </span>
            <span className={`px-2 py-1 text-xs rounded-full ${statusStyle} ${statusTextColor}`}>
              {statusText}
            </span>
            <span className={`px-2 py-1 text-xs rounded-full ${location.active ? "bg-green-100 text-green-800" : "bg-red-100 text-red-800"}`}>
              {location.active ? "Active" : "Inactive"}
            </span>
          </div>
          
          <div className="flex justify-between items-center mb-4">
            <div className="text-sm font-medium">
              <span className="text-lg font-bold">{location.pricePerDay || 100} ADC</span> / day
            </div>
            <div className="text-sm text-gray-500">
              ~{(location.impressions || 0).toLocaleString()} impressions
            </div>
          </div>

          {isSelectingLocations ? (
            <Button
              className={`w-full mt-4 font-bold border-[3px] ${
                isLocationSelected(id)
                  ? "bg-[#0055FF] text-white border-[#0055FF] hover:bg-[#0044CC]"
                  : "bg-white text-black border-black hover:bg-[#f5f5f5]"
              }`}
              onClick={(e) => {
                e.stopPropagation()
                handleLocationToggle(location)
              }}
              disabled={isAddingLocation || isBooking || location.status === 1} // Disable if location is already booked
            >
              {isLocationSelected(id) ? (
                <>
                  <Check className="mr-2 h-4 w-4" />
                  Selected
                </>
              ) : location.status === 1 ? (
                <>
                  <MapPin className="mr-2 h-4 w-4" />
                  Already Booked
                </>
              ) : (
                <>
                  <Plus className="mr-2 h-4 w-4" />
                  Add to Campaign
                </>
              )}
            </Button>
          ) : (
            <Button
              className="w-full mt-4 bg-[#0055FF] text-white border-[3px] border-black hover:bg-[#0044CC] font-bold"
              onClick={(e) => {
                e.stopPropagation()
                router.push(`/locations/${id}`)
              }}
            >
              View Details
            </Button>
          )}
        </div>
      );
    } catch (err) {
      console.error("Error rendering location card:", err)
      setRenderError(err instanceof Error ? err : new Error("Error rendering location card"))
      
      // Return fallback card
      return (
        <div key={`error-${Math.random()}`} className="border-[4px] border-red-300 bg-white p-4">
          <h3 className="text-xl font-bold mb-1">Display Issue</h3>
          <p className="text-gray-600 mb-2">Unable to render this location properly</p>
          <Button 
            className="w-full mt-4 bg-red-500 text-white border-[3px] border-black hover:bg-red-600 font-bold"
            onClick={(e) => {
              e.stopPropagation()
              handleRetry()
            }}
          >
            Retry Loading
          </Button>
        </div>
      )
    }
  }
  
  // Progress indicator component with styled theme
  const LoadingIndicator = () => {
    // Array of loading catchphrases
    const catchphrases = [
      "Exploring the blockchain for the best ad spaces...",
      "Finding prime billboard locations...",
      "Scanning for high-traffic spots...",
      "Connecting to decentralized ad network...",
      "Discovering digital displays near you...",
      "Verifying on-chain ad spaces...",
      "Calculating impressions for top locations...",
      "Preparing your advertising canvas...",
      "Finding the perfect spots for your ads...",
      "Analyzing foot traffic data..."
    ];
    
    // Select a random catchphrase
    const [catchphrase, setCatchphrase] = useState(catchphrases[0]);
    const catchphraseIndex = useRef(0);
    
    // Change catchphrase every 4 seconds
    useEffect(() => {
      const interval = setInterval(() => {
        catchphraseIndex.current = (catchphraseIndex.current + 1) % catchphrases.length;
        setCatchphrase(catchphrases[catchphraseIndex.current]);
      }, 4000);
      
      return () => clearInterval(interval);
    }, []);
    
    return (
      <div className="py-8">
        {/* Themed loading card */}
        <div className="max-w-2xl mx-auto mb-10 border-[6px] border-black bg-white p-8 shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] transition-all">
          <div className="flex flex-col items-center">
            {/* Logo animation */}
            <div className="relative w-24 h-24 mb-6">
              <div className="absolute inset-0 bg-[#0055FF] rounded-full opacity-20 animate-ping"></div>
              <div className="absolute inset-0 border-[4px] border-black rounded-full animate-pulse"></div>
              <div className="absolute inset-3 bg-[#0055FF] rounded-full flex items-center justify-center">
                <MapPin className="h-10 w-10 text-white animate-bounce" />
              </div>
            </div>
            
            {/* Loading text */}
            <h3 className="text-2xl font-black mb-2 text-center">Loading Locations</h3>
            <p className="text-gray-600 mb-6 text-center h-12 flex items-center justify-center">
              {catchphrase}
            </p>
            
            {/* Progress bar */}
            <div className="w-full h-3 bg-gray-200 rounded-full overflow-hidden mb-3 border-2 border-black">
              <div 
                className="h-full bg-[#0055FF] transition-all duration-500 ease-out"
                style={{ width: `${loadingProgress}%` }}
              ></div>
            </div>
            
            {/* Progress text */}
            <p className="font-bold text-sm">
              {loadingProgress}% Complete
            </p>
            
            {locations.length > 0 && (
              <div className="mt-4 flex flex-wrap justify-center gap-2">
                <div className="inline-block bg-green-100 text-green-800 px-3 py-1 rounded-full text-xs border-2 border-green-500">
                  {locations.filter(l => l.status === 0).length} Available
                </div>
                <div className="inline-block bg-blue-100 text-blue-800 px-3 py-1 rounded-full text-xs border-2 border-blue-500">
                  {locations.filter(l => l.status === 1).length} Booked
                </div>
                <div className="inline-block bg-yellow-100 text-yellow-800 px-3 py-1 rounded-full text-xs border-2 border-yellow-500">
                  {locations.filter(l => l.status === 2).length} In Maintenance
                </div>
              </div>
            )}
          </div>
        </div>
        
        {/* Show already loaded locations in grid */}
        {locations.length > 0 && (
          <div>
            <h3 className="text-xl font-bold mb-6 text-center">Preview Available Locations</h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {locations.map((location, index) => (
                <div key={location.deviceId || `location-${index}`} className="animate-fadeIn" style={{ animationDelay: `${index * 100}ms` }}>
                  {renderLocationCard(location)}
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    );
  };

  // Enhanced error display component
  const ErrorDisplay = () => {
    return (
      <div className="text-center py-12 border-[6px] border-red-300 bg-white rounded-none shadow-[8px_8px_0px_0px_rgba(220,38,38,0.3)]">
        <div className="relative w-24 h-24 mb-6 mx-auto">
          <div className="absolute inset-0 bg-red-500 rounded-full opacity-10 animate-pulse"></div>
          <div className="absolute inset-0 border-[4px] border-red-500 rounded-full"></div>
          <div className="absolute inset-0 flex items-center justify-center text-red-500">
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-12 h-12">
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z" />
            </svg>
          </div>
        </div>
        
        <h3 className="text-2xl font-bold text-red-600 mb-4">Error Loading Locations</h3>
        <p className="text-red-700 mb-6 max-w-md mx-auto">
          {(error || renderError)?.message || "An unknown error occurred while loading location data."}
        </p>
        
        <div className="flex flex-col md:flex-row gap-4 justify-center">
          <Button 
            className="bg-[#0055FF] text-white border-[3px] border-black hover:bg-[#0044CC] font-bold px-6"
            onClick={handleRetry}
          >
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-5 h-5 mr-2 inline-block">
              <path strokeLinecap="round" strokeLinejoin="round" d="M16.023 9.348h4.992v-.001M2.985 19.644v-4.992m0 0h4.992m-4.993 0l3.181 3.183a8.25 8.25 0 0013.803-3.7M4.031 9.865a8.25 8.25 0 0113.803-3.7l3.181 3.182m0-4.991v4.99" />
            </svg>
            Retry Loading
          </Button>
          
          <Button
            variant="outline"
            className="border-[3px] border-black rounded-none hover:bg-gray-100 transition-all"
            onClick={() => forceClearCache()}
          >
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-5 h-5 mr-2 inline-block">
              <path strokeLinecap="round" strokeLinejoin="round" d="M14.74 9l-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 01-2.244 2.077H8.084a2.25 2.25 0 01-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 00-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 013.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 00-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 00-7.5 0" />
            </svg>
            Clear Cache
          </Button>
        </div>
        
        <div className="mt-8 border-t border-red-200 pt-6 max-w-lg mx-auto">
          <p className="text-sm text-gray-600 mb-3">If the problem persists, try these solutions:</p>
          <ul className="text-sm text-left list-disc pl-6 mx-auto inline-block text-gray-700">
            <li className="mb-1">Check your network connection</li>
            <li className="mb-1">Ensure your wallet is connected to the Holesky testnet</li>
            <li className="mb-1">Clear your browser cache and reload the page</li>
            <li className="mb-1">Try again in a few minutes</li>
          </ul>
        </div>
      </div>
    );
  };

  // Add an Emergency Refresh button that will appear after multiple failed attempts
  const EmergencyRefreshButton = () => {
    const handleEmergencyRefresh = () => {
      // Force clear cache and retry with fresh data
      forceClearCache();
      fetchedRef.current = false;
      processingRef.current = false;
      setIsLoading(true);
      fetchAndProcessData(true);
      toast("Emergency Refresh", { description: "Performing complete data refresh..." }, "info");
    };
    
    return (
      <div className="my-6 text-center">
        <p className="text-sm text-gray-700 mb-3">
          Still having trouble loading data? Try a complete refresh:
        </p>
        <Button
          className="bg-red-600 text-white border-[3px] border-black hover:bg-red-700 font-bold"
          onClick={handleEmergencyRefresh}
        >
          Emergency Refresh
        </Button>
      </div>
    );
  };

  // Add custom CSS for animations
  useEffect(() => {
    if (typeof window !== "undefined") {
      // Create style element for custom animations
      const style = document.createElement('style');
      style.textContent = `
        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(10px); }
          to { opacity: 1; transform: translateY(0); }
        }
        .animate-fadeIn {
          animation: fadeIn 0.5s ease-out forwards;
          opacity: 0;
        }
        @keyframes bounce {
          0%, 100% { transform: translateY(0); }
          50% { transform: translateY(-10px); }
        }
        .animate-bounce {
          animation: bounce 1s infinite;
        }
        @keyframes ping {
          0% { transform: scale(1); opacity: 1; }
          75%, 100% { transform: scale(1.5); opacity: 0; }
        }
        .animate-ping {
          animation: ping 2s cubic-bezier(0, 0, 0.2, 1) infinite;
        }
        @keyframes pulse {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.7; }
        }
        .animate-pulse {
          animation: pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite;
        }
      `;
      document.head.appendChild(style);
      
      return () => {
        document.head.removeChild(style);
      };
    }
  }, []);

  // Add a Stats Summary component at the top of the page
  const LocationStatsSummary = () => {
    const availableCount = locations.filter(l => l.status === 0).length;
    const bookedCount = locations.filter(l => l.status === 1).length;
    const maintenanceCount = locations.filter(l => l.status === 2).length;
    const activeCount = locations.filter(l => l.active).length;
    const inactiveCount = locations.filter(l => !l.active).length;
    
    return (
      <div className="bg-white border-[3px] border-black p-4 mb-8 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">
        <h3 className="font-bold mb-3">Location Stats</h3>
        <div className="grid grid-cols-5 gap-2 text-center">
          <div className="p-2 border-[2px] border-green-400 rounded-lg bg-green-50">
            <div className="text-xl font-bold">{availableCount}</div>
            <div className="text-xs font-medium text-green-800">Available</div>
          </div>
          <div className="p-2 border-[2px] border-blue-400 rounded-lg bg-blue-50">
            <div className="text-xl font-bold">{bookedCount}</div>
            <div className="text-xs font-medium text-blue-800">Booked</div>
          </div>
          <div className="p-2 border-[2px] border-yellow-400 rounded-lg bg-yellow-50">
            <div className="text-xl font-bold">{maintenanceCount}</div>
            <div className="text-xs font-medium text-yellow-800">Maintenance</div>
          </div>
          <div className="p-2 border-[2px] border-green-400 rounded-lg bg-green-50">
            <div className="text-xl font-bold">{activeCount}</div>
            <div className="text-xs font-medium text-green-800">Active</div>
          </div>
          <div className="p-2 border-[2px] border-red-400 rounded-lg bg-red-50">
            <div className="text-xl font-bold">{inactiveCount}</div>
            <div className="text-xs font-medium text-red-800">Inactive</div>
          </div>
        </div>
      </div>
    );
  };

  // Prevent hydration mismatch by not rendering location data on server
  if (!mounted) {
    return (
      <div className="min-h-screen bg-white relative">
        <div className="container mx-auto px-4 py-8 relative z-10">
          <h1 className="text-3xl font-black mb-6">Browse Locations</h1>
          <p>Loading locations...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-white relative">
      <main className="container mx-auto px-4 py-8 relative z-10">
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-3xl font-black">
            {isSelectingLocations ? "Select Locations for Campaign" : "Browse Locations"}
          </h1>

          {isSelectingLocations && (
            <Button
              className="bg-[#0055FF] text-white border-[3px] border-black hover:bg-[#0044CC] font-bold"
              onClick={handleFinishSelection}
            >
              Done ({(draftCampaign.targetLocations?.length || 0)} selected)
            </Button>
          )}
        </div>

        <div className="flex flex-col md:flex-row gap-4 mb-8">
          <div className="relative flex-grow">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500" />
            <Input
              placeholder="Search locations by name or city..."
              className="border-[3px] border-black rounded-none pl-10"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>

          <div className="flex gap-2 overflow-x-auto pb-2">
            {["all", "indoor", "outdoor", "digital", "static", "available", "booked"].map((filter) => (
              <Button
                key={filter}
                variant={selectedFilter === filter ? "default" : "outline"}
                className={`border-[3px] border-black rounded-none font-bold ${
                  selectedFilter === filter ? "bg-[#0055FF] text-white" : "bg-white text-black hover:bg-[#f5f5f5]"
                }`}
                onClick={() => setSelectedFilter(filter)}
              >
                <Filter className="mr-2 h-4 w-4" />
                {filter.charAt(0).toUpperCase() + filter.slice(1)}
              </Button>
            ))}
          </div>
        </div>

        {/* Location Stats Summary - only shown when locations are loaded and not in selection mode */}
        {!isLoading && !error && !renderError && locations.length > 0 && !isSelectingLocations && (
          <LocationStatsSummary />
        )}

        {error || renderError ? (
          <ErrorDisplay />
        ) : isLoading ? (
          // Show loading indicator with any locations loaded so far
          <LoadingIndicator />
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredLocations.length === 0 ? (
              <div className="col-span-full text-center py-12">
                <p className="text-lg font-bold">No locations found</p>
                <p>Try adjusting your search or filters</p>
                <Button
                  className="mt-4 bg-[#0055FF] text-white border-[3px] border-black hover:bg-[#0044CC] font-bold"
                  onClick={handleRetry}
                >
                  Refresh Data
                </Button>
              </div>
            ) : (
              filteredLocations.map((location) => renderLocationCard(location))
            )}
          </div>
        )}
        
        {/* Add emergency refresh button at the bottom of the page */}
        {(error || renderError || isLoading) && <EmergencyRefreshButton />}
      </main>
    </div>
  )
}

