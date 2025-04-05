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
            {/* Provider information card styled like the old file */}
            <Card className="mb-8 border-[3px] border-black rounded-none shadow-[4px_4px_0_0_rgba(0,0,0,1)]">
              <CardHeader className="border-b-2 border-gray-100">
                <CardTitle className="text-2xl flex items-center">
                  <Building2 className="mr-2 h-6 w-6" />
                  {provider.businessName}
                </CardTitle>
                <CardDescription>Provider Account Details</CardDescription>
              </CardHeader>
              <CardContent className="pt-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <h3 className="font-semibold text-sm text-gray-500 mb-1">Business Information</h3>
                    <div className="space-y-2">
                      <p><span className="font-medium">Type:</span> {provider.businessType}</p>
                      <p><span className="font-medium">Email:</span> {provider.businessEmail}</p>
                      <p><span className="font-medium">Address:</span> {provider.businessAddress}</p>
                    </div>
                  </div>
                  <div>
                    <h3 className="font-semibold text-sm text-gray-500 mb-1">Payment Details</h3>
                    <div className="space-y-2">
                      <p><span className="font-medium">Method:</span> {provider.paymentMethod}</p>
                      {provider.paymentMethod === 'crypto' && provider.walletAddress && (
                        <p>
                          <span className="font-medium">Wallet:</span> 
                          <span className="font-mono text-sm">{provider.walletAddress}</span>
                        </p>
                      )}
                      {provider.paymentMethod === 'bank' && (
                        <>
                          <p><span className="font-medium">Bank:</span> {provider.bankName}</p>
                          <p><span className="font-medium">Account:</span> {provider.accountNumber}</p>
                        </>
                      )}
                      {provider.taxId && <p><span className="font-medium">Tax ID:</span> {provider.taxId}</p>}
                    </div>
                  </div>
                </div>
                
                {/* Verification info */}
                <div className="mt-6 pt-6 border-t border-gray-100">
                  <h3 className="font-semibold text-sm text-gray-500 mb-2">Verification Status</h3>
                  <div className="bg-green-50 border border-green-200 rounded-md p-3">
                    <p className="flex items-center text-green-600">
                      <FileText className="mr-2 h-5 w-5" />
                      Verified via {provider.selfVerified ? 'Self Protocol' : 'Document Upload'}
                      {provider.selfVerificationName && ` as ${provider.selfVerificationName}`}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
            
            {/* Components from the older file */}
            <DisplayOverview />
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

