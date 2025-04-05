"use client"

import { useState } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { ChevronLeft } from "lucide-react"
import { toast } from "@/lib/toast"
import DashboardHeader from "../../dashboard/components/dashboard-header"

export default function CreateCampaignPage() {
  const router = useRouter()
  
  return (
    <div className="container mx-auto py-6">
      <DashboardHeader />
      
      <div className="my-6">
        <Button 
          variant="outline" 
          onClick={() => router.push("/campaigns")}
          className="border-2 border-black rounded-none inline-flex items-center gap-2"
        >
          <ChevronLeft className="w-4 h-4" />
          Back to campaigns
        </Button>
      </div>
      
      <div className="border-[6px] border-black bg-white p-8">
        <h1 className="text-3xl font-black mb-6">Create New Campaign</h1>
        
        <div className="max-w-2xl mx-auto text-center p-12">
          <h2 className="text-2xl font-bold mb-4">Coming Soon</h2>
          <p className="mb-6">The campaign creation page is under development and will be available soon.</p>
          <Button 
            onClick={() => {
              toast("Feature in development", { description: "Campaign creation will be available in the next update" }, "info")
              router.push("/campaigns")
            }}
            className="bg-[#0055FF] text-white border-[4px] border-black hover:bg-[#FFCC00] hover:text-black transition-all font-bold"
          >
            Return to Campaigns
          </Button>
        </div>
      </div>
    </div>
  )
} 