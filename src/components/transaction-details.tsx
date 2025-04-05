"use client"

import { useState } from "react"
import { Info, AlertTriangle } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"

export default function TransactionDetails() {
  const [slippageTolerance, setSlippageTolerance] = useState("0.5")
  const [customSlippage, setCustomSlippage] = useState(false)
  const [showWarning, setShowWarning] = useState(false)

  const handleSlippageChange = (value) => {
    setCustomSlippage(false)
    setSlippageTolerance(value)
    setShowWarning(Number.parseFloat(value) > 1)
  }

  const handleCustomSlippageChange = (e) => {
    const value = e.target.value
    if (value === "" || /^\d*\.?\d*$/.test(value)) {
      setSlippageTolerance(value)
      setShowWarning(Number.parseFloat(value) > 1)
    }
  }

  return (
    <section className="mb-8 relative">
      <div className="border-[6px] border-black bg-white p-6 shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] hover:shadow-[12px_12px_0px_0px_rgba(0,0,0,1)] transition-all duration-300 relative max-w-2xl mx-auto transform -rotate-1">
        <h3 className="text-2xl font-black mb-4">Transaction Details</h3>

        <div className="space-y-4">
          {/* Exchange Rate */}
          <div className="flex justify-between items-center border-b-[2px] border-dashed border-black pb-3">
            <div className="font-bold">Exchange Rate</div>
            <div className="font-bold">1 ADC = 0.425 USDC</div>
          </div>

          {/* Price Impact */}
          <div className="flex justify-between items-center border-b-[2px] border-dashed border-black pb-3">
            <div className="font-bold">Price Impact</div>
            <div className="font-bold text-green-500">0.05%</div>
          </div>

          {/* Network Fee */}
          <div className="flex justify-between items-center border-b-[2px] border-dashed border-black pb-3">
            <div className="font-bold">Network Fee</div>
            <div className="font-bold font-mono">0.000042 ETH ($0.12)</div>
          </div>

          {/* Minimum Received */}
          <div className="flex justify-between items-center border-b-[2px] border-dashed border-black pb-3">
            <div className="font-bold">Minimum Received</div>
            <div className="font-bold">234.56 ADC</div>
          </div>

          {/* Route */}
          <div className="flex justify-between items-center border-b-[2px] border-dashed border-black pb-3">
            <div className="font-bold">Route</div>
            <div className="flex items-center gap-2">
              <div className="w-6 h-6 rounded-full bg-[#2775CA] flex items-center justify-center text-white font-bold text-xs border-[2px] border-black">
                USDC
              </div>
              <div className="w-4 h-[2px] bg-black"></div>
              <div className="w-6 h-6 rounded-full bg-[#0055FF] flex items-center justify-center text-white font-bold text-xs border-[2px] border-black">
                ADC
              </div>
              <div className="ml-1 text-sm font-medium">Direct Swap</div>
            </div>
          </div>
        </div>

        {/* Slippage Tolerance */}
        <div className="mt-6">
          <div className="flex items-center gap-2 mb-3">
            <h4 className="font-bold text-lg">Slippage Tolerance</h4>
            <div className="relative group">
              <Info className="w-4 h-4 text-gray-500" />
              <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 w-64 p-2 bg-black text-white text-xs font-medium rounded-none border-[2px] border-white opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none">
                Your transaction will revert if the price changes unfavorably by more than this percentage.
              </div>
            </div>
          </div>

          <div className="flex gap-2 mb-3">
            <Button
              variant={slippageTolerance === "0.1" && !customSlippage ? "default" : "outline"}
              className={`border-[3px] border-black rounded-none font-bold ${
                slippageTolerance === "0.1" && !customSlippage
                  ? "bg-[#0055FF] text-white"
                  : "bg-white hover:bg-[#f5f5f5]"
              }`}
              onClick={() => handleSlippageChange("0.1")}
            >
              0.1%
            </Button>
            <Button
              variant={slippageTolerance === "0.5" && !customSlippage ? "default" : "outline"}
              className={`border-[3px] border-black rounded-none font-bold ${
                slippageTolerance === "0.5" && !customSlippage
                  ? "bg-[#0055FF] text-white"
                  : "bg-white hover:bg-[#f5f5f5]"
              }`}
              onClick={() => handleSlippageChange("0.5")}
            >
              0.5%
            </Button>
            <Button
              variant={slippageTolerance === "1.0" && !customSlippage ? "default" : "outline"}
              className={`border-[3px] border-black rounded-none font-bold ${
                slippageTolerance === "1.0" && !customSlippage
                  ? "bg-[#0055FF] text-white"
                  : "bg-white hover:bg-[#f5f5f5]"
              }`}
              onClick={() => handleSlippageChange("1.0")}
            >
              1.0%
            </Button>
            <div className="relative flex-grow">
              <Input
                type="text"
                placeholder="Custom"
                value={customSlippage ? slippageTolerance : ""}
                onChange={(e) => {
                  setCustomSlippage(true)
                  handleCustomSlippageChange(e)
                }}
                className="border-[3px] border-black rounded-none h-full font-bold focus:border-[#0055FF] focus:ring-0 pr-8"
              />
              <div className="absolute right-3 top-1/2 -translate-y-1/2 font-bold">%</div>
            </div>
          </div>

          {showWarning && (
            <div className="flex items-center gap-2 p-3 border-[3px] border-[#FFCC00] bg-[#FFCC00]/20 animate-pulse">
              <AlertTriangle className="w-5 h-5 text-[#FF3366]" />
              <span className="font-bold text-sm">High slippage increases the risk of front-running</span>
            </div>
          )}
        </div>
      </div>
    </section>
  )
}

