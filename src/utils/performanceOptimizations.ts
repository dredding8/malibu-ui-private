import React, { useCallback, useMemo, useRef, useEffect } from 'react';
import { debounce, throttle } from 'lodash';

/**
 * Performance optimization utilities for CollectionOpportunitiesHub
 */

// Virtual scrolling constants
const OVERSCAN = 5;
const ITEM_HEIGHT = 52; // Average row height in pixels

/**
 * Hook for virtual scrolling implementation
 */
export function useVirtualScroll<T>(
  items: T[],
  containerHeight: number,
  itemHeight = ITEM_HEIGHT,
  overscan = OVERSCAN
) {
  const scrollTop = useRef(0);
  
  const visibleRange = useMemo(() => {
    const start = Math.floor(scrollTop.current / itemHeight);
    const end = Math.ceil((scrollTop.current + containerHeight) / itemHeight);
    
    return {
      start: Math.max(0, start - overscan),
      end: Math.min(items.length, end + overscan),
      offsetY: start * itemHeight,
    };
  }, [items.length, containerHeight, itemHeight, overscan, scrollTop.current]);
  
  const visibleItems = useMemo(
    () => items.slice(visibleRange.start, visibleRange.end),
    [items, visibleRange]
  );
  
  const totalHeight = items.length * itemHeight;
  
  const handleScroll = useCallback((e: React.UIEvent<HTMLElement>) => {
    scrollTop.current = e.currentTarget.scrollTop;
  }, []);
  
  return {
    visibleItems,
    totalHeight,
    offsetY: visibleRange.offsetY,
    handleScroll: throttle(handleScroll, 16), // 60fps throttling
  };
}

/**
 * Memoized data transformations
 */
export function useOptimizedData<T, R>(
  data: T[],
  transform: (item: T) => R,
  dependencies: any[] = []
): R[] {
  return useMemo(
    () => data.map(transform),
    [data, ...dependencies]
  );
}

/**
 * Debounced search/filter
 */
export function useDebouncedFilter<T>(
  items: T[],
  filterFn: (item: T, query: string) => boolean,
  query: string,
  delay = 300
) {
  const [filteredItems, setFilteredItems] = React.useState(items);
  const debouncedFilter = useMemo(
    () => debounce((items: T[], query: string) => {
      if (!query) {
        setFilteredItems(items);
        return;
      }
      
      const filtered = items.filter(item => filterFn(item, query));
      setFilteredItems(filtered);
    }, delay),
    [filterFn, delay]
  );
  
  useEffect(() => {
    debouncedFilter(items, query);
    return () => {
      debouncedFilter.cancel();
    };
  }, [items, query, debouncedFilter]);
  
  return filteredItems;
}

/**
 * Intersection Observer for lazy loading
 */
export function useLazyLoad(
  threshold = 0.1,
  rootMargin = '50px'
) {
  const [isIntersecting, setIsIntersecting] = React.useState(false);
  const ref = useRef<HTMLElement>(null);
  
  useEffect(() => {
    const element = ref.current;
    if (!element) return;
    
    const observer = new IntersectionObserver(
      ([entry]) => {
        setIsIntersecting(entry.isIntersecting);
      },
      { threshold, rootMargin }
    );
    
    observer.observe(element);
    
    return () => {
      observer.unobserve(element);
    };
  }, [threshold, rootMargin]);
  
  return { ref, isVisible: isIntersecting };
}

/**
 * Request Animation Frame hook for smooth animations
 */
export function useAnimationFrame(callback: (deltaTime: number) => void) {
  const requestRef = useRef<number>();
  const previousTimeRef = useRef<number>();
  
  const animate = useCallback((time: number) => {
    if (previousTimeRef.current !== undefined) {
      const deltaTime = time - previousTimeRef.current;
      callback(deltaTime);
    }
    previousTimeRef.current = time;
    requestRef.current = requestAnimationFrame(animate);
  }, [callback]);
  
  useEffect(() => {
    requestRef.current = requestAnimationFrame(animate);
    return () => {
      if (requestRef.current) {
        cancelAnimationFrame(requestRef.current);
      }
    };
  }, [animate]);
}

/**
 * Memory-efficient data pagination
 */
export function usePagination<T>(
  data: T[],
  pageSize = 50
) {
  const [currentPage, setCurrentPage] = React.useState(0);
  
  const paginatedData = useMemo(() => {
    const start = currentPage * pageSize;
    const end = start + pageSize;
    return data.slice(start, end);
  }, [data, currentPage, pageSize]);
  
  const totalPages = Math.ceil(data.length / pageSize);
  
  const goToPage = useCallback((page: number) => {
    setCurrentPage(Math.max(0, Math.min(page, totalPages - 1)));
  }, [totalPages]);
  
  const nextPage = useCallback(() => {
    goToPage(currentPage + 1);
  }, [currentPage, goToPage]);
  
  const previousPage = useCallback(() => {
    goToPage(currentPage - 1);
  }, [currentPage, goToPage]);
  
  return {
    currentPage,
    totalPages,
    paginatedData,
    goToPage,
    nextPage,
    previousPage,
    hasNextPage: currentPage < totalPages - 1,
    hasPreviousPage: currentPage > 0,
  };
}

/**
 * Web Worker for heavy computations
 */
export function useWebWorker<T, R>(
  workerScript: string,
  inputData: T,
  onResult: (result: R) => void
) {
  useEffect(() => {
    const worker = new Worker(workerScript);
    
    worker.onmessage = (event) => {
      onResult(event.data);
    };
    
    worker.onerror = (error) => {
      console.error('Worker error:', error);
    };
    
    worker.postMessage(inputData);
    
    return () => {
      worker.terminate();
    };
  }, [workerScript, inputData, onResult]);
}

/**
 * Batch updates for reducing re-renders
 */
export function useBatchedUpdates<T>(
  updateInterval = 100
) {
  const [updates, setUpdates] = React.useState<T[]>([]);
  const pendingUpdates = useRef<T[]>([]);
  const timeoutRef = useRef<NodeJS.Timeout>();
  
  const addUpdate = useCallback((update: T) => {
    pendingUpdates.current.push(update);
    
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }
    
    timeoutRef.current = setTimeout(() => {
      setUpdates([...pendingUpdates.current]);
      pendingUpdates.current = [];
    }, updateInterval);
  }, [updateInterval]);
  
  useEffect(() => {
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, []);
  
  return { updates, addUpdate };
}

/**
 * Performance monitoring
 */
export function usePerformanceMonitor(componentName: string) {
  useEffect(() => {
    const startTime = performance.now();
    
    return () => {
      const endTime = performance.now();
      const duration = endTime - startTime;
      
      if (duration > 16.67) { // Slower than 60fps
        console.warn(`${componentName} render took ${duration.toFixed(2)}ms`);
      }
    };
  }, [componentName]);
}

/**
 * Resource cleanup utility
 */
export function useCleanup(cleanupFn: () => void) {
  const cleanupRef = useRef(cleanupFn);
  cleanupRef.current = cleanupFn;
  
  useEffect(() => {
    return () => {
      cleanupRef.current();
    };
  }, []);
}