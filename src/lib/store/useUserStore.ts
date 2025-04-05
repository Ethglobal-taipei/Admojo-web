import { create } from "zustand"
import { persist } from "zustand/middleware"
import * as userService from '../api/userService'

// Optional: Add types for Privy wallet info
interface PrivyWalletInfo {
  address: string
  chainId: number
  connector?: string
  type?: string
}

export interface UserState {
  // User data - null when not connected
  user: {
    name: string
    username: string
    email: string
    avatar: string
    role: string
    memberSince: string
    tier: string
    walletAddress: string
    // Add privy-specific user data
    privyUserId?: string
    walletType?: string
    linkedWallets?: PrivyWalletInfo[]
  } | null

  balances: {
    USDC: number
    ADC: number
  } | null

  stats: {
    campaignsCreated: number
    activeDisplays: number
    totalSpent: number
    avgCPI: number
  } | null

  // Wallet connection state
  isConnected: boolean
  isConnecting: boolean
  isLoading: boolean
  error: string | null

  // Settings
  notificationSettings: Record<string, boolean>
  privacySettings: Record<string, boolean>

  // Actions
  connectWallet: (address: string, privyUserData?: any) => Promise<void>
  disconnectWallet: () => void
  fetchUserData: (address: string, privyUserData?: any) => Promise<void>
  updateUser: (userData: Partial<NonNullable<UserState["user"]>>) => Promise<void>
  updateBalances: (balances: Partial<NonNullable<UserState["balances"]>>) => Promise<void>
  updateStats: (stats: Partial<NonNullable<UserState["stats"]>>) => Promise<void>
  linkWallet: (walletInfo: PrivyWalletInfo) => void
  fetchBalances: (address: string) => Promise<void>
  fetchStats: (address: string) => Promise<void>
  fetchSettings: (address: string) => Promise<void>
  updateSettings: (
    settings: { 
      notificationSettings?: Record<string, boolean>; 
      privacySettings?: Record<string, boolean> 
    }
  ) => Promise<void>
  clearError: () => void
}

