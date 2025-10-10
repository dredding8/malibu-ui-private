/**
 * Collection Footer Component
 * 
 * Footer component for collection interface with pagination,
 * status information, and optional actions.
 * 
 * @version 1.0.0
 * @date 2025-09-30
 */

import React from 'react';
import { Button, ButtonGroup, Icon, Tag } from '@blueprintjs/core';
import { IconNames } from '@blueprintjs/icons';
import { useCollectionContext } from './CollectionProvider';
import './CollectionFooter.css';

// =============================================================================
// Component Props
// =============================================================================

export interface CollectionFooterProps {
  /** Show pagination controls */
  showPagination?: boolean;
  /** Show item count information */
  showCount?: boolean;
  /** Show loading status */
  showStatus?: boolean;
  /** Show refresh button */
  showRefresh?: boolean;
  /** Custom class name */
  className?: string;
  /** Custom styles */
  style?: React.CSSProperties;
  /** Event handlers */
  onRefresh?: () => void;
}

// =============================================================================
// Main Component
// =============================================================================

/**
 * Collection footer with pagination and status information
 * 
 * @example
 * ```tsx
 * // Basic usage
 * <CollectionFooter />
 * 
 * // Minimal footer
 * <CollectionFooter
 *   showPagination={false}
 *   showRefresh={false}
 * />
 * 
 * // Custom configuration
 * <CollectionFooter
 *   onRefresh={handleRefresh}
 * />
 * ```
 */
