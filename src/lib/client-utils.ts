// Utility to check if code is running on the client
export const isClient = typeof window !== "undefined"

// Safe way to access window
export const safeWindow = () => (isClient ? window : undefined)

// Safe way to access document
export const safeDocument = () => (isClient ? document : undefined)

// Safe way to access localStorage
export const safeLocalStorage = () => {
  if (!isClient) return null
  try {
    return window.localStorage
  } catch (e) {
    console.error("localStorage is not available:", e)
    return null
  }
}

// Safe way to get current date
export const safeNow = () => {
  // Use a fixed date for server rendering to avoid hydration mismatch
  if (!isClient) return new Date("2023-01-01T00:00:00Z")
  return new Date()
}

