import { blockchainListener } from './blockchain-listener';
import { WebhookVerifier } from './webhook-verifier';
import { config } from '@/lib/config';

/**
 * Interface for webhook event data
 */
export interface WebhookEvent {
  source: string;
  path: string;
  payload: any;
  signature?: string;
  headers: Record<string, string>;
}

/**
 * Result of processing a webhook
 */
export interface WebhookResult {
  success: boolean;
  message: string;
  data?: any;
}

/**
 * Class for processing webhook events from different sources
 */
export class WebhookProcessor {
  private handlers: Record<string, (event: WebhookEvent) => Promise<WebhookResult>>;
  
  constructor() {
    // Initialize handlers for different webhook sources
    this.handlers = {
      'blockchain': this.handleBlockchainWebhook.bind(this),
      'payment-provider': this.handlePaymentProviderWebhook.bind(this),
      'analytics': this.handleAnalyticsWebhook.bind(this),
      // Add more handlers as needed
    };
  }
  
  /**
   * Process a webhook event
   */
  public async processWebhook(event: WebhookEvent): Promise<WebhookResult> {
    // Validate the webhook signature if needed
    if (event.signature) {
      const isValid = this.validateSignature(event);
      if (!isValid) {
        throw new Error('Invalid webhook signature');
      }
    }
    
    // Route to specific handler based on source or path
    const handler = this.getHandlerForEvent(event);
    
    if (handler) {
      return handler(event);
    } else {
      // Log the event for unknown sources
      console.log('Received webhook from unknown source:', {
        source: event.source,
        path: event.path,
        payload: JSON.stringify(event.payload).substring(0, 200) + '...'
      });
      
      return {
        success: true,
        message: 'Webhook received but no specific handler found',
      };
    }
  }
  
  /**
   * Validate webhook signature
   */
  private validateSignature(event: WebhookEvent): boolean {
    // Get the appropriate webhook secret based on the source
    let secret = '';
    let timestamp = '';
    
    switch(event.source) {
      case 'blockchain':
        secret = config.WEBHOOK_SECRETS?.BLOCKCHAIN || '';
        break;
      case 'stripe':
        secret = config.WEBHOOK_SECRETS?.STRIPE || '';
        timestamp = event.headers['stripe-signature'] || '';
        break;
      case 'github':
        secret = config.WEBHOOK_SECRETS?.GITHUB || '';
        break;
      // Add more cases as needed
      default:
        console.warn(`No webhook secret configured for source: ${event.source}`);
        return true; // Accept by default if no secret is configured
    }
    
    // If no secret is configured, accept the webhook
    if (!secret) {
      console.warn(`Missing webhook secret for source: ${event.source}`);
      return true;
    }
    
    // Use the WebhookVerifier to validate the signature
    try {
      return WebhookVerifier.verify(event.source, {
        payload: event.payload,
        signature: event.signature || '',
        secret,
        timestamp
      });
    } catch (error) {
      console.error(`Error validating signature for ${event.source} webhook:`, error);
      return false;
    }
  }
  
  /**
   * Get the appropriate handler for a webhook event
   */
  private getHandlerForEvent(event: WebhookEvent): ((event: WebhookEvent) => Promise<WebhookResult>) | null {
    // First try to match by source
    if (event.source && this.handlers[event.source]) {
      return this.handlers[event.source];
    }
    
    // Then try to match by path
    if (event.path) {
      const pathParts = event.path.split('/');
      const firstPathPart = pathParts[0];
      
      if (firstPathPart && this.handlers[firstPathPart]) {
        return this.handlers[firstPathPart];
      }
    }
    
    // Return a generic handler for unknown sources
    return this.handleGenericWebhook.bind(this);
  }
  
  /**
   * Handle blockchain webhook events
   */
  private async handleBlockchainWebhook(event: WebhookEvent): Promise<WebhookResult> {
    try {
      // Start the blockchain listener if it's not already running
      await blockchainListener.startListening();
      
      return {
        success: true,
        message: 'Blockchain webhook processed successfully',
        data: { event: 'blockchain_webhook_processed' }
      };
    } catch (error) {
      console.error('Error handling blockchain webhook:', error);
      throw new Error('Failed to process blockchain webhook');
    }
  }
  
  /**
   * Handle payment provider webhook events
   */
  private async handlePaymentProviderWebhook(event: WebhookEvent): Promise<WebhookResult> {
    try {
      // Implement payment provider webhook handling
      console.log('Processing payment provider webhook:', event.payload);
      
      // Here you would process payment events, update database, etc.
      
      return {
        success: true,
        message: 'Payment provider webhook processed successfully',
        data: { event: 'payment_webhook_processed' }
      };
    } catch (error) {
      console.error('Error handling payment provider webhook:', error);
      throw new Error('Failed to process payment provider webhook');
    }
  }
  
  /**
   * Handle analytics webhook events
   */
  private async handleAnalyticsWebhook(event: WebhookEvent): Promise<WebhookResult> {
    try {
      // Implement analytics webhook handling
      console.log('Processing analytics webhook:', event.payload);
      
      // Here you would process analytics events, update metrics, etc.
      
      return {
        success: true,
        message: 'Analytics webhook processed successfully',
        data: { event: 'analytics_webhook_processed' }
      };
    } catch (error) {
      console.error('Error handling analytics webhook:', error);
      throw new Error('Failed to process analytics webhook');
    }
  }
  
  /**
   * Handle generic webhook events
   */
  private async handleGenericWebhook(event: WebhookEvent): Promise<WebhookResult> {
    // Log the event for debugging
    console.log('Processing generic webhook:', {
      source: event.source,
      path: event.path,
      headers: event.headers
    });
    
    return {
      success: true,
      message: 'Webhook received and acknowledged',
    };
  }
} 