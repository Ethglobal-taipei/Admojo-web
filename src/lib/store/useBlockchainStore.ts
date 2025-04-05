import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { 
  Booth, 
  BoothStatus, 
  Campaign, 
  Metrics, 
  AggregatedMetrics, 
  BoothMetadata,
  CampaignMetadata
} from '@/lib/blockchain';
import { Address, Hash } from 'viem';

interface BlockchainState {
  // Connection status
  isConnected: boolean;
  isLoading: boolean;
  error: Error | null;
  chainId: number | null;
  isCorrectChain: boolean;
  
  // User data
  address: string | null;
  
  // Booths and campaigns data
  booths: Record<string, Booth>;
  campaigns: Record<string, Campaign>;
  activeBoothIds: number[];
  activeLocationIds: number[];
  myProviderLocations: number[];
  myAdvertiserCampaigns: number[];
  
  // Performance metrics
  metrics: Record<string, Metrics>;  // keyed by deviceId-timestamp
  aggregatedMetrics: Record<string, AggregatedMetrics>;  // keyed by deviceId-startTime-endTime
  
  // Transaction tracking
  pendingTransactions: Record<string, {
    hash: Hash;
    description: string;
    timestamp: number;
    status: 'pending' | 'completed' | 'failed';
  }>;
  
  // Actions
  setConnectionStatus: (isConnected: boolean, chainId: number | null, address: string | null) => void;
  setChainCorrect: (isCorrect: boolean) => void;
  setError: (error: Error | null) => void;
  setLoading: (isLoading: boolean) => void;
  
  // Booth actions
  setBooth: (deviceId: number, booth: Booth) => void;
  setBooths: (booths: Booth[]) => void;
  updateBoothStatus: (deviceId: number, status: BoothStatus) => void;
  setActiveBoothIds: (ids: number[]) => void;
  setActiveLocationIds: (ids: number[]) => void;
  setMyProviderLocations: (ids: number[]) => void;
  
  // Campaign actions
  setCampaign: (campaignId: number, campaign: Campaign) => void;
  setCampaigns: (campaigns: Campaign[]) => void;
  setMyAdvertiserCampaigns: (ids: number[]) => void;
  
  // Metrics actions
  setMetrics: (deviceId: number, timestamp: number, metrics: Metrics) => void;
  setAggregatedMetrics: (deviceId: number, startTime: number, endTime: number, metrics: AggregatedMetrics) => void;
  
  // Transaction actions
  addPendingTransaction: (hash: Hash, description: string) => void;
  updateTransactionStatus: (hash: Hash, status: 'pending' | 'completed' | 'failed') => void;
  clearOldTransactions: (olderThan: number) => void;
  
  // Utility methods
  getBoothById: (deviceId: number) => Booth | null;
  getCampaignById: (campaignId: number) => Campaign | null;
  reset: () => void;
}

