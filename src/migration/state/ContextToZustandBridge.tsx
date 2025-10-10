/**
 * Context to Zustand Bridge Component
 * 
 * Provides seamless migration from React Context to Zustand store with
 * backward compatibility and progressive enhancement.
 * 
 * Phase 3: State Migration Bridge
 * @version 1.0.0
 * @date 2025-09-30
 */

import React, { createContext, useContext, useEffect, useRef, useMemo } from 'react';
import { useCollectionStore } from '../../store/collectionStore';
import { CollectionContextValue } from '../../components/Collection/CollectionProvider';
import { AllocationContextType } from '../../contexts/AllocationContext';
import { WizardSyncState } from '../../contexts/WizardSyncContext';
import { contextToStoreMapper } from './contextMigrationMap';
import { actionTranslator } from './actionTranslator';
import { stateSyncManager } from './stateSync';

// =============================================================================
// Migration Control Interface
// =============================================================================

interface MigrationConfig {
  /** Enable Zustand store usage */
  useZustand: boolean;
  /** Enable context fallback */
  useContextFallback: boolean;
  /** Enable bidirectional sync */
  enableSync: boolean;
  /** Migration strategy */
  strategy: 'gradual' | 'immediate' | 'test';
  /** Performance monitoring */
  enableMonitoring: boolean;
  /** Component identifiers for A/B testing */
  componentGroup?: 'control' | 'experimental';
}

interface MigrationState {
  /** Migration configuration */
  config: MigrationConfig;
  /** Performance metrics */
  metrics: {
    renderCount: number;
    averageRenderTime: number;
    errorCount: number;
    lastError: string | null;
    syncOperations: number;
    cacheHitRate: number;
  };
  /** Migration status */
  status: {
    isActive: boolean;
    isSyncing: boolean;
    hasErrors: boolean;
    lastSync: Date | null;
  };
}

// =============================================================================
// Migration Context
// =============================================================================

const MigrationContext = createContext<{
  state: MigrationState;
  updateConfig: (config: Partial<MigrationConfig>) => void;
  getPerformanceMetrics: () => MigrationState['metrics'];
  resetMetrics: () => void;
} | null>(null);

export const useMigrationState = () => {
  const context = useContext(MigrationContext);
  if (!context) {
    throw new Error('useMigrationState must be used within MigrationProvider');
  }
  return context;
};

// =============================================================================
// Unified Collection State Bridge
// =============================================================================

interface CollectionBridgeProps {
  children: React.ReactNode;
  /** Original context value */
  contextValue: CollectionContextValue;
  /** Migration configuration */
  migrationConfig?: Partial<MigrationConfig>;
  /** Performance callback */
  onPerformanceUpdate?: (metrics: any) => void;
}

export const CollectionStateBridge: React.FC<CollectionBridgeProps> = ({
  children,
  contextValue,
  migrationConfig = {},
  onPerformanceUpdate,
}) => {
  const storeState = useCollectionStore();
  const renderStartTime = useRef<number>();
  const [migrationState, setMigrationState] = React.useState<MigrationState>(() => ({
    config: {
      useZustand: false,
      useContextFallback: true,
      enableSync: true,
      strategy: 'gradual',
      enableMonitoring: true,
      ...migrationConfig,
    },
    metrics: {
      renderCount: 0,
      averageRenderTime: 0,
      errorCount: 0,
      lastError: null,
      syncOperations: 0,
      cacheHitRate: 0,
    },
    status: {
      isActive: false,
      isSyncing: false,
      hasErrors: false,
      lastSync: null,
    },
  }));

  // Performance monitoring
  useEffect(() => {
    if (migrationState.config.enableMonitoring) {
      renderStartTime.current = performance.now();
    }
  });

  useEffect(() => {
    if (migrationState.config.enableMonitoring && renderStartTime.current) {
      const renderTime = performance.now() - renderStartTime.current;
      setMigrationState(prev => ({
        ...prev,
        metrics: {
          ...prev.metrics,
          renderCount: prev.metrics.renderCount + 1,
          averageRenderTime: (prev.metrics.averageRenderTime + renderTime) / 2,
        },
      }));
      onPerformanceUpdate?.(migrationState.metrics);
    }
  });

  // State synchronization
  useEffect(() => {
    if (migrationState.config.enableSync && migrationState.config.useZustand) {
      const sync = async () => {
        setMigrationState(prev => ({ ...prev, status: { ...prev.status, isSyncing: true } }));
        
        try {
          await stateSyncManager.syncContextToStore(contextValue, storeState);
          setMigrationState(prev => ({
            ...prev,
            metrics: { ...prev.metrics, syncOperations: prev.metrics.syncOperations + 1 },
            status: { ...prev.status, isSyncing: false, lastSync: new Date() },
          }));
        } catch (error) {
          const errorMessage = error instanceof Error ? error.message : 'Sync failed';
          setMigrationState(prev => ({
            ...prev,
            metrics: { ...prev.metrics, errorCount: prev.metrics.errorCount + 1, lastError: errorMessage },
            status: { ...prev.status, isSyncing: false, hasErrors: true },
          }));
        }
      };

      sync();
    }
  }, [contextValue, storeState, migrationState.config]);

  // Unified state provider
  const unifiedState = useMemo(() => {
    if (migrationState.config.useZustand) {
      // Use Zustand store as primary source
      return contextToStoreMapper.mapStoreToContext(storeState);
    } else {
      // Use context as primary source
      return contextValue;
    }
  }, [migrationState.config.useZustand, storeState, contextValue]);

  const migrationContextValue = {
    state: migrationState,
    updateConfig: (config: Partial<MigrationConfig>) => {
      setMigrationState(prev => ({
        ...prev,
        config: { ...prev.config, ...config },
      }));
    },
    getPerformanceMetrics: () => migrationState.metrics,
    resetMetrics: () => {
      setMigrationState(prev => ({
        ...prev,
        metrics: {
          renderCount: 0,
          averageRenderTime: 0,
          errorCount: 0,
          lastError: null,
          syncOperations: 0,
          cacheHitRate: 0,
        },
      }));
    },
  };

  return (
    <MigrationContext.Provider value={migrationContextValue}>
      {/* Wrap children with unified state */}
      {React.cloneElement(children as React.ReactElement, {
        collectionState: unifiedState,
        migrationActive: migrationState.config.useZustand,
      })}
    </MigrationContext.Provider>
  );
};

