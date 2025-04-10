import { NextResponse } from "next/server";

const METAL_API_URL = "https://api.metal.build";
const METAL_API_KEY = process.env.METAL_API_KEY;

// ADC token address - this would be set after token creation
const ADC_TOKEN_ADDRESS = "0xa3239522f692bf01727ab56681f564049d86f545" // Placeholder
const ESCROW_ADDRESS = "0x00";

if (!METAL_API_KEY) {
  console.warn("METAL_API_KEY not set in environment variables");
}

export async function GET() {
  return NextResponse.json({ message: "Metal API service" });
}

// Helper to make Metal API requests
async function callMetalAPI(endpoint: string, method: string, body?: any) {
  try {
    const response = await fetch(`${METAL_API_URL}${endpoint}`, {
      method,
      headers: {
        "Content-Type": "application/json",
        "x-api-key": METAL_API_KEY || "",
      },
      body: JSON.stringify(body) ,
    });
    
    console.log(body);

    if (!response.ok) {
      console.log(response);  
      const errorText = await response.text();
      throw new Error(`Metal API error: ${response.status} - ${errorText}`);
    }
    
    return await response.json();
  } catch (error) {
    console.error("Error calling Metal API:", error);
    throw error;
  }
}

export { callMetalAPI, ADC_TOKEN_ADDRESS, ESCROW_ADDRESS }; 