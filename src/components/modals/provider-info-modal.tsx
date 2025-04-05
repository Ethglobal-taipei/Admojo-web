"use client"

import { useState } from "react"
import Image from "next/image"
import { X, Star, MapPin, CheckCircle, Award, Shield, BarChart2, Mail, Globe } from "lucide-react"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { useUIStore } from "@/lib/store/useUIStore"

export interface ProviderInfoModalProps {
  providerId: number
  providerName: string
}

export default function ProviderInfoModal() {
  const { activeModal, modalData, closeModal } = useUIStore()
  const isOpen = activeModal === "providerInfo"
  const [activeTab, setActiveTab] = useState("overview")

  // Early return if modal is not open or no data
  if (!isOpen || !modalData) return null

  const { providerId, providerName } = modalData as ProviderInfoModalProps

  // Mock provider data - in a real app, you would fetch this based on providerId
  const provider = {
    id: providerId,
    name: providerName,
    logo: "/placeholder.svg?height=200&width=200",
    rating: 4.8,
    reviews: 124,
    verified: true,
    since: "2021",
    locations: 15,
    activeDisplays: 12,
    totalImpressions: "2.4M",
    description:
      "Leading provider of premium digital displays in major metropolitan areas. Specializing in high-traffic locations with maximum visibility and engagement. Our network reaches millions of viewers daily across prime urban locations.",
    address: "350 Fifth Avenue, New York, NY 10118",
    website: "https://example.com",
    contact: "info@example.com",
    performanceStats: {
      avgDailyImpressions: "160K",
      completionRate: 98.5,
      avgEngagement: 4.2,
      uptime: 99.8,
    },
    displayTypes: [
      { type: "Digital Billboard", count: 8 },
      { type: "Interactive Kiosk", count: 3 },
      { type: "LED Wall", count: 4 },
    ],
    topLocations: [
      { name: "Times Square Main", impressions: "45K daily", rating: 4.9 },
      { name: "Grand Central Terminal", impressions: "38K daily", rating: 4.7 },
      { name: "SoHo District", impressions: "32K daily", rating: 4.6 },
    ],
  }

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && closeModal()}>
      <DialogContent className="max-w-5xl max-h-[90vh] border-[6px] border-black p-0 overflow-hidden">
        <DialogHeader className="bg-[#0055FF] text-white p-8 relative">
          <Button
            variant="ghost"
            className="absolute right-6 top-6 text-white hover:bg-[#0044CC] rounded-full p-2 h-auto w-auto"
            onClick={closeModal}
          >
            <X className="h-6 w-6" />
          </Button>
          <DialogTitle className="text-4xl font-black tracking-tight">Provider Information</DialogTitle>
        </DialogHeader>

        <div className="p-0 overflow-y-auto max-h-[calc(90vh-120px)]">
          <div className="flex flex-col md:flex-row gap-8 p-8">
            <div className="w-full md:w-1/3 flex flex-col items-center">
              <div className="w-40 h-40 border-[4px] border-black overflow-hidden mb-6 bg-white">
                <Image
                  src={provider.logo || "/placeholder.svg"}
                  alt={provider.name}
                  width={200}
                  height={200}
                  className="w-full h-full object-cover"
                />
              </div>
              <h2 className="text-2xl font-bold text-center mb-3">{provider.name}</h2>
              <div className="flex items-center gap-1 mb-4">
                <Star className="w-5 h-5 fill-[#FFCC00] text-[#FFCC00]" />
                <span className="font-bold">{provider.rating}</span>
                <span className="text-sm">({provider.reviews} reviews)</span>
              </div>
              <div className="flex flex-wrap justify-center gap-3 mb-6">
                {provider.verified && (
                  <div className="px-3 py-1.5 bg-green-500 text-white text-sm font-bold border-[2px] border-black flex items-center gap-1.5">
                    <CheckCircle className="w-4 h-4" />
                    VERIFIED
                  </div>
                )}
                <div className="px-3 py-1.5 bg-[#0055FF] text-white text-sm font-bold border-[2px] border-black">
                  SINCE {provider.since}
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4 w-full mb-6">
                <div className="border-[3px] border-black p-4 bg-[#f5f5f5] text-center">
                  <div className="text-sm font-medium mb-1">Locations</div>
                  <div className="text-2xl font-black">{provider.locations}</div>
                </div>
                <div className="border-[3px] border-black p-4 bg-[#f5f5f5] text-center">
                  <div className="text-sm font-medium mb-1">Active</div>
                  <div className="text-2xl font-black">{provider.activeDisplays}</div>
                </div>
              </div>

              <div className="border-[3px] border-black p-4 bg-[#f5f5f5] w-full mb-6">
                <h3 className="font-bold mb-3 text-center">Contact Information</h3>
                <div className="space-y-3">
                  <div className="flex items-center gap-2">
                    <MapPin className="w-5 h-5 text-[#0055FF] flex-shrink-0" />
                    <span className="text-sm">{provider.address}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Globe className="w-5 h-5 text-[#0055FF] flex-shrink-0" />
                    <a href={provider.website} className="text-[#0055FF] underline text-sm">
                      {provider.website}
                    </a>
                  </div>
                  <div className="flex items-center gap-2">
                    <Mail className="w-5 h-5 text-[#0055FF] flex-shrink-0" />
                    <a href={`mailto:${provider.contact}`} className="text-[#0055FF] underline text-sm">
                      {provider.contact}
                    </a>
                  </div>
                </div>
              </div>

              <Button className="w-full bg-[#0055FF] text-white border-[3px] border-black hover:bg-[#FFCC00] hover:text-black transition-all font-bold px-4 py-3 h-auto rounded-none">
                Contact Provider
              </Button>
            </div>

            <div className="w-full md:w-2/3">
              <Tabs defaultValue="overview" value={activeTab} onValueChange={setActiveTab} className="w-full">
                {/* Updated TabsList with black background for selected tab */}
                <div className="mb-6">
                  <TabsList className="w-full h-14 grid grid-cols-3 p-1.5 border-[3px] border-black bg-[#f5f5f5] rounded-none gap-1.5">
                    {["overview", "performance", "locations"].map((tab) => (
                      <TabsTrigger
                        key={tab}
                        value={tab}
                        className={`
                          h-full text-base font-bold rounded-none transition-all duration-200
                          ${
                            activeTab === tab
                              ? "bg-black text-white border-[2px] border-black shadow-[2px_2px_0px_0px_rgba(0,0,0,0.3)]"
                              : "bg-white border-[2px] border-black hover:bg-gray-100"
                          }
                        `}
                        onClick={() => setActiveTab(tab)}
                      >
                        {tab.charAt(0).toUpperCase() + tab.slice(1)}
                      </TabsTrigger>
                    ))}
                  </TabsList>
                </div>

                <TabsContent value="overview" className="mt-0">
                  <div className="space-y-6">
                    <div className="border-[3px] border-black p-5 bg-[#f5f5f5]">
                      <h3 className="font-bold mb-3 text-lg">About</h3>
                      <p className="font-medium leading-relaxed">{provider.description}</p>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div className="border-[3px] border-black p-5 bg-[#f5f5f5] flex items-center gap-4">
                        <Award className="w-10 h-10 text-[#FFCC00]" />
                        <div>
                          <div className="text-sm font-medium">Total Impressions</div>
                          <div className="text-2xl font-black">{provider.totalImpressions}</div>
                        </div>
                      </div>
                      <div className="border-[3px] border-black p-5 bg-[#f5f5f5] flex items-center gap-4">
                        <Shield className="w-10 h-10 text-[#0055FF]" />
                        <div>
                          <div className="text-sm font-medium">Verification</div>
                          <div className="text-2xl font-black text-green-500">Complete</div>
                        </div>
                      </div>
                    </div>

                    <div className="border-[3px] border-black p-5 bg-[#f5f5f5]">
                      <h3 className="font-bold mb-4 text-lg">Display Types</h3>
                      <div className="space-y-4">
                        {provider.displayTypes.map((display, index) => (
                          <div
                            key={index}
                            className="flex items-center justify-between border-b-[2px] border-dashed border-black pb-3 last:border-0 last:pb-0"
                          >
                            <span className="font-medium">{display.type}</span>
                            <div className="px-3 py-1.5 bg-[#0055FF] text-white text-sm font-bold border-[2px] border-black">
                              {display.count} DISPLAYS
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                </TabsContent>

                <TabsContent value="performance" className="mt-0">
                  <div className="space-y-6">
                    <div className="grid grid-cols-2 gap-4">
                      {Object.entries(provider.performanceStats).map(([key, value], index) => (
                        <div key={index} className="border-[3px] border-black p-5 bg-[#f5f5f5]">
                          <div className="text-sm font-medium mb-1">
                            {key.replace(/([A-Z])/g, " $1").replace(/^./, (str) => str.toUpperCase())}
                          </div>
                          <div className="text-2xl font-black">{value}</div>
                        </div>
                      ))}
                    </div>

                    <div className="border-[3px] border-black p-5 bg-[#f5f5f5]">
                      <div className="w-full h-64 border-[3px] border-black bg-white mb-4 flex items-center justify-center">
                        <div className="text-center">
                          <BarChart2 className="w-16 h-16 text-[#0055FF] mx-auto mb-3" />
                          <p className="font-bold text-lg">Performance Chart</p>
                          <p className="text-sm text-gray-500">Historical performance data visualization</p>
                        </div>
                      </div>
                      <div className="flex justify-between items-center">
                        <div>
                          <div className="text-lg font-bold mb-1">Performance Analytics</div>
                          <p className="text-sm">Detailed analytics available for all displays</p>
                        </div>
                        <Button className="bg-[#0055FF] text-white border-[3px] border-black hover:bg-[#FFCC00] hover:text-black transition-all font-bold px-4 py-2 h-auto rounded-none">
                          View Analytics
                        </Button>
                      </div>
                    </div>
                  </div>
                </TabsContent>

                <TabsContent value="locations" className="mt-0">
                  <div className="space-y-5">
                    <h3 className="font-bold mb-3 text-lg">Top Performing Locations</h3>

                    {provider.topLocations.map((loc, index) => (
                      <div key={index} className="border-[3px] border-black p-5 bg-[#f5f5f5] flex gap-5">
                        <div className="w-28 h-20 border-[2px] border-black overflow-hidden flex-shrink-0">
                          <Image
                            src="/placeholder.svg?height=100&width=100"
                            alt={loc.name}
                            width={100}
                            height={100}
                            className="w-full h-full object-cover"
                          />
                        </div>
                        <div className="flex-1">
                          <div className="flex justify-between items-start">
                            <h4 className="font-bold text-lg">{loc.name}</h4>
                            <div className="flex items-center gap-1">
                              <Star className="w-5 h-5 fill-[#FFCC00] text-[#FFCC00]" />
                              <span className="font-bold">{loc.rating}</span>
                            </div>
                          </div>
                          <div className="text-sm flex items-center gap-1 mb-3">
                            <MapPin className="w-4 h-4" />
                            New York, NY
                          </div>
                          <div className="flex justify-between items-center">
                            <div className="font-bold">{loc.impressions}</div>
                            <Button className="bg-[#0055FF] text-white border-[2px] border-black hover:bg-[#FFCC00] hover:text-black transition-all font-bold px-3 py-1.5 h-auto rounded-none">
                              View Details
                            </Button>
                          </div>
                        </div>
                      </div>
                    ))}

                    <Button className="w-full bg-[#0055FF] text-white border-[3px] border-black hover:bg-[#FFCC00] hover:text-black transition-all font-bold px-4 py-3 h-auto rounded-none">
                      View All {provider.locations} Locations
                    </Button>
                  </div>
                </TabsContent>
              </Tabs>
            </div>
          </div>

          <div className="flex justify-end gap-4 p-8 pt-0">
            <Button
              variant="outline"
              className="border-[3px] border-black rounded-none bg-white hover:bg-[#f5f5f5] transition-all font-bold px-6 py-3 h-auto"
              onClick={closeModal}
            >
              Close
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}

