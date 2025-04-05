"use client"

import { useState } from "react"
import { Bell, X, Check, Filter, Trash2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu"
import { cn } from "@/lib/utils"

export default function NotificationIndicator() {
  const [unreadCount, setUnreadCount] = useState(3)
  const [notifications, setNotifications] = useState([
    {
      id: 1,
      title: "Swap Completed",
      message: "Successfully swapped 1000 USDC to 2350 ADC",
      time: "5 minutes ago",
      type: "transaction",
      read: false,
    },
    {
      id: 2,
      title: "Campaign Performance",
      message: "Your Times Square campaign is performing 15% above average",
      time: "2 hours ago",
      type: "performance",
      read: false,
    },
    {
      id: 3,
      title: "New Feature Available",
      message: "Try our new analytics dashboard for deeper insights",
      time: "1 day ago",
      type: "system",
      read: false,
    },
    {
      id: 4,
      title: "Verification Required",
      message: "Please verify your display device to continue earning",
      time: "2 days ago",
      type: "action",
      read: true,
    },
  ])

  const markAllAsRead = () => {
    setNotifications(notifications.map((n) => ({ ...n, read: true })))
    setUnreadCount(0)
  }

  const markAsRead = (id) => {
    setNotifications(notifications.map((n) => (n.id === id ? { ...n, read: true } : n)))
    setUnreadCount(Math.max(0, unreadCount - 1))
  }

  const clearAll = () => {
    setNotifications([])
    setUnreadCount(0)
  }

  // Get notification type styling
  const getNotificationTypeStyles = (type) => {
    switch (type) {
      case "transaction":
        return "bg-[#0055FF] text-white"
      case "performance":
        return "bg-[#FFCC00] text-black"
      case "system":
        return "bg-[#f5f5f5] text-black"
      case "action":
        return "bg-[#FF3366] text-white"
      default:
        return "bg-[#f5f5f5] text-black"
    }
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="outline"
          size="icon"
          className="relative bg-white border-[4px] border-black hover:bg-[#FFCC00] transition-all rounded-none w-12 h-12"
        >
          <Bell className="w-6 h-6" />
          {unreadCount > 0 && (
            <span className="absolute -top-2 -right-2 w-6 h-6 bg-[#FF3366] text-white text-xs font-bold flex items-center justify-center border-[2px] border-black animate-pulse">
              {unreadCount}
            </span>
          )}
        </Button>
      </DropdownMenuTrigger>

      <DropdownMenuContent className="w-[350px] border-[4px] border-black rounded-none shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] p-0 overflow-hidden">
        <div className="bg-[#f5f5f5] p-4 border-b-[3px] border-black flex items-center justify-between">
          <div className="font-bold text-lg">Notifications</div>
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="icon"
              className="h-8 w-8 border-[2px] border-black rounded-none hover:bg-white"
              onClick={markAllAsRead}
              disabled={unreadCount === 0}
            >
              <Check className="h-4 w-4" />
            </Button>
            <Button
              variant="outline"
              size="icon"
              className="h-8 w-8 border-[2px] border-black rounded-none hover:bg-white"
            >
              <Filter className="h-4 w-4" />
            </Button>
            <Button
              variant="outline"
              size="icon"
              className="h-8 w-8 border-[2px] border-black rounded-none hover:bg-white"
              onClick={clearAll}
              disabled={notifications.length === 0}
            >
              <Trash2 className="h-4 w-4" />
            </Button>
          </div>
        </div>

        <div className="max-h-[400px] overflow-y-auto">
          {notifications.length === 0 ? (
            <div className="p-8 text-center">
              <div className="font-bold text-lg mb-2">No notifications</div>
              <div className="text-gray-500">You're all caught up!</div>
            </div>
          ) : (
            notifications.map((notification) => (
              <div
                key={notification.id}
                className={cn(
                  "p-4 border-b-[2px] border-black hover:bg-[#f5f5f5] transition-all relative",
                  !notification.read && "bg-[#f5f5f5]/50",
                )}
              >
                <div className="flex gap-3">
                  <div className={cn("w-2 h-full", getNotificationTypeStyles(notification.type))}></div>

                  <div className="flex-1">
                    <div className="font-bold">{notification.title}</div>
                    <div className="text-sm mb-1">{notification.message}</div>
                    <div className="text-xs text-gray-500">{notification.time}</div>
                  </div>

                  {!notification.read && (
                    <Button
                      variant="outline"
                      size="icon"
                      className="h-6 w-6 border-[2px] border-black rounded-none hover:bg-white absolute top-2 right-2"
                      onClick={() => markAsRead(notification.id)}
                    >
                      <X className="h-3 w-3" />
                    </Button>
                  )}
                </div>

                {notification.type === "action" && (
                  <Button className="mt-2 bg-[#FF3366] text-white border-[2px] border-black hover:bg-[#FFCC00] hover:text-black transition-all font-bold text-sm px-3 py-1 h-auto rounded-none">
                    Take Action
                  </Button>
                )}
              </div>
            ))
          )}
        </div>

        <DropdownMenuSeparator className="h-[3px] bg-black my-0" />

        <div className="p-3 flex justify-center">
          <Button
            variant="outline"
            className="border-[3px] border-black rounded-none bg-white hover:bg-[#f5f5f5] transition-all font-bold text-sm px-4 py-2 h-auto"
          >
            View All Notifications
          </Button>
        </div>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}

