"use client"

import { useState, useEffect, useRef } from "react"
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
  RefreshCw,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { useRoleStore, useUserStore } from "@/lib/store"
import { toast } from "@/lib/toast"
import RegisterLocationModal from "@/components/modals/register-location-modal"
import { useBoothRegistry } from "@/hooks/use-booth-registry"
import { useBlockchainService } from "@/hooks/use-blockchain-service"
import { Booth, BoothStatus } from "@/lib/blockchain"

export default function MyLocationsPage() {
  const router = useRouter()
  const { isConnected } = useUserStore()
  const { currentRole: activeRole, isProviderRegistered } = useRoleStore()
  const { service, address } = useBlockchainService()
  
  // Use boothRegistry hook to access blockchain data
  const { 
    getAllBooths,
    getMyProviderLocations,
    activateBooth,
    deactivateBooth,
    registerBooth,
    allBooths,
    myLocations,
    isLoadingAllBooths,
    isLoadingMyLocations
  } = useBoothRegistry()

  const [searchQuery, setSearchQuery] = useState("")
  const [filterStatus, setFilterStatus] = useState("all")
  const [isFilterOpen, setIsFilterOpen] = useState(false)
  const [isRegisterModalOpen, setIsRegisterModalOpen] = useState(false)
  const [isDeleting, setIsDeleting] = useState<string | null>(null)
  const [locations, setLocations] = useState<Booth[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<Error | null>(null)
  const [totalImpressions, setTotalImpressions] = useState(0)
  const [totalEarnings, setTotalEarnings] = useState(0)

  // Prevent infinite fetching
  const fetchedRef = useRef(false)

  // Fetch locations from blockchain
  useEffect(() => {
    if (!service || !address || fetchedRef.current) return
    
    const fetchData = async () => {
      try {
        // Fetch all locations owned by the current user
        await getMyProviderLocations()
        fetchedRef.current = true
      } catch (err) {
        console.error("Error fetching provider locations:", err)
        setError(err instanceof Error ? err : new Error("Failed to fetch locations"))
      }
    }
    
    fetchData()
  }, [service, address, getMyProviderLocations])

  // Update loading state based on blockchain loading
  useEffect(() => {
    setIsLoading(isLoadingMyLocations || isLoadingAllBooths)
  }, [isLoadingMyLocations, isLoadingAllBooths])

  // Process location data when myLocations changes
  useEffect(() => {
    if (!myLocations || !allBooths) return
    
    // Once we have location IDs, get the full booth details
    const getLocationDetails = async () => {
      try {
        // Filter all booths to only include the ones owned by the user
        const userLocations = allBooths.filter(booth => 
          myLocations.includes(booth.deviceId)
        )
        
        // Set the processed locations
        setLocations(userLocations)
        
        // Calculate metrics (simulated for now as they aren't part of the Booth type)
        const simulatedImpressions = userLocations.length * 5000
        const simulatedEarnings = simulatedImpressions * 0.01
        
        setTotalImpressions(simulatedImpressions)
        setTotalEarnings(simulatedEarnings)
        
      } catch (err) {
        console.error("Error processing location details:", err)
        setError(err instanceof Error ? err : new Error("Failed to process location details"))
      }
    }
    
    getLocationDetails()
  }, [myLocations, allBooths])

  // Redirect if not connected or not a registered provider
  const hasShownToastRef = useRef(false)

  useEffect(() => {
    if (!isConnected && !hasShownToastRef.current) {
      hasShownToastRef.current = true
      toast(
        "Connect wallet first",
        { description: "You need to connect your wallet to view your locations." },
        "warning",
      )
      router.push("/dashboard")
      return
    }

    if (isConnected && activeRole !== "provider" && !hasShownToastRef.current) {
      hasShownToastRef.current = true
      toast(
        "Switch to provider mode",
        { description: "You need to be in provider mode to view your locations." },
        "warning",
      )
      router.push("/dashboard")
      return
    }

    if (isConnected && activeRole === "provider" && !isProviderRegistered && !hasShownToastRef.current) {
      hasShownToastRef.current = true
      toast(
        "Register as provider",
        { description: "You need to register as a provider to view your locations." },
        "warning",
      )
      router.push("/provider-registration")
      return
    }

    if (isConnected) {
      // Reset the ref when connected and in the right mode
      hasShownToastRef.current = false
    }
  }, [isConnected, activeRole, isProviderRegistered, router])

  // Filter locations based on search query and status filter
  const filteredLocations = locations.filter((location) => {
    // Search filter - search in metadata fields
    const matchesSearch =
      (location.metadata?.location || "").toLowerCase().includes(searchQuery.toLowerCase()) ||
      (location.metadata?.displaySize || "").toLowerCase().includes(searchQuery.toLowerCase()) ||
      location.deviceId.toString().includes(searchQuery)

    // Status filter
    const matchesStatus = filterStatus === "all" || 
                         (filterStatus === "active" && location.active) ||
                         (filterStatus === "inactive" && !location.active)

    return matchesSearch && matchesStatus
  })

  const handleAddLocation = () => {
    setIsRegisterModalOpen(true)
  }

  const handleEditLocation = (id: string) => {
    router.push(`/my-locations/edit/${id}`)
  }

  const handleViewLocation = (id: string) => {
    router.push(`/my-locations/${id}`)
  }

  const handleToggleLocationStatus = async (locationId: string, isCurrentlyActive: boolean) => {
    try {
      const deviceId = parseInt(locationId)
      if (isCurrentlyActive) {
        // Deactivate the location
        await deactivateBooth(deviceId)
        toast("Location deactivated", { description: "Location has been deactivated successfully." }, "success")
      } else {
        // Reactivate the location
        await activateBooth(deviceId)
        toast("Location activated", { description: "Location has been activated successfully." }, "success")
      }
      
      // Refresh the location data
      fetchedRef.current = false
      await getAllBooths()
      await getMyProviderLocations()
    } catch (error) {
      console.error("Error toggling location status:", error)
      toast(
        "Error updating location", 
        { description: "There was an error updating the location status. Please try again." }, 
        "error"
      )
    }
  }

  const handleDeleteLocation = async (id: string) => {
    // Show confirmation dialog
    if (confirm("Are you sure you want to delete this location? This action cannot be undone.")) {
      try {
        setIsDeleting(id)
        toast("Unable to delete", 
          { description: "Deleting locations is not supported by the smart contract. Try deactivating it instead." }, 
          "warning"
        )
      } finally {
        setIsDeleting(null)
      }
    }
  }

  const handleRefresh = async () => {
    setIsLoading(true)
    fetchedRef.current = false
    
    try {
      await getAllBooths()
      await getMyProviderLocations()
      toast("Data refreshed", { description: "Location data has been refreshed." }, "success")
    } catch (error) {
      console.error("Error refreshing location data:", error)
      toast(
        "Error refreshing data", 
        { description: "There was an error refreshing the location data. Please try again." }, 
        "error"
      )
    }
  }

  // Handle UI displaying in the table
  const getLocationName = (location: Booth): string => {
    if (location.metadata?.location) {
      return location.metadata.location
    }
    return `Location #${location.deviceId}`
  }

  const getLocationAddress = (location: Booth): string => {
    if (location.metadata?.location) {
      return location.metadata.location
    }
    return "No address available"
  }

  const getDisplayType = (location: Booth): string => {
    if (location.metadata?.displaySize?.includes("Large")) {
      return "Billboard"
    }
    return "Display"
  }

  // Loading state
  if (isLoading && locations.length === 0) {
    return (
      <div className="container mx-auto px-4 py-8 relative">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
          <h1 className="text-3xl md:text-4xl font-black">MY LOCATIONS</h1>
        </div>
        
        <div className="border-[6px] border-black bg-white p-8 shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] text-center">
          <RefreshCw className="w-12 h-12 animate-spin mx-auto mb-4 text-[#0055FF]" />
          <p className="text-xl font-bold">Loading your locations...</p>
        </div>
      </div>
    )
  }

  // Error state
  if (error) {
    return (
      <div className="container mx-auto px-4 py-8 relative">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
          <h1 className="text-3xl md:text-4xl font-black">MY LOCATIONS</h1>
        </div>
        
        <div className="border-[6px] border-black bg-white p-8 shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] text-center">
          <AlertTriangle className="w-12 h-12 mx-auto mb-4 text-[#FF3366]" />
          <p className="text-xl font-bold mb-2">Error loading locations</p>
          <p className="mb-4">{error.message}</p>
          <Button 
            className="bg-[#0055FF] text-white border-[4px] border-black hover:bg-[#FFCC00] hover:text-black transition-all font-bold px-6 py-3 h-auto rounded-none"
            onClick={handleRefresh}
          >
            Try Again
          </Button>
        </div>
      </div>
    )
  }

  return (
    <div className="container mx-auto px-4 py-8 relative">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
        <h1 className="text-3xl md:text-4xl font-black">MY LOCATIONS</h1>

        <div className="flex gap-2">
          <Button
            variant="outline"
            className="border-[4px] border-black rounded-none bg-white hover:bg-[#f5f5f5] transition-all font-bold px-4 py-2 h-auto shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] hover:shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] hover:-translate-y-1 flex items-center gap-2"
            onClick={handleRefresh}
            disabled={isLoading}
          >
            {isLoading ? (
              <RefreshCw className="w-5 h-5 animate-spin" />
            ) : (
              <RefreshCw className="w-5 h-5" />
            )}
            <span>Refresh</span>
          </Button>

          <Button
            className="bg-[#0055FF] text-white border-[4px] border-black hover:bg-[#FFCC00] hover:text-black transition-all font-bold px-6 py-3 h-auto rounded-none shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] hover:shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] hover:-translate-y-1 flex items-center gap-2"
            onClick={handleAddLocation}
          >
            <Plus className="w-5 h-5" />
            <span>Register New Location</span>
          </Button>
        </div>
      </div>

      {/* Search and Filter */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
        <div className="md:col-span-3">
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
                  Filter:{" "}
                  {filterStatus === "all" ? "All" : filterStatus.charAt(0).toUpperCase() + filterStatus.slice(1)}
                </span>
              </div>
            </Button>

            {isFilterOpen && (
              <div className="absolute top-full left-0 right-0 mt-2 border-[4px] border-black bg-white z-10 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">
                {["all", "active", "inactive"].map((status) => (
                  <button
                    key={status}
                    className={`w-full text-left px-4 py-3 font-bold hover:bg-[#f5f5f5] transition-colors ${
                      filterStatus === status ? "bg-[#0055FF] text-white hover:bg-[#0055FF]" : ""
                    }`}
                    onClick={() => {
                      setFilterStatus(status)
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
          <div className="text-3xl font-black">{locations.length}</div>
        </div>

        <div className="border-[4px] border-black bg-white p-4 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] hover:shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] hover:-translate-y-1 transition-all">
          <div className="flex items-center justify-between mb-2">
            <div className="font-bold text-sm">Active Locations</div>
            <div className="w-8 h-8 bg-green-500 border-[2px] border-black flex items-center justify-center text-white">
              <CheckCircle className="w-4 h-4" />
            </div>
          </div>
          <div className="text-3xl font-black">{locations.filter((l) => l.active).length}</div>
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
        <div className="p-6 border-b-[4px] border-black flex justify-between items-center">
          <h2 className="text-2xl font-black">Your Registered Locations</h2>
          <div className="text-sm font-medium">
            Showing {filteredLocations.length} of {locations.length} locations
          </div>
        </div>

        {filteredLocations.length === 0 ? (
          <div className="p-12 text-center">
            <div className="w-16 h-16 mx-auto mb-4 bg-[#f5f5f5] border-[4px] border-black rounded-full flex items-center justify-center">
              <MapPin className="w-8 h-8" />
            </div>
            <h3 className="text-xl font-bold mb-2">No locations found</h3>
            <p className="text-gray-500 mb-6">
              {searchQuery || filterStatus !== "all"
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
        ) :
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b-[4px] border-black">
                  <th className="p-4 text-left font-black">Location</th>
                  <th className="p-4 text-left font-black">Type</th>
                  <th className="p-4 text-left font-black">Size</th>
                  <th className="p-4 text-left font-black">Status</th>
                  <th className="p-4 text-left font-black">Impressions</th>
                  <th className="p-4 text-left font-black">Earnings (ADC)</th>
                  <th className="p-4 text-left font-black">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredLocations.map((location) => (
                  <tr key={location.deviceId} className="border-b-[2px] border-black hover:bg-[#f5f5f5] transition-colors">
                    <td className="p-4">
                      <div className="font-bold">{getLocationName(location)}</div>
                      <div className="text-sm flex items-center gap-1">
                        <MapPin className="w-3 h-3" />
                        {getLocationAddress(location)}
                      </div>
                    </td>
                    <td className="p-4 font-medium capitalize">{getDisplayType(location)}</td>
                    <td className="p-4 font-medium">{location.metadata?.displaySize || "Unknown Size"}</td>
                    <td className="p-4">
                      <div
                        className={`px-3 py-1 inline-flex items-center gap-1 font-bold text-sm ${
                          location.active
                            ? "bg-green-500 text-white"
                            : "bg-gray-300 text-gray-700"
                        } border-[2px] border-black`}
                      >
                        {location.active ? <CheckCircle className="w-3 h-3" /> : <Clock className="w-3 h-3" />}
                        {location.active ? "ACTIVE" : "INACTIVE"}
                      </div>
                    </td>
                    <td className="p-4 font-medium">
                      {/* Generate random impressions for demo purposes */}
                      {Math.floor(Math.random() * 10000).toLocaleString()}
                    </td>
                    <td className="p-4 font-bold">
                      {/* Generate random earnings for demo purposes */}
                      ${(Math.random() * 500).toFixed(2)}
                    </td>
                    <td className="p-4">
                      <div className="flex gap-2">
                        <Button
                          size="sm"
                          variant="outline"
                          className="border-[2px] border-black rounded-none h-8 px-2 hover:bg-[#f5f5f5] transition-all"
                          onClick={() => handleViewLocation(location.deviceId.toString())}
                        >
                          <Eye className="w-4 h-4" />
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          className="border-[2px] border-black rounded-none h-8 px-2 hover:bg-[#f5f5f5] transition-all"
                          onClick={() => handleToggleLocationStatus(location.deviceId.toString(), location.active)}
                        >
                          {location.active ? (
                            <AlertTriangle className="w-4 h-4 text-[#FF3366]" />
                          ) : (
                            <CheckCircle className="w-4 h-4 text-green-500" />
                          )}
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          className="border-[2px] border-black rounded-none h-8 px-2 hover:bg-[#f5f5f5] transition-all"
                          onClick={() => handleEditLocation(location.deviceId.toString())}
                        >
                          <Edit className="w-4 h-4" />
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          className="border-[2px] border-black rounded-none h-8 px-2 hover:bg-[#f5f5f5] transition-all"
                          onClick={() => handleDeleteLocation(location.deviceId.toString())}
                          disabled={isDeleting === location.deviceId.toString()}
                        >
                          {isDeleting === location.deviceId.toString() ? (
                            <RefreshCw className="w-4 h-4 animate-spin" />
                          ) : (
                            <Trash2 className="w-4 h-4 text-[#FF3366]" />
                          )}
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        }
      </div>

      {/* Register Location Modal */}
      <RegisterLocationModal
        isOpen={isRegisterModalOpen}
        onClose={() => {
          setIsRegisterModalOpen(false)
          // Refresh data after modal is closed in case a registration happened
          handleRefresh()
        }}
      />
    </div>
  )
}

