// Simple auth implementation for development
// In a real application, you would use a proper auth library

/**
 * Get the current user session
 * This is a mock implementation that always returns a dev user
 */
export async function getSession() {
  // For development purposes only - this always returns a mock session
  // Replace with real authentication in production
  return {
    user: {
      id: 'dev-user-id',
    }
  };
} 