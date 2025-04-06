import { createBoothRegistryService } from '../blockchain/booth-registry-service';
import { createPerformanceOracleService } from '../blockchain/performance-oracle-service';
import { callMetalAPI } from '../../app/api/metal/route';
import { PrismaClient } from '@prisma/client';
import { type Address } from 'viem';

const prisma = new PrismaClient();

// Enum for blockchain event types
export enum BlockchainEventType {
  MetricsUpdated = 'MetricsUpdated',
  BatchMetricsUpdated = 'BatchMetricsUpdated'
}

// Interface for booth metrics
interface BoothMetrics {
  deviceId: number;
  views: number;
  taps: number;
  booth: any; // Booth details from contract
  provider: any; // Provider details from database
}

// Interface for payment transaction
interface PaymentTransaction {
  campaignId: number;
  deviceId: number;
  amount: number;
  timestamp: number;
  source: Address;
  destination: Address;
  status: 'pending' | 'completed' | 'failed';
  transactionHash?: string;
}

/**
 * Process payments based on a blockchain event
 * @param eventType The type of event
 * @param eventParams Event parameters
 * @param metadata Additional event metadata
 */
export async function processPaymentsForEvent(
  eventType: BlockchainEventType,
  eventParams: any,
  metadata: { transactionHash: string; blockNumber: number }
): Promise<boolean> {
  console.log(`Processing payments for ${eventType} event`, { eventParams, metadata });

  try {
    switch (eventType) {
      case BlockchainEventType.MetricsUpdated:
        // Process payments for a single device update
        return await processSingleDevicePayment(
          eventParams.deviceId,
          eventParams.timestamp,
          eventParams.views,
          eventParams.taps,
          metadata
        );

      case BlockchainEventType.BatchMetricsUpdated:
        // Process payments for batch updates
        return await processBatchPayments(
          eventParams.timestamp,
          eventParams.rawData,
          metadata
        );

      default:
        console.warn(`Unknown event type: ${eventType}`);
        return false;
    }
  } catch (error) {
    console.error(`Error processing payments for ${eventType} event:`, error);
    return false;
  }
}

/**
 * Process payments for a single device update
 */
async function processSingleDevicePayment(
  deviceId: number,
  timestamp: number,
  views: number,
  taps: number,
  metadata: { transactionHash: string; blockNumber: number }
): Promise<boolean> {
  try {
    console.log(`Processing payment for device ${deviceId} with ${views} views and ${taps} taps`);

    // Initialize blockchain services
    const boothRegistry = createBoothRegistryService(process.env.RPC_URL);
    
    // Find which campaigns include this device
    const campaignsWithDevice = await findCampaignsWithDevice(boothRegistry, deviceId);
    
    if (campaignsWithDevice.length === 0) {
      console.log(`No active campaigns found for device ${deviceId}`);
      return true;
    }
    
    // Get booth details
    const booth = await boothRegistry.getBoothDetails(deviceId);
    
    // Get provider data from database
    const provider = await prisma.user.findFirst({
      where: {
        walletAddress: booth.owner.toLowerCase(),
        role: 'Provider'
      },
      include: {
        provider: true
      }
    });
    
    if (!provider || !provider.provider) {
      console.error(`Provider not found for device ${deviceId}`);
      return false;
    }
    
    // For each campaign this device is in, distribute payment
    for (const campaign of campaignsWithDevice) {
      try {
        await distributePaymentForCampaign(
          campaign,
          [{
            deviceId,
            views,
            taps,
            booth,
            provider
          }],
          timestamp,
          metadata
        );
      } catch (error) {
        console.error(`Error distributing payment for campaign ${campaign.id}:`, error);
      }
    }
    
    return true;
  } catch (error) {
    console.error(`Error processing payment for device ${deviceId}:`, error);
    return false;
  }
}

/**
 * Process payments for batch updates
 */
