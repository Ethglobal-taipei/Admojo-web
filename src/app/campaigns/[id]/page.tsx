"use client"

import { useEffect, useState, useRef } from "react"
import { useParams, useRouter } from "next/navigation"
import {
  ArrowLeft,
  BarChart3,
  Calendar,
  Clock,
  DollarSign,
  Edit,
  Eye,
  MapPin,
  Pause,
  Play,
  RefreshCw,
  Trash2,
  Users,
  Wallet,
  Plus
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Progress } from "@/components/ui/progress"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { toast } from "@/lib/toast"
import { Slider } from "@/components/ui/slider"
import { Label } from "@/components/ui/label"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import { useBlockchainService, useBoothRegistry, usePerformanceOracle } from "@/hooks"
import { Skeleton } from "@/components/ui/skeleton"
import { Campaign, CampaignMetadata } from "@/lib/blockchain"
import { useUserStore } from "@/lib/store";
import { Input } from "@/components/ui/input";

// Add import for the new component
import CampaignLocationBalances from "@/components/campaign/CampaignLocationBalances"

// Add import for tokenomics service
import { 
  getUserTokenBalance, 
  getCampaignTokenBalance, 
  updateCampaignBudget,
  createCampaignHolder,
  TokenBalanceResponse
} from "@/lib/services/tokenomics.service"

