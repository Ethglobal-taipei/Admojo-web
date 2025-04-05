"use client"

import type React from "react"
import { useState, useEffect } from "react"
import Link from "next/link"
import { usePathname, useRouter } from "next/navigation"
import {
  Home,
  LayoutDashboard,
  MapPin,
  RefreshCw,
  BarChart2,
  User,
  Menu,
  X,
  Monitor,
  DollarSign,
  ChevronDown,
  Wallet,
  AlertCircle,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"
import WalletConnectButton from "@/components/wallet-connect-button"
import NotificationIndicator from "@/components/notification-indicator"
import { ThemeToggle } from "./theme-toggle"
import RoleSwitcher from "./role-switcher"
import AdvertiserNavigation from "./advertiser-navigation"
import ProviderNavigation from "./provider-navigation"
import { useUIStore, useRoleStore } from "@/lib/store"
import { useAdContract } from "@/hooks/use-ad-contract"
import { usePrivy } from "@privy-io/react-auth"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"

export default function GlobalNavigation() {
  const pathname = usePathname()
  const router = useRouter()
  const { currentRole, isTransitioning, startTransition, isProviderRegistered } = useRoleStore()
  const { isScrolled, isMobileMenuOpen, setScrolled, toggleMobileMenu } = useUIStore()
  const { authenticated, login } = usePrivy()
  const { isCorrectChain, switchChain } = useAdContract()

  // Local state to immediately reflect dropdown selection changes
  const [selectedRole, setSelectedRole] = useState<"advertiser" | "provider">(currentRole)

  // Only sync local state with currentRole if not on the provider-registration page
  useEffect(() => {
    if (!pathname.includes("provider-registration")) {
      setSelectedRole(currentRole)
    }
  }, [currentRole, pathname])

  // Handle scroll effect
  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 10)
    }

    window.addEventListener("scroll", handleScroll)
    return () => window.removeEventListener("scroll", handleScroll)
  }, [setScrolled])

  // Close mobile menu when route changes
  useEffect(() => {
    if (isMobileMenuOpen) {
      toggleMobileMenu()
    }
  }, [pathname, isMobileMenuOpen, toggleMobileMenu])

  // Redirect to appropriate dashboard based on role
  useEffect(() => {
    if (isTransitioning) return

    const isOnAdvertiserDashboard = pathname === "/dashboard"
    const isOnProviderDashboard = pathname === "/provider-dashboard"

    if (currentRole === "provider" && isOnAdvertiserDashboard) {
      router.push("/provider-dashboard")
    } else if (currentRole === "advertiser" && isOnProviderDashboard) {
      router.push("/dashboard")
    }
  }, [currentRole, pathname, router, isTransitioning])

  // Get navigation items based on role for mobile menu
  const getMobileNavItems = () => {
    const commonItems = [
      { name: "Home", href: "/", icon: Home },
      { name: "Account", href: "/account", icon: User },
      { name: "Contract Demo", href: "/contract-demo", icon: RefreshCw },
    ]

    const advertiserItems = [
      { name: "Dashboard", href: "/dashboard", icon: LayoutDashboard },
      { name: "Browse Locations", href: "/browse-locations", icon: MapPin },
      { name: "Swap", href: "/swap", icon: RefreshCw },
      { name: "Analytics", href: "/analytics", icon: BarChart2 },
    ]

    const providerItems = [
      { name: "Provider Dashboard", href: "/provider-dashboard", icon: LayoutDashboard },
      { name: "My Locations", href: "/my-locations", icon: MapPin },
      { name: "Earnings", href: "/provider-earnings", icon: DollarSign },
      { name: "Provider Analytics", href: "/provider-analytics", icon: BarChart2 },
    ]

    return [...commonItems, ...(currentRole === "advertiser" ? advertiserItems : providerItems)]
  }

  const mobileNavItems = getMobileNavItems()

  // Determine theme colors based on role
  const themeColor = currentRole === "advertiser" ? "#0055FF" : "#FF3366"
  const accentColor = currentRole === "advertiser" ? "#FFCC00" : "#0055FF"

  const handleRoleSwitch = (role: "advertiser" | "provider") => {
    setSelectedRole(role)

    // If switching to provider but not registered, redirect to registration
    if (role === "provider" && !isProviderRegistered) {
      router.push("/provider-registration")
      return
    }

    // Start transition and redirect to transition page
    startTransition(role)
    router.push(`/role-transition?to=${role}`)
  }

  const handleConnectWallet = async () => {
    try {
      await login()
    } catch (error) {
      console.error("Login error:", error)
    }
  }

  const handleSwitchNetwork = async () => {
    try {
      await switchChain()
    } catch (error) {
      console.error("Network switch error:", error)
    }
  }

  // Network warning banner
  const NetworkWarning = () => {
    if (!authenticated) return null
    if (isCorrectChain) return null

    return (
      <div className="fixed top-[72px] left-0 w-full bg-red-100 border-b-2 border-red-500 p-2 z-40 flex items-center justify-center">
        <div className="flex items-center gap-2">
          <AlertCircle className="w-5 h-5 text-red-500" />
          <span className="font-medium">Please switch to Holesky testnet for contract features</span>
          <Button size="sm" variant="destructive" className="ml-4" onClick={handleSwitchNetwork}>
            Switch Network
          </Button>
        </div>
      </div>
    )
  }

  return (
    <>
      <nav
        className={cn(
          "fixed top-0 left-0 right-0 z-50 border-b-[6px] transition-all duration-300",
          isScrolled ? "bg-white shadow-[0_8px_0_0_rgba(0,0,0,0.2)]" : "bg-white"
        )}
        style={{
          borderBottomColor: currentRole === "provider" ? "#FF3366" : "black",
        }}
      >
        <div className="absolute inset-0 bg-checkered-light"></div>
        <div className="container mx-auto sm:mx-4 px-2 py-4 flex items-center justify-between relative space-x-6">
          {/* Logo */}
          <div className="flex items-center gap-2">
            <Link href="/" className="font-black text-3xl pr-2 tracking-tight relative overflow-hidden group">
              <span className="inline-block transition-transform duration-300 group-hover:-translate-y-full pt-1 animate-bounce">
                ADMOJO
              </span>
              <span
                className="inline-block absolute top-0 left-0 transition-transform duration-300 translate-y-full group-hover:translate-y-0"
                style={{ color: themeColor }}
              >
                ADMOJO
              </span>
            </Link>
            {currentRole === "provider" && (
              <div className="px-3 py-1 bg-[#FF3366] text-white font-bold border-[3px] border-black">
                PROVIDER
              </div>
            )}
          </div>

          {/* Role-specific Desktop Navigation */}
          {currentRole === "advertiser" ? <AdvertiserNavigation /> : <ProviderNavigation />}

          {/* Action Buttons */}
          <div className="flex items-center gap-6">
            <RoleSwitcher />
            <NotificationIndicator />
            <ThemeToggle />

            {!authenticated ? (
              <Button
                className="hidden md:flex items-center gap-2 bg-white text-black border-[4px] border-black hover:bg-[#FFCC00] hover:-translate-y-1 transition-all font-bold text-lg pl-6 py-5 h-auto rounded-none shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] hover:shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] relative overflow-hidden group animate-pulse"
                onClick={handleConnectWallet}
              >
                <Wallet className="w-5 h-5 relative z-10" />
                <span className="relative z-10">Connect Wallet</span>
                <span className="absolute inset-0 bg-[#FFCC00] transform -translate-x-full group-hover:translate-x-0 transition-transform duration-300"></span>
              </Button>
            ) : (
              <WalletConnectButton />
            )}

            {/* Mobile Menu Button */}
            <Button
              className="md:hidden bg-white text-black border-[4px] border-black hover:bg-[#FFCC00] transition-all font-bold rounded-none"
              size="icon"
              onClick={toggleMobileMenu}
              style={{ borderColor: "black", "--hover-bg": accentColor } as React.CSSProperties}
            >
              <Menu className="w-6 h-6" />
            </Button>
          </div>
        </div>
      </nav>

      {/* Network Warning Banner */}
      <NetworkWarning />

      {/* Mobile Navigation Menu */}
      <div
        className={cn(
          "fixed inset-0 z-[60] bg-white transform transition-transform duration-300 border-r-[6px] border-black",
          isMobileMenuOpen ? "translate-x-0" : "-translate-x-full"
        )}
        style={{
          borderRightColor: currentRole === "provider" ? "#FF3366" : "black",
        }}
      >
        <div className="absolute inset-0 bg-checkered-light"></div>

        <div className="relative h-full flex flex-col p-6">
          {/* Header */}
          <div className="flex items-center justify-between mb-8">
            <div className="font-black text-4xl flex items-center gap-2">
              <span style={{ color: themeColor }}>ADNET</span>
              {currentRole === "provider" && (
                <div className="px-3 py-1 bg-[#FF3366] text-white font-bold border-[3px] border-black text-sm">
                  PROVIDER
                </div>
              )}
            </div>
            <Button
              className="bg-white text-black border-[4px] border-black hover:bg-[#FF3366] hover:text-white transition-all font-bold rounded-none"
              size="icon"
              onClick={toggleMobileMenu}
              style={{ "--hover-bg": themeColor } as React.CSSProperties}
            >
              <X className="w-6 h-6" />
            </Button>
          </div>

          {/* Network Status (Mobile) */}
          {authenticated && !isCorrectChain && (
            <div className="mb-6 p-3 bg-red-100 border-4 border-red-300 flex flex-col gap-2">
              <div className="flex items-center gap-2">
                <AlertCircle className="w-5 h-5 text-red-500" />
                <span className="font-medium">Wrong Network</span>
              </div>
              <Button onClick={handleSwitchNetwork} className="bg-red-500 hover:bg-red-600 text-white border-2 border-black">
                Switch to Holesky Testnet
              </Button>
            </div>
          )}

          {/* Role Switcher */}
          <div className="mb-6">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button className="w-full flex items-center justify-between gap-2 bg-white border-4 border-black rounded-none px-4 py-3 h-auto hover:bg-gray-100">
                  <div className="flex items-center gap-2">
                    {selectedRole === "advertiser" ? (
                      <>
                        <Monitor className="w-5 h-5 text-[#0055FF]" />
                        <span className="font-bold text-lg">Advertiser Mode</span>
                      </>
                    ) : (
                      <>
                        <MapPin className="w-5 h-5 text-[#FF3366]" />
                        <span className="font-bold text-lg">Provider Mode</span>
                      </>
                    )}
                  </div>
                  <ChevronDown className="w-5 h-5" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent className="w-full border-4 border-black p-2">
                <DropdownMenuItem
                  className={`flex items-center gap-2 p-3 mb-1 rounded-none ${
                    selectedRole === "advertiser" ? "bg-[#0055FF] text-white" : "hover:bg-gray-100"
                  }`}
                  onClick={() => handleRoleSwitch("advertiser")}
                >
                  <Monitor className="w-5 h-5" />
                </DropdownMenuItem>
                <DropdownMenuItem
                  className={`flex items-center gap-2 p-3 rounded-none ${
                    selectedRole === "provider" ? "bg-[#FF3366] text-white" : "hover:bg-gray-100"
                  }`}
                  onClick={() => handleRoleSwitch("provider")}
                >
                  <MapPin className="w-5 h-5" />
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>

          {/* Navigation Items */}
          <div className="flex flex-col gap-4">
            {mobileNavItems.map((item) => {
              const isActive = pathname === item.href || (item.href !== "/" && pathname.startsWith(item.href))
              return (
                <Link
                  key={item.name}
                  href={item.href}
                  className={cn(
                    "text-2xl font-bold p-4 border-[4px] border-black flex items-center gap-4 transition-all",
                    isActive
                      ? `bg-[${themeColor}] text-white -translate-x-2 translate-y-2 shadow-[8px_8px_0_0_rgba(0,0,0,1)]`
                      : `bg-white hover:bg-[${accentColor}] hover:-translate-y-2 hover:shadow-[6px_6px_0_0_rgba(0,0,0,1)]`
                  )}
                  style={{
                    backgroundColor: isActive ? themeColor : "white",
                    color: isActive ? "white" : "black",
                    "--hover-bg": accentColor,
                  } as React.CSSProperties}
                >
                  <item.icon className="w-8 h-8" />
                  {item.name}
                </Link>
              )
            })}
          </div>

          {/* Mobile Wallet Connect */}
          <div className="mt-auto">
            {!authenticated ? (
              <Button
                className="w-full flex items-center justify-center gap-2 bg-white text-black border-[4px] border-black hover:bg-[#FFCC00] transition-all font-bold text-xl p-6 rounded-none shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] hover:shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] relative overflow-hidden group animate-pulse"
                onClick={handleConnectWallet}
              >
                <Wallet className="w-6 h-6 relative z-10" />
                <span className="relative z-10">Connect Wallet</span>
                <span className="absolute inset-0 bg-[#FFCC00] transform -translate-x-full group-hover:translate-x-0 transition-transform duration-300"></span>
              </Button>
            ) : (
              <WalletConnectButton />
            )}
          </div>
        </div>
      </div>
    </>
  )
}
