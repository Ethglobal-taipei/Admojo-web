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
import { Badge } from '@/components/ui/badge';
import { BoothStatus } from '@/lib/blockchain';
import { Skeleton } from '@/components/ui/skeleton';

export default function ProviderLocations() {
  const {
    // Read operations
    getBoothDetails,
    getMyProviderLocations,
    
    // Write operations
    activateBooth,
    deactivateBooth,
    
    // Data
    boothDetails,
    myLocations,
    
    // Loading states
    isLoadingMyLocations,
    isLoadingBooth,
    isActivating,
    isDeactivating,
    
    // Transaction status
    isTransactionPending
  } = useBoothRegistry();
  
  // State for booth details
  const [selectedBoothId, setSelectedBoothId] = useState<number | null>(null);
  const [locationDetails, setLocationDetails] = useState<{ [id: number]: any }>({});
  const [isLoadingDetails, setIsLoadingDetails] = useState<{ [id: number]: boolean }>({});
  
  // Load provider locations on mount
  useEffect(() => {
    getMyProviderLocations();
  }, [getMyProviderLocations]);
  
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

  // Get status badge color
  const getStatusBadgeVariant = (status: BoothStatus) => {
    switch (status) {
      case BoothStatus.Unbooked:
        return 'secondary';
      case BoothStatus.Booked:
        return 'default';
      case BoothStatus.UnderMaintenance:
        return 'destructive';
      default:
        return 'outline';
    }
  };
  
  // Handle viewing booth details
  const handleViewDetails = async (id: number) => {
    setSelectedBoothId(id);
    
    // Check if we already have the details
    if (!locationDetails[id]) {
      setIsLoadingDetails({ ...isLoadingDetails, [id]: true });
      
      try {
        const details = await getBoothDetails(id);
        if (details) {
          setLocationDetails({
            ...locationDetails,
            [id]: details
          });
        }
      } catch (error) {
        console.error(`Error fetching details for booth ${id}:`, error);
      } finally {
        setIsLoadingDetails({ ...isLoadingDetails, [id]: false });
      }
    }
  };
  
  // Handle booth activation
  const handleActivateBooth = async (id: number) => {
    try {
      await activateBooth(id);
      
      // Refresh the booth details after activation
      const details = await getBoothDetails(id);
      if (details) {
        setLocationDetails({
          ...locationDetails,
          [id]: details
        });
      }
    } catch (error) {
      console.error(`Error activating booth ${id}:`, error);
    }
  };
  
  // Handle booth deactivation
  const handleDeactivateBooth = async (id: number) => {
    try {
      await deactivateBooth(id);
      
      // Refresh the booth details after deactivation
      const details = await getBoothDetails(id);
      if (details) {
        setLocationDetails({
          ...locationDetails,
          [id]: details
        });
      }
    } catch (error) {
      console.error(`Error deactivating booth ${id}:`, error);
    }
  };
  
  // Render loading skeleton
  const renderSkeleton = () => (
    <div className="space-y-3">
      {[1, 2, 3].map((i) => (
        <Card key={i}>
          <CardContent className="p-4">
            <div className="flex justify-between items-center">
              <div className="space-y-2">
                <Skeleton className="h-4 w-20" />
                <Skeleton className="h-3 w-40" />
              </div>
              <Skeleton className="h-8 w-24" />
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
  
  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>My Advertising Locations</CardTitle>
          <CardDescription>
            Manage your registered advertising booths
          </CardDescription>
        </CardHeader>
        <CardContent>
          {isLoadingMyLocations ? (
            renderSkeleton()
          ) : myLocations && myLocations.length > 0 ? (
            <div className="space-y-4">
              {myLocations.map((id) => (
                <Card key={id} className={selectedBoothId === id ? 'border-2 border-primary' : ''}>
                  <CardContent className="p-4">
                    <div className="flex justify-between items-center">
                      <div>
                        <h3 className="text-lg font-medium">Location ID: {id}</h3>
                        {locationDetails[id] && (
                          <div className="text-sm text-muted-foreground">
                            {locationDetails[id].metadata.location}, 
                            {locationDetails[id].metadata.displaySize}
                          </div>
                        )}
                      </div>
                      <Button 
                        variant="outline" 
                        size="sm"
                        onClick={() => handleViewDetails(id)}
                      >
                        {isLoadingDetails[id] ? 'Loading...' : 'View Details'}
                      </Button>
                    </div>
                    
                    {selectedBoothId === id && locationDetails[id] && (
                      <div className="mt-4 pt-4 border-t">
                        <div className="grid grid-cols-2 gap-x-4 gap-y-2">
                          <div className="text-sm font-medium">Status:</div>
                          <div className="text-sm">
                            <Badge variant={getStatusBadgeVariant(locationDetails[id].status)}>
                              {getStatusText(locationDetails[id].status)}
                            </Badge>
                          </div>
                          
                          <div className="text-sm font-medium">Active:</div>
                          <div className="text-sm">
                            <Badge variant={locationDetails[id].active ? 'default' : 'secondary'} 
                                  className={locationDetails[id].active ? 'bg-green-600 hover:bg-green-700' : ''}>
                              {locationDetails[id].active ? 'Yes' : 'No'}
                            </Badge>
                          </div>
                          
                          {locationDetails[id].metadata.additionalInfo && (
                            <>
                              <div className="text-sm font-medium">Info:</div>
                              <div className="text-sm">{locationDetails[id].metadata.additionalInfo}</div>
                            </>
                          )}
                        </div>
                        
                        <div className="mt-4 flex space-x-2">
                          <Button 
                            size="sm" 
                            disabled={
                              locationDetails[id].active || 
                              isActivating || 
                              isDeactivating || 
                              isTransactionPending()
                            }
                            onClick={() => handleActivateBooth(id)}
                          >
                            {isActivating ? 'Activating...' : 'Activate'}
                          </Button>
                          <Button 
                            size="sm" 
                            variant="destructive" 
                            disabled={
                              !locationDetails[id].active || 
                              isActivating || 
                              isDeactivating || 
                              isTransactionPending()
                            }
                            onClick={() => handleDeactivateBooth(id)}
                          >
                            {isDeactivating ? 'Deactivating...' : 'Deactivate'}
                          </Button>
                        </div>
                      </div>
                    )}
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : (
            <div className="text-center py-8">
              <p className="text-muted-foreground">You don't have any registered locations.</p>
              <Button 
                className="mt-4" 
                onClick={() => window.location.href = '/my-locations/register'}
              >
                Register New Location
              </Button>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
  }
  
  