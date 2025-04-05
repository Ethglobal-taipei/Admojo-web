import { PrismaClient, Prisma, Campaign } from '@prisma/client'

// PrismaClient is attached to the `global` object in development to prevent
// exhausting your database connection limit.
const globalForPrisma = global as unknown as { prisma: PrismaClient }

export const prisma =
  globalForPrisma.prisma ||
  new PrismaClient({
    log: process.env.NODE_ENV === 'development' ? ['query', 'error', 'warn'] : ['error'],
  })

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = prisma

// Helper functions for working with the database

// User related functions
export async function getUserByAddress(address: string) {
  return prisma.user.findUnique({
    where: { walletAddress: address.toLowerCase() },
    include: { provider: true }
  })
}

export async function createUserFromWallet(address: string, role: 'USER' | 'ADVERTISER' | 'PROVIDER' = 'USER') {
  return prisma.user.create({
    data: {
      walletAddress: address.toLowerCase(),
      name: `User_${address.substring(0, 8)}`, // Create a default name
      username: `user_${address.substring(0, 8).toLowerCase()}`, // Create a default username
      role: role,
    }
  })
}

export async function getOrCreateUserByAddress(address: string) {
  const user = await getUserByAddress(address)
  if (user) return user
  
  return createUserFromWallet(address)
}

// Provider related functions
export async function getProviderByAddress(address: string) {
  const user = await getUserByAddress(address)
  if (!user || !user.provider) return null
  
  return user.provider
}

export async function registerProvider(userId: string, metadata: any, stakedAmount: number) {
  const user = await prisma.user.findUnique({ where: { id: userId } });
  
  if (!user) throw new Error('User not found');
  
  return prisma.provider.create({
    data: {
      userId,
      metadata,
      stakedAmount,
      stakingDate: new Date(),
      isActive: true,
      walletAddress: user.walletAddress,
    }
  })
}

// Campaign related functions
export async function getCampaigns(advertiserId?: string, status?: string) {
  const where: any = {}
  
  if (advertiserId) {
    where.advertiserId = advertiserId
  }
  
  if (status) {
    where.status = status
  }
  
  return prisma.campaign.findMany({
    where,
    include: {
      advertiser: true,
      bookings: {
        include: {
          location: true
        }
      },
      _count: {
        select: {
          bookings: true
        }
      }
    },
    orderBy: {
      createdAt: 'desc'
    }
  })
}

export async function getCampaignById(id: string) {
  return prisma.campaign.findUnique({
    where: { id },
    include: {
      advertiser: true,
      bookings: {
        include: {
          location: {
            include: {
              provider: {
                include: {
                  user: true
                }
              }
            }
          }
        }
      },
      metrics: {
        include: {
          location: true
        },
        orderBy: {
          date: 'desc'
        }
      }
    }
  })
}

export async function getCampaignByOnChainId(onChainId: number) {
  return prisma.campaign.findFirst({
    where: { onChainId },
    include: {
      advertiser: true,
      bookings: {
        include: {
          location: true
        }
      }
    }
  })
}

export async function createCampaign(data: Prisma.CampaignCreateInput): Promise<Campaign> {
  return prisma.campaign.create({
    data: {
      name: data.name,
      advertiser: data.advertiser,
      startDate: data.startDate,
      endDate: data.endDate,
      totalBudget: data.totalBudget,
      remainingBudget: data.remainingBudget,
      status: data.status,
      contentURI: data.contentURI,
      creativeUrl: data.creativeUrl,
      description: data.description,
      isActive: data.isActive,
      transactionHash: data.transactionHash,
      metadataJson: data.metadataJson,
      locationIds: data.locationIds,
      onChainId: data.onChainId,
      views: data.views,
      taps: data.taps
    }
  });
}

export async function updateCampaign(id: string, data: any) {
  return prisma.campaign.update({
    where: { id },
    data
  })
}

// Location related functions
export async function getLocations(providerId?: string, isActive?: boolean, status?: 'UNBOOKED' | 'BOOKED' | 'UNDER_MAINTENANCE') {
  const where: any = {}
  
  if (providerId) {
    where.providerId = providerId
  }
  
  if (isActive !== undefined) {
    where.isActive = isActive
  }
  
  if (status) {
    where.status = status
  }
  
  return prisma.location.findMany({
    where,
    include: {
      provider: {
        include: {
          user: true
        }
      },
      _count: {
        select: {
          bookings: true
        }
      }
    },
    orderBy: {
      createdAt: 'desc'
    }
  })
}

