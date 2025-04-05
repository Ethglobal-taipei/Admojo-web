import { NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import { getSession } from '@/lib/auth';

// Use the same PrismaClient instance
const prisma = new PrismaClient();

export async function GET() {
  try {
    // Get the authenticated user from the session
    const session = await getSession();
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 });
    }
    
    const userId = session.user.id;
    
    // First check if the user exists
    const user = await prisma.user.findUnique({
      where: { id: userId }
    });
    
    if (!user) {
      return NextResponse.json({ 
        success: false,
        error: 'User not found',
        needsRegistration: true
      }, { status: 404 });
    }
    
    // Fetch provider data for the authenticated user
    const providerData = await prisma.provider.findUnique({
      where: { userId },
    });
    
    if (!providerData) {
      return NextResponse.json({ 
        success: false,
        error: 'Provider not found',
        needsRegistration: true
      }, { status: 404 });
    }
    
    // Return the provider data
    return NextResponse.json({
      success: true,
      provider: providerData,
    });
  } catch (error) {
    console.error('Error fetching provider data:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: error instanceof Error ? error.message : 'Unknown error occurred' 
      }, 
      { status: 500 }
    );
  }
} 