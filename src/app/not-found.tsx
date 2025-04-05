"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { Home, ArrowLeft, MapPin, LayoutDashboard, BarChart2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { useRoleStore } from "@/lib/store"

export default function NotFoundPage() {
  const router = useRouter()
  const { currentRole } = useRoleStore()
  const [countdown, setCountdown] = useState(10)

  // Auto redirect after countdown
  useEffect(() => {
    if (countdown <= 0) {
      router.push("/")
      return
    }

    const timer = setTimeout(() => {
      setCountdown(countdown - 1)
    }, 1000)

    return () => clearTimeout(timer)
  }, [countdown, router])

  // Determine theme colors based on role
  const themeColor = currentRole === "advertiser" ? "#0055FF" : "#FF3366"
  const accentColor = currentRole === "advertiser" ? "#FFCC00" : "#0055FF"

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-white relative overflow-hidden">
      {/* Background pattern */}
      <div className="absolute inset-0 bg-checkered-light opacity-50"></div>

      {/* Decorative elements */}
      <div className="absolute top-20 left-20 w-16 h-16 border-4 border-black rotate-45 bg-[#FFCC00]"></div>
      <div className="absolute bottom-20 right-20 w-24 h-24 border-4 border-black rounded-full bg-[#0055FF]"></div>
      <div className="absolute top-40 right-40 w-12 h-12 border-4 border-black bg-[#FF3366]"></div>

      {/* Main content */}
      <div className="relative z-10 container mx-auto px-4 py-12 flex flex-col items-center">
        {/* 404 text */}
        <div className="relative">
          <h1
            className="text-[180px] font-black leading-none tracking-tighter md:text-[250px]"
            style={{ color: themeColor }}
          >
            404
          </h1>

          {/* Glitch effect */}
          <h1 className="text-[180px] font-black leading-none tracking-tighter md:text-[250px] absolute top-1 left-1 text-[#FF3366] opacity-50 blur-[2px]">
            404
          </h1>
          <h1 className="text-[180px] font-black leading-none tracking-tighter md:text-[250px] absolute -top-1 -left-1 text-[#FFCC00] opacity-50 blur-[2px]">
            404
          </h1>
        </div>

        <h2 className="text-3xl md:text-4xl font-bold mb-6 text-center -mt-6">Page Not Found</h2>

        <p className="text-lg text-center max-w-md mb-8">
          The page you're looking for doesn't exist or has been moved.
        </p>

        {/* Countdown */}
        <div className="mb-8 text-center">
          <p className="text-lg">
            Redirecting to home in{" "}
            <span className="font-bold" style={{ color: themeColor }}>
              {countdown}
            </span>{" "}
            seconds
          </p>
          <div className="w-full max-w-md h-2 bg-gray-200 mt-2 overflow-hidden">
            <div
              className="h-full transition-all duration-1000"
              style={{
                width: `${(countdown / 10) * 100}%`,
                backgroundColor: themeColor,
              }}
            ></div>
          </div>
        </div>

        {/* Action buttons */}
        <div className="flex flex-col sm:flex-row gap-4 mb-12">
          <Button
            onClick={() => router.push("/")}
            className="border-[4px] border-black rounded-none shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] hover:-translate-y-1 transition-all font-bold py-6 px-8 h-auto"
            style={{
              backgroundColor: themeColor,
              color: "white",
            }}
          >
            <Home className="mr-2 h-5 w-5" /> Go Home
          </Button>

          <Button
            onClick={() => router.back()}
            className="border-[4px] border-black rounded-none bg-white text-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] hover:-translate-y-1 transition-all font-bold py-6 px-8 h-auto"
          >
            <ArrowLeft className="mr-2 h-5 w-5" /> Go Back
          </Button>
        </div>

        {/* Quick links */}
        <h3 className="text-xl font-bold mb-6 text-center">Or check out these pages:</h3>

        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6 max-w-4xl">
          <Link
            href={currentRole === "advertiser" ? "/dashboard" : "/provider-dashboard"}
            className="bg-white border-[4px] border-black p-6 flex flex-col items-center text-center shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] hover:-translate-y-2 transition-all"
          >
            <LayoutDashboard className="h-10 w-10 mb-4" style={{ color: themeColor }} />
            <h4 className="font-bold text-lg">Dashboard</h4>
            <p className="text-sm mt-2">View your {currentRole} dashboard</p>
          </Link>

          <Link
            href={currentRole === "advertiser" ? "/browse-locations" : "/my-locations"}
            className="bg-white border-[4px] border-black p-6 flex flex-col items-center text-center shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] hover:-translate-y-2 transition-all"
          >
            <MapPin className="h-10 w-10 mb-4" style={{ color: accentColor }} />
            <h4 className="font-bold text-lg">{currentRole === "advertiser" ? "Browse Locations" : "My Locations"}</h4>
            <p className="text-sm mt-2">
              {currentRole === "advertiser" ? "Find advertising locations" : "Manage your ad locations"}
            </p>
          </Link>

          <Link
            href={currentRole === "advertiser" ? "/analytics" : "/provider-analytics"}
            className="bg-white border-[4px] border-black p-6 flex flex-col items-center text-center shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] hover:-translate-y-2 transition-all"
          >
            <BarChart2 className="h-10 w-10 mb-4" style={{ color: "#FF3366" }} />
            <h4 className="font-bold text-lg">Analytics</h4>
            <p className="text-sm mt-2">View performance metrics</p>
          </Link>
        </div>
      </div>
    </div>
  )
}

