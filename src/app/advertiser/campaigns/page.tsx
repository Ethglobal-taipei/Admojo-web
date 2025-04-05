"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { 
  PlusCircle, 
  Search, 
  Calendar, 
  Clock, 
  MapPin, 
  BarChart2, 
  ArrowRight, 
  Image, 
  RefreshCw, 
  Settings, 
  Trash2, 
  DollarSign,
  Pause,
  Play,
  AlertCircle,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Skeleton } from "@/components/ui/skeleton"
import { usePrivy } from "@privy-io/react-auth"
import { useAdContract } from "@/hooks/use-ad-contract"
import { toast } from "@/lib/toast"
import { Progress } from "@/components/ui/progress"

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

export default function CampaignsPage() {
  const router = useRouter()
  const { authenticated, ready, user } = usePrivy()
  const { operations, adContract, isCorrectChain, switchChain  } = useAdContract()
  
  const [campaigns, setCampaigns] = useState<Campaign[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState("")
  const [isRefreshing, setIsRefreshing] = useState(false)
  
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

  // Helper function to get budget from additionalInfo
  const getBudget = (info?: string): number => {
    if (!info) return 1000
    
    try {
      if (info.includes('budget:')) {
        const budget = parseInt(info.split('budget:')[1].trim())
        return budget || 1000
      }
      return 1000
    } catch (e) {
      return 1000
    }
  }
  
  // Fetch all campaigns for the current user
  const fetchCampaigns = async () => {
    try {
      setIsLoading(true)
      
      if (!authenticated || !ready || !adContract) {
        setTimeout(() => fetchCampaigns(), 1000) // retry if not ready
        return
      }
      
      if (!isCorrectChain) {
        toast("Wrong Network", { 
          description: "Please switch to the correct network to view your campaigns." 
        }, "warning")
        await switchChain()
        return
      }
      
      if (!user?.wallet?.address) {
        toast("Wallet Not Connected", { 
          description: "Please connect your wallet to view your campaigns." 
        }, "error")
        return
      }
      
      // Get campaign IDs for the current user
      const myCampaignIds = await adContract.boothRegistry.getMyAdvertiserCampaigns(user.wallet.address); 
      
      console.log("My campaign IDs:", myCampaignIds)
      
      // Fetch details for each campaign
      const campaignDetails = await Promise.all(
        myCampaignIds.map(async (id: string | number) => {
          const details = await operations.getCampaignDetails.execute(Number(id))
          return {
            ...details,
            id: String(id)
          }
        })
      )
      
      setCampaigns(campaignDetails)
    } catch (error) {
      console.error("Error fetching campaigns:", error)
      toast("Error", { 
        description: "Failed to load campaigns. Please try again." 
      }, "error")
    } finally {
      setIsLoading(false)
      setIsRefreshing(false)
    }
  }
  
  // Filter campaigns based on search query
  const filteredCampaigns = campaigns.filter(campaign => {
    if (!searchQuery) return true
    
    return (
      campaign.metadata.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      campaign.metadata.description?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      campaign.id.toString().includes(searchQuery)
    )
  })
  
  // Navigate to campaign creation page
  const handleCreateCampaign = () => {
    router.push("/advertiser/campaigns/create")
  }
  
  // Navigate to campaign management page
  const handleManageCampaign = (campaignId: string) => {
    router.push(`/advertiser/campaigns/${campaignId}/manage`)
  }
  
  // Refresh campaign list
  const handleRefresh = () => {
    setIsRefreshing(true)
    fetchCampaigns()
  }
  
  // On component mount
  useEffect(() => {
    if (authenticated && ready && adContract) {
      fetchCampaigns()
    }
  }, [authenticated, ready, adContract])
  
  return (
    <div className="container mx-auto py-8 px-4">
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between mb-8 gap-4">
        <div>
          <h1 className="text-3xl font-bold mb-2">My Campaigns</h1>
          <p className="text-gray-600">View and manage your advertising campaigns</p>
        </div>
        
        <div className="flex gap-2 w-full md:w-auto">
          <div className="relative flex-1 md:flex-initial">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500" />
            <Input
              placeholder="Search campaigns..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10 border-[3px] border-black rounded-none min-w-[200px]"
            />
          </div>
          
          <Button
            variant="outline"
            onClick={handleRefresh}
            disabled={isRefreshing}
            className="border-[3px] border-black rounded-none bg-white hover:bg-[#f5f5f5]"
          >
            <RefreshCw className={`mr-2 h-4 w-4 ${isRefreshing ? "animate-spin" : ""}`} />
            Refresh
          </Button>
          
          <Button
            onClick={handleCreateCampaign}
            className="bg-[#0055FF] text-white border-[3px] border-black hover:bg-[#0044CC]"
          >
            <PlusCircle className="mr-2 h-4 w-4" />
            Create Campaign
          </Button>
        </div>
      </div>
      
      {/* Campaigns Grid/List */}
      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {[1, 2, 3, 4].map((i) => (
            <Card key={i} className="border-[3px] border-black">
              <CardHeader>
                <Skeleton className="h-6 w-3/4 bg-gray-200 mb-2" />
                <Skeleton className="h-4 w-1/2 bg-gray-200" />
              </CardHeader>
              <CardContent>
                <Skeleton className="h-24 w-full bg-gray-200 mb-4" />
                <div className="grid grid-cols-2 gap-4">
                  <Skeleton className="h-8 w-full bg-gray-200" />
                  <Skeleton className="h-8 w-full bg-gray-200" />
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : filteredCampaigns.length === 0 ? (
        <div className="text-center py-16 border-[3px] border-black border-dashed bg-gray-50">
          <BarChart2 className="h-16 w-16 mx-auto mb-4 text-gray-400" />
          <h2 className="text-2xl font-bold mb-2">No Campaigns Found</h2>
          <p className="text-gray-600 mb-6">
            {searchQuery 
              ? "No campaigns match your search criteria. Try a different search term."
              : "You haven't created any campaigns yet. Create your first campaign to get started."}
          </p>
          {!searchQuery && (
            <Button
              onClick={handleCreateCampaign}
              className="bg-[#0055FF] text-white border-[3px] border-black hover:bg-[#0044CC]"
            >
              <PlusCircle className="mr-2 h-4 w-4" />
              Create Your First Campaign
            </Button>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {filteredCampaigns.map((campaign) => {
            const { startDate, endDate, progress } = calculateDates(
              campaign.metadata.startDate,
              campaign.metadata.duration
            )
            const budget = getBudget(campaign.metadata.additionalInfo)
            
            return (
              <Card 
                key={campaign.id} 
                className="border-[3px] border-black hover:shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] transition-all hover:-translate-y-1"
              >
                <CardHeader className="pb-2">
                  <div className="flex justify-between items-start">
                    <div>
                      <CardTitle className="text-xl font-bold">
                        {campaign.metadata.name || `Campaign #${campaign.id}`}
                      </CardTitle>
                      <CardDescription>
                        Campaign ID: {campaign.id}
                      </CardDescription>
                    </div>
                    <Badge 
                      className={`${
                        campaign.active ? "bg-green-100 text-green-800 border-green-200" : "bg-yellow-100 text-yellow-800 border-yellow-200"
                      } px-2 py-1 border font-medium`}
                    >
                      {campaign.active ? "Active" : "Inactive"}
                    </Badge>
                  </div>
                </CardHeader>
                
                <CardContent className="pb-3">
                  <p className="text-gray-600 mb-4 line-clamp-2 min-h-[3rem]">
                    {campaign.metadata.description || "No description provided."}
                  </p>
                  
                  <div className="grid grid-cols-2 gap-4 mb-4">
                    <div>
                      <div className="flex items-center gap-1.5 mb-1 text-sm text-gray-600">
                        <Calendar className="h-4 w-4" />
                        Campaign Period
                      </div>
                      <p className="font-medium text-sm">
                        {formatDate(startDate)} - {formatDate(endDate)}
                      </p>
                    </div>
                    
                    <div>
                      <div className="flex items-center gap-1.5 mb-1 text-sm text-gray-600">
                        <DollarSign className="h-4 w-4" />
                        Budget
                      </div>
                      <p className="font-medium text-sm">
                        {budget.toLocaleString()} ADC
                      </p>
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-2 gap-4 mb-4">
                    <div>
                      <div className="flex items-center gap-1.5 mb-1 text-sm text-gray-600">
                        <MapPin className="h-4 w-4" />
                        Locations
                      </div>
                      <p className="font-medium text-sm">
                        {campaign.bookedLocations.length} display{campaign.bookedLocations.length !== 1 ? 's' : ''}
                      </p>
                    </div>
                    
                    <div>
                      <div className="flex items-center gap-1.5 mb-1 text-sm text-gray-600">
                        <Clock className="h-4 w-4" />
                        Progress
                      </div>
                      <Progress value={progress} className="h-2 bg-gray-200 mb-1" />
                      <p className="text-xs text-gray-600 text-right">{Math.floor(progress)}% Complete</p>
                    </div>
                  </div>
                  
                  <div className="mt-4">
                    <Button
                      onClick={() => handleManageCampaign(campaign.id)}
                      className="w-full bg-[#0055FF] text-white border-[2px] border-black hover:bg-[#0044CC]"
                    >
                      <Settings className="mr-2 h-4 w-4" />
                      Manage Campaign
                    </Button>
                  </div>
                </CardContent>
              </Card>
            )
          })}
        </div>
      )}
    </div>
  )
} 