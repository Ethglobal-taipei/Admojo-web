"use client"

import { useState, useEffect } from "react"
import { useUserStore } from "@/lib/store"
import { Button } from "@/components/ui/button"
import { Wallet } from "lucide-react"
import { getUserTokenBalance } from "@/lib/services/tokenomics.service"

export default function DashboardHeader() {
  const { user, isConnected } = useUserStore()
  const [adcBalance, setAdcBalance] = useState<number | null>(null)
  const [isLoadingBalance, setIsLoadingBalance] = useState(false)

  // Fetch ADC balance from Metal API
  useEffect(() => {
    async function fetchADCBalance() {
      if (isConnected && user?.walletAddress) {
        setIsLoadingBalance(true)
        try {
          const tokenBalance = await getUserTokenBalance(user.walletAddress)
          if (tokenBalance) {
            setAdcBalance(tokenBalance.balance)
          } else {
            // If balance couldn't be fetched, show zero
            console.log("No balance data returned, defaulting to 0")
            setAdcBalance(0)
          }
        } catch (error) {
          console.error("Error fetching token balance:", error)
          // On error, show a fallback value of 0
          setAdcBalance(0)
        } finally {
          setIsLoadingBalance(false)
        }
      }
    }

    fetchADCBalance()
  }, [isConnected, user?.walletAddress])

  // If not connected, show connect prompt
  if (!isConnected || !user) {
    return (
      <div className="border-[6px] border-black bg-white p-6 relative">
        <div className="text-center py-8">
          <h2 className="text-3xl font-black mb-4">Connect Your Wallet</h2>
          <p className="text-lg mb-6">Connect your wallet to view your dashboard and manage your campaigns</p>
          <Button className="inline-flex items-center gap-2 bg-[#0055FF] text-white border-[4px] border-black hover:bg-[#FFCC00] hover:text-black transition-all font-bold text-lg px-8 py-4 h-auto rounded-none shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] hover:shadow-[6px_6px_0px_0px_rgba(0,0,0,1)]">
            <Wallet className="w-5 h-5" />
            Connect Wallet
          </Button>
        </div>
      </div>
    )
  }

  // Add My Campaigns to the navigation links
  const links = [
    { name: "Dashboard", href: "/dashboard" },
    { name: "My Campaigns", href: "/campaigns" },
    { name: "Analytics", href: "#analytics" },
    { name: "Settings", href: "#settings" },
  ]

  return (
    <div className="border-[6px] border-black bg-white p-6 relative">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* User Profile */}
        <div className="flex items-center gap-4">
          <div className="w-16 h-16 rounded-full border-[4px] border-black overflow-hidden">
            <img 
              src={user?.avatar || "/placeholder.svg"} 
              alt={user?.name || "User"} 
              className="w-full h-full object-cover" 
            />
          </div>
          <div>
            <h2 className="text-2xl font-black">{user?.name || "Anonymous User"}</h2>
            <p className="text-sm font-medium">
              <span className="inline-block px-2 py-1 bg-[#0055FF] text-white text-xs font-bold mr-2">{user?.tier || "Standard"}</span>
              Member since {user?.memberSince || "Today"}
            </p>
          </div>
        </div>

        {/* Wallet Balance */}
        <div className="flex flex-col justify-center">
          <div className="text-sm font-medium mb-1">Wallet Balance</div>
          <div className="flex items-baseline">
            <div className="text-2xl font-black">
              {isLoadingBalance ? (
                "Loading..."
              ) : (
                `${adcBalance !== null ? adcBalance.toLocaleString() : "0"} ADC`
              )}
            </div>
          </div>
        </div>

        {/* Quick Actions */}
        <div className="flex items-center justify-end gap-4">
          <Button className="bg-white text-black border-[4px] border-black hover:bg-[#FFCC00] transition-all font-bold rounded-none">
            Add Funds
          </Button>
          <Button className="bg-[#0055FF] text-white border-[4px] border-black hover:bg-[#FFCC00] hover:text-black transition-all font-bold rounded-none">
            Create Campaign
          </Button>
        </div>
      </div>
    </div>
  )
}

