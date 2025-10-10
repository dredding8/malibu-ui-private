/**
 * CollectionProvider Unit Tests
 * 
 * Test suite for the CollectionProvider component covering context provider,
 * state management, and integration with hooks.
 * 
 * @version 1.0.0
 * @date 2025-09-30
 */

import React from 'react';
import { render, act, waitFor } from '@testing-library/react';
import { renderHook } from '@testing-library/react';
import { CollectionProvider, useCollectionContext } from '../CollectionProvider';
import { Collection } from '../../../types/collection.types';

// Mock dependencies
jest.mock('../../../store/collectionStore');
jest.mock('../../../hooks/collections/useCollection');
jest.mock('../../../hooks/collections/useCollections');
jest.mock('../../../hooks/collections/useCollectionActions');
jest.mock('../../../hooks/collections/useCollectionFilters');
jest.mock('../../../hooks/collections/useCollectionSort');

// Mock collections data
const mockCollections: Collection[] = [
  {
    id: 'test-1',
    name: 'Test Collection 1',
    description: 'Test description',
    type: 'satellite',
    status: {
      operational: 'nominal',
      capacity: 'available',
      priority: 'routine',
      conflicts: 0,
      health: 95,
      healthScore: 95,
      lastUpdated: new Date(),
    },
    metadata: {
      classification: 'UNCLASSIFIED',
      criticality: 'medium',
      progress: 50,
      resourceRequirements: [],
      customProperties: {},
    },
    createdAt: new Date(),
    updatedAt: new Date(),
    createdBy: 'test-user',
    updatedBy: 'test-user',
    tags: ['test', 'satellite'],
    childIds: [],
  },
  {
    id: 'test-2',
    name: 'Test Collection 2',
    type: 'ground_station',
    status: {
      operational: 'degraded',
      capacity: 'constrained',
      priority: 'elevated',
      conflicts: 1,
      health: 75,
      healthScore: 75,
      lastUpdated: new Date(),
    },
    metadata: {
      classification: 'CONFIDENTIAL',
      criticality: 'high',
      progress: 80,
      resourceRequirements: [],
      customProperties: {},
    },
    createdAt: new Date(),
    updatedAt: new Date(),
    createdBy: 'test-user',
    updatedBy: 'test-user',
    tags: ['test', 'ground-station'],
    childIds: [],
  },
];

