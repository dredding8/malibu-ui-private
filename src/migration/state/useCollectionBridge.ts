/**
 * Collection Bridge Hook
 * 
 * Hook that abstracts state source (Context vs Zustand) providing
 * unified interface with performance monitoring and fallback handling.
 * 
 * Phase 3: Progressive Context Replacement
 * @version 1.0.0
 * @date 2025-09-30
 */

import { useCallback, useEffect, useMemo, useState, useRef } from 'react';
import { CollectionContextValue, useCollectionContext } from '../../components/Collection/CollectionProvider';
import { useCollectionStore } from '../../store/collectionStore';
import { contextToStoreMapper } from './contextMigrationMap';
import { actionTranslator } from './actionTranslator';
import { stateSyncManager } from './stateSync';
import { Collection, CollectionFilter, CollectionSort } from '../../types/collection.types';

// =============================================================================
// Bridge Configuration
// =============================================================================

interface BridgeConfig {
  /** State source preference */
  preferredSource: 'context' | 'store' | 'auto';
  /** Enable fallback to alternative source */
  enableFallback: boolean;
  /** Enable performance monitoring */
  enableMonitoring: boolean;
  /** Enable automatic synchronization */
  enableSync: boolean;
  /** Sync interval in milliseconds */
  syncInterval: number;
  /** Error handling strategy */
  errorStrategy: 'throw' | 'fallback' | 'return-error';
}

interface BridgeMetrics {
  /** Current state source */
  activeSource: 'context' | 'store' | 'none';
  /** Performance metrics */
  performance: {
    stateAccessTime: number;
    actionExecutionTime: number;
    syncOperationTime: number;
    cacheHitRate: number;
  };
  /** Error tracking */
  errors: {
    contextErrors: number;
    storeErrors: number;
    syncErrors: number;
    lastError: string | null;
  };
  /** Usage statistics */
  usage: {
    contextReads: number;
    storeReads: number;
    actionCalls: number;
    syncOperations: number;
  };
}

// =============================================================================
// Unified Collection State Interface
// =============================================================================

interface UnifiedCollectionState {
  // Data
  collections: Collection[];
  filteredCollections: Collection[];
  selectedCollections: Collection[];
  editingCollection: Collection | null;

  // State
  loading: CollectionContextValue['loading'];
  error: CollectionContextValue['error'];
  filter: CollectionFilter;
  sort: CollectionSort;
  selection: CollectionContextValue['selection'];

  // Computed
  isEmpty: boolean;
  hasErrors: boolean;
  isLoading: boolean;
  totalCount: number;
  selectedCount: number;

  // Bridge metadata
  source: 'context' | 'store';
  lastUpdated: Date;
  metrics: BridgeMetrics;
}

interface UnifiedCollectionActions {
  // Data operations
  create: (data: Omit<Collection, 'id' | 'createdAt' | 'updatedAt'>) => Promise<Collection>;
  update: (id: string, updates: Partial<Collection>) => Promise<Collection>;
  delete: (id: string, options?: any) => Promise<void>;
  duplicate: (sourceId: string, updates?: Partial<Collection>) => Promise<Collection>;
  refresh: () => Promise<void>;

  // Selection operations
  select: (id: string | string[], mode?: 'replace' | 'add' | 'remove' | 'toggle') => void;
  selectAll: () => void;
  clearSelection: () => void;
  toggleSelection: (id: string) => void;

  // Filter operations
  setFilter: (filter: CollectionFilter) => void;
  clearFilter: () => void;
  updateFilter: (updates: Partial<CollectionFilter>) => void;

  // Sort operations
  setSort: (sort: CollectionSort) => void;
  toggleSort: (field: string) => void;
  clearSort: () => void;

  // Utility operations
  getCollection: (id: string) => Collection | undefined;
  isSelected: (id: string) => boolean;
  isEditing: (id: string) => boolean;

  // Bridge operations
  switchSource: (source: 'context' | 'store') => Promise<void>;
  syncState: () => Promise<void>;
  resetMetrics: () => void;
}

// =============================================================================
// Bridge Hook Implementation
// =============================================================================

