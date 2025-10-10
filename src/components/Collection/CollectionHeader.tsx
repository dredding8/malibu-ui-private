/**
 * Collection Header Component
 * 
 * Header component for collection interface with search, filters,
 * view controls, and bulk actions following Blueprint.js design.
 * 
 * @version 1.0.0
 * @date 2025-09-30
 */

import React, { useMemo } from 'react';
import { 
  Button, 
  ButtonGroup, 
  Icon, 
  InputGroup,
  Tag,
  Tooltip,
  Position 
} from '@blueprintjs/core';
import { IconNames } from '@blueprintjs/icons';
import { useCollectionContext } from './CollectionProvider';
import './CollectionHeader.css';

// =============================================================================
// Component Props
// =============================================================================

export interface CollectionHeaderProps {
  /** Show search input */
  showSearch?: boolean;
  /** Show view toggle buttons */
  showViewToggle?: boolean;
  /** Show filter controls */
  showFilters?: boolean;
  /** Show bulk actions */
  showBulkActions?: boolean;
  /** Show create button */
  showCreateButton?: boolean;
  /** Show collection count */
  showCount?: boolean;
  /** Custom search placeholder */
  searchPlaceholder?: string;
  /** Custom class name */
  className?: string;
  /** Custom styles */
  style?: React.CSSProperties;
  /** Event handlers */
  onCreateCollection?: () => void;
  onExportSelected?: () => void;
  onDeleteSelected?: () => void;
  /** Children to render inside the header */
  children?: React.ReactNode;
}

// =============================================================================
// Main Component
// =============================================================================

/**
 * Collection header with search, filters, and actions
 * 
 * @example
 * ```tsx
 * // Basic usage
 * <CollectionHeader />
 * 
 * // Minimal header
 * <CollectionHeader
 *   showSearch={false}
 *   showFilters={false}
 *   showBulkActions={false}
 * />
 * 
 * // Custom configuration
 * <CollectionHeader
 *   searchPlaceholder="Search collections..."
 *   onCreateCollection={handleCreate}
 *   onExportSelected={handleExport}
 * />
 * ```
 */
