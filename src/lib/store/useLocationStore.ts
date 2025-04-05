import { create } from "zustand"
import { persist } from "zustand/middleware"
import { BoothStatus, Booth, BoothMetadata } from "@/lib/blockchain"
import { Address } from "viem"

export type Location = Booth & {
  // Additional fields that might not be in the Booth type
  id?: string // Used for UI and compatibility
  name?: string // Display name for the location
  city?: string
  area?: string
  address?: string
  displayType?: string
  displaySize?: string
  dailyTraffic?: number
  footTraffic?: number
  pricePerDay?: number | string
  images?: string[]
  impressions?: number
  earnings?: number
  campaigns?: number
  registrationTime?: number
  coordinates?: { lat: number; lng: number }
}

// Helper function to convert BoothStatus to readable string
export const getStatusString = (status?: BoothStatus): string => {
  switch(status) {
    case BoothStatus.Unbooked:
      return 'Available';
    case BoothStatus.Booked:
      return 'Booked';
    case BoothStatus.UnderMaintenance:
      return 'Maintenance';
    default:
      return 'Unknown';
  }
}

// Helper function to extract location metadata
export const getLocationName = (location: Booth): string => {
  if (location.metadata?.location) {
    return location.metadata.location;
  }
  return `Location #${location.deviceId}`;
}

// Helper function to extract coordinates from additional info
export const getCoordinates = (location: Booth): { lat: number; lng: number } | undefined => {
  const additionalInfo = location.metadata?.additionalInfo || '';
  
  if (additionalInfo.includes("lat:") && additionalInfo.includes("lng:")) {
    try {
      const lat = parseFloat(additionalInfo.split('lat:')[1]?.split(',')[0] || "0");
      const lng = parseFloat(additionalInfo.split('lng:')[1]?.split(',')[0] || "0");
      return { lat, lng };
    } catch (e) {
      console.error("Error parsing coordinates:", e);
    }
  }
  
  return undefined;
}

// Helper function to convert Booth to Location
export const boothToLocation = (booth: Booth): Location => {
  const coordinates = getCoordinates(booth);
  const cityMatch = booth.metadata?.location?.match(/^([^,]+)/);
  const city = cityMatch ? cityMatch[0].trim() : "Unknown city";

  return {
    ...booth,
    id: booth.deviceId.toString(),
    name: `${booth.metadata?.displaySize || 'Digital'} Display at ${booth.metadata?.location || 'Unknown location'}`,
    city,
    address: booth.metadata?.location || "Unknown location",
    displayType: booth.metadata?.displaySize?.includes("Large") ? "Billboard" : "Display",
    displaySize: booth.metadata?.displaySize || "Medium",
    footTraffic: Math.floor(Math.random() * 5000) + 500, // Placeholder
    pricePerDay: "100", // Placeholder
    impressions: Math.floor(Math.random() * 10000) + 1000, // Placeholder
    earnings: Math.floor(Math.random() * 1000) + 100, // Placeholder
    campaigns: 1, // Placeholder
    registrationTime: Date.now(),
    coordinates
  };
};

// Helper function to convert BigInt values to strings in an object
const serializeBigInts = (obj: any): any => {
  if (obj === null || obj === undefined) {
    return obj;
  }
  
  if (typeof obj === 'bigint') {
    return obj.toString();
  }
  
  if (Array.isArray(obj)) {
    return obj.map(item => serializeBigInts(item));
  }
  
  if (typeof obj === 'object') {
    return Object.fromEntries(
      Object.entries(obj).map(([key, value]) => [
        key,
        serializeBigInts(value)
      ])
    );
  }
  
  return obj;
};

// Enhanced location interface that combines blockchain and UI data
interface LocationState {
  // Locations data
  locations: Location[]
  selectedLocationIds: number[]
  bookedLocations: Location[] // New: Track booked locations
  isLoading: boolean
  error: string | null
  
  // Form data for creating/editing locations
  locationFormData: Partial<Location>
  
  // Actions
  setLocations: (locations: Location[]) => void
  selectLocation: (id: number) => void
  deselectLocation: (id: number) => void
  clearSelectedLocations: () => void
  setError: (error: string | null) => void
  setLoading: (isLoading: boolean) => void
  setLocationFormData: (data: Partial<Location>) => void
  resetLocationFormData: () => void
  
  // New actions for booked locations
  bookLocation: (location: Location) => boolean
  removeBookedLocation: (locationId: number | string) => void
  clearBookedLocations: () => void
  getBookedLocations: () => Location[]
  isLocationBooked: (locationId: number | string) => boolean
  
  // Computed helpers
  getLocationById: (id: number) => Location | undefined
  getSelectedLocations: () => Location[]
  getTotalImpressions: () => number
  getTotalEarnings: () => number
  getActiveLocationsCount: () => number
  getFilteredLocations: (searchTerm: string, filterStatus?: string) => Location[]

  // Blockchain integration
  processBoothData: (booths: Booth[]) => void
  syncLocationsWithBlockchain: (activeBooths: number[], allBooths: Booth[]) => void
}

