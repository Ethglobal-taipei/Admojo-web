"use client"

import React, { useState, useEffect, memo } from "react"
import Image from "next/image"
import { useParams, useRouter } from "next/navigation"
import {
  ArrowLeft,
  MapPin,
  Calendar,
  Plus,
  BarChart2,
  Eye,
  DollarSign,
  Clock,
  CheckCircle,
  Share2,
  Download,
  Star,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { toast } from "@/lib/toast"
import { useLocationStore, useCampaignStore } from "@/lib/store"
import { useUIStore } from "@/lib/store/useUIStore"
import { useBlockchainService } from "@/hooks/use-blockchain-service"
import { useBoothRegistry } from "@/hooks/use-booth-registry"
import { Booth } from "@/lib/blockchain"
import { Location, getCoordinates, getLocationName } from "@/lib/store/useLocationStore"

// Wrap the component with memo to prevent unnecessary re-renders
const LocationDetailPage = memo(function LocationDetailPage() {
  const params = useParams()
  const router = useRouter()
  const [isSelected, setIsSelected] = useState(false)
  const [isBooking, setIsBooking] = useState(false)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<Error | null>(null)
  const { openModal } = useUIStore()
  const { service, address, isCorrectChain, switchChain } = useBlockchainService()
  
  // Get booth registry hooks for blockchain interaction
  const { 
    getBoothDetails, 
    boothDetails,
    isLoadingBooth,
    getBoothError,
    addLocationToCampaign, 
    isAddingLocation 
  } = useBoothRegistry()

  // Get location store and campaign store
  const { locations, isLocationBooked, bookLocation, removeBookedLocation } = useLocationStore()
  const { isSelectingLocations, draftCampaign, updateDraftCampaign } = useCampaignStore()

  // Find the location by ID from params
  const locationId = Number(params.id)
  
  // Local state for location data
  const [locationData, setLocationData] = useState<Location | null>(null)
  const [hasFetchAttempted, setHasFetchAttempted] = useState(false)
  const [isBooked, setIsBooked] = useState(false)
  
  // Use refs to store stable placeholder values
  const placeholderValues = useState(() => ({
    impressions: Math.floor(Math.random() * 10000) + 1000,
    footTraffic: Math.floor(Math.random() * 5000) + 500,
    earnings: Math.floor(Math.random() * 1000) + 100,
    registrationTime: Date.now(),
    coordinates: {
      lat: Math.random() * 90,
      lng: Math.random() * 180,
    }
  }))[0];
  
  // Fetch booth details when component mounts
  useEffect(() => {
    console.log("Starting fetch effect");
    let isMounted = true;
    
    const fetchBoothDetails = async () => {
      // If we've already attempted a fetch, don't try again
      if (hasFetchAttempted) {
        console.log("Fetch already attempted, skipping");
        return;
      }
      
      if (!service || isNaN(locationId)) {
        if (isMounted) {
          setIsLoading(false);
          setHasFetchAttempted(true);
        }
        return;
      }
      
      try {
        if (isMounted) {
          setIsLoading(true);
          setHasFetchAttempted(true);
        }
        console.log("Fetching booth details for ID:", locationId);
        await getBoothDetails(locationId);
        console.log("Booth details fetched successfully");
      } catch (err) {
        console.error("Error fetching booth details:", err);
        if (isMounted) {
          setError(err instanceof Error ? err : new Error("Failed to fetch booth details"));
          setIsLoading(false);
        }
      }
    };
    
    // Only fetch if we haven't attempted yet and we don't have booth details
    if (!hasFetchAttempted && !boothDetails) {
      fetchBoothDetails();
    } else if (boothDetails && isLoading) {
      // If we have booth details but loading is still true, update state
      setIsLoading(false);
    }
    
    // Add timeout to prevent getting stuck in loading state
    const timeoutId = setTimeout(() => {
      if (isMounted && isLoading && hasFetchAttempted) {
        console.log("Loading timeout triggered");
        setIsLoading(false);
        setError(new Error("Loading timed out. Please try again."));
      }
    }, 10000); // 10 second timeout
    
    return () => {
      console.log("Cleaning up fetch effect");
      isMounted = false;
      clearTimeout(timeoutId);
    };
  }, [service, locationId, boothDetails, hasFetchAttempted]);
  
  // Process booth data into a Location object once we have the details
  useEffect(() => {
    console.log("Process booth data effect running, boothDetails:", !!boothDetails);
    if (!boothDetails) return;
    
    try {
      // Convert Booth data to Location format using the helper function
      const location: Location = {
        ...boothDetails,
        id: boothDetails.deviceId.toString(),
        name: `${boothDetails.metadata?.displaySize || 'Digital'} Display at ${boothDetails.metadata?.location || 'Unknown location'}`,
        city: boothDetails.metadata?.location?.split(',')[0]?.trim() || "Unknown location",
        address: boothDetails.metadata?.location || "Unknown location",
        displayType: boothDetails.metadata?.displaySize?.includes("Large") ? "Billboard" : "Display",
        displaySize: boothDetails.metadata?.displaySize || "Medium",
        // Use stable placeholder values from state instead of generating new ones on each render
        impressions: placeholderValues.impressions,
        footTraffic: placeholderValues.footTraffic,
        earnings: placeholderValues.earnings,
        campaigns: 1, // Placeholder until we have real data
        registrationTime: placeholderValues.registrationTime,
        coordinates: placeholderValues.coordinates,
        images: [],
        pricePerDay: "100"
      };
      
      console.log("Setting location data");
      setLocationData(location);
      setIsLoading(false);
      setError(null);
      
      // Check if this location is already booked
      setIsBooked(isLocationBooked(locationId));
    } catch (err) {
      console.error("Error processing booth data:", err);
      setError(err instanceof Error ? err : new Error("Failed to process booth data"));
      setIsLoading(false);
    }
  }, [boothDetails, locationId, isLocationBooked, placeholderValues]);

  // Check if this location is selected in the campaign
  useEffect(() => {
    if (isSelectingLocations && draftCampaign.targetLocations && locationId) {
      setIsSelected(draftCampaign.targetLocations.some(loc => 
        (typeof loc === 'object') && 
        ((loc.deviceId === locationId) || (loc.id && parseInt(loc.id) === locationId))
      ))
    }
    
    // Check if the location is already booked
    if (locationData) {
      setIsBooked(isLocationBooked(locationId));
    }
  }, [isSelectingLocations, draftCampaign.targetLocations, locationId, locationData, isLocationBooked]);

  const handleAddToCampaign = async () => {
    // Check if we're on the correct network
    if (!isCorrectChain) {
      toast("Wrong Network", { description: "Please switch to the correct network" }, "warning")
      await switchChain()
      return
    }

    if (!locationData) {
      toast("Error", { description: "Location data is missing" }, "error")
      return
    }

    if (isSelectingLocations) {
      // If we're in campaign creation flow, add to draft campaign
      if (draftCampaign.targetLocations) {
        const updatedTargetLocations = [...draftCampaign.targetLocations, locationData]
        updateDraftCampaign({ targetLocations: updatedTargetLocations })
      } else {
        updateDraftCampaign({ targetLocations: [locationData] })
      }
      
      setIsSelected(true)
      toast(
        "Added to campaign",
        {
          description: `${locationData.name} has been added to your campaign.`,
          action: {
            label: "Continue Selection",
            onClick: () => router.push("/browse-locations"),
          },
        },
        "success",
      )
    } else {
      // Book the location in our store rather than directly adding to campaign
      try {
        setIsBooking(true)
        
        // Book the location - this adds it to the booked locations
        const result = bookLocation(locationData);
        if (result) {
          setIsBooked(true);
          toast(
            "Location Booked",
            {
              description: `${locationData.name} has been successfully booked. You can find it in your Booked Locations.`,
              action: {
                label: "View Booked Locations",
                onClick: () => router.push("/booked-locations"),
              },
            },
            "success"
          );
        } else {
          toast(
            "Already Booked",
            { description: "This location is already in your booked locations" },
            "info"
          );
        }
      } catch (error) {
        console.error("Error booking location:", error)
        toast(
          "Booking Failed",
          { description: error instanceof Error ? error.message : "Unknown error occurred" },
          "error"
        )
      } finally {
        setIsBooking(false)
      }
    }
  }

  const handleRemoveFromCampaign = async () => {
    if (!locationData) {
      toast("Error", { description: "Location data is missing" }, "error")
      return
    }

    if (isSelectingLocations && draftCampaign.targetLocations) {
      // If we're in campaign creation flow, remove from draft campaign
      updateDraftCampaign({
        targetLocations: draftCampaign.targetLocations.filter(loc => 
          !(typeof loc === 'object' && 
            ((loc.deviceId === locationId) || (loc.id && parseInt(loc.id) === locationId))
          )
        ),
      })
      
      setIsSelected(false)
      toast(
        "Removed from campaign",
        {
          description: `${locationData.name} has been removed from your campaign.`,
          action: {
            label: "Continue Selection",
            onClick: () => router.push("/browse-locations"),
          },
        },
        "info",
      )
    } else {
      // Remove location from booked locations
      try {
        setIsBooking(true)
        
        // Remove from booked locations
        removeBookedLocation(locationId)
        setIsBooked(false)
        
        toast(
          "Booking Cancelled", 
          { description: `${locationData.name} has been removed from your booked locations.` }, 
          "info"
        )
      } catch (error) {
        console.error("Error removing location:", error)
        toast(
          "Removal Failed",
          { description: error instanceof Error ? error.message : "Unknown error occurred" },
          "error"
        )
      } finally {
        setIsBooking(false)
      }
    }
  }

  const handleViewProviderProfile = () => {
    if (!locationData) return
    
    const ownerAddress = locationData.owner || "Unknown"
    
    openModal("providerInfo", {
      providerId: locationId.toString(),
      providerName: ownerAddress.substring(0, 6) + '...' + ownerAddress.substring(38),
      providerAddress: ownerAddress
    })
  }

  // Show loading state
  if (isLoading || isLoadingBooth) {
    return (
      <div className="container mx-auto px-4 py-8 relative">
        <Button
          variant="outline"
          className="mb-6 border-[4px] border-black rounded-none bg-white hover:bg-[#f5f5f5] transition-all font-bold px-4 py-2 h-auto flex items-center gap-2 hover:-translate-y-1 hover:shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]"
          onClick={() => router.back()}
        >
          <ArrowLeft className="w-5 h-5" />
          <span>Back to Locations</span>
        </Button>
        
        <div className="text-center py-12">
          <div className="inline-block animate-spin h-12 w-12 border-4 border-[#0055FF] border-t-transparent rounded-full mb-4"></div>
          <p className="text-xl font-bold">Loading location details...</p>
        </div>
      </div>
    )
  }

  // Show error state
  if (error || getBoothError || !locationData) {
    return (
      <div className="container mx-auto px-4 py-8 relative">
        <Button
          variant="outline"
          className="mb-6 border-[4px] border-black rounded-none bg-white hover:bg-[#f5f5f5] transition-all font-bold px-4 py-2 h-auto flex items-center gap-2 hover:-translate-y-1 hover:shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]"
          onClick={() => router.back()}
        >
          <ArrowLeft className="w-5 h-5" />
          <span>Back to Locations</span>
        </Button>
        
        <div className="text-center py-12 border-4 border-red-200 bg-red-50 rounded-lg">
          <p className="text-xl font-bold text-red-800 mb-4">Error Loading Location</p>
          <p className="text-red-700 mb-6">
            {error?.message || getBoothError?.message || "Failed to load location details."}
          </p>
          <Button 
            className="bg-[#0055FF] text-white border-[3px] border-black hover:bg-[#0044CC] font-bold px-6"
            onClick={() => router.push('/browse-locations')}
          >
            Return to Locations
          </Button>
        </div>
      </div>
    )
  }

  return (
    <div className="container mx-auto px-4 py-8 relative">
      {/* Back button */}
      <Button
        variant="outline"
        className="mb-6 border-[4px] border-black rounded-none bg-white hover:bg-[#f5f5f5] transition-all font-bold px-4 py-2 h-auto flex items-center gap-2 hover:-translate-y-1 hover:shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]"
        onClick={() => router.back()}
      >
        <ArrowLeft className="w-5 h-5" />
        <span>Back to Locations</span>
      </Button>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Main content */}
        <div className="lg:col-span-2">
          {/* Location header */}
          <div className="border-[6px] border-black bg-white p-6 shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] hover:shadow-[12px_12px_0px_0px_rgba(0,0,0,1)] transition-all duration-300 mb-8">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
              <div>
                <h1 className="text-3xl md:text-4xl font-black mb-2">{locationData.name}</h1>
                <div className="flex items-center gap-2 mb-2">
                  <MapPin className="w-5 h-5" />
                  <span className="font-bold">{locationData.city || locationData.address || "Unknown location"}</span>
                </div>
                <div className="flex flex-wrap gap-2">
                  <span className="px-2 py-1 text-xs font-bold bg-[#0055FF] text-white border-[2px] border-black">
                    {locationData.displayType?.toUpperCase() || "DISPLAY"}
                  </span>
                  <span
                    className={`px-2 py-1 text-xs font-bold ${locationData.active ? "bg-green-500 text-white" : "bg-[#FFCC00] text-black"} border-[2px] border-black`}
                  >
                    {locationData.active ? "AVAILABLE NOW" : "COMING SOON"}
                  </span>
                  <span className="px-2 py-1 text-xs font-bold bg-[#FF3366] text-white border-[2px] border-black">
                    {locationData.footTraffic && locationData.footTraffic > 30000 
                      ? "HIGH" 
                      : locationData.footTraffic && locationData.footTraffic > 10000 
                        ? "MEDIUM" 
                        : "LOW"} TRAFFIC
                  </span>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <div className="flex items-center gap-1">
                  <Star className="w-5 h-5 fill-[#FFCC00] text-[#FFCC00]" />
                  <span className="font-bold">4.5</span>
                </div>
                <span className="text-sm">(0 reviews)</span>
              </div>
            </div>

            <div className="relative mb-6 border-[4px] border-black overflow-hidden">
              <div className="w-full aspect-video bg-gray-200 flex items-center justify-center">
                <MapPin className="h-12 w-12 text-gray-400" />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
              <div className="border-[3px] border-black p-3 bg-[#f5f5f5]">
                <div className="flex items-center gap-2 mb-1">
                  <Eye className="w-4 h-4" />
                  <div className="text-sm font-medium">Daily Impressions</div>
                </div>
                <div className="text-xl font-black">{locationData.impressions?.toLocaleString() || "0"}</div>
              </div>
              <div className="border-[3px] border-black p-3 bg-[#f5f5f5]">
                <div className="flex items-center gap-2 mb-1">
                  <DollarSign className="w-4 h-4" />
                  <div className="text-sm font-medium">Price per Day</div>
                </div>
                <div className="text-xl font-black">{locationData.pricePerDay} ADC</div>
              </div>
              <div className="border-[3px] border-black p-3 bg-[#f5f5f5]">
                <div className="flex items-center gap-2 mb-1">
                  <Calendar className="w-4 h-4" />
                  <div className="text-sm font-medium">Availability</div>
                </div>
                <div className="text-xl font-black">Immediate</div>
              </div>
            </div>

            <div className="mb-6">
              <h2 className="text-xl font-bold mb-3">Description</h2>
              <p className="font-medium">{`A ${locationData.displayType || 'digital'} display located in ${locationData.city || 'an urban area'} with approximately ${locationData.footTraffic?.toLocaleString() || '0'} daily impressions.`}</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
              <div>
                <h2 className="text-xl font-bold mb-3">Features</h2>
                <ul className="space-y-2">
                  {[
                    `${locationData.displayType || 'Digital'} display`,
                    `${locationData.displaySize || 'Standard'} size`,
                    "24/7 visibility",
                    "Performance tracking"
                  ].map((feature: string, index: number) => (
                    <li key={index} className="flex items-center gap-2">
                      <div className="w-5 h-5 bg-[#0055FF] border-[2px] border-black flex items-center justify-center text-white font-bold text-xs">
                        ✓
                      </div>
                      <span className="font-medium">{feature}</span>
                    </li>
                  ))}
                </ul>
              </div>

              <div>
                <h2 className="text-xl font-bold mb-3">Location Details</h2>
                <div className="space-y-3">
                  <div className="flex items-start gap-2">
                    <MapPin className="w-5 h-5 mt-1 text-[#0055FF]" />
                    <div>
                      <p className="font-bold">Address</p>
                      <p>{locationData.address || locationData.city || "Location details not available"}</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-2">
                    <BarChart2 className="w-5 h-5 mt-1 text-[#0055FF]" />
                    <div>
                      <p className="font-bold">Daily Foot Traffic</p>
                      <p>{locationData.footTraffic?.toLocaleString() || "Data not available"} people</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-2">
                    <Clock className="w-5 h-5 mt-1 text-[#0055FF]" />
                    <div>
                      <p className="font-bold">Registered On</p>
                      <p>{new Date(locationData.registrationTime || Date.now()).toLocaleDateString()}</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Action button - Book/Add to Campaign or Remove */}
            {isSelected || isBooked ? (
              <Button
                className="w-full bg-white border-[4px] border-[#0055FF] text-[#0055FF] hover:bg-[#f5f5f5] font-bold py-6 text-lg"
                onClick={handleRemoveFromCampaign}
                disabled={isBooking}
              >
                <CheckCircle className="mr-2 h-6 w-6" />
                {isSelectingLocations ? "Added to Campaign - Click to Remove" : "Booked - Click to Cancel"}
              </Button>
            ) : (
              <Button
                className="w-full bg-[#0055FF] text-white border-[4px] border-black hover:bg-[#0044CC] font-bold py-6 text-lg"
                onClick={handleAddToCampaign}
                disabled={isBooking || isAddingLocation}
              >
                {isBooking || isAddingLocation ? (
                  <>Processing...</>
                ) : (
                  <>
                    <Plus className="mr-2 h-6 w-6" />
                    {isSelectingLocations ? "Add to Campaign" : "Book This Location"}
                  </>
                )}
              </Button>
            )}
          </div>

          {/* Analytics section - removed for brevity */}
        </div>

        {/* Sidebar */}
        <div className="lg:col-span-1">
          <div className="border-[6px] border-black bg-white p-6 shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] hover:shadow-[12px_12px_0px_0px_rgba(0,0,0,1)] transition-all duration-300 mb-8">
            <h2 className="text-2xl font-black mb-4">Provider Information</h2>
            <div className="space-y-4 mb-6">
              <div>
                <p className="text-sm font-medium">Owner</p>
                <p className="font-bold truncate">
                  {locationData.owner ? 
                    `${locationData.owner.substring(0, 6)}...${locationData.owner.substring(38)}` : 
                    "Unregistered Provider"}
                </p>
              </div>
              <div>
                <p className="text-sm font-medium">Registered Locations</p>
                <p className="font-bold">{locationData.campaigns || 1}</p>
              </div>
              <div>
                <p className="text-sm font-medium">Total Earnings</p>
                <p className="font-bold">{locationData.earnings?.toLocaleString() || 0} ADC</p>
              </div>
            </div>
            <Button
              className="w-full bg-white border-[3px] border-black hover:bg-[#f5f5f5] font-bold"
              onClick={handleViewProviderProfile}
            >
              View Provider Profile
            </Button>
          </div>

          <div className="border-[6px] border-black bg-white p-6 shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] hover:shadow-[12px_12px_0px_0px_rgba(0,0,0,1)] transition-all duration-300 mb-8">
            <h2 className="text-2xl font-black mb-4">Download Data</h2>
            <p className="mb-4">Get detailed information about this location's performance and specifications.</p>
            <div className="space-y-3">
              <Button className="w-full justify-start bg-white border-[3px] border-black hover:bg-[#f5f5f5] text-black font-bold">
                <Download className="mr-2 h-5 w-5" />
                Performance Report
              </Button>
              <Button className="w-full justify-start bg-white border-[3px] border-black hover:bg-[#f5f5f5] text-black font-bold">
                <Download className="mr-2 h-5 w-5" />
                Technical Specs
              </Button>
              <Button className="w-full justify-start bg-white border-[3px] border-black hover:bg-[#f5f5f5] text-black font-bold">
                <Download className="mr-2 h-5 w-5" />
                Audience Demographics
              </Button>
            </div>
          </div>

          <div className="border-[6px] border-black bg-white p-6 shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] hover:shadow-[12px_12px_0px_0px_rgba(0,0,0,1)] transition-all duration-300">
            <h2 className="text-2xl font-black mb-4">Share This Location</h2>
            <p className="mb-4">Share this location with your team or on social media.</p>
            <div className="flex gap-3">
              <Button className="flex-1 bg-[#0055FF] text-white border-[3px] border-black hover:bg-[#0044CC] font-bold">
                <Share2 className="mr-2 h-5 w-5" />
                Share
              </Button>
              <Button
                className="flex-1 bg-white border-[3px] border-black hover:bg-[#f5f5f5] text-black font-bold"
                onClick={() => {
                  navigator.clipboard.writeText(window.location.href)
                  toast("Link Copied", { description: "Location link copied to clipboard" }, "success")
                }}
              >
                Copy Link
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
})

export default LocationDetailPage