export const useCollectionBridge = (
  config: Partial<BridgeConfig> = {}
): {
  state: UnifiedCollectionState;
  actions: UnifiedCollectionActions;
  config: BridgeConfig;
  isReady: boolean;
} => {
  // Configuration
  const bridgeConfig: BridgeConfig = useMemo(() => ({
    preferredSource: 'context',
    enableFallback: true,
    enableMonitoring: true,
    enableSync: false,
    syncInterval: 5000,
    errorStrategy: 'fallback',
    ...config,
  }), [config]);

  // State management
  const [activeSource, setActiveSource] = useState<'context' | 'store' | 'none'>('none');
  const [metrics, setMetrics] = useState<BridgeMetrics>({
    activeSource: 'none',
    performance: {
      stateAccessTime: 0,
      actionExecutionTime: 0,
      syncOperationTime: 0,
      cacheHitRate: 0,
    },
    errors: {
      contextErrors: 0,
      storeErrors: 0,
      syncErrors: 0,
      lastError: null,
    },
    usage: {
      contextReads: 0,
      storeReads: 0,
      actionCalls: 0,
      syncOperations: 0,
    },
  });

  const [lastSyncTime, setLastSyncTime] = useState<Date>(new Date());
  const syncTimeoutRef = useRef<NodeJS.Timeout>();

  // Source state hooks
  const contextState = (() => {
    try {
      return useCollectionContext();
    } catch (error) {
      if (bridgeConfig.enableMonitoring) {
        setMetrics(prev => ({
          ...prev,
          errors: {
            ...prev.errors,
            contextErrors: prev.errors.contextErrors + 1,
            lastError: error instanceof Error ? error.message : 'Context access failed',
          },
        }));
      }
      return null;
    }
  })();

  const storeState = useCollectionStore();

  // Determine active source
  useEffect(() => {
    const determineSource = () => {
      if (bridgeConfig.preferredSource === 'auto') {
        // Auto-select based on availability and performance
        if (contextState && !storeState) {
          setActiveSource('context');
        } else if (!contextState && storeState) {
          setActiveSource('store');
        } else if (contextState && storeState) {
          // Both available, prefer based on recent performance or feature flags
          setActiveSource('context'); // Default for Phase 3
        } else {
          setActiveSource('none');
        }
      } else if (bridgeConfig.preferredSource === 'context') {
        if (contextState) {
          setActiveSource('context');
        } else if (bridgeConfig.enableFallback && storeState) {
          setActiveSource('store');
        } else {
          setActiveSource('none');
        }
      } else if (bridgeConfig.preferredSource === 'store') {
        if (storeState) {
          setActiveSource('store');
        } else if (bridgeConfig.enableFallback && contextState) {
          setActiveSource('context');
        } else {
          setActiveSource('none');
        }
      }
    };

    determineSource();
  }, [bridgeConfig, contextState, storeState]);

  // Performance measurement utility
  const measurePerformance = useCallback(async <T,>(
    operation: () => Promise<T> | T,
    metricType: keyof BridgeMetrics['performance']
  ): Promise<T> => {
    const startTime = performance.now();
    
    try {
      const result = await operation();
      const duration = performance.now() - startTime;
      
      if (bridgeConfig.enableMonitoring) {
        setMetrics(prev => ({
          ...prev,
          performance: {
            ...prev.performance,
            [metricType]: duration,
          },
        }));
      }
      
      return result;
    } catch (error) {
      const duration = performance.now() - startTime;
      
      if (bridgeConfig.enableMonitoring) {
        setMetrics(prev => ({
          ...prev,
          performance: {
            ...prev.performance,
            [metricType]: duration,
          },
          errors: {
            ...prev.errors,
            lastError: error instanceof Error ? error.message : 'Performance measurement failed',
          },
        }));
      }
      
      throw error;
    }
  }, [bridgeConfig.enableMonitoring]);

  // Unified state computation
  const unifiedState: UnifiedCollectionState = useMemo(() => {
    const sourceState = activeSource === 'context' ? contextState : 
                      activeSource === 'store' ? (() => {
                        // Map store state to context interface
                        const mappingResult = contextToStoreMapper.collection.mapStoreToContext(storeState);
                        return mappingResult.success ? mappingResult.data : null;
                      })() : null;

    if (!sourceState) {
      return {
        collections: [],
        filteredCollections: [],
        selectedCollections: [],
        editingCollection: null,
        loading: {
          collections: false,
          creating: false,
          updating: false,
          deleting: false,
          bulk: false,
        },
        error: { message: 'No state source available', hasError: true },
        filter: {},
        sort: { field: 'updatedAt', direction: 'desc' },
        selection: {
          selectedIds: new Set(),
          selectedCount: 0,
          allSelected: false,
          someSelected: false,
        },
        isEmpty: true,
        hasErrors: true,
        isLoading: false,
        totalCount: 0,
        selectedCount: 0,
        source: 'none' as any,
        lastUpdated: new Date(),
        metrics,
      };
    }

    // Update usage metrics
    if (bridgeConfig.enableMonitoring) {
      setMetrics(prev => ({
        ...prev,
        usage: {
          ...prev.usage,
          [activeSource === 'context' ? 'contextReads' : 'storeReads']: 
            prev.usage[activeSource === 'context' ? 'contextReads' : 'storeReads'] + 1,
        },
        activeSource: activeSource as any,
      }));
    }

    return {
      collections: sourceState.collections,
      filteredCollections: sourceState.filteredCollections,
      selectedCollections: sourceState.selectedCollections,
      editingCollection: sourceState.editingCollection,
      loading: sourceState.loading,
      error: sourceState.error,
      filter: sourceState.filter,
      sort: sourceState.sort,
      selection: sourceState.selection,
      isEmpty: sourceState.collections.length === 0,
      hasErrors: sourceState.error.hasError,
      isLoading: Object.values(sourceState.loading).some(Boolean),
      totalCount: sourceState.collections.length,
      selectedCount: sourceState.selection.selectedCount,
      source: activeSource as any,
      lastUpdated: lastSyncTime,
      metrics,
    };
  }, [activeSource, contextState, storeState, metrics, lastSyncTime, bridgeConfig.enableMonitoring]);

  // Unified actions
  const unifiedActions: UnifiedCollectionActions = useMemo(() => {
    const sourceState = activeSource === 'context' ? contextState : 
                       activeSource === 'store' ? (() => {
                         const mappingResult = contextToStoreMapper.collection.mapStoreToContext(storeState);
                         return mappingResult.success ? mappingResult.data : null;
                       })() : null;

    if (!sourceState) {
      // Return mock actions that throw errors
      return {
        create: async () => { throw new Error('No state source available'); },
        update: async () => { throw new Error('No state source available'); },
        delete: async () => { throw new Error('No state source available'); },
        duplicate: async () => { throw new Error('No state source available'); },
        refresh: async () => { throw new Error('No state source available'); },
        select: () => {},
        selectAll: () => {},
        clearSelection: () => {},
        toggleSelection: () => {},
        setFilter: () => {},
        clearFilter: () => {},
        updateFilter: () => {},
        setSort: () => {},
        toggleSort: () => {},
        clearSort: () => {},
        getCollection: () => undefined,
        isSelected: () => false,
        isEditing: () => false,
        switchSource: async () => {},
        syncState: async () => {},
        resetMetrics: () => {},
      };
    }

    // Wrap actions with performance monitoring and error handling
    const wrapAction = <T extends any[], R>(
      action: (...args: T) => R | Promise<R>,
      actionName: string
    ) => {
      return async (...args: T): Promise<R> => {
        return measurePerformance(async () => {
          try {
            if (bridgeConfig.enableMonitoring) {
              setMetrics(prev => ({
                ...prev,
                usage: {
                  ...prev.usage,
                  actionCalls: prev.usage.actionCalls + 1,
                },
              }));
            }

            const result = await action(...args);
            return result;
          } catch (error) {
            if (bridgeConfig.errorStrategy === 'throw') {
              throw error;
            } else if (bridgeConfig.errorStrategy === 'fallback') {
              // Try alternative source
              // Implementation would depend on the specific action
              throw error; // For now, still throw
            } else {
              // Return error object
              return { error: error instanceof Error ? error.message : 'Action failed' } as any;
            }
          }
        }, 'actionExecutionTime');
      };
    };

    return {
      create: wrapAction(sourceState.createCollection, 'createCollection'),
      update: wrapAction(sourceState.updateCollection, 'updateCollection'),
      delete: wrapAction(sourceState.deleteCollection, 'deleteCollection'),
      duplicate: wrapAction(sourceState.duplicateCollection, 'duplicateCollection'),
      refresh: wrapAction(sourceState.refreshCollections, 'refreshCollections'),
      
      select: sourceState.selectCollection,
      selectAll: sourceState.selectAll,
      clearSelection: sourceState.clearSelection,
      toggleSelection: sourceState.toggleSelection,
      
      setFilter: sourceState.setFilter,
      clearFilter: sourceState.clearFilter,
      updateFilter: sourceState.updateFilter,
      
      setSort: sourceState.setSort,
      toggleSort: sourceState.toggleSort,
      clearSort: sourceState.clearSort,
      
      getCollection: sourceState.getCollection,
      isSelected: sourceState.isSelected,
      isEditing: sourceState.isEditing,

      switchSource: async (newSource: 'context' | 'store') => {
        return measurePerformance(async () => {
          if (newSource === 'context' && !contextState && !bridgeConfig.enableFallback) {
            throw new Error('Context not available and fallback disabled');
          }
          if (newSource === 'store' && !storeState && !bridgeConfig.enableFallback) {
            throw new Error('Store not available and fallback disabled');
          }
          
          setActiveSource(newSource);
        }, 'actionExecutionTime');
      },

      syncState: async () => {
        return measurePerformance(async () => {
          if (contextState && storeState) {
            const result = await stateSyncManager.syncContextToStore(
              contextState,
              storeState,
              'collection'
            );
            
            if (bridgeConfig.enableMonitoring) {
              setMetrics(prev => ({
                ...prev,
                usage: {
                  ...prev.usage,
                  syncOperations: prev.usage.syncOperations + 1,
                },
                errors: {
                  ...prev.errors,
                  syncErrors: result.success ? prev.errors.syncErrors : prev.errors.syncErrors + 1,
                  lastError: result.success ? prev.errors.lastError : (result.operation.error || 'Sync failed'),
                },
              }));
            }
            
            setLastSyncTime(new Date());
            
            if (!result.success) {
              throw new Error(result.operation.error || 'State sync failed');
            }
          }
        }, 'syncOperationTime');
      },

      resetMetrics: () => {
        setMetrics({
          activeSource: activeSource as any,
          performance: {
            stateAccessTime: 0,
            actionExecutionTime: 0,
            syncOperationTime: 0,
            cacheHitRate: 0,
          },
          errors: {
            contextErrors: 0,
            storeErrors: 0,
            syncErrors: 0,
            lastError: null,
          },
          usage: {
            contextReads: 0,
            storeReads: 0,
            actionCalls: 0,
            syncOperations: 0,
          },
        });
      },
    };
  }, [activeSource, contextState, storeState, bridgeConfig, measurePerformance]);

  // Automatic synchronization
  useEffect(() => {
    if (bridgeConfig.enableSync && contextState && storeState) {
      syncTimeoutRef.current = setTimeout(async () => {
        try {
          await unifiedActions.syncState();
        } catch (error) {
          console.warn('[useCollectionBridge] Auto-sync failed:', error);
        }
      }, bridgeConfig.syncInterval);

      return () => {
        if (syncTimeoutRef.current) {
          clearTimeout(syncTimeoutRef.current);
        }
      };
    }
  }, [bridgeConfig.enableSync, bridgeConfig.syncInterval, contextState, storeState, unifiedActions]);

  const isReady = activeSource !== 'none';

  return {
    state: unifiedState,
    actions: unifiedActions,
    config: bridgeConfig,
    isReady,
  };
};

