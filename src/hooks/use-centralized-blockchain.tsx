'use client';

import { useCallback, useEffect, useState, useRef } from 'react';
import { useBlockchainService } from './use-blockchain-service';
import { useBoothRegistry } from './use-booth-registry';
import { usePerformanceOracle } from './use-performance-oracle';
import { useBlockchainStore } from '@/lib/store';
import { toast } from '@/lib/toast';

/**
 * A centralized hook that syncs blockchain data with our centralized store
 * and provides methods for interacting with blockchain services
 */
export function useCentralizedBlockchain() {
  const [initialized, setInitialized] = useState(false);
  
  // Get blockchain service
  const { 
    service, 
    isLoading: serviceLoading, 
    error: serviceError, 
    chainId, 
    isCorrectChain, 
    switchChain,
    address 
  } = useBlockchainService();
  
  // Get blockchain hooks
  const boothRegistry = useBoothRegistry();
  const performanceOracle = usePerformanceOracle();
  
  // Get blockchain store
  const blockchainStore = useBlockchainStore();
  
  // Reference for previous values to avoid unnecessary updates
  const prevValuesRef = useRef<{
    isConnected: boolean;
    chainId: number | null;
    address: string | null;
    isCorrectChain: boolean;
    isLoading: boolean;
    error: Error | null;
  }>({
    isConnected: false,
    chainId: null,
    address: null,
    isCorrectChain: false,
    isLoading: false,
    error: null
  });
  
  // Sync connection status with store - with deep comparison to avoid infinite updates
  useEffect(() => {
    const isConnected = !!service;
    const effectiveAddress = address || null;
    
    // Only update if values actually changed
    if (
      prevValuesRef.current.isConnected !== isConnected || 
      prevValuesRef.current.chainId !== chainId ||
      prevValuesRef.current.address !== effectiveAddress
    ) {
      prevValuesRef.current.isConnected = isConnected;
      prevValuesRef.current.chainId = chainId;
      prevValuesRef.current.address = effectiveAddress;
      blockchainStore.setConnectionStatus(isConnected, chainId, effectiveAddress);
    }
    
    // Update chain status if changed
    if (prevValuesRef.current.isCorrectChain !== isCorrectChain) {
      prevValuesRef.current.isCorrectChain = isCorrectChain;
      blockchainStore.setChainCorrect(isCorrectChain);
    }
    
    // Update loading state if changed
    if (prevValuesRef.current.isLoading !== serviceLoading) {
      prevValuesRef.current.isLoading = serviceLoading;
      blockchainStore.setLoading(serviceLoading);
    }
    
    // Update error state if changed
    const currentErrorMsg = serviceError?.message;
    const prevErrorMsg = prevValuesRef.current.error?.message;
    if (currentErrorMsg !== prevErrorMsg) {
      prevValuesRef.current.error = serviceError;
      blockchainStore.setError(serviceError);
    }
  }, [service, chainId, isCorrectChain, serviceLoading, serviceError, address, blockchainStore]);
  
  // Initialize and fetch blockchain data
  const initializeData = useCallback(async () => {
    if (!service || !isCorrectChain || initialized) return;
    
    try {
      blockchainStore.setLoading(true);
      
      // Fetch active booths
      if (boothRegistry.getActiveBooths) {
        const activeBooths = await boothRegistry.getActiveBooths();
        if (activeBooths) {
          blockchainStore.setActiveBoothIds(activeBooths);
        }
      }
      
      // Fetch active locations
      if (boothRegistry.getActiveLocations) {
        const activeLocations = await boothRegistry.getActiveLocations();
        if (activeLocations) {
          blockchainStore.setActiveLocationIds(activeLocations);
        }
      }
      
      // Fetch my provider locations if user is connected
      if (address && boothRegistry.getMyProviderLocations) {
        const myLocations = await boothRegistry.getMyProviderLocations();
        if (myLocations) {
          blockchainStore.setMyProviderLocations(myLocations);
        }
      }
      
      // Fetch my advertiser campaigns if user is connected
      if (address && boothRegistry.getMyAdvertiserCampaigns) {
        const myCampaigns = await boothRegistry.getMyAdvertiserCampaigns();
        if (myCampaigns) {
          blockchainStore.setMyAdvertiserCampaigns(myCampaigns);
        }
      }
      
      // Fetch all booths
      if (boothRegistry.getAllBooths) {
        const allBooths = await boothRegistry.getAllBooths();
        if (allBooths) {
          blockchainStore.setBooths(allBooths);
        }
      }
      
      // Fetch all campaigns
      if (boothRegistry.getAllCampaigns) {
        const allCampaigns = await boothRegistry.getAllCampaigns();
        if (allCampaigns) {
          blockchainStore.setCampaigns(allCampaigns);
        }
      }
      
      setInitialized(true);
    } catch (error) {
      console.error('Failed to initialize blockchain data:', error);
      blockchainStore.setError(error instanceof Error ? error : new Error('Failed to initialize blockchain data'));
    } finally {
      blockchainStore.setLoading(false);
    }
  }, [service, isCorrectChain, initialized, address, boothRegistry, blockchainStore]);
  
  // Run initialization when service is ready
  useEffect(() => {
    if (service && isCorrectChain && !initialized) {
      initializeData();
    }
  }, [service, isCorrectChain, initialized, initializeData]);
  
  // Reference to keep track of previous service state
  const prevServiceRef = useRef<boolean>(!!service);
  
  // Reset when disconnected - using ref to avoid infinite loops
  useEffect(() => {
    const wasConnected = prevServiceRef.current;
    const isConnected = !!service;
    
    // Only reset if we were connected before and now we're not
    if (wasConnected && !isConnected) {
      blockchainStore.reset();
      setInitialized(false);
    }
    
    // Update the ref
    prevServiceRef.current = isConnected;
    
    // We intentionally omit blockchainStore from dependencies to avoid infinite loops
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [service]);
  
  // Methods to get/fetch data with automatic store updates
  
  /**
   * Get booth details from store or fetch from blockchain
   */
  const getBoothDetails = useCallback(async (deviceId: number) => {
    // Check if booth already exists in store
    const existingBooth = blockchainStore.getBoothById(deviceId);
    if (existingBooth) return existingBooth;
    
    // Otherwise fetch from blockchain
    if (!boothRegistry.getBoothDetails) {
      throw new Error('Booth registry service not initialized');
    }
    
    try {
      const booth = await boothRegistry.getBoothDetails(deviceId);
      if (booth) {
        blockchainStore.setBooth(deviceId, booth);
      }
      return booth;
    } catch (error) {
      console.error(`Failed to fetch booth details for device ${deviceId}:`, error);
      throw error;
    }
  }, [blockchainStore, boothRegistry]);
  
  /**
   * Get campaign details from store or fetch from blockchain
   */
  const getCampaignDetails = useCallback(async (campaignId: number) => {
    // Check if campaign already exists in store
    const existingCampaign = blockchainStore.getCampaignById(campaignId);
    if (existingCampaign) return existingCampaign;
    
    // Otherwise fetch from blockchain
    if (!boothRegistry.getCampaignDetails) {
      throw new Error('Booth registry service not initialized');
    }
    
    try {
      const campaign = await boothRegistry.getCampaignDetails(campaignId);
      if (campaign) {
        blockchainStore.setCampaign(campaignId, campaign);
      }
      return campaign;
    } catch (error) {
      console.error(`Failed to fetch campaign details for campaign ${campaignId}:`, error);
      throw error;
    }
  }, [blockchainStore, boothRegistry]);
  
  /**
   * Get metrics for a device
   */
  const getMetrics = useCallback(async (deviceId: number, timestamp: number) => {
    // Check for metrics in store
    const metricsKey = `${deviceId}-${timestamp}`;
    const existingMetrics = blockchainStore.metrics[metricsKey];
    if (existingMetrics) return existingMetrics;
    
    // Otherwise fetch from blockchain
    if (!performanceOracle.getMetrics) {
      throw new Error('Performance oracle service not initialized');
    }
    
    try {
      const metrics = await performanceOracle.getMetrics(deviceId, timestamp);
      if (metrics) {
        blockchainStore.setMetrics(deviceId, timestamp, metrics);
      }
      return metrics;
    } catch (error) {
      console.error(`Failed to fetch metrics for device ${deviceId} at timestamp ${timestamp}:`, error);
      throw error;
    }
  }, [blockchainStore, performanceOracle]);
  
  /**
   * Get aggregated metrics for a device over a time period
   */
  const getAggregatedMetrics = useCallback(async (deviceId: number, startTime: number, endTime: number) => {
    // Check for metrics in store
    const metricsKey = `${deviceId}-${startTime}-${endTime}`;
    const existingMetrics = blockchainStore.aggregatedMetrics[metricsKey];
    if (existingMetrics) return existingMetrics;
    
    // Otherwise fetch from blockchain
    if (!performanceOracle.getAggregatedMetrics) {
      throw new Error('Performance oracle service not initialized');
    }
    
    try {
      const metrics = await performanceOracle.getAggregatedMetrics(deviceId, startTime, endTime);
      if (metrics) {
        blockchainStore.setAggregatedMetrics(deviceId, startTime, endTime, metrics);
      }
      return metrics;
    } catch (error) {
      console.error(`Failed to fetch aggregated metrics for device ${deviceId}:`, error);
      throw error;
    }
  }, [blockchainStore, performanceOracle]);
  
  /**
   * Handle a transaction and update pending transactions
   */
  const handleTransaction = useCallback(async (txPromise: Promise<any>, description: string) => {
    try {
      const tx = await txPromise;
      if (tx && tx.hash) {
        blockchainStore.addPendingTransaction(tx.hash, description);
        
        // Wait for transaction confirmation
        const receipt = await tx.wait?.();
        
        // Update transaction status based on receipt
        if (receipt) {
          blockchainStore.updateTransactionStatus(
            tx.hash, 
            receipt.status === 'success' ? 'completed' : 'failed'
          );
          
          // Show toast based on status
          if (receipt.status === 'success') {
            toast(
              "Transaction Successful", 
              { description: `${description} completed successfully.` }, 
              "success"
            );
          } else {
            toast(
              "Transaction Failed", 
              { description: `${description} failed.` }, 
              "error"
            );
          }
        }
        
        return { hash: tx.hash, receipt };
      }
      
      throw new Error('Transaction failed to return a hash');
    } catch (error) {
      console.error(`Transaction error (${description}):`, error);
      toast(
        "Transaction Error", 
        { description: `Error during ${description}: ${error instanceof Error ? error.message : 'Unknown error'}` }, 
        "error"
      );
      throw error;
    }
  }, [blockchainStore]);
  
  /**
   * Refresh all blockchain data
   */
  const refreshAllData = useCallback(async () => {
    if (!service || !isCorrectChain) return;
    
    try {
      blockchainStore.setLoading(true);
      await initializeData();
      toast("Data Refreshed", { description: "Blockchain data has been refreshed." }, "success");
    } catch (error) {
      console.error("Failed to refresh data:", error);
      toast(
        "Refresh Failed", 
        { description: error instanceof Error ? error.message : "Failed to refresh blockchain data" }, 
        "error"
      );
    } finally {
      blockchainStore.setLoading(false);
    }
  }, [service, isCorrectChain, blockchainStore, initializeData]);
  
  /**
   * Register a booth with the contract and update store
   */
  const registerBooth = useCallback(async (deviceId: number, metadata: any) => {
    if (!boothRegistry.registerBooth) {
      throw new Error('Booth registry service not initialized');
    }
    
    try {
      const result = await handleTransaction(
        boothRegistry.registerBooth(deviceId, metadata),
        `Register display #${deviceId}`
      );
      
      // Refresh booth details after registration
      if (result.receipt?.status === 'success') {
        const boothDetails = await getBoothDetails(deviceId);
        return { ...result, booth: boothDetails };
      }
      
      return result;
    } catch (error) {
      console.error(`Failed to register booth ${deviceId}:`, error);
      throw error;
    }
  }, [boothRegistry, handleTransaction, getBoothDetails]);
  
  /**
   * Create a campaign with the contract and update store
   */
  const createCampaign = useCallback(async (metadata: any, deviceIds: number[]) => {
    if (!boothRegistry.createCampaign) {
      throw new Error('Booth registry service not initialized');
    }
    
    try {
      const result = await handleTransaction(
        boothRegistry.createCampaign(metadata, deviceIds),
        `Create new campaign`
      );
      
      // Refresh campaign list after creation
      if (result.receipt?.status === 'success') {
        await refreshAllData(); // Refresh to get the newly created campaign
      }
      
      return result;
    } catch (error) {
      console.error(`Failed to create campaign:`, error);
      throw error;
    }
  }, [boothRegistry, handleTransaction, refreshAllData]);
  
  /**
   * Update metrics for a device
   */
  const updateMetrics = useCallback(async (deviceId: number, timestamp: number, views: number, taps: number) => {
    if (!performanceOracle.updateMetrics) {
      throw new Error('Performance oracle service not initialized');
    }
    
    try {
      const result = await handleTransaction(
        performanceOracle.updateMetrics(deviceId, timestamp, views, taps),
        `Update metrics for display #${deviceId}`
      );
      
      return result;
    } catch (error) {
      console.error(`Failed to update metrics for device ${deviceId}:`, error);
      throw error;
    }
  }, [performanceOracle, handleTransaction]);
  
  return {
    // Status
    isInitialized: initialized,
    isLoading: serviceLoading || blockchainStore.isLoading,
    error: serviceError || blockchainStore.error,
    isCorrectChain,
    switchChain,
    
    // Data from store
    booths: blockchainStore.booths,
    campaigns: blockchainStore.campaigns,
    activeBoothIds: blockchainStore.activeBoothIds,
    activeLocationIds: blockchainStore.activeLocationIds,
    myProviderLocations: blockchainStore.myProviderLocations,
    myAdvertiserCampaigns: blockchainStore.myAdvertiserCampaigns,
    pendingTransactions: blockchainStore.pendingTransactions,
    
    // Fetch methods with store integration
    getBoothDetails,
    getCampaignDetails,
    getMetrics,
    getAggregatedMetrics,
    refreshAllData,
    
    // Blockchain service methods
    registerBooth,
    createCampaign,
    updateMetrics,
    
    // Original service instances (for direct access if needed)
    blockchainService: service,
    boothRegistry,
    performanceOracle,
  };
} 