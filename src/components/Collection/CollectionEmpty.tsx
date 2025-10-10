/**
 * Collection Empty Component
 * 
 * Empty state component for collections with customizable messages,
 * actions, and visual elements following Blueprint.js design system.
 * 
 * @version 1.0.0
 * @date 2025-09-30
 */

import React from 'react';
import { Button, Icon, NonIdealState } from '@blueprintjs/core';
import { IconNames } from '@blueprintjs/icons';
import { useCollectionContext } from './CollectionProvider';
import './CollectionEmpty.css';

// =============================================================================
// Component Props
// =============================================================================

export interface CollectionEmptyProps {
  /** Custom title for empty state */
  title?: string;
  /** Custom description for empty state */
  description?: string;
  /** Custom icon for empty state */
  icon?: string;
  /** Show create collection button */
  showCreateButton?: boolean;
  /** Show clear filters button */
  showClearFiltersButton?: boolean;
  /** Custom action buttons */
  actions?: Array<{
    label: string;
    icon?: string;
    intent?: 'primary' | 'success' | 'warning' | 'danger';
    onClick: () => void;
  }>;
  /** Custom class name */
  className?: string;
  /** Custom styles */
  style?: React.CSSProperties;
  /** Event handlers */
  onCreateCollection?: () => void;
  onClearFilters?: () => void;
}

// =============================================================================
// Empty State Types
// =============================================================================

interface EmptyStateConfig {
  title: string;
  description: string;
  icon: string;
  showCreateButton: boolean;
  showClearFiltersButton: boolean;
}

// =============================================================================
// Main Component
// =============================================================================

/**
 * Collection empty state component with contextual messaging
 * 
 * @example
 * ```tsx
 * // Basic usage (context-aware)
 * <CollectionEmpty />
 * 
 * // Custom empty state
 * <CollectionEmpty
 *   title="No Results Found"
 *   description="Try adjusting your search criteria"
 *   icon={IconNames.SEARCH}
 *   showClearFiltersButton
 * />
 * 
 * // With custom actions
 * <CollectionEmpty
 *   actions={[
 *     { label: 'Create New', icon: IconNames.PLUS, intent: 'primary', onClick: handleCreate },
 *     { label: 'Import', icon: IconNames.IMPORT, onClick: handleImport },
 *   ]}
 * />
 * ```
 */
export const CollectionEmpty: React.FC<CollectionEmptyProps> = ({
  title: customTitle,
  description: customDescription,
  icon: customIcon,
  showCreateButton = true,
  showClearFiltersButton = true,
  actions = [],
  className = '',
  style,
  onCreateCollection,
  onClearFilters,
}) => {
  // =============================================================================
  // Context and State
  // =============================================================================

  const {
    filter,
    hasActiveFilters,
    clearFilters,
    createCollection,
    features,
    loading,
  } = useCollectionContext();

  // =============================================================================
  // Configuration
  // =============================================================================

  const getEmptyStateConfig = (): EmptyStateConfig => {
    // No collections exist at all
    if (!hasActiveFilters && !loading.collections) {
      return {
        title: 'No Collections Yet',
        description: 'Create your first collection to get started with organizing and managing your space assets.',
        icon: IconNames.FOLDER_OPEN,
        showCreateButton: true,
        showClearFiltersButton: false,
      };
    }

    // Collections exist but none match current filters
    if (hasActiveFilters) {
      return {
        title: 'No Matching Collections',
        description: 'No collections match your current filter criteria. Try adjusting your filters or clearing them to see all collections.',
        icon: IconNames.FILTER,
        showCreateButton: false,
        showClearFiltersButton: true,
      };
    }

    // Loading state or other scenarios
    return {
      title: 'No Collections Found',
      description: 'There are currently no collections available to display.',
      icon: IconNames.FOLDER_OPEN,
      showCreateButton: true,
      showClearFiltersButton: false,
    };
  };

  const config = getEmptyStateConfig();

  // =============================================================================
  // Event Handlers
  // =============================================================================

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

  const handleClearFilters = () => {
    if (onClearFilters) {
      onClearFilters();
    } else {
      clearFilters();
    }
  };

  // =============================================================================
  // Render Functions
  // =============================================================================

  const renderActions = () => {
    const defaultActions = [];

    // Add create button if enabled
    if ((config.showCreateButton && showCreateButton && features.enableCreate) || customTitle) {
      defaultActions.push(
        <Button
          key="create"
          intent="primary"
          icon={IconNames.PLUS}
          onClick={handleCreateCollection}
          disabled={loading.creating}
        >
          Create Collection
        </Button>
      );
    }

    // Add clear filters button if applicable
    if (config.showClearFiltersButton && showClearFiltersButton && hasActiveFilters) {
      defaultActions.push(
        <Button
          key="clear-filters"
          intent="none"
          icon={IconNames.FILTER_REMOVE}
          onClick={handleClearFilters}
        >
          Clear Filters
        </Button>
      );
    }

    // Add custom actions
    const customActions = actions.map((action, index) => (
      <Button
        key={`custom-${index}`}
        intent={action.intent || 'none'}
        icon={action.icon}
        onClick={action.onClick}
      >
        {action.label}
      </Button>
    ));

    const allActions = [...defaultActions, ...customActions];

    if (allActions.length === 0) return null;

    return (
      <div className="collection-empty-actions">
        {allActions}
      </div>
    );
  };

  // =============================================================================
  // Render
  // =============================================================================

  return (
    <div className={`collection-empty ${className}`} style={style}>
      <NonIdealState
        icon={
          <Icon
            icon={customIcon || config.icon}
            size={48}
            className="collection-empty-icon"
          />
        }
        title={customTitle || config.title}
        description={
          <div className="collection-empty-description">
            <p>{customDescription || config.description}</p>
            {hasActiveFilters && !customDescription && (
              <div className="collection-empty-filter-info">
                <p className="filter-summary">
                  Current filters: {filter.search && `"${filter.search}"`}
                  {filter.types.length > 0 && ` • Types: ${filter.types.join(', ')}`}
                  {filter.statuses.length > 0 && ` • Status: ${filter.statuses.join(', ')}`}
                  {filter.tags.length > 0 && ` • Tags: ${filter.tags.join(', ')}`}
                </p>
              </div>
            )}
          </div>
        }
        action={renderActions()}
      />
    </div>
  );
};

// =============================================================================
// Default Export
// =============================================================================

export default CollectionEmpty;