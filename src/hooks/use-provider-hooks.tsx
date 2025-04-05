'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { useRoleStore, useUserStore } from '@/lib/store';
import { useBlockchainService } from './use-blockchain-service';
import { useBoothRegistry } from './use-booth-registry';
import { usePerformanceOracle } from './use-performance-oracle';
import { useLocationData } from './use-location-data';
import { toast } from '@/lib/toast';

/**
 * Custom hook for provider pages that centralizes blockchain integration,
 * authorization checks, and state management
 */
export function useProviderPages() {
  const router = useRouter();
  const { isConnected } = useUserStore();
  const { currentRole, isProviderRegistered } = useRoleStore();
  const [hasShownToast, setHasShownToast] = useState(false);

  // Initialize blockchain service
  const {
    service,
    isLoading: serviceLoading,
    error: serviceError,
    isCorrectChain,
    switchChain
  } = useBlockchainService();

  // Initialize booth registry hook
  const boothRegistry = useBoothRegistry();

  // Initialize performance oracle hook
  const performanceOracle = usePerformanceOracle();

  // Initialize location data hook
  const locationData = useLocationData();

  // Redirect if not connected or not a registered provider
  useEffect(() => {
    if (!isConnected && !hasShownToast) {
      setHasShownToast(true);
      toast(
        "Connect wallet first",
        { description: "You need to connect your wallet to view the provider dashboard." },
        "warning",
      );
      router.push("/dashboard");
      return;
    } else if (isConnected) {
      setHasShownToast(false);
    }

    if (currentRole !== "provider") {
      toast(
        "Switch to provider mode",
        { description: "You need to be in provider mode to view the provider dashboard." },
        "warning",
      );
      router.push("/dashboard");
      return;
    }

    if (!isProviderRegistered) {
      toast(
        "Register as provider",
        { description: "You need to register as a provider to view the provider dashboard." },
        "warning",
      );
      router.push("/provider-registration");
      return;
    }
    
    // Check chain connection
    if (!isCorrectChain && isConnected) {
      toast(
        "Wrong network",
        { description: "Please switch to the Holesky testnet to use blockchain features." },
        "warning"
      );
    }
  }, [isConnected, currentRole, isProviderRegistered, router, isCorrectChain, hasShownToast]);
  
  // Handle blockchain service errors
  useEffect(() => {
    if (serviceError) {
      toast(
        "Blockchain service error",
        { description: serviceError.message || "Unable to connect to blockchain services" },
        "error"
      );
    }
  }, [serviceError]);

  // Handle switch chain
  const handleSwitchChain = useCallback(async () => {
    try {
      const success = await switchChain();
      if (success) {
        toast(
          "Network switched",
          { description: "Successfully connected to the Holesky testnet." },
          "success"
        );
        return true;
      } else {
        toast(
          "Switch failed",
          { description: "Failed to switch to the Holesky testnet. Please try again." },
          "error"
        );
        return false;
      }
    } catch (error) {
      toast(
        "Switch error",
        { description: "An error occurred while switching networks." },
        "error"
      );
      return false;
    }
  }, [switchChain]);

  return {
    // Blockchain service
    service,
    serviceLoading,
    serviceError,
    isCorrectChain,
    switchChain: handleSwitchChain,
    
    // Authentication status
    isConnected,
    currentRole,
    isProviderRegistered,
    
    // Hooks with all their properties and methods
    boothRegistry,
    performanceOracle,
    locationData
  };
} 