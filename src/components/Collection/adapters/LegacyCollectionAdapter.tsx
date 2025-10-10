/**
 * Legacy Collection Adapter
 * 
 * Compatibility adapter that allows legacy CollectionOpportunities components
 * to work with the new compound component architecture during migration.
 * 
 * @version 1.0.0
 * @date 2025-09-30
 */

import React, { useMemo, useCallback, forwardRef } from 'react';
import { Collection, CollectionProps } from '../index';
import { useFeatureFlag } from '../../../hooks/useFeatureFlags';
import { mapLegacyProps } from '../../../utils/collection-migration/propMapper';
import { adaptLegacyState } from '../../../utils/collection-migration/stateAdapter';
import { translateLegacyEvents } from '../../../utils/collection-migration/eventTranslator';
import { trackMigrationMetrics } from '../../../utils/collection-migration/migrationMetrics';
import { CollectionOpportunity } from '../../../types/collectionOpportunities';
import { Collection as CollectionType } from '../../../types/collection.types';

// =============================================================================
// Legacy Props Interface
// =============================================================================

export interface LegacyCollectionOpportunitiesProps {
  // Core data props
  opportunities: CollectionOpportunity[];
  selectedIds?: string[];
  
  // Event handlers (legacy style)
  onSelectionChange?: (selectedIds: string[]) => void;
  onEdit?: (opportunity: CollectionOpportunity) => void;
  onOverride?: (opportunityId: string, data: any) => void;
  onBulkAction?: (action: string, selectedIds: string[]) => void;
  
  // Configuration props
  filterConfig?: any;
  sortConfig?: any;
  viewMode?: 'table' | 'grid' | 'list';
  enableSelection?: boolean;
  enableFiltering?: boolean;
  enableSorting?: boolean;
  enableBulkOperations?: boolean;
  
  // Specialized props
  healthScoring?: boolean;
  realTimeUpdates?: boolean;
  splitViewConfig?: any;
  accessibilityMode?: boolean;
  jtbdAnalytics?: boolean;
  
  // Performance props
  virtualizedTable?: boolean;
  memoizedHealthScores?: boolean;
  debouncedSearch?: boolean;
  
  // Layout props
  bentoLayout?: boolean;
  splitView?: boolean;
  modalReplacement?: boolean;
  
  // Other legacy props
  className?: string;
  style?: React.CSSProperties;
  loading?: boolean;
  error?: string | null;
  
  // Pass-through props
  [key: string]: any;
}

// =============================================================================
// Adapter Configuration
// =============================================================================

interface AdapterConfig {
  variant: string;
  enableMetrics: boolean;
  enableFallback: boolean;
  migrationStage: 'alpha' | 'beta' | 'production';
  performanceMode: 'strict' | 'compatibility' | 'legacy';
}

const DEFAULT_ADAPTER_CONFIG: AdapterConfig = {
  variant: 'standard',
  enableMetrics: true,
  enableFallback: true,
  migrationStage: 'alpha',
  performanceMode: 'compatibility'
};

// =============================================================================
// Main Adapter Component
// =============================================================================

export interface LegacyCollectionAdapterProps extends LegacyCollectionOpportunitiesProps {
  /**
   * Adapter configuration
   */
  adapterConfig?: Partial<AdapterConfig>;
  
  /**
   * Force use of legacy component (for rollback)
   */
  forceLegacy?: boolean;
  
  /**
   * Component variant being migrated
   */
  variant?: string;
  
  /**
   * Migration tracking ID
   */
  migrationId?: string;
}

/**
 * Legacy Collection Adapter Component
 * 
 * Provides compatibility between legacy CollectionOpportunities components
 * and the new compound component architecture. Handles prop mapping, state
 * adaptation, and event translation.
 * 
 * @example
 * ```tsx
 * // Direct legacy component replacement
 * <LegacyCollectionAdapter
 *   opportunities={opportunities}
 *   selectedIds={selectedIds}
 *   onSelectionChange={handleSelectionChange}
 *   variant="enhanced"
 *   migrationId="enhanced-to-compound-v1"
 * />
 * 
 * // With split view layout
 * <LegacyCollectionAdapter
 *   opportunities={opportunities}
 *   splitView={true}
 *   bentoLayout={true}
 *   variant="bento"
 * />
 * ```
 */
