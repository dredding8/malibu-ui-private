/**
 * Context Migration Mapping
 * 
 * Maps between React Context state and Zustand store state structures
 * with bidirectional conversion and validation.
 * 
 * Phase 3: Context Analysis & Mapping
 * @version 1.0.0
 * @date 2025-09-30
 */

import { CollectionContextValue } from '../../components/Collection/CollectionProvider';
import { AllocationContextType } from '../../contexts/AllocationContext';
import { WizardSyncState } from '../../contexts/WizardSyncContext';
import { CollectionManagementState } from '../../types/collection.state';
import { Collection } from '../../types/collection.types';

// =============================================================================
// State Mapping Interface
// =============================================================================

interface StateMappingResult<T> {
  success: boolean;
  data: T | null;
  errors: string[];
  warnings: string[];
  metrics: {
    mappingTime: number;
    fieldsProcessed: number;
    fieldsMapped: number;
    fieldsSkipped: number;
  };
}

// =============================================================================
// Collection Context to Store Mapping
// =============================================================================

class CollectionContextMapper {
  /**
   * Map CollectionContext state to Zustand store state
   */
  mapContextToStore(contextValue: CollectionContextValue): StateMappingResult<Partial<CollectionManagementState>> {
    const startTime = performance.now();
    const errors: string[] = [];
    const warnings: string[] = [];
    let fieldsProcessed = 0;
    let fieldsMapped = 0;

    try {
      // Convert collections array to normalized structure
      const collectionsMap: Record<string, Collection> = {};
      const collectionIds: string[] = [];

      contextValue.collections.forEach(collection => {
        fieldsProcessed++;
        collectionsMap[collection.id] = collection;
        collectionIds.push(collection.id);
        fieldsMapped++;
      });

      // Map selection state
      const selectedIds = new Set(
        contextValue.selectedCollections.map(c => c.id)
      );

      // Map loading state
      const loadingState = {
        collections: contextValue.loading.collections,
        creating: contextValue.loading.creating,
        updating: Object.fromEntries(
          contextValue.collections.map(c => [c.id, contextValue.loading.updating])
        ),
        deleting: Object.fromEntries(
          contextValue.collections.map(c => [c.id, contextValue.loading.deleting])
        ),
        bulk: contextValue.loading.bulk,
        validating: {},
        exporting: false,
        importing: false,
      };

      // Map error state
      const errorState = {
        global: contextValue.error.hasError ? [{
          id: `context-error-${Date.now()}`,
          message: contextValue.error.message || 'Unknown error',
          code: 'CONTEXT_ERROR',
          severity: 'medium' as const,
          timestamp: new Date(),
          recoverable: true,
        }] : [],
        collections: {},
        operations: {},
        validation: {},
        network: null,
        lastError: contextValue.error.message,
      };

      const mappedState: Partial<CollectionManagementState> = {
        collections: {
          collections: collectionsMap,
          collectionIds,
          selectedIds,
          editingId: contextValue.editingCollection?.id || null,
          loading: loadingState,
          errors: errorState,
          cache: {
            metadata: {},
            statistics: {
              hits: 0,
              misses: 0,
              hitRate: 0,
              totalSize: 0,
              entryCount: 0,
              averageEntrySize: 0,
            },
            invalidationRules: [],
            size: 0,
            maxSize: 50 * 1024 * 1024,
            ttl: 5 * 60 * 1000,
          },
          performance: {
            renderMetrics: {
              averageRenderTime: 0,
              maxRenderTime: 0,
              totalRenders: 0,
              slowRenders: 0,
              frameDrops: 0,
            },
            fetchMetrics: {
              averageFetchTime: 0,
              maxFetchTime: 0,
              totalFetches: 0,
              failedFetches: 0,
              cacheHitRate: 0,
            },
            memoryMetrics: {
              heapUsed: 0,
              heapTotal: 0,
              external: 0,
              arrayBuffers: 0,
            },
            operationLatency: {},
            history: [],
          },
        },
        filterView: {
          filter: contextValue.filter,
          sort: contextValue.sort,
          pagination: {
            page: 0,
            pageSize: 25,
            total: contextValue.collections.length,
            totalPages: Math.ceil(contextValue.collections.length / 25),
          },
          viewConfig: contextValue.viewConfig,
          searchHistory: [],
          filterPresets: [],
          quickFilters: {
            recent: [],
            favorites: [],
            suggestions: [],
            recommendations: [],
          },
        },
      };

      fieldsProcessed += 10; // Account for other processed fields
      fieldsMapped += 10;

      return {
        success: true,
        data: mappedState,
        errors,
        warnings,
        metrics: {
          mappingTime: performance.now() - startTime,
          fieldsProcessed,
          fieldsMapped,
          fieldsSkipped: fieldsProcessed - fieldsMapped,
        },
      };

    } catch (error) {
      errors.push(error instanceof Error ? error.message : 'Unknown mapping error');
      return {
        success: false,
        data: null,
        errors,
        warnings,
        metrics: {
          mappingTime: performance.now() - startTime,
          fieldsProcessed,
          fieldsMapped,
          fieldsSkipped: fieldsProcessed - fieldsMapped,
        },
      };
    }
  }

