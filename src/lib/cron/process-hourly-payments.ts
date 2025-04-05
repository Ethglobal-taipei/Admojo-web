// This file contains logic for processing hourly payments to booth owners
// In a production environment, this would be executed by .\app\api\metal\tokenomics\trigger-hourly-payments\route.ts thriugh cron jobs
import { createBoothRegistryService } from '../blockchain/booth-registry-service';
import { createPerformanceOracleService } from '../blockchain/performance-oracle-service';
import { callMetalAPI } from '../../app/api/metal/route';
import { PrismaClient } from '@prisma/client';
import { type Address } from 'viem';

const prisma = new PrismaClient();

interface BoothMetrics {
  deviceId: number;
  views: number;
  taps: number;
  booth: any; // Booth details from contract
  provider: any; // Provider details from database
}

// Main function to process hourly payments
export async function processHourlyPayments() {
  try {
    // Get current hour time slot
    const now = new Date();
    const hourTimeSlot = new Date(
      now.getFullYear(),
      now.getMonth(),
      now.getDate(),
      now.getHours()
    ).toISOString();
    
    console.log(`Processing payments for time slot: ${hourTimeSlot}`);
    
    // Initialize blockchain services
    const boothRegistry = createBoothRegistryService(process.env.RPC_URL);
    const performanceOracle = createPerformanceOracleService(process.env.RPC_URL);
    
    // Get all campaigns from the contract (all campaigns are active)
    const campaigns = await boothRegistry.getAllCampaigns();
    
    console.log(`Found ${campaigns.length} campaigns`);
    
    for (const campaign of campaigns) {
      try {
        // Get campaign locations
        const deviceIds = campaign.bookedLocations;
        
        // Get advertiser data from database
        const advertiser = await prisma.user.findFirst({
          where: {
            walletAddress: campaign.advertiser.toLowerCase(),
            role: 'Advertiser'
          }
        });
        
        if (!advertiser) {
          console.error(`Advertiser not found for campaign ${campaign.id}`);
          continue;
        }
        
        // First collect metrics for all booths in this campaign
        const boothMetrics: BoothMetrics[] = [];
        const startTime = Math.floor(new Date(hourTimeSlot).getTime() / 1000);
        const endTime = startTime + 3600; // One hour in seconds
        
        // Collect metrics and booth details for all locations
        for (const deviceId of deviceIds) {
          try {
            // Get booth details from contract
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
              continue;
            }
            
            // Get performance metrics for this hour
            const metrics = await performanceOracle.getAggregatedMetrics(
              deviceId,
              startTime,
              endTime
            );
            
            boothMetrics.push({
              deviceId,
              views: metrics.totalViews,
              taps: metrics.totalTaps,
              booth,
              provider
            });
          } catch (error) {
            console.error(`Error collecting metrics for device ${deviceId}:`, error);
          }
        }
        
        // Calculate total views across all booths in this campaign
        const totalViews = boothMetrics.reduce((sum, metrics) => sum + metrics.views, 0);
        
        // Now process payments for each booth based on relative performance
        for (const metrics of boothMetrics) {
          try {
            // Calculate payment based on views and interactions
            const viewShare = totalViews > 0 ? metrics.views / totalViews : 0;
            const minimumPayment = Number(campaign.hourlyRate) * 0.1; // 10% minimum payment
            const performancePayment = Number(campaign.hourlyRate) * 0.9 * viewShare; // Performance based on share of total views
            const totalPayment = minimumPayment + performancePayment;
            
            if (totalPayment > 0) {
              // Process direct payment from advertiser to provider
              const transferResponse = await callMetalAPI(
                `/holder/${advertiser.holderAddress}/transfer`,
                "POST",
                {
                  tokenAddress: process.env.ADC_TOKEN_ADDRESS,
                  amount: totalPayment,
                  toAddress: metrics.provider.holderAddress
                }
              );
              
              // Update provider's earnings
              await prisma.provider.update({
                where: { id: metrics.provider.provider.id },
                data: {
                  earningsTotal: {
                    increment: totalPayment
                  }
                }
              });
              
              console.log(`Processed payment for campaign ${campaign.id}, device ${metrics.deviceId}:`, {
                views: metrics.views,
                taps: metrics.taps,
                viewShare,
                totalViews,
                payment: totalPayment
              });
            }
          } catch (error) {
            console.error(`Error processing payment for device ${metrics.deviceId}:`, error);
          }
        }
      } catch (error) {
        console.error(`Error processing campaign ${campaign.id}:`, error);
      }
    }
    
    console.log(`Completed payment processing for time slot: ${hourTimeSlot}`);
    return true;
  } catch (error) {
    console.error("Error in processHourlyPayments:", error);
    return false;
  }
}