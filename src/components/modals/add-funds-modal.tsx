"use client"

import type React from "react"

import { useState } from "react"
import { X, CreditCard, Wallet, ArrowRight, Check } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { useUIStore } from "@/lib/store"
import { toast } from "@/lib/toast"

export default function AddFundsModal() {
  const { activeModal, closeModal } = useUIStore()
  const [amount, setAmount] = useState("1000")
  const [paymentMethod, setPaymentMethod] = useState("card")
  const [isProcessing, setIsProcessing] = useState(false)
  const [isComplete, setIsComplete] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!amount || Number.parseFloat(amount) <= 0) {
      toast({
        title: "Invalid Amount",
        description: "Please enter a valid amount to deposit",
        type: "error",
      })
      return
    }

    setIsProcessing(true)

    try {
      // Simulate API call
      await new Promise((resolve) => setTimeout(resolve, 2000))

      // In a real app, this would call your backend
      setIsProcessing(false)
      setIsComplete(true)

      // Reset after showing success
      setTimeout(() => {
        setIsComplete(false)
        closeModal()

        // Reset form
        setAmount("1000")
        setPaymentMethod("card")
      }, 3000)
    } catch (error) {
      setIsProcessing(false)
      toast({
        title: "Deposit Failed",
        description: "There was an error processing your deposit",
        type: "error",
      })
    }
  }

  const handleClose = () => {
    if (!isProcessing) {
      closeModal()
    }
  }

  const presetAmounts = ["100", "500", "1000", "5000"]

  return (
    <Dialog open={activeModal === "addFunds"} onOpenChange={handleClose}>
      <DialogContent className="border-[6px] border-black rounded-none shadow-[12px_12px_0px_0px_rgba(0,0,0,1)] p-0 w-[90vw] max-w-[500px] max-h-[90vh] transform rotate-[0.5deg] overflow-hidden">
        <div className="relative h-full flex flex-col">
          {/* Header */}
          <div className="bg-[#0055FF] text-white p-6 border-b-[4px] border-black flex-shrink-0">
            <div className="absolute top-4 right-4">
              <Button
                variant="outline"
                size="icon"
                className="h-8 w-8 border-[3px] border-white rounded-none bg-transparent hover:bg-white hover:text-[#0055FF]"
                onClick={handleClose}
                disabled={isProcessing}
              >
                <X className="h-4 w-4" />
              </Button>
            </div>

            <h2 className="text-3xl font-black mb-2">Add Funds</h2>
            <p className="font-bold">Deposit USDC to your ADNET account</p>
          </div>

          {/* Content */}
          <div className="p-6 bg-white overflow-y-auto flex-grow">
            {!isComplete ? (
              <form onSubmit={handleSubmit}>
                {/* Amount Selection */}
                <div className="mb-6">
                  <Label htmlFor="amount" className="font-bold text-lg mb-2 block">
                    Amount (USDC)
                  </Label>

                  <div className="grid grid-cols-4 gap-2 mb-3">
                    {presetAmounts.map((preset) => (
                      <Button
                        key={preset}
                        type="button"
                        variant="outline"
                        className={`border-[3px] ${
                          amount === preset ? "border-[#0055FF] bg-[#0055FF]/10" : "border-black"
                        } rounded-none hover:bg-[#f5f5f5]`}
                        onClick={() => setAmount(preset)}
                      >
                        {preset}
                      </Button>
                    ))}
                  </div>

                  <div className="relative">
                    <Input
                      id="amount"
                      type="number"
                      value={amount}
                      onChange={(e) => setAmount(e.target.value)}
                      className="border-[4px] border-black rounded-none h-12 text-lg font-medium pl-12"
                      placeholder="Enter amount"
                      min="1"
                      step="1"
                    />
                    <div className="absolute left-4 top-1/2 -translate-y-1/2 font-bold">$</div>
                  </div>

                  <div className="mt-2 text-sm">
                    You will receive approximately {(Number.parseFloat(amount || "0") * 2.35).toFixed(2)} ADC
                  </div>
                </div>

                {/* Payment Method */}
                <div className="mb-6">
                  <Label className="font-bold text-lg mb-2 block">Payment Method</Label>

                  <RadioGroup value={paymentMethod} onValueChange={setPaymentMethod} className="space-y-3">
                    <div
                      className={`border-[4px] ${
                        paymentMethod === "card" ? "border-[#0055FF]" : "border-black"
                      } p-4 flex items-center gap-4 hover:bg-[#f5f5f5]`}
                    >
                      <RadioGroupItem value="card" id="card" className="hidden" />
                      <div className="w-12 h-12 border-[3px] border-black bg-white flex items-center justify-center">
                        <CreditCard className="w-6 h-6" />
                      </div>
                      <div className="flex-1">
                        <Label htmlFor="card" className="font-bold text-lg">
                          Credit/Debit Card
                        </Label>
                        <p className="text-sm">Instant deposit with 2.5% fee</p>
                      </div>
                      {paymentMethod === "card" && (
                        <div className="w-6 h-6 bg-[#0055FF] rounded-full flex items-center justify-center">
                          <Check className="w-4 h-4 text-white" />
                        </div>
                      )}
                    </div>

                    <div
                      className={`border-[4px] ${
                        paymentMethod === "wallet" ? "border-[#0055FF]" : "border-black"
                      } p-4 flex items-center gap-4 hover:bg-[#f5f5f5]`}
                    >
                      <RadioGroupItem value="wallet" id="wallet" className="hidden" />
                      <div className="w-12 h-12 border-[3px] border-black bg-white flex items-center justify-center">
                        <Wallet className="w-6 h-6" />
                      </div>
                      <div className="flex-1">
                        <Label htmlFor="wallet" className="font-bold text-lg">
                          Crypto Wallet
                        </Label>
                        <p className="text-sm">Direct deposit from your wallet</p>
                      </div>
                      {paymentMethod === "wallet" && (
                        <div className="w-6 h-6 bg-[#0055FF] rounded-full flex items-center justify-center">
                          <Check className="w-4 h-4 text-white" />
                        </div>
                      )}
                    </div>
                  </RadioGroup>
                </div>

                {/* Summary */}
                <div className="border-[3px] border-black p-4 bg-[#f5f5f5] mb-6">
                  <h3 className="font-bold mb-2">Transaction Summary</h3>
                  <div className="space-y-2">
                    <div className="flex justify-between">
                      <span>Deposit Amount:</span>
                      <span className="font-bold">{Number.parseFloat(amount || "0").toLocaleString()} USDC</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Fee ({paymentMethod === "card" ? "2.5%" : "1%"}):</span>
                      <span className="font-bold">
                        {(Number.parseFloat(amount || "0") * (paymentMethod === "card" ? 0.025 : 0.01)).toFixed(2)} USDC
                      </span>
                    </div>
                    <div className="border-t border-gray-300 my-1 pt-1 flex justify-between font-bold">
                      <span>Total:</span>
                      <span>
                        {(
                          Number.parseFloat(amount || "0") +
                          Number.parseFloat(amount || "0") * (paymentMethod === "card" ? 0.025 : 0.01)
                        ).toFixed(2)}{" "}
                        USDC
                      </span>
                    </div>
                  </div>
                </div>

                {/* Submit Button */}
                <Button
                  type="submit"
                  className="w-full bg-[#0055FF] text-white border-[4px] border-black hover:bg-[#0044CC] transition-all font-bold text-lg py-4 h-auto flex items-center justify-center gap-2"
                  disabled={isProcessing || !amount || Number.parseFloat(amount) <= 0}
                >
                  {isProcessing ? (
                    <>
                      <div className="animate-spin w-5 h-5 border-2 border-white border-t-transparent rounded-full" />
                      Processing...
                    </>
                  ) : (
                    <>
                      Deposit Now
                      <ArrowRight className="w-5 h-5" />
                    </>
                  )}
                </Button>

                <div className="mt-4 text-sm text-center text-gray-500">
                  By proceeding, you agree to our Terms of Service and Privacy Policy
                </div>
              </form>
            ) : (
              <div className="py-8 text-center">
                <div className="w-16 h-16 bg-green-500 rounded-full mx-auto flex items-center justify-center mb-4">
                  <Check className="w-8 h-8 text-white" />
                </div>
                <h3 className="text-2xl font-bold mb-2">Deposit Successful!</h3>
                <p className="mb-6">
                  Your deposit of {Number.parseFloat(amount).toLocaleString()} USDC has been processed successfully.
                </p>
                <div className="border-[3px] border-black p-4 bg-[#f5f5f5] mb-6 mx-auto max-w-xs">
                  <div className="font-bold mb-1">New Balance</div>
                  <div className="text-3xl font-black">{(5000 + Number.parseFloat(amount)).toLocaleString()} USDC</div>
                </div>
              </div>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}

