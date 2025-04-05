"use client"

import { useState, useEffect } from "react"
import { useAdContract } from "@/hooks/use-ad-contract"
import { Badge } from "@/components/ui/badge"
import { Skeleton } from "@/components/ui/skeleton"
import { getStatusString } from "@/lib/store/useLocationStore"
import { AdContractSystem, BoothStatus } from "@/lib/AdCampaignSystem/AdCampaignSystem"
import { RefreshCw } from "lucide-react"

interface LocationStatusDisplayProps {
  deviceId: number
  variant?: "badge" | "inline" | "block"
  showActive?: boolean
  className?: string
  refreshInterval?: number // in milliseconds, 0 means no auto-refresh
}

export function LocationStatusDisplay({
  deviceId,
  variant = "badge",
  showActive = true,
  className = "",
  refreshInterval = 0
}: LocationStatusDisplayProps) {
  const { adContract } = useAdContract()
  
  const [status, setStatus] = useState<number | undefined>(undefined)
  const [isActive, setIsActive] = useState<boolean | undefined>(undefined)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [isRefreshing, setIsRefreshing] = useState(false)
  
  // Fetch status from blockchain
  const fetchStatus = async () => {
    if (!deviceId || !adContract) return
    
    try {
      setIsRefreshing(true)
      
      // Get booth details from blockchain
      const boothDetails = await adContract.getBoothDetails(deviceId)
      
      setStatus(boothDetails.status)
      setIsActive(boothDetails.active)
      setError(null)
    } catch (err) {
      console.error("Error fetching booth status:", err)
      setError("Failed to fetch status")
    } finally {
      setIsLoading(false)
      setIsRefreshing(false)
    }
  }
  
  // Initial fetch
  useEffect(() => {
    if (deviceId && adContract) {
      fetchStatus()
    }
  }, [deviceId, adContract])
  
  // Set up refresh interval if specified
  useEffect(() => {
    if (refreshInterval && refreshInterval > 0) {
      const intervalId = setInterval(() => {
        fetchStatus()
      }, refreshInterval)
      
      return () => clearInterval(intervalId)
    }
  }, [refreshInterval, deviceId, adContract])
  
  // Skip rendering if no deviceId
  if (!deviceId) {
    return null
  }
  
  // Loading state
  if (isLoading) {
    return (
      <Skeleton 
        className={`${
          variant === "badge" 
            ? "h-6 w-16" 
            : variant === "inline" 
              ? "h-5 w-20 inline-block" 
              : "h-6 w-24"
        } bg-gray-200 ${className}`} 
      />
    )
  }
  
  // Error state
  if (error) {
    return (
      <Badge 
        variant="outline" 
        className={`bg-red-50 text-red-800 border-red-200 ${className}`}
      >
        Error
      </Badge>
    )
  }
  
  // Get status color and text
  const getStatusColor = (status?: number, isActive?: boolean) => {
    if (isActive === false) {
      return "bg-gray-100 text-gray-800 border-gray-200"
    }
    
    switch (status) {
      case BoothStatus.Unbooked:
        return "bg-green-100 text-green-800 border-green-200"
      case BoothStatus.Booked:
        return "bg-blue-100 text-blue-800 border-blue-200"
      case BoothStatus.UnderMaintenance:
        return "bg-orange-100 text-orange-800 border-orange-200"
      default:
        return "bg-gray-100 text-gray-800 border-gray-200"
    }
  }
  
  // Render based on variant
  if (variant === "badge") {
    return (
      <Badge 
        className={`${getStatusColor(status, isActive)} ${className} ${isRefreshing ? "relative overflow-hidden" : ""}`}
      >
        {isRefreshing && (
          <div className="absolute inset-0 flex items-center justify-center bg-black/10">
            <RefreshCw className="h-3 w-3 animate-spin text-white" />
          </div>
        )}
        {!isActive ? "Inactive" : getStatusString(status)}
      </Badge>
    )
  }
  
  if (variant === "inline") {
    return (
      <span 
        className={`text-sm font-medium ${
          isActive === false
            ? "text-gray-500"
            : status === BoothStatus.Unbooked
              ? "text-green-600"
              : status === BoothStatus.Booked
                ? "text-blue-600"
                : status === BoothStatus.UnderMaintenance
                  ? "text-orange-600"
                  : "text-gray-500"
        } ${className} ${isRefreshing ? "opacity-60" : ""}`}
      >
        {isRefreshing && (
          <RefreshCw className="h-3 w-3 animate-spin inline-block mr-1" />
        )}
        {!isActive ? "Inactive" : getStatusString(status)}
      </span>
    )
  }
  
  // Block variant (default)
  return (
    <div className={`${className}`}>
      {showActive && (
        <div className="text-sm text-gray-600 mb-1">Device Status:</div>
      )}
      <div className="flex items-center gap-2">
        <div className={`w-3 h-3 rounded-full ${
          isActive === false
            ? "bg-gray-400"
            : status === BoothStatus.Unbooked
              ? "bg-green-500"
              : status === BoothStatus.Booked
                ? "bg-blue-500"
                : status === BoothStatus.UnderMaintenance
                  ? "bg-orange-500"
                  : "bg-gray-400"
        }`} />
        <span className="font-medium">
          {isRefreshing && (
            <RefreshCw className="h-3 w-3 animate-spin inline-block mr-1" />
          )}
          {!isActive ? "Inactive" : getStatusString(status)}
        </span>
      </div>
      {!showActive && isActive === false && (
        <div className="text-xs text-gray-500 mt-1">Device is inactive</div>
      )}
    </div>
  )
} 