/**
 * Collection List Component
 * 
 * List layout component for displaying collections in a compact,
 * table-like format with sorting and selection support.
 * 
 * @version 1.0.0
 * @date 2025-09-30
 */

import React, { useMemo, useCallback } from 'react';
import { Button, Checkbox, Icon } from '@blueprintjs/core';
import { IconNames } from '@blueprintjs/icons';
import { useCollectionContext } from './CollectionProvider';
import { EnhancedStatusIndicator } from '../EnhancedStatusIndicator';
import { Collection } from '../../types/collection.types';
import './CollectionList.css';

// =============================================================================
// Component Props
// =============================================================================

export interface CollectionListProps {
  /** Show checkboxes for selection */
  showSelection?: boolean;
  /** Show status indicators */
  showStatus?: boolean;
  /** Show action buttons */
  showActions?: boolean;
  /** Columns to display */
  columns?: Array<{
    key: string;
    label: string;
    width?: number;
    sortable?: boolean;
    render?: (collection: Collection) => React.ReactNode;
  }>;
  /** Custom row component */
  rowComponent?: React.ComponentType<{ collection: Collection; index: number }>;
  /** Row height */
  rowHeight?: 'compact' | 'comfortable' | 'spacious';
  /** Custom class name */
  className?: string;
  /** Custom styles */
  style?: React.CSSProperties;
  /** Event handlers */
  onRowClick?: (collection: Collection, event: React.MouseEvent) => void;
  onRowDoubleClick?: (collection: Collection, event: React.MouseEvent) => void;
  onActionClick?: (action: string, collection: Collection) => void;
}

// =============================================================================
// Default Columns Configuration
// =============================================================================

const getDefaultColumns = () => [
  {
    key: 'status',
    label: 'Status',
    width: 120,
    sortable: true,
    render: (collection: Collection) => (
      <EnhancedStatusIndicator
        status={collection.status}
        size="small"
        showDetails
      />
    ),
  },
  {
    key: 'name',
    label: 'Name',
    width: 250,
    sortable: true,
    render: (collection: Collection) => (
      <div className="collection-list-name">
        <div className="collection-name">{collection.name}</div>
        {collection.description && (
          <div className="collection-description">{collection.description}</div>
        )}
      </div>
    ),
  },
  {
    key: 'type',
    label: 'Type',
    width: 120,
    sortable: true,
    render: (collection: Collection) => (
      <span className={`collection-type type-${collection.type}`}>
        {collection.type.replace('_', ' ').toUpperCase()}
      </span>
    ),
  },
  {
    key: 'progress',
    label: 'Progress',
    width: 100,
    sortable: true,
    render: (collection: Collection) => (
      <div className="collection-progress">
        <div className="progress-bar">
          <div 
            className="progress-fill"
            style={{ width: `${collection.metadata.progress}%` }}
          />
        </div>
        <span className="progress-text">{collection.metadata.progress}%</span>
      </div>
    ),
  },
  {
    key: 'tags',
    label: 'Tags',
    width: 200,
    sortable: false,
    render: (collection: Collection) => (
      <div className="collection-tags">
        {collection.tags.slice(0, 3).map(tag => (
          <span key={tag} className="bp5-tag bp5-minimal bp5-small">
            {tag}
          </span>
        ))}
        {collection.tags.length > 3 && (
          <span className="bp5-tag bp5-minimal bp5-small">
            +{collection.tags.length - 3}
          </span>
        )}
      </div>
    ),
  },
  {
    key: 'updatedAt',
    label: 'Last Updated',
    width: 150,
    sortable: true,
    render: (collection: Collection) => (
      <span className="collection-date">
        {new Intl.DateTimeFormat('en-US', {
          month: 'short',
          day: 'numeric',
          hour: '2-digit',
          minute: '2-digit',
        }).format(collection.updatedAt)}
      </span>
    ),
  },
];

// =============================================================================
// Row Component
// =============================================================================

interface CollectionRowProps {
  collection: Collection;
  index: number;
  columns: Array<{
    key: string;
    label: string;
    width?: number;
    sortable?: boolean;
    render?: (collection: Collection) => React.ReactNode;
  }>;
  showSelection: boolean;
  showActions: boolean;
  isSelected: boolean;
  isEditing: boolean;
  rowHeight: string;
  onSelect: () => void;
  onRowClick: (event: React.MouseEvent) => void;
  onRowDoubleClick: (event: React.MouseEvent) => void;
  onActionClick: (action: string) => void;
}

