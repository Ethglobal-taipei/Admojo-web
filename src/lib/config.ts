/**
 * Application configuration
 */
export const config = {
  // RPC URL for blockchain connection
  RPC_URL: process.env.RPC_URL || 'https://sepolia.infura.io/v3/your-api-key',
  
  // Contract addresses
  BOOTH_REGISTRY_ADDRESS: process.env.BOOTH_REGISTRY_ADDRESS || '0x0000000000000000000000000000000000000000',
  
  // Webhook secrets
  WEBHOOK_SECRETS: {
    BLOCKCHAIN: process.env.WEBHOOK_SECRET_BLOCKCHAIN || '',
    STRIPE: process.env.WEBHOOK_SECRET_STRIPE || '',
    GITHUB: process.env.WEBHOOK_SECRET_GITHUB || '',
    // Add more webhook secrets as needed
  },
  
  // Webhook endpoints to send events to
  WEBHOOK_ENDPOINTS: {
    CAMPAIGN_CREATED: process.env.WEBHOOK_ENDPOINT_CAMPAIGN_CREATED || '',
    BOOTH_REGISTERED: process.env.WEBHOOK_ENDPOINT_BOOTH_REGISTERED || '',
    // Add more webhook endpoints as needed
  },
  
  // API keys and credentials
  API_KEYS: {
    METAL_API_KEY: process.env.METAL_API_KEY || '',
    // Add more API keys as needed
  },
  
  // Environment
  NODE_ENV: process.env.NODE_ENV || 'development',
  
  // Server
  PORT: process.env.PORT ? parseInt(process.env.PORT, 10) : 3000,
  HOST: process.env.HOST || 'localhost',
  
  // Feature flags
  FEATURES: {
    ENABLE_BLOCKCHAIN_LISTENER: process.env.ENABLE_BLOCKCHAIN_LISTENER === 'true',
    ENABLE_WEBHOOK_VERIFICATION: process.env.ENABLE_WEBHOOK_VERIFICATION === 'true',
    // Add more feature flags as needed
  },
}; 