export const LegacyCollectionAdapter = forwardRef<HTMLDivElement, LegacyCollectionAdapterProps>(({
  // Data props
  opportunities = [],
  selectedIds = [],
  
  // Event handlers
  onSelectionChange,
  onEdit,
  onOverride,
  onBulkAction,
  
  // Configuration
  filterConfig,
  sortConfig,
  viewMode = 'table',
  enableSelection = true,
  enableFiltering = true,
  enableSorting = true,
  enableBulkOperations = false,
  
  // Specialized features
  healthScoring = false,
  realTimeUpdates = false,
  splitViewConfig,
  accessibilityMode = false,
  jtbdAnalytics = false,
  
  // Performance
  virtualizedTable = false,
  memoizedHealthScores = false,
  debouncedSearch = false,
  
  // Layout
  bentoLayout = false,
  splitView = false,
  modalReplacement = false,
  
  // Standard props
  className = '',
  style,
  loading = false,
  error = null,
  
  // Adapter props
  adapterConfig = {},
  forceLegacy = false,
  variant = 'standard',
  migrationId,
  
  // Pass-through
  ...otherProps
}, ref) => {
  // Merge adapter configuration
  const config = useMemo(() => ({
    ...DEFAULT_ADAPTER_CONFIG,
    ...adapterConfig,
    variant
  }), [adapterConfig, variant]);

  // Feature flags
  const useNewCollectionSystem = useFeatureFlag('ENABLE_NEW_COLLECTION_SYSTEM');
  const variantMigrationFlag = useFeatureFlag(`MIGRATE_${variant.toUpperCase()}_VARIANT`);
  const useCompoundComponents = useFeatureFlag('USE_COMPOUND_COMPONENTS');

  // Determine if we should use new or legacy system
  const useNewSystem = useMemo(() => {
    if (forceLegacy) return false;
    if (!useNewCollectionSystem) return false;
    if (!variantMigrationFlag) return false;
    if (!useCompoundComponents) return false;
    return true;
  }, [forceLegacy, useNewCollectionSystem, variantMigrationFlag, useCompoundComponents]);

  // Track migration metrics
  const metricsId = useMemo(() => 
    migrationId || `${variant}-migration-${Date.now()}`,
    [migrationId, variant]
  );

  // Map legacy props to compound component props
  const mappedProps = useMemo((): CollectionProps => {
    const baseProps = mapLegacyProps({
      opportunities,
      selectedIds,
      filterConfig,
      sortConfig,
      viewMode,
      enableSelection,
      enableFiltering,
      enableSorting,
      enableBulkOperations,
      healthScoring,
      realTimeUpdates,
      accessibilityMode,
      jtbdAnalytics,
      virtualizedTable,
      memoizedHealthScores,
      debouncedSearch,
      className,
      style,
      loading,
      error,
      ...otherProps
    });

    return baseProps;
  }, [
    opportunities, selectedIds, filterConfig, sortConfig, viewMode,
    enableSelection, enableFiltering, enableSorting, enableBulkOperations,
    healthScoring, realTimeUpdates, accessibilityMode, jtbdAnalytics,
    virtualizedTable, memoizedHealthScores, debouncedSearch,
    className, style, loading, error, otherProps
  ]);

  // Adapt legacy state to compound component state
  const adaptedState = useMemo(() => 
    adaptLegacyState({
      selectedIds,
      filterConfig,
      sortConfig,
      splitViewConfig
    }),
    [selectedIds, filterConfig, sortConfig, splitViewConfig]
  );

  // Translate legacy events to compound component events
  const translatedEvents = useMemo(() => 
    translateLegacyEvents({
      onSelectionChange,
      onEdit,
      onOverride,
      onBulkAction
    }),
    [onSelectionChange, onEdit, onOverride, onBulkAction]
  );

  // Track component render
  React.useEffect(() => {
    if (config.enableMetrics) {
      trackMigrationMetrics(metricsId, {
        variant,
        useNewSystem,
        opportunitiesCount: opportunities.length,
        selectedCount: selectedIds.length,
        features: {
          healthScoring,
          realTimeUpdates,
          splitView,
          bentoLayout,
          accessibilityMode,
          jtbdAnalytics
        },
        performance: {
          virtualizedTable,
          memoizedHealthScores,
          debouncedSearch
        }
      });
    }
  }, [
    config.enableMetrics, metricsId, variant, useNewSystem,
    opportunities.length, selectedIds.length,
    healthScoring, realTimeUpdates, splitView, bentoLayout,
    accessibilityMode, jtbdAnalytics,
    virtualizedTable, memoizedHealthScores, debouncedSearch
  ]);

  // Error boundary for migration issues
  const [migrationError, setMigrationError] = React.useState<string | null>(null);

  React.useEffect(() => {
    if (error) {
      setMigrationError(error);
    }
  }, [error]);

  // Fallback to legacy component if needed
  if (!useNewSystem || migrationError) {
    if (config.enableFallback) {
      // Return legacy component fallback
      // This would import and render the original legacy component
      console.warn(`LegacyCollectionAdapter: Falling back to legacy component for variant "${variant}"`, {
        useNewSystem,
        migrationError,
        config
      });
      
      // Track fallback usage
      if (config.enableMetrics) {
        trackMigrationMetrics(`${metricsId}-fallback`, {
          variant,
          fallbackReason: migrationError ? 'error' : 'feature-flag',
          error: migrationError
        });
      }
    }
    
    // For now, render error state - in real implementation would render legacy component
    return (
      <div 
        ref={ref}
        className={`legacy-collection-adapter legacy-fallback ${className}`}
        style={style}
      >
        <div className="bp5-non-ideal-state">
          <div className="bp5-non-ideal-state-visual">
            <span className="bp5-icon bp5-icon-warning-sign" />
          </div>
          <h4 className="bp5-heading">Migration Fallback</h4>
          <div className="bp5-non-ideal-state-description">
            {migrationError ? 
              `Migration error: ${migrationError}` : 
              'New system not available, would show legacy component'
            }
          </div>
        </div>
      </div>
    );
  }

  // Render appropriate compound component composition based on variant
  return (
    <div 
      ref={ref}
      className={`legacy-collection-adapter compound-migration ${className}`}
      style={style}
    >
      {renderCompoundComponent({
        variant,
        mappedProps,
        adaptedState,
        translatedEvents,
        config: {
          splitView,
          bentoLayout,
          modalReplacement,
          accessibilityMode,
          jtbdAnalytics,
          healthScoring
        }
      })}
    </div>
  );
});

