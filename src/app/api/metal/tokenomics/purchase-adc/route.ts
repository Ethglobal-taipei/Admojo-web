import { NextResponse } from "next/server";
import { callMetalAPI, ADC_TOKEN_ADDRESS } from "../../route";
import { prisma } from "@/lib/prisma";

// This endpoint handles the demo flow for advertisers to purchase ADC tokens
// In a real-world scenario, this would involve a swap operation via Uniswap or similar
export async function POST(req: Request) {
  try {
    const { usdAmount, walletAddress } = await req.json();
    
    if (!usdAmount || !walletAddress) {
      return NextResponse.json(
        { error: "Missing required parameters: usdAmount, userId" },
        { status: 400 }
      );
    }
    
    // Get holder information to get their wallet address
    const holderResponse = await prisma.user.findFirst({
      where: {
        walletAddress : walletAddress
      }
    });

    if (!holderResponse) {
      return NextResponse.json(
        { error: "Could not find holder information" },
        { status: 404 }
      );
    }
    
    console.log(holderResponse);


    
    // Calculate ADC tokens based on USD amount
    // Using 2:1 ratio (2 USDC = 1 ADC) as requested
    const adcAmount = usdAmount / 2;
    
    // Distribute ADC tokens from merchant account to advertiser's holder
    const distributeResponse = await callMetalAPI(
      `/token/${ADC_TOKEN_ADDRESS}/distribute`,
      "POST",
      {
        sendToAddress: holderResponse.holderAddress,
        amount: adcAmount
      }
    );
    
    // Record the transaction in the database
    try {
      // Get user from the database by userId
      const user = await prisma.user.findFirst({
        where: { 
          OR: [
            { walletAddress: walletAddress },
            { holderAddress: holderResponse.holderAddress }
          ]
        }
      });
      
      if (user) {
        // Create transaction record
        await prisma.transaction.create({
          data: {
            type: "purchase",
            amount: adcAmount,
            token: "ADC",
            status: "completed",
            txHash: distributeResponse.transactionHash || "local-tx",
            userId: user.id
          }
        });
        
       
      }
    } catch (dbError) {
      console.error("Database error in purchase-adc:", dbError);
      // Continue with the response even if DB operation fails
    }
    
    return NextResponse.json({
      success: true,
      message: `Successfully purchased ${adcAmount} ADC tokens for ${usdAmount} USDC`,
      transaction: distributeResponse,
      adcAmount,
      usdAmount
    });
    
  } catch (error) {
    console.error("Error in purchase-adc:", error);
    return NextResponse.json(
      { error: "Failed to process ADC token purchase", details: (error as Error).message },
      { status: 500 }
    );
  }
} 