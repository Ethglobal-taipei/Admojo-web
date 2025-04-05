import { Wallet, Bell, Menu } from "lucide-react"
import { Button } from "@/components/ui/button"
import SwapHeader from "@/components/swap-header"
import SwapInterface from "@/components/swap-interface"
import TransactionDetails from "@/components/transaction-details"
import LiquidityInformation from "@/components/liquidity-information"
import TransactionHistory from "@/components/transaction-history"

export default function SwapPage() {
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
        <SwapHeader />
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2">
            <SwapInterface />
            <TransactionDetails />
            <TransactionHistory />
          </div>
          <div className="lg:col-span-1">
            <LiquidityInformation />
          </div>
        </div>
      </main>
    </div>
  )
}

