import { create } from "zustand"
import { persist } from "zustand/middleware"

export type ModalType = "addFunds" | "createCampaign" | "notifications" | "settings" | "providerInfo" | null

export interface UIState {
  // Theme
  theme: "light" | "dark" | "system"

  // Navigation
  isMobileMenuOpen: boolean
  isScrolled: boolean

  // Notifications
  notifications: {
    id: string
    title: string
    message: string
    type: "info" | "success" | "warning" | "error"
    read: boolean
  }[]
  unreadCount: number

  // Modals
  activeModal: ModalType
  modalData: any // For passing data to modals

  // Actions
  setTheme: (theme: "light" | "dark" | "system") => void
  toggleMobileMenu: () => void
  setScrolled: (isScrolled: boolean) => void
  addNotification: (notification: Omit<UIState["notifications"][0], "id" | "read">) => void
  markNotificationAsRead: (id: string) => void
  markAllNotificationsAsRead: () => void
  removeNotification: (id: string) => void
  openModal: (modalId: ModalType, data?: any) => void
  closeModal: () => void
}

export const useUIStore = create<UIState>()(
  persist(
    (set, get) => ({
      // Initial state
      theme: "system",
      isMobileMenuOpen: false,
      isScrolled: false,
      notifications: [
        {
          id: "1",
          title: "Welcome to ADNET",
          message: "Thanks for joining our platform!",
          type: "info",
          read: false,
        },
        {
          id: "2",
          title: "Transaction Successful",
          message: "Your deposit of 1000 USDC was successful.",
          type: "success",
          read: false,
        },
      ],
      unreadCount: 2,
      activeModal: null,
      modalData: null,

      // Actions
      setTheme: (theme) => set({ theme }),

      toggleMobileMenu: () =>
        set((state) => ({
          isMobileMenuOpen: !state.isMobileMenuOpen,
        })),

      setScrolled: (isScrolled) => set({ isScrolled }),

      addNotification: (notification) =>
        set((state) => {
          const newNotification = {
            ...notification,
            id: Date.now().toString(),
            read: false,
          }
          return {
            notifications: [newNotification, ...state.notifications],
            unreadCount: state.unreadCount + 1,
          }
        }),

      markNotificationAsRead: (id) =>
        set((state) => {
          const updatedNotifications = state.notifications.map((notification) =>
            notification.id === id ? { ...notification, read: true } : notification,
          )

          const unreadCount = updatedNotifications.filter((n) => !n.read).length

          return {
            notifications: updatedNotifications,
            unreadCount,
          }
        }),

      markAllNotificationsAsRead: () =>
        set((state) => ({
          notifications: state.notifications.map((n) => ({ ...n, read: true })),
          unreadCount: 0,
        })),

      removeNotification: (id) =>
        set((state) => {
          const notification = state.notifications.find((n) => n.id === id)
          const isUnread = notification && !notification.read

          return {
            notifications: state.notifications.filter((n) => n.id !== id),
            unreadCount: isUnread ? state.unreadCount - 1 : state.unreadCount,
          }
        }),

      openModal: (modalId, data = null) => set({ activeModal: modalId, modalData: data }),

      closeModal: () => set({ activeModal: null, modalData: null }),
    }),
    {
      name: "adnet-ui-storage",
      partialize: (state) => ({
        theme: state.theme,
        notifications: state.notifications,
        unreadCount: state.unreadCount,
      }),
    },
  ),
)

