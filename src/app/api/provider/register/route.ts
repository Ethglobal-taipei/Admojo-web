import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import { getSession } from '@/lib/auth';
import { v4 as uuidv4 } from 'uuid';

// Create a single PrismaClient instance for the application
const prisma = new PrismaClient();

export async function POST(req: NextRequest) {
  try {
    // Get the authenticated user from the session
    const session = await getSession();
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 });
    }
    
    const userId = session.user.id;
    const body = await req.json();
    
    // Extract data from request body
    const {
      businessName,
      businessType,
      businessAddress,
      businessEmail,
      paymentMethod,
      walletAddress,
      bankName,
      accountNumber,
      taxId,
      selfVerified,
      selfVerificationData,
    } = body;
    
    // First, ensure the user exists in the database
    let user = await prisma.user.findUnique({
      where: { id: userId }
    });
    
    if (!user) {
      // Create a basic user record if it doesn't exist
      // Generate placeholder values for required fields
      const generatedUsername = `user_${uuidv4().substring(0, 8)}`;
      const generatedWalletAddress = `0x${uuidv4().replace(/-/g, '')}`;
      
      user = await prisma.user.create({
        data: {
          id: userId,
          name: businessName || 'Provider User',
          email: businessEmail || 'provider@example.com',
          username: generatedUsername,
          walletAddress: walletAddress || generatedWalletAddress,
          role: 'Provider',
        }
      });
    }
    
    // Check if provider already exists for this user
    const existingProvider = await prisma.provider.findUnique({
      where: { userId },
    });
    
    if (existingProvider) {
      // Update existing provider
      const updatedProvider = await prisma.provider.update({
        where: { userId },
        data: {
          businessName,
          businessType,
          businessAddress,
          businessEmail,
          paymentMethod,
          walletAddress: walletAddress || null,
          bankName: bankName || null,
          accountNumber: accountNumber || null,
          taxId: taxId || null,
          selfVerified: selfVerified || false,
          selfVerificationName: selfVerificationData?.name || null,
        },
      });
      
      return NextResponse.json({
        success: true,
        provider: updatedProvider,
        message: 'Provider updated successfully',
      });
    } else {
      // Create new provider
      const newProvider = await prisma.provider.create({
        data: {
          userId,
          businessName,
          businessType,
          businessAddress,
          businessEmail,
          paymentMethod,
          walletAddress: walletAddress || null,
          bankName: bankName || null,
          accountNumber: accountNumber || null,
          taxId: taxId || null,
          selfVerified: selfVerified || false,
          selfVerificationName: selfVerificationData?.name || null,
        },
      });
      
      return NextResponse.json({
        success: true,
        provider: newProvider,
        message: 'Provider created successfully',
      });
    }
  } catch (error) {
    console.error('Error creating/updating provider:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: error instanceof Error ? error.message : 'Unknown error occurred' 
      }, 
      { status: 500 }
    );
  }
} 