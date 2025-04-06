import { NextResponse } from 'next/server';
import { initializeWebSocket, getWebSocketStatus } from '@/lib/blockchain/websocket-manager';

// API endpoint to initialize WebSocket connection
export async function GET() {
  try {
    const status = getWebSocketStatus();
    
    return NextResponse.json({ 
      success: true, 
      message: 'WebSocket status retrieved',
      connected: status.connected,
      lastEventTime: status.lastEventTime,
      eventsReceived: status.eventsReceived,
      reconnectAttempts: status.reconnectAttempts
    }, { status: 200 });
  } catch (error: any) {
    console.error('Error getting WebSocket status:', error);
    return NextResponse.json({ 
      success: false, 
      message: 'Failed to get WebSocket status',
      error: error.message 
    }, { status: 500 });
  }
}

// API endpoint to manually initialize/restart the WebSocket
export async function POST() {
  try {
    const result = await initializeWebSocket();
    
    return NextResponse.json({ 
      success: true, 
      message: 'WebSocket initialized',
      connected: result.connected
    }, { status: 200 });
  } catch (error: any) {
    console.error('Error initializing WebSocket:', error);
    return NextResponse.json({ 
      success: false, 
      message: 'Failed to initialize WebSocket',
      error: error.message 
    }, { status: 500 });
  }
} 