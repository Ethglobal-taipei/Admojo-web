/**
 * Client-side API utilities to replace direct Prisma calls
 * Use these functions in browser environments instead of importing from db.ts
 */

// User related API calls
export async function getUserByAddress(address: string) {
  const response = await fetch(`/api/users?address=${address}`);
  if (!response.ok) {
    throw new Error('Failed to fetch user');
  }
  return response.json();
}

export async function getOrCreateUserByAddress(address: string) {
  try {
    // First try to get the user
    const user = await getUserByAddress(address);
    if (user) return user;
  } catch (error) {
    // User doesn't exist, create a new one
    const response = await fetch('/api/users', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ address })
    });
    
    if (!response.ok) {
      throw new Error('Failed to create user');
    }
    
    return response.json();
  }
}

// Add more client-side API functions as needed for other db operations
// These functions should mimic the interface of the original db.ts functions
// but use fetch to call the API endpoints instead of using Prisma directly 