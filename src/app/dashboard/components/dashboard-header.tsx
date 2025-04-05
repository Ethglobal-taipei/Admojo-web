"use client"

import { useUserStore } from "@/lib/store"
import { Button } from "@/components/ui/button"
import { Wallet } from "lucide-react"

export default function DashboardHeader() {
  const { user, stats, balances, isConnected } = useUserStore()

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
          <div className="flex items-baseline gap-4">
            <div className="text-2xl font-black">${balances ? balances.USDC.toLocaleString() : "0.00"}</div>
            <div className="text-lg font-bold text-gray-500">{balances ? balances.ADC.toLocaleString() : "0"} ADC</div>
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