export default function CampaignDetailPage() {
  const params = useParams()
  const router = useRouter()
  const campaignId = params.id as string
  const { user } = useUserStore()
  
  const { service, isCorrectChain, switchChain } = useBlockchainService()
  const { 
    getCampaignDetails, 
    campaignDetails,
    isLoadingCampaign,
  } = useBoothRegistry()
  
  const { getCampaignMetrics } = usePerformanceOracle()
  
  const [mounted, setMounted] = useState(false)
  const [isReallocating, setIsReallocating] = useState(false)
  const [isLoadingBalances, setIsLoadingBalances] = useState(false)
  const [reallocationAmount, setReallocationAmount] = useState(0)
  const [addBudgetAmount, setAddBudgetAmount] = useState(100)
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [campaignBalance, setCampaignBalance] = useState<TokenBalanceResponse | null>(null)
  const [userBalance, setUserBalance] = useState<TokenBalanceResponse | null>(null)
  
  const [metrics, setMetrics] = useState<{ 
    impressions: number; 
    clicks: number; 
    conversions: number; 
    spent: number;
  }>({
    impressions: 0,
    clicks: 0,
    conversions: 0,
    spent: 0,
  })
  const hasFetchedRef = useRef(false)

  const [isStatusChanging, setIsStatusChanging] = useState(false)

  // Extract fetch balances function so it can be called from other functions
  const fetchBalances = async () => {
    if (!user?.walletAddress || !campaignId) return;
    
    setIsLoadingBalances(true);
    try {
      // Get user's token balance
      const userTokenBalance = await getUserTokenBalance(user.walletAddress);
      setUserBalance(userTokenBalance);
      
      // Get campaign's token balance
      let campaignTokenBalance = await getCampaignTokenBalance(campaignId);
      
      // If campaign doesn't have a holder address yet, try to create one for active campaigns
      if (!campaignTokenBalance && campaignDetails?.active) {
        console.log("No campaign holder found, attempting to create one...");
        
        // Create a campaign holder
        const holderCreated = await createCampaignHolder(campaignId);
        
        if (holderCreated) {
          // Wait a moment for the data to propagate
          await new Promise(resolve => setTimeout(resolve, 1000));
          
          // Try to fetch the campaign balance again
          campaignTokenBalance = await getCampaignTokenBalance(campaignId);
          console.log("Campaign holder created and balance fetched:", campaignTokenBalance);
        } else {
          console.warn("Could not automatically create a holder for campaign");
        }
      }
      
      setCampaignBalance(campaignTokenBalance);
      
      // If we have campaign balance data, update the spent amount based on initial balance
      if (campaignTokenBalance) {
        // For spent tracking, we can't know exactly but we can estimate from starting budget
        // This assumes the campaign details or API provides initial budget information
        const initialBudget = parseAdditionalInfo(campaignDetails?.metadata?.additionalInfo).budget;
        const currentBalance = campaignTokenBalance.balance || 0;
        const estimated = Math.max(0, initialBudget - currentBalance);
        
        setMetrics(prev => ({
          ...prev,
          spent: estimated
        }));
      }
    } catch (error) {
      console.error("Error fetching balances:", error);
      toast("Balance Error", {
        description: "Failed to load balance information"
      }, "error");
    } finally {
      setIsLoadingBalances(false);
    }
  };

  // Fetch campaign data and balances
  useEffect(() => {
    setMounted(true)
    
    if (service && !hasFetchedRef.current && campaignId) {
      getCampaignDetails(Number(campaignId));
      hasFetchedRef.current = true;
      fetchBalances();
      
      // For now we still use mock impressions/clicks/conversions data
      setMetrics(prev => ({
        ...prev,
        impressions: Math.floor(Math.random() * 10000),
        clicks: Math.floor(Math.random() * 1000),
        conversions: Math.floor(Math.random() * 100),
      }));
    }
  }, [service, campaignId, getCampaignDetails, user?.walletAddress, campaignDetails?.metadata?.additionalInfo])

  if (!mounted || isLoadingCampaign) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="animate-pulse">
          <div className="h-8 w-48 bg-gray-200 mb-4 rounded"></div>
          <div className="h-64 bg-gray-200 rounded mb-8"></div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="h-40 bg-gray-200 rounded"></div>
            <div className="h-40 bg-gray-200 rounded"></div>
            <div className="h-40 bg-gray-200 rounded"></div>
          </div>
        </div>
      </div>
    )
  }

  if (!campaignDetails) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="text-center py-12">
          <h2 className="text-2xl font-bold mb-4">Campaign Not Found</h2>
          <p className="mb-6">The campaign you're looking for doesn't exist or has been deleted.</p>
          <Button
            onClick={() => router.push("/campaigns")}
            className="bg-[#0055FF] text-white border-[3px] border-black hover:bg-[#0044CC]"
          >
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Campaigns
          </Button>
        </div>
      </div>
    )
  }

  const handleStatusChange = async (setActive: boolean) => {
    try {
      setIsStatusChanging(true);
      
      // Call the campaign status API endpoint to update campaign status
      const response = await fetch(`/api/campaigns/${campaignId}/status`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ 
          status: setActive ? 'ACTIVE' : 'PAUSED',
          isActive: setActive
        }),
      });
      
      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.error || 'Failed to update campaign status');
      }
      
      toast(
        setActive ? "Campaign Activated" : "Campaign Paused", 
        { description: setActive ? 
          "Campaign is now active and ads will be displayed" : 
          "Campaign is now paused and ads will not be displayed" 
        }, 
        "success"
      );
      
      // Refresh campaign details from blockchain
      getCampaignDetails(Number(campaignId));
      
      // If campaign was activated, also refresh the balance to show newly created holder data
      if (setActive) {
        await fetchBalances();
      }
    } catch (error) {
      console.error("Error updating campaign status:", error);
      toast("Update Failed", { 
        description: "Failed to update campaign status" 
      }, "error");
    } finally {
      setIsStatusChanging(false);
    }
  }

  const handleDeleteCampaign = async () => {
    try {
      // This would be implemented with a contract call in production
      toast("Delete Attempted", { 
        description: "Delete functionality is not implemented yet" 
      }, "info")
      setDeleteDialogOpen(false)
      // In a real implementation, we would redirect after successful deletion
      // router.push("/campaigns")
    } catch (error) {
      toast("Delete Failed", { 
        description: "Failed to delete campaign" 
      }, "error")
    }
  }

  const handleReallocation = async () => {
    if (!user?.walletAddress || !campaignId) {
      toast("Reallocation Failed", { 
        description: "Missing required user data" 
      }, "error");
      return;
    }
    
    try {
      const operation = reallocationAmount > 0 ? 'add' : 'withdraw';
      const amount = Math.abs(reallocationAmount);
      
      // Validate amounts
      if (operation === 'add' && (!userBalance || userBalance.balance < amount)) {
        toast("Insufficient Balance", {
          description: "You don't have enough tokens in your wallet"
        }, "error");
        return;
      }
      
      if (operation === 'withdraw' && (!campaignBalance || campaignBalance.balance < amount)) {
        toast("Insufficient Campaign Balance", {
          description: "Campaign doesn't have enough funds to withdraw this amount"
        }, "error");
        return;
      }
      
      // If adding funds, check if campaign has a holder address
      if (operation === 'add') {
        // First, check if we already have a campaign balance - if not, we need to create a holder
        if (!campaignBalance) {
          console.log("No campaign holder found, creating one...");
          toast("Creating campaign wallet", {
            description: "Setting up a Metal holder for this campaign..."
          }, "info");
          
          // Create a campaign holder first
          const holderCreated = await createCampaignHolder(campaignId);
          
          if (!holderCreated) {
            toast("Setup Failed", {
              description: "Could not create a holder for this campaign"
            }, "error");
            return;
          }
          
          // Wait a moment for the data to propagate
          await new Promise(resolve => setTimeout(resolve, 1000));
        }
      }
      
      // Update campaign budget using the tokenomics service
      const result = await updateCampaignBudget(
        campaignId,
        user.walletAddress, // Use wallet address as the user ID
        user.walletAddress, // We don't have holderAddress in store, so use wallet address
        amount,
        operation
      );
      
      if (result) {
        // Refresh balances
        const userTokenBalance = await getUserTokenBalance(user.walletAddress);
        setUserBalance(userTokenBalance);
        
        const campaignTokenBalance = await getCampaignTokenBalance(campaignId);
        setCampaignBalance(campaignTokenBalance);
        
        toast("Budget Updated", {
          description: `Successfully ${operation === 'add' ? 'added' : 'withdrawn'} ${amount} ADC tokens ${operation === 'add' ? 'to' : 'from'} campaign`
        }, "success");
      }
      
      setIsReallocating(false);
      setReallocationAmount(0);
    } catch (error) {
      console.error("Reallocation failed:", error);
      toast("Reallocation Failed", { 
        description: "Failed to update campaign budget" 
      }, "error");
    }
  }

  // Parse additional info for budget - we will now use this as a fallback
  const parseAdditionalInfo = (info?: string) => {
    if (!info) return { budget: campaignBalance?.balance || 1000 }
    try {
      if (info.includes('budget:')) {
        const budget = parseInt(info.split('budget:')[1].trim())
        return { budget }
      }
      return { budget: campaignBalance?.balance || 1000 }
    } catch (e) {
      return { budget: campaignBalance?.balance || 1000 }
    }
  }
  
  // Get budget from campaign balance or fall back to additional info
  const budget = campaignBalance?.balance || parseAdditionalInfo(campaignDetails?.metadata?.additionalInfo).budget;

  // Calculate campaign metrics
  const startDate = new Date(Number(campaignDetails?.metadata?.startDate || Date.now()) * 1000)
  const endDate = new Date(startDate.getTime())
  endDate.setDate(startDate.getDate() + (campaignDetails?.metadata?.duration || 30))
  
  const daysTotal = campaignDetails?.metadata?.duration || 30
  const daysElapsed = Math.ceil((new Date().getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24))
  const daysRemaining = Math.max(0, daysTotal - daysElapsed)
  const progressPercentage = Math.min(100, Math.max(0, (daysElapsed / daysTotal) * 100))

  const budgetSpent = metrics.spent || 0
  const budgetRemaining = budget - budgetSpent
  const budgetPercentage = Math.min(100, Math.max(0, (budgetSpent / budget) * 100))

  const ctr = metrics.impressions > 0 ? (metrics.clicks / metrics.impressions) * 100 : 0
  const conversionRate = metrics.clicks > 0 ? (metrics.conversions / metrics.clicks) * 100 : 0

  return (
    <div className="min-h-screen bg-white relative">
      {/* Checkered Background Pattern */}
      <div className="fixed inset-0 -z-20 bg-white">
        <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNDAiIGhlaWdodD0iNDAiIHZpZXdCb3g9IjAgMCA0MCA0MCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48cGF0aCBkPSJNMCAwaDIwdjIwSDB6TTIwIDIwaDIwdjIwSDIweiIgZmlsbD0icmdiYSgwLDAsMCwwLjAzKSIgZmlsbC1ydWxlPSJldmVub2RkIi8+PC9zdmc+')] opacity-70"></div>
      </div>

      {/* Animated Background Elements */}
      <div className="fixed inset-0 -z-10 overflow-hidden pointer-events-none">
        <div className="absolute top-[10%] right-[5%] w-32 h-32 bg-[#FFCC00] border-[6px] border-black rounded-full opacity-20 animate-pulse"></div>
        <div
          className="absolute top-[30%] left-[8%] w-48 h-48 bg-[#0055FF] border-[6px] border-black opacity-10 animate-bounce"
          style={{ animationDuration: "8s" }}
        ></div>
        <div
          className="absolute bottom-[15%] right-[15%] w-64 h-64 bg-[#FF3366] border-[6px] border-black opacity-10"
          style={{ animation: "spin 15s linear infinite" }}
        ></div>
      </div>

      <div className="container mx-auto px-4 py-8 relative z-10">
        {/* Header with back button */}
        <div className="flex items-center justify-between mb-6">
          <Button
            variant="outline"
            onClick={() => router.push("/campaigns")}
            className="border-[3px] border-black rounded-none bg-white hover:bg-[#f5f5f5]"
          >
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Campaigns
          </Button>

          <div className="flex items-center gap-2">
            {campaignDetails.active ? (
              <Button
                variant="outline"
                onClick={() => handleStatusChange(false)}
                className="border-[3px] border-black rounded-none bg-white hover:bg-[#f5f5f5]"
              >
                <Pause className="mr-2 h-4 w-4" />
                Pause Campaign
              </Button>
            ) : (
              <Button
                variant="outline"
                onClick={() => handleStatusChange(true)}
                className="border-[3px] border-black rounded-none bg-white hover:bg-[#f5f5f5]"
              >
                <Play className="mr-2 h-4 w-4" />
                Resume Campaign
              </Button>
            )}

            <Button
              variant="destructive"
              onClick={() => setDeleteDialogOpen(true)}
              className="border-[3px] border-black rounded-none bg-[#FF3366] hover:bg-[#FF1A53] text-white"
            >
              <Trash2 className="mr-2 h-4 w-4" />
              Delete
            </Button>
          </div>
        </div>

        {/* Campaign Header Card */}
        <Card className="border-[6px] border-black shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] mb-8">
          <CardHeader className="pb-4">
            <div className="flex justify-between items-start">
              <div>
                <CardTitle className="text-3xl font-black">{campaignDetails.metadata.name}</CardTitle>
                <CardDescription className="text-lg">
                  {campaignDetails.metadata.description || "No description provided"}
                </CardDescription>
              </div>
              <div
                className={`px-3 py-1 font-bold text-white border-[3px] border-black ${
                  campaignDetails.active
                    ? "bg-green-500"
                    : "bg-yellow-500"
                }`}
              >
                {campaignDetails.active ? "ACTIVE" : "PAUSED"}
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-6">
              <div className="border-[3px] border-black p-4">
                <div className="flex items-center gap-2 mb-1">
                  <Calendar className="h-5 w-5" />
                  <span className="font-bold">Campaign Period</span>
                </div>
                <div className="text-lg">
                  {startDate.toLocaleDateString()} - {endDate.toLocaleDateString()}
                </div>
                <div className="mt-2">
                  <div className="flex justify-between text-sm mb-1">
                    <span>Progress</span>
                    <span>{Math.round(progressPercentage)}%</span>
                  </div>
                  <Progress value={progressPercentage} className="h-2" />
                </div>
              </div>

              <div className="border-[3px] border-black p-4">
                <div className="flex items-center gap-2 mb-1">
                  <Clock className="h-5 w-5" />
                  <span className="font-bold">Time Remaining</span>
                </div>
                <div className="text-lg">
                  {daysRemaining > 0 ? `${daysRemaining} days` : "Campaign ended"}
                </div>
                <div className="mt-2">
                  <div className="text-sm">
                    Duration: {daysTotal} days ({daysElapsed} days elapsed)
                  </div>
                </div>
              </div>

              <div className="border-[3px] border-black p-4">
                <div className="flex items-center gap-2 mb-1">
                  <DollarSign className="h-5 w-5" />
                  <span className="font-bold">Budget</span>
                </div>
                <div className="text-lg flex justify-between items-center">
                  <div>
                    {budgetRemaining.toLocaleString()} / {budget.toLocaleString()} ADC
                  </div>
                  {!isLoadingBalances ? (
                    <Button 
                      variant="outline" 
                      size="sm" 
                      className="border-[2px] border-black rounded-none bg-[#0055FF] hover:bg-[#003cc7] text-white"
                      onClick={() => setIsReallocating(true)}
                    >
                      <Plus className="w-4 h-4 mr-1" /> Add Funds
                    </Button>
                  ) : (
                    <RefreshCw className="h-4 w-4 animate-spin" />
                  )}
                </div>
                <div className="mt-2">
                  <div className="flex justify-between text-sm mb-1">
                    <span>Spent</span>
                    <span>{Math.round(budgetPercentage)}%</span>
                  </div>
                  <Progress value={budgetPercentage} className="h-2" />
                </div>
              </div>

              <div className="border-[3px] border-black p-4">
                <div className="flex items-center gap-2 mb-1">
                  <MapPin className="h-5 w-5" />
                  <span className="font-bold">Booked Locations</span>
                </div>
                <div className="text-lg">{campaignDetails.bookedLocations.length} locations</div>
                <div className="mt-2">
                  <Button
                    variant="outline"
                    className="w-full border-[2px] border-black rounded-none text-sm font-bold bg-[#f5f5f5] hover:bg-[#e5e5e5]"
                    onClick={() => router.push(`/dashboard`)}
                  >
                    Manage Locations
                  </Button>
                </div>
              </div>
            </div>

            <Tabs defaultValue="performance" className="w-full">
              <TabsList className="w-full grid grid-cols-3 mb-6">
                <TabsTrigger
                  value="performance"
                  className="data-[state=active]:bg-[#0055FF] data-[state=active]:text-white border-[3px] border-black data-[state=active]:-translate-y-1 data-[state=active]:shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] transition-all font-bold"
                >
                  Performance
                </TabsTrigger>
                <TabsTrigger
                  value="creative"
                  className="data-[state=active]:bg-[#0055FF] data-[state=active]:text-white border-[3px] border-black data-[state=active]:-translate-y-1 data-[state=active]:shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] transition-all font-bold"
                >
                  Creative
                </TabsTrigger>
                <TabsTrigger
                  value="settings"
                  className="data-[state=active]:bg-[#0055FF] data-[state=active]:text-white border-[3px] border-black data-[state=active]:-translate-y-1 data-[state=active]:shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] transition-all font-bold"
                >
                  Settings
                </TabsTrigger>
              </TabsList>

              <TabsContent value="performance">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-6">
                  <div className="border-[3px] border-black p-4 bg-white">
                    <div className="flex items-center gap-2 mb-1">
                      <Eye className="h-5 w-5 text-[#0055FF]" />
                      <span className="font-bold">Impressions</span>
                    </div>
                    <div className="text-2xl font-bold">
                      {metrics.impressions.toLocaleString()}
                    </div>
                  </div>

                  <div className="border-[3px] border-black p-4 bg-white">
                    <div className="flex items-center gap-2 mb-1">
                      <BarChart3 className="h-5 w-5 text-[#FF3366]" />
                      <span className="font-bold">Clicks</span>
                    </div>
                    <div className="text-2xl font-bold">
                      {metrics.clicks.toLocaleString()}
                    </div>
                  </div>

                  <div className="border-[3px] border-black p-4 bg-white">
                    <div className="flex items-center gap-2 mb-1">
                      <Users className="h-5 w-5 text-[#FFCC00]" />
                      <span className="font-bold">Conversions</span>
                    </div>
                    <div className="text-2xl font-bold">
                      {metrics.conversions.toLocaleString()}
                    </div>
                  </div>

                  <div className="border-[3px] border-black p-4 bg-white">
                    <div className="flex items-center gap-2 mb-1">
                      <DollarSign className="h-5 w-5 text-[#33CC99]" />
                      <span className="font-bold">Cost</span>
                    </div>
                    <div className="text-2xl font-bold">
                      {budgetSpent.toLocaleString()} ADC
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                  <div className="border-[3px] border-black p-4 bg-white">
                    <div className="mb-2 font-bold">Click-Through Rate (CTR)</div>
                    <div className="text-2xl font-bold mb-2">{ctr.toFixed(2)}%</div>
                    <Progress
                      value={Math.min(ctr * 5, 100)}
                      className="h-4 bg-[#f5f5f5]"
                    />
                    <div className="flex justify-between text-sm mt-1">
                      <span>0%</span>
                      <span>Good: 2%</span>
                      <span>Excellent: 5%+</span>
                    </div>
                  </div>

                  <div className="border-[3px] border-black p-4 bg-white">
                    <div className="mb-2 font-bold">Conversion Rate</div>
                    <div className="text-2xl font-bold mb-2">{conversionRate.toFixed(2)}%</div>
                    <Progress
                      value={Math.min(conversionRate * 10, 100)}
                      className="h-4 bg-[#f5f5f5]"
                    />
                    <div className="flex justify-between text-sm mt-1">
                      <span>0%</span>
                      <span>Good: 5%</span>
                      <span>Excellent: 10%+</span>
                    </div>
                  </div>
                </div>

                <div className="border-[3px] border-black p-4 bg-white mb-6">
                  <div className="font-bold mb-2">Campaign Performance</div>
                  <p>
                    Performance data visualization will be available soon. This will show trends over time for impressions,
                    clicks, and conversions.
                  </p>
                </div>

                {/* Add the new CampaignLocationBalances component */}
                <div className="border-[3px] border-black bg-white mb-6">
                  <div className="border-b-[3px] border-black p-4 bg-[#0055FF] text-white">
                    <h3 className="text-xl font-bold">Budget & Location Performance</h3>
                    <p className="text-sm text-white/80">Real-time budget allocation and performance metrics by location</p>
                  </div>
                  <div className="p-4">
                    <CampaignLocationBalances 
                      campaignId={campaignId} 
                      bookedLocations={campaignDetails.bookedLocations.map(Number)} 
                    />
                  </div>
                </div>
              </TabsContent>

              <TabsContent value="creative">
                <div className="border-[3px] border-black p-4 bg-white mb-6">
                  <div className="font-bold mb-2">Campaign Creative</div>
                  <div className="mb-4">
                    <Label className="mb-1 block">Content URI</Label>
                    <div className="border-[2px] border-black p-2 bg-[#f5f5f5] break-all">
                      {campaignDetails.metadata.contentURI}
                    </div>
                  </div>
                  <p className="text-sm text-gray-500">
                    The creative content for this campaign is hosted at the URI above. This URI should point to the ad
                    content that will be displayed on the booked locations.
                  </p>
                </div>
              </TabsContent>

              <TabsContent value="settings">
                <div className="border-[3px] border-black p-4 bg-white mb-6">
                  <div className="font-bold text-lg mb-2">Budget Management</div>
                  
                  <div className="mb-4 grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="border-[3px] border-black p-4 bg-[#f5f5f5]">
                      <div className="flex items-center gap-2 mb-2">
                        <Wallet className="h-5 w-5 text-[#0055FF]" />
                        <span className="font-bold">Your Balance</span>
                      </div>
                      {isLoadingBalances ? (
                        <div className="flex items-center gap-2">
                          <RefreshCw className="h-4 w-4 animate-spin" />
                          <span>Loading balance...</span>
                        </div>
                      ) : (
                        <div className="text-xl font-bold">
                          {userBalance?.balance?.toLocaleString() || "0"} ADC
                        </div>
                      )}
                    </div>
                    
                    <div className="border-[3px] border-black p-4 bg-[#f5f5f5]">
                      <div className="flex items-center gap-2 mb-2">
                        <DollarSign className="h-5 w-5 text-[#33CC99]" />
                        <span className="font-bold">Campaign Balance</span>
                      </div>
                      {isLoadingBalances ? (
                        <div className="flex items-center gap-2">
                          <RefreshCw className="h-4 w-4 animate-spin" />
                          <span>Loading balance...</span>
                        </div>
                      ) : (
                        <div className="text-xl font-bold">
                          {campaignBalance?.balance?.toLocaleString() || "0"} ADC
                        </div>
                      )}
                    </div>
                  </div>
                  
                  <div className="mb-4">
                    <Button
                      variant="outline"
                      className="border-[2px] border-black rounded-none font-bold"
                      onClick={() => setIsReallocating(true)}
                    >
                      Manage Campaign Budget
                    </Button>
                  </div>

                  {isReallocating && (
                    <div className="mt-4 border-t pt-4">
                      <div className="bg-[#f5f5f5] border-[3px] border-black p-4 mb-4">
                        <h3 className="font-bold mb-2">Add Funds to Campaign</h3>
                        <p className="text-sm mb-4">Transfer tokens from your balance to this campaign.</p>
                        
                        <div className="mb-4">
                          <Label className="mb-1 block">Amount to add (ADC)</Label>
                          <div className="flex gap-2">
                            <Input
                              type="number"
                              value={addBudgetAmount}
                              onChange={(e) => setAddBudgetAmount(Math.max(0, parseInt(e.target.value) || 0))}
                              className="border-[2px] border-black"
                            />
                            <Button 
                              className="border-[2px] border-black rounded-none font-bold bg-[#0055FF] text-white"
                              onClick={() => setReallocationAmount(addBudgetAmount)}
                              disabled={!userBalance || userBalance.balance < addBudgetAmount}
                            >
                              Add Funds
                            </Button>
                          </div>
                          {userBalance && userBalance.balance < addBudgetAmount && (
                            <p className="text-red-500 text-sm mt-1">Insufficient balance</p>
                          )}
                        </div>
                        
                        <h3 className="font-bold mb-2 mt-6">Withdraw Funds</h3>
                        <p className="text-sm mb-4">Return tokens from this campaign to your balance.</p>
                        
                        <div className="mb-4">
                          <Label className="mb-1 block">Amount to withdraw (ADC)</Label>
                          <div className="flex gap-2">
                            <Input
                              type="number"
                              value={Math.abs(reallocationAmount) > 0 && reallocationAmount < 0 ? Math.abs(reallocationAmount) : ""}
                              onChange={(e) => setReallocationAmount(-Math.max(0, parseInt(e.target.value) || 0))}
                              className="border-[2px] border-black"
                              placeholder="Enter amount..."
                            />
                            <Button 
                              className="border-[2px] border-black rounded-none font-bold bg-[#FF3366] text-white"
                              onClick={() => setReallocationAmount(-Math.max(0, reallocationAmount))}
                              disabled={!campaignBalance || campaignBalance.balance < Math.abs(reallocationAmount)}
                            >
                              Withdraw
                            </Button>
                          </div>
                          {campaignBalance && campaignBalance.balance < Math.abs(reallocationAmount) && (
                            <p className="text-red-500 text-sm mt-1">Insufficient campaign balance</p>
                          )}
                        </div>
                      </div>
                      
                      {reallocationAmount !== 0 && (
                        <div className="border-[3px] border-black p-4 bg-[#FFCC00] mb-4">
                          <h3 className="font-bold mb-2">Confirm Transaction</h3>
                          <p className="mb-4">
                            You are about to {reallocationAmount > 0 ? 'add' : 'withdraw'} {Math.abs(reallocationAmount)} ADC 
                            {reallocationAmount > 0 ? ' to' : ' from'} this campaign.
                          </p>
                          <div className="flex gap-2">
                            <Button
                              variant="outline"
                              className="border-[2px] border-black rounded-none font-bold"
                              onClick={() => {
                                setReallocationAmount(0);
                                setAddBudgetAmount(100);
                              }}
                            >
                              Cancel
                            </Button>
                            <Button
                              className="border-[2px] border-black rounded-none font-bold bg-black text-white"
                              onClick={handleReallocation}
                              disabled={isLoadingBalances}
                            >
                              {isLoadingBalances ? (
                                <><RefreshCw className="w-4 h-4 mr-2 animate-spin" /> Processing...</>
                              ) : (
                                'Confirm Transaction'
                              )}
                            </Button>
                          </div>
                        </div>
                      )}
                      
                      <Button
                        variant="outline"
                        className="border-[2px] border-black rounded-none font-bold"
                        onClick={() => {
                          setIsReallocating(false);
                          setReallocationAmount(0);
                          setAddBudgetAmount(100);
                        }}
                      >
                        Close Budget Management
                      </Button>
                    </div>
                  )}
                </div>

                <div className="border-[3px] border-black p-4 bg-white mb-6">
                  <div className="font-bold mb-2">Campaign ID</div>
                  <div className="mb-2 font-mono break-all">
                    {campaignDetails.id.toString()}
                  </div>
                  <div className="font-bold mb-2 mt-4">Advertiser</div>
                  <div className="mb-2 font-mono break-all">
                    {campaignDetails.advertiser}
                  </div>
                </div>
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>
      </div>

      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent className="border-[6px] border-black rounded-none">
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure you want to delete this campaign?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. The campaign will be permanently deleted from the blockchain.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="border-[3px] border-black rounded-none font-bold">Cancel</AlertDialogCancel>
            <AlertDialogAction
              className="border-[3px] border-black rounded-none font-bold bg-[#FF3366] text-white"
              onClick={handleDeleteCampaign}
            >
              Delete Campaign
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}

