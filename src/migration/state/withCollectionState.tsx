/**
 * Collection State HOC
 * 
 * Higher-Order Component that can use either Context or Zustand based on feature flags
 * providing seamless transition during migration.
 * 
 * Phase 3: Progressive Context Replacement
 * @version 1.0.0
 * @date 2025-09-30
 */

import React, { ComponentType, useEffect, useState } from 'react';
import { CollectionContextValue, useCollectionContext } from '../../components/Collection/CollectionProvider';
import { useCollectionStore } from '../../store/collectionStore';
import { contextToStoreMapper } from './contextMigrationMap';
import { actionTranslator } from './actionTranslator';
import { stateSyncManager } from './stateSync';

// =============================================================================
// HOC Configuration Interface
// =============================================================================

interface CollectionStateConfig {
  /** Use Zustand store instead of context */
  useStore: boolean;
  /** Enable fallback to context if store fails */
  enableFallback: boolean;
  /** Enable performance monitoring */
  enableMonitoring: boolean;
  /** Enable automatic state synchronization */
  enableSync: boolean;
  /** Sync interval in milliseconds */
  syncInterval?: number;
  /** Component identifier for A/B testing */
  componentId?: string;
}

interface InjectedCollectionProps {
  /** Collection state and actions */
  collectionState: CollectionContextValue;
  /** Migration configuration */
  migrationConfig?: CollectionStateConfig;
  /** Performance metrics */
  performanceMetrics?: {
    renderTime: number;
    stateAccessTime: number;
    actionExecutionTime: number;
  };
}

// =============================================================================
// Performance Monitor Hook
// =============================================================================

const usePerformanceMonitor = (componentId?: string) => {
  const [metrics, setMetrics] = useState({
    renderTime: 0,
    stateAccessTime: 0,
    actionExecutionTime: 0,
    renderCount: 0,
  });

  const measureRender = (fn: () => void) => {
    const start = performance.now();
    fn();
    const end = performance.now();
    
    setMetrics(prev => ({
      ...prev,
      renderTime: end - start,
      renderCount: prev.renderCount + 1,
    }));
  };

  const measureStateAccess = async (fn: () => Promise<any> | any) => {
    const start = performance.now();
    const result = await fn();
    const end = performance.now();
    
    setMetrics(prev => ({
      ...prev,
      stateAccessTime: end - start,
    }));
    
    return result;
  };

  const measureActionExecution = async (fn: () => Promise<any> | any) => {
    const start = performance.now();
    const result = await fn();
    const end = performance.now();
    
    setMetrics(prev => ({
      ...prev,
      actionExecutionTime: end - start,
    }));
    
    return result;
  };

  return {
    metrics,
    measureRender,
    measureStateAccess,
    measureActionExecution,
  };
};

// =============================================================================
// Store-based Collection Hook
// =============================================================================

const useStoreBasedCollection = (config: CollectionStateConfig): CollectionContextValue => {
  const storeState = useCollectionStore();
  const [contextValue, setContextValue] = useState<CollectionContextValue | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const mapStoreToContext = async () => {
      try {
        const mappingResult = contextToStoreMapper.collection.mapStoreToContext(storeState);
        
        if (mappingResult.success && mappingResult.data) {
          // Wrap actions with store actions
          const wrappedActions = actionTranslator.wrapActions(
            'collection',
            mappingResult.data,
            storeState,
            {
              enableErrorHandling: true,
              enablePerformanceTracking: config.enableMonitoring,
              enableLogging: config.enableMonitoring,
              fallbackToContext: config.enableFallback,
            }
          );

          setContextValue({
            ...mappingResult.data,
            ...wrappedActions,
          });
          setError(null);
        } else {
          throw new Error(`Store mapping failed: ${mappingResult.errors.join(', ')}`);
        }
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : 'Store mapping error';
        setError(errorMessage);
        console.error('[withCollectionState] Store mapping failed:', err);
      }
    };

    mapStoreToContext();
  }, [storeState, config]);

  if (error && !config.enableFallback) {
    throw new Error(`Store-based collection state failed: ${error}`);
  }

  // Return a minimal context value if mapping failed and fallback is disabled
  if (!contextValue) {
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
      error: { message: error, hasError: !!error },
      viewConfig: {
        mode: 'table',
        density: 'comfortable',
        columns: [],
      },
      filter: {},
      sort: { field: 'updatedAt', direction: 'desc' },
      selection: {
        selectedIds: new Set(),
        selectedCount: 0,
        allSelected: false,
        someSelected: false,
      },
      // Mock actions
      createCollection: async () => { throw new Error('Store mapping failed'); },
      updateCollection: async () => { throw new Error('Store mapping failed'); },
      deleteCollection: async () => { throw new Error('Store mapping failed'); },
      duplicateCollection: async () => { throw new Error('Store mapping failed'); },
      refreshCollections: async () => { throw new Error('Store mapping failed'); },
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
      features: {
        enableRealtime: false,
        enableSelection: false,
        enableFiltering: false,
        enableSorting: false,
        enableBulkOperations: false,
      },
    };
  }

  return contextValue;
};

// =============================================================================
// HOC Implementation
// =============================================================================

