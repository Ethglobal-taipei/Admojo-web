"use client"

import { useState, useEffect } from "react"
import { ArrowDown, RefreshCw, Settings } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { toast } from "sonner"

export default function SwapInterface() {
  const [fromAmount, setFromAmount] = useState("")
  const [toAmount, setToAmount] = useState("")
  const [fromToken, setFromToken] = useState("USDC")
  const [toToken, setToToken] = useState("ADC")
  const [isSwapping, setIsSwapping] = useState(false)
  const [isCalculating, setIsCalculating] = useState(false)
  const [swapRotation, setSwapRotation] = useState(0)

  // Mock balances
  const balances = {
    USDC: 5280.42,
    ADC: 12450.0,
  }

  // Mock exchange rate
  const exchangeRate = 2.35

  useEffect(() => {
    if (fromAmount && fromAmount !== "0") {
      setIsCalculating(true)
      const timer = setTimeout(() => {
        if (fromToken === "USDC" && toToken === "ADC") {
          setToAmount((Number.parseFloat(fromAmount) * exchangeRate).toFixed(2))
        } else {
          setToAmount((Number.parseFloat(fromAmount) / exchangeRate).toFixed(2))
        }
        setIsCalculating(false)
      }, 500)
      return () => clearTimeout(timer)
    } else {
      setToAmount("")
    }
  }, [fromAmount, fromToken, toToken])

  const handleFromAmountChange = (e) => {
    const value = e.target.value
    if (value === "" || /^\d*\.?\d*$/.test(value)) {
      setFromAmount(value)
    }
  }

  const handleMaxClick = () => {
    setFromAmount(balances[fromToken].toString())
  }

  const handleSwapTokens = () => {
    setSwapRotation(swapRotation + 180)
    setFromAmount("")
    setToAmount("")
    const tempToken = fromToken
    setFromToken(toToken)
    setToToken(tempToken)
  }

  const handleSwap = () => {
    if (!fromAmount || Number.parseFloat(fromAmount) === 0) {
      toast({
        title: "Invalid amount",
        description: "Please enter an amount to swap",
        variant: "destructive",
      })
      return
    }

    if (Number.parseFloat(fromAmount) > balances[fromToken]) {
      toast({
        title: "Insufficient balance",
        description: `You don't have enough ${fromToken}`,
        variant: "destructive",
      })
      return
    }

    setIsSwapping(true)
    setTimeout(() => {
      setIsSwapping(false)
      toast({
        title: "Swap Successful!",
        description: `Swapped ${fromAmount} ${fromToken} to ${toAmount} ${toToken}`,
      })
      // Reset form
      setFromAmount("")
      setToAmount("")
    }, 2000)
  }

  return (
    <section className="mb-8 relative">
      <div className="absolute inset-0 -z-10 bg-checkered-colored opacity-20"></div>

      <div className="border-[6px] border-black bg-white p-6 shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] hover:shadow-[12px_12px_0px_0px_rgba(0,0,0,1)] transition-all duration-300 relative max-w-2xl mx-auto transform rotate-1">
        {/* Decorative elements */}
        <div className="absolute -top-6 -left-6 w-16 h-16 bg-[#0055FF] border-[4px] border-black -rotate-12 hidden md:block"></div>

        <div className="flex justify-between mb-6">
          <h3 className="text-2xl font-black">Swap Tokens</h3>
          <Button
            variant="outline"
            size="icon"
            className="border-[3px] border-black rounded-none bg-white hover:bg-[#f5f5f5] transition-all"
          >
            <Settings className="w-5 h-5" />
          </Button>
        </div>

        {/* From Token Section */}
        <div className="border-[4px] border-black p-4 mb-2 bg-[#f5f5f5]">
          <div className="flex justify-between mb-2">
            <span className="font-bold text-lg">From</span>
            <div className="flex items-center gap-2">
              <span className="text-sm font-medium">Balance: {balances[fromToken].toLocaleString()}</span>
              <Button
                variant="outline"
                size="sm"
                className="border-[2px] border-black rounded-none bg-white hover:bg-[#0055FF] hover:text-white transition-all font-bold text-xs px-2 py-1 h-auto"
                onClick={handleMaxClick}
              >
                MAX
              </Button>
            </div>
          </div>

          <div className="flex gap-4">
            <div className="flex-grow">
              <Input
                type="text"
                placeholder="0.00"
                value={fromAmount}
                onChange={handleFromAmountChange}
                className="border-[4px] border-black rounded-none h-16 text-3xl font-black focus:border-[#0055FF] focus:ring-0 focus:translate-y-[-2px] transition-transform bg-white"
              />
            </div>

            <div className="border-[4px] border-black bg-white p-2 flex items-center gap-2 min-w-[120px]">
              <div className="w-8 h-8 rounded-full overflow-hidden border-[2px] border-black">
                {fromToken === "USDC" ? (
                  <div className="w-full h-full bg-[#2775CA] flex items-center justify-center text-white font-bold text-xs">
                    USDC
                  </div>
                ) : (
                  <div className="w-full h-full bg-[#0055FF] flex items-center justify-center text-white font-bold text-xs">
                    ADC
                  </div>
                )}
              </div>
              <span className="font-bold">{fromToken}</span>
              <ChevronIcon className="ml-auto w-4 h-4" />
            </div>
          </div>

          {fromAmount && Number.parseFloat(fromAmount) > balances[fromToken] && (
            <div className="mt-2 text-[#FF3366] font-bold text-sm">Insufficient {fromToken} balance</div>
          )}
        </div>

        {/* Swap Direction Button */}
        <div className="flex justify-center -my-4 relative z-10">
          <Button
            variant="outline"
            size="icon"
            className="w-12 h-12 rounded-full border-[4px] border-black bg-[#FFCC00] hover:bg-[#FF3366] hover:scale-110 transition-all"
            onClick={handleSwapTokens}
            style={{ transform: `rotate(${swapRotation}deg)` }}
          >
            <ArrowDown className="w-6 h-6" />
          </Button>
        </div>

        {/* To Token Section */}
        <div className="border-[4px] border-black p-4 mt-2 bg-[#f5f5f5]">
          <div className="flex justify-between mb-2">
            <span className="font-bold text-lg">To</span>
            <div className="flex items-center gap-2">
              <span className="text-sm font-medium">Balance: {balances[toToken].toLocaleString()}</span>
            </div>
          </div>

          <div className="flex gap-4">
            <div className="flex-grow relative">
              <Input
                type="text"
                placeholder="0.00"
                value={toAmount}
                readOnly
                className="border-[4px] border-black rounded-none h-16 text-3xl font-black bg-white"
              />
              {isCalculating && (
                <div className="absolute right-4 top-1/2 -translate-y-1/2">
                  <RefreshCw className="w-5 h-5 animate-spin text-gray-400" />
                </div>
              )}
            </div>

            <div className="border-[4px] border-black bg-white p-2 flex items-center gap-2 min-w-[120px]">
              <div className="w-8 h-8 rounded-full overflow-hidden border-[2px] border-black">
                {toToken === "USDC" ? (
                  <div className="w-full h-full bg-[#2775CA] flex items-center justify-center text-white font-bold text-xs">
                    USDC
                  </div>
                ) : (
                  <div className="w-full h-full bg-[#0055FF] flex items-center justify-center text-white font-bold text-xs">
                    ADC
                  </div>
                )}
              </div>
              <span className="font-bold">{toToken}</span>
              <ChevronIcon className="ml-auto w-4 h-4" />
            </div>
          </div>

          {toAmount && (
            <div className="mt-2 text-gray-600 font-medium text-sm">
              ≈ $
              {(toToken === "USDC" ? Number.parseFloat(toAmount) : Number.parseFloat(toAmount) / exchangeRate).toFixed(
                2,
              )}{" "}
              USD
            </div>
          )}
        </div>

        {/* Swap Button */}
        <Button
          className="w-full mt-6 bg-[#0055FF] text-white border-[6px] border-black hover:bg-[#FFCC00] hover:text-black transition-all font-bold text-xl py-6 h-auto rounded-none shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] hover:shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] hover:-translate-y-2 relative overflow-hidden group disabled:opacity-70 disabled:hover:translate-y-0 disabled:hover:shadow-[6px_6px_0px_0px_rgba(0,0,0,1)]"
          onClick={handleSwap}
          disabled={
            !fromAmount ||
            Number.parseFloat(fromAmount) === 0 ||
            Number.parseFloat(fromAmount) > balances[fromToken] ||
            isSwapping
          }
        >
          <span className="relative z-10 flex items-center justify-center gap-2">
            {isSwapping ? (
              <>
                <RefreshCw className="w-6 h-6 animate-spin" />
                Swapping...
              </>
            ) : (
              <>
                Swap {fromToken} to {toToken}
              </>
            )}
          </span>
          <span className="absolute inset-0 bg-[#FFCC00] transform scale-x-0 group-hover:scale-x-100 transition-transform duration-300 origin-left"></span>
        </Button>
      </div>
    </section>
  )
}

// Simple chevron icon component
function ChevronIcon({ className }) {
  return (
    <svg
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
    >
      <path d="M6 9L12 15L18 9" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  )
}

