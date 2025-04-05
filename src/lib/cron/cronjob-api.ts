import axios from 'axios';

// Configuration from environment variables
const CRONJOB_API_KEY = process.env.CRONJOB_API_KEY || '';
const BASE_URL = 'https://api.cron-job.org';

// Initialize axios instance for cron-job.org API
const cronjobApi = axios.create({
  baseURL: BASE_URL,
  headers: {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${CRONJOB_API_KEY}`
  }
});

// Interface for job schedule
interface JobSchedule {
  timezone: string;
  expiresAt: number;
  hours: number[];
  mdays: number[];
  minutes: number[];
  months: number[];
  wdays: number[];
}

// Interface for job creation
interface JobInput {
  title: string;
  url: string;
  enabled: boolean;
  saveResponses?: boolean;
  requestTimeout?: number;
  schedule: JobSchedule;
  requestMethod?: number; // 0 = GET, 1 = POST
  extendedData?: {
    headers?: Record<string, string>;
    body?: string;
  };
  notification?: {
    onFailure?: boolean;
    onSuccess?: boolean;
    onDisable?: boolean;
  };
}

/**
 * Create a new cron job
 * @param jobData - The job data to create
 * @returns The ID of the created job
 */
export async function createCronJob(jobData: JobInput): Promise<number> {
  try {
    const response = await cronjobApi.put('/jobs', {
      job: jobData
    });
    
    if (response.status === 200 && response.data.jobId) {
      console.log(`Created cron job with ID: ${response.data.jobId}`);
      return response.data.jobId;
    } else {
      throw new Error(`Failed to create cron job: ${JSON.stringify(response.data)}`);
    }
  } catch (error) {
    console.error('Error creating cron job:', error);
    throw error;
  }
}

/**
 * Update an existing cron job
 * @param jobId - The ID of the job to update
 * @param jobData - The job data to update
 */
export async function updateCronJob(jobId: number, jobData: Partial<JobInput>): Promise<void> {
  try {
    const response = await cronjobApi.patch(`/jobs/${jobId}`, {
      job: jobData
    });
    
    if (response.status === 200) {
      console.log(`Updated cron job with ID: ${jobId}`);
    } else {
      throw new Error(`Failed to update cron job: ${JSON.stringify(response.data)}`);
    }
  } catch (error) {
    console.error(`Error updating cron job ${jobId}:`, error);
    throw error;
  }
}

/**
 * Delete a cron job
 * @param jobId - The ID of the job to delete
 */
export async function deleteCronJob(jobId: number): Promise<void> {
  try {
    const response = await cronjobApi.delete(`/jobs/${jobId}`);
    
    if (response.status === 200) {
      console.log(`Deleted cron job with ID: ${jobId}`);
    } else {
      throw new Error(`Failed to delete cron job: ${JSON.stringify(response.data)}`);
    }
  } catch (error) {
    console.error(`Error deleting cron job ${jobId}:`, error);
    throw error;
  }
}

/**
 * Get all cron jobs
 * @returns Array of cron jobs
 */
export async function getAllCronJobs(): Promise<any[]> {
  try {
    const response = await cronjobApi.get('/jobs');
    
    if (response.status === 200) {
      return response.data.jobs || [];
    } else {
      throw new Error(`Failed to get cron jobs: ${JSON.stringify(response.data)}`);
    }
  } catch (error) {
    console.error('Error getting cron jobs:', error);
    throw error;
  }
}

/**
 * Get cron job details
 * @param jobId - The ID of the job to get details for
 * @returns The job details
 */
export async function getCronJobDetails(jobId: number): Promise<any> {
  try {
    const response = await cronjobApi.get(`/jobs/${jobId}`);
    
    if (response.status === 200) {
      return response.data.jobDetails;
    } else {
      throw new Error(`Failed to get cron job details: ${JSON.stringify(response.data)}`);
    }
  } catch (error) {
    console.error(`Error getting cron job details for job ${jobId}:`, error);
    throw error;
  }
}

/**
 * Create or update a cron job for hourly payments
 * @param existingJobId - Optional existing job ID to update instead of create
 * @returns The ID of the created or updated job
 */
export async function setupHourlyPaymentCronJob(existingJobId?: number): Promise<number> {
  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000';
  const cronApiKey = process.env.PAYMENT_WEBHOOK_API_KEY || '';
  
  // Job data for hourly payments
  const jobData: JobInput = {
    title: 'AdNet Hourly Payments',
    url: `${baseUrl}/api/tokenomics/trigger-hourly-payments`,
    enabled: true,
    saveResponses: true,
    requestTimeout: 60, // 60 seconds timeout
    schedule: {
      timezone: 'UTC',
      expiresAt: 0, // Never expires
      hours: [-1], // Every hour
      mdays: [-1], // Every day of month
      minutes: [0], // At minute 0 (top of the hour)
      months: [-1], // Every month
      wdays: [-1]  // Every day of week
    },
    requestMethod: 1, // POST
    extendedData: {
      headers: {
        'X-API-Key': cronApiKey
      }
    },
    notification: {
      onFailure: true
    }
  };
  
  if (existingJobId) {
    await updateCronJob(existingJobId, jobData);
    return existingJobId;
  } else {
    return await createCronJob(jobData);
  }
} 