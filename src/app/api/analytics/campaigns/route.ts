import { NextRequest, NextResponse } from 'next/server'
import { prisma, getAnalytics } from '@/lib/db'

export async function GET(req: NextRequest) {
  try {
    // Get query parameters
    const searchParams = req.nextUrl.searchParams
    const period = searchParams.get('period') || 'all'
    
    // Get analytics for today
    const analytics = await getAnalytics()
    
    // Get campaign counts by status
    const [
      draftCount,
      pendingCount,
      activeCount,
      pausedCount,
      completedCount,
      cancelledCount
    ] = await Promise.all([
      prisma.campaign.count({ where: { status: 'DRAFT' } }),
      prisma.campaign.count({ where: { status: 'PENDING' } }),
      prisma.campaign.count({ where: { status: 'ACTIVE' } }),
      prisma.campaign.count({ where: { status: 'PAUSED' } }),
      prisma.campaign.count({ where: { status: 'COMPLETED' } }),
      prisma.campaign.count({ where: { status: 'CANCELLED' } })
    ])
    
    // Calculate total budgets
    const totalBudget = await prisma.campaign.aggregate({
      _sum: { totalBudget: true }
    })
    
    // Get total impressions, clicks, and conversions
    const totals = await prisma.campaign.aggregate({
      _sum: {
        impressions: true,
        clicks: true,
        conversions: true
      }
    })
    
    // Get period metrics (last 7 days, last 30 days, etc.)
    let periodMetrics = []
    
    if (period === '7days') {
      // Last 7 days of analytics
      const sevenDaysAgo = new Date()
      sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7)
      
      periodMetrics = await prisma.analytics.findMany({
        where: {
          date: {
            gte: sevenDaysAgo
          }
        },
        orderBy: {
          date: 'asc'
        }
      })
    } else if (period === '30days') {
      // Last 30 days of analytics
      const thirtyDaysAgo = new Date()
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30)
      
      periodMetrics = await prisma.analytics.findMany({
        where: {
          date: {
            gte: thirtyDaysAgo
          }
        },
        orderBy: {
          date: 'asc'
        }
      })
    }
    
    // Get recently created campaigns
    const recentCampaigns = await prisma.campaign.findMany({
      take: 5,
      orderBy: {
        createdAt: 'desc'
      },
      include: {
        advertiser: true,
        _count: {
          select: {
            bookings: true
          }
        }
      }
    })
    
    return NextResponse.json({
      status: 'success',
      data: {
        analytics,
        campaigns: {
          total: analytics.totalCampaigns,
          active: analytics.activeCampaigns,
          draft: draftCount,
          pending: pendingCount,
          paused: pausedCount,
          completed: completedCount,
          cancelled: cancelledCount
        },
        budgets: {
          total: totalBudget._sum.totalBudget || 0
        },
        metrics: {
          impressions: totals._sum.impressions || 0,
          clicks: totals._sum.clicks || 0,
          conversions: totals._sum.conversions || 0,
          ctr: totals._sum.impressions && totals._sum.clicks 
            ? (totals._sum.clicks / totals._sum.impressions) * 100 
            : 0,
          conversionRate: totals._sum.clicks && totals._sum.conversions 
            ? (totals._sum.conversions / totals._sum.clicks) * 100 
            : 0
        },
        periodMetrics,
        recentCampaigns: recentCampaigns.map((c: any) => ({
          id: c.id,
          name: c.name,
          advertiser: c.advertiser.name || c.advertiser.address,
          status: c.status,
          budget: c.totalBudget,
          createdAt: c.createdAt,
          locationCount: c._count.bookings
        }))
      }
    })
  } catch (error) {
    console.error('Error fetching campaign analytics:', error)
    
    return NextResponse.json(
      { status: 'error', message: 'Failed to fetch campaign analytics' },
      { status: 500 }
    )
  }
} 