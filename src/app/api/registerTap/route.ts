import { NextRequest, NextResponse } from 'next/server';
import { recordTap } from '@/lib/thingspeak';
import { updateTaps } from '@/lib/blockchain';

// Route Segment Config - ensures this runs on the server only
export const runtime = 'nodejs';

/**
 * Default device ID to use if none is provided
 * In a real application, this would be dynamically determined
 */
const DEFAULT_DEVICE_ID = 1;

/**
 * Get URL from the geturl API
 */
async function getAdUrl(origin: string): Promise<string> {
  try {
    const adResponse = await fetch(`${origin}/api/geturl`);
    if (!adResponse.ok) {
      throw new Error(`Failed to get ad URL: ${adResponse.status}`);
    }
    const data = await adResponse.json();
    return data.url;
  } catch (error) {
    console.error('Error getting ad URL:', error);
    return 'https://example.com/fallback';
  }
}

/**
 * POST handler for /api/registerTap
 * Records a tap in ThingSpeak and updates the blockchain
 */
export async function POST(request: NextRequest) {
  // Get the device ID from the request
  let deviceId: number;
  
  try {
    const body = await request.json();
    deviceId = body.deviceId || DEFAULT_DEVICE_ID;
  } catch {
    // If there's an error parsing the body, use the default device ID
    deviceId = DEFAULT_DEVICE_ID;
  }
  
  // Get the ad URL first - we'll need this regardless of success/failure
  const url = await getAdUrl(request.nextUrl.origin);
  
  try {
    // Step 1: Record the tap in ThingSpeak
    console.log(`Recording tap for device ${deviceId} in ThingSpeak...`);
    try {
      await recordTap(deviceId);
      console.log('Successfully recorded tap in ThingSpeak');
    } catch (thingspeakError) {
      console.error('ThingSpeak error:', thingspeakError);
      // Continue to blockchain step, don't fail completely
    }
    
    // Step 2: Update the tap on the blockchain
    console.log(`Updating tap for device ${deviceId} on blockchain...`);
    let txHash;
    try {
      txHash = await updateTaps(deviceId, 1);
      console.log('Successfully updated tap on blockchain, txHash:', txHash);
    } catch (blockchainError) {
      console.error('Blockchain error:', blockchainError);
      // This is server-side only, so it's more likely to fail in development
      // For production, consider handling this more gracefully
      txHash = 'blockchain-update-skipped';
    }
    
    // Return success with the advertisement URL and transaction hash
    return NextResponse.json({
      success: true,
      url,
      txHash,
      deviceId
    });
  } catch (error) {
    console.error('Error registering tap:', error);
    
    // Return an error response with the ad URL
    return NextResponse.json({
      success: false,
      url,
      error: error instanceof Error ? error.message : 'Failed to register tap'
    }, { status: 500 });
  }
}

/**
 * GET handler for /api/registerTap
 * Provides an alternative way to register a tap through a GET request
 */
export async function GET(request: NextRequest) {
  // Extract deviceId from query parameters if provided
  const deviceId = Number(request.nextUrl.searchParams.get('deviceId')) || DEFAULT_DEVICE_ID;
  
  // Get the ad URL first - we'll need this regardless of success/failure
  const url = await getAdUrl(request.nextUrl.origin);
  
  try {
    // Step 1: Record the tap in ThingSpeak
    console.log(`Recording tap for device ${deviceId} in ThingSpeak...`);
    try {
      await recordTap(deviceId);
      console.log('Successfully recorded tap in ThingSpeak');
    } catch (thingspeakError) {
      console.error('ThingSpeak error:', thingspeakError);
      // Continue to blockchain step, don't fail completely
    }
    
    // Step 2: Update the tap on the blockchain
    console.log(`Updating tap for device ${deviceId} on blockchain...`);
    let txHash;
    try {
      txHash = await updateTaps(deviceId, 1);
      console.log('Successfully updated tap on blockchain, txHash:', txHash);
    } catch (blockchainError) {
      console.error('Blockchain error:', blockchainError);
      // This is server-side only, so it's more likely to fail in development
      // For production, consider handling this more gracefully
      txHash = 'blockchain-update-skipped';
    }
    
    // Return success with the advertisement URL and transaction hash
    return NextResponse.json({
      success: true,
      url,
      txHash,
      deviceId
    });
  } catch (error) {
    console.error('Error registering tap:', error);
    
    // Return an error response with the ad URL
    return NextResponse.json({
      success: false,
      url,
      error: error instanceof Error ? error.message : 'Failed to register tap'
    }, { status: 500 });
  }
} 