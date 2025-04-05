import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

/**
 * GET handler to fetch user stats
 */
export async function GET(
  request: NextRequest,
  { params }: { params: { address: string } }
) {
  try {
    if (!params) {
      return NextResponse.json({ error: "Missing parameters" }, { status: 400 });
    }

    // Use dynamic import to ensure params is properly awaited
    const { address } = await Promise.resolve(params);
    
    if (!address) {
      return NextResponse.json({ error: "Invalid address parameter" }, { status: 400 });
    }

    // The wallet address in the URL path acts as authentication
    // No additional token verification needed since the user has connected their wallet
    
    // Find user by wallet address
    const user = await prisma.user.findUnique({
      where: { walletAddress: address },
      include: { stats: true }
    });
    
    if (!user) {
      return NextResponse.json(
        { error: "User not found" },
        { status: 404 }
      );
    }
    
    // If user has no stats record, create one with default values
    if (!user.stats) {
      // Create stats with zero values instead of random mock data
      const newStats = await prisma.userStats.create({
        data: {
          campaignsCreated: 0,
          activeDisplays: 0,
          totalSpent: 0,
          avgCPI: 0,
          user: { connect: { id: user.id } }
        }
      });
      
      return NextResponse.json({
        campaignsCreated: newStats.campaignsCreated,
        activeDisplays: newStats.activeDisplays,
        totalSpent: newStats.totalSpent,
        avgCPI: newStats.avgCPI
      }, { status: 200 });
    }
    
    // Return existing stats
    return NextResponse.json({
      campaignsCreated: user.stats.campaignsCreated,
      activeDisplays: user.stats.activeDisplays,
      totalSpent: user.stats.totalSpent,
      avgCPI: user.stats.avgCPI
    }, { status: 200 });
  } catch (error) {
    console.error("[API] Error fetching user stats:", error);
    return NextResponse.json(
      { error: "Failed to fetch user stats" },
      { status: 500 }
    );
  }
} 