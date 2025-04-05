import { 
  createPublicClient, 
  createWalletClient, 
  http, 
  custom, 
  type Address, 
  type Hash, 
  type PublicClient, 
  type WalletClient, 
  type Transport 
} from 'viem';
import { holesky } from 'viem/chains';
import { 
  BlockchainService, 
  TransactionReceipt 
} from './types';

/**
 * Core blockchain service implementation
 * Provides common functionality for all blockchain interactions
 */
export class ViemBlockchainService implements BlockchainService {
  // Public clients for reading from blockchain
  protected publicClient: PublicClient;
  
  // Wallet client for sending transactions
  protected walletClient: WalletClient | null = null;
  
  // Provider information
  protected provider: Transport;
  protected userAddress: Address | null = null;
  
  // Network information
  protected network = holesky;
  
  // Transaction listeners
  private transactionListeners: ((hash: Hash, receipt: TransactionReceipt) => void)[] = [];
  
  /**
   * Constructor
   * @param provider Provider for blockchain interactions
   * @param address User's address (optional, can be set later)
   */
  constructor(provider: Transport, address?: Address) {
    this.provider = provider;
    this.userAddress = address || null;
    
    // Initialize public client for reading
    this.publicClient = createPublicClient({
      chain: this.network,
      transport: http()
    });
    
    // Initialize wallet client if address is provided
    if (this.userAddress) {
      this.initializeWalletClient();
    }
  }
  
  /**
   * Initialize wallet client with the user's address
   */
  protected initializeWalletClient(): void {
    if (!this.userAddress) {
      throw new Error('User address is required to initialize wallet client');
    }
    
    this.walletClient = createWalletClient({
      account: this.userAddress,
      chain: this.network,
      transport: this.provider
    });
  }
  
  /**
   * Connect to the blockchain
   */
  public async connect(): Promise<boolean> {
    try {
      // If we're already connected, return true
      if (this.isConnected) {
        return true;
      }
      
      // If we have a provider with request method (EIP-1193 provider)
      if (this.provider && typeof (this.provider as any).request === 'function') {
        // Request accounts from the provider
        const accounts = await (this.provider as any).request({ 
          method: 'eth_requestAccounts' 
        });
        
        // Set the user's address if we got accounts
        if (accounts && accounts.length > 0) {
          this.userAddress = accounts[0] as Address;
          this.initializeWalletClient();
          return true;
        }
      }
      
      return false;
    } catch (error) {
      console.error('Failed to connect to blockchain:', error instanceof Error ? error.message : JSON.stringify(error));
      return false;
    }
  }
  
  /**
   * Disconnect from the blockchain
   */
  public async disconnect(): Promise<void> {
    // Clear user address and wallet client
    this.userAddress = null;
    this.walletClient = null;
  }
  
  /**
   * Switch to another chain
   * @param chainId The chain ID to switch to
   */
  public async switchChain(chainId: number): Promise<boolean> {
    try {
      if (typeof (this.provider as any).request !== 'function') {
        throw new Error('Provider does not support chain switching');
      }
      
      await (this.provider as any).request({
        method: 'wallet_switchEthereumChain',
        params: [{ chainId: `0x${chainId.toString(16)}` }],
      });
      
      return true;
    } catch (error: any) {
      // If the chain doesn't exist, try to add it
      if (error.code === 4902) {
        return this.addChain(chainId);
      }
      
      console.error('Failed to switch chain:', error instanceof Error ? error.message : JSON.stringify(error));
      return false;
    }
  }
  
  /**
   * Add a chain to the wallet
   * @param chainId The chain ID to add
   * @private
   */
  private async addChain(chainId: number): Promise<boolean> {
    try {
      if (typeof (this.provider as any).request !== 'function') {
        throw new Error('Provider does not support adding chains');
      }
      
      // Only support adding Holesky for now
      if (chainId !== holesky.id) {
        throw new Error('Unsupported chain');
      }
      
      await (this.provider as any).request({
        method: 'wallet_addEthereumChain',
        params: [
          {
            chainId: `0x${chainId.toString(16)}`,
            chainName: holesky.name,
            nativeCurrency: {
              name: 'ETH',
              symbol: 'ETH',
              decimals: 18
            },
            rpcUrls: [holesky.rpcUrls.default.http[0]],
            blockExplorerUrls: [holesky.blockExplorers?.default.url]
          },
        ],
      });
      
      return true;
    } catch (error) {
      console.error('Failed to add chain:', error instanceof Error ? error.message : JSON.stringify(error));
      return false;
    }
  }
  
  /**
   * Wait for a transaction to be confirmed
   * @param hash Transaction hash
   */
  public async waitForTransaction(hash: Hash): Promise<TransactionReceipt> {
    try {
      // Wait for transaction receipt
      const receipt = await this.publicClient.waitForTransactionReceipt({ 
        hash 
      });
      
      // Create a standardized receipt object
      const transactionReceipt: TransactionReceipt = {
        hash,
        status: receipt.status === 'success' ? 'success' : 'failed',
        blockNumber: Number(receipt.blockNumber),
        blockHash: receipt.blockHash,
        transactionIndex: Number(receipt.transactionIndex)
      };
      
      // Notify all transaction listeners
      this.notifyTransactionListeners(hash, transactionReceipt);
      
      return transactionReceipt;
    } catch (error) {
      console.error('Failed to wait for transaction:', error instanceof Error ? error.message : JSON.stringify(error));
      
      // Create a failed receipt
      const failedReceipt: TransactionReceipt = {
        hash,
        status: 'failed',
        blockNumber: 0,
        blockHash: '0x',
        transactionIndex: 0
      };
      
      // Notify all transaction listeners
      this.notifyTransactionListeners(hash, failedReceipt);
      
      throw error;
    }
  }
  
  /**
   * Add a transaction listener
   * @param callback Function to call when a transaction is confirmed
   */
  public addTransactionListener(callback: (hash: Hash, receipt: TransactionReceipt) => void): void {
    this.transactionListeners.push(callback);
  }
  
  /**
   * Remove a transaction listener
   * @param callback Function to remove from listeners
   */
  public removeTransactionListener(callback: (hash: Hash, receipt: TransactionReceipt) => void): void {
    this.transactionListeners = this.transactionListeners.filter(listener => listener !== callback);
  }
  
  /**
   * Notify all transaction listeners about a confirmed transaction
   * @param hash Transaction hash
   * @param receipt Transaction receipt
   * @private
   */
  private notifyTransactionListeners(hash: Hash, receipt: TransactionReceipt): void {
    for (const listener of this.transactionListeners) {
      try {
        listener(hash, receipt);
      } catch (error) {
        console.error('Error in transaction listener:', error);
      }
    }
  }
  
  // Getters
  
  /**
   * Check if we are connected to the blockchain
   */
  public get isConnected(): boolean {
    return this.userAddress !== null && this.walletClient !== null;
  }
  
  /**
   * Get the user's address
   */
  public get address(): Address | null {
    return this.userAddress;
  }
  
  /**
   * Get the current chain ID
   */
  public get chainId(): number | null {
    return this.network.id;
  }
} 