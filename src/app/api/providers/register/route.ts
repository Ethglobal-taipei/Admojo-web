import { NextRequest, NextResponse } from 'next/server'
import { 
  prisma,
  getOrCreateUserByAddress, 
  registerProvider as dbRegisterProvider,
  updateAnalytics
} from '@/lib/db'

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const { 
      walletAddress, 
      businessName, 
      businessType, 
      contactEmail, 
      contactPhone,
      city,
      country,
      website,
      paymentAddress,
      deviceId,
      transactionHash
    } = body
    
    if (!walletAddress) {
      return NextResponse.json(
        { status: 'error', message: 'Wallet address is required' },
        { status: 400 }
      )
    }
    
    // Get or create user in database
    const user = await getOrCreateUserByAddress(walletAddress)
    
    // Update user role to PROVIDER
    await prisma.user.update({
      where: { id: user.id },
      data: { role: 'PROVIDER' }
    })
    
    // Create provider metadata
    const metadata = {
      businessName,
      businessType,
      contactEmail,
      contactPhone,
      city,
      country,
      website: website || '',
      paymentAddress: paymentAddress || walletAddress,
      registrationDate: new Date().toISOString(),
      transactionHash: transactionHash || ''
    }
    
    // Register provider in database
    const provider = await dbRegisterProvider(
      user.id,
      deviceId,
      metadata,
      0 // Initial staked amount
    )
    
    // Update analytics
    await updateAnalytics(new Date(), {
      totalProviders: { increment: 1 },
      activeProviders: { increment: 1 },
    })
    
    return NextResponse.json({
      status: 'success',
      message: 'Provider registered successfully',
      data: { provider }
    })
  } catch (error) {
    console.error('Error registering provider:', error)
    
    return NextResponse.json(
      { 
        status: 'error', 
        message: error instanceof Error ? error.message : 'Failed to register provider' 
      },
      { status: 500 }
    )
  }
} 