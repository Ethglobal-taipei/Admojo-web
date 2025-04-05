import { io } from 'socket.io-client';
import { processHourlyPayments } from '../cron/process-hourly-payments';

// Configuration from environment variables
const NODIT_API_KEY = process.env.NODIT_API_KEY || '';
const PERFORMANCE_ORACLE_ADDRESS = process.env.PERFORMANCE_ORACLE_ADDRESS || '';
const RPC_URL = process.env.RPC_URL || '';

// Event signature for MetricsUpdated
const METRICS_UPDATED_EVENT_SIGNATURE = 'MetricsUpdated(uint256,uint256,uint256,uint256)';
const METRICS_UPDATED_TOPIC = '0x' + Buffer.from(
  METRICS_UPDATED_EVENT_SIGNATURE
).toString('hex');

// WebSocket connection configuration
const socket = io('wss://web3.nodit.io/v1/websocket', {
  auth: {
    apiKey: NODIT_API_KEY
  },
  query: {
    protocol: 'ethereum',
    network: 'mainnet'
  }
});

// Handle WebSocket connection
socket.on('connect', () => {
  console.log('Connected to Nodit WebSocket');
  
  // Subscribe to MetricsUpdated events
  socket.emit('subscribe', {
    eventType: 'LOG',
    address: PERFORMANCE_ORACLE_ADDRESS,
    topics: [METRICS_UPDATED_TOPIC]
  });
});

// Handle WebSocket disconnection
socket.on('disconnect', () => {
  console.log('Disconnected from Nodit WebSocket');
});

// Handle WebSocket errors
socket.on('error', (error) => {
  console.error('WebSocket error:', error);
});

// Handle incoming events
socket.on('event', async (data) => {
  try {
    console.log('Received event:', data);
    
    // Process the payment for this metrics update
    await processHourlyPayments();
    
  } catch (error) {
    console.error('Error processing event:', error);
  }
});

// Handle reconnection
socket.on('reconnect', (attemptNumber) => {
  console.log(`Reconnected to Nodit WebSocket after ${attemptNumber} attempts`);
  
  // Resubscribe to events after reconnection
  socket.emit('subscribe', {
    eventType: 'LOG',
    address: PERFORMANCE_ORACLE_ADDRESS,
    topics: [METRICS_UPDATED_TOPIC]
  });
});

// Export the socket instance for potential cleanup
export { socket }; 