"use client"

import { useState, useEffect, useRef, useCallback } from "react"
import { useUserStore, useUIStore } from "@/lib/store"
import { holesky } from "viem/chains"
import DashboardHeader from "./components/dashboard-header"
import KPICards from "./components/kpi-cards"
import DisplayMap from "./components/display-map"
import CampaignCreator from "./components/campaign-creator"
import PerformanceAnalytics from "./components/performance-analytics"
import TransactionHistory from "./components/transaction-history"
import { Button } from "@/components/ui/button"
import { Wallet, Plus, DollarSign } from "lucide-react"
import { useBlockchainService, useBoothRegistry, usePerformanceOracle } from "@/hooks"

export default function Dashboard() {
  const { isConnected } = useUserStore()
  const { openModal } = useUIStore()
  const { service, isCorrectChain, switchChain } = useBlockchainService()
  
  // Check if blockchain is connected in addition to user being connected
  const isBlockchainConnected = isConnected && service?.isConnected

  const handleAddFunds = () => {
    openModal("addFunds")
  }

  const handleCreateCampaign = () => {
    openModal("createCampaign")
  }

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
        <div
          className="absolute top-[60%] left-[20%] w-24 h-24 bg-black opacity-5 rotate-45 animate-pulse"
          style={{ animationDuration: "4s" }}
        ></div>
        <div
          className="absolute bottom-[40%] right-[30%] w-36 h-36 bg-[#FFCC00] border-[6px] border-black opacity-10 rotate-12"
          style={{ animation: "float 6s ease-in-out infinite" }}
        ></div>
      </div>

      <main className="container mx-auto px-4 py-8 relative z-10">
        {/* Header Section */}
        <section className="mb-10">
          <DashboardHeader />
        </section>

        {/* KPI Cards Section */}
        <section className="mb-10">
          <KPICards />
        </section>

        {/* If not connected, show a connect prompt instead of the rest of the dashboard */}
        {!isBlockchainConnected ? (
          <div className="border-[6px] border-black bg-white p-12 text-center">
            <h2 className="text-3xl font-black mb-4">Connect Your Wallet to Access Your Dashboard</h2>
            <p className="text-lg mb-8 max-w-2xl mx-auto">
              Connect your wallet to view your campaign data, analytics, and transaction history. You'll also be able to
              create new campaigns and manage your existing ones.
            </p>
            {service && !service.isConnected && (
              <Button 
                onClick={() => service.connect()}
                className="bg-[#0055FF] text-white border-[4px] border-black hover:bg-[#FFCC00] hover:text-black transition-all font-bold text-lg px-6 py-3 h-auto rounded-none shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] hover:shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] hover:-translate-y-1"
              >
                <Wallet className="w-5 h-5 mr-2" />
                Connect Wallet
              </Button>
            )}
          </div>
        ) : (
          <>
            {/* Chain Switch Warning - Show if connected but wrong chain */}
            {service && !isCorrectChain && (
              <div className="border-[6px] border-yellow-400 bg-white p-6 text-center mb-10">
                <h3 className="text-2xl font-black mb-2">Wrong Network Detected</h3>
                <p className="mb-4">Please switch to the Holesky testnet to continue.</p>
                <Button 
                  onClick={() => switchChain()}
                  className="bg-yellow-400 text-black border-[4px] border-black hover:bg-yellow-500 transition-all font-bold"
                >
                  Switch to Holesky
                </Button>
              </div>
            )}
          
            {/* Action Buttons */}
            <div className="flex flex-wrap gap-4 mb-10">
              <Button
                onClick={handleAddFunds}
                className="bg-[#0055FF] text-white border-[4px] border-black hover:bg-[#FFCC00] hover:text-black transition-all font-bold text-lg px-6 py-3 h-auto rounded-none shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] hover:shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] hover:-translate-y-1"
              >
                <DollarSign className="w-5 h-5 mr-2" />
                Add Funds
              </Button>

              <Button
                onClick={handleCreateCampaign}
                className="bg-[#FF3366] text-white border-[4px] border-black hover:bg-[#FFCC00] hover:text-black transition-all font-bold text-lg px-6 py-3 h-auto rounded-none shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] hover:shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] hover:-translate-y-1"
              >
                <Plus className="w-5 h-5 mr-2" />
                Create Campaign
              </Button>
            </div>

            {/* Main Content Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-10">
              {/* Left Column - Map */}
              <div className="lg:col-span-2">
                <DisplayMap />
              </div>

              {/* Right Column - Campaign Creator */}
              <div className="lg:col-span-1 flex">
                <CampaignCreator />
              </div>
            </div>

            {/* Analytics Section */}
            <section className="mb-10">
              <PerformanceAnalytics />
            </section>

            {/* Transaction History Section */}
            <section className="mb-10">
              <TransactionHistory />
            </section>
          </>
        )}
      </main>
    </div>
  )
}

