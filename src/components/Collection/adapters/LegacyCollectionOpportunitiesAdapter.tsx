/**
 * Legacy Collection Opportunities Adapter
 *
 * Provides backward compatibility for legacy CollectionOpportunities components
 * during the migration to the unified Collection compound component system.
 *
 * @deprecated This adapter will be removed after migration is complete.
 * Use the new <Collection /> component directly instead.
 *
 * @version 1.0.0
 * @date 2025-09-30
 */

import React, { useMemo } from 'react';
import { Collection } from '../index';
import { Collection as CollectionType } from '../../../types/collection.types';

// =============================================================================
// Legacy Props Interface
// =============================================================================

export interface LegacyCollectionOpportunitiesProps {
  /** Legacy: opportunities array */
  opportunities?: any[];
  /** Legacy: data prop (alternative to opportunities) */
  data?: any[];
  /** Legacy: enable quick edit functionality */
  enableQuickEdit?: boolean;
  /** Legacy: enable bulk operations */
  enableBulkOperations?: boolean;
  /** Legacy: view mode (table, grid, bento) */
  viewMode?: 'table' | 'grid' | 'bento' | 'split';
  /** Legacy: layout variant */
  variant?: 'standard' | 'enhanced' | 'bento' | 'split' | 'accessible';
  /** Legacy: on edit callback */
  onEdit?: (id: string, data: any) => void;
  /** Legacy: on delete callback */
  onDelete?: (id: string) => void;
  /** Legacy: on reallocate callback */
  onReallocate?: (ids: string[]) => void;
  /** Legacy: custom class name */
  className?: string;
  /** Legacy: loading state */
  loading?: boolean;
  /** Legacy: error message */
  error?: string;
  /** Any other legacy props */
  [key: string]: any;
}

// =============================================================================
// Adapter Component
// =============================================================================

/**
 * Adapter component that maps legacy CollectionOpportunities props
 * to the new Collection compound component API
 */
export const LegacyCollectionOpportunitiesAdapter: React.FC<LegacyCollectionOpportunitiesProps> = ({
  // Legacy props
  opportunities,
  data,
  enableQuickEdit = false,
  enableBulkOperations = false,
  viewMode = 'table',
  variant = 'standard',
  onEdit,
  onDelete,
  onReallocate,
  className = '',
  loading = false,
  error,
  ...rest
}) => {
  // Show deprecation warning in development
  if (process.env.NODE_ENV === 'development') {
    console.warn(
      '⚠️ LegacyCollectionOpportunitiesAdapter is deprecated. ' +
      'Please migrate to the new <Collection /> component. ' +
      'See: src/components/COMPONENT_MIGRATION_GUIDE.md'
    );
  }

  // Transform legacy data to new format
  const collections = useMemo((): CollectionType[] => {
    const sourceData = opportunities || data || [];

    // If data is already in new format, return as-is
    if (sourceData.length === 0) return [];

    // Transform legacy opportunity format to collection format
    return sourceData.map((item: any) => ({
      id: item.id || item.opportunityId,
      name: item.name || item.opportunityName,
      type: item.type || 'opportunity',
      status: item.status || 'pending',
      createdAt: item.createdDate || new Date(),
      updatedAt: item.lastModified || new Date(),
      metadata: {
        satellite: item.satellite,
        sites: item.sites,
        priority: item.priority,
        capacity: item.capacity,
        matchStatus: item.matchStatus,
        ...item.metadata,
      },
      ...item,
    }));
  }, [opportunities, data]);

  // Map view mode to new system
  const viewConfig = useMemo(() => {
    const modeMap: Record<string, 'grid' | 'list' | 'table'> = {
      table: 'list',
      grid: 'grid',
      bento: 'grid',
      split: 'list',
    };

    return {
      mode: modeMap[viewMode] || 'list',
      density: variant === 'enhanced' ? 'comfortable' : 'compact',
    };
  }, [viewMode, variant]);

  // Determine layout based on variant
  const getLayoutComponent = () => {
    switch (variant) {
      case 'bento':
        return (
          <>
            <Collection.Header />
            <Collection.Toolbar />
            <Collection.Grid itemSize="large" />
            <Collection.Footer />
          </>
        );

      case 'split':
        return (
          <>
            <Collection.Header />
            <Collection.Toolbar />
            <div className="split-view-layout">
              <Collection.List />
            </div>
            <Collection.Footer />
          </>
        );

      case 'accessible':
      case 'enhanced':
      case 'standard':
      default:
        return (
          <>
            <Collection.Header />
            <Collection.Toolbar />
            <Collection.Grid />
            <Collection.Footer />
          </>
        );
    }
  };

  // Render new Collection component with adapted props
  return (
    <div className={`legacy-collection-adapter ${className}`} data-adapter="legacy">
      <Collection
        collections={collections}
        loading={loading}
        error={error}
        viewConfig={viewConfig}
        enableSelection={enableBulkOperations}
        enableFiltering={true}
        enableSorting={true}
        enableBulkOperations={enableBulkOperations}
        {...rest}
      >
        {getLayoutComponent()}
      </Collection>
    </div>
  );
};

// Export with deprecation notice
export default LegacyCollectionOpportunitiesAdapter;

/**
 * @deprecated Use <Collection /> directly
 *
 * Migration example:
 *
 * BEFORE:
 * ```tsx
 * <CollectionOpportunities
 *   opportunities={data}
 *   enableBulkOperations={true}
 *   viewMode="grid"
 * />
 * ```
 *
 * AFTER:
 * ```tsx
 * <Collection
 *   collections={data}
 *   enableBulkOperations={true}
 *   viewConfig={{ mode: 'grid' }}
 * >
 *   <Collection.Header />
 *   <Collection.Toolbar />
 *   <Collection.Grid />
 *   <Collection.Footer />
 * </Collection>
 * ```
 */
