import { NextResponse } from "next/server";
 import { prisma } from "@/lib/prisma";
 
 export async function GET(req: Request) {
   try {
     // Get the advertiser ID from the query parameter
     const { searchParams } = new URL(req.url);
     const advertiserId = searchParams.get('advertiserId');
     
     if (!advertiserId) {
       return NextResponse.json(
         { error: "advertiserId query parameter is required" },
         { status: 400 }
       );
     }
     
     // Get the user's latest campaign
     const campaign = await prisma.campaign.findFirst({
       where: {
         advertiserId: advertiserId
       },
       orderBy: {
         createdAt: 'desc'
       }
     });
     
     if (!campaign) {
       return NextResponse.json(
         { error: "No campaigns found for this user" },
         { status: 404 }
       );
     }
     
     return NextResponse.json(campaign);
     
   } catch (error) {
     console.error("Error fetching latest campaign:", error);
     return NextResponse.json(
       { error: "Failed to fetch latest campaign", details: (error as Error).message },
       { status: 500 }
     );
   }
 } 