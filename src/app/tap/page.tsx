'use client';

import { useEffect, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import { Loader2 } from 'lucide-react';
import { v4 as uuidv4 } from 'uuid';
import dynamic from 'next/dynamic';

// Dynamically import just the QR code component to prevent SSR issues
const SelfQRcodeWrapper = dynamic(
  () => import("@selfxyz/qrcode").then((mod) => mod.default),
  { ssr: false }
);

// Import types but don't actually import the module directly
type SelfAppOptionsType = import('@selfxyz/qrcode').SelfAppOptions;

// Create a type for the Self app instance based on the properties we know it has
interface SimpleSelfAppInstance {
  QRCodeURL: string;
  [key: string]: unknown;
}

export default function TapPage() {
  const [countdown, setCountdown] = useState(5);
  const [url, setUrl] = useState<string | null>(null);
  const [status, setStatus] = useState<'loading' | 'verifying' | 'success' | 'error'>('loading');
  const [userId] = useState(() => uuidv4()); // Generate a unique user ID for Self verification
  const [showSelfQR, setShowSelfQR] = useState(false);
  const [selfAppInstance, setSelfAppInstance] = useState<SimpleSelfAppInstance | null>(null);
  const [loadingQR, setLoadingQR] = useState(false);
  const searchParams = useSearchParams();
  
  // Function to handle Self verification success
  const handleSelfVerificationSuccess = (data: Record<string, unknown>) => {
    console.log("Self verification successful:", data);
    setShowSelfQR(false);
    setSelfAppInstance(null);
    
    // Now proceed with tap registration
    registerTap();
  };
  
  // Function to register the tap and start the countdown
  const registerTap = async () => {
    try {
      setStatus('loading');
      // Get the device ID from the query parameters if available
      const deviceId = searchParams.get('deviceId');
      
      // Call the registerTap API
      const response = await fetch('/api/registerTap' + (deviceId ? `?deviceId=${deviceId}` : ''), {
        method: 'GET',
      });
      
      if (!response.ok) {
        throw new Error('Failed to register tap');
      }
      
      const data = await response.json();
      
      if (data.success) {
        setStatus('success');
        // Save the URL to redirect to
        const redirectUrl = data.url;
        setUrl(redirectUrl);
        
        // Start a countdown before redirecting
        let count = 5;
        setCountdown(count);
        
        const countdownInterval = setInterval(() => {
          count -= 1;
          setCountdown(count);
          
          if (count <= 0) {
            clearInterval(countdownInterval);
            // Redirect to the ad URL
            window.location.href = redirectUrl;
          }
        }, 1000);
        
        return () => clearInterval(countdownInterval);
      } else {
        throw new Error(data.error || 'Unknown error');
      }
    } catch (error) {
      console.error('Error registering tap:', error);
      setStatus('error');
    }
  };
  
  useEffect(() => {
    // Initialize the verification process
    setStatus('verifying');
    setShowSelfQR(true);
  }, []);
  
  useEffect(() => {
    // Create the Self app instance when userId exists and QR should be shown
    async function createSelfAppInstance() {
      if (!userId || !showSelfQR) return;

      try {
        setLoadingQR(true);
        // Dynamically import the SelfAppBuilder
        const { SelfAppBuilder } = await import('@selfxyz/qrcode');

        // Create the app configuration
        const config: SelfAppOptionsType = {
          appName: "AdNet Protocol",
          scope: "adnet-protocol",
          endpoint: `https://3b28-111-235-226-124.ngrok-free.app/api/verify`,
          endpointType: "staging_https",
          logoBase64: "https://i.imgur.com/Rz8B3s7.png",
          userId,
          devMode: true,
          disclosures: {
            name: true,
            nationality: true,
            date_of_birth: true,
            minimumAge: 18,
          },
        };

        // Create the app instance
        const builder = new SelfAppBuilder(config);
        const app = builder.build();
        setSelfAppInstance(app);
        setLoadingQR(false);
      } catch (error) {
        console.error("Error creating Self app instance:", error);
        setLoadingQR(false);
        // Fall back to tap registration without verification if Self fails
        registerTap();
      }
    }

    createSelfAppInstance();
  }, [userId, showSelfQR]);
  
  // Skip verification button handler
  const handleSkipVerification = () => {
    setShowSelfQR(false);
    setSelfAppInstance(null);
    registerTap();
  };
  
  // Only render the Self QR code if userId exists and showSelfQR is true
  const renderSelfQRCode = () => {
    if (!userId || !showSelfQR) return null;
    if (typeof window === 'undefined') return null;
    
    return (
      <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
        <div className="bg-white p-6 rounded-lg max-w-md w-full">
          <h3 className="text-xl font-bold mb-4">Verify Your Identity</h3>
          <p className="text-sm text-gray-600 mb-6">
            Scan this QR code with the Self app to verify your identity before accessing the content
          </p>
          
          <div className="flex justify-center">
            {loadingQR ? (
              <div className="py-8 flex flex-col items-center">
                <Loader2 className="w-8 h-8 animate-spin text-blue-500 mb-2" />
                <p className="text-sm text-gray-500">Loading QR code...</p>
              </div>
            ) : selfAppInstance ? (
              <SelfQRcodeWrapper
                selfApp={selfAppInstance}
                onSuccess={handleSelfVerificationSuccess}
                size={250}
              />
            ) : (
              <div className="bg-red-50 border-2 border-red-200 p-4 rounded-md">
                <p className="text-red-600">Error creating Self QR code. Please try again later.</p>
              </div>
            )}
          </div>
          
          <div className="mt-6 flex justify-between gap-2">
            <button
              onClick={handleSkipVerification}
              className="text-gray-500 hover:text-gray-700 text-sm"
            >
              Skip Verification
            </button>
            <button
              onClick={() => {
                setShowSelfQR(false);
                setSelfAppInstance(null);
                setStatus('error');
              }}
              className="bg-white text-black border-2 border-black hover:bg-[#f5f5f5] transition-all font-bold py-2 px-4 rounded"
            >
              Cancel
            </button>
          </div>
        </div>
      </div>
    );
  };
  
  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-gray-100 p-4">
      <div className="bg-white p-8 rounded-lg shadow-md max-w-md w-full text-center">
        <h1 className="text-2xl font-bold mb-4">Tap Registration</h1>
        
        {status === 'loading' && (
          <div className="my-6">
            <div className="w-12 h-12 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto"></div>
            <p className="mt-4 text-gray-600">Processing your tap...</p>
          </div>
        )}
        
        {status === 'verifying' && renderSelfQRCode()}
        
        {status === 'success' && (
          <div className="my-6">
            <div className="w-16 h-16 bg-blue-500 rounded-full flex items-center justify-center mx-auto">
              <span className="text-white text-2xl font-bold">{countdown}</span>
            </div>
            <p className="mt-4 text-gray-600">
              Redirecting you in {countdown} seconds...
            </p>
            {url && (
              <p className="mt-2 text-sm text-gray-500">
                Destination: <a href={url} className="text-blue-500 underline">{url}</a>
              </p>
            )}
          </div>
        )}
        
        {status === 'error' && (
          <div className="my-6 text-red-500">
            <p>Something went wrong while processing your tap.</p>
            <button
              onClick={() => window.location.reload()}
              className="mt-4 px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
            >
              Try Again
            </button>
          </div>
        )}
      </div>
    </div>
  );
} 