"use client"

import { useState } from "react"
import { X, ChevronRight, ChevronLeft } from "lucide-react"
import { Button } from "@/components/ui/button"

export default function GuidedTour({ steps, onComplete, onSkip }) {
  const [currentStep, setCurrentStep] = useState(0)
  const [isVisible, setIsVisible] = useState(true)

  const handleNext = () => {
    if (currentStep < steps.length - 1) {
      setCurrentStep(currentStep + 1)
    } else {
      handleComplete()
    }
  }

  const handlePrev = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1)
    }
  }

  const handleComplete = () => {
    setIsVisible(false)
    if (onComplete) onComplete()
  }

  const handleSkip = () => {
    setIsVisible(false)
    if (onSkip) onSkip()
  }

  if (!isVisible || !steps || steps.length === 0) return null

  const currentTourStep = steps[currentStep]

  return (
    <div className="fixed inset-0 z-[100] pointer-events-none">
      {/* Spotlight overlay */}
      <div className="absolute inset-0 bg-black bg-opacity-50 pointer-events-auto"></div>

      {/* Tour tooltip */}
      <div
        className="absolute pointer-events-auto border-[6px] border-black bg-white p-6 shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] w-80 transform rotate-1 animate-in fade-in duration-300"
        style={{
          top: currentTourStep.position.top,
          left: currentTourStep.position.left,
        }}
      >
        <Button
          variant="outline"
          size="icon"
          className="absolute top-2 right-2 h-8 w-8 border-[3px] border-black rounded-none hover:bg-[#f5f5f5]"
          onClick={handleSkip}
        >
          <X className="h-4 w-4" />
        </Button>

        <div className="mb-4">
          <h3 className="text-xl font-black mb-2">{currentTourStep.title}</h3>
          <p className="font-medium">{currentTourStep.description}</p>
        </div>

        <div className="flex items-center justify-between">
          <div className="flex gap-1">
            {steps.map((_, index) => (
              <div
                key={index}
                className={`w-3 h-3 border-[2px] border-black ${index === currentStep ? "bg-[#0055FF]" : "bg-white"}`}
              ></div>
            ))}
          </div>

          <div className="flex gap-2">
            {currentStep > 0 && (
              <Button
                variant="outline"
                size="sm"
                className="border-[3px] border-black rounded-none hover:bg-[#f5f5f5]"
                onClick={handlePrev}
              >
                <ChevronLeft className="w-4 h-4" />
              </Button>
            )}

            <Button
              className="bg-[#0055FF] text-white border-[3px] border-black hover:bg-[#FFCC00] hover:text-black transition-all font-bold px-3 py-1 h-auto rounded-none flex items-center gap-1"
              onClick={handleNext}
            >
              {currentStep < steps.length - 1 ? (
                <>
                  Next
                  <ChevronRight className="w-4 h-4" />
                </>
              ) : (
                "Finish"
              )}
            </Button>
          </div>
        </div>
      </div>
    </div>
  )
}