LegacyCollectionAdapter.displayName = 'LegacyCollectionAdapter';

// =============================================================================
// Compound Component Renderer
// =============================================================================

interface RenderConfig {
  splitView: boolean;
  bentoLayout: boolean;
  modalReplacement: boolean;
  accessibilityMode: boolean;
  jtbdAnalytics: boolean;
  healthScoring: boolean;
}

/**
 * Renders the appropriate compound component composition based on variant and config
 */
function renderCompoundComponent({
  variant,
  mappedProps,
  adaptedState,
  translatedEvents,
  config
}: {
  variant: string;
  mappedProps: CollectionProps;
  adaptedState: any;
  translatedEvents: any;
  config: RenderConfig;
}): React.ReactElement {
  // Base props with translations
  const baseProps = {
    ...mappedProps,
    ...translatedEvents
  };

  // Render based on variant type
  switch (true) {
    // Split view layouts
    case config.splitView || config.bentoLayout:
      return (
        <Collection {...baseProps}>
          <div className="collection-split-layout">
            <div className="collection-main-panel">
              <Collection.Header>
                <Collection.Toolbar />
                <Collection.Filters />
              </Collection.Header>
              <Collection.Grid />
            </div>
            <div className="collection-side-panel">
              <Collection.Actions />
              <Collection.Status />
            </div>
          </div>
        </Collection>
      );

    // Enhanced management interface
    case variant.includes('enhanced') || variant.includes('management'):
      return (
        <Collection 
          {...baseProps}
          enableSelection
          enableFiltering
          enableSorting
          enableBulkOperations
        >
          <Collection.Header>
            <Collection.Toolbar />
            <Collection.Filters />
          </Collection.Header>
          <Collection.Grid />
          <Collection.Footer>
            <Collection.Actions />
            <Collection.Status />
          </Collection.Footer>
        </Collection>
      );

    // Table-focused interfaces
    case variant.includes('table') || variant.includes('grid'):
      return (
        <Collection {...baseProps}>
          <Collection.Header>
            <Collection.Toolbar />
          </Collection.Header>
          <Collection.Grid />
          <Collection.Footer>
            <Collection.Status />
          </Collection.Footer>
        </Collection>
      );

    // Minimal interfaces
    case variant.includes('minimal') || variant.includes('readonly'):
      return (
        <Collection 
          {...baseProps}
          enableSelection={false}
          enableBulkOperations={false}
        >
          <Collection.List />
        </Collection>
      );

    // Standard interface (default)
    default:
      return (
        <Collection {...baseProps}>
          <Collection.Header>
            <Collection.Toolbar />
            <Collection.Filters />
          </Collection.Header>
          <Collection.Grid />
          <Collection.Footer>
            <Collection.Actions />
            <Collection.Status />
          </Collection.Footer>
        </Collection>
      );
  }
}

// =============================================================================
// Variant-Specific Adapters
// =============================================================================

/**
 * Enhanced variant adapter
 */
export const EnhancedCollectionAdapter: React.FC<LegacyCollectionOpportunitiesProps> = (props) => (
  <LegacyCollectionAdapter 
    {...props} 
    variant="enhanced"
    enableBulkOperations={true}
    healthScoring={true}
    realTimeUpdates={true}
  />
);

/**
 * Bento layout adapter
 */
export const BentoCollectionAdapter: React.FC<LegacyCollectionOpportunitiesProps> = (props) => (
  <LegacyCollectionAdapter 
    {...props} 
    variant="bento"
    splitView={true}
    bentoLayout={true}
  />
);

/**
 * Accessible variant adapter
 */
export const AccessibleCollectionAdapter: React.FC<LegacyCollectionOpportunitiesProps> = (props) => (
  <LegacyCollectionAdapter 
    {...props} 
    variant="accessible"
    accessibilityMode={true}
  />
);

/**
 * Performance-optimized adapter
 */
export const PerformanceCollectionAdapter: React.FC<LegacyCollectionOpportunitiesProps> = (props) => (
  <LegacyCollectionAdapter 
    {...props} 
    variant="performance"
    virtualizedTable={true}
    memoizedHealthScores={true}
    debouncedSearch={true}
  />
);

// =============================================================================
// Export Types
// =============================================================================

export type {
  LegacyCollectionOpportunitiesProps,
  LegacyCollectionAdapterProps,
  AdapterConfig
};

// Default export
export default LegacyCollectionAdapter;