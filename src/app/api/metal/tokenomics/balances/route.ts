import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { callMetalAPI, ADC_TOKEN_ADDRESS } from "../../route";

// This endpoint fetches balances from Metal for a given wallet address
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
    
    // Find user by wallet address to get holderAddress
    const user = await prisma.user.findUnique({
      where: { walletAddress }
    });
    
    if (!user || !user.holderAddress) {
      return NextResponse.json({
        adcBalance: 0,
        usdcBalance: 0,
        hasMetalHolder: false
      });
    }

    // Get the Metal holder
    try {
      // Get holder's ADC token balance
      const tokenData = await callMetalAPI(
        `/holder/${user.holderAddress}/tokens/${ADC_TOKEN_ADDRESS}`,
        "GET"
      );
      
      // For simplicity in this implementation, we're assuming the USDC balance
      // would be calculated based on other information from the backend
      // In a real implementation, you would fetch the USDC balance from the blockchain or another source
      const adcBalance = tokenData?.balance || 0;
      
      // Here we're mocking the USDC balance as if the user has the equivalent of their ADC balance * 10
      // In a real implementation, you would get this from a real source
      const usdcBalance = 1000; // Mock USDC balance for now
      
      return NextResponse.json({
        adcBalance,
        usdcBalance,
        hasMetalHolder: true,
        holderAddress: user.holderAddress
      });
      
    } catch (error) {
      console.error("Error fetching Metal balances:", error);
      return NextResponse.json({
        adcBalance: 0,
        usdcBalance: 0,
        hasMetalHolder: true,
        holderAddress: user.holderAddress,
        error: "Failed to fetch balances from Metal"
      });
    }
    
  } catch (error) {
    console.error("Error in balances API:", error);
    return NextResponse.json(
      { error: "Failed to fetch balances", details: (error as Error).message },
      { status: 500 }
    );
  }
} 