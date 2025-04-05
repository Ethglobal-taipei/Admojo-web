import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { createCampaignHolder } from "@/lib/services/tokenomics.service";

export async function POST(req: Request, { params }: { params: { id: string } }) {
  try {
    const campaignId = params.id;
    const { status, isActive } = await req.json();
    
    console.log("Updating campaign status:", { campaignId, status, isActive });
    
    if (!campaignId) {
      return NextResponse.json(
        { error: "Missing campaign ID" },
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
    
    // Validate status if provided
    if (status && !['DRAFT', 'PENDING', 'ACTIVE', 'PAUSED', 'COMPLETED', 'CANCELLED'].includes(status)) {
      return NextResponse.json(
        { error: "Invalid status value" },
        { status: 400 }
      );
    }
    
    // Update campaign status
    const updateData: any = {};
    if (status !== undefined) updateData.status = status;
    if (isActive !== undefined) updateData.isActive = isActive;
    
    // Update campaign in database
    const updatedCampaign = await prisma.campaign.update({
      where: { id: campaignId },
      data: updateData
    });
    
    // If campaign is being activated and doesn't have a holder address, create one
    if ((status === "ACTIVE" || isActive === true) && !campaign.holderAddress) {
      try {
        console.log(`Campaign ${campaignId} activated - checking for Metal holder`);
        
        // Create a Metal holder for the campaign
        const holderCreated = await createCampaignHolder(campaignId);
        
        if (holderCreated) {
          console.log(`Successfully created Metal holder for campaign: ${campaignId}`);
        } else {
          console.warn(`Failed to create Metal holder for campaign: ${campaignId}`);
        }
      } catch (error) {
        console.error(`Error creating Metal holder for campaign ${campaignId}:`, error);
        // Continue even if holder creation fails - we don't want to block status updates
      }
    }
    
    return NextResponse.json({
      success: true,
      message: "Campaign status updated successfully",
      campaign: updatedCampaign
    });
    
  } catch (error) {
    console.error("Error updating campaign status:", error);
    return NextResponse.json(
      { error: "Failed to update campaign status", details: (error as Error).message },
      { status: 500 }
    );
  }
} 