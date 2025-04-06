import { io, Socket } from 'socket.io-client';
import { EventEmitter } from 'events';
import { processPaymentsForEvent, BlockchainEventType as PaymentEventType } from '../cron/process-payments';

// Custom logger for WebSocket manager with timestamps
const logger = {
  info: (message: string, data?: any) => {
    const timestamp = new Date().toISOString();
    const logMessage = `[${timestamp}] [BLOCKCHAIN_WS] [INFO] ${message}`;
    if (data) {
      console.log(logMessage, data);
    } else {
      console.log(logMessage);
    }
  },
  warn: (message: string, data?: any) => {
    const timestamp = new Date().toISOString();
    const logMessage = `[${timestamp}] [BLOCKCHAIN_WS] [WARN] ${message}`;
    if (data) {
      console.warn(logMessage, data);
    } else {
      console.warn(logMessage);
    }
  },
  error: (message: string, error?: any) => {
    const timestamp = new Date().toISOString();
    const logMessage = `[${timestamp}] [BLOCKCHAIN_WS] [ERROR] ${message}`;
    if (error) {
      console.error(logMessage, error);
    } else {
      console.error(logMessage);
    }
  },
  debug: (message: string, data?: any) => {
    if (process.env.DEBUG === 'true') {
      const timestamp = new Date().toISOString();
      const logMessage = `[${timestamp}] [BLOCKCHAIN_WS] [DEBUG] ${message}`;
      if (data) {
        console.debug(logMessage, data);
      } else {
        console.debug(logMessage);
      }
    }
  }
};

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
  logger.info('Initializing WebSocket connection...');
  
  if (initialized && socket?.connected) {
    logger.info('WebSocket already initialized and connected');
    return { connected: true };
  }
  
  try {
    // Check if configuration is available
    if (!PERFORMANCE_ORACLE_ADDRESS) {
      logger.error('PERFORMANCE_ORACLE_ADDRESS not set in environment variables');
    }
    
    if (!NODIT_API_KEY) {
      logger.error('NODIT_API_KEY not set in environment variables');
    }
    
    logger.info(`Using configuration: NETWORK=${NETWORK}, ORACLE=${PERFORMANCE_ORACLE_ADDRESS}`);
    
    // Close existing socket if any
    if (socket) {
      logger.info('Closing existing socket connection');
      socket.disconnect();
      socket = null;
    }
    
    // Create new socket connection
    logger.info(`Connecting to WebSocket at ${WS_URL}...`);
    socket = io(WS_URL, {
      auth: {
        apiKey: NODIT_API_KEY
      },
      query: {
        protocol: 'ethereum',
        network: NETWORK
      },
      rejectUnauthorized: false, // This should be true in production for better security unless your server uses a self-signed certificate.
      transports: ["websocket"],
      path: "/v1/websocket/",
      reconnection: true,
      reconnectionAttempts: Infinity,
      reconnectionDelay: 1000,
      reconnectionDelayMax: 30000
    });
    
    // Set up event handlers
    setupSocketEventHandlers();
    
    initialized = true;
    logger.info('WebSocket initialization complete');
    return { connected: socket.connected };
  } catch (error) {
    logger.error('Error initializing WebSocket:', error);
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
    logger.info('Connected to blockchain WebSocket');
    status.connected = true;
    status.reconnectAttempts = 0;
    
    // Subscribe to events
    subscribeToBlockchainEvents();
  });
  
  // Handle disconnect event
  socket.on('disconnect', (reason) => {
    logger.warn(`Disconnected from blockchain WebSocket: ${reason}`);
    status.connected = false;
  });
  
  // Handle error event
  socket.on('error', (error) => {
    logger.error('WebSocket error:', error);
  });
  
  // Handle reconnect event
  socket.on('reconnect', (attemptNumber) => {
    logger.info(`Reconnected to blockchain WebSocket after ${attemptNumber} attempts`);
    status.connected = true;
    status.reconnectAttempts = attemptNumber;
    
    // Resubscribe to events after reconnection
    subscribeToBlockchainEvents();
  });
  
  // Handle reconnect attempt event
  socket.on('reconnect_attempt', (attemptNumber) => {
    logger.info(`Attempting to reconnect (${attemptNumber})...`);
    status.reconnectAttempts = attemptNumber;
  });
  
  // Handle reconnect error event
  socket.on('reconnect_error', (error) => {
    logger.error('Reconnection error:', error);
  });
  
  // Handle reconnect failed event
  socket.on('reconnect_failed', () => {
    logger.error('Reconnection failed after all attempts');
  });
  
  // Handle incoming blockchain events
  socket.on('event', async (eventData) => {
    try {
      logger.info('Received blockchain event:', { 
        transactionHash: eventData.transactionHash,
        blockNumber: eventData.blockNumber,
        topic: eventData.topics?.[0]
      });
      logger.debug('Full event data:', eventData);
      
      // Update status
      status.lastEventTime = new Date().toISOString();
      status.eventsReceived++;
      
      // Emit event for other parts of the application
      blockchainEvents.emit('blockchainEvent', eventData);
      
      // Process payments based on the event
      await processEventAndTriggerPayments(eventData);
    } catch (error) {
      logger.error('Error processing blockchain event:', error);
    }
  });
  
  logger.info('Socket event handlers set up successfully');
}