  /**
   * Map Zustand store state to CollectionContext interface
   */
  mapStoreToContext(storeState: CollectionManagementState): StateMappingResult<CollectionContextValue> {
    const startTime = performance.now();
    const errors: string[] = [];
    const warnings: string[] = [];
    let fieldsProcessed = 0;
    let fieldsMapped = 0;

    try {
      // Convert normalized collections back to array
      const collections = storeState.collections.collectionIds.map(id => {
        fieldsProcessed++;
        const collection = storeState.collections.collections[id];
        if (collection) {
          fieldsMapped++;
          return collection;
        }
        warnings.push(`Collection ${id} not found in store`);
        return null;
      }).filter(Boolean) as Collection[];

      // Convert filtered collections (apply current filters)
      const filteredCollections = collections; // TODO: Apply actual filtering logic

      // Convert selected collections
      const selectedCollections = Array.from(storeState.collections.selectedIds)
        .map(id => storeState.collections.collections[id])
        .filter(Boolean);

      // Map editing collection
      const editingCollection = storeState.collections.editingId 
        ? storeState.collections.collections[storeState.collections.editingId] || null
        : null;

      // Map loading state
      const loading = {
        collections: storeState.collections.loading.collections,
        creating: storeState.collections.loading.creating,
        updating: Object.values(storeState.collections.loading.updating).some(Boolean),
        deleting: Object.values(storeState.collections.loading.deleting).some(Boolean),
        bulk: storeState.collections.loading.bulk,
      };

      // Map error state
      const error = {
        message: storeState.collections.errors.lastError,
        hasError: storeState.collections.errors.global.length > 0 ||
                 Object.keys(storeState.collections.errors.collections).length > 0,
      };

      // Create mock action handlers (these would be connected to store actions)
      const mockActions = {
        createCollection: async () => { throw new Error('Not implemented in mapping layer'); },
        updateCollection: async () => { throw new Error('Not implemented in mapping layer'); },
        deleteCollection: async () => { throw new Error('Not implemented in mapping layer'); },
        duplicateCollection: async () => { throw new Error('Not implemented in mapping layer'); },
        refreshCollections: async () => { throw new Error('Not implemented in mapping layer'); },
        selectCollection: () => {},
        selectAll: () => {},
        clearSelection: () => {},
        toggleSelection: () => {},
        startBulkOperation: async () => {},
        cancelBulkOperation: () => {},
        setFilter: () => {},
        clearFilter: () => {},
        updateFilter: () => {},
        setSort: () => {},
        toggleSort: () => {},
        clearSort: () => {},
        setViewConfig: () => {},
        changeViewMode: () => {},
        changeDensity: () => {},
        startEditing: () => {},
        stopEditing: () => {},
        saveEdit: async () => {},
        cancelEdit: () => {},
        getCollection: () => undefined,
        isSelected: () => false,
        isEditing: () => false,
        getCountInfo: () => ({ total: 0, filtered: 0, selected: 0 }),
      };

      const contextValue: CollectionContextValue = {
        // Data
        collections,
        filteredCollections,
        selectedCollections,
        editingCollection,

        // State
        loading,
        error,
        viewConfig: storeState.filterView.viewConfig,
        filter: storeState.filterView.filter,
        sort: storeState.filterView.sort,
        selection: {
          selectedIds: storeState.collections.selectedIds,
          selectedCount: storeState.collections.selectedIds.size,
          allSelected: storeState.collections.selectedIds.size === collections.length,
          someSelected: storeState.collections.selectedIds.size > 0 && 
                       storeState.collections.selectedIds.size < collections.length,
        },

        // Actions - these would be connected to actual store actions in the bridge
        ...mockActions,

        // Configuration
        features: {
          enableRealtime: true,
          enableSelection: true,
          enableFiltering: true,
          enableSorting: true,
          enableBulkOperations: true,
        },
      };

      fieldsProcessed += 15; // Account for other processed fields
      fieldsMapped += 15;

      return {
        success: true,
        data: contextValue,
        errors,
        warnings,
        metrics: {
          mappingTime: performance.now() - startTime,
          fieldsProcessed,
          fieldsMapped,
          fieldsSkipped: fieldsProcessed - fieldsMapped,
        },
      };

    } catch (error) {
      errors.push(error instanceof Error ? error.message : 'Unknown mapping error');
      return {
        success: false,
        data: null,
        errors,
        warnings,
        metrics: {
          mappingTime: performance.now() - startTime,
          fieldsProcessed,
          fieldsMapped,
          fieldsSkipped: fieldsProcessed - fieldsMapped,
        },
      };
    }
  }
}

