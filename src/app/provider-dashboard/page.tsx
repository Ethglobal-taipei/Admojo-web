"use client"

import { useRouter } from "next/navigation"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Building2, FileText, PlusCircle, Loader2 } from "lucide-react"
import { useProvider } from "@/hooks/use-provider"

const ProviderNotRegisteredView = ({ router }: { router: ReturnType<typeof useRouter> }) => {
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
  const router = useRouter();
  const { provider, isLoading, error, needsRegistration } = useProvider();

  // Render loading state
  if (isLoading) {
    return (
      <div className="container py-16 flex flex-col items-center justify-center min-h-[60vh]">
        <Loader2 className="h-12 w-12 animate-spin text-blue-500 mb-4" />
        <p className="text-gray-500">Loading provider dashboard...</p>
      </div>
    );
  }

  // Render error state (only for actual errors, not the registration needed case)
  if (error && !needsRegistration) {
    return (
      <div className="container py-16">
        <div className="max-w-3xl mx-auto border-[4px] border-red-500 p-6 bg-red-50">
          <h1 className="text-2xl font-bold mb-4">Error Loading Dashboard</h1>
          <p className="mb-4">{error}</p>
          <Button onClick={() => router.refresh()}>Try Again</Button>
        </div>
      </div>
    );
  }

  // Render empty state (no provider registered)
  if (!provider || needsRegistration) {
    return <ProviderNotRegisteredView router={router} />;
  }

  // Render provider dashboard
  return (
    <div className="container py-16">
      <div className="max-w-6xl mx-auto">
        <h1 className="text-4xl font-black mb-8">Provider Dashboard</h1>
        
        {/* Provider information card */}
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
      </div>
    </div>
  );
}

