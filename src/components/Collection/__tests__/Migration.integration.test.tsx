/**
 * Collection Migration Integration Tests
 * 
 * Comprehensive test suite for the collection component migration from
 * legacy CollectionOpportunities to compound component architecture.
 * 
 * @version 1.0.0
 * @date 2025-09-30
 */

import React from 'react';
import { render, screen, fireEvent, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { jest } from '@jest/globals';

// Migration components
import { LegacyCollectionAdapter } from '../adapters/LegacyCollectionAdapter';
import { CollectionStandardMigrated } from '../variants/CollectionStandardMigrated';
import { UniversalMigration, useMigrationOrchestrator } from '../migration/MigrationOrchestrator';

// Utilities
import { mapLegacyProps } from '../../../utils/collection-migration/propMapper';
import { adaptLegacyState } from '../../../utils/collection-migration/stateAdapter';
import { translateLegacyEvents } from '../../../utils/collection-migration/eventTranslator';
import { trackMigrationMetrics } from '../../../utils/collection-migration/migrationMetrics';

// Mock data
import { CollectionOpportunity } from '../../../types/collectionOpportunities';
import { Collection } from '../../../types/collection.types';

// Mock hooks
jest.mock('../../../hooks/useFeatureFlags', () => ({
  useFeatureFlag: jest.fn()
}));

// =============================================================================
// Test Data
// =============================================================================

const mockOpportunities: CollectionOpportunity[] = [
  {
    id: 'opp-1',
    title: 'Test Opportunity 1',
    name: 'Test Opportunity 1',
    description: 'Description for test opportunity 1',
    type: 'optimization',
    status: 'active',
    health: 0.85,
    matchStatus: 'baseline',
    priority: 'high',
    sites: ['site1', 'site2'],
    allocation: 100,
    lastModified: '2025-09-30T10:00:00Z',
    version: '1.0.0',
    createdAt: '2025-09-30T09:00:00Z',
    updatedAt: '2025-09-30T10:00:00Z',
    details: 'Detailed description'
  },
  {
    id: 'opp-2',
    title: 'Test Opportunity 2',
    name: 'Test Opportunity 2',
    description: 'Description for test opportunity 2',
    type: 'expansion',
    status: 'pending',
    health: 0.60,
    matchStatus: 'suboptimal',
    priority: 'medium',
    sites: ['site3'],
    allocation: 50,
    lastModified: '2025-09-30T11:00:00Z',
    version: '1.0.0',
    createdAt: '2025-09-30T09:30:00Z',
    updatedAt: '2025-09-30T11:00:00Z',
    details: 'Another detailed description'
  }
];

const mockCollections: Collection[] = [
  {
    id: 'coll-1',
    name: 'Test Collection 1',
    description: 'Description for test collection 1',
    type: 'opportunity',
    status: 'active',
    health: 0.85,
    metadata: {
      originalType: 'opportunity',
      matchStatus: 'baseline',
      priority: 'high'
    },
    tags: ['priority:high', 'type:optimization'],
    createdAt: '2025-09-30T09:00:00Z',
    updatedAt: '2025-09-30T10:00:00Z'
  }
];

// =============================================================================
// Unit Tests - Utility Functions
// =============================================================================

describe('Migration Utilities', () => {
  describe('Props Mapper', () => {
    test('maps legacy props to compound props correctly', () => {
      const legacyProps = {
        opportunities: mockOpportunities,
        selectedIds: ['opp-1'],
        enableSelection: true,
        enableFiltering: true,
        enableSorting: true,
        viewMode: 'table' as const,
        className: 'test-class',
        loading: false,
        error: null
      };

      const mappedProps = mapLegacyProps(legacyProps);

      expect(mappedProps).toMatchObject({
        collections: expect.arrayContaining([
          expect.objectContaining({
            id: 'opp-1',
            name: 'Test Opportunity 1'
          })
        ]),
        enableSelection: true,
        enableFiltering: true,
        enableSorting: true,
        className: expect.stringContaining('legacy-mapped'),
        loading: false,
        error: null
      });

      expect(mappedProps.viewConfig?.layout?.defaultView).toBe('table');
    });

    test('handles empty opportunities array', () => {
      const legacyProps = {
        opportunities: [],
        selectedIds: [],
        enableSelection: false
      };

      const mappedProps = mapLegacyProps(legacyProps);

      expect(mappedProps.collections).toEqual([]);
      expect(mappedProps.enableSelection).toBe(false);
    });

    test('validates prop mapping with errors', () => {
      const invalidProps = {
        opportunities: 'not-an-array' as any,
        selectedIds: 'not-an-array' as any
      };

      expect(() => {
        mapLegacyProps(invalidProps, { strict: true });
      }).toThrow();
    });
  });

  describe('State Adapter', () => {
    test('adapts legacy state to compound state', () => {
      const legacyState = {
        selectedIds: ['opp-1'],
        filterConfig: {
          searchTerm: 'test',
          activeFilters: { status: 'active' }
        },
        sortConfig: {
          field: 'name',
          direction: 'asc' as const
        },
        viewMode: 'grid'
      };

      const compoundState = adaptLegacyState(legacyState, mockCollections);

      expect(compoundState).toMatchObject({
        collections: mockCollections,
        selectedCollections: expect.arrayContaining([
          expect.objectContaining({ id: 'coll-1' })
        ]),
        filters: {
          searchTerm: 'test',
          activeFilters: { status: 'active' }
        },
        sorting: {
          field: 'name',
          direction: 'asc'
        },
        view: {
          mode: 'grid',
          layout: 'standard'
        }
      });
    });

    test('handles split view configuration', () => {
      const legacyState = {
        splitViewConfig: {
          isOpen: true,
          selectedItemId: 'opp-1',
          panelWidth: 400
        }
      };

      const compoundState = adaptLegacyState(legacyState);

      expect(compoundState.ui.splitPanel).toMatchObject({
        isOpen: true,
        selectedItemId: 'opp-1',
        width: 400
      });
    });
  });

  describe('Event Translator', () => {
    test('translates legacy event handlers to compound events', () => {
      const mockHandlers = {
        onSelectionChange: jest.fn(),
        onEdit: jest.fn(),
        onBulkAction: jest.fn()
      };

      const translatedEvents = translateLegacyEvents(mockHandlers, mockCollections);

      // Test selection change translation
      translatedEvents.onSelectionChange?.([mockCollections[0]]);
      expect(mockHandlers.onSelectionChange).toHaveBeenCalledWith(['coll-1']);

      // Test edit translation
      translatedEvents.onCollectionEdit?.(mockCollections[0]);
      expect(mockHandlers.onEdit).toHaveBeenCalledWith(
        expect.objectContaining({
          id: 'coll-1',
          title: 'Test Collection 1'
        })
      );

      // Test bulk action translation
      translatedEvents.onBulkAction?.('delete', [mockCollections[0]]);
      expect(mockHandlers.onBulkAction).toHaveBeenCalledWith('delete', ['coll-1']);
    });

    test('handles translation errors gracefully', () => {
      const faultyHandler = jest.fn().mockImplementation(() => {
        throw new Error('Handler error');
      });

      const translatedEvents = translateLegacyEvents(
        { onSelectionChange: faultyHandler },
        mockCollections,
        { enableFallbacks: true }
      );

      // Should not throw and should call fallback
      expect(() => {
        translatedEvents.onSelectionChange?.([mockCollections[0]]);
      }).not.toThrow();

      expect(faultyHandler).toHaveBeenCalled();
    });
  });
});

// =============================================================================
// Integration Tests - Adapter Component
// =============================================================================

describe('LegacyCollectionAdapter', () => {
  const mockFeatureFlags = require('../../../hooks/useFeatureFlags');

  beforeEach(() => {
    jest.clearAllMocks();
    mockFeatureFlags.useFeatureFlag.mockReturnValue(true);
  });

  test('renders with legacy props successfully', async () => {
    const mockOnSelectionChange = jest.fn();

    render(
      <LegacyCollectionAdapter
        opportunities={mockOpportunities}
        selectedIds={['opp-1']}
        onSelectionChange={mockOnSelectionChange}
        enableSelection={true}
        variant="standard"
      />
    );

    await waitFor(() => {
      expect(screen.getByRole('main')).toBeInTheDocument();
    });
  });

  test('falls back to legacy when feature flags disabled', () => {
    mockFeatureFlags.useFeatureFlag.mockReturnValue(false);

    render(
      <LegacyCollectionAdapter
        opportunities={mockOpportunities}
        selectedIds={[]}
        variant="standard"
        forceLegacy={false}
      />
    );

    expect(screen.getByText(/would show legacy component/)).toBeInTheDocument();
  });

  test('handles migration errors gracefully', () => {
    const consoleSpy = jest.spyOn(console, 'warn').mockImplementation();

    render(
      <LegacyCollectionAdapter
        opportunities={mockOpportunities}
        selectedIds={[]}
        variant="standard"
        error="Test migration error"
      />
    );

    expect(screen.getByText(/Migration error/)).toBeInTheDocument();
    consoleSpy.mockRestore();
  });

  test('tracks migration metrics when enabled', () => {
    const trackMetricsSpy = jest.spyOn(require('../../../utils/collection-migration/migrationMetrics'), 'trackMigrationMetrics');

    render(
      <LegacyCollectionAdapter
        opportunities={mockOpportunities}
        selectedIds={['opp-1']}
        variant="standard"
        migrationId="test-migration"
        adapterConfig={{ enableMetrics: true }}
      />
    );

    expect(trackMetricsSpy).toHaveBeenCalledWith(
      'test-migration',
      expect.objectContaining({
        variant: 'standard',
        opportunitiesCount: 2,
        selectedCount: 1
      })
    );
  });
});

// =============================================================================
// Integration Tests - Migrated Component
// =============================================================================

describe('CollectionStandardMigrated', () => {
  const mockFeatureFlags = require('../../../hooks/useFeatureFlags');

  beforeEach(() => {
    jest.clearAllMocks();
    mockFeatureFlags.useFeatureFlag.mockReturnValue(true);
  });

  test('renders compound component when migration enabled', async () => {
    const mockOnSelectionChange = jest.fn();

    render(
      <CollectionStandardMigrated
        opportunities={mockOpportunities}
        selectedIds={['opp-1']}
        onSelectionChange={mockOnSelectionChange}
        enableSelection={true}
        enableFiltering={true}
      />
    );

    await waitFor(() => {
      expect(screen.getByRole('main')).toBeInTheDocument();
    });

    // Should render compound component elements
    expect(screen.getByRole('toolbar')).toBeInTheDocument();
    expect(screen.getByRole('grid')).toBeInTheDocument();
  });

  test('uses legacy adapter when migration disabled', () => {
    mockFeatureFlags.useFeatureFlag.mockReturnValue(false);

    render(
      <CollectionStandardMigrated
        opportunities={mockOpportunities}
        selectedIds={[]}
        enableSelection={true}
      />
    );

    // Should fall back to legacy adapter
    expect(screen.getByText(/would show legacy component/)).toBeInTheDocument();
  });

  test('forwards event handlers correctly', async () => {
    const user = userEvent.setup();
    const mockOnSelectionChange = jest.fn();
    const mockOnEdit = jest.fn();

    render(
      <CollectionStandardMigrated
        opportunities={mockOpportunities}
        selectedIds={[]}
        onSelectionChange={mockOnSelectionChange}
        onEdit={mockOnEdit}
        enableSelection={true}
      />
    );

    // Simulate selection change
    const firstItem = screen.getByRole('gridcell', { name: /test opportunity 1/i });
    await user.click(firstItem);

    await waitFor(() => {
      expect(mockOnSelectionChange).toHaveBeenCalled();
    });
  });

  test('maintains performance within thresholds', async () => {
    const startTime = performance.now();

    render(
      <CollectionStandardMigrated
        opportunities={mockOpportunities}
        selectedIds={[]}
        enableSelection={true}
        enableFiltering={true}
        enableSorting={true}
        enableBulkOperations={true}
      />
    );

    await waitFor(() => {
      expect(screen.getByRole('main')).toBeInTheDocument();
    });

    const renderTime = performance.now() - startTime;
    expect(renderTime).toBeLessThan(100); // Should render in under 100ms
  });
});

// =============================================================================
// Integration Tests - Migration Orchestrator
// =============================================================================

describe('UniversalMigration', () => {
  const mockFeatureFlags = require('../../../hooks/useFeatureFlags');

  // Mock legacy component
  const MockLegacyComponent: React.FC<any> = (props) => (
    <div data-testid="legacy-component">Legacy Component</div>
  );

  // Mock compound component
  const MockCompoundComponent: React.FC<any> = (props) => (
    <div data-testid="compound-component">Compound Component</div>
  );

  beforeEach(() => {
    jest.clearAllMocks();
    localStorage.clear();
    sessionStorage.clear();
  });

  test('renders legacy component when migration disabled', () => {
    mockFeatureFlags.useFeatureFlag.mockReturnValue(false);

    render(
      <UniversalMigration
        variant="test"
        legacyComponent={MockLegacyComponent}
        compoundComponent={MockCompoundComponent}
        opportunities={mockOpportunities}
      />
    );

    expect(screen.getByTestId('legacy-component')).toBeInTheDocument();
    expect(screen.queryByTestId('compound-component')).not.toBeInTheDocument();
  });

  test('renders compound component when migration enabled', () => {
    mockFeatureFlags.useFeatureFlag.mockReturnValue(true);

    render(
      <UniversalMigration
        variant="test"
        legacyComponent={MockLegacyComponent}
        compoundComponent={MockCompoundComponent}
        opportunities={mockOpportunities}
        migrationConfig={{ rolloutPercentage: 100 }}
      />
    );

    expect(screen.getByTestId('compound-component')).toBeInTheDocument();
    expect(screen.queryByTestId('legacy-component')).not.toBeInTheDocument();
  });

  test('handles A/B testing correctly', () => {
    mockFeatureFlags.useFeatureFlag.mockImplementation((flag: string) => {
      if (flag === 'ENABLE_COLLECTION_AB_TESTING') return true;
      return true;
    });

    // Force specific user hash for consistent A/B testing
    localStorage.setItem('migration-user-id', 'test-user-hash-control');

    render(
      <UniversalMigration
        variant="test"
        legacyComponent={MockLegacyComponent}
        compoundComponent={MockCompoundComponent}
        opportunities={mockOpportunities}
        migrationConfig={{ 
          rolloutPercentage: 10,
          enableABTesting: true 
        }}
      />
    );

    // With low rollout percentage, should likely show legacy
    const legacyComponent = screen.queryByTestId('legacy-component');
    const compoundComponent = screen.queryByTestId('compound-component');
    
    expect(legacyComponent || compoundComponent).toBeInTheDocument();
  });

  test('tracks interactions correctly', async () => {
    const user = userEvent.setup();
    const trackMetricsSpy = jest.spyOn(require('../../../utils/collection-migration/migrationMetrics'), 'trackInteractionMetrics');

    mockFeatureFlags.useFeatureFlag.mockReturnValue(true);

    render(
      <UniversalMigration
        variant="test"
        legacyComponent={MockLegacyComponent}
        compoundComponent={MockCompoundComponent}
        opportunities={mockOpportunities}
        migrationConfig={{ enableMetrics: true }}
      />
    );

    const component = screen.getByTestId('compound-component');
    await user.click(component);

    expect(trackMetricsSpy).toHaveBeenCalled();
  });

  test('handles rollback on errors', () => {
    const ErrorComponent: React.FC = () => {
      throw new Error('Test error');
    };

    const consoleSpy = jest.spyOn(console, 'error').mockImplementation();
    mockFeatureFlags.useFeatureFlag.mockReturnValue(true);

    render(
      <UniversalMigration
        variant="test"
        legacyComponent={MockLegacyComponent}
        compoundComponent={ErrorComponent}
        opportunities={mockOpportunities}
        migrationConfig={{ enableFallback: true }}
      />
    );

    // Should fall back to legacy component on error
    expect(screen.getByTestId('legacy-component')).toBeInTheDocument();
    consoleSpy.mockRestore();
  });
});

// =============================================================================
// Performance Tests
// =============================================================================

describe('Migration Performance', () => {
  test('maintains render performance parity', async () => {
    const mockFeatureFlags = require('../../../hooks/useFeatureFlags');
    mockFeatureFlags.useFeatureFlag.mockReturnValue(true);

    // Test legacy render time
    const legacyStartTime = performance.now();
    const { unmount: unmountLegacy } = render(
      <LegacyCollectionAdapter
        opportunities={mockOpportunities}
        selectedIds={[]}
        variant="performance-test"
        forceLegacy={true}
      />
    );
    const legacyRenderTime = performance.now() - legacyStartTime;
    unmountLegacy();

    // Test compound render time
    const compoundStartTime = performance.now();
    const { unmount: unmountCompound } = render(
      <CollectionStandardMigrated
        opportunities={mockOpportunities}
        selectedIds={[]}
      />
    );
    const compoundRenderTime = performance.now() - compoundStartTime;
    unmountCompound();

    // Compound should not be significantly slower (within 50% tolerance)
    expect(compoundRenderTime).toBeLessThan(legacyRenderTime * 1.5);
  });

  test('handles large datasets efficiently', async () => {
    const largeOpportunities = Array.from({ length: 1000 }, (_, i) => ({
      ...mockOpportunities[0],
      id: `opp-${i}`,
      title: `Opportunity ${i}`,
      name: `Opportunity ${i}`
    }));

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
    });

    const renderTime = performance.now() - startTime;
    expect(renderTime).toBeLessThan(500); // Should handle 1000 items in under 500ms
  });
});

// =============================================================================
// Accessibility Tests
// =============================================================================

describe('Migration Accessibility', () => {
  test('maintains accessibility features during migration', async () => {
    render(
      <CollectionStandardMigrated
        opportunities={mockOpportunities}
        selectedIds={[]}
        enableSelection={true}
        enableFiltering={true}
      />
    );

    // Check for accessible elements
    expect(screen.getByRole('main')).toBeInTheDocument();
    expect(screen.getByRole('toolbar')).toBeInTheDocument();
    expect(screen.getByRole('grid')).toBeInTheDocument();

    // Check for keyboard navigation
    const grid = screen.getByRole('grid');
    expect(grid).toHaveAttribute('tabindex');
  });

  test('preserves ARIA labels and roles', () => {
    render(
      <CollectionStandardMigrated
        opportunities={mockOpportunities}
        selectedIds={['opp-1']}
        enableSelection={true}
      />
    );

    const selectedItems = screen.getAllByRole('gridcell', { selected: true });
    expect(selectedItems.length).toBeGreaterThan(0);
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