export const useLocationStore = create<LocationState>()(
  persist(
    (set, get) => ({
      // Initial state
      locations: [],
      selectedLocationIds: [],
      bookedLocations: [], // New state for booked locations
      isLoading: false,
      error: null,
      locationFormData: {},
      
      // Actions
      setLocations: (locations) => set({ locations }),
      
      selectLocation: (id) => 
        set(state => ({
          selectedLocationIds: [...state.selectedLocationIds, id]
        })),
      
      deselectLocation: (id) =>
        set(state => ({
          selectedLocationIds: state.selectedLocationIds.filter(locId => locId !== id)
        })),
      
      clearSelectedLocations: () => set({ selectedLocationIds: [] }),
      
      setError: (error) => set({ error }),
      
      setLoading: (isLoading) => set({ isLoading }),
      
      setLocationFormData: (data) => set({ locationFormData: data }),
      
      resetLocationFormData: () => set({ locationFormData: {} }),
      
      // New actions for booked locations
      bookLocation: (location) => {
        const { bookedLocations } = get();
        const locationId = typeof location.id === 'string' ? parseInt(location.id) : location.deviceId;
        
        // Check if already booked
        const isAlreadyBooked = bookedLocations.some(loc => 
          loc.deviceId === location.deviceId || loc.id === location.id
        );
        
        if (!isAlreadyBooked) {
          // Serialize BigInt values before storing
          const serializedLocation = serializeBigInts(location);
          
          set({ 
            bookedLocations: [...bookedLocations, serializedLocation] 
          });
          return true; // Return true if booking was successful
        }
        return false; // Return false if already booked
      },
      
      removeBookedLocation: (locationId) => {
        set(state => ({
          bookedLocations: state.bookedLocations.filter(loc => 
            !(loc.deviceId === locationId || loc.id === locationId.toString())
          )
        }));
      },
      
      clearBookedLocations: () => set({ bookedLocations: [] }),
      
      getBookedLocations: () => get().bookedLocations,
      
      isLocationBooked: (locationId) => {
        const { bookedLocations } = get();
        return bookedLocations.some(loc => 
          loc.deviceId === locationId || loc.id === locationId.toString()
        );
      },
      
      // Computed helpers
      getLocationById: (id) => {
        return get().locations.find(loc => loc.deviceId === id);
      },
      
      getSelectedLocations: () => {
        const { locations, selectedLocationIds } = get();
        return locations.filter(loc => selectedLocationIds.includes(loc.deviceId));
      },
      
      getTotalImpressions: () => {
        return get().locations.reduce((sum, loc) => sum + (loc.impressions || 0), 0);
      },
      
      getTotalEarnings: () => {
        return get().locations.reduce((sum, loc) => sum + (loc.earnings || 0), 0);
      },
      
      getActiveLocationsCount: () => {
        return get().locations.filter(loc => loc.active).length;
      },
      
      getFilteredLocations: (searchTerm, filterStatus) => {
        const { locations } = get();
        
        return locations.filter(location => {
          // Search filter
          const matchesSearch = searchTerm === "" || 
            (location.metadata?.location || "").toLowerCase().includes(searchTerm.toLowerCase()) ||
            (location.metadata?.displaySize || "").toLowerCase().includes(searchTerm.toLowerCase()) ||
            (location.name || "").toLowerCase().includes(searchTerm.toLowerCase()) ||
            location.deviceId.toString().includes(searchTerm);
          
          // Status filter
          const matchesStatus = !filterStatus || filterStatus === "all" || 
            (filterStatus === "active" && location.active) ||
            (filterStatus === "inactive" && !location.active);
          
          return matchesSearch && matchesStatus;
        });
      },
      
      // Blockchain integration
      processBoothData: (booths) => {
        // Serialize BigInt values in processed locations
        const processedLocations = booths.map(booth => serializeBigInts(boothToLocation(booth)));
        set({ locations: processedLocations });
        return processedLocations;
      },
      
      syncLocationsWithBlockchain: (activeBooths, allBooths) => {
        set(state => {
          // Process booth data into locations and serialize BigInt values
          const allLocations = allBooths.map(booth => serializeBigInts(boothToLocation(booth)));
          
          // Update existing booked locations with latest data
          const updatedBookedLocations = state.bookedLocations.map(booked => {
            const updatedBooth = allBooths.find(booth => 
              booth.deviceId === (typeof booked.id === 'string' ? parseInt(booked.id) : booked.deviceId)
            );
            
            if (updatedBooth) {
              const updatedLocation = {
                ...serializeBigInts(boothToLocation(updatedBooth)),
                // Preserve any custom fields that might be in the booked location
                ...(booked.pricePerDay ? { pricePerDay: booked.pricePerDay } : {}),
                ...(booked.impressions ? { impressions: booked.impressions } : {}),
                ...(booked.earnings ? { earnings: booked.earnings } : {})
              };
              return updatedLocation;
            }
            return booked;
          });
          
          return {
            locations: allLocations,
            bookedLocations: updatedBookedLocations,
            isLoading: false
          };
        });
      }
    }),
    {
      name: "adnet-location-storage",
      partialize: (state) => ({
        selectedLocationIds: state.selectedLocationIds,
        locationFormData: state.locationFormData,
        bookedLocations: state.bookedLocations
      }),
    }
  )
)

// Simplified location metadata builder for registering booths
export const buildLocationMetadata = (
  location: string, 
  displaySize: string,
  coordinates?: { lat: number; lng: number }
): BoothMetadata => {
  const additionalInfo = coordinates ? 
    `lat:${coordinates.lat},lng:${coordinates.lng}` : '';
  
  return {
    location,
    displaySize,
    additionalInfo
  };
};

