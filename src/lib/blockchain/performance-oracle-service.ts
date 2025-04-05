import { 
  type Address, 
  type Hash,
} from 'viem';
import { 
  ViemBlockchainService 
} from './blockchain-service';
import { 
  AggregatedMetrics,
  Metrics,
  PerformanceOracleService,
  ContractAdapterFactory,
  TransactionResponse
} from './types';

// Import ABI
import performanceOracleAbi from '../abi/PerformanceOracle.json';

/**
 * Implementation of PerformanceOracleService using Viem
 */
export class ViemPerformanceOracleService extends ViemBlockchainService implements PerformanceOracleService {
  // The smart contract address
  private _contractAddress: Address;
  
  // Constants for time-based calculations
  private readonly SECONDS_PER_HOUR = 3600;
  private readonly SECONDS_PER_DAY = 86400;
  private readonly SECONDS_PER_WEEK = 604800;
  private readonly SECONDS_PER_5_MINUTES = 300; // 5 minutes in seconds
  private readonly ROUNDING_THRESHOLD = 150; // 2.5 minutes in seconds
  private readonly MAX_CHUNK_SIZE = 3600; // 1 hour in seconds for aggregation chunks
  
  /**
   * Constructor
   * @param provider Provider for blockchain interactions
   * @param contractAddress Address of the PerformanceOracle contract
   * @param userAddress User's address (optional, can be set later)
   */
  constructor(
    provider: any, 
    contractAddress: Address,
    userAddress?: Address
  ) {
    super(provider, userAddress);
    this._contractAddress = contractAddress;
  }
  
  /**
   * Get the contract configuration for Viem
   */
  private getContractConfig() {
    return {
      address: this._contractAddress,
      abi: performanceOracleAbi.abi,
      chain: this.network,
      account: this.userAddress as Address
    };
  }
  
  /**
   * Wrap a transaction hash in a TransactionResponse
   * @param hash Transaction hash
   * @returns Transaction response object
   */
  private wrapTransactionResponse(hash: Hash): TransactionResponse {
    return {
      hash,
      wait: () => this.waitForTransaction(hash)
    };
  }
  
  /**
   * Convert a Date to a UNIX timestamp
   * @param date Date to convert
   * @returns UNIX timestamp (seconds since epoch)
   */
  private dateToTimestamp(date: Date): number {
    return Math.floor(date.getTime() / 1000);
  }
  
  /**
   * Get the start and end timestamps for a date (midnight to midnight)
   * @param date Date to get timestamps for
   * @returns Object with start and end timestamps
   */
  private getDayBoundaries(date: Date): { startTime: number, endTime: number } {
    const startDate = new Date(date);
    startDate.setHours(0, 0, 0, 0);
    
    const endDate = new Date(startDate);
    endDate.setHours(23, 59, 59, 999);
    
    return {
      startTime: this.dateToTimestamp(startDate),
      endTime: this.dateToTimestamp(endDate)
    };
  }
  
  /**
   * Get the start and end timestamps for a week
   * @param startDate First day of the week
   * @returns Object with start and end timestamps
   */
  private getWeekBoundaries(startDate: Date): { startTime: number, endTime: number } {
    const startDay = new Date(startDate);
    startDay.setHours(0, 0, 0, 0);
    
    const endDay = new Date(startDay);
    endDay.setDate(startDay.getDate() + 6);
    endDay.setHours(23, 59, 59, 999);
    
    return {
      startTime: this.dateToTimestamp(startDay),
      endTime: this.dateToTimestamp(endDay)
    };
  }
  
  /**
   * Rounds a timestamp to the nearest 5-minute interval based on the IoT API logic
   * @param timestamp Original timestamp
   * @returns Rounded timestamp
   */
  private roundToNearest5Minutes(timestamp: number): number {
    const remainder = timestamp % this.SECONDS_PER_5_MINUTES;
    if (remainder <= this.ROUNDING_THRESHOLD) {
      return timestamp - remainder;
    } else {
      return timestamp + (this.SECONDS_PER_5_MINUTES - remainder);
    }
  }
  
  // ====== PerformanceOracleService Implementation ======
  
  /**
   * Update metrics for a device
   * @param deviceId Device ID
   * @param timestamp UNIX timestamp
   * @param views Number of views
   * @param taps Number of taps
   * @returns Transaction response
   */
  async updateMetrics(
    deviceId: number, 
    timestamp: number, 
    views: number, 
    taps: number
  ): Promise<TransactionResponse> {
    if (!this.walletClient) {
      throw new Error('Wallet not connected');
    }
    
    try {
      const hash = await this.walletClient.writeContract({
        ...this.getContractConfig(),
        functionName: 'updateMetrics',
        args: [deviceId, timestamp, views, taps]
      });
      
      return this.wrapTransactionResponse(hash);
    } catch (error) {
      console.error('Update metrics error:', error);
      throw error;
    }
  }
  