const CollectionRow: React.FC<CollectionRowProps> = ({
  collection,
  index,
  columns,
  showSelection,
  showActions,
  isSelected,
  isEditing,
  rowHeight,
  onSelect,
  onRowClick,
  onRowDoubleClick,
  onActionClick,
}) => {
  const rowClassName = `
    collection-list-row
    ${rowHeight}
    ${isSelected ? 'selected' : ''}
    ${isEditing ? 'editing' : ''}
    ${index % 2 === 0 ? 'even' : 'odd'}
  `.trim();

  return (
    <div
      className={rowClassName}
      onClick={onRowClick}
      onDoubleClick={onRowDoubleClick}
      role="row"
      aria-selected={isSelected}
      tabIndex={0}
    >
      {showSelection && (
        <div className="collection-list-cell selection-cell">
          <Checkbox
            checked={isSelected}
            onChange={onSelect}
            onClick={(e) => e.stopPropagation()}
          />
        </div>
      )}

      {columns.map(column => (
        <div
          key={column.key}
          className={`collection-list-cell ${column.key}-cell`}
          style={{ width: column.width || 'auto' }}
        >
          {column.render ? column.render(collection) : String(collection[column.key as keyof Collection] || '')}
        </div>
      ))}

      {showActions && (
        <div className="collection-list-cell actions-cell">
          <div className="collection-actions">
            <Button
              minimal
              small
              icon={IconNames.EDIT}
              onClick={(e) => {
                e.stopPropagation();
                onActionClick('edit');
              }}
              title="Edit collection"
            />
            <Button
              minimal
              small
              icon={IconNames.DUPLICATE}
              onClick={(e) => {
                e.stopPropagation();
                onActionClick('duplicate');
              }}
              title="Duplicate collection"
            />
            <Button
              minimal
              small
              icon={IconNames.TRASH}
              intent="danger"
              onClick={(e) => {
                e.stopPropagation();
                onActionClick('delete');
              }}
              title="Delete collection"
            />
          </div>
        </div>
      )}
    </div>
  );
};

// =============================================================================
// Main List Component
// =============================================================================

/**
 * Collection list component with table-like layout
 * 
 * @example
 * ```tsx
 * // Basic usage
 * <CollectionList />
 * 
 * // With custom configuration
 * <CollectionList
 *   showSelection
 *   showActions
 *   rowHeight="comfortable"
 *   onRowClick={handleRowClick}
 *   onActionClick={handleActionClick}
 * />
 * 
 * // With custom columns
 * <CollectionList
 *   columns={[
 *     { key: 'name', label: 'Collection Name', width: 300, sortable: true },
 *     { key: 'type', label: 'Type', width: 100, sortable: true },
 *     { key: 'status', label: 'Status', width: 150, sortable: true },
 *   ]}
 * />
 * ```
 */
