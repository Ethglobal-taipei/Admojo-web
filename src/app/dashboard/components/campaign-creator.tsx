"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { 
  ArrowRight, Calendar, DollarSign, 
  Image, MapPin, Target, Upload, Loader2, 
  AlertCircle, CheckSquare, Info, ChevronLeft, ChevronRight
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { useCampaignStore } from "@/lib/store"
import { useBlockchainService, useBoothRegistry } from "@/hooks"
import { usePrivy } from "@privy-io/react-auth"
import { toast } from "@/lib/toast"
import { parseUnits } from "viem"
import { format } from "date-fns"
import { 
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"
import { Calendar as CalendarComponent } from "@/components/ui/calendar"
import { Label } from "@/components/ui/label"
import type { CampaignFormData } from "@/lib/store"
import { CampaignMetadata } from "@/lib/blockchain/types"
import CampaignLocationsMap from "@/components/map/campaign-locations-map"

// Helper to calculate duration in days between two dates
const calculateDurationDays = (startDate: string, endDate: string): number => {
  return Math.ceil(
    (new Date(endDate).getTime() - new Date(startDate).getTime()) / (1000 * 60 * 60 * 24)
  );
}

export default function CampaignCreator() {
  const router = useRouter()
  const { 
    draftCampaign,
    updateDraftCampaign,
    startLocationSelection, 
    resetDraftCampaign,
    isSubmitting: isStoreSubmitting,
  } = useCampaignStore()
    
  const { user, authenticated, ready, login } = usePrivy()
  const { service, isCorrectChain, switchChain } = useBlockchainService()
  const { createCampaign, isCreatingCampaign } = useBoothRegistry()
  
  const [step, setStep] = useState(1)
  const totalSteps = 4
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [showBlockchainInfo, setShowBlockchainInfo] = useState(false)
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [startDateOpen, setStartDateOpen] = useState(false)
  const [endDateOpen, setEndDateOpen] = useState(false)
  const [transactionHash, setTransactionHash] = useState<string | null>(null)
  const [localDescription, setLocalDescription] = useState("")

  // Use state to avoid hydration mismatch
  const [mounted, setMounted] = useState(false)

  // Only render client-specific content after mounting
  useEffect(() => {
    setMounted(true)
    console.log("Current draft campaign state:", draftCampaign)
  }, [draftCampaign])

  // Add effect to log draftCampaign changes
  useEffect(() => {
    if (mounted) {
      console.log("draftCampaign updated:", draftCampaign);
    }
  }, [draftCampaign, mounted]);

  const handleInputChange = (field: string, value: any) => {
    console.log(`Updating ${field} to:`, value);
    
    // Use the updateDraftCampaign function instead
    updateDraftCampaign({
      [field]: value
    });
    
    // Clear validation error when user enters data
    if (errors[field]) {
      setErrors(prev => {
        const newErrors = {...prev}
        delete newErrors[field]
        return newErrors
      })
    }
  }

  const handleSelectLocations = () => {
    startLocationSelection()
    router.push("/locations")
  }
  
  const handleConnectWallet = async () => {
    try {
      await login()
    } catch (err) {
      console.error("Login error:", err)
      toast("Login Failed", { description: "Failed to connect wallet" }, "error")
    }
  }
  
  const handleSwitchNetwork = async () => {
    try {
      await switchChain()
    } catch (err) {
      console.error("Network switch error:", err)
      toast("Network Switch Failed", { description: "Failed to switch to Holesky testnet" }, "error")
    }
  }

  const validateStep = () => {
    const newErrors: Record<string, string> = {}
    
    if (step === 1) {
      if (!draftCampaign.name?.trim()) {
        newErrors.name = "Campaign name is required"
      }
      
      if (!draftCampaign.startDate) {
        newErrors.startDate = "Start date is required"
      }
      
      if (!draftCampaign.endDate) {
        newErrors.endDate = "End date is required"
      } else if (draftCampaign.startDate && new Date(draftCampaign.startDate) >= new Date(draftCampaign.endDate)) {
        newErrors.endDate = "End date must be after start date"
      }
    }
    
    if (step === 2) {
      if (!draftCampaign.budget || draftCampaign.budget <= 0) {
        newErrors.budget = "Budget must be greater than 0"
      }
    }
    
    if (step === 3) {
      if (!draftCampaign.targetLocations || draftCampaign.targetLocations.length === 0) {
        newErrors.locations = "At least one location must be selected"
      }
    }
    
    if (step === 4) {
      if (!draftCampaign.creativeFile && !draftCampaign.creativeUrl) {
        newErrors.creative = "Please upload a creative file for your campaign"
      }
    }
    
    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleNext = () => {
    if (validateStep()) {
      if (step < totalSteps) {
        setStep(step + 1)
      } else {
        handleCreateCampaign()
      }
    }
  }
  
  const handlePrev = () => {
    if (step > 1) {
      setStep(step - 1)
    }
  }

  const handleCreateCampaign = async () => {
    if (!validateStep()) {
      toast("Validation Failed", { description: "Please correct the errors in the form" }, "error")
      return
    }
    
    if (!authenticated) {
      toast("Wallet Required", { description: "Please connect your wallet to create a campaign" }, "error")
      setShowBlockchainInfo(true)
      return
    }
    
    if (!isCorrectChain) {
      toast("Wrong Network", { description: "Please switch to Holesky testnet before creating a campaign" }, "error")
      setShowBlockchainInfo(true)
      return
    }
    
    if (!draftCampaign.targetLocations || draftCampaign.targetLocations.length === 0) {
      toast("Locations Required", { description: "Please select at least one location for your campaign" }, "error")
      return
    }
    
    setIsSubmitting(true)
    
    try {
      // Create metadata for the campaign
      const campaignMetadata: CampaignMetadata = {
        name: draftCampaign.name,
        description: localDescription || draftCampaign.name,
        contentURI: draftCampaign.creativeUrl || 'ipfs://QmDefaultContentHash',
        startDate: BigInt(new Date(draftCampaign.startDate).getTime() / 1000),
        duration: calculateDurationDays(draftCampaign.startDate, draftCampaign.endDate),
        additionalInfo: `budget:${draftCampaign.budget}`
      }
      
      toast("Preparing transaction", { description: "Submitting to blockchain..." }, "info")
      
      // Extract location IDs for the contract call
      const locationIds = draftCampaign.targetLocations.map(loc => 
        typeof loc.id === 'number' ? loc.id : parseInt(loc.id.toString())
      ).filter(id => !isNaN(id))
      
      // Ensure wallet provider is ready
      if (!user?.wallet?.address) {
        throw new Error("Wallet not connected properly")
      }
      
      // Execute the contract function on the blockchain using the new hooks
      const hash = await createCampaign(campaignMetadata, locationIds)
      
      setTransactionHash(hash)
      toast("Campaign Created", { description: "Your campaign has been created successfully on the blockchain!" }, "success")
      resetDraftCampaign()
    } catch (err) {
      console.error("Campaign creation error:", err)
      toast("Campaign Creation Failed", { 
        description: typeof err === 'object' && err !== null && 'message' in err 
          ? (err as Error).message 
          : "There was an error creating your campaign. Please try again." 
      }, "error")
    } finally {
      setIsSubmitting(false)
    }
  }

  

  // Prevent hydration mismatch by not rendering form values on server
  if (!mounted) {
    return (
      <div className="border-[6px] border-black bg-white p-6 h-full flex flex-col">
        <h2 className="text-2xl font-black mb-4 flex items-center gap-2">
          <Target className="w-6 h-6" />
          Create Campaign
        </h2>
        <div className="flex-grow overflow-auto">
          <p>Loading campaign creator...</p>
        </div>
      </div>
    )
  }
  
  // If transaction was successful, show success state
  if (transactionHash) {
    return (
      <div className="border-[6px] border-black bg-white p-6 h-full flex flex-col">
        <h2 className="text-2xl font-black mb-4 flex items-center gap-2 text-green-600">
          <CheckSquare className="w-6 h-6" />
          Campaign Created Successfully
        </h2>
        <div className="flex-grow overflow-auto">
          <div className="border-[3px] border-green-300 bg-green-50 p-4 mb-6">
            <p className="font-medium mb-4">Your campaign has been submitted to the blockchain and is being processed.</p>
            
            <div className="bg-white p-3 border border-gray-200 mb-4">
              <p className="font-medium text-sm mb-1">Transaction Hash:</p>
              <div className="font-mono text-xs break-all">{transactionHash}</div>
              <a 
                href={`https://holesky.etherscan.io/tx/${transactionHash}`} 
                target="_blank" 
                rel="noopener noreferrer"
                className="text-blue-600 hover:underline text-sm inline-block mt-2"
              >
                View on Etherscan
              </a>
            </div>
            
            <p className="text-sm text-gray-600">
              Once the transaction is confirmed, your campaign will be active on the AdNet network.
            </p>
          </div>
          
          <Button 
            onClick={() => {
              setTransactionHash(null)
              router.push("/campaigns")
            }}
            className="w-full bg-[#0055FF] text-white border-[3px] border-black hover:bg-[#0044CC] font-bold py-4"
          >
            View All Campaigns
          </Button>
          
          <Button 
            onClick={() => setTransactionHash(null)}
            className="w-full mt-4 bg-white text-black border-[3px] border-black hover:bg-gray-100 font-bold py-4"
          >
            Create Another Campaign
          </Button>
        </div>
      </div>
    )
  }

  return (
    <div className="border-[6px] border-black bg-white p-6 h-full flex flex-col">
      {/* Header */}
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-black flex items-center gap-2">
        <Target className="w-6 h-6" />
        Create Campaign
      </h2>
        <p className="font-bold">
          Step {step} of {totalSteps}: {step === 1 ? "Campaign Details" : step === 2 ? "Budget & Duration" : step === 3 ? "Target Locations" : "Creatives"}
        </p>
      </div>
      
      {/* Step indicators */}
      <div className="flex justify-between relative mb-8">
        {[1, 2, 3, 4].map((s) => (
          <div
            key={s}
            className={`relative z-10 flex flex-col items-center ${step >= s ? "opacity-100" : "opacity-50"}`}
          >
            <div
              className={`w-10 h-10 flex items-center justify-center border-[3px] border-black font-black text-lg ${
                step > s ? "bg-[#0055FF] text-white" : step === s ? "bg-[#FFCC00]" : "bg-white"
              } hover:scale-110 transition-transform`}
            >
              {s}
            </div>
            <div className="text-center mt-2 font-bold text-xs">
              {s === 1 && "Details"}
              {s === 2 && "Budget"}
              {s === 3 && "Locations"}
              {s === 4 && "Creatives"}
            </div>
          </div>
        ))}

        {/* Connecting lines */}
        <div className="absolute top-5 left-0 w-full h-[3px] bg-black -z-0">
          <div
            className="h-full bg-[#0055FF]"
            style={{ width: `${(step - 1) * 50}%`, transition: "width 0.5s ease-in-out" }}
          ></div>
        </div>
      </div>

      <div className="flex-grow overflow-auto">
        {/* Blockchain connection section */}
        {showBlockchainInfo && (
          <div className="mb-6">
            {!authenticated ? (
              <div className="flex items-start gap-4 p-4 bg-amber-50 border-[3px] border-amber-200">
                <AlertCircle className="w-6 h-6 text-amber-500 flex-shrink-0 mt-1" />
                <div>
                  <h3 className="font-bold mb-2">Connect Your Wallet</h3>
                  <p className="mb-3 text-sm">To create a campaign on the blockchain, you'll need to connect your wallet first.</p>
                  <Button
                    onClick={handleConnectWallet}
                    className="bg-[#0055FF] text-white border-[2px] border-black hover:bg-[#003cc7] transition-all font-bold px-4 py-2 h-auto rounded-none"
                  >
                    Connect Wallet
                  </Button>
                </div>
              </div>
            ) : !isCorrectChain ? (
              <div className="flex items-start gap-4 p-4 bg-red-50 border-[3px] border-red-200">
                <AlertCircle className="w-6 h-6 text-red-500 flex-shrink-0 mt-1" />
                <div>
                  <h3 className="font-bold mb-2">Wrong Network</h3>
                  <p className="mb-3 text-sm">Please switch to the Holesky testnet to create a campaign on the blockchain.</p>
                  <Button
                    onClick={handleSwitchNetwork}
                    className="bg-red-500 text-white border-[2px] border-black hover:bg-red-600 transition-all font-bold px-4 py-2 h-auto rounded-none"
                  >
                    Switch to Holesky Testnet
                  </Button>
                </div>
              </div>
            ) : (
              <div className="p-4 bg-green-50 border-[3px] border-green-200">
                <div className="font-bold text-green-800 mb-2">Ready to Submit</div>
                <p className="text-sm text-gray-700 mb-3">
                  Your wallet is connected and on the correct network. Click "Create Campaign" to submit to the blockchain.
                </p>
                <div className="bg-white border border-gray-200 p-3 rounded-md">
                  <div className="flex justify-between text-xs mb-1">
                    <span className="font-medium">Wallet:</span>
                    <span className="font-mono">
                      {service ? 'Connected Wallet' : 'Not Connected'}
                    </span>
                  </div>
                  <div className="flex justify-between text-xs">
                    <span className="font-medium">Network:</span>
                    <span className="font-medium text-green-600">Holesky Testnet</span>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}
        
        {/* Step 1: Campaign Details */}
        {step === 1 && (
        <div className="space-y-4">
          <div>
              <Label htmlFor="name" className="font-bold mb-1 block">
                Campaign Name
              </Label>
            <Input
                id="name"
                value={draftCampaign.name || ""}
                onChange={(e) => handleInputChange("name", e.target.value)}
                className={`border-[3px] ${errors.name ? "border-red-500" : "border-black"} rounded-none`}
              placeholder="Enter campaign name"
            />
              {errors.name && <div className="text-red-500 text-sm mt-1">{errors.name}</div>}
          </div>

          <div>
              <Label htmlFor="description" className="font-bold mb-1 block">
                Campaign Description
              </Label>
            <Textarea
                id="description"
                value={localDescription}
                onChange={(e) => setLocalDescription(e.target.value)}
                className="border-[3px] border-black rounded-none min-h-[100px]"
              placeholder="Enter campaign description"
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="startDate" className="font-bold mb-1 block">
                  Start Date
                </Label>
                <Popover open={startDateOpen} onOpenChange={setStartDateOpen}>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      className={`w-full border-[3px] ${errors.startDate ? 'border-red-500' : 'border-black'} rounded-none bg-white text-left font-normal justify-start px-3 relative`}
                    >
                      <Calendar className="mr-2 h-4 w-4" />
                      {draftCampaign.startDate ? (
                        format(new Date(draftCampaign.startDate), "PPP")
                      ) : (
                        <span>Select start date</span>
                      )}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="start">
                    <CalendarComponent
                      mode="single"
                      selected={draftCampaign.startDate ? new Date(draftCampaign.startDate) : undefined}
                      onSelect={(date) => {
                        if (date) {
                          const formattedDate = format(date, "yyyy-MM-dd");
                          handleInputChange("startDate", formattedDate);
                          setStartDateOpen(false);
                        }
                      }}
                      disabled={(date) => Boolean(date < new Date(new Date().setHours(0, 0, 0, 0)))}
                      initialFocus
                    />
                  </PopoverContent>
                </Popover>
                {errors.startDate && <div className="text-red-500 text-sm mt-1">{errors.startDate}</div>}
          </div>

          <div>
                <Label htmlFor="endDate" className="font-bold mb-1 block">
                  End Date
                </Label>
                <Popover open={endDateOpen} onOpenChange={setEndDateOpen}>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      className={`w-full border-[3px] ${errors.endDate ? 'border-red-500' : 'border-black'} rounded-none bg-white text-left font-normal justify-start px-3 relative`}
                    >
                      <Calendar className="mr-2 h-4 w-4" />
                      {draftCampaign.endDate ? (
                        format(new Date(draftCampaign.endDate), "PPP")
                      ) : (
                        <span>Select end date</span>
                      )}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="start">
                    <CalendarComponent
                      mode="single"
                      selected={draftCampaign.endDate ? new Date(draftCampaign.endDate) : undefined}
                      onSelect={(date) => {
                        if (date) {
                          const formattedDate = format(date, "yyyy-MM-dd");
                          handleInputChange("endDate", formattedDate);
                          setEndDateOpen(false);
                        }
                      }}
                      disabled={(date) => Boolean(
                        date < new Date(new Date().setHours(0, 0, 0, 0)) ||
                        (draftCampaign.startDate && date < new Date(draftCampaign.startDate))
                      )}
                      initialFocus
                    />
                  </PopoverContent>
                </Popover>
                {errors.endDate && <div className="text-red-500 text-sm mt-1">{errors.endDate}</div>}
              </div>
            </div>

            <div className="border-[3px] border-[#FFCC00] bg-[#FFCC00]/20 p-3">
              <div className="font-bold mb-1">Campaign Tips</div>
              <ul className="text-sm list-disc pl-5 space-y-1">
                <li>Use a clear, descriptive name</li>
                <li>Run campaigns for at least 7 days</li>
                <li>Plan ahead for seasonal promotions</li>
              </ul>
            </div>
          </div>
        )}

        {/* Step 2: Budget & Duration */}
        {step === 2 && (
          <div className="space-y-4">
            <div>
              <Label htmlFor="budget" className="font-bold mb-1 block">
                Budget (ADC)
              </Label>
              <div className="relative">
                <DollarSign className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500" />
                <Input
                  id="budget"
                  type="number"
                  value={draftCampaign.budget || ""}
                  onChange={(e) => handleInputChange("budget", Number.parseFloat(e.target.value))}
                  className={`border-[3px] ${errors.budget ? "border-red-500" : "border-black"} rounded-none pl-10`}
                  placeholder="Enter budget amount"
                  min="100"
                  step="100"
                />
                {errors.budget && <div className="text-red-500 text-sm mt-1">{errors.budget}</div>}
              </div>
              <div className="mt-1 text-sm">
                Equivalent to approximately {((draftCampaign.budget || 0) / 2.35).toFixed(2)} USDC
              </div>
            </div>

            <div className="border-[3px] border-black p-3 bg-[#f5f5f5]">
              <h3 className="font-bold mb-2">Estimated Reach</h3>
              <div className="space-y-2">
                <div className="flex justify-between">
                  <span className="font-medium">Daily Impressions:</span>
                  <span className="font-bold">
                    {Math.floor((draftCampaign.budget || 0) / 30 / 0.007).toLocaleString()}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="font-medium">Monthly Impressions:</span>
                  <span className="font-bold">
                    {Math.floor((draftCampaign.budget || 0) / 0.007).toLocaleString()}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="font-medium">Avg. Cost per Impression:</span>
                  <span className="font-bold">0.007 ADC</span>
                </div>
            </div>
          </div>

            <div className="border-[3px] border-[#0055FF] bg-[#0055FF]/10 p-3">
              <div className="font-bold mb-1">Budget Recommendations</div>
              <ul className="text-sm list-disc pl-5 space-y-1">
                <li>Minimum recommended: 1,000 ADC</li>
                <li>Optimal for city-wide campaign: 5,000+ ADC</li>
                <li>Budget can be adjusted anytime</li>
              </ul>
            </div>
          </div>
        )}

        {/* Step 3: Locations */}
        {step === 3 && (
          <div className="space-y-4">
          <div>
              <Label className="font-bold mb-2 block">
              Target Locations ({draftCampaign.targetLocations?.length || 0} selected)
              </Label>
            <Button
                className={`w-full border-[3px] ${errors.locations ? 'border-red-500' : 'border-black'} rounded-none bg-white text-black hover:bg-[#f5f5f5] font-bold flex items-center justify-between`}
              onClick={handleSelectLocations}
            >
              <div className="flex items-center">
                <MapPin className="mr-2 h-5 w-5" />
                  {draftCampaign.targetLocations?.length ? 
                    `${draftCampaign.targetLocations.length} location${draftCampaign.targetLocations.length !== 1 ? 's' : ''} selected` : 
                    'Select Locations'
                  }
              </div>
              <ArrowRight className="h-5 w-5" />
            </Button>
              {errors.locations && <div className="text-red-500 text-sm mt-1">{errors.locations}</div>}
              
              {/* Map visualization */}
              {draftCampaign.targetLocations && draftCampaign.targetLocations.length > 0 && (
                <div className="mt-4">
                  <CampaignLocationsMap
                    height="300px"
                    width="100%"
                    editable={false}
                    showControls={true}
                    showStats={true}
                    showFilters={false}
                    campaignId={0}
                  />
                  
                  <div className="mt-2 border-[3px] border-green-200 bg-green-50 p-3">
                    <p className="font-medium mb-2">Selected Locations:</p>
                    <div className="max-h-[200px] overflow-y-auto">
                      {draftCampaign.targetLocations.map((location) => (
                        <div key={location.id} className="p-2 bg-white mb-2 border border-gray-200 flex justify-between items-center">
                          <span>{location.name} - {location.city || 'Unknown location'}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              )}
            </div>
            
            <div className="border-[3px] border-[#FFCC00] bg-[#FFCC00]/10 p-4 flex gap-3">
              <Info className="w-5 h-5 flex-shrink-0 text-[#FFCC00]" />
              <div>
                <h4 className="font-bold text-sm">Campaign Creation on Blockchain</h4>
                <p className="text-sm mt-1">
                  Your campaign will be registered on the Holesky testnet. This process requires a wallet
                  connection and may take a few minutes to complete.
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Step 4: Creative Upload */}
        {step === 4 && (
          <div className="space-y-4">
          <div>
              <Label className="font-bold mb-2 block">
                Campaign Creative
              </Label>
              <p className="text-gray-600 mb-4">Upload the creative assets that will be displayed in your campaign.</p>
              
              <div
                className={`border-[4px] border-dashed ${errors.creative ? 'border-red-500' : 'border-black'} p-6 bg-[#f5f5f5] flex flex-col items-center justify-center hover:bg-[#e5e5e5] transition-colors cursor-pointer group`}
                onClick={() => document.getElementById("creative-upload")?.click()}
              >
                <input
                  id="creative-upload"
                  type="file"
                  className="hidden"
                  accept="image/jpeg,image/png,image/gif,video/mp4"
                  onChange={(e) => {
                    if (e.target.files && e.target.files[0]) {
                      handleInputChange("creativeFile", e.target.files[0])
                      // Create a preview URL
                      const url = URL.createObjectURL(e.target.files[0])
                      handleInputChange("creativeUrl", url)
                    }
                  }}
                />

                {draftCampaign.creativeUrl ? (
                  <div className="relative w-full h-full flex items-center justify-center">
                    <img
                      src={draftCampaign.creativeUrl}
                      alt="Creative preview"
                      className="max-h-[200px] max-w-full object-contain"
                    />
                    <div className="absolute inset-0 bg-black bg-opacity-0 hover:bg-opacity-30 flex items-center justify-center transition-all">
                      <p className="text-white opacity-0 group-hover:opacity-100 font-bold">Change File</p>
                    </div>
                  </div>
                ) : (
                  <>
                    <Upload className="w-12 h-12 mb-3 text-gray-400 group-hover:scale-110 transition-transform" />
                    <p className="font-bold text-base mb-1">Drag & Drop or Click to Upload</p>
                    <p className="text-xs text-center mb-3">Supported formats: JPG, PNG, MP4, GIF</p>
                    <Button className="bg-[#0055FF] text-white border-[3px] border-black hover:bg-[#0044CC] transition-all font-bold px-3 py-1 h-auto rounded-none">
                <Image className="mr-2 h-4 w-4" />
                Browse Files
                    </Button>
                  </>
                )}
              </div>
              {errors.creative && <div className="text-red-500 text-sm mt-1">{errors.creative}</div>}
            </div>

            <div className="border-[3px] border-black p-3 bg-[#f5f5f5]">
              <h3 className="font-bold mb-2">Creative Requirements</h3>
              <div className="space-y-1 text-sm">
                <div className="flex justify-between">
                  <span className="font-medium">Max File Size:</span>
                  <span className="font-bold">20MB</span>
                </div>
                <div className="flex justify-between">
                  <span className="font-medium">Dimensions:</span>
                  <span className="font-bold">1920×1080px (16:9)</span>
                </div>
                <div className="flex justify-between">
                  <span className="font-medium">Video Length:</span>
                  <span className="font-bold">Max 30 seconds</span>
                </div>
              </div>
            </div>
            
            <div className="border-[3px] border-[#0055FF] bg-[#0055FF]/10 p-3">
              <h3 className="font-bold mb-2">Creative Tips</h3>
              <ul className="text-sm list-disc pl-5 space-y-1">
                <li>Use high-resolution images for better visibility</li>
                <li>Keep videos short and engaging</li>
                <li>Ensure your creative follows our <a href="#" className="text-blue-600 hover:underline">content guidelines</a></li>
              </ul>
            </div>
            
            <div className="flex justify-between items-center p-3 border-[3px] border-green-200 bg-green-50">
              <div>
                <h4 className="font-bold">Ready to Create Campaign?</h4>
                <p className="text-sm">Review all information before submitting</p>
              </div>
              <Button
                className="bg-[#0055FF] text-white border-[2px] border-black hover:bg-[#0044CC] transition-all font-bold px-3 py-1 h-auto rounded-none text-sm"
                onClick={() => setShowBlockchainInfo(true)}
              >
                Review Wallet Connection
              </Button>
            </div>
          </div>
        )}
      </div>

      {/* Navigation buttons */}
      <div className="mt-6 pt-4 border-t-[3px] border-black flex justify-between">
        <Button
          variant="outline"
          className={`border-[3px] border-black rounded-none bg-white hover:bg-[#f5f5f5] transition-all font-bold px-3 py-1 h-auto flex items-center gap-1 ${step === 1 ? "opacity-50 cursor-not-allowed" : ""}`}
          onClick={handlePrev}
          disabled={step === 1 || isSubmitting || isStoreSubmitting}
        >
          <ChevronLeft className="w-4 h-4" />
          <span>Back</span>
        </Button>
        
        {step < totalSteps ? (
          <Button
            className="bg-[#0055FF] text-white border-[3px] border-black hover:bg-[#FFCC00] hover:text-black transition-all font-bold px-3 py-1 h-auto rounded-none shadow-[3px_3px_0px_0px_rgba(0,0,0,1)] hover:shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] hover:-translate-y-1 flex items-center gap-1"
            onClick={handleNext}
            disabled={isSubmitting || isStoreSubmitting}
          >
            <span>Next</span>
            <ChevronRight className="w-4 h-4" />
          </Button>
        ) : (
          <Button
            className="bg-[#FF3366] text-white border-[3px] border-black hover:bg-[#FFCC00] hover:text-black transition-all font-bold px-4 py-2 h-auto rounded-none shadow-[3px_3px_0px_0px_rgba(0,0,0,1)] hover:shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] hover:-translate-y-1 flex items-center gap-2"
            onClick={handleCreateCampaign}
            disabled={isSubmitting || isStoreSubmitting}
          >
            {isSubmitting || isStoreSubmitting ? (
              <>
                <Loader2 className="h-5 w-5 animate-spin" /> Processing...
              </>
            ) : (
              <>
                <span>Create Campaign</span>
                <Upload className="w-4 h-4" />
              </>
            )}
          </Button>
        )}
      </div>
      
      <button 
        onClick={() => setShowBlockchainInfo(!showBlockchainInfo)} 
        className="text-xs text-center w-full mt-3 text-gray-500 hover:text-gray-800 hover:underline"
      >
        {showBlockchainInfo ? "Hide wallet details" : "Show wallet details"}
      </button>
    </div>
  )
}

