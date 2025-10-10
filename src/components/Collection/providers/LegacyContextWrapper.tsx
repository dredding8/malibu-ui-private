/**
 * Legacy Context Wrapper
 * 
 * Wraps old contexts to provide backward compatibility during migration
 * with deprecation warnings and migration assistance.
 * 
 * Phase 3: Migration Components
 * @version 1.0.0
 * @date 2025-09-30
 */

import React, { useEffect, useState, useRef } from 'react';
import { CollectionProvider, CollectionProviderProps, useCollectionContext } from '../CollectionProvider';
import { AllocationProvider, useAllocationContext, AllocationContextType } from '../../../contexts/AllocationContext';
import { WizardSyncProvider, useWizardSync, WizardSyncState } from '../../../contexts/WizardSyncContext';
import { UnifiedCollectionProvider } from './UnifiedCollectionProvider';

// =============================================================================
// Deprecation Warning System
// =============================================================================

interface DeprecationConfig {
  /** Show deprecation warnings */
  showWarnings: boolean;
  /** Warning frequency */
  warningFrequency: 'once' | 'session' | 'always';
  /** Migration deadline */
  migrationDeadline?: Date;
  /** Migration guide URL */
  migrationGuideUrl?: string;
  /** Contact information for migration help */
  supportContact?: string;
}

interface DeprecationMetrics {
  /** Number of times deprecated context was accessed */
  accessCount: number;
  /** Unique components using deprecated context */
  uniqueComponents: Set<string>;
  /** First access timestamp */
  firstAccess: Date;
  /** Last access timestamp */
  lastAccess: Date;
  /** Warning display count */
  warningsShown: number;
}

class DeprecationTracker {
  private static instance: DeprecationTracker;
  private metrics: Map<string, DeprecationMetrics> = new Map();
  private warnedComponents: Set<string> = new Set();

  static getInstance(): DeprecationTracker {
    if (!DeprecationTracker.instance) {
      DeprecationTracker.instance = new DeprecationTracker();
    }
    return DeprecationTracker.instance;
  }

  trackAccess(contextType: string, componentName?: string) {
    const now = new Date();
    const existing = this.metrics.get(contextType);

    if (existing) {
      existing.accessCount++;
      existing.lastAccess = now;
      if (componentName) {
        existing.uniqueComponents.add(componentName);
      }
    } else {
      this.metrics.set(contextType, {
        accessCount: 1,
        uniqueComponents: new Set(componentName ? [componentName] : []),
        firstAccess: now,
        lastAccess: now,
        warningsShown: 0,
      });
    }
  }

  shouldShowWarning(
    contextType: string, 
    componentName?: string, 
    config: DeprecationConfig = { showWarnings: true, warningFrequency: 'once' }
  ): boolean {
    if (!config.showWarnings) return false;

    const metrics = this.metrics.get(contextType);
    if (!metrics) return true;

    const componentKey = `${contextType}:${componentName || 'unknown'}`;

    switch (config.warningFrequency) {
      case 'once':
        return !this.warnedComponents.has(componentKey);
      case 'session':
        return !sessionStorage.getItem(`deprecation_warned_${componentKey}`);
      case 'always':
        return true;
      default:
        return false;
    }
  }

  showWarning(
    contextType: string, 
    componentName?: string, 
    config: DeprecationConfig = { showWarnings: true, warningFrequency: 'once' }
  ) {
    const componentKey = `${contextType}:${componentName || 'unknown'}`;
    
    if (!this.shouldShowWarning(contextType, componentName, config)) {
      return;
    }

    const metrics = this.metrics.get(contextType);
    if (metrics) {
      metrics.warningsShown++;
    }

    const message = this.createDeprecationMessage(contextType, config);
    
    // Show warning based on environment
    if (process.env.NODE_ENV === 'development') {
      console.warn(message);
    } else {
      // In production, might want to send to logging service
      console.info('Deprecated context usage detected:', contextType);
    }

    // Mark as warned
    this.warnedComponents.add(componentKey);
    if (config.warningFrequency === 'session') {
      sessionStorage.setItem(`deprecation_warned_${componentKey}`, 'true');
    }
  }

