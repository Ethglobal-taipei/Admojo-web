import { type Address, type Hash } from 'viem';

/**
 * Base transaction response interface
 */
export interface TransactionResponse {
  hash: Hash;
  wait: () => Promise<TransactionReceipt>;
}

/**
 * Transaction receipt interface
 */
export interface TransactionReceipt {
  hash: Hash;
  status: 'success' | 'failed';
  blockNumber: number;
  blockHash: string;
  transactionIndex: number;
}

/**
 * Booth status enum matching the smart contract
 */
export enum BoothStatus {
  Unbooked = 0,
  Booked = 1,
  UnderMaintenance = 2
}

/**
 * Booth metadata interface
 */
export interface BoothMetadata {
  location: string;
  displaySize: string;
  additionalInfo?: string;
}

/**
 * Campaign metadata interface
 */
export interface CampaignMetadata {
  name: string;
  description: string;
  contentURI: string;
  startDate: bigint;
  duration: number;
  additionalInfo?: string;
}

/**
 * Complete booth details
 */
export interface Booth {
  deviceId: number;
  metadata: BoothMetadata;
  owner: Address;
  active: boolean;
  status: BoothStatus;
}

/**
 * Complete campaign details
 */
export interface Campaign {
  id: string;
  advertiser: Address;
  metadata: CampaignMetadata;
  active: boolean;
  bookedLocations: number[];
}

/**
 * Metrics data
 */
export interface Metrics {
  views: number;
  taps: number;
}

/**
 * Aggregated metrics data
 */
export interface AggregatedMetrics {
  totalViews: number;
  totalTaps: number;
}

/**
 * Generic Blockchain Service Interface
 * This should be implemented by all blockchain services
 */
export interface BlockchainService {
  // Core properties
  readonly isConnected: boolean;
  readonly address: Address | null;
  readonly chainId: number | null;
  
  // Core methods
  connect(): Promise<boolean>;
  disconnect(): Promise<void>;
  switchChain(chainId: number): Promise<boolean>;
  
  // Utility methods
  waitForTransaction(hash: Hash): Promise<TransactionReceipt>;
  addTransactionListener(callback: (hash: Hash, receipt: TransactionReceipt) => void): void;
  removeTransactionListener(callback: (hash: Hash, receipt: TransactionReceipt) => void): void;
}

/**
 * Base Contract Service interface
 * This should be extended by specific contract service interfaces
 */
export interface BaseContractService extends BlockchainService {
  readonly contractAddress: Address;
  readonly isReady: boolean;
}

/**
 * Booth Registry Contract Service Interface
 */
export interface BoothRegistryService extends BaseContractService {
  // Write methods
  registerBooth(deviceId: number, metadata: BoothMetadata): Promise<TransactionResponse>;
  activateBooth(deviceId: number): Promise<TransactionResponse>;
  deactivateBooth(deviceId: number): Promise<TransactionResponse>;
  updateBoothStatus(deviceId: number, status: BoothStatus): Promise<TransactionResponse>;
  
  // Read methods
  getBoothDetails(deviceId: number): Promise<Booth>;
  getActiveBooths(): Promise<number[]>;
  getActiveLocations(): Promise<number[]>;
  getProviderLocations(providerAddress: Address): Promise<number[]>;
  getAllBooths(): Promise<Booth[]>;
  getBoothCount(): Promise<number>;
  
  // Campaign related methods
  createCampaign(metadata: CampaignMetadata, deviceIds: number[]): Promise<TransactionResponse>;
  addLocationToCampaign(campaignId: number, deviceId: number): Promise<TransactionResponse>;
  removeLocationFromCampaign(campaignId: number, deviceId: number): Promise<TransactionResponse>;
  getCampaignDetails(campaignId: number): Promise<Campaign>;
  getCampaignCount(): Promise<number>;
  getCampaignLocations(campaignId: number): Promise<number[]>;
  getMyAdvertiserCampaigns(advertiserAddress: Address): Promise<number[]>;
  getAllCampaigns(): Promise<Campaign[]>;
  getDevicePreviousCampaigns(deviceId: number): Promise<{
    campaignIds: number[];
    advertisers: Address[];
    metadatas: CampaignMetadata[];
    activeStatus: boolean[];
  }>;
}

/**
 * Performance Oracle Contract Service Interface
 */
export interface PerformanceOracleService extends BaseContractService {
  // Write methods
  updateMetrics(deviceId: number, timestamp: number, views: number, taps: number): Promise<TransactionResponse>;
  
  // Read methods
  getMetrics(deviceId: number, timestamp: number): Promise<Metrics>;
  getAggregatedMetrics(deviceId: number, startTime: number, endTime: number): Promise<AggregatedMetrics>;
  getDailyMetrics(deviceId: number, date?: Date): Promise<AggregatedMetrics>;
  getWeeklyMetrics(deviceId: number, startDate?: Date): Promise<AggregatedMetrics>;
  getCampaignMetrics(campaignId: number, startTime: number, endTime: number): Promise<AggregatedMetrics>;
}

/**
 * Transaction State enum
 */
export enum TransactionState {
  Idle = 'idle',
  Pending = 'pending',
  Success = 'success',
  Error = 'error'
}

/**
 * Transaction Status interface
 */
export interface TransactionStatus {
  hash: Hash | null;
  description: string;
  state: TransactionState;
  error?: Error | null;
  receipt?: TransactionReceipt | null;
}

/**
 * Factory type for creating contract adapters
 */
export type ContractAdapterFactory<T extends BaseContractService> = (
  provider: any, 
  address?: Address
) => T; 