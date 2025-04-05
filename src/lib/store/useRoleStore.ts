import { create } from "zustand"
import { persist, createJSONStorage } from "zustand/middleware"

export type UserRole = "advertiser" | "provider"

interface RoleState {
  // Current role
  currentRole: UserRole

  // Previous role (for transition effects)
  previousRole: UserRole | null

  // Transition state
  isTransitioning: boolean
  transitionTarget: UserRole | null

  // Provider registration
  isProviderRegistered: boolean

  // Registration progress
  registrationProgress: number

  // Actions
  switchRole: (role: UserRole) => void
  startTransition: (targetRole: UserRole) => void
  completeTransition: () => void
  cancelTransition: () => void
  setProviderRegistered: (status: boolean) => void
  updateRegistrationProgress: (progress: number) => void

  // Provider stats
  providerStats: {
    totalLocations: number
    activeLocations: number
    totalImpressions: number
    totalEarnings: number
  }
  updateProviderStats: (stats: Partial<RoleState["providerStats"]>) => void
}

export const useRoleStore = create<RoleState>()(
  persist(
    (set) => ({
      // Default role is advertiser
      currentRole: "advertiser",
      previousRole: null,

      // Transition state
      isTransitioning: false,
      transitionTarget: null,

      // Provider registration status
      isProviderRegistered: false,

      // Registration progress
      registrationProgress: 0,

      // Provider stats
      providerStats: {
        totalLocations: 0,
        activeLocations: 0,
        totalImpressions: 0,
        totalEarnings: 0,
      },

      // Actions
      switchRole: (role) =>
        set((state) => {
          // If already in this role, do nothing
          if (state.currentRole === role) return state

          return {
            previousRole: state.currentRole,
            currentRole: role,
          }
        }),

      startTransition: (targetRole) =>
        set({
          isTransitioning: true,
          transitionTarget: targetRole,
        }),

      completeTransition: () =>
        set((state) => ({
          currentRole: state.transitionTarget || state.currentRole,
          previousRole: state.currentRole,
          isTransitioning: false,
          transitionTarget: null,
        })),

      cancelTransition: () =>
        set({
          isTransitioning: false,
          transitionTarget: null,
        }),

      setProviderRegistered: (status) => set({ isProviderRegistered: status }),

      updateRegistrationProgress: (progress) => set({ registrationProgress: progress }),

      updateProviderStats: (stats) =>
        set((state) => ({
          providerStats: {
            ...state.providerStats,
            ...stats,
          },
        })),
    }),
    {
      name: "adnet-role-storage",
      storage: createJSONStorage(() => localStorage),
    },
  ),
)

