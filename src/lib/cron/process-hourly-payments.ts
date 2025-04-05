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
    // Get current time and calculate the current 5-minute slot
    const now = new Date();
    const currentMinute = now.getMinutes();
    const currentSlotMinute = Math.floor(currentMinute / 5) * 5;
    const timeSlot = new Date(
      now.getFullYear(),
      now.getMonth(),
      now.getDate(),
      now.getHours(),
      currentSlotMinute
    ).toISOString();
    
    console.log(`Processing payments for time slot: ${timeSlot} (current time: ${now.toISOString()})`);
    
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
        const timestamp = Math.floor(new Date(timeSlot).getTime() / 1000);
        
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
            
            // Get performance metrics for this 5-minute interval
            const metrics = await performanceOracle.getMetrics(deviceId, timestamp);
            
            // Log the metrics for debugging
            console.log(`Metrics for device ${deviceId} at ${timeSlot}:`, {
              views: metrics.views,
              taps: metrics.taps,
              timestamp
            });
            
            boothMetrics.push({
              deviceId,
              views: metrics.views,
              taps: metrics.taps,
              booth,
              provider
            });
          } catch (error) {
            console.error(`Error collecting metrics for device ${deviceId}:`, error);
          }
        }
        
        // Calculate total views and taps across all booths in this campaign
        const totalViews = boothMetrics.reduce((sum, metrics) => sum + metrics.views, 0);
        const totalTaps = boothMetrics.reduce((sum, metrics) => sum + metrics.taps, 0);
        
        // Now process payments for each booth based on relative performance
        for (const metrics of boothMetrics) {
          try {
            // Calculate payment based on views and taps
            const viewShare = totalViews > 0 ? metrics.views / totalViews : 0;
            const tapShare = totalTaps > 0 ? metrics.taps / totalTaps : 0;
            
            // Calculate base payment (5-minute rate = hourly rate / 12)
            const baseRate = 1000;
            const minimumPayment = baseRate * 0.1; // 10% minimum payment
            
            // Performance payment is split between views (60%) and taps (40%)
            const viewPerformance = baseRate * 0.9 * 0.6 * viewShare;
            const tapPerformance = baseRate * 0.9 * 0.4 * tapShare;
            
            const totalPayment = minimumPayment + viewPerformance + tapPerformance;
            
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
                tapShare,
                totalViews,
                totalTaps,
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
    
    console.log(`Completed payment processing for time slot: ${timeSlot}`);
    return true;
  } catch (error) {
    console.error("Error in processHourlyPayments:", error);
    return false;
  }
}