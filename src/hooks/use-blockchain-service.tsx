'use client';

import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { usePrivy, useWallets } from '@privy-io/react-auth';
import { type Address, type Hash, custom } from 'viem';
import { holesky } from 'viem/chains';
import { toast } from '@/lib/toast';

import { 
  AdNetBlockchainService, 
  createBlockchainService,
  TransactionStatus,
  TransactionState,
  TransactionReceipt
} from '@/lib/blockchain';

// Target chain information
const TARGET_CHAIN = {
  id: holesky.id,
  name: holesky.name,
  rpcUrl: 'https://ethereum-holesky.nodit.io/4I8CTQl1fobEdme9QgtY9DVkLbu3updE',
  blockExplorer: 'https://holesky.etherscan.io',
};

// Blockchain context type
type BlockchainContextType = {
  service: AdNetBlockchainService | null;
  isLoading: boolean;
  error: Error | null;
  chainId: number | null;
  isCorrectChain: boolean;
  switchChain: () => Promise<boolean>;
  transactions: Map<Hash, TransactionStatus>;
  address: string | null;
};

// Create context with default values
const BlockchainContext = createContext<BlockchainContextType | undefined>(undefined);

// Provider component
export function BlockchainProvider({ children }: { children: React.ReactNode }) {
  const { authenticated, user, ready, login } = usePrivy();
  const { wallets } = useWallets();
  const [service, setService] = useState<AdNetBlockchainService | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<Error | null>(null);
  const [chainId, setChainId] = useState<number | null>(null);
  const [isCorrectChain, setIsCorrectChain] = useState<boolean>(false);
  
  // Transaction tracking
  const [transactions, setTransactions] = useState<Map<Hash, TransactionStatus>>(new Map());
  
  // Get provider from Privy wallet - returns a Promise
  const getProvider = useCallback(async () => {
    if (!user) return null;
    
    try {
      // First check if we have connected wallets through useWallets
      if (wallets && wallets.length > 0) {
        // Prefer embedded wallet if available
        const embeddedWallet = wallets.find(wallet => wallet.walletClientType === 'privy');
        if (embeddedWallet) {
          const provider = await embeddedWallet.getEthereumProvider();
          return provider;
        }
        
        // Otherwise use the first available wallet
        const firstWallet = wallets[0];
        if (firstWallet) {
          const provider = await firstWallet.getEthereumProvider();
          return provider;
        }
      }
      
      // Legacy fallbacks
      if (user.wallet && (user.wallet as any).provider) {
        return (user.wallet as any).provider;
      }
      
      if ((user as any).embeddedWallet && (user as any).embeddedWallet.provider) {
        return (user as any).embeddedWallet.provider;
      }
      
      if ((user as any).provider) {
        return (user as any).provider;
      }
      
      if (typeof window !== 'undefined' && (window as any).ethereum) {
        return (window as any).ethereum;
      }
      
      console.warn('No wallet provider found');
      return null;
    } catch (err) {
      console.error('Error accessing provider:', err);
      return null;
    }
  }, [user, wallets]);
  
  // Function to check current chain ID
  const checkChainId = useCallback(async () => {
    try {
      const provider = await getProvider();
      if (!provider || typeof provider.request !== 'function') return;
      
      // Get current chain ID from provider
      const chainIdHex = await provider.request({ method: 'eth_chainId' });
      const currentChainId = parseInt(chainIdHex, 16);
      
      setChainId(currentChainId);
      setIsCorrectChain(currentChainId === TARGET_CHAIN.id);
    } catch (err) {
      console.error('Error checking chain ID:', err instanceof Error ? err.message : JSON.stringify(err));
    }
  }, [getProvider]);
  
  // Initialize blockchain service
  const initializeService = useCallback(async () => {
    if (!ready || !authenticated) {
      setService(null);
      return;
    }
    
    try {
      setIsLoading(true);
      setError(null);
      
      // Extract wallet data from Privy user
      const walletAddress = user?.wallet?.address as Address;
      
      if (!walletAddress) {
        console.log("No wallet address found, attempting to create an embedded wallet");
        try {
          await login();
          // After login completes, this function will be called again
          setIsLoading(false);
          return;
        } catch (loginErr) {
          console.error("Failed to create wallet:", loginErr);
          throw new Error("Could not create a wallet. Please try again.");
        }
      }
      
      const provider = await getProvider();
      
      if (!provider || typeof provider.request !== 'function') {
        console.error("No provider found for wallet", walletAddress);
        throw new Error('No wallet provider found');
      }
      
      try {
        // Create blockchain service
        const blockchainService = createBlockchainService(
          custom(provider),
          walletAddress
        );
        
        // Connect to the blockchain
        await blockchainService.connect();
        
        // Set the service
        setService(blockchainService);
        
        // Set up transaction listener
        blockchainService.addTransactionListener(handleTransactionUpdate);
        
        // Check chain and prompt to switch if needed
        const chainIdHex = await provider.request({ method: 'eth_chainId' });
        const currentChainId = parseInt(chainIdHex, 16);
        setChainId(currentChainId);
        setIsCorrectChain(currentChainId === TARGET_CHAIN.id);
        
        if (currentChainId !== TARGET_CHAIN.id) {
          toast(
            "Wrong Network",
            { description: `Please switch to ${TARGET_CHAIN.name} to use this application` },
            "warning"
          );
        }
      } catch (serviceErr) {
        console.error('Error creating blockchain service:', serviceErr instanceof Error ? serviceErr.message : JSON.stringify(serviceErr));
        throw new Error(`Failed to initialize blockchain: ${serviceErr instanceof Error ? serviceErr.message : 'Unknown error'}`);
      }
    } catch (err) {
      console.error('Error initializing blockchain service:', err instanceof Error ? err.message : JSON.stringify(err));
      // Provide more context in the error message
      const errorMessage = err instanceof Error ? err.message : 'Unknown error initializing blockchain';
      console.log('Error details:', JSON.stringify(err, null, 2));
      setError(new Error(errorMessage));
      setService(null);
    } finally {
      setIsLoading(false);
    }
  }, [authenticated, ready, user, getProvider, login]);
  
  // Handle transaction updates
  const handleTransactionUpdate = useCallback((hash: Hash, receipt: TransactionReceipt) => {
    setTransactions(prev => {
      const newMap = new Map(prev);
      
      // Get existing transaction status or create a new one
      const existingStatus = prev.get(hash) || {
        hash,
        description: 'Transaction',
        state: TransactionState.Pending
      };
      
      // Update status based on receipt
      const newStatus: TransactionStatus = {
        ...existingStatus,
        state: receipt.status === 'success' ? TransactionState.Success : TransactionState.Error,
        receipt
      };
      
      // Update the map
      newMap.set(hash, newStatus);
      
      return newMap;
    });
    
    // Show toast notification
    const txStatus = receipt.status === 'success' ? 'succeeded' : 'failed';
    const txUrl = `${TARGET_CHAIN.blockExplorer}/tx/${hash}`;
    
    toast(
      `Transaction ${txStatus}`,
      { 
        description: `View on block explorer`, 
        action: {
          label: "View",
          onClick: () => window.open(txUrl, '_blank')
        }
      },
      receipt.status === 'success' ? 'success' : 'error'
    );
  }, []);
  
  // Add a new transaction to track
  const trackTransaction = useCallback((hash: Hash, description: string) => {
    setTransactions(prev => {
      const newMap = new Map(prev);
      newMap.set(hash, {
        hash,
        description,
        state: TransactionState.Pending
      });
      return newMap;
    });
  }, []);
  
  // Switch chain to Target Chain
  const switchChain = useCallback(async () => {
    try {
      if (!service) {
        return false;
      }
      
      const success = await service.switchChain(TARGET_CHAIN.id);
      
      if (success) {
        await checkChainId();
        return true;
      }
      
      return false;
    } catch (error) {
      console.error('Failed to switch chain:', error);
      
      toast(
        "Network Error", 
        { description: "Failed to switch network. Please manually switch to Holesky testnet." }, 
        "error"
      );
      
      return false;
    }
  }, [service, checkChainId]);
  
  // Initialize service when auth state changes
  useEffect(() => {
    if (authenticated && ready) {
      // Delay slightly for wallet to be fully ready
      const timer = setTimeout(() => {
        initializeService();
        checkChainId();
      }, 500);
      return () => clearTimeout(timer);
    }
    
    // Cleanup function
    return () => {
      if (service) {
        // Remove transaction listener
        service.removeTransactionListener(handleTransactionUpdate);
      }
    };
  }, [authenticated, ready, initializeService, checkChainId, service, handleTransactionUpdate]);
  
  // Setup chain change listeners
  useEffect(() => {
    if (!authenticated) return;
    
    let provider: any = null;
    
    // Setup async function to get provider and set up listeners
    const setupListeners = async () => {
      provider = await getProvider();
      
      // Only proceed if we have a provider with event handling
      if (!provider || typeof provider.on !== 'function') return;
      
      // Listen for chain changes
      provider.on('chainChanged', (chainId: string) => {
        const newChainId = parseInt(chainId, 16);
        setChainId(newChainId);
        setIsCorrectChain(newChainId === TARGET_CHAIN.id);
        
        // Reload on chain change
        if (newChainId === TARGET_CHAIN.id) {
          initializeService();
        }
      });
      
      // Listen for account changes
      provider.on('accountsChanged', () => {
        // Reinitialize on account change
        initializeService();
      });
    };
    
    // Set up the listeners
    setupListeners();
    
    // Clean up function
    return () => {
      const cleanupListeners = async () => {
        const provider = await getProvider();
        if (provider && typeof provider.removeListener === 'function') {
          provider.removeListener('chainChanged', () => {});
          provider.removeListener('accountsChanged', () => {});
        }
      };
      
      cleanupListeners();
    };
  }, [authenticated, getProvider, initializeService]);
  
  // Create context value
  const contextValue: BlockchainContextType = {
    service,
    isLoading,
    error,
    chainId,
    isCorrectChain,
    switchChain,
    transactions,
    address: user?.wallet?.address as string | null
  };
  
  // Render provider
  return (
    <BlockchainContext.Provider value={contextValue}>
      {children}
    </BlockchainContext.Provider>
  );
}

// Hook to use the blockchain context
export function useBlockchainService() {
  const context = useContext(BlockchainContext);
  
  if (context === undefined) {
    throw new Error('useBlockchainService must be used within a BlockchainProvider');
  }
  
  return context;
} 