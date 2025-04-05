"use client"

import { useEffect, useState } from "react"
import { Wallet, ChevronDown, Copy, ExternalLink, LogOut, Settings, RefreshCw, AlertCircle, Check } from "lucide-react"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { toast } from "@/lib/toast"
import { useUserStore } from "@/lib/store"
import { usePrivy, useWallets } from '@privy-io/react-auth'
import { useAdContract } from "@/hooks/use-ad-contract"
import NetworkSwitchModal from "./modals/network-switch-modal"

export default function WalletConnectButton() {
  // Use Privy hooks
  const { login, authenticated, ready, user, logout } = usePrivy()
  const { wallets } = useWallets()
  
  // Get store state and actions
  const { balances, connectWallet, disconnectWallet, isConnecting } = useUserStore()
  
  // Get contract info for network details
  const { chainId, isCorrectChain, switchChain, adContract } = useAdContract()

  // Network name state
  const [networkName, setNetworkName] = useState("Unknown")
  
  // Network switch modal state
  const [isNetworkModalOpen, setIsNetworkModalOpen] = useState(false)

  // Update wallet connection in store when Privy authentication changes
  useEffect(() => {
    const updateWalletConnection = async () => {
      try {
        if (authenticated && user) {
          // Get the active wallet address
          const address = user.wallet?.address

          if (address) {
            // Connect wallet in the store with the user data
            await connectWallet(address, user)
          } else {
            console.warn("User authenticated but no wallet address found")
          }
        }
      } catch (error) {
        console.error("Error updating wallet connection:", error)
        toast(
          "Connection Error",
          { description: "There was an error connecting your wallet. Please try again." },
          "error"
        )
      }
    }
    
    if (ready) {
      updateWalletConnection()
    }
  }, [authenticated, ready, user, connectWallet])
  
  // Update network name when chainId changes
  useEffect(() => {
    if (chainId) {
      switch (chainId) {
        case 17000:
          setNetworkName("Holesky Testnet");
          break;
        case 1:
          setNetworkName("Ethereum Mainnet");
          break;
        case 11155111:
          setNetworkName("Sepolia Testnet");
          break;
        case 137:
          setNetworkName("Polygon");
          break;
        case 42161:
          setNetworkName("Arbitrum");
          break;
        case 10:
          setNetworkName("Optimism");
          break;
        default:
          setNetworkName(`Chain ID: ${chainId}`);
      }
    } else {
      setNetworkName("Not Connected");
    }
  }, [chainId]);
  
  // Format wallet address for display
  const shortAddress = user?.wallet?.address
    ? `${user.wallet.address.slice(0, 6)}...${user.wallet.address.slice(-4)}`
    : null

  const handleConnect = async () => {
    if (authenticated) return
    
    try {
      await login()
    } catch (error) {
      console.error("Login error:", error)
      toast(
        "Login Failed",
        { description: "Failed to connect wallet. Please try again." },
        "error"
      )
    }
  }

  const handleDisconnect = async () => {
    try {
      await logout()
      disconnectWallet()
      toast(
        "Wallet Disconnected",
        { description: "Your wallet has been disconnected successfully." },
        "success"
      )
    } catch (error) {
      console.error("Logout error:", error)
      toast(
        "Logout Failed",
        { description: "Failed to disconnect wallet. Please try again." },
        "error"
      )
    }
  }

  const handleCopyAddress = () => {
    if (!user?.wallet?.address) return

    navigator.clipboard.writeText(user.wallet.address)
    toast(
      "Address Copied",
      { description: "Wallet address copied to clipboard." },
      "success"
    )
  }
  
  const handleSwitchNetwork = async () => {
    setIsNetworkModalOpen(true)
  }

  // Show loading state when connecting or Privy is initializing
  if (isConnecting || !ready) {
    return (
      <Button
        className="hidden md:flex items-center gap-2 bg-white text-black border-[4px] border-black hover:bg-[#FFCC00] transition-all font-bold text-lg px-6 py-5 h-auto rounded-none shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] relative overflow-hidden"
        disabled
      >
        <RefreshCw className="w-5 h-5 animate-spin" />
        <span>Connecting...</span>
      </Button>
    )
  }

  if (!authenticated) {
    return (
      <Button
        className="hidden md:flex items-center gap-2 bg-white text-black border-[4px] border-black hover:bg-[#FFCC00] hover:-translate-y-1 transition-all font-bold text-lg px-6 py-5 h-auto rounded-none shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] hover:shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] relative overflow-hidden group animate-pulse"
        onClick={handleConnect}
      >
        <Wallet className="w-5 h-5 relative z-10" />
        <span className="relative z-10">Connect Wallet</span>
        <span className="absolute inset-0 bg-[#FFCC00] transform -translate-x-full group-hover:translate-x-0 transition-transform duration-300"></span>
      </Button>
    )
  }

  // Get wallet type for display
  const walletType = user?.wallet?.walletClientType === 'privy' 
    ? 'Embedded Wallet' 
    : wallets[0]?.walletClientType === 'privy' ? 'Embedded Wallet' : 'External Wallet'
    
  // Get connected wallet count
  const connectedWalletCount = user?.linkedAccounts?.filter(account => account.type === 'wallet')?.length || 0

  return (
    <>
      <NetworkSwitchModal 
        isOpen={isNetworkModalOpen} 
        onClose={() => setIsNetworkModalOpen(false)} 
      />
      
      <div className="hidden md:flex items-center gap-2">
        {authenticated && !isCorrectChain && (
          <Button
            className="bg-amber-100 text-black hover:bg-amber-200 border-[3px] border-black flex items-center gap-1 py-4 h-auto rounded-none shadow-[3px_3px_0px_0px_rgba(0,0,0,1)]"
            onClick={handleSwitchNetwork}
          >
            <AlertCircle className="w-4 h-4 text-red-500" />
            <span>Switch Network</span>
          </Button>
        )}
        
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button className="hidden md:flex items-center gap-2 bg-white text-black border-[4px] border-black hover:bg-[#f5f5f5] transition-all font-bold text-lg px-6 py-5 h-auto rounded-none shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">
              {shortAddress ? (
                <>
                  <div className="flex items-center">
                    {/* Network indicator dot */}
                    <div className={`w-3 h-3 rounded-full mr-2 ${isCorrectChain ? 'bg-green-500' : 'bg-red-500'}`}></div>
                    <span className="font-mono font-bold">{shortAddress}</span>
                  </div>
                  <ChevronDown className="w-5 h-5" />
                </>
              ) : (
                <>
                  <Wallet className="w-5 h-5" />
                  <span>Connect</span>
                  <ChevronDown className="w-5 h-5" />
                </>
              )}
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-[350px] p-0 border-[4px] border-black rounded-none shadow-[8px_8px_0px_0px_rgba(0,0,0,1)]">
            <div className="bg-[#f5f5f5] p-4 border-b-[3px] border-black">
              <div className="flex items-center justify-between mb-2">
                <div className="font-bold text-lg">Wallet</div>
                <div className="px-2 py-1 bg-green-500 text-white text-xs font-bold border-[2px] border-black">
                  CONNECTED
                </div>
              </div>

              <div className="flex items-center gap-2 mb-4">
                <div className="font-mono text-sm truncate flex-1">{user?.wallet?.address}</div>
                <Button
                  variant="outline"
                  size="icon"
                  className="h-8 w-8 border-[2px] border-black rounded-none hover:bg-[#f5f5f5]"
                  onClick={handleCopyAddress}
                >
                  <Copy className="h-4 w-4" />
                </Button>
              </div>
              
              {/* Network Info - New Section */}
              <div className="mb-4 p-3 bg-white border-[2px] border-black">
                <div className="text-xs font-medium mb-1">NETWORK</div>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className={`w-3 h-3 rounded-full ${isCorrectChain ? 'bg-green-500' : 'bg-red-500'}`}></div>
                    <div className="text-sm font-bold">
                      {networkName}
                    </div>
                  </div>
                  {isCorrectChain ? (
                    <div className="flex items-center text-xs font-medium text-green-600">
                      <Check className="h-3 w-3 mr-1" /> Correct Network
                    </div>
                  ) : (
                    <Button
                      variant="outline"
                      size="sm"
                      className="h-7 py-0 px-2 text-xs border-[2px] border-black rounded-none bg-amber-100 hover:bg-amber-200"
                      onClick={handleSwitchNetwork}
                    >
                      Switch to Holesky
                    </Button>
                  )}
                </div>
              </div>

              {/* Display wallet type */}
              <div className="mb-4">
                <div className="text-xs font-medium">WALLET TYPE</div>
                <div className="text-sm font-bold">
                  {walletType}
                </div>
              </div>
              
              {/* Display linked wallets if any */}
              {connectedWalletCount > 1 && (
                <div className="mb-4">
                  <div className="text-xs font-medium">LINKED WALLETS</div>
                  <div className="text-sm font-bold">
                    {connectedWalletCount} wallets connected
                  </div>
                </div>
              )}
              
              {/* Balances */}
              <div>
                <div className="text-xs font-medium mb-1">BALANCES</div>
                <div className="space-y-1">
                  <div className="flex justify-between">
                    <span>ADN Tokens:</span>
                    <span className="font-bold">{balances?.ADC?.toLocaleString() || "0.00"}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>ETH:</span>
                    <span className="font-bold">{balances?.USDC?.toLocaleString() || "0.00"}</span>
                  </div>
                </div>
              </div>
            </div>

            <div className="p-2">
              {/* Network Settings Button */}
              <DropdownMenuItem 
                className="cursor-pointer flex items-center p-2 hover:bg-[#f5f5f5] rounded-none"
                onClick={handleSwitchNetwork}
              >
                <AlertCircle className={`h-4 w-4 mr-2 ${isCorrectChain ? 'text-green-500' : 'text-red-500'}`} />
                <span>Network Settings</span>
              </DropdownMenuItem>
              
              {/* Settings */}
              <DropdownMenuItem className="cursor-pointer flex items-center p-2 hover:bg-[#f5f5f5] rounded-none">
                <Settings className="h-4 w-4 mr-2" />
                <span>Settings</span>
              </DropdownMenuItem>

              {/* View on Etherscan */}
              <DropdownMenuItem
                className="cursor-pointer flex items-center p-2 hover:bg-[#f5f5f5] rounded-none"
                onClick={() => {
                  if (user?.wallet?.address) {
                    window.open(`https://holesky.etherscan.io/address/${user.wallet.address}`, "_blank")
                  }
                }}
              >
                <ExternalLink className="h-4 w-4 mr-2" />
                <span>View on Etherscan</span>
              </DropdownMenuItem>

              <DropdownMenuSeparator className="border-t-[2px] border-black my-2" />

              {/* Disconnect */}
              <DropdownMenuItem
                className="cursor-pointer flex items-center p-2 hover:bg-[#f5f5f5] rounded-none text-red-600 font-bold"
                onClick={handleDisconnect}
              >
                <LogOut className="h-4 w-4 mr-2" />
                <span>Disconnect</span>
              </DropdownMenuItem>
            </div>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </>
  )
}