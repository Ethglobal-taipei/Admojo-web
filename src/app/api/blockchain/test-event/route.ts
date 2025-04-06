import { NextRequest, NextResponse } from 'next/server';
import { processPaymentsForEvent, BlockchainEventType } from '@/lib/cron/process-payments';

/**
 * POST handler to simulate a blockchain event and trigger payment processing
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { eventType, deviceId, timestamp, views, taps, blockNumber } = body;
    
    // Default timestamp to current time if not provided
    const eventTimestamp = timestamp || Math.floor(Date.now() / 1000);
    
    // Validate required fields
    if (!deviceId) {
      return NextResponse.json({
        success: false,
        message: 'Missing required field: deviceId'
      }, { status: 400 });
    }
    
    // Determine event type
    const paymentEventType = 
      eventType === 'batch' ? 
        BlockchainEventType.BatchMetricsUpdated : 
        BlockchainEventType.MetricsUpdated;
    
    // Create event parameters
    const eventParams = {
      deviceId: Number(deviceId),
      timestamp: eventTimestamp,
      views: Number(views || 0),
      taps: Number(taps || 0)
    };
    
    // Create metadata
    const metadata = {
      transactionHash: `test-event-${Date.now()}`,
      blockNumber: blockNumber || 0
    };
    
    // Log the test event
    console.log(`[TEST] Processing test event: ${paymentEventType}`, {
      params: eventParams,
      metadata
    });
    
    // Process the event
    const result = await processPaymentsForEvent(
      paymentEventType,
      eventParams,
      metadata
    );
    
    return NextResponse.json({
      success: true,
      message: 'Test event processed',
      result,
      eventParams,
      metadata
    });
  } catch (error: any) {
    console.error('Error processing test event:', error);
    return NextResponse.json({
      success: false,
      message: 'Failed to process test event',
      error: error.message
    }, { status: 500 });
  }
} 