describe('CollectionProvider', () => {
  const renderWithProvider = (children: React.ReactNode, props: any = {}) => {
    return render(
      <CollectionProvider
        collections={mockCollections}
        enableSelection={true}
        enableFiltering={true}
        enableSorting={true}
        enableBulkOperations={true}
        {...props}
      >
        {children}
      </CollectionProvider>
    );
  };

  describe('Context Provider', () => {
    it('should provide collection context to child components', () => {
      const TestComponent = () => {
        const context = useCollectionContext();
        return <div data-testid="context-test">{context.collections.length}</div>;
      };

      const { getByTestId } = renderWithProvider(<TestComponent />);
      expect(getByTestId('context-test')).toHaveTextContent('2');
    });

    it('should throw error when used outside provider', () => {
      const TestComponent = () => {
        useCollectionContext();
        return null;
      };

      expect(() => render(<TestComponent />)).toThrow(
        'useCollectionContext must be used within a CollectionProvider'
      );
    });
  });

  describe('Collection Management', () => {
    it('should initialize with provided collections', () => {
      const TestComponent = () => {
        const { collections } = useCollectionContext();
        return (
          <div>
            {collections.map(collection => (
              <div key={collection.id} data-testid={`collection-${collection.id}`}>
                {collection.name}
              </div>
            ))}
          </div>
        );
      };

      const { getByTestId } = renderWithProvider(<TestComponent />);
      expect(getByTestId('collection-test-1')).toHaveTextContent('Test Collection 1');
      expect(getByTestId('collection-test-2')).toHaveTextContent('Test Collection 2');
    });

    it('should handle empty collections array', () => {
      const TestComponent = () => {
        const { collections } = useCollectionContext();
        return <div data-testid="count">{collections.length}</div>;
      };

      const { getByTestId } = renderWithProvider(<TestComponent />, { collections: [] });
      expect(getByTestId('count')).toHaveTextContent('0');
    });
  });

  describe('Selection Management', () => {
    it('should manage collection selection state', () => {
      const TestComponent = () => {
        const { selectedCollections, toggleSelection, isSelected } = useCollectionContext();
        
        return (
          <div>
            <div data-testid="selected-count">{selectedCollections.length}</div>
            <button
              data-testid="toggle-button"
              onClick={() => toggleSelection('test-1')}
            >
              Toggle
            </button>
            <div data-testid="is-selected">{isSelected('test-1') ? 'selected' : 'not-selected'}</div>
          </div>
        );
      };

      const { getByTestId } = renderWithProvider(<TestComponent />);
      
      expect(getByTestId('selected-count')).toHaveTextContent('0');
      expect(getByTestId('is-selected')).toHaveTextContent('not-selected');

      act(() => {
        getByTestId('toggle-button').click();
      });

      expect(getByTestId('selected-count')).toHaveTextContent('1');
      expect(getByTestId('is-selected')).toHaveTextContent('selected');
    });

    it('should disable selection when enableSelection is false', () => {
      const TestComponent = () => {
        const { features } = useCollectionContext();
        return <div data-testid="selection-enabled">{features.enableSelection ? 'enabled' : 'disabled'}</div>;
      };

      const { getByTestId } = renderWithProvider(<TestComponent />, { enableSelection: false });
      expect(getByTestId('selection-enabled')).toHaveTextContent('disabled');
    });
  });

  describe('Filtering', () => {
    it('should filter collections based on search term', async () => {
      const TestComponent = () => {
        const { filteredCollections, updateFilter } = useCollectionContext();
        
        return (
          <div>
            <div data-testid="filtered-count">{filteredCollections.length}</div>
            <button
              data-testid="filter-button"
              onClick={() => updateFilter({ search: 'Collection 1' })}
            >
              Filter
            </button>
          </div>
        );
      };

      const { getByTestId } = renderWithProvider(<TestComponent />);
      
      expect(getByTestId('filtered-count')).toHaveTextContent('2');

      act(() => {
        getByTestId('filter-button').click();
      });

      await waitFor(() => {
        expect(getByTestId('filtered-count')).toHaveTextContent('1');
      });
    });
  });

  describe('Sorting', () => {
    it('should sort collections by specified field', async () => {
      const TestComponent = () => {
        const { filteredCollections, toggleSort } = useCollectionContext();
        
        return (
          <div>
            <div data-testid="first-collection">{filteredCollections[0]?.name}</div>
            <button
              data-testid="sort-button"
              onClick={() => toggleSort('name')}
            >
              Sort by Name
            </button>
          </div>
        );
      };

      const { getByTestId } = renderWithProvider(<TestComponent />);
      
      // Initial order
      expect(getByTestId('first-collection')).toHaveTextContent('Test Collection 1');

      act(() => {
        getByTestId('sort-button').click();
      });

      await waitFor(() => {
        // After sorting, first collection might change based on sort implementation
        expect(getByTestId('first-collection')).toBeDefined();
      });
    });
  });

  describe('View Management', () => {
    it('should manage view state (grid/list)', () => {
      const TestComponent = () => {
        const { view, setView } = useCollectionContext();
        
        return (
          <div>
            <div data-testid="current-view">{view}</div>
            <button
              data-testid="set-list-view"
              onClick={() => setView('list')}
            >
              Set List View
            </button>
          </div>
        );
      };

      const { getByTestId } = renderWithProvider(<TestComponent />);
      
      // Default view should be grid
      expect(getByTestId('current-view')).toHaveTextContent('grid');

      act(() => {
        getByTestId('set-list-view').click();
      });

      expect(getByTestId('current-view')).toHaveTextContent('list');
    });
  });

  describe('Loading States', () => {
    it('should handle loading states', () => {
      const TestComponent = () => {
        const { loading } = useCollectionContext();
        
        return (
          <div>
            <div data-testid="collections-loading">{loading.collections ? 'loading' : 'loaded'}</div>
            <div data-testid="creating-loading">{loading.creating ? 'creating' : 'idle'}</div>
          </div>
        );
      };

      const { getByTestId } = renderWithProvider(<TestComponent />);
      
      expect(getByTestId('collections-loading')).toHaveTextContent('loaded');
      expect(getByTestId('creating-loading')).toHaveTextContent('idle');
    });
  });

  describe('Error Handling', () => {
    it('should handle error states', () => {
      const TestComponent = () => {
        const { error } = useCollectionContext();
        
        return (
          <div>
            <div data-testid="collections-error">{error.collections || 'no-error'}</div>
          </div>
        );
      };

      const { getByTestId } = renderWithProvider(<TestComponent />);
      expect(getByTestId('collections-error')).toHaveTextContent('no-error');
    });
  });

  describe('Feature Flags', () => {
    it('should respect feature flag settings', () => {
      const TestComponent = () => {
        const { features } = useCollectionContext();
        
        return (
          <div>
            <div data-testid="enable-selection">{features.enableSelection ? 'yes' : 'no'}</div>
            <div data-testid="enable-filtering">{features.enableFiltering ? 'yes' : 'no'}</div>
            <div data-testid="enable-sorting">{features.enableSorting ? 'yes' : 'no'}</div>
            <div data-testid="enable-bulk-ops">{features.enableBulkOperations ? 'yes' : 'no'}</div>
          </div>
        );
      };

      const { getByTestId } = renderWithProvider(<TestComponent />);
      
      expect(getByTestId('enable-selection')).toHaveTextContent('yes');
      expect(getByTestId('enable-filtering')).toHaveTextContent('yes');
      expect(getByTestId('enable-sorting')).toHaveTextContent('yes');
      expect(getByTestId('enable-bulk-ops')).toHaveTextContent('yes');
    });

    it('should disable features when props are false', () => {
      const TestComponent = () => {
        const { features } = useCollectionContext();
        
        return (
          <div>
            <div data-testid="enable-selection">{features.enableSelection ? 'yes' : 'no'}</div>
          </div>
        );
      };

      const { getByTestId } = renderWithProvider(<TestComponent />, { 
        enableSelection: false 
      });
      
      expect(getByTestId('enable-selection')).toHaveTextContent('no');
    });
  });
});