async function processBatchPayments(
  timestamp: number,
  rawData: string,
  metadata: { transactionHash: string; blockNumber: number }
): Promise<boolean> {
  try {
    console.log(`Processing batch payments for timestamp ${timestamp}`);
    
    // TODO: Implement parsing of batch data
    console.warn('Batch payment processing not fully implemented');
    
    // Initialize blockchain services
    const boothRegistry = createBoothRegistryService(process.env.RPC_URL);
    
    // In a real implementation, we would properly decode the batch data
    // For now, we're just going to log a warning
    
    return true;
  } catch (error) {
    console.error(`Error processing batch payments:`, error);
    return false;
  }
}

/**
 * Find campaigns that include a specific device
 */
async function findCampaignsWithDevice(
  boothRegistry: any, 
  deviceId: number
): Promise<Array<{ id: string | number; active: boolean; bookedLocations: number[] }>> {
  try {
    // Get all campaigns
    const allCampaigns = await boothRegistry.getAllCampaigns();
    
    // Filter campaigns that include this device and are active
    return allCampaigns.filter((campaign: any) => 
      campaign.active && 
      campaign.bookedLocations.includes(deviceId)
    );
  } catch (error) {
    console.error(`Error finding campaigns for device ${deviceId}:`, error);
    return [];
  }
}

/**
 * Distribute payment for a campaign to location providers
 */
async function distributePaymentForCampaign(
  campaign: { id: string | number; active: boolean; bookedLocations: number[] },
  boothMetrics: BoothMetrics[],
  timestamp: number,
  metadata: { transactionHash: string; blockNumber: number }
): Promise<boolean> {
  try {
    console.log(`Distributing payment for campaign ${campaign.id} to ${boothMetrics.length} locations`);
    
    // Get campaign holder address
    const campaignHolder = await getCampaignHolder(Number(campaign.id));
    
    if (!campaignHolder) {
      console.error(`Campaign holder not found for campaign ${campaign.id}`);
      return false;
    }
    
    // Calculate total views and taps across all booths in this campaign
    const totalViews = boothMetrics.reduce((sum, metrics) => sum + metrics.views, 0);
    const totalTaps = boothMetrics.reduce((sum, metrics) => sum + metrics.taps, 0);
    
    // Skip if no engagement
    if (totalViews === 0 && totalTaps === 0) {
      console.log(`No engagement for campaign ${campaign.id} at this timestamp`);
      return true;
    }
    
    // Calculate weights for payment distribution
    const VIEW_WEIGHT = 0.6; // 60% weight for views
    const TAP_WEIGHT = 0.4; // 40% weight for taps
    
    // Calculate the payment amount for each booth
    const payments: PaymentTransaction[] = [];
    
    for (const metrics of boothMetrics) {
      // Calculate the booth's share of the payment
      const viewShare = totalViews > 0 ? metrics.views / totalViews : 0;
      const tapShare = totalTaps > 0 ? metrics.taps / totalTaps : 0;
      
      // Calculate base payment rate for 5-minute interval
      const BASE_PAYMENT_RATE = 1000; // Base payment in ADC tokens
      const MINIMUM_PAYMENT = BASE_PAYMENT_RATE * 0.1; // 10% minimum payment
      
      // Calculate the total payment
      const viewPayment = BASE_PAYMENT_RATE * VIEW_WEIGHT * viewShare;
      const tapPayment = BASE_PAYMENT_RATE * TAP_WEIGHT * tapShare;
      const totalPayment = MINIMUM_PAYMENT + viewPayment + tapPayment;
      
      // Only process payments above a threshold
      if (totalPayment >= 1) {
        payments.push({
          campaignId: Number(campaign.id),
          deviceId: metrics.deviceId,
          amount: totalPayment,
          timestamp,
          source: campaignHolder.holderAddress as Address,
          destination: metrics.provider.holderAddress as Address,
          status: 'pending'
        });
      }
    }
    
    // Execute all payments
    for (const payment of payments) {
      try {
        // Execute token transfer
        const transferResponse = await callMetalAPI(
          `/holder/${payment.source}/transfer`,
          "POST",
          {
            tokenAddress: process.env.ADC_TOKEN_ADDRESS,
            amount: payment.amount,
            toAddress: payment.destination
          }
        );
        
        if (transferResponse.success) {
          payment.status = 'completed';
          payment.transactionHash = transferResponse.data?.transactionHash;
          
          // Update provider's earnings in the database
          await updateProviderEarnings(
            payment.destination,
            payment.amount
          );
          
          console.log(`Payment completed: ${payment.amount} ADC from ${payment.source} to ${payment.destination}`);
        } else {
          payment.status = 'failed';
          console.error(`Payment failed:`, transferResponse.error);
        }
      } catch (error) {
        payment.status = 'failed';
        console.error(`Error executing payment:`, error);
      }
    }
    
    // Log payment summary
    const successfulPayments = payments.filter(p => p.status === 'completed');
    console.log(`Payment summary for campaign ${campaign.id}: ${successfulPayments.length}/${payments.length} payments completed`);
    
    // Record payments in database
    await recordPaymentsInDatabase(payments, metadata);
    
    return true;
  } catch (error) {
    console.error(`Error distributing payment for campaign ${campaign.id}:`, error);
    return false;
  }
}

