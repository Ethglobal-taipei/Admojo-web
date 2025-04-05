import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const address = searchParams.get("address");
  
  if (!address) {
    return NextResponse.json(
      { error: "Wallet address is required" },
      { status: 400 }
    );
  }
  
  try {
    const user = await prisma.user.findUnique({
      where: { walletAddress: address.toLowerCase() },
      include: { provider: true }
    });
    
    return NextResponse.json(user);
  } catch (error) {
    console.error("Error fetching user:", error);
    return NextResponse.json(
      { error: "Failed to fetch user" },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { address, role = 'USER' } = body;
    
    if (!address) {
      return NextResponse.json(
        { error: "Wallet address is required" },
        { status: 400 }
      );
    }
    
    // First check if user exists
    const existingUser = await prisma.user.findUnique({
      where: { walletAddress: address.toLowerCase() },
    });
    
    if (existingUser) {
      return NextResponse.json(existingUser);
    }
    
    // Create new user
    const newUser = await prisma.user.create({
      data: {
        walletAddress: address.toLowerCase(),
        name: `User_${address.substring(0, 8)}`,
        username: `user_${address.substring(0, 8).toLowerCase()}`,
        role: role as 'USER' | 'ADVERTISER' | 'PROVIDER',
      }
    });
    
    return NextResponse.json(newUser);
  } catch (error) {
    console.error("Error creating user:", error);
    return NextResponse.json(
      { error: "Failed to create user" },
      { status: 500 }
    );
  }
} 