/**
 * Subscribe to blockchain events
 */
function subscribeToBlockchainEvents() {
  if (!socket || !socket.connected) {
    logger.warn('Cannot subscribe to events: socket not connected');
    return;
  }
  
  // Log the event signatures and topics we're subscribing to
  logger.info('Event signatures:', EVENT_SIGNATURES);
  logger.info('Event topics:', EVENT_TOPICS);
  
  // Subscribe to MetricsUpdated events
  logger.info(`Subscribing to MetricsUpdated events from contract: ${PERFORMANCE_ORACLE_ADDRESS}`);
  socket.emit('subscribe', {
    eventType: 'LOG',
    address: PERFORMANCE_ORACLE_ADDRESS,
    topics: [EVENT_TOPICS[BlockchainEventType.MetricsUpdated]]
  });
  
  // Subscribe to BatchMetricsUpdated events
  logger.info(`Subscribing to BatchMetricsUpdated events from contract: ${PERFORMANCE_ORACLE_ADDRESS}`);
  socket.emit('subscribe', {
    eventType: 'LOG',
    address: PERFORMANCE_ORACLE_ADDRESS,
    topics: [EVENT_TOPICS[BlockchainEventType.BatchMetricsUpdated]]
  });
  
  logger.info('Subscribed to all blockchain events');
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
    logger.warn('Unknown event topic:', eventTopic);
    return;
  }
  
  logger.info(`Processing ${eventType} event from transaction ${transactionHash}`);
  
  try {
    // Parse event data
    const eventParams = parseEventData(eventType, data, topics);
    
    // Log event parameters
    logger.info(`Parsed event parameters:`, eventParams);
    
    // Process payments
    logger.info(`Triggering payment processing for ${eventType} event`);
    await processPaymentsForEvent(eventType, eventParams, {
      transactionHash,
      blockNumber
    });
    
    logger.info(`Successfully processed payments for ${eventType} event from tx ${transactionHash}`);
  } catch (error) {
    logger.error(`Error processing payments for ${eventType} event:`, error);
  }
}

/**
 * Parse event data based on event type
 */
function parseEventData(eventType: BlockchainEventType, data: string, topics: string[]): any {
  logger.debug(`Parsing event data for ${eventType}:`, { data, topics });
  
  switch (eventType) {
    case BlockchainEventType.MetricsUpdated:
      // Parse MetricsUpdated event data
      // Format: MetricsUpdated(deviceId, timestamp, views, taps)
      const parsedData = {
        deviceId: parseInt(topics[1], 16),
        timestamp: parseInt(topics[2], 16),
        views: parseInt(topics[3], 16),
        taps: parseInt(data, 16)
      };
      logger.debug(`Parsed MetricsUpdated data:`, parsedData);
      return parsedData;
      
    case BlockchainEventType.BatchMetricsUpdated:
      // Parse BatchMetricsUpdated event data
      // This would need proper ABI decoding for array data
      const batchData = {
        timestamp: parseInt(topics[1], 16),
        // To properly decode batch data, we would need more sophisticated ABI decoding
        rawData: data
      };
      logger.debug(`Parsed BatchMetricsUpdated data:`, batchData);
      return batchData;
      
    default:
      logger.error(`Unknown event type: ${eventType}`);
      throw new Error(`Unknown event type: ${eventType}`);
  }
}

/**
 * Get current WebSocket status
 */
export function getWebSocketStatus(): WebSocketStatus {
  // Add some real-time info to the status
  const currentStatus = { ...status };
  
  // For debugging, log the full status
  logger.debug('Current WebSocket status:', currentStatus);
  
  return currentStatus;
}

/**
 * Close the WebSocket connection
 */
export function closeWebSocket(): void {
  if (socket) {
    logger.info('Closing WebSocket connection');
    socket.disconnect();
    socket = null;
    initialized = false;
    status.connected = false;
    logger.info('WebSocket connection closed');
  } else {
    logger.info('No WebSocket connection to close');
  }
}

// Initialize the WebSocket when this module is imported
if (typeof window === 'undefined') {  // Only run on server-side
  logger.info('Server-side initialization detected, starting WebSocket connection');
  initializeWebSocket()
    .then(({ connected }) => {
      logger.info(`WebSocket initialized on server start. Connected: ${connected}`);
    })
    .catch(error => {
      logger.error('Failed to initialize WebSocket on server start:', error);
    });
} else {
  logger.info('Client-side environment detected, skipping automatic WebSocket initialization');
} 