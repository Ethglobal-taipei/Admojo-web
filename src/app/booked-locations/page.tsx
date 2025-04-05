"use client"

import React, { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import {
  ArrowLeft,
  MapPin,
  Plus,
  Filter,
  Search,
  DollarSign,
  Building,
  Eye,
  Users,
  X,
  ChevronRight,
  PlusCircle,
  LoaderCircle,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from "@/components/ui/select"
import { useLocationStore, Location } from "@/lib/store/useLocationStore"
import { useCampaignStore } from "@/lib/store/useCampaignStore"
import { useBoothRegistry } from "@/hooks/use-booth-registry"
import { useBlockchainService } from "@/hooks/use-blockchain-service"
import { Campaign } from "@/lib/blockchain"
import { toast } from "@/lib/toast"
import Image from "next/image"

export default function BookedLocationsPage() {
  const router = useRouter()
  const { bookedLocations, removeBookedLocation, clearBookedLocations } = useLocationStore()
  const { campaigns: localCampaigns, updateDraftCampaign } = useCampaignStore()
  const { service, isCorrectChain, switchChain } = useBlockchainService()
  
  // Get booth registry hooks for blockchain campaigns
  const {
    getAllCampaigns,
    getMyAdvertiserCampaigns,
    getCampaignDetails,
    addLocationToCampaign,
    isAddingLocation,
    allCampaigns,
    myCampaigns,
    isLoadingAllCampaigns,
    isLoadingMyCampaigns,
  } = useBoothRegistry()
  
  const [searchTerm, setSearchTerm] = useState("")
  const [selectedFilter, setSelectedFilter] = useState("all")
  const [filteredLocations, setFilteredLocations] = useState(bookedLocations)
  
  // Campaign state
  const [blockchainCampaigns, setBlockchainCampaigns] = useState<Campaign[]>([])
  const [isLoadingCampaigns, setIsLoadingCampaigns] = useState(true)
  
  // State for handling the campaign selection modal
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [selectedLocation, setSelectedLocation] = useState<Location | null>(null)
  const [isAddingToBlockchain, setIsAddingToBlockchain] = useState(false)
  
  // State for locations saved for future campaigns
  const [savedForFuture, setSavedForFuture] = useState<Location[]>([])
  
  // Add a ref to track if campaigns have been fetched
  const campaignsFetched = React.useRef(false);
  const lastFetchTime = React.useRef(0);
  const FETCH_COOLDOWN = 30000; // 30 seconds cooldown between fetches
  
  // Prefetch campaign data on component mount - this happens once when page loads
  useEffect(() => {
    let isMounted = true;
    
    const prefetchCampaignData = async () => {
      if (!service || campaignsFetched.current) return;
      
      const now = Date.now();
      if (now - lastFetchTime.current < FETCH_COOLDOWN) return;
      
      lastFetchTime.current = now;
      setIsLoadingCampaigns(true);
      
      try {
        // Fetch campaigns in parallel
        await Promise.all([
          getAllCampaigns(),
          service.address ? getMyAdvertiserCampaigns() : Promise.resolve()
        ]);
        
        if (isMounted) {
          campaignsFetched.current = true;
        }
      } catch (error) {
        if (isMounted) {
          console.error("Error prefetching blockchain campaigns:", error);
        }
      } finally {
        if (isMounted) {
          setIsLoadingCampaigns(false);
        }
      }
    };
    
    prefetchCampaignData();
    
    return () => {
      isMounted = false;
    };
  }, [service]);
  
  // Process blockchain campaign data when allCampaigns changes
  useEffect(() => {
    if (allCampaigns) {
      setBlockchainCampaigns(allCampaigns);
    }
  }, [allCampaigns]);
  
  // Only fetch campaigns when modal opens if they haven't been fetched recently
  useEffect(() => {
    let isMounted = true;
    
    const fetchOnModalOpen = async () => {
      if (!isModalOpen || !service) return;
      
      const now = Date.now();
      const shouldRefetch = !campaignsFetched.current || 
                           (now - lastFetchTime.current > FETCH_COOLDOWN);
      
      if (!shouldRefetch) return;
      
      // Set loading state, but maintain previous campaign data
      setIsLoadingCampaigns(true);
      lastFetchTime.current = now;
      
      try {
        // Fetch campaigns in parallel
        await Promise.all([
          getAllCampaigns(),
          service.address ? getMyAdvertiserCampaigns() : Promise.resolve()
        ]);
        
        if (isMounted) {
          campaignsFetched.current = true;
        }
      } catch (error) {
        if (isMounted) {
          console.error("Error fetching blockchain campaigns:", error);
          toast("Blockchain Error", 
            { description: "Failed to fetch blockchain campaigns. Using local data only." }, 
            "error"
          );
        }
      } finally {
        if (isMounted) {
          setIsLoadingCampaigns(false);
        }
      }
    };
    
    fetchOnModalOpen();
    
    return () => {
      isMounted = false;
    };
  }, [isModalOpen]);
  
  // Filter locations based on search term and filter
  useEffect(() => {
    let filtered = bookedLocations;
    
    // Apply search filter
    if (searchTerm) {
      filtered = filtered.filter(location => 
        (location.name?.toLowerCase() || "").includes(searchTerm.toLowerCase()) ||
        (location.city?.toLowerCase() || "").includes(searchTerm.toLowerCase()) ||
        (location.address?.toLowerCase() || "").includes(searchTerm.toLowerCase()) ||
        (location.displayType?.toLowerCase() || "").includes(searchTerm.toLowerCase()) ||
        (location.id?.toString() || "").includes(searchTerm)
      );
    }
    
    // Apply selected filter
    if (selectedFilter !== "all") {
      if (selectedFilter === "billboard") {
        filtered = filtered.filter(location => location.displayType?.toLowerCase() === "billboard");
      } else if (selectedFilter === "display") {
        filtered = filtered.filter(location => location.displayType?.toLowerCase() === "display");
      } else if (selectedFilter === "high-traffic") {
        filtered = filtered.filter(location => location.footTraffic && location.footTraffic > 30000);
      } else if (selectedFilter === "medium-traffic") {
        filtered = filtered.filter(location => location.footTraffic && location.footTraffic > 10000 && (!location.footTraffic || location.footTraffic <= 30000));
      } else if (selectedFilter === "low-traffic") {
        filtered = filtered.filter(location => !location.footTraffic || location.footTraffic <= 10000);
      }
    }
    
    setFilteredLocations(filtered);
  }, [bookedLocations, searchTerm, selectedFilter]);
  
  // Function to open the campaign selection modal
  const openCampaignModal = (location: Location) => {
    // Check if the location is already booked on blockchain
    const deviceId = location.deviceId || (location.id ? parseInt(location.id) : 0);
    if (isLocationBookedOnBlockchain(deviceId)) {
      const status = getBlockchainBookingStatus(location);
      toast(
        "Already Booked", 
        { 
          description: `This location is already booked in blockchain campaign ${status.campaignName || '#' + status.campaignId}`,
          action: status.campaignId ? {
            label: "View Campaign",
            onClick: () => router.push(`/campaigns/blockchain/${status.campaignId}`)
          } : undefined
        }, 
        "warning"
      );
      return;
    }
    
    // If we already have campaigns data and it's fresh, we can show it immediately
    if (campaignsFetched.current && 
        Date.now() - lastFetchTime.current < FETCH_COOLDOWN) {
      setIsLoadingCampaigns(false);
    } else {
      setIsLoadingCampaigns(true);
    }
    
    setSelectedLocation(location);
    setIsModalOpen(true);
  };

  // Function to close the modal
  const closeModal = () => {
    setIsModalOpen(false);
    setSelectedLocation(null);
    setIsAddingToBlockchain(false);
  };

  // Function to save a location for a future campaign
  const saveForFutureCampaign = (location: Location) => {
    // Check if already saved
    const isAlreadySaved = savedForFuture.some(loc => 
      loc.deviceId === location.deviceId || loc.id === location.id
    );
    
    if (!isAlreadySaved) {
      setSavedForFuture([...savedForFuture, location]);
      toast(
        "Saved for Future Campaign", 
        { description: `${location.name} will be available when you create a new campaign` }, 
        "success"
      );
    } else {
      toast(
        "Already Saved", 
        { description: "This location is already saved for a future campaign" }, 
        "info"
      );
    }
    
    closeModal();
  };

  // Function to handle adding a location to a local campaign
  const handleAddToLocalCampaign = (campaignId: string, location: Location) => {
    // Find the campaign
    const campaign = localCampaigns.find(c => c.id === campaignId);
    if (!campaign) {
      toast("Campaign Not Found", { description: "The selected campaign could not be found" }, "error");
      return;
    }
    
    // Check if location is already in campaign
    const isAlreadyAdded = campaign.targetLocations?.some(loc => 
      (typeof loc === 'object') && ((loc.deviceId === location.deviceId) || (loc.id === location.id))
    );
    
    if (isAlreadyAdded) {
      toast("Already Added", { description: "This location is already in the selected campaign" }, "info");
      return;
    }
    
    // Prepare current target locations
    const currentTargetLocations = campaign.targetLocations || [];
    
    // Update campaign with new location
    updateDraftCampaign({
      ...campaign,
      targetLocations: [...currentTargetLocations, location]
    });
    
    toast(
      "Added to Local Campaign", 
      { 
        description: `${location.name} has been added to ${campaign.name}`,
        action: {
          label: "View Campaign",
          onClick: () => router.push(`/campaigns/${campaign.id}`)
        }
      }, 
      "success"
    );
    
    closeModal();
  };
  
  // Function to handle adding a location to a blockchain campaign
  const handleAddToBlockchainCampaign = async (campaignId: number, location: Location) => {
    // Check if we're on the correct network
    if (!isCorrectChain) {
      toast("Wrong Network", { description: "Please switch to the correct network" }, "warning");
      await switchChain();
      return;
    }
    
    setIsAddingToBlockchain(true);
    try {
      // Use the deviceId from the location
      const deviceId = location.deviceId;
      
      // Call the smart contract to add location to campaign
      const txHash = await addLocationToCampaign(campaignId, deviceId);
      
      if (txHash) {
        // Remove the location from booked locations after successful addition to blockchain campaign
        removeBookedLocation(deviceId || (location.id ? parseInt(location.id) : 0));
        
        toast(
          "Added to Blockchain Campaign", 
          { 
            description: `${location.name} has been added to campaign #${campaignId} and removed from your booked locations`,
            action: {
              label: "View Transaction",
              onClick: () => window.open(`https://holesky.etherscan.io/tx/${txHash}`, '_blank'),
            }
          }, 
          "success"
        );
      }
      
      // Refresh campaign details
      await getCampaignDetails(campaignId);
    } catch (error) {
      console.error("Error adding location to blockchain campaign:", error);
      toast(
        "Transaction Failed", 
        { description: error instanceof Error ? error.message : "Unknown error occurred" }, 
        "error"
      );
    } finally {
      setIsAddingToBlockchain(false);
      closeModal();
    }
  };

  // Check if a location is already booked in any blockchain campaign
  const isLocationBookedOnBlockchain = (deviceId: number): boolean => {
    if (!blockchainCampaigns || blockchainCampaigns.length === 0) return false;
    
    return blockchainCampaigns.some(campaign => 
      campaign.bookedLocations && campaign.bookedLocations.includes(deviceId)
    );
  };
  
  // Get blockchain booking status for a location
  const getBlockchainBookingStatus = (location: Location): { isBooked: boolean, campaignName?: string, campaignId?: number | string } => {
    if (!location.deviceId || !blockchainCampaigns || blockchainCampaigns.length === 0) {
      return { isBooked: false };
    }
    
    for (const campaign of blockchainCampaigns) {
      if (campaign.bookedLocations && campaign.bookedLocations.includes(location.deviceId)) {
        return { 
          isBooked: true, 
          campaignName: campaign.metadata.name,
          campaignId: campaign.id
        };
      }
    }
    
    return { isBooked: false };
  };

  // Campaign selection modal component
  const CampaignSelectionModal = () => {
    if (!isModalOpen || !selectedLocation) return null;
    
    const hasBothCampaignTypes = localCampaigns.length > 0 && blockchainCampaigns.length > 0;
    
    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 px-4">
        <div className="bg-white border-[6px] border-black p-6 max-w-lg w-full max-h-[80vh] overflow-y-auto">
          <h3 className="text-xl font-bold mb-4">Add to Campaign</h3>
          <p className="mb-6">Select a campaign to add <span className="font-bold">{selectedLocation.name}</span> to:</p>
          
          {isLoadingCampaigns && (
            <div className="flex justify-center items-center py-8">
              <LoaderCircle className="w-6 h-6 animate-spin mr-2" />
              <span>Loading blockchain campaigns...</span>
            </div>
          )}
          
          {!isLoadingCampaigns && hasBothCampaignTypes && (
            <div className="mb-6 border-b pb-2">
              <h4 className="font-bold mb-3">Local Campaigns</h4>
            </div>
          )}
          
          {/* Local Campaigns Section */}
          {localCampaigns.length > 0 ? (
            <div className="space-y-4 mb-6">
              {localCampaigns.map(campaign => (
                <div 
                  key={campaign.id}
                  className="border-[3px] border-black p-4 cursor-pointer hover:bg-gray-50 transition-colors"
                  onClick={() => handleAddToLocalCampaign(campaign.id, selectedLocation)}
                >
                  <div className="flex justify-between items-center">
                    <div>
                      <h4 className="font-bold">{campaign.name}</h4>
                      <p className="text-sm text-gray-500">
                        {campaign.status === "draft" ? "Draft" : campaign.status === "active" ? "Active" : campaign.status}
                        {campaign.targetLocations ? ` • ${campaign.targetLocations.length} location(s)` : ""}
                      </p>
                    </div>
                    <ChevronRight className="h-5 w-5" />
                  </div>
                </div>
              ))}
            </div>
          ) : (!isLoadingCampaigns && !hasBothCampaignTypes) && (
            <div className="text-center py-6 border-[3px] border-dashed border-gray-300 rounded-lg mb-6">
              <h4 className="font-bold mb-2">No Local Campaigns</h4>
              <p className="text-sm text-gray-500 mb-4">You haven't created any local campaigns yet</p>
            </div>
          )}
          
          {/* Blockchain Campaigns Section */}
          {!isLoadingCampaigns && hasBothCampaignTypes && (
            <div className="mb-6 mt-8 border-b pb-2">
              <h4 className="font-bold mb-3">Blockchain Campaigns</h4>
            </div>
          )}
          
          {!isLoadingCampaigns && blockchainCampaigns.length > 0 ? (
            <div className="space-y-4 mb-6">
              {blockchainCampaigns.map(campaign => (
                <div 
                  key={campaign.id}
                  className="border-[3px] border-black p-4 cursor-pointer hover:bg-gray-50 transition-colors"
                  onClick={() => handleAddToBlockchainCampaign(Number(campaign.id), selectedLocation)}
                >
                  <div className="flex justify-between items-center">
                    <div>
                      <h4 className="font-bold">{campaign.metadata.name}</h4>
                      <p className="text-sm text-gray-500">
                        {campaign.active ? "Active" : "Inactive"}
                        {campaign.bookedLocations ? ` • ${campaign.bookedLocations.length} location(s)` : ""}
                      </p>
                      <p className="text-xs text-gray-400">On-chain ID: {campaign.id}</p>
                    </div>
                    {isAddingToBlockchain ? (
                      <LoaderCircle className="h-5 w-5 animate-spin" />
                    ) : (
                      <ChevronRight className="h-5 w-5" />
                    )}
                  </div>
                </div>
              ))}
            </div>
          ) : (!isLoadingCampaigns && !hasBothCampaignTypes) && (
            <div className="text-center py-6 border-[3px] border-dashed border-gray-300 rounded-lg mb-6">
              <h4 className="font-bold mb-2">No Blockchain Campaigns</h4>
              <p className="text-sm text-gray-500 mb-4">Connect your wallet and create campaigns on the blockchain</p>
            </div>
          )}
          
          {/* No Campaigns At All Section */}
          {!isLoadingCampaigns && localCampaigns.length === 0 && blockchainCampaigns.length === 0 && (
            <div className="text-center py-8 border-[3px] border-dashed border-gray-300 rounded-lg mb-6">
              <h4 className="font-bold mb-2">No Campaigns Found</h4>
              <p className="text-sm text-gray-500 mb-4">You haven't created any campaigns yet</p>
              <p className="text-sm mb-4">Would you like to save this location for a future campaign?</p>
              <Button
                className="bg-[#0055FF] text-white border-[3px] border-black hover:bg-[#0044CC] transition-all font-bold mx-auto"
                onClick={() => saveForFutureCampaign(selectedLocation)}
              >
                Save for Future Campaign
              </Button>
            </div>
          )}
          
          <div className="flex justify-between mt-6 pt-4 border-t border-gray-200">
            <Button
              variant="outline"
              className="border-[3px] border-black rounded-none hover:bg-gray-100 transition-all"
              onClick={closeModal}
            >
              Cancel
            </Button>
            
            <Button
              className="bg-[#0055FF] text-white border-[3px] border-black hover:bg-[#0044CC] transition-all font-bold"
              onClick={() => router.push("/campaigns/new")}
            >
              Create New Campaign
            </Button>
          </div>
        </div>
      </div>
    );
  };
  
  const handleRemoveFromBooked = (location: Location) => {
    removeBookedLocation(location.deviceId || (location.id ? parseInt(location.id) : 0));
    toast("Removed", { description: `${location.name} has been removed from your booked locations` }, "info");
  };
  
  const handleClearAll = () => {
    if (window.confirm("Are you sure you want to clear all booked locations? This action cannot be undone.")) {
      clearBookedLocations();
      toast("Cleared", { description: "All booked locations have been cleared" }, "info");
    }
  };
  
  const handleLocationClick = (location: Location) => {
    router.push(`/locations/${location.deviceId || location.id}`);
  };
  
  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex items-center justify-between mb-8">
        <div className="flex items-center">
          <Button
            variant="outline"
            className="mr-4 border-[4px] border-black rounded-none bg-white hover:bg-[#f5f5f5] transition-all font-bold px-4 py-2 h-auto flex items-center gap-2 hover:-translate-y-1 hover:shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]"
            onClick={() => router.back()}
          >
            <ArrowLeft className="w-5 h-5" />
            <span>Back</span>
          </Button>
          <h1 className="text-3xl font-black">Your Booked Locations</h1>
        </div>
        
        <div className="flex items-center gap-2">
          <Button 
            variant="outline" 
            className="border-[4px] border-black rounded-none bg-white hover:bg-[#f5f5f5] transition-all font-bold"
            onClick={handleClearAll}
            disabled={bookedLocations.length === 0}
          >
            <X className="mr-2 h-4 w-4" />
            Clear All
          </Button>
          <Button 
            className="border-[4px] border-black rounded-none bg-[#0055FF] hover:bg-[#0044CC] transition-all font-bold text-white"
            onClick={() => router.push("/browse-locations")}
          >
            <Plus className="mr-2 h-4 w-4" />
            Add More Locations
          </Button>
        </div>
      </div>
      
      <div className="border-[6px] border-black bg-white p-6 shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] mb-6">
        <div className="flex flex-col md:flex-row gap-4 items-stretch mb-6">
          <div className="flex-1">
            <div className="relative">
              <Search className="absolute left-3 top-3 h-5 w-5 text-gray-400" />
              <Input
                placeholder="Search locations..."
                className="pl-10 h-12 border-[3px] border-black rounded-none"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
          </div>
          
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex items-center gap-2">
              <Filter className="h-5 w-5" />
              <Select value={selectedFilter} onValueChange={setSelectedFilter}>
                <SelectTrigger className="w-48 h-12 border-[3px] border-black rounded-none">
                  <SelectValue placeholder="All Types" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Types</SelectItem>
                  <SelectItem value="billboard">Billboards</SelectItem>
                  <SelectItem value="display">Digital Displays</SelectItem>
                  <SelectItem value="high-traffic">High Traffic</SelectItem>
                  <SelectItem value="medium-traffic">Medium Traffic</SelectItem>
                  <SelectItem value="low-traffic">Low Traffic</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </div>
        
        {filteredLocations.length === 0 ? (
          <div className="text-center py-16 border-[3px] border-dashed border-gray-300 rounded-lg">
            <div className="mx-auto w-16 h-16 text-gray-300 mb-4">
              <MapPin className="w-16 h-16" />
            </div>
            <h3 className="text-xl font-bold mb-2">No Booked Locations</h3>
            <p className="text-gray-500 mb-6">You haven't booked any locations yet</p>
            <Button 
              className="border-[4px] border-black rounded-none bg-[#0055FF] hover:bg-[#0044CC] transition-all font-bold text-white"
              onClick={() => router.push("/browse-locations")}
            >
              <Plus className="mr-2 h-4 w-4" />
              Browse Locations
            </Button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredLocations.map((location, index) => {
              // Check blockchain booking status for this location
              const blockchainStatus = getBlockchainBookingStatus(location);
              const isBlockchainBooked = blockchainStatus.isBooked;
              
              return (
                <div
                  key={location.deviceId || location.id || index}
                  className="border-[4px] border-black p-4 hover:shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] transition-all duration-200 bg-white"
                >
                  <div 
                    className="relative mb-3 overflow-hidden border-[2px] border-black cursor-pointer"
                    onClick={() => handleLocationClick(location)}
                  >
                    {location.images && location.images.length > 0 ? (
                      <Image
                        src={location.images[0]}
                        alt={location.name || "Location image"}
                        width={400}
                        height={200}
                        className="w-full h-48 object-cover"
                      />
                    ) : (
                      <div className="w-full h-48 bg-gray-100 flex items-center justify-center">
                        <MapPin className="w-12 h-12 text-gray-300" />
                      </div>
                    )}
                    <div className="absolute top-2 right-2 bg-white border-[2px] border-black px-2 py-1">
                      <span className="font-bold text-sm">{location.pricePerDay} ADC</span>
                    </div>
                  </div>
                  
                  <h3 
                    className="text-lg font-bold mb-2 cursor-pointer hover:text-blue-600"
                    onClick={() => handleLocationClick(location)}
                  >
                    {location.name || `Location #${location.deviceId || location.id || index}`}
                  </h3>
                  
                  <div className="flex items-center gap-2 mb-2">
                    <MapPin className="w-4 h-4 text-gray-500" />
                    <span className="text-sm">{location.city || location.address || "Unknown location"}</span>
                  </div>
                  
                  <div className="flex flex-wrap gap-2 mb-4">
                    {location.displayType && (
                      <span className="px-2 py-1 text-xs font-bold bg-[#0055FF] text-white border-[2px] border-black">
                        {location.displayType?.toUpperCase() || "DISPLAY"}
                      </span>
                    )}
                    {location.active !== undefined && (
                      <span className={`px-2 py-1 text-xs font-bold ${location.active ? "bg-green-500 text-white" : "bg-[#FFCC00] text-black"} border-[2px] border-black`}>
                        {location.active ? "AVAILABLE" : "UNAVAILABLE"}
                      </span>
                    )}
                    {isBlockchainBooked && (
                      <span className="px-2 py-1 text-xs font-bold bg-purple-600 text-white border-[2px] border-black">
                        BLOCKCHAIN BOOKED
                      </span>
                    )}
                  </div>
                  
                  {isBlockchainBooked && blockchainStatus.campaignName && (
                    <div className="mb-3 bg-gray-100 p-2 border-[2px] border-black">
                      <p className="text-xs">
                        <span className="font-bold">Booked in:</span> {blockchainStatus.campaignName}
                      </p>
                      {blockchainStatus.campaignId && (
                        <p className="text-xs text-gray-500">Campaign #{blockchainStatus.campaignId}</p>
                      )}
                    </div>
                  )}
                  
                  <div className="grid grid-cols-2 gap-2 mb-4">
                    <div className="flex items-center gap-1">
                      <Eye className="w-4 h-4 text-gray-500" />
                      <span className="text-xs">{location.impressions?.toLocaleString() || "0"} impressions</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <Users className="w-4 h-4 text-gray-500" />
                      <span className="text-xs">{location.footTraffic?.toLocaleString() || "0"} traffic</span>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-2">
                    <Button
                      variant="outline"
                      className="flex-1 h-10 border-[2px] border-black rounded-none bg-white hover:bg-[#f5f5f5] transition-all text-sm"
                      onClick={() => handleRemoveFromBooked(location)}
                    >
                      <X className="mr-1 h-4 w-4" />
                      Remove
                    </Button>
                    <Button
                      className="flex-1 h-10 border-[2px] border-black rounded-none bg-[#0055FF] hover:bg-[#0044CC] transition-all text-white text-sm"
                      onClick={() => openCampaignModal(location)}
                      disabled={isBlockchainBooked}
                    >
                      <Plus className="mr-1 h-4 w-4" />
                      {isBlockchainBooked ? "Already Booked" : "Add to Campaign"}
                    </Button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
      
      <div className="flex justify-center mt-4">
        <Button
          variant="outline"
          className="border-[4px] border-black rounded-none bg-white hover:bg-[#f5f5f5] transition-all font-bold"
          onClick={() => router.push("/campaigns/new")}
        >
          <Plus className="mr-2 h-4 w-4" />
          Create New Campaign
        </Button>
      </div>
      
      {/* Add the campaign selection modal */}
      <CampaignSelectionModal />
    </div>
  )
} 