export const useBlockchainStore = create<BlockchainState>()(
  persist(
    (set, get) => ({
      // Initial state
      isConnected: false,
      isLoading: false,
      error: null,
      chainId: null,
      isCorrectChain: false,
      address: null,
      
      booths: {},
      campaigns: {},
      activeBoothIds: [],
      activeLocationIds: [],
      myProviderLocations: [],
      myAdvertiserCampaigns: [],
      
      metrics: {},
      aggregatedMetrics: {},
      
      pendingTransactions: {},
      
      // Connection status actions
      setConnectionStatus: (isConnected: boolean, chainId: number | null, address: string | null) => 
        set({ isConnected, chainId, address }),
      
      setChainCorrect: (isCorrect: boolean) => 
        set({ isCorrectChain: isCorrect }),
      
      setError: (error: Error | null) => 
        set({ error }),
      
      setLoading: (isLoading: boolean) => 
        set({ isLoading }),
      
      // Booth actions
      setBooth: (deviceId: number, booth: Booth) => 
        set((state) => ({ 
          booths: { 
            ...state.booths, 
            [deviceId.toString()]: booth 
          } 
        })),
      
      setBooths: (booths: Booth[]) => {
        const boothMap: Record<string, Booth> = {};
        booths.forEach(booth => {
          if (booth.deviceId !== undefined) {
            boothMap[booth.deviceId.toString()] = booth;
          }
        });
        set({ booths: boothMap });
      },
      
      updateBoothStatus: (deviceId: number, status: BoothStatus) => 
        set((state) => {
          const booth = state.booths[deviceId.toString()];
          if (!booth) return state;
          
          return { 
            booths: { 
              ...state.booths, 
              [deviceId.toString()]: { 
                ...booth, 
                status 
              } 
            } 
          };
        }),
      
      setActiveBoothIds: (ids: number[]) => 
        set({ activeBoothIds: ids }),
      
      setActiveLocationIds: (ids: number[]) => 
        set({ activeLocationIds: ids }),
      
      setMyProviderLocations: (ids: number[]) => 
        set({ myProviderLocations: ids }),
      
      // Campaign actions
      setCampaign: (campaignId: number, campaign: Campaign) => 
        set((state) => ({ 
          campaigns: { 
            ...state.campaigns, 
            [campaignId.toString()]: campaign 
          } 
        })),
      
      setCampaigns: (campaigns: Campaign[]) => {
        const campaignMap: Record<string, Campaign> = {};
        campaigns.forEach(campaign => {
          if (campaign.id !== undefined) {
            campaignMap[campaign.id.toString()] = campaign;
          }
        });
        set({ campaigns: campaignMap });
      },
      
      setMyAdvertiserCampaigns: (ids: number[]) => 
        set({ myAdvertiserCampaigns: ids }),
      
      // Metrics actions
      setMetrics: (deviceId: number, timestamp: number, metrics: Metrics) => 
        set((state) => ({ 
          metrics: { 
            ...state.metrics, 
            [`${deviceId}-${timestamp}`]: metrics 
          } 
        })),
      
      setAggregatedMetrics: (deviceId: number, startTime: number, endTime: number, metrics: AggregatedMetrics) => 
        set((state) => ({ 
          aggregatedMetrics: { 
            ...state.aggregatedMetrics, 
            [`${deviceId}-${startTime}-${endTime}`]: metrics 
          } 
        })),
      
      // Transaction actions
      addPendingTransaction: (hash: Hash, description: string) => 
        set((state) => ({ 
          pendingTransactions: { 
            ...state.pendingTransactions, 
            [hash]: {
              hash,
              description,
              timestamp: Date.now(),
              status: 'pending'
            } 
          } 
        })),
      
      updateTransactionStatus: (hash: Hash, status: 'pending' | 'completed' | 'failed') => 
        set((state) => {
          const tx = state.pendingTransactions[hash];
          if (!tx) return state;
          
          return { 
            pendingTransactions: { 
              ...state.pendingTransactions, 
              [hash]: { 
                ...tx, 
                status 
              } 
            } 
          };
        }),
      
      clearOldTransactions: (olderThan: number) => 
        set((state) => {
          const now = Date.now();
          const newPendingTransactions = { ...state.pendingTransactions };
          
          Object.keys(newPendingTransactions).forEach(hash => {
            const tx = newPendingTransactions[hash];
            if (now - tx.timestamp > olderThan) {
              delete newPendingTransactions[hash];
            }
          });
          
          return { pendingTransactions: newPendingTransactions };
        }),
      
      // Utility methods
      getBoothById: (deviceId: number) => {
        const booth = get().booths[deviceId.toString()];
        return booth || null;
      },
      
      getCampaignById: (campaignId: number) => {
        const campaign = get().campaigns[campaignId.toString()];
        return campaign || null;
      },
      
      reset: () => set({
        booths: {},
        campaigns: {},
        activeBoothIds: [],
        activeLocationIds: [],
        myProviderLocations: [],
        myAdvertiserCampaigns: [],
        metrics: {},
        aggregatedMetrics: {},
        pendingTransactions: {},
        isConnected: false,
        error: null,
        chainId: null,
        address: null,
        isCorrectChain: false
      })
    }),
    {
      name: 'adnet-blockchain-storage',
      partialize: (state) => ({
        booths: state.booths,
        campaigns: state.campaigns,
        activeBoothIds: state.activeBoothIds,
        activeLocationIds: state.activeLocationIds,
        myProviderLocations: state.myProviderLocations,
        myAdvertiserCampaigns: state.myAdvertiserCampaigns,
        metrics: state.metrics,
        aggregatedMetrics: state.aggregatedMetrics,
        pendingTransactions: state.pendingTransactions
      }),
    }
  )
); 