  /**
   * Get metrics for a device at a specific timestamp
   * @param deviceId Device ID
   * @param timestamp UNIX timestamp
   * @returns Metrics (views and taps)
   */
  async getMetrics(deviceId: number, timestamp: number): Promise<Metrics> {
    try {
      const roundedTimestamp = this.roundToNearest5Minutes(timestamp);
      const result = await this.publicClient.readContract({
        address: this._contractAddress,
        abi: performanceOracleAbi.abi,
        functionName: 'getMetrics',
        args: [deviceId, roundedTimestamp]
      }) as [bigint, bigint];
      
      const [views, taps] = result;
      
      return {
        views: Number(views),
        taps: Number(taps)
      };
    } catch (error) {
      console.error('Get metrics error:', error);
      throw error;
    }
  }
  
  /**
   * Get aggregated metrics for a device over a time period
   * @param deviceId Device ID
   * @param startTime Start timestamp
   * @param endTime End timestamp
   * @returns Aggregated metrics
   */
  async getAggregatedMetrics(
    deviceId: number, 
    startTime: number, 
    endTime: number
  ): Promise<AggregatedMetrics> {
    try {
      let totalViews = 0;
      let totalTaps = 0;
      
      // Round start and end times to nearest 5-minute intervals
      const roundedStartTime = this.roundToNearest5Minutes(startTime);
      const roundedEndTime = this.roundToNearest5Minutes(endTime);
      
      // Process each 5-minute interval
      for (let currentTime = roundedStartTime; currentTime <= roundedEndTime; currentTime += this.SECONDS_PER_5_MINUTES) {
        const result = await this.publicClient.readContract({
          address: this._contractAddress,
          abi: performanceOracleAbi.abi,
          functionName: 'getMetrics',
          args: [deviceId, currentTime]
        }) as [bigint, bigint];
        
        const [views, taps] = result;
        totalViews += Number(views);
        totalTaps += Number(taps);
      }
      
      return { totalViews, totalTaps };
    } catch (error) {
      console.error('Get aggregated metrics error:', error);
      throw error;
    }
  }
  
  /**
   * Get daily metrics for a device
   * @param deviceId Device ID
   * @param date Date (defaults to today)
   * @returns Aggregated metrics for the day
   */
  async getDailyMetrics(
    deviceId: number, 
    date: Date = new Date()
  ): Promise<AggregatedMetrics> {
    try {
      const { startTime, endTime } = this.getDayBoundaries(date);
      
      return this.getAggregatedMetrics(deviceId, startTime, endTime);
    } catch (error) {
      console.error('Get daily metrics error:', error);
      throw error;
    }
  }
  
  /**
   * Get weekly metrics for a device
   * @param deviceId Device ID
   * @param startDate First day of the week (defaults to 7 days ago)
   * @returns Aggregated metrics for the week
   */
  async getWeeklyMetrics(
    deviceId: number, 
    startDate: Date = new Date(Date.now() - 7 * this.SECONDS_PER_DAY * 1000)
  ): Promise<AggregatedMetrics> {
    try {
      const { startTime, endTime } = this.getWeekBoundaries(startDate);
      
      return this.getAggregatedMetrics(deviceId, startTime, endTime);
    } catch (error) {
      console.error('Get weekly metrics error:', error);
      throw error;
    }
  }
  
  /**
   * Get metrics for a campaign
   * @param campaignId Campaign ID
   * @param startTime Start timestamp
   * @param endTime End timestamp
   * @returns Aggregated metrics for the campaign
   */
  async getCampaignMetrics(
    campaignId: number, 
    startTime: number, 
    endTime: number
  ): Promise<AggregatedMetrics> {
    // This requires booth registry to get campaign locations first
    throw new Error('getCampaignMetrics not implemented in PerformanceOracleService. Use the Blockchain Service instead.');
  }
  
  // ====== BaseContractService Implementation ======
  
  /**
   * Get the contract address
   */
  get contractAddress(): Address {
    return this._contractAddress;
  }
  
  /**
   * Check if the contract service is ready
   */
  get isReady(): boolean {
    return this.isConnected && !!this._contractAddress;
  }
}

/**
 * Factory function to create a ViemPerformanceOracleService
 * @param provider Provider for blockchain interactions
 * @param contractAddress Address of the PerformanceOracle contract 
 * @param userAddress User's address (optional)
 * @returns PerformanceOracleService instance
 */
export const createPerformanceOracleService: ContractAdapterFactory<PerformanceOracleService> = (
  provider,
  userAddress
) => {
  // Default contract address
  const contractAddress = '0xAe5513f536E89D08E59bD1271De7a818e3bBf24B' as Address;
  
  return new ViemPerformanceOracleService(
    provider,
    contractAddress,
    userAddress as Address
  );
}; 