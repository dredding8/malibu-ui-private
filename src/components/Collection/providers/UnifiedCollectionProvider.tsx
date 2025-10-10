/**
 * Unified Collection Provider
 * 
 * New unified provider that integrates Context and Zustand store
 * with seamless migration capabilities and performance optimization.
 * 
 * Phase 3: Migration Components
 * @version 1.0.0
 * @date 2025-09-30
 */

import React, { createContext, useContext, useEffect, useMemo, useState } from 'react';
import { CollectionProvider, CollectionContextValue, CollectionProviderProps } from '../CollectionProvider';
import { useCollectionStore } from '../../../store/collectionStore';
import { CollectionStateBridge } from '../../../migration/state/ContextToZustandBridge';
import { contextToStoreMapper } from '../../../migration/state/contextMigrationMap';
import { stateSyncManager } from '../../../migration/state/stateSync';
import { Collection } from '../../../types/collection.types';

// =============================================================================
// Unified Provider Configuration
// =============================================================================

interface UnifiedProviderConfig {
  /** Migration strategy */
  strategy: 'context-only' | 'store-only' | 'hybrid' | 'auto';
  /** Enable bidirectional synchronization */
  enableSync: boolean;
  /** Sync interval in milliseconds */
  syncInterval: number;
  /** Enable performance monitoring */
  enableMonitoring: boolean;
  /** Enable A/B testing */
  enableTesting: boolean;
  /** Test group assignment */
  testGroup?: 'control' | 'experimental';
  /** Feature flags */
  featureFlags: {
    useZustandStore: boolean;
    enableOptimizations: boolean;
    enableCaching: boolean;
    enableRealtime: boolean;
  };
}

interface UnifiedProviderState {
  /** Current configuration */
  config: UnifiedProviderConfig;
  /** Active state source */
  activeSource: 'context' | 'store' | 'hybrid';
  /** Migration status */
  migrationStatus: {
    isActive: boolean;
    progress: number;
    errors: string[];
    lastSync: Date | null;
  };
  /** Performance metrics */
  metrics: {
    renderTime: number;
    stateAccessTime: number;
    syncTime: number;
    errorCount: number;
    cacheHitRate: number;
  };
}

// =============================================================================
// Unified Context
// =============================================================================

interface UnifiedCollectionContext extends CollectionContextValue {
  /** Provider configuration */
  providerConfig: UnifiedProviderConfig;
  /** Provider state */
  providerState: UnifiedProviderState;
  /** Migration controls */
  migration: {
    switchToStore: () => Promise<void>;
    switchToContext: () => Promise<void>;
    syncNow: () => Promise<void>;
    resetMetrics: () => void;
    getMetrics: () => UnifiedProviderState['metrics'];
  };
}

const UnifiedCollectionContext = createContext<UnifiedCollectionContext | null>(null);

// =============================================================================
// Unified Provider Hook
// =============================================================================

export const useUnifiedCollection = (): UnifiedCollectionContext => {
  const context = useContext(UnifiedCollectionContext);
  if (!context) {
    throw new Error('useUnifiedCollection must be used within UnifiedCollectionProvider');
  }
  return context;
};

// =============================================================================
// Strategy Implementations
// =============================================================================

interface StrategyImplementation {
  /** Initialize the strategy */
  initialize: (props: CollectionProviderProps, config: UnifiedProviderConfig) => void;
  /** Get current state */
  getState: () => CollectionContextValue;
  /** Handle state updates */
  handleUpdate: (updates: Partial<CollectionContextValue>) => void;
  /** Cleanup resources */
  cleanup: () => void;
}

class ContextOnlyStrategy implements StrategyImplementation {
  private contextValue: CollectionContextValue | null = null;

  initialize(props: CollectionProviderProps, config: UnifiedProviderConfig) {
    // Context-only implementation uses the existing CollectionProvider
    // This is handled by the wrapper component
  }

  getState(): CollectionContextValue {
    if (!this.contextValue) {
      throw new Error('Context strategy not initialized');
    }
    return this.contextValue;
  }

  handleUpdate(updates: Partial<CollectionContextValue>) {
    if (this.contextValue) {
      this.contextValue = { ...this.contextValue, ...updates };
    }
  }

  cleanup() {
    this.contextValue = null;
  }

  setContextValue(value: CollectionContextValue) {
    this.contextValue = value;
  }
}

class StoreOnlyStrategy implements StrategyImplementation {
  private storeValue: CollectionContextValue | null = null;

