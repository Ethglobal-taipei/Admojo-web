"use client"

import type React from "react"

import { useState, useRef } from "react"
import { MapPin, Upload, Camera, ChevronRight, ChevronLeft, Check, Info, Ruler, Users, Eye, X } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { useLocationStore } from "@/lib/store/useLocationStore"
import { toast } from "@/lib/toast"

interface RegisterLocationModalProps {
  isOpen: boolean
  onClose: () => void
}

export default function RegisterLocationModal({ isOpen, onClose }: RegisterLocationModalProps) {
  const { createLocation } = useLocationStore()

  const [currentStep, setCurrentStep] = useState(1)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const modalRef = useRef<HTMLDivElement>(null)

  const [formData, setFormData] = useState({
    name: "",
    type: "billboard",
    address: "",
    city: "",
    country: "USA",
    coordinates: {
      lat: 40.7128,
      lng: -74.006,
    },
    description: "",
    dimensions: {
      width: "",
      height: "",
      unit: "meters",
    },
    visibility: "high",
    footTraffic: 75,
    demographics: {
      ageGroups: {
        "18-24": true,
        "25-34": true,
        "35-44": true,
        "45-54": false,
        "55+": false,
      },
      primaryAudience: "commuters",
    },
    pricing: {
      suggestedPrice: 0.025,
      minimumBid: 0.02,
    },
    photos: [] as string[],
    nearbyAttractions: "",
    operatingHours: "24/7",
    installationDate: "",
    displayType: "digital" as "digital" | "static",
    size: "medium" as "small" | "medium" | "large",
    dailyImpressions: 5000,
    costPerView: 0.01,
    availableSlots: 10,
  })

  // Close modal when clicking outside
  const handleBackdropClick = (e: React.MouseEvent) => {
    if (modalRef.current && !modalRef.current.contains(e.target as Node)) {
      onClose()
    }
  }

  const handleNextStep = () => {
    // Validate current step
    if (currentStep === 1) {
      if (!formData.name || !formData.address) {
        toast("Missing information", { description: "Please fill in all required fields before proceeding." }, "error")
        return
      }
    } else if (currentStep === 2) {
      if (!formData.dimensions.width || !formData.dimensions.height) {
        toast("Missing information", { description: "Please provide the dimensions of your display." }, "error")
        return
      }
    }

    setCurrentStep((prev) => Math.min(prev + 1, 4))

    // Scroll to top when changing steps
    if (modalRef.current) {
      modalRef.current.scrollTop = 0
    }
  }

  const handlePrevStep = () => {
    setCurrentStep((prev) => Math.max(prev - 1, 1))

    // Scroll to top when changing steps
    if (modalRef.current) {
      modalRef.current.scrollTop = 0
    }
  }

  const handleInputChange = (field: string, value: any) => {
    setFormData((prev) => ({
      ...prev,
      [field]: value,
    }))
  }

  const handleDimensionChange = (field: string, value: string) => {
    setFormData((prev) => ({
      ...prev,
      dimensions: {
        ...prev.dimensions,
        [field]: value,
      },
    }))
  }

  const handleDemographicsChange = (field: string, value: any) => {
    setFormData((prev) => ({
      ...prev,
      demographics: {
        ...prev.demographics,
        [field]: value,
      },
    }))
  }

  const handleAgeGroupChange = (ageGroup: string, checked: boolean) => {
    setFormData((prev) => ({
      ...prev,
      demographics: {
        ...prev.demographics,
        ageGroups: {
          ...prev.demographics.ageGroups,
          [ageGroup]: checked,
        },
      },
    }))
  }

  const handleSubmit = async () => {
    if (formData.photos.length === 0) {
      toast("Photos required", { description: "Please upload at least one photo of your location." }, "error")
      return
    }

    setIsSubmitting(true)

    try {
      // Create a new location object from form data
      const newLocation = {
        name: formData.name,
        description: formData.description,
        address: formData.address,
        city: formData.city || "New York",
        country: formData.country,
        coordinates: formData.coordinates,
        type: formData.type === "indoor" ? "indoor" : "outdoor",
        displayType: formData.displayType,
        size: formData.size,
        dailyImpressions: formData.footTraffic * 100, // Calculate based on foot traffic
        costPerView: formData.pricing.suggestedPrice,
        availableSlots: 10,
        images: formData.photos.length > 0 ? formData.photos : ["/placeholder.svg?height=600&width=800"],
        status: "pending" as "active" | "inactive" | "pending",
      }

      // Call the createLocation function from the store
      await createLocation(newLocation)

      toast(
        "Location registered",
        { description: "Your location has been successfully registered and is pending verification." },
        "success",
      )

      // Close the modal
      onClose()
    } catch (error) {
      toast(
        "Registration failed",
        { description: "There was an error registering your location. Please try again." },
        "error",
      )
    } finally {
      setIsSubmitting(false)
    }
  }

  // Mock function to simulate file upload
  const handleFileUpload = () => {
    const mockPhotos = ["/placeholder.svg?height=300&width=400", "/placeholder.svg?height=300&width=400"]

    setFormData((prev) => ({
      ...prev,
      photos: [...prev.photos, ...mockPhotos],
    }))

    toast("Photos uploaded", { description: "Your photos have been uploaded successfully." }, "success")
  }

  if (!isOpen) return null

  return (
    <div
      className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4 overflow-y-auto"
      onClick={handleBackdropClick}
    >
      <div
        ref={modalRef}
        className="bg-white border-[6px] border-black shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] w-full max-w-5xl max-h-[90vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="sticky top-0 bg-white z-10 flex justify-between items-center p-6 border-b-[4px] border-black">
          <h2 className="text-2xl md:text-3xl font-black">REGISTER NEW LOCATION</h2>
          <Button
            variant="outline"
            size="icon"
            className="h-10 w-10 border-[3px] border-black rounded-none hover:bg-[#f5f5f5]"
            onClick={onClose}
          >
            <X className="h-5 w-5" />
          </Button>
        </div>

        <div className="p-6">
          {/* Step indicators */}
          <div className="flex justify-between mb-8 relative">
            {[1, 2, 3, 4].map((step) => (
              <div
                key={step}
                className={`relative z-10 flex flex-col items-center ${currentStep >= step ? "opacity-100" : "opacity-50"}`}
              >
                <div
                  className={`w-12 h-12 flex items-center justify-center border-[4px] border-black font-black text-xl ${
                    currentStep > step ? "bg-[#0055FF] text-white" : currentStep === step ? "bg-[#FFCC00]" : "bg-white"
                  } hover:scale-110 transition-transform`}
                >
                  {step}
                </div>
                <div className="text-center mt-2 font-bold text-sm">
                  {step === 1 && "Basic Info"}
                  {step === 2 && "Dimensions & Visibility"}
                  {step === 3 && "Demographics & Pricing"}
                  {step === 4 && "Photos & Submission"}
                </div>
              </div>
            ))}

            {/* Connecting lines */}
            <div className="absolute top-6 left-0 w-full h-[4px] bg-black -z-0">
              <div
                className="h-full bg-[#0055FF]"
                style={{ width: `${(currentStep - 1) * 33.33}%`, transition: "width 0.5s ease-in-out" }}
              ></div>
            </div>
          </div>

          {/* Step 1: Basic Information */}
          {currentStep === 1 && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 animate-in fade-in duration-500">
              <div>
                <div className="mb-6">
                  <label className="block font-bold mb-2 text-lg">
                    Location Name <span className="text-red-500">*</span>
                  </label>
                  <Input
                    type="text"
                    placeholder="Enter a descriptive name for your location"
                    className="border-[4px] border-black rounded-none h-12 text-lg font-medium focus:border-[#0055FF] focus:ring-0 focus:translate-y-[-4px] transition-transform focus:shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]"
                    value={formData.name}
                    onChange={(e) => handleInputChange("name", e.target.value)}
                  />
                </div>

                <div className="mb-6">
                  <label className="block font-bold mb-2 text-lg">Location Type</label>
                  <div className="grid grid-cols-1 gap-2">
                    {["billboard", "digital", "transit", "indoor"].map((type) => (
                      <label
                        key={type}
                        className={`flex items-center border-[4px] border-black p-3 cursor-pointer transition-all ${
                          formData.type === type ? "bg-[#0055FF] text-white" : "bg-white hover:bg-[#f5f5f5]"
                        }`}
                      >
                        <input
                          type="radio"
                          name="type"
                          value={type}
                          checked={formData.type === type}
                          onChange={(e) => handleInputChange("type", e.target.value)}
                          className="sr-only"
                        />
                        <div
                          className={`w-6 h-6 mr-3 border-[3px] border-black flex items-center justify-center ${
                            formData.type === type ? "bg-white" : "bg-[#f5f5f5]"
                          }`}
                        >
                          {formData.type === type && (
                            <div className="w-3 h-3 bg-[#0055FF] border-[1px] border-black"></div>
                          )}
                        </div>
                        <span className="font-bold capitalize">{type}</span>
                      </label>
                    ))}
                  </div>
                </div>

                <div className="mb-6">
                  <label className="block font-bold mb-2 text-lg">
                    Location Address <span className="text-red-500">*</span>
                  </label>
                  <Textarea
                    placeholder="Enter the physical address of your display"
                    className="border-[4px] border-black rounded-none min-h-[100px] text-lg font-medium focus:border-[#0055FF] focus:ring-0 focus:translate-y-[-4px] transition-transform focus:shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]"
                    value={formData.address}
                    onChange={(e) => handleInputChange("address", e.target.value)}
                  />
                </div>

                <div className="mb-6">
                  <label className="block font-bold mb-2 text-lg">Description</label>
                  <Textarea
                    placeholder="Describe your location and its surroundings"
                    className="border-[4px] border-black rounded-none min-h-[100px] text-lg font-medium focus:border-[#0055FF] focus:ring-0 focus:translate-y-[-4px] transition-transform focus:shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]"
                    value={formData.description}
                    onChange={(e) => handleInputChange("description", e.target.value)}
                  />
                </div>
              </div>

              <div className="flex flex-col">
                <div className="border-[6px] border-black aspect-[4/3] relative bg-[#f5f5f5] mb-6">
                  <div className="absolute inset-0 bg-[url('/placeholder.svg?height=600&width=800')] bg-cover bg-center"></div>
                  <div className="absolute top-4 left-4 bg-white border-[3px] border-black p-2 font-bold">
                    Click to place your location
                  </div>

                  {/* Map pin */}
                  <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-12 h-12 group">
                    <div className="w-12 h-12 bg-[#FF3366] border-[4px] border-black rounded-full flex items-center justify-center transform group-hover:scale-110 transition-transform">
                      <MapPin className="w-6 h-6 text-white" />
                    </div>
                    <div className="absolute bottom-0 left-1/2 w-4 h-16 bg-[#FF3366] -z-10 -translate-x-1/2 translate-y-1/2 border-[4px] border-black"></div>

                    {/* Radius indicator */}
                    <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-48 h-48 border-[4px] border-dashed border-[#FF3366] rounded-full opacity-50"></div>
                  </div>
                </div>

                <div className="border-[4px] border-black p-4 bg-[#f5f5f5] mb-6 flex-grow">
                  <h3 className="font-bold text-lg mb-3">Location Summary</h3>
                  <div className="space-y-3">
                    <div className="flex justify-between">
                      <span className="font-medium">Location Name:</span>
                      <span className="font-bold">{formData.name || "Not set"}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="font-medium">Type:</span>
                      <span className="font-bold capitalize">{formData.type}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="font-medium">Address:</span>
                      <span className="font-bold">{formData.address || "Not set"}</span>
                    </div>
                  </div>
                </div>

                <div className="border-[4px] border-black p-4 bg-[#FFCC00] hover:bg-[#ffdc4d] transition-colors">
                  <h3 className="font-bold text-lg mb-2">Registration Tips</h3>
                  <ul className="list-disc pl-5 space-y-1">
                    <li>Choose a descriptive name for easy identification</li>
                    <li>Provide the exact address for accurate location mapping</li>
                    <li>The more detailed your description, the better for advertisers</li>
                    <li>High-traffic areas perform best in the network</li>
                  </ul>
                </div>
              </div>
            </div>
          )}

          {/* Step 2: Dimensions & Visibility */}
          {currentStep === 2 && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 animate-in fade-in duration-500">
              <div>
                <div className="mb-6">
                  <label className="block font-bold mb-2 text-lg">
                    Display Dimensions <span className="text-red-500">*</span>
                  </label>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block font-medium mb-1">Width</label>
                      <div className="flex">
                        <Input
                          type="number"
                          placeholder="Width"
                          className="border-[4px] border-r-0 border-black rounded-none h-12 text-lg font-medium focus:border-[#0055FF] focus:ring-0 focus:translate-y-[-2px] transition-transform"
                          value={formData.dimensions.width}
                          onChange={(e) => handleDimensionChange("width", e.target.value)}
                        />
                        <select
                          className="border-[4px] border-black rounded-none h-12 text-lg font-medium bg-white px-2"
                          value={formData.dimensions.unit}
                          onChange={(e) => handleDimensionChange("unit", e.target.value)}
                        >
                          <option value="meters">m</option>
                          <option value="feet">ft</option>
                        </select>
                      </div>
                    </div>
                    <div>
                      <label className="block font-medium mb-1">Height</label>
                      <div className="flex">
                        <Input
                          type="number"
                          placeholder="Height"
                          className="border-[4px] border-r-0 border-black rounded-none h-12 text-lg font-medium focus:border-[#0055FF] focus:ring-0 focus:translate-y-[-2px] transition-transform"
                          value={formData.dimensions.height}
                          onChange={(e) => handleDimensionChange("height", e.target.value)}
                        />
                        <div className="border-[4px] border-black rounded-none h-12 text-lg font-medium bg-[#f5f5f5] px-2 flex items-center">
                          {formData.dimensions.unit === "meters" ? "m" : "ft"}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="mb-6">
                  <label className="block font-bold mb-2 text-lg">Visibility</label>
                  <div className="grid grid-cols-1 gap-2">
                    {["high", "medium", "low"].map((visibility) => (
                      <label
                        key={visibility}
                        className={`flex items-center border-[4px] border-black p-3 cursor-pointer transition-all ${
                          formData.visibility === visibility ? "bg-[#0055FF] text-white" : "bg-white hover:bg-[#f5f5f5]"
                        }`}
                      >
                        <input
                          type="radio"
                          name="visibility"
                          value={visibility}
                          checked={formData.visibility === visibility}
                          onChange={(e) => handleInputChange("visibility", e.target.value)}
                          className="sr-only"
                        />
                        <div
                          className={`w-6 h-6 mr-3 border-[3px] border-black flex items-center justify-center ${
                            formData.visibility === visibility ? "bg-white" : "bg-[#f5f5f5]"
                          }`}
                        >
                          {formData.visibility === visibility && (
                            <div className="w-3 h-3 bg-[#0055FF] border-[1px] border-black"></div>
                          )}
                        </div>
                        <span className="font-bold capitalize">{visibility} Visibility</span>
                      </label>
                    ))}
                  </div>
                </div>

                <div className="mb-6">
                  <label className="block font-bold mb-2 text-lg">Estimated Foot Traffic</label>
                  <div className="border-[4px] border-black p-4 bg-[#f5f5f5]">
                    <div className="flex items-center justify-between mb-2">
                      <span className="font-bold">Low</span>
                      <span className="font-bold">High</span>
                    </div>
                    <div className="relative">
                      <input
                        type="range"
                        min="0"
                        max="100"
                        value={formData.footTraffic}
                        onChange={(e) => handleInputChange("footTraffic", Number.parseInt(e.target.value))}
                        className="w-full h-8 appearance-none bg-white border-[3px] border-black [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-10 [&::-webkit-slider-thumb]:h-10 [&::-webkit-slider-thumb]:bg-[#0055FF] [&::-webkit-slider-thumb]:border-[4px] [&::-webkit-slider-thumb]:border-black [&::-webkit-slider-thumb]:rounded-none [&::-webkit-slider-thumb]:cursor-pointer"
                      />
                      <div className="mt-2 text-center font-black text-2xl">{formData.footTraffic}%</div>
                    </div>
                  </div>
                </div>

                <div className="mb-6">
                  <label className="block font-bold mb-2 text-lg">Nearby Attractions</label>
                  <Textarea
                    placeholder="List nearby attractions, landmarks, or points of interest"
                    className="border-[4px] border-black rounded-none min-h-[100px] text-lg font-medium focus:border-[#0055FF] focus:ring-0 focus:translate-y-[-4px] transition-transform focus:shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]"
                    value={formData.nearbyAttractions}
                    onChange={(e) => handleInputChange("nearbyAttractions", e.target.value)}
                  />
                </div>
              </div>

              <div className="flex flex-col">
                <div className="border-[4px] border-black p-4 bg-[#f5f5f5] mb-6 flex-grow">
                  <div className="flex items-center gap-2 mb-3">
                    <Ruler className="w-5 h-5 text-[#0055FF]" />
                    <h3 className="font-bold text-lg">Display Size Visualization</h3>
                  </div>

                  <div className="relative h-64 border-[3px] border-dashed border-black mb-4 bg-white">
                    {formData.dimensions.width && formData.dimensions.height ? (
                      <div
                        className="absolute bg-[#0055FF] border-[3px] border-black"
                        style={{
                          width: `${Math.min(Number(formData.dimensions.width) * 10, 100)}%`,
                          height: `${Math.min(Number(formData.dimensions.height) * 10, 100)}%`,
                          maxWidth: "100%",
                          maxHeight: "100%",
                          top: "50%",
                          left: "50%",
                          transform: "translate(-50%, -50%)",
                        }}
                      >
                        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-white font-bold">
                          {formData.dimensions.width} × {formData.dimensions.height}{" "}
                          {formData.dimensions.unit === "meters" ? "m" : "ft"}
                        </div>
                      </div>
                    ) : (
                      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-gray-400 font-bold">
                        Enter dimensions to see preview
                      </div>
                    )}
                  </div>

                  <div className="space-y-3">
                    <div className="flex justify-between">
                      <span className="font-medium">Dimensions:</span>
                      <span className="font-bold">
                        {formData.dimensions.width && formData.dimensions.height
                          ? `${formData.dimensions.width} × ${formData.dimensions.height} ${formData.dimensions.unit === "meters" ? "m" : "ft"}`
                          : "Not set"}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="font-medium">Visibility:</span>
                      <span className="font-bold capitalize">{formData.visibility}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="font-medium">Foot Traffic:</span>
                      <span className="font-bold">{formData.footTraffic}%</span>
                    </div>
                  </div>
                </div>

                <div className="border-[4px] border-black p-4 bg-[#0055FF] text-white mb-6">
                  <div className="flex items-center gap-2 mb-3">
                    <Info className="w-5 h-5" />
                    <h3 className="font-bold text-lg">Size Impact</h3>
                  </div>
                  <p className="mb-4">The size of your display affects:</p>
                  <ul className="space-y-2">
                    <li className="flex items-center gap-2">
                      <div className="w-5 h-5 bg-white border-[2px] border-black flex items-center justify-center text-[#0055FF] font-bold text-xs">
                        1
                      </div>
                      <span className="font-medium">Visibility to potential viewers</span>
                    </li>
                    <li className="flex items-center gap-2">
                      <div className="w-5 h-5 bg-white border-[2px] border-black flex items-center justify-center text-[#0055FF] font-bold text-xs">
                        2
                      </div>
                      <span className="font-medium">Pricing potential for advertisers</span>
                    </li>
                    <li className="flex items-center gap-2">
                      <div className="w-5 h-5 bg-white border-[2px] border-black flex items-center justify-center text-[#0055FF] font-bold text-xs">
                        3
                      </div>
                      <span className="font-medium">Types of ads that can be displayed</span>
                    </li>
                  </ul>
                </div>

                <div className="border-[4px] border-black p-4 bg-[#FFCC00]">
                  <h3 className="font-bold text-lg mb-2">Visibility Tips</h3>
                  <ul className="list-disc pl-5 space-y-1">
                    <li>Higher visibility locations typically earn more</li>
                    <li>Consider obstructions like trees or buildings</li>
                    <li>Locations visible from multiple angles perform better</li>
                    <li>Lighting conditions affect visibility at different times</li>
                  </ul>
                </div>
              </div>
            </div>
          )}

          {/* Step 3: Demographics & Pricing */}
          {currentStep === 3 && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 animate-in fade-in duration-500">
              <div>
                <div className="mb-6">
                  <label className="block font-bold mb-2 text-lg">Primary Audience</label>
                  <select
                    className="w-full border-[4px] border-black rounded-none p-3 font-bold bg-white hover:bg-[#f5f5f5] transition-colors h-12"
                    value={formData.demographics.primaryAudience}
                    onChange={(e) => handleDemographicsChange("primaryAudience", e.target.value)}
                  >
                    <option value="commuters">Commuters</option>
                    <option value="shoppers">Shoppers</option>
                    <option value="tourists">Tourists</option>
                    <option value="business">Business Professionals</option>
                    <option value="students">Students</option>
                    <option value="mixed">Mixed</option>
                  </select>
                </div>

                <div className="mb-6">
                  <label className="block font-bold mb-2 text-lg">Age Groups (select all that apply)</label>
                  <div className="grid grid-cols-1 gap-2">
                    {Object.entries(formData.demographics.ageGroups).map(([ageGroup, isSelected]) => (
                      <label
                        key={ageGroup}
                        className={`flex items-center border-[4px] border-black p-3 cursor-pointer transition-all ${
                          isSelected ? "bg-[#0055FF] text-white" : "bg-white hover:bg-[#f5f5f5]"
                        }`}
                      >
                        <input
                          type="checkbox"
                          checked={isSelected}
                          onChange={(e) => handleAgeGroupChange(ageGroup, e.target.checked)}
                          className="sr-only"
                        />
                        <div
                          className={`w-6 h-6 mr-3 border-[3px] border-black flex items-center justify-center ${
                            isSelected ? "bg-white" : "bg-[#f5f5f5]"
                          }`}
                        >
                          {isSelected && <Check className="w-4 h-4 text-[#0055FF]" />}
                        </div>
                        <span className="font-bold">{ageGroup}</span>
                      </label>
                    ))}
                  </div>
                </div>

                <div className="mb-6">
                  <label className="block font-bold mb-2 text-lg">Operating Hours</label>
                  <select
                    className="w-full border-[4px] border-black rounded-none p-3 font-bold bg-white hover:bg-[#f5f5f5] transition-colors h-12"
                    value={formData.operatingHours}
                    onChange={(e) => handleInputChange("operatingHours", e.target.value)}
                  >
                    <option value="24/7">24/7 (Always visible)</option>
                    <option value="business">Business Hours (9AM-5PM)</option>
                    <option value="extended">Extended Hours (7AM-10PM)</option>
                    <option value="night">Night Hours (6PM-6AM)</option>
                    <option value="custom">Custom Hours</option>
                  </select>
                </div>

                <div className="mb-6">
                  <label className="block font-bold mb-2 text-lg">Installation Date</label>
                  <Input
                    type="date"
                    className="border-[4px] border-black rounded-none h-12 text-lg font-medium focus:border-[#0055FF] focus:ring-0 focus:translate-y-[-4px] transition-transform focus:shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]"
                    value={formData.installationDate}
                    onChange={(e) => handleInputChange("installationDate", e.target.value)}
                  />
                </div>
              </div>

              <div className="flex flex-col">
                <div className="border-[4px] border-black p-4 bg-[#f5f5f5] mb-6 flex-grow">
                  <div className="flex items-center gap-2 mb-3">
                    <Users className="w-5 h-5 text-[#0055FF]" />
                    <h3 className="font-bold text-lg">Audience Demographics</h3>
                  </div>

                  <div className="space-y-4 mb-6">
                    <div>
                      <div className="font-bold mb-2">Primary Audience</div>
                      <div className="border-[3px] border-black p-3 bg-white">
                        <span className="font-bold capitalize">{formData.demographics.primaryAudience}</span>
                      </div>
                    </div>

                    <div>
                      <div className="font-bold mb-2">Age Groups</div>
                      <div className="border-[3px] border-black p-3 bg-white">
                        {Object.entries(formData.demographics.ageGroups)
                          .filter(([_, isSelected]) => isSelected)
                          .map(([ageGroup]) => ageGroup)
                          .join(", ") || "None selected"}
                      </div>
                    </div>
                  </div>

                  <div className="border-[3px] border-black p-3 bg-[#0055FF] text-white mb-4">
                    <div className="font-bold mb-2">Suggested Price (per impression)</div>
                    <div className="text-2xl font-black">{formData.pricing.suggestedPrice.toFixed(3)} ADC</div>
                    <div className="text-sm">Based on location, size, and audience</div>
                  </div>

                  <div>
                    <div className="font-bold mb-2">Minimum Bid</div>
                    <div className="border-[3px] border-black p-3 bg-white">
                      <span className="font-bold">{formData.pricing.minimumBid.toFixed(3)} ADC</span>
                    </div>
                  </div>
                </div>

                <div className="border-[4px] border-black p-4 bg-[#0055FF] text-white mb-6">
                  <div className="flex items-center gap-2 mb-3">
                    <Eye className="w-5 h-5" />
                    <h3 className="font-bold text-lg">Estimated Performance</h3>
                  </div>
                  <p className="mb-4">Based on your location details:</p>
                  <ul className="space-y-2">
                    <li className="flex justify-between">
                      <span className="font-medium">Est. Daily Views:</span>
                      <span className="font-bold">2,500 - 3,200</span>
                    </li>
                    <li className="flex justify-between">
                      <span className="font-medium">Potential Monthly Earnings:</span>
                      <span className="font-bold">1,800 - 2,400 ADC</span>
                    </li>
                    <li className="flex justify-between">
                      <span className="font-medium">Location Rating:</span>
                      <span className="font-bold">Premium (A+)</span>
                    </li>
                  </ul>
                </div>

                <div className="border-[4px] border-black p-4 bg-[#FFCC00]">
                  <h3 className="font-bold text-lg mb-2">Pricing Tips</h3>
                  <ul className="list-disc pl-5 space-y-1">
                    <li>Our system suggests optimal pricing based on your location</li>
                    <li>Higher minimum bids may reduce ad fill rate</li>
                    <li>Lower minimum bids may increase impressions but reduce earnings</li>
                    <li>You can adjust pricing anytime after registration</li>
                  </ul>
                </div>
              </div>
            </div>
          )}

          {/* Step 4: Photos & Submission */}
          {currentStep === 4 && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 animate-in fade-in duration-500">
              <div>
                <div className="border-[6px] border-dashed border-black p-6 bg-[#f5f5f5] flex flex-col items-center justify-center h-[300px] mb-6 hover:bg-[#e5e5e5] transition-colors cursor-pointer group">
                  <Upload className="w-16 h-16 mb-4 text-gray-400 group-hover:scale-110 transition-transform" />
                  <p className="font-bold text-lg mb-2">Drag & Drop Photos</p>
                  <p className="text-sm text-center mb-4">Upload at least 3 photos of your display</p>
                  <Button
                    className="bg-[#0055FF] text-white border-[3px] border-black hover:bg-[#FFCC00] hover:text-black transition-all font-bold px-4 py-2 h-auto rounded-none"
                    onClick={handleFileUpload}
                  >
                    Browse Files
                  </Button>
                </div>

                <div className="border-[4px] border-black p-4 bg-[#f5f5f5] mb-6">
                  <h3 className="font-bold text-lg mb-3">Required Photos</h3>
                  <div className="space-y-2">
                    <div className="flex items-center">
                      <div className="w-6 h-6 border-[3px] border-black mr-3 flex items-center justify-center bg-white">
                        <div className="w-3 h-3 bg-[#0055FF]"></div>
                      </div>
                      <span className="font-medium">Front view of display</span>
                    </div>
                    <div className="flex items-center">
                      <div className="w-6 h-6 border-[3px] border-black mr-3 flex items-center justify-center bg-white">
                        <div className="w-3 h-3 bg-[#0055FF]"></div>
                      </div>
                      <span className="font-medium">Side view showing dimensions</span>
                    </div>
                    <div className="flex items-center">
                      <div className="w-6 h-6 border-[3px] border-black mr-3 flex items-center justify-center bg-white">
                        <div className="w-3 h-3 bg-[#0055FF]"></div>
                      </div>
                      <span className="font-medium">Wide shot showing surroundings</span>
                    </div>
                  </div>
                </div>

                <Button
                  className="w-full bg-[#FF3366] text-white border-[4px] border-black hover:bg-[#FFCC00] hover:text-black transition-all font-bold text-lg py-3 h-auto rounded-none shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] hover:shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] hover:-translate-y-1 relative overflow-hidden group"
                  onClick={() => handleFileUpload()}
                >
                  <span className="relative z-10 flex items-center gap-2">
                    <Camera className="w-5 h-5" />
                    Take Photos Now
                  </span>
                  <span className="absolute inset-0 bg-[#FFCC00] transform scale-x-0 group-hover:scale-x-100 transition-transform duration-300 origin-left"></span>
                </Button>
              </div>

              <div>
                <h3 className="font-bold text-lg mb-3">Photo Preview</h3>
                <div className="grid grid-cols-2 gap-4 mb-6">
                  {formData.photos.length > 0
                    ? formData.photos.map((photo, index) => (
                        <div
                          key={index}
                          className="border-[4px] border-black aspect-square bg-[#f5f5f5] hover:shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] transition-all hover:-translate-y-1 overflow-hidden"
                        >
                          <img
                            src={photo || "/placeholder.svg"}
                            alt={`Photo ${index + 1}`}
                            className="w-full h-full object-cover"
                          />
                        </div>
                      ))
                    : [1, 2, 3, 4].map((index) => (
                        <div
                          key={index}
                          className="border-[4px] border-black aspect-square bg-[#f5f5f5] flex items-center justify-center hover:shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] transition-all hover:-translate-y-1"
                        >
                          <div className="text-gray-400 font-bold">Photo {index}</div>
                        </div>
                      ))}
                </div>

                <div className="border-[4px] border-black p-4 bg-[#FFCC00] mb-6">
                  <h3 className="font-bold text-lg mb-2">Photo Guidelines</h3>
                  <ul className="list-disc pl-5 space-y-1">
                    <li>Photos must be clear and well-lit</li>
                    <li>Display must be clearly visible in all photos</li>
                    <li>Include surrounding area to show foot traffic potential</li>
                    <li>Photos must be recent (within last 30 days)</li>
                  </ul>
                </div>

                <div className="border-[4px] border-black p-4 bg-[#0055FF] text-white">
                  <h3 className="font-bold text-lg mb-3">Verification Process</h3>
                  <p className="mb-4">
                    After submission, our team will review your location within 1-2 business days. You'll receive an
                    email notification once your location is approved.
                  </p>
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 bg-white rounded-full"></div>
                    <span className="font-medium">Photos under review</span>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Navigation buttons */}
          <div className="flex justify-between mt-8">
            <Button
              variant="outline"
              className={`border-[4px] border-black rounded-none bg-white hover:bg-[#f5f5f5] transition-all font-bold px-6 py-3 h-auto flex items-center gap-2 ${
                currentStep === 1 ? "opacity-50 cursor-not-allowed" : ""
              } hover:-translate-y-1 hover:shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]`}
              onClick={handlePrevStep}
              disabled={currentStep === 1}
            >
              <ChevronLeft className="w-5 h-5" />
              <span>Previous</span>
            </Button>

            {currentStep < 4 ? (
              <Button
                className="bg-[#0055FF] text-white border-[4px] border-black hover:bg-[#FFCC00] hover:text-black transition-all font-bold px-6 py-3 h-auto rounded-none shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] hover:shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] hover:-translate-y-1 flex items-center gap-2"
                onClick={handleNextStep}
              >
                <span>Next Step</span>
                <ChevronRight className="w-5 h-5" />
              </Button>
            ) : (
              <Button
                className="bg-[#FF3366] text-white border-[4px] border-black hover:bg-[#FFCC00] hover:text-black transition-all font-bold px-6 py-3 h-auto rounded-none shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] hover:shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] hover:-translate-y-1 flex items-center gap-2"
                onClick={handleSubmit}
                disabled={isSubmitting}
              >
                {isSubmitting ? (
                  <>
                    <span>Processing...</span>
                    <svg
                      className="animate-spin ml-2 h-5 w-5 text-white"
                      xmlns="http://www.w3.org/2000/svg"
                      fill="none"
                      viewBox="0 0 24 24"
                    >
                      <circle
                        className="opacity-25"
                        cx="12"
                        cy="12"
                        r="10"
                        stroke="currentColor"
                        strokeWidth="4"
                      ></circle>
                      <path
                        className="opacity-75"
                        fill="currentColor"
                        d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                      ></path>
                    </svg>
                  </>
                ) : (
                  <>
                    <span>Register Location</span>
                    <Check className="w-5 h-5" />
                  </>
                )}
              </Button>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