export async function getLocationById(id: string) {
  return prisma.location.findUnique({
    where: { id },
    include: {
      provider: {
        include: {
          user: true
        }
      },
      bookings: {
        include: {
          campaign: true
        }
      }
    }
  })
}

export async function getLocationByDeviceId(deviceId: number) {
  return prisma.location.findUnique({
    where: { deviceId },
    include: {
      provider: {
        include: {
          user: true
        }
      },
      bookings: {
        include: {
          campaign: true
        }
      }
    }
  })
}

export async function createLocation(data: any) {
  return prisma.location.create({
    data
  })
}

export async function updateLocation(id: string, data: any) {
  return prisma.location.update({
    where: { id },
    data
  })
}

// Campaign-Location booking functions
export async function createBooking(campaignId: string, locationId: string, data: any) {
  return prisma.campaignLocationBooking.create({
    data: {
      ...data,
      campaignId,
      locationId
    }
  })
}

// Analytics functions
export async function getAnalytics(date?: Date) {
  const targetDate = date || new Date()
  const day = targetDate.toISOString().split('T')[0]
  
  // Get or create analytics for today
  let analytics = await prisma.analytics.findUnique({
    where: { date: new Date(day) }
  })
  
  if (!analytics) {
    // If there's no analytics for today, create it with current counts
    const [
      totalCampaigns,
      activeCampaigns,
      totalLocations,
      activeLocations,
      totalProviders,
      activeProviders,
      totalAdvertisers
    ] = await Promise.all([
      prisma.campaign.count(),
      prisma.campaign.count({ where: { status: 'ACTIVE' } }),
      prisma.location.count(),
      prisma.location.count({ where: { isActive: true } }),
      prisma.provider.count(),
      prisma.provider.count({ where: { isActive: true } }),
      prisma.user.count({ where: { role: 'ADVERTISER' } })
    ])
    
    analytics = await prisma.analytics.create({
      data: {
        date: new Date(day),
        totalCampaigns,
        activeCampaigns,
        totalLocations,
        activeLocations,
        totalProviders,
        activeProviders,
        totalAdvertisers,
        // Initialize metrics for today
        dailyImpressions: 0,
        dailyClicks: 0,
        dailyConversions: 0,
        dailyRevenue: 0
      }
    })
  }
  
  return analytics
}

export async function updateAnalytics(date: Date, data: any) {
  const day = date.toISOString().split('T')[0]
  
  // Get or create analytics for the date
  let analytics = await prisma.analytics.findUnique({
    where: { date: new Date(day) }
  })
  
  if (!analytics) {
    await getAnalytics(date) // This will create it
  }
  
  // Update analytics with provided data
  return prisma.analytics.update({
    where: { date: new Date(day) },
    data
  })
}

// Metrics functions
export async function updateCampaignMetrics(campaignId: string, views: number, taps: number) {
  return prisma.campaign.update({
    where: { id: campaignId },
    data: {
      views: { increment: views },
      taps: { increment: taps }
    }
  })
}

export async function addLocationMetric(
  campaignId: string, 
  locationId: string, 
  date: Date, 
  views: number, 
  interactions: number
) {
  // Check if metric for this day already exists
  const existingMetric = await prisma.campaignLocationMetric.findUnique({
    where: {
      campaignId_locationId_date: {
        campaignId,
        locationId,
        date: new Date(date.toISOString().split('T')[0])
      }
    }
  })

  if (existingMetric) {
    // Update existing metric
    return prisma.campaignLocationMetric.update({
      where: {
        id: existingMetric.id
      },
      data: {
        views: { increment: views },
        interactions: { increment: interactions }
      }
    })
  } else {
    // Create new metric
    return prisma.campaignLocationMetric.create({
      data: {
        campaignId,
        locationId,
        date: new Date(date.toISOString().split('T')[0]),
        views,
        interactions
      }
    })
  }
} 