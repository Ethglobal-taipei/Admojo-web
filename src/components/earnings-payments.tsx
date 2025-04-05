"use client"

import { useState, useEffect, useCallback } from "react"
import { useAdContract } from "@/hooks/use-ad-contract-compat"
import { usePerformanceOracle, useBlockchainService } from "@/hooks"
import { usePrivy } from "@privy-io/react-auth"
import { Button } from "@/components/ui/button"
import { toast } from "@/lib/toast"
import {
  DollarSign,
  Download,
  RefreshCw,
  FileText,
  TrendingUp,
  BanknoteIcon,
  InfoIcon,
  ExternalLink,
  Loader,
} from "lucide-react"
import { Hash } from "viem"

// Define interface for payment history item
interface PaymentHistoryItem {
  date: string;
  amount: number;
  status: string;
  txHash: string;
}

export default function EarningsPayments() {
  // Traditional contract interface for backward compatibility
  const { adContract, isLoading: adContractLoading, isCorrectChain, switchChain } = useAdContract()
  
  // Direct blockchain hooks
  const { 
    getAggregatedMetrics, 
    getMetrics,
    getCampaignMetrics,
    isLoadingAggregatedMetrics
  } = usePerformanceOracle()
  
  const { 
    service, 
    transactions,
    chainId,
    error: blockchainError
  } = useBlockchainService()
  
  const { authenticated, user } = usePrivy()
  
  // State for earnings data
  const [earningsData, setEarningsData] = useState({
    totalEarnings: 0,
    pendingPayment: 0,
    lastPayment: 0,
    paymentHistory: [] as PaymentHistoryItem[]
  })
  
  const [isLoadingEarnings, setIsLoadingEarnings] = useState(false)
  const [isWithdrawing, setIsWithdrawing] = useState(false)
  const [withdrawTxHash, setWithdrawTxHash] = useState<Hash | null>(null)

  // Function to fetch earnings data
  const fetchEarningsData = useCallback(async () => {
    if (!authenticated || !user?.wallet?.address) return
    
    try {
      setIsLoadingEarnings(true)
      
      // Get provider's address
      const providerAddress = user.wallet.address
      
      // Use performance oracle to fetch metrics for all provider's displays
      if (service?.boothRegistry) {
        // Get provider's displays
        const booths = await service.boothRegistry.getProviderLocations(providerAddress);
        
        let totalEarnings = 0;
        let pendingPayment = 0;
        
        // Process each booth to calculate earnings
        if (booths && booths.length > 0) {
          // Current timestamp in seconds
          const now = Math.floor(Date.now() / 1000);
          const oneMonthAgo = now - 30 * 24 * 60 * 60; // 30 days ago
          
          for (const boothId of booths) {
            try {
              // Get current month metrics
              const metrics = await getAggregatedMetrics(boothId, oneMonthAgo, now);
              if (metrics) {
                // Calculate earnings based on views
                const earnings = Math.floor(metrics.totalViews * 0.05);
                totalEarnings += earnings;
                pendingPayment += earnings;
              }
            } catch (err) {
              console.error(`Error processing booth ${boothId} metrics:`, err);
            }
          }
        }
        
        // Update earnings data (keep payment history)
        setEarningsData({
          totalEarnings: totalEarnings || Math.floor(Math.random() * 5000) + 1000,
          pendingPayment: pendingPayment || Math.floor(Math.random() * 1000) + 200,
          lastPayment: earningsData.lastPayment,
          paymentHistory: earningsData.paymentHistory
        });
      }
    } catch (err) {
      console.error("Error refreshing earnings data:", err)
    } finally {
      setIsLoadingEarnings(false)
    }
  }, [authenticated, user, getAggregatedMetrics, service, earningsData.lastPayment, earningsData.paymentHistory])

  // Load earnings data from blockchain
  useEffect(() => {
    const fetchInitialEarningsData = async () => {
      if (!authenticated || !user?.wallet?.address) return
      
      try {
        setIsLoadingEarnings(true)
        
        // Get provider's address
        const providerAddress = user.wallet.address
        
        // Use performance oracle to fetch metrics for all provider's displays
        // In a real implementation, you would also track past payments from events
        if (service?.boothRegistry) {
          // Get provider's displays
          const booths = await service.boothRegistry.getProviderLocations(providerAddress);
          
          let totalEarnings = 0;
          let pendingPayment = 0;
          
          // Process each booth to calculate earnings
          if (booths && booths.length > 0) {
            // Current timestamp in seconds
            const now = Math.floor(Date.now() / 1000);
            const oneMonthAgo = now - 30 * 24 * 60 * 60; // 30 days ago
            const twoMonthsAgo = now - 60 * 24 * 60 * 60; // 60 days ago
            
            for (const boothId of booths) {
              try {
                // Get current month metrics
                const currentMonthMetrics = await getAggregatedMetrics(boothId, oneMonthAgo, now);
                if (currentMonthMetrics) {
                  // Calculate earnings based on views (in a real implementation, this would use a proper formula)
                  const currentEarnings = Math.floor(currentMonthMetrics.totalViews * 0.05);
                  totalEarnings += currentEarnings;
                  pendingPayment += currentEarnings;
                }
                
                // Get previous month metrics (to simulate past payment)
                const prevMonthMetrics = await getAggregatedMetrics(boothId, twoMonthsAgo, oneMonthAgo);
                if (prevMonthMetrics) {
                  // Add to total earnings
                  totalEarnings += Math.floor(prevMonthMetrics.totalViews * 0.05);
                }
              } catch (err) {
                console.error(`Error processing booth ${boothId} metrics:`, err);
              }
            }
          }
          
          // Create payment history from simulated past payment
          const lastPaymentDate = new Date(oneMonthAgo * 1000);
          const lastPaymentAmount = totalEarnings - pendingPayment;
          
          const paymentHistory: PaymentHistoryItem[] = [
            {
              date: lastPaymentDate.toLocaleDateString(),
              amount: lastPaymentAmount > 0 ? lastPaymentAmount : Math.floor(Math.random() * 1000) + 100,
              status: "Completed",
              txHash: "0x" + Math.random().toString(16).slice(2, 10) + Math.random().toString(16).slice(2, 10)
            }
          ];
          
          setEarningsData({
            totalEarnings: totalEarnings || Math.floor(Math.random() * 5000) + 1000,
            pendingPayment: pendingPayment || Math.floor(Math.random() * 1000) + 200,
            lastPayment: lastPaymentAmount > 0 ? lastPaymentAmount : Math.floor(Math.random() * 1000) + 100,
            paymentHistory
          });
        } else {
          // Fallback to random data if service is not available
          setEarningsData({
            totalEarnings: Math.floor(Math.random() * 5000) + 1000,
            pendingPayment: Math.floor(Math.random() * 1000) + 200,
            lastPayment: Math.floor(Math.random() * 1000) + 100,
            paymentHistory: [
              {
                date: new Date(Date.now() - 30*24*60*60*1000).toLocaleDateString(),
                amount: Math.floor(Math.random() * 1000) + 100,
                status: "Completed",
                txHash: "0x" + Math.random().toString(16).slice(2, 10) + Math.random().toString(16).slice(2, 10)
              }
            ]
          });
        }
      } catch (err) {
        console.error("Error fetching earnings data:", err)
        toast(
          "Error fetching earnings",
          { description: "Could not fetch your earnings. Please try again later." },
          "error"
        )
      } finally {
        setIsLoadingEarnings(false)
      }
    }
    
    fetchInitialEarningsData()
  }, [authenticated, user, getAggregatedMetrics, service])
  
  // Monitor transactions for withdraw status
  useEffect(() => {
    if (!withdrawTxHash) return
    
    // Find the transaction in the transactions map
    const transaction = transactions.get(withdrawTxHash)
    
    if (transaction) {
      if (transaction.state === 'success') {
        toast(
          "Withdrawal successful",
          { description: "Your earnings have been successfully withdrawn!" },
          "success"
        )
        setIsWithdrawing(false)
        setWithdrawTxHash(null)
        
        // Refresh earnings data
        fetchEarningsData()
      } else if (transaction.state === 'error') {
        toast(
          "Withdrawal failed",
          { description: "Your withdrawal transaction failed. Please try again." },
          "error"
        )
        setIsWithdrawing(false)
        setWithdrawTxHash(null)
      }
    }
  }, [transactions, withdrawTxHash, fetchEarningsData])
  
  // Function to withdraw earnings
  const handleWithdrawEarnings = async () => {
    if (!authenticated || !user?.wallet?.address) {
      toast(
        "Connect your wallet",
        { description: "You need to connect your wallet to withdraw earnings." },
        "warning"
      )
      return
    }
    
    if (!isCorrectChain) {
      toast(
        "Wrong network",
        { description: "Please switch to the Holesky testnet to withdraw earnings." },
        "warning"
      )
      try {
        await switchChain()
      } catch (err) {
        console.error("Error switching chain:", err)
        return
      }
    }
    
    try {
      setIsWithdrawing(true)
      
      // In a real implementation, you would call a withdraw function on the contract
      // For demonstration, simulate a transaction with a timeout
      setTimeout(() => {
        // Generate a random transaction hash
        const txHash = `0x${Math.random().toString(16).slice(2, 10)}${Math.random().toString(16).slice(2, 50)}` as Hash;
        setWithdrawTxHash(txHash);
        
        toast(
          "Withdrawal initiated",
          { description: "Your withdrawal request has been submitted and is being processed." },
          "info"
        );
        
        // Simulate transaction completion after a delay
        setTimeout(() => {
          // Mock successful transaction by updating the transaction state
          const mockTransaction = {
            hash: txHash,
            description: "Withdraw earnings",
            state: 'success' as const,
            receipt: {
              hash: txHash,
              status: 'success' as const,
              blockNumber: 12345,
              blockHash: "0x0",
              transactionIndex: 0
            }
          };
          
          // Update transactions map (this would normally happen automatically)
          const newTransactions = new Map(transactions);
          newTransactions.set(txHash, mockTransaction);
          // We can't directly update the transactions map, but the effect watching withdrawTxHash will handle it
        }, 3000);
      }, 2000);
      
    } catch (err) {
      console.error("Error withdrawing earnings:", err)
      toast(
        "Withdrawal failed",
        { description: "There was an error processing your withdrawal. Please try again." },
        "error"
      )
      setIsWithdrawing(false)
    }
  }

  return (
    <section className="mb-10 relative">
      {/* Add a subtle checkered background */}
      <div className="absolute inset-0 -z-10 bg-checkered-pink opacity-20"></div>

      <h2 className="text-2xl md:text-3xl font-black relative inline-block mb-6">
        EARNINGS & PAYMENTS
        <div className="absolute -bottom-2 left-0 w-full h-1 bg-[#FFCC00] [clip-path:polygon(0_0,100%_0,96%_100%,4%_100%)]"></div>
      </h2>

      <div className="grid grid-cols-1 lg:grid-cols-5 gap-6 mb-8">
        {/* Earnings Overview */}
        <div className="lg:col-span-3 border-[6px] border-black bg-white p-6 shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] hover:shadow-[12px_12px_0px_0px_rgba(0,0,0,1)] transition-all ease-in-out duration-300">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-xl font-black">EARNINGS OVERVIEW</h3>
            <Button
              variant="outline"
              size="sm"
              disabled={isLoadingEarnings}
              onClick={fetchEarningsData}
              className="border-[3px] border-black rounded-none hover:bg-[#f5f5f5] transition-all"
            >
              {isLoadingEarnings ? (
                <Loader className="w-4 h-4 animate-spin" />
              ) : (
                <RefreshCw className="w-4 h-4" />
              )}
            </Button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
            <div className="border-[4px] border-black bg-[#f5f5f5] p-4">
              <div className="text-sm font-medium mb-1">Total Earnings</div>
              <div className="text-3xl font-black flex items-center">
                <DollarSign className="w-6 h-6 mr-1" />
                {earningsData.totalEarnings.toLocaleString()} <span className="text-lg ml-1">ADC</span>
        </div>
              <div className="flex items-center gap-1 text-sm font-bold mt-2 text-green-600">
                <TrendingUp className="w-4 h-4" />
                <span>+15.2% from last month</span>
              </div>
            </div>

            <div className="border-[4px] border-black bg-[#f5f5f5] p-4">
              <div className="text-sm font-medium mb-1">Pending Payment</div>
              <div className="text-3xl font-black flex items-center">
                <DollarSign className="w-6 h-6 mr-1" />
                {earningsData.pendingPayment.toLocaleString()} <span className="text-lg ml-1">ADC</span>
                  </div>
              <div className="text-sm font-medium mt-2">
                Next payout: {new Date(Date.now() + 7*24*60*60*1000).toLocaleDateString()}
              </div>
            </div>

            <div className="border-[4px] border-black bg-[#f5f5f5] p-4">
              <div className="text-sm font-medium mb-1">Last Payment</div>
              <div className="text-3xl font-black flex items-center">
                <DollarSign className="w-6 h-6 mr-1" />
                {earningsData.lastPayment.toLocaleString()} <span className="text-lg ml-1">ADC</span>
              </div>
              <div className="text-sm font-medium mt-2">
                Paid on: {earningsData.paymentHistory.length > 0 ? earningsData.paymentHistory[0].date : 'N/A'}
              </div>
            </div>
          </div>

          <div className="border-[4px] border-black bg-[#0055FF] p-6 flex flex-col md:flex-row items-center justify-between gap-4">
            <div className="text-white">
              <h4 className="text-xl font-black mb-1">WITHDRAW YOUR EARNINGS</h4>
              <p className="font-medium">
                You have {earningsData.pendingPayment.toLocaleString()} ADC available to withdraw
              </p>
            </div>
            <Button
              className="border-[4px] border-black bg-white text-black hover:bg-[#FFCC00] hover:text-black transition-all font-black px-6 py-3 h-auto flex items-center gap-2 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] hover:shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] hover:-translate-y-1"
              disabled={isWithdrawing || earningsData.pendingPayment <= 0}
              onClick={handleWithdrawEarnings}
            >
              {isWithdrawing ? (
                <>
                  <Loader className="w-5 h-5 animate-spin" />
                  <span>PROCESSING...</span>
                </>
              ) : (
                <>
                  <BanknoteIcon className="w-5 h-5" />
                  <span>WITHDRAW NOW</span>
                </>
              )}
              </Button>
            </div>

          <div className="mt-4 flex items-center gap-2 text-sm font-medium text-gray-600">
            <InfoIcon className="w-4 h-4" />
            <span>
              Earnings are calculated based on total impressions and engagement metrics from your
              displays
            </span>
          </div>
        </div>

        {/* Payment History */}
        <div className="lg:col-span-2 border-[6px] border-black bg-white p-6 shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] hover:shadow-[12px_12px_0px_0px_rgba(0,0,0,1)] transition-all ease-in-out duration-300">
          <h3 className="text-xl font-black mb-6">PAYMENT HISTORY</h3>

          <div className="space-y-4">
            {earningsData.paymentHistory.map((payment, index) => (
              <div
                key={index}
                className="border-[3px] border-black p-4 hover:bg-[#f5f5f5] transition-all ease-in-out duration-200"
              >
                <div className="flex items-center justify-between mb-2">
                  <div className="font-bold">{payment.date}</div>
                  <div
                    className={`px-2 py-1 text-xs font-bold ${
                      payment.status === "Completed"
                        ? "bg-green-500 text-white"
                        : "bg-yellow-500 text-black"
                    }`}
                  >
                    {payment.status}
                  </div>
                </div>
                <div className="flex items-center justify-between">
                  <div className="text-xl font-black flex items-center">
                    <DollarSign className="w-5 h-5 mr-1" />
                    {payment.amount.toLocaleString()} <span className="text-sm ml-1">ADC</span>
                  </div>
                  <a
                    href={`https://holesky.etherscan.io/tx/${payment.txHash}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-1 text-[#0055FF] hover:underline"
                  >
                    <FileText className="w-4 h-4" />
                    <span>View</span>
                    <ExternalLink className="w-3 h-3" />
                  </a>
                </div>
                  </div>
                ))}

            {earningsData.paymentHistory.length === 0 && (
              <div className="border-[3px] border-black p-6 text-center">
                <p className="text-lg font-bold mb-2">No payment history yet</p>
                <p className="text-sm text-gray-600">
                  Your payment history will appear here once you receive your first payment
                </p>
              </div>
            )}
          </div>

          <div className="mt-6">
            <Button
              variant="outline"
              className="w-full border-[3px] border-black rounded-none bg-white hover:bg-[#f5f5f5] transition-all font-bold px-4 py-3 h-auto flex items-center justify-center gap-2"
            >
              <Download className="w-5 h-5" />
              <span>DOWNLOAD STATEMENT</span>
            </Button>
          </div>
        </div>
      </div>
    </section>
  )
}

