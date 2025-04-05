"use client"

import { useRouter } from "next/navigation"
import {
  BarChart3,
  LayoutDashboard,
  MapPin,
  Megaphone,
  PlusCircle,
  Settings,
  Wallet
} from "lucide-react"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { usePrivy } from "@privy-io/react-auth"

export default function AdvertiserDashboard() {
  const router = useRouter()
  const { ready, authenticated, user } = usePrivy()
  
  const tools = [
    {
      title: "My Campaigns",
      description: "View and manage all your advertising campaigns",
      icon: <Megaphone className="h-8 w-8 text-[#0055FF]" />,
      color: "bg-blue-50",
      path: "/campaigns"
    },
    {
      title: "Create Campaign",
      description: "Start a new advertising campaign",
      icon: <PlusCircle className="h-8 w-8 text-green-600" />,
      color: "bg-green-50",
      path: "/dashboard/campaigns/create"
    },
    {
      title: "Analytics",
      description: "Track performance across all campaigns",
      icon: <BarChart3 className="h-8 w-8 text-purple-600" />,
      color: "bg-purple-50",
      path: "/analytics"
    },
    {
      title: "Location Explorer",
      description: "Browse available display locations",
      icon: <MapPin className="h-8 w-8 text-amber-600" />,
      color: "bg-amber-50",
      path: "/locations"
    },
    {
      title: "Wallet",
      description: "Manage your ADC tokens and transactions",
      icon: <Wallet className="h-8 w-8 text-teal-600" />,
      color: "bg-teal-50",
      path: "/wallet"
    },
    {
      title: "Settings",
      description: "Configure your account preferences",
      icon: <Settings className="h-8 w-8 text-gray-600" />,
      color: "bg-gray-50",
      path: "/settings"
    }
  ]

  return (
    <div className="container mx-auto py-8 px-4">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-black">Advertiser Dashboard</h1>
          <p className="text-gray-600 mt-1">
            Welcome back{user?.wallet ? `, ${user.wallet.address.slice(0, 6)}...${user.wallet.address.slice(-4)}` : ""}
          </p>
        </div>
        
        <Button 
          className="bg-[#0055FF] text-white border-[3px] border-black hover:bg-[#0044CC]"
          onClick={() => router.push("/campaigns")}
        >
          <LayoutDashboard className="mr-2 h-4 w-4" />
          Go to Campaigns
        </Button>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {tools.map((tool, index) => (
          <Card 
            key={index} 
            className="border-[3px] border-black hover:shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] transition-all hover:-translate-y-1 cursor-pointer"
            onClick={() => router.push(tool.path)}
          >
            <CardHeader className={`pb-2 ${tool.color}`}>
              <div className="flex justify-between items-start">
                <CardTitle className="text-xl font-bold">{tool.title}</CardTitle>
                {tool.icon}
              </div>
            </CardHeader>
            <CardContent className="pt-4">
              <CardDescription className="text-gray-600 text-sm">
                {tool.description}
              </CardDescription>
            </CardContent>
            <CardFooter>
              <Button 
                variant="outline" 
                className="w-full border-[2px] border-black bg-white hover:bg-gray-50"
                onClick={() => router.push(tool.path)}
              >
                Launch
              </Button>
            </CardFooter>
          </Card>
        ))}
      </div>
    </div>
  )
} 