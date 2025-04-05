'use client';

// This file is a compatibility wrapper to maintain backward compatibility
// while using the new useBoothRegistry implementation

import { useBoothRegistry } from './use-booth-registry';

/**
 * @deprecated Use useBoothRegistry instead. This is a compatibility wrapper.
 */
export function useBoothManager() {
  // Simply return the useBoothRegistry hook output
  return useBoothRegistry();
} 