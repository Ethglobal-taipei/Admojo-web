import { NextResponse } from "next/server";
 import { prisma } from "@/lib/prisma";
 
 export async function GET(
   req: Request,
   { params }: { params: { id: string } }
 ) {
   try {
     const { id } = params;
     
     if (!id) {
       return NextResponse.json(
         { error: "Campaign ID is required" },
         { status: 400 }
       );
     }
     
     // Get the campaign with the given ID
     const campaign = await prisma.campaign.findUnique({
       where: { id },
       include: {
         advertiser: {
           select: {
             id: true,
             name: true,
             username: true,
             email: true,
             walletAddress: true,
             holderAddress: true
           }
         },
         bookings: true
       }
     });
     
     if (!campaign) {
       return NextResponse.json(
         { error: "Campaign not found" },
         { status: 404 }
       );
     }
     
     return NextResponse.json(campaign);
     
   } catch (error) {
     console.error("Error fetching campaign:", error);
     return NextResponse.json(
       { error: "Failed to fetch campaign", details: (error as Error).message },
       { status: 500 }
     );
   }
 } 