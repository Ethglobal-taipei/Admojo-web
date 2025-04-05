"use client"

import { useState } from "react"
import { Calendar, Download, BarChart2, LineChart, PieChart, TrendingUp, TrendingDown } from "lucide-react"
import { Button } from "@/components/ui/button"

export default function AnalyticsPage() {
  const [activeTab, setActiveTab] = useState("overview")
  const [dateRange, setDateRange] = useState("month")

  return (
    <div className="container mx-auto px-4 py-8 relative">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
        <h1 className="text-3xl md:text-4xl font-black">ANALYTICS DASHBOARD</h1>

        <div className="flex gap-2">
          <div className="border-[4px] border-black bg-white">
            <select
              className="h-full px-4 py-2 font-bold bg-transparent focus:outline-none"
              value={dateRange}
              onChange={(e) => setDateRange(e.target.value)}
            >
              <option value="week">Last 7 Days</option>
              <option value="month">Last 30 Days</option>
              <option value="quarter">Last 90 Days</option>
              <option value="year">Last 365 Days</option>
            </select>
          </div>
          <Button
            variant="outline"
            className="border-[4px] border-black rounded-none bg-white hover:bg-[#f5f5f5] transition-all font-bold px-4 py-2 h-auto flex items-center gap-2 hover:-translate-y-1 hover:shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]"
          >
            <Calendar className="w-5 h-5" />
            <span>Custom Range</span>
          </Button>
          <Button
            variant="outline"
            className="border-[4px] border-black rounded-none bg-white hover:bg-[#f5f5f5] transition-all font-bold px-4 py-2 h-auto hover:-translate-y-1 hover:shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]"
          >
            <Download className="w-5 h-5" />
          </Button>
        </div>
      </div>

      {/* Analytics Tabs */}
      <div className="flex border-b-[4px] border-black mb-8 overflow-x-auto">
        {[
          { id: "overview", name: "Overview", icon: BarChart2 },
          { id: "campaigns", name: "Campaigns", icon: LineChart },
          { id: "locations", name: "Locations", icon: PieChart },
        ].map((tab) => (
          <button
            key={tab.id}
            className={`px-6 py-3 font-bold text-lg flex items-center gap-2 min-w-max ${
              activeTab === tab.id ? "bg-[#0055FF] text-white" : "bg-white hover:bg-[#f5f5f5]"
            } transition-colors border-r-[4px] border-black`}
            onClick={() => setActiveTab(tab.id)}
          >
            <tab.icon className="w-5 h-5" />
            {tab.name}
          </button>
        ))}
      </div>

      {/* Overview Tab */}
      {activeTab === "overview" && (
        <div className="space-y-8 animate-in fade-in duration-300">
          {/* KPI Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <div className="border-[6px] border-black bg-[#0055FF] p-5 shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] hover:shadow-[12px_12px_0px_0px_rgba(0,0,0,1)] hover:-translate-y-2 transition-all transform rotate-1 group">
              <div className="flex items-start justify-between mb-3">
                <h3 className="text-xl font-black text-white">TOTAL IMPRESSIONS</h3>
                <Eye className="w-8 h-8 text-white opacity-70 group-hover:scale-125 transition-transform" />
              </div>
              <div className="bg-white border-[4px] border-black p-3 mb-3 group-hover:translate-x-1 group-hover:-translate-y-1 transition-transform">
                <div className="text-4xl font-black">1,250,000</div>
              </div>
              <div className="flex items-center justify-between">
                <div className="text-white font-bold">Last 30 Days</div>
                <div className="flex items-center gap-1 bg-black text-white px-2 py-1 font-bold text-sm group-hover:bg-[#FFCC00] group-hover:text-black transition-colors">
                  <TrendingUp className="w-4 h-4" />
                  <span>+18.7%</span>
                </div>
              </div>
            </div>

            <div className="border-[6px] border-black bg-[#FFCC00] p-5 shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] hover:shadow-[12px_12px_0px_0px_rgba(0,0,0,1)] hover:-translate-y-2 transition-all transform -rotate-1 group">
              <div className="flex items-start justify-between mb-3">
                <h3 className="text-xl font-black">ACTIVE CAMPAIGNS</h3>
                <BarChart2 className="w-8 h-8 opacity-70 group-hover:scale-125 transition-transform" />
              </div>
              <div className="bg-white border-[4px] border-black p-3 mb-3 group-hover:translate-x-1 group-hover:-translate-y-1 transition-transform">
                <div className="text-4xl font-black">12</div>
              </div>
              <div className="flex items-center justify-between">
                <div className="font-bold">Out of 15 Total</div>
                <div className="flex items-center gap-1 bg-black text-white px-2 py-1 font-bold text-sm group-hover:bg-[#0055FF] group-hover:text-white transition-colors">
                  <TrendingUp className="w-4 h-4" />
                  <span>+2 this month</span>
                </div>
              </div>
            </div>

            <div className="border-[6px] border-black bg-[#FF3366] p-5 shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] hover:shadow-[12px_12px_0px_0px_rgba(0,0,0,1)] hover:-translate-y-2 transition-all transform rotate-1 group">
              <div className="flex items-start justify-between mb-3">
                <h3 className="text-xl font-black text-white">TOTAL SPEND</h3>
                <DollarSign className="w-8 h-8 text-white opacity-70 group-hover:scale-125 transition-transform" />
              </div>
              <div className="bg-white border-[4px] border-black p-3 mb-3 group-hover:translate-x-1 group-hover:-translate-y-1 transition-transform">
                <div className="text-4xl font-black">8,450 ADC</div>
              </div>
              <div className="flex items-center justify-between">
                <div className="text-white font-bold">≈ 3,595 USDC</div>
                <div className="flex items-center gap-1 bg-black text-white px-2 py-1 font-bold text-sm group-hover:bg-[#FFCC00] group-hover:text-black transition-colors">
                  <TrendingUp className="w-4 h-4" />
                  <span>+12.5%</span>
                </div>
              </div>
            </div>

            <div className="border-[6px] border-black bg-white p-5 shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] hover:shadow-[12px_12px_0px_0px_rgba(0,0,0,1)] hover:-translate-y-2 transition-all transform -rotate-1 group">
              <div className="flex items-start justify-between mb-3">
                <h3 className="text-xl font-black">AVG COST/IMPRESSION</h3>
                <Calculator className="w-8 h-8 opacity-70 group-hover:scale-125 transition-transform" />
              </div>
              <div className="bg-[#f5f5f5] border-[4px] border-black p-3 mb-3 group-hover:translate-x-1 group-hover:-translate-y-1 transition-transform">
                <div className="text-4xl font-black">
                  0.0068 <span className="text-2xl">ADC</span>
                </div>
              </div>
              <div className="flex items-center justify-between">
                <div className="font-bold">Market Avg: 0.0072</div>
                <div className="flex items-center gap-1 bg-[#0055FF] text-white px-2 py-1 font-bold text-sm group-hover:bg-[#FF3366] transition-colors">
                  <TrendingDown className="w-4 h-4" />
                  <span>-5.6%</span>
                </div>
              </div>
            </div>
          </div>

          {/* Main Chart */}
          <div className="border-[6px] border-black bg-white p-6 shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] hover:shadow-[12px_12px_0px_0px_rgba(0,0,0,1)] transition-all duration-300">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-black">Performance Trends</h2>

              <div className="flex gap-2">
                <Button
                  variant="outline"
                  className="border-[3px] border-[#0055FF] rounded-none bg-white hover:bg-[#f5f5f5] transition-all font-bold px-3 py-1 h-auto"
                >
                  Impressions
                </Button>
                <Button
                  variant="outline"
                  className="border-[3px] border-black rounded-none bg-white hover:bg-[#f5f5f5] transition-all font-bold px-3 py-1 h-auto"
                >
                  Spend
                </Button>
                <Button
                  variant="outline"
                  className="border-[3px] border-black rounded-none bg-white hover:bg-[#f5f5f5] transition-all font-bold px-3 py-1 h-auto"
                >
                  CPI
                </Button>
              </div>
            </div>

            <div className="aspect-[21/9] border-[4px] border-black p-4 bg-[#f5f5f5] mb-6">
              <div className="h-full relative">
                {/* This would be a real chart in production */}
                <div className="absolute inset-0 flex items-end p-2">
                  {[40, 65, 45, 70, 55, 80, 95, 85, 90, 75, 85, 95].map((height, index) => (
                    <div key={index} className="flex-1 mx-1" style={{ height: `${height}%` }}>
                      <div className="w-full h-full bg-[#0055FF] border-[2px] border-black"></div>
                    </div>
                  ))}
                </div>
                <div className="absolute bottom-0 left-0 w-full h-[1px] bg-black"></div>
                <div className="absolute top-0 left-0 h-full w-[1px] bg-black"></div>
              </div>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="border-[3px] border-black p-3 bg-[#f5f5f5]">
                <div className="text-sm font-medium">Peak Day</div>
                <div className="text-xl font-black">Jun 15, 2023</div>
              </div>
              <div className="border-[3px] border-black p-3 bg-[#f5f5f5]">
                <div className="text-sm font-medium">Peak Value</div>
                <div className="text-xl font-black">68,200</div>
              </div>
              <div className="border-[3px] border-black p-3 bg-[#f5f5f5]">
                <div className="text-sm font-medium">Average</div>
                <div className="text-xl font-black">41,700/day</div>
              </div>
              <div className="border-[3px] border-black p-3 bg-[#f5f5f5]">
                <div className="text-sm font-medium">Growth</div>
                <div className="text-xl font-black text-[#0055FF]">+18.7%</div>
              </div>
            </div>
          </div>

          {/* Performance by Location */}
          <div className="border-[6px] border-black bg-white shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] hover:shadow-[12px_12px_0px_0px_rgba(0,0,0,1)] transition-all duration-300">
            <div className="p-6 border-b-[4px] border-black">
              <h2 className="text-2xl font-black">Performance by Location</h2>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b-[4px] border-black">
                    <th className="p-4 text-left font-black">Location</th>
                    <th className="p-4 text-left font-black">Impressions</th>
                    <th className="p-4 text-left font-black">Spend (ADC)</th>
                    <th className="p-4 text-left font-black">CPI</th>
                    <th className="p-4 text-left font-black">Performance</th>
                  </tr>
                </thead>
                <tbody>
                  {[
                    {
                      location: "Times Square Billboard",
                      impressions: 450000,
                      spend: 1200,
                      cpi: 0.0027,
                      performance: "high",
                    },
                    {
                      location: "Downtown LA Display",
                      impressions: 320000,
                      spend: 850,
                      cpi: 0.0027,
                      performance: "high",
                    },
                    {
                      location: "Chicago Transit Hub",
                      impressions: 180000,
                      spend: 500,
                      cpi: 0.0028,
                      performance: "medium",
                    },
                    {
                      location: "Miami Beach Promenade",
                      impressions: 300000,
                      spend: 800,
                      cpi: 0.0027,
                      performance: "medium",
                    },
                  ].map((item, index) => (
                    <tr key={index} className="border-b-[2px] border-black hover:bg-[#f5f5f5] transition-colors">
                      <td className="p-4 font-bold">{item.location}</td>
                      <td className="p-4">{item.impressions.toLocaleString()}</td>
                      <td className="p-4 font-bold">{item.spend.toLocaleString()} ADC</td>
                      <td className="p-4">{item.cpi.toFixed(4)} ADC</td>
                      <td className="p-4">
                        <div className="flex items-center gap-2">
                          <div
                            className={`w-3 h-3 rounded-full ${
                              item.performance === "high"
                                ? "bg-green-500"
                                : item.performance === "medium"
                                  ? "bg-[#FFCC00]"
                                  : "bg-[#FF3366]"
                            }`}
                          ></div>
                          <span className="font-bold capitalize">{item.performance}</span>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="p-4 border-t-[2px] border-black bg-[#f5f5f5] flex justify-between items-center">
              <div className="font-bold">Showing 4 of 12 locations</div>
              <Button className="bg-[#0055FF] text-white border-[3px] border-black hover:bg-[#FFCC00] hover:text-black transition-all font-bold px-4 py-2 h-auto rounded-none hover:-translate-y-1 hover:shadow-[3px_3px_0px_0px_rgba(0,0,0,1)]">
                View All Locations
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Campaigns Tab */}
      {activeTab === "campaigns" && (
        <div className="space-y-8 animate-in fade-in duration-300">
          <div className="border-[6px] border-black bg-white p-6 shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] hover:shadow-[12px_12px_0px_0px_rgba(0,0,0,1)] transition-all duration-300">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-black">Campaign Performance</h2>

              <div className="flex gap-2">
                <Button
                  variant="outline"
                  className="border-[3px] border-[#0055FF] rounded-none bg-white hover:bg-[#f5f5f5] transition-all font-bold px-3 py-1 h-auto"
                >
                  Impressions
                </Button>
                <Button
                  variant="outline"
                  className="border-[3px] border-black rounded-none bg-white hover:bg-[#f5f5f5] transition-all font-bold px-3 py-1 h-auto"
                >
                  Spend
                </Button>
                <Button
                  variant="outline"
                  className="border-[3px] border-black rounded-none bg-white hover:bg-[#f5f5f5] transition-all font-bold px-3 py-1 h-auto"
                >
                  ROI
                </Button>
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b-[4px] border-black">
                    <th className="p-4 text-left font-black">Campaign</th>
                    <th className="p-4 text-left font-black">Status</th>
                    <th className="p-4 text-left font-black">Impressions</th>
                    <th className="p-4 text-left font-black">Spend (ADC)</th>
                    <th className="p-4 text-left font-black">CPI</th>
                    <th className="p-4 text-left font-black">Performance</th>
                  </tr>
                </thead>
                <tbody>
                  {[
                    {
                      name: "Summer Sale 2023",
                      status: "active",
                      impressions: 450000,
                      spend: 1200,
                      cpi: 0.0027,
                      performance: "high",
                    },
                    {
                      name: "New Product Launch",
                      status: "active",
                      impressions: 320000,
                      spend: 850,
                      cpi: 0.0027,
                      performance: "high",
                    },
                    {
                      name: "Holiday Special",
                      status: "scheduled",
                      impressions: 0,
                      spend: 0,
                      cpi: 0,
                      performance: "medium",
                    },
                    {
                      name: "Brand Awareness",
                      status: "active",
                      impressions: 180000,
                      spend: 500,
                      cpi: 0.0028,
                      performance: "medium",
                    },
                    {
                      name: "Flash Sale Weekend",
                      status: "completed",
                      impressions: 300000,
                      spend: 800,
                      cpi: 0.0027,
                      performance: "high",
                    },
                  ].map((campaign, index) => (
                    <tr key={index} className="border-b-[2px] border-black hover:bg-[#f5f5f5] transition-colors">
                      <td className="p-4 font-bold">{campaign.name}</td>
                      <td className="p-4">
                        <span
                          className={`px-2 py-1 text-xs font-bold ${
                            campaign.status === "active"
                              ? "bg-green-100 text-green-800 border-[2px] border-green-800"
                              : campaign.status === "scheduled"
                                ? "bg-blue-100 text-blue-800 border-[2px] border-blue-800"
                                : "bg-gray-100 text-gray-800 border-[2px] border-gray-800"
                          }`}
                        >
                          {campaign.status.toUpperCase()}
                        </span>
                      </td>
                      <td className="p-4">{campaign.impressions.toLocaleString()}</td>
                      <td className="p-4 font-bold">{campaign.spend.toLocaleString()} ADC</td>
                      <td className="p-4">{campaign.cpi.toFixed(4)} ADC</td>
                      <td className="p-4">
                        <div className="flex items-center gap-2">
                          <div
                            className={`w-3 h-3 rounded-full ${
                              campaign.performance === "high"
                                ? "bg-green-500"
                                : campaign.performance === "medium"
                                  ? "bg-[#FFCC00]"
                                  : "bg-[#FF3366]"
                            }`}
                          ></div>
                          <span className="font-bold capitalize">{campaign.performance}</span>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="mt-6 grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="border-[3px] border-black p-4 bg-[#f5f5f5]">
                <div className="text-sm font-medium">Top Campaign</div>
                <div className="text-xl font-black">Summer Sale 2023</div>
                <div className="text-sm">450,000 impressions</div>
              </div>
              <div className="border-[3px] border-black p-4 bg-[#f5f5f5]">
                <div className="text-sm font-medium">Best Performing</div>
                <div className="text-xl font-black">New Product Launch</div>
                <div className="text-sm">0.0026 ADC per impression</div>
              </div>
              <div className="border-[3px] border-black p-4 bg-[#f5f5f5]">
                <div className="text-sm font-medium">Total Active Campaigns</div>
                <div className="text-xl font-black">3 of 5</div>
                <div className="text-sm">60% active rate</div>
              </div>
            </div>
          </div>

          <div className="border-[6px] border-black bg-white p-6 shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] hover:shadow-[12px_12px_0px_0px_rgba(0,0,0,1)] transition-all duration-300">
            <h2 className="text-2xl font-black mb-4">Campaign Comparison</h2>

            <div className="aspect-[21/9] border-[4px] border-black p-4 bg-[#f5f5f5] mb-6">
              <div className="h-full relative">
                {/* This would be a real chart in production */}
                <div className="absolute inset-0 flex items-end p-2">
                  <div className="flex-1 h-full flex items-end">
                    {[65, 40, 75, 50, 85].map((height, index) => (
                      <div key={index} className="flex-1 mx-1 flex flex-col items-center">
                        <div className="w-full" style={{ height: `${height}%` }}>
                          <div className="w-full h-full bg-[#0055FF] border-[2px] border-black"></div>
                        </div>
                        <div className="text-xs font-bold mt-2 rotate-45 origin-left">Campaign {index + 1}</div>
                      </div>
                    ))}
                  </div>
                </div>
                <div className="absolute bottom-0 left-0 w-full h-[1px] bg-black"></div>
                <div className="absolute top-0 left-0 h-full w-[1px] bg-black"></div>
              </div>
            </div>

            <Button className="bg-[#0055FF] text-white border-[3px] border-black hover:bg-[#FFCC00] hover:text-black transition-all font-bold px-4 py-2 h-auto rounded-none hover:-translate-y-1 hover:shadow-[3px_3px_0px_0px_rgba(0,0,0,1)]">
              View Detailed Campaign Report
            </Button>
          </div>
        </div>
      )}

      {/* Locations Tab */}
      {activeTab === "locations" && (
        <div className="space-y-8 animate-in fade-in duration-300">
          <div className="border-[6px] border-black bg-white p-6 shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] hover:shadow-[12px_12px_0px_0px_rgba(0,0,0,1)] transition-all duration-300">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-black">Location Performance</h2>

              <div className="flex gap-2">
                <Button
                  variant="outline"
                  className="border-[3px] border-[#0055FF] rounded-none bg-white hover:bg-[#f5f5f5] transition-all font-bold px-3 py-1 h-auto"
                >
                  Impressions
                </Button>
                <Button
                  variant="outline"
                  className="border-[3px] border-black rounded-none bg-white hover:bg-[#f5f5f5] transition-all font-bold px-3 py-1 h-auto"
                >
                  Cost
                </Button>
                <Button
                  variant="outline"
                  className="border-[3px] border-black rounded-none bg-white hover:bg-[#f5f5f5] transition-all font-bold px-3 py-1 h-auto"
                >
                  Engagement
                </Button>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
              <div className="border-[4px] border-black aspect-square relative overflow-hidden">
                <div className="absolute inset-0 bg-[#f5f5f5] flex items-center justify-center">
                  <div className="w-full h-full bg-gray-200">
                    {/* This would be a real map in production */}
                    <div className="w-full h-full relative">
                      <div className="absolute top-[20%] left-[30%] w-6 h-6 bg-[#0055FF] border-[2px] border-black rounded-full animate-pulse"></div>
                      <div className="absolute top-[40%] left-[50%] w-8 h-8 bg-[#FFCC00] border-[2px] border-black rounded-full animate-pulse"></div>
                      <div className="absolute top-[60%] left-[70%] w-6 h-6 bg-[#FF3366] border-[2px] border-black rounded-full animate-pulse"></div>
                      <div className="absolute top-[30%] left-[80%] w-5 h-5 bg-[#0055FF] border-[2px] border-black rounded-full animate-pulse"></div>
                      <div className="absolute top-[70%] left-[20%] w-7 h-7 bg-[#FFCC00] border-[2px] border-black rounded-full animate-pulse"></div>
                    </div>
                  </div>
                </div>
                <div className="absolute bottom-0 left-0 right-0 bg-black bg-opacity-70 text-white p-3">
                  <div className="font-bold">Location Heat Map</div>
                  <div className="text-sm">Showing performance by geographic area</div>
                </div>
              </div>

              <div className="border-[4px] border-black p-4 bg-[#f5f5f5]">
                <h3 className="font-bold text-lg mb-3">Top Performing Locations</h3>
                <div className="space-y-4">
                  {[
                    { name: "Times Square Billboard", impressions: 450000, cpi: 0.0026 },
                    { name: "Downtown LA Display", impressions: 320000, cpi: 0.0027 },
                    { name: "Chicago Transit Hub", impressions: 180000, cpi: 0.0028 },
                    { name: "Miami Beach Promenade", impressions: 300000, cpi: 0.0027 },
                  ].map((location, index) => (
                    <div key={index} className="border-b border-gray-300 pb-2 last:border-0">
                      <div className="flex justify-between items-center">
                        <div>
                          <div className="font-bold">{location.name}</div>
                          <div className="text-sm">{location.impressions.toLocaleString()} impressions</div>
                        </div>
                        <div className="text-right">
                          <div className="font-bold">{location.cpi.toFixed(4)} ADC</div>
                          <div className="text-sm">per impression</div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b-[4px] border-black">
                    <th className="p-4 text-left font-black">Location</th>
                    <th className="p-4 text-left font-black">Type</th>
                    <th className="p-4 text-left font-black">Impressions</th>
                    <th className="p-4 text-left font-black">Spend (ADC)</th>
                    <th className="p-4 text-left font-black">CPI</th>
                    <th className="p-4 text-left font-black">Performance</th>
                  </tr>
                </thead>
                <tbody>
                  {[
                    {
                      name: "Times Square Billboard",
                      type: "Billboard",
                      impressions: 450000,
                      spend: 1200,
                      cpi: 0.0027,
                      performance: "high",
                    },
                    {
                      name: "Downtown LA Display",
                      type: "Digital Screen",
                      impressions: 320000,
                      spend: 850,
                      cpi: 0.0027,
                      performance: "high",
                    },
                    {
                      name: "Chicago Transit Hub",
                      type: "Transit",
                      impressions: 180000,
                      spend: 500,
                      cpi: 0.0028,
                      performance: "medium",
                    },
                    {
                      name: "Miami Beach Promenade",
                      type: "Street Display",
                      impressions: 300000,
                      spend: 800,
                      cpi: 0.0027,
                      performance: "medium",
                    },
                    {
                      name: "Seattle Shopping Mall",
                      type: "Indoor",
                      impressions: 150000,
                      spend: 400,
                      cpi: 0.0027,
                      performance: "low",
                    },
                  ].map((location, index) => (
                    <tr key={index} className="border-b-[2px] border-black hover:bg-[#f5f5f5] transition-colors">
                      <td className="p-4 font-bold">{location.name}</td>
                      <td className="p-4">{location.type}</td>
                      <td className="p-4">{location.impressions.toLocaleString()}</td>
                      <td className="p-4 font-bold">{location.spend.toLocaleString()} ADC</td>
                      <td className="p-4">{location.cpi.toFixed(4)} ADC</td>
                      <td className="p-4">
                        <div className="flex items-center gap-2">
                          <div
                            className={`w-3 h-3 rounded-full ${
                              location.performance === "high"
                                ? "bg-green-500"
                                : location.performance === "medium"
                                  ? "bg-[#FFCC00]"
                                  : "bg-[#FF3366]"
                            }`}
                          ></div>
                          <span className="font-bold capitalize">{location.performance}</span>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="p-4 border-t-[2px] border-black bg-[#f5f5f5] flex justify-between items-center mt-4">
              <div className="font-bold">Showing 5 of 12 locations</div>
              <Button className="bg-[#0055FF] text-white border-[3px] border-black hover:bg-[#FFCC00] hover:text-black transition-all font-bold px-4 py-2 h-auto rounded-none hover:-translate-y-1 hover:shadow-[3px_3px_0px_0px_rgba(0,0,0,1)]">
                View All Locations
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

// Missing icon component
function Eye(props) {
  return (
    <svg
      {...props}
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M2 12s3-7 10-7 10 7 10 7-3 7-10 7-10-7-10-7Z" />
      <circle cx="12" cy="12" r="3" />
    </svg>
  )
}

// Missing icon component
function DollarSign(props) {
  return (
    <svg
      {...props}
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <line x1="12" y1="2" x2="12" y2="22" />
      <path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" />
    </svg>
  )
}

// Missing icon component
function Calculator(props) {
  return (
    <svg
      {...props}
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <rect width="16" height="20" x="4" y="2" rx="2" />
      <line x1="8" x2="16" y1="6" y2="6" />
      <line x1="16" x2="16" y1="14" y2="18" />
      <path d="M16 10h.01" />
      <path d="M12 10h.01" />
      <path d="M8 10h.01" />
      <path d="M12 14h.01" />
      <path d="M8 14h.01" />
      <path d="M12 18h.01" />
      <path d="M8 18h.01" />
    </svg>
  )
}

// Missing icon component
function Plus(props) {
  return (
    <svg
      {...props}
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M5 12h14" />
      <path d="M12 5v14" />
    </svg>
  )
}

