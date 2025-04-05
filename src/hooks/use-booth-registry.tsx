'use client';

import { useCallback, useState } from 'react';
import { useBlockchainService } from './use-blockchain-service';
import { 
  Booth, 
  BoothMetadata, 
  BoothStatus, 
  Campaign, 
  CampaignMetadata, 
  TransactionState
} from '@/lib/blockchain';
import { toast } from '@/lib/toast';
import { useAsync } from './use-async';

/**
 * Hook for interacting with the booth registry contract
 */
export function useBoothRegistry() {
  const { service, isCorrectChain, switchChain, transactions } = useBlockchainService();
  
  // Get the booth registry service
  const registry = service?.boothRegistry;
  
  // Ensure the user is on the correct chain
  const ensureCorrectChain = useCallback(async () => {
    if (!isCorrectChain) {
      const success = await switchChain();
      if (!success) {
        toast(
          "Wrong Network",
          { description: "Please switch to the correct network to continue" },
          "error"
        );
        return false;
      }
    }
    return true;
  }, [isCorrectChain, switchChain]);
  
  // Register a new booth
  const { 
    execute: registerBooth, 
    isLoading: isRegistering, 
    error: registerError 
  } = useAsync(
    async (deviceId: number, metadata: BoothMetadata) => {
      if (!registry || !service) {
        throw new Error('Booth registry service not initialized');
      }
      
      if (!(await ensureCorrectChain())) {
        return null;
      }
      
      const tx = await registry.registerBooth(deviceId, metadata);
      
      return tx.hash;
    }
  );
  
  // Create a new campaign
  const { 
    execute: createCampaign, 
    isLoading: isCreatingCampaign, 
    error: createCampaignError 
  } = useAsync(
    async (metadata: CampaignMetadata, deviceIds: number[]) => {
      if (!registry || !service) {
        throw new Error('Booth registry service not initialized');
      }
      
      if (!(await ensureCorrectChain())) {
        return null;
      }
      
      const tx = await registry.createCampaign(metadata, deviceIds);
      
      return tx.hash;
    }
  );
  
  // Add a location to a campaign
  const { 
    execute: addLocationToCampaign, 
    isLoading: isAddingLocation, 
    error: addLocationError 
  } = useAsync(
    async (campaignId: number, deviceId: number) => {
      if (!registry || !service) {
        throw new Error('Booth registry service not initialized');
      }
      
      if (!(await ensureCorrectChain())) {
        return null;
      }
      
      const tx = await registry.addLocationToCampaign(campaignId, deviceId);
      
      return tx.hash;
    }
  );
  
  // Remove a location from a campaign
  const { 
    execute: removeLocationFromCampaign, 
    isLoading: isRemovingLocation, 
    error: removeLocationError 
  } = useAsync(
    async (campaignId: number, deviceId: number) => {
      if (!registry || !service) {
        throw new Error('Booth registry service not initialized');
      }
      
      if (!(await ensureCorrectChain())) {
        return null;
      }
      
      const tx = await registry.removeLocationFromCampaign(campaignId, deviceId);
      
      return tx.hash;
    }
  );
  
  // Activate a booth
  const { 
    execute: activateBooth, 
    isLoading: isActivating, 
    error: activateError 
  } = useAsync(
    async (deviceId: number) => {
      if (!registry || !service) {
        throw new Error('Booth registry service not initialized');
      }
      
      if (!(await ensureCorrectChain())) {
        return null;
      }
      
      const tx = await registry.activateBooth(deviceId);
      
      return tx.hash;
    }
  );
  
  // Deactivate a booth
  const { 
    execute: deactivateBooth, 
    isLoading: isDeactivating, 
    error: deactivateError 
  } = useAsync(
    async (deviceId: number) => {
      if (!registry || !service) {
        throw new Error('Booth registry service not initialized');
      }
      
      if (!(await ensureCorrectChain())) {
        return null;
      }
      
      const tx = await registry.deactivateBooth(deviceId);
      
      return tx.hash;
    }
  );
  
  // Update booth status
  const { 
    execute: updateBoothStatus, 
    isLoading: isUpdatingStatus, 
    error: updateStatusError 
  } = useAsync(
    async (deviceId: number, status: BoothStatus) => {
      if (!registry || !service) {
        throw new Error('Booth registry service not initialized');
      }
      
      if (!(await ensureCorrectChain())) {
        return null;
      }
      
      const tx = await registry.updateBoothStatus(deviceId, status);
      
      return tx.hash;
    }
  );
  
  // Get booth details
  const { 
    execute: getBoothDetails, 
    isLoading: isLoadingBooth, 
    error: getBoothError,
    data: boothDetails
  } = useAsync<Booth | null>(
    async (deviceId: number) => {
      if (!registry || !service) {
        throw new Error('Booth registry service not initialized');
      }
      
      return await registry.getBoothDetails(deviceId);
    },
    null
  );
  
  // Get campaign details
  const { 
    execute: getCampaignDetails, 
    isLoading: isLoadingCampaign, 
    error: getCampaignError,
    data: campaignDetails
  } = useAsync<Campaign | null>(
    async (campaignId: number) => {
      if (!registry || !service) {
        throw new Error('Booth registry service not initialized');
      }
      
      return await registry.getCampaignDetails(campaignId);
    },
    null
  );
  
  // Get active booths
  const { 
    execute: getActiveBooths, 
    isLoading: isLoadingActiveBooths, 
    error: getActiveBoothsError,
    data: activeBooths
  } = useAsync<number[]>(
    async () => {
      if (!registry || !service) {
        throw new Error('Booth registry service not initialized');
      }
      
      return await registry.getActiveBooths();
    },
    []
  );
  
  // Get active locations
  const { 
    execute: getActiveLocations, 
    isLoading: isLoadingActiveLocations, 
    error: getActiveLocationsError,
    data: activeLocations
  } = useAsync<number[]>(
    async () => {
      if (!registry || !service) {
        throw new Error('Booth registry service not initialized');
      }
      
      return await registry.getActiveLocations();
    },
    []
  );
  
  // Get all campaigns
  const { 
    execute: getAllCampaigns, 
    isLoading: isLoadingAllCampaigns, 
    error: getAllCampaignsError,
    data: allCampaigns
  } = useAsync<Campaign[]>(
    async () => {
      if (!registry || !service) {
        throw new Error('Booth registry service not initialized');
      }
      
      return await registry.getAllCampaigns();
    },
    []
  );
  
  // Get all booths
  const { 
    execute: getAllBooths, 
    isLoading: isLoadingAllBooths, 
    error: getAllBoothsError,
    data: allBooths
  } = useAsync<Booth[]>(
    async () => {
      if (!registry || !service) {
        throw new Error('Booth registry service not initialized');
      }
      
      return await registry.getAllBooths();
    },
    []
  );
  
  // Get my advertiser campaigns
  const { 
    execute: getMyAdvertiserCampaigns, 
    isLoading: isLoadingMyCampaigns, 
    error: getMyCampaignsError,
    data: myCampaigns
  } = useAsync<number[]>(
    async () => {
      if (!registry || !service || !service.address) {
        throw new Error('Booth registry service not initialized or no address');
      }
      
      return await registry.getMyAdvertiserCampaigns(service.address);
    },
    []
  );
  
  // Get my provider locations
  const { 
    execute: getMyProviderLocations, 
    isLoading: isLoadingMyLocations, 
    error: getMyLocationsError,
    data: myLocations
  } = useAsync<number[]>(
    async () => {
      if (!registry || !service || !service.address) {
        throw new Error('Booth registry service not initialized or no address');
      }
      
      return await registry.getProviderLocations(service.address);
    },
    []
  );
  
  // Get all campaigns by creator
  const { 
    execute: getAllCampaignsByCreator, 
    isLoading: isLoadingCreatorCampaigns, 
    error: getCreatorCampaignsError,
    data: creatorCampaigns
  } = useAsync<Campaign[]>(
    async (creatorAddress: string) => {
      if (!registry || !service) {
        throw new Error('Booth registry service not initialized');
      }
      
      // First get all campaigns
      const allCampaigns = await registry.getAllCampaigns();
      
      // Filter by creator
      return allCampaigns.filter(campaign => 
        campaign.advertiser.toLowerCase() === creatorAddress.toLowerCase()
      );
    },
    []
  );
  
  // Helper function to check if a transaction is pending
  const isTransactionPending = useCallback(
    (hash?: string | null) => {
      if (!hash) return false;
      
      const tx = transactions.get(hash as `0x${string}`);
      
      return tx?.state === TransactionState.Pending;
    },
    [transactions]
  );
  
  return {
    // Read operations
    getBoothDetails,
    getCampaignDetails,
    getActiveBooths,
    getActiveLocations,
    getAllCampaigns,
    getAllBooths,
    getMyAdvertiserCampaigns,
    getMyProviderLocations,
    getAllCampaignsByCreator,
    
    // Write operations
    registerBooth,
    createCampaign,
    addLocationToCampaign,
    removeLocationFromCampaign,
    activateBooth,
    deactivateBooth,
    updateBoothStatus,
    
    // Data
    boothDetails,
    campaignDetails,
    activeBooths,
    activeLocations,
    allCampaigns,
    allBooths,
    myCampaigns,
    myLocations,
    creatorCampaigns,
    
    // Loading states
    isLoadingBooth,
    isLoadingCampaign,
    isLoadingActiveBooths,
    isLoadingActiveLocations,
    isLoadingAllCampaigns,
    isLoadingAllBooths,
    isLoadingMyCampaigns,
    isLoadingMyLocations,
    isLoadingCreatorCampaigns,
    isRegistering,
    isCreatingCampaign,
    isAddingLocation,
    isRemovingLocation,
    isActivating,
    isDeactivating,
    isUpdatingStatus,
    
    // Error states
    getBoothError,
    getCampaignError,
    getActiveBoothsError,
    getActiveLocationsError,
    getAllCampaignsError,
    getAllBoothsError,
    getMyCampaignsError,
    getMyLocationsError,
    getCreatorCampaignsError,
    registerError,
    createCampaignError,
    addLocationError,
    removeLocationError,
    activateError,
    deactivateError,
    updateStatusError,
    
    // Helper functions
    isTransactionPending
  };
} 