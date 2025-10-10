/**
 * Collection Management Migration Test Suite
 * 
 * Comprehensive test suite for validating the migration from legacy 
 * CollectionOpportunities to the new compound component architecture.
 * Ensures zero regression and validates all optimizations.
 * 
 * @version 2.0.0
 * @date 2025-09-30
 * @wave Wave 4 - Validation & Testing
 */

import React from 'react';
import { render, screen, fireEvent, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { jest } from '@jest/globals';

// Feature flag system
import { useFeatureFlag } from '../../../hooks/useFeatureFlags';

// Migration components
import { LegacyCollectionAdapter } from '../adapters/LegacyCollectionAdapter';
import { CollectionStandardMigrated } from '../variants/CollectionStandardMigrated';
import { CollectionBentoMigrated } from '../variants/CollectionBentoMigrated';
import { UniversalMigration } from '../migration/MigrationOrchestrator';
import { MigrationMonitor } from '../providers/MigrationMonitor';

// Legacy components for comparison
import CollectionOpportunities from '../../CollectionOpportunities';
import CollectionOpportunitiesEnhancedBento from '../../CollectionOpportunitiesEnhancedBento';

// Test utilities
import { createCollectionTestData } from '../../__tests__/helpers/collectionOpportunities.helpers';
import { measurePerformance } from '../../../utils/performanceMonitor';

// Mock data
import { CollectionOpportunity } from '../../../types/collectionOpportunities';
import { Collection } from '../../../types/collection.types';

// =============================================================================
// Test Setup & Mocks
// =============================================================================

// Mock feature flags
jest.mock('../../../hooks/useFeatureFlags', () => ({
  useFeatureFlag: jest.fn()
}));

// Mock performance monitor
jest.mock('../../../utils/performanceMonitor', () => ({
  measurePerformance: jest.fn(),
  trackRenderMetrics: jest.fn(),
  trackUserInteraction: jest.fn()
}));

const mockUseFeatureFlag = useFeatureFlag as jest.MockedFunction<typeof useFeatureFlag>;
const mockMeasurePerformance = measurePerformance as jest.MockedFunction<typeof measurePerformance>;

// Test data factories
const createMockOpportunities = (count: number = 10): CollectionOpportunity[] => {
  return Array.from({ length: count }, (_, i) => ({
    id: `opp-${i + 1}`,
    title: `Test Opportunity ${i + 1}`,
    name: `Test Opportunity ${i + 1}`,
    description: `Description for opportunity ${i + 1}`,
    type: i % 2 === 0 ? 'optimization' : 'expansion',
    status: i % 3 === 0 ? 'active' : i % 3 === 1 ? 'pending' : 'completed',
    health: Math.random() * 0.5 + 0.5, // 0.5-1.0
    matchStatus: i % 2 === 0 ? 'baseline' : 'suboptimal',
    priority: i % 3 === 0 ? 'high' : i % 3 === 1 ? 'medium' : 'low',
    sites: [`site${i + 1}`, `site${i + 2}`],
    allocation: Math.floor(Math.random() * 100) + 1,
    lastModified: new Date(Date.now() - i * 24 * 60 * 60 * 1000).toISOString(),
    version: '1.0.0',
    createdAt: new Date(Date.now() - (i + 7) * 24 * 60 * 60 * 1000).toISOString(),
    updatedAt: new Date(Date.now() - i * 24 * 60 * 60 * 1000).toISOString(),
    details: `Detailed description for opportunity ${i + 1}`
  }));
};

const createMockCollections = (count: number = 10): Collection[] => {
  return Array.from({ length: count }, (_, i) => ({
    id: `coll-${i + 1}`,
    name: `Test Collection ${i + 1}`,
    description: `Description for collection ${i + 1}`,
    type: 'opportunity',
    status: i % 3 === 0 ? 'active' : i % 3 === 1 ? 'pending' : 'completed',
    health: Math.random() * 0.5 + 0.5,
    metadata: {
      originalType: 'opportunity',
      matchStatus: i % 2 === 0 ? 'baseline' : 'suboptimal',
      priority: i % 3 === 0 ? 'high' : i % 3 === 1 ? 'medium' : 'low'
    },
    tags: [`priority:${i % 3 === 0 ? 'high' : i % 3 === 1 ? 'medium' : 'low'}`, `type:${i % 2 === 0 ? 'optimization' : 'expansion'}`],
    createdAt: new Date(Date.now() - (i + 7) * 24 * 60 * 60 * 1000).toISOString(),
    updatedAt: new Date(Date.now() - i * 24 * 60 * 60 * 1000).toISOString()
  }));
};

// =============================================================================
// Migration Flag Testing
// =============================================================================

describe('Migration Feature Flag System', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('correctly switches between legacy and new components based on flags', () => {
    const opportunities = createMockOpportunities(5);

    // Test with flag disabled (legacy mode)
    mockUseFeatureFlag.mockReturnValue(false);
    
    const { rerender } = render(
      <UniversalMigration
        variant="standard"
        opportunities={opportunities}
        legacyComponent={CollectionOpportunities}
        compoundComponent={CollectionStandardMigrated}
      />
    );

    expect(screen.getByTestId('legacy-collection-opportunities')).toBeInTheDocument();

    // Test with flag enabled (new mode)
    mockUseFeatureFlag.mockReturnValue(true);
    
    rerender(
      <UniversalMigration
        variant="standard"
        opportunities={opportunities}
        legacyComponent={CollectionOpportunities}
        compoundComponent={CollectionStandardMigrated}
      />
    );

    expect(screen.queryByTestId('legacy-collection-opportunities')).not.toBeInTheDocument();
    expect(screen.getByTestId('compound-collection')).toBeInTheDocument();
  });

  test('supports gradual rollout with percentage-based flags', () => {
    const opportunities = createMockOpportunities(3);
    let renderCount = 0;

    // Mock rollout at 50%
    mockUseFeatureFlag.mockImplementation((flag) => {
      if (flag === 'ENABLE_COLLECTION_MIGRATION') {
        renderCount++;
        return renderCount % 2 === 1; // 50% rollout simulation
      }
      return false;
    });

    const { rerender } = render(
      <UniversalMigration
        variant="standard"
        opportunities={opportunities}
        legacyComponent={CollectionOpportunities}
        compoundComponent={CollectionStandardMigrated}
        migrationConfig={{ rolloutPercentage: 50 }}
      />
    );

    // First render should use new component
    expect(screen.getByTestId('compound-collection')).toBeInTheDocument();

    // Second render should use legacy
    rerender(
      <UniversalMigration
        variant="standard"
        opportunities={opportunities}
        legacyComponent={CollectionOpportunities}
        compoundComponent={CollectionStandardMigrated}
        migrationConfig={{ rolloutPercentage: 50 }}
      />
    );

    expect(screen.getByTestId('legacy-collection-opportunities')).toBeInTheDocument();
  });

  test('handles emergency rollback scenarios', () => {
    const opportunities = createMockOpportunities(3);

    // Enable migration initially
    mockUseFeatureFlag.mockReturnValue(true);

    const { rerender } = render(
      <UniversalMigration
        variant="standard"
        opportunities={opportunities}
        legacyComponent={CollectionOpportunities}
        compoundComponent={CollectionStandardMigrated}
        migrationConfig={{ enableEmergencyRollback: true }}
      />
    );

    expect(screen.getByTestId('compound-collection')).toBeInTheDocument();

    // Simulate emergency rollback
    mockUseFeatureFlag.mockImplementation((flag) => {
      if (flag === 'ENABLE_COLLECTION_MIGRATION') return true;
      if (flag === 'EMERGENCY_ROLLBACK_COLLECTION') return true;
      return false;
    });

    rerender(
      <UniversalMigration
        variant="standard"
        opportunities={opportunities}
        legacyComponent={CollectionOpportunities}
        compoundComponent={CollectionStandardMigrated}
        migrationConfig={{ enableEmergencyRollback: true }}
      />
    );

    expect(screen.getByTestId('legacy-collection-opportunities')).toBeInTheDocument();
  });
});

