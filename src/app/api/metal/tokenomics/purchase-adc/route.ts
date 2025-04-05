import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { callMetalAPI } from "../../route";

// Get ADC token address from environment
const ADC_TOKEN_ADDRESS = process.env.ADC_TOKEN_ADDRESS || "0x1234567890abcdef1234567890abcdef12345678";

// Mock function for token purchase (in production this would call an exchange API)
async function purchaseTokens(walletAddress: string, amount: number, paymentMethod: string) {
  // In real implementation, this would call an exchange service
  // For now, we'll simulate a successful purchase
  
  // Return mock transaction data
  return {
    success: true,
    txHash: `0x${Math.random().toString(16).slice(2)}${Math.random().toString(16).slice(2)}`,
    amount,
    fee: amount * 0.01, // 1% fee
    timestamp: new Date()
  };
}

// This endpoint handles purchasing ADC tokens
export async function POST(req: Request) {
  try {
    const { userId, amount, paymentMethod, walletAddress } = await req.json();
    
    console.log("Purchase request:", { userId, amount, paymentMethod, walletAddress });
    
    if (!userId || !amount || !paymentMethod || !walletAddress) {
      return NextResponse.json(
        { error: "Missing required parameters: userId, amount, paymentMethod, and walletAddress are required" },
        { status: 400 }
      );
    }
    
    // Fetch user to verify existence
    const user = await prisma.user.findUnique({
      where: { id: userId }
    });
    
    if (!user) {
      return NextResponse.json(
        { error: "User not found" },
        { status: 404 }
      );
    }
    
    // Verify user matches wallet address
    if (user.walletAddress !== walletAddress) {
      return NextResponse.json(
        { error: "Wallet address does not match user" },
        { status: 400 }
      );
    }
    
    // Process the payment through exchange (mocked for now)
    const purchaseResult = await purchaseTokens(walletAddress, amount, paymentMethod);
    
    if (!purchaseResult.success) {
      return NextResponse.json(
        { error: "Failed to purchase tokens", details: purchaseResult },
        { status: 500 }
      );
    }
    
    // Create transaction record
    const transaction = await prisma.transaction.create({
      data: {
        type: "PURCHASE",
        amount: amount,
        token: "ADC",
        status: "COMPLETED",
        txHash: purchaseResult.txHash,
        userId: userId
      }
    });
    
    // Update user balance in database
    await prisma.balance.upsert({
      where: { userId },
      update: {
        ADC: { increment: amount }
      },
      create: {
        userId,
        ADC: amount,
        USDC: 0
      }
    });
    
    // Add tokens to the user's Metal holder account
    try {
      // Check if holder already has token balance
      const holderTokens = await callMetalAPI(
        `/holder/${user.holderAddress}/tokens`,
        "GET"
      );
      
      const hasAdcToken = holderTokens.some((token: any) => 
        token.token.address.toLowerCase() === ADC_TOKEN_ADDRESS.toLowerCase()
      );
      
      if (!hasAdcToken) {
        // Add token to holder if not present
        await callMetalAPI(
          `/holder/${user.holderAddress}/tokens`,
          "POST",
          {
            tokenAddress: ADC_TOKEN_ADDRESS
          }
        );
      }
      
      // Update token balance
      await callMetalAPI(
        `/holder/${user.holderAddress}/tokens/${ADC_TOKEN_ADDRESS}/balance`,
        "PUT",
        {
          balance: amount
        }
      );
      
    } catch (metalError) {
      console.error("Error updating Metal balance:", metalError);
      // Continue with response even if Metal update fails
    }
    
    return NextResponse.json({
      success: true,
      message: "Successfully purchased ADC tokens",
      transaction: {
        id: transaction.id,
        amount,
        txHash: purchaseResult.txHash,
        timestamp: purchaseResult.timestamp
      }
    });
    
  } catch (error) {
    console.error("Error in purchase-adc:", error);
    return NextResponse.json(
      { error: "Failed to purchase ADC tokens", details: (error as Error).message },
      { status: 500 }
    );
  }
} 