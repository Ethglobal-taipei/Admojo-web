"use client"

import { useState, useEffect } from 'react'
import { Button } from "@/components/ui/button"
import { useRouter } from "next/navigation"
import { FilterX, Plus, Filter } from "lucide-react"
import { useAdContract } from '@/hooks/use-ad-contract'
import { toast } from '@/lib/toast'

export default function CampaignsPage() {
  const router = useRouter()
  const { operations, adContract, isCorrectChain, switchChain } = useAdContract()
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [campaigns, setCampaigns] = useState<any[]>([])
  const [filteredCampaigns, setFilteredCampaigns] = useState<any[]>([])
  const [statusFilter, setStatusFilter] = useState<string>("all")
  
  // Load campaign data from blockchain
  useEffect(() => {
    const loadCampaignData = async () => {
      if (!adContract || !operations) {
        setIsLoading(false)
        setCampaigns([])
        setFilteredCampaigns([])
        return
      }

      try {
        setIsLoading(true)
        setError(null)
        
        // Check if on the correct chain
        if (!isCorrectChain) {
          setError("Please switch to the correct blockchain network")
          setIsLoading(false)
          return
        }
        
        // Fetch campaigns from smart contract
        const userCampaigns = await operations.getUserCampaigns.execute()
        
        // Transform campaign data into a format for display
        const campaignDetails = await Promise.all(
          userCampaigns.map(async (campaign) => {
            try {
              // Get full campaign details including metrics
              const details = await operations.getCampaignDetails.execute(campaign.id.slice(2))
              
              // Determine date from startDate unix timestamp
              const startDate = new Date(details.startDate * 1000)
              const endDate = new Date((details.startDate + details.duration * 86400) * 1000) // Add days in seconds
              
              // Calculate current status
              const now = Date.now() / 1000
              let status = 'inactive'
              if (details.isActive) {
                if (now < details.startDate) {
                  status = 'scheduled'
                } else if (now > details.startDate + details.duration * 86400) {
                  status = 'completed'
                } else {
                  status = 'active'
                }
              }
              
              // Get the campaign name from contentURI
              // In production, this would fetch metadata from IPFS or similar
              const campaignName = details.contentURI.includes('/') 
                ? `Campaign ${details.contentURI.split('/').pop()?.slice(0, 5) || campaign.id.slice(-5)}`
                : `Campaign ${campaign.id.slice(-5)}`
              
              // Return formatted campaign data
              return {
                id: campaign.id,
                name: campaignName,
                status: status,
                startDate: startDate,
                endDate: endDate,
                budget: 0, // Would be retrieved from contract in production
                impressions: details.metrics?.impressions || 0,
                clicks: details.metrics?.clicks || 0,
                conversions: details.metrics?.conversions || 0,
                locations: 0, // Would be retrieved from contract in production
                contentURI: details.contentURI
              }
            } catch (error) {
              console.error(`Error fetching details for campaign ${campaign.id}:`, error)
              
              // If we can't get contract data, return a minimal object with just the ID
              return {
                id: campaign.id,
                name: `Campaign ${campaign.id.slice(-5)}`,
                status: 'inactive',
                startDate: new Date(),
                endDate: new Date(),
                budget: 0,
                impressions: 0,
                clicks: 0,
                conversions: 0,
                locations: 0,
                contentURI: ''
              }
            }
          })
        )
        
        setCampaigns(campaignDetails)
        setFilteredCampaigns(campaignDetails)
      } catch (error: any) {
        console.error("Error loading campaign details:", error)
        setError(error.message || "Failed to load campaigns")
        setCampaigns([])
        setFilteredCampaigns([])
      } finally {
        setIsLoading(false)
      }
    }
    
    loadCampaignData()
  }, [adContract, operations, isCorrectChain])
  
  // Apply filters when statusFilter changes
  useEffect(() => {
    if (statusFilter === "all") {
      setFilteredCampaigns(campaigns)
    } else {
      setFilteredCampaigns(campaigns.filter(campaign => campaign.status === statusFilter))
    }
  }, [statusFilter, campaigns])

  const handleCreateCampaign = () => {
    router.push("/dashboard/campaigns/create")
  }
  
  const handleCampaignClick = (campaignId: string) => {
    router.push(`/dashboard/campaigns/${campaignId}`)
  }
  
  const handleNetworkSwitch = async () => {
    try {
      await switchChain()
      // Refresh page after network switch
      window.location.reload()
    } catch (error) {
      console.error("Failed to switch network:", error)
      toast("Network Switch Failed", { description: "Please switch your network manually" }, "error")
    }
  }
  
  const formatDate = (date: Date) => {
    return date.toLocaleDateString('en-US', { 
      year: 'numeric', 
      month: 'short', 
      day: 'numeric' 
    })
  }

  const renderStatusIndicator = (status: string) => {
    if (status === "active") {
      return <span className="flex items-center gap-1.5">
        <span className="w-2 h-2 rounded-full bg-green-500"></span>
        Active
      </span>
    } else if (status === "scheduled") {
      return <span className="flex items-center gap-1.5">
        <span className="w-2 h-2 rounded-full bg-blue-500"></span>
        Scheduled
      </span>
    } else if (status === "completed") {
      return <span className="flex items-center gap-1.5">
        <span className="w-2 h-2 rounded-full bg-purple-500"></span>
        Completed
      </span>
    } else {
      return <span className="flex items-center gap-1.5">
        <span className="w-2 h-2 rounded-full bg-gray-500"></span>
        Inactive
      </span>
    }
  }

  // Wrong network state
  if (error && error.includes("switch to the correct")) {
    return (
      <div className="container py-8">
        <h1 className="text-3xl font-black mb-8">Ad Campaigns</h1>
        <div className="border-[4px] border-black p-8 shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] bg-[#FFCC00] text-black">
          <h2 className="text-xl font-bold mb-2">Wrong Network</h2>
          <p className="mb-4">Please connect to the Holesky testnet to view your campaigns</p>
          <Button
            onClick={handleNetworkSwitch}
            className="bg-white text-black border-[3px] border-black hover:bg-[#f5f5f5] transition-all font-bold px-4 py-2 h-auto rounded-none hover:-translate-y-1"
          >
            Switch Network
          </Button>
        </div>
      </div>
    )
  }

  // Loading state
  if (isLoading) {
    return (
      <div className="container py-8">
        <h1 className="text-3xl font-black mb-8">Ad Campaigns</h1>
        <div className="flex justify-between mb-6">
          <div></div>
          <Button
            onClick={handleCreateCampaign}
            className="bg-[#0055FF] text-white border-[3px] border-black hover:bg-[#FFCC00] hover:text-black transition-all font-bold px-4 py-2 h-auto rounded-none flex items-center gap-2 hover:-translate-y-1 hover:shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]"
          >
            <Plus className="w-5 h-5" /> Create Campaign
          </Button>
        </div>
        <div className="border-[4px] border-black p-8 shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] bg-white">
          <div className="flex flex-col items-center justify-center py-12">
            <div className="w-12 h-12 border-4 border-black border-t-[#0055FF] rounded-full animate-spin mb-4"></div>
            <p className="text-xl font-bold">Loading your campaigns from blockchain...</p>
          </div>
        </div>
      </div>
    )
  }

  // Error state
  if (error) {
    return (
      <div className="container py-8">
        <h1 className="text-3xl font-black mb-8">Ad Campaigns</h1>
        <div className="flex justify-between mb-6">
          <div></div>
          <Button
            onClick={handleCreateCampaign}
            className="bg-[#0055FF] text-white border-[3px] border-black hover:bg-[#FFCC00] hover:text-black transition-all font-bold px-4 py-2 h-auto rounded-none flex items-center gap-2 hover:-translate-y-1 hover:shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]"
          >
            <Plus className="w-5 h-5" /> Create Campaign
          </Button>
        </div>
        <div className="border-[4px] border-black p-8 shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] bg-[#FF3366] text-white">
          <h2 className="text-xl font-bold mb-2">Error Loading Campaigns</h2>
          <p className="mb-4">{error}</p>
          <Button
            onClick={() => window.location.reload()}
            className="bg-white text-black border-[3px] border-black hover:bg-[#f5f5f5] transition-all font-bold px-4 py-2 h-auto rounded-none hover:-translate-y-1"
          >
            Try Again
          </Button>
        </div>
      </div>
    )
  }

  // Empty state
  if (filteredCampaigns.length === 0) {
    return (
      <div className="container py-8">
        <h1 className="text-3xl font-black mb-8">Ad Campaigns</h1>
        <div className="flex justify-between mb-6">
          <div className="flex gap-2">
            <Button
              onClick={() => setStatusFilter("all")}
              className={`border-[3px] border-black rounded-none h-auto py-2 px-4 font-bold ${
                statusFilter === "all" 
                  ? "bg-[#0055FF] text-white hover:bg-[#0044CC]" 
                  : "bg-white text-black hover:bg-[#f5f5f5]"
              }`}
            >
              All
            </Button>
            <Button
              onClick={() => setStatusFilter("active")}
              className={`border-[3px] border-black rounded-none h-auto py-2 px-4 font-bold ${
                statusFilter === "active" 
                  ? "bg-[#0055FF] text-white hover:bg-[#0044CC]" 
                  : "bg-white text-black hover:bg-[#f5f5f5]"
              }`}
            >
              Active
            </Button>
            <Button
              onClick={() => setStatusFilter("inactive")}
              className={`border-[3px] border-black rounded-none h-auto py-2 px-4 font-bold ${
                statusFilter === "inactive" 
                  ? "bg-[#0055FF] text-white hover:bg-[#0044CC]" 
                  : "bg-white text-black hover:bg-[#f5f5f5]"
              }`}
            >
              Inactive
            </Button>
            {statusFilter !== "all" && (
              <Button
                onClick={() => setStatusFilter("all")}
                className="border-[3px] border-black rounded-none h-auto py-2 px-4 font-bold bg-[#f5f5f5] text-black hover:bg-[#e0e0e0] flex items-center gap-1"
              >
                <FilterX className="w-4 h-4" /> Clear Filter
              </Button>
            )}
          </div>
          <Button
            onClick={handleCreateCampaign}
            className="bg-[#0055FF] text-white border-[3px] border-black hover:bg-[#FFCC00] hover:text-black transition-all font-bold px-4 py-2 h-auto rounded-none flex items-center gap-2 hover:-translate-y-1 hover:shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]"
          >
            <Plus className="w-5 h-5" /> Create Campaign
          </Button>
        </div>
        <div className="border-[4px] border-black p-8 shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] bg-white">
          <div className="flex flex-col items-center justify-center py-12">
            <div className="w-16 h-16 mb-4 text-gray-400">
              <Filter className="w-full h-full" />
            </div>
            <h3 className="text-xl font-bold mb-2">No Campaigns Found</h3>
            <p className="text-gray-500 mb-6">
              {campaigns.length === 0 
                ? "You haven't created any campaigns on the blockchain yet." 
                : "No campaigns match your current filter."}
            </p>
            {campaigns.length === 0 ? (
              <Button
                onClick={handleCreateCampaign}
                className="bg-[#0055FF] text-white border-[3px] border-black hover:bg-[#FFCC00] hover:text-black transition-all font-bold px-4 py-2 h-auto rounded-none flex items-center gap-2"
              >
                <Plus className="w-5 h-5" /> Create Your First Campaign
              </Button>
            ) : (
              <Button
                onClick={() => setStatusFilter("all")}
                className="bg-[#f5f5f5] text-black border-[3px] border-black hover:bg-[#e0e0e0] transition-all font-bold px-4 py-2 h-auto rounded-none flex items-center gap-2"
              >
                <FilterX className="w-5 h-5" /> Clear All Filters
              </Button>
            )}
          </div>
        </div>
      </div>
    )
  }

  // Main content with campaigns
  return (
    <div className="container py-8">
      <h1 className="text-3xl font-black mb-8">Ad Campaigns</h1>
      <div className="flex justify-between mb-6">
        <div className="flex gap-2">
          <Button
            onClick={() => setStatusFilter("all")}
            className={`border-[3px] border-black rounded-none h-auto py-2 px-4 font-bold ${
              statusFilter === "all" 
                ? "bg-[#0055FF] text-white hover:bg-[#0044CC]" 
                : "bg-white text-black hover:bg-[#f5f5f5]"
            }`}
          >
            All
          </Button>
          <Button
            onClick={() => setStatusFilter("active")}
            className={`border-[3px] border-black rounded-none h-auto py-2 px-4 font-bold ${
              statusFilter === "active" 
                ? "bg-[#0055FF] text-white hover:bg-[#0044CC]" 
                : "bg-white text-black hover:bg-[#f5f5f5]"
            }`}
          >
            Active
          </Button>
          <Button
            onClick={() => setStatusFilter("scheduled")}
            className={`border-[3px] border-black rounded-none h-auto py-2 px-4 font-bold ${
              statusFilter === "scheduled" 
                ? "bg-[#0055FF] text-white hover:bg-[#0044CC]" 
                : "bg-white text-black hover:bg-[#f5f5f5]"
            }`}
          >
            Scheduled
          </Button>
          <Button
            onClick={() => setStatusFilter("completed")}
            className={`border-[3px] border-black rounded-none h-auto py-2 px-4 font-bold ${
              statusFilter === "completed" 
                ? "bg-[#0055FF] text-white hover:bg-[#0044CC]" 
                : "bg-white text-black hover:bg-[#f5f5f5]"
            }`}
          >
            Completed
          </Button>
          {statusFilter !== "all" && (
            <Button
              onClick={() => setStatusFilter("all")}
              className="border-[3px] border-black rounded-none h-auto py-2 px-4 font-bold bg-[#f5f5f5] text-black hover:bg-[#e0e0e0] flex items-center gap-1"
            >
              <FilterX className="w-4 h-4" /> Clear Filter
            </Button>
          )}
        </div>
        <Button
          onClick={handleCreateCampaign}
          className="bg-[#0055FF] text-white border-[3px] border-black hover:bg-[#FFCC00] hover:text-black transition-all font-bold px-4 py-2 h-auto rounded-none flex items-center gap-2 hover:-translate-y-1 hover:shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]"
        >
          <Plus className="w-5 h-5" /> Create Campaign
        </Button>
      </div>
      
      <div className="border-[4px] border-black shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] bg-white">
        <div className="grid grid-cols-[1fr_1fr_1fr_1fr_120px] border-b-[4px] border-black bg-[#f5f5f5] font-bold text-xs uppercase">
          <div className="p-4">Campaign Name</div>
          <div className="p-4">Duration</div>
          <div className="p-4">Campaign Metrics</div>
          <div className="p-4">Content</div>
          <div className="p-4">Status</div>
        </div>
        
        {filteredCampaigns.map((campaign) => (
          <div
            key={campaign.id}
            className="grid grid-cols-[1fr_1fr_1fr_1fr_120px] hover:bg-[#f5f5f5] border-b-[2px] border-black cursor-pointer transition-colors"
            onClick={() => handleCampaignClick(campaign.id)}
          >
            <div className="p-4">
              <div className="font-bold text-lg">{campaign.name}</div>
              <div className="text-gray-500 text-sm">ID: {campaign.id.slice(0, 8)}...</div>
            </div>
            <div className="p-4">
              <div className="grid grid-cols-2 gap-2 text-sm">
                <div>
                  <div className="font-bold">Start Date</div>
                  <div>{formatDate(campaign.startDate)}</div>
                </div>
                <div>
                  <div className="font-bold">End Date</div>
                  <div>{formatDate(campaign.endDate)}</div>
                </div>
              </div>
            </div>
            <div className="p-4">
              <div className="grid grid-cols-2 gap-2 text-sm">
                <div>
                  <div className="font-bold">Impressions</div>
                  <div>{campaign.impressions.toLocaleString()}</div>
                </div>
                <div>
                  <div className="font-bold">Clicks</div>
                  <div>{campaign.clicks.toLocaleString()}</div>
                </div>
              </div>
            </div>
            <div className="p-4">
              <div className="text-sm">
                <div className="font-bold">Content URI</div>
                <div className="truncate max-w-[150px]">{campaign.contentURI || "Not specified"}</div>
              </div>
            </div>
            <div className="p-4 flex items-center font-medium">
              {renderStatusIndicator(campaign.status)}
            </div>
          </div>
        ))}
      </div>
    </div>
  )
} 