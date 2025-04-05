import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Progress } from "@/components/ui/progress"
import { TrendingDown } from "lucide-react"

interface StatsCardProps {
  stats?: {
    campaignsCreated: number
    activeDisplays: number
    totalSpent: number
    avgCPI: number
  } | null
}

export default function StatsCard({ stats }: StatsCardProps) {
  return (
    <Card className="border-[6px] border-black shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] hover:shadow-[12px_12px_0px_0px_rgba(0,0,0,1)] transition-all duration-300 relative">
      <CardHeader className="pb-4">
        <CardTitle className="text-2xl font-black">Statistics</CardTitle>
        <CardDescription>Your account activity</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-6">
          <div>
            <div className="flex items-center justify-between mb-1">
              <span className="font-bold">Campaigns Created</span>
              <span className="font-bold">{stats ? stats.campaignsCreated : 0}</span>
            </div>
            <Progress
              value={stats ? (stats.campaignsCreated / 30) * 100 : 0}
              className="h-3 border-[2px] border-black [&>div]:bg-[#0055FF]"
            />
          </div>

          <div>
            <div className="flex items-center justify-between mb-1">
              <span className="font-bold">Active Displays</span>
              <span className="font-bold">{stats ? stats.activeDisplays : 0}</span>
            </div>
            <Progress
              value={stats ? (stats.activeDisplays / 20) * 100 : 0}
              className="h-3 border-[2px] border-black [&>div]:bg-[#FFCC00]"
            />
          </div>

          <div>
            <div className="flex items-center justify-between mb-1">
              <span className="font-bold">Total Spent (ADC)</span>
              <span className="font-bold">{stats ? stats.totalSpent.toLocaleString() : "0"}</span>
            </div>
            <Progress
              value={stats ? (stats.totalSpent / 30000) * 100 : 0}
              className="h-3 border-[2px] border-black [&>div]:bg-[#FF3366]"
            />
          </div>

          <div>
            <div className="flex items-center justify-between mb-1">
              <span className="font-bold">Avg. Cost Per Impression</span>
              <span className="font-bold">{stats ? stats.avgCPI.toFixed(4) : "0.0000"} ADC</span>
            </div>
            <div className="flex items-center gap-1 text-sm font-medium">
              <span>Market Avg: 0.0072 ADC</span>
              <TrendingDown className="w-4 h-4 text-[#0055FF]" />
              <span className="text-[#0055FF] font-bold">-5.6%</span>
            </div>
          </div>

          <Button
            variant="outline"
            className="w-full border-[3px] border-black rounded-none bg-white hover:bg-[#f5f5f5] transition-all font-bold text-sm py-2 h-auto hover:-translate-y-1 hover:shadow-[3px_3px_0px_0px_rgba(0,0,0,1)]"
          >
            View Detailed Analytics
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}

