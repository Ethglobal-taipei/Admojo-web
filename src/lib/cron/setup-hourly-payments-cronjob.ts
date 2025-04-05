/**
 * This script sets up the hourly payments cron job in cron-job.org
 * 
 * Run this script once during deployment or when you need to update the cron job:
 * ts-node src/scripts/setup-hourly-payments-cronjob.ts
 */

import * as dotenv from 'dotenv';
import { setupHourlyPaymentCronJob, getAllCronJobs } from '../lib/cron/cronjob-api';

// Load environment variables
dotenv.config();

// Main function to set up or update the hourly payments cron job
async function main() {
  try {
    console.log('Checking for existing hourly payments cron job...');
    
    // Get all existing cron jobs
    const jobs = await getAllCronJobs();
    
    // Look for existing hourly payments job
    const existingJob = jobs.find(job => job.title === 'AdNet Hourly Payments');
    
    if (existingJob) {
      console.log(`Found existing job with ID: ${existingJob.jobId}`);
      
      // Update the existing job
      const jobId = await setupHourlyPaymentCronJob(existingJob.jobId);
      console.log(`Updated hourly payments cron job (ID: ${jobId})`);
    } else {
      // Create a new job
      const jobId = await setupHourlyPaymentCronJob();
      console.log(`Created new hourly payments cron job (ID: ${jobId})`);
    }
    
    console.log('Hourly payments cron job setup complete!');
  } catch (error) {
    console.error('Error setting up hourly payments cron job:', error);
    process.exit(1);
  }
}

// Run the script
main(); 