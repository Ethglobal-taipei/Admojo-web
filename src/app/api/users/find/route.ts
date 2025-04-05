import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(req: Request) {
  try {
    const url = new URL(req.url);
    const walletAddress = url.searchParams.get('walletAddress');
    
    if (!walletAddress) {
      return NextResponse.json(
        { error: "Missing required parameter: walletAddress" },
        { status: 400 }
      );
    }
    
    // Find user by wallet address
    const user = await prisma.user.findUnique({
      where: { walletAddress }
    });
    
    if (!user) {
      return NextResponse.json(
        { error: "User not found" },
        { status: 404 }
      );
    }
    
    // Check if user has a holder address
    if (!user.holderAddress) {
      return NextResponse.json(
        { error: "User does not have a Metal holder address" },
        { status: 404 }
      );
    }
    
    // Return user data with holder address
    return NextResponse.json({
      id: user.id,
      walletAddress: user.walletAddress,
      holderAddress: user.holderAddress,
      name: user.name,
      role: user.role
    });
    
  } catch (error) {
    console.error("Error finding user:", error);
    return NextResponse.json(
      { error: "Failed to fetch user data", details: (error as Error).message },
      { status: 500 }
    );
  }
} 