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
import { Textarea } from '@/components/ui/textarea';
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from '@/components/ui/select';
import { CampaignMetadata } from '@/lib/blockchain/types';

export function CampaignDemo() {
  const {
    // Campaign operations
    createCampaign,
    getCampaignDetails,
    getAllCampaigns,
    addLocationToCampaign,
    removeLocationFromCampaign,

    // Location operations
    getAllBooths,
    getActiveBooths,
    
    // Campaign data
    campaignDetails,
    allCampaigns,
    
    // Booth data
    allBooths,
    activeBooths,
    
    // Loading states
    isCreatingCampaign,
    isAddingLocation,
    isRemovingLocation,
    isLoadingCampaign,
    isLoadingAllCampaigns,
    isLoadingAllBooths,
    isLoadingActiveBooths
  } = useBoothRegistry();
  
  // Form state for creating a campaign
  const [campaignName, setCampaignName] = useState<string>('');
  const [campaignDescription, setCampaignDescription] = useState<string>('');
  const [contentURI, setContentURI] = useState<string>('');
  const [duration, setDuration] = useState<string>('30');
  
  // Form state for campaign details - store as number to avoid conversion issues
  const [campaignId, setCampaignId] = useState<number | null>(null);
  const [campaignIdInput, setCampaignIdInput] = useState<string>('');
  
  // Form state for adding location to campaign - store as numbers to avoid conversion issues
  const [selectedCampaignId, setSelectedCampaignId] = useState<number | null>(null);
  const [selectedLocationId, setSelectedLocationId] = useState<number | null>(null);
  
  // Load data on mount
  useEffect(() => {
    getAllCampaigns();
    getAllBooths();
    getActiveBooths();
  }, [getAllCampaigns, getAllBooths, getActiveBooths]);
  
  // Handle campaign creation
  const handleCreateCampaign = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!campaignName || !campaignDescription || !contentURI || !duration) {
      alert('Please fill out all fields');
      return;
    }
    
    try {
      // Create metadata object with proper types
      const metadata: CampaignMetadata = {
        name: campaignName,
        description: campaignDescription,
        contentURI,
        startDate: BigInt(Math.floor(Date.now() / 1000)), // Convert timestamp to BigInt
        duration: parseInt(duration)
      };
      
      await createCampaign(metadata, []);
      
      // Clear form
      setCampaignName('');
      setCampaignDescription('');
      setContentURI('');
      setDuration('30');
      
      // Refresh campaign list
      getAllCampaigns();
    } catch (error) {
      console.error('Error creating campaign:', error);
    }
  };
  
  // Handle campaign lookup
  const handleLookupCampaign = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!campaignIdInput) {
      alert('Please enter a Campaign ID');
      return;
    }
    
    try {
      const id = parseInt(campaignIdInput, 10);
      if (isNaN(id)) {
        alert('Please enter a valid number for Campaign ID');
        return;
      }
      
      setCampaignId(id);
      await getCampaignDetails(id);
    } catch (error) {
      console.error('Error looking up campaign:', error);
    }
  };
  
  // Handle adding location to campaign
  const handleAddLocation = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (selectedCampaignId === null || selectedLocationId === null) {
      alert('Please select both a campaign and a location');
      return;
    }
    
    try {
      await addLocationToCampaign(selectedCampaignId, selectedLocationId);
      
      // Refresh campaign details if currently viewing this campaign
      if (campaignId === selectedCampaignId) {
        getCampaignDetails(campaignId);
      }
    } catch (error) {
      console.error('Error adding location to campaign:', error);
    }
  };
  
  // Handle removing location from campaign
  const handleRemoveLocation = async (campaignId: number, locationId: number) => {
    try {
      await removeLocationFromCampaign(campaignId, locationId);
      
      // Refresh campaign details
      getCampaignDetails(campaignId);
    } catch (error) {
      console.error('Error removing location from campaign:', error);
    }
  };
  
  return (
    <div className="space-y-8">
      <Card>
        <CardHeader>
          <CardTitle>Create New Campaign</CardTitle>
          <CardDescription>Create a new advertising campaign on the blockchain</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleCreateCampaign} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="campaignName">Campaign Name</Label>
              <Input 
                id="campaignName"
                value={campaignName}
                onChange={(e) => setCampaignName(e.target.value)}
                placeholder="Enter campaign name"
                disabled={isCreatingCampaign}
                required
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="campaignDescription">Description</Label>
              <Textarea 
                id="campaignDescription"
                value={campaignDescription}
                onChange={(e) => setCampaignDescription(e.target.value)}
                placeholder="Enter campaign description"
                disabled={isCreatingCampaign}
                required
                rows={3}
              />
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="contentURI">Content URI</Label>
                <Input 
                  id="contentURI"
                  value={contentURI}
                  onChange={(e) => setContentURI(e.target.value)}
                  placeholder="e.g., https://example.com/ad.mp4"
                  disabled={isCreatingCampaign}
                  required
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="duration">Duration (days)</Label>
                <Input 
                  id="duration"
                  type="number"
                  min="1"
                  value={duration}
                  onChange={(e) => setDuration(e.target.value)}
                  placeholder="Enter campaign duration in days"
                  disabled={isCreatingCampaign}
                  required
                />
              </div>
            </div>
            
            <Button type="submit" disabled={isCreatingCampaign}>
              {isCreatingCampaign ? 'Creating...' : 'Create Campaign'}
            </Button>
          </form>
        </CardContent>
      </Card>
      
      <Card>
        <CardHeader>
          <CardTitle>Campaign Details</CardTitle>
          <CardDescription>Lookup details for a specific campaign</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleLookupCampaign} className="space-y-4">
            <div className="flex space-x-4">
              <div className="flex-1 space-y-2">
                <Label htmlFor="campaignIdInput">Campaign ID</Label>
                <Input 
                  id="campaignIdInput"
                  type="number"
                  value={campaignIdInput}
                  onChange={(e) => setCampaignIdInput(e.target.value)}
                  placeholder="Enter campaign ID to lookup"
                  disabled={isLoadingCampaign}
                  required
                />
              </div>
              <div className="self-end">
                <Button type="submit" disabled={isLoadingCampaign}>
                  {isLoadingCampaign ? 'Loading...' : 'Lookup'}
                </Button>
              </div>
            </div>
          </form>
          
          {campaignDetails && (
            <div className="mt-6 p-4 border rounded-md">
              <h3 className="text-lg font-medium">Campaign Details</h3>
              <dl className="grid grid-cols-2 gap-x-4 gap-y-2 mt-2">
                <dt className="text-sm font-medium text-gray-500">Campaign ID:</dt>
                <dd>{campaignDetails.id}</dd>
                
                <dt className="text-sm font-medium text-gray-500">Name:</dt>
                <dd>{campaignDetails.metadata.name}</dd>
                
                <dt className="text-sm font-medium text-gray-500">Description:</dt>
                <dd>{campaignDetails.metadata.description}</dd>
                
                <dt className="text-sm font-medium text-gray-500">Content URI:</dt>
                <dd className="truncate">{campaignDetails.metadata.contentURI}</dd>
                
                <dt className="text-sm font-medium text-gray-500">Start Date:</dt>
                <dd>{new Date(Number(campaignDetails.metadata.startDate) * 1000).toLocaleString()}</dd>
                
                <dt className="text-sm font-medium text-gray-500">Duration:</dt>
                <dd>{campaignDetails.metadata.duration} days</dd>
                
                <dt className="text-sm font-medium text-gray-500">Advertiser:</dt>
                <dd className="truncate">{campaignDetails.advertiser}</dd>
                
                <dt className="text-sm font-medium text-gray-500">Active:</dt>
                <dd>{campaignDetails.active ? 'Yes' : 'No'}</dd>
                
                <dt className="text-sm font-medium text-gray-500">Booked Locations:</dt>
                <dd>{campaignDetails.bookedLocations.length}</dd>
              </dl>
              
              {campaignDetails.bookedLocations.length > 0 && (
                <div className="mt-4">
                  <h4 className="text-md font-medium">Booked Locations</h4>
                  <div className="mt-2 space-y-2">
                    {campaignDetails.bookedLocations.map(locationId => (
                      <div key={locationId} className="flex justify-between items-center p-2 bg-gray-50 rounded">
                        <span>Device ID: {locationId}</span>
                        <Button 
                          size="sm" 
                          variant="destructive" 
                          disabled={isRemovingLocation}
                          onClick={() => handleRemoveLocation(Number(campaignDetails.id), locationId)}
                        >
                          Remove
                        </Button>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </CardContent>
      </Card>
      
      <Card>
        <CardHeader>
          <CardTitle>Add Location to Campaign</CardTitle>
          <CardDescription>Book a location for an existing campaign</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleAddLocation} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="selectedCampaignId">Campaign</Label>
                <Select 
                  value={selectedCampaignId !== null ? selectedCampaignId.toString() : ''} 
                  onValueChange={(value) => setSelectedCampaignId(parseInt(value, 10))}
                  disabled={isAddingLocation || !allCampaigns || allCampaigns.length === 0}
                >
                  <SelectTrigger id="selectedCampaignId">
                    <SelectValue placeholder="Select campaign" />
                  </SelectTrigger>
                  <SelectContent>
                    {allCampaigns && allCampaigns.map(campaign => (
                      <SelectItem key={campaign.id} value={Number(campaign.id).toString()}>
                        {campaign.id}: {campaign.metadata.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="selectedLocationId">Location</Label>
                <Select 
                  value={selectedLocationId !== null ? selectedLocationId.toString() : ''} 
                  onValueChange={(value) => setSelectedLocationId(parseInt(value, 10))}
                  disabled={isAddingLocation || !activeBooths || activeBooths.length === 0}
                >
                  <SelectTrigger id="selectedLocationId">
                    <SelectValue placeholder="Select location" />
                  </SelectTrigger>
                  <SelectContent>
                    {activeBooths && activeBooths.map(boothId => (
                      <SelectItem key={boothId} value={boothId.toString()}>
                        Device ID: {boothId}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            
            <Button 
              type="submit" 
              disabled={isAddingLocation || selectedCampaignId === null || selectedLocationId === null}
            >
              {isAddingLocation ? 'Adding...' : 'Add Location to Campaign'}
            </Button>
          </form>
        </CardContent>
      </Card>
      
      <Card>
        <CardHeader>
          <CardTitle>All Campaigns</CardTitle>
          <CardDescription>
            List of all campaigns ({isLoadingAllCampaigns ? 'Loading...' : allCampaigns?.length || 0})
          </CardDescription>
        </CardHeader>
        <CardContent>
          {isLoadingAllCampaigns ? (
            <div className="text-center py-4">Loading campaigns...</div>
          ) : allCampaigns && allCampaigns.length > 0 ? (
            <div className="space-y-2">
              {allCampaigns.map((campaign) => (
                <div 
                  key={campaign.id} 
                  className="p-3 border rounded-md"
                >
                  <div className="font-medium">{campaign.metadata.name}</div>
                  <div className="text-sm text-gray-500 truncate">
                    {campaign.metadata.description}
                  </div>
                  <div className="text-xs">
                    ID: {campaign.id}, 
                    {campaign.active ? ' Active' : ' Inactive'},
                    Locations: {campaign.bookedLocations.length}
                  </div>
                  <Button 
                    size="sm" 
                    className="mt-2"
                    onClick={() => {
                      setCampaignIdInput(campaign.id.toString());
                      setCampaignId(Number(campaign.id));
                      getCampaignDetails(Number(campaign.id));
                    }}
                  >
                    View Details
                  </Button>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-4">No campaigns found</div>
          )}
        </CardContent>
      </Card>
    </div>
  );
} 