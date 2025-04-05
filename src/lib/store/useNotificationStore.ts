import { create } from "zustand"
import { persist } from "zustand/middleware"
import { isClient } from "@/lib/client-utils"
import { v4 as uuidv4 } from "uuid"
import { toast } from "@/lib/toast"

export type NotificationType = "info" | "success" | "warning" | "error" | "transaction" | "campaign" | "location"
export type NotificationPriority = "low" | "medium" | "high" | "urgent"

export type Notification = {
  id: string
  title: string
  message: string
  type: NotificationType
  priority: NotificationPriority
  read: boolean
  actionUrl?: string
  actionText?: string
  entityId?: string
  entityType?: "location" | "campaign" | "transaction"
  timestamp: string
  expiresAt?: string
}

type NotificationStore = {
  notifications: Notification[]
  unreadCount: number
  isLoading: boolean
  error: string | null

  // Actions
  addNotification: (notification: Omit<Notification, "id" | "read" | "timestamp">) => void
  markAsRead: (id: string) => void
  markAllAsRead: () => void
  deleteNotification: (id: string) => void
  clearAllNotifications: () => void
  getUnreadNotifications: () => Notification[]
  getNotificationsByType: (type: NotificationType) => Notification[]
  getNotificationsByEntity: (entityId: string, entityType?: "location" | "campaign" | "transaction") => Notification[]
}

export const useNotificationStore = create<NotificationStore>()(
  persist(
    (set, get) => ({
      notifications: [
        {
          id: "notif-1",
          title: "Welcome to ADNET",
          message: "Thanks for joining our platform!",
          type: "info",
          priority: "medium",
          read: false,
          timestamp: new Date().toISOString(),
        },
        {
          id: "notif-2",
          title: "Transaction Successful",
          message: "Your deposit of 1000 USDC was successful.",
          type: "transaction",
          priority: "medium",
          read: false,
          entityId: "tx-123456",
          entityType: "transaction",
          timestamp: new Date(Date.now() - 3600000).toISOString(),
        },
      ],
      unreadCount: 2,
      isLoading: false,
      error: null,

      addNotification: (notification) => {
        const newNotification: Notification = {
          ...notification,
          id: `notif-${uuidv4().substring(0, 8)}`,
          read: false,
          timestamp: new Date().toISOString(),
        }

        set((state) => ({
          notifications: [newNotification, ...state.notifications],
          unreadCount: state.unreadCount + 1,
        }))

        // Show toast for high priority notifications
        if (notification.priority === "high" || notification.priority === "urgent") {
          toast(
            notification.title,
            { description: notification.message },
            notification.type === "error"
              ? "error"
              : notification.type === "warning"
                ? "warning"
                : notification.type === "success"
                  ? "success"
                  : "info",
          )
        }
      },

      markAsRead: (id) => {
        set((state) => {
          const notification = state.notifications.find((n) => n.id === id)
          if (!notification || notification.read) {
            return state
          }

          return {
            notifications: state.notifications.map((n) => (n.id === id ? { ...n, read: true } : n)),
            unreadCount: state.unreadCount - 1,
          }
        })
      },

      markAllAsRead: () => {
        set((state) => ({
          notifications: state.notifications.map((n) => ({ ...n, read: true })),
          unreadCount: 0,
        }))
      },

      deleteNotification: (id) => {
        set((state) => {
          const notification = state.notifications.find((n) => n.id === id)
          const isUnread = notification && !notification.read

          return {
            notifications: state.notifications.filter((n) => n.id !== id),
            unreadCount: isUnread ? state.unreadCount - 1 : state.unreadCount,
          }
        })
      },

      clearAllNotifications: () => {
        set({
          notifications: [],
          unreadCount: 0,
        })
      },

      getUnreadNotifications: () => {
        return get().notifications.filter((n) => !n.read)
      },

      getNotificationsByType: (type) => {
        return get().notifications.filter((n) => n.type === type)
      },

      getNotificationsByEntity: (entityId, entityType) => {
        return get().notifications.filter(
          (n) => n.entityId === entityId && (entityType ? n.entityType === entityType : true),
        )
      },
    }),
    {
      name: "notification-store",
      skipHydration: true,
      partialize: (state) =>
        isClient
          ? {
              notifications: state.notifications,
              unreadCount: state.unreadCount,
            }
          : {},
    },
  ),
)

