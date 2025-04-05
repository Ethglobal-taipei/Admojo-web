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
     
     // Fetch the campaign to ensure it exists
     const campaign = await prisma.campaign.findUnique({
       where: { id: campaignId }
     });
     
     if (!campaign) {
       return NextResponse.json(
         { error: "Campaign not found" },
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