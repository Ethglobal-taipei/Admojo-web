"use client"

import { useState, useEffect } from "react"
import { useParams, useRouter } from "next/navigation"
import {
  ArrowLeft,
  Save,
  Trash2,
  Plus,
  X,
  Upload,
  MapPin,
  RefreshCw,
  AlertCircle,
  CheckCircle,
  Rocket
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { useLocationStore } from "@/lib/store/useLocationStore"
import { useRoleStore, useUserStore } from "@/lib/store"
import { toast } from "@/lib/toast"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from "@/components/ui/select"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Separator } from "@/components/ui/separator"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { useAdContract } from "@/hooks/use-ad-contract"
import { usePrivy } from "@privy-io/react-auth"
import { AdContractSystem } from "@/lib/AdCampaignSystem/AdCampaignSystem"

export default function EditLocationPage() {
  const params = useParams()
  const router = useRouter()
  const { isConnected } = useUserStore()
  const { currentRole: activeRole, isProviderRegistered } = useRoleStore()
  const { locations, fetchLocations, isLoading, updateLocation, deleteLocation } = useLocationStore()
  const { authenticated, ready, user } = usePrivy()
  const { operations, adContract, isCorrectChain, switchChain } = useAdContract()

  const [location, setLocation] = useState<any>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isRegistering, setIsRegistering] = useState(false)
  const [newImages, setNewImages] = useState<File[]>([])
  const [imageUrls, setImageUrls] = useState<string[]>([])
  const [activeTab, setActiveTab] = useState("details")
  
  // Basic form fields
  const [formData, setFormData] = useState({
    name: "",
    city: "",
    area: "",
    address: "",
    country: "",
    description: "",
    displayType: "digital",
    displaySize: "medium",
    pricePerDay: "100",
    dailyTraffic: "1000",
    dailyImpressions: "500",
    deviceId: ""
  })

  // Fetch location data when component mounts
  useEffect(() => {
    const fetchLocationData = async () => {
      if (!params.id) return

      try {
        await fetchLocations(user)
        const foundLocation = locations.find(loc => loc.id.toString() === params.id) as any
        
        if (foundLocation) {
          setLocation(foundLocation)
          
          // Set form data based on location
          setFormData({
            name: foundLocation.name || "",
            city: foundLocation.city || "",
            area: foundLocation.area || "",
            address: foundLocation.address || "",
            country: foundLocation.country || "",
            description: foundLocation.description || "",
            displayType: foundLocation.displayType || "digital",
            displaySize: foundLocation.displaySize || "medium",
            pricePerDay: foundLocation.pricePerDay?.toString() || "100",
            dailyTraffic: foundLocation.dailyTraffic?.toString() || "1000",
            dailyImpressions: foundLocation.dailyImpressions?.toString() || "500",
            deviceId: foundLocation.deviceId?.toString() || ""
          })
          
          // Set image URLs
          if (foundLocation.images && foundLocation.images.length > 0) {
            setImageUrls(foundLocation.images)
          }
          
          // If location has deviceId, fetch blockchain data
          if (foundLocation.deviceId && adContract) {
            try {
              const boothDetails = await adContract.getBoothDetails(foundLocation.deviceId)
              
              // Update location with blockchain data
              setLocation(prev => ({
                ...prev,
                status: boothDetails.status,
                isActive: boothDetails.active,
                owner: boothDetails.owner
              }))
            } catch (err) {
              console.error("Error fetching blockchain data:", err)
            }
          }
        } else {
          toast("Location Not Found", {
            description: "The location you're trying to edit could not be found."
          }, "error")
          router.push("/provider/locations")
        }
      } catch (error) {
        console.error("Error fetching location:", error)
        toast("Error", {
          description: "Failed to load location details. Please try again."
        }, "error")
      }
    }
    
    fetchLocationData()
  }, [params.id, fetchLocations, adContract, router, user])

  // Redirect if not connected or not a registered provider
  useEffect(() => {
    if (!isConnected) {
      toast(
        "Connect wallet first",
        { description: "You need to connect your wallet to manage your locations." },
        "warning",
      )
      router.push("/dashboard")
      return
    }

    if (isConnected && activeRole !== "provider") {
      toast(
        "Switch to provider mode",
        { description: "You need to be in provider mode to manage your locations." },
        "warning",
      )
      router.push("/dashboard")
      return
    }

    if (isConnected && activeRole === "provider" && !isProviderRegistered) {
      toast(
        "Register as provider",
        { description: "You need to register as a provider to manage your locations." },
        "warning",
      )
      router.push("/provider-registration")
      return
    }
  }, [isConnected, activeRole, isProviderRegistered, router])

  // Handle form input changes
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target
    setFormData(prev => ({
      ...prev,
      [name]: value
    }))
  }

  // Handle select changes
  const handleSelectChange = (name: string, value: string) => {
    setFormData(prev => ({
      ...prev,
      [name]: value
    }))
  }

  // Handle image uploads
  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      const filesArray = Array.from(e.target.files)
      setNewImages(prev => [...prev, ...filesArray])
      
      // Create URLs for preview
      const urls = filesArray.map(file => URL.createObjectURL(file))
      setImageUrls(prev => [...prev, ...urls])
    }
  }

  // Remove image
  const handleRemoveImage = (index: number) => {
    setImageUrls(prev => prev.filter((_, i) => i !== index))
    
    if (index < newImages.length) {
      setNewImages(prev => prev.filter((_, i) => i !== index))
    }
  }

  // Register on blockchain
  const handleRegisterOnBlockchain = async () => {
    if (!adContract || !operations) {
      toast("Not Connected", {
        description: "Please connect your wallet to register on blockchain."
      }, "error")
      return
    }
    
    if (!isCorrectChain) {
      toast("Wrong Network", {
        description: "Please switch to the correct network to register on blockchain."
      }, "warning")
      await switchChain()
      return
    }
    
    try {
      setIsRegistering(true)
      
      // Prepare metadata (convert to bytes format for blockchain)
      const metadata = {
        name: formData.name,
        city: formData.city,
        displayType: formData.displayType,
        displaySize: formData.displaySize,
        pricePerDay: formData.pricePerDay,
        additionalInfo: formData.description,
        location: formData.city
      }
      
      let deviceId = formData.deviceId ? parseInt(formData.deviceId) : null
      let hash
      
      if (!deviceId) {
        // Generate a unique device ID (you may want to improve this logic)
        deviceId = Math.floor(Math.random() * 1000000) + 1
        
        // Register new booth
        hash = await operations.registerBooth.execute(deviceId, metadata)
      } else {
        // Update existing booth metadata
        // Note: This assumes there's an updateBoothMetadata function in your contract
        // You may need to adjust based on your actual contract methods
      }
      
      if (hash) {
        toast("Blockchain Registration Successful", {
          description: "Your location has been registered on the blockchain."
        }, "success")
        
        // Update formData with new deviceId
        setFormData(prev => ({
          ...prev,
          deviceId: deviceId!.toString()
        }))
        
        // Update location in local state
        setLocation(prev => ({
          ...prev,
          deviceId
        }))
      } else {
        throw new Error("Transaction failed")
      }
    } catch (error) {
      console.error("Error registering on blockchain:", error)
      toast("Registration Failed", {
        description: "Failed to register location on blockchain. Please try again."
      }, "error")
    } finally {
      setIsRegistering(false)
    }
  }

  // Handle form submission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!location) return
    
    try {
      setIsSubmitting(true)
      
      // Process image uploads first if needed
      let imageList = [...imageUrls]
      
      // Here you would typically upload the images to your server/storage
      // and get the URLs back. For this example, we'll use the existing URLs.
      
      // Prepare updated location data
      const updatedLocation = {
        ...location,
        name: formData.name,
        city: formData.city,
        area: formData.area,
        address: formData.address,
        country: formData.country,
        description: formData.description,
        displayType: formData.displayType,
        displaySize: formData.displaySize,
        pricePerDay: parseFloat(formData.pricePerDay),
        dailyTraffic: parseInt(formData.dailyTraffic),
        dailyImpressions: parseInt(formData.dailyImpressions),
        deviceId: formData.deviceId ? parseInt(formData.deviceId) : undefined,
        images: imageList
      }
      
      // Update location in store
      await updateLocation(updatedLocation, user)
      
      toast("Location Updated", {
        description: "Your location has been successfully updated."
      }, "success")
      
      // Navigate back to location details page
      router.push(`/provider/locations/${params.id}`)
    } catch (error) {
      console.error("Error updating location:", error)
      toast("Update Failed", {
        description: "Failed to update location. Please try again."
      }, "error")
    } finally {
      setIsSubmitting(false)
    }
  }

  // Handle location deletion
  const handleDelete = async () => {
    if (!location) return
    
    // Show confirmation dialog
    if (confirm("Are you sure you want to delete this location? This action cannot be undone.")) {
      try {
        await deleteLocation(location.id)
        toast("Location Deleted", {
          description: "Your location has been successfully deleted."
        }, "success")
        router.push("/provider/locations")
      } catch (error) {
        // Error should be handled in the store
      }
    }
  }

  // Show loading state
  if (isLoading || !location) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="mb-6">
          <Button
            variant="outline"
            onClick={() => router.back()}
            className="border-[3px] border-black rounded-none bg-white hover:bg-[#f5f5f5]"
          >
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back
          </Button>
        </div>
        
        <div className="border-[4px] border-black p-8 animate-pulse">
          <div className="h-8 w-1/3 bg-gray-200 mb-6 rounded"></div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="h-10 w-full bg-gray-200 rounded"></div>
            <div className="h-10 w-full bg-gray-200 rounded"></div>
            <div className="h-10 w-full bg-gray-200 rounded"></div>
            <div className="h-10 w-full bg-gray-200 rounded"></div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex items-center justify-between mb-6">
        <Button
          variant="outline"
          onClick={() => router.back()}
          className="border-[3px] border-black rounded-none bg-white hover:bg-[#f5f5f5]"
        >
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back
        </Button>
        
        <div className="flex gap-2">
          <Button
            variant="outline"
            className="border-[3px] border-black rounded-none bg-white hover:bg-[#FF3366] hover:text-white"
            onClick={handleDelete}
          >
            <Trash2 className="mr-2 h-4 w-4" />
            Delete Location
          </Button>
          
          <Button
            className="bg-[#0055FF] text-white border-[3px] border-black hover:bg-[#0044CC]"
            onClick={handleSubmit}
            disabled={isSubmitting}
          >
            {isSubmitting ? (
              <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
            ) : (
              <Save className="mr-2 h-4 w-4" />
            )}
            Save Changes
          </Button>
        </div>
      </div>
      
      <Card className="border-[6px] border-black shadow-[8px_8px_0px_0px_rgba(0,0,0,1)]">
        <CardHeader className="pb-2 border-b-[3px] border-black">
          <CardTitle className="text-2xl font-black">Edit Location</CardTitle>
          <CardDescription>Update details for your advertising display location</CardDescription>
        </CardHeader>
        
        <CardContent className="pt-6">
          <Tabs
            defaultValue="details"
            value={activeTab}
            onValueChange={setActiveTab}
            className="space-y-6"
          >
            <TabsList className="border-2 border-black p-0 bg-[#f5f5f5]">
              <TabsTrigger
                value="details"
                className="rounded-none data-[state=active]:bg-[#0055FF] data-[state=active]:text-white"
              >
                Basic Details
              </TabsTrigger>
              <TabsTrigger
                value="blockchain"
                className="rounded-none data-[state=active]:bg-[#0055FF] data-[state=active]:text-white"
              >
                Blockchain Integration
              </TabsTrigger>
              <TabsTrigger
                value="images"
                className="rounded-none data-[state=active]:bg-[#0055FF] data-[state=active]:text-white"
              >
                Images
              </TabsTrigger>
              <TabsTrigger
                value="metrics"
                className="rounded-none data-[state=active]:bg-[#0055FF] data-[state=active]:text-white"
              >
                Metrics & Pricing
              </TabsTrigger>
            </TabsList>
            
            <form onSubmit={handleSubmit}>
              <TabsContent value="details" className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <Label htmlFor="name" className="font-medium">
                      Location Name *
                    </Label>
                    <Input
                      id="name"
                      name="name"
                      value={formData.name}
                      onChange={handleInputChange}
                      placeholder="Enter a name for your location"
                      className="border-2 border-black rounded-none"
                      required
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="displayType" className="font-medium">
                      Display Type *
                    </Label>
                    <Select
                      value={formData.displayType}
                      onValueChange={(value) => handleSelectChange("displayType", value)}
                    >
                      <SelectTrigger className="border-2 border-black rounded-none">
                        <SelectValue placeholder="Select display type" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="digital">Digital Screen</SelectItem>
                        <SelectItem value="billboard">Billboard</SelectItem>
                        <SelectItem value="poster">Poster</SelectItem>
                        <SelectItem value="kiosk">Interactive Kiosk</SelectItem>
                        <SelectItem value="other">Other</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="displaySize" className="font-medium">
                      Display Size *
                    </Label>
                    <Select
                      value={formData.displaySize}
                      onValueChange={(value) => handleSelectChange("displaySize", value)}
                    >
                      <SelectTrigger className="border-2 border-black rounded-none">
                        <SelectValue placeholder="Select display size" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="small">Small</SelectItem>
                        <SelectItem value="medium">Medium</SelectItem>
                        <SelectItem value="large">Large</SelectItem>
                        <SelectItem value="extra-large">Extra Large</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="city" className="font-medium">
                      City *
                    </Label>
                    <Input
                      id="city"
                      name="city"
                      value={formData.city}
                      onChange={handleInputChange}
                      placeholder="City"
                      className="border-2 border-black rounded-none"
                      required
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="area" className="font-medium">
                      Area/Neighborhood
                    </Label>
                    <Input
                      id="area"
                      name="area"
                      value={formData.area}
                      onChange={handleInputChange}
                      placeholder="Area or neighborhood"
                      className="border-2 border-black rounded-none"
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="country" className="font-medium">
                      Country *
                    </Label>
                    <Input
                      id="country"
                      name="country"
                      value={formData.country}
                      onChange={handleInputChange}
                      placeholder="Country"
                      className="border-2 border-black rounded-none"
                      required
                    />
                  </div>
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="address" className="font-medium">
                    Full Address *
                  </Label>
                  <Input
                    id="address"
                    name="address"
                    value={formData.address}
                    onChange={handleInputChange}
                    placeholder="Full street address"
                    className="border-2 border-black rounded-none"
                    required
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="description" className="font-medium">
                    Description
                  </Label>
                  <Textarea
                    id="description"
                    name="description"
                    value={formData.description}
                    onChange={handleInputChange}
                    placeholder="Describe your location, including details about visibility, nearby attractions, etc."
                    className="border-2 border-black rounded-none min-h-[120px]"
                  />
                </div>
                
                <div className="flex justify-end">
                  <Button
                    type="button"
                    onClick={() => setActiveTab("blockchain")}
                    className="bg-[#0055FF] text-white border-[3px] border-black hover:bg-[#0044CC]"
                  >
                    Next: Blockchain Integration
                  </Button>
                </div>
              </TabsContent>
              
              <TabsContent value="blockchain" className="space-y-6">
                <div className="bg-[#f5f5f5] border-[3px] border-black p-6">
                  <h3 className="text-xl font-bold mb-4">Blockchain Registration</h3>
                  
                  {!formData.deviceId ? (
                    <Alert className="mb-4">
                      <AlertCircle className="h-5 w-5" />
                      <AlertTitle>Not Registered</AlertTitle>
                      <AlertDescription>
                        This location is not yet registered on the blockchain. Register it to make it available for advertisers.
                      </AlertDescription>
                    </Alert>
                  ) : (
                    <Alert className="mb-4 bg-green-50 border-green-200">
                      <CheckCircle className="h-5 w-5 text-green-600" />
                      <AlertTitle>Registered</AlertTitle>
                      <AlertDescription>
                        This location is registered on the blockchain with Device ID: {formData.deviceId}
                      </AlertDescription>
                    </Alert>
                  )}
                  
                  <div className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="deviceId" className="font-medium">
                        Device ID (Leave blank for automatic generation)
                      </Label>
                      <Input
                        id="deviceId"
                        name="deviceId"
                        value={formData.deviceId}
                        onChange={handleInputChange}
                        placeholder="Device ID from blockchain"
                        className="border-2 border-black rounded-none"
                        disabled={!!location.deviceId}
                      />
                      <p className="text-sm text-gray-500">
                        {location.deviceId 
                          ? "The Device ID cannot be changed once registered" 
                          : "If left blank, a Device ID will be generated automatically when registering"}
                      </p>
                    </div>
                    
                    <Button
                      type="button"
                      onClick={handleRegisterOnBlockchain}
                      disabled={isRegistering}
                      className="bg-[#FFCC00] text-black border-[3px] border-black hover:bg-[#E5B800]"
                    >
                      {isRegistering ? (
                        <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
                      ) : (
                        <Rocket className="mr-2 h-4 w-4" />
                      )}
                      {formData.deviceId ? "Update on Blockchain" : "Register on Blockchain"}
                    </Button>
                  </div>
                </div>
                
                <div className="flex justify-between">
                  <Button
                    type="button"
                    onClick={() => setActiveTab("details")}
                    variant="outline"
                    className="border-[3px] border-black rounded-none bg-white hover:bg-[#f5f5f5]"
                  >
                    Back: Basic Details
                  </Button>
                  
                  <Button
                    type="button"
                    onClick={() => setActiveTab("images")}
                    className="bg-[#0055FF] text-white border-[3px] border-black hover:bg-[#0044CC]"
                  >
                    Next: Images
                  </Button>
                </div>
              </TabsContent>
              
              <TabsContent value="images" className="space-y-6">
                <div className="border-[3px] border-black p-6">
                  <h3 className="text-xl font-bold mb-4">Location Images</h3>
                  
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                    {imageUrls.map((url, index) => (
                      <div key={index} className="relative border-2 border-black group">
                        <img 
                          src={url} 
                          alt={`Location ${index + 1}`} 
                          className="w-full h-48 object-cover"
                        />
                        <Button
                          type="button"
                          variant="outline"
                          size="icon"
                          onClick={() => handleRemoveImage(index)}
                          className="absolute top-2 right-2 h-8 w-8 rounded-full bg-white border-2 border-black hover:bg-red-500 hover:text-white"
                        >
                          <X className="h-4 w-4" />
                        </Button>
                      </div>
                    ))}
                    
                    <label className="border-2 border-dashed border-black h-48 flex flex-col items-center justify-center cursor-pointer hover:bg-[#f5f5f5] transition-colors">
                      <Upload className="h-8 w-8 mb-2 text-gray-500" />
                      <span className="font-medium text-gray-700">Add Image</span>
                      <span className="text-sm text-gray-500">Click to upload</span>
                      <input
                        type="file"
                        accept="image/*"
                        className="hidden"
                        onChange={handleImageUpload}
                      />
                    </label>
                  </div>
                  
                  <p className="text-sm text-gray-500">
                    Upload high-quality images of your display. Good images increase the likelihood of advertisers booking your location.
                  </p>
                </div>
                
                <div className="flex justify-between">
                  <Button
                    type="button"
                    onClick={() => setActiveTab("blockchain")}
                    variant="outline"
                    className="border-[3px] border-black rounded-none bg-white hover:bg-[#f5f5f5]"
                  >
                    Back: Blockchain Integration
                  </Button>
                  
                  <Button
                    type="button"
                    onClick={() => setActiveTab("metrics")}
                    className="bg-[#0055FF] text-white border-[3px] border-black hover:bg-[#0044CC]"
                  >
                    Next: Metrics & Pricing
                  </Button>
                </div>
              </TabsContent>
              
              <TabsContent value="metrics" className="space-y-6">
                <div className="border-[3px] border-black p-6">
                  <h3 className="text-xl font-bold mb-4">Metrics & Pricing</h3>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-2">
                      <Label htmlFor="dailyTraffic" className="font-medium">
                        Estimated Daily Traffic
                      </Label>
                      <Input
                        id="dailyTraffic"
                        name="dailyTraffic"
                        type="number"
                        value={formData.dailyTraffic}
                        onChange={handleInputChange}
                        placeholder="Estimated number of people passing by"
                        className="border-2 border-black rounded-none"
                      />
                    </div>
                    
                    <div className="space-y-2">
                      <Label htmlFor="dailyImpressions" className="font-medium">
                        Estimated Daily Impressions
                      </Label>
                      <Input
                        id="dailyImpressions"
                        name="dailyImpressions"
                        type="number"
                        value={formData.dailyImpressions}
                        onChange={handleInputChange}
                        placeholder="Estimated number of impressions per day"
                        className="border-2 border-black rounded-none"
                      />
                    </div>
                    
                    <div className="space-y-2 md:col-span-2">
                      <Label htmlFor="pricePerDay" className="font-medium">
                        Price Per Day (ADC) *
                      </Label>
                      <Input
                        id="pricePerDay"
                        name="pricePerDay"
                        type="number"
                        value={formData.pricePerDay}
                        onChange={handleInputChange}
                        placeholder="Price per day in ADC tokens"
                        className="border-2 border-black rounded-none"
                        required
                      />
                      <p className="text-sm text-gray-500">
                        Set a competitive daily rate in ADC tokens for advertisers.
                      </p>
                    </div>
                  </div>
                </div>
                
                <div className="flex justify-between">
                  <Button
                    type="button"
                    onClick={() => setActiveTab("images")}
                    variant="outline"
                    className="border-[3px] border-black rounded-none bg-white hover:bg-[#f5f5f5]"
                  >
                    Back: Images
                  </Button>
                  
                  <Button
                    type="submit"
                    disabled={isSubmitting}
                    className="bg-[#0055FF] text-white border-[3px] border-black hover:bg-[#0044CC]"
                  >
                    {isSubmitting ? (
                      <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
                    ) : (
                      <Save className="mr-2 h-4 w-4" />
                    )}
                    Save All Changes
                  </Button>
                </div>
              </TabsContent>
            </form>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  )
} 