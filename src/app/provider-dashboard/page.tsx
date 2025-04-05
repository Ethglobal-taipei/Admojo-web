"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Building2, FileText, PlusCircle, Loader2 } from "lucide-react"
import { toast } from "@/lib/toast"
// Import components from older version
import ProviderHeader from "@/components/provider-header"
import DisplayOverview from "@/components/display-overview"
import DisplayRegistration from "@/components/display-registration"
import DisplayPerformance from "@/components/display-performance"
import VerificationManagement from "@/components/verification-management"
import EarningsPayments from "@/components/earnings-payments"
// Import provider hook
import { useProviderPages } from "@/hooks/use-provider-hooks"

// Define the Provider type based on our database schema
interface Provider {
  id: string;
  businessName: string;
  businessType: string;
  businessEmail: string;
  businessAddress: string;
  paymentMethod: string;
  walletAddress: string | null;
  bankName: string | null;
  accountNumber: string | null;
  taxId: string | null;
  selfVerified: boolean;
  selfVerificationName: string | null;
}

const providerNotRegisteredView = (router: ReturnType<typeof useRouter>) => {
  return (
    <div className="container py-16">
      <div className="max-w-3xl mx-auto border-[4px] border-black p-8 bg-white shadow-[8px_8px_0_0_rgba(0,0,0,1)]">
        <h1 className="text-3xl font-bold mb-6 text-center">Provider Dashboard</h1>
        <div className="text-center py-8">
          <Building2 className="mx-auto h-16 w-16 text-gray-400 mb-4" />
          <h2 className="text-xl font-bold mb-2">No Provider Account Found</h2>
          <p className="text-gray-600 mb-6">
            You need to register as a provider to access this dashboard.
          </p>
          <Button 
            onClick={() => router.push('/provider-registration')}
            className="bg-[#0055FF] text-white border-[3px] border-black hover:bg-[#003cc7] transition-all font-bold py-6 h-auto rounded-none"
          >
            Register as Provider
          </Button>
        </div>
      </div>
    </div>
  );
};