  private createDeprecationMessage(contextType: string, config: DeprecationConfig): string {
    const baseMessage = `[DEPRECATED] ${contextType} context is deprecated and will be removed in a future version.`;
    
    let additionalInfo = '\n';
    
    if (config.migrationDeadline) {
      additionalInfo += `Migration deadline: ${config.migrationDeadline.toLocaleDateString()}\n`;
    }
    
    if (config.migrationGuideUrl) {
      additionalInfo += `Migration guide: ${config.migrationGuideUrl}\n`;
    }
    
    if (config.supportContact) {
      additionalInfo += `For migration help: ${config.supportContact}\n`;
    }
    
    additionalInfo += 'Please migrate to UnifiedCollectionProvider for improved performance and features.';
    
    return baseMessage + additionalInfo;
  }

  getMetrics(contextType?: string): DeprecationMetrics | Map<string, DeprecationMetrics> {
    if (contextType) {
      return this.metrics.get(contextType) || {
        accessCount: 0,
        uniqueComponents: new Set(),
        firstAccess: new Date(),
        lastAccess: new Date(),
        warningsShown: 0,
      };
    }
    return this.metrics;
  }

  exportMetrics(): any {
    const exported: any = {};
    for (const [key, metrics] of this.metrics.entries()) {
      exported[key] = {
        ...metrics,
        uniqueComponents: Array.from(metrics.uniqueComponents),
      };
    }
    return exported;
  }
}

// =============================================================================
// Legacy Collection Provider Wrapper
// =============================================================================

interface LegacyCollectionProviderProps extends CollectionProviderProps {
  /** Enable migration mode */
  enableMigration?: boolean;
  /** Deprecation configuration */
  deprecationConfig?: Partial<DeprecationConfig>;
  /** Component name for tracking */
  componentName?: string;
  /** Migration event handlers */
  onMigrationRecommended?: () => void;
  onDeprecationWarning?: (metrics: DeprecationMetrics) => void;
}

export const LegacyCollectionProvider: React.FC<LegacyCollectionProviderProps> = ({
  children,
  enableMigration = false,
  deprecationConfig = {},
  componentName,
  onMigrationRecommended,
  onDeprecationWarning,
  ...collectionProps
}) => {
  const tracker = DeprecationTracker.getInstance();
  const [shouldMigrate, setShouldMigrate] = useState(false);
  const migrationCheckRef = useRef<boolean>(false);

  const config: DeprecationConfig = {
    showWarnings: true,
    warningFrequency: 'once',
    migrationDeadline: new Date(Date.now() + 90 * 24 * 60 * 60 * 1000), // 90 days from now
    migrationGuideUrl: '/docs/collection-migration',
    supportContact: 'dev-team@company.com',
    ...deprecationConfig,
  };

  // Track usage and show warnings
  useEffect(() => {
    tracker.trackAccess('CollectionProvider', componentName);
    tracker.showWarning('CollectionProvider', componentName, config);

    const metrics = tracker.getMetrics('CollectionProvider') as DeprecationMetrics;
    onDeprecationWarning?.(metrics);

    // Check if migration should be recommended
    if (!migrationCheckRef.current && metrics.accessCount > 10) {
      migrationCheckRef.current = true;
      onMigrationRecommended?.();
    }
  }, [componentName, config, onDeprecationWarning, onMigrationRecommended, tracker]);

  // Migration recommendation logic
  useEffect(() => {
    const metrics = tracker.getMetrics('CollectionProvider') as DeprecationMetrics;
    
    // Recommend migration if:
    // 1. High usage count
    // 2. Multiple components using it
    // 3. Near migration deadline
    const highUsage = metrics.accessCount > 50;
    const multipleComponents = metrics.uniqueComponents.size > 3;
    const nearDeadline = config.migrationDeadline && 
      (config.migrationDeadline.getTime() - Date.now()) < (30 * 24 * 60 * 60 * 1000); // 30 days

    if ((highUsage || multipleComponents || nearDeadline) && !shouldMigrate) {
      setShouldMigrate(true);
      onMigrationRecommended?.();
    }
  }, [config.migrationDeadline, onMigrationRecommended, shouldMigrate, tracker]);

  // Use UnifiedCollectionProvider if migration is enabled
  if (enableMigration || shouldMigrate) {
    return (
      <UnifiedCollectionProvider
        {...collectionProps}
        config={{
          strategy: 'hybrid',
          enableSync: true,
          enableMonitoring: true,
          featureFlags: {
            useZustandStore: true,
            enableOptimizations: true,
            enableCaching: true,
            enableRealtime: true,
          },
        }}
      >
        {children}
      </UnifiedCollectionProvider>
    );
  }

  // Use legacy CollectionProvider
  return (
    <CollectionProvider {...collectionProps}>
      {children}
    </CollectionProvider>
  );
};

