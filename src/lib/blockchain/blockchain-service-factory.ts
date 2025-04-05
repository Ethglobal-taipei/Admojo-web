import { type Address, type Transport } from 'viem';
import { 
  AggregatedMetrics, 
  BaseContractService,
  BlockchainService, 
  BoothRegistryService, 
  PerformanceOracleService, 
  TransactionResponse 
} from './types';
import { ViemBlockchainService } from './blockchain-service';
import { createBoothRegistryService } from './booth-registry-service';
import { createPerformanceOracleService } from './performance-oracle-service';

/**
 * AdNet Blockchain Service that combines multiple contract services
 * This is the main service that should be used by the application
 */
export class AdNetBlockchainService extends ViemBlockchainService {
  // Contract services
  private boothRegistryService: BoothRegistryService;
  private performanceOracleService: PerformanceOracleService;
  
  // Address override for metrics methods
  private _adminAddress: Address | null = null;
  
  /**
   * Constructor
   * @param provider Provider for blockchain interactions
   * @param userAddress User's address (optional, can be set later)
   */
  constructor(provider: Transport, userAddress?: Address) {
    super(provider, userAddress);
    
    // Create contract services
    this.boothRegistryService = createBoothRegistryService(provider, userAddress);
    this.performanceOracleService = createPerformanceOracleService(provider, userAddress);
  }
  
  /**
   * Set admin address for metrics methods
   * @param adminAddress Admin address
   */
  setAdminAddress(adminAddress: Address): void {
    this._adminAddress = adminAddress;
  }
  
  /**
   * Connect to blockchain and initialize all services
   */
  async connect(): Promise<boolean> {
    const connected = await super.connect();
    
    if (connected && this.userAddress) {
      // If we're connected, also connect the contract services
      // This is needed because they are created with the initial address
      await this.boothRegistryService.connect();
      await this.performanceOracleService.connect();
    }
    
    return connected;
  }
  
  /**
   * Get campaign metrics by aggregating metrics from all campaign locations
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
    try {
      // First get all locations in the campaign
      const locationIds = await this.boothRegistryService.getCampaignLocations(campaignId);
      
      if (locationIds.length === 0) {
        return { totalViews: 0, totalTaps: 0 };
      }
      
      // Get metrics for each location and aggregate them
      let totalViews = 0;
      let totalTaps = 0;
      
      // Process each location concurrently for better performance
      const metricsPromises = locationIds.map(deviceId => 
        this.performanceOracleService.getAggregatedMetrics(deviceId, startTime, endTime)
      );
      
      const metricsResults = await Promise.all(metricsPromises);
      
      // Sum up all metrics
      for (const metrics of metricsResults) {
        totalViews += metrics.totalViews;
        totalTaps += metrics.totalTaps;
      }
      
      return { totalViews, totalTaps };
    } catch (error) {
      console.error('Get campaign metrics error:', error);
      throw error;
    }
  }
  
  /**
   * Update metrics for a device - requires admin access
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
    // Use admin address if available, otherwise use user address
    const adminAddress = this._adminAddress;
    
    // If we have an admin address and it's different from the user address,
    // we need to create a new service instance with the admin address
    if (adminAddress && adminAddress !== this.userAddress) {
      // Create a temporary service with admin privileges
      const adminService = createPerformanceOracleService(this.provider, adminAddress);
      
      // Connect the service
      await adminService.connect();
      
      // Update metrics with admin privileges
      return adminService.updateMetrics(deviceId, timestamp, views, taps);
    }
    
    // Otherwise, use the regular service
    return this.performanceOracleService.updateMetrics(deviceId, timestamp, views, taps);
  }
  
  /**
   * Get booth registry service
   */
  get boothRegistry(): BoothRegistryService {
    return this.boothRegistryService;
  }
  
  /**
   * Get performance oracle service
   */
  get performanceOracle(): PerformanceOracleService {
    return this.performanceOracleService;
  }
}

/**
 * Factory function to create an AdNetBlockchainService
 * @param provider Provider for blockchain interactions
 * @param userAddress User's address (optional)
 * @returns AdNetBlockchainService instance
 */
export function createBlockchainService(
  provider: Transport,
  userAddress?: Address
): AdNetBlockchainService {
  return new AdNetBlockchainService(provider, userAddress);
} 