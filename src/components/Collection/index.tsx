/**
 * Collection Compound Component System
 * 
 * Root compound component that orchestrates the entire collection management
 * interface with a flexible, composable architecture.
 * 
 * @version 1.0.0
 * @date 2025-09-30
 */

import React, { forwardRef } from 'react';
import { CollectionProvider, useCollectionContext } from './CollectionProvider';
import { CollectionGrid } from './CollectionGrid';
import { CollectionList } from './CollectionList';
import { CollectionItem } from './CollectionItem';
import { CollectionEmpty } from './CollectionEmpty';
import { CollectionHeader } from './CollectionHeader';
import { CollectionFooter } from './CollectionFooter';
import { CollectionToolbar } from './CollectionToolbar';
import { CollectionFilters } from './CollectionFilters';
import { CollectionActions } from './CollectionActions';
import { CollectionStatus } from './CollectionStatus';
import { Collection as CollectionType, CollectionViewConfig } from '../../types/collection.types';
import { useFeatureFlag } from '../../hooks/useFeatureFlags';

// =============================================================================
// Root Component Props
// =============================================================================

export interface CollectionProps {
  /** Collections to display */
  collections?: CollectionType[];
  /** Loading state */
  loading?: boolean;
  /** Error state */
  error?: string | null;
  /** View configuration */
  viewConfig?: Partial<CollectionViewConfig>;
  /** Enable real-time updates */
  enableRealtime?: boolean;
  /** Enable selection */
  enableSelection?: boolean;
  /** Enable filtering */
  enableFiltering?: boolean;
  /** Enable sorting */
  enableSorting?: boolean;
  /** Enable bulk operations */
  enableBulkOperations?: boolean;
  /** Custom empty state component */
  emptyComponent?: React.ComponentType;
  /** Custom loading component */
  loadingComponent?: React.ComponentType;
  /** Custom error component */
  errorComponent?: React.ComponentType<{ error: string }>;
  /** Custom class name */
  className?: string;
  /** Custom styles */
  style?: React.CSSProperties;
  /** Additional props */
  [key: string]: any;
}

// =============================================================================
// Main Collection Component
// =============================================================================

/**
 * Main Collection compound component
 * 
 * Provides a complete collection management interface with all sub-components
 * available as properties for flexible composition.
 * 
 * @example
 * ```tsx
 * // Full interface with all features
 * <Collection
 *   collections={collections}
 *   enableSelection
 *   enableFiltering
 *   enableBulkOperations
 * >
 *   <Collection.Header>
 *     <Collection.Toolbar />
 *     <Collection.Filters />
 *   </Collection.Header>
 *   
 *   <Collection.Grid>
 *     <Collection.Item />
 *   </Collection.Grid>
 *   
 *   <Collection.Footer>
 *     <Collection.Actions />
 *     <Collection.Status />
 *   </Collection.Footer>
 * </Collection>
 * 
 * // Minimal interface
 * <Collection collections={collections}>
 *   <Collection.List />
 * </Collection>
 * 
 * // Custom composition
 * <Collection>
 *   <MyCustomHeader />
 *   <Collection.Grid itemSize="large" />
 *   <MyCustomFooter />
 * </Collection>
 * ```
 */