// =============================================================================
// Legacy Collection Hook Wrapper
// =============================================================================

interface LegacyHookConfig {
  /** Component name for tracking */
  componentName?: string;
  /** Enable deprecation warnings */
  showWarnings?: boolean;
  /** Enable automatic migration */
  enableAutoMigration?: boolean;
}

export const useLegacyCollection = (config: LegacyHookConfig = {}) => {
  const tracker = DeprecationTracker.getInstance();
  const [migrationRecommended, setMigrationRecommended] = useState(false);

  const {
    componentName,
    showWarnings = true,
    enableAutoMigration = false,
  } = config;

  // Track hook usage
  useEffect(() => {
    tracker.trackAccess('useCollectionContext', componentName);
    
    if (showWarnings) {
      tracker.showWarning('useCollectionContext', componentName, {
        showWarnings: true,
        warningFrequency: 'once',
      });
    }

    // Check if migration should be recommended
    const metrics = tracker.getMetrics('useCollectionContext') as DeprecationMetrics;
    if (metrics.accessCount > 20 && !migrationRecommended) {
      setMigrationRecommended(true);
    }
  }, [componentName, showWarnings, tracker, migrationRecommended]);

  try {
    const contextValue = useCollectionContext();
    
    // Add migration metadata to the context value
    return {
      ...contextValue,
      _migration: {
        isLegacy: true,
        migrationRecommended,
        migrationPath: 'useUnifiedCollection',
        metrics: tracker.getMetrics('useCollectionContext'),
      },
    };
  } catch (error) {
    // Context not available - might be in a migrated component
    if (enableAutoMigration) {
      console.warn('[useLegacyCollection] Context not available, attempting migration path');
      // Could attempt to use unified context here
    }
    throw error;
  }
};

// =============================================================================
// Legacy Allocation Provider Wrapper
// =============================================================================

interface LegacyAllocationProviderProps extends React.ComponentProps<typeof AllocationProvider> {
  /** Enable migration warnings */
  enableMigration?: boolean;
  /** Deprecation configuration */
  deprecationConfig?: Partial<DeprecationConfig>;
  /** Component name for tracking */
  componentName?: string;
}

export const LegacyAllocationProvider: React.FC<LegacyAllocationProviderProps> = ({
  children,
  enableMigration = false,
  deprecationConfig = {},
  componentName,
  ...allocationProps
}) => {
  const tracker = DeprecationTracker.getInstance();

  const config: DeprecationConfig = {
    showWarnings: true,
    warningFrequency: 'session',
    migrationDeadline: new Date(Date.now() + 120 * 24 * 60 * 60 * 1000), // 120 days from now
    ...deprecationConfig,
  };

  useEffect(() => {
    tracker.trackAccess('AllocationProvider', componentName);
    tracker.showWarning('AllocationProvider', componentName, config);
  }, [componentName, config, tracker]);

  return (
    <AllocationProvider {...allocationProps}>
      {children}
    </AllocationProvider>
  );
};

// =============================================================================
// Legacy Wizard Sync Provider Wrapper
// =============================================================================

interface LegacyWizardSyncProviderProps extends React.ComponentProps<typeof WizardSyncProvider> {
  /** Enable migration warnings */
  enableMigration?: boolean;
  /** Deprecation configuration */
  deprecationConfig?: Partial<DeprecationConfig>;
  /** Component name for tracking */
  componentName?: string;
}

