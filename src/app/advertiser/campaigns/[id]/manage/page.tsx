"use client"

import { useEffect, useState } from "react"
import { useParams, useRouter } from "next/navigation"
import {
  ArrowLeft,
  Calendar,
  Clock,
  Edit,
  Image,
  MapPin,
  Pause,
  Play,
  Rocket,
  Trash2,
  RefreshCw,
  CheckCircle2,
  XCircle,
  AlertCircle,
  DollarSign,
  BarChart3,
  Plus,
  Globe,
  LinkIcon
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { usePrivy } from "@privy-io/react-auth"
import { useAdContract } from "@/hooks/use-ad-contract"
import { toast } from "@/lib/toast"
import { Skeleton } from "@/components/ui/skeleton"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { LocationManager } from "@/components/campaign/location-manager"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog"

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

export default function CampaignManagePage() {
  const params = useParams()
  const router = useRouter()
  const campaignId = params.id as string
  
  const [campaign, setCampaign] = useState<Campaign | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [updating, setUpdating] = useState(false)
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)
  const [refreshing, setRefreshing] = useState(false)
  
  const { authenticated, ready, user } = usePrivy()
  const { operations, adContract, isCorrectChain, switchChain } = useAdContract()
  
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
  
  // Format date to readable string
  const formatDate = (date: Date) => {
    return date.toLocaleDateString('en-US', { 
      year: 'numeric', 
      month: 'short', 
      day: 'numeric' 
    })
  }
  
  // Fetch campaign data
  const fetchCampaignData = async () => {
    try {
      setIsLoading(true)
      
      if (!adContract || !authenticated) {
        setTimeout(() => fetchCampaignData(), 1000) // retry if not ready
        return
      }
      
      // Check if network is correct
      if (!isCorrectChain) {
        toast("Wrong Network", { 
          description: "Please switch to the correct network to view your campaigns." 
        }, "warning")
        await switchChain()
        return
      }
      
      // Get campaign details
      const campaignDetails = await operations.getCampaignDetails.execute(parseInt(campaignId))
      
      if (campaignDetails) {
        setCampaign(campaignDetails)
      } else {
        toast("Campaign Not Found", { 
          description: "The campaign you're looking for could not be found." 
        }, "error")
      }
    } catch (error) {
      console.error("Error fetching campaign:", error)
      toast("Error", { 
        description: "Failed to load campaign details." 
      }, "error")
    } finally {
      setIsLoading(false)
      setRefreshing(false)
    }
  }
  
  // Toggle campaign active status
  const toggleCampaignStatus = async () => {
    try {
      if (!campaign) return
      
      setUpdating(true)
      
      // Note: This would require a contract function to change campaign status
      // For now, we're just showing how it would work conceptually
      toast("Coming Soon", { 
        description: "Campaign status toggle will be available in a future update." 
      }, "info")
      
      // Refresh campaign data
      await fetchCampaignData()
    } catch (error) {
      console.error("Error updating campaign status:", error)
      toast("Error", { 
        description: "Failed to update campaign status." 
      }, "error")
    } finally {
      setUpdating(false)
    }
  }
  
  // Delete campaign
  const handleDeleteCampaign = async () => {
    try {
      if (!campaign) return
      
      setUpdating(true)
      
      // Note: This would require a contract function to delete a campaign
      // For now, we're just showing how it would work conceptually
      toast("Coming Soon", { 
        description: "Campaign deletion will be available in a future update." 
      }, "info")
      
      // Close dialog and navigate back to campaigns list
      setShowDeleteConfirm(false)
      router.push("/advertiser/campaigns")
    } catch (error) {
      console.error("Error deleting campaign:", error)
      toast("Error", { 
        description: "Failed to delete campaign." 
      }, "error")
    } finally {
      setUpdating(false)
    }
  }
  
  // On component mount
  useEffect(() => {
    if (campaignId && authenticated && ready && adContract) {
      fetchCampaignData()
    }
  }, [campaignId, authenticated, ready, adContract])
  
  // Handle refresh
  const handleRefresh = () => {
    setRefreshing(true)
    fetchCampaignData()
  }
  
  // Render loading state
  if (isLoading) {
    return (
      <div className="container mx-auto px-4 py-8 max-w-6xl">
        <div className="flex items-center mb-6">
          <Button
            variant="outline"
            onClick={() => router.back()}
            className="border-[3px] border-black rounded-none bg-white hover:bg-[#f5f5f5]"
          >
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back
          </Button>
        </div>
        
        <Card className="border-[6px] border-black shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] mb-8">
          <CardHeader>
            <Skeleton className="h-8 w-64 bg-gray-200 mb-2" />
            <Skeleton className="h-4 w-48 bg-gray-200" />
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <Skeleton className="h-40 bg-gray-200 w-full" />
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <Skeleton className="h-20 bg-gray-200" />
                <Skeleton className="h-20 bg-gray-200" />
                <Skeleton className="h-20 bg-gray-200" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }
  
  // Render not found state
  if (!campaign) {
    return (
      <div className="container mx-auto px-4 py-8 max-w-6xl">
        <div className="flex items-center mb-6">
          <Button
            variant="outline"
            onClick={() => router.back()}
            className="border-[3px] border-black rounded-none bg-white hover:bg-[#f5f5f5]"
          >
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back
          </Button>
        </div>
        
        <Card className="border-[6px] border-black shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] mb-8">
          <CardContent className="pt-6">
            <div className="text-center py-8">
              <AlertCircle className="h-16 w-16 mx-auto mb-4 text-red-500" />
              <h2 className="text-2xl font-bold mb-2">Campaign Not Found</h2>
              <p className="mb-6 text-gray-600">The campaign you're looking for doesn't exist or you don't have access to it.</p>
              <Button
                onClick={() => router.push("/advertiser/campaigns")}
                className="bg-[#0055FF] text-white border-[3px] border-black hover:bg-[#0044CC]"
              >
                View All Campaigns
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }
  
  // Helper variables
  const { startDate, endDate, progress } = calculateDates(campaign.metadata.startDate, campaign.metadata.duration)
  const budget = getBudget(campaign.metadata.additionalInfo)

  return (
    <div className="container mx-auto px-4 py-8 max-w-6xl">
      {/* Header with back button and actions */}
      <div className="flex items-center justify-between mb-6">
        <Button
          variant="outline"
          onClick={() => router.push("/advertiser/campaigns")}
          className="border-[3px] border-black rounded-none bg-white hover:bg-[#f5f5f5]"
        >
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back to Campaigns
        </Button>
        
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            onClick={handleRefresh}
            disabled={refreshing || updating}
            className="border-[3px] border-black rounded-none bg-white hover:bg-[#f5f5f5]"
          >
            <RefreshCw className={`mr-2 h-4 w-4 ${refreshing ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
          
          <Button
            variant="outline"
            onClick={toggleCampaignStatus}
            disabled={updating}
            className="border-[3px] border-black rounded-none bg-white hover:bg-[#f5f5f5]"
          >
            {updating ? (
              <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
            ) : campaign.active ? (
              <Pause className="mr-2 h-4 w-4" />
            ) : (
              <Play className="mr-2 h-4 w-4" />
            )}
            {campaign.active ? "Pause Campaign" : "Activate Campaign"}
          </Button>
          
          <Button
            variant="destructive"
            onClick={() => setShowDeleteConfirm(true)}
            disabled={updating}
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
              <CardTitle className="text-3xl font-black">{campaign.metadata.name}</CardTitle>
              <CardDescription className="text-lg">
                {campaign.metadata.description || "No description provided"}
              </CardDescription>
            </div>
            <div
              className={`px-3 py-1 font-bold text-white border-[3px] border-black ${
                campaign.active
                  ? "bg-green-500"
                  : "bg-yellow-500"
              }`}
            >
              {campaign.active ? "ACTIVE" : "INACTIVE"}
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
                {formatDate(startDate)} - {formatDate(endDate)}
              </div>
              <div className="mt-2">
                <div className="flex justify-between text-sm mb-1">
                  <span>{Math.floor(progress)}% Complete</span>
                </div>
                <Progress value={progress} className="h-2 bg-gray-200" />
              </div>
            </div>

            <div className="border-[3px] border-black p-4">
              <div className="flex items-center gap-2 mb-1">
                <DollarSign className="h-5 w-5" />
                <span className="font-bold">Budget</span>
              </div>
              <div className="text-lg">{budget.toLocaleString()} ADC</div>
              <div className="mt-2 text-sm text-gray-600">
                Campaign duration: {campaign.metadata.duration} days
              </div>
            </div>

            <div className="border-[3px] border-black p-4">
              <div className="flex items-center gap-2 mb-1">
                <Clock className="h-5 w-5" />
                <span className="font-bold">Creative</span>
              </div>
              {campaign.metadata.contentURI ? (
                <div className="flex items-center gap-2">
                  <Image className="h-4 w-4 text-gray-600" />
                  <a 
                    href={campaign.metadata.contentURI} 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="text-blue-600 hover:underline text-sm truncate"
                  >
                    {campaign.metadata.contentURI.replace('ipfs://', 'IPFS: ')}
                  </a>
                </div>
              ) : (
                <div className="text-sm text-gray-600">No creative URL provided</div>
              )}
              <div className="mt-2">
                <Button
                  variant="outline"
                  size="sm"
                  className="w-full border-[2px] border-black rounded-none bg-white hover:bg-[#f5f5f5] text-xs h-8"
                >
                  <Edit className="mr-1 h-3 w-3" />
                  Update Creative
                </Button>
              </div>
            </div>

            <div className="border-[3px] border-black p-4">
              <div className="flex items-center gap-2 mb-1">
                <MapPin className="h-5 w-5" />
                <span className="font-bold">Target Locations</span>
              </div>
              <div className="text-lg">{campaign.bookedLocations.length} locations</div>
              <div className="mt-2">
                <Button
                  variant="outline"
                  size="sm"
                  className="w-full border-[2px] border-black rounded-none bg-white hover:bg-[#f5f5f5] text-xs h-8"
                  onClick={() => document.getElementById('locations-tab')?.click()}
                >
                  <MapPin className="mr-1 h-3 w-3" />
                  Manage Locations
                </Button>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Tabs Section */}
      <Tabs defaultValue="overview" className="mb-8">
        <TabsList className="border-[3px] border-black rounded-none bg-white p-0 h-auto">
          <TabsTrigger
            value="overview"
            className="rounded-none data-[state=active]:bg-[#0055FF] data-[state=active]:text-white px-6 py-3 font-bold"
          >
            Overview
          </TabsTrigger>
          <TabsTrigger
            id="locations-tab"
            value="locations"
            className="rounded-none data-[state=active]:bg-[#0055FF] data-[state=active]:text-white px-6 py-3 font-bold"
          >
            Locations
          </TabsTrigger>
          <TabsTrigger
            value="analytics"
            className="rounded-none data-[state=active]:bg-[#0055FF] data-[state=active]:text-white px-6 py-3 font-bold"
          >
            Analytics
          </TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="mt-6">
          <Card className="border-[4px] border-black">
            <CardHeader>
              <CardTitle>Campaign Overview</CardTitle>
              <CardDescription>
                Summary of your campaign's key information and status
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-6">
                <div className="bg-gray-50 border-[2px] border-gray-200 p-4 rounded-md">
                  <h3 className="font-bold text-lg mb-2">Campaign Details</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <p className="text-sm text-gray-600">Campaign ID:</p>
                      <p className="font-medium">{campaign.id}</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-600">Advertiser Address:</p>
                      <p className="font-medium">
                        {campaign.owner.slice(0, 6)}...{campaign.owner.slice(-4)}
                      </p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-600">Status:</p>
                      <Badge className={campaign.active ? "bg-green-100 text-green-800" : "bg-yellow-100 text-yellow-800"}>
                        {campaign.active ? "Active" : "Inactive"}
                      </Badge>
                    </div>
                    <div>
                      <p className="text-sm text-gray-600">Duration:</p>
                      <p className="font-medium">{campaign.metadata.duration} days</p>
                    </div>
                  </div>
                </div>
                
                <div className="bg-gray-50 border-[2px] border-gray-200 p-4 rounded-md">
                  <h3 className="font-bold text-lg mb-2">Booked Locations</h3>
                  <div className="flex items-center gap-2 mb-3">
                    <MapPin className="h-5 w-5 text-blue-600" />
                    <span className="font-medium">{campaign.bookedLocations.length} locations booked</span>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-2">
                    {campaign.bookedLocations.slice(0, 6).map((deviceId) => (
                      <div key={deviceId} className="border border-gray-200 p-2 rounded text-sm">
                        Location ID: {deviceId}
                      </div>
                    ))}
                    {campaign.bookedLocations.length > 6 && (
                      <div className="border border-gray-200 p-2 rounded text-sm bg-gray-100 text-center">
                        +{campaign.bookedLocations.length - 6} more
                      </div>
                    )}
                  </div>
                </div>
                
                <div className="bg-gray-50 border-[2px] border-gray-200 p-4 rounded-md">
                  <h3 className="font-bold text-lg mb-2">Ad Creative</h3>
                  <div className="flex items-center gap-2 mb-3">
                    <Image className="h-5 w-5 text-purple-600" />
                    <span className="font-medium">Creative URL</span>
                  </div>
                  {campaign.metadata.contentURI ? (
                    <div className="flex items-center gap-2">
                      <LinkIcon className="h-4 w-4 text-blue-600" />
                      <a 
                        href={campaign.metadata.contentURI} 
                        target="_blank" 
                        rel="noopener noreferrer"
                        className="text-blue-600 hover:underline"
                      >
                        {campaign.metadata.contentURI}
                      </a>
                    </div>
                  ) : (
                    <p className="text-gray-600">No creative URL provided</p>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="locations" className="mt-6">
          <Card className="border-[4px] border-black">
            <CardHeader>
              <CardTitle>Location Management</CardTitle>
              <CardDescription>
                Add or remove display locations for this campaign
              </CardDescription>
            </CardHeader>
            <CardContent>
              <LocationManager 
                campaignId={campaignId} 
                campaign={campaign} 
                onLocationChange={fetchCampaignData}
              />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="analytics" className="mt-6">
          <Card className="border-[4px] border-black">
            <CardHeader>
              <CardTitle>Campaign Analytics</CardTitle>
              <CardDescription>
                View performance metrics for your campaign
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-center py-10 border-[2px] border-dashed border-gray-300 rounded-md">
                <BarChart3 className="h-16 w-16 mx-auto mb-4 text-gray-400" />
                <h3 className="text-xl font-bold mb-2">Analytics Coming Soon</h3>
                <p className="text-gray-600 max-w-md mx-auto mb-6">
                  We're working on integrating analytics tracking for your campaigns.
                  This feature will be available in a future update.
                </p>
                <Button
                  variant="outline"
                  className="border-[2px] border-black rounded-none bg-white hover:bg-[#f5f5f5]"
                >
                  <Globe className="mr-2 h-4 w-4" />
                  Check Implementation Status
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
      
      {/* Delete Confirmation Dialog */}
      <Dialog open={showDeleteConfirm} onOpenChange={setShowDeleteConfirm}>
        <DialogContent className="border-[4px] border-black rounded-none max-w-md">
          <DialogHeader>
            <DialogTitle className="text-2xl font-bold">Delete Campaign</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete this campaign? This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          
          <div className="bg-red-50 border-[2px] border-red-200 p-3 rounded flex items-start gap-2 my-2">
            <AlertCircle className="h-5 w-5 text-red-600 mt-0.5" />
            <div>
              <p className="font-medium text-red-800">Warning</p>
              <p className="text-sm text-red-700">
                Deleting this campaign will release all booked locations and end the campaign permanently.
              </p>
            </div>
          </div>
          
          <DialogFooter className="gap-2 sm:justify-end">
            <Button
              variant="outline"
              onClick={() => setShowDeleteConfirm(false)}
              className="border-[2px] border-black rounded-none bg-white hover:bg-[#f5f5f5]"
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={handleDeleteCampaign}
              disabled={updating}
              className="border-[2px] border-black rounded-none bg-red-600 hover:bg-red-700 text-white"
            >
              {updating ? (
                <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                <Trash2 className="mr-2 h-4 w-4" />
              )}
              Delete Campaign
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
} 