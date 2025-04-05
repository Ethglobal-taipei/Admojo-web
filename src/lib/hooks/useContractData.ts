"use client"

import { useState, useEffect } from 'react';
import { useBlockchainService, useBoothRegistry, usePerformanceOracle } from '@/hooks';
import { Booth, BoothStatus, Campaign } from '@/lib/blockchain';
import { useUserStore } from '../store/useUserStore';
import { toast as toastNotification } from '@/lib/toast';
import { toast as sonnerToast } from "sonner";

export interface ContractStats {
  campaigns: number;
  activeDisplays: number;
  totalViews: number;
  totalTaps: number;
  change: {
    campaigns: number;
    activeDisplays: number;
    totalViews: number;
    totalTaps: number;
  };
}

export interface DisplayLocation {
  id: number;
  deviceId: number;
  name: string;
  location: string;
  displaySize: string;
  additionalInfo?: string;
  lat: number;
  lng: number;
  status: 'active' | 'inactive' | 'maintenance';
  views: number;
  taps: number;
  type: string;
  performance: 'high' | 'medium' | 'low';
  isAnimating?: boolean;
}

export interface PerformanceData {
  views: number[];
  taps: number[];
  dates: string[];
  locationDistribution: { name: string; value: number }[];
  deviceSizeDistribution: { name: string; value: number }[];
}

