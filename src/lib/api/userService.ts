import { UserState } from '../store/useUserStore';

// Use environment variable with fallback to relative path for easier development
const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || '/api';

export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
}

/**
 * Fetches user data from API based on wallet address
 */
export async function fetchUserData(address: string): Promise<ApiResponse<UserState['user']>> {
  try {
    const response = await fetch(`${API_BASE_URL}/users/${address}`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      throw new Error(`API error: ${response.status}`);
    }

    const data = await response.json();
    return { success: true, data };
  } catch (error) {
    console.error('Error fetching user data:', error);
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Failed to fetch user data' 
    };
  }
}

/**
 * Updates user profile data
 */
export async function updateUserProfile(
  address: string, 
  userData: Partial<NonNullable<UserState['user']>>
): Promise<ApiResponse<UserState['user']>> {
  try {
    const response = await fetch(`${API_BASE_URL}/users/${address}`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(userData),
    });

    if (!response.ok) {
      throw new Error(`API error: ${response.status}`);
    }

    const data = await response.json();
    return { success: true, data };
  } catch (error) {
    console.error('Error updating user profile:', error);
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Failed to update user profile' 
    };
  }
}

/**
 * Fetches user balance data
 */
export async function fetchUserBalances(address: string): Promise<ApiResponse<UserState['balances']>> {
  try {
    const response = await fetch(`${API_BASE_URL}/users/${address}/balances`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    });

    // Special handling for 404 errors - likely the balances endpoint isn't available
    if (response.status === 404) {
      console.warn(`Balances endpoint not found for user ${address}`);
      // Return a mock response instead of throwing an error
      return { 
        success: false, 
        error: "Balances endpoint not available", 
        data: {
          USDC: 5280.42,
          ADC: 12450.0,
        }
      };
    }
    
    if (!response.ok) {
      throw new Error(`API error: ${response.status}`);
    }

    const data = await response.json();
    return { success: true, data };
  } catch (error) {
    console.error('Error fetching user balances:', error);
    // Provide fallback data directly in the response
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Failed to fetch user balances',
      data: {
        USDC: 5280.42,
        ADC: 12450.0,
      }
    };
  }
}

/**
 * Fetches user statistics
 */
export async function fetchUserStats(address: string): Promise<ApiResponse<UserState['stats']>> {
  try {
    const response = await fetch(`${API_BASE_URL}/users/${address}/stats`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      throw new Error(`API error: ${response.status}`);
    }

    const data = await response.json();
    return { success: true, data };
  } catch (error) {
    console.error('Error fetching user stats:', error);
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Failed to fetch user stats' 
    };
  }
}

/**
 * Updates user settings
 */
export async function updateUserSettings(
  address: string,
  settings: { notificationSettings?: Record<string, boolean>; privacySettings?: Record<string, boolean> }
): Promise<ApiResponse<{ notificationSettings: Record<string, boolean>; privacySettings: Record<string, boolean> }>> {
  try {
    const response = await fetch(`${API_BASE_URL}/users/${address}/settings`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(settings),
    });

    if (!response.ok) {
      throw new Error(`API error: ${response.status}`);
    }

    const data = await response.json();
    return { success: true, data };
  } catch (error) {
    console.error('Error updating user settings:', error);
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Failed to update user settings' 
    };
  }
} 