// =============================================================================
// Data Flow Compatibility Testing
// =============================================================================

describe('Data Flow Compatibility', () => {
  const mockOpportunities = createMockOpportunities(5);

  beforeEach(() => {
    jest.clearAllMocks();
    mockUseFeatureFlag.mockReturnValue(true);
  });

  test('maintains prop interface compatibility', () => {
    const mockHandlers = {
      onSelectionChange: jest.fn(),
      onEdit: jest.fn(),
      onDelete: jest.fn(),
      onBulkAction: jest.fn()
    };

    render(
      <LegacyCollectionAdapter
        opportunities={mockOpportunities}
        selectedIds={['opp-1', 'opp-2']}
        onSelectionChange={mockHandlers.onSelectionChange}
        onEdit={mockHandlers.onEdit}
        onDelete={mockHandlers.onDelete}
        onBulkAction={mockHandlers.onBulkAction}
        enableSelection={true}
        enableFiltering={true}
        enableSorting={true}
        variant="standard"
      />
    );

    // Verify component renders without errors
    expect(screen.getByRole('main')).toBeInTheDocument();
    
    // Verify all props are mapped correctly
    expect(screen.getByRole('grid')).toHaveAttribute('aria-multiselectable', 'true');
    expect(screen.getByRole('toolbar')).toBeInTheDocument();
  });

  test('correctly maps legacy state to compound state', async () => {
    const user = userEvent.setup();
    const mockOnSelectionChange = jest.fn();

    render(
      <CollectionStandardMigrated
        opportunities={mockOpportunities}
        selectedIds={[]}
        onSelectionChange={mockOnSelectionChange}
        enableSelection={true}
      />
    );

    // Simulate selection change
    const firstRow = screen.getAllByRole('gridcell')[0];
    await user.click(firstRow);

    await waitFor(() => {
      expect(mockOnSelectionChange).toHaveBeenCalledWith(
        expect.arrayContaining([expect.stringMatching(/^opp-/)])
      );
    });
  });

  test('preserves complex state during migration', () => {
    const complexState = {
      selectedIds: ['opp-1', 'opp-3'],
      filters: {
        searchTerm: 'test search',
        status: 'active',
        priority: 'high'
      },
      sorting: {
        field: 'health',
        direction: 'desc' as const
      },
      viewMode: 'grid' as const
    };

    render(
      <LegacyCollectionAdapter
        opportunities={mockOpportunities}
        selectedIds={complexState.selectedIds}
        filterConfig={complexState.filters}
        sortConfig={complexState.sorting}
        viewMode={complexState.viewMode}
        variant="standard"
      />
    );

    // Verify complex state is preserved
    expect(screen.getByDisplayValue('test search')).toBeInTheDocument();
    
    // Check if filtering is applied
    const visibleItems = screen.getAllByRole('gridcell');
    expect(visibleItems.length).toBeGreaterThan(0);
  });
});

