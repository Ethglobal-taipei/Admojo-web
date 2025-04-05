"use client"

import { useState } from 'react'
import { Button } from "@/components/ui/button"
import { useRouter } from "next/navigation"
import { ArrowLeft, Check, Calendar, Pencil, Loader2 } from "lucide-react"
import { Calendar as CalendarComponent } from "@/components/ui/calendar"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { format } from "date-fns"
import { useContractData } from '@/lib/hooks/useContractData'
import { toast } from '@/lib/toast'
import { cn } from '@/lib/utils'

export default function CreateCampaignForm() {
  const router = useRouter()
  const { contractSystem } = useContractData()
  
  const [step, setStep] = useState(1)
  const [campaignName, setCampaignName] = useState("")
  const [startDate, setStartDate] = useState<Date | undefined>(undefined)
  const [duration, setDuration] = useState<number>(30)
  const [budget, setBudget] = useState<string>("1000")
  const [contentUrl, setContentUrl] = useState<string>("")
  
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [createdCampaignId, setCreatedCampaignId] = useState<string | null>(null)
  
  const handleBack = () => {
    if (step > 1) {
      setStep(step - 1)
    } else {
      router.push("/dashboard/campaigns")
    }
  }
  
  const handleNext = () => {
    // Validate current step
    if (step === 1 && !campaignName) {
      toast("Campaign name is required", { description: "Please enter a name for your campaign" }, "warning")
      return
    }
    
    if (step === 2 && !startDate) {
      toast("Start date is required", { description: "Please select a start date for your campaign" }, "warning")
      return
    }
    
    if (step === 3) {
      const budgetNum = Number(budget)
      if (isNaN(budgetNum) || budgetNum <= 0) {
        toast("Invalid budget", { description: "Please enter a valid budget amount" }, "warning")
        return
      }
    }
    
    if (step < 4) {
      setStep(step + 1)
    } else {
      handleCreateCampaign()
    }
  }
  
  // Generate a random campaign ID for the smart contract
  const generateRandomCampaignId = (): string => {
    const randomBytes = new Uint8Array(32)
    window.crypto.getRandomValues(randomBytes)
    return '0x' + Array.from(randomBytes)
      .map(b => b.toString(16).padStart(2, '0'))
      .join('')
  }
  
  const handleCreateCampaign = async () => {
    if (!contractSystem) {
      toast(
        "Wallet not connected",
        { description: "Please connect your wallet to create a campaign" },
        "error"
      )
      return
    }
    
    if (!startDate) {
      toast("Invalid start date", { description: "Please select a valid start date" }, "warning")
      return
    }
    
    setIsSubmitting(true)
    
    try {
      // Calculate start date in seconds
      const startTimestamp = BigInt(Math.floor(startDate.getTime() / 1000))
      
      // Generate campaign ID
      const campaignId = generateRandomCampaignId()
      
      // Generate content URL from campaign name
      // In a real implementation, this would likely involve uploading content to IPFS
      // For now, we'll create a deterministic URL based on the campaign name and ID
      const contentHash = btoa(`${campaignName}-${campaignId.slice(0, 10)}`).replace(/=/g, '')
      const generatedContentUrl = `ipfs://${contentHash}`
      
      // Create the campaign on the blockchain
      const hash = await contractSystem.createCampaign({
        name: campaignName,
        description: campaignName,
        contentURI: generatedContentUrl,
        startDate: startTimestamp,
        duration: duration,
        additionalInfo: `budget:${budget}`
      }, [])
      
      // Store the campaign ID
      setCreatedCampaignId(campaignId)
      
      // Wait for transaction to be mined
      await contractSystem.waitForTransaction(hash)
      
      // Show success message
      toast(
        "Campaign created successfully",
        { description: "Your campaign has been created and is ready for configuration." },
        "success"
      )
      
      // Navigate to campaign details page
      router.push(`/dashboard/campaigns/${campaignId}`)
    } catch (error: any) {
      console.error('Error creating campaign:', error)
      toast(
        "Campaign creation failed",
        { description: error.message || "There was an error creating your campaign" },
        "error"
      )
      setIsSubmitting(false)
    }
  }
  
  const renderStep = () => {
    switch (step) {
      case 1:
        return (
          <div className="space-y-6">
            <h2 className="text-2xl font-bold">Let's create your campaign</h2>
            <p className="text-gray-500">
              Ad campaigns help you organize your advertising displays and budget.
            </p>
            
            <div className="space-y-4">
              <div>
                <label htmlFor="name" className="block font-bold mb-2">
                  Campaign Name
                </label>
                <input
                  type="text"
                  id="name"
                  value={campaignName}
                  onChange={(e) => setCampaignName(e.target.value)}
                  placeholder="Summer 2023 Marketing"
                  className="w-full border-[3px] border-black p-3 text-lg"
                />
              </div>
            </div>
          </div>
        )
      
      case 2:
        return (
          <div className="space-y-6">
            <h2 className="text-2xl font-bold">When will your campaign run?</h2>
            <p className="text-gray-500">
              Choose when your campaign starts and how long it will run.
            </p>
            
            <div className="space-y-4">
              <div>
                <label className="block font-bold mb-2">
                  Start Date
                </label>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      variant={"outline"}
                      className={cn(
                        "w-full justify-start text-left font-normal border-[3px] border-black p-3 h-auto rounded-none",
                        !startDate && "text-muted-foreground"
                      )}
                    >
                      <Calendar className="mr-2 h-4 w-4" />
                      {startDate ? format(startDate, "PPP") : <span>Pick a date</span>}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0 border-[3px] border-black" align="start">
                    <CalendarComponent
                      mode="single"
                      selected={startDate}
                      onSelect={setStartDate}
                      initialFocus
                      disabled={(date) => date < new Date(Date.now() + 24 * 60 * 60 * 1000)}
                    />
                  </PopoverContent>
                </Popover>
              </div>
              
              <div>
                <label htmlFor="duration" className="block font-bold mb-2">
                  Duration (days)
                </label>
                <div className="flex gap-4">
                  {[7, 14, 30, 60, 90].map((days) => (
                    <Button
                      key={days}
                      type="button"
                      onClick={() => setDuration(days)}
                      className={`flex-1 border-[3px] border-black rounded-none h-auto py-2 px-4 ${
                        duration === days
                          ? "bg-[#0055FF] text-white"
                          : "bg-white text-black hover:bg-[#f5f5f5]"
                      }`}
                    >
                      {days}
                    </Button>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )
      
      case 3:
        return (
          <div className="space-y-6">
            <h2 className="text-2xl font-bold">Set your campaign budget</h2>
            <p className="text-gray-500">
              Your budget will be allocated across all the displays you select.
            </p>
            
            <div className="space-y-4">
              <div>
                <label htmlFor="budget" className="block font-bold mb-2">
                  Total Budget (ADC)
                </label>
                <input
                  type="number"
                  id="budget"
                  value={budget}
                  onChange={(e) => setBudget(e.target.value)}
                  min="100"
                  step="100"
                  className="w-full border-[3px] border-black p-3 text-lg"
                />
              </div>
              
              <div className="grid grid-cols-3 gap-3">
                {[1000, 5000, 10000].map((amount) => (
                  <Button
                    key={amount}
                    type="button"
                    onClick={() => setBudget(amount.toString())}
                    className={`border-[3px] border-black rounded-none h-auto py-2 px-4 ${
                      budget === amount.toString()
                        ? "bg-[#0055FF] text-white"
                        : "bg-white text-black hover:bg-[#f5f5f5]"
                    }`}
                  >
                    {amount.toLocaleString()} ADC
                  </Button>
                ))}
              </div>
            </div>
          </div>
        )
      
      case 4:
        return (
          <div className="space-y-6">
            <h2 className="text-2xl font-bold">Review and create campaign</h2>
            <p className="text-gray-500">
              Please review your campaign details before creating it.
            </p>
            
            <div className="space-y-4 bg-[#f5f5f5] p-4 border-l-4 border-black">
              <div className="flex justify-between">
                <div className="font-bold">Campaign Name</div>
                <div className="flex items-center">
                  <span>{campaignName}</span>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setStep(1)}
                    className="ml-2 h-auto p-1"
                  >
                    <Pencil className="h-3 w-3" />
                  </Button>
                </div>
              </div>
              
              <div className="flex justify-between">
                <div className="font-bold">Start Date</div>
                <div className="flex items-center">
                  <span>{startDate ? format(startDate, "MMM d, yyyy") : "Not set"}</span>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setStep(2)}
                    className="ml-2 h-auto p-1"
                  >
                    <Pencil className="h-3 w-3" />
                  </Button>
                </div>
              </div>
              
              <div className="flex justify-between">
                <div className="font-bold">Duration</div>
                <div className="flex items-center">
                  <span>{duration} days</span>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setStep(2)}
                    className="ml-2 h-auto p-1"
                  >
                    <Pencil className="h-3 w-3" />
                  </Button>
                </div>
              </div>
              
              <div className="flex justify-between">
                <div className="font-bold">Budget</div>
                <div className="flex items-center">
                  <span>{Number(budget).toLocaleString()} ADC</span>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setStep(3)}
                    className="ml-2 h-auto p-1"
                  >
                    <Pencil className="h-3 w-3" />
                  </Button>
                </div>
              </div>
            </div>
            
            <div className="text-sm">
              After creating your campaign, you'll be able to add display locations and activate it.
            </div>
          </div>
        )
      
      default:
        return null
    }
  }
  
  return (
    <div className="container max-w-xl py-8">
      <Button
        onClick={handleBack}
        variant="ghost"
        className="mb-6 pl-0 text-gray-500 hover:text-black"
      >
        <ArrowLeft className="mr-2 h-4 w-4" />
        {step === 1 ? "Back to campaigns" : "Back"}
      </Button>
      
      <div className="mb-8">
        <div className="flex items-center">
          {[1, 2, 3, 4].map((stepNumber) => (
            <div key={stepNumber} className="flex items-center">
              <div 
                className={`flex items-center justify-center w-8 h-8 rounded-full border-2 border-black font-bold ${
                  stepNumber === step
                    ? "bg-[#0055FF] text-white"
                    : stepNumber < step
                    ? "bg-[#33CC99] text-white"
                    : "bg-white text-black"
                }`}
              >
                {stepNumber < step ? <Check className="h-4 w-4" /> : stepNumber}
              </div>
              {stepNumber < 4 && (
                <div 
                  className={`w-12 h-0.5 ${
                    stepNumber < step ? "bg-[#33CC99]" : "bg-gray-300"
                  }`}
                />
              )}
            </div>
          ))}
        </div>
      </div>
      
      <div className="border-[4px] border-black p-6 shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] bg-white mb-6">
        {renderStep()}
      </div>
      
      <div className="flex justify-between">
        <Button
          onClick={handleBack}
          className="bg-white text-black border-[3px] border-black hover:bg-[#f5f5f5] transition-all font-bold px-4 py-2 h-auto rounded-none hover:-translate-y-1 hover:shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]"
        >
          {step === 1 ? "Cancel" : "Back"}
        </Button>
        
        <Button
          onClick={handleNext}
          disabled={isSubmitting}
          className="bg-[#0055FF] text-white border-[3px] border-black hover:bg-[#FFCC00] hover:text-black transition-all font-bold px-4 py-2 h-auto rounded-none hover:-translate-y-1 hover:shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]"
        >
          {isSubmitting ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Creating...
            </>
          ) : step === 4 ? (
            "Create Campaign"
          ) : (
            "Continue"
          )}
        </Button>
      </div>
    </div>
  )
} 