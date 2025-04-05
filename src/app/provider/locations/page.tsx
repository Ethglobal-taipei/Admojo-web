"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import {
  Plus,
  Search,
  Filter,
  MapPin,
  Edit,
  Trash2,
  Eye,
  AlertTriangle,
  CheckCircle,
  Clock,
  BarChart2,
  ArrowUpDown,
  Settings,
  PlusCircle,
  XCircle,
  Hammer,
  RefreshCw,
  FileCog,
  AlertCircle,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { useRoleStore, useUserStore } from "@/lib/store"
import { useLocationStore } from "@/lib/store/useLocationStore"
import { type Location } from "@/types/location"
import { type LocationStatus, type VerificationStatus } from "@/types/location"
import { toast } from "@/lib/toast"
import RegisterLocationModal from "@/components/modals/register-location-modal"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { usePrivy } from "@privy-io/react-auth"
import { useAdContract } from "@/hooks/use-ad-contract"
import { Skeleton } from "@/components/ui/skeleton"
import { Badge } from "@/components/ui/badge"
import { 
  Dialog, 
  DialogContent, 
  DialogDescription, 
  DialogHeader, 
  DialogTitle, 
  DialogFooter,
  DialogTrigger 
} from "@/components/ui/dialog"
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuTrigger 
} from "@/components/ui/dropdown-menu"
import { Label } from "@/components/ui/label"
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs"
import { Textarea } from "@/components/ui/textarea"
import { AdContractSystem, BoothStatus } from "@/lib/AdCampaignSystem/AdCampaignSystem"
import { LocationStatusDisplay } from "@/components/campaign/LocationStatusDisplay"

