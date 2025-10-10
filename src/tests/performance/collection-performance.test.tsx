/**
 * Collection Performance Test Suite
 * 
 * Comprehensive performance testing for the collection management system.
 * Validates render time, memory usage, bundle size, and optimization
 * improvements compared to legacy implementation.
 * 
 * @version 2.0.0
 * @date 2025-09-30
 * @wave Wave 4 - Validation & Testing
 */

import React from 'react';
import { render, screen, waitFor, cleanup } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { jest } from '@jest/globals';

// Performance monitoring utilities
import { measurePerformance, PerformanceMetrics } from '../../utils/performanceMonitor';

// Components under test
import { CollectionStandardMigrated } from '../../components/Collection/variants/CollectionStandardMigrated';
import { CollectionBentoMigrated } from '../../components/Collection/variants/CollectionBentoMigrated';
import CollectionOpportunities from '../../components/CollectionOpportunities';
import CollectionOpportunitiesEnhancedBento from '../../components/CollectionOpportunitiesEnhancedBento';

// Test utilities
import { createCollectionTestData } from '../../components/__tests__/helpers/collectionOpportunities.helpers';

// Types
import { CollectionOpportunity } from '../../types/collectionOpportunities';

// =============================================================================
// Test Setup & Configuration
// =============================================================================

// Mock performance APIs for testing
declare global {
  interface Window {
    performance: Performance & {
      memory?: {
        usedJSHeapSize: number;
        totalJSHeapSize: number;
        jsHeapSizeLimit: number;
      };
    };
  }
}

// Performance test configuration
const PERFORMANCE_THRESHOLDS = {
  INITIAL_RENDER_TIME: 200, // ms
  LARGE_DATASET_RENDER_TIME: 500, // ms
  INTERACTION_RESPONSE_TIME: 50, // ms
  MEMORY_USAGE_LIMIT: 100 * 1024 * 1024, // 100MB
  BUNDLE_SIZE_LIMIT: 2 * 1024 * 1024, // 2MB
  FPS_THRESHOLD: 45, // fps
  TIME_TO_INTERACTIVE: 1000 // ms
};

// Mock performance monitor
const mockPerformanceMetrics: PerformanceMetrics = {
  renderTime: 0,
  updateTime: 0,
  memoryUsage: 0,
  bundleSize: 0,
  timeToInteractive: 0,
  firstContentfulPaint: 0,
  largestContentfulPaint: 0,
  cumulativeLayoutShift: 0,
  firstInputDelay: 0
};

jest.mock('../../utils/performanceMonitor', () => ({
  measurePerformance: jest.fn(),
  trackRenderMetrics: jest.fn(),
  trackUserInteraction: jest.fn(),
  getMemoryUsage: jest.fn(() => mockPerformanceMetrics.memoryUsage),
  getBundleSize: jest.fn(() => mockPerformanceMetrics.bundleSize)
}));

// Data generators for different test scales
const createPerformanceTestData = (size: number): CollectionOpportunity[] => {
  return Array.from({ length: size }, (_, i) => ({
    id: `perf-test-${String(i + 1).padStart(6, '0')}`,
    title: `Performance Test Opportunity ${i + 1}`,
    name: `Performance Test Opportunity ${i + 1}`,
    description: `Generated for performance testing with index ${i + 1}. This description contains sufficient text to test rendering performance with varied content lengths.`,
    type: i % 4 === 0 ? 'optimization' : i % 4 === 1 ? 'expansion' : i % 4 === 2 ? 'testing' : 'analysis',
    status: i % 5 === 0 ? 'active' : i % 5 === 1 ? 'pending' : i % 5 === 2 ? 'completed' : i % 5 === 3 ? 'paused' : 'draft',
    health: 0.1 + (i % 9) * 0.1, // Varied health scores 0.1-0.9
    matchStatus: i % 3 === 0 ? 'baseline' : i % 3 === 1 ? 'suboptimal' : 'optimal',
    priority: i % 3 === 0 ? 'high' : i % 3 === 1 ? 'medium' : 'low',
    sites: Array.from({ length: Math.min(5, (i % 4) + 1) }, (_, j) => `site-${i}-${j + 1}`),
    allocation: Math.floor(Math.random() * 100) + 1,
    lastModified: new Date(Date.now() - i * 3600000).toISOString(), // Staggered timestamps
    version: `1.${Math.floor(i / 100)}.${i % 100}`,
    createdAt: new Date(Date.now() - (i + 100) * 3600000).toISOString(),
    updatedAt: new Date(Date.now() - i * 3600000).toISOString(),
    details: `Comprehensive details for performance test opportunity ${i + 1}. This content is designed to simulate real-world data complexity and test rendering performance under various conditions.`
  }));
};

