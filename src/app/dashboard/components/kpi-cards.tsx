"use client"

import { useState, useEffect, useCallback, useRef } from 'react'
import { Activity, Waves, BarChart3, DollarSign } from "lucide-react"
import { useBlockchainService, useBoothRegistry, usePerformanceOracle } from "@/hooks"
import { Skeleton } from "@/components/ui/skeleton"
import { Booth, BoothStatus } from "@/lib/blockchain"

type KPICardProps = {
  title: string
  value: string
  change: string
  type: "increase" | "decrease" | "neutral"
  icon: React.ReactNode
}

const KPICard = ({ title, value, change, type, icon }: KPICardProps) => {
  const colorClass =
    type === "increase"
      ? "text-green-600"
      : type === "decrease"
      ? "text-red-600"
      : "text-gray-500"

  return (
    <div className="border-[6px] border-black bg-white p-4 shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] hover:shadow-[12px_12px_0px_0px_rgba(0,0,0,1)] transition-all duration-300">
      <div className="flex items-start justify-between mb-3">
        <h3 className="font-bold text-sm text-gray-500">{title}</h3>
        <div className="rounded-full border-[3px] border-black p-1.5 bg-[#f5f5f5]">
          {icon}
        </div>
      </div>
      <div className="font-black text-3xl mb-1">{value}</div>
      <div className={`text-sm font-bold flex items-center gap-1 ${colorClass}`}>
        {type === "increase" ? "↑" : type === "decrease" ? "↓" : "→"} {change}
      </div>
    </div>
  )
}

interface ContractStats {
  campaigns: number;
  activeDisplays: number;
  totalViews: number;
  totalTaps: number;
  change: {
    campaigns: number;
    activeDisplays: number;
    totalViews: number;
    totalTaps: number;
  };
}

