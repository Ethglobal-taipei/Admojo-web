import { NextRequest, NextResponse } from "next/server";
import { verifyJWT } from "@/lib/auth/jwt";
import { Transaction, TransactionType, TransactionStatus, TokenType } from "@/lib/store/useTransactionStore";

/**
 * GET handler to fetch user transactions
 */
export async function GET(
  request: NextRequest,
  { params }: { params: { address: string } }
) {
  const { address } = params;

  try {
    // Get authorization header
    const authHeader = request.headers.get("authorization");
    if (!authHeader) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }
    
    // Verify JWT token
    const token = authHeader.replace("Bearer ", "");
    const isValid = await verifyJWT(token);
    if (!isValid) {
      return NextResponse.json(
        { error: "Invalid token" },
        { status: 401 }
      );
    }
    
    // Get query parameters for filtering
    const searchParams = request.nextUrl.searchParams;
    const type = searchParams.get('type');
    const token = searchParams.get('token');
    const status = searchParams.get('status');
    
    // Generate mock transactions
    const transactions = generateMockTransactions(address, 20);
    
    // Apply filters
    let filteredTransactions = transactions;
    
    if (type && type !== 'all') {
      filteredTransactions = filteredTransactions.filter(tx => tx.type === type);
    }
    
    if (token && token !== 'all') {
      filteredTransactions = filteredTransactions.filter(tx => tx.token === token);
    }
    
    if (status && status !== 'all') {
      filteredTransactions = filteredTransactions.filter(tx => tx.status === status);
    }
    
    return NextResponse.json(filteredTransactions, { status: 200 });
  } catch (error) {
    console.error("[API] Error fetching user transactions:", error);
    return NextResponse.json(
      { error: "Failed to fetch user transactions" },
      { status: 500 }
    );
  }
}

/**
 * Helper to generate mock transactions
 */
function generateMockTransactions(address: string, count: number): Transaction[] {
  const transactions: Transaction[] = [];
  
  const transactionTypes: TransactionType[] = ["deposit", "withdrawal", "swap", "allocation", "reallocation"];
  const tokenTypes: TokenType[] = ["USDC", "ADC"];
  const statusTypes: TransactionStatus[] = ["completed", "pending"];
  
  // Generate random transactions
  for (let i = 0; i < count; i++) {
    const type = transactionTypes[Math.floor(Math.random() * transactionTypes.length)];
    const token = tokenTypes[Math.floor(Math.random() * tokenTypes.length)];
    const status = Math.random() > 0.2 ? "completed" : "pending"; // 80% completed, 20% pending
    
    // Make amount sensible based on type
    let amount = 0;
    switch (type) {
      case "deposit":
        amount = Math.floor(Math.random() * 2000) + 100;
        break;
      case "withdrawal":
        amount = Math.floor(Math.random() * 1000) + 50;
        break;
      case "swap":
        amount = Math.floor(Math.random() * 3000) + 200;
        break;
      case "allocation":
        amount = Math.floor(Math.random() * 500) + 100;
        break;
      case "reallocation":
        amount = Math.floor(Math.random() * 300) + 50;
        break;
    }
    
    // Generate a realistic timestamp
    const daysAgo = Math.floor(Math.random() * 30); // Random day in the last month
    const date = new Date();
    date.setDate(date.getDate() - daysAgo);
    
    let timestamp = "";
    if (daysAgo === 0) {
      timestamp = `Today, ${formatTime(date)}`;
    } else if (daysAgo === 1) {
      timestamp = `Yesterday, ${formatTime(date)}`;
    } else {
      timestamp = `${date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}, ${formatTime(date)}`;
    }
    
    // Generate a transaction hash based on the address
    const txHash = `0x${generateRandomHex(4)}...${generateRandomHex(4)}`;
    
    transactions.push({
      id: i + 1,
      type,
      amount,
      token,
      status,
      timestamp,
      txHash,
    });
  }
  
  // Sort by most recent first
  return transactions.sort((a, b) => {
    // Parse timestamps for comparison (approx)
    const aIsToday = a.timestamp.includes('Today');
    const bIsToday = b.timestamp.includes('Today');
    const aIsYesterday = a.timestamp.includes('Yesterday');
    const bIsYesterday = b.timestamp.includes('Yesterday');
    
    if (aIsToday && !bIsToday) return -1;
    if (!aIsToday && bIsToday) return 1;
    if (aIsYesterday && !bIsToday && !bIsYesterday) return -1;
    if (!aIsYesterday && !aIsToday && bIsYesterday) return 1;
    
    // Default random sort
    return Math.random() - 0.5;
  });
}

/**
 * Helper to format time
 */
function formatTime(date: Date): string {
  const hours = date.getHours();
  const minutes = date.getMinutes();
  return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')} ${hours >= 12 ? 'PM' : 'AM'}`;
}

/**
 * Helper to generate random hex string
 */
function generateRandomHex(length: number): string {
  return Array.from({ length })
    .map(() => Math.floor(Math.random() * 16).toString(16))
    .join('');
} 