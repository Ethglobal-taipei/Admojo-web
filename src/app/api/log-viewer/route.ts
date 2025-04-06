import { NextRequest, NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';
import { promises as fsPromises } from 'fs';

// In-memory log buffer to keep recent logs
const LOG_BUFFER_SIZE = 1000;
const logBuffer: string[] = [];

// Function to add a log to the buffer
export function addLog(message: string): void {
  const timestamp = new Date().toISOString();
  const logEntry = `[${timestamp}] ${message}`;
  
  logBuffer.push(logEntry);
  
  // Trim buffer if it gets too large
  if (logBuffer.length > LOG_BUFFER_SIZE) {
    logBuffer.shift();
  }
}

// Create a console.log wrapper that also adds to our buffer
const originalConsoleLog = console.log;
const originalConsoleWarn = console.warn;
const originalConsoleError = console.error;

// Override console methods to capture logs
console.log = (...args: any[]) => {
  originalConsoleLog(...args);
  addLog(`[LOG] ${args.join(' ')}`);
};

console.warn = (...args: any[]) => {
  originalConsoleWarn(...args);
  addLog(`[WARN] ${args.join(' ')}`);
};

console.error = (...args: any[]) => {
  originalConsoleError(...args);
  addLog(`[ERROR] ${args.join(' ')}`);
};

/**
 * GET handler to retrieve the log buffer
 */
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const filter = searchParams.get('filter');
    const limit = parseInt(searchParams.get('limit') || '100');
    
    // Filter logs if needed
    let filteredLogs = logBuffer;
    if (filter) {
      filteredLogs = logBuffer.filter(log => 
        log.toLowerCase().includes(filter.toLowerCase())
      );
    }
    
    // Get the most recent logs up to the limit
    const recentLogs = filteredLogs.slice(-limit);
    
    return NextResponse.json({
      success: true,
      logs: recentLogs,
      total: logBuffer.length,
      filtered: filteredLogs.length,
      returned: recentLogs.length
    });
  } catch (error: any) {
    console.error('Error retrieving logs:', error);
    return NextResponse.json({
      success: false,
      error: error.message
    }, { status: 500 });
  }
}

/**
 * DELETE handler to clear the log buffer
 */
export async function DELETE() {
  try {
    // Clear the log buffer
    logBuffer.length = 0;
    
    return NextResponse.json({
      success: true,
      message: 'Log buffer cleared'
    });
  } catch (error: any) {
    console.error('Error clearing log buffer:', error);
    return NextResponse.json({
      success: false,
      error: error.message
    }, { status: 500 });
  }
} 