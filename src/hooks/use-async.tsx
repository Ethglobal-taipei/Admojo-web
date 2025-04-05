'use client';

import { useState, useCallback, useRef } from 'react';

/**
 * A hook to handle async operations with loading and error states
 * @param asyncFunction The async function to execute
 * @param initialData Initial data value (optional)
 * @returns Object with execute function, loading state, error state, and data
 */
export function useAsync<T = any, P extends any[] = any[]>(
  asyncFunction: (...args: P) => Promise<T>,
  initialData?: T
) {
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<Error | null>(null);
  const [data, setData] = useState<T | undefined>(initialData);
  
  // Use ref to store the function to avoid dependency issues
  const asyncFunctionRef = useRef(asyncFunction);
  
  // Update the ref whenever the function changes
  asyncFunctionRef.current = asyncFunction;
  
  const execute = useCallback(
    async (...args: P): Promise<T | null> => {
      try {
        setIsLoading(true);
        setError(null);
        
        const result = await asyncFunctionRef.current(...args);
        
        setData(result);
        return result;
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : 'Unknown error';
        console.error(errorMessage, err);
        
        setError(err instanceof Error ? err : new Error(errorMessage));
        return null;
      } finally {
        setIsLoading(false);
      }
    },
    [] // No dependencies needed since we use the ref
  );
  
  return {
    execute,
    isLoading,
    error,
    data
  };
} 