/**
 * Get campaign holder information
 */
async function getCampaignHolder(campaignId: number): Promise<any | null> {
  try {
    // Get campaign holder from database using raw query
    const campaignHolders = await prisma.$queryRaw<Array<{ id: number, campaignId: number, holderAddress: string }>>`
      SELECT * FROM "CampaignHolder"
      WHERE "campaignId" = ${campaignId}
      LIMIT 1
    `;
    
    if (!campaignHolders || campaignHolders.length === 0) {
      console.error(`Campaign holder not found for campaign ${campaignId}`);
      return null;
    }
    
    return campaignHolders[0];
  } catch (error) {
    console.error(`Error getting campaign holder for campaign ${campaignId}:`, error);
    return null;
  }
}

/**
 * Update provider's earnings in the database
 */
async function updateProviderEarnings(providerHolderAddress: Address, amount: number): Promise<boolean> {
  try {
    // Find the provider by holder address
    const provider = await prisma.provider.findFirst({
      where: {
        user: {
          holderAddress: providerHolderAddress.toLowerCase()
        }
      }
    });
    
    if (!provider) {
      console.error(`Provider not found for holder address ${providerHolderAddress}`);
      return false;
    }
    
    // Update provider's earnings
    await prisma.provider.update({
      where: {
        id: provider.id
      },
      data: {
        earningsTotal: {
          increment: amount
        }
      }
    });
    
    return true;
  } catch (error) {
    console.error(`Error updating provider earnings:`, error);
    return false;
  }
}

/**
 * Record payments in the database
 */
async function recordPaymentsInDatabase(payments: PaymentTransaction[], metadata: any): Promise<boolean> {
  try {
    // Create payment records
    for (const payment of payments) {
      // Using raw SQL since we aren't certain about the exact schema model name
      await prisma.$executeRaw`
        INSERT INTO "PaymentTransaction" (
          "campaignId", 
          "deviceId", 
          "amount", 
          "timestamp", 
          "sourceAddress", 
          "destinationAddress", 
          "status", 
          "transactionHash",
          "blockNumber"
        ) VALUES (
          ${payment.campaignId},
          ${payment.deviceId},
          ${payment.amount},
          ${new Date(payment.timestamp * 1000)},
          ${payment.source.toLowerCase()},
          ${payment.destination.toLowerCase()},
          ${payment.status},
          ${payment.transactionHash || ''},
          ${metadata.blockNumber}
        )
      `;
    }
    
    return true;
  } catch (error) {
    console.error(`Error recording payments in database:`, error);
    return false;
  }
} 