export const CollectionHeader: React.FC<CollectionHeaderProps> = ({
  showSearch = true,
  showViewToggle = true,
  showFilters = true,
  showBulkActions = true,
  showCreateButton = true,
  showCount = true,
  searchPlaceholder = 'Search collections...',
  className = '',
  style,
  onCreateCollection,
  onExportSelected,
  onDeleteSelected,
  children,
}) => {
  // =============================================================================
  // Context and State
  // =============================================================================

  const {
    view,
    filter,
    filteredCollections,
    selectedCollections,
    hasActiveFilters,
    setView,
    updateFilter,
    clearFilters,
    createCollection,
    deleteSelected,
    exportSelected,
    features,
    loading,
  } = useCollectionContext();

  // =============================================================================
  // Computed Values
  // =============================================================================

  const searchValue = filter?.search || '';
  const selectedCount = selectedCollections?.length || 0;
  const totalCount = filteredCollections?.length || 0;
  const hasSelection = selectedCount > 0;

  const activeFilterCount = useMemo(() => {
    let count = 0;
    if (filter?.search) count++;
    if (filter?.types?.length > 0) count++;
    if (filter?.statuses?.length > 0) count++;
    if (filter?.tags?.length > 0) count++;
    if (filter?.dateRange) count++;
    return count;
  }, [filter]);

  // =============================================================================
  // Event Handlers
  // =============================================================================

  const handleSearchChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    updateFilter({ search: event.target.value });
  };

  const handleSearchClear = () => {
    updateFilter({ search: '' });
  };

  const handleViewChange = (newView: 'grid' | 'list') => {
    setView(newView);
  };

  const handleCreateCollection = () => {
    if (onCreateCollection) {
      onCreateCollection();
    } else if (features.enableCreate) {
      createCollection({
        name: 'New Collection',
        type: 'custom',
        description: '',
      });
    }
  };

  const handleExportSelected = () => {
    if (onExportSelected) {
      onExportSelected();
    } else if (features.enableBulkOperations) {
      exportSelected();
    }
  };

  const handleDeleteSelected = () => {
    if (onDeleteSelected) {
      onDeleteSelected();
    } else if (features.enableBulkOperations) {
      deleteSelected();
    }
  };

  // =============================================================================
  // Render Functions
  // =============================================================================

  const renderSearch = () => {
    if (!showSearch || !features.enableSearch) return null;

    return (
      <div className="collection-header-search">
        <InputGroup
          large
          leftIcon={IconNames.SEARCH}
          placeholder={searchPlaceholder}
          value={searchValue}
          onChange={handleSearchChange}
          rightElement={
            searchValue ? (
              <Button
                minimal
                icon={IconNames.CROSS}
                onClick={handleSearchClear}
                title="Clear search"
              />
            ) : undefined
          }
        />
      </div>
    );
  };

  const renderFilters = () => {
    if (!showFilters || !features.enableFiltering) return null;

    return (
      <div className="collection-header-filters">
        {hasActiveFilters && (
          <div className="active-filters">
            {activeFilterCount > 0 && (
              <Tag
                intent="primary"
                minimal
                round
                icon={IconNames.FILTER}
              >
                {activeFilterCount} filter{activeFilterCount > 1 ? 's' : ''}
              </Tag>
            )}
            <Button
              minimal
              small
              icon={IconNames.FILTER_REMOVE}
              onClick={clearFilters}
              title="Clear all filters"
            >
              Clear Filters
            </Button>
          </div>
        )}
        
        <Button
          minimal
          icon={IconNames.FILTER}
          text="Filters"
          rightIcon={IconNames.CARET_DOWN}
          title="Open filter panel"
        />
      </div>
    );
  };

  const renderViewToggle = () => {
    if (!showViewToggle || !features.enableViewToggle) return null;

    return (
      <div className="collection-header-view-toggle">
        <ButtonGroup>
          <Tooltip content="Grid View" position={Position.BOTTOM}>
            <Button
              minimal
              icon={IconNames.GRID_VIEW}
              active={view === 'grid'}
              onClick={() => handleViewChange('grid')}
            />
          </Tooltip>
          <Tooltip content="List View" position={Position.BOTTOM}>
            <Button
              minimal
              icon={IconNames.LIST}
              active={view === 'list'}
              onClick={() => handleViewChange('list')}
            />
          </Tooltip>
        </ButtonGroup>
      </div>
    );
  };

  const renderBulkActions = () => {
    if (!showBulkActions || !features.enableBulkOperations || !hasSelection) return null;

    return (
      <div className="collection-header-bulk-actions">
        <span className="selection-count">
          {selectedCount} selected
        </span>
        
        <ButtonGroup>
          <Tooltip content="Export Selected" position={Position.BOTTOM}>
            <Button
              minimal
              icon={IconNames.EXPORT}
              onClick={handleExportSelected}
              disabled={loading.exporting}
            />
          </Tooltip>
          <Tooltip content="Delete Selected" position={Position.BOTTOM}>
            <Button
              minimal
              icon={IconNames.TRASH}
              intent="danger"
              onClick={handleDeleteSelected}
              disabled={loading.deleting}
            />
          </Tooltip>
        </ButtonGroup>
      </div>
    );
  };

  const renderCount = () => {
    if (!showCount) return null;

    return (
      <div className="collection-header-count">
        <span className="count-text">
          {totalCount} collection{totalCount !== 1 ? 's' : ''}
          {hasActiveFilters && ' (filtered)'}
        </span>
      </div>
    );
  };

  const renderActions = () => (
    <div className="collection-header-actions">
      {renderBulkActions()}
      
      {showCreateButton && features.enableCreate && (
        <Button
          intent="primary"
          icon={IconNames.PLUS}
          onClick={handleCreateCollection}
          disabled={loading.creating}
        >
          Create Collection
        </Button>
      )}
    </div>
  );

  // =============================================================================
  // Render
  // =============================================================================

  return (
    <div className={`collection-header ${className}`} style={style}>
      <div className="collection-header-left">
        {renderSearch()}
        {renderFilters()}
        {renderCount()}
      </div>

      <div className="collection-header-right">
        {renderViewToggle()}
        {renderActions()}
      </div>
      
      {children}
    </div>
  );
};

// =============================================================================
// Default Export
// =============================================================================

export default CollectionHeader;