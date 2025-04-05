import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

/**
 * Format an address to show only the first and last few characters
 * @param address The address to format
 * @param chars Number of characters to show at the beginning and end
 */
export function formatAddress(address: string, chars: number = 4): string {
  if (!address || address.length <= chars * 2) {
    return address || ""
  }
  
  return `${address.substring(0, chars)}...${address.substring(address.length - chars)}`
}

