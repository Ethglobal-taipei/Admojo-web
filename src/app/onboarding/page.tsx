"use client"

import { useState } from "react"
import Image from "next/image"
import { useRouter } from "next/navigation"
import { ArrowRight, Check } from "lucide-react"
import { Button } from "@/components/ui/button"

export default function OnboardingPage() {
  const router = useRouter()
  const [currentStep, setCurrentStep] = useState(1)
  const [selectedRole, setSelectedRole] = useState(null)

  const totalSteps = 3

  const handleNextStep = () => {
    if (currentStep < totalSteps) {
      setCurrentStep(currentStep + 1)
    } else {
      // Redirect based on role
      if (selectedRole === "advertiser") {
        router.push("/dashboard")
      } else {
        router.push("/provider-dashboard")
      }
    }
  }

  const handleRoleSelect = (role) => {
    setSelectedRole(role)
  }

  return (
    <div className="min-h-screen bg-white relative">
      {/* Checkered Background Pattern */}
      <div className="fixed inset-0 -z-20 bg-white">
        <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNDAiIGhlaWdodD0iNDAiIHZpZXdCb3g9IjAgMCA0MCA0MCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48cGF0aCBkPSJNMCAwaDIwdjIwSDB6TTIwIDIwaDIwdjIwSDIweiIgZmlsbD0icmdiYSgwLDAsMCwwLjAzKSIgZmlsbC1ydWxlPSJldmVub2RkIi8+PC9zdmc+')] opacity-70"></div>
      </div>

      {/* Animated Background Elements */}
      <div className="fixed inset-0 -z-10 overflow-hidden pointer-events-none">
        <div className="absolute top-[10%] right-[5%] w-32 h-32 bg-[#FFCC00] border-[6px] border-black rounded-full opacity-20 animate-pulse"></div>
        <div
          className="absolute top-[30%] left-[8%] w-48 h-48 bg-[#0055FF] border-[6px] border-black opacity-10 animate-bounce"
          style={{ animationDuration: "8s" }}
        ></div>
        <div
          className="absolute bottom-[15%] right-[15%] w-64 h-64 bg-[#FF3366] border-[6px] border-black opacity-10"
          style={{ animation: "spin 15s linear infinite" }}
        ></div>
      </div>

      <div className="container mx-auto px-4 py-12">
        {/* Progress Bar */}
        <div className="max-w-3xl mx-auto mb-12">
          <div className="flex justify-between mb-2">
            {Array.from({ length: totalSteps }).map((_, index) => (
              <div
                key={index}
                className={`relative flex items-center justify-center w-12 h-12 border-[4px] border-black font-bold text-xl ${
                  currentStep > index + 1
                    ? "bg-[#0055FF] text-white"
                    : currentStep === index + 1
                      ? "bg-[#FFCC00]"
                      : "bg-white"
                }`}
              >
                {currentStep > index + 1 ? <Check className="w-6 h-6" /> : index + 1}
              </div>
            ))}
          </div>

          <div className="relative h-[6px] bg-[#f5f5f5] border-[2px] border-black">
            <div
              className="absolute top-0 left-0 h-full bg-[#0055FF] transition-all duration-500"
              style={{ width: `${((currentStep - 1) / (totalSteps - 1)) * 100}%` }}
            ></div>
          </div>
        </div>

        <div className="max-w-4xl mx-auto">
          {/* Step 1: Welcome */}
          {currentStep === 1 && (
            <div className="border-[6px] border-black bg-white p-8 shadow-[12px_12px_0px_0px_rgba(0,0,0,1)] transform rotate-1 animate-in fade-in duration-500">
              <div className="absolute -top-8 -left-8 w-20 h-20 bg-[#0055FF] border-[4px] border-black rotate-12 hidden md:block"></div>

              <h1 className="text-4xl md:text-6xl font-black mb-6">WELCOME TO ADNET</h1>
              <p className="text-xl font-bold mb-8">
                The decentralized advertising protocol connecting real-world displays with digital advertisers
              </p>

              <div className="flex justify-center mb-8">
                <Image
                  src="/placeholder.svg?height=300&width=600"
                  alt="AdNet Welcome"
                  width={600}
                  height={300}
                  className="border-[4px] border-black"
                />
              </div>

              <p className="text-lg font-medium mb-8">
                We're excited to have you join our platform! Let's get you set up with a few quick steps.
              </p>

              <div className="flex justify-end">
                <Button
                  className="bg-[#0055FF] text-white border-[6px] border-black hover:bg-[#FFCC00] hover:text-black transition-all font-bold text-xl px-8 py-6 h-auto rounded-none shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] hover:shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] hover:-translate-y-2 relative overflow-hidden group"
                  onClick={handleNextStep}
                >
                  <span className="relative z-10 flex items-center gap-2">
                    Get Started
                    <ArrowRight className="w-6 h-6" />
                  </span>
                  <span className="absolute inset-0 bg-[#FFCC00] transform scale-x-0 group-hover:scale-x-100 transition-transform duration-300 origin-left"></span>
                </Button>
              </div>
            </div>
          )}

          {/* Step 2: Role Selection */}
          {currentStep === 2 && (
            <div className="border-[6px] border-black bg-white p-8 shadow-[12px_12px_0px_0px_rgba(0,0,0,1)] transform -rotate-1 animate-in fade-in duration-500">
              <div className="absolute -top-8 -right-8 w-20 h-20 bg-[#FFCC00] border-[4px] border-black -rotate-12 hidden md:block"></div>

              <h1 className="text-4xl font-black mb-6">CHOOSE YOUR ROLE</h1>
              <p className="text-xl font-bold mb-8">Are you looking to advertise or provide display space?</p>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-12">
                <div
                  className={`border-[6px] border-black p-6 cursor-pointer transition-all ${
                    selectedRole === "advertiser"
                      ? "bg-[#0055FF] text-white -translate-y-2 shadow-[8px_8px_0px_0px_rgba(0,0,0,1)]"
                      : "bg-white hover:bg-[#f5f5f5] hover:-translate-y-2 hover:shadow-[6px_6px_0px_0px_rgba(0,0,0,1)]"
                  }`}
                  onClick={() => handleRoleSelect("advertiser")}
                >
                  <div className="flex justify-center mb-4">
                    <div className="w-24 h-24 border-[4px] border-black bg-white flex items-center justify-center">
                      <Image src="/placeholder.svg?height=60&width=60" alt="Advertiser" width={60} height={60} />
                    </div>
                  </div>

                  <h3 className="text-2xl font-black mb-2 text-center">ADVERTISER</h3>
                  <p className="font-medium text-center mb-4">I want to create campaigns and advertise on displays</p>

                  <ul className="space-y-2">
                    <li className="flex items-center gap-2">
                      <div className="w-6 h-6 border-[2px] border-black flex items-center justify-center bg-white">
                        <Check className="w-4 h-4 text-[#0055FF]" />
                      </div>
                      <span>Create advertising campaigns</span>
                    </li>
                    <li className="flex items-center gap-2">
                      <div className="w-6 h-6 border-[2px] border-black flex items-center justify-center bg-white">
                        <Check className="w-4 h-4 text-[#0055FF]" />
                      </div>
                      <span>Target specific locations</span>
                    </li>
                    <li className="flex items-center gap-2">
                      <div className="w-6 h-6 border-[2px] border-black flex items-center justify-center bg-white">
                        <Check className="w-4 h-4 text-[#0055FF]" />
                      </div>
                      <span>Track performance metrics</span>
                    </li>
                  </ul>
                </div>

                <div
                  className={`border-[6px] border-black p-6 cursor-pointer transition-all ${
                    selectedRole === "provider"
                      ? "bg-[#FF3366] text-white -translate-y-2 shadow-[8px_8px_0px_0px_rgba(0,0,0,1)]"
                      : "bg-white hover:bg-[#f5f5f5] hover:-translate-y-2 hover:shadow-[6px_6px_0px_0px_rgba(0,0,0,1)]"
                  }`}
                  onClick={() => handleRoleSelect("provider")}
                >
                  <div className="flex justify-center mb-4">
                    <div className="w-24 h-24 border-[4px] border-black bg-white flex items-center justify-center">
                      <Image src="/placeholder.svg?height=60&width=60" alt="Provider" width={60} height={60} />
                    </div>
                  </div>

                  <h3 className="text-2xl font-black mb-2 text-center">PROVIDER</h3>
                  <p className="font-medium text-center mb-4">I want to register my displays and earn revenue</p>

                  <ul className="space-y-2">
                    <li className="flex items-center gap-2">
                      <div className="w-6 h-6 border-[2px] border-black flex items-center justify-center bg-white">
                        <Check className="w-4 h-4 text-[#FF3366]" />
                      </div>
                      <span>Register physical displays</span>
                    </li>
                    <li className="flex items-center gap-2">
                      <div className="w-6 h-6 border-[2px] border-black flex items-center justify-center bg-white">
                        <Check className="w-4 h-4 text-[#FF3366]" />
                      </div>
                      <span>Earn ADC tokens</span>
                    </li>
                    <li className="flex items-center gap-2">
                      <div className="w-6 h-6 border-[2px] border-black flex items-center justify-center bg-white">
                        <Check className="w-4 h-4 text-[#FF3366]" />
                      </div>
                      <span>Monitor display performance</span>
                    </li>
                  </ul>
                </div>
              </div>

              <div className="flex justify-end">
                <Button
                  className="bg-[#0055FF] text-white border-[6px] border-black hover:bg-[#FFCC00] hover:text-black transition-all font-bold text-xl px-8 py-6 h-auto rounded-none shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] hover:shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] hover:-translate-y-2 relative overflow-hidden group"
                  onClick={handleNextStep}
                  disabled={!selectedRole}
                >
                  <span className="relative z-10 flex items-center gap-2">
                    Continue
                    <ArrowRight className="w-6 h-6" />
                  </span>
                  <span className="absolute inset-0 bg-[#FFCC00] transform scale-x-0 group-hover:scale-x-100 transition-transform duration-300 origin-left"></span>
                </Button>
              </div>
            </div>
          )}

          {/* Step 3: Final Setup */}
          {currentStep === 3 && (
            <div className="border-[6px] border-black bg-white p-8 shadow-[12px_12px_0px_0px_rgba(0,0,0,1)] transform rotate-1 animate-in fade-in duration-500">
              <div className="absolute -bottom-8 -right-8 w-20 h-20 bg-[#FF3366] border-[4px] border-black rotate-12 hidden md:block"></div>

              <h1 className="text-4xl font-black mb-6">ALMOST THERE!</h1>
              <p className="text-xl font-bold mb-8">
                You've selected the {selectedRole === "advertiser" ? "Advertiser" : "Provider"} role. Let's get you set
                up.
              </p>

              <div className="border-[4px] border-black p-6 bg-[#f5f5f5] mb-8">
                <h3 className="text-2xl font-black mb-4">Next Steps</h3>

                {selectedRole === "advertiser" ? (
                  <ul className="space-y-4">
                    <li className="flex items-start gap-3">
                      <div className="w-8 h-8 border-[3px] border-black bg-[#0055FF] text-white flex items-center justify-center font-bold flex-shrink-0">
                        1
                      </div>
                      <div>
                        <p className="font-bold">Connect your wallet</p>
                        <p className="text-sm">Link your crypto wallet to fund your campaigns</p>
                      </div>
                    </li>
                    <li className="flex items-start gap-3">
                      <div className="w-8 h-8 border-[3px] border-black bg-[#0055FF] text-white flex items-center justify-center font-bold flex-shrink-0">
                        2
                      </div>
                      <div>
                        <p className="font-bold">Create your first campaign</p>
                        <p className="text-sm">Set up targeting, budget, and creative assets</p>
                      </div>
                    </li>
                    <li className="flex items-start gap-3">
                      <div className="w-8 h-8 border-[3px] border-black bg-[#0055FF] text-white flex items-center justify-center font-bold flex-shrink-0">
                        3
                      </div>
                      <div>
                        <p className="font-bold">Monitor performance</p>
                        <p className="text-sm">Track impressions, engagement, and optimize your campaigns</p>
                      </div>
                    </li>
                  </ul>
                ) : (
                  <ul className="space-y-4">
                    <li className="flex items-start gap-3">
                      <div className="w-8 h-8 border-[3px] border-black bg-[#FF3366] text-white flex items-center justify-center font-bold flex-shrink-0">
                        1
                      </div>
                      <div>
                        <p className="font-bold">Connect your wallet</p>
                        <p className="text-sm">Link your crypto wallet to receive payments</p>
                      </div>
                    </li>
                    <li className="flex items-start gap-3">
                      <div className="w-8 h-8 border-[3px] border-black bg-[#FF3366] text-white flex items-center justify-center font-bold flex-shrink-0">
                        2
                      </div>
                      <div>
                        <p className="font-bold">Register your displays</p>
                        <p className="text-sm">Add your physical displays and verification devices</p>
                      </div>
                    </li>
                    <li className="flex items-start gap-3">
                      <div className="w-8 h-8 border-[3px] border-black bg-[#FF3366] text-white flex items-center justify-center font-bold flex-shrink-0">
                        3
                      </div>
                      <div>
                        <p className="font-bold">Start earning</p>
                        <p className="text-sm">Receive ADC tokens as advertisers use your displays</p>
                      </div>
                    </li>
                  </ul>
                )}
              </div>

              <div className="flex justify-end">
                <Button
                  className={`${
                    selectedRole === "advertiser" ? "bg-[#0055FF]" : "bg-[#FF3366]"
                  } text-white border-[6px] border-black hover:bg-[#FFCC00] hover:text-black transition-all font-bold text-xl px-8 py-6 h-auto rounded-none shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] hover:shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] hover:-translate-y-2 relative overflow-hidden group`}
                  onClick={handleNextStep}
                >
                  <span className="relative z-10 flex items-center gap-2">
                    Let's Go!
                    <ArrowRight className="w-6 h-6" />
                  </span>
                  <span className="absolute inset-0 bg-[#FFCC00] transform scale-x-0 group-hover:scale-x-100 transition-transform duration-300 origin-left"></span>
                </Button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

