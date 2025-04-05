"use client"

import { useState } from "react"
import { AlertCircle, Check, ExternalLink, RefreshCw } from "lucide-react"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { useAdContract } from "@/hooks/use-ad-contract"
import { toast } from "@/lib/toast"
import { holesky } from "viem/chains"

interface NetworkSwitchModalProps {
  isOpen: boolean
  onClose: () => void
}

export default function NetworkSwitchModal({ isOpen, onClose }: NetworkSwitchModalProps) {
  const { chainId, isCorrectChain, switchChain } = useAdContract()
  const [isSwitching, setIsSwitching] = useState(false)

  const handleSwitchNetwork = async () => {
    try {
      setIsSwitching(true)
      await switchChain()
      
      // Check if the switch was successful
      if (chainId === holesky.id) {
        toast(
          "Network Switched",
          { description: "Successfully switched to Holesky Testnet." },
          "success"
        )
        onClose()
      }
    } catch (error) {
      console.error("Failed to switch network:", error)
      toast(
        "Switch Failed",
        { description: "Failed to switch network. Please try again or switch manually." },
        "error"
      )
    } finally {
      setIsSwitching(false)
    }
  }

  // Get network name based on chainId
  const getCurrentNetworkName = () => {
    if (!chainId) return "Not Connected"
    
    switch (chainId) {
      case 17000:
        return "Holesky Testnet"
      case 1:
        return "Ethereum Mainnet"
      case 11155111:
        return "Sepolia Testnet"
      case 137:
        return "Polygon"
      case 42161:
        return "Arbitrum"
      case 10:
        return "Optimism"
      default:
        return `Chain ID: ${chainId}`
    }
  }

  const openBlockExplorer = () => {
    window.open("https://holesky.etherscan.io", "_blank")
  }

  const openMetamaskInstructions = () => {
    window.open("https://chainlist.org/chain/17000", "_blank")
  }

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-md border-[4px] border-black rounded-none shadow-[8px_8px_0px_0px_rgba(0,0,0,1)]">
        <DialogHeader>
          <DialogTitle className="text-2xl font-bold flex items-center gap-2">
            <AlertCircle className="h-6 w-6 text-red-500" />
            Wrong Network
          </DialogTitle>
          <DialogDescription>
            This app requires the Holesky testnet to function properly.
          </DialogDescription>
        </DialogHeader>
        
        <div className="space-y-6 py-4">
          <div className="bg-amber-50 p-4 border-[2px] border-black rounded-none">
            <div className="flex items-center justify-between mb-3">
              <div className="font-bold">Current Network</div>
              <div className={`px-2 py-1 text-xs font-bold border-[2px] border-black ${isCorrectChain ? 'bg-green-500 text-white' : 'bg-red-500 text-white'}`}>
                {isCorrectChain ? 'CORRECT' : 'INCORRECT'}
              </div>
            </div>
            
            <div className="flex items-center gap-2 font-mono">
              <div className={`w-3 h-3 rounded-full ${isCorrectChain ? 'bg-green-500' : 'bg-red-500'}`}></div>
              <div className="font-medium">{getCurrentNetworkName()}</div>
            </div>
          </div>
          
          <div className="bg-[#f5f5f5] p-4 border-[2px] border-black rounded-none">
            <div className="font-bold mb-2">Required Network</div>
            <div className="flex items-center gap-2 font-mono">
              <div className="w-3 h-3 rounded-full bg-green-500"></div>
              <div className="font-medium">Holesky Testnet (Chain ID: 17000)</div>
            </div>
            
            <div className="mt-4 text-sm text-gray-600">
              <p>The Holesky network is an Ethereum testnet that allows you to test applications without using real ETH.</p>
            </div>
          </div>
          
          {!isCorrectChain && (
            <div className="space-y-2">
              <Button 
                className="w-full bg-black text-white hover:bg-gray-800 font-bold py-2 px-4 rounded-none border-2 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,0.2)]"
                onClick={handleSwitchNetwork}
                disabled={isSwitching}
              >
                {isSwitching ? (
                  <>
                    <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                    Switching Network...
                  </>
                ) : (
                  "Switch to Holesky Testnet"
                )}
              </Button>
              
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  className="flex-1 border-[2px] border-black rounded-none font-semibold"
                  onClick={openBlockExplorer}
                >
                  <ExternalLink className="h-4 w-4 mr-2" />
                  Explorer
                </Button>
                <Button
                  variant="outline"
                  className="flex-1 border-[2px] border-black rounded-none font-semibold"
                  onClick={openMetamaskInstructions}
                >
                  <ExternalLink className="h-4 w-4 mr-2" />
                  Add to Wallet
                </Button>
              </div>
            </div>
          )}
        </div>
        
        <DialogFooter className="sm:justify-center gap-2">
          {isCorrectChain ? (
            <Button 
              className="w-full bg-green-500 text-white hover:bg-green-600 font-bold py-2 px-4 rounded-none border-2 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,0.2)]"
              onClick={onClose}
            >
              <Check className="h-4 w-4 mr-2" />
              You're all set!
            </Button>
          ) : (
            <Button 
              variant="outline"
              className="border-[2px] border-black rounded-none font-semibold"
              onClick={onClose}
            >
              Continue without switching
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
} 