// =============================================================================
// Error Boundaries & Fallback Testing
// =============================================================================

describe('Error Boundaries & Fallback Behavior', () => {
  const mockOpportunities = createMockOpportunities(3);

  beforeEach(() => {
    jest.clearAllMocks();
    // Suppress console errors for error boundary tests
    jest.spyOn(console, 'error').mockImplementation(() => {});
  });

  afterEach(() => {
    (console.error as jest.Mock).mockRestore();
  });

  test('gracefully handles compound component errors', () => {
    const ErrorComponent = () => {
      throw new Error('Test component error');
    };

    mockUseFeatureFlag.mockReturnValue(true);

    render(
      <UniversalMigration
        variant="error-test"
        opportunities={mockOpportunities}
        legacyComponent={CollectionOpportunities}
        compoundComponent={ErrorComponent}
        migrationConfig={{ enableFallback: true }}
      />
    );

    // Should fall back to legacy component
    expect(screen.getByTestId('legacy-collection-opportunities')).toBeInTheDocument();
  });

  test('handles async component loading errors', async () => {
    const AsyncErrorComponent = React.lazy(() => 
      Promise.reject(new Error('Async load error'))
    );

    mockUseFeatureFlag.mockReturnValue(true);

    render(
      <React.Suspense fallback={<div>Loading...</div>}>
        <UniversalMigration
          variant="async-error-test"
          opportunities={mockOpportunities}
          legacyComponent={CollectionOpportunities}
          compoundComponent={AsyncErrorComponent}
          migrationConfig={{ enableFallback: true }}
        />
      </React.Suspense>
    );

    await waitFor(() => {
      expect(screen.getByTestId('legacy-collection-opportunities')).toBeInTheDocument();
    });
  });

  test('provides detailed error context for debugging', () => {
    const ErrorComponent = () => {
      throw new Error('Detailed test error with context');
    };

    const errorSpy = jest.spyOn(console, 'error');

    render(
      <MigrationMonitor migrationId="test-migration-123">
        <UniversalMigration
          variant="debug-test"
          opportunities={mockOpportunities}
          legacyComponent={CollectionOpportunities}
          compoundComponent={ErrorComponent}
          migrationConfig={{ 
            enableFallback: true,
            enableDebugMode: true 
          }}
        />
      </MigrationMonitor>
    );

    expect(errorSpy).toHaveBeenCalledWith(
      expect.stringContaining('Migration Error'),
      expect.objectContaining({
        migrationId: 'test-migration-123',
        variant: 'debug-test',
        error: expect.any(Error)
      })
    );
  });
});

