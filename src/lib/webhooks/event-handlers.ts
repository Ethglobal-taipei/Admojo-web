import { prisma } from '@/lib/prisma';
import axios from 'axios';
import { config } from '@/lib/config';

/**
 * Event handlers for blockchain events
 */
const eventHandlers = {
  /**
   * Handle booth registration event
   */
  onBoothRegistered: async (data: {
    deviceId: number;
    metadata: string;
    owner: string;
    transactionHash: string;
    blockNumber: number;
  }) => {
    console.log('Handling BoothRegistered event:', data);
    
    try {
      // Parse metadata
      const metadata = JSON.parse(data.metadata);
      
      // Update or create location in database
      const location = await prisma.location.upsert({
        where: { deviceId: data.deviceId.toString() },
        update: {
          metadata: metadata,
          owner: data.owner,
          blockchainStatus: 'REGISTERED',
          txHash: data.transactionHash,
          blockNumber: data.blockNumber
        },
        create: {
          deviceId: data.deviceId.toString(),
          metadata: metadata,
          owner: data.owner,
          blockchainStatus: 'REGISTERED',
          txHash: data.transactionHash,
          blockNumber: data.blockNumber
        }
      });
      
      console.log(`Location ${location.id} updated successfully`);
      
      // Forward the event to any configured webhook
      await forwardEventToWebhooks('BOOTH_REGISTERED', data);
      
      return { success: true, location };
    } catch (error) {
      console.error('Error processing BoothRegistered event:', error);
      throw error;
    }
  },
  
  /**
   * Handle booth activation event
   */
  onBoothActivated: async (data: {
    deviceId: number;
    transactionHash: string;
    blockNumber: number;
  }) => {
    console.log('Handling BoothActivated event:', data);
    
    try {
      // Update location status in database
      const location = await prisma.location.update({
        where: { deviceId: data.deviceId.toString() },
        data: {
          blockchainStatus: 'ACTIVE',
          txHash: data.transactionHash,
          blockNumber: data.blockNumber
        }
      });
      
      console.log(`Location ${location.id} activated successfully`);
      
      // Forward the event to any configured webhook
      await forwardEventToWebhooks('BOOTH_ACTIVATED', data);
      
      return { success: true, location };
    } catch (error) {
      console.error('Error processing BoothActivated event:', error);
      throw error;
    }
  },
  
  /**
   * Handle booth deactivation event
   */
  onBoothDeactivated: async (data: {
    deviceId: number;
    transactionHash: string;
    blockNumber: number;
  }) => {
    console.log('Handling BoothDeactivated event:', data);
    
    try {
      // Update location status in database
      const location = await prisma.location.update({
        where: { deviceId: data.deviceId.toString() },
        data: {
          blockchainStatus: 'INACTIVE',
          txHash: data.transactionHash,
          blockNumber: data.blockNumber
        }
      });
      
      console.log(`Location ${location.id} deactivated successfully`);
      
      // Forward the event to any configured webhook
      await forwardEventToWebhooks('BOOTH_DEACTIVATED', data);
      
      return { success: true, location };
    } catch (error) {
      console.error('Error processing BoothDeactivated event:', error);
      throw error;
    }
  },
  
  /**
   * Handle booth status update event
   */
  onBoothStatusUpdated: async (data: {
    deviceId: number;
    status: number;
    transactionHash: string;
    blockNumber: number;
  }) => {
    console.log('Handling BoothStatusUpdated event:', data);
    
    try {
      // Map status number to a string
      const statusMap: Record<number, string> = {
        0: 'MAINTENANCE',
        1: 'OPERATIONAL',
        2: 'OFFLINE'
        // Add more status mappings as needed
      };
      
      const blockchainStatus = statusMap[data.status] || 'UNKNOWN';
      
      // Update location status in database
      const location = await prisma.location.update({
        where: { deviceId: data.deviceId.toString() },
        data: {
          blockchainStatus,
          txHash: data.transactionHash,
          blockNumber: data.blockNumber
        }
      });
      
      console.log(`Location ${location.id} status updated to ${blockchainStatus}`);
      
      // Forward the event to any configured webhook
      await forwardEventToWebhooks('BOOTH_STATUS_UPDATED', data);
      
      return { success: true, location };
    } catch (error) {
      console.error('Error processing BoothStatusUpdated event:', error);
      throw error;
    }
  },
  
  /**
   * Handle campaign creation event
   */
  onCampaignCreated: async (data: {
    campaignId: number;
    advertiser: string;
    metadata: string;
    transactionHash: string;
    blockNumber: number;
  }) => {
    console.log('Handling CampaignCreated event:', data);
    
    try {
      // Parse metadata
      const metadata = JSON.parse(data.metadata);
      
      // Create campaign in database
      const campaign = await prisma.campaign.upsert({
        where: { campaignId: data.campaignId.toString() },
        update: {
          metadata: metadata,
          advertiser: data.advertiser,
          status: 'ACTIVE',
          txHash: data.transactionHash,
          blockNumber: data.blockNumber
        },
        create: {
          campaignId: data.campaignId.toString(),
          metadata: metadata,
          advertiser: data.advertiser,
          status: 'ACTIVE',
          txHash: data.transactionHash,
          blockNumber: data.blockNumber
        }
      });
      
      console.log(`Campaign ${campaign.id} created successfully`);
      
      // Forward the event to any configured webhook
      await forwardEventToWebhooks('CAMPAIGN_CREATED', data);
      
      return { success: true, campaign };
    } catch (error) {
      console.error('Error processing CampaignCreated event:', error);
      throw error;
    }
  },
  
  /**
   * Handle location added to campaign event
   */
  onLocationAddedToCampaign: async (data: {
    campaignId: number;
    deviceId: number;
    transactionHash: string;
    blockNumber: number;
  }) => {
    console.log('Handling LocationAddedToCampaign event:', data);
    
    try {
      // Create campaign location relationship in database
      const campaignLocation = await prisma.campaignLocation.create({
        data: {
          campaignId: data.campaignId.toString(),
          locationId: data.deviceId.toString(),
          txHash: data.transactionHash,
          blockNumber: data.blockNumber
        }
      });
      
      console.log(`Location ${data.deviceId} added to campaign ${data.campaignId}`);
      
      // Forward the event to any configured webhook
      await forwardEventToWebhooks('LOCATION_ADDED_TO_CAMPAIGN', data);
      
      return { success: true, campaignLocation };
    } catch (error) {
      console.error('Error processing LocationAddedToCampaign event:', error);
      throw error;
    }
  },
  
  /**
   * Handle location removed from campaign event
   */
  onLocationRemovedFromCampaign: async (data: {
    campaignId: number;
    deviceId: number;
    transactionHash: string;
    blockNumber: number;
  }) => {
    console.log('Handling LocationRemovedFromCampaign event:', data);
    
    try {
      // Delete campaign location relationship in database
      await prisma.campaignLocation.delete({
        where: {
          campaignId_locationId: {
            campaignId: data.campaignId.toString(),
            locationId: data.deviceId.toString()
          }
        }
      });
      
      console.log(`Location ${data.deviceId} removed from campaign ${data.campaignId}`);
      
      // Forward the event to any configured webhook
      await forwardEventToWebhooks('LOCATION_REMOVED_FROM_CAMPAIGN', data);
      
      return { success: true };
    } catch (error) {
      console.error('Error processing LocationRemovedFromCampaign event:', error);
      throw error;
    }
  },
  
  /**
   * Handle campaign ended event
   */
  onCampaignEnded: async (data: {
    campaignId: number;
    transactionHash: string;
    blockNumber: number;
  }) => {
    console.log('Handling CampaignEnded event:', data);
    
    try {
      // Update campaign status in database
      const campaign = await prisma.campaign.update({
        where: { campaignId: data.campaignId.toString() },
        data: {
          status: 'ENDED',
          txHash: data.transactionHash,
          blockNumber: data.blockNumber
        }
      });
      
      console.log(`Campaign ${campaign.id} ended successfully`);
      
      // Forward the event to any configured webhook
      await forwardEventToWebhooks('CAMPAIGN_ENDED', data);
      
      return { success: true, campaign };
    } catch (error) {
      console.error('Error processing CampaignEnded event:', error);
      throw error;
    }
  }
};

/**
 * Forward events to configured webhook endpoints
 */
async function forwardEventToWebhooks(eventType: string, data: any): Promise<void> {
  const endpoint = config.WEBHOOK_ENDPOINTS[eventType as keyof typeof config.WEBHOOK_ENDPOINTS];
  
  if (!endpoint) {
    console.log(`No webhook endpoint configured for event type: ${eventType}`);
    return;
  }
  
  try {
    console.log(`Forwarding ${eventType} event to webhook: ${endpoint}`);
    
    await axios.post(endpoint, {
      event: eventType,
      data,
      timestamp: new Date().toISOString()
    });
    
    console.log(`Successfully forwarded ${eventType} event to webhook`);
  } catch (error) {
    console.error(`Error forwarding ${eventType} event to webhook:`, error);
    // Don't throw the error to avoid breaking the main event processing
  }
}

export default eventHandlers; 