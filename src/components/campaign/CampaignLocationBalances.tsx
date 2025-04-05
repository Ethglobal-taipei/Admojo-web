"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { 
  MapPin, 
  Clock, 
  DollarSign, 
  FileText, 
  TrendingUp, 
  RefreshCw,
  Wallet
} from "lucide-react"
import { useLocationStore } from "@/lib/store"
import { 
  getUserTokenBalance, 
  getCampaignTokenBalance,
  createCampaignHolder,
  TokenBalanceResponse
} from "@/lib/services/tokenomics.service"

interface CampaignLocationBalancesProps {
  campaignId: string | number;
  bookedLocations: number[];
  compact?: boolean;
}

export default function CampaignLocationBalances({ 
  campaignId, 
  bookedLocations,
  compact = false
}: CampaignLocationBalancesProps) {
  const { locations } = useLocationStore();
  
  // State for real token balances
  const [campaignBalance, setCampaignBalance] = useState<TokenBalanceResponse | null>(null);
  const [isLoadingBalance, setIsLoadingBalance] = useState(false);
  
  // State for location performance metrics
  const [locationMetrics, setLocationMetrics] = useState<{
    [locationId: number]: {
      views: number;
      budget: number;
      spent: number;
      lastUpdated: string;
      isLoading: boolean;
    }
  }>({});

  // Create a function to fetch campaign balance outside useEffect so it can be called from buttons
  const fetchCampaignBalance = async () => {
    if (!campaignId) return;
    
    setIsLoadingBalance(true);
    try {
      // Try to get campaign balance
      let balance = await getCampaignTokenBalance(String(campaignId));
      
      // If no balance found, campaign might not have a holder yet, so try to create one
      if (!balance) {
        console.log("No campaign holder found, creating one...");
        
        // Attempt to create a holder for this campaign
        const holderCreated = await createCampaignHolder(String(campaignId));
        
        if (holderCreated) {
          console.log("Campaign holder created successfully!");
          
          // Wait a moment for the data to propagate
          await new Promise(resolve => setTimeout(resolve, 1000));
          
          // Try to fetch the campaign balance again
          balance = await getCampaignTokenBalance(String(campaignId));
        } else {
          console.warn("Could not create a holder for this campaign");
        }
      }
      
      setCampaignBalance(balance);
      
      // Initialize location metrics based on campaign balance
      if (balance && bookedLocations.length > 0) {
        // Divide campaign balance among locations proportionally
        // This is just an example allocation - in a real app you'd have actual data
        const totalLocations = bookedLocations.length;
        const perLocationBudget = balance.balance / totalLocations;
        
        const newMetrics: typeof locationMetrics = {};
        
        bookedLocations.forEach(locationId => {
          // Create random metrics for demo purposes
          // In a real app, these would come from backend/blockchain
          const randomSpent = Math.random() * perLocationBudget * 0.7;
          
          newMetrics[locationId] = {
            views: Math.floor(Math.random() * 1000) + 100,
            budget: perLocationBudget,
            spent: randomSpent,
            lastUpdated: new Date().toISOString(),
            isLoading: false
          };
        });
        
        setLocationMetrics(newMetrics);
      }
    } catch (error) {
      console.error("Error fetching campaign balance:", error);
    } finally {
      setIsLoadingBalance(false);
    }
  };

  // Fetch campaign balance on mount
  useEffect(() => {
    fetchCampaignBalance();
  }, [campaignId, bookedLocations]);

  if (bookedLocations.length === 0) {
    return (
      <div className="border-[3px] border-black p-6 text-center">
        <p className="text-gray-500">No locations currently assigned to this campaign.</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Campaign Wallet Balance */}
      <div className="border-[4px] border-black bg-[#f0f9ff] p-4">
        <div className="flex items-center justify-between mb-2">
          <h3 className="font-bold flex items-center gap-2">
            <Wallet className="h-5 w-5 text-[#0055FF]" />
            Campaign Balance
          </h3>
          {isLoadingBalance ? (
            <RefreshCw className="h-4 w-4 animate-spin" />
          ) : (
            <Button 
              size="sm" 
              variant="outline" 
              className="h-8 border-[2px] border-black text-xs"
              onClick={() => fetchCampaignBalance()}
            >
              <RefreshCw className="h-3 w-3 mr-1" />
              Refresh
            </Button>
          )}
        </div>
        
        <div className="flex items-center justify-between">
          <div className="text-xl md:text-2xl font-black">
            {isLoadingBalance ? (
              "Loading..."
            ) : (
              campaignBalance ? (
                <span>{campaignBalance.balance.toLocaleString()} ADC</span>
              ) : (
                "No balance data"
              )
            )}
          </div>
          
          <div className="text-sm font-medium bg-black text-white px-2 py-1">
            {isLoadingBalance ? (
              <RefreshCw className="h-3 w-3 animate-spin" />
            ) : (
              <span>
                ≈ ${campaignBalance ? ((campaignBalance.balance / 2.35) * 1).toFixed(2) : "0.00"} USDC
              </span>
            )}
          </div>
        </div>
      </div>
      
      {/* Location Performance */}
      <div className="grid grid-cols-1 gap-4">
        {bookedLocations.map((locationId) => {
          const locationDetails = locations.find(loc => loc.deviceId === locationId);
          const metrics = locationMetrics[locationId] || {
            views: 0,
            budget: 0,
            spent: 0,
            lastUpdated: new Date().toISOString(),
            isLoading: false
          };
          
          return (
            <div key={locationId} className="border-[3px] border-black p-4 bg-white">
              <div className="flex justify-between items-start mb-3">
                <div>
                  <h4 className="font-bold text-lg">
                    {locationDetails?.name || `Location #${locationId}`}
                  </h4>
                  <p className="text-sm text-gray-600">
                    {locationDetails?.city || 'Unknown location'} • ID: {locationId}
                  </p>
                </div>
                
                <div className="text-sm font-medium flex items-center gap-1">
                  <Clock className="h-4 w-4" />
                  Updated {new Date(metrics.lastUpdated).toLocaleDateString()}
                </div>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mb-3">
                <div className="border-[2px] border-black p-2 bg-[#f5f5f5]">
                  <p className="text-xs font-medium mb-1">Views</p>
                  <p className="font-bold text-lg">{metrics.views.toLocaleString()}</p>
                </div>
                
                <div className="border-[2px] border-black p-2 bg-[#f5f5f5]">
                  <p className="text-xs font-medium mb-1">Budget</p>
                  <p className="font-bold text-lg">
                    <DollarSign className="h-4 w-4 inline" />
                    {metrics.budget.toFixed(2)} ADC
                  </p>
                </div>
                
                <div className="border-[2px] border-black p-2 bg-[#f5f5f5]">
                  <p className="text-xs font-medium mb-1">Spent</p>
                  <p className="font-bold text-lg flex items-center justify-between">
                    <span>
                      <DollarSign className="h-4 w-4 inline" />
                      {metrics.spent.toFixed(2)} ADC
                    </span>
                    <span className="text-xs text-gray-500">
                      ({((metrics.spent / metrics.budget) * 100).toFixed(1)}%)
                    </span>
                  </p>
                </div>
              </div>
              
              <div className="flex justify-between items-center">
                <div className="flex items-center gap-1 text-sm text-green-600 font-medium">
                  <TrendingUp className="h-4 w-4" />
                  <span>+{Math.floor(Math.random() * 20) + 5}% engagement</span>
                </div>
                
                <Button 
                  size="sm" 
                  variant="outline" 
                  className="h-8 border-[2px] border-black text-xs"
                >
                  <FileText className="h-3 w-3 mr-1" />
                  View Details
                </Button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
} 