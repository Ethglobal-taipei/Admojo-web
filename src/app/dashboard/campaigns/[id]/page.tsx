"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { notFound } from "next/navigation"
import { Button } from "@/components/ui/button"
import { 
  ArrowLeft, Calendar, DollarSign, 
  MapPin, Target, PieChart, ArrowUpRight,
  Image as ImageIcon, Eye, Loader2
} from "lucide-react"
import { useCampaignStore } from "@/lib/store/useCampaignStore"
import { useAdContract } from "@/hooks/use-ad-contract"
import CampaignLocationsMap from "@/components/map/campaign-locations-map"
import { format } from "date-fns"

export default function CampaignDetailsPage({ params }: { params: { id: string } }) {
  const router = useRouter()
  const { campaigns } = useCampaignStore()
  const { operations } = useAdContract()
  
  // Local state for loading
  const [isLoading, setIsLoading] = useState(true)
  
  const campaign = campaigns.find(c => c.id === params.id)
  
  // Simulate fetching campaign data
  useEffect(() => {
    if (!campaign) {
      // In a real app with a fetch function: fetchCampaign(params.id)
      const timer = setTimeout(() => {
        setIsLoading(false)
      }, 1000)
      
      return () => clearTimeout(timer)
    } else {
      setIsLoading(false)
    }
  }, [campaign, params.id])
  
  if (!campaign && !isLoading) {
    return notFound()
  }
  
  const formattedStartDate = campaign?.startDate 
    ? format(new Date(campaign.startDate), "MMM d, yyyy") 
    : "Not set"
    
  const formattedEndDate = campaign?.endDate
    ? format(new Date(campaign.endDate), "MMM d, yyyy")
    : "Not set"
    
  return (
    <div className="container mx-auto p-4 max-w-5xl">
      <div className="flex flex-col gap-6">
        {/* Header */}
        <div className="flex items-center gap-4">
          <Button
            variant="outline"
            size="icon"
            className="h-10 w-10 border-[2px] border-black rounded-none"
            onClick={() => router.push("/dashboard/campaigns")}
          >
            <ArrowLeft className="h-5 w-5" />
          </Button>
          
          <div>
            <h1 className="text-2xl font-black flex items-center gap-2">
              <Target className="h-6 w-6" />
              {isLoading ? "Loading Campaign..." : campaign?.name || "Campaign Details"}
            </h1>
            {campaign?.status && (
              <div className="flex items-center mt-1">
                <span className={`inline-block h-2 w-2 rounded-full mr-2 ${
                  campaign.status === "active" ? "bg-green-500" : 
                  campaign.status === "draft" ? "bg-amber-500" : 
                  campaign.status === "completed" ? "bg-blue-500" : "bg-gray-500"
                }`}></span>
                <span className="text-sm capitalize">{campaign.status}</span>
              </div>
            )}
          </div>
        </div>
        
        {isLoading ? (
          <div className="h-60 flex items-center justify-center">
            <Loader2 className="h-10 w-10 animate-spin text-[#0055FF]" />
          </div>
        ) : campaign ? (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Left column - Campaign Details */}
            <div className="lg:col-span-2 space-y-6">
              {/* Campaign Info Card */}
              <div className="border-[4px] border-black bg-white shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] p-5">
                <h2 className="text-xl font-black mb-4 border-b-[3px] border-black pb-2">Campaign Details</h2>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <h3 className="font-bold text-sm flex items-center">
                      <Calendar className="h-4 w-4 mr-2" /> Campaign Period
                    </h3>
                    <p className="mt-1">
                      {formattedStartDate} to {formattedEndDate}
                    </p>
                    
                    <h3 className="font-bold text-sm flex items-center mt-4">
                      <DollarSign className="h-4 w-4 mr-2" /> Budget
                    </h3>
                    <p className="mt-1">
                      {campaign.budget ? `${campaign.budget.toLocaleString()} ADC` : "Not set"}
                    </p>
                  </div>
                  
                  <div>
                    <h3 className="font-bold text-sm flex items-center">
                      <MapPin className="h-4 w-4 mr-2" /> Locations
                    </h3>
                    <p className="mt-1">
                      {campaign.targetLocations ? 
                        `${campaign.targetLocations.length} location${campaign.targetLocations.length !== 1 ? 's' : ''}` : 
                        "No locations"
                      }
                    </p>
                    
                    <h3 className="font-bold text-sm flex items-center mt-4">
                      <Eye className="h-4 w-4 mr-2" /> Estimated Impressions
                    </h3>
                    <p className="mt-1">
                      {campaign.budget ? Math.floor(campaign.budget / 0.007).toLocaleString() : "Not available"}
                    </p>
                  </div>
                </div>
                
                {/* Only show transaction hash if available - we access it as a custom property */}
                {campaign.metadata && campaign.metadata.txHash && (
                  <div className="mt-4 pt-4 border-t-[2px] border-gray-200">
                    <h3 className="font-bold text-sm">Transaction</h3>
                    <div className="mt-1 flex items-center">
                      <span className="font-mono text-xs truncate">
                        {campaign.metadata.txHash.substring(0, 18)}...
                      </span>
                      <a 
                        href={`https://holesky.etherscan.io/tx/${campaign.metadata.txHash}`}
                        target="_blank" 
                        rel="noopener noreferrer"
                        className="ml-2 text-blue-500 hover:text-blue-700"
                      >
                        <ArrowUpRight className="h-4 w-4" />
                      </a>
                    </div>
                  </div>
                )}
              </div>
              
              {/* Campaign Map */}
              <div className="border-[4px] border-black bg-white shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] p-5">
                <h2 className="text-xl font-black mb-4 border-b-[3px] border-black pb-2">Campaign Locations</h2>
                <CampaignLocationsMap
                  height="400px" 
                  width="100%"
                  campaignId={campaign.id}
                  showControls={true}
                  showStats={true}
                  showFilters={false}
                  editable={false}
                />
              </div>
            </div>
            
            {/* Right column - Creative and Stats */}
            <div className="space-y-6">
              {/* Creative Preview */}
              <div className="border-[4px] border-black bg-white shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] p-5">
                <h2 className="text-xl font-black mb-4 border-b-[3px] border-black pb-2">Creative</h2>
                
                {campaign.creativeUrl ? (
                  <div className="aspect-video bg-black flex items-center justify-center overflow-hidden">
                    <img 
                      src={campaign.creativeUrl} 
                      alt={campaign.name} 
                      className="max-w-full max-h-full object-contain"
                    />
                  </div>
                ) : (
                  <div className="aspect-video bg-gray-100 flex flex-col items-center justify-center border-2 border-dashed border-gray-300">
                    <ImageIcon className="h-12 w-12 text-gray-400 mb-2" />
                    <p className="text-sm text-gray-500">No creative available</p>
                  </div>
                )}
              </div>
              
              {/* Campaign Stats */}
              <div className="border-[4px] border-black bg-white shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] p-5">
                <h2 className="text-xl font-black mb-4 border-b-[3px] border-black pb-2 flex items-center">
                  <PieChart className="h-5 w-5 mr-2" /> Performance
                </h2>
                
                <div className="space-y-3">
                  <div className="flex justify-between items-center">
                    <span className="font-medium text-sm">Impressions</span>
                    <span className="font-bold">{(campaign.metadata?.impressions || 0).toLocaleString()}</span>
                  </div>
                  
                  <div className="flex justify-between items-center">
                    <span className="font-medium text-sm">Clicks</span>
                    <span className="font-bold">{(campaign.metadata?.clicks || 0).toLocaleString()}</span>
                  </div>
                  
                  <div className="flex justify-between items-center">
                    <span className="font-medium text-sm">CTR</span>
                    <span className="font-bold">
                      {campaign.metadata?.impressions && campaign.metadata.impressions > 0
                        ? ((campaign.metadata.clicks || 0) / campaign.metadata.impressions * 100).toFixed(2) + '%'
                        : '0.00%'
                      }
                    </span>
                  </div>
                  
                  <div className="flex justify-between items-center">
                    <span className="font-medium text-sm">Spent</span>
                    <span className="font-bold">
                      {((campaign.metadata?.impressions || 0) * 0.007).toLocaleString()} ADC
                    </span>
                  </div>
                  
                  <div className="flex justify-between items-center">
                    <span className="font-medium text-sm">Budget Used</span>
                    <span className="font-bold">
                      {campaign.budget
                        ? ((((campaign.metadata?.impressions || 0) * 0.007) / campaign.budget) * 100).toFixed(1) + '%'
                        : '0.0%'
                      }
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        ) : (
          <div className="text-center py-12">
            <p className="text-lg font-bold text-gray-800">Campaign not found</p>
            <p className="text-gray-600 mt-2">The campaign you're looking for doesn't exist or has been removed.</p>
            <Button 
              className="mt-4 bg-[#0055FF] text-white border-[3px] border-black hover:bg-[#0044CC]"
              onClick={() => router.push("/dashboard/campaigns")}
            >
              Back to Campaigns
            </Button>
          </div>
        )}
      </div>
    </div>
  )
} 