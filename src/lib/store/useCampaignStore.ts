import { create } from "zustand"
import { persist } from "zustand/middleware"
import type { Location } from "./useLocationStore"
import { custom } from "viem"
import { LocationData } from "@/hooks/use-location-data"
import { useBlockchainService } from "@/hooks"

// Define the type for Privy auth data we need
export type PrivyAuthData = {
  authenticated: boolean;
  ready: boolean;
  user: {
  id: string;
  };
  wallet: {
    address: string;
    provider: any;
  };
};

// Function to create a contract system from Privy auth data
const createContractSystemFromPrivy = (privyAuth: PrivyAuthData) => {
  if (!validatePrivyAuth(privyAuth)) {
    throw new Error("Invalid Privy authentication data");
  }
  
  // Get the blockchain service using the provider from Privy
  return {
    // Get user's advertiser campaigns
    getMyAdvertiserCampaigns: async (walletAddress: `0x${string}`) => {
      const { service } = useBlockchainService();
      if (!service || !service.boothRegistry) {
        throw new Error("Blockchain service not initialized");
      }
      
      return await service.boothRegistry.getMyAdvertiserCampaigns(walletAddress);
    },
    
    // Get campaign details
    getCampaignDetails: async (campaignId: number) => {
      const { service } = useBlockchainService();
      if (!service || !service.boothRegistry) {
        throw new Error("Blockchain service not initialized");
      }
      
      return await service.boothRegistry.getCampaignDetails(campaignId);
    },
    
    // Get aggregated metrics
    getAggregatedMetrics: async (deviceId: number, startTime: number, endTime: number) => {
      const { service } = useBlockchainService();
      if (!service || !service.performanceOracle) {
        throw new Error("Blockchain service not initialized");
      }
      
      return await service.performanceOracle.getAggregatedMetrics(deviceId, startTime, endTime);
    }
  };
};

export type CampaignFormData = {
  name: string
  startDate: string
  endDate: string
  budget: number
  description?: string
  creativeFile?: File | null
  creativeUrl?: string
  targetLocationIds: number[] // Device IDs for booths
  targetLocations?: (Location | LocationData)[] // Updated to support both Location and LocationData
}

export type Campaign = CampaignFormData & {
  id: string
  status: "draft" | "active" | "paused" | "completed"
  createdAt: string
  views: number
  taps: number
  transactionHash?: string
  onChainId?: number // Blockchain campaign ID
}

export interface CampaignState {
  // Campaigns
  campaigns: Campaign[]
  isLoading: boolean
  draftCampaign: CampaignFormData
  currentStep: number
  isSubmitting: boolean
  isSelectingLocations: boolean // Flag to track if user is selecting locations

  // Form validation
  errors: Partial<Record<keyof CampaignFormData, string>>
  
  // Actions
  updateDraftCampaign: (data: Partial<CampaignFormData>) => void
  setCurrentStep: (step: number) => void
  nextStep: () => void
  prevStep: () => void
  validateCurrentStep: () => boolean
  resetDraftCampaign: () => void
  addLocationToCampaign: (campaignId: number, locationId: number, privyAuth: PrivyAuthData) => Promise<boolean>
  removeLocationFromCampaign: (campaignId: number, locationId: number, privyAuth: PrivyAuthData) => Promise<boolean>

  // Location selection (for draft campaign)
  startLocationSelection: () => void
  finishLocationSelection: () => void
  addLocationToDraftCampaign: (locationId: number) => void
  removeLocationFromDraftCampaign: (locationId: number) => void
  setTargetLocations: (locations: Location[]) => void

  // API integration helpers
  fetchCampaigns: (privyAuth: PrivyAuthData) => Promise<void>
  fetchCampaignById: (id: string, privyAuth: PrivyAuthData) => Promise<Campaign | null>
}

const initialDraftCampaign: CampaignFormData = {
  name: "",
  startDate: "",
  endDate: "",
  budget: 1000,
  description: "",
  creativeFile: null,
  creativeUrl: "",
  targetLocationIds: [],
  targetLocations: [],
}



// Helper to validate Privy auth data
const validatePrivyAuth = (privyAuth: PrivyAuthData | null | undefined): privyAuth is PrivyAuthData => {
  if (!privyAuth) {
    console.log("validatePrivyAuth: privyAuth is null or undefined");
    return false;
  }

  if (!privyAuth.authenticated || !privyAuth.ready) {
    console.log("validatePrivyAuth: Not authenticated or not ready");
    return false;
  }

  if (!privyAuth.user?.id) {
    console.log("validatePrivyAuth: No user ID");
    return false;
  }

  if (!privyAuth.wallet?.address || !privyAuth.wallet?.provider) {
    console.log("validatePrivyAuth: Invalid wallet data");
    return false;
  }

  return true;
};

