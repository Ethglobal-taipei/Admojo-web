import { NextResponse } from "next/server";
import { callMetalAPI, ADC_TOKEN_ADDRESS } from "../../route";

// This endpoint handles the demo flow for advertisers to purchase ADC tokens
// In a real-world scenario, this would involve a swap operation via Uniswap or similar
export async function POST(req: Request) {
  try {
    const { usdAmount, userId } = await req.json();
    
    if (!usdAmount || !userId) {
      return NextResponse.json(
        { error: "Missing required parameters: usdAmount, userId" },
        { status: 400 }
      );
    }
    
    // Get holder information to get their wallet address
    const holderResponse = await callMetalAPI(
      `/holder/${userId}`, 
      "GET"
    );
    
    if (!holderResponse || !holderResponse.address) {
      return NextResponse.json(
        { error: "Could not find holder information" },
        { status: 404 }
      );
    }
    
    // Calculate ADC tokens based on USD amount
    // For demo, using simple 1:100 ratio (1 USD = 100 ADC)
    // In production, this would use your liquidity pool calculations
    const adcAmount = usdAmount*100;
    
    // Distribute ADC tokens from merchant account to advertiser's holder
    const distributeResponse = await callMetalAPI(
      `/token/${ADC_TOKEN_ADDRESS}/distribute`,
      "POST",
      {
        sendTo: holderResponse.address,
        amount: adcAmount
      }
    );
    
    // Record the transaction in your database (to be implemented)
    // await recordTransaction(userId, "purchase", adcAmount, usdAmount);
    
    return NextResponse.json({
      success: true,
      message: `Successfully purchased ${adcAmount} ADC tokens for ${usdAmount} USD`,
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