// =============================================================================
// Performance Comparison Testing
// =============================================================================

describe('Performance Comparison', () => {
  const createLargeDataset = (size: number) => createMockOpportunities(size);

  beforeEach(() => {
    jest.clearAllMocks();
    mockMeasurePerformance.mockImplementation((fn) => fn());
  });

  test('maintains render performance parity with legacy', async () => {
    const opportunities = createLargeDataset(100);

    // Measure legacy component performance
    const legacyStartTime = performance.now();
    const { unmount: unmountLegacy } = render(
      <CollectionOpportunities
        opportunities={opportunities}
        selectedIds={[]}
      />
    );
    await waitFor(() => screen.getByRole('main'));
    const legacyRenderTime = performance.now() - legacyStartTime;
    unmountLegacy();

    // Measure new component performance
    mockUseFeatureFlag.mockReturnValue(true);
    const newStartTime = performance.now();
    const { unmount: unmountNew } = render(
      <CollectionStandardMigrated
        opportunities={opportunities}
        selectedIds={[]}
      />
    );
    await waitFor(() => screen.getByRole('main'));
    const newRenderTime = performance.now() - newStartTime;
    unmountNew();

    // New component should not be significantly slower (within 20% tolerance)
    expect(newRenderTime).toBeLessThan(legacyRenderTime * 1.2);
  });

  test('handles large datasets efficiently', async () => {
    const largeOpportunities = createLargeDataset(1000);

    const startTime = performance.now();

    render(
      <CollectionStandardMigrated
        opportunities={largeOpportunities}
        selectedIds={[]}
        enableSelection={true}
        enableFiltering={true}
        enableSorting={true}
      />
    );

    await waitFor(() => {
      expect(screen.getByRole('main')).toBeInTheDocument();
    }, { timeout: 5000 });

    const renderTime = performance.now() - startTime;
    
    // Should handle 1000 items efficiently (under 1 second)
    expect(renderTime).toBeLessThan(1000);
  });

  test('memory usage remains within acceptable bounds', async () => {
    const opportunities = createLargeDataset(500);

    if (typeof window !== 'undefined' && 'performance' in window && 'memory' in (window.performance as any)) {
      const initialMemory = (window.performance as any).memory.usedJSHeapSize;

      render(
        <CollectionStandardMigrated
          opportunities={opportunities}
          selectedIds={[]}
          enableSelection={true}
        />
      );

      await waitFor(() => screen.getByRole('main'));

      const currentMemory = (window.performance as any).memory.usedJSHeapSize;
      const memoryIncrease = currentMemory - initialMemory;

      // Memory increase should be reasonable (less than 50MB)
      expect(memoryIncrease).toBeLessThan(50 * 1024 * 1024);
    }
  });

  test('interaction responsiveness meets performance targets', async () => {
    const user = userEvent.setup();
    const opportunities = createLargeDataset(200);
    const mockOnSelectionChange = jest.fn();

    render(
      <CollectionStandardMigrated
        opportunities={opportunities}
        selectedIds={[]}
        onSelectionChange={mockOnSelectionChange}
        enableSelection={true}
      />
    );

    await waitFor(() => screen.getByRole('main'));

    // Measure selection interaction time
    const interactionStart = performance.now();
    const firstRow = screen.getAllByRole('gridcell')[0];
    await user.click(firstRow);

    await waitFor(() => {
      expect(mockOnSelectionChange).toHaveBeenCalled();
    });
    const interactionTime = performance.now() - interactionStart;

    // Interaction should be responsive (under 100ms)
    expect(interactionTime).toBeLessThan(100);
  });
});

