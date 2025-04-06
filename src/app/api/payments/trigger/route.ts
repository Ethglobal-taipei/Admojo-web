import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import { processPaymentsForEvent, BlockchainEventType } from '@/lib/cron/process-payments';

const prisma = new PrismaClient();

/**
 * API handler for getting payment status
 */
export async function GET(request: NextRequest) {
  try {
    // Get query parameters
    const searchParams = request.nextUrl.searchParams;
    const campaignId = searchParams.get('campaignId');
    const deviceId = searchParams.get('deviceId');
    const limit = parseInt(searchParams.get('limit') || '10');
    const page = parseInt(searchParams.get('page') || '1');
    
    // Build query
    const query: any = {};
    
    if (campaignId) {
      query.campaignId = parseInt(campaignId);
    }
    
    if (deviceId) {
      query.deviceId = parseInt(deviceId);
    }
    
    // Get payments from the database - assuming a transaction model exists
    // Note: Update this to match your actual Prisma schema model name
    const payments = await prisma.$queryRaw`
      SELECT * FROM "PaymentTransaction" 
      WHERE ${campaignId ? `"campaignId" = ${parseInt(campaignId)}` : 'TRUE'} 
      AND ${deviceId ? `"deviceId" = ${parseInt(deviceId)}` : 'TRUE'}
      ORDER BY "timestamp" DESC
      LIMIT ${limit} OFFSET ${(page - 1) * limit}
    `;
    
    // Get total count for pagination
    const totalResult: { total: number }[] = await prisma.$queryRaw`
      SELECT COUNT(*) as "total" FROM "PaymentTransaction"
      WHERE ${campaignId ? `"campaignId" = ${parseInt(campaignId)}` : 'TRUE'} 
      AND ${deviceId ? `"deviceId" = ${parseInt(deviceId)}` : 'TRUE'}
    `;
    const total = totalResult && totalResult.length > 0 ? Number(totalResult[0].total) : 0;
    
    return NextResponse.json({
      success: true,
      data: {
        payments,
        pagination: {
          total,
          page,
          limit,
          totalPages: Math.ceil(total / limit)
        }
      }
    });
  } catch (error: any) {
    console.error('Error getting payment status:', error);
    return NextResponse.json({
      success: false,
      message: 'Failed to get payment status',
      error: error.message
    }, { status: 500 });
  }
}

/**
 * API handler for manually triggering a payment
 */
export async function POST(request: NextRequest) {
  try {
    // Get request body
    const body = await request.json();
    const { deviceId, timestamp, views, taps } = body;
    
    // Validate required fields
    if (!deviceId || !timestamp) {
      return NextResponse.json({
        success: false,
        message: 'Missing required fields: deviceId and timestamp are required'
      }, { status: 400 });
    }
    
    // Default values for views and taps
    const viewCount = views || 0;
    const tapCount = taps || 0;
    
    // Create mock event data
    const eventParams = {
      deviceId: parseInt(deviceId),
      timestamp: parseInt(timestamp),
      views: viewCount,
      taps: tapCount
    };
    
    // Mock metadata
    const metadata = {
      transactionHash: `manual-trigger-${Date.now()}`,
      blockNumber: 0
    };
    
    // Trigger payment processing
    const result = await processPaymentsForEvent(
      BlockchainEventType.MetricsUpdated,
      eventParams,
      metadata
    );
    
    if (result) {
      return NextResponse.json({
        success: true,
        message: 'Payment processing triggered successfully',
        eventParams
      });
    } else {
      return NextResponse.json({
        success: false,
        message: 'Payment processing failed',
        eventParams
      }, { status: 500 });
    }
  } catch (error: any) {
    console.error('Error triggering payment:', error);
    return NextResponse.json({
      success: false,
      message: 'Failed to trigger payment',
      error: error.message
    }, { status: 500 });
  }
} 