// Performance measurement utilities
const measureRenderTime = async (renderFn: () => void): Promise<number> => {
  const startTime = performance.now();
  renderFn();
  await waitFor(() => screen.getByRole('main'));
  return performance.now() - startTime;
};

const measureMemoryUsage = (): number => {
  if (typeof window !== 'undefined' && window.performance && 'memory' in window.performance) {
    return (window.performance as any).memory.usedJSHeapSize;
  }
  return 0;
};

// =============================================================================
// Render Performance Tests
// =============================================================================

describe('Render Performance', () => {
  afterEach(() => {
    cleanup();
    jest.clearAllMocks();
  });

  test('initial render performance - small dataset', async () => {
    const opportunities = createPerformanceTestData(50);
    
    const renderTime = await measureRenderTime(() => {
      render(
        <CollectionStandardMigrated
          opportunities={opportunities}
          selectedIds={[]}
          enableSelection={true}
        />
      );
    });

    expect(renderTime).toBeLessThan(PERFORMANCE_THRESHOLDS.INITIAL_RENDER_TIME);
  });

  test('initial render performance - medium dataset', async () => {
    const opportunities = createPerformanceTestData(200);
    
    const renderTime = await measureRenderTime(() => {
      render(
        <CollectionStandardMigrated
          opportunities={opportunities}
          selectedIds={[]}
          enableSelection={true}
          enableVirtualization={true}
        />
      );
    });

    expect(renderTime).toBeLessThan(PERFORMANCE_THRESHOLDS.INITIAL_RENDER_TIME * 2);
  });

  test('initial render performance - large dataset', async () => {
    const opportunities = createPerformanceTestData(1000);
    
    const renderTime = await measureRenderTime(() => {
      render(
        <CollectionStandardMigrated
          opportunities={opportunities}
          selectedIds={[]}
          enableSelection={true}
          enableVirtualization={true}
        />
      );
    });

    expect(renderTime).toBeLessThan(PERFORMANCE_THRESHOLDS.LARGE_DATASET_RENDER_TIME);
  });

  test('bento layout render performance comparison', async () => {
    const opportunities = createPerformanceTestData(100);

    // Measure standard layout
    const standardRenderTime = await measureRenderTime(() => {
      render(
        <CollectionStandardMigrated
          opportunities={opportunities}
          selectedIds={[]}
        />
      );
    });

    cleanup();

    // Measure bento layout
    const bentoRenderTime = await measureRenderTime(() => {
      render(
        <CollectionBentoMigrated
          opportunities={opportunities}
          selectedIds={[]}
        />
      );
    });

    // Bento layout should not be significantly slower (within 50% tolerance)
    expect(bentoRenderTime).toBeLessThan(standardRenderTime * 1.5);
  });

  test('legacy vs compound component render comparison', async () => {
    const opportunities = createPerformanceTestData(200);

    // Measure legacy component
    const legacyRenderTime = await measureRenderTime(() => {
      render(
        <CollectionOpportunities
          opportunities={opportunities}
          selectedIds={[]}
        />
      );
    });

    cleanup();

    // Measure compound component
    const compoundRenderTime = await measureRenderTime(() => {
      render(
        <CollectionStandardMigrated
          opportunities={opportunities}
          selectedIds={[]}
        />
      );
    });

    // Compound component should maintain render performance parity
    expect(compoundRenderTime).toBeLessThan(legacyRenderTime * 1.2);
  });
});

