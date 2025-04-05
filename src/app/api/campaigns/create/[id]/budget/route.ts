import { NextResponse } from "next/server";
 import { prisma } from "@/lib/prisma";
 import { callMetalAPI } from "@/app/api/metal/route";
 
 // Get ADC token address from environment
 const ADC_TOKEN_ADDRESS = process.env.ADC_TOKEN_ADDRESS || "0x1234567890abcdef1234567890abcdef12345678";
 
 // This endpoint handles updating the budget for a campaign
 export async function POST(req: Request, { params }: { params: { id: string } }) {
   try {
     const { id } = params;
     const { amount, operation, userId, userHolderAddress } = await req.json();
     
     console.log("Budget update request:", { id, amount, operation, userId });
     
     if (!id || !amount || !operation || !userId || !userHolderAddress) {
       return NextResponse.json(
         { error: "Missing required parameters: id, amount, operation, userId, and userHolderAddress are required" },
         { status: 400 }
       );
     }
     
     // Check if operation is valid
     if (operation !== "add" && operation !== "withdraw") {
       return NextResponse.json(
         { error: "Invalid operation. Must be 'add' or 'withdraw'" },
         { status: 400 }
       );
     }
     
     // Get the campaign
     const campaign = await prisma.campaign.findUnique({
       where: { id },
       include: {
         advertiser: {
           select: { id: true, walletAddress: true, holderAddress: true }
         }
       }
     });
     
     if (!campaign) {
       return NextResponse.json(
         { error: "Campaign not found" },
         { status: 404 }
       );
     }
     
     // Verify user has permission (is the advertiser)
     if (campaign.advertiserId !== userId) {
       return NextResponse.json(
         { error: "User does not have permission to modify this campaign" },
         { status: 403 }
       );
     }
     
     let response;
     
     if (operation === "add") {
       // Transfer tokens from user's holder to the campaign
       response = await callMetalAPI(
         `/holder/${userHolderAddress}/withdraw`,
         "POST",
         {
           tokenAddress: ADC_TOKEN_ADDRESS,
           amount: parseFloat(amount.toString()),
           toAddress: campaign.advertiser.walletAddress // Send to advertiser's wallet
         }
       );
       
       // Update campaign budget
       await prisma.campaign.update({
         where: { id },
         data: {
           totalBudget: { increment: parseFloat(amount.toString()) },
           remainingBudget: { increment: parseFloat(amount.toString()) }
         }
       });
       
       // Create transaction record
       await prisma.transaction.create({
         data: {
           type: "CAMPAIGN_FUNDING",
           amount: parseFloat(amount.toString()),
           token: "ADC",
           status: "COMPLETED",
           txHash: response.transaction?.hash || null,
           userId
         }
       });
     } else {
       // Check if campaign has enough remaining budget
       if (campaign.remainingBudget < parseFloat(amount.toString())) {
         return NextResponse.json(
           { error: "Insufficient remaining budget for withdrawal" },
           { status: 400 }
         );
       }
       
       // Update campaign budget (decrease)
       await prisma.campaign.update({
         where: { id },
         data: {
           totalBudget: { decrement: parseFloat(amount.toString()) },
           remainingBudget: { decrement: parseFloat(amount.toString()) }
         }
       });
       
       // Create transaction record for withdrawal
       await prisma.transaction.create({
         data: {
           type: "CAMPAIGN_WITHDRAWAL",
           amount: parseFloat(amount.toString()),
           token: "ADC",
           status: "COMPLETED",
           txHash: `local-withdrawal-${Date.now()}`,
           userId
         }
       });
       
       response = { success: true };
     }
     
     return NextResponse.json({
       success: true,
       message: `Successfully ${operation === "add" ? "added to" : "withdrawn from"} campaign budget`,
       amount,
       campaign: {
         id,
         totalBudget: operation === "add" 
           ? campaign.totalBudget + parseFloat(amount.toString())
           : campaign.totalBudget - parseFloat(amount.toString()),
         remainingBudget: operation === "add"
           ? campaign.remainingBudget + parseFloat(amount.toString())
           : campaign.remainingBudget - parseFloat(amount.toString())
       }
     });
     
   } catch (error) {
     console.error("Error updating campaign budget:", error);
     return NextResponse.json(
       { error: "Failed to update campaign budget", details: (error as Error).message },
       { status: 500 }
     );
   }
 } 