import { NextRequest, NextResponse } from 'next/server'
import { 
  prisma,
  getOrCreateUserByAddress, 
  createCampaign as dbCreateCampaign,
  updateAnalytics
} from '@/lib/db'

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const { 
      walletAddress, 
      name,
      description,
      startDate,
      endDate,
      budget,
      creativeUrl,
      targetLocations,
      targetLocationIds,
      campaignId,
      transactionHash
    } = body
    
    if (!walletAddress) {
      return NextResponse.json(
        { status: 'error', message: 'Wallet address is required' },
        { status: 400 }
      )
    }
    
    if (!name || !startDate || !endDate || !budget) {
      return NextResponse.json(
        { status: 'error', message: 'Required campaign details are missing' },
        { status: 400 }
      )
    }
    
    // Get or create user in database
    const user = await getOrCreateUserByAddress(walletAddress)
    
    // Update user role to ADVERTISER if not already set
    if (user.role === 'USER') {
      await prisma.user.update({
        where: { id: user.id },
        data: { role: 'ADVERTISER' }
      })
    }
    
    // Create metadata for campaign
    const metadata = {
      name,
      description: description || name,
      startDate,
      endDate,
      budget,
      locations: targetLocations || [],
      creativeUrl: creativeUrl || ''
    }
    
    // Create campaign in database
    const campaign = await dbCreateCampaign({
      name,
      advertiser: {
        connect: { id: user.id }
      },
      startDate: new Date(startDate),
      endDate: new Date(endDate),
      totalBudget: budget,
      remainingBudget: budget,
      status: transactionHash ? "ACTIVE" : "PENDING",
      contentURI: "",
      creativeUrl,
      description: description || name,
      isActive: !!transactionHash,
      transactionHash,
      metadataJson: metadata,
      locationIds: targetLocationIds,
      onChainId: null,
      views: 0,
      taps: 0
    })
    
    // If locations are provided, create bookings
    if (targetLocations && targetLocations.length > 0) {
      // Get location records
      const locations = await prisma.location.findMany({
        where: {
          id: {
            in: targetLocations.map((loc: any) => loc.id.toString())
          }
        }
      })
      
      // Create bookings for each location
      const bookingPromises = locations.map((location: any) => 
        prisma.campaignLocationBooking.create({
          data: {
            campaignId: campaign.id,
            locationId: location.id,
            totalAmount: location.pricePerDay * 
              Math.ceil((new Date(endDate).getTime() - new Date(startDate).getTime()) / (1000 * 60 * 60 * 24)),
            dailyRate: location.pricePerDay,
            releasedAmount: 0,
            isConfirmed: !!transactionHash
          }
        })
      )
      
      await Promise.all(bookingPromises)
    }
    
    // Update analytics
    await updateAnalytics(new Date(), {
      totalCampaigns: { increment: 1 },
      activeCampaigns: transactionHash ? { increment: 1 } : undefined,
      dailyRevenue: { increment: budget }
    })
    
    return NextResponse.json({
      status: 'success',
      message: 'Campaign created successfully',
      data: { campaign }
    })
  } catch (error) {
    console.error('Error creating campaign:', error)
    
    return NextResponse.json(
      { 
        status: 'error', 
        message: error instanceof Error ? error.message : 'Failed to create campaign' 
      },
      { status: 500 }
    )
  }
} 