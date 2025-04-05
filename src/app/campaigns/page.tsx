"use client"

import { useState, useEffect, useRef } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Progress } from "@/components/ui/progress"
import { 
  CalendarIcon, 
  ChevronRightIcon, 
  PlayCircleIcon, 
  PauseCircleIcon, 
  PlusCircleIcon, 
  RefreshCw
} from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { useBlockchainService } from "@/hooks/use-blockchain-service"
import { useBoothRegistry } from "@/hooks/use-booth-registry"
import { formatAddress } from "@/lib/utils"
import DashboardHeader from "../dashboard/components/dashboard-header"
import type { Campaign } from "@/lib/blockchain/types"

// Enhanced campaign type for UI
interface EnhancedCampaign {
  id: string;
    name: string;
  status: number;
  createdAt: number;
  impressions: number;
  clicks: number;
  conversions: number;
  budgetAllocated: number;
  budgetSpent: number;
  durationDays: number;
  progressPercentage: number;
}

export default function CampaignsPage() {
  const router = useRouter()
  const { service, isCorrectChain, address } = useBlockchainService()
  
  // Get blockchain data with useBoothRegistry
  const {
    getAllCampaigns,
    allCampaigns,
    isLoadingAllCampaigns,
  } = useBoothRegistry()
  
  // Prevent infinite fetching with useRef
  const fetchedRef = useRef(false)
  
  const [loading, setLoading] = useState(true)
  const [campaigns, setCampaigns] = useState<EnhancedCampaign[]>([])
  const [activeTab, setActiveTab] = useState("all")
  
  // Fetch all campaigns on mount
  useEffect(() => {
    if (!service || !address || fetchedRef.current) return
    
    const fetchData = async () => {
      try {
        getAllCampaigns()
        fetchedRef.current = true
    } catch (error) {
      console.error("Error fetching campaigns:", error)
      }
    }
    
    fetchData()
  }, [service, address, getAllCampaigns])
  
  // Set loading state based on blockchain loading
  useEffect(() => {
    setLoading(isLoadingAllCampaigns)
  }, [isLoadingAllCampaigns])
  
  // Transform campaign data from blockchain to UI format
  useEffect(() => {
    if (!address || !allCampaigns) return
    
    // Filter campaigns to show only those created by the current user
    const userCampaigns = allCampaigns.filter(campaign => {
      if (!campaign?.advertiser) return false
      return campaign.advertiser.toLowerCase() === address.toLowerCase()
    })
    
    // Transform to UI format
    const enhancedCampaigns = userCampaigns.map(campaign => {
      // Extract additional info for budget
      const additionalInfo = campaign.metadata?.additionalInfo || ""
      const budget = additionalInfo.includes('budget:') 
        ? parseInt(additionalInfo.split('budget:')[1].trim()) 
        : 1000
      
      // Calculate elapsed time
      const startTime = Number(campaign.metadata?.startDate || 0)
      const now = Math.floor(Date.now() / 1000)
      const elapsed = now - startTime
      const duration = campaign.metadata?.duration || 30
      const durationSeconds = duration * 24 * 60 * 60
      
      // Determine status based on active flag and time
      let status = 0 // Pending
      if (campaign.active) {
        if (startTime > 0 && elapsed > 0) {
          if (elapsed >= durationSeconds) {
            status = 3 // Completed
          } else {
            status = 1 // Active
          }
        } else {
          status = 0 // Pending (active but not started)
        }
      } else {
        status = 2 // Paused
      }
      
      // Generate metrics (in a real app, these would come from API/blockchain)
      const impressions = Math.floor(Math.random() * 10000)
      const clicks = Math.floor(impressions * (Math.random() * 0.1))
      const conversions = Math.floor(clicks * (Math.random() * 0.2))
      const budgetSpent = Math.min(budget, budget * (elapsed / durationSeconds))
      
      return {
        id: campaign.id,
        name: campaign.metadata?.name || `Campaign #${campaign.id}`,
        status,
        createdAt: startTime,
        impressions,
        clicks,
        conversions,
        budgetAllocated: budget,
        budgetSpent,
        durationDays: duration,
        progressPercentage: (budgetSpent / budget) * 100
      }
    })
    
    setCampaigns(enhancedCampaigns)
  }, [allCampaigns, address])
  
  // Function to refresh data
  const handleRefresh = () => {
    setLoading(true)
    fetchedRef.current = false
    getAllCampaigns()
  }
  
  const getStatusBadge = (status: number) => {
    switch (status) {
      case 0: // Pending
        return <Badge className="bg-yellow-400 text-black">Pending</Badge>
      case 1: // Active
        return <Badge className="bg-green-500">Active</Badge>
      case 2: // Paused
        return <Badge className="bg-gray-500">Paused</Badge>
      case 3: // Completed
        return <Badge className="bg-blue-500">Completed</Badge>
      case 4: // Cancelled
        return <Badge className="bg-red-500">Cancelled</Badge>
      default:
        return <Badge className="bg-gray-300">Unknown</Badge>
    }
  }
  
  const filteredCampaigns = campaigns.filter(campaign => {
    if (activeTab === "all") return true
    if (activeTab === "active" && campaign.status === 1) return true
    if (activeTab === "paused" && campaign.status === 2) return true
    if (activeTab === "completed" && campaign.status === 3) return true
    if (activeTab === "cancelled" && campaign.status === 4) return true
    return false
  })
  
  if (!isCorrectChain) {
    return (
      <div className="container mx-auto py-6">
        <DashboardHeader />
        <div className="border-[6px] border-black bg-white p-8 mt-6 text-center">
          <h2 className="text-2xl font-black mb-4">Wrong Network</h2>
          <p className="mb-6">Please switch to the correct network to view your campaigns.</p>
          <Button 
            onClick={() => {
              if (service?.switchChain) {
                service.switchChain(11155111)
              }
            }} 
            className="bg-[#0055FF] text-white border-[4px] border-black hover:bg-[#FFCC00] hover:text-black transition-all font-bold"
          >
            Switch Network
          </Button>
        </div>
      </div>
    )
  }

  return (
    <div className="container mx-auto py-6">
      <DashboardHeader />

      <div className="flex justify-between items-center mt-6 mb-4">
          <h1 className="text-3xl font-black">My Campaigns</h1>
          <div className="flex gap-2">
            <Button
            onClick={handleRefresh}
            className="border-2 border-black rounded-none inline-flex items-center gap-2"
              variant="outline"
            >
            <RefreshCw className="w-4 h-4" />
              Refresh
            </Button>
            <Button
            onClick={() => router.push("/campaigns/create")}
            className="bg-[#0055FF] text-white border-[4px] border-black hover:bg-[#FFCC00] hover:text-black transition-all font-bold inline-flex items-center gap-2"
            >
            <PlusCircleIcon className="w-5 h-5" />
            Create Campaign
            </Button>
          </div>
        </div>

      <Tabs defaultValue="all" className="w-full" onValueChange={setActiveTab}>
        <TabsList className="mb-6 bg-transparent space-x-2">
          <TabsTrigger 
            value="all" 
            className="data-[state=active]:bg-[#0055FF] data-[state=active]:text-white border-2 border-black rounded-none"
          >
            All
          </TabsTrigger>
          <TabsTrigger 
            value="active" 
            className="data-[state=active]:bg-[#0055FF] data-[state=active]:text-white border-2 border-black rounded-none"
          >
            Active
          </TabsTrigger>
          <TabsTrigger 
            value="paused" 
            className="data-[state=active]:bg-[#0055FF] data-[state=active]:text-white border-2 border-black rounded-none"
          >
            Paused
          </TabsTrigger>
          <TabsTrigger 
            value="completed" 
            className="data-[state=active]:bg-[#0055FF] data-[state=active]:text-white border-2 border-black rounded-none"
          >
            Completed
          </TabsTrigger>
          <TabsTrigger 
            value="cancelled" 
            className="data-[state=active]:bg-[#0055FF] data-[state=active]:text-white border-2 border-black rounded-none"
          >
            Cancelled
          </TabsTrigger>
        </TabsList>
        
        <TabsContent value={activeTab} className="mt-0">
          {loading ? (
          <div className="grid grid-cols-1 gap-6">
              {[1, 2, 3].map(i => (
                <Card key={i} className="border-[4px] border-black p-6 animate-pulse">
                  <div className="h-6 bg-gray-200 rounded w-1/4 mb-4"></div>
                  <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
                  <div className="h-4 bg-gray-200 rounded w-1/2 mb-6"></div>
                  <div className="flex justify-between">
                    <div className="h-8 bg-gray-200 rounded w-1/5"></div>
                    <div className="h-8 bg-gray-200 rounded w-1/4"></div>
                  </div>
                </Card>
            ))}
          </div>
        ) : filteredCampaigns.length === 0 ? (
            <div className="border-[6px] border-black bg-white p-8 text-center">
              <h2 className="text-2xl font-black mb-4">No Campaigns Found</h2>
              <p className="mb-6">You don't have any campaigns in this category yet.</p>
            <Button
                onClick={() => router.push("/campaigns/create")}
                className="bg-[#0055FF] text-white border-[4px] border-black hover:bg-[#FFCC00] hover:text-black transition-all font-bold inline-flex items-center gap-2"
            >
                <PlusCircleIcon className="w-5 h-5" />
                Create Campaign
            </Button>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-6">
              {filteredCampaigns.map((campaign, index) => (
                <Card key={index} className="border-[4px] border-black hover:shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] transition-all">
                  <Link href={`/campaigns/${campaign.id}`} className="block p-6">
                    <div className="flex justify-between items-start mb-4">
                      <div>
                        <h3 className="text-xl font-black mb-1">{campaign.name}</h3>
                        <p className="text-sm text-gray-600 mb-2">
                          ID: {formatAddress(String(campaign.id), 6)} • Created: {new Date(campaign.createdAt * 1000).toLocaleDateString()}
                        </p>
                      </div>
                      {getStatusBadge(campaign.status)}
                    </div>

                    <div className="mb-4">
                      <div className="flex justify-between text-sm mb-1">
                        <span>Budget spent</span>
                        <span className="font-medium">${campaign.budgetSpent.toFixed(2)} / ${campaign.budgetAllocated.toFixed(2)}</span>
                      </div>
                      <Progress value={campaign.progressPercentage} className="h-[6px] bg-gray-100" />
                    </div>

                    <div className="grid grid-cols-3 gap-4 mb-4">
                      <div className="bg-gray-50 p-2 border border-gray-200 rounded">
                        <div className="text-xs text-gray-500">Impressions</div>
                        <div className="font-bold">{campaign.impressions}</div>
                      </div>
                      <div className="bg-gray-50 p-2 border border-gray-200 rounded">
                        <div className="text-xs text-gray-500">Clicks</div>
                        <div className="font-bold">{campaign.clicks}</div>
                    </div>
                      <div className="bg-gray-50 p-2 border border-gray-200 rounded">
                        <div className="text-xs text-gray-500">Conversions</div>
                        <div className="font-bold">{campaign.conversions}</div>
                      </div>
                    </div>
                    
                    <div className="flex justify-between items-center">
                      <div className="flex items-center gap-2">
                        {campaign.status === 1 ? (
                          <Badge variant="outline" className="flex items-center gap-1 border-green-500 text-green-600">
                            <PlayCircleIcon className="w-3 h-3" />
                            Running
                          </Badge>
                        ) : campaign.status === 2 ? (
                          <Badge variant="outline" className="flex items-center gap-1 border-gray-500 text-gray-600">
                            <PauseCircleIcon className="w-3 h-3" />
                            Paused
                          </Badge>
                        ) : null}
                        
                        <Badge variant="outline" className="flex items-center gap-1">
                          <CalendarIcon className="w-3 h-3" />
                          {campaign.durationDays} days
                        </Badge>
                      </div>
                      
                      <div className="flex items-center text-[#0055FF] font-medium">
                        View Details <ChevronRightIcon className="w-4 h-4 ml-1" />
                      </div>
                    </div>
                  </Link>
                </Card>
              ))}
          </div>
        )}
        </TabsContent>
      </Tabs>
    </div>
  )
}