// =============================================================================
// Specialized Bridge Hooks
// =============================================================================

/**
 * Hook optimized for read-only collection access
 */
export const useCollectionData = (config: Partial<BridgeConfig> = {}) => {
  const { state } = useCollectionBridge({
    ...config,
    enableSync: false, // Disable sync for read-only access
  });

  return {
    collections: state.collections,
    filteredCollections: state.filteredCollections,
    selectedCollections: state.selectedCollections,
    loading: state.loading,
    error: state.error,
    isEmpty: state.isEmpty,
    totalCount: state.totalCount,
    source: state.source,
  };
};

/**
 * Hook optimized for collection operations
 */
export const useCollectionOperations = (config: Partial<BridgeConfig> = {}) => {
  const { actions, state } = useCollectionBridge({
    ...config,
    enableMonitoring: true, // Enable monitoring for operations
  });

  return {
    create: actions.create,
    update: actions.update,
    delete: actions.delete,
    duplicate: actions.duplicate,
    refresh: actions.refresh,
    isLoading: state.isLoading,
    hasErrors: state.hasErrors,
    metrics: state.metrics,
  };
};

/**
 * Hook for migration monitoring and control
 */
export const useCollectionMigration = () => {
  const { state, actions, config } = useCollectionBridge({
    enableMonitoring: true,
    enableSync: true,
  });

  return {
    currentSource: state.source,
    metrics: state.metrics,
    switchSource: actions.switchSource,
    syncState: actions.syncState,
    resetMetrics: actions.resetMetrics,
    config,
    isReady: state.source !== 'none',
  };
};