// Helper to calculate duration in days between two dates
const calculateDurationDays = (startDate: string, endDate: string): number => {
  return Math.ceil(
    (new Date(endDate).getTime() - new Date(startDate).getTime()) / (1000 * 60 * 60 * 24)
  );
};

// Custom replacer function to handle BigInt serialization
const replacer = (key: string, value: any) => {
  // Convert BigInt to String when serializing
  if (typeof value === 'bigint') {
    return value.toString();
  }
  return value;
};

// Helper to handle BigInt in objects
const processBigIntInObject = <T extends object>(data: T): T => {
  return Object.entries(data).reduce((acc, [key, value]) => {
    if (typeof value === 'bigint') {
      (acc as any)[key] = value.toString();
    } else if (value !== null && typeof value === 'object' && !Array.isArray(value) && !(value instanceof File)) {
      (acc as any)[key] = processBigIntInObject(value);
    } else if (Array.isArray(value)) {
      (acc as any)[key] = value.map(item => 
        typeof item === 'bigint' 
          ? item.toString() 
          : (item !== null && typeof item === 'object' ? processBigIntInObject(item) : item)
      );
    } else {
      (acc as any)[key] = value;
    }
    return acc;
  }, {} as T);
};

export const useCampaignStore = create<CampaignState>()(
  persist(
    (set, get) => ({
      // State and actions
      campaigns: [] as Campaign[],
      isLoading: false,
      draftCampaign: initialDraftCampaign,
      currentStep: 1,
      isSubmitting: false,
      isSelectingLocations: false,
      errors: {},

      // Actions
      updateDraftCampaign: (data) => {
        // Process any BigInt values in the data
        const processedData = processBigIntInObject(data);
        
        set((state) => ({
          draftCampaign: { ...state.draftCampaign, ...processedData },
        }));
      },

      setCurrentStep: (step) => set({ currentStep: step }),

      nextStep: () => {
        const { currentStep, validateCurrentStep } = get()
        if (validateCurrentStep() && currentStep < 3) {
          set({ currentStep: currentStep + 1 })
          return true
        }
        return false
      },

      prevStep: () =>
        set((state) => ({
          currentStep: Math.max(1, state.currentStep - 1),
        })),

      validateCurrentStep: () => {
        const { currentStep, draftCampaign } = get()
        const errors: Partial<Record<keyof CampaignFormData, string>> = {}

        // Step 1 validation
        if (currentStep === 1) {
          if (!draftCampaign.name) {
            errors.name = "Campaign name is required"
          }
          if (!draftCampaign.startDate) {
            errors.startDate = "Start date is required"
          }
          if (!draftCampaign.endDate) {
            errors.endDate = "End date is required"
          } else if (draftCampaign.startDate && new Date(draftCampaign.startDate) > new Date(draftCampaign.endDate)) {
            errors.endDate = "End date must be after start date"
          }
        }

        // Step 2 validation
        if (currentStep === 2) {
          if (!draftCampaign.budget || draftCampaign.budget < 100) {
            errors.budget = "Budget must be at least 100 ADC"
          }
        }

        // Step 3 validation
        if (currentStep === 3) {
          if (draftCampaign.targetLocationIds.length === 0) {
            errors.targetLocationIds = "At least one location must be selected"
          }
        }

        set({ errors })
        return Object.keys(errors).length === 0
      },

      resetDraftCampaign: () =>
        set({
          draftCampaign: initialDraftCampaign,
          currentStep: 1,
          errors: {},
          isSelectingLocations: false,
        }),

      // New method to add a location to an existing campaign
      addLocationToCampaign: async (campaignId, locationId, privyAuth) => {
        try {
          if (!validatePrivyAuth(privyAuth)) {
            console.error("Invalid authentication state")
            return false
          }
          
          
          
          
          // Update local state to reflect the addition
          set(state => {
            const updatedCampaigns = state.campaigns.map(c => {
              if (c.onChainId === campaignId) {
                return {
                  ...c,
                  targetLocationIds: [...c.targetLocationIds, locationId]
                };
              }
              return c;
            });
            
            return { campaigns: updatedCampaigns };
          });
          
          return true
        } catch (error) {
          console.error("Failed to add location to campaign:", error)
          return false
        }
      },
      
      // Method to remove a location from an existing campaign
      removeLocationFromCampaign: async (campaignId, locationId, privyAuth) => {
        try {
          if (!validatePrivyAuth(privyAuth)) {
            console.error("Invalid authentication state")
            return false
          }
         
          
          
          // Update local state to reflect the removal
          set(state => {
            const updatedCampaigns = state.campaigns.map(c => {
              if (c.onChainId === campaignId) {
                return {
                  ...c,
                  targetLocationIds: c.targetLocationIds.filter(id => id !== locationId)
                };
              }
              return c;
            });
            
            return { campaigns: updatedCampaigns };
          });
          
          return true
        } catch (error) {
          console.error("Failed to remove location from campaign:", error)
          return false
        }
      },

      // Location selection methods for draft campaign
      startLocationSelection: () => set({ isSelectingLocations: true }),

      finishLocationSelection: () => set({ isSelectingLocations: false }),

      addLocationToDraftCampaign: (locationId) =>
        set((state) => {
          if (state.draftCampaign.targetLocationIds.includes(locationId)) {
            return state // Location already added
          }

          return {
            draftCampaign: {
              ...state.draftCampaign,
              targetLocationIds: [...state.draftCampaign.targetLocationIds, locationId],
            },
          }
        }),

      removeLocationFromDraftCampaign: (locationId) =>
        set((state) => ({
          draftCampaign: {
            ...state.draftCampaign,
            targetLocationIds: state.draftCampaign.targetLocationIds.filter((id) => id !== locationId),
          },
        })),

      setTargetLocations: (locations) =>
        set((state) => {
          // Extract deviceIds from locations and add them to targetLocationIds
          const deviceIds = locations
            .map(loc => {
              // Ensure deviceId is a number
              const deviceId = typeof loc.deviceId === 'string' 
                ? parseInt(loc.deviceId) 
                : loc.deviceId;
              return typeof deviceId === 'number' ? deviceId : undefined;
            })
            .filter((id): id is number => id !== undefined);

          return {
          draftCampaign: {
            ...state.draftCampaign,
            targetLocations: locations,
              targetLocationIds: deviceIds,
          },
          };
        }),

      // API integration helpers - blockchain only
      fetchCampaigns: async (privyAuth) => {
        try {
          // First handle loading state and validation
          set({ isLoading: true })
          
          if (!validatePrivyAuth(privyAuth)) {
            console.error("Invalid authentication state")
            set({ isLoading: false, campaigns: [] })
            return
          }
          
          // Create contract system
          const contractSystem = createContractSystemFromPrivy(privyAuth)
          
          // Fetch user's campaigns from blockchain
          let campaignIds: number[] = [];
          try {
            // Convert wallet address to correct format
            const walletAddress = privyAuth.wallet!.address as `0x${string}`;
            
            // Call getMyAdvertiserCampaigns with wallet address parameter
            campaignIds = await contractSystem.getMyAdvertiserCampaigns(walletAddress);
            console.log(`Found ${campaignIds.length} campaigns for user ${walletAddress}`);
          } catch (error) {
            console.error("Failed to get campaign IDs:", error);
            // Set empty campaigns and return
            set({ campaigns: [], isLoading: false });
            return;
          }
          
          if (!campaignIds || !Array.isArray(campaignIds) || campaignIds.length === 0) {
            set({ campaigns: [], isLoading: false })
            return
          }
          
          // Fetch details of each campaign
          const campaignDetailsPromises = campaignIds.map((id: number) => contractSystem.getCampaignDetails(id))
          const campaignDetails = await Promise.all(campaignDetailsPromises)
          
          // Fetch locations and metrics for each campaign
          const campaigns: Campaign[] = await Promise.all(
            campaignDetails.map(async (details: any, index: number) => {
              const campaignId = campaignIds[index]
              const locations = details.bookedLocations || []
              
              // Get aggregated metrics for all locations
              let totalViews = 0
              let totalTaps = 0
              
              const now = Math.floor(Date.now() / 1000)
              const oneWeekAgo = now - (7 * 24 * 60 * 60)
              
              for (const deviceId of locations) {
                try {
                  const metrics = await contractSystem.getAggregatedMetrics(
                    deviceId,
                    oneWeekAgo,
                    now
                  )
                  totalViews += metrics.totalViews
                  totalTaps += metrics.totalTaps
                } catch (error) {
                  console.error(`Error fetching metrics for device ${deviceId}:`, error)
                }
              }
              
              // Format metadata for display - with null checks
              const metadata = details.metadata || {}
              
              // Generate a unique ID for the campaign
              const uniqueId = `blockchain-campaign-${campaignId}`
              
              // Convert any BigInt values to strings
              const startDateValue = metadata.startDate ? 
                (typeof metadata.startDate === 'bigint' ? Number(metadata.startDate) : Number(metadata.startDate)) : 
                Date.now() / 1000;
              
              const durationValue = metadata.duration ? 
                (typeof metadata.duration === 'bigint' ? Number(metadata.duration) : Number(metadata.duration)) : 
                30;
            
            return {
                id: uniqueId,
                name: metadata.name || "Unnamed Campaign",
                description: metadata.description || "",
                startDate: new Date(startDateValue * 1000).toISOString().split('T')[0],
                endDate: new Date((startDateValue + durationValue * 24 * 60 * 60) * 1000).toISOString().split('T')[0],
                budget: parseInt(metadata.additionalInfo?.split(':')[1] || '1000'),
                creativeUrl: metadata.contentURI || "",
                targetLocationIds: locations,
                status: details.active ? "active" : "completed",
                createdAt: new Date(startDateValue * 1000).toISOString(),
                views: totalViews,
                taps: totalTaps,
                onChainId: campaignId
              }
            })
          )
          
          set({ campaigns, isLoading: false })
        } catch (error) {
          console.error("Error fetching campaigns:", error)
          set({ isLoading: false, campaigns: [] })
        }
      },

      fetchCampaignById: async (id, privyAuth) => {
        try {
          if (!validatePrivyAuth(privyAuth)) {
            console.error("Invalid authentication state")
            return null
          }
          
          const contractSystem = createContractSystemFromPrivy(privyAuth)
          
          // Find the campaign in the store to get its onChainId
          const campaign = get().campaigns.find(c => c.id === id)
          if (!campaign?.onChainId) {
            console.error("Campaign not found or missing onChainId")
            return null
          }
          
          // Fetch campaign details from blockchain
          const details = await contractSystem.getCampaignDetails(campaign.onChainId)
          const locations = details.bookedLocations || []
          
          // Get aggregated metrics for all locations
          let totalViews = 0
          let totalTaps = 0
          
          const now = Math.floor(Date.now() / 1000)
          const oneWeekAgo = now - (7 * 24 * 60 * 60)
          
          for (const deviceId of locations) {
            try {
              const metrics = await contractSystem.getAggregatedMetrics(
                deviceId,
                oneWeekAgo,
                now
              )
              totalViews += metrics.totalViews
              totalTaps += metrics.totalTaps
            } catch (error) {
              console.error(`Error fetching metrics for device ${deviceId}:`, error)
            }
          }
          
          // Update campaign with latest data
          const metadata = details.metadata || {}
          
          // Convert any BigInt values
          const startDateValue = metadata.startDate ? 
            (typeof metadata.startDate === 'bigint' ? Number(metadata.startDate) : Number(metadata.startDate)) : 
            Date.now() / 1000;
          
          const durationValue = metadata.duration ? 
            (typeof metadata.duration === 'bigint' ? Number(metadata.duration) : Number(metadata.duration)) : 
            30;
          
          const updatedCampaign: Campaign = {
            ...campaign,
            name: metadata.name || campaign.name,
            description: metadata.description || campaign.description,
            startDate: new Date(startDateValue * 1000).toISOString().split('T')[0],
            endDate: new Date((startDateValue + durationValue * 24 * 60 * 60) * 1000).toISOString().split('T')[0],
            budget: parseInt(metadata.additionalInfo?.split(':')[1] || String(campaign.budget)),
            creativeUrl: metadata.contentURI || campaign.creativeUrl,
            targetLocationIds: locations,
            status: details.active ? "active" : "completed",
            views: totalViews,
            taps: totalTaps
          }
          
          // Update this campaign in the store
          set((state) => ({
            campaigns: state.campaigns.map((c) => 
              c.id === id ? updatedCampaign : c
            ),
          }))
          
          return updatedCampaign
        } catch (error) {
          console.error("Error fetching campaign by ID:", error)
          return null
        }
      }
    }),
    {
      name: "adnet-campaign-storage",
      storage: {
        getItem: (name) => {
          if (typeof window === 'undefined') return null;
          const str = localStorage.getItem(name);
          if (!str) return null;
          try {
            return JSON.parse(str);
          } catch (e) {
            return null;
          }
        },
        setItem: (name, value) => {
          if (typeof window === 'undefined') return;
          try {
            localStorage.setItem(name, JSON.stringify(value, replacer));
          } catch (e) {
            console.error("Error storing state:", e);
          }
        },
        removeItem: (name) => {
          if (typeof window === 'undefined') return;
          localStorage.removeItem(name);
        }
      },
      partialize: (state) => {
        // Only persist these parts of the state
        const { draftCampaign, currentStep } = state;
        return { draftCampaign, currentStep } as any;
      },
    },
  ),
)