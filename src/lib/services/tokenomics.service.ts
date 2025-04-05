import { toast } from "@/lib/toast";

/**
 * Calls the backend API to create a Metal holder account for a given user ID.
 * 
 * @param userId The unique identifier for the user (e.g., wallet address or internal ID).
 * @param userType Optional type of user ("advertiser" or "display_owner").
 * @returns True if the holder was created or already exists, false otherwise.
 */
export async function createMetalHolder(userId: string, walletAddress: string, userType?: string): Promise<boolean> {
  try {
    console.log("createMetalHolder called with:", { userId, walletAddress, userType });
    
    if (!walletAddress) {
      console.error("Missing walletAddress parameter in createMetalHolder");
      return false;
    }
    
    // First, call the Metal API to create a holder
    const response = await fetch('/api/metal/tokenomics/create-holder', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ userId, userType }),
    });

    const data = await response.json();
    console.log("Metal API response:", JSON.stringify(data));

    if (!response.ok) {
      console.error("Failed to create Metal holder:", data.error, data.details);
      // Avoid showing generic failure toast if it's a known non-issue (like already exists)
      if (response.status !== 409) { // Assuming 409 Conflict means already exists
        toast("Holder Creation Failed", { 
          description: `Could not create Metal holder: ${data.error || response.statusText}` 
        }, "error");
      }
      // Even if it failed because it exists, we consider the goal achieved.
      return response.status === 409; 
    }

    console.log("Successfully created Metal holder:", data);
    
    // Extract holder address from the response
    const holderAddress = data?.holder?.address;
    console.log("Extracted holder address:", holderAddress, "Wallet address:", walletAddress);

    // If we have holder data and this is a new user, create the user record
    if (holderAddress && walletAddress) {
      try {
        // Check if user exists first
        const checkResponse = await fetch(`/api/users/check?walletAddress=${encodeURIComponent(walletAddress)}`, {
          method: 'GET'
        });
        
        const checkData = await checkResponse.json();
        
        // Only create the user if they don't exist yet
        if (!checkData.exists) {
          console.log("Creating new user with wallet address:", walletAddress);
          
          // Create the request body object with all required fields
          const requestBody = {
            walletAddress: walletAddress,
            holderAddress: holderAddress,
            role: userType || "Advertiser"
          };
          
          // Log the request payload
          console.log("User creation request payload:", JSON.stringify(requestBody));
          
          const createResponse = await fetch('/api/users/create', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify(requestBody),
          });
          
          if (!createResponse.ok) {
            const errorText = await createResponse.text();
            console.error("Error creating user:", errorText);
            try {
              const errorJson = JSON.parse(errorText);
              console.error("Error details:", errorJson);
            } catch(e) {
              // If not parseable as JSON, ignore
            }
          } else {
            const successData = await createResponse.json();
            console.log("Successfully created user:", successData);
          }
        } else {
          console.log("User already exists, no need to create");
        }
      } catch (error) {
        console.error("Error checking/creating user:", error);
        // Don't fail the overall operation if user creation fails
      }
    } else {
      console.error("Missing required data to create user:", { 
        hasHolderAddress: !!holderAddress, 
        hasWalletAddress: !!walletAddress 
      });
    }
    
    return true;

  } catch (error) {
    console.error("Error calling create-holder API:", error);
    toast("API Connection Error", { 
      description: "Could not connect to the holder creation service." 
    }, "error");
    return false;
  }
}

/**
 * Calls the backend API to manually trigger the hourly payment processing.
 * 
 * @returns True if the trigger was successful, false otherwise.
 */
export async function triggerHourlyPayments(): Promise<boolean> {
  try {
    const response = await fetch('/api/tokenomics/trigger-hourly-payments', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
    });

    const data = await response.json();

    if (!response.ok || !data.success) {
      console.error("Failed to trigger hourly payments:", data.error, data.details);
      toast("Payment Trigger Failed", { 
        description: `Could not trigger hourly payments: ${data.error || response.statusText}` 
      }, "error");
      return false;
    }

    console.log("Successfully triggered hourly payments:", data);
    toast("Hourly Payments Triggered", { description: data.message }, "success");
    return true;

  } catch (error) {
    console.error("Error calling trigger-hourly-payments API:", error);
    toast("API Connection Error", { 
      description: "Could not connect to the payment trigger service." 
    }, "error");
    return false;
  }
}

/**
 * Interface for individual display performance data.
 */
interface DisplayPerformanceData {
  id: string;        // Unique identifier for the display
  ownerId: string;   // Identifier for the display owner (Metal holder ID)
  views: number;     // Number of views recorded for this display in the time slot
  // Add any other relevant performance metrics
}

/**
 * Calls the backend API to process payments for specific displays based on performance.
 * 
 * @param campaignId The ID of the campaign being processed.
 * @param timeSlot Identifier for the time slot (e.g., timestamp, "YYYY-MM-DDTHH:00:00Z").
 * @param performanceData Array of performance data objects for each display.
 * @returns The response data from the API if successful, null otherwise.
 */
export async function processDisplayPayments(
  campaignId: string,
  timeSlot: string,
  performanceData: DisplayPerformanceData[]
): Promise<any | null> { // Consider defining a more specific return type based on your API response
  try {
    const response = await fetch('/api/tokenomics/process-display-payments', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ campaignId, timeSlot, performanceData }),
    });

    const data = await response.json();

    if (!response.ok || !data.success) {
      console.error("Failed to process display payments:", data.error, data.details);
      toast("Display Payment Failed", { 
        description: `Could not process payments: ${data.error || response.statusText}` 
      }, "error");
      return null;
    }

    console.log("Successfully processed display payments:", data);
    // You might want a less intrusive notification depending on where this is called
    toast("Display Payments Processed", { description: data.message }, "info"); 
    return data; // Return the full response data for potential further use

  } catch (error) {
    console.error("Error calling process-display-payments API:", error);
    toast("API Connection Error", { 
      description: "Could not connect to the display payment service." 
    }, "error");
    return null;
  }
}

