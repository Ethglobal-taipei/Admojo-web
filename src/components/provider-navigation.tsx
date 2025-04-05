"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { Home, LayoutDashboard, MapPin, DollarSign, BarChart2, User } from "lucide-react"
import { cn } from "@/lib/utils"

export default function ProviderNavigation() {
  const pathname = usePathname()

  const navItems = [
    { name: "Dashboard", href: "/provider-dashboard", icon: LayoutDashboard },
    { name: "Locations", href: "/my-locations", icon: MapPin },
    { name: "Analytics", href: "/provider-analytics", icon: BarChart2 },
    { name: "Earnings", href: "/provider-earnings", icon: DollarSign },
    { name: "Account", href: "/provider-account", icon: User },
  ]

  return (
    <div className="hidden md:flex items-center space-x-8">
      {navItems.map((item) => {
        const isActive = pathname === item.href || (item.href !== "/" && pathname.startsWith(item.href))

        return (
          <Link
            key={item.name}
            href={item.href}
            className={cn(
              "font-medium text-base hover:text-[#FF3366] transition-colors relative",
              isActive ? "text-[#FF3366] font-semibold" : "text-gray-800",
            )}
          >
            <div className="flex items-center gap-1.5">
              <item.icon className={cn("w-4 h-4", isActive ? "text-[#FF3366]" : "text-gray-600")} />
              <span>{item.name}</span>
            </div>
            {isActive && <div className="absolute -bottom-1 left-0 w-full h-0.5 bg-[#FF3366]" />}
          </Link>
        )
      })}
    </div>
  )
}

