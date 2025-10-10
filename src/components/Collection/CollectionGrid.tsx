/**
 * Collection Grid Component
 * 
 * Grid layout component for displaying collections with responsive design,
 * virtualization support, and customizable item sizing.
 * 
 * @version 1.0.0
 * @date 2025-09-30
 */

import React, { useMemo, useCallback, useRef, useEffect } from 'react';
import { useCollectionContext } from './CollectionProvider';
import { CollectionItem } from './CollectionItem';
import { Collection } from '../../types/collection.types';
import { useFeatureFlag } from '../../hooks/useFeatureFlags';
import './CollectionGrid.css';

// =============================================================================
// Component Props
// =============================================================================

export interface CollectionGridProps {
  /** Custom collection item component */
  itemComponent?: React.ComponentType<{ collection: Collection; index: number }>;
  /** Items per row (responsive by default) */
  itemsPerRow?: number | 'auto';
  /** Item size */
  itemSize?: 'small' | 'medium' | 'large' | 'auto';
  /** Grid gap */
  gap?: number;
  /** Enable virtualization for large datasets */
  enableVirtualization?: boolean;
  /** Minimum item width for responsive layout */
  minItemWidth?: number;
  /** Maximum item width for responsive layout */
  maxItemWidth?: number;
  /** Enable infinite scroll */
  enableInfiniteScroll?: boolean;
  /** Load more threshold (pixels from bottom) */
  loadMoreThreshold?: number;
  /** Custom empty state component */
  emptyComponent?: React.ComponentType;
  /** Custom loading component */
  loadingComponent?: React.ComponentType;
  /** Custom class name */
  className?: string;
  /** Custom styles */
  style?: React.CSSProperties;
  /** Accessibility label */
  'aria-label'?: string;
  /** Event handlers */
  onItemClick?: (collection: Collection, event: React.MouseEvent) => void;
  onItemDoubleClick?: (collection: Collection, event: React.MouseEvent) => void;
  onItemSelect?: (collection: Collection, selected: boolean) => void;
  onLoadMore?: () => Promise<void>;
}

// =============================================================================
// Grid Item Size Configuration
// =============================================================================

const ITEM_SIZES = {
  small: { width: 200, height: 150 },
  medium: { width: 280, height: 200 },
  large: { width: 360, height: 250 },
  auto: { width: 'auto', height: 'auto' },
} as const;

const DEFAULT_GAPS = {
  small: 12,
  medium: 16,
  large: 20,
} as const;

// =============================================================================
// Responsive Helper Functions
// =============================================================================

const calculateItemsPerRow = (
  containerWidth: number,
  itemWidth: number,
  gap: number,
  minItems: number = 1,
  maxItems: number = 12
): number => {
  if (itemWidth === 'auto') return maxItems;
  
  const availableWidth = containerWidth - gap;
  const itemWithGap = (itemWidth as number) + gap;
  const calculatedItems = Math.floor(availableWidth / itemWithGap);
  
  return Math.max(minItems, Math.min(maxItems, calculatedItems));
};

const calculateResponsiveItemWidth = (
  containerWidth: number,
  itemsPerRow: number,
  gap: number
): number => {
  const totalGaps = (itemsPerRow - 1) * gap;
  return Math.floor((containerWidth - totalGaps) / itemsPerRow);
};

// =============================================================================
// Virtual Scrolling Implementation
// =============================================================================

interface VirtualizedGridProps {
  collections: Collection[];
  itemsPerRow: number;
  itemHeight: number;
  gap: number;
  containerHeight: number;
  renderItem: (collection: Collection, index: number) => React.ReactNode;
}

const VirtualizedGrid: React.FC<VirtualizedGridProps> = ({
  collections,
  itemsPerRow,
  itemHeight,
  gap,
  containerHeight,
  renderItem,
}) => {
  const [scrollTop, setScrollTop] = React.useState(0);
  const scrollElementRef = useRef<HTMLDivElement>(null);

  const rowHeight = itemHeight + gap;
  const totalRows = Math.ceil(collections.length / itemsPerRow);
  const totalHeight = totalRows * rowHeight;

  const visibleRowStart = Math.floor(scrollTop / rowHeight);
  const visibleRowEnd = Math.min(
    visibleRowStart + Math.ceil(containerHeight / rowHeight) + 1,
    totalRows
  );

  const visibleItems = useMemo(() => {
    const items: Array<{ collection: Collection; index: number; row: number; col: number }> = [];
    
    for (let row = visibleRowStart; row < visibleRowEnd; row++) {
      for (let col = 0; col < itemsPerRow; col++) {
        const index = row * itemsPerRow + col;
        if (index < collections.length) {
          items.push({
            collection: collections[index],
            index,
            row,
            col,
          });
        }
      }
    }
    
    return items;
  }, [collections, visibleRowStart, visibleRowEnd, itemsPerRow]);

  const handleScroll = useCallback((event: React.UIEvent<HTMLDivElement>) => {
    setScrollTop(event.currentTarget.scrollTop);
  }, []);

  return (
    <div
      ref={scrollElementRef}
      className="collection-grid-virtual-container"
      style={{ height: containerHeight, overflow: 'auto' }}
      onScroll={handleScroll}
    >
      <div
        className="collection-grid-virtual-content"
        style={{ height: totalHeight, position: 'relative' }}
      >
        {visibleItems.map(({ collection, index, row, col }) => (
          <div
            key={collection.id}
            className="collection-grid-virtual-item"
            style={{
              position: 'absolute',
              top: row * rowHeight,
              left: col * (calculateResponsiveItemWidth(scrollElementRef.current?.clientWidth || 0, itemsPerRow, gap) + gap),
              width: calculateResponsiveItemWidth(scrollElementRef.current?.clientWidth || 0, itemsPerRow, gap),
              height: itemHeight,
            }}
          >
            {renderItem(collection, index)}
          </div>
        ))}
      </div>
    </div>
  );
};

