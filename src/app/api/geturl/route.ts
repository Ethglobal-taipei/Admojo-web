import { NextResponse } from 'next/server';

// Route Segment Config - ensures this runs on the server only
export const runtime = 'nodejs';

// List of advertisement URLs
const AD_URLS = [
  'https://self.xyz',
  'https://ethglobal.com',
  'https://aviral.software',
  'https://tinyurl.com/admojotap',
  'https://metal.build',
];

// Keep track of the current URL and when it was last updated
let currentUrl = AD_URLS[0];
let lastUpdated = Date.now();
const UPDATE_INTERVAL = 5 * 60 * 1000; // 5 minutes in milliseconds

/**
 * GET handler for /api/geturl
 * Returns a random advertisement URL that changes every 5 minutes
 */
export async function GET() {
  const now = Date.now();
  
  // Check if it's time to update the URL
  if (now - lastUpdated > UPDATE_INTERVAL) {
    // Get a random URL from the list (different from the current one)
    let newUrlIndex;
    do {
      newUrlIndex = Math.floor(Math.random() * AD_URLS.length);
    } while (AD_URLS[newUrlIndex] === currentUrl && AD_URLS.length > 1);
    
    currentUrl = AD_URLS[newUrlIndex];
    lastUpdated = now;
  }
  
  return NextResponse.json({ url: currentUrl });
} 