export const LegacyWizardSyncProvider: React.FC<LegacyWizardSyncProviderProps> = ({
  children,
  enableMigration = false,
  deprecationConfig = {},
  componentName,
  ...wizardProps
}) => {
  const tracker = DeprecationTracker.getInstance();

  const config: DeprecationConfig = {
    showWarnings: true,
    warningFrequency: 'session',
    migrationDeadline: new Date(Date.now() + 120 * 24 * 60 * 60 * 1000), // 120 days from now
    ...deprecationConfig,
  };

  useEffect(() => {
    tracker.trackAccess('WizardSyncProvider', componentName);
    tracker.showWarning('WizardSyncProvider', componentName, config);
  }, [componentName, config, tracker]);

  return (
    <WizardSyncProvider {...wizardProps}>
      {children}
    </WizardSyncProvider>
  );
};

// =============================================================================
// Migration Status Dashboard
// =============================================================================

export const MigrationStatusDashboard: React.FC = () => {
  const tracker = DeprecationTracker.getInstance();
  const [metrics, setMetrics] = useState<Map<string, DeprecationMetrics>>(new Map());

  useEffect(() => {
    const updateMetrics = () => {
      setMetrics(tracker.getMetrics() as Map<string, DeprecationMetrics>);
    };

    updateMetrics();
    const interval = setInterval(updateMetrics, 5000); // Update every 5 seconds

    return () => clearInterval(interval);
  }, [tracker]);

  if (process.env.NODE_ENV !== 'development') {
    return null; // Only show in development
  }

  const exportData = () => {
    const exported = tracker.exportMetrics();
    console.log('Migration Metrics:', exported);
    
    // Create downloadable JSON
    const dataStr = JSON.stringify(exported, null, 2);
    const dataBlob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(dataBlob);
    
    const link = document.createElement('a');
    link.href = url;
    link.download = 'migration-metrics.json';
    link.click();
    
    URL.revokeObjectURL(url);
  };

  return (
    <div style={{
      position: 'fixed',
      bottom: 10,
      right: 10,
      background: 'rgba(0,0,0,0.9)',
      color: 'white',
      padding: '12px',
      borderRadius: '8px',
      fontSize: '11px',
      fontFamily: 'monospace',
      maxWidth: '300px',
      zIndex: 10000,
      border: '1px solid #333',
    }}>
      <div style={{ marginBottom: '8px', fontWeight: 'bold' }}>
        🚧 Migration Status Dashboard
      </div>
      
      {Array.from(metrics.entries()).map(([contextType, metric]) => (
        <div key={contextType} style={{ marginBottom: '6px', fontSize: '10px' }}>
          <div style={{ color: '#ff6b6b', fontWeight: 'bold' }}>{contextType}:</div>
          <div>Access: {metric.accessCount}</div>
          <div>Components: {metric.uniqueComponents.size}</div>
          <div>Warnings: {metric.warningsShown}</div>
          <div>Last: {metric.lastAccess.toLocaleTimeString()}</div>
        </div>
      ))}
      
      <button
        onClick={exportData}
        style={{
          background: '#4ecdc4',
          border: 'none',
          color: 'white',
          padding: '4px 8px',
          borderRadius: '4px',
          fontSize: '10px',
          cursor: 'pointer',
          marginTop: '8px',
        }}
      >
        Export Metrics
      </button>
    </div>
  );
};

// =============================================================================
// Export Utilities
// =============================================================================

export const LegacyMigrationUtils = {
  /**
   * Get deprecation metrics for all contexts
   */
  getMetrics: () => {
    return DeprecationTracker.getInstance().exportMetrics();
  },

  /**
   * Check if a context is heavily used and should be migrated
   */
  shouldMigrate: (contextType: string): boolean => {
    const tracker = DeprecationTracker.getInstance();
    const metrics = tracker.getMetrics(contextType) as DeprecationMetrics;
    
    return metrics.accessCount > 50 || 
           metrics.uniqueComponents.size > 5 ||
           (Date.now() - metrics.firstAccess.getTime()) > (30 * 24 * 60 * 60 * 1000); // 30 days
  },

  /**
   * Force show migration recommendation
   */
  showMigrationAlert: (contextType: string) => {
    alert(`${contextType} should be migrated to UnifiedCollectionProvider. See migration guide for details.`);
  },

  /**
   * Reset all tracking data
   */
  resetTracking: () => {
    DeprecationTracker.getInstance().getMetrics();
    sessionStorage.clear();
  },
};