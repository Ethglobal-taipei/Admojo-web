import { io, Socket } from 'socket.io-client';
import { EventEmitter } from 'events';
import { processPaymentsForEvent } from '../cron/process-payments';

// WebSocket status for monitoring
interface WebSocketStatus {
  connected: boolean;
  lastEventTime: string | null;
  eventsReceived: number;
  reconnectAttempts: number;
}

// Event types to subscribe to
enum BlockchainEventType {
  MetricsUpdated = 'MetricsUpdated',
  BatchMetricsUpdated = 'BatchMetricsUpdated'
}

// Event signature for events we're listening to
const EVENT_SIGNATURES = {
  [BlockchainEventType.MetricsUpdated]: 'MetricsUpdated(uint256,uint256,uint256,uint256)',
  [BlockchainEventType.BatchMetricsUpdated]: 'BatchMetricsUpdated(uint256,uint256[],uint256[],uint256[])'
};

// Topics are keccak256 hashes of event signatures
const EVENT_TOPICS = Object.entries(EVENT_SIGNATURES).reduce((acc, [key, signature]) => {
  acc[key as BlockchainEventType] = '0x' + Buffer.from(signature).toString('hex');
  return acc;
}, {} as Record<BlockchainEventType, string>);

// Configuration from environment variables
const NODIT_API_KEY = process.env.NODIT_API_KEY || '';
const PERFORMANCE_ORACLE_ADDRESS = process.env.PERFORMANCE_ORACLE_ADDRESS || '';
const RPC_URL = process.env.RPC_URL || '';
const WS_URL = process.env.WS_URL || 'wss://web3.nodit.io/v1/websocket';
const NETWORK = process.env.BLOCKCHAIN_NETWORK || 'holesky';

// Singleton instance management
let socket: Socket | null = null;
let initialized = false;
let status: WebSocketStatus = {
  connected: false,
  lastEventTime: null,
  eventsReceived: 0,
  reconnectAttempts: 0
};

// Event emitter for internal event handling
export const blockchainEvents = new EventEmitter();

/**
 * Initialize the WebSocket connection to listen for blockchain events
 */
export async function initializeWebSocket(): Promise<{ connected: boolean }> {
  if (initialized && socket?.connected) {
    console.log('WebSocket already initialized and connected');
    return { connected: true };
  }
  
  try {
    // Close existing socket if any
    if (socket) {
      socket.disconnect();
      socket = null;
    }
    
    // Create new socket connection
    socket = io(WS_URL, {
      auth: {
        apiKey: NODIT_API_KEY
      },
      query: {
        protocol: 'ethereum',
        network: NETWORK
      },
      reconnection: true,
      reconnectionAttempts: Infinity,
      reconnectionDelay: 1000,
      reconnectionDelayMax: 30000
    });
    
    // Set up event handlers
    setupSocketEventHandlers();
    
    initialized = true;
    return { connected: socket.connected };
  } catch (error) {
    console.error('Error initializing WebSocket:', error);
    throw error;
  }
}

/**
 * Set up the socket event handlers
 */
function setupSocketEventHandlers() {
  if (!socket) {
    throw new Error('Socket not initialized');
  }
  
  // Handle connect event
  socket.on('connect', () => {
    console.log('Connected to blockchain WebSocket');
    status.connected = true;
    status.reconnectAttempts = 0;
    
    // Subscribe to events
    subscribeToBlockchainEvents();
  });
  
  // Handle disconnect event
  socket.on('disconnect', (reason) => {
    console.log(`Disconnected from blockchain WebSocket: ${reason}`);
    status.connected = false;
  });
  
  // Handle error event
  socket.on('error', (error) => {
    console.error('WebSocket error:', error);
  });
  
  // Handle reconnect event
  socket.on('reconnect', (attemptNumber) => {
    console.log(`Reconnected to blockchain WebSocket after ${attemptNumber} attempts`);
    status.connected = true;
    status.reconnectAttempts = attemptNumber;
    
    // Resubscribe to events after reconnection
    subscribeToBlockchainEvents();
  });
  
  // Handle reconnect attempt event
  socket.on('reconnect_attempt', (attemptNumber) => {
    console.log(`Attempting to reconnect (${attemptNumber})...`);
    status.reconnectAttempts = attemptNumber;
  });
  
  // Handle incoming blockchain events
  socket.on('event', async (eventData) => {
    try {
      console.log('Received blockchain event:', eventData);
      
      // Update status
      status.lastEventTime = new Date().toISOString();
      status.eventsReceived++;
      
      // Emit event for other parts of the application
      blockchainEvents.emit('blockchainEvent', eventData);
      
      // Process payments based on the event
      await processEventAndTriggerPayments(eventData);
    } catch (error) {
      console.error('Error processing blockchain event:', error);
    }
  });
}

