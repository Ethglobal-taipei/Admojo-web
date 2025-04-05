import { NextResponse } from "next/server";
import { runHourlyPaymentCron } from "../../../../../lib/cron/process-hourly-payments";

// This endpoint is called by cron-job.org to trigger the hourly payment process
export async function POST(request: Request) {
  try {
    // Get the API key from the request header
    const apiKey = request.headers.get('X-API-Key');
    const expectedApiKey = process.env.PAYMENT_WEBHOOK_API_KEY;

    // Validate the API key
    if (!apiKey || apiKey !== expectedApiKey) {
      console.error('Invalid or missing API key');
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Trigger the hourly payment process
    const success = await runHourlyPaymentCron();
    
    if (success) {
      return NextResponse.json({
        success: true,
        message: "Successfully processed hourly payments",
        timestamp: new Date().toISOString()
      });
    } else {
      return NextResponse.json(
        { error: "Failed to process hourly payments" },
        { status: 500 }
      );
    }
  } catch (error) {
    console.error("Error in trigger-hourly-payments:", error);
    return NextResponse.json(
      { error: "Failed to process hourly payments", details: (error as Error).message },
      { status: 500 }
    );
  }
} 