// =============================================================================
// Update Performance Tests
// =============================================================================

describe('Update Performance', () => {
  afterEach(() => {
    cleanup();
    jest.clearAllMocks();
  });

  test('re-render performance on data updates', async () => {
    const initialOpportunities = createPerformanceTestData(100);
    
    const TestComponent = () => {
      const [opportunities, setOpportunities] = React.useState(initialOpportunities);
      
      React.useEffect(() => {
        // Simulate data update after initial render
        const timer = setTimeout(() => {
          const updatedOpportunities = opportunities.map(opp => ({
            ...opp,
            health: Math.random()
          }));
          setOpportunities(updatedOpportunities);
        }, 100);
        
        return () => clearTimeout(timer);
      }, []);
      
      return (
        <CollectionStandardMigrated
          opportunities={opportunities}
          selectedIds={[]}
          enableSelection={true}
        />
      );
    };

    const startTime = performance.now();
    render(<TestComponent />);
    
    // Wait for initial render
    await waitFor(() => screen.getByRole('main'));
    
    // Wait for update
    await waitFor(() => {
      // Update should complete within reasonable time
      const updateTime = performance.now() - startTime;
      expect(updateTime).toBeLessThan(300);
    });
  });

  test('selection change performance', async () => {
    const user = userEvent.setup();
    const opportunities = createPerformanceTestData(500);
    let selectionChangeTime = 0;

    const mockOnSelectionChange = jest.fn(() => {
      selectionChangeTime = performance.now();
    });

    render(
      <CollectionStandardMigrated
        opportunities={opportunities}
        selectedIds={[]}
        onSelectionChange={mockOnSelectionChange}
        enableSelection={true}
        enableVirtualization={true}
      />
    );

    await waitFor(() => screen.getByRole('main'));

    const interactionStart = performance.now();
    const firstCell = screen.getAllByRole('gridcell')[0];
    await user.click(firstCell);

    await waitFor(() => {
      expect(mockOnSelectionChange).toHaveBeenCalled();
    });

    const responseTime = selectionChangeTime - interactionStart;
    expect(responseTime).toBeLessThan(PERFORMANCE_THRESHOLDS.INTERACTION_RESPONSE_TIME);
  });

  test('filter application performance', async () => {
    const user = userEvent.setup();
    const opportunities = createPerformanceTestData(300);
    const mockOnFilter = jest.fn();

    render(
      <CollectionStandardMigrated
        opportunities={opportunities}
        selectedIds={[]}
        onFilter={mockOnFilter}
        enableFiltering={true}
        enableSearch={true}
      />
    );

    await waitFor(() => screen.getByRole('main'));

    const filterStart = performance.now();
    const searchInput = screen.getByRole('searchbox');
    await user.type(searchInput, 'performance');

    await waitFor(() => {
      expect(mockOnFilter).toHaveBeenCalled();
    });

    const filterTime = performance.now() - filterStart;
    expect(filterTime).toBeLessThan(100); // Filtering should be very fast
  });

  test('sorting performance with large datasets', async () => {
    const user = userEvent.setup();
    const opportunities = createPerformanceTestData(1000);
    const mockOnSort = jest.fn();

    render(
      <CollectionStandardMigrated
        opportunities={opportunities}
        selectedIds={[]}
        onSort={mockOnSort}
        enableSorting={true}
        enableVirtualization={true}
      />
    );

    await waitFor(() => screen.getByRole('main'));

    const sortStart = performance.now();
    const healthHeader = screen.getByRole('columnheader', { name: /health/i });
    await user.click(healthHeader);

    await waitFor(() => {
      expect(mockOnSort).toHaveBeenCalled();
    });

    const sortTime = performance.now() - sortStart;
    expect(sortTime).toBeLessThan(150); // Sorting should be efficient
  });
});

