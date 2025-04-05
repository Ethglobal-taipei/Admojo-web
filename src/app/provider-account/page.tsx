"use client"

import { useState } from "react"
import { Settings, Download, TrendingUp, MapPin, Monitor, DollarSign, Award, Check } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Progress } from "@/components/ui/progress"
import { useUserStore, useTransactionStore } from "@/lib/store"

export default function ProviderAccountPage() {
  const [activeTab, setActiveTab] = useState("overview")

  // Get user data from the user store
  const { user, balances, stats, updateUser, updateBalances } = useUserStore()

  // Get transaction data from the transaction store
  const { filters, isFilterOpen, toggleFilterOpen, setFilter, getFilteredTransactions } = useTransactionStore()

  // Get filtered transactions
  const filteredTransactions = getFilteredTransactions()

  // Handle filter change
  const handleFilterChange = (filterType, value) => {
    setFilter(filterType, value)
  }

  return (
    <div className="container mx-auto px-4 py-8 relative">
      <div className="absolute inset-0 -z-10 bg-checkered-light opacity-30"></div>

      <div className="mb-8">
        <h1 className="text-3xl md:text-4xl font-black mb-2">PROVIDER ACCOUNT</h1>
        <p className="text-lg font-medium">Manage your display network, earnings, and settings</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-8">
        {/* Profile Card */}
        <Card className="border-[6px] border-black shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] hover:shadow-[12px_12px_0px_0px_rgba(0,0,0,1)] transition-all duration-300 relative">
          <CardHeader className="pb-4">
            <div className="flex items-center justify-between">
              <CardTitle className="text-2xl font-black">Provider Profile</CardTitle>
              <div className="px-3 py-1 bg-[#FFCC00] text-black font-bold border-[3px] border-black relative overflow-hidden">
                <span className="relative z-10">{user?.providerTier || "STANDARD"}</span>
                <span className="absolute inset-0 bg-[#FFCC00] opacity-50 animate-pulse"></span>
              </div>
            </div>
            <CardDescription>Your provider information</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex flex-col items-center mb-6">
              <Avatar className="w-24 h-24 border-[4px] border-black mb-4">
                <AvatarImage src={user?.avatar} alt={user?.name} />
                <AvatarFallback className="bg-[#FFCC00] text-black text-2xl font-black">
                  {user?.name
                    ? user.name
                        .split(" ")
                        .map((n) => n[0])
                        .join("")
                    : "?"}
                </AvatarFallback>
              </Avatar>
              <h3 className="text-xl font-bold mb-1">{user?.name || "Not Connected"}</h3>
              <p className="text-gray-600 mb-2">@{user?.username || "guest"}</p>
              <div className="flex items-center gap-2">
                <div className="px-2 py-1 bg-[#f5f5f5] border-[2px] border-black text-sm font-bold">Provider</div>
                <div className="text-sm font-medium">Since {user?.providerSince || "N/A"}</div>
              </div>
            </div>

            <div className="space-y-4">
              <div>
                <div className="font-bold mb-1">Business Name</div>
                <div className="border-[3px] border-black p-2 bg-[#f5f5f5]">
                  {user?.businessName || "Not registered"}
                </div>
              </div>

              <div>
                <div className="font-bold mb-1">Business ID</div>
                <div className="border-[3px] border-black p-2 bg-[#f5f5f5] font-mono text-sm">
                  {user?.businessId || "Not registered"}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <Button className="bg-[#0055FF] text-white border-[3px] border-black hover:bg-[#FFCC00] hover:text-black transition-all font-bold text-sm py-2 h-auto rounded-none hover:-translate-y-1 hover:shadow-[3px_3px_0px_0px_rgba(0,0,0,1)]">
                  Edit Profile
                </Button>
                <Button
                  variant="outline"
                  className="border-[3px] border-black rounded-none bg-white hover:bg-[#f5f5f5] transition-all font-bold text-sm py-2 h-auto hover:-translate-y-1 hover:shadow-[3px_3px_0px_0px_rgba(0,0,0,1)]"
                >
                  Verification
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Earnings Card */}
        <Card className="border-[6px] border-black shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] hover:shadow-[12px_12px_0px_0px_rgba(0,0,0,1)] transition-all duration-300 relative">
          <CardHeader className="pb-4">
            <CardTitle className="text-2xl font-black">Earnings</CardTitle>
            <CardDescription>Your current earnings</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="border-[4px] border-black p-4 bg-white hover:translate-y-[-2px] hover:shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] transition-all">
                <div className="flex items-center justify-between mb-1">
                  <span className="font-bold text-lg">Current Balance</span>
                  <span className="font-bold text-lg">ADC</span>
                </div>
                <div className="text-3xl font-black">12,450</div>
                <div className="text-sm">≈ 5,298 USDC</div>
              </div>

              <div className="border-[4px] border-black p-4 bg-white hover:translate-y-[-2px] hover:shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] transition-all">
                <div className="flex items-center justify-between mb-1">
                  <span className="font-bold text-lg">This Month</span>
                  <span className="font-bold text-lg">ADC</span>
                </div>
                <div className="text-3xl font-black">3,250</div>
                <div className="flex items-center gap-1 text-sm">
                  <TrendingUp className="w-4 h-4 text-green-500" />
                  <span className="text-green-500 font-bold">+12.5%</span>
                  <span>from last month</span>
                </div>
              </div>

              <div className="flex items-center justify-between border-[4px] border-black p-3 bg-[#f5f5f5] hover:bg-[#e5e5e5] transition-colors">
                <div>
                  <div className="font-bold">Next Payout</div>
                  <div className="text-lg">July 1, 2023</div>
                </div>
                <div className="px-2 py-1 bg-[#FF3366] text-white font-bold text-sm border-[2px] border-black">
                  5 DAYS
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <Button className="bg-[#0055FF] text-white border-[3px] border-black hover:bg-[#FFCC00] hover:text-black transition-all font-bold text-sm py-2 h-auto rounded-none hover:-translate-y-1 hover:shadow-[3px_3px_0px_0px_rgba(0,0,0,1)]">
                  Withdraw
                </Button>
                <Button className="bg-[#FF3366] text-white border-[3px] border-black hover:bg-[#FFCC00] hover:text-black transition-all font-bold text-sm py-2 h-auto rounded-none hover:-translate-y-1 hover:shadow-[3px_3px_0px_0px_rgba(0,0,0,1)]">
                  History
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Stats Card */}
        <Card className="border-[6px] border-black shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] hover:shadow-[12px_12px_0px_0px_rgba(0,0,0,1)] transition-all duration-300 relative">
          <CardHeader className="pb-4">
            <CardTitle className="text-2xl font-black">Display Statistics</CardTitle>
            <CardDescription>Your display network performance</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-6">
              <div>
                <div className="flex items-center justify-between mb-1">
                  <span className="font-bold">Active Displays</span>
                  <span className="font-bold">8</span>
                </div>
                <Progress value={(8 / 10) * 100} className="h-3 border-[2px] border-black [&>div]:bg-[#0055FF]" />
              </div>

              <div>
                <div className="flex items-center justify-between mb-1">
                  <span className="font-bold">Total Impressions</span>
                  <span className="font-bold">1.2M</span>
                </div>
                <Progress
                  value={(1200000 / 2000000) * 100}
                  className="h-3 border-[2px] border-black [&>div]:bg-[#FFCC00]"
                />
              </div>

              <div>
                <div className="flex items-center justify-between mb-1">
                  <span className="font-bold">Utilization Rate</span>
                  <span className="font-bold">85%</span>
                </div>
                <Progress value={85} className="h-3 border-[2px] border-black [&>div]:bg-[#FF3366]" />
              </div>

              <div>
                <div className="flex items-center justify-between mb-1">
                  <span className="font-bold">Avg. Revenue Per Display</span>
                  <span className="font-bold">1,556 ADC</span>
                </div>
                <div className="flex items-center gap-1 text-sm font-medium">
                  <span>Network Avg: 1,200 ADC</span>
                  <TrendingUp className="w-4 h-4 text-[#0055FF]" />
                  <span className="text-[#0055FF] font-bold">+29.7%</span>
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
      </div>

      {/* Tabs Section */}
      <div className="border-[6px] border-black bg-white shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] hover:shadow-[12px_12px_0px_0px_rgba(0,0,0,1)] transition-all duration-300 relative mb-8">
        <Tabs defaultValue="displays" className="w-full">
          <TabsList className="w-full grid grid-cols-4 border-b-[4px] border-black rounded-none h-auto">
            <TabsTrigger
              value="displays"
              className="data-[state=active]:bg-[#0055FF] data-[state=active]:text-white rounded-none border-r-[4px] border-black py-4 font-bold text-lg"
            >
              <Monitor className="w-5 h-5 mr-2" />
              Displays
            </TabsTrigger>
            <TabsTrigger
              value="earnings"
              className="data-[state=active]:bg-[#0055FF] data-[state=active]:text-white rounded-none border-r-[4px] border-black py-4 font-bold text-lg"
            >
              <DollarSign className="w-5 h-5 mr-2" />
              Earnings
            </TabsTrigger>
            <TabsTrigger
              value="locations"
              className="data-[state=active]:bg-[#0055FF] data-[state=active]:text-white rounded-none border-r-[4px] border-black py-4 font-bold text-lg"
            >
              <MapPin className="w-5 h-5 mr-2" />
              Locations
            </TabsTrigger>
            <TabsTrigger
              value="verification"
              className="data-[state=active]:bg-[#0055FF] data-[state=active]:text-white rounded-none py-4 font-bold text-lg"
            >
              <Award className="w-5 h-5 mr-2" />
              Verification
            </TabsTrigger>
          </TabsList>

          <TabsContent value="displays" className="p-6">
            <div className="flex flex-col md:flex-row items-start md:items-center justify-between mb-6 gap-4">
              <h2 className="text-2xl font-black relative inline-block">
                MY DISPLAY NETWORK
                <div className="absolute -bottom-2 left-0 w-full h-1 bg-[#0055FF] [clip-path:polygon(0_0,100%_0,96%_100%,4%_100%)]"></div>
              </h2>

              <div className="flex gap-2">
                <Button className="bg-[#0055FF] text-white border-[4px] border-black hover:bg-[#FFCC00] hover:text-black transition-all font-bold px-4 py-2 h-auto flex items-center gap-2 hover:-translate-y-1 hover:shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">
                  Register New Display
                </Button>
                <Button
                  variant="outline"
                  className="border-[4px] border-black rounded-none bg-white hover:bg-[#f5f5f5] transition-all font-bold px-4 py-2 h-auto flex items-center gap-2 hover:-translate-y-1 hover:shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]"
                >
                  <Download className="w-5 h-5" />
                  <span>EXPORT</span>
                </Button>
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b-[6px] border-black">
                    <th className="p-4 text-left font-black">Display Name</th>
                    <th className="p-4 text-left font-black">Location</th>
                    <th className="p-4 text-left font-black">Status</th>
                    <th className="p-4 text-left font-black">Impressions</th>
                    <th className="p-4 text-left font-black">Earnings (ADC)</th>
                    <th className="p-4 text-left font-black">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {[
                    {
                      name: "Times Square North",
                      location: "New York, NY",
                      status: "active",
                      impressions: 450000,
                      earnings: 3150,
                    },
                    {
                      name: "Downtown LA West",
                      location: "Los Angeles, CA",
                      status: "active",
                      impressions: 320000,
                      earnings: 2240,
                    },
                    {
                      name: "Chicago Transit #1",
                      location: "Chicago, IL",
                      status: "maintenance",
                      impressions: 0,
                      earnings: 0,
                    },
                    {
                      name: "Miami Beach South",
                      location: "Miami, FL",
                      status: "active",
                      impressions: 300000,
                      earnings: 2100,
                    },
                    {
                      name: "Seattle Mall Central",
                      location: "Seattle, WA",
                      status: "active",
                      impressions: 150000,
                      earnings: 1050,
                    },
                    {
                      name: "Austin Downtown",
                      location: "Austin, TX",
                      status: "pending",
                      impressions: 0,
                      earnings: 0,
                    },
                    {
                      name: "Boston Harbor",
                      location: "Boston, MA",
                      status: "active",
                      impressions: 180000,
                      earnings: 1260,
                    },
                    {
                      name: "Denver Central",
                      location: "Denver, CO",
                      status: "active",
                      impressions: 120000,
                      earnings: 840,
                    },
                  ].map((display, index) => (
                    <tr
                      key={index}
                      className={`border-b-[3px] border-black hover:bg-[#f5f5f5] transition-colors ${index % 2 === 0 ? "bg-white" : "bg-[#f9f9f9]"}`}
                    >
                      <td className="p-4 font-bold">{display.name}</td>
                      <td className="p-4">{display.location}</td>
                      <td className="p-4">
                        <span
                          className={`px-2 py-1 text-xs font-bold ${
                            display.status === "active"
                              ? "bg-green-100 text-green-800 border-[2px] border-green-800"
                              : display.status === "maintenance"
                                ? "bg-yellow-100 text-yellow-800 border-[2px] border-yellow-800"
                                : "bg-blue-100 text-blue-800 border-[2px] border-blue-800"
                          }`}
                        >
                          {display.status.toUpperCase()}
                        </span>
                      </td>
                      <td className="p-4">{display.impressions.toLocaleString()}</td>
                      <td className="p-4 font-bold">{display.earnings.toLocaleString()} ADC</td>
                      <td className="p-4">
                        <div className="flex gap-2">
                          <Button
                            variant="outline"
                            className="border-[2px] border-black rounded-none bg-white hover:bg-[#f5f5f5] transition-all font-bold text-xs px-2 py-1 h-auto hover:-translate-y-1"
                          >
                            Edit
                          </Button>
                          <Button
                            variant="outline"
                            className="border-[2px] border-[#0055FF] rounded-none bg-white hover:bg-[#0055FF] hover:text-white transition-all font-bold text-xs px-2 py-1 h-auto hover:-translate-y-1"
                          >
                            View
                          </Button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="p-4 border-t-[3px] border-black bg-[#f5f5f5] flex justify-between items-center mt-4">
              <div className="font-bold">Showing 8 displays</div>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  className="border-[3px] border-black rounded-none bg-white hover:bg-[#f5f5f5] transition-all font-bold px-3 py-1 h-auto hover:-translate-y-1 disabled:opacity-50"
                  disabled
                >
                  Previous
                </Button>
                <Button className="bg-[#0055FF] text-white border-[3px] border-black hover:bg-[#FFCC00] hover:text-black transition-all font-bold px-3 py-1 h-auto rounded-none hover:-translate-y-1 hover:shadow-[3px_3px_0px_0px_rgba(0,0,0,1)]">
                  Next
                </Button>
              </div>
            </div>
          </TabsContent>

          {/* Other tab contents */}
          <TabsContent value="earnings" className="p-6">
            {/* Earnings tab content */}
            <div className="flex flex-col md:flex-row items-start md:items-center justify-between mb-6 gap-4">
              <h2 className="text-2xl font-black relative inline-block">
                EARNINGS HISTORY
                <div className="absolute -bottom-2 left-0 w-full h-1 bg-[#FF3366] [clip-path:polygon(0_0,100%_0,96%_100%,4%_100%)]"></div>
              </h2>

              <div className="flex gap-2">
                <div className="border-[4px] border-black bg-white">
                  <select className="h-full px-4 py-2 font-bold bg-transparent focus:outline-none">
                    <option value="month">Last 30 Days</option>
                    <option value="quarter">Last 90 Days</option>
                    <option value="year">Last 365 Days</option>
                    <option value="all">All Time</option>
                  </select>
                </div>
                <Button
                  variant="outline"
                  className="border-[4px] border-black rounded-none bg-white hover:bg-[#f5f5f5] transition-all font-bold px-4 py-2 h-auto flex items-center gap-2 hover:-translate-y-1 hover:shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]"
                >
                  <Download className="w-5 h-5" />
                  <span>EXPORT</span>
                </Button>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
              <div className="border-[4px] border-black p-4 bg-[#f5f5f5]">
                <div className="text-sm font-medium">Total Earnings</div>
                <div className="text-3xl font-black">12,450 ADC</div>
                <div className="text-sm">≈ 5,298 USDC</div>
              </div>
              <div className="border-[4px] border-black p-4 bg-[#f5f5f5]">
                <div className="text-sm font-medium">This Month</div>
                <div className="text-3xl font-black">3,250 ADC</div>
                <div className="flex items-center gap-1 text-sm">
                  <TrendingUp className="w-4 h-4 text-green-500" />
                  <span className="text-green-500 font-bold">+12.5%</span>
                </div>
              </div>
              <div className="border-[4px] border-black p-4 bg-[#f5f5f5]">
                <div className="text-sm font-medium">Pending Payout</div>
                <div className="text-3xl font-black">1,850 ADC</div>
                <div className="text-sm">Next payout: July 1, 2023</div>
              </div>
            </div>

            <div className="aspect-[21/9] border-[4px] border-black p-4 bg-[#f5f5f5] mb-6">
              <div className="h-full relative">
                {/* This would be a real chart in production */}
                <div className="absolute inset-0 flex items-end p-2">
                  {[40, 65, 45, 70, 55, 80, 95, 85, 90, 75, 85, 95].map((height, index) => (
                    <div key={index} className="flex-1 mx-1" style={{ height: `${height}%` }}>
                      <div className="w-full h-full bg-[#FF3366] border-[2px] border-black"></div>
                    </div>
                  ))}
                </div>
                <div className="absolute bottom-0 left-0 w-full h-[1px] bg-black"></div>
                <div className="absolute top-0 left-0 h-full w-[1px] bg-black"></div>
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b-[6px] border-black">
                    <th className="p-4 text-left font-black">Date</th>
                    <th className="p-4 text-left font-black">Display</th>
                    <th className="p-4 text-left font-black">Impressions</th>
                    <th className="p-4 text-left font-black">Earnings (ADC)</th>
                    <th className="p-4 text-left font-black">Status</th>
                    <th className="p-4 text-left font-black">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {[
                    {
                      date: "Jun 25, 2023",
                      display: "Times Square North",
                      impressions: 15000,
                      earnings: 105,
                      status: "pending",
                    },
                    {
                      date: "Jun 24, 2023",
                      display: "Downtown LA West",
                      impressions: 12000,
                      earnings: 84,
                      status: "pending",
                    },
                    {
                      date: "Jun 23, 2023",
                      display: "Miami Beach South",
                      impressions: 10000,
                      earnings: 70,
                      status: "pending",
                    },
                    {
                      date: "Jun 22, 2023",
                      display: "Times Square North",
                      impressions: 15000,
                      earnings: 105,
                      status: "pending",
                    },
                    {
                      date: "Jun 21, 2023",
                      display: "Seattle Mall Central",
                      impressions: 5000,
                      earnings: 35,
                      status: "pending",
                    },
                    {
                      date: "Jun 20, 2023",
                      display: "Boston Harbor",
                      impressions: 6000,
                      earnings: 42,
                      status: "pending",
                    },
                    {
                      date: "Jun 19, 2023",
                      display: "Denver Central",
                      impressions: 4000,
                      earnings: 28,
                      status: "pending",
                    },
                    {
                      date: "Jun 18, 2023",
                      display: "Times Square North",
                      impressions: 15000,
                      earnings: 105,
                      status: "paid",
                    },
                  ].map((earning, index) => (
                    <tr
                      key={index}
                      className={`border-b-[3px] border-black hover:bg-[#f5f5f5] transition-colors ${index % 2 === 0 ? "bg-white" : "bg-[#f9f9f9]"}`}
                    >
                      <td className="p-4">{earning.date}</td>
                      <td className="p-4 font-bold">{earning.display}</td>
                      <td className="p-4">{earning.impressions.toLocaleString()}</td>
                      <td className="p-4 font-bold">{earning.earnings.toLocaleString()} ADC</td>
                      <td className="p-4">
                        <span
                          className={`px-2 py-1 text-xs font-bold ${
                            earning.status === "paid"
                              ? "bg-green-100 text-green-800 border-[2px] border-green-800"
                              : "bg-yellow-100 text-yellow-800 border-[2px] border-yellow-800"
                          }`}
                        >
                          {earning.status.toUpperCase()}
                        </span>
                      </td>
                      <td className="p-4">
                        <Button
                          variant="outline"
                          className="border-[2px] border-black rounded-none bg-white hover:bg-[#f5f5f5] transition-all font-bold text-xs px-2 py-1 h-auto hover:-translate-y-1"
                        >
                          Details
                        </Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </TabsContent>

          <TabsContent value="locations" className="p-6">
            {/* Locations tab content */}
            <div className="flex flex-col md:flex-row items-start md:items-center justify-between mb-6 gap-4">
              <h2 className="text-2xl font-black relative inline-block">
                MY LOCATIONS
                <div className="absolute -bottom-2 left-0 w-full h-1 bg-[#FFCC00] [clip-path:polygon(0_0,100%_0,96%_100%,4%_100%)]"></div>
              </h2>

              <Button className="bg-[#0055FF] text-white border-[4px] border-black hover:bg-[#FFCC00] hover:text-black transition-all font-bold px-4 py-2 h-auto flex items-center gap-2 hover:-translate-y-1 hover:shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">
                Register New Location
              </Button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
              {[
                {
                  name: "Times Square Building",
                  address: "1540 Broadway, New York, NY",
                  displays: 2,
                  status: "verified",
                  type: "Outdoor",
                },
                {
                  name: "LA Downtown Plaza",
                  address: "350 S Grand Ave, Los Angeles, CA",
                  displays: 1,
                  status: "verified",
                  type: "Outdoor",
                },
                {
                  name: "Chicago Transit Center",
                  address: "567 W Lake St, Chicago, IL",
                  displays: 1,
                  status: "pending",
                  type: "Transit",
                },
                {
                  name: "Miami Beach Boardwalk",
                  address: "1001 Ocean Drive, Miami, FL",
                  displays: 1,
                  status: "verified",
                  type: "Outdoor",
                },
                {
                  name: "Seattle Shopping Center",
                  address: "400 Pine St, Seattle, WA",
                  displays: 1,
                  status: "verified",
                  type: "Indoor",
                },
                {
                  name: "Austin Entertainment District",
                  address: "310 W 6th St, Austin, TX",
                  displays: 1,
                  status: "pending",
                  type: "Outdoor",
                },
              ].map((location, index) => (
                <div
                  key={index}
                  className="border-[4px] border-black bg-white hover:shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] transition-all duration-300"
                >
                  <div className="p-4 border-b-[3px] border-black bg-[#f5f5f5] flex justify-between items-center">
                    <h3 className="font-bold text-lg">{location.name}</h3>
                    <span
                      className={`px-2 py-1 text-xs font-bold ${
                        location.status === "verified"
                          ? "bg-green-100 text-green-800 border-[2px] border-green-800"
                          : "bg-yellow-100 text-yellow-800 border-[2px] border-yellow-800"
                      }`}
                    >
                      {location.status.toUpperCase()}
                    </span>
                  </div>
                  <div className="p-4">
                    <div className="mb-3">
                      <div className="text-sm font-medium">Address</div>
                      <div>{location.address}</div>
                    </div>
                    <div className="grid grid-cols-2 gap-4 mb-4">
                      <div>
                        <div className="text-sm font-medium">Type</div>
                        <div className="font-bold">{location.type}</div>
                      </div>
                      <div>
                        <div className="text-sm font-medium">Displays</div>
                        <div className="font-bold">{location.displays}</div>
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <Button className="flex-1 bg-[#0055FF] text-white border-[2px] border-black hover:bg-[#FFCC00] hover:text-black transition-all font-bold text-xs px-2 py-1 h-auto">
                        Manage
                      </Button>
                      <Button
                        variant="outline"
                        className="flex-1 border-[2px] border-black rounded-none bg-white hover:bg-[#f5f5f5] transition-all font-bold text-xs px-2 py-1 h-auto"
                      >
                        View
                      </Button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </TabsContent>

          <TabsContent value="verification" className="p-6">
            {/* Verification tab content */}
            <div className="flex flex-col md:flex-row items-start md:items-center justify-between mb-6 gap-4">
              <h2 className="text-2xl font-black relative inline-block">
                VERIFICATION STATUS
                <div className="absolute -bottom-2 left-0 w-full h-1 bg-[#0055FF] [clip-path:polygon(0_0,100%_0,96%_100%,4%_100%)]"></div>
              </h2>
            </div>

            <div className="border-[4px] border-black p-6 bg-[#f5f5f5] mb-6">
              <div className="flex items-center gap-4 mb-4">
                <div className="w-16 h-16 bg-[#FFCC00] border-[3px] border-black flex items-center justify-center">
                  <Award className="w-8 h-8" />
                </div>
                <div>
                  <h3 className="text-xl font-bold">Provider Verification Status</h3>
                  <p>Your account is verified as a Standard Provider</p>
                </div>
                <div className="ml-auto">
                  <span className="px-3 py-1 bg-green-100 text-green-800 font-bold border-[2px] border-green-800">
                    VERIFIED
                  </span>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                <div className="border-[3px] border-black p-3 bg-white">
                  <div className="font-bold mb-1">Business Verification</div>
                  <div className="flex items-center gap-2">
                    <div className="w-5 h-5 bg-green-500 rounded-full flex items-center justify-center">
                      <Check className="w-3 h-3 text-white" />
                    </div>
                    <span>Complete</span>
                  </div>
                </div>
                <div className="border-[3px] border-black p-3 bg-white">
                  <div className="font-bold mb-1">Identity Verification</div>
                  <div className="flex items-center gap-2">
                    <div className="w-5 h-5 bg-green-500 rounded-full flex items-center justify-center">
                      <Check className="w-3 h-3 text-white" />
                    </div>
                    <span>Complete</span>
                  </div>
                </div>
                <div className="border-[3px] border-black p-3 bg-white">
                  <div className="font-bold mb-1">Location Verification</div>
                  <div className="flex items-center gap-2">
                    <div className="w-5 h-5 bg-green-500 rounded-full flex items-center justify-center">
                      <Check className="w-3 h-3 text-white" />
                    </div>
                    <span>6 of 6 Verified</span>
                  </div>
                </div>
              </div>

              <div className="border-[3px] border-[#0055FF] bg-[#0055FF]/10 p-4">
                <h4 className="font-bold mb-2">Upgrade to Premium Provider</h4>
                <p className="mb-3">Unlock additional benefits and higher earnings with Premium Provider status</p>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                  <div className="flex items-center gap-2">
                    <Check className="w-5 h-5 text-[#0055FF]" />
                    <span>Priority placement in advertiser searches</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Check className="w-5 h-5 text-[#0055FF]" />
                    <span>Reduced platform fees (5% vs 8%)</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Check className="w-5 h-5 text-[#0055FF]" />
                    <span>Early access to new features</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Check className="w-5 h-5 text-[#0055FF]" />
                    <span>Dedicated account manager</span>
                  </div>
                </div>
                <Button className="bg-[#0055FF] text-white border-[3px] border-black hover:bg-[#FFCC00] hover:text-black transition-all font-bold px-4 py-2 h-auto rounded-none hover:-translate-y-1 hover:shadow-[3px_3px_0px_0px_rgba(0,0,0,1)]">
                  Apply for Premium Status
                </Button>
              </div>
            </div>

            <div className="border-[4px] border-black bg-white p-6 shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] hover:shadow-[12px_12px_0px_0px_rgba(0,0,0,1)] transition-all duration-300">
              <h3 className="text-xl font-bold mb-4">Verification Requirements</h3>

              <div className="space-y-4">
                <div className="border-b border-gray-200 pb-4">
                  <h4 className="font-bold mb-2">Business Documents</h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="flex items-center gap-2">
                      <div className="w-5 h-5 bg-green-500 rounded-full flex items-center justify-center">
                        <Check className="w-3 h-3 text-white" />
                      </div>
                      <span>Business Registration</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="w-5 h-5 bg-green-500 rounded-full flex items-center justify-center">
                        <Check className="w-3 h-3 text-white" />
                      </div>
                      <span>Tax ID Documentation</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="w-5 h-5 bg-green-500 rounded-full flex items-center justify-center">
                        <Check className="w-3 h-3 text-white" />
                      </div>
                      <span>Proof of Address</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="w-5 h-5 bg-green-500 rounded-full flex items-center justify-center">
                        <Check className="w-3 h-3 text-white" />
                      </div>
                      <span>Bank Account Information</span>
                    </div>
                  </div>
                </div>

                <div className="border-b border-gray-200 pb-4">
                  <h4 className="font-bold mb-2">Display Requirements</h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="flex items-center gap-2">
                      <div className="w-5 h-5 bg-green-500 rounded-full flex items-center justify-center">
                        <Check className="w-3 h-3 text-white" />
                      </div>
                      <span>Display Specifications</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="w-5 h-5 bg-green-500 rounded-full flex items-center justify-center">
                        <Check className="w-3 h-3 text-white" />
                      </div>
                      <span>Display Photos</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="w-5 h-5 bg-green-500 rounded-full flex items-center justify-center">
                        <Check className="w-3 h-3 text-white" />
                      </div>
                      <span>Location Proof</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="w-5 h-5 bg-green-500 rounded-full flex items-center justify-center">
                        <Check className="w-3 h-3 text-white" />
                      </div>
                      <span>Technical Compatibility</span>
                    </div>
                  </div>
                </div>

                <div>
                  <h4 className="font-bold mb-2">Additional Information</h4>
                  <p className="mb-4">
                    All verification documents are securely stored and processed according to our privacy policy.
                  </p>
                  <Button
                    variant="outline"
                    className="border-[3px] border-black rounded-none bg-white hover:bg-[#f5f5f5] transition-all font-bold px-4 py-2 h-auto hover:-translate-y-1 hover:shadow-[3px_3px_0px_0px_rgba(0,0,0,1)]"
                  >
                    View Verification Guidelines
                  </Button>
                </div>
              </div>
            </div>
          </TabsContent>
        </Tabs>
      </div>

      {/* Save Button */}
      <div className="flex justify-end">
        <Button className="bg-[#0055FF] text-white border-[6px] border-black hover:bg-[#FFCC00] hover:text-black transition-all font-bold text-xl px-8 py-6 h-auto rounded-none shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] hover:shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] hover:-translate-y-2 relative overflow-hidden group">
          <span className="relative z-10 flex items-center gap-2">
            <Settings className="w-6 h-6" />
            Save Changes
          </span>
          <span className="absolute inset-0 bg-[#FFCC00] transform scale-x-0 group-hover:scale-x-100 transition-transform duration-300 origin-left"></span>
        </Button>
      </div>
    </div>
  )
}

