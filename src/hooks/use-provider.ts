import { useState, useEffect } from 'react';
import { toast } from '@/lib/toast';

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

interface UseProviderResult {
  provider: Provider | null;
  isLoading: boolean;
  error: string | null;
  refreshProvider: () => Promise<void>;
  needsRegistration: boolean;
}

export function useProvider(): UseProviderResult {
  const [provider, setProvider] = useState<Provider | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [needsRegistration, setNeedsRegistration] = useState(false);

  const fetchProviderData = async () => {
    try {
      setIsLoading(true);
      setError(null);
      
      const response = await fetch('/api/provider/data');
      const data = await response.json();
      
      if (!response.ok) {
        // Check if we need registration
        if (data.needsRegistration) {
          setNeedsRegistration(true);
          setProvider(null);
        } else {
          throw new Error(data.error || 'Failed to fetch provider data');
        }
      } else {
        setProvider(data.provider);
        setNeedsRegistration(false);
      }
    } catch (err) {
      console.error('Error fetching provider data:', err);
      setError(err instanceof Error ? err.message : 'An unknown error occurred');
      toast(
        "Error",
        { description: err instanceof Error ? err.message : "Failed to load provider data" },
        "error"
      );
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchProviderData();
  }, []);

  return {
    provider,
    isLoading,
    error,
    refreshProvider: fetchProviderData,
    needsRegistration
  };
} 