// =============================================================================
// Main Grid Component
// =============================================================================

/**
 * Collection grid component with responsive layout and virtualization
 * 
 * @example
 * ```tsx
 * // Basic usage
 * <CollectionGrid />
 * 
 * // Custom configuration
 * <CollectionGrid
 *   itemSize="large"
 *   itemsPerRow={3}
 *   gap={20}
 *   enableVirtualization
 *   onItemClick={handleItemClick}
 * />
 * 
 * // Custom item component
 * <CollectionGrid
 *   itemComponent={CustomCollectionCard}
 *   enableInfiniteScroll
 *   onLoadMore={handleLoadMore}
 * />
 * ```
 */
export const CollectionGrid: React.FC<CollectionGridProps> = ({
  itemComponent: CustomItem,
  itemsPerRow = 'auto',
  itemSize = 'medium',
  gap,
  enableVirtualization = false,
  minItemWidth = 200,
  maxItemWidth = 400,
  enableInfiniteScroll = false,
  loadMoreThreshold = 200,
  emptyComponent,
  loadingComponent,
  className = '',
  style,
  'aria-label': ariaLabel,
  onItemClick,
  onItemDoubleClick,
  onItemSelect,
  onLoadMore,
}) => {
  // =============================================================================
  // Context and State
  // =============================================================================

  const {
    filteredCollections,
    loading,
    viewConfig,
    isSelected,
    toggleSelection,
    features,
  } = useCollectionContext();

  const enableVirtualizationFeature = useFeatureFlag('ENABLE_VIRTUALIZED_TABLE');
  const useVirtualization = enableVirtualization && enableVirtualizationFeature;

  const gridRef = useRef<HTMLDivElement>(null);
  const [containerDimensions, setContainerDimensions] = React.useState({ width: 0, height: 0 });

  // =============================================================================
  // Configuration
  // =============================================================================

  const itemSizeConfig = useMemo(() => {
    if (itemSize === 'auto') {
      return { width: 'auto', height: 'auto' };
    }
    return ITEM_SIZES[itemSize];
  }, [itemSize]);

  const gridGap = useMemo(() => {
    if (gap !== undefined) return gap;
    if (itemSize === 'auto') return DEFAULT_GAPS.medium;
    return DEFAULT_GAPS[itemSize];
  }, [gap, itemSize]);

  const actualItemsPerRow = useMemo(() => {
    if (itemsPerRow !== 'auto') return itemsPerRow;
    if (containerDimensions.width === 0 || itemSizeConfig.width === 'auto') return 4;
    
    return calculateItemsPerRow(
      containerDimensions.width,
      itemSizeConfig.width as number,
      gridGap,
      1,
      8
    );
  }, [itemsPerRow, containerDimensions.width, itemSizeConfig.width, gridGap]);

  const responsiveItemWidth = useMemo(() => {
    if (itemSizeConfig.width !== 'auto') return itemSizeConfig.width;
    if (containerDimensions.width === 0) return minItemWidth;
    
    return calculateResponsiveItemWidth(containerDimensions.width, actualItemsPerRow, gridGap);
  }, [itemSizeConfig.width, containerDimensions.width, actualItemsPerRow, gridGap, minItemWidth]);

  // =============================================================================
  // Effects
  // =============================================================================

  // Measure container dimensions
  useEffect(() => {
    if (!gridRef.current) return;

    const resizeObserver = new ResizeObserver((entries) => {
      const { width, height } = entries[0].contentRect;
      setContainerDimensions({ width, height });
    });

    resizeObserver.observe(gridRef.current);

    return () => {
      resizeObserver.disconnect();
    };
  }, []);

  // Infinite scroll implementation
  useEffect(() => {
    if (!enableInfiniteScroll || !onLoadMore || !gridRef.current) return;

    const handleScroll = () => {
      if (!gridRef.current) return;

      const { scrollTop, scrollHeight, clientHeight } = gridRef.current;
      const distanceFromBottom = scrollHeight - scrollTop - clientHeight;

      if (distanceFromBottom < loadMoreThreshold) {
        onLoadMore();
      }
    };

    const gridElement = gridRef.current;
    gridElement.addEventListener('scroll', handleScroll);

    return () => {
      gridElement.removeEventListener('scroll', handleScroll);
    };
  }, [enableInfiniteScroll, onLoadMore, loadMoreThreshold]);

  // =============================================================================
  // Event Handlers
  // =============================================================================

  const handleItemClick = useCallback((collection: Collection, event: React.MouseEvent) => {
    onItemClick?.(collection, event);
  }, [onItemClick]);

  const handleItemDoubleClick = useCallback((collection: Collection, event: React.MouseEvent) => {
    onItemDoubleClick?.(collection, event);
  }, [onItemDoubleClick]);

  const handleItemSelect = useCallback((collection: Collection) => {
    if (!features.enableSelection) return;

    const selected = !isSelected(collection.id);
    toggleSelection(collection.id);
    onItemSelect?.(collection, selected);
  }, [features.enableSelection, isSelected, toggleSelection, onItemSelect]);

  // =============================================================================
  // Render Functions
  // =============================================================================

  const renderItem = useCallback((collection: Collection, index: number) => {
    const ItemComponent = CustomItem || CollectionItem;
    
    return (
      <ItemComponent
        key={collection.id}
        collection={collection}
        index={index}
        selected={isSelected(collection.id)}
        onSelect={() => handleItemSelect(collection)}
        onClick={(event) => handleItemClick(collection, event)}
        onDoubleClick={(event) => handleItemDoubleClick(collection, event)}
        style={{
          width: responsiveItemWidth,
          height: itemSizeConfig.height,
        }}
      />
    );
  }, [
    CustomItem,
    isSelected,
    handleItemSelect,
    handleItemClick,
    handleItemDoubleClick,
    responsiveItemWidth,
    itemSizeConfig.height,
  ]);

  const renderEmptyState = useCallback(() => {
    if (emptyComponent) {
      const EmptyComponent = emptyComponent;
      return <EmptyComponent />;
    }

    return (
      <div className="collection-grid-empty">
        <div className="bp5-non-ideal-state">
          <div className="bp5-non-ideal-state-visual">
            <span className="bp5-icon bp5-icon-folder-open" />
          </div>
          <h4 className="bp5-heading">No Collections Found</h4>
          <div className="bp5-non-ideal-state-description">
            {filteredCollections.length === 0 && loading.collections
              ? 'Loading collections...'
              : 'No collections match your current filter criteria.'}
          </div>
        </div>
      </div>
    );
  }, [emptyComponent, filteredCollections.length, loading.collections]);

  const renderLoadingState = useCallback(() => {
    if (loadingComponent) {
      const LoadingComponent = loadingComponent;
      return <LoadingComponent />;
    }

    return (
      <div className="collection-grid-loading">
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
      </div>
    );
  }, [loadingComponent]);

  // =============================================================================
  // Render
  // =============================================================================

  // Loading state
  if (loading.collections && filteredCollections.length === 0) {
    return renderLoadingState();
  }

  // Empty state
  if (filteredCollections.length === 0) {
    return renderEmptyState();
  }

  // Grid layout styles
  const gridStyles: React.CSSProperties = {
    ...style,
    '--grid-gap': `${gridGap}px`,
    '--items-per-row': actualItemsPerRow,
    '--item-width': responsiveItemWidth === 'auto' ? 'auto' : `${responsiveItemWidth}px`,
    '--item-height': itemSizeConfig.height === 'auto' ? 'auto' : `${itemSizeConfig.height}px`,
  } as React.CSSProperties;

  // Virtualized rendering
  if (useVirtualization && containerDimensions.height > 0) {
    return (
      <div
        ref={gridRef}
        className={`collection-grid virtualized ${viewConfig.density} ${className}`}
        style={gridStyles}
        aria-label={ariaLabel || 'Collection grid'}
        role="grid"
      >
        <VirtualizedGrid
          collections={filteredCollections}
          itemsPerRow={actualItemsPerRow}
          itemHeight={itemSizeConfig.height as number}
          gap={gridGap}
          containerHeight={containerDimensions.height}
          renderItem={renderItem}
        />
      </div>
    );
  }

  // Standard rendering
  return (
    <div
      ref={gridRef}
      className={`collection-grid standard ${viewConfig.density} ${className}`}
      style={gridStyles}
      aria-label={ariaLabel || 'Collection grid'}
      role="grid"
    >
      <div className="collection-grid-content">
        {filteredCollections.map((collection, index) => (
          <div
            key={collection.id}
            className="collection-grid-item-wrapper"
            role="gridcell"
          >
            {renderItem(collection, index)}
          </div>
        ))}
      </div>
      
      {loading.collections && (
        <div className="collection-grid-loading-more">
          <div className="bp5-spinner bp5-small" />
          <span>Loading more collections...</span>
        </div>
      )}
    </div>
  );
};

// =============================================================================
// Default Export
// =============================================================================

export default CollectionGrid;