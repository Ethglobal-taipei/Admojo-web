import crypto from 'crypto';

/**
 * Interface for webhook verification options
 */
export interface VerificationOptions {
  payload: any;
  signature: string;
  secret: string;
  timestamp?: string;
  algorithm?: string;
}

/**
 * Class for verifying webhook signatures from different providers
 */
export class WebhookVerifier {
  /**
   * Verify a webhook signature based on the provider
   */
  public static verify(provider: string, options: VerificationOptions): boolean {
    switch (provider) {
      case 'stripe':
        return WebhookVerifier.verifyStripe(options);
      case 'github':
        return WebhookVerifier.verifyGithub(options);
      case 'blockchain':
        return WebhookVerifier.verifyBlockchain(options);
      default:
        console.warn(`No verification method implemented for provider: ${provider}`);
        return true; // Default to accepting if no verification method exists
    }
  }

  /**
   * Verify a Stripe webhook signature
   * https://stripe.com/docs/webhooks/signatures
   */
  private static verifyStripe(options: VerificationOptions): boolean {
    const { payload, signature, secret, timestamp } = options;
    
    if (!timestamp) {
      throw new Error('Timestamp is required for Stripe webhook verification');
    }
    
    const payloadString = typeof payload === 'string' ? payload : JSON.stringify(payload);
    const signedPayload = `${timestamp}.${payloadString}`;
    
    const expectedSignature = crypto
      .createHmac('sha256', secret)
      .update(signedPayload)
      .digest('hex');
    
    return crypto.timingSafeEqual(
      Buffer.from(signature),
      Buffer.from(expectedSignature)
    );
  }

  /**
   * Verify a GitHub webhook signature
   * https://docs.github.com/en/developers/webhooks-and-events/webhooks/securing-your-webhooks
   */
  private static verifyGithub(options: VerificationOptions): boolean {
    const { payload, signature, secret } = options;
    
    const payloadString = typeof payload === 'string' ? payload : JSON.stringify(payload);
    
    const expectedSignature = crypto
      .createHmac('sha256', secret)
      .update(payloadString)
      .digest('hex');
    
    const providedSignature = signature.startsWith('sha256=')
      ? signature.substring(7)
      : signature;
    
    return crypto.timingSafeEqual(
      Buffer.from(providedSignature),
      Buffer.from(expectedSignature)
    );
  }

  /**
   * Verify a custom blockchain webhook signature
   * Implementation will depend on your specific blockchain signature scheme
   */
  private static verifyBlockchain(options: VerificationOptions): boolean {
    const { payload, signature, secret, algorithm = 'sha256' } = options;
    
    const payloadString = typeof payload === 'string' ? payload : JSON.stringify(payload);
    
    const expectedSignature = crypto
      .createHmac(algorithm, secret)
      .update(payloadString)
      .digest('hex');
    
    // Simple string comparison - in production, you might want to use more 
    // sophisticated verification based on your blockchain signature scheme
    return signature === expectedSignature;
  }
} 