export const Collection = forwardRef<HTMLDivElement, CollectionProps>(({
  collections,
  loading = false,
  error = null,
  viewConfig,
  enableRealtime = true,
  enableSelection = true,
  enableFiltering = true,
  enableSorting = true,
  enableBulkOperations = true,
  emptyComponent,
  loadingComponent,
  errorComponent,
  className = '',
  style,
  children,
  ...props
}, ref) => {
  // Feature flags
  const useEnhancedComponents = useFeatureFlag('USE_ENHANCED_BENTO');
  const useNewCollectionSystem = useFeatureFlag('ENABLE_NEW_COLLECTION_SYSTEM');

  // Render loading state
  if (loading) {
    if (loadingComponent) {
      const LoadingComponent = loadingComponent;
      return <LoadingComponent />;
    }
    
    return (
      <div 
        ref={ref}
        className={`collection-container collection-loading ${className}`}
        style={style}
        {...props}
      >
        <div className="collection-loading-spinner">
          <div className="bp5-spinner bp5-large">
            <svg width="50" height="50" viewBox="0 0 100 100">
              <path
                className="bp5-spinner-track"
                d="M 50,50 m 0,-44.5 a 44.5,44.5 0 1 1 0,89 a 44.5,44.5 0 1 1 0,-89"
              />
              <path
                className="bp5-spinner-head"
                d="M 50,50 m 0,-44.5 a 44.5,44.5 0 1 1 0,89 a 44.5,44.5 0 1 1 0,-89"
                pathLength="280"
                strokeDasharray="210 70"
                strokeDashoffset="0"
              />
            </svg>
          </div>
          <div className="collection-loading-text">Loading collections...</div>
        </div>
      </div>
    );
  }

  // Render error state
  if (error) {
    if (errorComponent) {
      const ErrorComponent = errorComponent;
      return <ErrorComponent error={error} />;
    }

    return (
      <div 
        ref={ref}
        className={`collection-container collection-error ${className}`}
        style={style}
        {...props}
      >
        <div className="collection-error-content">
          <div className="bp5-non-ideal-state">
            <div className="bp5-non-ideal-state-visual">
              <span className="bp5-icon bp5-icon-error" />
            </div>
            <h4 className="bp5-heading">Error Loading Collections</h4>
            <div className="bp5-non-ideal-state-description">
              {error}
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Render empty state
  if (!collections || collections.length === 0) {
    if (emptyComponent) {
      const EmptyComponent = emptyComponent;
      return <EmptyComponent />;
    }

    return (
      <div 
        ref={ref}
        className={`collection-container collection-empty ${className}`}
        style={style}
        {...props}
      >
        <CollectionProvider
          collections={collections || []}
          viewConfig={viewConfig}
          enableRealtime={enableRealtime}
          enableSelection={enableSelection}
          enableFiltering={enableFiltering}
          enableSorting={enableSorting}
          enableBulkOperations={enableBulkOperations}
        >
          <CollectionEmpty />
        </CollectionProvider>
      </div>
    );
  }

  // Render main interface
  return (
    <div 
      ref={ref}
      className={`collection-container ${useEnhancedComponents ? 'enhanced' : 'standard'} ${className}`}
      style={style}
      {...props}
    >
      <CollectionProvider
        collections={collections}
        viewConfig={viewConfig}
        enableRealtime={enableRealtime}
        enableSelection={enableSelection}
        enableFiltering={enableFiltering}
        enableSorting={enableSorting}
        enableBulkOperations={enableBulkOperations}
      >
        {children}
      </CollectionProvider>
    </div>
  );
});

Collection.displayName = 'Collection';

// =============================================================================
// Compound Component Pattern
// =============================================================================

// Attach sub-components as static properties
Collection.Provider = CollectionProvider;
Collection.Grid = CollectionGrid;
Collection.List = CollectionList;
Collection.Item = CollectionItem;
Collection.Empty = CollectionEmpty;
Collection.Header = CollectionHeader;
Collection.Footer = CollectionFooter;
Collection.Toolbar = CollectionToolbar;
Collection.Filters = CollectionFilters;
Collection.Actions = CollectionActions;
Collection.Status = CollectionStatus;

// =============================================================================
// Pre-composed Layouts
// =============================================================================

/**
 * Standard collection interface with all features
 */
export const CollectionStandard: React.FC<CollectionProps> = (props) => (
  <Collection {...props}>
    <Collection.Header>
      <Collection.Toolbar />
      <Collection.Filters />
    </Collection.Header>
    
    <Collection.Grid>
      <Collection.Item />
    </Collection.Grid>
    
    <Collection.Footer>
      <Collection.Actions />
      <Collection.Status />
    </Collection.Footer>
  </Collection>
);

/**
 * Minimal collection interface for simple displays
 */
export const CollectionMinimal: React.FC<CollectionProps> = (props) => (
  <Collection {...props}>
    <Collection.List />
  </Collection>
);

/**
 * Full-featured collection interface for management
 */
export const CollectionManagement: React.FC<CollectionProps> = (props) => (
  <Collection 
    {...props}
    enableSelection
    enableFiltering
    enableSorting
    enableBulkOperations
  >
    <Collection.Header>
      <Collection.Toolbar />
      <Collection.Filters />
    </Collection.Header>
    
    <Collection.Grid>
      <Collection.Item />
    </Collection.Grid>
    
    <Collection.Footer>
      <Collection.Actions />
      <Collection.Status />
    </Collection.Footer>
  </Collection>
);

/**
 * Read-only collection interface for viewing
 */
export const CollectionReadOnly: React.FC<CollectionProps> = (props) => (
  <Collection 
    {...props}
    enableSelection={false}
    enableFiltering={false}
    enableBulkOperations={false}
  >
    <Collection.Header>
      <Collection.Toolbar />
    </Collection.Header>
    
    <Collection.Grid>
      <Collection.Item />
    </Collection.Grid>
    
    <Collection.Footer>
      <Collection.Status />
    </Collection.Footer>
  </Collection>
);

// =============================================================================
// Hook for accessing collection context
// =============================================================================

/**
 * Hook to access collection context from any child component
 * 
 * @example
 * ```tsx
 * const MyCustomComponent = () => {
 *   const {
 *     collections,
 *     selectedCollections,
 *     viewMode,
 *     selectCollection,
 *     deleteCollection
 *   } = useCollection();
 *   
 *   return (
 *     <div>
 *       {collections.map(collection => (
 *         <div key={collection.id}>
 *           {collection.name}
 *           <button onClick={() => selectCollection(collection.id)}>
 *             Select
 *           </button>
 *         </div>
 *       ))}
 *     </div>
 *   );
 * };
 * ```
 */
export const useCollection = useCollectionContext;

// =============================================================================
// Export Types
// =============================================================================

export type {
  CollectionProps,
};

// Export sub-components for direct import
export {
  CollectionProvider,
  CollectionGrid,
  CollectionList,
  CollectionItem,
  CollectionEmpty,
  CollectionHeader,
  CollectionFooter,
  CollectionToolbar,
  CollectionFilters,
  CollectionActions,
  CollectionStatus,
};

// Default export
export default Collection;