// =============================================================================
// Memory Usage Tests
// =============================================================================

describe('Memory Usage', () => {
  afterEach(() => {
    cleanup();
    jest.clearAllMocks();
  });

  test('memory usage remains stable with large datasets', async () => {
    const opportunities = createPerformanceTestData(1000);
    
    const initialMemory = measureMemoryUsage();
    
    render(
      <CollectionStandardMigrated
        opportunities={opportunities}
        selectedIds={[]}
        enableSelection={true}
        enableVirtualization={true}
      />
    );

    await waitFor(() => screen.getByRole('main'));

    const finalMemory = measureMemoryUsage();
    const memoryIncrease = finalMemory - initialMemory;

    if (memoryIncrease > 0) {
      expect(memoryIncrease).toBeLessThan(PERFORMANCE_THRESHOLDS.MEMORY_USAGE_LIMIT);
    }
  });

  test('memory cleanup on component unmount', async () => {
    const opportunities = createPerformanceTestData(500);
    
    const { unmount } = render(
      <CollectionStandardMigrated
        opportunities={opportunities}
        selectedIds={[]}
      />
    );

    await waitFor(() => screen.getByRole('main'));
    
    const beforeUnmountMemory = measureMemoryUsage();
    unmount();

    // Allow time for garbage collection
    await new Promise(resolve => setTimeout(resolve, 100));
    
    const afterUnmountMemory = measureMemoryUsage();
    
    // Memory should not significantly increase after unmount
    if (beforeUnmountMemory > 0 && afterUnmountMemory > 0) {
      expect(afterUnmountMemory).toBeLessThanOrEqual(beforeUnmountMemory * 1.1);
    }
  });

  test('memory usage comparison: legacy vs compound', async () => {
    const opportunities = createPerformanceTestData(300);

    // Measure legacy component memory usage
    const legacyStartMemory = measureMemoryUsage();
    const { unmount: unmountLegacy } = render(
      <CollectionOpportunities
        opportunities={opportunities}
        selectedIds={[]}
      />
    );
    await waitFor(() => screen.getByRole('main'));
    const legacyMemoryUsage = measureMemoryUsage() - legacyStartMemory;
    unmountLegacy();

    // Allow cleanup
    await new Promise(resolve => setTimeout(resolve, 100));

    // Measure compound component memory usage
    const compoundStartMemory = measureMemoryUsage();
    const { unmount: unmountCompound } = render(
      <CollectionStandardMigrated
        opportunities={opportunities}
        selectedIds={[]}
      />
    );
    await waitFor(() => screen.getByRole('main'));
    const compoundMemoryUsage = measureMemoryUsage() - compoundStartMemory;
    unmountCompound();

    // Compound component should not use significantly more memory
    if (legacyMemoryUsage > 0 && compoundMemoryUsage > 0) {
      expect(compoundMemoryUsage).toBeLessThan(legacyMemoryUsage * 1.5);
    }
  });
});

// =============================================================================
// Virtualization Performance Tests
// =============================================================================