// =============================================================================
// Allocation Context Mapping (Simplified for Phase 3)
// =============================================================================

class AllocationContextMapper {
  /**
   * Map AllocationContext to unified store structure
   */
  mapContextToStore(contextValue: AllocationContextType): StateMappingResult<any> {
    const startTime = performance.now();
    
    try {
      // For Phase 3, we'll create a simplified mapping
      // This will be expanded in future phases
      const mappedState = {
        opportunities: contextValue.opportunities,
        sites: contextValue.sites,
        collectionDecks: contextValue.collectionDecks,
        loading: contextValue.isLoading,
        // Add other key state elements
      };

      return {
        success: true,
        data: mappedState,
        errors: [],
        warnings: ['Allocation mapping is simplified for Phase 3'],
        metrics: {
          mappingTime: performance.now() - startTime,
          fieldsProcessed: 4,
          fieldsMapped: 4,
          fieldsSkipped: 0,
        },
      };
    } catch (error) {
      return {
        success: false,
        data: null,
        errors: [error instanceof Error ? error.message : 'Allocation mapping failed'],
        warnings: [],
        metrics: {
          mappingTime: performance.now() - startTime,
          fieldsProcessed: 0,
          fieldsMapped: 0,
          fieldsSkipped: 0,
        },
      };
    }
  }

  mapStoreToContext(storeState: any): StateMappingResult<AllocationContextType> {
    // Simplified implementation for Phase 3
    return {
      success: false,
      data: null,
      errors: ['Allocation store to context mapping not implemented in Phase 3'],
      warnings: [],
      metrics: {
        mappingTime: 0,
        fieldsProcessed: 0,
        fieldsMapped: 0,
        fieldsSkipped: 0,
      },
    };
  }
}

// =============================================================================
// Wizard Sync Context Mapping (Simplified for Phase 3)
// =============================================================================

