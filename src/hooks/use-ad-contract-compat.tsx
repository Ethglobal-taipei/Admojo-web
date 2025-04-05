'use client';

/**
 * Compatibility layer for transitioning from useAdContract to our new blockchain hooks
 * This provides a drop-in replacement that maps the old hook interface to our new hooks
 */

import { 
  useBlockchainService, 
  useBoothRegistry, 
  usePerformanceOracle 
} from '@/hooks';
import { Hash } from 'viem';

/**
 * Compatibility hook that provides the same interface as the old useAdContract
 */
export function useAdContract() {
  const { 
    service, 
    isLoading: serviceLoading, 
    error: serviceError, 
    chainId, 
    isCorrectChain, 
    switchChain,
    transactions
  } = useBlockchainService();
  
  const {
    registerBooth,
    createCampaign,
    addLocationToCampaign,
    removeLocationFromCampaign,
    activateBooth,
    deactivateBooth,
    updateBoothStatus,
    getBoothDetails,
    getCampaignDetails,
    getActiveBooths,
    getActiveLocations,
    getAllCampaigns,
    getAllBooths,
    getMyAdvertiserCampaigns,
    getMyProviderLocations,
    isRegistering,
    isCreatingCampaign,
    isAddingLocation,
    isRemovingLocation,
    isActivating,
    isDeactivating,
    isUpdatingStatus
  } = useBoothRegistry();
  
  const {
    updateMetrics,
    getMetrics,
    getAggregatedMetrics,
    isUpdatingMetrics
  } = usePerformanceOracle();
  
  // Construct operations object to match old interface
  const operations = {
    createCampaign: {
      execute: createCampaign,
      isLoading: isCreatingCampaign
    },
    addLocationToCampaign: {
      execute: addLocationToCampaign,
      isLoading: isAddingLocation
    },
    removeLocationFromCampaign: {
      execute: removeLocationFromCampaign,
      isLoading: isRemovingLocation
    },
    getCampaignDetails: {
      execute: getCampaignDetails,
      isLoading: false
    },
    registerBooth: {
      execute: registerBooth,
      isLoading: isRegistering
    },
    getBoothDetails: {
      execute: getBoothDetails,
      isLoading: false
    },
    activateBooth: {
      execute: activateBooth,
      isLoading: isActivating
    },
    deactivateBooth: {
      execute: deactivateBooth,
      isLoading: isDeactivating
    },
    updateBoothStatus: {
      execute: updateBoothStatus,
      isLoading: isUpdatingStatus
    },
    getMetrics: {
      execute: getMetrics,
      isLoading: false
    },
    getAggregatedMetrics: {
      execute: getAggregatedMetrics,
      isLoading: false
    },
    updateMetrics: {
      execute: updateMetrics,
      isLoading: isUpdatingMetrics
    }
  };
  
  // Map transactions to the old format
  const pendingTransactions = new Map();
  transactions.forEach((tx, hash) => {
    pendingTransactions.set(hash, {
      description: tx.description,
      status: tx.state
    });
  });
  
  return {
    // Core state
    adContract: service, // Pass the service as adContract for backward compatibility
    isLoading: serviceLoading,
    error: serviceError,
    chainId,
    isCorrectChain,
    switchChain,
    
    // Contract operations
    operations,
    
    // Transaction tracking
    pendingTransactions
  };
}

/**
 * Drop-in replacement for AdContractProvider component
 */
export function AdContractProvider({ children }: { children: React.ReactNode }) {
  // We don't need to do anything here since BlockchainProvider
  // is already used in the app layout
  return <>{children}</>;
} 