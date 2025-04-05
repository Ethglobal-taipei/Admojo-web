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
    
    return NextResponse.json({
      exists: !!user,
      user: user ? {
        id: user.id,
        holderAddress: user.holderAddress,
        walletAddress: user.walletAddress,
        role: user.role
      } : null
    });
    
  } catch (error) {
    console.error("Error checking user:", error);
    return NextResponse.json(
      { error: "Failed to check user existence", details: (error as Error).message },
      { status: 500 }
    );
  }
} 