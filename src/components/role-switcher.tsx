"use client"

import { useRouter } from "next/navigation"
import { Monitor, MapPin, ChevronDown } from "lucide-react"
import { Button } from "@/components/ui/button"
import { useRoleStore } from "@/lib/store"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"

export default function RoleSwitcher() {
  const router = useRouter()
  const { currentRole, startTransition, isProviderRegistered } = useRoleStore()

  const handleRoleSwitch = (role: "advertiser" | "provider") => {
    // If already in this role, do nothing
    if (currentRole === role) return

    // If switching to provider but not registered, go to registration
    if (role === "provider" && !isProviderRegistered) {
      router.push("/provider-registration")
      return
    }

    // Start transition and redirect to transition page
    startTransition(role)
    router.push(`/role-transition?to=${role}`)
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button className="flex items-center gap-2 bg-white border-2 border-black rounded-md px-3 py-2 h-auto hover:bg-gray-100 text-black">
          {currentRole === "advertiser" ? (
            <>
              <Monitor className="w-4 h-4 text-[#0055FF]" />
              <span className="font-medium">Advertiser</span>
            </>
          ) : (
            <>
              <MapPin className="w-4 h-4 text-[#FF3366]" />
              <span className="font-medium">Provider</span>
            </>
          )}
          <ChevronDown className="w-4 h-4" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-48 p-2 border-2 border-black">
        <DropdownMenuItem
          className={`flex items-center gap-2 p-2 mb-1 rounded-md ${
            currentRole === "advertiser" ? "bg-[#0055FF] text-white font-bold" : "hover:bg-gray-100 text-black"
          }`}
          onClick={() => handleRoleSwitch("advertiser")}
        >
          <Monitor className="w-4 h-4" />
          <span>Advertiser Mode</span>
        </DropdownMenuItem>
        <DropdownMenuItem
          className={`flex items-center gap-2 p-2 rounded-md ${
            currentRole === "provider" ? "bg-[#FF3366] text-white font-bold" : "hover:bg-gray-100 text-black"
          }`}
          onClick={() => handleRoleSwitch("provider")}
        >
          <MapPin className="w-4 h-4" />
          <span>Provider Mode</span>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}

