import { NextResponse } from "next/server";
import { callMetalAPI } from "../../route";

// This endpoint creates a new holder account in Metal
export async function POST(req: Request) {
  try {
    const { userId, userType } = await req.json();
    
    if (!userId) {
      return NextResponse.json(
        { error: "Missing required parameter: userId" },
        { status: 400 }
      );
    }
    
    // Valid user types
    const validUserTypes = ["advertiser", "display_owner"];
    if (userType && !validUserTypes.includes(userType)) {
      return NextResponse.json(
        { error: `Invalid userType. Must be one of: ${validUserTypes.join(", ")}` },
        { status: 400 }
      );
    }
    
    // Create holder in Metal
    const holderResponse = await callMetalAPI(
      `/holder/${userId}`,
      "PUT"
    );
    
    // In production, you would store additional user data in your database
    // await storeUserData(userId, userType, holderResponse);
    
    return NextResponse.json({
      success: true,
      message: `Successfully created ${userType || "user"} holder account`,
      holder: holderResponse
    });
    
  } catch (error) {
    console.error("Error in create-holder:", error);
    return NextResponse.json(
      { error: "Failed to create holder account", details: (error as Error).message },
      { status: 500 }
    );
  }
} 