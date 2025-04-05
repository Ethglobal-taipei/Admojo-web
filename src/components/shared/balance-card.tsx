import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"

interface BalanceCardProps {
  balances?: {
    USDC: number
    ADC: number
  } | null
}

export default function BalanceCard({ balances }: BalanceCardProps) {
  return (
    <Card className="border-[6px] border-black shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] hover:shadow-[12px_12px_0px_0px_rgba(0,0,0,1)] transition-all duration-300 relative">
      <CardHeader className="pb-4">
        <CardTitle className="text-2xl font-black">Balances</CardTitle>
        <CardDescription>Your current token balances</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <div className="border-[4px] border-black p-4 bg-white hover:translate-y-[-2px] hover:shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] transition-all">
            <div className="flex items-center justify-between mb-1">
              <span className="font-bold text-lg">USDC Balance</span>
              <span className="font-bold text-lg">USDC</span>
            </div>
            <div className="text-3xl font-black">{balances ? balances.USDC.toLocaleString() : "0"}</div>
          </div>

          <div className="border-[4px] border-black p-4 bg-white hover:translate-y-[-2px] hover:shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] transition-all">
            <div className="flex items-center justify-between mb-1">
              <span className="font-bold text-lg">ADC Balance</span>
              <span className="font-bold text-lg">ADC</span>
            </div>
            <div className="text-3xl font-black">{balances ? balances.ADC.toLocaleString() : "0"}</div>
          </div>

          <div className="flex items-center justify-between border-[4px] border-black p-3 bg-[#f5f5f5] hover:bg-[#e5e5e5] transition-colors">
            <div>
              <div className="font-bold">Exchange Rate</div>
              <div className="text-lg">1 USDC = 2.35 ADC</div>
            </div>
            <div className="px-2 py-1 bg-[#FF3366] text-white font-bold text-sm border-[2px] border-black animate-pulse">
              LIVE
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <Button className="bg-[#0055FF] text-white border-[3px] border-black hover:bg-[#FFCC00] hover:text-black transition-all font-bold text-sm py-2 h-auto rounded-none hover:-translate-y-1 hover:shadow-[3px_3px_0px_0px_rgba(0,0,0,1)]">
              Deposit
            </Button>
            <Button className="bg-[#FF3366] text-white border-[3px] border-black hover:bg-[#FFCC00] hover:text-black transition-all font-bold text-sm py-2 h-auto rounded-none hover:-translate-y-1 hover:shadow-[3px_3px_0px_0px_rgba(0,0,0,1)]">
              Withdraw
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