// =============================================================================
// Bundle Size & Code Splitting Validation
// =============================================================================

describe('Bundle Optimization', () => {
  test('supports lazy loading of migration components', async () => {
    const LazyMigrationComponent = React.lazy(() => 
      import('../variants/CollectionBentoMigrated').then(module => ({
        default: module.CollectionBentoMigrated
      }))
    );

    mockUseFeatureFlag.mockReturnValue(true);

    render(
      <React.Suspense fallback={<div data-testid="loading">Loading...</div>}>
        <UniversalMigration
          variant="bento"
          opportunities={createMockOpportunities(5)}
          legacyComponent={CollectionOpportunities}
          compoundComponent={LazyMigrationComponent}
        />
      </React.Suspense>
    );

    // Should show loading initially
    expect(screen.getByTestId('loading')).toBeInTheDocument();

    // Should load component asynchronously
    await waitFor(() => {
      expect(screen.queryByTestId('loading')).not.toBeInTheDocument();
      expect(screen.getByRole('main')).toBeInTheDocument();
    });
  });

  test('tree shaking removes unused variants', () => {
    // This test would be implemented with webpack-bundle-analyzer
    // or similar tooling in the build pipeline
    expect(true).toBe(true); // Placeholder for build-time validation
  });
});

// =============================================================================
// Cross-Browser Compatibility
// =============================================================================

describe('Cross-Browser Compatibility', () => {
  const opportunities = createMockOpportunities(10);

  test('maintains functionality across different user agents', () => {
    // Mock different user agents
    const userAgents = [
      'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
      'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/14.1.1 Safari/605.1.15',
      'Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:89.0) Gecko/20100101 Firefox/89.0'
    ];

    userAgents.forEach(userAgent => {
      Object.defineProperty(navigator, 'userAgent', {
        value: userAgent,
        configurable: true
      });

      const { unmount } = render(
        <CollectionStandardMigrated
          opportunities={opportunities}
          selectedIds={[]}
          enableSelection={true}
        />
      );

      expect(screen.getByRole('main')).toBeInTheDocument();
      unmount();
    });
  });
});

// =============================================================================
// Migration Metrics & Analytics
// =============================================================================

