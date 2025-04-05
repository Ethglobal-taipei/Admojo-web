"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import {
  BarChart3,
  Calendar,
  MapPin,
  PlusCircle,
  Settings,
  Megaphone,
  DollarSign,
  LayoutDashboard,
  ChevronRight,
  RefreshCw,
  Rocket
} from "lucide-react"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { usePrivy } from "@privy-io/react-auth"
import { useAdContract } from "@/hooks/use-ad-contract"
import { toast } from "@/lib/toast"
import { Skeleton } from "@/components/ui/skeleton"
import { type Address } from "viem"

// Campaign type definition from blockchain
interface Campaign {
  id: string;
  owner: `0x${string}`;
  metadata: {
    name: string;
    description: string;
    contentURI: string;
    startDate: bigint;
    duration: number;
    additionalInfo?: string;
  };
  active: boolean;
  bookedLocations: number[];
}

export default function AdvertiserDashboard() {
  const router = useRouter()
  const { ready, authenticated, user } = usePrivy()
  const { operations, adContract, isCorrectChain, switchChain } = useAdContract()
  
  const [recentCampaigns, setRecentCampaigns] = useState<Campaign[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [totalCampaigns, setTotalCampaigns] = useState(0)
  const [totalLocations, setTotalLocations] = useState(0)
  const [activeCampaigns, setActiveCampaigns] = useState(0)
  
  // Format date to readable string
  const formatDate = (date: Date) => {
    return date.toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' })
  }
  
  // Calculate campaign duration and progress
  const calculateDates = (startTimestamp?: bigint, durationDays?: number) => {
    if (!startTimestamp || !durationDays) return { startDate: new Date(), endDate: new Date(), progress: 0 }
    
    const startDate = new Date(Number(startTimestamp) * 1000)
    const endDate = new Date(startDate.getTime() + (durationDays * 24 * 60 * 60 * 1000))
    
    // Calculate progress percentage
    const totalDuration = endDate.getTime() - startDate.getTime()
    const elapsed = Date.now() - startDate.getTime()
    const progress = Math.min(100, Math.max(0, (elapsed / totalDuration) * 100))
    
    return { startDate, endDate, progress }
  }
  
  // Fetch dashboard data
  const fetchDashboardData = async () => {
    try {
      setIsLoading(true)
      
      if (!authenticated || !ready || !adContract) {
        setTimeout(() => fetchDashboardData(), 1000) // retry if not ready
        return
      }
      
      if (!isCorrectChain) {
        toast("Wrong Network", { 
          description: "Please switch to the correct network to view your dashboard." 
        }, "warning")
        await switchChain()
        return
      }
      
      if (!user?.wallet?.address) {
        toast("Wallet Not Connected", { 
          description: "Please connect your wallet to view your dashboard." 
        }, "error")
        return
      }
      
      // Get campaign IDs for the current user from the contract
      const myCampaignIds = await adContract.getMyAdvertiserCampaigns(user.wallet.address as Address)
      
      // Store total campaigns count
      setTotalCampaigns(myCampaignIds.length)
      
      // Fetch details for most recent campaigns (up to 3)
      const recentIds = myCampaignIds.slice(-3).reverse() // Get last 3 campaigns (most recent) and reverse to show newest first
      
      const campaignDetails = await Promise.all(
        recentIds.map(async (id: string | number) => {
          const details = await operations.getCampaignDetails.execute(Number(id))
          return {
            ...details,
            id: String(id)
          }
        })
      )
      
      setRecentCampaigns(campaignDetails)
      
      // Calculate active campaigns and total locations
      let activeCount = 0
      let locationCount = 0
      
      campaignDetails.forEach((campaign: Campaign) => {
        if (campaign.active) activeCount++
        locationCount += campaign.bookedLocations.length
      })
      
      setActiveCampaigns(activeCount)
      setTotalLocations(locationCount)
    } catch (error) {
      console.error("Error fetching dashboard data:", error)
      toast("Error", { 
        description: "Failed to load dashboard data. Please refresh the page to try again." 
      }, "error")
    } finally {
      setIsLoading(false)
    }
  }
  
  // On component mount
  useEffect(() => {
    if (authenticated && ready && adContract) {
      fetchDashboardData()
    }
  }, [authenticated, ready, adContract])
  
  const tools = [
    {
      title: "My Campaigns",
      description: "View and manage all your advertising campaigns",
      icon: <Megaphone className="h-8 w-8 text-[#0055FF]" />,
      color: "bg-blue-50",
      path: "/advertiser/campaigns"
    },
    {
      title: "Create Campaign",
      description: "Launch a new advertising campaign",
      icon: <PlusCircle className="h-8 w-8 text-green-600" />,
      color: "bg-green-50",
      path: "/advertiser/campaigns/create"
    },
    {
      title: "Analytics",
      description: "View campaign performance analytics",
      icon: <BarChart3 className="h-8 w-8 text-purple-600" />,
      color: "bg-purple-50",
      path: "/advertiser/analytics"
    },
    {
      title: "Explore Locations",
      description: "Browse available advertising locations",
      icon: <MapPin className="h-8 w-8 text-orange-600" />,
      color: "bg-orange-50",
      path: "/advertiser/locations"
    },
    {
      title: "Account Settings",
      description: "Manage your advertiser account settings",
      icon: <Settings className="h-8 w-8 text-gray-600" />,
      color: "bg-gray-50",
      path: "/advertiser/settings"
    },
    {
      title: "Wallet",
      description: "Manage your wallet and funds",
      icon: <DollarSign className="h-8 w-8 text-emerald-600" />,
      color: "bg-emerald-50",
      path: "/advertiser/wallet"
    }
  ]

  return (
    <div className="container mx-auto py-8 px-4">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold mb-2">Advertiser Dashboard</h1>
          <p className="text-gray-600">Manage your advertising campaigns and analytics</p>
        </div>
        
        <div className="flex gap-2">
          <Button
            onClick={() => router.push("/advertiser/campaigns/create")}
            className="bg-[#0055FF] text-white border-[3px] border-black hover:bg-[#0044CC]"
          >
            <PlusCircle className="mr-2 h-4 w-4" />
            Create Campaign
          </Button>
        </div>
      </div>
      
      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <Card className="border-[3px] border-black">
          <CardHeader className="pb-2">
            <CardTitle className="text-lg font-bold">
              Total Campaigns
            </CardTitle>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <Skeleton className="h-12 w-24 bg-gray-200" />
            ) : (
              <div className="flex items-baseline gap-2">
                <span className="text-4xl font-black">{totalCampaigns}</span>
                <span className="text-sm text-gray-600">campaigns</span>
              </div>
            )}
          </CardContent>
        </Card>
        
        <Card className="border-[3px] border-black">
          <CardHeader className="pb-2">
            <CardTitle className="text-lg font-bold">
              Active Campaigns
            </CardTitle>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <Skeleton className="h-12 w-24 bg-gray-200" />
            ) : (
              <div className="flex items-baseline gap-2">
                <span className="text-4xl font-black">{activeCampaigns}</span>
                <span className="text-sm text-gray-600">active now</span>
              </div>
            )}
          </CardContent>
        </Card>
        
        <Card className="border-[3px] border-black">
          <CardHeader className="pb-2">
            <CardTitle className="text-lg font-bold">
              Booked Locations
            </CardTitle>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <Skeleton className="h-12 w-24 bg-gray-200" />
            ) : (
              <div className="flex items-baseline gap-2">
                <span className="text-4xl font-black">{totalLocations}</span>
                <span className="text-sm text-gray-600">displays</span>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
      
      {/* Recent Campaigns and Tools */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2">
          <Card className="border-[3px] border-black">
            <CardHeader className="pb-2">
              <div className="flex justify-between items-center">
                <CardTitle>Recent Campaigns</CardTitle>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => router.push("/advertiser/campaigns")}
                  className="border-[2px] border-black rounded-none bg-white hover:bg-[#f5f5f5] text-xs h-8"
                >
                  View All
                  <ChevronRight className="ml-1 h-3 w-3" />
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <div className="space-y-4">
                  {[1, 2, 3].map((i) => (
                    <Skeleton key={i} className="h-24 w-full bg-gray-200" />
                  ))}
                </div>
              ) : recentCampaigns.length === 0 ? (
                <div className="text-center py-8 border-[2px] border-dashed border-gray-300 rounded-md">
                  <Rocket className="h-12 w-12 mx-auto mb-3 text-gray-300" />
                  <p className="font-medium text-gray-600 mb-1">No campaigns yet</p>
                  <p className="text-sm text-gray-500 mb-4">Create your first campaign to get started</p>
                  <Button
                    onClick={() => router.push("/advertiser/campaigns/create")}
                    className="bg-[#0055FF] text-white border-[2px] border-black hover:bg-[#0044CC]"
                    size="sm"
                  >
                    <PlusCircle className="mr-1 h-3 w-3" />
                    Create Campaign
                  </Button>
                </div>
              ) : (
                <div className="space-y-4">
                  {recentCampaigns.map((campaign) => {
                    const { startDate, endDate, progress } = calculateDates(
                      campaign.metadata.startDate,
                      campaign.metadata.duration
                    )
                    
                    return (
                      <div 
                        key={campaign.id} 
                        className="flex flex-col sm:flex-row justify-between p-4 border-[2px] border-black cursor-pointer hover:bg-gray-50"
                        onClick={() => router.push(`/advertiser/campaigns/${campaign.id}/manage`)}
                      >
                        <div className="mb-3 sm:mb-0">
                          <div className="flex items-center gap-2 mb-1">
                            <h3 className="font-bold">{campaign.metadata.name || `Campaign #${campaign.id}`}</h3>
                            <Badge className={`${campaign.active ? "bg-green-100 text-green-800" : "bg-yellow-100 text-yellow-800"}`}>
                              {campaign.active ? "Active" : "Inactive"}
                            </Badge>
                          </div>
                          <div className="text-sm text-gray-600 mb-2">
                            {formatDate(startDate)} - {formatDate(endDate)}
                          </div>
                          <div className="flex items-center gap-3 text-sm">
                            <div className="flex items-center gap-1">
                              <MapPin className="h-3 w-3 text-gray-500" />
                              <span>{campaign.bookedLocations.length} locations</span>
                            </div>
                          </div>
                        </div>
                        
                        <div className="sm:w-32">
                          <div className="text-xs text-gray-600 mb-1">Progress</div>
                          <Progress value={progress} className="h-2 bg-gray-200 mb-1" />
                          <div className="text-xs text-right">{Math.floor(progress)}%</div>
                        </div>
                      </div>
                    )
                  })}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
        
        <div>
          <h2 className="text-xl font-bold mb-4">Quick Actions</h2>
          <div className="grid gap-4">
            {tools.map((tool, index) => (
              <Card 
                key={index} 
                className="border-[3px] border-black hover:shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] transition-all hover:-translate-y-1 cursor-pointer"
                onClick={() => router.push(tool.path)}
              >
                <CardContent className="p-4 flex items-center gap-4">
                  <div className={`p-3 rounded-md ${tool.color}`}>
                    {tool.icon}
                  </div>
                  <div>
                    <h3 className="font-bold">{tool.title}</h3>
                    <p className="text-sm text-gray-600">{tool.description}</p>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
} 