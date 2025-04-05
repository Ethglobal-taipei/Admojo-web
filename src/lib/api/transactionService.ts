import { Transaction, TransactionFilters } from '../store/useTransactionStore';
import { ApiResponse } from './userService';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'https://api.adnet-protocol.com';

/**
 * Fetches user transactions
 */
export async function fetchTransactions(
  address: string,
  filters?: Partial<TransactionFilters>
): Promise<ApiResponse<Transaction[]>> {
  try {
    // Build query parameters
    const queryParams = new URLSearchParams();
    if (filters?.type && filters.type !== 'all') {
      queryParams.append('type', filters.type);
    }
    if (filters?.token && filters.token !== 'all') {
      queryParams.append('token', filters.token);
    }
    if (filters?.status && filters.status !== 'all') {
      queryParams.append('status', filters.status);
    }

    const queryString = queryParams.toString() ? `?${queryParams.toString()}` : '';
    const response = await fetch(`${API_BASE_URL}/users/${address}/transactions${queryString}`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${localStorage.getItem('auth_token')}`,
      },
    });

    if (!response.ok) {
      throw new Error(`API error: ${response.status}`);
    }

    const data = await response.json();
    return { success: true, data };
  } catch (error) {
    console.error('Error fetching transactions:', error);
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Failed to fetch transactions' 
    };
  }
}

/**
 * Fetches transaction details by ID
 */
export async function fetchTransactionById(
  address: string,
  transactionId: number
): Promise<ApiResponse<Transaction>> {
  try {
    const response = await fetch(`${API_BASE_URL}/users/${address}/transactions/${transactionId}`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${localStorage.getItem('auth_token')}`,
      },
    });

    if (!response.ok) {
      throw new Error(`API error: ${response.status}`);
    }

    const data = await response.json();
    return { success: true, data };
  } catch (error) {
    console.error('Error fetching transaction:', error);
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Failed to fetch transaction' 
    };
  }
}

/**
 * Exports transactions as CSV file
 */
export async function exportTransactions(
  address: string,
  filters?: Partial<TransactionFilters>
): Promise<ApiResponse<Blob>> {
  try {
    // Build query parameters
    const queryParams = new URLSearchParams();
    if (filters?.type && filters.type !== 'all') {
      queryParams.append('type', filters.type);
    }
    if (filters?.token && filters.token !== 'all') {
      queryParams.append('token', filters.token);
    }
    if (filters?.status && filters.status !== 'all') {
      queryParams.append('status', filters.status);
    }
    queryParams.append('format', 'csv');

    const queryString = queryParams.toString() ? `?${queryParams.toString()}` : '';
    const response = await fetch(`${API_BASE_URL}/users/${address}/transactions/export${queryString}`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${localStorage.getItem('auth_token')}`,
      },
    });

    if (!response.ok) {
      throw new Error(`API error: ${response.status}`);
    }

    const data = await response.blob();
    return { success: true, data };
  } catch (error) {
    console.error('Error exporting transactions:', error);
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Failed to export transactions' 
    };
  }
} 