export default function ProviderDashboardPage() {
  const router = useRouter()
  const [provider, setProvider] = useState<Provider | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  
  // Use the centralized provider hook
  const {
    serviceLoading,
    serviceError,
    isCorrectChain,
    switchChain,
    service,
    isConnected,
    isProviderRegistered
  } = useProviderPages();

  const [initializing, setInitializing] = useState(true);

  // Fetch provider data on component mount
  useEffect(() => {
    async function fetchProviderData() {
      try {
        setIsLoading(true)
        const response = await fetch('/api/provider/data')
        
        const data = await response.json()
        
        if (!response.ok) {
          // Check if we need registration
          if (data.needsRegistration) {
            setError(null)
            setProvider(null)
          } else {
            throw new Error(data.error || 'Failed to fetch provider data')
          }
        } else {
          setProvider(data.provider)
        }
      } catch (err) {
        console.error('Error fetching provider data:', err)
        setError(err instanceof Error ? err.message : 'An unknown error occurred')
        toast(
          "Error",
          { description: err instanceof Error ? err.message : "Failed to load provider data" },
          "error"
        )
      } finally {
        setIsLoading(false)
      }
    }
    
    fetchProviderData()
  }, [])

  // Add effect to handle initialization state
  useEffect(() => {
    // Set initializing to false once service is loaded or if there's an error
    if ((!serviceLoading && !isLoading) || serviceError || error) {
      setTimeout(() => setInitializing(false), 500); // Short delay for smoother UX
    }
  }, [serviceLoading, serviceError, isLoading, error]);

  // Show loading state while initializing
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

  // Render error state (only for actual errors, not the registration needed case)
  if (error) {
    return (
      <div className="container py-16">
        <div className="max-w-3xl mx-auto border-[4px] border-red-500 p-6 bg-red-50">
          <h1 className="text-2xl font-bold mb-4">Error Loading Dashboard</h1>
          <p className="mb-4">{error}</p>
          <Button onClick={() => router.refresh()}>Try Again</Button>
        </div>
      </div>
    )
  }

  // Render empty state (no provider registered)
  if (!provider || !isProviderRegistered) {
    return providerNotRegisteredView(router)
  }

  // Render provider dashboard with animated background
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
        {/* Use ProviderHeader from old file */}
        <ProviderHeader />
        
        {isConnected && service ? (
          <>
            {/* Provider information card - themed */}
            <div className="mb-8 border-[4px] border-black bg-white shadow-[8px_8px_0_0_rgba(0,0,0,1)] hover:shadow-[10px_10px_0_0_rgba(0,0,0,1)] transition-all duration-300">
              {/* Header with background color */}
              <div className="bg-[#0055FF] border-b-[4px] border-black p-4">
                <div className="flex items-center">
                  <div className="bg-white w-12 h-12 flex items-center justify-center mr-4 border-[3px] border-black shadow-[2px_2px_0_0_rgba(0,0,0,1)]">
                    <Building2 className="h-6 w-6" />
                  </div>
                  <div>
                    <h2 className="text-2xl font-black text-white">{provider.businessName}</h2>
                    <p className="text-[#CCDDFF] font-bold">Provider Account Details</p>
                  </div>
                </div>
              </div>
              
              <div className="p-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* Business Information */}
                  <div className="border-[3px] border-black p-4 bg-[#f5f5f5] shadow-[4px_4px_0_0_rgba(0,0,0,0.3)]">
                    <h3 className="font-black text-sm uppercase mb-3 border-b-[2px] border-black pb-2">Business Information</h3>
                    <div className="space-y-3">
                      <div className="flex">
                        <span className="font-bold w-24">Type:</span> 
                        <span className="font-medium">{provider.businessType}</span>
                      </div>
                      <div className="flex">
                        <span className="font-bold w-24">Email:</span> 
                        <span className="font-medium">{provider.businessEmail}</span>
                      </div>
                      <div className="flex">
                        <span className="font-bold w-24">Address:</span> 
                        <span className="font-medium">{provider.businessAddress}</span>
                      </div>
                    </div>
                  </div>
                  
                  {/* Payment Details */}
                  <div className="border-[3px] border-black p-4 bg-[#f5f5f5] shadow-[4px_4px_0_0_rgba(0,0,0,0.3)]">
                    <h3 className="font-black text-sm uppercase mb-3 border-b-[2px] border-black pb-2">Payment Details</h3>
                    <div className="space-y-3">
                      <div className="flex">
                        <span className="font-bold w-24">Method:</span> 
                        <span className="font-medium">{provider.paymentMethod}</span>
                      </div>
                      {provider.paymentMethod === 'crypto' && provider.walletAddress && (
                        <div className="flex flex-col">
                          <span className="font-bold mb-1">Wallet:</span> 
                          <span className="font-mono text-sm bg-white border-[2px] border-black p-2 break-all shadow-[2px_2px_0_0_rgba(0,0,0,1)]">
                            {provider.walletAddress}
                          </span>
                        </div>
                      )}
                      {provider.paymentMethod === 'bank' && (
                        <>
                          <div className="flex">
                            <span className="font-bold w-24">Bank:</span> 
                            <span className="font-medium">{provider.bankName}</span>
                          </div>
                          <div className="flex">
                            <span className="font-bold w-24">Account:</span> 
                            <span className="font-medium">{provider.accountNumber}</span>
                          </div>
                        </>
                      )}
                      {provider.taxId && (
                        <div className="flex">
                          <span className="font-bold w-24">Tax ID:</span> 
                          <span className="font-medium">{provider.taxId}</span>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
                
                {/* Verification info - themed */}
                <div className="mt-6 pt-6 border-t-[2px] border-dashed border-black">
                  <h3 className="font-black text-sm uppercase mb-3">Verification Status</h3>
                  <div className="border-[3px] border-black bg-[#EAFFF2] p-4 shadow-[4px_4px_0px_0px_rgba(0,0,0,0.8)]">
                    <p className="flex items-center font-bold">
                      <div className="bg-[#00CC66] w-8 h-8 flex items-center justify-center mr-3 border-[2px] border-black shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]">
                        <FileText className="h-5 w-5 text-white" />
                      </div>
                      <span>
                        Verified via <span className="text-[#00CC66]">{provider.selfVerified ? 'Self Protocol' : 'Document Upload'}</span>
                        {provider.selfVerificationName && <span className="font-black"> as {provider.selfVerificationName}</span>}
                      </span>
                    </p>
                  </div>
                </div>
              </div>
            </div>
            
            {/* Components from the older file */}
            {/* <DisplayOverview /> */}
            <DisplayRegistration />
            <DisplayPerformance />
            <VerificationManagement />
            <EarningsPayments />
            
            {/* Ad Locations */}
            <div className="mb-8">
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-2xl font-bold">Your Ad Locations</h2>
                <Button 
                  className="bg-black text-white hover:bg-gray-800"
                  onClick={() => router.push('/provider-dashboard/locations/new')}
                >
                  <PlusCircle className="mr-2 h-4 w-4" /> Add New Location
                </Button>
              </div>
              
              <div className="border-[3px] border-black p-6 text-center py-12">
                <p className="text-gray-500">No ad locations added yet. Add your first location to start earning.</p>
              </div>
            </div>
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

