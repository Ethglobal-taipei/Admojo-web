import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { callMetalAPI, ADC_TOKEN_ADDRESS } from "../../route";

// This endpoint handles withdrawing ADC tokens from a user's holder account to a campaign
export async function POST(req: Request) {
  try {
    const { holderId, campaignId, amount, toAddress } = await req.json();
    
    console.log("Withdraw request:", { holderId, campaignId, amount, toAddress });
    
    if (!holderId || !campaignId || !amount) {
      return NextResponse.json(
        { error: "Missing required parameters: holderId, campaignId, and amount are required" },
        { status: 400 }
      );
    }
    
    // Fetch campaign to verify existence and get holder address
    const campaign = await prisma.campaign.findUnique({
      where: { id: campaignId }
    });
    
    if (!campaign) {
      return NextResponse.json(
        { error: "Campaign not found" },
        { status: 404 }
      );
    }
    
    // If toAddress is not provided, use campaign's holder address
    let destinationAddress = toAddress || campaign.holderAddress;
    
    if (!destinationAddress) {
      // If campaign doesn't have a holder address yet, create one
      try {
        // Create a unique holder ID for the campaign
        const campaignHolderId = `campaign-${campaignId}`;
        
        // Create holder in Metal
        const holderResponse = await callMetalAPI(
          `/holder/${campaignHolderId}`,
          "PUT"
        );
        
        if (!holderResponse?.address) {
          return NextResponse.json(
            { error: "Failed to create campaign holder account" },
            { status: 500 }
          );
        }
        
        // Update campaign with holder address
        await prisma.campaign.update({
          where: { id: campaignId },
          data: { holderAddress: holderResponse.address }
        });
        
        // Use the new holder address
        destinationAddress = holderResponse.address;
      } catch (error) {
        console.error("Error creating campaign holder:", error);
        return NextResponse.json(
          { error: "Failed to create campaign holder account", details: (error as Error).message },
          { status: 500 }
        );
      }
    }
    
    // First check if the holder has enough tokens
    try {
      const holderTokens = await callMetalAPI(
        `/holder/${holderId}/tokens/${ADC_TOKEN_ADDRESS}`,
        "GET"
      );
      
      const currentBalance = holderTokens?.balance || 0;
      
      if (currentBalance < amount) {
        return NextResponse.json(
          { error: "Insufficient balance", details: `Available: ${currentBalance}, Requested: ${amount}` },
          { status: 400 }
        );
      }
      
      // Update user's holder token balance
      await callMetalAPI(
        `/holder/${holderId}/tokens/${ADC_TOKEN_ADDRESS}/balance`,
        "PUT",
        {
          balance: currentBalance - amount
        }
      );
      
      // Now check if the campaign holder has the token
      const campaignHolderTokens = await callMetalAPI(
        `/holder/${destinationAddress}/tokens`,
        "GET"
      );
      
      const hasAdcToken = campaignHolderTokens.some((token: any) => 
        token.token.address.toLowerCase() === ADC_TOKEN_ADDRESS.toLowerCase()
      );
      
      if (!hasAdcToken) {
        // Add token to campaign holder if not present
        await callMetalAPI(
          `/holder/${destinationAddress}/tokens`,
          "POST",
          {
            tokenAddress: ADC_TOKEN_ADDRESS
          }
        );
      }
      
      // Get current campaign balance
      const campaignTokens = await callMetalAPI(
        `/holder/${destinationAddress}/tokens/${ADC_TOKEN_ADDRESS}`,
        "GET"
      );
      
      const campaignBalance = campaignTokens?.balance || 0;
      
      // Update campaign holder token balance
      await callMetalAPI(
        `/holder/${destinationAddress}/tokens/${ADC_TOKEN_ADDRESS}/balance`,
        "PUT",
        {
          balance: campaignBalance + amount
        }
      );
      
      // Update campaign budget in database
      await prisma.campaign.update({
        where: { id: campaignId },
        data: {
          totalBudget: { increment: amount },
          remainingBudget: { increment: amount }
        }
      });
      
      // Create transaction record
      const transaction = await prisma.transaction.create({
        data: {
          type: "FUND_CAMPAIGN",
          amount: amount,
          token: "ADC",
          status: "COMPLETED",
          userId: campaign.advertiserId,
          txHash: `transfer-${Date.now()}-${Math.random().toString(36).slice(2)}`
        }
      });
      
      return NextResponse.json({
        success: true,
        message: "Successfully transferred tokens to campaign",
        transaction: {
          id: transaction.id,
          amount,
          campaignId
        }
      });
      
    } catch (error) {
      console.error("Error transferring tokens:", error);
      return NextResponse.json(
        { error: "Failed to transfer tokens", details: (error as Error).message },
        { status: 500 }
      );
    }
    
  } catch (error) {
    console.error("Error in withdraw:", error);
    return NextResponse.json(
      { error: "Failed to process withdrawal", details: (error as Error).message },
      { status: 500 }
    );
  }
} 