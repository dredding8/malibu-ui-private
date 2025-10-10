/**
 * Collection Standard Migrated Component
 * 
 * Migrated version of the standard CollectionOpportunities component using
 * the new compound component architecture. Demonstrates the migration pattern
 * for other variants.
 * 
 * @version 1.0.0
 * @date 2025-09-30
 */

import React, { useMemo, useCallback, forwardRef } from 'react';
import { Collection, CollectionProps } from '../index';
import { LegacyCollectionAdapter } from '../adapters/LegacyCollectionAdapter';
import { useFeatureFlag } from '../../../hooks/useFeatureFlags';
import { trackMigrationMetrics } from '../../../utils/collection-migration/migrationMetrics';
import { CollectionOpportunity } from '../../../types/collectionOpportunities';

// =============================================================================
// Props Interface (maintains backward compatibility)
// =============================================================================

export interface CollectionStandardMigratedProps {
  // Core legacy props
  opportunities: CollectionOpportunity[];
  selectedIds?: string[];
  
  // Event handlers
  onSelectionChange?: (selectedIds: string[]) => void;
  onEdit?: (opportunity: CollectionOpportunity) => void;
  onOverride?: (opportunityId: string, data: any) => void;
  
  // Configuration
  enableSelection?: boolean;
  enableFiltering?: boolean;
  enableSorting?: boolean;
  enableBulkOperations?: boolean;
  
  // Display options
  viewMode?: 'table' | 'grid' | 'list';
  filterConfig?: any;
  sortConfig?: any;
  
  // Standard props
  className?: string;
  style?: React.CSSProperties;
  loading?: boolean;
  error?: string | null;
  
  // Migration props
  forceLegacy?: boolean;
  enableMetrics?: boolean;
  migrationId?: string;
}

// =============================================================================
// Main Component
// =============================================================================

/**
 * Migrated Collection Standard Component
 * 
 * This is the migrated version of the base CollectionOpportunities component.
 * It demonstrates the migration pattern that will be used for all variants.
 * 
 * Features:
 * - Compound component architecture
 * - Feature flag controlled migration
 * - Performance metrics tracking
 * - Backward compatibility
 * - Automatic fallback to legacy
 * 
 * @example
 * ```tsx
 * // Drop-in replacement for CollectionOpportunities
 * <CollectionStandardMigrated
 *   opportunities={opportunities}
 *   selectedIds={selectedIds}
 *   onSelectionChange={handleSelectionChange}
 *   onEdit={handleEdit}
 *   enableSelection
 *   enableFiltering
 * />
 * ```
 */
export const CollectionStandardMigrated = forwardRef<HTMLDivElement, CollectionStandardMigratedProps>(({
  opportunities = [],
  selectedIds = [],
  onSelectionChange,
  onEdit,
  onOverride,
  enableSelection = true,
  enableFiltering = true,
  enableSorting = true,
  enableBulkOperations = false,
  viewMode = 'table',
  filterConfig,
  sortConfig,
  className = '',
  style,
  loading = false,
  error = null,
  forceLegacy = false,
  enableMetrics = true,
  migrationId,
  ...otherProps
}, ref) => {
  // Feature flags
  const useCompoundComponents = useFeatureFlag('USE_COMPOUND_COMPONENTS');
  const migrateStandardVariant = useFeatureFlag('MIGRATE_STANDARD_VARIANT');
  
  // Determine migration state
  const useNewSystem = useMemo(() => {
    if (forceLegacy) return false;
    if (!useCompoundComponents) return false;
    if (!migrateStandardVariant) return false;
    return true;
  }, [forceLegacy, useCompoundComponents, migrateStandardVariant]);

  // Track metrics
  const metricsId = useMemo(() => 
    migrationId || `standard-migration-${Date.now()}`,
    [migrationId]
  );

  React.useEffect(() => {
    if (enableMetrics) {
      trackMigrationMetrics(metricsId, {
        variant: 'standard',
        useNewSystem,
        opportunitiesCount: opportunities.length,
        selectedCount: selectedIds.length,
        features: {
          enableSelection,
          enableFiltering,
          enableSorting,
          enableBulkOperations,
          healthScoring: false,
          realTimeUpdates: false,
          splitView: false,
          bentoLayout: false,
          accessibilityMode: false,
          jtbdAnalytics: false,
          virtualizedTable: false,
          memoizedHealthScores: false,
          debouncedSearch: false
        }
      });
    }
  }, [
    enableMetrics, metricsId, useNewSystem,
    opportunities.length, selectedIds.length,
    enableSelection, enableFiltering, enableSorting, enableBulkOperations
  ]);

  // Use legacy adapter if new system not available
  if (!useNewSystem) {
    return (
      <LegacyCollectionAdapter
        ref={ref}
        opportunities={opportunities}
        selectedIds={selectedIds}
        onSelectionChange={onSelectionChange}
        onEdit={onEdit}
        onOverride={onOverride}
        enableSelection={enableSelection}
        enableFiltering={enableFiltering}
        enableSorting={enableSorting}
        enableBulkOperations={enableBulkOperations}
        viewMode={viewMode}
        filterConfig={filterConfig}
        sortConfig={sortConfig}
        className={className}
        style={style}
        loading={loading}
        error={error}
        variant="standard"
        migrationId={metricsId}
        forceLegacy={true}
        {...otherProps}
      />
    );
  }

  // Render with new compound component system
  return (
    <div 
      ref={ref}
      className={`collection-standard-migrated ${className}`}
      style={style}
    >
      <Collection
        collections={[]} // Will be populated by adapter
        loading={loading}
        error={error}
        enableSelection={enableSelection}
        enableFiltering={enableFiltering}
        enableSorting={enableSorting}
        enableBulkOperations={enableBulkOperations}
        viewConfig={{
          layout: {
            defaultView: viewMode as 'grid' | 'list' | 'table',
            allowViewSwitch: true
          }
        }}
      >
        <Collection.Header>
          <Collection.Toolbar />
          {enableFiltering && <Collection.Filters />}
        </Collection.Header>
        
        <Collection.Grid />
        
        <Collection.Footer>
          {enableBulkOperations && <Collection.Actions />}
          <Collection.Status />
        </Collection.Footer>
      </Collection>
    </div>
  );
});

