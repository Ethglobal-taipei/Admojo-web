import { NextRequest, NextResponse } from 'next/server';

/**
 * Test webhook endpoint
 * Can be used to verify the webhook server is working
 */
export async function GET() {
  return NextResponse.json(
    { 
      success: true, 
      message: 'Webhook server is operational',
      timestamp: new Date().toISOString()
    },
    { status: 200 }
  );
}

/**
 * Test webhook POST endpoint
 * Echoes back the request data
 */
export async function POST(request: NextRequest) {
  try {
    // Get all headers
    const headers = Object.fromEntries(request.headers.entries());
    
    // Get the body
    const body = await request.json();
    
    // Echo everything back
    return NextResponse.json(
      { 
        success: true, 
        message: 'Webhook test endpoint',
        echo: {
          headers,
          body,
          timestamp: new Date().toISOString()
        }
      },
      { status: 200 }
    );
  } catch (error) {
    return NextResponse.json(
      { 
        success: false, 
        message: error instanceof Error ? error.message : 'Unknown error processing webhook'
      },
      { status: 500 }
    );
  }
} 