export function withCollectionState<P extends object>(
  WrappedComponent: ComponentType<P & InjectedCollectionProps>,
  config: Partial<CollectionStateConfig> = {}
) {
  const defaultConfig: CollectionStateConfig = {
    useStore: false,
    enableFallback: true,
    enableMonitoring: false,
    enableSync: false,
    syncInterval: 5000,
    ...config,
  };

  const WithCollectionStateComponent: React.FC<P> = (props) => {
    const { measureRender, measureStateAccess, metrics } = usePerformanceMonitor(defaultConfig.componentId);
    const [syncError, setSyncError] = useState<string | null>(null);

    // Get state from either store or context
    const contextState = defaultConfig.enableFallback ? (() => {
      try {
        return useCollectionContext();
      } catch {
        return null;
      }
    })() : null;

    const storeState = defaultConfig.useStore ? useStoreBasedCollection(defaultConfig) : null;

    // Determine which state to use
    const collectionState = defaultConfig.useStore && storeState 
      ? storeState 
      : contextState || (() => {
          throw new Error('No collection state available');
        })();

    // State synchronization
    useEffect(() => {
      if (defaultConfig.enableSync && contextState && storeState && defaultConfig.syncInterval) {
        const syncInterval = setInterval(async () => {
          try {
            await measureStateAccess(async () => {
              const result = await stateSyncManager.syncContextToStore(
                contextState,
                useCollectionStore.getState(),
                'collection'
              );
              
              if (!result.success) {
                setSyncError(result.operation.error || 'Sync failed');
              } else {
                setSyncError(null);
              }
            });
          } catch (error) {
            setSyncError(error instanceof Error ? error.message : 'Sync error');
          }
        }, defaultConfig.syncInterval);

        return () => clearInterval(syncInterval);
      }
    }, [contextState, storeState, defaultConfig.enableSync, defaultConfig.syncInterval, measureStateAccess]);

    // Performance monitoring
    useEffect(() => {
      if (defaultConfig.enableMonitoring && defaultConfig.componentId) {
        console.log(`[withCollectionState] ${defaultConfig.componentId} metrics:`, {
          ...metrics,
          usingStore: defaultConfig.useStore,
          syncError,
        });
      }
    }, [metrics, defaultConfig.enableMonitoring, defaultConfig.componentId, syncError]);

    const wrappedRender = () => (
      <WrappedComponent
        {...props}
        collectionState={collectionState}
        migrationConfig={defaultConfig}
        performanceMetrics={defaultConfig.enableMonitoring ? metrics : undefined}
      />
    );

    return defaultConfig.enableMonitoring ? (
      <React.Fragment>
        {measureRender(wrappedRender)}
      </React.Fragment>
    ) : (
      wrappedRender()
    );
  };

  WithCollectionStateComponent.displayName = `withCollectionState(${WrappedComponent.displayName || WrappedComponent.name})`;

  return WithCollectionStateComponent;
}

// =============================================================================
// Feature Flag Integration
// =============================================================================

interface FeatureFlagConfig {
  /** Feature flag service */
  flagService?: {
    isEnabled: (flag: string) => boolean;
    getConfig: (flag: string) => any;
  };
  /** Default flags for development */
  defaultFlags?: Record<string, boolean>;
}

export function withFeatureFlags<P extends object>(
  WrappedComponent: ComponentType<P & InjectedCollectionProps>,
  featureConfig: FeatureFlagConfig = {}
) {
  const WithFeatureFlagsComponent: React.FC<P> = (props) => {
    const [config, setConfig] = useState<CollectionStateConfig>({
      useStore: false,
      enableFallback: true,
      enableMonitoring: false,
      enableSync: false,
    });

    useEffect(() => {
      const loadFeatureFlags = () => {
        const useStore = featureConfig.flagService?.isEnabled('collection-zustand-migration') ??
                         featureConfig.defaultFlags?.['collection-zustand-migration'] ??
                         false;

        const enableMonitoring = featureConfig.flagService?.isEnabled('collection-performance-monitoring') ??
                                featureConfig.defaultFlags?.['collection-performance-monitoring'] ??
                                false;

        const enableSync = featureConfig.flagService?.isEnabled('collection-state-sync') ??
                          featureConfig.defaultFlags?.['collection-state-sync'] ??
                          false;

        setConfig({
          useStore,
          enableFallback: true,
          enableMonitoring,
          enableSync,
          syncInterval: 5000,
        });
      };

      loadFeatureFlags();
    }, [featureConfig]);

    const EnhancedComponent = withCollectionState(WrappedComponent, config);
    return <EnhancedComponent {...props} />;
  };

  WithFeatureFlagsComponent.displayName = `withFeatureFlags(${WrappedComponent.displayName || WrappedComponent.name})`;

  return WithFeatureFlagsComponent;
}

// =============================================================================
// Migration Utilities
// =============================================================================

export const CollectionMigrationUtils = {
  /**
   * Create a component that uses store in test environments
   */
  createTestComponent<P extends object>(
    Component: ComponentType<P & InjectedCollectionProps>
  ) {
    return withCollectionState(Component, {
      useStore: true,
      enableFallback: false,
      enableMonitoring: true,
      enableSync: false,
    });
  },

  /**
   * Create a component that uses context with store fallback
   */
  createFallbackComponent<P extends object>(
    Component: ComponentType<P & InjectedCollectionProps>
  ) {
    return withCollectionState(Component, {
      useStore: false,
      enableFallback: true,
      enableMonitoring: true,
      enableSync: true,
    });
  },

  /**
   * Create a component with full monitoring
   */
  createMonitoredComponent<P extends object>(
    Component: ComponentType<P & InjectedCollectionProps>,
    componentId: string
  ) {
    return withCollectionState(Component, {
      useStore: true,
      enableFallback: true,
      enableMonitoring: true,
      enableSync: true,
      componentId,
    });
  },
};