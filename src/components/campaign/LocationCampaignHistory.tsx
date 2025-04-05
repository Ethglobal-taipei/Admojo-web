"use client"

import { useState, useEffect } from "react"
import { useAdContract } from "@/hooks/use-ad-contract"
import { Badge } from "@/components/ui/badge"
import { Skeleton } from "@/components/ui/skeleton"
import { AlertCircle, RefreshCw, Calendar } from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { format } from "date-fns"
import { useRouter } from "next/navigation"

interface LocationCampaignHistoryProps {
  deviceId: number
  variant?: "full" | "compact"
  className?: string
  maxItems?: number
}

export function LocationCampaignHistory({
  deviceId,
  variant = "full",
  className = "",
  maxItems = 0
}: LocationCampaignHistoryProps) {
  const router = useRouter()
  const { adContract } = useAdContract()
  
  const [campaigns, setCampaigns] = useState<any[]>([])
  const [activeCampaigns, setActiveCampaigns] = useState<any[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [isRefreshing, setIsRefreshing] = useState(false)
  
  // Fetch campaign history from blockchain
  const fetchCampaignHistory = async () => {
    if (!deviceId || !adContract) return
    
    try {
      setIsRefreshing(true)
      
      // Get campaign history for this device
      const history = await adContract.getDevicePreviousCampaigns(deviceId)
      
      // Transform the history data
      const transformedHistory = history.campaignIds.map((id: number, index: number) => ({
        id,
        advertiser: history.advertisers[index],
        metadata: history.metadatas[index],
        active: history.activeStatus[index]
      }))
      
      // Sort active campaigns first, then by ID (most recent first)
      const sortedHistory = transformedHistory.sort((a: any, b: any) => {
        if (a.active && !b.active) return -1
        if (!a.active && b.active) return 1
        return Number(b.id) - Number(a.id)
      })
      
      // Get current (active) campaigns
      const active = sortedHistory.filter((campaign: any) => campaign.active)
      
      // Limit number of items if maxItems is set
      const limitedHistory = maxItems > 0 ? sortedHistory.slice(0, maxItems) : sortedHistory
      
      setCampaigns(limitedHistory)
      setActiveCampaigns(active)
      setError(null)
    } catch (err) {
      console.error("Error fetching campaign history:", err)
      setError("Failed to fetch campaign history")
    } finally {
      setIsLoading(false)
      setIsRefreshing(false)
    }
  }
  
  // Initial fetch
  useEffect(() => {
    if (deviceId && adContract) {
      fetchCampaignHistory()
    }
  }, [deviceId, adContract])
  
  // Refresh handler
  const handleRefresh = () => {
    fetchCampaignHistory()
  }
  
  // Format date from timestamp
  const formatDate = (timestamp: string | number | bigint) => {
    if (!timestamp) return "Unknown date"
    
    try {
      const date = new Date(Number(timestamp) * 1000)
      return format(date, "MMM d, yyyy")
    } catch (e) {
      return "Invalid date"
    }
  }
  
  // Calculate campaign progress percentage
  const calculateProgress = (startTimestamp: bigint, durationDays: number) => {
    if (!startTimestamp || !durationDays) return 0
    
    const startTime = Number(startTimestamp) * 1000
    const duration = durationDays * 24 * 60 * 60 * 1000
    const elapsed = Date.now() - startTime
    
    return Math.min(100, Math.max(0, (elapsed / duration) * 100))
  }
  
  // Navigate to campaign details
  const navigateToCampaign = (campaignId: string) => {
    router.push(`/advertiser/campaigns/${campaignId}/manage`)
  }
  
  // Skip rendering if no deviceId
  if (!deviceId) {
    return null
  }
  
  // Loading state
  if (isLoading) {
    return (
      <div className={className}>
        <div className="space-y-4">
          <Skeleton className="h-16 w-full bg-gray-200" />
          <Skeleton className="h-16 w-full bg-gray-200" />
          {variant === "full" && <Skeleton className="h-16 w-full bg-gray-200" />}
        </div>
      </div>
    )
  }
  
  // Error state
  if (error) {
    return (
      <div className={`bg-red-50 border-2 border-red-200 p-4 rounded-md ${className}`}>
        <div className="flex items-center gap-2 text-red-700">
          <AlertCircle className="h-5 w-5" />
          <p className="font-medium">Unable to load campaign history</p>
        </div>
        <Button 
          variant="outline" 
          size="sm" 
          onClick={handleRefresh} 
          className="mt-2 text-red-700 border-red-300"
        >
          <RefreshCw className="h-3 w-3 mr-1" />
          Retry
        </Button>
      </div>
    )
  }
  
  // Empty state
  if (campaigns.length === 0) {
    return (
      <div className={`text-center py-8 border-2 border-dashed border-gray-300 rounded-md ${className}`}>
        <AlertCircle className="h-10 w-10 mx-auto mb-2 text-gray-400" />
        <p className="text-gray-500 font-medium">No campaign history found for this location</p>
      </div>
    )
  }
  
  // Compact variant
  if (variant === "compact") {
    return (
      <div className={className}>
        <div className="flex justify-between items-center mb-3">
          <h3 className="font-medium">Campaign History</h3>
          <Badge className="bg-blue-100 text-blue-800">
            {activeCampaigns.length} Active
          </Badge>
        </div>
        
        <div className="space-y-2">
          {campaigns.map((campaign) => (
            <div
              key={campaign.id}
              className={`p-3 border-2 rounded-md cursor-pointer hover:bg-gray-50 
                ${campaign.active ? "border-blue-200 bg-blue-50" : "border-gray-200"}`}
              onClick={() => navigateToCampaign(campaign.id.toString())}
            >
              <div className="flex justify-between">
                <div className="font-medium text-sm">
                  {campaign.metadata.name || `Campaign #${campaign.id}`}
                </div>
                <Badge className={campaign.active ? "bg-green-100 text-green-800" : "bg-gray-100 text-gray-800"}>
                  {campaign.active ? "Active" : "Ended"}
                </Badge>
              </div>
              
              {campaign.metadata.startDate && (
                <div className="flex items-center mt-1 text-xs text-gray-500">
                  <Calendar className="h-3 w-3 mr-1" />
                  {formatDate(campaign.metadata.startDate)}
                  {campaign.metadata.duration && (
                    <span className="ml-1">({campaign.metadata.duration} days)</span>
                  )}
                </div>
              )}
            </div>
          ))}
          
          {maxItems > 0 && campaigns.length >= maxItems && (
            <Button
              variant="outline"
              size="sm"
              className="w-full mt-2 border-dashed text-gray-600"
              onClick={() => router.push(`/provider/locations/${deviceId}`)}
            >
              View all campaigns
            </Button>
          )}
        </div>
      </div>
    )
  }
  
  // Full variant (default)
  return (
    <Card className={`border-3 border-black ${className}`}>
      <CardHeader className="pb-2 flex flex-row items-center justify-between">
        <CardTitle className="text-lg">Campaign History</CardTitle>
        <div className="flex items-center gap-2">
          <Badge className="bg-blue-100 text-blue-800">
            {activeCampaigns.length} Active
          </Badge>
          <Button
            variant="outline"
            size="sm"
            onClick={handleRefresh}
            disabled={isRefreshing}
            className="h-8 w-8 p-0"
          >
            <RefreshCw className={`h-4 w-4 ${isRefreshing ? "animate-spin" : ""}`} />
          </Button>
        </div>
      </CardHeader>
      
      <CardContent>
        <div className="space-y-4">
          {campaigns.map((campaign) => (
            <div
              key={campaign.id}
              className={`p-4 border-2 rounded-md cursor-pointer hover:bg-gray-50 
                ${campaign.active ? "border-blue-200 bg-blue-50" : "border-gray-200"}`}
              onClick={() => navigateToCampaign(campaign.id.toString())}
            >
              <div className="flex justify-between items-start mb-2">
                <div>
                  <div className="font-medium">
                    {campaign.metadata.name || `Campaign #${campaign.id}`}
                  </div>
                  <div className="text-sm text-gray-600">
                    Advertiser: {campaign.advertiser.slice(0, 6)}...{campaign.advertiser.slice(-4)}
                  </div>
                </div>
                <Badge className={campaign.active ? "bg-green-100 text-green-800" : "bg-gray-100 text-gray-800"}>
                  {campaign.active ? "Active" : "Ended"}
                </Badge>
              </div>
              
              {campaign.metadata.description && (
                <div className="text-sm text-gray-700 mt-2 line-clamp-2">
                  {campaign.metadata.description}
                </div>
              )}
              
              {campaign.metadata.startDate && (
                <div className="flex items-center mt-2 text-xs text-gray-500">
                  <Calendar className="h-3 w-3 mr-1" />
                  {formatDate(campaign.metadata.startDate)}
                  {campaign.metadata.duration && (
                    <span className="ml-1">
                      - {formatDate(
                        Number(campaign.metadata.startDate) + 
                        (campaign.metadata.duration * 24 * 60 * 60)
                      )}
                    </span>
                  )}
                </div>
              )}
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  )
} 