"use client"

import { useState, useEffect } from "react"
import { Shield, Wallet, Clock, Settings, ChevronDown, Download, Filter, TrendingDown, Save, AlertCircle, Loader } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Progress } from "@/components/ui/progress"
import { useUserStore, useTransactionStore } from "@/lib/store"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Checkbox } from "@/components/ui/checkbox"
import { Alert, AlertTitle, AlertDescription } from "@/components/ui/alert"
import { Switch } from "@/components/ui/switch"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"

// Define profile form types
interface ProfileFormData {
  name: string;
  username: string;
  email: string;
}

// Define password form types
interface PasswordFormData {
  currentPassword: string;
  newPassword: string;
  confirmPassword: string;
}

export default function AccountPage() {
  const [activeTab, setActiveTab] = useState("transactions")
  const [isEditing, setIsEditing] = useState(false)
  const [showPasswordDialog, setShowPasswordDialog] = useState(false)
  const [isSettingsChanged, setIsSettingsChanged] = useState(false)
  const [formError, setFormError] = useState("")
  
  // Forms
  const [profileForm, setProfileForm] = useState<ProfileFormData>({
    name: "",
    username: "",
    email: "",
  })
  
  const [passwordForm, setPasswordForm] = useState<PasswordFormData>({
    currentPassword: "",
    newPassword: "",
    confirmPassword: "",
  })

  // Get user data from the user store
  const { 
    user, 
    balances, 
    stats, 
    updateUser, 
    isLoading: userLoading, 
    error: userError,
    clearError: clearUserError,
    notificationSettings,
    privacySettings,
    updateSettings
  } = useUserStore()

  // Get transaction data from the transaction store
  const { 
    filters, 
    isFilterOpen, 
    toggleFilterOpen, 
    setFilter,
    fetchTransactions,
    exportTransactions,
    isLoading: transactionsLoading,
    error: transactionsError,
    clearError: clearTransactionsError,
    getCurrentPageTransactions,
    nextPage,
    previousPage,
    currentPage,
    totalPages
  } = useTransactionStore()

  // Get filtered transactions
  const transactions = getCurrentPageTransactions()
  
  // Initialize form data when user is loaded
  useEffect(() => {
    if (user) {
      setProfileForm({
        name: user.name || "",
        username: user.username || "",
        email: user.email || "",
      })
    }
  }, [user])
  
  // Fetch transactions when component mounts or filters change
  useEffect(() => {
    if (user?.walletAddress) {
      fetchTransactions(user.walletAddress)
    }
  }, [user?.walletAddress, filters, fetchTransactions])
  
  // Handle form input changes
  const handleProfileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setProfileForm({
      ...profileForm,
      [e.target.name]: e.target.value,
    })
  }
  
  const handlePasswordChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setPasswordForm({
      ...passwordForm,
      [e.target.name]: e.target.value,
    })
  }
  
  // Handle notification and privacy setting changes
  const handleSettingChange = (setting: string, category: 'notification' | 'privacy', value: boolean) => {
    setIsSettingsChanged(true)
    if (category === 'notification') {
      updateSettings({
        notificationSettings: { [setting]: value }
      })
    } else {
      updateSettings({
        privacySettings: { [setting]: value }
      })
    }
  }
  
  // Handle saving profile changes
  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault()
    setFormError("")
    
    // Simple validation
    if (!profileForm.name.trim()) {
      setFormError("Name is required")
      return
    }
    
    // Email can be empty with Privy, but if provided must be valid
    if (profileForm.email.trim() && !profileForm.email.includes('@')) {
      setFormError("Valid email is required")
      return
    }
    
    // Save profile changes
    await updateUser({
      name: profileForm.name,
      username: profileForm.username,
      email: profileForm.email,
    })
    
    setIsEditing(false)
  }
  
  // We're no longer using password change with Privy
  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault()
    setFormError("Password change is not supported with Privy authentication")
  }
  
  // Handle export transactions
  const handleExportTransactions = async () => {
    if (user?.walletAddress) {
      await exportTransactions(user.walletAddress)
    }
  }

  // Handle filter change
  const handleFilterChange = (filterType: keyof typeof filters, value: string) => {
    setFilter(filterType, value)
  }

  return (
    <div className="container mx-auto px-4 py-8 relative">
      <div className="absolute inset-0 -z-10 bg-checkered-light opacity-30"></div>

      <div className="mb-8">
        <h1 className="text-3xl md:text-4xl font-black mb-2">MY ACCOUNT</h1>
        <p className="text-lg font-medium">Manage your profile, transactions, and settings</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-8">
        {/* Profile Card */}
        <Card className="border-[6px] border-black shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] hover:shadow-[12px_12px_0px_0px_rgba(0,0,0,1)] transition-all duration-300 relative">
          <CardHeader className="pb-4">
            <div className="flex items-center justify-between">
              <CardTitle className="text-2xl font-black">Profile</CardTitle>
              <div className="px-3 py-1 bg-[#0055FF] text-white font-bold border-[3px] border-black relative overflow-hidden">
                <span className="relative z-10">{user?.tier}</span>
                <span className="absolute inset-0 bg-[#0055FF] opacity-50 animate-pulse"></span>
              </div>
            </div>
            <CardDescription>Your personal information</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex flex-col items-center mb-6">
              <Avatar className="w-24 h-24 border-[4px] border-black mb-4">
                <AvatarImage src={user?.avatar} alt={user?.name || "User"} />
                <AvatarFallback className="bg-[#FFCC00] text-black text-2xl font-black">
                  {user && user.name
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
                <div className="px-2 py-1 bg-[#f5f5f5] border-[2px] border-black text-sm font-bold">
                  {user?.role || "Guest"}
                </div>
                <div className="text-sm font-medium">Member since {user?.memberSince || "N/A"}</div>
              </div>
            </div>

            <div className="space-y-4">
              <div>
                <div className="font-bold mb-1">Email</div>
                <div className="border-[3px] border-black p-2 bg-[#f5f5f5]">{user?.email || "Not connected"}</div>
              </div>

              <div>
                <div className="font-bold mb-1">Wallet Address</div>
                <div className="border-[3px] border-black p-2 bg-[#f5f5f5] font-mono text-sm truncate">
                  {user?.walletAddress || "Not connected"}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <Button 
                  className="bg-[#0055FF] text-white border-[3px] border-black hover:bg-[#FFCC00] hover:text-black transition-all font-bold text-sm py-2 h-auto rounded-none hover:-translate-y-1 hover:shadow-[3px_3px_0px_0px_rgba(0,0,0,1)]"
                  onClick={() => setIsEditing(true)}
                >
                  Edit Profile
                </Button>
                <div></div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Balances Card */}
        <Card className="border-[6px] border-black shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] hover:shadow-[12px_12px_0px_0px_rgba(0,0,0,1)] transition-all duration-300 relative">
          <CardHeader className="pb-4">
            <CardTitle className="text-2xl font-black">Balances</CardTitle>
            <CardDescription>Your current token balances</CardDescription>
          </CardHeader>
          <CardContent>
            {userLoading ? (
              <div className="flex flex-col items-center justify-center py-8">
                <Loader className="w-8 h-8 animate-spin text-[#0055FF] mb-2" />
                <p className="text-sm">Loading balances...</p>
              </div>
            ) : (
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
            )}
          </CardContent>
        </Card>

        {/* Stats Card */}
        <Card className="border-[6px] border-black shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] hover:shadow-[12px_12px_0px_0px_rgba(0,0,0,1)] transition-all duration-300 relative">
          <CardHeader className="pb-4">
            <CardTitle className="text-2xl font-black">Statistics</CardTitle>
            <CardDescription>Your account activity</CardDescription>
          </CardHeader>
          <CardContent>
            {userLoading ? (
              <div className="flex flex-col items-center justify-center py-8">
                <Loader className="w-8 h-8 animate-spin text-[#0055FF] mb-2" />
                <p className="text-sm">Loading statistics...</p>
              </div>
            ) : (
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
            )}
          </CardContent>
        </Card>
      </div>

      {/* Tabs Section */}
      <div className="border-[6px] border-black bg-white shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] hover:shadow-[12px_12px_0px_0px_rgba(0,0,0,1)] transition-all duration-300 relative mb-8">
        <Tabs defaultValue="transactions" onValueChange={(value) => setActiveTab(value)} className="w-full">
          <TabsList className="w-full grid grid-cols-4 border-b-[4px] border-black rounded-none h-auto">
            <TabsTrigger
              value="transactions"
              className="data-[state=active]:bg-[#0055FF] data-[state=active]:text-white rounded-none border-r-[4px] border-black py-4 font-bold text-lg"
            >
              <Wallet className="w-5 h-5 mr-2" />
              Transactions
            </TabsTrigger>
            <TabsTrigger
              value="security"
              className="data-[state=active]:bg-[#0055FF] data-[state=active]:text-white rounded-none border-r-[4px] border-black py-4 font-bold text-lg"
            >
              <Shield className="w-5 h-5 mr-2" />
              Security
            </TabsTrigger>
            <TabsTrigger
              value="history"
              className="data-[state=active]:bg-[#0055FF] data-[state=active]:text-white rounded-none border-r-[4px] border-black py-4 font-bold text-lg"
            >
              <Clock className="w-5 h-5 mr-2" />
              Login History
            </TabsTrigger>
            <TabsTrigger
              value="settings"
              className="data-[state=active]:bg-[#0055FF] data-[state=active]:text-white rounded-none py-4 font-bold text-lg"
            >
              <Settings className="w-5 h-5 mr-2" />
              Settings
            </TabsTrigger>
          </TabsList>

          <TabsContent value="transactions" className="p-6">
            <div className="flex flex-col md:flex-row items-start md:items-center justify-between mb-6 gap-4">
              <h2 className="text-2xl font-black relative inline-block">
                TRANSACTION HISTORY
                <div className="absolute -bottom-2 left-0 w-full h-1 bg-[#FF3366] [clip-path:polygon(0_0,100%_0,96%_100%,4%_100%)]"></div>
              </h2>

              <div className="flex gap-2">
                <div className="relative">
                  <Button
                    variant="outline"
                    className="border-[4px] border-black rounded-none bg-white hover:bg-[#FFCC00] transition-all font-bold px-4 py-2 h-auto flex items-center gap-2 hover:-translate-y-1 hover:shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]"
                    onClick={toggleFilterOpen}
                  >
                    <Filter className="w-5 h-5" />
                    <span>FILTER</span>
                    <ChevronDown className={`w-5 h-5 transition-transform ${isFilterOpen ? "rotate-180" : ""}`} />
                  </Button>

                  {isFilterOpen && (
                    <div className="absolute right-0 top-full mt-2 w-64 bg-white border-[4px] border-black shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] z-20">
                      <div className="p-4">
                        <div className="mb-4">
                          <h3 className="font-bold mb-2">Transaction Type</h3>
                          <div className="grid grid-cols-2 gap-2">
                            {["all", "deposit", "swap", "allocation", "reallocation", "withdrawal"].map((option) => (
                              <button
                                key={option}
                                className={`border-[2px] border-black px-2 py-1 font-bold text-xs transition-all hover:-translate-y-1 ${filters.type === option ? "bg-[#0055FF] text-white" : "bg-white hover:bg-[#f5f5f5]"}`}
                                onClick={() => handleFilterChange("type", option)}
                              >
                                {option === "all" ? "ALL" : option.toUpperCase()}
                              </button>
                            ))}
                          </div>
                        </div>

                        <div className="mb-4">
                          <h3 className="font-bold mb-2">Token</h3>
                          <div className="grid grid-cols-3 gap-2">
                            {["all", "USDC", "ADC"].map((option) => (
                              <button
                                key={option}
                                className={`border-[2px] border-black px-2 py-1 font-bold text-xs transition-all hover:-translate-y-1 ${filters.token === option ? "bg-[#0055FF] text-white" : "bg-white hover:bg-[#f5f5f5]"}`}
                                onClick={() => handleFilterChange("token", option)}
                              >
                                {option === "all" ? "ALL" : option}
                              </button>
                            ))}
                          </div>
                        </div>

                        <div>
                          <h3 className="font-bold mb-2">Status</h3>
                          <div className="grid grid-cols-3 gap-2">
                            {["all", "completed", "pending"].map((option) => (
                              <button
                                key={option}
                                className={`border-[2px] border-black px-2 py-1 font-bold text-xs transition-all hover:-translate-y-1 ${filters.status === option ? "bg-[#0055FF] text-white" : "bg-white hover:bg-[#f5f5f5]"}`}
                                onClick={() => handleFilterChange("status", option)}
                              >
                                {option === "all" ? "ALL" : option.toUpperCase()}
                              </button>
                            ))}
                          </div>
                        </div>
                      </div>
                    </div>
                  )}
                </div>

                <Button
                  variant="outline"
                  className="border-[4px] border-black rounded-none bg-white hover:bg-[#f5f5f5] transition-all font-bold px-4 py-2 h-auto flex items-center gap-2 hover:-translate-y-1 hover:shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]"
                  onClick={handleExportTransactions}
                  disabled={transactionsLoading}
                >
                  {transactionsLoading ? (
                    <Loader className="w-5 h-5 animate-spin" />
                  ) : (
                  <Download className="w-5 h-5" />
                  )}
                  <span>EXPORT</span>
                </Button>
              </div>
            </div>

            {transactionsLoading ? (
              <div className="flex flex-col items-center justify-center py-16">
                <Loader className="w-12 h-12 animate-spin text-[#0055FF] mb-4" />
                <p className="text-lg font-bold">Loading transactions...</p>
              </div>
            ) : transactions.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-16 text-center">
                <div className="w-16 h-16 bg-[#f5f5f5] rounded-full flex items-center justify-center mb-4 border-[3px] border-black">
                  <Wallet className="w-8 h-8 text-gray-500" />
                </div>
                <h3 className="text-xl font-bold mb-2">No transactions found</h3>
                <p className="text-gray-500 max-w-md">
                  {filters.type !== "all" || filters.token !== "all" || filters.status !== "all"
                    ? "Try changing your filters to see more transactions."
                    : "Start using the platform to see your transactions here."}
                </p>
              </div>
            ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b-[6px] border-black">
                    <th className="p-4 text-left font-black">Type</th>
                    <th className="p-4 text-left font-black">Amount</th>
                    <th className="p-4 text-left font-black">Status</th>
                    <th className="p-4 text-left font-black">Timestamp</th>
                    <th className="p-4 text-left font-black">Transaction Hash</th>
                    <th className="p-4 text-left font-black">Actions</th>
                  </tr>
                </thead>
                <tbody>
                    {transactions.map((tx, index) => (
                    <tr
                      key={tx.id}
                      className={`border-b-[3px] border-black hover:bg-[#f5f5f5] transition-colors ${index % 2 === 0 ? "bg-white" : "bg-[#f9f9f9]"}`}
                    >
                      <td className="p-4">
                        <div className="flex items-center gap-2">
                          <div
                            className={`w-3 h-3 rounded-full ${
                              tx.type === "deposit"
                                ? "bg-[#0055FF]"
                                : tx.type === "withdrawal"
                                  ? "bg-[#FF3366]"
                                  : tx.type === "swap"
                                    ? "bg-[#FFCC00]"
                                    : "bg-green-500"
                            }`}
                          ></div>
                          <span className="font-bold capitalize">{tx.type}</span>
                        </div>
                      </td>
                      <td className="p-4 font-bold">
                        {tx.type === "withdrawal" ? "-" : "+"}
                        {tx.amount.toLocaleString()} {tx.token}
                      </td>
                      <td className="p-4">
                        <span
                          className={`px-2 py-1 text-xs font-bold ${
                            tx.status === "completed"
                              ? "bg-green-100 text-green-800 border-[2px] border-green-800"
                              : "bg-yellow-100 text-yellow-800 border-[2px] border-yellow-800"
                          }`}
                        >
                          {tx.status.toUpperCase()}
                        </span>
                      </td>
                      <td className="p-4 font-medium">{tx.timestamp}</td>
                      <td className="p-4 font-mono text-sm">{tx.txHash}</td>
                      <td className="p-4">
                        <Button
                          variant="outline"
                          className="border-[2px] border-black rounded-none bg-white hover:bg-[#f5f5f5] transition-all font-bold text-xs px-2 py-1 h-auto hover:-translate-y-1"
                        >
                          View
                        </Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            )}

            <div className="p-4 border-t-[3px] border-black bg-[#f5f5f5] flex justify-between items-center mt-4">
              <div className="font-bold">
                Showing page {currentPage} of {totalPages}
              </div>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  className="border-[3px] border-black rounded-none bg-white hover:bg-[#f5f5f5] transition-all font-bold px-3 py-1 h-auto hover:-translate-y-1 disabled:opacity-50"
                  onClick={previousPage}
                  disabled={currentPage === 1 || transactionsLoading}
                >
                  Previous
                </Button>
                <Button 
                  className="bg-[#0055FF] text-white border-[3px] border-black hover:bg-[#FFCC00] hover:text-black transition-all font-bold px-3 py-1 h-auto rounded-none hover:-translate-y-1 hover:shadow-[3px_3px_0px_0px_rgba(0,0,0,1)] disabled:opacity-50"
                  onClick={nextPage}
                  disabled={currentPage === totalPages || transactionsLoading}
                >
                  Next
                </Button>
              </div>
            </div>
          </TabsContent>

          <TabsContent value="security" className="p-6">
            <h2 className="text-2xl font-black mb-6 relative inline-block">
              ACCOUNT SECURITY
              <div className="absolute -bottom-2 left-0 w-full h-1 bg-[#FF3366] [clip-path:polygon(0_0,100%_0,96%_100%,4%_100%)]"></div>
            </h2>

            <div className="grid gap-6">
              <Card className="border-[4px] border-black">
                <CardHeader className="pb-3">
                  <CardTitle>Connected Wallets</CardTitle>
                  <CardDescription>
                    Manage your connected wallet addresses
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {user?.linkedWallets && user.linkedWallets.map((wallet, index) => (
                      <div key={index} className="border-[3px] border-black p-3 bg-[#f5f5f5]">
                        <div className="flex items-center justify-between">
                          <div className="font-mono text-sm truncate">{wallet.address}</div>
                          <div className="px-2 py-1 bg-[#FFCC00] text-black font-bold text-sm border-[2px] border-black">
                            {wallet.type || "External"}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="history" className="p-6">
            <h2 className="text-2xl font-black mb-6 relative inline-block">
              LOGIN HISTORY
              <div className="absolute -bottom-2 left-0 w-full h-1 bg-[#FFCC00] [clip-path:polygon(0_0,100%_0,96%_100%,4%_100%)]"></div>
            </h2>
            
            <div className="border-[4px] border-black bg-white mb-6">
              <table className="w-full">
                <thead>
                  <tr className="border-b-[4px] border-black">
                    <th className="p-4 text-left font-black">Date & Time</th>
                    <th className="p-4 text-left font-black">IP Address</th>
                    <th className="p-4 text-left font-black">Device</th>
                    <th className="p-4 text-left font-black">Location</th>
                    <th className="p-4 text-left font-black">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {[
                    { 
                      date: "Today, 08:45 AM", 
                      ip: "198.51.100.42", 
                      device: "Chrome on Windows", 
                      location: "New York, US", 
                      status: "success" 
                    },
                    { 
                      date: "Yesterday, 17:32 PM", 
                      ip: "198.51.100.42", 
                      device: "Safari on iPhone", 
                      location: "New York, US", 
                      status: "success" 
                    },
                    { 
                      date: "May 2, 2023, 14:15 PM", 
                      ip: "203.0.113.89", 
                      device: "Chrome on Windows", 
                      location: "Chicago, US", 
                      status: "success" 
                    },
                    { 
                      date: "May 1, 2023, 09:22 AM", 
                      ip: "198.51.100.42", 
                      device: "Firefox on MacOS", 
                      location: "New York, US", 
                      status: "success" 
                    },
                    { 
                      date: "Apr 30, 2023, 19:54 PM", 
                      ip: "209.85.115.21", 
                      device: "Chrome on Android", 
                      location: "Seattle, US", 
                      status: "failed" 
                    },
                  ].map((login, index) => (
                    <tr key={index} className={`border-b-[2px] border-black hover:bg-[#f5f5f5] transition-colors ${index % 2 === 0 ? "bg-white" : "bg-[#f9f9f9]"}`}>
                      <td className="p-4 font-medium">{login.date}</td>
                      <td className="p-4 font-mono text-sm">{login.ip}</td>
                      <td className="p-4">{login.device}</td>
                      <td className="p-4">{login.location}</td>
                      <td className="p-4">
                        <span className={`px-2 py-1 text-xs font-bold ${
                          login.status === "success" 
                            ? "bg-green-100 text-green-800 border-[2px] border-green-800" 
                            : "bg-red-100 text-red-800 border-[2px] border-red-800"
                        }`}>
                          {login.status === "success" ? "SUCCESS" : "FAILED"}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </TabsContent>

          <TabsContent value="settings" className="p-6">
            <h2 className="text-2xl font-black mb-6 relative inline-block">
              ACCOUNT SETTINGS
              <div className="absolute -bottom-2 left-0 w-full h-1 bg-[#FF3366] [clip-path:polygon(0_0,100%_0,96%_100%,4%_100%)]"></div>
            </h2>
            
            <div className="space-y-8">
              <div className="border-[4px] border-black p-6 bg-white">
                <h3 className="text-xl font-bold mb-4">Notification Settings</h3>
                <p className="mb-6 text-gray-600">Manage how you receive notifications from AdNet.</p>
                
                <div className="space-y-4">
                  {[
                    { id: "emailNotifications", label: "Email Notifications", description: "Receive important account updates via email" },
                    { id: "pushNotifications", label: "Push Notifications", description: "Get real-time alerts on your device" },
                    { id: "marketingEmails", label: "Marketing Emails", description: "Receive news about new features and offers" },
                    { id: "transactionAlerts", label: "Transaction Alerts", description: "Be notified about all transactions" },
                    { id: "campaignUpdates", label: "Campaign Updates", description: "Receive updates about your campaign performance" },
                  ].map((setting) => (
                    <div key={setting.id} className="flex items-center justify-between p-4 border-[3px] border-black bg-[#f5f5f5]">
                      <div>
                        <p className="font-bold">{setting.label}</p>
                        <p className="text-sm text-gray-600">{setting.description}</p>
                      </div>
                      <Switch 
                        id={setting.id}
                        checked={notificationSettings[setting.id] || false}
                        onCheckedChange={(checked) => handleSettingChange(setting.id, 'notification', checked)}
                        className="data-[state=checked]:bg-[#0055FF]"
                      />
                    </div>
                  ))}
                </div>
              </div>
              
              <div className="border-[4px] border-black p-6 bg-white">
                <h3 className="text-xl font-bold mb-4">Privacy Settings</h3>
                <p className="mb-6 text-gray-600">Control your privacy and data usage preferences.</p>
                
                <div className="space-y-4">
                  {[
                    { id: "showProfile", label: "Show Profile", description: "Allow others to view your public profile" },
                    { id: "showActivity", label: "Show Activity", description: "Display your activity in the network" },
                    { id: "allowDataCollection", label: "Allow Data Collection", description: "Enable analytics to improve your experience" },
                    { id: "showWalletBalance", label: "Show Wallet Balance", description: "Display your wallet balance to other users" },
                  ].map((setting) => (
                    <div key={setting.id} className="flex items-center justify-between p-4 border-[3px] border-black bg-[#f5f5f5]">
                      <div>
                        <p className="font-bold">{setting.label}</p>
                        <p className="text-sm text-gray-600">{setting.description}</p>
                      </div>
                      <Switch 
                        id={setting.id}
                        checked={privacySettings[setting.id] || false}
                        onCheckedChange={(checked) => handleSettingChange(setting.id, 'privacy', checked)}
                        className="data-[state=checked]:bg-[#0055FF]"
                      />
                    </div>
                  ))}
                </div>
              </div>
              
              <div className="border-[4px] border-black p-6 bg-white">
                <h3 className="text-xl font-bold mb-4">Danger Zone</h3>
                <p className="mb-6 text-gray-600">Permanent actions that affect your account.</p>
                
                <div className="space-y-4">
                  <div className="p-4 border-[3px] border-red-200 bg-red-50">
                    <h4 className="font-bold text-red-800 mb-2">Delete Account</h4>
                    <p className="text-sm text-red-600 mb-4">This action is permanent and cannot be undone. All your data will be permanently removed.</p>
                    <Button className="bg-red-600 text-white border-[3px] border-black hover:bg-red-700 transition-all font-bold text-sm px-4 py-2 h-auto rounded-none hover:-translate-y-1 hover:shadow-[3px_3px_0px_0px_rgba(0,0,0,1)]">
                      Delete My Account
                    </Button>
                  </div>
                </div>
              </div>
            </div>
          </TabsContent>
        </Tabs>
      </div>

      {/* Save Button - Only show when changes need to be saved */}
      {isSettingsChanged && (
      <div className="flex justify-end">
          <Button 
            disabled={userLoading}
            className="bg-[#0055FF] text-white border-[6px] border-black hover:bg-[#FFCC00] hover:text-black transition-all font-bold text-xl px-8 py-6 h-auto rounded-none shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] hover:shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] hover:-translate-y-2 relative overflow-hidden group"
          >
          <span className="relative z-10 flex items-center gap-2">
              {userLoading ? (
                <Loader className="w-6 h-6 animate-spin" />
              ) : (
            <Settings className="w-6 h-6" />
              )}
            Save Changes
          </span>
          <span className="absolute inset-0 bg-[#FFCC00] transform scale-x-0 group-hover:scale-x-100 transition-transform duration-300 origin-left"></span>
        </Button>
      </div>
      )}

      {/* Edit Profile Dialog */}
      <Dialog open={isEditing} onOpenChange={setIsEditing}>
        <DialogContent className="border-[6px] border-black shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] max-w-md mx-auto">
          <DialogHeader>
            <DialogTitle className="text-2xl font-black">Edit Profile</DialogTitle>
            <DialogDescription>Update your personal information</DialogDescription>
          </DialogHeader>

          <form onSubmit={handleSaveProfile} className="space-y-4">
            <div>
              <Label htmlFor="name" className="font-bold">Name</Label>
              <Input
                id="name"
                name="name"
                value={profileForm.name}
                onChange={handleProfileChange}
                className="border-[3px] border-black rounded-none focus-visible:ring-[#0055FF] focus-visible:ring-offset-2"
              />
            </div>

            <div>
              <Label htmlFor="username" className="font-bold">Username</Label>
              <Input
                id="username"
                name="username"
                value={profileForm.username}
                onChange={handleProfileChange}
                className="border-[3px] border-black rounded-none focus-visible:ring-[#0055FF] focus-visible:ring-offset-2"
              />
            </div>

            <div>
              <Label htmlFor="email" className="font-bold">Email</Label>
              <Input
                id="email"
                name="email"
                type="email"
                value={profileForm.email}
                onChange={handleProfileChange}
                className="border-[3px] border-black rounded-none focus-visible:ring-[#0055FF] focus-visible:ring-offset-2"
              />
            </div>

            {formError && (
              <Alert variant="destructive" className="border-[3px] border-black bg-[#FF3366] text-white rounded-none">
                <AlertCircle className="h-4 w-4" />
                <AlertTitle className="text-white">Error</AlertTitle>
                <AlertDescription className="text-white">
                  {formError}
                </AlertDescription>
              </Alert>
            )}

            <div className="grid grid-cols-2 gap-3 pt-4">
              <Button
                type="submit"
                className="bg-[#0055FF] text-white border-[3px] border-black hover:bg-[#FFCC00] hover:text-black transition-all font-bold text-sm py-2 h-auto rounded-none"
              >
                Save Changes
              </Button>
              <Button
                type="button"
                variant="outline"
                onClick={() => setIsEditing(false)}
                className="border-[3px] border-black rounded-none bg-white hover:bg-[#f5f5f5] transition-all font-bold text-sm py-2 h-auto"
              >
                Cancel
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  )
}

