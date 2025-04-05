"use client"

import { useState, useEffect } from "react"
import { X, ChevronRight, ChevronLeft, Calendar, Upload, DollarSign, MapPin, Image } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { useUIStore } from "@/lib/store"
import { useCampaignStore } from "@/lib/store"
import { toast } from "@/lib/toast"
import { useRouter } from "next/navigation"
import { usePrivy } from "@privy-io/react-auth"
import { useBlockchainService, useBoothRegistry } from "@/hooks"
import { CampaignMetadata } from "@/lib/blockchain/types"

export default function CreateCampaignModal() {
  const router = useRouter()
  const { activeModal, closeModal } = useUIStore()
  const { 
    draftCampaign, 
    updateDraftCampaign, 
    isSubmitting,
    startLocationSelection,
    finishLocationSelection,
    resetDraftCampaign
  } = useCampaignStore()
  const { authenticated, user, ready } = usePrivy()
  const { isCorrectChain, switchChain } = useBlockchainService()
  const { createCampaign, isCreatingCampaign } = useBoothRegistry()

  const [step, setStep] = useState(1)
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [localDescription, setLocalDescription] = useState("")
  const [isSubmittingModal, setIsSubmittingModal] = useState(false)
  const [transactionHash, setTransactionHash] = useState<string | null>(null)
  const totalSteps = 4

  // Reset step when modal opens
  useEffect(() => {
    if (activeModal === "createCampaign") {
      setStep(1)
      setErrors({})
      setIsSubmittingModal(false)
      setTransactionHash(null)
    }
  }, [activeModal])

  const handleInputChange = (field: string, value: any) => {
    updateDraftCampaign({ [field]: value })
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
        // On last step, submit the form
        handleSubmit()
      }
    }
  }

  const handleBackStep = () => {
    if (step === 1) {
      closeModal()
    } else {
      setStep(step - 1)
      // If we're moving back from the location step, make sure to finish location selection
      if (step === 4) {
        finishLocationSelection()
      }
    }
  }

  // Calculate duration in days between two dates
  const calculateDurationDays = (startDate: string, endDate: string): number => {
    return Math.ceil(
      (new Date(endDate).getTime() - new Date(startDate).getTime()) / (1000 * 60 * 60 * 24)
    );
  }

  const handleSubmit = async () => {
    if (!validateStep()) {
      return;
    }
    
    if (!authenticated) {
      toast("Wallet Required", { description: "Please connect your wallet to create a campaign" }, "error");
      return;
    }
    
    if (!isCorrectChain) {
      toast("Wrong Network", { description: "Please switch to Holesky testnet before creating a campaign" }, "error");
      return;
    }
    
    if (!draftCampaign.targetLocations || draftCampaign.targetLocations.length === 0) {
      toast("Locations Required", { description: "Please select at least one location for your campaign" }, "error");
      return;
    }
    
    setIsSubmittingModal(true);
    
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
      
      toast("Preparing transaction", { description: "Submitting to blockchain..." }, "info");
      
      // Extract location IDs for the contract call
      const locationIds = draftCampaign.targetLocations.map(loc => 
        typeof loc.id === 'number' ? loc.id : parseInt(loc.id.toString())
      ).filter(id => !isNaN(id));
      
      // Execute the contract function on the blockchain using the new hook
      const hash = await createCampaign(campaignMetadata, locationIds);
      
      if (hash) {
        setTransactionHash(hash);
        toast("Campaign Created", { description: "Your campaign has been created successfully on the blockchain!" }, "success");
        setTimeout(() => {
          resetDraftCampaign();
          closeModal();
          router.push("/campaigns");
        }, 3000);
      } else {
        throw new Error("Transaction failed");
      }
    } catch (error) {
      console.error("Campaign creation error:", error);
      toast("Campaign Creation Failed", { 
        description: typeof error === 'object' && error !== null && 'message' in error 
          ? (error as Error).message 
          : "There was an error creating your campaign. Please try again." 
      }, "error");
    } finally {
      setIsSubmittingModal(false);
    }
  }

  // Handle location selection
  const handleSelectLocations = () => {
    startLocationSelection()
    router.push("/locations")
    closeModal() // Close the modal when navigating away
  }

  // Creative file handling
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0]
      updateDraftCampaign({ creativeFile: file })
      
      // Create a preview URL
      const url = URL.createObjectURL(file)
      updateDraftCampaign({ creativeUrl: url })
    }
  }

  // Success view after campaign creation
  if (transactionHash) {
    return (
      <Dialog open={activeModal === "createCampaign"} onOpenChange={() => closeModal()}>
        <DialogContent className="border-[6px] border-black rounded-none shadow-[12px_12px_0px_0px_rgba(0,0,0,1)] p-0 w-[90vw] max-w-[600px] max-h-[90vh] transform rotate-[0.5deg] overflow-hidden">
          <div className="p-6 bg-white">
            <h2 className="text-2xl font-bold text-green-600 mb-4">Campaign Created Successfully!</h2>
            
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
            </div>
            
            <Button 
              onClick={() => {
                resetDraftCampaign();
                closeModal();
                router.push("/campaigns");
              }}
              className="w-full bg-[#0055FF] text-white border-[3px] border-black hover:bg-[#0044CC] font-bold py-4"
            >
              View All Campaigns
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    );
  }

  return (
    <Dialog open={activeModal === "createCampaign"} onOpenChange={() => !isSubmittingModal && closeModal()}>
      <DialogContent className="border-[6px] border-black rounded-none shadow-[12px_12px_0px_0px_rgba(0,0,0,1)] p-0 w-[90vw] max-w-[600px] max-h-[90vh] transform rotate-[0.5deg] overflow-hidden">
        <DialogTitle className="sr-only">Create Campaign</DialogTitle>
        <div className="relative h-full flex flex-col">
          {/* Header */}
          <div className="bg-[#0055FF] text-white p-6 border-b-[4px] border-black flex-shrink-0">
            <div className="absolute top-4 right-4">
              <Button
                variant="outline"
                size="icon"
                className="h-8 w-8 border-[3px] border-white rounded-none bg-transparent hover:bg-white hover:text-[#0055FF]"
                onClick={() => !isSubmittingModal && closeModal()}
                disabled={isSubmittingModal}
              >
                <X className="h-4 w-4" />
              </Button>
            </div>

            <h2 className="text-3xl font-black mb-2">Create Campaign</h2>
            <p className="font-bold">
              Step {step} of {totalSteps}: {step === 1 ? "Campaign Details" : step === 2 ? "Budget & Duration" : step === 3 ? "Target Locations" : "Creative Upload"}
            </p>
          </div>

          {/* Step indicators */}
          <div className="flex justify-between px-6 pt-6 relative flex-shrink-0">
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
                  {s === 4 && "Creative"}
                </div>
              </div>
            ))}

            {/* Connecting lines */}
            <div className="absolute top-11 left-0 w-full h-[3px] bg-black -z-0 px-6">
              <div
                className="h-full bg-[#0055FF]"
                style={{ width: `${(step - 1) * 50}%`, transition: "width 0.5s ease-in-out" }}
              ></div>
            </div>
          </div>

          {/* Content */}
          <div className="p-6 bg-white overflow-y-auto flex-grow">
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

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="startDate" className="font-bold mb-1 block">
                      Start Date
                    </Label>
                    <div className="relative">
                      <Calendar className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500" />
                      <Input
                        id="startDate"
                        type="date"
                        value={draftCampaign.startDate || ""}
                        onChange={(e) => handleInputChange("startDate", e.target.value)}
                        className={`border-[3px] ${errors.startDate ? "border-red-500" : "border-black"} rounded-none pl-10`}
                      />
                      {errors.startDate && <div className="text-red-500 text-sm mt-1">{errors.startDate}</div>}
                    </div>
                  </div>

                  <div>
                    <Label htmlFor="endDate" className="font-bold mb-1 block">
                      End Date
                    </Label>
                    <div className="relative">
                      <Calendar className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500" />
                      <Input
                        id="endDate"
                        type="date"
                        value={draftCampaign.endDate || ""}
                        onChange={(e) => handleInputChange("endDate", e.target.value)}
                        className={`border-[3px] ${errors.endDate ? "border-red-500" : "border-black"} rounded-none pl-10`}
                      />
                      {errors.endDate && <div className="text-red-500 text-sm mt-1">{errors.endDate}</div>}
                    </div>
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

            {/* Step 3: Target Locations */}
            {step === 3 && (
              <div className="space-y-6">
                <div>
                  <Label className="text-lg font-bold mb-4 block">Select Target Locations</Label>
                  <p className="mb-4">Choose the locations where your ad will be displayed. You can filter by city, type, or other criteria.</p>
                  
                  <Button 
                    onClick={handleSelectLocations}
                    className="bg-[#FF3366] text-white border-[3px] border-black hover:bg-[#FFCC00] hover:text-black transition-all font-bold px-5 py-3 h-auto rounded-none shadow-[3px_3px_0px_0px_rgba(0,0,0,1)] hover:shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] hover:-translate-y-1 flex items-center gap-2 w-full justify-center"
                    disabled={isSubmittingModal}
                  >
                    <MapPin className="w-5 h-5" />
                    <span>Browse Locations</span>
                  </Button>
                  
                  {draftCampaign?.targetLocations && draftCampaign.targetLocations.length > 0 ? (
                    <div className="mt-4 p-3 border-[3px] border-green-200 bg-green-50">
                      <p className="font-semibold mb-2">
                        {draftCampaign.targetLocations.length} location{draftCampaign.targetLocations.length !== 1 ? 's' : ''} selected
                      </p>
                      <div className="max-h-[200px] overflow-y-auto">
                        {draftCampaign.targetLocations.map((location, index) => (
                          <div key={index} className="p-2 bg-white mb-2 border border-gray-200 flex justify-between items-center">
                            <span>{location.name} - {location.city || 'Unknown location'}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  ) : (
                    <p className="mt-4 text-amber-600">No locations selected yet</p>
                  )}
                  {errors.locations && <div className="text-red-500 text-sm mt-2">{errors.locations}</div>}
                </div>
              </div>
            )}

            {/* Step 4: Creative Upload */}
            {step === 4 && (
              <div className="space-y-6">
                <div>
                  <Label className="text-lg font-bold mb-4 block">Creative Upload</Label>
                  <p className="mb-4">Upload the creative assets that will be displayed in your campaign.</p>
                  
                  <div
                    className={`border-[4px] border-dashed ${errors.creative ? 'border-red-500' : 'border-black'} p-6 bg-[#f5f5f5] flex flex-col items-center justify-center h-[200px] hover:bg-[#e5e5e5] transition-colors cursor-pointer group`}
                    onClick={() => document.getElementById("creative-upload-modal")?.click()}
                  >
                    <input
                      id="creative-upload-modal"
                      type="file"
                      className="hidden"
                      accept="image/jpeg,image/png,image/gif,video/mp4"
                      onChange={handleFileUpload}
                    />

                    {draftCampaign.creativeUrl ? (
                      <div className="relative w-full h-full flex items-center justify-center">
                        <img
                          src={draftCampaign.creativeUrl}
                          alt="Creative preview"
                          className="max-h-full max-w-full object-contain"
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
              </div>
            )}

            {/* Navigation buttons */}
            <div className="flex justify-between mt-6">
              <Button
                variant="outline"
                className={`border-[3px] border-black rounded-none bg-white hover:bg-[#f5f5f5] transition-all font-bold px-3 py-1 h-auto flex items-center gap-1 ${step === 1 ? "opacity-50 cursor-not-allowed" : ""}`}
                onClick={handleBackStep}
                disabled={step === 1 || isSubmittingModal}
              >
                <ChevronLeft className="w-4 h-4" />
                <span>Back</span>
              </Button>

              {step < totalSteps ? (
                <Button
                  className="bg-[#0055FF] text-white border-[3px] border-black hover:bg-[#FFCC00] hover:text-black transition-all font-bold px-3 py-1 h-auto rounded-none shadow-[3px_3px_0px_0px_rgba(0,0,0,1)] hover:shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] hover:-translate-y-1 flex items-center gap-1"
                  onClick={handleNext}
                  disabled={isSubmittingModal}
                >
                  <span>Next</span>
                  <ChevronRight className="w-4 h-4" />
                </Button>
              ) : (
                <Button
                  onClick={handleSubmit}
                  className="bg-[#FF3366] text-white border-[3px] border-black hover:bg-[#FFCC00] hover:text-black transition-all font-bold px-3 py-1 h-auto rounded-none shadow-[3px_3px_0px_0px_rgba(0,0,0,1)] hover:shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] hover:-translate-y-1 flex items-center gap-1"
                  disabled={isSubmittingModal}
                >
                  {isSubmittingModal ? (
                    <>Processing...</>
                  ) : (
                    <>
                      <span>Submit Campaign</span>
                      <Upload className="w-4 h-4" />
                    </>
                  )}
                </Button>
              )}
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}

