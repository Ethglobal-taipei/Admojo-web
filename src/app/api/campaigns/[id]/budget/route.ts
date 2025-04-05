import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { callMetalAPI, ADC_TOKEN_ADDRESS } from "@/app/api/metal/route";

export async function POST(req: Request, { params }: { params: { id: string } }) {
  try {
    const campaignId = params.id;
    const { amount, operation, userId, userHolderAddress } = await req.json();
    
    console.log("Budget operation:", { campaignId, amount, operation, userId });
    
    if (!campaignId || !amount || !operation || !userId) {
      return NextResponse.json(
        { error: "Missing required parameters", details: "campaignId, amount, operation, and userId are required" },
        { status: 400 }
      );
    }
    
    // Validate operation type
    if (operation !== 'add' && operation !== 'withdraw') {
      return NextResponse.json(
        { error: "Invalid operation", details: "Operation must be 'add' or 'withdraw'" },
        { status: 400 }
      );
    }
    
    // Ensure amount is positive
    if (amount <= 0) {
      return NextResponse.json(
        { error: "Invalid amount", details: "Amount must be greater than zero" },
        { status: 400 }
      );
    }
    
    // Find campaign
    const campaign = await prisma.campaign.findUnique({
      where: { id: campaignId }
    });
    
    if (!campaign) {
      return NextResponse.json(
        { error: "Campaign not found" },
        { status: 404 }
      );
    }
    
    // Verify campaign holder address exists
    if (!campaign.holderAddress) {
      return NextResponse.json(
        { error: "Campaign has no holder address", details: "Create a Metal holder for this campaign first" },
        { status: 400 }
      );
    }
    
    // Handle operations
    if (operation === 'add') {
      // Transfer tokens FROM user TO campaign
      console.log(`Transferring ${amount} ADC tokens from user ${userId} to campaign ${campaignId}`);
      
      // Call Metal API to withdraw tokens from user and send to campaign holder
      const withdrawResponse = await callMetalAPI(
        `/holder/${userId}/withdraw`,
        "POST",
        {
          tokenAddress: ADC_TOKEN_ADDRESS,
          amount: amount,
          toAddress: campaign.holderAddress
        }
      );
      
      console.log("Metal API withdraw response:", withdrawResponse);
      
      if (!withdrawResponse || !withdrawResponse.success) {
        return NextResponse.json(
          { error: "Failed to transfer tokens to campaign holder", details: withdrawResponse },
          { status: 500 }
        );
      }
      
      // Update campaign budget
      await prisma.campaign.update({
        where: { id: campaignId },
        data: { 
          totalBudget: { increment: amount },
          remainingBudget: { increment: amount }
        }
      });
      
      // Get updated campaign
      const updatedCampaign = await prisma.campaign.findUnique({
        where: { id: campaignId }
      });
      
      return NextResponse.json({
        success: true,
        message: `Successfully added ${amount} ADC tokens to campaign budget`,
        transaction: withdrawResponse,
        campaign: updatedCampaign
      });
      
    } else if (operation === 'withdraw') {
      // Transfer tokens FROM campaign TO user
      console.log(`Transferring ${amount} ADC tokens from campaign ${campaignId} to user ${userId}`);
      
      // For withdraw, we need a user holder address
      if (!userHolderAddress) {
        return NextResponse.json(
          { error: "Missing user holder address", details: "User holder address is required for withdrawals" },
          { status: 400 }
        );
      }
      
      // Create a unique ID for the campaign holder - must match what was used to create it
      const campaignHolderId = `campaign-${campaignId}`;
      
      // Call Metal API to withdraw tokens from campaign holder and send to user
      const withdrawResponse = await callMetalAPI(
        `/holder/${campaignHolderId}/withdraw`,
        "POST",
        {
          tokenAddress: ADC_TOKEN_ADDRESS,
          amount: amount,
          toAddress: userHolderAddress
        }
      );
      
      console.log("Metal API withdraw response:", withdrawResponse);
      
      if (!withdrawResponse || !withdrawResponse.success) {
        return NextResponse.json(
          { error: "Failed to transfer tokens from campaign holder", details: withdrawResponse },
          { status: 500 }
        );
      }
      
      // Update campaign budget
      await prisma.campaign.update({
        where: { id: campaignId },
        data: { 
          totalBudget: { decrement: amount },
          remainingBudget: { decrement: amount }
        }
      });
      
      // Get updated campaign
      const updatedCampaign = await prisma.campaign.findUnique({
        where: { id: campaignId }
      });
      
      return NextResponse.json({
        success: true,
        message: `Successfully withdrawn ${amount} ADC tokens from campaign budget`,
        transaction: withdrawResponse,
        campaign: updatedCampaign
      });
    }
    
    // Should never reach here due to earlier validation
    return NextResponse.json(
      { error: "Invalid operation" },
      { status: 400 }
    );
    
  } catch (error) {
    console.error("Error updating campaign budget:", error);
    return NextResponse.json(
      { error: "Failed to update campaign budget", details: (error as Error).message },
      { status: 500 }
    );
  }
} 