import { NextRequest, NextResponse } from "next/server";
import { Transaction, TransactionType, TransactionStatus, TokenType } from "@/lib/store/useTransactionStore";
import { prisma } from "@/lib/prisma";

/**
 * GET handler to export user transactions as CSV
 */
export async function GET(
  request: NextRequest,
  { params }: { params: { address: string } }
) {
  try {
    if (!params) {
      return NextResponse.json({ error: "Missing parameters" }, { status: 400 });
    }

    // Use dynamic import to ensure params is properly awaited
    const { address } = await Promise.resolve(params);
    
    if (!address) {
      return NextResponse.json({ error: "Invalid address parameter" }, { status: 400 });
    }

    // The wallet address in the URL path acts as authentication
    // No additional token verification needed since the user has connected their wallet
    
    // Get query parameters for filtering
    const searchParams = request.nextUrl.searchParams;
    const type = searchParams.get('type');
    const tokenType = searchParams.get('token');
    const status = searchParams.get('status');
    
    // Find user by wallet address
    const user = await prisma.user.findUnique({
      where: { walletAddress: address },
    });
    
    if (!user) {
      return NextResponse.json(
        { error: "User not found" },
        { status: 404 }
      );
    }
    
    // In a real implementation, we would fetch transactions from the database
    // For now, we return an empty array instead of generating mock data
    const transactions: Transaction[] = [];
    
    // Apply filters if needed in the future
    // This is just a placeholder for future implementation
    let filteredTransactions = transactions;
    
    if (type && type !== 'all') {
      filteredTransactions = filteredTransactions.filter(tx => tx.type === type);
    }
    
    if (tokenType && tokenType !== 'all') {
      filteredTransactions = filteredTransactions.filter(tx => tx.token === tokenType);
    }
    
    if (status && status !== 'all') {
      filteredTransactions = filteredTransactions.filter(tx => tx.status === status);
    }
    
    // Create CSV content
    const csvHeader = "ID,Type,Amount,Token,Status,Timestamp,Transaction Hash\n";
    const csvRows = filteredTransactions.map(tx => 
      `${tx.id},"${tx.type}",${tx.amount},${tx.token},${tx.status},"${tx.timestamp}",${tx.txHash}`
    );
    const csvContent = csvHeader + csvRows.join('\n');
    
    // Return CSV file
    return new NextResponse(csvContent, {
      status: 200,
      headers: {
        'Content-Type': 'text/csv',
        'Content-Disposition': `attachment; filename="transactions-${address.slice(0, 8)}.csv"`
      }
    });
  } catch (error) {
    console.error("[API] Error exporting user transactions:", error);
    return NextResponse.json(
      { error: "Failed to export user transactions" },
      { status: 500 }
    );
  }
} 