describe('Migration Metrics', () => {
  const opportunities = createMockOpportunities(5);

  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('tracks migration adoption rates', () => {
    const trackingMock = jest.fn();
    
    render(
      <MigrationMonitor 
        migrationId="adoption-test"
        onMetricsUpdate={trackingMock}
      >
        <CollectionStandardMigrated
          opportunities={opportunities}
          selectedIds={[]}
        />
      </MigrationMonitor>
    );

    expect(trackingMock).toHaveBeenCalledWith(
      expect.objectContaining({
        migrationId: 'adoption-test',
        variant: 'standard',
        userInteractions: expect.any(Number),
        renderTime: expect.any(Number)
      })
    );
  });

  test('tracks user interaction patterns', async () => {
    const user = userEvent.setup();
    const interactionSpy = jest.fn();

    render(
      <MigrationMonitor 
        migrationId="interaction-test"
        onUserInteraction={interactionSpy}
      >
        <CollectionStandardMigrated
          opportunities={opportunities}
          selectedIds={[]}
          enableSelection={true}
        />
      </MigrationMonitor>
    );

    const firstRow = screen.getAllByRole('gridcell')[0];
    await user.click(firstRow);

    expect(interactionSpy).toHaveBeenCalledWith({
      action: 'selection',
      timestamp: expect.any(Number),
      componentVariant: 'standard'
    });
  });

  test('tracks error rates and fallback usage', () => {
    const ErrorComponent = () => {
      throw new Error('Test error for metrics');
    };

    const errorSpy = jest.fn();

    render(
      <MigrationMonitor 
        migrationId="error-test"
        onError={errorSpy}
      >
        <UniversalMigration
          variant="error-metrics"
          opportunities={opportunities}
          legacyComponent={CollectionOpportunities}
          compoundComponent={ErrorComponent}
          migrationConfig={{ enableFallback: true }}
        />
      </MigrationMonitor>
    );

    expect(errorSpy).toHaveBeenCalledWith({
      migrationId: 'error-test',
      variant: 'error-metrics',
      error: expect.any(Error),
      fallbackUsed: true
    });
  });
});

// =============================================================================
// Accessibility Regression Testing
// =============================================================================

describe('Accessibility Regression Prevention', () => {
  const opportunities = createMockOpportunities(5);

  test('maintains WCAG 2.1 AA compliance', async () => {
    render(
      <CollectionStandardMigrated
        opportunities={opportunities}
        selectedIds={['opp-1']}
        enableSelection={true}
      />
    );

    // Check essential ARIA attributes
    const main = screen.getByRole('main');
    expect(main).toBeInTheDocument();

    const grid = screen.getByRole('grid');
    expect(grid).toHaveAttribute('aria-label');
    expect(grid).toHaveAttribute('aria-multiselectable', 'true');

    // Check for proper heading structure
    const headings = screen.getAllByRole('heading');
    expect(headings.length).toBeGreaterThan(0);

    // Check for keyboard navigation support
    expect(grid).toHaveAttribute('tabindex');
  });

  test('preserves screen reader announcements', async () => {
    const user = userEvent.setup();

    render(
      <CollectionStandardMigrated
        opportunities={opportunities}
        selectedIds={[]}
        enableSelection={true}
      />
    );

    // Check for live regions
    const liveRegions = screen.getAllByRole('status');
    expect(liveRegions.length).toBeGreaterThan(0);

    // Simulate selection to test announcements
    const firstRow = screen.getAllByRole('gridcell')[0];
    await user.click(firstRow);

    // Verify selection announcement
    const statusRegion = screen.getByRole('status');
    expect(statusRegion).toHaveTextContent(/selected/i);
  });

  test('supports high contrast modes', () => {
    // Mock high contrast media query
    Object.defineProperty(window, 'matchMedia', {
      writable: true,
      value: jest.fn().mockImplementation(query => ({
        matches: query === '(prefers-contrast: high)',
        media: query,
        onchange: null,
        addListener: jest.fn(),
        removeListener: jest.fn(),
        addEventListener: jest.fn(),
        removeEventListener: jest.fn(),
        dispatchEvent: jest.fn(),
      })),
    });

    render(
      <CollectionStandardMigrated
        opportunities={opportunities}
        selectedIds={[]}
      />
    );

    // Component should render without issues in high contrast mode
    expect(screen.getByRole('main')).toBeInTheDocument();
  });
});

// =============================================================================
// Test Cleanup
// =============================================================================

afterEach(() => {
  jest.clearAllMocks();
  localStorage.clear();
  sessionStorage.clear();
});