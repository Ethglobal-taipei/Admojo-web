"use client";

import { useState, useCallback, useEffect } from "react";
import { useAdContract } from "./use-ad-contract";
import { usePrivy } from "@privy-io/react-auth";

export type MetricsRange = 'daily' | 'weekly' | 'monthly' | 'custom';

export type MetricsQueryOptions = {
  deviceId?: number;
  campaignId?: number;
  range: MetricsRange;
  startDate?: Date;
  endDate?: Date;
};

export type MetricsData = {
  totalViews: number;
  totalTaps: number;
  engagementRate: number; // taps/views as percentage
  timeRange: {
    start: Date;
    end: Date;
  };
  dailyBreakdown?: {
    date: Date;
    views: number;
    taps: number;
  }[];
};

export function useMetrics() {
  const { adContract } = useAdContract();
  const { authenticated } = usePrivy();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  const [data, setData] = useState<MetricsData | null>(null);

  // Helper to calculate date ranges
  const getDateRange = useCallback((range: MetricsRange, startDate?: Date, endDate?: Date): { start: Date; end: Date } => {
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    
    switch (range) {
      case 'daily':
        return {
          start: startDate || today,
          end: endDate || today
        };
      case 'weekly':
        const weekStart = new Date(today);
        weekStart.setDate(today.getDate() - 6); // Last 7 days
        return {
          start: startDate || weekStart,
          end: endDate || today
        };
      case 'monthly':
        const monthStart = new Date(today);
        monthStart.setDate(today.getDate() - 29); // Last 30 days
        return {
          start: startDate || monthStart,
          end: endDate || today
        };
      case 'custom':
        if (!startDate || !endDate) {
          throw new Error("Custom range requires both startDate and endDate");
        }
        return { start: startDate, end: endDate };
      default:
        return { start: today, end: today };
    }
  }, []);

  // Fetch metrics for a specific device
  const fetchDeviceMetrics = useCallback(async (
    deviceId: number,
    range: MetricsRange,
    startDate?: Date,
    endDate?: Date
  ): Promise<MetricsData> => {
    if (!adContract) {
      throw new Error("Contract not available");
    }

    // Calculate date range
    const { start, end } = getDateRange(range, startDate, endDate);
    
    // Convert dates to unix timestamps
    const startTimestamp = Math.floor(start.getTime() / 1000);
    const endTimestamp = Math.floor(end.getTime() / 1000);
    
    try {
      let totalViews = 0;
      let totalTaps = 0;
      const dailyBreakdown: { date: Date; views: number; taps: number }[] = [];
      
      // For single day metrics
      if (range === 'daily' || start.getTime() === end.getTime()) {
        const result = await adContract.getDailyMetrics(deviceId, start);
        totalViews = result.totalViews;
        totalTaps = result.totalTaps;
        
        if (totalViews > 0) {
          dailyBreakdown.push({
            date: new Date(start),
            views: totalViews,
            taps: totalTaps
          });
        }
      } 
      // For weekly or monthly metrics
      else {
        // Get aggregated metrics
        const result = await adContract.getAggregatedMetrics(
          deviceId,
          startTimestamp,
          endTimestamp
        );
        
        totalViews = result.totalViews;
        totalTaps = result.totalTaps;
        
        // Get daily breakdown if needed
        if (range !== 'custom' || (end.getTime() - start.getTime()) / (24 * 60 * 60 * 1000) <= 30) {
          // Only get daily breakdown for reasonable time periods (<=30 days)
          const currentDate = new Date(start);
          
          while (currentDate <= end) {
            try {
              const dailyResult = await adContract.getDailyMetrics(deviceId, currentDate);
              
              if (dailyResult.totalViews > 0) {
                dailyBreakdown.push({
                  date: new Date(currentDate),
                  views: dailyResult.totalViews,
                  taps: dailyResult.totalTaps
                });
              }
            } catch (err) {
              console.warn(`Could not get metrics for ${currentDate.toISOString()}`, err);
              // Continue to next day even if this one fails
            }
            
            // Move to next day
            currentDate.setDate(currentDate.getDate() + 1);
          }
        }
      }
      
      // Calculate engagement rate
      const engagementRate = totalViews > 0 ? (totalTaps / totalViews) * 100 : 0;
      
      return {
        totalViews,
        totalTaps,
        engagementRate,
        timeRange: { start, end },
        dailyBreakdown: dailyBreakdown.length > 0 ? dailyBreakdown : undefined
      };
    } catch (err) {
      console.error(`Error fetching metrics for device ${deviceId}:`, err);
      throw err;
    }
  }, [adContract, getDateRange]);

  // Fetch metrics for a specific campaign
  const fetchCampaignMetrics = useCallback(async (
    campaignId: number,
    range: MetricsRange,
    startDate?: Date,
    endDate?: Date
  ): Promise<MetricsData> => {
    if (!adContract) {
      throw new Error("Contract not available");
    }

    // Calculate date range
    const { start, end } = getDateRange(range, startDate, endDate);
    
    // Convert dates to unix timestamps
    const startTimestamp = Math.floor(start.getTime() / 1000);
    const endTimestamp = Math.floor(end.getTime() / 1000);
    
    try {
      let totalViews = 0;
      let totalTaps = 0;
      const dailyBreakdown: { date: Date; views: number; taps: number }[] = [];
      
      // Get campaign details to get booths
      const campaign = await adContract.getCampaignDetails(campaignId);
      
      if (campaign.bookedLocations.length === 0) {
        // No locations in campaign, return zeros
        return {
          totalViews: 0,
          totalTaps: 0,
          engagementRate: 0,
          timeRange: { start, end }
        };
      }
      
      // For single day metrics
      if (range === 'daily' || start.getTime() === end.getTime()) {
        // Get daily metrics for each booth in the campaign
        await Promise.all(campaign.bookedLocations.map(async (deviceId) => {
          try {
            const result = await adContract.getDailyMetrics(deviceId, start);
            totalViews += result.totalViews;
            totalTaps += result.totalTaps;
          } catch (err) {
            console.warn(`Could not get metrics for device ${deviceId}`, err);
          }
        }));
        
        if (totalViews > 0) {
          dailyBreakdown.push({
            date: new Date(start),
            views: totalViews,
            taps: totalTaps
          });
        }
      } 
      // For weekly or monthly metrics
      else {
        // Initialize daily metrics tracking
        const dailyMetrics: Map<string, { views: number; taps: number }> = new Map();
        
        // Get metrics for each booth in the campaign
        await Promise.all(campaign.bookedLocations.map(async (deviceId) => {
          try {
            // Get aggregated metrics for this booth
            const result = await adContract.getAggregatedMetrics(
              deviceId,
              startTimestamp,
              endTimestamp
            );
            
            totalViews += result.totalViews;
            totalTaps += result.totalTaps;
            
            // Get daily breakdown if needed
            if (range !== 'custom' || (end.getTime() - start.getTime()) / (24 * 60 * 60 * 1000) <= 30) {
              // Only get daily breakdown for reasonable time periods (<=30 days)
              const currentDate = new Date(start);
              
              while (currentDate <= end) {
                try {
                  const dailyResult = await adContract.getDailyMetrics(deviceId, currentDate);
                  
                  if (dailyResult.totalViews > 0) {
                    const dateStr = currentDate.toISOString().split('T')[0];
                    const existing = dailyMetrics.get(dateStr) || { views: 0, taps: 0 };
                    
                    dailyMetrics.set(dateStr, {
                      views: existing.views + dailyResult.totalViews,
                      taps: existing.taps + dailyResult.totalTaps
                    });
                  }
                } catch (err) {
                  // Continue to next day even if this one fails
                }
                
                // Move to next day
                currentDate.setDate(currentDate.getDate() + 1);
              }
            }
          } catch (err) {
            console.warn(`Could not get metrics for device ${deviceId}`, err);
          }
        }));
        
        // Convert daily metrics map to array
        if (dailyMetrics.size > 0) {
          for (const [dateStr, metrics] of dailyMetrics.entries()) {
            dailyBreakdown.push({
              date: new Date(dateStr),
              views: metrics.views,
              taps: metrics.taps
            });
          }
          
          // Sort by date
          dailyBreakdown.sort((a, b) => a.date.getTime() - b.date.getTime());
        }
      }
      
      // Calculate engagement rate
      const engagementRate = totalViews > 0 ? (totalTaps / totalViews) * 100 : 0;
      
      return {
        totalViews,
        totalTaps,
        engagementRate,
        timeRange: { start, end },
        dailyBreakdown: dailyBreakdown.length > 0 ? dailyBreakdown : undefined
      };
    } catch (err) {
      console.error(`Error fetching metrics for campaign ${campaignId}:`, err);
      throw err;
    }
  }, [adContract, getDateRange]);

  // Main function to fetch metrics based on options
  const fetchMetrics = useCallback(async (options: MetricsQueryOptions) => {
    setIsLoading(true);
    setError(null);
    
    try {
      let result: MetricsData;
      
      if (options.deviceId) {
        // Fetch device metrics
        result = await fetchDeviceMetrics(
          options.deviceId,
          options.range,
          options.startDate,
          options.endDate
        );
      } else if (options.campaignId) {
        // Fetch campaign metrics
        result = await fetchCampaignMetrics(
          options.campaignId,
          options.range,
          options.startDate,
          options.endDate
        );
      } else {
        throw new Error("Either deviceId or campaignId must be provided");
      }
      
      setData(result);
      return result;
    } catch (err) {
      console.error("Error fetching metrics:", err);
      const error = err instanceof Error ? err : new Error(String(err));
      setError(error);
      return null;
    } finally {
      setIsLoading(false);
    }
  }, [fetchDeviceMetrics, fetchCampaignMetrics]);

  // Update metrics for a device (admin only)
  const updateMetrics = useCallback(async (
    deviceId: number,
    timestamp: number,
    views: number,
    taps: number
  ): Promise<boolean> => {
    if (!adContract || !authenticated) {
      setError(new Error("Contract not available or user not authenticated"));
      return false;
    }

    try {
      // Call the contract method
      const txHash = await adContract.updateMetrics(deviceId, timestamp, views, taps);
      
      // Wait for transaction to complete
      await adContract.waitForTransaction(txHash);
      
      return true;
    } catch (err) {
      console.error(`Error updating metrics for device ${deviceId}:`, err);
      const error = err instanceof Error ? err : new Error(String(err));
      setError(error);
      return false;
    }
  }, [adContract, authenticated]);

  // Clear current data
  const clearMetrics = useCallback(() => {
    setData(null);
    setError(null);
  }, []);

  return {
    fetchMetrics,
    updateMetrics,
    clearMetrics,
    isLoading,
    error,
    data
  };
} 