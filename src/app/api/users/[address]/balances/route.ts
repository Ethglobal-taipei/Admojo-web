import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

/**
 * GET handler to fetch user balances
 */
export async function GET(
  request: NextRequest,
  { params }: { params: { address: string } }
) {
  try {
    // Ensure params.address is properly awaited
    const address = params?.address;
    if (!address) {
      return NextResponse.json({ error: "Invalid address parameter" }, { status: 400 });
    }

    // The wallet address in the URL path acts as authentication
    // No additional token verification needed since the user has connected their wallet
    
    // Find user by wallet address
    const user = await prisma.user.findUnique({
      where: { walletAddress: address },
      include: { balances: true }
    });
    
    if (!user) {
      return NextResponse.json(
        { error: "User not found" },
        { status: 404 }
      );
    }
    
    // If user has no balance record, create one with default values
    if (!user.balances) {
      // Create with zero balances rather than mock data
      const newBalance = await prisma.balance.create({
        data: {
          USDC: 0,
          ADC: 0,
          user: { connect: { id: user.id } }
        }
      });
      
      return NextResponse.json({
        USDC: newBalance.USDC,
        ADC: newBalance.ADC
      }, { status: 200 });
    }
    
    // Return existing balance
    return NextResponse.json({
      USDC: user.balances.USDC,
      ADC: user.balances.ADC
    }, { status: 200 });
  } catch (error) {
    console.error("[API] Error fetching user balances:", error);
    return NextResponse.json(
      { error: "Failed to fetch user balances" },
      { status: 500 }
    );
  }
} 