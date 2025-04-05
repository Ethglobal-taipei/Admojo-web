'use client';

import React, { useEffect, useState } from 'react';
import { useBoothRegistry } from '@/hooks';
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
import { BoothMetadata, BoothStatus } from '@/lib/blockchain';

export function BoothRegistryDemo() {
  const {
    // Write operations
    registerBooth,
    activateBooth,
    deactivateBooth,
    
    // Read operations
    getBoothDetails,
    getAllBooths,
    getActiveBooths,
    
    // Data
    boothDetails,
    allBooths,
    activeBooths,
    
    // Loading states
    isRegistering,
    isActivating,
    isDeactivating,
    isLoadingBooth,
    isLoadingAllBooths,
    isLoadingActiveBooths,
    
    // Transaction status
    isTransactionPending
  } = useBoothRegistry();
  
  // Form state
  const [deviceId, setDeviceId] = useState<string>('');
  const [location, setLocation] = useState<string>('');
  const [displaySize, setDisplaySize] = useState<string>('');
  const [searchId, setSearchId] = useState<string>('');
  
  // Load data on mount
  useEffect(() => {
    getAllBooths();
    getActiveBooths();
  }, [getAllBooths, getActiveBooths]);
  
  // Handle booth registration
  const handleRegisterBooth = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!deviceId || !location || !displaySize) {
      alert('Please fill out all fields');
      return;
    }
    
    try {
      const metadata: BoothMetadata = {
        location,
        displaySize,
        additionalInfo: `Registered on ${new Date().toISOString()}`
      };
      
      await registerBooth(Number(deviceId), metadata);
      
      // Clear form
      setDeviceId('');
      setLocation('');
      setDisplaySize('');
      
      // Refresh data
      getAllBooths();
      getActiveBooths();
    } catch (error) {
      console.error('Error registering booth:', error);
    }
  };
  
  // Handle booth lookup
  const handleLookupBooth = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!searchId) {
      alert('Please enter a Device ID');
      return;
    }
    
    try {
      await getBoothDetails(Number(searchId));
    } catch (error) {
      console.error('Error looking up booth:', error);
    }
  };
  
  // Handle booth activation
  const handleActivateBooth = async (id: number) => {
    try {
      await activateBooth(id);
      
      // Refresh data after activation
      getActiveBooths();
      if (searchId && Number(searchId) === id) {
        getBoothDetails(id);
      }
    } catch (error) {
      console.error('Error activating booth:', error);
    }
  };
  
  // Handle booth deactivation
  const handleDeactivateBooth = async (id: number) => {
    try {
      await deactivateBooth(id);
      
      // Refresh data after deactivation
      getActiveBooths();
      if (searchId && Number(searchId) === id) {
        getBoothDetails(id);
      }
    } catch (error) {
      console.error('Error deactivating booth:', error);
    }
  };
  
  // Get status text
  const getStatusText = (status: BoothStatus) => {
    switch (status) {
      case BoothStatus.Unbooked:
        return 'Unbooked';
      case BoothStatus.Booked:
        return 'Booked';
      case BoothStatus.UnderMaintenance:
        return 'Under Maintenance';
      default:
        return 'Unknown';
    }
  };
  
  return (
    <div className="space-y-8">
      <Card>
        <CardHeader>
          <CardTitle>Register New Booth</CardTitle>
          <CardDescription>Register a new advertising booth on the blockchain</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleRegisterBooth} className="space-y-4">
            <div className="grid grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label htmlFor="deviceId">Device ID</Label>
                <Input 
                  id="deviceId"
                  type="number"
                  value={deviceId}
                  onChange={(e) => setDeviceId(e.target.value)}
                  placeholder="Enter device ID"
                  disabled={isRegistering}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="location">Location</Label>
                <Input 
                  id="location"
                  value={location}
                  onChange={(e) => setLocation(e.target.value)}
                  placeholder="e.g., New York City"
                  disabled={isRegistering}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="displaySize">Display Size</Label>
                <Input 
                  id="displaySize"
                  value={displaySize}
                  onChange={(e) => setDisplaySize(e.target.value)}
                  placeholder="e.g., 1920x1080"
                  disabled={isRegistering}
                  required
                />
              </div>
            </div>
            <Button type="submit" disabled={isRegistering}>
              {isRegistering ? 'Registering...' : 'Register Booth'}
            </Button>
          </form>
        </CardContent>
      </Card>
      
      <Card>
        <CardHeader>
          <CardTitle>Lookup Booth</CardTitle>
          <CardDescription>Look up details for a specific booth</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleLookupBooth} className="space-y-4">
            <div className="flex space-x-4">
              <div className="flex-1 space-y-2">
                <Label htmlFor="searchId">Device ID</Label>
                <Input 
                  id="searchId"
                  type="number"
                  value={searchId}
                  onChange={(e) => setSearchId(e.target.value)}
                  placeholder="Enter device ID to lookup"
                  disabled={isLoadingBooth}
                  required
                />
              </div>
              <div className="self-end">
                <Button type="submit" disabled={isLoadingBooth}>
                  {isLoadingBooth ? 'Loading...' : 'Lookup'}
                </Button>
              </div>
            </div>
          </form>
          
          {boothDetails && (
            <div className="mt-6 p-4 border rounded-md">
              <h3 className="text-lg font-medium">Booth Details</h3>
              <dl className="grid grid-cols-2 gap-x-4 gap-y-2 mt-2">
                <dt className="text-sm font-medium text-gray-500">Device ID:</dt>
                <dd>{boothDetails.deviceId}</dd>
                
                <dt className="text-sm font-medium text-gray-500">Location:</dt>
                <dd>{boothDetails.metadata.location}</dd>
                
                <dt className="text-sm font-medium text-gray-500">Display Size:</dt>
                <dd>{boothDetails.metadata.displaySize}</dd>
                
                <dt className="text-sm font-medium text-gray-500">Owner:</dt>
                <dd className="truncate">{boothDetails.owner}</dd>
                
                <dt className="text-sm font-medium text-gray-500">Status:</dt>
                <dd>{getStatusText(boothDetails.status)}</dd>
                
                <dt className="text-sm font-medium text-gray-500">Active:</dt>
                <dd>{boothDetails.active ? 'Yes' : 'No'}</dd>
              </dl>
              
              <div className="mt-4 space-x-2">
                <Button 
                  size="sm" 
                  disabled={boothDetails.active || isActivating || isDeactivating}
                  onClick={() => handleActivateBooth(boothDetails.deviceId)}
                >
                  {isActivating ? 'Activating...' : 'Activate'}
                </Button>
                <Button 
                  size="sm" 
                  variant="destructive" 
                  disabled={!boothDetails.active || isActivating || isDeactivating}
                  onClick={() => handleDeactivateBooth(boothDetails.deviceId)}
                >
                  {isDeactivating ? 'Deactivating...' : 'Deactivate'}
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
      
      <Card>
        <CardHeader>
          <CardTitle>All Booths</CardTitle>
          <CardDescription>
            List of all booths ({isLoadingAllBooths ? 'Loading...' : allBooths?.length || 0})
          </CardDescription>
        </CardHeader>
        <CardContent>
          {isLoadingAllBooths ? (
            <div className="text-center py-4">Loading booths...</div>
          ) : allBooths && allBooths.length > 0 ? (
            <div className="space-y-2">
              {allBooths.map((booth) => (
                <div 
                  key={booth.deviceId} 
                  className="p-3 border rounded-md flex justify-between items-center"
                >
                  <div>
                    <div className="font-medium">Device ID: {booth.deviceId}</div>
                    <div className="text-sm text-gray-500">
                      {booth.metadata.location} ({booth.metadata.displaySize})
                    </div>
                    <div className="text-xs">
                      Status: {getStatusText(booth.status)}, 
                      {booth.active ? ' Active' : ' Inactive'}
                    </div>
                  </div>
                  <div className="space-x-2">
                    <Button 
                      size="sm" 
                      disabled={booth.active || isActivating}
                      onClick={() => handleActivateBooth(booth.deviceId)}
                    >
                      Activate
                    </Button>
                    <Button 
                      size="sm" 
                      variant="destructive" 
                      disabled={!booth.active || isDeactivating}
                      onClick={() => handleDeactivateBooth(booth.deviceId)}
                    >
                      Deactivate
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-4">No booths found</div>
          )}
        </CardContent>
      </Card>
      
      <Card>
        <CardHeader>
          <CardTitle>Active Booths</CardTitle>
          <CardDescription>
            List of active booths ({isLoadingActiveBooths ? 'Loading...' : activeBooths?.length || 0})
          </CardDescription>
        </CardHeader>
        <CardContent>
          {isLoadingActiveBooths ? (
            <div className="text-center py-4">Loading active booths...</div>
          ) : activeBooths && activeBooths.length > 0 ? (
            <div className="space-y-2">
              {activeBooths.map((id) => (
                <div key={id} className="p-3 border rounded-md">
                  <div className="font-medium">Device ID: {id}</div>
                  <Button 
                    size="sm" 
                    className="mt-2"
                    onClick={() => {
                      setSearchId(id.toString());
                      getBoothDetails(id);
                    }}
                  >
                    View Details
                  </Button>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-4">No active booths found</div>
          )}
        </CardContent>
      </Card>
    </div>
  );
} 