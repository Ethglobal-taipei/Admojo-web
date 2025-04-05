"use client"

import { useState } from "react"
import { TrendingUp, TrendingDown, Wallet, RefreshCw } from "lucide-react"
import { Button } from "@/components/ui/button"
import { toast } from "sonner"


export default function SwapHeader() {
  const [isRefreshing, setIsRefreshing] = useState(false)
  const [marketRate, setMarketRate] = useState(2.35)
  const [marketChange, setMarketChange] = useState(5.2)

  const handleRefresh = () => {
    setIsRefreshing(true)
    setTimeout(() => {
      setIsRefreshing(false)
      setMarketRate(2.35 + (Math.random() * 0.1 - 0.05))
      setMarketChange(5.2 + (Math.random() * 2 - 1))
      toast({
        title: "Market Rate Updated",
        description: "Latest exchange rates have been fetched.",
      })
    }, 1500)
  }

  return (
    <section className="mb-10 relative">
      <div className="absolute inset-0 -z-10 bg-checkered-light"></div>

      <div className="border-[6px] border-black bg-white p-6 shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] hover:shadow-[12px_12px_0px_0px_rgba(0,0,0,1)] transition-all duration-300 relative">
        {/* Decorative elements */}
        <div className="absolute -top-6 -right-6 w-20 h-20 bg-[#FFCC00] border-[4px] border-black rotate-12 flex items-center justify-center transform hover:rotate-0 transition-all duration-300">
          <Wallet className="w-10 h-10 text-black" />
        </div>
        <div className="absolute -bottom-4 -left-4 w-12 h-12 bg-[#FF3366] border-[3px] border-black -rotate-12 hidden md:block"></div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div>
            <h2 className="text-3xl font-black mb-2">SWAP TOKENS</h2>
            <p className="font-bold mb-4">Exchange USDC for ADC tokens and vice versa</p>
            <div className="flex items-center gap-2 mb-4">
              <div className="px-3 py-1 bg-[#0055FF] text-white font-bold border-[3px] border-black relative overflow-hidden">
                <span className="relative z-10">LIVE RATES</span>
                <span className="absolute inset-0 bg-[#0055FF] opacity-50 animate-pulse"></span>
              </div>
              <Button
                variant="outline"
                size="sm"
                className={`border-[3px] border-black rounded-none bg-white hover:bg-[#0055FF] hover:text-white transition-all ${isRefreshing ? "animate-spin" : ""}`}
                onClick={handleRefresh}
              >
                <RefreshCw className="w-4 h-4" />
              </Button>
            </div>
          </div>

          <div className="flex flex-col justify-between">
            <div className="mb-4">
              <div className="flex items-center justify-between mb-1">
                <span className="font-bold text-lg">Current Rate</span>
              </div>
              <div className="border-[4px] border-black p-3 bg-white flex items-center justify-between hover:translate-y-[-2px] hover:shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] transition-all">
                <span className="text-3xl font-black">1 USDC = {marketRate.toFixed(3)}</span>
                <span className="font-bold text-lg">ADC</span>
              </div>
            </div>
            <div>
              <div className="font-bold text-lg mb-1">24h Change</div>
              <div className="border-[4px] border-black p-3 bg-white flex items-center justify-between hover:translate-y-[-2px] hover:shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] transition-all">
                <div className="flex items-center gap-2">
                  {marketChange >= 0 ? (
                    <TrendingUp className="w-6 h-6 text-green-500" />
                  ) : (
                    <TrendingDown className="w-6 h-6 text-red-500" />
                  )}
                  <span className="text-3xl font-black">{Math.abs(marketChange).toFixed(2)}%</span>
                </div>
                <span className={`font-bold text-lg ${marketChange >= 0 ? "text-green-500" : "text-red-500"}`}>
                  {marketChange >= 0 ? "UP" : "DOWN"}
                </span>
              </div>
            </div>
          </div>

          <div className="flex flex-col">
            <div className="border-[4px] border-black p-3 bg-[#f5f5f5] mb-4 flex-1">
              <div className="flex items-center justify-between mb-2">
                <span className="font-bold">24h Price Movement</span>
                <div className="flex items-center gap-1 bg-[#0055FF] text-white px-2 py-1 font-bold text-sm">
                  <span>VOLUME: 1.2M</span>
                </div>
              </div>
              <div className="h-24 relative">
                {/* Raw graph visualization */}
                <div className="absolute inset-0 flex items-end">
                  {[40, 45, 35, 50, 55, 45, 60, 65, 55, 70, 75, 80].map((height, index) => (
                    <div key={index} className="flex-1 mx-[1px]" style={{ height: `${height}%` }}>
                      <div
                        className={`w-full h-full ${index < 6 ? "bg-[#FF3366]" : "bg-[#0055FF]"} border-r-[1px] border-black`}
                      ></div>
                    </div>
                  ))}
                </div>
                <div className="absolute bottom-0 left-0 w-full h-[1px] bg-black"></div>
                <div className="absolute top-0 left-0 h-full w-[1px] bg-black"></div>

                {/* Divider between past and current */}
                <div className="absolute top-0 bottom-0 left-1/2 w-[2px] bg-black border-dashed"></div>
              </div>
              <div className="flex justify-between mt-1 text-xs font-medium">
                <div>00:00</div>
                <div>12:00</div>
                <div>NOW</div>
              </div>
            </div>
            <div className="border-[4px] border-black p-3 bg-white flex items-center justify-between">
              <div>
                <div className="font-bold">Wallet Balance</div>
                <div className="flex gap-4">
                  <div className="font-bold">5,280.42 USDC</div>
                  <div className="font-bold">12,450.00 ADC</div>
                </div>
              </div>
              <div className="px-3 py-1 bg-green-500 text-white font-bold text-sm border-[2px] border-black">
                CONNECTED
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}