export const CollectionFooter: React.FC<CollectionFooterProps> = ({
  showPagination = true,
  showCount = true,
  showStatus = true,
  showRefresh = true,
  className = '',
  style,
  onRefresh,
}) => {
  // =============================================================================
  // Context and State
  // =============================================================================

  const {
    pagination,
    filteredCollections,
    totalCollections,
    loading,
    error,
    lastUpdated,
    refreshCollections,
    goToPage,
    features,
  } = useCollectionContext();

  // =============================================================================
  // Computed Values
  // =============================================================================

  const currentPage = pagination?.page || 1;
  const itemsPerPage = pagination?.limit || 10;
  const totalItems = pagination?.total || totalCollections || 0;
  const totalPages = Math.ceil(totalItems / itemsPerPage);
  const startItem = (currentPage - 1) * itemsPerPage + 1;
  const endItem = Math.min(currentPage * itemsPerPage, totalItems);

  const hasError = error?.collections || error?.loading;
  const isLoading = loading?.collections || loading?.refreshing;

  // =============================================================================
  // Event Handlers
  // =============================================================================

  const handleRefresh = () => {
    if (onRefresh) {
      onRefresh();
    } else {
      refreshCollections();
    }
  };

  const handlePageChange = (page: number) => {
    if (page >= 1 && page <= totalPages && page !== currentPage) {
      goToPage(page);
    }
  };

  const handlePreviousPage = () => {
    handlePageChange(currentPage - 1);
  };

  const handleNextPage = () => {
    handlePageChange(currentPage + 1);
  };

  const handleFirstPage = () => {
    handlePageChange(1);
  };

  const handleLastPage = () => {
    handlePageChange(totalPages);
  };

  // =============================================================================
  // Render Functions
  // =============================================================================

  const renderCount = () => {
    if (!showCount) return null;

    return (
      <div className="collection-footer-count">
        <span className="count-text">
          {totalItems > 0 ? (
            totalPages > 1 ? (
              <>Showing {startItem}-{endItem} of {totalItems} collections</>
            ) : (
              <>{totalItems} collection{totalItems !== 1 ? 's' : ''}</>
            )
          ) : (
            'No collections'
          )}
        </span>
      </div>
    );
  };

  const renderPagination = () => {
    if (!showPagination || !features.enablePagination || totalPages <= 1) return null;

    const showFirstLast = totalPages > 5;
    const showEllipsis = totalPages > 7;
    
    // Calculate visible page numbers
    let startPage = Math.max(1, currentPage - 2);
    let endPage = Math.min(totalPages, currentPage + 2);
    
    if (currentPage <= 3) {
      endPage = Math.min(5, totalPages);
    }
    if (currentPage >= totalPages - 2) {
      startPage = Math.max(totalPages - 4, 1);
    }

    const pageNumbers = [];
    for (let i = startPage; i <= endPage; i++) {
      pageNumbers.push(i);
    }

    return (
      <div className="collection-footer-pagination">
        <ButtonGroup>
          {showFirstLast && (
            <Button
              minimal
              icon={IconNames.DOUBLE_CHEVRON_LEFT}
              disabled={currentPage === 1 || isLoading}
              onClick={handleFirstPage}
              title="First page"
            />
          )}
          
          <Button
            minimal
            icon={IconNames.CHEVRON_LEFT}
            disabled={currentPage === 1 || isLoading}
            onClick={handlePreviousPage}
            title="Previous page"
          />

          {showEllipsis && startPage > 1 && (
            <>
              <Button
                minimal
                text="1"
                active={currentPage === 1}
                onClick={() => handlePageChange(1)}
                disabled={isLoading}
              />
              {startPage > 2 && <span className="pagination-ellipsis">…</span>}
            </>
          )}

          {pageNumbers.map(page => (
            <Button
              key={page}
              minimal
              text={String(page)}
              active={currentPage === page}
              onClick={() => handlePageChange(page)}
              disabled={isLoading}
            />
          ))}

          {showEllipsis && endPage < totalPages && (
            <>
              {endPage < totalPages - 1 && <span className="pagination-ellipsis">…</span>}
              <Button
                minimal
                text={String(totalPages)}
                active={currentPage === totalPages}
                onClick={() => handlePageChange(totalPages)}
                disabled={isLoading}
              />
            </>
          )}

          <Button
            minimal
            icon={IconNames.CHEVRON_RIGHT}
            disabled={currentPage === totalPages || isLoading}
            onClick={handleNextPage}
            title="Next page"
          />

          {showFirstLast && (
            <Button
              minimal
              icon={IconNames.DOUBLE_CHEVRON_RIGHT}
              disabled={currentPage === totalPages || isLoading}
              onClick={handleLastPage}
              title="Last page"
            />
          )}
        </ButtonGroup>
      </div>
    );
  };

  const renderStatus = () => {
    if (!showStatus) return null;

    return (
      <div className="collection-footer-status">
        {hasError && (
          <Tag intent="danger" minimal icon={IconNames.ERROR}>
            Error loading collections
          </Tag>
        )}
        
        {isLoading && (
          <Tag minimal icon={IconNames.REFRESH} className="loading-tag">
            Loading...
          </Tag>
        )}
        
        {!hasError && !isLoading && lastUpdated && (
          <span className="last-updated">
            Last updated: {new Intl.DateTimeFormat('en-US', {
              hour: '2-digit',
              minute: '2-digit',
              second: '2-digit',
            }).format(lastUpdated)}
          </span>
        )}
      </div>
    );
  };

  const renderActions = () => {
    if (!showRefresh) return null;

    return (
      <div className="collection-footer-actions">
        <Button
          minimal
          icon={IconNames.REFRESH}
          onClick={handleRefresh}
          disabled={isLoading}
          title="Refresh collections"
        />
      </div>
    );
  };

  // =============================================================================
  // Render
  // =============================================================================

  return (
    <div className={`collection-footer ${className}`} style={style}>
      <div className="collection-footer-left">
        {renderCount()}
        {renderStatus()}
      </div>

      <div className="collection-footer-center">
        {renderPagination()}
      </div>

      <div className="collection-footer-right">
        {renderActions()}
      </div>
    </div>
  );
};

// =============================================================================
// Default Export
// =============================================================================

export default CollectionFooter;