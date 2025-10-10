/**
 * Bento Layout for Collection Component
 *
 * Grid-based "bento box" layout with flexible card sizing
 * and responsive breakpoints.
 *
 * @version 1.0.0
 * @date 2025-09-30
 */

import React from 'react';
import { Collection as CollectionType } from '../../../types/collection.types';
import { useCollectionContext } from '../CollectionProvider';
import './BentoLayout.css';

// =============================================================================
// Props Interface
// =============================================================================

export interface BentoLayoutProps {
  /** Collections to display */
  collections?: CollectionType[];
  /** Grid columns (default: auto-responsive) */
  columns?: number | 'auto';
  /** Gap between items */
  gap?: 'compact' | 'comfortable' | 'spacious';
  /** Item size variant */
  itemSize?: 'small' | 'medium' | 'large';
  /** Enable drag and drop reordering */
  enableReorder?: boolean;
  /** Custom class name */
  className?: string;
  /** Children (for custom composition) */
  children?: React.ReactNode;
}

// =============================================================================
// Bento Layout Component
// =============================================================================

/**
 * Bento grid layout for collections
 *
 * Features:
 * - Responsive grid with auto-sizing
 * - Flexible card dimensions
 * - Masonry-style layout support
 * - Drag and drop reordering
 */
export const BentoLayout: React.FC<BentoLayoutProps> = ({
  collections,
  columns = 'auto',
  gap = 'comfortable',
  itemSize = 'medium',
  enableReorder = false,
  className = '',
  children,
}) => {
  // Get context if collections not provided
  const context = useCollectionContext();
  const displayCollections = collections || context?.collections || [];

  // Calculate grid columns based on screen size
  const getGridColumns = () => {
    if (columns !== 'auto') return columns;

    // Responsive column count
    if (typeof window === 'undefined') return 3;

    const width = window.innerWidth;
    if (width < 640) return 1; // Mobile
    if (width < 1024) return 2; // Tablet
    if (width < 1536) return 3; // Desktop
    return 4; // Large desktop
  };

  const gridColumns = getGridColumns();

  // Gap size mapping
  const gapSizeMap = {
    compact: '0.5rem',
    comfortable: '1rem',
    spacious: '1.5rem',
  };

  // Item size classes
  const itemSizeClass = {
    small: 'bento-item-small',
    medium: 'bento-item-medium',
    large: 'bento-item-large',
  };

  return (
    <div
      className={`bento-layout ${className}`}
      data-columns={gridColumns}
      data-gap={gap}
      data-reorderable={enableReorder}
    >
      <div
        className="bento-grid"
        style={{
          gridTemplateColumns: `repeat(${gridColumns}, 1fr)`,
          gap: gapSizeMap[gap],
        }}
      >
        {children ||
          displayCollections.map((collection, index) => (
            <div
              key={collection.id}
              className={`bento-item ${itemSizeClass[itemSize]}`}
              data-index={index}
              data-collection-id={collection.id}
            >
              {/* This would be replaced with actual collection card component */}
              <div className="bento-item-content">
                <h3>{collection.name}</h3>
                <p>{collection.status}</p>
              </div>
            </div>
          ))}
      </div>
    </div>
  );
};

export default BentoLayout;