export const CollectionList: React.FC<CollectionListProps> = ({
  showSelection = true,
  showStatus = true,
  showActions = true,
  columns: customColumns,
  rowComponent: CustomRow,
  rowHeight = 'comfortable',
  className = '',
  style,
  onRowClick,
  onRowDoubleClick,
  onActionClick,
}) => {
  // =============================================================================
  // Context and State
  // =============================================================================

  const {
    filteredCollections,
    loading,
    sort,
    isSelected,
    isEditing,
    toggleSelection,
    startEditing,
    deleteCollection,
    duplicateCollection,
    toggleSort,
    features,
  } = useCollectionContext();

  // =============================================================================
  // Configuration
  // =============================================================================

  const columns = useMemo(() => {
    if (customColumns) return customColumns;
    
    let defaultColumns = getDefaultColumns();
    
    if (!showStatus) {
      defaultColumns = defaultColumns.filter(col => col.key !== 'status');
    }
    
    return defaultColumns;
  }, [customColumns, showStatus]);

  const actualShowSelection = showSelection && features.enableSelection;
  const actualShowActions = showActions && features.enableBulkOperations;

  // =============================================================================
  // Event Handlers
  // =============================================================================

  const handleRowClick = useCallback((collection: Collection, event: React.MouseEvent) => {
    onRowClick?.(collection, event);
  }, [onRowClick]);

  const handleRowDoubleClick = useCallback((collection: Collection, event: React.MouseEvent) => {
    onRowDoubleClick?.(collection, event);
  }, [onRowDoubleClick]);

  const handleActionClick = useCallback(async (action: string, collection: Collection) => {
    switch (action) {
      case 'edit':
        startEditing(collection.id);
        break;
      case 'duplicate':
        await duplicateCollection(collection.id);
        break;
      case 'delete':
        await deleteCollection(collection.id);
        break;
      default:
        onActionClick?.(action, collection);
    }
  }, [startEditing, duplicateCollection, deleteCollection, onActionClick]);

  const handleHeaderClick = useCallback((column: typeof columns[0]) => {
    if (column.sortable && features.enableSorting) {
      toggleSort(column.key);
    }
  }, [toggleSort, features.enableSorting]);

  // =============================================================================
  // Render Functions
  // =============================================================================

  const renderHeader = () => (
    <div className="collection-list-header" role="rowgroup">
      <div className="collection-list-header-row" role="row">
        {actualShowSelection && (
          <div className="collection-list-header-cell selection-cell">
            <Checkbox
              checked={filteredCollections.length > 0 && filteredCollections.every(c => isSelected(c.id))}
              indeterminate={filteredCollections.some(c => isSelected(c.id)) && !filteredCollections.every(c => isSelected(c.id))}
              onChange={() => {
                // Toggle select all
                const allSelected = filteredCollections.every(c => isSelected(c.id));
                filteredCollections.forEach(collection => {
                  if (allSelected !== isSelected(collection.id)) {
                    toggleSelection(collection.id);
                  }
                });
              }}
            />
          </div>
        )}

        {columns.map(column => (
          <div
            key={column.key}
            className={`collection-list-header-cell ${column.key}-cell ${column.sortable ? 'sortable' : ''}`}
            style={{ width: column.width || 'auto' }}
            onClick={() => handleHeaderClick(column)}
            role="columnheader"
            aria-sort={
              sort.field === column.key
                ? sort.direction === 'asc' ? 'ascending' : 'descending'
                : 'none'
            }
          >
            <span className="header-label">{column.label}</span>
            {column.sortable && (
              <Icon
                icon={
                  sort.field === column.key
                    ? sort.direction === 'asc'
                      ? IconNames.CHEVRON_UP
                      : IconNames.CHEVRON_DOWN
                    : IconNames.DOUBLE_CARET_VERTICAL
                }
                size={12}
                className="sort-icon"
              />
            )}
          </div>
        ))}

        {actualShowActions && (
          <div className="collection-list-header-cell actions-cell">
            Actions
          </div>
        )}
      </div>
    </div>
  );

  const renderRow = (collection: Collection, index: number) => {
    if (CustomRow) {
      return (
        <CustomRow
          key={collection.id}
          collection={collection}
          index={index}
        />
      );
    }

    return (
      <CollectionRow
        key={collection.id}
        collection={collection}
        index={index}
        columns={columns}
        showSelection={actualShowSelection}
        showActions={actualShowActions}
        isSelected={isSelected(collection.id)}
        isEditing={isEditing(collection.id)}
        rowHeight={rowHeight}
        onSelect={() => toggleSelection(collection.id)}
        onRowClick={(event) => handleRowClick(collection, event)}
        onRowDoubleClick={(event) => handleRowDoubleClick(collection, event)}
        onActionClick={(action) => handleActionClick(action, collection)}
      />
    );
  };

  const renderEmptyState = () => (
    <div className="collection-list-empty">
      <div className="bp5-non-ideal-state">
        <div className="bp5-non-ideal-state-visual">
          <Icon icon={IconNames.FOLDER_OPEN} size={48} />
        </div>
        <h4 className="bp5-heading">No Collections Found</h4>
        <div className="bp5-non-ideal-state-description">
          No collections match your current filter criteria.
        </div>
      </div>
    </div>
  );

  // =============================================================================
  // Render
  // =============================================================================

  if (loading.collections && filteredCollections.length === 0) {
    return (
      <div className={`collection-list loading ${className}`} style={style}>
        <div className="collection-list-loading">
          <div className="bp5-spinner bp5-large" />
          <span>Loading collections...</span>
        </div>
      </div>
    );
  }

  if (filteredCollections.length === 0) {
    return (
      <div className={`collection-list empty ${className}`} style={style}>
        {renderEmptyState()}
      </div>
    );
  }

  return (
    <div 
      className={`collection-list ${rowHeight} ${className}`}
      style={style}
      role="table"
      aria-label="Collections list"
    >
      {renderHeader()}
      
      <div className="collection-list-body" role="rowgroup">
        {filteredCollections.map(renderRow)}
      </div>

      {loading.collections && (
        <div className="collection-list-loading-more">
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

export default CollectionList;