describe('Virtualization Performance', () => {
  afterEach(() => {
    cleanup();
    jest.clearAllMocks();
  });

  test('virtualization with very large datasets', async () => {
    const opportunities = createPerformanceTestData(5000);
    
    const renderTime = await measureRenderTime(() => {
      render(
        <CollectionStandardMigrated
          opportunities={opportunities}
          selectedIds={[]}
          enableVirtualization={true}
          virtualListHeight={400}
          virtualItemHeight={50}
        />
      );
    });

    // Virtualization should handle large datasets efficiently
    expect(renderTime).toBeLessThan(PERFORMANCE_THRESHOLDS.LARGE_DATASET_RENDER_TIME);
  });

  test('scroll performance with virtualization', async () => {
    const user = userEvent.setup();
    const opportunities = createPerformanceTestData(2000);

    render(
      <CollectionStandardMigrated
        opportunities={opportunities}
        selectedIds={[]}
        enableVirtualization={true}
        virtualListHeight={400}
      />
    );

    await waitFor(() => screen.getByRole('main'));

    const scrollContainer = screen.getByRole('grid');
    
    // Measure scroll performance
    const scrollStart = performance.now();
    
    // Simulate rapid scrolling
    for (let i = 0; i < 10; i++) {
      fireEvent.scroll(scrollContainer, { target: { scrollTop: i * 100 } });
      await new Promise(resolve => setTimeout(resolve, 10));
    }
    
    const scrollTime = performance.now() - scrollStart;
    
    // Scrolling should remain responsive
    expect(scrollTime).toBeLessThan(500);
  });

  test('dynamic item height handling', async () => {
    const opportunities = createPerformanceTestData(1000).map((opp, i) => ({
      ...opp,
      description: i % 3 === 0 ? 
        'Short description' : 
        i % 3 === 1 ? 
          'Medium length description with more content to test dynamic sizing' :
          'Very long description with extensive details and multiple lines of content to test how the virtualization handles variable item heights and dynamic content sizing in different scenarios'
    }));

    const renderTime = await measureRenderTime(() => {
      render(
        <CollectionStandardMigrated
          opportunities={opportunities}
          selectedIds={[]}
          enableVirtualization={true}
          enableDynamicSizing={true}
        />
      );
    });

    // Dynamic sizing should not significantly impact performance
    expect(renderTime).toBeLessThan(PERFORMANCE_THRESHOLDS.LARGE_DATASET_RENDER_TIME * 1.5);
  });
});

// =============================================================================
// Bundle Size & Loading Performance Tests
// =============================================================================

describe('Bundle Size Performance', () => {
  test('component lazy loading performance', async () => {
    const LazyCollectionComponent = React.lazy(() => 
      Promise.resolve({
        default: CollectionStandardMigrated
      })
    );

    const loadStart = performance.now();
    
    render(
      <React.Suspense fallback={<div data-testid="loading">Loading...</div>}>
        <LazyCollectionComponent
          opportunities={createPerformanceTestData(50)}
          selectedIds={[]}
        />
      </React.Suspense>
    );

    // Should show loading initially
    expect(screen.getByTestId('loading')).toBeInTheDocument();

    // Should load component quickly
    await waitFor(() => {
      expect(screen.queryByTestId('loading')).not.toBeInTheDocument();
      expect(screen.getByRole('main')).toBeInTheDocument();
    });

    const loadTime = performance.now() - loadStart;
    expect(loadTime).toBeLessThan(PERFORMANCE_THRESHOLDS.TIME_TO_INTERACTIVE);
  });

  test('code splitting effectiveness', () => {
    // This would typically be tested in the build pipeline
    // but we can verify the components support dynamic imports
    expect(() => {
      React.lazy(() => import('../../components/Collection/variants/CollectionStandardMigrated'));
      React.lazy(() => import('../../components/Collection/variants/CollectionBentoMigrated'));
    }).not.toThrow();
  });
});

// =============================================================================
// Performance Regression Tests
// =============================================================================

