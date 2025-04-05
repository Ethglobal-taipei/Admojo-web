"use client"

import { X } from "lucide-react"
import Image from "next/image"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog"

interface WalletConnectionModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConnect: (walletName: string) => void;
}

export default function WalletConnectionModal({ isOpen, onClose, onConnect }: WalletConnectionModalProps) {
  // Wallet options
  const walletOptions = [
    {
      id: "metamask",
      name: "MetaMask",
      icon: "/placeholder.svg?height=40&width=40",
      description: "Connect to your MetaMask Wallet",
      popular: true,
    },
    {
      id: "walletconnect",
      name: "WalletConnect",
      icon: "/placeholder.svg?height=40&width=40",
      description: "Scan with WalletConnect to connect",
    },
    {
      id: "coinbase",
      name: "Coinbase Wallet",
      icon: "/placeholder.svg?height=40&width=40",
      description: "Connect to your Coinbase Wallet",
    },
    
  ]

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="border-[6px] border-black rounded-none shadow-[12px_12px_0px_0px_rgba(0,0,0,1)] p-0 w-[90vw] max-w-[500px] transform rotate-[0.5deg]">
        <DialogTitle className="sr-only">Connect Wallet</DialogTitle>
        <div className="relative">
          {/* Header */}
          <div className="bg-[#0055FF] text-white p-6 border-b-[4px] border-black">
            <div className="absolute top-4 right-4">
              <Button
                variant="outline"
                size="icon"
                className="h-8 w-8 border-[3px] border-white rounded-none bg-transparent hover:bg-white hover:text-[#0055FF]"
                onClick={onClose}
              >
                <X className="h-4 w-4" />
              </Button>
            </div>

            <h2 className="text-3xl font-black mb-2">Connect Wallet</h2>
            <p className="font-bold">Choose your preferred wallet provider</p>
          </div>

          {/* Wallet Options */}
          <div className="p-6 bg-white">
            <div className="space-y-4">
              {walletOptions.map((wallet) => (
                <button
                  key={wallet.id}
                  className="w-full border-[4px] border-black p-4 flex items-center gap-4 hover:bg-[#f5f5f5] hover:-translate-y-1 hover:shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] transition-all relative group"
                  onClick={() => onConnect(wallet.name)}
                >
                  <div className="w-12 h-12 border-[3px] border-black bg-white flex items-center justify-center overflow-hidden">
                    <Image
                      src={wallet.icon || "/placeholder.svg"}
                      alt={wallet.name}
                      width={40}
                      height={40}
                      className="group-hover:scale-110 transition-transform"
                    />
                  </div>

                  <div className="flex-1 text-left">
                    <div className="font-bold text-lg">{wallet.name}</div>
                    <div className="text-sm">{wallet.description}</div>
                  </div>

                  {wallet.popular && (
                    <div className="px-2 py-1 bg-[#FFCC00] text-black text-xs font-bold border-[2px] border-black">
                      POPULAR
                    </div>
                  )}
                </button>
              ))}
            </div>

            <div className="mt-6 p-4 border-[3px] border-[#f5f5f5] bg-[#f5f5f5]/50">
              <div className="text-sm font-medium text-center">
                By connecting your wallet, you agree to our <br />
                <span className="font-bold underline">Terms of Service</span> and{" "}
                <span className="font-bold underline">Privacy Policy</span>
              </div>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}