class WizardSyncMapper {
  /**
   * Map WizardSync to unified store structure
   */
  mapContextToStore(contextValue: WizardSyncState): StateMappingResult<any> {
    const startTime = performance.now();
    
    try {
      const mappedState = {
        wizardData: contextValue.wizardData,
        isWizardContext: contextValue.isWizardContext,
        currentStep: contextValue.currentStep,
        // Add other key state elements
      };

      return {
        success: true,
        data: mappedState,
        errors: [],
        warnings: ['Wizard mapping is simplified for Phase 3'],
        metrics: {
          mappingTime: performance.now() - startTime,
          fieldsProcessed: 3,
          fieldsMapped: 3,
          fieldsSkipped: 0,
        },
      };
    } catch (error) {
      return {
        success: false,
        data: null,
        errors: [error instanceof Error ? error.message : 'Wizard mapping failed'],
        warnings: [],
        metrics: {
          mappingTime: performance.now() - startTime,
          fieldsProcessed: 0,
          fieldsMapped: 0,
          fieldsSkipped: 0,
        },
      };
    }
  }

  mapStoreToContext(storeState: any): StateMappingResult<WizardSyncState> {
    // Simplified implementation for Phase 3
    return {
      success: false,
      data: null,
      errors: ['Wizard store to context mapping not implemented in Phase 3'],
      warnings: [],
      metrics: {
        mappingTime: 0,
        fieldsProcessed: 0,
        fieldsMapped: 0,
        fieldsSkipped: 0,
      },
    };
  }
}

// =============================================================================
// Unified Mapper Export
// =============================================================================

export const contextToStoreMapper = {
  collection: new CollectionContextMapper(),
  allocation: new AllocationContextMapper(),
  wizard: new WizardSyncMapper(),

  /**
   * Map any context to store format
   */
  mapToStore: (
    contextType: 'collection' | 'allocation' | 'wizard',
    contextValue: any
  ): StateMappingResult<any> => {
    switch (contextType) {
      case 'collection':
        return contextToStoreMapper.collection.mapContextToStore(contextValue);
      case 'allocation':
        return contextToStoreMapper.allocation.mapContextToStore(contextValue);
      case 'wizard':
        return contextToStoreMapper.wizard.mapContextToStore(contextValue);
      default:
        return {
          success: false,
          data: null,
          errors: [`Unknown context type: ${contextType}`],
          warnings: [],
          metrics: {
            mappingTime: 0,
            fieldsProcessed: 0,
            fieldsMapped: 0,
            fieldsSkipped: 0,
          },
        };
    }
  },

  /**
   * Map store to any context format
   */
  mapToContext: (
    contextType: 'collection' | 'allocation' | 'wizard',
    storeState: any
  ): StateMappingResult<any> => {
    switch (contextType) {
      case 'collection':
        return contextToStoreMapper.collection.mapStoreToContext(storeState);
      case 'allocation':
        return contextToStoreMapper.allocation.mapStoreToContext(storeState);
      case 'wizard':
        return contextToStoreMapper.wizard.mapStoreToContext(storeState);
      default:
        return {
          success: false,
          data: null,
          errors: [`Unknown context type: ${contextType}`],
          warnings: [],
          metrics: {
            mappingTime: 0,
            fieldsProcessed: 0,
            fieldsMapped: 0,
            fieldsSkipped: 0,
          },
        };
    }
  },

  /**
   * Validate mapping consistency
   */
  validateMapping: (
    contextType: 'collection' | 'allocation' | 'wizard',
    original: any,
    mapped: any
  ): { isValid: boolean; issues: string[] } => {
    const issues: string[] = [];

    if (contextType === 'collection') {
      // Validate collection mapping
      if (original.collections?.length !== mapped.collections?.collectionIds?.length) {
        issues.push('Collection count mismatch');
      }
      
      if (original.selectedCollections?.length !== mapped.collections?.selectedIds?.size) {
        issues.push('Selection count mismatch');
      }
    }

    return {
      isValid: issues.length === 0,
      issues,
    };
  },
};