  initialize(props: CollectionProviderProps, config: UnifiedProviderConfig) {
    // Initialize store-based state
    const storeState = useCollectionStore.getState();
    const mappingResult = contextToStoreMapper.collection.mapStoreToContext(storeState);
    
    if (mappingResult.success && mappingResult.data) {
      this.storeValue = mappingResult.data;
    } else {
      throw new Error('Failed to initialize store strategy');
    }
  }

  getState(): CollectionContextValue {
    if (!this.storeValue) {
      // Get fresh state from store
      const storeState = useCollectionStore.getState();
      const mappingResult = contextToStoreMapper.collection.mapStoreToContext(storeState);
      
      if (mappingResult.success && mappingResult.data) {
        this.storeValue = mappingResult.data;
      } else {
        throw new Error('Store strategy not available');
      }
    }
    return this.storeValue;
  }

  handleUpdate(updates: Partial<CollectionContextValue>) {
    // Updates would be applied to the store
    // This requires action translation and store updates
  }

  cleanup() {
    this.storeValue = null;
  }
}

class HybridStrategy implements StrategyImplementation {
  private contextStrategy = new ContextOnlyStrategy();
  private storeStrategy = new StoreOnlyStrategy();
  private primarySource: 'context' | 'store' = 'context';

  initialize(props: CollectionProviderProps, config: UnifiedProviderConfig) {
    this.contextStrategy.initialize(props, config);
    this.storeStrategy.initialize(props, config);
  }

  getState(): CollectionContextValue {
    try {
      if (this.primarySource === 'context') {
        return this.contextStrategy.getState();
      } else {
        return this.storeStrategy.getState();
      }
    } catch (error) {
      // Fallback to alternative source
      this.primarySource = this.primarySource === 'context' ? 'store' : 'context';
      return this.primarySource === 'context' 
        ? this.contextStrategy.getState()
        : this.storeStrategy.getState();
    }
  }

  handleUpdate(updates: Partial<CollectionContextValue>) {
    // Apply updates to both sources with conflict resolution
    try {
      this.contextStrategy.handleUpdate(updates);
      this.storeStrategy.handleUpdate(updates);
    } catch (error) {
      console.warn('[HybridStrategy] Update failed:', error);
    }
  }

  cleanup() {
    this.contextStrategy.cleanup();
    this.storeStrategy.cleanup();
  }

  setPrimarySource(source: 'context' | 'store') {
    this.primarySource = source;
  }

  setContextValue(value: CollectionContextValue) {
    this.contextStrategy.setContextValue(value);
  }
}

// =============================================================================
// Unified Provider Component
// =============================================================================

export interface UnifiedCollectionProviderProps extends Omit<CollectionProviderProps, 'children'> {
  children: React.ReactNode;
  /** Provider configuration */
  config?: Partial<UnifiedProviderConfig>;
  /** Migration event handlers */
  onMigrationStart?: () => void;
  onMigrationComplete?: () => void;
  onMigrationError?: (error: string) => void;
  /** Performance monitoring */
  onPerformanceUpdate?: (metrics: UnifiedProviderState['metrics']) => void;
}

