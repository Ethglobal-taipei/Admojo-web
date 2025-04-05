'use client';

import { useCallback } from 'react';
import { useBlockchainService } from './use-blockchain-service';
import { 
  AggregatedMetrics, 
  Metrics, 
  TransactionState 
} from '@/lib/blockchain';
import { toast } from '@/lib/toast';
import { useAsync } from './use-async';

/**
 * Hook for interacting with the performance oracle contract
 */
export function usePerformanceOracle() {
  const { service, isCorrectChain, switchChain, transactions } = useBlockchainService();
  
  // Get the performance oracle service
  const oracle = service?.performanceOracle;
  
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
  
  // Update metrics
  const { 
    execute: updateMetrics, 
    isLoading: isUpdatingMetrics, 
    error: updateMetricsError 
  } = useAsync(
    async (deviceId: number, timestamp: number, views: number, taps: number) => {
      if (!oracle || !service) {
        throw new Error('Performance oracle service not initialized');
      }
      
      if (!(await ensureCorrectChain())) {
        return null;
      }
      
      const tx = await oracle.updateMetrics(deviceId, timestamp, views, taps);
      
      return tx.hash;
    }
  );
  
  // Get metrics for a specific timestamp
  const { 
    execute: getMetrics, 
    isLoading: isLoadingMetrics, 
    error: getMetricsError,
    data: metrics
  } = useAsync<Metrics | null>(
    async (deviceId: number, timestamp: number) => {
      if (!oracle || !service) {
        throw new Error('Performance oracle service not initialized');
      }
      
      return await oracle.getMetrics(deviceId, timestamp);
    },
    null
  );
  
  // Get aggregated metrics over a time period
  const { 
    execute: getAggregatedMetrics, 
    isLoading: isLoadingAggregatedMetrics, 
    error: getAggregatedMetricsError,
    data: aggregatedMetrics
  } = useAsync<AggregatedMetrics | null>(
    async (deviceId: number, startTime: number, endTime: number) => {
      if (!oracle || !service) {
        throw new Error('Performance oracle service not initialized');
      }
      
      return await oracle.getAggregatedMetrics(deviceId, startTime, endTime);
    },
    null
  );
  
  // Get daily metrics
  const { 
    execute: getDailyMetrics, 
    isLoading: isLoadingDailyMetrics, 
    error: getDailyMetricsError,
    data: dailyMetrics
  } = useAsync<AggregatedMetrics | null>(
    async (deviceId: number, date?: Date) => {
      if (!oracle || !service) {
        throw new Error('Performance oracle service not initialized');
      }
      
      return await oracle.getDailyMetrics(deviceId, date);
    },
    null
  );
  
  // Get weekly metrics
  const { 
    execute: getWeeklyMetrics, 
    isLoading: isLoadingWeeklyMetrics, 
    error: getWeeklyMetricsError,
    data: weeklyMetrics
  } = useAsync<AggregatedMetrics | null>(
    async (deviceId: number, startDate?: Date) => {
      if (!oracle || !service) {
        throw new Error('Performance oracle service not initialized');
      }
      
      return await oracle.getWeeklyMetrics(deviceId, startDate);
    },
    null
  );
  
  // Get campaign metrics
  const { 
    execute: getCampaignMetrics, 
    isLoading: isLoadingCampaignMetrics, 
    error: getCampaignMetricsError,
    data: campaignMetrics
  } = useAsync<AggregatedMetrics | null>(
    async (campaignId: number, startTime: number, endTime: number) => {
      if (!service) {
        throw new Error('Blockchain service not initialized');
      }
      
      return await service.getCampaignMetrics(campaignId, startTime, endTime);
    },
    null
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
    // Write operations
    updateMetrics,
    
    // Read operations
    getMetrics,
    getAggregatedMetrics,
    getDailyMetrics,
    getWeeklyMetrics,
    getCampaignMetrics,
    
    // Data
    metrics,
    aggregatedMetrics,
    dailyMetrics,
    weeklyMetrics,
    campaignMetrics,
    
    // Loading states
    isUpdatingMetrics,
    isLoadingMetrics,
    isLoadingAggregatedMetrics,
    isLoadingDailyMetrics,
    isLoadingWeeklyMetrics,
    isLoadingCampaignMetrics,
    
    // Error states
    updateMetricsError,
    getMetricsError,
    getAggregatedMetricsError,
    getDailyMetricsError,
    getWeeklyMetricsError,
    getCampaignMetricsError,
    
    // Helpers
    isTransactionPending
  };
} 