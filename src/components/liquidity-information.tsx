"use client"

import { useState } from "react"
import { TrendingUp, Plus, Minus } from "lucide-react"
import { Button } from "@/components/ui/button"

export default function LiquidityInformation() {
  const [activeTab, setActiveTab] = useState("pool")

  return (
    <section className="mb-8 relative">
      <div className="border-[6px] border-black bg-white shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] hover:shadow-[12px_12px_0px_0px_rgba(0,0,0,1)] transition-all duration-300 relative transform rotate-1">
        {/* Decorative elements */}
        <div className="absolute -top-6 -right-6 w-16 h-16 bg-[#FF3366] border-[4px] border-black rotate-12 hidden md:block"></div>

        {/* Tabs */}
        <div className="flex border-b-[4px] border-black">
          <button
            className={`px-6 py-3 font-bold text-lg ${
              activeTab === "pool" ? "bg-[#0055FF] text-white" : "bg-white hover:bg-[#f5f5f5]"
            } transition-colors flex-1 border-r-[4px] border-black`}
            onClick={() => setActiveTab("pool")}
          >
            Pool Info
          </button>
          <button
            className={`px-6 py-3 font-bold text-lg ${
              activeTab === "rewards" ? "bg-[#0055FF] text-white" : "bg-white hover:bg-[#f5f5f5]"
            } transition-colors flex-1`}
            onClick={() => setActiveTab("rewards")}
          >
            Rewards
          </button>
        </div>

        {activeTab === "pool" && (
          <div className="p-6">
            <h3 className="text-2xl font-black mb-4">Liquidity Pool</h3>

            <div className="border-[4px] border-black p-4 bg-[#f5f5f5] mb-6">
              <div className="flex justify-between items-center mb-3">
                <div className="font-bold text-lg">Total Value Locked</div>
                <div className="flex items-center gap-1 bg-[#0055FF] text-white px-2 py-1 font-bold text-sm">
                  <TrendingUp className="w-4 h-4" />
                  <span>+15.3%</span>
                </div>
              </div>
              <div className="text-4xl font-black mb-2">$8,450,320</div>

              {/* Token ratio visualization */}
              <div className="h-8 flex mb-3 border-[3px] border-black">
                <div
                  className="h-full bg-[#2775CA] border-r-[2px] border-black flex items-center justify-center text-white font-bold"
                  style={{ width: "42.5%" }}
                >
                  42.5%
                </div>
                <div
                  className="h-full bg-[#0055FF] flex items-center justify-center text-white font-bold"
                  style={{ width: "57.5%" }}
                >
                  57.5%
                </div>
              </div>

              <div className="flex justify-between">
                <div className="flex items-center gap-2">
                  <div className="w-4 h-4 bg-[#2775CA] border-[2px] border-black"></div>
                  <span className="font-medium">3.6M USDC</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-4 h-4 bg-[#0055FF] border-[2px] border-black"></div>
                  <span className="font-medium">8.5M ADC</span>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4 mb-6">
              <div className="border-[4px] border-black p-3 bg-[#f5f5f5]">
                <div className="text-sm font-medium mb-1">APY</div>
                <div className="text-2xl font-black text-[#0055FF]">24.8%</div>
              </div>
              <div className="border-[4px] border-black p-3 bg-[#f5f5f5]">
                <div className="text-sm font-medium mb-1">24h Volume</div>
                <div className="text-2xl font-black">$1.2M</div>
              </div>
              <div className="border-[4px] border-black p-3 bg-[#f5f5f5]">
                <div className="text-sm font-medium mb-1">Fees (24h)</div>
                <div className="text-2xl font-black">$3,600</div>
              </div>
              <div className="border-[4px] border-black p-3 bg-[#f5f5f5]">
                <div className="text-sm font-medium mb-1">LP Providers</div>
                <div className="text-2xl font-black">1,245</div>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <Button className="bg-[#0055FF] text-white border-[4px] border-black hover:bg-[#FFCC00] hover:text-black transition-all font-bold text-lg py-3 h-auto rounded-none shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] hover:shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] hover:-translate-y-1 relative overflow-hidden group">
                <span className="relative z-10 flex items-center gap-1">
                  <Plus className="w-5 h-5" />
                  Add Liquidity
                </span>
                <span className="absolute inset-0 bg-[#FFCC00] transform scale-x-0 group-hover:scale-x-100 transition-transform duration-300 origin-left"></span>
              </Button>
              <Button className="bg-white text-black border-[4px] border-black hover:bg-[#FF3366] hover:text-white transition-all font-bold text-lg py-3 h-auto rounded-none shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] hover:shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] hover:-translate-y-1 relative overflow-hidden group">
                <span className="relative z-10 flex items-center gap-1">
                  <Minus className="w-5 h-5" />
                  Remove
                </span>
                <span className="absolute inset-0 bg-[#FF3366] transform scale-x-0 group-hover:scale-x-100 transition-transform duration-300 origin-left"></span>
              </Button>
            </div>
          </div>
        )}

        {activeTab === "rewards" && (
          <div className="p-6">
            <h3 className="text-2xl font-black mb-4">Liquidity Rewards</h3>

            <div className="border-[4px] border-black p-4 bg-[#FFCC00] mb-6">
              <div className="flex justify-between items-center mb-3">
                <div className="font-bold text-lg">Your LP Tokens</div>
                <div className="px-2 py-1 bg-black text-white font-bold text-sm">0.05% of Pool</div>
              </div>
              <div className="text-4xl font-black mb-2">4,250 LP-ADC</div>
              <div className="font-bold">≈ $4,250 (1 LP-ADC = $1.00)</div>
            </div>

            <div className="border-[4px] border-black p-4 bg-[#f5f5f5] mb-6">
              <div className="flex justify-between items-center mb-3">
                <div className="font-bold text-lg">Your Deposits</div>
              </div>
              <div className="space-y-3">
                <div className="flex justify-between items-center border-b-[2px] border-dashed border-black pb-2">
                  <div className="flex items-center gap-2">
                    <div className="w-6 h-6 rounded-full bg-[#2775CA] flex items-center justify-center text-white font-bold text-xs border-[2px] border-black">
                      USDC
                    </div>
                    <span className="font-bold">USDC</span>
                  </div>
                  <div className="font-bold">1,800.00</div>
                </div>
                <div className="flex justify-between items-center border-b-[2px] border-dashed border-black pb-2">
                  <div className="flex items-center gap-2">
                    <div className="w-6 h-6 rounded-full bg-[#0055FF] flex items-center justify-center text-white font-bold text-xs border-[2px] border-black">
                      ADC
                    </div>
                    <span className="font-bold">ADC</span>
                  </div>
                  <div className="font-bold">4,230.00</div>
                </div>
              </div>
            </div>

            <div className="border-[4px] border-black p-4 bg-[#0055FF] text-white mb-6">
              <div className="flex justify-between items-center mb-3">
                <div className="font-bold text-lg">Unclaimed Rewards</div>
                <div className="px-2 py-1 bg-black text-white font-bold text-sm">Last 30 Days</div>
              </div>
              <div className="text-4xl font-black mb-2">125.8 ADC</div>
              <div className="font-bold">≈ $53.53 USD</div>
              <Button className="w-full mt-3 bg-white text-black border-[3px] border-black hover:bg-[#FFCC00] transition-all font-bold py-2 h-auto rounded-none">
                Claim Rewards
              </Button>
            </div>

            <div className="border-[4px] border-black p-4 bg-[#f5f5f5]">
              <div className="flex justify-between items-center mb-3">
                <div className="font-bold text-lg">Reward History</div>
              </div>
              <div className="space-y-3">
                {[
                  { date: "Jun 15, 2023", amount: "42.5 ADC" },
                  { date: "May 15, 2023", amount: "38.2 ADC" },
                  { date: "Apr 15, 2023", amount: "45.1 ADC" },
                ].map((reward, index) => (
                  <div
                    key={index}
                    className="flex justify-between items-center border-b-[2px] border-dashed border-black pb-2"
                  >
                    <div className="font-medium">{reward.date}</div>
                    <div className="font-bold">{reward.amount}</div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>
    </section>
  )
}