/**
 * Creates a Metal holder account specifically for a campaign.
 * 
 * @param campaignId The ID of the campaign.
 * @returns True if successful, false otherwise.
 */
export async function createCampaignHolder(campaignId: string): Promise<boolean> {
  try {
    console.log("Creating campaign holder for campaign ID:", campaignId);
    
    const response = await fetch('/api/metal/tokenomics/campaign-holder', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ campaignId }),
    });

    const data = await response.json();
    console.log("Campaign holder creation response:", data);

    if (!response.ok) {
      console.error("Failed to create campaign holder:", data.error, data.details);
      toast("Campaign Holder Creation Failed", { 
        description: `Could not create campaign holder: ${data.error || response.statusText}` 
      }, "error");
      return false;
    }

    return true;
  } catch (error) {
    console.error("Error creating campaign holder:", error);
    toast("API Connection Error", { 
      description: "Could not connect to the campaign holder creation service." 
    }, "error");
    return false;
  }
}

/**
 * Purchases ADC tokens for a user.
 * 
 * @param userId The ID of the user purchasing tokens.
 * @param amount The amount of ADC tokens to purchase.
 * @param paymentMethod The payment method (e.g., "USDC", "credit-card").
 * @param walletAddress The wallet address of the user.
 * @returns Transaction data if successful, null otherwise.
 */
export async function purchaseADCTokens(
  userId: string,
  amount: number,
  paymentMethod: string,
  walletAddress: string
): Promise<any | null> {
  try {
    console.log("Purchasing ADC tokens:", { userId, amount, paymentMethod, walletAddress });
    
    const response = await fetch('/api/metal/tokenomics/purchase-adc', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ userId, amount, paymentMethod, walletAddress }),
    });

    const data = await response.json();

    if (!response.ok || !data.success) {
      console.error("Failed to purchase ADC tokens:", data.error, data.details);
      toast("Purchase Failed", { 
        description: `Could not purchase ADC tokens: ${data.error || response.statusText}` 
      }, "error");
      return null;
    }

    console.log("Successfully purchased ADC tokens:", data);
    toast("Tokens Purchased", { 
      description: `Successfully purchased ${amount} ADC tokens!` 
    }, "success");
    
    return data.transaction;
  } catch (error) {
    console.error("Error calling purchase-adc API:", error);
    toast("API Connection Error", { 
      description: "Could not connect to the token purchase service." 
    }, "error");
    return null;
  }
}

/**
 * Transfers ADC tokens from a user's holder account to a campaign.
 * 
 * @param userId The ID of the user (holder ID).
 * @param campaignId The ID of the campaign to fund.
 * @param amount The amount of ADC tokens to transfer.
 * @param toAddress The destination wallet address (usually campaign contract address).
 * @returns True if successful, false otherwise.
 */
export async function fundCampaign(
  holderId: string,
  campaignId: string,
  amount: number,
  toAddress: string
): Promise<boolean> {
  try {
    console.log("Funding campaign:", { holderId, campaignId, amount, toAddress });
    
    const response = await fetch('/api/metal/tokenomics/withdraw', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ holderId, amount, toAddress, campaignId }),
    });

    const data = await response.json();

    if (!response.ok || !data.success) {
      console.error("Failed to fund campaign:", data.error, data.details);
      toast("Campaign Funding Failed", { 
        description: `Could not fund campaign: ${data.error || response.statusText}` 
      }, "error");
      return false;
    }

    console.log("Successfully funded campaign:", data);
    toast("Campaign Funded", { 
      description: `Successfully funded campaign with ${amount} ADC tokens!` 
    }, "success");
    
    return true;
  } catch (error) {
    console.error("Error funding campaign:", error);
    toast("API Connection Error", { 
      description: "Could not connect to the campaign funding service." 
    }, "error");
    return false;
  }
}

/**
 * Updates the budget for a campaign.
 * 
 * @param campaignId The ID of the campaign.
 * @param userId The ID of the user making the request.
 * @param userHolderAddress The Metal holder address of the user.
 * @param amount The amount to add or withdraw.
 * @param operation The operation to perform ('add' or 'withdraw').
 * @returns Campaign data if successful, null otherwise.
 */
export async function updateCampaignBudget(
  campaignId: string,
  userId: string,
  userHolderAddress: string,
  amount: number,
  operation: 'add' | 'withdraw'
): Promise<any | null> {
  try {
    console.log(`${operation === 'add' ? 'Adding to' : 'Withdrawing from'} campaign budget:`, { 
      campaignId, 
      userId, 
      amount,
      operation
    });
    
    const response = await fetch(`/api/campaigns/${campaignId}/budget`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ 
        amount,
        operation,
        userId,
        userHolderAddress
      }),
    });

    const data = await response.json();

    if (!response.ok || !data.success) {
      console.error("Failed to update campaign budget:", data.error, data.details);
      toast("Budget Update Failed", { 
        description: `Could not ${operation} budget: ${data.error || response.statusText}` 
      }, "error");
      return null;
    }

    console.log("Successfully updated campaign budget:", data);
    toast("Budget Updated", { 
      description: `Successfully ${operation === 'add' ? 'added' : 'withdrawn'} ${amount} ADC ${operation === 'add' ? 'to' : 'from'} campaign budget!` 
    }, "success");
    
    return data.campaign;
  } catch (error) {
    console.error("Error updating campaign budget:", error);
    toast("API Connection Error", { 
      description: "Could not connect to the budget management service." 
    }, "error");
    return null;
  }
} 