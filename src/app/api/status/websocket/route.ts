import { NextResponse } from 'next/server';
import { getWebSocketStatus, initializeWebSocket, closeWebSocket } from '@/lib/blockchain/websocket-manager';

/**
 * GET handler to retrieve the current WebSocket status
 */
export async function GET() {
  try {
    const status = getWebSocketStatus();
    
    return NextResponse.json({
      success: true,
      status: {
        ...status,
        serverTime: new Date().toISOString()
      }
    });
  } catch (error: any) {
    console.error('Error getting WebSocket status:', error);
    return NextResponse.json({
      success: false,
      error: error.message
    }, { status: 500 });
  }
}

/**
 * POST handler to restart the WebSocket connection
 */
export async function POST() {
  try {
    // Close existing WebSocket connection if any
    closeWebSocket();
    
    // Initialize a new WebSocket connection
    const result = await initializeWebSocket();
    
    return NextResponse.json({
      success: true,
      message: 'WebSocket connection restarted',
      connected: result.connected
    });
  } catch (error: any) {
    console.error('Error restarting WebSocket connection:', error);
    return NextResponse.json({
      success: false,
      error: error.message
    }, { status: 500 });
  }
}

/**
 * DELETE handler to close the WebSocket connection
 */
export async function DELETE() {
  try {
    closeWebSocket();
    
    return NextResponse.json({
      success: true,
      message: 'WebSocket connection closed'
    });
  } catch (error: any) {
    console.error('Error closing WebSocket connection:', error);
    return NextResponse.json({
      success: false,
      error: error.message
    }, { status: 500 });
  }
} 