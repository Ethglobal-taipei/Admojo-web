import { createPublicClient, createWalletClient, http, type PublicClient, type WalletClient } from 'viem';
import { privateKeyToAccount, type PrivateKeyAccount } from 'viem/accounts';
import { holesky } from 'viem/chains';
import PerformanceOracleABI from './PerformanceOracleABI.json';

// Export types from blockchain/types.ts and everything from blockchain/index.ts
export * from './blockchain/types';
export * from './blockchain/index';

// Check if we're running on the server
const isServer = typeof window === 'undefined';

// Get environment variables - using optional chaining to handle undefined
const RPC_URL = process.env.RPC_URL || '';
const PRIVATE_KEY = isServer ? (process.env.PRIVATE_KEY || '') : '';  // Only access PRIVATE_KEY on server
const CONTRACT_ADDRESS = process.env.CONTRACT_ADDRESS || '';

// Only create wallet client if PRIVATE_KEY is available
let walletClient: WalletClient | null = null;
let account: PrivateKeyAccount | null = null;
let publicClient: PublicClient | null = null;

// Function to ensure private key is properly formatted
function formatPrivateKey(key: string): `0x${string}` | null {
  if (!key) return null;
  
  // Remove any whitespace
  key = key.trim();
  
  // If it already starts with 0x, ensure it's the right format
  if (key.startsWith('0x')) {
    // Private key should be 0x + 64 hex chars (32 bytes)
    if (/^0x[0-9a-fA-F]{64}$/.test(key)) {
      return key as `0x${string}`;
    }
  } else {
    // If it doesn't start with 0x, add it and check length
    const withPrefix = `0x${key}`;
    if (/^0x[0-9a-fA-F]{64}$/.test(withPrefix)) {
      return withPrefix as `0x${string}`;
    }
  }
  
  console.error('Invalid private key format. Expected a 32-byte hex string with or without 0x prefix.');
  return null;
}

// Initialize clients if environment variables are available
// This will prevent client-side errors when env vars are missing
if (isServer && PRIVATE_KEY && RPC_URL) {
  try {
    // Format the private key properly
    const formattedKey = formatPrivateKey(PRIVATE_KEY);
    
    if (formattedKey) {
      account = privateKeyToAccount(formattedKey);
      walletClient = createWalletClient({
        account,
        chain: holesky,
        transport: http(RPC_URL),
      });

      publicClient = createPublicClient({
        chain: holesky,
        transport: http(RPC_URL),
      });
    }
  } catch (error) {
    console.error('Failed to initialize blockchain clients:', error);
    // Clients will remain null
  }
} else if (RPC_URL) {
  // If we're on the client side, we can still create a public client
  try {
    publicClient = createPublicClient({
      chain: holesky,
      transport: http(RPC_URL),
    });
  } catch (error) {
    console.error('Failed to initialize public client:', error);
  }
}

/**
 * Update taps for a device on the PerformanceOracle contract
 * 
 * @param deviceId - The ID of the device
 * @param tapCount - The number of taps to record
 * @returns Transaction hash
 */
export async function updateTaps(deviceId: number, tapCount: number): Promise<string> {
  try {
    if (!isServer) {
      throw new Error('This function can only be called on the server side');
    }
    
    if (!walletClient || !CONTRACT_ADDRESS) {
      throw new Error('Wallet client or contract address not available');
    }

    const timestamp = Math.floor(Date.now() / 1000); // Current timestamp in seconds
    
    // Call updateBatchTaps function on the contract
    const hash = await walletClient.writeContract({
      address: CONTRACT_ADDRESS as `0x${string}`,
      abi: PerformanceOracleABI,
      functionName: 'updateBatchTaps',
      args: [
        BigInt(timestamp),
        [BigInt(deviceId)],
        [BigInt(tapCount)]
      ],
    });
    
    return hash;
  } catch (error) {
    console.error('Error updating taps on blockchain:', error);
    throw new Error('Failed to update taps on blockchain');
  }
}

/**
 * Get metrics for a device
 * 
 * @param deviceId - The ID of the device
 * @param timestamp - The timestamp to get metrics for
 * @returns The views and taps for the device at the given timestamp
 */
export async function getMetrics(deviceId: number, timestamp: number): Promise<{ views: number, taps: number }> {
  try {
    if (!publicClient || !CONTRACT_ADDRESS) {
      throw new Error('Public client or contract address not available');
    }

    const result = await publicClient.readContract({
      address: CONTRACT_ADDRESS as `0x${string}`,
      abi: PerformanceOracleABI,
      functionName: 'getMetrics',
      args: [BigInt(deviceId), BigInt(timestamp)],
    });
    
    // Convert BigInt values to numbers
    return {
      views: Number(result[0]),
      taps: Number(result[1]),
    };
  } catch (error) {
    console.error('Error getting metrics from blockchain:', error);
    throw new Error('Failed to get metrics from blockchain');
  }
} 