// =============================================================================
// Allocation Context Bridge
// =============================================================================

interface AllocationBridgeProps {
  children: React.ReactNode;
  contextValue: AllocationContextType;
  migrationConfig?: Partial<MigrationConfig>;
}

export const AllocationStateBridge: React.FC<AllocationBridgeProps> = ({
  children,
  contextValue,
  migrationConfig = {},
}) => {
  // Similar implementation for AllocationContext
  // This will be a simplified version focusing on the core state management
  
  const [config] = React.useState<MigrationConfig>({
    useZustand: false,
    useContextFallback: true,
    enableSync: true,
    strategy: 'gradual',
    enableMonitoring: true,
    ...migrationConfig,
  });

  // For now, pass through the context value unchanged
  // In the future, this will integrate with the unified store
  return <>{children}</>;
};

// =============================================================================
// Wizard Sync Bridge
// =============================================================================

interface WizardBridgeProps {
  children: React.ReactNode;
  contextValue: WizardSyncState;
  migrationConfig?: Partial<MigrationConfig>;
}

export const WizardStateBridge: React.FC<WizardBridgeProps> = ({
  children,
  contextValue,
  migrationConfig = {},
}) => {
  // Similar implementation for WizardSyncContext
  // This will be integrated into the unified store structure
  
  const [config] = React.useState<MigrationConfig>({
    useZustand: false,
    useContextFallback: true,
    enableSync: true,
    strategy: 'gradual',
    enableMonitoring: true,
    ...migrationConfig,
  });

  // For now, pass through the context value unchanged
  return <>{children}</>;
};

// =============================================================================
// Migration Provider
// =============================================================================

interface MigrationProviderProps {
  children: React.ReactNode;
  /** Global migration configuration */
  config?: Partial<MigrationConfig>;
  /** Performance monitoring callback */
  onMetricsUpdate?: (metrics: any) => void;
}

export const MigrationProvider: React.FC<MigrationProviderProps> = ({
  children,
  config = {},
  onMetricsUpdate,
}) => {
  const [globalConfig] = React.useState<MigrationConfig>({
    useZustand: false,
    useContextFallback: true,
    enableSync: true,
    strategy: 'gradual',
    enableMonitoring: true,
    ...config,
  });

  // Global migration state management
  useEffect(() => {
    if (globalConfig.enableMonitoring) {
      const interval = setInterval(() => {
        // Collect global metrics
        onMetricsUpdate?.({
          strategy: globalConfig.strategy,
          timestamp: new Date(),
        });
      }, 10000); // Every 10 seconds

      return () => clearInterval(interval);
    }
  }, [globalConfig, onMetricsUpdate]);

  return <>{children}</>;
};

// =============================================================================
// Feature Flag Hook
// =============================================================================

export const useMigrationFeatureFlag = (flagName: string): boolean => {
  // Feature flag integration for gradual rollout
  // This would integrate with your feature flag system
  
  const defaultFlags: Record<string, boolean> = {
    'collection-zustand-migration': false,
    'allocation-zustand-migration': false,
    'wizard-zustand-migration': false,
    'performance-monitoring': true,
    'bidirectional-sync': true,
  };

  return defaultFlags[flagName] ?? false;
};

// =============================================================================
// Migration Utilities
// =============================================================================

export const MigrationUtils = {
  /**
   * Get migration status for a specific context
   */
  getMigrationStatus: (contextType: 'collection' | 'allocation' | 'wizard') => {
    // Return current migration status
    return {
      enabled: false,
      progress: 0,
      errors: [],
      performance: {},
    };
  },

  /**
   * Force enable migration for testing
   */
  enableMigration: (contextType: 'collection' | 'allocation' | 'wizard') => {
    // Enable migration for specific context
    console.log(`Enabling migration for ${contextType} context`);
  },

  /**
   * Rollback migration
   */
  rollbackMigration: (contextType: 'collection' | 'allocation' | 'wizard') => {
    // Rollback to context-only mode
    console.log(`Rolling back migration for ${contextType} context`);
  },

  /**
   * Get performance comparison
   */
  getPerformanceComparison: () => {
    return {
      context: { averageRenderTime: 0, memoryUsage: 0 },
      zustand: { averageRenderTime: 0, memoryUsage: 0 },
      improvement: { renderTime: '0%', memory: '0%' },
    };
  },
};