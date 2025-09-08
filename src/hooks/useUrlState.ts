import { useMemo, useCallback } from 'react';
import { useSearchParams } from 'react-router-dom';

/**
 * Custom hook for managing state through URL query parameters
 * Provides automatic serialization/deserialization and type safety
 * 
 * @example
 * const [filters, setFilters] = useUrlState({
 *   status: 'all',
 *   confidence: 'all', 
 *   search: ''
 * });
 */
export function useUrlState<T extends Record<string, string>>(
  defaultValues: T
): [T, (updates: Partial<T>) => void] {
  const [searchParams, setSearchParams] = useSearchParams();

  // Get current state from URL or defaults
  const state = useMemo(() => {
    const params: T = { ...defaultValues };
    
    searchParams.forEach((value, key) => {
      if (key in defaultValues) {
        params[key as keyof T] = value as T[keyof T];
      }
    });
    
    return params;
  }, [searchParams, defaultValues]);

  // Update URL params
  const setState = useCallback((updates: Partial<T>) => {
    setSearchParams((prev) => {
      const next = new URLSearchParams(prev);
      
      Object.entries(updates).forEach(([key, value]) => {
        if (value === null || value === undefined || value === defaultValues[key as keyof T]) {
          // Remove param if it's null/undefined or same as default
          next.delete(key);
        } else {
          next.set(key, value);
        }
      });
      
      return next;
    });
  }, [setSearchParams, defaultValues]);

  return [state, setState];
}

/**
 * Extended version that supports complex data types through JSON encoding
 */
export function useUrlStateExtended<T extends Record<string, any>>(
  defaultValues: T
): [T, (updates: Partial<T>) => void] {
  const [searchParams, setSearchParams] = useSearchParams();

  const state = useMemo(() => {
    const params: T = { ...defaultValues };
    
    searchParams.forEach((value, key) => {
      if (key in defaultValues) {
        try {
          // Try to parse as JSON first (for arrays, objects)
          params[key as keyof T] = JSON.parse(value);
        } catch {
          // Fallback to string value
          params[key as keyof T] = value as T[keyof T];
        }
      }
    });
    
    return params;
  }, [searchParams, defaultValues]);

  const setState = useCallback((updates: Partial<T>) => {
    setSearchParams((prev) => {
      const next = new URLSearchParams(prev);
      
      Object.entries(updates).forEach(([key, value]) => {
        if (value === null || value === undefined || 
            JSON.stringify(value) === JSON.stringify(defaultValues[key as keyof T])) {
          next.delete(key);
        } else if (typeof value === 'object') {
          next.set(key, JSON.stringify(value));
        } else {
          next.set(key, String(value));
        }
      });
      
      return next;
    });
  }, [setSearchParams, defaultValues]);

  return [state, setState];
}