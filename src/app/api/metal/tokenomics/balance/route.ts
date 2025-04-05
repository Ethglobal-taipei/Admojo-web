import { NextResponse } from "next/server";
import { callMetalAPI, ADC_TOKEN_ADDRESS } from "../../route";

/**
 * Endpoint to get token balance for a specific holder address
 * Calls Metal API endpoint: /holder/:holderAddress/token/:address
 * Query parameters:
 * - holderAddress: The Metal holder address to check balance for
 * - tokenAddress: (Optional) The token contract address to check, defaults to ADC token
 */
export async function GET(req: Request) {
  try {

    
    const {holderAddress , tokenAddress } = await req.json();

    if (!holderAddress) {
      return NextResponse.json(
        { error: "Missing required parameter: holderAddress" },
        { status: 400 }
      );
    }
    
    // Call Metal API to get token balance
    try {
      console.log(`Fetching balance for holder ${holderAddress} and token ${tokenAddress}`);
      
      // Convert the path to use the correct Metal API endpoint format
      const tokenData = await callMetalAPI(
        `/holder/${holderAddress}/token/${tokenAddress}`,
        "GET"
      );


      console.log(tokenData);
      
      if (!tokenData) {
        return NextResponse.json(
          { error: "No data returned from Metal API" },
          { status: 500 }
        );
      }
      
      // Return the token balance data
      return NextResponse.json({
        name: tokenData.name,
        symbol: tokenData.symbol,
        id: tokenData.id,
        address: tokenData.address,
        balance: tokenData.balance,
        value: tokenData.value
      });
      
    } catch (error) {
      console.error("Error fetching token balance from Metal:", error);
      return NextResponse.json(
        { error: "Failed to fetch token balance from Metal", details: (error as Error).message },
        { status: 500 }
      );
    }
    
  } catch (error) {
    console.error("Error in token balance API:", error);
    return NextResponse.json(
      { error: "Failed to fetch token balance", details: (error as Error).message },
      { status: 500 }
    );
  }
} 