// Utility function to fetch campaign and booth details
export function useCampaignAndLocationDetails(campaignIds: number[], locationIds: number[]) {
  const { getBoothDetails, getCampaignDetails } = useBoothRegistry();
  const [data, setData] = useState<{ campaigns: any[]; locations: any[] }>({ campaigns: [], locations: [] });
  const [isLoading, setIsLoading] = useState(false);
  
  // Use refs to track previous values and avoid unnecessary fetches
  const prevCampaignIdsRef = useRef<number[]>([]);
  const prevLocationIdsRef = useRef<number[]>([]);
  
  // Store hook functions in refs to stabilize references
  const getBoothDetailsRef = useRef(getBoothDetails);
  const getCampaignDetailsRef = useRef(getCampaignDetails);
  
  // Update refs when functions change
  useEffect(() => {
    getBoothDetailsRef.current = getBoothDetails;
    getCampaignDetailsRef.current = getCampaignDetails;
  }, [getBoothDetails, getCampaignDetails]);

  // Memoize the fetch function to prevent recreating it on each render
  const fetchData = useCallback(async (campaigns: number[], locations: number[]) => {
    if (!campaigns?.length && !locations?.length) return;
    
    setIsLoading(true);
    try {
      // Create arrays of promises using the current functions from refs
      const campaignPromises = campaigns.map(id => getCampaignDetailsRef.current(id));
      const locationPromises = locations.map(id => getBoothDetailsRef.current(id));

      // Execute in parallel
      const [campaignResults, locationResults] = await Promise.all([
        Promise.all(campaignPromises),
        Promise.all(locationPromises)
      ]);

      setData({ 
        campaigns: campaignResults.filter(Boolean) as any[], 
        locations: locationResults.filter(Boolean) as any[] 
      });
    } catch (error) {
      console.error("Failed to fetch details:", error);
    } finally {
      setIsLoading(false);
    }
  }, []); // No dependencies needed

  useEffect(() => {
    // Helper function to check if arrays are equal
    const areArraysEqual = (a: number[], b: number[]) => {
      if (a.length !== b.length) return false;
      return a.every((val, idx) => val === b[idx]);
    };
    
    // Only fetch if the IDs have actually changed
    const campaignIdsChanged = !areArraysEqual(campaignIds || [], prevCampaignIdsRef.current);
    const locationIdsChanged = !areArraysEqual(locationIds || [], prevLocationIdsRef.current);
    
    if (!campaignIdsChanged && !locationIdsChanged) return;
    
    // Update refs with current values
    prevCampaignIdsRef.current = campaignIds || [];
    prevLocationIdsRef.current = locationIds || [];
    
    // Early return if no IDs to fetch
    if (!campaignIds?.length && !locationIds?.length) return;

    fetchData(campaignIds, locationIds);
  }, [campaignIds, locationIds, fetchData]); // Use stable fetchData function

  return { data, isLoading };
}

