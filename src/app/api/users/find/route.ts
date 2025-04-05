import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

// This endpoint finds a user by wallet address and returns their information including Metal holder
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
      where: { walletAddress: walletAddress }
    });
    
    if (!user) {
      return NextResponse.json(
        { error: "User not found" },
        { status: 404 }
      );
    }
    
    // Return user information including holder address
    return NextResponse.json({
      id: user.id,
      username: user.username,
      walletAddress: user.walletAddress,
      holderAddress: user.holderAddress,
      role: user.role
    });
    
  } catch (error) {
    console.error("Error finding user:", error);
    return NextResponse.json(
      { error: "Failed to find user", details: (error as Error).message },
      { status: 500 }
    );
  }
} 