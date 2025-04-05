"use client"

import { useState } from "react"
import { ArrowDown, BadgeCheck, AlertTriangle, RefreshCw, TrendingUp } from "lucide-react"
import { Button } from "@/components/ui/button"
import { toast } from "sonner"
export default function ProviderHeader() {
  const [isRefreshing, setIsRefreshing] = useState(false)
  const [verificationStatus, setVerificationStatus] = useState("verified") // verified, pending, unverified

  const handleRefresh = () => {
    setIsRefreshing(true)
    setTimeout(() => {
      setIsRefreshing(false)
      toast({
        title: "Earnings Updated",
        description: "Your earnings data has been refreshed.",
      })
    }, 1500)
  }

  return (
    <section className="mb-10 relative">
      <div className="absolute inset-0 -z-10 bg-checkered-light"></div>

      <div className="border-[6px] border-black bg-white p-6 shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] hover:shadow-[12px_12px_0px_0px_rgba(0,0,0,1)] transition-all duration-300 relative">
        {/* Decorative elements */}
        <div className="absolute -top-6 -right-6 w-20 h-20 bg-[#FFCC00] border-[4px] border-black rotate-12 flex items-center justify-center transform hover:rotate-0 transition-all duration-300">
          <BadgeCheck className="w-10 h-10 text-black" />
        </div>
        <div className="absolute -bottom-4 -left-4 w-12 h-12 bg-[#FF3366] border-[3px] border-black -rotate-12 hidden md:block"></div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div>
            <h2 className="text-3xl font-black mb-2">PROVIDER DASHBOARD</h2>
            <div className="flex items-center gap-2 mb-4">
              {verificationStatus === "verified" && (
                <div className="px-3 py-1 bg-green-500 text-white font-bold border-[3px] border-black relative overflow-hidden group">
                  <span className="relative z-10 flex items-center gap-1">
                    <BadgeCheck className="w-4 h-4" /> VERIFIED
                  </span>
                  <span className="absolute inset-0 bg-green-500 opacity-50 animate-pulse"></span>
                </div>
              )}
              {verificationStatus === "pending" && (
                <div className="px-3 py-1 bg-[#FFCC00] text-black font-bold border-[3px] border-black relative overflow-hidden group">
                  <span className="relative z-10 flex items-center gap-1">
                    <RefreshCw className="w-4 h-4 animate-spin" /> PENDING
                  </span>
                </div>
              )}
              {verificationStatus === "unverified" && (
                <div className="px-3 py-1 bg-[#FF3366] text-white font-bold border-[3px] border-black relative overflow-hidden group">
                  <span className="relative z-10 flex items-center gap-1">
                    <AlertTriangle className="w-4 h-4" /> UNVERIFIED
                  </span>
                </div>
              )}
              <span className="font-bold">Premium Provider</span>
            </div>
            <p className="font-bold">Provider ID: PRV-38291</p>
            <p className="font-medium">Last Login: Today, 10:15 AM</p>
          </div>

          <div className="flex flex-col justify-between">
            <div className="mb-4">
              <div className="flex items-center justify-between mb-1">
                <span className="font-bold text-lg">Total Earnings (ADC)</span>
                <Button
                  variant="outline"
                  size="sm"
                  className={`border-[3px] border-black rounded-none bg-white hover:bg-[#0055FF] hover:text-white transition-all ${isRefreshing ? "animate-spin" : ""}`}
                  onClick={handleRefresh}
                >
                  <RefreshCw className="w-4 h-4" />
                </Button>
              </div>
              <div className="border-[4px] border-black p-3 bg-white flex items-center justify-between hover:translate-y-[-2px] hover:shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] transition-all">
                <span className="text-3xl font-black">24,680.50</span>
                <span className="font-bold text-lg">ADC</span>
              </div>
            </div>
            <div>
              <div className="font-bold text-lg mb-1">USDC Equivalent</div>
              <div className="border-[4px] border-black p-3 bg-white flex items-center justify-between hover:translate-y-[-2px] hover:shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] transition-all">
                <span className="text-3xl font-black">10,502.34</span>
                <span className="font-bold text-lg">USDC</span>
              </div>
            </div>
          </div>

          <div className="flex flex-col">
            <div className="border-[4px] border-black p-3 bg-[#f5f5f5] mb-4 flex-1">
              <div className="flex items-center justify-between mb-2">
                <span className="font-bold">7-Day Earnings Trend</span>
                <div className="flex items-center gap-1 bg-[#0055FF] text-white px-2 py-1 font-bold text-sm">
                  <TrendingUp className="w-4 h-4" />
                  <span>+23.5%</span>
                </div>
              </div>
              <div className="h-24 relative">
                {/* Raw graph visualization */}
                <div className="absolute inset-0 flex items-end">
                  <div className="w-1/7 h-[40%] bg-[#0055FF] border-r-2 border-black"></div>
                  <div className="w-1/7 h-[60%] bg-[#0055FF] border-r-2 border-black"></div>
                  <div className="w-1/7 h-[45%] bg-[#0055FF] border-r-2 border-black"></div>
                  <div className="w-1/7 h-[70%] bg-[#0055FF] border-r-2 border-black"></div>
                  <div className="w-1/7 h-[55%] bg-[#0055FF] border-r-2 border-black"></div>
                  <div className="w-1/7 h-[80%] bg-[#0055FF] border-r-2 border-black"></div>
                  <div className="w-1/7 h-[95%] bg-[#0055FF]"></div>
                </div>
                <div className="absolute bottom-0 left-0 w-full h-[1px] bg-black"></div>
              </div>
              <div className="flex justify-between mt-1 text-xs font-medium">
                <div>Mon</div>
                <div>Tue</div>
                <div>Wed</div>
                <div>Thu</div>
                <div>Fri</div>
                <div>Sat</div>
                <div>Sun</div>
              </div>
            </div>
            <Button className="bg-[#FF3366] text-white border-[6px] border-black hover:bg-[#FFCC00] hover:text-black transition-all font-bold text-lg py-3 h-auto rounded-none shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] hover:shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] hover:-translate-y-2 relative overflow-hidden group">
              <span className="relative z-10">Withdraw Earnings</span>
              <span className="absolute inset-0 bg-[#FFCC00] transform scale-x-0 group-hover:scale-x-100 transition-transform duration-300 origin-left"></span>
              <ArrowDown className="ml-2 w-5 h-5 relative z-10" />
            </Button>
          </div>
        </div>
      </div>
    </section>
  )
}