/**
 * Subscribe to blockchain events
 */
function subscribeToBlockchainEvents() {
  if (!socket || !socket.connected) {
    console.warn('Cannot subscribe to events: socket not connected');
    return;
  }
  
  // Subscribe to MetricsUpdated events
  socket.emit('subscribe', {
    eventType: 'LOG',
    address: PERFORMANCE_ORACLE_ADDRESS,
    topics: [EVENT_TOPICS[BlockchainEventType.MetricsUpdated]]
  });
  
  // Subscribe to BatchMetricsUpdated events
  socket.emit('subscribe', {
    eventType: 'LOG',
    address: PERFORMANCE_ORACLE_ADDRESS,
    topics: [EVENT_TOPICS[BlockchainEventType.BatchMetricsUpdated]]
  });
  
  console.log('Subscribed to blockchain events');
}

/**
 * Process an event and trigger payments
 */
async function processEventAndTriggerPayments(eventData: any) {
  // Extract event details
  const { topics, data, transactionHash, blockNumber } = eventData;
  const eventTopic = topics[0];
  
  // Determine event type
  let eventType: BlockchainEventType | null = null;
  for (const [type, topic] of Object.entries(EVENT_TOPICS)) {
    if (topic === eventTopic) {
      eventType = type as BlockchainEventType;
      break;
    }
  }
  
  if (!eventType) {
    console.warn('Unknown event topic:', eventTopic);
    return;
  }
  
  console.log(`Processing ${eventType} event from transaction ${transactionHash}`);
  
  try {
    // Parse event data
    const eventParams = parseEventData(eventType, data, topics);
    
    // Process payments
    await processPaymentsForEvent(eventType, eventParams, {
      transactionHash,
      blockNumber
    });
    
    console.log(`Successfully processed payments for ${eventType} event`);
  } catch (error) {
    console.error(`Error processing payments for ${eventType} event:`, error);
  }
}

/**
 * Parse event data based on event type
 */
function parseEventData(eventType: BlockchainEventType, data: string, topics: string[]): any {
  switch (eventType) {
    case BlockchainEventType.MetricsUpdated:
      // Parse MetricsUpdated event data
      // Format: MetricsUpdated(deviceId, timestamp, views, taps)
      return {
        deviceId: parseInt(topics[1], 16),
        timestamp: parseInt(topics[2], 16),
        views: parseInt(topics[3], 16),
        taps: parseInt(data, 16)
      };
      
    case BlockchainEventType.BatchMetricsUpdated:
      // Parse BatchMetricsUpdated event data
      // This would need proper ABI decoding for array data
      return {
        timestamp: parseInt(topics[1], 16),
        // To properly decode batch data, we would need more sophisticated ABI decoding
        rawData: data
      };
      
    default:
      throw new Error(`Unknown event type: ${eventType}`);
  }
}

/**
 * Get current WebSocket status
 */
export function getWebSocketStatus(): WebSocketStatus {
  return { ...status };
}

/**
 * Close the WebSocket connection
 */
export function closeWebSocket(): void {
  if (socket) {
    socket.disconnect();
    socket = null;
    initialized = false;
    status.connected = false;
    console.log('WebSocket connection closed');
  }
}

// Initialize the WebSocket when this module is imported
if (typeof window === 'undefined') {  // Only run on server-side
  initializeWebSocket()
    .then(() => console.log('WebSocket initialized on server start'))
    .catch(error => console.error('Failed to initialize WebSocket on server start:', error));
} 