export default function ProviderLocationsPage() {
  const router = useRouter()
  const { isConnected } = useUserStore()
  const { currentRole: activeRole, isProviderRegistered } = useRoleStore()
  const {
    locations,
    filteredLocations,
    filters,
    isLoading,
    fetchLocations,
    setFilters,
    applyFilters,
    clearFilters,
    setLocationStatus,
    deleteLocation,
  } = useLocationStore()
  const { authenticated, ready, user } = usePrivy()
  const { operations, adContract, isCorrectChain, switchChain } = useAdContract()
  
  const [searchQuery, setSearchQuery] = useState("")
  const [isFilterOpen, setIsFilterOpen] = useState(false)
  const [isRegisterModalOpen, setIsRegisterModalOpen] = useState(false)
  const [sortField, setSortField] = useState<keyof Location | null>(null)
  const [sortDirection, setSortDirection] = useState<"asc" | "desc">("desc")
  const [selectedStatus, setSelectedStatus] = useState<LocationStatus | "all">("all")
  const [selectedVerification, setSelectedVerification] = useState<VerificationStatus | "all">("all")
  const [filter, setFilter] = useState("all")
  const [showRegisterDialog, setShowRegisterDialog] = useState(false)
  const [locationUpdating, setLocationUpdating] = useState<number | null>(null)
  const [newLocation, setNewLocation] = useState({
    name: "",
    city: "",
    area: "",
    displaySize: "Standard",
    deviceId: ""
  })
  
  // State for campaign history modal
  const [selectedLocation, setSelectedLocation] = useState<number | null>(null)
  const [campaignHistory, setCampaignHistory] = useState<any[]>([])
  const [isLoadingHistory, setIsLoadingHistory] = useState(false)
  const [showHistoryDialog, setShowHistoryDialog] = useState(false)

  // Load locations on mount
  useEffect(() => {
    fetchLocations()
  }, [fetchLocations])

  // Redirect if not connected or not a registered provider
  useEffect(() => {
    if (!isConnected) {
      toast(
        "Connect wallet first",
        { description: "You need to connect your wallet to view your locations." },
        "warning",
      )
      router.push("/dashboard")
      return
    }

    if (isConnected && activeRole !== "provider") {
      toast(
        "Switch to provider mode",
        { description: "You need to be in provider mode to view your locations." },
        "warning",
      )
      router.push("/dashboard")
      return
    }

    if (isConnected && activeRole === "provider" && !isProviderRegistered) {
      toast(
        "Register as provider",
        { description: "You need to register as a provider to view your locations." },
        "warning",
      )
      router.push("/provider-registration")
      return
    }
  }, [isConnected, activeRole, isProviderRegistered, router])

  // Apply search filter
  useEffect(() => {
    setFilters({ searchQuery })
    applyFilters()
  }, [searchQuery, setFilters, applyFilters])

  // Apply status filter
  useEffect(() => {
    if (selectedStatus !== "all") {
      setFilters({ status: [selectedStatus] })
    } else {
      setFilters({ status: undefined })
    }
    applyFilters()
  }, [selectedStatus, setFilters, applyFilters])

  // Apply verification filter
  useEffect(() => {
    if (selectedVerification !== "all") {
      setFilters({ verificationStatus: [selectedVerification] })
    } else {
      setFilters({ verificationStatus: undefined })
    }
    applyFilters()
  }, [selectedVerification, setFilters, applyFilters])

  const handleSort = (field: keyof Location) => {
    if (sortField === field) {
      setSortDirection(sortDirection === "asc" ? "desc" : "asc")
    } else {
      setSortField(field)
      setSortDirection("asc")
    }
  }

  const sortedLocations = [...filteredLocations].sort((a, b) => {
    if (!sortField) return 0

    const fieldA = a[sortField]
    const fieldB = b[sortField]

    if (typeof fieldA === "string" && typeof fieldB === "string") {
      return sortDirection === "asc" ? fieldA.localeCompare(fieldB) : fieldB.localeCompare(fieldA)
    }

    if (typeof fieldA === "number" && typeof fieldB === "number") {
      return sortDirection === "asc" ? fieldA - fieldB : fieldB - fieldA
    }

    return 0
  })

  const handleAddLocation = () => {
    setIsRegisterModalOpen(true)
  }

  const handleEditLocation = (id: string) => {
    router.push(`/provider/locations/edit/${id}`)
  }

  const handleViewLocation = (id: string) => {
    router.push(`/provider/locations/${id}`)
  }

  const handleDeleteLocation = async (id: string) => {
    // Show confirmation dialog
    if (confirm("Are you sure you want to delete this location? This action cannot be undone.")) {
      try {
        await deleteLocation(id)
      } catch (error) {
        // Error is handled in the store action
      }
    }
  }

  const handleToggleStatus = async (id: string, currentStatus: LocationStatus) => {
    try {
      const newStatus: LocationStatus = currentStatus === "active" ? "inactive" : "active"
      await setLocationStatus(id, newStatus)
    } catch (error) {
      // Error is handled in the store action
    }
  }

  // Calculate stats
  const totalLocations = locations.length
  const activeLocations = locations.filter((loc) => loc.status === "active").length
  const totalImpressions = locations.reduce((sum, loc) => sum + loc.dailyImpressions, 0)
  const totalEarnings = locations.reduce((sum, loc) => {
    if (loc.analytics?.totalRevenue) {
      return sum + loc.analytics.totalRevenue
    }
    return sum
  }, 0)

  // Refresh locations list
  const handleRefreshLocations = async () => {
    try {
      if (!authenticated || !ready) return
      
      const privyAuth = {
        authenticated,
        ready,
        user,
        wallet: {
          address: user?.wallet?.address || "",
          provider: window.ethereum
        }
      }
      
      await fetchLocations(privyAuth)
    } catch (error) {
      console.error("Failed to refresh locations:", error)
      toast("Error", { description: "Failed to refresh locations list" }, "error")
    }
  }
  
  // Register a new booth/location
  const handleRegisterBooth = async () => {
    try {
      if (!authenticated || !adContract) {
        toast("Authentication Required", { 
          description: "Please connect your wallet to register a location" 
        }, "error")
        return
      }
      
      if (!isCorrectChain) {
        toast("Wrong Network", { 
          description: "Please switch to the correct network" 
        }, "warning")
        await switchChain()
        return
      }
      
      const deviceId = parseInt(newLocation.deviceId)
      if (isNaN(deviceId)) {
        toast("Invalid ID", { description: "Please enter a valid Device ID" }, "error")
        return
      }
      
      // Create metadata for the booth
      const boothMetadata = {
        location: `${newLocation.city}, ${newLocation.area}`.trim(),
        displaySize: newLocation.displaySize || "Standard",
        additionalInfo: ""
      }
      
      // Register the booth on the blockchain
      const hash = await operations.registerBooth.execute(deviceId, boothMetadata)
      
      if (hash) {
        toast("Location Registered", { 
          description: "Your display location has been registered successfully" 
        }, "success")
        
        // Reset form and close dialog
        setNewLocation({
          name: "",
          city: "",
          area: "",
          displaySize: "Standard",
          deviceId: ""
        })
        setShowRegisterDialog(false)
        
        // Refresh locations list
        await handleRefreshLocations()
      } else {
        throw new Error("Transaction failed")
      }
    } catch (error) {
      console.error("Failed to register booth:", error)
      toast("Registration Failed", { 
        description: "Failed to register location. Please try again." 
      }, "error")
    }
  }
  
  // Update booth status (activate, deactivate, maintenance)
  const handleUpdateStatus = async (deviceId: number, newStatus: "activate" | "deactivate" | "maintenance") => {
    try {
      setLocationUpdating(deviceId)
      
      if (!authenticated || !adContract) {
        toast("Authentication Required", { 
          description: "Please connect your wallet to update status" 
        }, "error")
        return
      }
      
      if (!isCorrectChain) {
        toast("Wrong Network", { 
          description: "Please switch to the correct network" 
        }, "warning")
        await switchChain()
        return
      }
      
      let hash
      
      switch (newStatus) {
        case "activate":
          hash = await operations.activateBooth.execute(deviceId)
          break
        case "deactivate":
          hash = await operations.deactivateBooth.execute(deviceId)
          break
        case "maintenance":
          hash = await operations.updateBoothStatus.execute(deviceId, BoothStatus.UnderMaintenance)
          break
      }
      
      if (hash) {
        toast("Status Updated", { 
          description: `Location status has been updated to ${newStatus === "maintenance" ? "maintenance" : newStatus === "activate" ? "active" : "inactive"}` 
        }, "success")
        
        // Refresh locations list
        await handleRefreshLocations()
      } else {
        throw new Error("Transaction failed")
      }
    } catch (error) {
      console.error("Failed to update status:", error)
      toast("Update Failed", { 
        description: "Failed to update location status. Please try again." 
      }, "error")
    } finally {
      setLocationUpdating(null)
    }
  }
  
  // Fetch campaign history for a location
  const handleViewCampaignHistory = async (deviceId: number) => {
    try {
      setSelectedLocation(deviceId)
      setIsLoadingHistory(true)
      setShowHistoryDialog(true)
      
      if (!authenticated || !adContract) {
        toast("Authentication Required", { 
          description: "Please connect your wallet to view history" 
        }, "error")
        return
      }
      
      const history = await adContract.getDevicePreviousCampaigns(deviceId)
      console.log("Campaign history:", history)
      
      // Transform the history data for display
      const transformedHistory = history.campaignIds.map((id, index) => ({
        id,
        advertiser: history.advertisers[index],
        metadata: history.metadatas[index],
        active: history.activeStatus[index]
      }))
      
      setCampaignHistory(transformedHistory)
    } catch (error) {
      console.error("Failed to fetch campaign history:", error)
      toast("Error", { 
        description: "Failed to load campaign history. Please try again." 
      }, "error")
    } finally {
      setIsLoadingHistory(false)
    }
  }

  return (
    <div className="container mx-auto px-4 py-8 relative">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
        <h1 className="text-3xl md:text-4xl font-black">MY LOCATIONS</h1>

        <Button
          className="bg-[#0055FF] text-white border-[4px] border-black hover:bg-[#FFCC00] hover:text-black transition-all font-bold px-6 py-3 h-auto rounded-none shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] hover:shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] hover:-translate-y-1 flex items-center gap-2"
          onClick={handleAddLocation}
        >
          <Plus className="w-5 h-5" />
          <span>Register New Location</span>
        </Button>
      </div>

      {/* Search and Filter */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
        <div className="md:col-span-2">
          <div className="relative">
            <Input
              type="text"
              placeholder="Search locations..."
              className="border-[4px] border-black rounded-none h-12 text-lg font-medium focus:border-[#0055FF] focus:ring-0 focus:translate-y-[-2px] transition-transform pl-12"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5" />
          </div>
        </div>

        <div className="md:col-span-1">
          <div className="relative">
            <Button
              variant="outline"
              className="w-full border-[4px] border-black rounded-none bg-white hover:bg-[#f5f5f5] transition-all font-bold px-4 py-2 h-12 flex items-center justify-between"
              onClick={() => setIsFilterOpen(!isFilterOpen)}
            >
              <div className="flex items-center gap-2">
                <Filter className="w-5 h-5" />
                <span>
                  Status:{" "}
                  {selectedStatus === "all" ? "All" : selectedStatus.charAt(0).toUpperCase() + selectedStatus.slice(1)}
                </span>
              </div>
            </Button>

            {isFilterOpen && (
              <div className="absolute top-full left-0 right-0 mt-2 border-[4px] border-black bg-white z-10 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">
                {["all", "active", "pending", "inactive"].map((status) => (
                  <button
                    key={status}
                    className={`w-full text-left px-4 py-3 font-bold hover:bg-[#f5f5f5] transition-colors ${
                      selectedStatus === status ? "bg-[#0055FF] text-white hover:bg-[#0055FF]" : ""
                    }`}
                    onClick={() => {
                      setSelectedStatus(status as LocationStatus | "all")
                      setIsFilterOpen(false)
                    }}
                  >
                    {status === "all" ? "All Locations" : status.charAt(0).toUpperCase() + status.slice(1)}
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>

        <div className="md:col-span-1">
          <div className="relative">
            <Button
              variant="outline"
              className="w-full border-[4px] border-black rounded-none bg-white hover:bg-[#f5f5f5] transition-all font-bold px-4 py-2 h-12 flex items-center justify-between"
              onClick={() => setIsFilterOpen(!isFilterOpen)}
            >
              <div className="flex items-center gap-2">
                <CheckCircle className="w-5 h-5" />
                <span>
                  Verification:{" "}
                  {selectedVerification === "all"
                    ? "All"
                    : selectedVerification.charAt(0).toUpperCase() + selectedVerification.slice(1)}
                </span>
              </div>
            </Button>

            {isFilterOpen && (
              <div className="absolute top-full left-0 right-0 mt-2 border-[4px] border-black bg-white z-10 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">
                {["all", "verified", "pending", "unverified", "rejected"].map((status) => (
                  <button
                    key={status}
                    className={`w-full text-left px-4 py-3 font-bold hover:bg-[#f5f5f5] transition-colors ${
                      selectedVerification === status ? "bg-[#0055FF] text-white hover:bg-[#0055FF]" : ""
                    }`}
                    onClick={() => {
                      setSelectedVerification(status as VerificationStatus | "all")
                      setIsFilterOpen(false)
                    }}
                  >
                    {status === "all" ? "All Verification" : status.charAt(0).toUpperCase() + status.slice(1)}
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
        <div className="border-[4px] border-black bg-white p-4 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] hover:shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] hover:-translate-y-1 transition-all">
          <div className="flex items-center justify-between mb-2">
            <div className="font-bold text-sm">Total Locations</div>
            <div className="w-8 h-8 bg-[#0055FF] border-[2px] border-black flex items-center justify-center text-white">
              <MapPin className="w-4 h-4" />
            </div>
          </div>
          <div className="text-3xl font-black">{totalLocations}</div>
        </div>

        <div className="border-[4px] border-black bg-white p-4 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] hover:shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] hover:-translate-y-1 transition-all">
          <div className="flex items-center justify-between mb-2">
            <div className="font-bold text-sm">Active Locations</div>
            <div className="w-8 h-8 bg-green-500 border-[2px] border-black flex items-center justify-center text-white">
              <CheckCircle className="w-4 h-4" />
            </div>
          </div>
          <div className="text-3xl font-black">{activeLocations}</div>
        </div>

        <div className="border-[4px] border-black bg-white p-4 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] hover:shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] hover:-translate-y-1 transition-all">
          <div className="flex items-center justify-between mb-2">
            <div className="font-bold text-sm">Total Impressions</div>
            <div className="w-8 h-8 bg-[#FFCC00] border-[2px] border-black flex items-center justify-center">
              <Eye className="w-4 h-4" />
            </div>
          </div>
          <div className="text-3xl font-black">{totalImpressions.toLocaleString()}</div>
        </div>

        <div className="border-[4px] border-black bg-white p-4 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] hover:shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] hover:-translate-y-1 transition-all">
          <div className="flex items-center justify-between mb-2">
            <div className="font-bold text-sm">Total Earnings</div>
            <div className="w-8 h-8 bg-[#FF3366] border-[2px] border-black flex items-center justify-center text-white">
              <BarChart2 className="w-4 h-4" />
            </div>
          </div>
          <div className="text-3xl font-black">{totalEarnings.toLocaleString()} ADC</div>
        </div>
      </div>

      {/* Locations List */}
      <div className="border-[6px] border-black bg-white shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] hover:shadow-[12px_12px_0px_0px_rgba(0,0,0,1)] transition-all duration-300">
        <div className="p-6 border-b-[4px] border-black">
          <h2 className="text-2xl font-black">Your Registered Locations</h2>
        </div>

        {isLoading ? (
          <div className="p-12 text-center">
            <div className="w-16 h-16 mx-auto mb-4 border-4 border-t-[#0055FF] border-r-[#0055FF] border-b-transparent border-l-transparent rounded-full animate-spin"></div>
            <h3 className="text-xl font-bold">Loading locations...</h3>
          </div>
        ) : sortedLocations.length === 0 ? (
          <div className="p-12 text-center">
            <div className="w-16 h-16 mx-auto mb-4 bg-[#f5f5f5] border-[4px] border-black rounded-full flex items-center justify-center">
              <MapPin className="w-8 h-8" />
            </div>
            <h3 className="text-xl font-bold mb-2">No locations found</h3>
            <p className="text-gray-500 mb-6">
              {searchQuery || selectedStatus !== "all" || selectedVerification !== "all"
                ? "Try adjusting your search or filters"
                : "Register your first advertising location to get started"}
            </p>
            <Button
              className="bg-[#0055FF] text-white border-[4px] border-black hover:bg-[#FFCC00] hover:text-black transition-all font-bold px-6 py-3 h-auto rounded-none inline-flex items-center gap-2"
              onClick={handleAddLocation}
            >
              <Plus className="w-5 h-5" />
              <span>Register New Location</span>
            </Button>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b-[4px] border-black">
                  <th className="p-4 text-left font-black">
                    <button className="flex items-center gap-1" onClick={() => handleSort("name")}>
                      Location
                      {sortField === "name" && <ArrowUpDown className="h-4 w-4" />}
                    </button>
                  </th>
                  <th className="p-4 text-left font-black">
                    <button className="flex items-center gap-1" onClick={() => handleSort("displayType")}>
                      Type
                      {sortField === "displayType" && <ArrowUpDown className="h-4 w-4" />}
                    </button>
                  </th>
                  <th className="p-4 text-left font-black">
                    <button className="flex items-center gap-1" onClick={() => handleSort("dimensions")}>
                      Dimensions
                      {sortField === "dimensions" && <ArrowUpDown className="h-4 w-4" />}
                    </button>
                  </th>
                  <th className="p-4 text-left font-black">Blockchain Status</th>
                  <th className="p-4 text-left font-black">Active Campaigns</th>
                  <th className="p-4 text-left font-black">
                    <button className="flex items-center gap-1" onClick={() => handleSort("dailyImpressions")}>
                      Impressions
                      {sortField === "dailyImpressions" && <ArrowUpDown className="h-4 w-4" />}
                    </button>
                  </th>
                  <th className="p-4 text-left font-black">
                    <button className="flex items-center gap-1" onClick={() => handleSort("analytics")}>
                      Earnings (ADC)
                      {sortField === "analytics" && <ArrowUpDown className="h-4 w-4" />}
                    </button>
                  </th>
                  <th className="p-4 text-left font-black">Actions</th>
                </tr>
              </thead>
              <tbody>
                {sortedLocations.map((location) => (
                  <tr key={location.id} className="border-b-[2px] border-black hover:bg-[#f5f5f5] transition-colors">
                    <td className="p-4">
                      <div className="font-bold">{location.name}</div>
                      <div className="text-sm flex items-center gap-1">
                        <MapPin className="w-3 h-3" />
                        {location.address}, {location.city}
                      </div>
                    </td>
                    <td className="p-4 font-medium capitalize">{location.displayType}</td>
                    <td className="p-4 font-medium">
                      {location.dimensions
                        ? `${location.dimensions.width} × ${location.dimensions.height} ${location.dimensions.unit === "meters" ? "m" : "ft"}`
                        : "N/A"}
                    </td>
                    <td className="p-4">
                      {location.deviceId ? (
                        <LocationStatusDisplay deviceId={location.deviceId} />
                      ) : (
                        <Badge variant="outline" className="bg-gray-100 text-gray-800">
                          Not Registered
                        </Badge>
                      )}
                    </td>
                    <td className="p-4">
                      {location.deviceId ? (
                        <Badge className="bg-blue-100 text-blue-800">
                          Unknown
                        </Badge>
                      ) : (
                        <Badge variant="outline" className="bg-gray-100 text-gray-800">
                          N/A
                        </Badge>
                      )}
                    </td>
                    <td className="p-4 font-bold">{location.dailyImpressions.toLocaleString()}</td>
                    <td className="p-4 font-bold">
                      {location.analytics?.totalRevenue ? location.analytics.totalRevenue.toLocaleString() : "0"}
                    </td>
                    <td className="p-4">
                      <div className="flex items-center gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          className="border-[2px] border-black rounded-none bg-white hover:bg-[#f5f5f5] transition-all h-8 w-8 p-0"
                          onClick={() => handleViewLocation(location.id.toString())}
                        >
                          <Eye className="w-4 h-4" />
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          className="border-[2px] border-black rounded-none bg-white hover:bg-[#f5f5f5] transition-all h-8 w-8 p-0"
                          onClick={() => handleEditLocation(location.id.toString())}
                        >
                          <Edit className="w-4 h-4" />
                        </Button>
                        {location.deviceId && (
                          <>
                            <Button
                              variant="outline"
                              size="sm"
                              className="border-[2px] border-black rounded-none bg-white hover:bg-[#f5f5f5] transition-all h-8 w-8 p-0"
                              disabled={locationUpdating === location.deviceId}
                              onClick={() => handleUpdateStatus(
                                location.deviceId as number, 
                                location.isActive ? "deactivate" : "activate"
                              )}
                            >
                              {locationUpdating === location.deviceId ? (
                                <RefreshCw className="w-4 h-4 animate-spin" />
                              ) : location.isActive ? (
                                <XCircle className="w-4 h-4" />
                              ) : (
                                <CheckCircle className="w-4 h-4" />
                              )}
                            </Button>
                            <Button
                              variant="outline"
                              size="sm"
                              className="border-[2px] border-black rounded-none bg-white hover:bg-[#f5f5f5] transition-all h-8 w-8 p-0"
                              disabled={locationUpdating === location.deviceId || !location.isActive}
                              onClick={() => handleUpdateStatus(location.deviceId as number, "maintenance")}
                            >
                              <Hammer className="w-4 h-4" />
                            </Button>
                          </>
                        )}
                        <Button
                          variant="outline"
                          size="sm"
                          className="border-[2px] border-black rounded-none bg-white hover:bg-[#FF3366] hover:text-white transition-all h-8 w-8 p-0"
                          onClick={() => handleDeleteLocation(location.id.toString())}
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Register Location Modal */}
      <RegisterLocationModal isOpen={isRegisterModalOpen} onClose={() => setIsRegisterModalOpen(false)} />

      {/* Register Booth Dialog */}
      <Dialog open={showRegisterDialog} onOpenChange={setShowRegisterDialog}>
        <DialogContent className="border-[4px] border-black rounded-none sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle className="text-2xl font-bold">Register New Location</DialogTitle>
            <DialogDescription>
              Add a new display location to the AdNet network.
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="name">Location Name</Label>
              <Input 
                id="name" 
                placeholder="Times Square Billboard" 
                className="border-[2px] border-black rounded-none"
                value={newLocation.name}
                onChange={(e) => setNewLocation({...newLocation, name: e.target.value})}
              />
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="city">City</Label>
                <Input 
                  id="city" 
                  placeholder="New York" 
                  className="border-[2px] border-black rounded-none"
                  value={newLocation.city}
                  onChange={(e) => setNewLocation({...newLocation, city: e.target.value})}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="area">Area/District</Label>
                <Input 
                  id="area" 
                  placeholder="Manhattan" 
                  className="border-[2px] border-black rounded-none"
                  value={newLocation.area}
                  onChange={(e) => setNewLocation({...newLocation, area: e.target.value})}
                />
              </div>
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="size">Display Size</Label>
              <select 
                id="size" 
                className="w-full border-[2px] border-black rounded-none h-10 px-3"
                value={newLocation.displaySize}
                onChange={(e) => setNewLocation({...newLocation, displaySize: e.target.value})}
              >
                <option value="Standard">Standard</option>
                <option value="Medium">Medium</option>
                <option value="Large">Large</option>
                <option value="Billboard">Billboard</option>
              </select>
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="deviceId">Device ID</Label>
              <Input 
                id="deviceId" 
                placeholder="Enter a unique numeric ID" 
                className="border-[2px] border-black rounded-none"
                value={newLocation.deviceId}
                onChange={(e) => setNewLocation({...newLocation, deviceId: e.target.value})}
              />
              <p className="text-xs text-gray-500">This is a unique identifier for your display hardware.</p>
            </div>
          </div>
          
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setShowRegisterDialog(false)}
              className="border-[2px] border-black rounded-none bg-white hover:bg-[#f5f5f5] mr-2"
            >
              Cancel
            </Button>
            <Button
              onClick={handleRegisterBooth}
              className="bg-[#0055FF] text-white border-[2px] border-black hover:bg-[#0044CC]"
            >
              Register Location
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      
      {/* Campaign History Dialog */}
      <Dialog open={showHistoryDialog} onOpenChange={setShowHistoryDialog}>
        <DialogContent className="border-[4px] border-black rounded-none sm:max-w-[600px]">
          <DialogHeader>
            <DialogTitle className="text-2xl font-bold">Campaign History</DialogTitle>
            <DialogDescription>
              Viewing campaigns for Location ID: {selectedLocation}
            </DialogDescription>
          </DialogHeader>
          
          <div className="py-4">
            {isLoadingHistory ? (
              <div className="space-y-4">
                <Skeleton className="h-16 w-full bg-gray-200" />
                <Skeleton className="h-16 w-full bg-gray-200" />
                <Skeleton className="h-16 w-full bg-gray-200" />
              </div>
            ) : campaignHistory.length === 0 ? (
              <div className="text-center py-8 border-[2px] border-dashed border-gray-300 rounded-md">
                <AlertCircle className="h-10 w-10 mx-auto mb-2 text-gray-400" />
                <p className="text-gray-500 font-medium">No campaign history found for this location</p>
              </div>
            ) : (
              <div className="space-y-4">
                {campaignHistory.map((campaign) => (
                  <div 
                    key={campaign.id} 
                    className="border-[2px] border-black p-4 rounded-none hover:bg-gray-50 transition-colors"
                  >
                    <div className="flex justify-between items-start mb-2">
                      <div className="font-medium">Campaign #{campaign.id}</div>
                      <Badge className={`${campaign.active ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'}`}>
                        {campaign.active ? 'Active' : 'Inactive'}
                      </Badge>
                    </div>
                    
                    <div className="text-sm text-gray-600 mb-2">
                      Advertiser: {campaign.advertiser.slice(0, 6)}...{campaign.advertiser.slice(-4)}
                    </div>
                    
                    <div className="text-sm">
                      <div className="font-medium">Campaign Details:</div>
                      <div className="text-gray-700">
                        {campaign.metadata.name || 'Untitled Campaign'}
                      </div>
                      {campaign.metadata.description && (
                        <div className="text-gray-600 mt-1 italic">
                          "{campaign.metadata.description}"
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
          
          <DialogFooter>
            <Button
              onClick={() => setShowHistoryDialog(false)}
              className="bg-[#0055FF] text-white border-[2px] border-black hover:bg-[#0044CC]"
            >
              Close
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}

