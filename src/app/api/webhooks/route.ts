import { NextRequest, NextResponse } from 'next/server';
import { WebhookProcessor } from '@/lib/webhooks/webhook-processor';

/**
 * Generic webhook endpoint handler
 * Can be accessed at /api/webhooks with an optional path parameter
 */
export async function POST(
  request: NextRequest,
  { params }: { params: { path?: string[] } }
) {
  try {
    // Parse the webhook payload
    const payload = await request.json();
    const source = request.headers.get('x-webhook-source') || 'unknown';
    const signature = request.headers.get('x-webhook-signature') || '';
    const path = params.path ? params.path.join('/') : '';
    
    console.log(`Webhook received from ${source} for path: ${path || 'root'}`);
    
    // Process the webhook with the appropriate handler
    const processor = new WebhookProcessor();
    const result = await processor.processWebhook({
      source,
      path,
      payload,
      signature,
      headers: Object.fromEntries(request.headers.entries())
    });
    
    // Return appropriate response
    return NextResponse.json(
      { success: true, message: result.message },
      { status: 200 }
    );
  } catch (error) {
    console.error('Webhook processing error:', error);
    
    return NextResponse.json(
      { 
        success: false, 
        message: error instanceof Error ? error.message : 'Unknown error processing webhook'
      },
      { status: 500 }
    );
  }
}

/**
 * Support for OPTIONS requests (CORS preflight)
 */
export async function OPTIONS() {
  return new NextResponse(null, {
    status: 204,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, X-Webhook-Source, X-Webhook-Signature',
    },
  });
} 