export function useContractData() {
  const { user } = useUserStore();
  const { service, isLoading: isServiceLoading, error: serviceError } = useBlockchainService();
  const { 
    getAllCampaigns, getAllBooths, getMyAdvertiserCampaigns,
    activateBooth: boothRegistryActivate, deactivateBooth: boothRegistryDeactivate,
    createCampaign: boothRegistryCreateCampaign, addLocationToCampaign: boothRegistryAddLocation,
    removeLocationFromCampaign: boothRegistryRemoveLocation,
    isActivating, isDeactivating, isCreatingCampaign, isAddingLocation, isRemovingLocation
  } = useBoothRegistry();
  
  const {
    getDailyMetrics, getWeeklyMetrics
  } = usePerformanceOracle();
  
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [stats, setStats] = useState<ContractStats | null>(null);
  const [displayLocations, setDisplayLocations] = useState<DisplayLocation[]>([]);
  const [performanceData, setPerformanceData] = useState<PerformanceData | null>(null);
  const [userCampaigns, setUserCampaigns] = useState<Campaign[]>([]);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setIsLoading(true);
        setError(null);
        
        if (!user || !user.walletAddress || !service || !service.isConnected) {
          setIsLoading(false);
          return;
        }
        
        // Refresh data
        await fetchContractData();
      } catch (err: any) {
        console.error("Error initializing contract data:", err);
        setError(err.message || "Failed to initialize blockchain data");
        setIsLoading(false);
      }
    };
    
    fetchData();
  }, [user, service]);

  const fetchContractData = async () => {
    try {
      setIsLoading(true);
      setError(null);
      
      if (!service || !service.isConnected) {
        throw new Error("Blockchain service not initialized");
      }
      
      // Fetch booth locations from contract
      const userBoothsData = await fetchBooths();
      setDisplayLocations(userBoothsData);
      
      // Fetch campaigns from contract
      const campaigns = await fetchUserCampaigns();
      setUserCampaigns(campaigns);
      
      // Calculate statistics from real data
      if (userBoothsData.length > 0 || campaigns.length > 0) {
        const statisticsData = await calculateStats(userBoothsData, campaigns);
        setStats(statisticsData);
        
        const perfData = await calculatePerformanceData(userBoothsData);
        setPerformanceData(perfData);
      } else {
        setStats({
          campaigns: 0,
          activeDisplays: 0,
          totalViews: 0,
          totalTaps: 0,
          change: { campaigns: 0, activeDisplays: 0, totalViews: 0, totalTaps: 0 }
        });
        
        setPerformanceData({
          views: [],
          taps: [],
          dates: [],
          locationDistribution: [],
          deviceSizeDistribution: []
        });
      }
      
      setIsLoading(false);
    } catch (err: any) {
      console.error("Error fetching contract data:", err);
      setError(err.message || "Failed to fetch data from blockchain");
      setIsLoading(false);
      
      // Set empty data
      setDisplayLocations([]);
      setStats({
        campaigns: 0,
        activeDisplays: 0,
        totalViews: 0,
        totalTaps: 0,
        change: { campaigns: 0, activeDisplays: 0, totalViews: 0, totalTaps: 0 }
      });
      setPerformanceData({
        views: [],
        taps: [],
        dates: [],
        locationDistribution: [],
        deviceSizeDistribution: []
      });
      
      toastNotification(
        "Connection Failed",
        { description: "Unable to connect to blockchain. Please try again later." },
        "error"
      );
    }
  };
  
  const fetchBooths = async (): Promise<DisplayLocation[]> => {
    try {
      if (!user?.walletAddress || !service?.address) {
        return [];
      }
      
      // Get all booths
      const allBooths = await getAllBooths();
      
      if (!allBooths || allBooths.length === 0) {
        return [];
      }
      
      // Filter booths owned by this user
      const userBooths = allBooths.filter(booth => 
        booth.owner.toLowerCase() === user.walletAddress.toLowerCase()
      );
      
      // Transform booth details to display locations
      const locations: DisplayLocation[] = await Promise.all(userBooths.map(async (boothDetail, index: number) => {
        // Get metrics for this booth for today
        const metrics = await fetchBoothMetrics(boothDetail.deviceId);
        
        // Map BoothStatus to our UI status
        let status: 'active' | 'inactive' | 'maintenance';
        if (!boothDetail.active) {
          status = 'inactive';
        } else if (boothDetail.status === BoothStatus.UnderMaintenance) {
          status = 'maintenance';
        } else {
          status = 'active';
        }
        
        // Determine performance rating based on tap-through rate (taps/views)
        let performance: 'high' | 'medium' | 'low';
        const tapRate = metrics.views > 0 ? metrics.taps / metrics.views : 0;
        
        if (tapRate > 0.05) performance = 'high';
        else if (tapRate > 0.02) performance = 'medium';
        else performance = 'low';
        
        // Extract lat/lng from metadata or use defaults
        const lat = parseFloat(boothDetail.metadata.additionalInfo?.split('lat:')[1]?.split(',')[0] || '40.7');
        const lng = parseFloat(boothDetail.metadata.additionalInfo?.split('lng:')[1]?.split(',')[0] || '-74.0');
        
        return {
          id: index + 1,
          deviceId: boothDetail.deviceId,
          name: `Booth #${boothDetail.deviceId}`,
          location: boothDetail.metadata.location,
          displaySize: boothDetail.metadata.displaySize,
          additionalInfo: boothDetail.metadata.additionalInfo,
          lat,
          lng,
          status,
          views: metrics.views,
          taps: metrics.taps,
          type: boothDetail.metadata.displaySize === 'Large' ? 'billboard' : 
                 boothDetail.metadata.displaySize === 'Medium' ? 'transit' : 'street',
          performance,
          isAnimating: false
        };
      }));
      
      return locations;
    } catch (error) {
      console.error("Error fetching booths:", error);
      return [];
    }
  };
  
  const fetchBoothMetrics = async (
    deviceId: number
  ): Promise<{ views: number; taps: number }> => {
    try {
      // Get metrics for today
      const dailyMetrics = await getDailyMetrics(deviceId);
      
      if (!dailyMetrics) {
        return { views: 0, taps: 0 };
      }
      
      return {
        views: dailyMetrics.totalViews,
        taps: dailyMetrics.totalTaps
      };
    } catch (error) {
      console.error(`Error fetching metrics for booth ${deviceId}:`, error);
      return {
        views: 0,
        taps: 0
      };
    }
  };
  
  const fetchUserCampaigns = async (): Promise<Campaign[]> => {
    try {
      if (!user?.walletAddress) {
        return [];
      }
      
      // Get campaign IDs for the current user
      await getMyAdvertiserCampaigns(user.walletAddress as `0x${string}`);
      
      // Get all campaigns
      const allCampaigns = await getAllCampaigns();
      
      if (!allCampaigns) {
        return [];
      }
      
      // Filter campaigns that belong to this user
      return allCampaigns.filter(campaign => 
        campaign.advertiser.toLowerCase() === user.walletAddress.toLowerCase()
      );
    } catch (error) {
      console.error("Error fetching user campaigns:", error);
      return [];
    }
  };
  
  const calculateStats = async (
    locations: DisplayLocation[], 
    campaigns: Campaign[]
  ): Promise<ContractStats> => {
    const activeLocations = locations.filter(loc => loc.status === 'active');
    let totalViews = 0;
    let totalTaps = 0;
    
    // Sum up metrics across all campaigns for the past week
    for (const campaign of campaigns) {
      try {
        // Get weekly metrics for each device in the campaign
        for (const deviceId of campaign.bookedLocations) {
          const metrics = await getWeeklyMetrics(deviceId);
          if (metrics) {
            totalViews += metrics.totalViews;
            totalTaps += metrics.totalTaps;
          }
        }
      } catch (error) {
        console.error(`Error fetching metrics for campaign ${campaign.id}:`, error);
      }
    }
    
    // For change metrics, we'd ideally compare with previous period data
    // As we don't have historical data, we'll use zeros for now
    return {
      campaigns: campaigns.length,
      activeDisplays: activeLocations.length,
      totalViews,
      totalTaps,
      change: {
        campaigns: 0,
        activeDisplays: 0,
        totalViews: 0,
        totalTaps: 0
      }
    };
  };
  
  const calculatePerformanceData = async (
    locations: DisplayLocation[]
  ): Promise<PerformanceData> => {
    // Calculate real performance metrics from location data
    
    // Count location types for distribution
    const locationTypes: Record<string, number> = {};
    const deviceSizes: Record<string, number> = {};
    let totalLocations = locations.length;
    
    if (totalLocations === 0) {
      return {
        views: [],
        taps: [],
        dates: [],
        locationDistribution: [],
        deviceSizeDistribution: []
      };
    }
    
    // Generate past 7 days dates for timeline
    const dates: string[] = [];
    const views: number[] = Array(7).fill(0);
    const taps: number[] = Array(7).fill(0);
    
    for (let i = 6; i >= 0; i--) {
      const date = new Date();
      date.setDate(date.getDate() - i);
      dates.push(date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }));
      
      // For each device, get metrics for this day and add to totals
      for (const location of locations) {
        try {
          const dayDate = new Date();
          dayDate.setDate(dayDate.getDate() - i);
          
          const metrics = await getDailyMetrics(location.deviceId, dayDate);
          if (metrics) {
            views[6-i] += metrics.totalViews;
            taps[6-i] += metrics.totalTaps;
          }
        } catch (error) {
          console.error(`Error fetching metrics for location ${location.deviceId}:`, error);
        }
      }
    }
    
    // Count by location and size
    locations.forEach(location => {
      const locationType = location.type || 'unknown';
      locationTypes[locationType] = (locationTypes[locationType] || 0) + 1;
      
      const deviceSize = location.displaySize || 'unknown';
      deviceSizes[deviceSize] = (deviceSizes[deviceSize] || 0) + 1;
    });
    
    // Create distribution objects
    const locationDistribution = Object.entries(locationTypes).map(([name, value]) => ({
      name: name.charAt(0).toUpperCase() + name.slice(1),
      value: Math.round((value / totalLocations) * 100)
    }));
    
    const deviceSizeDistribution = Object.entries(deviceSizes).map(([name, value]) => ({
      name,
      value: Math.round((value / totalLocations) * 100)
    }));
    
    return {
      views,
      taps,
      dates,
      locationDistribution,
      deviceSizeDistribution
    };
  };
  
  const refreshData = async () => {
    if (service?.isConnected && user?.walletAddress) {
      try {
        await fetchContractData();
        toastNotification(
          "Data Refreshed",
          { description: "Latest data has been loaded from the blockchain." },
          "success"
        );
      } catch (err: any) {
        console.error("Error refreshing data:", err);
        toastNotification(
          "Refresh Failed",
          { description: err.message || "Could not refresh data from the blockchain." },
          "error"
        );
      }
    }
  };

  const activateBooth = async (deviceId: number) => {
    if (!service?.isConnected) {
      toastNotification(
        "Not Connected",
        { description: "Please connect your wallet to perform this action." },
        "warning"
      );
      return false;
    }
    
    try {
      sonnerToast.loading("Activating booth...");
      
      // Call the contract to activate the booth
      const txHash = await boothRegistryActivate(deviceId);
      
      if (!txHash) {
        throw new Error("Transaction failed");
      }
      
      // Update local state optimistically
      setDisplayLocations(prev => 
        prev.map(location => {
          if (location.deviceId === deviceId) {
            return {
              ...location,
              status: 'active',
              isAnimating: true
            };
          }
          return location;
        })
      );
      
      toastNotification(
        "Booth activation requested",
        { description: `Booth #${deviceId} activation is being processed` },
        "info"
      );
      
      // Refresh data after a delay to allow transaction to be processed
      setTimeout(refreshData, 5000);
      
      return true;
    } catch (error: any) {
      console.error("Error activating booth:", error);
      toastNotification(
        "Failed to activate booth", 
        { description: error.message || "Transaction failed" },
        "error"
      );
      return false;
    }
  };

  const deactivateBooth = async (deviceId: number) => {
    if (!service?.isConnected) {
      toastNotification(
        "Not Connected",
        { description: "Please connect your wallet to perform this action." },
        "warning"
      );
      return false;
    }
    
    try {
      sonnerToast.loading("Deactivating booth...");
      
      // Call the contract to deactivate the booth
      const txHash = await boothRegistryDeactivate(deviceId);
      
      if (!txHash) {
        throw new Error("Transaction failed");
      }
      
      // Update local state optimistically
      setDisplayLocations(prev => 
        prev.map(location => {
          if (location.deviceId === deviceId) {
            return {
              ...location,
              status: 'inactive',
              isAnimating: true
            };
          }
          return location;
        })
      );
      
      toastNotification(
        "Booth deactivation requested",
        { description: `Booth #${deviceId} deactivation is being processed` },
        "info"
      );
      
      // Refresh data after a delay to allow transaction to be processed
      setTimeout(refreshData, 5000);
      
      return true;
    } catch (error: any) {
      console.error("Error deactivating booth:", error);
      toastNotification(
        "Failed to deactivate booth", 
        { description: error.message || "Transaction failed" },
        "error"
      );
      return false;
    }
  };

  const createCampaign = async (
    metadata: {
      name: string;
      description: string;
      contentURI: string;
      duration: number;
    },
    deviceIds: number[]
  ) => {
    if (!service?.isConnected) {
      toastNotification(
        "Not Connected",
        { description: "Please connect your wallet to perform this action." },
        "warning"
      );
      return false;
    }
    
    try {
      sonnerToast.loading("Creating campaign...");
      
      // Prepare campaign metadata
      const campaignMetadata = {
        name: metadata.name,
        description: metadata.description,
        contentURI: metadata.contentURI,
        startDate: BigInt(Math.floor(Date.now() / 1000)), // current timestamp
        duration: metadata.duration,
        additionalInfo: ''
      };
      
      // Call the contract to create the campaign with initial locations
      const txHash = await boothRegistryCreateCampaign(campaignMetadata, deviceIds);
      
      if (!txHash) {
        throw new Error("Transaction failed");
      }
      
      toastNotification(
        "Campaign creation requested",
        { description: `Campaign "${metadata.name}" is being created with ${deviceIds.length} booth locations` },
        "info"
      );
      
      // Refresh data after a delay to allow transaction to be processed
      setTimeout(refreshData, 5000);
      
      return true;
    } catch (error: any) {
      console.error("Error creating campaign:", error);
      toastNotification(
        "Failed to create campaign", 
        { description: error.message || "Transaction failed" },
        "error"
      );
      return false;
    }
  };

  const addLocationToCampaign = async (campaignId: number, deviceId: number) => {
    if (!service?.isConnected) {
      toastNotification(
        "Not Connected",
        { description: "Please connect your wallet to perform this action." },
        "warning"
      );
      return false;
    }
    
    try {
      sonnerToast.loading("Adding location to campaign...");
      
      // Call the contract to add the location to the campaign
      const txHash = await boothRegistryAddLocation(campaignId, deviceId);
      
      if (!txHash) {
        throw new Error("Transaction failed");
      }
      
      toastNotification(
        "Location addition requested",
        { description: `Booth #${deviceId} is being added to the campaign` },
        "info"
      );
      
      // Refresh data after a delay to allow transaction to be processed
      setTimeout(refreshData, 5000);
      
      return true;
    } catch (error: any) {
      console.error("Error adding location to campaign:", error);
      toastNotification(
        "Failed to add location", 
        { description: error.message || "Transaction failed" },
        "error"
      );
      return false;
    }
  };

  const removeLocationFromCampaign = async (campaignId: number, deviceId: number) => {
    if (!service?.isConnected) {
      toastNotification(
        "Not Connected",
        { description: "Please connect your wallet to perform this action." },
        "warning"
      );
      return false;
    }
    
    try {
      sonnerToast.loading("Removing location from campaign...");
      
      // Call the contract to remove the location from the campaign
      const txHash = await boothRegistryRemoveLocation(campaignId, deviceId);
      
      if (!txHash) {
        throw new Error("Transaction failed");
      }
      
      toastNotification(
        "Location removal requested",
        { description: `Booth #${deviceId} is being removed from the campaign` },
        "info"
      );
      
      // Refresh data after a delay to allow transaction to be processed
      setTimeout(refreshData, 5000);
      
      return true;
    } catch (error: any) {
      console.error("Error removing location from campaign:", error);
      toastNotification(
        "Failed to remove location", 
        { description: error.message || "Transaction failed" },
        "error"
      );
      return false;
    }
  };

  return {
    isLoading: isLoading || isServiceLoading || isActivating || isDeactivating || isCreatingCampaign || isAddingLocation || isRemovingLocation,
    error: error || serviceError,
    stats,
    displayLocations,
    performanceData,
    refreshData,
    activateBooth,
    deactivateBooth,
    createCampaign,
    addLocationToCampaign,
    removeLocationFromCampaign,
    userCampaigns
  };
}