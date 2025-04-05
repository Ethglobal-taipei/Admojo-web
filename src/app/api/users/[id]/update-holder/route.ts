import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function POST(req: Request, { params }: { params: { id: string } }) {
  try {
    const userId = params.id;
    const { holderAddress } = await req.json();
    
    if (!userId) {
      return NextResponse.json(
        { error: "Missing required parameter: userId" },
        { status: 400 }
      );
    }
    
    if (!holderAddress) {
      return NextResponse.json(
        { error: "Missing required parameter: holderAddress" },
        { status: 400 }
      );
    }
    
    // Check if user exists
    const existingUser = await prisma.user.findUnique({
      where: { id: userId }
    });
    
    if (!existingUser) {
      return NextResponse.json(
        { error: "User not found" },
        { status: 404 }
      );
    }
    
    // Update user with holder address
    const updatedUser = await prisma.user.update({
      where: { id: userId },
      data: { holderAddress }
    });
    
    return NextResponse.json({
      success: true,
      message: "Successfully updated user with holder address",
      user: {
        id: updatedUser.id,
        holderAddress: updatedUser.holderAddress,
        walletAddress: updatedUser.walletAddress
      }
    });
    
  } catch (error) {
    console.error("Error updating user holder:", error);
    return NextResponse.json(
      { error: "Failed to update user holder", details: (error as Error).message },
      { status: 500 }
    );
  }
} 