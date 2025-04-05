import { 
  type Address, 
  type Hash,
  getContract
} from 'viem';
import { 
  ViemBlockchainService 
} from './blockchain-service';
import { 
  Booth, 
  BoothMetadata, 
  BoothRegistryService, 
  BoothStatus, 
  Campaign, 
  CampaignMetadata, 
  ContractAdapterFactory, 
  TransactionResponse 
} from './types';
import { EncodingUtils } from './encoding-utils';

// Import ABI
import boothRegistryAbi from '../abi/BoothRegistery.json';

/**
 * Implementation of BoothRegistryService using Viem
 */
export class ViemBoothRegistryService extends ViemBlockchainService implements BoothRegistryService {
  // The smart contract address
  private _contractAddress: Address;
  
  /**
   * Constructor
   * @param provider Provider for blockchain interactions
   * @param contractAddress Address of the BoothRegistry contract
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
      abi: boothRegistryAbi.abi,
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
  
  // ====== BoothRegistryService Implementation ======
  
  /**
   * Register a new booth
   * @param deviceId Device ID
   * @param metadata Booth metadata
   * @returns Transaction response
   */
  async registerBooth(deviceId: number, metadata: BoothMetadata): Promise<TransactionResponse> {
    if (!this.walletClient) {
      throw new Error('Wallet not connected');
    }
    
    const encodedMetadata = EncodingUtils.encodeBoothMetadata(metadata);
    
    try {
      const hash = await this.walletClient.writeContract({
        ...this.getContractConfig(),
        functionName: 'registerBooth',
        args: [deviceId, encodedMetadata]
      });
      
      return this.wrapTransactionResponse(hash);
    } catch (error) {
      console.error('Register booth error:', error);
      throw error;
    }
  }
  
  /**
   * Activate a booth
   * @param deviceId Device ID
   * @returns Transaction response
   */
  async activateBooth(deviceId: number): Promise<TransactionResponse> {
    if (!this.walletClient) {
      throw new Error('Wallet not connected');
    }
    
    try {
      const hash = await this.walletClient.writeContract({
        ...this.getContractConfig(),
        functionName: 'activateBooth',
        args: [deviceId]
      });
      
      return this.wrapTransactionResponse(hash);
    } catch (error) {
      console.error('Activate booth error:', error);
      throw error;
    }
  }
  
  /**
   * Deactivate a booth
   * @param deviceId Device ID
   * @returns Transaction response
   */
  async deactivateBooth(deviceId: number): Promise<TransactionResponse> {
    if (!this.walletClient) {
      throw new Error('Wallet not connected');
    }
    
    try {
      const hash = await this.walletClient.writeContract({
        ...this.getContractConfig(),
        functionName: 'deactivateBooth',
        args: [deviceId]
      });
      
      return this.wrapTransactionResponse(hash);
    } catch (error) {
      console.error('Deactivate booth error:', error);
      throw error;
    }
  }
  
  /**
   * Update booth status
   * @param deviceId Device ID
   * @param status Booth status
   * @returns Transaction response
   */
  async updateBoothStatus(deviceId: number, status: BoothStatus): Promise<TransactionResponse> {
    if (!this.walletClient) {
      throw new Error('Wallet not connected');
    }
    
    try {
      const hash = await this.walletClient.writeContract({
        ...this.getContractConfig(),
        functionName: 'updateBoothStatus',
        args: [deviceId, status]
      });
      
      return this.wrapTransactionResponse(hash);
    } catch (error) {
      console.error('Update booth status error:', error);
      throw error;
    }
  }
  
  /**
   * Get booth details
   * @param deviceId Device ID
   * @returns Booth details
   */
  async getBoothDetails(deviceId: number): Promise<Booth> {
    try {
      const result = await this.publicClient.readContract({
        address: this._contractAddress,
        abi: boothRegistryAbi.abi,
        functionName: 'getBoothDetails',
        args: [deviceId]
      }) as [number, `0x${string}`, Address, boolean, number];
      
      const [returnedDeviceId, metadataBytes, owner, active, statusCode] = result;
      const metadata = EncodingUtils.decodeBoothMetadata(metadataBytes);
      
      return {
        deviceId: returnedDeviceId,
        metadata,
        owner,
        active,
        status: statusCode as BoothStatus
      };
    } catch (error) {
      console.error('Get booth details error:', error);
      throw error;
    }
  }
  
  /**
   * Get active booths
   * @returns Array of device IDs for active booths
   */
  async getActiveBooths(): Promise<number[]> {
    try {
      return await this.publicClient.readContract({
        address: this._contractAddress,
        abi: boothRegistryAbi.abi,
        functionName: 'getActiveBooths'
      }) as number[];
    } catch (error) {
      console.error('Get active booths error:', error);
      throw error;
    }
  }
  
