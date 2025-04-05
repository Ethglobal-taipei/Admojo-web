"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { LayoutDashboard, MapPin, RefreshCw, BarChart2, Target , User} from "lucide-react"
import { cn } from "@/lib/utils"

export default function AdvertiserNavigation() {
  const pathname = usePathname()

  const navItems = [
    { name: "Dashboard", href: "/dashboard", icon: LayoutDashboard },
    { name: "Campaigns", href: "/campaigns", icon: Target },
    { name: "Locations", href: "/browse-locations", icon: MapPin },
    { name: "Swap", href: "/swap", icon: RefreshCw },
    { name: "Analytics", href: "/analytics", icon: BarChart2 },
    { name: "Account", href: "/account", icon: User },

    // { name: "Contract Demo", href: "/contract-demo", icon: RefreshCw },
  ]

  return (
    <div className="hidden md:flex items-center justify-center gap-6">
      {navItems.map((item) => {
        const isActive = pathname === item.href || (item.href !== "/" && pathname.startsWith(item.href))

        return (
          <Link
            key={item.name}
            href={item.href}
            className={cn(
              "text-lg font-bold hover:-translate-y-1 transition-transform relative after:content-[''] after:absolute after:w-full after:h-[3px] after:bg-[#0055FF] after:bottom-[-4px] after:left-0 after:scale-x-0 hover:after:scale-x-100 after:transition-transform after:[clip-path:polygon(0_0,100%_0,92%_100%,8%_100%)]",
              isActive ? "text-[#0055FF] after:scale-x-100" : "",
            )}
          >
            {item.name}
          </Link>
        )
      })}
    </div>
  )
}

