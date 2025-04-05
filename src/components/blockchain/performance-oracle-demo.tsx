'use client';

import React, { useEffect, useState } from 'react';
import { usePerformanceOracle } from '@/hooks';
import { 
  Card, 
  CardContent, 
  CardDescription, 
  CardHeader, 
  CardTitle 
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from '@/components/ui/select';

export function PerformanceOracleDemo() {
  const {
    // Write operations
    updateMetrics,
    
    // Read operations
    getMetrics,
    getAggregatedMetrics,
    getDailyMetrics,
    getWeeklyMetrics,
    
    // Data
    metrics,
    aggregatedMetrics,
    dailyMetrics,
    weeklyMetrics,
    
    // Loading states
    isUpdatingMetrics,
    isLoadingMetrics,
    isLoadingAggregatedMetrics,
    isLoadingDailyMetrics,
    isLoadingWeeklyMetrics
  } = usePerformanceOracle();
  
  // Form state
  const [deviceId, setDeviceId] = useState<string>('');
  const [views, setViews] = useState<string>('0');
  const [taps, setTaps] = useState<string>('0');
  
  // Metrics lookup state
  const [lookupDeviceId, setLookupDeviceId] = useState<string>('');
  const [lookupType, setLookupType] = useState<string>('specific');
  const [timestamp, setTimestamp] = useState<string>('');
  const [startTime, setStartTime] = useState<string>('');
  const [endTime, setEndTime] = useState<string>('');
  
  // Handle metric update
  const handleUpdateMetrics = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!deviceId) {
      alert('Please enter a device ID');
      return;
    }
    
    try {
      // Use current timestamp if not provided
      const currentTimestamp = Math.floor(Date.now() / 1000);
      
      await updateMetrics(
        Number(deviceId),
        currentTimestamp,
        Number(views),
        Number(taps)
      );
      
      // Reset form
      setViews('0');
      setTaps('0');
    } catch (error) {
      console.error('Error updating metrics:', error);
    }
  };
  
  // Handle metrics lookup
  const handleLookupMetrics = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!lookupDeviceId) {
      alert('Please enter a device ID');
      return;
    }
    
    const deviceIdNum = Number(lookupDeviceId);
    
    try {
      switch (lookupType) {
        case 'specific':
          if (!timestamp) {
            alert('Please enter a timestamp');
            return;
          }
          await getMetrics(deviceIdNum, Number(timestamp));
          break;
          
        case 'aggregated':
          if (!startTime || !endTime) {
            alert('Please enter both start and end times');
            return;
          }
          await getAggregatedMetrics(
            deviceIdNum,
            Number(startTime),
            Number(endTime)
          );
          break;
          
        case 'daily':
          await getDailyMetrics(deviceIdNum);
          break;
          
        case 'weekly':
          await getWeeklyMetrics(deviceIdNum);
          break;
      }
    } catch (error) {
      console.error('Error looking up metrics:', error);
    }
  };
  
  // Format date from timestamp
  const formatDate = (timestamp: number) => {
    return new Date(timestamp * 1000).toLocaleString();
  };
  
  // Set current timestamp for convenience
  useEffect(() => {
    const now = Math.floor(Date.now() / 1000);
    setTimestamp(now.toString());
    
    // Set start time to 24 hours ago, end time to now
    const oneDayAgo = now - 86400;
    setStartTime(oneDayAgo.toString());
    setEndTime(now.toString());
  }, []);
  
  return (
    <div className="space-y-8">
      <Card>
        <CardHeader>
          <CardTitle>Update Metrics</CardTitle>
          <CardDescription>Update performance metrics for a device</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleUpdateMetrics} className="space-y-4">
            <div className="grid grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label htmlFor="deviceId">Device ID</Label>
                <Input 
                  id="deviceId"
                  type="number"
                  value={deviceId}
                  onChange={(e) => setDeviceId(e.target.value)}
                  placeholder="Enter device ID"
                  disabled={isUpdatingMetrics}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="views">Views</Label>
                <Input 
                  id="views"
                  type="number"
                  min="0"
                  value={views}
                  onChange={(e) => setViews(e.target.value)}
                  disabled={isUpdatingMetrics}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="taps">Taps</Label>
                <Input 
                  id="taps"
                  type="number"
                  min="0"
                  value={taps}
                  onChange={(e) => setTaps(e.target.value)}
                  disabled={isUpdatingMetrics}
                  required
                />
              </div>
            </div>
            
            <div className="text-sm text-gray-500">
              Note: Current timestamp will be used for the metrics update.
            </div>
            
            <Button type="submit" disabled={isUpdatingMetrics}>
              {isUpdatingMetrics ? 'Updating...' : 'Update Metrics'}
            </Button>
          </form>
        </CardContent>
      </Card>
      
      <Card>
        <CardHeader>
          <CardTitle>Lookup Metrics</CardTitle>
          <CardDescription>Look up performance metrics for a device</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleLookupMetrics} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="lookupDeviceId">Device ID</Label>
                <Input 
                  id="lookupDeviceId"
                  type="number"
                  value={lookupDeviceId}
                  onChange={(e) => setLookupDeviceId(e.target.value)}
                  placeholder="Enter device ID"
                  disabled={isLoadingMetrics || isLoadingAggregatedMetrics}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="lookupType">Metrics Type</Label>
                <Select 
                  value={lookupType} 
                  onValueChange={setLookupType}
                  disabled={isLoadingMetrics || isLoadingAggregatedMetrics}
                >
                  <SelectTrigger id="lookupType">
                    <SelectValue placeholder="Select type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="specific">Specific Timestamp</SelectItem>
                    <SelectItem value="aggregated">Time Range</SelectItem>
                    <SelectItem value="daily">Daily (Today)</SelectItem>
                    <SelectItem value="weekly">Weekly</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            
            {lookupType === 'specific' && (
              <div className="space-y-2">
                <Label htmlFor="timestamp">Timestamp (Unix epoch seconds)</Label>
                <Input 
                  id="timestamp"
                  type="number"
                  value={timestamp}
                  onChange={(e) => setTimestamp(e.target.value)}
                  placeholder="Enter timestamp"
                  disabled={isLoadingMetrics}
                  required
                />
                <div className="text-xs text-gray-500">
                  {timestamp ? `Date: ${formatDate(Number(timestamp))}` : ''}
                </div>
              </div>
            )}
            
            {lookupType === 'aggregated' && (
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="startTime">Start Time (Unix epoch seconds)</Label>
                  <Input 
                    id="startTime"
                    type="number"
                    value={startTime}
                    onChange={(e) => setStartTime(e.target.value)}
                    placeholder="Enter start time"
                    disabled={isLoadingAggregatedMetrics}
                    required
                  />
                  <div className="text-xs text-gray-500">
                    {startTime ? `Date: ${formatDate(Number(startTime))}` : ''}
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="endTime">End Time (Unix epoch seconds)</Label>
                  <Input 
                    id="endTime"
                    type="number"
                    value={endTime}
                    onChange={(e) => setEndTime(e.target.value)}
                    placeholder="Enter end time"
                    disabled={isLoadingAggregatedMetrics}
                    required
                  />
                  <div className="text-xs text-gray-500">
                    {endTime ? `Date: ${formatDate(Number(endTime))}` : ''}
                  </div>
                </div>
              </div>
            )}
            
            <Button 
              type="submit" 
              disabled={
                isLoadingMetrics || 
                isLoadingAggregatedMetrics || 
                isLoadingDailyMetrics || 
                isLoadingWeeklyMetrics
              }
            >
              {(isLoadingMetrics || isLoadingAggregatedMetrics || isLoadingDailyMetrics || isLoadingWeeklyMetrics) 
                ? 'Loading...' 
                : 'Lookup Metrics'}
            </Button>
          </form>
          
          {/* Results */}
          {(metrics || aggregatedMetrics || dailyMetrics || weeklyMetrics) && (
            <div className="mt-6 p-4 border rounded-md">
              <h3 className="text-lg font-medium">Metrics Results</h3>
              
              {metrics && lookupType === 'specific' && (
                <dl className="grid grid-cols-2 gap-x-4 gap-y-2 mt-2">
                  <dt className="text-sm font-medium text-gray-500">Timestamp:</dt>
                  <dd>{formatDate(Number(timestamp))}</dd>
                  
                  <dt className="text-sm font-medium text-gray-500">Views:</dt>
                  <dd>{metrics.views}</dd>
                  
                  <dt className="text-sm font-medium text-gray-500">Taps:</dt>
                  <dd>{metrics.taps}</dd>
                </dl>
              )}
              
              {aggregatedMetrics && lookupType === 'aggregated' && (
                <dl className="grid grid-cols-2 gap-x-4 gap-y-2 mt-2">
                  <dt className="text-sm font-medium text-gray-500">Time Range:</dt>
                  <dd>{formatDate(Number(startTime))} - {formatDate(Number(endTime))}</dd>
                  
                  <dt className="text-sm font-medium text-gray-500">Total Views:</dt>
                  <dd>{aggregatedMetrics.totalViews}</dd>
                  
                  <dt className="text-sm font-medium text-gray-500">Total Taps:</dt>
                  <dd>{aggregatedMetrics.totalTaps}</dd>
                </dl>
              )}
              
              {dailyMetrics && lookupType === 'daily' && (
                <dl className="grid grid-cols-2 gap-x-4 gap-y-2 mt-2">
                  <dt className="text-sm font-medium text-gray-500">Day:</dt>
                  <dd>Today</dd>
                  
                  <dt className="text-sm font-medium text-gray-500">Total Views:</dt>
                  <dd>{dailyMetrics.totalViews}</dd>
                  
                  <dt className="text-sm font-medium text-gray-500">Total Taps:</dt>
                  <dd>{dailyMetrics.totalTaps}</dd>
                </dl>
              )}
              
              {weeklyMetrics && lookupType === 'weekly' && (
                <dl className="grid grid-cols-2 gap-x-4 gap-y-2 mt-2">
                  <dt className="text-sm font-medium text-gray-500">Week:</dt>
                  <dd>Past 7 days</dd>
                  
                  <dt className="text-sm font-medium text-gray-500">Total Views:</dt>
                  <dd>{weeklyMetrics.totalViews}</dd>
                  
                  <dt className="text-sm font-medium text-gray-500">Total Taps:</dt>
                  <dd>{weeklyMetrics.totalTaps}</dd>
                </dl>
              )}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
} 