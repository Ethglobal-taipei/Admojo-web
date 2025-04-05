import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

/**
 * GET handler to fetch user data
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

    // Query the database for the user
    const user = await prisma.user.findUnique({
      where: { walletAddress: address },
      include: {
        balances: true,
        stats: true,
        settings: true
      }
    });
    
    if (!user) {
      // If user doesn't exist, return default data
      const defaultUser = {
        name: "New User",
        username: address.slice(0, 8).toLowerCase(),
        email: "",
        avatar: "/placeholder.svg?height=100&width=100",
        role: "Advertiser",
        memberSince: new Date().toLocaleDateString('en-US', { month: 'long', year: 'numeric' }),
        tier: "Standard",
        walletAddress: address,
        walletType: "External Wallet",
        linkedWallets: [
          {
            address,
            chainId: 1,
            type: "External Wallet"
          }
        ]
      };
      
      return NextResponse.json(defaultUser, { status: 200 });
    }
    
    // Format the response data
    const userData = {
      id: user.id,
      name: user.name,
      username: user.username,
      email: user.email || "",
      avatar: user.avatar || "/placeholder.svg?height=100&width=100",
      role: user.role,
      memberSince: user.memberSince.toLocaleDateString('en-US', { month: 'long', year: 'numeric' }),
      tier: user.tier,
      walletAddress: user.walletAddress,
      walletType: user.walletType || "External Wallet",
      linkedWallets: user.linkedWallets || [
        {
          address: user.walletAddress,
          chainId: 1,
          type: "External Wallet"
        }
      ]
    };
    
    return NextResponse.json(userData, { status: 200 });
  } catch (error) {
    console.error("[API] Error fetching user data:", error);
    return NextResponse.json(
      { error: "Failed to fetch user data" },
      { status: 500 }
    );
  }
}

/**
 * PATCH handler to update user data
 */
export async function PATCH(
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
    
    // Get user data from request body
    const userData = await request.json();
    
    // Validate the data
    if (userData.email && !userData.email.includes("@") && userData.email !== "") {
      return NextResponse.json(
        { error: "Invalid email format" },
        { status: 400 }
      );
    }
    
    // Create a sanitized update object with only editable fields
    const updateData = {
      name: userData.name,
      username: userData.username,
      // These fields are optional for updating
      ...(userData.email && { email: userData.email }),
      ...(userData.avatar && { avatar: userData.avatar }),
    };
    
    // Find the existing user or create a new one
    const user = await prisma.user.upsert({
      where: { walletAddress: address },
      update: updateData,
      create: {
        name: userData.name || "New User",
        username: userData.username || address.slice(0, 8).toLowerCase(),
        email: userData.email || "",
        avatar: userData.avatar || "/placeholder.svg?height=100&width=100",
        role: "Advertiser",
        memberSince: new Date(),
        tier: "Standard",
        walletAddress: address,
        walletType: "External Wallet",
      },
      include: {
        balances: true,
        stats: true,
        settings: true
      }
    });
    
    // Format the response data
    const responseData = {
      id: user.id,
      name: user.name,
      username: user.username,
      email: user.email || "",
      avatar: user.avatar || "/placeholder.svg?height=100&width=100",
      role: user.role,
      memberSince: user.memberSince.toLocaleDateString('en-US', { month: 'long', year: 'numeric' }),
      tier: user.tier,
      walletAddress: user.walletAddress,
      walletType: user.walletType || "External Wallet",
      linkedWallets: user.linkedWallets || [
        {
          address: user.walletAddress,
          chainId: 1,
          type: "External Wallet"
        }
      ],
      // Include success message
      message: "Profile updated successfully"
    };
    
    return NextResponse.json(responseData, { status: 200 });
  } catch (error) {
    console.error("[API] Error updating user data:", error);
    return NextResponse.json(
      { error: "Failed to update user data" },
      { status: 500 }
    );
  }
} 