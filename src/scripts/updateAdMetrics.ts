import { createWalletClient, http, createPublicClient, parseEther, Hex } from 'viem';
import { privateKeyToAccount } from 'viem/accounts';
import * as dotenv from 'dotenv';
import AdDataOracleABI from '../../adnet-contracts/out/AdDataOracle.sol/AdDataOracle.json';

// Load environment variables
dotenv.config();

// Environment constants
const PRIVATE_KEY = process.env.ORACLE_PRIVATE_KEY as Hex;
const RPC_URL = process.env.RPC_URL || 'https://rpc.sepolia.org';
const ORACLE_CONTRACT_ADDRESS = process.env.ORACLE_CONTRACT_ADDRESS as Hex;
const CHAIN_ID = Number(process.env.CHAIN_ID || 11155111); // Sepolia testnet is default

// Initialize account from private key
const account = privateKeyToAccount(PRIVATE_KEY);

// Initialize wallet client for signing transactions
const walletClient = createWalletClient({
  account,
  chain: {
    id: CHAIN_ID,
    name: 'Custom Chain',
    rpcUrls: {
      default: {
        http: [RPC_URL],
      },
      public: {
        http: [RPC_URL],
      },
    },
  },
  transport: http(),
});

// Initialize public client for reading contract data
const publicClient = createPublicClient({
  chain: {
    id: CHAIN_ID,
    name: 'Custom Chain',
    rpcUrls: {
      default: {
        http: [RPC_URL],
      },
      public: {
        http: [RPC_URL],
      },
    },
  },
  transport: http(),
});

/**
 * Convert a string to bytes32 format
 * @param text String to convert
 * @returns bytes32 representation
 */
function stringToBytes32(text: string): Hex {
  // Pad the string to 32 bytes
  const bytes = new TextEncoder().encode(text);
  const paddedArray = new Uint8Array(32);
  paddedArray.set(bytes.slice(0, Math.min(bytes.length, 32)));
  
  return `0x${Buffer.from(paddedArray).toString('hex')}` as Hex;
}

/**
 * Send IoT metrics to the AdDataOracle contract
 * @param deviceId Device identifier
 * @param views Number of views
 * @param interactions Number of interactions
 * @returns Transaction hash
 */
export async function sendIoTMetrics(
  deviceId: string,
  views: number,
  interactions: number
): Promise<string> {
  console.log(`Sending metrics for device ${deviceId}: ${views} views, ${interactions} interactions`);

  try {
    // Convert deviceId to bytes32
    const deviceIdBytes32 = stringToBytes32(deviceId);

    // Send transaction to call receiveData function
    const hash = await walletClient.writeContract({
      address: ORACLE_CONTRACT_ADDRESS,
      abi: AdDataOracleABI.abi,
      functionName: 'receiveData',
      args: [deviceIdBytes32, BigInt(views), BigInt(interactions)],
    });

    console.log(`Transaction sent: ${hash}`);
    
    // Wait for transaction confirmation
    const receipt = await publicClient.waitForTransactionReceipt({ hash });
    console.log(`Transaction confirmed in block ${receipt.blockNumber}`);
    
    return hash;
  } catch (error) {
    console.error('Error sending metrics to blockchain:', error);
    throw error;
  }
}

/**
 * Process IoT API data and send to blockchain
 * @param apiData API data from IoT device
 * @returns Transaction hash
 */
export async function processIoTApiData(apiData: {
  deviceId: string;
  metrics: { views: number; interactions: number };
}): Promise<string> {
  const { deviceId, metrics } = apiData;
  
  return sendIoTMetrics(deviceId, metrics.views, metrics.interactions);
}

// Example usage in an API endpoint
async function handleIoTWebhook(req: any, res: any) {
  try {
    const data = req.body;
    
    // Validate incoming data
    if (!data.deviceId || !data.metrics) {
      return res.status(400).json({ error: 'Invalid data format' });
    }
    
    // Process and send to blockchain
    const txHash = await processIoTApiData(data);
    
    return res.status(200).json({ success: true, transactionHash: txHash });
  } catch (error) {
    console.error('Error processing IoT webhook:', error);
    return res.status(500).json({ error: 'Failed to process IoT data' });
  }
}

// // If script is executed directly
// if (require.main === module) {
//   // Example manual execution with command line arguments
//   const args = process.argv.slice(2);
//   if (args.length >= 3) {
//     const deviceId = args[0];
//     const views = parseInt(args[1], 10);
//     const interactions = parseInt(args[2], 10);
    
//     sendIoTMetrics(deviceId, views, interactions)
//       .then(hash => {
//         console.log(`Successfully sent metrics. Transaction hash: ${hash}`);
//         process.exit(0);
//       })
//       .catch(error => {
//         console.error('Failed to send metrics:', error);
//         process.exit(1);
//       });
//   } else {
//     console.log('Usage: node updateAdMetrics.js <deviceId> <views> <interactions>');
//     process.exit(1);
//   }
// } 