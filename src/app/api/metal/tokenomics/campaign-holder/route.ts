import { NextResponse } from "next/server";
import { callMetalAPI } from "../../route";
import { prisma } from "@/lib/prisma";

// This endpoint creates a new holder account specifically for a campaign
export async function POST(req: Request) {
  try {
    const { campaignId } = await req.json();
    
    console.log("Creating campaign holder for campaign ID:", campaignId);
    
    if (!campaignId) {
      return NextResponse.json(
        { error: "Missing required parameter: campaignId" },
        { status: 400 }
      );
    }
    
    // Standardize campaign ID (ensure it's a string)
    const campaignIdStr = String(campaignId);
    
    // Try to find campaign by either string ID or numeric ID (converted from onChainId)
    let campaign;
    
    // First try to find by string ID (UUID)
    campaign = await prisma.campaign.findUnique({
      where: { id: campaignIdStr }
    });
    
    // If not found and the ID is numeric, try to find by onChainId
    if (!campaign && !isNaN(Number(campaignIdStr))) {
      campaign = await prisma.campaign.findFirst({
        where: { onChainId: Number(campaignIdStr) }
      });
    }
    
    // If still not found, try to search by name that might include the ID
    if (!campaign) {
      campaign = await prisma.campaign.findFirst({
        where: {
          OR: [
            { name: { contains: campaignIdStr } },
            { description: { contains: campaignIdStr } }
          ]
        }
      });
    }
    
    if (!campaign) {
      console.error(`Campaign not found for ID: ${campaignIdStr}`);
      return NextResponse.json(
        { error: "Campaign not found", details: `No campaign found with ID ${campaignIdStr}` },
        { status: 404 }
      );
    }
    
    // Check if campaign already has a holder
    if (campaign.holderAddress) {
      return NextResponse.json({
        success: true,
        message: "Campaign already has a holder account",
        holder: { address: campaign.holderAddress }
      });
    }
    
    // Create a unique holder ID for the campaign
    const holderId = `campaign-${campaignId}`;
    
    // Create holder in Metal
    const holderResponse = await callMetalAPI(
      `/holder/${holderId}`,
      "PUT"
    );
    
    console.log("Metal API holder response:", holderResponse);
    
    if (!holderResponse?.address) {
      return NextResponse.json(
        { error: "Invalid holder response from Metal API", details: holderResponse },
        { status: 500 }
      );
    }
    
    // Update campaign with holder address
    await prisma.campaign.update({
      where: { id: campaignId },
      data: { holderAddress: holderResponse.address }
    });
    
    return NextResponse.json({
      success: true,
      message: "Successfully created campaign holder account",
      holder: {
        address: holderResponse.address,
        id: holderResponse.id || holderId
      },
      campaignId
    });
    
  } catch (error) {
    console.error("Error in create-campaign-holder:", error);
    return NextResponse.json(
      { error: "Failed to create campaign holder account", details: (error as Error).message },
      { status: 500 }
    );
  }
} 