export const UnifiedCollectionProvider: React.FC<UnifiedCollectionProviderProps> = ({
  children,
  config: userConfig = {},
  onMigrationStart,
  onMigrationComplete,
  onMigrationError,
  onPerformanceUpdate,
  ...collectionProps
}) => {
  // Configuration
  const config: UnifiedProviderConfig = useMemo(() => ({
    strategy: 'context-only',
    enableSync: false,
    syncInterval: 5000,
    enableMonitoring: true,
    enableTesting: false,
    featureFlags: {
      useZustandStore: false,
      enableOptimizations: true,
      enableCaching: true,
      enableRealtime: true,
    },
    ...userConfig,
  }), [userConfig]);

  // Provider state
  const [providerState, setProviderState] = useState<UnifiedProviderState>(() => ({
    config,
    activeSource: config.strategy === 'store-only' ? 'store' : 
                 config.strategy === 'hybrid' ? 'hybrid' : 'context',
    migrationStatus: {
      isActive: false,
      progress: 0,
      errors: [],
      lastSync: null,
    },
    metrics: {
      renderTime: 0,
      stateAccessTime: 0,
      syncTime: 0,
      errorCount: 0,
      cacheHitRate: 0,
    },
  }));

  // Strategy implementation
  const [strategy] = useState<StrategyImplementation>(() => {
    switch (config.strategy) {
      case 'context-only':
        return new ContextOnlyStrategy();
      case 'store-only':
        return new StoreOnlyStrategy();
      case 'hybrid':
        return new HybridStrategy();
      default:
        return new ContextOnlyStrategy();
    }
  });

  // Context state wrapper
  const [contextValue, setContextValue] = useState<CollectionContextValue | null>(null);

  // Initialize strategy
  useEffect(() => {
    try {
      strategy.initialize(collectionProps, config);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Strategy initialization failed';
      setProviderState(prev => ({
        ...prev,
        migrationStatus: {
          ...prev.migrationStatus,
          errors: [...prev.migrationStatus.errors, errorMessage],
        },
        metrics: {
          ...prev.metrics,
          errorCount: prev.metrics.errorCount + 1,
        },
      }));
      onMigrationError?.(errorMessage);
    }
  }, [strategy, config, collectionProps, onMigrationError]);

  // Performance monitoring
  const measurePerformance = useMemo(() => {
    if (!config.enableMonitoring) {
      return {
        measureRender: (fn: () => any) => fn(),
        measureStateAccess: (fn: () => any) => fn(),
        measureSync: async (fn: () => Promise<any>) => fn(),
      };
    }

    return {
      measureRender: (fn: () => any) => {
        const start = performance.now();
        const result = fn();
        const end = performance.now();
        
        setProviderState(prev => ({
          ...prev,
          metrics: {
            ...prev.metrics,
            renderTime: end - start,
          },
        }));
        
        return result;
      },
      measureStateAccess: (fn: () => any) => {
        const start = performance.now();
        const result = fn();
        const end = performance.now();
        
        setProviderState(prev => ({
          ...prev,
          metrics: {
            ...prev.metrics,
            stateAccessTime: end - start,
          },
        }));
        
        return result;
      },
      measureSync: async (fn: () => Promise<any>) => {
        const start = performance.now();
        const result = await fn();
        const end = performance.now();
        
        setProviderState(prev => ({
          ...prev,
          metrics: {
            ...prev.metrics,
            syncTime: end - start,
          },
        }));
        
        return result;
      },
    };
  }, [config.enableMonitoring]);

  // Migration controls
  const migrationControls = useMemo(() => ({
    switchToStore: async () => {
      if (providerState.activeSource === 'store') return;
      
      try {
        onMigrationStart?.();
        setProviderState(prev => ({
          ...prev,
          migrationStatus: { ...prev.migrationStatus, isActive: true, progress: 0 },
        }));

        // Implementation would switch to store-based strategy
        setProviderState(prev => ({
          ...prev,
          activeSource: 'store',
          migrationStatus: { ...prev.migrationStatus, isActive: false, progress: 100 },
        }));

        onMigrationComplete?.();
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Migration to store failed';
        onMigrationError?.(errorMessage);
      }
    },

    switchToContext: async () => {
      if (providerState.activeSource === 'context') return;
      
      try {
        onMigrationStart?.();
        setProviderState(prev => ({
          ...prev,
          migrationStatus: { ...prev.migrationStatus, isActive: true, progress: 0 },
        }));

        // Implementation would switch to context-based strategy
        setProviderState(prev => ({
          ...prev,
          activeSource: 'context',
          migrationStatus: { ...prev.migrationStatus, isActive: false, progress: 100 },
        }));

        onMigrationComplete?.();
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Migration to context failed';
        onMigrationError?.(errorMessage);
      }
    },

    syncNow: async () => {
      if (!config.enableSync) return;
      
      try {
        await measurePerformance.measureSync(async () => {
          // Implement synchronization logic
          setProviderState(prev => ({
            ...prev,
            migrationStatus: { ...prev.migrationStatus, lastSync: new Date() },
          }));
        });
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Sync failed';
        setProviderState(prev => ({
          ...prev,
          migrationStatus: {
            ...prev.migrationStatus,
            errors: [...prev.migrationStatus.errors, errorMessage],
          },
        }));
      }
    },

    resetMetrics: () => {
      setProviderState(prev => ({
        ...prev,
        metrics: {
          renderTime: 0,
          stateAccessTime: 0,
          syncTime: 0,
          errorCount: 0,
          cacheHitRate: 0,
        },
      }));
    },

    getMetrics: () => providerState.metrics,
  }), [
    providerState, 
    config.enableSync, 
    measurePerformance, 
    onMigrationStart, 
    onMigrationComplete, 
    onMigrationError,
  ]);

  // Performance reporting
  useEffect(() => {
    if (config.enableMonitoring && onPerformanceUpdate) {
      onPerformanceUpdate(providerState.metrics);
    }
  }, [config.enableMonitoring, providerState.metrics, onPerformanceUpdate]);

  // Auto-sync
  useEffect(() => {
    if (config.enableSync) {
      const interval = setInterval(() => {
        migrationControls.syncNow();
      }, config.syncInterval);

      return () => clearInterval(interval);
    }
  }, [config.enableSync, config.syncInterval, migrationControls]);

  // Render strategy-specific provider
  const renderProvider = () => {
    if (config.strategy === 'context-only' || providerState.activeSource === 'context') {
      return (
        <CollectionProvider {...collectionProps}>
          <CollectionContextConsumer strategy={strategy} />
        </CollectionProvider>
      );
    } else if (config.strategy === 'store-only' || providerState.activeSource === 'store') {
      return <StoreBasedProvider strategy={strategy} />;
    } else {
      return (
        <CollectionProvider {...collectionProps}>
          <HybridProvider strategy={strategy as HybridStrategy} />
        </CollectionProvider>
      );
    }
  };

  // Context consumer component
  const CollectionContextConsumer: React.FC<{ strategy: StrategyImplementation }> = ({ strategy }) => {
    const contextValue = measurePerformance.measureStateAccess(() => {
      try {
        // This is a simplified version - in reality we'd get the context value here
        return strategy.getState();
      } catch {
        // Use a mock context value
        return null;
      }
    });

    useEffect(() => {
      if (strategy instanceof ContextOnlyStrategy && contextValue) {
        strategy.setContextValue(contextValue);
      } else if (strategy instanceof HybridStrategy && contextValue) {
        strategy.setContextValue(contextValue);
      }
    }, [contextValue, strategy]);

    return null; // This component just handles the strategy setup
  };

  // Store-based provider
  const StoreBasedProvider: React.FC<{ strategy: StrategyImplementation }> = ({ strategy }) => {
    const storeState = useCollectionStore();
    
    useEffect(() => {
      // Update strategy with store state
      strategy.handleUpdate({} as any); // Simplified for Phase 3
    }, [storeState, strategy]);

    return null;
  };

  // Hybrid provider
  const HybridProvider: React.FC<{ strategy: HybridStrategy }> = ({ strategy }) => {
    const contextValue = measurePerformance.measureStateAccess(() => {
      try {
        return strategy.getState();
      } catch {
        return null;
      }
    });

    useEffect(() => {
      if (contextValue) {
        strategy.setContextValue(contextValue);
      }
    }, [contextValue, strategy]);

    return null;
  };

  // Create unified context value
  const unifiedContextValue: UnifiedCollectionContext = useMemo(() => {
    const baseState = measurePerformance.measureStateAccess(() => {
      try {
        return strategy.getState();
      } catch {
        // Return minimal state on error
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
          error: { message: 'Strategy not available', hasError: true },
          viewConfig: { mode: 'table', density: 'comfortable', columns: [] },
          filter: {},
          sort: { field: 'updatedAt', direction: 'desc' },
          selection: {
            selectedIds: new Set(),
            selectedCount: 0,
            allSelected: false,
            someSelected: false,
          },
          features: {
            enableRealtime: false,
            enableSelection: false,
            enableFiltering: false,
            enableSorting: false,
            enableBulkOperations: false,
          },
        } as CollectionContextValue;
      }
    });

    return {
      ...baseState,
      providerConfig: config,
      providerState,
      migration: migrationControls,
    };
  }, [strategy, config, providerState, migrationControls, measurePerformance]);

  return (
    <UnifiedCollectionContext.Provider value={unifiedContextValue}>
      {renderProvider()}
      {children}
    </UnifiedCollectionContext.Provider>
  );
};

// =============================================================================
// Migration Status Component
// =============================================================================

export const MigrationStatus: React.FC = () => {
  const { providerState, migration } = useUnifiedCollection();

  if (!providerState.config.enableMonitoring) {
    return null;
  }

  return (
    <div style={{ 
      position: 'fixed', 
      top: 10, 
      right: 10, 
      background: 'rgba(0,0,0,0.8)', 
      color: 'white', 
      padding: '8px 12px', 
      borderRadius: '4px', 
      fontSize: '12px',
      fontFamily: 'monospace',
      zIndex: 9999,
    }}>
      <div>Source: {providerState.activeSource}</div>
      <div>Render: {providerState.metrics.renderTime.toFixed(2)}ms</div>
      <div>State: {providerState.metrics.stateAccessTime.toFixed(2)}ms</div>
      <div>Errors: {providerState.metrics.errorCount}</div>
      {providerState.migrationStatus.lastSync && (
        <div>Last Sync: {providerState.migrationStatus.lastSync.toLocaleTimeString()}</div>
      )}
    </div>
  );
};