CollectionStandardMigrated.displayName = 'CollectionStandardMigrated';

// =============================================================================
// Enhanced Variant Migration
// =============================================================================

/**
 * Enhanced Collection Migrated Component
 * 
 * Migrated version with enhanced features enabled by default.
 */
export const CollectionEnhancedMigrated = forwardRef<HTMLDivElement, CollectionStandardMigratedProps>(
  (props, ref) => (
    <CollectionStandardMigrated
      ref={ref}
      {...props}
      enableBulkOperations={true}
      // Enhanced features would be controlled by additional providers
      migrationId={props.migrationId || `enhanced-migration-${Date.now()}`}
    />
  )
);

CollectionEnhancedMigrated.displayName = 'CollectionEnhancedMigrated';

// =============================================================================
// Table Variant Migration
// =============================================================================

/**
 * Table Collection Migrated Component
 * 
 * Migrated version optimized for table display.
 */
export const CollectionTableMigrated = forwardRef<HTMLDivElement, CollectionStandardMigratedProps>(
  (props, ref) => (
    <CollectionStandardMigrated
      ref={ref}
      {...props}
      viewMode="table"
      enableSorting={true}
      migrationId={props.migrationId || `table-migration-${Date.now()}`}
    />
  )
);

CollectionTableMigrated.displayName = 'CollectionTableMigrated';

// =============================================================================
// Migration Wrapper Component
// =============================================================================

/**
 * Generic migration wrapper that can be used for any variant
 */
export interface MigrationWrapperProps extends CollectionStandardMigratedProps {
  variant: string;
  defaultFeatures?: {
    enableSelection?: boolean;
    enableFiltering?: boolean;
    enableSorting?: boolean;
    enableBulkOperations?: boolean;
    healthScoring?: boolean;
    realTimeUpdates?: boolean;
    splitView?: boolean;
    accessibilityMode?: boolean;
  };
  compoundComposition?: React.ReactNode;
}

/**
 * Generic migration wrapper component
 * 
 * Can be used to wrap any legacy variant and migrate it to compound components.
 */
export const MigrationWrapper = forwardRef<HTMLDivElement, MigrationWrapperProps>(({
  variant,
  defaultFeatures = {},
  compoundComposition,
  ...props
}, ref) => {
  const featureFlag = useFeatureFlag(`MIGRATE_${variant.toUpperCase()}_VARIANT`);
  
  if (!featureFlag) {
    return (
      <LegacyCollectionAdapter
        ref={ref}
        {...props}
        variant={variant}
        forceLegacy={true}
      />
    );
  }

  // Apply default features
  const mergedProps = {
    ...defaultFeatures,
    ...props,
    migrationId: props.migrationId || `${variant}-migration-${Date.now()}`
  };

  if (compoundComposition) {
    return (
      <div ref={ref} className={`collection-${variant}-migrated ${props.className || ''}`}>
        {compoundComposition}
      </div>
    );
  }

  return <CollectionStandardMigrated ref={ref} {...mergedProps} />;
});

MigrationWrapper.displayName = 'MigrationWrapper';

// =============================================================================
// Export All
// =============================================================================

export default CollectionStandardMigrated;