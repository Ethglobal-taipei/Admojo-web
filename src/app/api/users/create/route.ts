import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { callMetalAPI } from "../../metal/route";

export async function POST(req: Request) {
  try {
    const { walletAddress, holderAddress, role } = await req.json();
    
    if (!walletAddress) {
      return NextResponse.json(
        { error: "Missing required parameter: walletAddress" },
        { status: 400 }
      );
    }
    
    // Check if user already exists with this wallet address
    const existingUser = await prisma.user.findUnique({
      where: { walletAddress }
    });
    
    if (existingUser) {
      return NextResponse.json(
        { error: "User with this wallet address already exists", userId: existingUser.id },
        { status: 409 }
      );
    }
    
    // Generate a username from wallet address
    const username = `user_${walletAddress.slice(2, 8)}`;
    
    // Create the user
    const user = await prisma.user.create({
      data: {
        walletAddress,
        holderAddress,
        username,
        name: `User ${walletAddress.slice(0, 6)}`,
        role: role || "Advertiser",
        // Create default settings
        settings: {
          create: {}
        },
        // Create default stats
        stats: {
          create: {}
        }
      }
    });
    
    return NextResponse.json({
      success: true,
      message: "User created successfully",
      user: {
        id: user.id,
        walletAddress: user.walletAddress,
        holderAddress: user.holderAddress,
        role: user.role
      }
    });
    
  } catch (error) {
    console.error("Error creating user:", error);
    return NextResponse.json(
      { error: "Failed to create user", details: (error as Error).message },
      { status: 500 }
    );
  }
} 