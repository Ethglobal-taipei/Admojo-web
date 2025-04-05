"use client"

import type React from "react"

import { useEffect, useState } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { Monitor, MapPin } from "lucide-react"
import { Progress } from "@/components/ui/progress"
import { useRoleStore } from "@/lib/store"

export default function RoleTransition() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const targetRole = searchParams.get("to") as "advertiser" | "provider"
  const { completeTransition } = useRoleStore()

  const [progress, setProgress] = useState(0)
  const [statusMessage, setStatusMessage] = useState("Initializing...")

  // Determine colors based on target role
  const primaryColor = targetRole === "advertiser" ? "#0055FF" : "#FF3366"
  const accentColor = targetRole === "advertiser" ? "#FFCC00" : "#0055FF"

  useEffect(() => {
    if (!targetRole) {
      router.push("/")
      return
    }

    // Simulate transition with progress updates
    const messages = [
      "Initializing...",
      `Loading ${targetRole} dashboard...`,
      "Updating interface...",
      "Almost there...",
      `Welcome to ${targetRole} mode!`,
    ]

    let step = 0
    const interval = setInterval(() => {
      if (step < messages.length) {
        setStatusMessage(messages[step])
        setProgress(Math.min(100, (step + 1) * 25))
        step++
      } else {
        clearInterval(interval)
        completeTransition()

        // Redirect to the appropriate dashboard
        if (targetRole === "advertiser") {
          router.push("/dashboard")
        } else {
          router.push("/provider-dashboard")
        }
      }
    }, 800)

    return () => clearInterval(interval)
  }, [targetRole, router, completeTransition])

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-white relative">
      {/* Background pattern */}
      <div className="fixed inset-0 -z-20 bg-white">
        <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNDAiIGhlaWdodD0iNDAiIHZpZXdCb3g9IjAgMCA0MCA0MCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48cGF0aCBkPSJNMCAwaDIwdjIwSDB6TTIwIDIwaDIwdjIwSDIweiIgZmlsbD0icmdiYSgwLDAsMCwwLjAzKSIgZmlsbC1ydWxlPSJldmVub2RkIi8+PC9zdmc+')] opacity-70"></div>
      </div>

      {/* Animated background elements */}
      <div className="fixed inset-0 -z-10 overflow-hidden pointer-events-none">
        <div
          className="absolute top-[10%] right-[5%] w-32 h-32 border-[6px] border-black rounded-full opacity-20 animate-pulse"
          style={{ backgroundColor: primaryColor }}
        ></div>
        <div
          className="absolute top-[30%] left-[8%] w-48 h-48 border-[6px] border-black opacity-10 animate-bounce"
          style={{
            backgroundColor: accentColor,
            animationDuration: "8s",
          }}
        ></div>
        <div
          className="absolute bottom-[15%] right-[15%] w-64 h-64 border-[6px] border-black opacity-10"
          style={{
            backgroundColor: primaryColor,
            animation: "spin 15s linear infinite",
          }}
        ></div>
      </div>

      <div className="w-full max-w-md p-8 relative">
        <div className="border-[6px] border-black bg-white p-8 shadow-[8px_8px_0_0_rgba(0,0,0,1)] relative overflow-hidden">
          {/* Role icon */}
          <div className="flex justify-center mb-6">
            <div
              className="w-24 h-24 rounded-full flex items-center justify-center border-[4px] border-black"
              style={{ backgroundColor: primaryColor }}
            >
              {targetRole === "advertiser" ? (
                <Monitor className="w-12 h-12 text-white" />
              ) : (
                <MapPin className="w-12 h-12 text-white" />
              )}
            </div>
          </div>

          {/* Title */}
          <h1 className="text-3xl font-black text-center mb-6" style={{ color: primaryColor }}>
            Switching to {targetRole.charAt(0).toUpperCase() + targetRole.slice(1)} Mode
          </h1>

          {/* Progress */}
          <div className="mb-4">
            <Progress
              value={progress}
              className="h-3 bg-gray-200 border-2 border-black"
              style={
                {
                  "--progress-background": primaryColor,
                } as React.CSSProperties
              }
            />
          </div>

          {/* Status message */}
          <p className="text-lg font-bold text-center">{statusMessage}</p>

          {/* Decorative elements */}
          <div
            className="absolute -bottom-12 -right-12 w-24 h-24 rotate-45"
            style={{ backgroundColor: accentColor }}
          ></div>
        </div>
      </div>
    </div>
  )
}