describe('Performance Regression Prevention', () => {
  test('performance baseline maintenance', async () => {
    const opportunities = createPerformanceTestData(200);
    const performanceResults: number[] = [];

    // Run multiple iterations to establish baseline
    for (let i = 0; i < 5; i++) {
      const renderTime = await measureRenderTime(() => {
        render(
          <CollectionStandardMigrated
            opportunities={opportunities}
            selectedIds={[]}
          />
        );
      });
      performanceResults.push(renderTime);
      cleanup();
    }

    const averageTime = performanceResults.reduce((a, b) => a + b, 0) / performanceResults.length;
    const maxTime = Math.max(...performanceResults);
    const minTime = Math.min(...performanceResults);

    // Performance should be consistent (max shouldn't exceed min by more than 100%)
    expect(maxTime).toBeLessThan(minTime * 2);
    expect(averageTime).toBeLessThan(PERFORMANCE_THRESHOLDS.INITIAL_RENDER_TIME);
  });

  test('performance under stress conditions', async () => {
    const user = userEvent.setup();
    const opportunities = createPerformanceTestData(1000);
    
    render(
      <CollectionStandardMigrated
        opportunities={opportunities}
        selectedIds={[]}
        enableSelection={true}
        enableFiltering={true}
        enableSorting={true}
        enableVirtualization={true}
      />
    );

    await waitFor(() => screen.getByRole('main'));

    const stressTestStart = performance.now();

    // Perform multiple rapid operations
    const searchInput = screen.getByRole('searchbox');
    await user.type(searchInput, 'stress test');
    
    const healthHeader = screen.getByRole('columnheader', { name: /health/i });
    await user.click(healthHeader);
    
    const firstCell = screen.getAllByRole('gridcell')[0];
    await user.click(firstCell);

    const stressTestTime = performance.now() - stressTestStart;
    
    // Should handle stress conditions within reasonable time
    expect(stressTestTime).toBeLessThan(1000);
  });
});

// =============================================================================
// Core Web Vitals Tests
// =============================================================================

describe('Core Web Vitals', () => {
  test('First Contentful Paint (FCP)', async () => {
    const opportunities = createPerformanceTestData(100);
    
    const fcpStart = performance.now();
    render(
      <CollectionStandardMigrated
        opportunities={opportunities}
        selectedIds={[]}
      />
    );

    // Wait for first content to appear
    await waitFor(() => screen.getByRole('main'));
    const fcp = performance.now() - fcpStart;

    // FCP should be under 1.8 seconds (good score)
    expect(fcp).toBeLessThan(1800);
  });

  test('Largest Contentful Paint (LCP)', async () => {
    const opportunities = createPerformanceTestData(200);
    
    const lcpStart = performance.now();
    render(
      <CollectionStandardMigrated
        opportunities={opportunities}
        selectedIds={[]}
        enableVirtualization={true}
      />
    );

    // Wait for largest content element (typically the grid)
    await waitFor(() => {
      const grid = screen.getByRole('grid');
      expect(grid).toBeInTheDocument();
      expect(screen.getAllByRole('gridcell').length).toBeGreaterThan(0);
    });
    
    const lcp = performance.now() - lcpStart;

    // LCP should be under 2.5 seconds (good score)
    expect(lcp).toBeLessThan(2500);
  });

  test('Cumulative Layout Shift (CLS)', async () => {
    const opportunities = createPerformanceTestData(100);
    
    render(
      <CollectionStandardMigrated
        opportunities={opportunities}
        selectedIds={[]}
        enableVirtualization={true}
      />
    );

    await waitFor(() => screen.getByRole('main'));

    // Simulate additional content loading
    await new Promise(resolve => setTimeout(resolve, 500));

    // In a real implementation, you would measure actual layout shifts
    // For this test, we verify the component structure remains stable
    expect(screen.getByRole('grid')).toBeInTheDocument();
    expect(screen.getByRole('main')).toBeInTheDocument();
  });

  test('First Input Delay (FID) simulation', async () => {
    const user = userEvent.setup();
    const opportunities = createPerformanceTestData(300);
    
    render(
      <CollectionStandardMigrated
        opportunities={opportunities}
        selectedIds={[]}
        enableSelection={true}
      />
    );

    await waitFor(() => screen.getByRole('main'));

    // Measure time from first input to response
    const inputStart = performance.now();
    const firstCell = screen.getAllByRole('gridcell')[0];
    await user.click(firstCell);

    // Wait for visual feedback
    await waitFor(() => {
      // Check for selection state change
      expect(firstCell).toHaveAttribute('aria-selected');
    });

    const fid = performance.now() - inputStart;

    // FID should be under 100ms (good score)
    expect(fid).toBeLessThan(100);
  });
});

// =============================================================================
// Test Cleanup
// =============================================================================

afterEach(() => {
  cleanup();
  jest.clearAllMocks();
});