  /**
   * Get active locations
   * @returns Array of device IDs for active locations
   */
  async getActiveLocations(): Promise<number[]> {
    try {
      return await this.publicClient.readContract({
        address: this._contractAddress,
        abi: boothRegistryAbi.abi,
        functionName: 'getActiveLocations'
      }) as number[];
    } catch (error) {
      console.error('Get active locations error:', error);
      throw error;
    }
  }
  
  /**
   * Get provider locations
   * @param providerAddress Provider address
   * @returns Array of device IDs owned by the provider
   */
  async getProviderLocations(providerAddress: Address): Promise<number[]> {
    try {
      return await this.publicClient.readContract({
        address: this._contractAddress,
        abi: boothRegistryAbi.abi,
        functionName: 'getProviderLocations',
        args: [providerAddress]
      }) as number[];
    } catch (error) {
      console.error('Get provider locations error:', error);
      throw error;
    }
  }
  
  /**
   * Get all booths
   * @returns Array of all booths
   */
  async getAllBooths(): Promise<Booth[]> {
    try {
      const boothCount = await this.getBoothCount();
      
      // Get all device IDs using the allDeviceIds array getter
      const deviceIds: number[] = [];
      
      // Loop through the array getter
      for (let i = 0; i < boothCount; i++) {
        try {
          const deviceId = await this.publicClient.readContract({
            address: this._contractAddress,
            abi: boothRegistryAbi.abi,
            functionName: 'allDeviceIds',
            args: [i]
          }) as number;
          
          deviceIds.push(deviceId);
        } catch (error) {
          console.warn(`Error fetching device ID at index ${i}:`, error);
        }
      }
      
      // Fetch details for each booth
      const booths: Booth[] = [];
      
      for (const deviceId of deviceIds) {
        try {
          const booth = await this.getBoothDetails(deviceId);
          booths.push(booth);
        } catch (error) {
          console.warn(`Error fetching booth ${deviceId}:`, error);
        }
      }
      
      return booths;
    } catch (error) {
      console.error('Get all booths error:', error);
      throw error;
    }
  }
  
  /**
   * Get booth count
   * @returns Total number of booths
   */
  async getBoothCount(): Promise<number> {
    try {
      const count = await this.publicClient.readContract({
        address: this._contractAddress,
        abi: boothRegistryAbi.abi,
        functionName: 'boothCount'
      }) as bigint;
      
      return Number(count);
    } catch (error) {
      console.error('Get booth count error:', error);
      throw error;
    }
  }
  
  /**
   * Create a new campaign
   * @param metadata Campaign metadata
   * @param deviceIds Array of device IDs to add to the campaign
   * @returns Transaction response
   */
  async createCampaign(metadata: CampaignMetadata, deviceIds: number[]): Promise<TransactionResponse> {
    if (!this.walletClient) {
      throw new Error('Wallet not connected');
    }
    
    if (!deviceIds || deviceIds.length === 0) {
      throw new Error('At least one location must be provided for campaign creation');
    }
    
    const encodedMetadata = EncodingUtils.encodeCampaignMetadata(metadata);
    
    try {
      const hash = await this.walletClient.writeContract({
        ...this.getContractConfig(),
        functionName: 'createCampaign',
        args: [encodedMetadata, deviceIds]
      });
      
      return this.wrapTransactionResponse(hash);
    } catch (error) {
      console.error('Create campaign error:', error);
      throw error;
    }
  }
  
  /**
   * Add location to campaign
   * @param campaignId Campaign ID
   * @param deviceId Device ID
   * @returns Transaction response
   */
  async addLocationToCampaign(campaignId: number, deviceId: number): Promise<TransactionResponse> {
    if (!this.walletClient) {
      throw new Error('Wallet not connected');
    }
    
    try {
      const hash = await this.walletClient.writeContract({
        ...this.getContractConfig(),
        functionName: 'addLocationToCampaign',
        args: [campaignId, deviceId]
      });
      
      return this.wrapTransactionResponse(hash);
    } catch (error) {
      console.error('Add location to campaign error:', error);
      throw error;
    }
  }
  
  /**
   * Remove location from campaign
   * @param campaignId Campaign ID
   * @param deviceId Device ID
   * @returns Transaction response
   */
  async removeLocationFromCampaign(campaignId: number, deviceId: number): Promise<TransactionResponse> {
    if (!this.walletClient) {
      throw new Error('Wallet not connected');
    }
    
    try {
      // Check if this is the last location in the campaign
      const locations = await this.getCampaignLocations(campaignId);
      
      if (locations.length <= 1) {
        throw new Error('Campaign must have at least one location. Cannot remove the last location.');
      }
      
      const hash = await this.walletClient.writeContract({
        ...this.getContractConfig(),
        functionName: 'removeLocationFromCampaign',
        args: [campaignId, deviceId]
      });
      
      return this.wrapTransactionResponse(hash);
    } catch (error) {
      console.error('Remove location from campaign error:', error);
      throw error;
    }
  }
  
