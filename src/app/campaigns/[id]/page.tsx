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

export default function CampaignDetailPage() {
  const params = useParams()
  const router = useRouter()
  const campaignId = params.id as string
  
  const { service, isCorrectChain, switchChain } = useBlockchainService()
  const { 
    getCampaignDetails, 
    campaignDetails,
    isLoadingCampaign,
  } = useBoothRegistry()
  
  const { getCampaignMetrics } = usePerformanceOracle()
  
  const [mounted, setMounted] = useState(false)
  const [isReallocating, setIsReallocating] = useState(false)
  const [reallocationAmount, setReallocationAmount] = useState(0)
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
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

  // Fetch campaign data
  useEffect(() => {
    setMounted(true)
    
    if (service && !hasFetchedRef.current && campaignId) {
      getCampaignDetails(Number(campaignId))
      hasFetchedRef.current = true
      
      // For demo purposes, set some mock metrics
      setMetrics({
        impressions: Math.floor(Math.random() * 10000),
        clicks: Math.floor(Math.random() * 1000),
        conversions: Math.floor(Math.random() * 100),
        spent: Math.floor(Math.random() * 5000),
      })
    }
  }, [service, campaignId, getCampaignDetails])

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
      // This would be implemented with a contract call in production
      toast("Status Change Attempted", { 
        description: "Status change functionality is not implemented yet" 
      }, "info")
      
      // Refresh campaign details
      getCampaignDetails(Number(campaignId))
    } catch (error) {
      toast("Update Failed", { 
        description: "Failed to update campaign status" 
      }, "error")
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
    try {
      // This would be implemented with a contract call in production
      toast("Reallocation Attempted", { 
        description: "Reallocation functionality is not implemented yet" 
      }, "info")

      setIsReallocating(false)
      setReallocationAmount(0)
    } catch (error) {
      toast("Reallocation Failed", { 
        description: "Failed to reallocate funds" 
      }, "error")
    }
  }

  // Parse additional info for budget
  const parseAdditionalInfo = (info?: string) => {
    if (!info) return { budget: 1000 }
    try {
      if (info.includes('budget:')) {
        const budget = parseInt(info.split('budget:')[1].trim())
        return { budget }
      }
      return { budget: 1000 }
    } catch (e) {
      return { budget: 1000 }
    }
  }
  
  // Get budget from additional info or use default
  const { budget } = parseAdditionalInfo(campaignDetails.metadata.additionalInfo)

  // Calculate campaign metrics
  const startDate = new Date(Number(campaignDetails.metadata.startDate) * 1000)
  const endDate = new Date(startDate.getTime())
  endDate.setDate(startDate.getDate() + campaignDetails.metadata.duration)
  
  const daysTotal = campaignDetails.metadata.duration
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
                <div className="text-lg">
                  {budgetRemaining.toLocaleString()} / {budget.toLocaleString()} CRYPTO
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
                      {budgetSpent.toLocaleString()} CRYPTO
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
                  <div className="font-bold mb-2">Budget Allocation</div>
                  <div className="mb-4">
                    <Label className="mb-1 block">Current Budget: {budget.toLocaleString()} CRYPTO</Label>
                    <Button
                      variant="outline"
                      className="border-[2px] border-black rounded-none font-bold"
                      onClick={() => setIsReallocating(true)}
                    >
                      Reallocate Budget
                    </Button>
                  </div>

                  {isReallocating && (
                    <div className="mt-4 border-t pt-4">
                      <Label className="mb-1 block">Adjustment Amount</Label>
                      <div className="flex gap-2 mb-2">
                        <Button
                          variant="outline"
                          className="border-[2px] border-black rounded-none font-bold"
                          onClick={() => setReallocationAmount(Math.max(-1000, reallocationAmount - 100))}
                        >
                          -100
                        </Button>
                        <div className="flex-1 flex items-center justify-center font-bold">
                          {reallocationAmount > 0 ? "+" : ""}
                          {reallocationAmount.toLocaleString()} CRYPTO
                        </div>
                        <Button
                          variant="outline"
                          className="border-[2px] border-black rounded-none font-bold"
                          onClick={() => setReallocationAmount(Math.min(1000, reallocationAmount + 100))}
                        >
                          +100
                        </Button>
                      </div>
                      <Slider
                        min={-1000}
                        max={1000}
                        step={10}
                        value={[reallocationAmount]}
                        onValueChange={(val) => setReallocationAmount(val[0])}
                        className="mb-4"
                      />
                      <div className="flex gap-2">
                        <Button
                          variant="outline"
                          className="border-[2px] border-black rounded-none font-bold"
                          onClick={() => setIsReallocating(false)}
                        >
                          Cancel
                        </Button>
                        <Button
                          className="border-[2px] border-black rounded-none font-bold bg-[#0055FF] text-white"
                          onClick={handleReallocation}
                        >
                          Confirm Reallocation
                        </Button>
                      </div>
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

