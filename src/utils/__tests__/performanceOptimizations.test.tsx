import React from 'react';
import { renderHook, act, waitFor } from '@testing-library/react';
import {
  useVirtualScroll,
  useOptimizedData,
  useDebouncedFilter,
  useLazyLoad,
  useAnimationFrame,
  usePagination,
  useWebWorker,
  useBatchedUpdates,
  usePerformanceMonitor,
  useCleanup
} from '../performanceOptimizations';

// Mock lodash debounce
jest.mock('lodash', () => ({
  debounce: jest.fn((fn, delay) => {
    const debounced = jest.fn((...args) => fn(...args));
    debounced.cancel = jest.fn();
    return debounced;
  }),
  throttle: jest.fn((fn) => fn)
}));

describe('Performance Optimization Utilities', () => {
  describe('useVirtualScroll', () => {
    it('should calculate visible items correctly', () => {
      const items = Array.from({ length: 100 }, (_, i) => i);
      const { result } = renderHook(() => 
        useVirtualScroll(items, 500, 50, 2)
      );

      expect(result.current.visibleItems.length).toBeLessThan(items.length);
      expect(result.current.totalHeight).toBe(5000); // 100 items * 50px
      expect(result.current.offsetY).toBe(0);
    });

    it('should handle scroll events', () => {
      const items = Array.from({ length: 100 }, (_, i) => i);
      const { result } = renderHook(() => 
        useVirtualScroll(items, 500, 50)
      );

      const mockEvent = {
        currentTarget: { scrollTop: 1000 }
      } as React.UIEvent<HTMLElement>;

      act(() => {
        result.current.handleScroll(mockEvent);
      });

      // Should show items around scroll position
      expect(result.current.offsetY).toBeGreaterThan(0);
    });
  });

  describe('useOptimizedData', () => {
    it('should memoize data transformations', () => {
      const data = [1, 2, 3, 4, 5];
      const transform = jest.fn(x => x * 2);

      const { result, rerender } = renderHook(
        ({ data }) => useOptimizedData(data, transform),
        { initialProps: { data } }
      );

      expect(result.current).toEqual([2, 4, 6, 8, 10]);
      expect(transform).toHaveBeenCalledTimes(5);

      // Re-render with same data
      rerender({ data });
      expect(transform).toHaveBeenCalledTimes(5); // Not called again
    });
  });

  describe('useDebouncedFilter', () => {
    beforeEach(() => {
      jest.clearAllTimers();
      jest.useFakeTimers();
    });

    afterEach(() => {
      jest.runOnlyPendingTimers();
      jest.useRealTimers();
    });

    it('should filter items with debounce', async () => {
      const items = [
        { id: 1, name: 'Apple' },
        { id: 2, name: 'Banana' },
        { id: 3, name: 'Cherry' }
      ];

      const filterFn = (item: any, query: string) => 
        item.name.toLowerCase().includes(query.toLowerCase());

      const { result, rerender } = renderHook(
        ({ query }) => useDebouncedFilter(items, filterFn, query, 300),
        { initialProps: { query: '' } }
      );

      // Initially all items
      expect(result.current).toEqual(items);

      // Update query
      rerender({ query: 'a' });

      // Filter should be applied after delay
      act(() => {
        jest.advanceTimersByTime(300);
      });

      await waitFor(() => {
        expect(result.current).toEqual([
          { id: 1, name: 'Apple' },
          { id: 2, name: 'Banana' }
        ]);
      });
    });

    it('should return all items when query is empty', async () => {
      const items = [{ id: 1 }, { id: 2 }];
      const filterFn = jest.fn();

      const { result, rerender } = renderHook(
        ({ query }) => useDebouncedFilter(items, filterFn, query),
        { initialProps: { query: 'test' } }
      );

      rerender({ query: '' });

      act(() => {
        jest.runAllTimers();
      });

      await waitFor(() => {
        expect(result.current).toEqual(items);
        expect(filterFn).not.toHaveBeenCalled();
      });
    });
  });

  describe('useLazyLoad', () => {
    it('should track intersection observer state', () => {
      const mockObserve = jest.fn();
      const mockUnobserve = jest.fn();
      
      global.IntersectionObserver = jest.fn().mockImplementation((callback) => ({
        observe: mockObserve,
        unobserve: mockUnobserve,
        disconnect: jest.fn()
      }));

      const { result } = renderHook(() => useLazyLoad());

      // Create a div element and assign it to the ref
      const div = document.createElement('div');
      Object.defineProperty(result.current.ref, 'current', {
        writable: true,
        value: div
      });

      // Re-render to trigger effect
      const { rerender } = renderHook(() => useLazyLoad());
      rerender();

      expect(mockObserve).toHaveBeenCalledWith(div);
      expect(result.current.isVisible).toBe(false);
    });
  });

  describe('useAnimationFrame', () => {
    beforeEach(() => {
      jest.clearAllTimers();
      jest.useFakeTimers();
    });

    afterEach(() => {
      jest.useRealTimers();
    });

    it('should call callback on animation frames', () => {
      const callback = jest.fn();
      let rafCallback: FrameRequestCallback;

      global.requestAnimationFrame = jest.fn((cb) => {
        rafCallback = cb;
        return 1;
      });
      global.cancelAnimationFrame = jest.fn();

      renderHook(() => useAnimationFrame(callback));

      // Simulate animation frame
      act(() => {
        rafCallback!(1000);
        rafCallback!(1016.67); // ~60fps
      });

      expect(callback).toHaveBeenCalledWith(16.67);
    });
  });

  describe('usePagination', () => {
    it('should paginate data correctly', () => {
      const data = Array.from({ length: 100 }, (_, i) => i);
      const { result } = renderHook(() => usePagination(data, 10));

      expect(result.current.paginatedData).toEqual([0, 1, 2, 3, 4, 5, 6, 7, 8, 9]);
      expect(result.current.currentPage).toBe(0);
      expect(result.current.totalPages).toBe(10);
      expect(result.current.hasNextPage).toBe(true);
      expect(result.current.hasPreviousPage).toBe(false);
    });

    it('should navigate pages correctly', () => {
      const data = Array.from({ length: 30 }, (_, i) => i);
      const { result } = renderHook(() => usePagination(data, 10));

      act(() => {
        result.current.nextPage();
      });

      expect(result.current.currentPage).toBe(1);
      expect(result.current.paginatedData).toEqual([10, 11, 12, 13, 14, 15, 16, 17, 18, 19]);

      act(() => {
        result.current.goToPage(2);
      });

      expect(result.current.currentPage).toBe(2);
      expect(result.current.hasNextPage).toBe(false);

      act(() => {
        result.current.previousPage();
      });

      expect(result.current.currentPage).toBe(1);
    });
  });

  describe('useWebWorker', () => {
    it('should create and terminate worker', () => {
      const mockWorker = {
        postMessage: jest.fn(),
        terminate: jest.fn(),
        onmessage: null as any,
        onerror: null as any
      };

      global.Worker = jest.fn().mockImplementation(() => mockWorker) as any;

      const onResult = jest.fn();
      const { unmount } = renderHook(() => 
        useWebWorker('worker.js', { data: 'test' }, onResult)
      );

      expect(mockWorker.postMessage).toHaveBeenCalledWith({ data: 'test' });

      // Simulate worker response
      act(() => {
        mockWorker.onmessage({ data: 'result' });
      });

      expect(onResult).toHaveBeenCalledWith('result');

      unmount();
      expect(mockWorker.terminate).toHaveBeenCalled();
    });
  });

  describe('useBatchedUpdates', () => {
    beforeEach(() => {
      jest.useFakeTimers();
    });

    afterEach(() => {
      jest.useRealTimers();
    });

    it('should batch updates', () => {
      const { result } = renderHook(() => useBatchedUpdates<string>(100));

      expect(result.current.updates).toEqual([]);

      act(() => {
        result.current.addUpdate('update1');
        result.current.addUpdate('update2');
        result.current.addUpdate('update3');
      });

      // Updates not applied yet
      expect(result.current.updates).toEqual([]);

      act(() => {
        jest.advanceTimersByTime(100);
      });

      expect(result.current.updates).toEqual(['update1', 'update2', 'update3']);
    });
  });

  describe('usePerformanceMonitor', () => {
    it('should warn on slow renders', () => {
      const warnSpy = jest.spyOn(console, 'warn').mockImplementation();
      
      let mockNow = 0;
      jest.spyOn(performance, 'now').mockImplementation(() => mockNow);

      const { unmount } = renderHook(() => 
        usePerformanceMonitor('TestComponent')
      );

      mockNow = 20; // Simulate 20ms render
      unmount();

      expect(warnSpy).toHaveBeenCalledWith('TestComponent render took 20.00ms');

      warnSpy.mockRestore();
    });

    it('should not warn on fast renders', () => {
      const warnSpy = jest.spyOn(console, 'warn').mockImplementation();
      
      let mockNow = 0;
      jest.spyOn(performance, 'now').mockImplementation(() => mockNow);

      const { unmount } = renderHook(() => 
        usePerformanceMonitor('FastComponent')
      );

      mockNow = 10; // Simulate 10ms render (fast)
      unmount();

      expect(warnSpy).not.toHaveBeenCalled();

      warnSpy.mockRestore();
    });
  });

  describe('useCleanup', () => {
    it('should call cleanup function on unmount', () => {
      const cleanupFn = jest.fn();

      const { unmount } = renderHook(() => useCleanup(cleanupFn));

      expect(cleanupFn).not.toHaveBeenCalled();

      unmount();

      expect(cleanupFn).toHaveBeenCalledTimes(1);
    });

    it('should use latest cleanup function', () => {
      const cleanup1 = jest.fn();
      const cleanup2 = jest.fn();

      const { rerender, unmount } = renderHook(
        ({ cleanup }) => useCleanup(cleanup),
        { initialProps: { cleanup: cleanup1 } }
      );

      rerender({ cleanup: cleanup2 });

      unmount();

      expect(cleanup1).not.toHaveBeenCalled();
      expect(cleanup2).toHaveBeenCalledTimes(1);
    });
  });
});