  /**
   * Get campaign details
   * @param campaignId Campaign ID
   * @returns Campaign details
   */
  async getCampaignDetails(campaignId: number): Promise<Campaign> {
    try {
      const result = await this.publicClient.readContract({
        address: this._contractAddress,
        abi: boothRegistryAbi.abi,
        functionName: 'getCampaignDetails',
        args: [campaignId]
      }) as [Address, `0x${string}`, boolean, number[]];
      
      const [advertiser, metadataBytes, active, bookedLocations] = result;
      const metadata = EncodingUtils.decodeCampaignMetadata(metadataBytes);
      
      return {
        id: campaignId.toString(),
        advertiser,
        metadata,
        active,
        bookedLocations
      };
    } catch (error) {
      console.error('Get campaign details error:', error);
      throw error;
    }
  }
  
  /**
   * Get campaign count
   * @returns Total number of campaigns
   */
  async getCampaignCount(): Promise<number> {
    try {
      const count = await this.publicClient.readContract({
        address: this._contractAddress,
        abi: boothRegistryAbi.abi,
        functionName: 'campaignCount'
      }) as bigint;
      
      return Number(count);
    } catch (error) {
      console.error('Get campaign count error:', error);
      throw error;
    }
  }
  
  /**
   * Get campaign locations
   * @param campaignId Campaign ID
   * @returns Array of device IDs in the campaign
   */
  async getCampaignLocations(campaignId: number): Promise<number[]> {
    try {
      return await this.publicClient.readContract({
        address: this._contractAddress,
        abi: boothRegistryAbi.abi,
        functionName: 'getCampaignLocations',
        args: [campaignId]
      }) as number[];
    } catch (error) {
      console.error('Get campaign locations error:', error);
      throw error;
    }
  }
  
  /**
   * Get advertiser campaigns
   * @param advertiserAddress Advertiser address
   * @returns Array of campaign IDs
   */
  async getMyAdvertiserCampaigns(advertiserAddress: Address): Promise<number[]> {
    try {
      const campaignIds: number[] = [];
      let index = 0;
      let continueLoop = true;
      
      while (continueLoop) {
        try {
          // Call the public mapping getter with index parameter
          const campaignId = await this.publicClient.readContract({
            address: this._contractAddress,
            abi: boothRegistryAbi.abi,
            functionName: 'advertiserToCampaigns',
            args: [advertiserAddress, index]
          }) as bigint;
          
          campaignIds.push(Number(campaignId));
          index++;
        } catch (error) {
          // We've reached the end of the array
          continueLoop = false;
        }
      }
      
      return campaignIds;
    } catch (error) {
      console.error('Get advertiser campaigns error:', error);
      return [];
    }
  }
  
  /**
   * Get all campaigns
   * @returns Array of all campaigns
   */
  async getAllCampaigns(): Promise<Campaign[]> {
    try {
      const campaignCount = await this.getCampaignCount();
      const campaigns: Campaign[] = [];
      
      for (let i = 1; i <= campaignCount; i++) {
        try {
          const campaign = await this.getCampaignDetails(i);
          campaigns.push(campaign);
        } catch (error) {
          console.warn(`Error fetching campaign ${i}:`, error);
        }
      }
      
      return campaigns;
    } catch (error) {
      console.error('Get all campaigns error:', error);
      throw error;
    }
  }
  
  /**
   * Get device previous campaigns
   * @param deviceId Device ID
   * @returns Object with campaign data
   */
  async getDevicePreviousCampaigns(deviceId: number): Promise<{
    campaignIds: number[];
    advertisers: Address[];
    metadatas: CampaignMetadata[];
    activeStatus: boolean[];
  }> {
    try {
      const result = await this.publicClient.readContract({
        address: this._contractAddress,
        abi: boothRegistryAbi.abi,
        functionName: 'getDevicePreviousCampaigns',
        args: [deviceId]
      }) as [number[], Address[], `0x${string}`[], boolean[]];
      
      const [campaignIds, advertisers, metadataByteArray, activeStatus] = result;
      
      // Decode each metadata
      const metadatas = metadataByteArray.map(bytes => 
        EncodingUtils.decodeCampaignMetadata(bytes)
      );
      
      return {
        campaignIds,
        advertisers,
        metadatas,
        activeStatus
      };
    } catch (error) {
      console.error('Get device previous campaigns error:', error);
      throw error;
    }
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
 * Factory function to create a ViemBoothRegistryService
 * @param provider Provider for blockchain interactions
 * @param contractAddress Address of the BoothRegistry contract 
 * @param userAddress User's address (optional)
 * @returns BoothRegistryService instance
 */
export const createBoothRegistryService: ContractAdapterFactory<BoothRegistryService> = (
  provider,
  userAddress
) => {
  // Default contract address
  const contractAddress = '0x75e0d911Fe9c359f5bbf72C8DB50FAE9C05321B6' as Address;
  
  return new ViemBoothRegistryService(
    provider,
    contractAddress,
    userAddress as Address
  );
}; 