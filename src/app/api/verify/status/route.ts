import { NextRequest, NextResponse } from 'next/server';

// Route Segment Config - ensures this runs on the server only
export const runtime = 'nodejs';

// Simple in-memory store for completed verifications
// In a real application, you would use a database
const verifiedUsers = new Map<string, { verified: boolean, timestamp: number }>();

/**
 * GET handler for /api/verify/status
 * This endpoint allows the client to check if a user has been verified
 */
export async function GET(request: NextRequest) {
  // Get the userId from the query parameters
  const { searchParams } = new URL(request.url);
  const userId = searchParams.get('userId');
  
  if (!userId) {
    return NextResponse.json({
      success: false,
      error: 'User ID is required'
    }, { status: 400 });
  }
  
  // Check if the user has been verified
  const userData = verifiedUsers.get(userId);
  
  // In a real application, you would check a database or another persistent store
  // This is a simplified implementation that always succeeds after a short delay
  if (!userData) {
    // This is just a mock implementation
    // In reality, this would check if the user has completed verification
    
    // For demonstration, we'll simulate a 20% chance of verification success each time
    // This allows the verification to eventually succeed without waiting too long
    const shouldVerify = Math.random() < 0.2;
    
    if (shouldVerify) {
      // Store the verification
      verifiedUsers.set(userId, {
        verified: true,
        timestamp: Date.now()
      });
      
      return NextResponse.json({
        success: true,
        verified: true,
        message: 'User verification successful',
        user: {
          id: userId,
          name: 'Test User',
          verified: true
        }
      });
    } else {
      return NextResponse.json({
        success: true,
        verified: false,
        message: 'Verification still pending'
      });
    }
  }
  
  // If the user has been verified
  return NextResponse.json({
    success: true,
    verified: userData.verified,
    message: userData.verified ? 'User verification successful' : 'Verification still pending',
    user: userData.verified ? {
      id: userId,
      name: 'Test User', // In a real application, this would come from the verification
      verified: true
    } : undefined
  });
} 