export default function KPICards() {
  const { service } = useBlockchainService()
  const { getAllCampaigns, getAllBooths, getActiveBooths , getMyAdvertiserCampaigns } = useBoothRegistry()
  const { getDailyMetrics } = usePerformanceOracle()
  
  const [isLoading, setIsLoading] = useState<boolean>(true)
  const [error, setError] = useState<string | null>(null)
  const [stats, setStats] = useState<ContractStats | null>(null)
  const hasFetchedRef = useRef(false)

  const fetchData = useCallback(async () => {
    try {
      setIsLoading(true)
      setError(null)

      if (!service) {
        throw new Error("Blockchain service not initialized")
      }

      // Fetch booths and campaigns in parallel
      const [booths, campaigns, activeBoothIds] = await Promise.all([
        getAllBooths(),
        getMyAdvertiserCampaigns(),
        getActiveBooths()
      ])

      // Calculate active display count
      const activeDisplays = activeBoothIds?.length || 0
      const campaignCount = campaigns?.length || 0

      // Calculate total views and taps
      let totalViews = 0
      let totalTaps = 0

      // Process each booth to get metrics
      if (booths && booths.length > 0) {
        // Simulate previous period values (for change calculation)
        // In a real implementation, you would fetch historical data
        const previousViews = totalViews * 0.8
        const previousTaps = totalTaps * 0.7
        const previousCampaigns = campaignCount * 0.9
        const previousActiveDisplays = activeDisplays * 0.85

        // Calculate change percentages
        const viewsChange = totalViews > 0 ? (totalViews - previousViews) / previousViews : 0
        const tapsChange = totalTaps > 0 ? (totalTaps - previousTaps) / previousTaps : 0
        const campaignsChange = campaignCount > 0 ? (campaignCount - previousCampaigns) / previousCampaigns : 0
        const displaysChange = activeDisplays > 0 ? (activeDisplays - previousActiveDisplays) / previousActiveDisplays : 0

        setStats({
          campaigns: campaignCount,
          activeDisplays,
          totalViews,
          totalTaps,
          change: { 
            campaigns: campaignsChange, 
            activeDisplays: displaysChange, 
            totalViews: viewsChange, 
            totalTaps: tapsChange 
          }
        })
      } else {
        // Set default stats if no data
        setStats({
          campaigns: campaignCount,
          activeDisplays,
          totalViews: 0,
          totalTaps: 0,
          change: { campaigns: 0, activeDisplays: 0, totalViews: 0, totalTaps: 0 }
        })
      }

      setIsLoading(false)
    } catch (err: any) {
      console.error("Error fetching KPI data:", err)
      setError(err.message || "Failed to fetch KPI data")
      setIsLoading(false)

      // Set empty stats
      setStats({
        campaigns: 0,
        activeDisplays: 0,
        totalViews: 0,
        totalTaps: 0,
        change: { campaigns: 0, activeDisplays: 0, totalViews: 0, totalTaps: 0 }
      })
    }
  }, [service])

  useEffect(() => {
    if (service && !hasFetchedRef.current) {
      fetchData()
      hasFetchedRef.current = true
    }
  }, [service, fetchData])

  // If loading, show skeleton UI
  if (isLoading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className="border-[6px] border-black bg-white p-4 shadow-[8px_8px_0px_0px_rgba(0,0,0,1)]">
            <div className="flex items-start justify-between mb-3">
              <Skeleton className="h-5 w-24" />
              <Skeleton className="h-10 w-10 rounded-full" />
            </div>
            <Skeleton className="h-10 w-32 mb-1" />
            <Skeleton className="h-5 w-20" />
          </div>
        ))}
      </div>
    )
  }

  // If error, show error message
  if (error) {
    return (
      <div className="border-[6px] border-black bg-[#FF3366] text-white p-6 mb-8">
        <h3 className="font-bold mb-2">Error Loading Data</h3>
        <p>{error}</p>
      </div>
    )
  }

  // If no stats available, show empty state
  if (!stats) {
    return (
      <div className="border-[6px] border-black bg-[#f5f5f5] p-6 mb-8">
        <h3 className="font-bold mb-2">No Data Available</h3>
        <p>Connect your wallet to view your campaign statistics.</p>
      </div>
    )
  }

  // Format change values for display
  const formatChange = (value: number) => {
    const absValue = Math.abs(value * 100)
    return `${absValue.toFixed(1)}%`
  }

  // Determine change types
  const getChangeType = (value: number): "increase" | "decrease" | "neutral" => {
    if (value > 0) return "increase"
    if (value < 0) return "decrease"
    return "neutral"
  }

  const kpiData = [
    {
      title: "Campaigns Created",
      value: stats.campaigns ? stats.campaigns.toString() : "0",
      change: formatChange(stats.change?.campaigns || 0),
      type: getChangeType(stats.change?.campaigns || 0),
      icon: <Activity className="h-6 w-6 text-[#0055FF]" />,
    },
    {
      title: "Active Displays",
      value: stats.activeDisplays ? stats.activeDisplays.toString() : "0",
      change: formatChange(stats.change?.activeDisplays || 0),
      type: getChangeType(stats.change?.activeDisplays || 0),
      icon: <Waves className="h-6 w-6 text-[#FFCC00]" />,
    },
    {
      title: "Total Views",
      value: stats.totalViews !== undefined ? stats.totalViews.toLocaleString() : "0",
      change: formatChange(stats.change?.totalViews || 0),
      type: getChangeType(stats.change?.totalViews || 0),
      icon: <DollarSign className="h-6 w-6 text-[#FF3366]" />,
    },
    {
      title: "Total Taps",
      value: stats.totalTaps !== undefined ? stats.totalTaps.toLocaleString() : "0",
      change: formatChange(stats.change?.totalTaps || 0),
      type: getChangeType(stats.change?.totalTaps || 0),
      icon: <BarChart3 className="h-6 w-6 text-[#33CC99]" />,
    },
  ]

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
      {kpiData.map((kpi, index) => (
        <KPICard
          key={index}
          title={kpi.title}
          value={kpi.value}
          change={kpi.change}
          type={kpi.type}
          icon={kpi.icon}
        />
      ))}
    </div>
  )
}

