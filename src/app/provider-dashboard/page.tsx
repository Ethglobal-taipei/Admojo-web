"use client"

import { useRouter } from "next/navigation"
import { Bell, Menu, Loader2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { useEffect, useRef, useState } from "react"
import ProviderHeader from "@/components/provider-header"
import DisplayOverview from "@/components/display-overview"
import DisplayRegistration from "@/components/display-registration"
import DisplayPerformance from "@/components/display-performance"
import VerificationManagement from "@/components/verification-management"
import EarningsPayments from "@/components/earnings-payments"
// Import provider hook
import { useProviderPages } from "@/hooks/use-provider-hooks"

export default function ProviderDashboard() {
  // Use the centralized provider hook
  const {
    serviceLoading,
    serviceError,
    isCorrectChain,
    switchChain,
    service,
    isConnected
  } = useProviderPages();

  const [initializing, setInitializing] = useState(true);

  // Add effect to handle initialization state
  useEffect(() => {
    // Set initializing to false once service is loaded or if there's an error
    if (!serviceLoading || serviceError) {
      setTimeout(() => setInitializing(false), 500); // Short delay for smoother UX
    }
  }, [serviceLoading, serviceError]);

  // Show loading state while initializing blockchain services
  if (initializing) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="flex flex-col items-center space-y-4">
          <Loader2 className="w-12 h-12 animate-spin text-[#0055FF]" />
          <p className="text-xl font-bold">Loading provider dashboard...</p>
          <p className="text-sm text-gray-500">Connecting to blockchain services</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white relative">
      {/* Checkered Background Pattern */}
      <div className="fixed inset-0 -z-20 bg-white">
        <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNDAiIGhlaWdodD0iNDAiIHZpZXdCb3g9IjAgMCA0MCA0MCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48cGF0aCBkPSJNMCAwaDIwdjIwSDB6TTIwIDIwaDIwdjIwSDIweiIgZmlsbD0icmdiYSgwLDAsMCwwLjAzKSIgZmlsbC1ydWxlPSJldmVub2RkIi8+PC9zdmc+')]
         opacity-70"></div>
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
        <div
          className="absolute top-[60%] left-[20%] w-24 h-24 bg-black opacity-5 rotate-45 animate-pulse"
          style={{ animationDuration: "4s" }}
        ></div>
        <div
          className="absolute bottom-[40%] right-[30%] w-36 h-36 bg-[#FFCC00] border-[6px] border-black opacity-10 rotate-12"
          style={{ animation: "float 6s ease-in-out infinite" }}
        ></div>
      </div>

      
      <main className="container mx-auto px-4 py-8 relative z-10">
        <ProviderHeader />
        {isConnected && service ? (
          <>
            <DisplayOverview />
            <DisplayRegistration />
            <DisplayPerformance />
            <VerificationManagement />
            <EarningsPayments />
          </>
        ) : (
          <div className="border-[6px] border-black bg-white p-6 shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] my-8">
            <h2 className="text-xl font-black mb-4">Connect Wallet</h2>
            <p className="mb-4">You need to connect your wallet to view your provider dashboard.</p>
            <Button 
              className="bg-[#0055FF] hover:bg-[#003EBB] text-white font-bold"
              onClick={() => window.location.reload()}
            >
              Retry Connection
            </Button>
          </div>
        )}
        
        {/* Display blockchain connection status notification if there are errors */}
        {serviceError && (
          <div className="fixed bottom-4 right-4 bg-red-500 text-white p-4 rounded-lg shadow-lg border-2 border-black">
            <p className="font-bold">Blockchain Connection Error</p>
            <p>{serviceError.message || "Unable to connect to blockchain service"}</p>
            {!isCorrectChain && (
              <Button 
                className="mt-2 bg-white text-red-500 hover:bg-gray-100"
                onClick={switchChain}
              >
                Switch to Holesky
              </Button>
            )}
          </div>
        )}
      </main>
    </div>
  )
}

