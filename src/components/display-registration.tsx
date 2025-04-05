"use client"

import { useState, useEffect } from "react"
import Image from "next/image"
import { MapPin, Upload, Camera, QrCode, Wifi, ChevronRight, ChevronLeft, Plus, Loader2, AlertCircle, Check, AlertTriangle } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Slider } from "@/components/ui/slider"
import { useAdContract, AdContractProvider } from "@/hooks/use-ad-contract-compat"
import { usePrivy } from "@privy-io/react-auth"
import { toast } from "@/lib/toast"
import { parseUnits } from "viem"
import { useBoothManager } from "@/hooks/use-booth-manager"

function DisplayRegistrationContent() {
  const [currentStep, setCurrentStep] = useState(1)
  const [formData, setFormData] = useState({
    name: "",
    address: "",
    city: "",
    latitude: "",
    longitude: "",
    displayType: "digital",
    size: "medium",
    footTraffic: "500",
    deviceId: "",
    photos: [],
    description: "",
    pricePerDay: "50",
    isVisible: true
  })
  
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [transactionHash, setTransactionHash] = useState<string | null>(null)
  const [registrationComplete, setRegistrationComplete] = useState(false)
  
  const { operations, adContract, isLoading, error, isCorrectChain, switchChain } = useAdContract()
  const { execute: registerBooth, isLoading: isRegistering } = operations.registerBooth
  const { authenticated, user, login } = usePrivy()
  const { 
    error: boothError 
  } = useBoothManager()

  // Auto-generate a device ID when component mounts
  useEffect(() => {
    setFormData(prev => ({
      ...prev,
      deviceId: generateRandomDeviceId().toString()
    }))
  }, [])

  // Validate current step and return if valid
  const validateStep = (step: number): boolean => {
    const errors: Record<string, string> = {};
    
    switch (step) {
      case 1: // Basic details
        if (!formData.name.trim()) errors.name = "Display name is required";
        if (!formData.address.trim()) errors.address = "Address is required";
        if (!formData.city.trim()) errors.city = "City is required";
        break;
        
      case 2: // Display specifications
        if (!formData.displayType) errors.displayType = "Display type is required";
        if (!formData.size) errors.size = "Size is required";
        if (!formData.footTraffic) errors.footTraffic = "Foot traffic estimate is required";
        
        const price = parseFloat(formData.pricePerDay);
        if (isNaN(price) || price <= 0) {
          errors.pricePerDay = "Price must be a positive number";
        }
        break;
        
      case 3: // Device setup
        if (!formData.deviceId.trim()) {
          errors.deviceId = "Device ID is required";
        }
        break;
    }
    
    // Show toast for each error
    const errorMessages = Object.values(errors);
    if (errorMessages.length > 0) {
      toast("Validation Error", { description: errorMessages[0] }, "error");
      return false;
    }
    
    return true;
  }

  const handleNextStep = () => {
    if (validateStep(currentStep)) {
      setCurrentStep((prev) => prev + 1)
    }
  }

  const handlePrevStep = () => {
    setCurrentStep((prev) => Math.max(1, prev - 1))
  }

  const handleInputChange = (field: string, value: any) => {
    setFormData((prev) => ({
      ...prev,
      [field]: value,
    }))
  }
  
  const generateRandomDeviceId = () => {
    // Generate a number between 1000 and 9999
    return Math.floor(Math.random() * 9000) + 1000;
  }
  
  const handleConnectWallet = async () => {
    try {
      await login()
      toast("Wallet Connected", { description: "Your wallet is now connected" }, "success")
    } catch (error) {
      toast("Connection Failed", { description: "Failed to connect wallet" }, "error")
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
  
  const handleSubmitRegistration = async () => {
    setIsSubmitting(true);
    
    try {
      // Validate wallet connectivity
      if (!authenticated) {
        throw new Error("Please connect your wallet first");
      }
      
      // Validate network before proceeding
      if (!isCorrectChain) {
        await switchChain();
        throw new Error("Please switch to the correct network first");
      }
      
      // Build metadata with display info and coordinates
      const additionalInfo = formData.latitude && formData.longitude
        ? `coords:${formData.latitude},${formData.longitude}|traffic:${formData.footTraffic}|price:${formData.pricePerDay}`
        : `traffic:${formData.footTraffic}|price:${formData.pricePerDay}`;
      
      // Prepare the options for booth registration
      const deviceId = parseInt(formData.deviceId);
      const metadata = {
        location: `${formData.address}, ${formData.city}`,
        displaySize: formData.size,
        additionalInfo
      };
      
      // Register the booth using the new hook
      const txHash = await registerBooth(deviceId, metadata);
      
      if (txHash) {
        // Set transaction hash and show success message
        setTransactionHash(typeof txHash === 'string' ? txHash : null);
        setRegistrationComplete(true);
        toast("Registration Successful", { description: "Your display has been registered successfully!" }, "success");
      } else {
        throw new Error("Registration failed - no transaction hash received");
      }
    } catch (error: any) {
      console.error("Registration error:", error);
      toast(
        "Registration Failed", 
        { description: error.message || "Failed to register your display. Please try again." }, 
        "error"
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  // Restart the process after a successful submission
  const handleStartOver = () => {
    setCurrentStep(1);
    setFormData({
      name: "",
      address: "",
      city: "",
      latitude: "",
      longitude: "",
      displayType: "digital",
      size: "medium",
      footTraffic: "500",
      deviceId: generateRandomDeviceId().toString(),
      photos: [],
      description: "",
      pricePerDay: "50",
      isVisible: true
    });
    setTransactionHash(null);
    setRegistrationComplete(false);
  }

  // Step 1: Basic location details
  const renderBasicDetailsStep = () => (
    <div className="animate-in fade-in duration-500 space-y-8">
      <div className="flex flex-col md:flex-row gap-4 md:gap-8">
        <div className="flex-1 space-y-4">
          <div>
            <label className="font-bold mb-1 block">Display Name*</label>
            <Input 
              value={formData.name}
              onChange={(e) => handleInputChange("name", e.target.value)}
              placeholder="e.g., Times Square Billboard"
              className="border-[3px] border-black p-3 text-lg rounded-none"
            />
          </div>
          
          <div>
            <label className="font-bold mb-1 block">Street Address*</label>
            <Input 
              value={formData.address}
              onChange={(e) => handleInputChange("address", e.target.value)}
              placeholder="e.g., 1234 Broadway Ave"
              className="border-[3px] border-black p-3 text-lg rounded-none"
            />
          </div>
          
          <div>
            <label className="font-bold mb-1 block">City*</label>
            <Input 
              value={formData.city}
              onChange={(e) => handleInputChange("city", e.target.value)}
              placeholder="e.g., New York"
              className="border-[3px] border-black p-3 text-lg rounded-none"
            />
          </div>
        </div>
        
        <div className="flex-1 space-y-4">
          <div>
            <label className="font-bold mb-1 block">Latitude (Optional)</label>
            <Input 
              value={formData.latitude}
              onChange={(e) => handleInputChange("latitude", e.target.value)}
              placeholder="e.g., 40.7128"
              className="border-[3px] border-black p-3 text-lg rounded-none"
            />
          </div>
          
          <div>
            <label className="font-bold mb-1 block">Longitude (Optional)</label>
            <Input 
              value={formData.longitude}
              onChange={(e) => handleInputChange("longitude", e.target.value)}
              placeholder="e.g., -74.0060"
              className="border-[3px] border-black p-3 text-lg rounded-none"
            />
          </div>
          
          <div>
            <label className="font-bold mb-1 block">Description (Optional)</label>
            <Textarea 
              value={formData.description}
              onChange={(e) => handleInputChange("description", e.target.value)}
              placeholder="Brief description of the location and display..."
              className="border-[3px] border-black p-3 text-lg rounded-none min-h-[100px]"
            />
          </div>
        </div>
      </div>
      
      <div className="flex justify-end">
        <Button
          onClick={handleNextStep}
          className="flex items-center justify-center bg-[#0055FF] text-white border-[3px] border-black hover:bg-[#003cc7] transition-all font-bold px-6 py-3 h-auto rounded-none"
        >
          Next <ChevronRight className="ml-2 h-5 w-5" />
        </Button>
      </div>
    </div>
  )

  // Step 2: Display specifications
  const renderDisplaySpecsStep = () => (
    <div className="animate-in fade-in duration-500 space-y-8">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div>
          <label className="font-bold mb-1 block">Display Type*</label>
          <select 
            value={formData.displayType} 
            onChange={(e) => handleInputChange("displayType", e.target.value)}
            className="border-[3px] border-black p-3 text-lg rounded-none w-full"
          >
            <option value="billboard">Billboard</option>
            <option value="digital">Digital Screen</option>
            <option value="transit">Transit Ad</option>
            <option value="storefront">Storefront</option>
            <option value="kiosk">Interactive Kiosk</option>
          </select>
        </div>
        
        <div>
          <label className="font-bold mb-1 block">Display Size*</label>
          <select 
            value={formData.size} 
            onChange={(e) => handleInputChange("size", e.target.value)}
            className="border-[3px] border-black p-3 text-lg rounded-none w-full"
          >
            <option value="small">Small ({"<"} 10 sqft)</option>
            <option value="medium">Medium (10-50 sqft)</option>
            <option value="large">Large ({">"}50 sqft)</option>
          </select>
        </div>
        
        <div>
          <label className="font-bold mb-1 block">Daily Price (ADC Tokens)*</label>
          <Input 
            value={formData.pricePerDay}
            onChange={(e) => handleInputChange("pricePerDay", e.target.value)}
            type="number"
            min="1"
            className="border-[3px] border-black p-3 text-lg rounded-none"
          />
          <p className="text-sm text-gray-600 mt-1">
            This is the daily cost advertisers will pay to use this display
          </p>
        </div>
        
        <div>
          <label className="font-bold mb-1 block">Estimated Daily Foot Traffic*</label>
          <div className="flex items-center gap-4">
            <input
              type="range"
              min="0"
              max="1000"
              step="10"
              value={formData.footTraffic}
              onChange={(e) => handleInputChange("footTraffic", parseInt(e.target.value))}
              className="flex-1"
            />
            <span className="font-bold text-lg min-w-[80px] text-center">
              {formData.footTraffic} ppl/day
            </span>
          </div>
        </div>
      </div>
      
      <div className="border-t-2 border-gray-200 pt-6 flex justify-between">
        <Button
          onClick={handlePrevStep}
          className="flex items-center justify-center border-[3px] border-black bg-white text-black hover:bg-gray-100 transition-all font-bold px-6 py-3 h-auto rounded-none"
        >
          <ChevronLeft className="mr-2 h-5 w-5" /> Back
        </Button>
        
        <Button
          onClick={handleNextStep}
          className="flex items-center justify-center bg-[#0055FF] text-white border-[3px] border-black hover:bg-[#003cc7] transition-all font-bold px-6 py-3 h-auto rounded-none"
        >
          Next <ChevronRight className="ml-2 h-5 w-5" />
        </Button>
      </div>
    </div>
  )

  // Step 3: Device setup
  const renderDeviceSetupStep = () => (
    <div className="animate-in fade-in duration-500 space-y-8">
      <div className="bg-yellow-50 border-[3px] border-yellow-300 p-6 mb-6">
        <h3 className="font-bold text-lg mb-2">Device Information</h3>
        <p>
          Each ad display location needs a unique device ID that will be registered on the blockchain.
          This ID will be used to link your physical display to the AdNet protocol.
        </p>
      </div>
      
      <div>
        <label className="font-bold mb-1 block">Device ID*</label>
        <div className="flex gap-2">
          <Input 
            value={formData.deviceId}
            onChange={(e) => handleInputChange("deviceId", e.target.value)}
            placeholder="e.g., 0x123abc..."
            className="flex-1 border-[3px] border-black p-3 text-lg rounded-none font-mono"
          />
          <Button
            onClick={generateRandomDeviceId}
            className="border-[3px] border-black bg-gray-100 hover:bg-gray-200 transition-all px-4 rounded-none"
          >
            Generate
          </Button>
        </div>
        <p className="text-sm text-gray-600 mt-1">
          In a production environment, this would be a secure device ID from your hardware.
          For testing, you can generate a random ID.
        </p>
      </div>
      
      <div className="bg-blue-50 border-[3px] border-blue-200 p-6">
        <h3 className="font-bold text-lg flex items-center mb-2">
          <Wifi className="mr-2 h-5 w-5" /> 
          IoT Device Setup (Optional)
        </h3>
        <p className="mb-4">
          For a real deployment, you would set up a physical device with connectivity at your display location.
          This device would use the ID above to authenticate with the AdNet network.
        </p>
        <p className="text-sm text-gray-600">
          Since this is a test environment, you can proceed without setting up a physical device.
        </p>
      </div>
      
      <div className="border-t-2 border-gray-200 pt-6 flex justify-between">
        <Button
          onClick={handlePrevStep}
          className="flex items-center justify-center border-[3px] border-black bg-white text-black hover:bg-gray-100 transition-all font-bold px-6 py-3 h-auto rounded-none"
        >
          <ChevronLeft className="mr-2 h-5 w-5" /> Back
        </Button>
        
        <Button
          onClick={handleNextStep}
          className="flex items-center justify-center bg-[#0055FF] text-white border-[3px] border-black hover:bg-[#003cc7] transition-all font-bold px-6 py-3 h-auto rounded-none"
        >
          Next <ChevronRight className="ml-2 h-5 w-5" />
        </Button>
      </div>
    </div>
  )

  // Step 4: Media upload (photos)
  const renderMediaUploadStep = () => (
    <div className="animate-in fade-in duration-500 space-y-8">
      <div>
        <h3 className="font-bold text-lg mb-4">Upload Photos (Optional)</h3>
        <div className="border-[3px] border-black border-dashed p-8 flex flex-col items-center justify-center bg-gray-50">
          <Camera className="h-12 w-12 text-gray-400 mb-4" />
          <p className="mb-4 text-center">
            Drag and drop photos of your display location here, or click to browse
          </p>
          <Button
            className="border-[3px] border-black bg-white text-black hover:bg-gray-100 transition-all font-bold px-6 py-3 h-auto rounded-none"
          >
            Upload Photos
          </Button>
          <p className="text-xs text-gray-500 mt-4">
            Note: Image upload is not functional in this demo. In a production environment, photos would be uploaded to IPFS.
          </p>
        </div>
      </div>
      
      <div className="bg-gray-50 border-[3px] border-gray-200 p-6">
        <h3 className="font-bold text-lg mb-2">Review Your Information</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-4 mt-4">
          <div>
            <p className="text-sm font-semibold">Display Name:</p>
            <p>{formData.name}</p>
          </div>
          <div>
            <p className="text-sm font-semibold">Location:</p>
            <p>{formData.address}, {formData.city}</p>
          </div>
          <div>
            <p className="text-sm font-semibold">Display Type & Size:</p>
            <p>{formData.displayType === "billboard" ? "Billboard" : 
               formData.displayType === "digital" ? "Digital Screen" :
               formData.displayType === "transit" ? "Transit Ad" :
               formData.displayType === "storefront" ? "Storefront" :
               "Interactive Kiosk"
              } - {
               formData.size === "small" ? "Small (< 10 sqft)" :
               formData.size === "medium" ? "Medium (10-50 sqft)" :
               "Large (> 50 sqft)"
              }</p>
          </div>
          <div>
            <p className="text-sm font-semibold">Daily Price:</p>
            <p>{formData.pricePerDay} ADC</p>
          </div>
          <div>
            <p className="text-sm font-semibold">Device ID:</p>
            <p className="font-mono text-xs break-all">{formData.deviceId}</p>
          </div>
          <div>
            <p className="text-sm font-semibold">Foot Traffic:</p>
            <p>~{formData.footTraffic} people per day</p>
          </div>
        </div>
      </div>
      
      <div className="border-t-2 border-gray-200 pt-6 flex justify-between">
        <Button
          onClick={handlePrevStep}
          className="flex items-center justify-center border-[3px] border-black bg-white text-black hover:bg-gray-100 transition-all font-bold px-6 py-3 h-auto rounded-none"
        >
          <ChevronLeft className="mr-2 h-5 w-5" /> Back
        </Button>
        
        <Button
          onClick={handleNextStep}
          className="flex items-center justify-center bg-[#0055FF] text-white border-[3px] border-black hover:bg-[#003cc7] transition-all font-bold px-6 py-3 h-auto rounded-none"
        >
          Preview & Register <ChevronRight className="ml-2 h-5 w-5" />
        </Button>
      </div>
    </div>
  )

  // Final confirmation step with on-chain registration
  const renderContractStep = () => {
    // Not authenticated state
    if (!authenticated) {
      return (
        <div className="animate-in fade-in duration-500 space-y-6">
          <div className="flex items-start gap-4 p-6 bg-amber-50 border-[4px] border-amber-200">
            <AlertCircle className="w-8 h-8 text-amber-500 flex-shrink-0 mt-1" />
            <div>
              <h3 className="font-bold text-xl mb-2">Connect Your Wallet</h3>
              <p className="mb-4">To register your display on the blockchain, you'll need to connect your wallet first.</p>
              <Button
                onClick={handleConnectWallet}
                className="bg-[#0055FF] text-white border-[3px] border-black hover:bg-[#003cc7] transition-all font-bold px-6 py-3 h-auto rounded-none"
              >
                Connect Wallet
              </Button>
            </div>
          </div>
          
          <Button
            onClick={handlePrevStep}
            className="flex items-center justify-center border-[3px] border-black bg-white text-black hover:bg-gray-100 transition-all font-bold px-6 py-3 h-auto rounded-none"
          >
            <ChevronLeft className="mr-2 h-5 w-5" /> Back
          </Button>
        </div>
      )
    }
    
    // Error state
    if (boothError) {
      return (
        <div className="animate-in fade-in duration-500 space-y-6">
          <div className="flex items-start gap-4 p-6 bg-red-50 border-[4px] border-red-200">
            <AlertTriangle className="w-8 h-8 text-red-500 flex-shrink-0 mt-1" />
            <div>
              <h3 className="font-bold text-xl mb-2">Registration Error</h3>
              <p className="mb-4">{boothError.message}</p>
              <Button
                onClick={() => window.location.reload()}
                className="bg-black text-white border-[3px] border-black hover:bg-gray-800 transition-all font-bold px-6 py-3 h-auto rounded-none"
              >
                Reload Page
              </Button>
            </div>
          </div>
          
          <Button
            onClick={handlePrevStep}
            className="flex items-center justify-center border-[3px] border-black bg-white text-black hover:bg-gray-100 transition-all font-bold px-6 py-3 h-auto rounded-none"
          >
            <ChevronLeft className="mr-2 h-5 w-5" /> Back
          </Button>
        </div>
      )
    }
    
    // Success state after registration
    if (registrationComplete) {
      return (
        <div className="animate-in fade-in duration-500 space-y-6 text-center py-8">
          <div className="bg-green-100 flex items-center justify-center w-20 h-20 mx-auto rounded-full border-4 border-green-500">
            <Check className="h-10 w-10 text-green-600" />
          </div>
          
          <h2 className="text-2xl font-bold mb-2">Registration Successful!</h2>
          <p className="text-gray-600 mb-6">
            Your display has been successfully registered on the AdNet blockchain.
          </p>
          
          {transactionHash && (
            <div className="bg-gray-50 p-4 border-2 border-gray-200 rounded-md text-left mb-6">
              <p className="text-sm font-medium text-gray-700 mb-1">Transaction Hash:</p>
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
          )}
          
          <div className="flex flex-col gap-4">
            <Button
              className="bg-[#0055FF] text-white border-[3px] border-black hover:bg-[#003cc7] transition-all font-bold px-6 py-3 h-auto rounded-none mx-auto"
              onClick={handleStartOver}
            >
              Register Another Display
            </Button>
          </div>
        </div>
      )
    }
    
    // Registration form
    return (
      <div className="animate-in fade-in duration-500 space-y-6">
        <div className="border-[4px] border-black shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] mb-6 overflow-hidden">
          <div className="bg-white p-6 border-b-2 border-gray-100">
            <h3 className="text-xl font-bold mb-2">Confirm Registration</h3>
            <p className="text-gray-600">
              You're about to register your display location on the Holesky blockchain.
              This operation will require a transaction from your connected wallet.
            </p>
              </div>
          <div className="bg-white p-6">
            <div className="rounded-md bg-blue-50 p-4 mb-4">
              <p className="text-sm text-blue-700 font-medium">
                Ensure all details are correct before proceeding. This information will be stored permanently on the blockchain.
              </p>
          </div>
          
            <div className="flex flex-col md:flex-row gap-6">
              <div className="flex-1">
                <h4 className="font-bold mb-2">Display Details</h4>
                <ul className="space-y-1 text-sm">
                  <li><span className="font-semibold">Name:</span> {formData.name}</li>
                  <li><span className="font-semibold">Location:</span> {formData.address}, {formData.city}</li>
                  <li><span className="font-semibold">Type:</span> {formData.displayType === "billboard" ? "Billboard" : 
                    formData.displayType === "digital" ? "Digital Screen" :
                    formData.displayType === "transit" ? "Transit Ad" :
                    formData.displayType === "storefront" ? "Storefront" :
                    "Interactive Kiosk"}
                  </li>
                  <li><span className="font-semibold">Size:</span> {
                    formData.size === "small" ? "Small (< 10 sqft)" :
                    formData.size === "medium" ? "Medium (10-50 sqft)" :
                    "Large (> 50 sqft)"
                  }</li>
                  <li><span className="font-semibold">Daily Traffic:</span> ~{formData.footTraffic} people</li>
                </ul>
              </div>
              
              <div className="flex-1">
                <h4 className="font-bold mb-2">Technical Details</h4>
                <ul className="space-y-1 text-sm">
                  <li><span className="font-semibold">Device ID:</span> <span className="font-mono text-xs">{formData.deviceId}</span></li>
                  <li><span className="font-semibold">Daily Price:</span> {formData.pricePerDay} ADC</li>
                  <li><span className="font-semibold">Contract:</span> <span className="font-mono text-xs">AdLocationRegistry</span></li>
                </ul>
              </div>
            </div>
          </div>
          
          <div className="bg-gray-50 p-6 border-t-2 border-gray-100 flex flex-col md:flex-row justify-end gap-4">
            <Button
              onClick={handlePrevStep}
              className="flex items-center justify-center border-[3px] border-black bg-white text-black hover:bg-gray-100 transition-all font-bold px-6 py-3 h-auto rounded-none"
            >
              <ChevronLeft className="mr-2 h-5 w-5" /> Back
            </Button>
            
            <Button
              onClick={handleSubmitRegistration}
              disabled={isSubmitting || isRegistering}
              className="flex items-center justify-center bg-[#0055FF] text-white border-[3px] border-black hover:bg-[#003cc7] transition-all font-bold px-6 py-3 h-auto rounded-none relative overflow-hidden"
            >
              {(isSubmitting || isRegistering) ? (
                <>
                  <div className="animate-spin h-5 w-5 border-2 border-white border-t-transparent rounded-full mr-2"></div>
                  Registering...
                </>
              ) : (
                <>Register Display</>
              )}
            </Button>
          </div>
        </div>
      </div>
    )
  }

  // Render appropriate step content
  const renderStepContent = () => {
    switch (currentStep) {
      case 1:
        return renderBasicDetailsStep();
      case 2:
        return renderDisplaySpecsStep();
      case 3:
        return renderDeviceSetupStep();
      case 4:
        return renderMediaUploadStep();
      case 5:
        return renderContractStep();
      default:
        return renderBasicDetailsStep();
    }
  }

  return (
    <div className="mb-10">
      {/* Step Indicator */}
      <div className="mb-8">
        <div className="flex items-center justify-between mb-4">
            {[1, 2, 3, 4, 5].map((step) => (
              <div
                key={step}
              className={`flex items-center justify-center w-8 h-8 rounded-full text-sm font-bold 
              ${
                currentStep === step
                  ? "bg-[#0055FF] text-white border-[2px] border-black"
                  : currentStep > step
                  ? "bg-[#CCCCCC] text-black border-[2px] border-black"
                  : "bg-white text-black border-[2px] border-black"
              }`}
                >
                  {step}
            </div>
                    ))}
                  </div>
        <div className="flex justify-between text-sm font-medium px-1">
          <span>Location</span>
          <span>Specs</span>
          <span>Device</span>
          <span>Media</span>
          <span>Register</span>
              </div>
            </div>
            
      {/* Step Content */}
      {renderStepContent()}
      </div>
  )
}

export default function DisplayRegistration() {
  return (
    <div className="border-[6px] border-black bg-white p-6 shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] transition-all hover:shadow-[12px_12px_0px_0px_rgba(0,0,0,1)] mt-6 relative overflow-hidden">
      <div className="flex items-center gap-3 mb-6">
        <div className="bg-[#FFCC00] w-10 h-10 flex items-center justify-center rounded-full border-[3px] border-black">
          <MapPin className="w-5 h-5" />
        </div>
        <h2 className="text-2xl font-black">Register New Display</h2>
      </div>
      
      <DisplayRegistrationContent />
    </div>
  )
}

export function DisplayRegistrationWithProvider() {
  return (
    <AdContractProvider>
      <DisplayRegistration />
    </AdContractProvider>
  );
}