export const useUserStore = create<UserState>()(
  persist(
    (set, get) => ({
      // Initial state - no user data until connected
      user: null,
      balances: null,
      stats: null,
      isConnected: false,
      isConnecting: false,
      isLoading: false,
      error: null,
      notificationSettings: {
        emailNotifications: true,
        pushNotifications: true,
        marketingEmails: false,
        transactionAlerts: true,
        campaignUpdates: true,
      },
      privacySettings: {
        showProfile: true,
        showActivity: true,
        allowDataCollection: true,
        showWalletBalance: false,
      },

      // Actions
      connectWallet: async (address, privyUserData) => {
        // First set connecting state
        set({ isConnecting: true, error: null })

        try {
          // Fetch user data based on wallet address
          await get().fetchUserData(address, privyUserData)

          // Set connected state
          set({
            isConnected: true,
            isConnecting: false,
          })
        } catch (error) {
          // Reset on error
          set({
            isConnecting: false,
            user: null,
            balances: null,
            stats: null,
            error: error instanceof Error ? error.message : "Failed to connect wallet",
          })
          console.error("Failed to connect wallet:", error)
        }
      },

      disconnectWallet: () =>
        set({
          isConnected: false,
          user: null,
          balances: null,
          stats: null,
          error: null,
        }),

      // Fetch user data with API integration
      fetchUserData: async (address, privyUserData) => {
        try {
          set({ isLoading: true, error: null })
          
          if (!address) {
            throw new Error("No wallet address provided")
          }

          // Try to fetch from API first
          const response = await userService.fetchUserData(address)
          
          if (response.success && response.data) {
            // API call succeeded - use returned data
            // If we have Privy data, merge it with the API data
            if (privyUserData) {
              // Process linked accounts if available
              const linkedWallets = privyUserData.linkedAccounts
                ?.filter((account: any) => account.type === 'wallet')
                ?.map((wallet: any) => ({
                  address: wallet.address,
                  chainId: wallet.chainId || 1,
                  type: wallet.walletClientType || 'unknown'
                })) || [];
                
              // Merge with API data, preferring API data for most fields
              set({
                user: {
                  ...response.data,
                  privyUserId: privyUserData.id,
                  linkedWallets: linkedWallets.length > 0 ? linkedWallets : response.data.linkedWallets,
                },
                isLoading: false,
              })
            } else {
              // Just use API data
              set({
                user: response.data,
                isLoading: false,
              })
            }
          } else {
            // API call failed - fallback to creating a new user with Privy data
            // Extract user information from Privy data when available
            const userName = privyUserData?.name || "Anonymous User"
            const userEmail = privyUserData?.email?.address || ""
            const userAvatar = privyUserData?.avatar || "/placeholder.svg?height=100&width=100"
            const userId = privyUserData?.id || null
            
            // Extract wallet type from Privy data
            const walletType = privyUserData?.wallet?.walletClientType === 'privy' 
              ? 'Embedded Wallet' 
              : 'External Wallet'

            // Create an array of linked accounts if available
            const linkedWallets = privyUserData?.linkedAccounts
              ?.filter((account: any) => account.type === 'wallet')
              ?.map((wallet: any) => ({
                address: wallet.address,
                chainId: wallet.chainId || 1,
                type: wallet.walletClientType || 'unknown'
              })) || [];

            // Set user data based on Privy info
            set({
              user: {
                name: userName,
                username: userName.toLowerCase().replace(/\s+/g, '').slice(0, 10),
                email: userEmail,
                avatar: userAvatar,
                role: "Advertiser",
                memberSince: new Date().toLocaleDateString('en-US', { month: 'long', year: 'numeric' }),
                tier: "Standard",
                walletAddress: address,
                // Privy-specific data
                privyUserId: userId,
                walletType,
                linkedWallets: linkedWallets.length > 0 ? linkedWallets : [{
                  address,
                  chainId: 1,
                  type: walletType
                }],
              },
              isLoading: false,
            })
          }
          
          // Also fetch balances and stats
          await get().fetchBalances(address)
          await get().fetchStats(address)
          
        } catch (error) {
          set({ 
            isLoading: false, 
            error: error instanceof Error ? error.message : "Error fetching user data" 
          })
          console.error("Error fetching user data:", error)
          throw error
        }
      },

      fetchBalances: async (address) => {
        try {
          set({ isLoading: true, error: null })
          
          // Try to fetch balances
          let response;
          try {
            response = await userService.fetchUserBalances(address);
          } catch (error) {
            console.warn("Error fetching balances from API, using fallback data:", error);
            // Use fallback data in case of API error
            set({
              balances: {
                USDC: 5280.42,
                ADC: 12450.0,
              },
              isLoading: false,
            });
            return;
          }
          
          if (response.success && response.data) {
            set({
              balances: response.data,
              isLoading: false,
            });
          } else {
            // Fallback mock data
            console.log("Using fallback balance data");
            set({
              balances: {
                USDC: 5280.42,
                ADC: 12450.0,
              },
              isLoading: false,
            });
          }
        } catch (error) {
          // This should now only catch errors not related to the API call itself
          console.error("Unexpected error in fetchBalances:", error);
          set({ 
            isLoading: false, 
            error: error instanceof Error ? error.message : "Error fetching balances",
            // Set fallback data even in case of error
            balances: {
              USDC: 5280.42,
              ADC: 12450.0,
            }
          });
        }
      },

      updateUser: async (userData) => {
        try {
          set({ isLoading: true, error: null })
          
          const { user } = get()
          if (!user || !user.walletAddress) {
            throw new Error("No user or wallet address")
          }
          
          const response = await userService.updateUserProfile(user.walletAddress, userData)
          
          if (response.success && response.data) {
            set({
              user: response.data,
              isLoading: false,
            })
          } else {
            throw new Error(response.error || "Failed to update user profile")
          }
        } catch (error) {
          set({ 
            isLoading: false, 
            error: error instanceof Error ? error.message : "Error updating user profile" 
          })
          console.error("Error updating user profile:", error)
          throw error
        }
      },

      updateBalances: async (balances) => {
        set((state) => ({
          balances: state.balances ? { ...state.balances, ...balances } : balances as any,
        }))
      },

      updateStats: async (stats) => {
        set((state) => ({
          stats: state.stats ? { ...state.stats, ...stats } : stats as any,
        }))
      },

      linkWallet: (walletInfo) => {
        const { user } = get()
        if (!user) return
        
        const linkedWallets = [...(user.linkedWallets || []), walletInfo]
        
        set({
          user: {
            ...user,
            linkedWallets,
          },
        })
      },

      fetchStats: async (address) => {
        try {
          set({ isLoading: true, error: null })
          
          const response = await userService.fetchUserStats(address)
          
          if (response.success && response.data) {
            set({
              stats: response.data,
              isLoading: false,
            })
          } else {
            // Fallback mock data
            set({
              stats: {
                campaignsCreated: Math.floor(Math.random() * 10),
                activeDisplays: Math.floor(Math.random() * 15),
                totalSpent: Math.floor(Math.random() * 15000),
                avgCPI: parseFloat((Math.random() * 0.01 + 0.001).toFixed(4)),
              },
              isLoading: false,
            })
          }
        } catch (error) {
          set({ 
            isLoading: false, 
            error: error instanceof Error ? error.message : "Error fetching stats" 
          })
          console.error("Error fetching stats:", error)
        }
      },

      fetchSettings: async (address) => {
        // For now we'll use local settings
        // In a real implementation, we'd fetch from the API
      },

      updateSettings: async (settings) => {
        try {
          set({ isLoading: true, error: null })
          
          // Update local settings immediately for responsive UI
          if (settings.notificationSettings) {
            set((state) => ({
              notificationSettings: {
                ...state.notificationSettings,
                ...settings.notificationSettings,
              },
            }))
          }
          
          if (settings.privacySettings) {
            set((state) => ({
              privacySettings: {
                ...state.privacySettings,
                ...settings.privacySettings,
              },
            }))
          }
          
          const { user } = get()
          if (!user || !user.walletAddress) {
            set({ isLoading: false })
            return
          }
          
          // We would save to API here in a real implementation
          set({ isLoading: false })
        } catch (error) {
          set({ 
            isLoading: false, 
            error: error instanceof Error ? error.message : "Error updating settings" 
          })
          console.error("Error updating settings:", error)
        }
      },

      clearError: () => set({ error: null }),
    }),
    {
      name: "user-store",
      // Only persist these keys to avoid sensitive data in localStorage
      partialize: (state) => ({
        isConnected: state.isConnected,
        // We don't persist user data for security
        // It will be refetched when the app loads
        notificationSettings: state.notificationSettings,
        privacySettings: state.privacySettings,
      }),
    }
  )
);