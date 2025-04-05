import { processIoTApiData } from './updateAdMetrics';
import * as dotenv from 'dotenv';
import axios from 'axios';

// Load environment variables
dotenv.config();

// Configuration for IoT API
const IOT_API_URL = process.env.IOT_API_URL || '';
const IOT_API_KEY = process.env.IOT_API_KEY || '';
const POLLING_INTERVAL = parseInt(process.env.POLLING_INTERVAL || '300000', 10); // Default: 5 minutes
const DEVICE_IDS = (process.env.DEVICE_IDS || '').split(',').filter(Boolean);

// Track last processed data to avoid duplicates
const lastProcessedData: Record<string, { timestamp: number; views: number; interactions: number }> = {};

/**
 * Fetch metrics from IoT API for a specific device
 * @param deviceId Device identifier
 * @returns API response data
 */
async function fetchDeviceMetrics(deviceId: string): Promise<any> {
  try {
    const response = await axios.get(`${IOT_API_URL}/devices/${deviceId}/metrics`, {
      headers: {
        'Authorization': `Bearer ${IOT_API_KEY}`
      }
    });
    
    return response.data;
  } catch (error) {
    console.error(`Error fetching metrics for device ${deviceId}:`, error);
    throw error;
  }
}

/**
 * Poll metrics for all configured devices and send to blockchain
 */
async function pollAllDevices(): Promise<void> {
  console.log(`Polling ${DEVICE_IDS.length} devices for metrics...`);
  
  for (const deviceId of DEVICE_IDS) {
    try {
      // Fetch latest metrics from IoT API
      const data = await fetchDeviceMetrics(deviceId);
      
      // Check if this is new data compared to last processed
      const lastData = lastProcessedData[deviceId];
      if (
        !lastData || 
        data.timestamp > lastData.timestamp || 
        data.views !== lastData.views || 
        data.interactions !== lastData.interactions
      ) {
        // Process new data
        console.log(`New metrics for device ${deviceId}:`, data);
        
        await processIoTApiData({
          deviceId,
          metrics: {
            views: data.views,
            interactions: data.interactions
          }
        });
        
        // Update last processed data
        lastProcessedData[deviceId] = {
          timestamp: data.timestamp,
          views: data.views,
          interactions: data.interactions
        };
      } else {
        console.log(`No new metrics for device ${deviceId}`);
      }
    } catch (error) {
      console.error(`Failed to process device ${deviceId}:`, error);
      // Continue with next device
    }
  }
}

/**
 * Start continuous polling
 */
function startPolling(): void {
  console.log(`Starting IoT metrics polling with interval of ${POLLING_INTERVAL}ms`);
  
  // Poll immediately
  pollAllDevices();
  
  // Set up interval
  setInterval(pollAllDevices, POLLING_INTERVAL);
}

// Start polling if called directly
if (require.main === module) {
  if (!IOT_API_URL) {
    console.error('Error: IOT_API_URL not configured in .env file');
    process.exit(1);
  }
  
  if (DEVICE_IDS.length === 0) {
    console.error('Error: No DEVICE_IDS configured in .env file');
    process.exit(1);
  }
  
  startPolling();
}

export { fetchDeviceMetrics, pollAllDevices, startPolling }; 