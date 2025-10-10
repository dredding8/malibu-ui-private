/**
 * Collection Item Component
 * 
 * Individual collection card/item component with enhanced status indicators,
 * interactive elements, and accessibility support.
 * 
 * @version 1.0.0
 * @date 2025-09-30
 */

import React, { useMemo, useCallback } from 'react';
import { Button, Card, Tag, Tooltip, Position } from '@blueprintjs/core';
import { IconNames } from '@blueprintjs/icons';
import { EnhancedStatusIndicator } from '../EnhancedStatusIndicator';
import { Collection } from '../../types/collection.types';
import { useFeatureFlag } from '../../hooks/useFeatureFlags';
import './CollectionItem.css';

// =============================================================================
// Component Props
// =============================================================================

export interface CollectionItemProps {
  /** Collection data */
  collection: Collection;
  /** Item index in the list */
  index: number;
  /** Is item selected */
  selected?: boolean;
  /** Is item being edited */
  editing?: boolean;
  /** Display size */
  size?: 'small' | 'medium' | 'large';
  /** Display variant */
  variant?: 'card' | 'compact' | 'detailed';
  /** Show selection checkbox */
  showSelection?: boolean;
  /** Show status indicator */
  showStatus?: boolean;
  /** Show action buttons */
  showActions?: boolean;
  /** Show tags */
  showTags?: boolean;
  /** Show progress bar */
  showProgress?: boolean;
  /** Show metadata */
  showMetadata?: boolean;
  /** Custom class name */
  className?: string;
  /** Custom styles */
  style?: React.CSSProperties;
  /** Event handlers */
  onClick?: (event: React.MouseEvent) => void;
  onDoubleClick?: (event: React.MouseEvent) => void;
  onSelect?: () => void;
  onEdit?: () => void;
  onDelete?: () => void;
  onDuplicate?: () => void;
  onViewDetails?: () => void;
}

// =============================================================================
// Helper Components
// =============================================================================

const CollectionProgress: React.FC<{ progress: number; size: 'small' | 'medium' | 'large' }> = ({ 
  progress, 
  size 
}) => {
  const progressClass = `collection-progress ${size}`;
  
  return (
    <div className={progressClass}>
      <div className="progress-bar">
        <div 
          className="progress-fill"
          style={{ width: `${Math.max(0, Math.min(100, progress))}%` }}
        />
      </div>
      <span className="progress-text">{progress}%</span>
    </div>
  );
};

const CollectionMetadata: React.FC<{ 
  collection: Collection; 
  variant: 'compact' | 'detailed' 
}> = ({ collection, variant }) => {
  const formatDate = (date: Date) => {
    return new Intl.DateTimeFormat('en-US', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    }).format(date);
  };

  if (variant === 'compact') {
    return (
      <div className="collection-metadata compact">
        <span className="metadata-item">
          {collection.type.replace('_', ' ').toUpperCase()}
        </span>
        <span className="metadata-separator">•</span>
        <span className="metadata-item">
          {formatDate(collection.updatedAt)}
        </span>
      </div>
    );
  }

  return (
    <div className="collection-metadata detailed">
      <div className="metadata-row">
        <span className="metadata-label">Type:</span>
        <span className="metadata-value">
          {collection.type.replace('_', ' ').toUpperCase()}
        </span>
      </div>
      <div className="metadata-row">
        <span className="metadata-label">Created:</span>
        <span className="metadata-value">
          {formatDate(collection.createdAt)}
        </span>
      </div>
      <div className="metadata-row">
        <span className="metadata-label">Updated:</span>
        <span className="metadata-value">
          {formatDate(collection.updatedAt)}
        </span>
      </div>
      {collection.metadata.classification && (
        <div className="metadata-row">
          <span className="metadata-label">Classification:</span>
          <span className="metadata-value classification">
            {collection.metadata.classification}
          </span>
        </div>
      )}
    </div>
  );
};

const CollectionActions: React.FC<{
  size: 'small' | 'medium' | 'large';
  onEdit?: () => void;
  onDelete?: () => void;
  onDuplicate?: () => void;
  onViewDetails?: () => void;
}> = ({ size, onEdit, onDelete, onDuplicate, onViewDetails }) => {
  const buttonSize = size === 'small' ? 'small' : undefined;

  return (
    <div className={`collection-actions ${size}`}>
      {onViewDetails && (
        <Tooltip content="View Details" position={Position.TOP}>
          <Button
            minimal
            small={buttonSize}
            icon={IconNames.EYE_OPEN}
            onClick={(e) => {
              e.stopPropagation();
              onViewDetails();
            }}
          />
        </Tooltip>
      )}
      {onEdit && (
        <Tooltip content="Edit Collection" position={Position.TOP}>
          <Button
            minimal
            small={buttonSize}
            icon={IconNames.EDIT}
            onClick={(e) => {
              e.stopPropagation();
              onEdit();
            }}
          />
        </Tooltip>
      )}
      {onDuplicate && (
        <Tooltip content="Duplicate Collection" position={Position.TOP}>
          <Button
            minimal
            small={buttonSize}
            icon={IconNames.DUPLICATE}
            onClick={(e) => {
              e.stopPropagation();
              onDuplicate();
            }}
          />
        </Tooltip>
      )}
      {onDelete && (
        <Tooltip content="Delete Collection" position={Position.TOP}>
          <Button
            minimal
            small={buttonSize}
            icon={IconNames.TRASH}
            intent="danger"
            onClick={(e) => {
              e.stopPropagation();
              onDelete();
            }}
          />
        </Tooltip>
      )}
    </div>
  );
};

// =============================================================================
// Main Component
// =============================================================================

/**
 * Collection item component for grid and list displays
 * 
 * @example
 * ```tsx
 * // Basic usage
 * <CollectionItem collection={collection} index={0} />
 * 
 * // With selection and actions
 * <CollectionItem
 *   collection={collection}
 *   index={0}
 *   selected={isSelected}
 *   showSelection
 *   showActions
 *   onSelect={handleSelect}
 *   onEdit={handleEdit}
 *   onDelete={handleDelete}
 * />
 * 
 * // Different variants
 * <CollectionItem collection={collection} variant="compact" size="small" />
 * <CollectionItem collection={collection} variant="detailed" size="large" />
 * ```
 */
export const CollectionItem: React.FC<CollectionItemProps> = ({
  collection,
  index,
  selected = false,
  editing = false,
  size = 'medium',
  variant = 'card',
  showSelection = false,
  showStatus = true,
  showActions = false,
  showTags = true,
  showProgress = true,
  showMetadata = true,
  className = '',
  style,
  onClick,
  onDoubleClick,
  onSelect,
  onEdit,
  onDelete,
  onDuplicate,
  onViewDetails,
}) => {
  // =============================================================================
  // Feature Flags
  // =============================================================================

  const useEnhancedStatus = useFeatureFlag('USE_ENHANCED_STATUS');

  // =============================================================================
  // Computed Values
  // =============================================================================

  const cardClassName = useMemo(() => {
    const classes = [
      'collection-item',
      variant,
      size,
      selected ? 'selected' : '',
      editing ? 'editing' : '',
      className,
    ].filter(Boolean).join(' ');
    
    return classes;
  }, [variant, size, selected, editing, className]);

  const cardElevation = useMemo(() => {
    if (selected) return 2;
    if (variant === 'card') return 1;
    return 0;
  }, [selected, variant]);

  const cardInteractive = useMemo(() => {
    return !!(onClick || onDoubleClick || onSelect);
  }, [onClick, onDoubleClick, onSelect]);

  // =============================================================================
  // Event Handlers
  // =============================================================================

  const handleCardClick = useCallback((event: React.MouseEvent) => {
    if (onSelect && event.ctrlKey) {
      event.preventDefault();
      onSelect();
    } else if (onClick) {
      onClick(event);
    }
  }, [onClick, onSelect]);

  const handleCardDoubleClick = useCallback((event: React.MouseEvent) => {
    onDoubleClick?.(event);
  }, [onDoubleClick]);

  const handleSelectionClick = useCallback((event: React.MouseEvent) => {
    event.stopPropagation();
    onSelect?.();
  }, [onSelect]);

  // =============================================================================
  // Render Functions
  // =============================================================================

  const renderHeader = () => (
    <div className="collection-item-header">
      {showSelection && (
        <div 
          className="collection-selection"
          onClick={handleSelectionClick}
        >
          <input
            type="checkbox"
            checked={selected}
            onChange={() => {}} // Handled by onClick
            aria-label={`Select ${collection.name}`}
          />
        </div>
      )}
      
      {showStatus && (
        <div className="collection-status">
          <EnhancedStatusIndicator
            status={collection.status}
            size={size === 'small' ? 'small' : 'medium'}
            showDetails
          />
        </div>
      )}
      
      {showActions && (
        <div className="collection-actions-container">
          <CollectionActions
            size={size}
            onEdit={onEdit}
            onDelete={onDelete}
            onDuplicate={onDuplicate}
            onViewDetails={onViewDetails}
          />
        </div>
      )}
    </div>
  );

  const renderContent = () => (
    <div className="collection-item-content">
      <div className="collection-item-title">
        <h4 className="collection-name" title={collection.name}>
          {collection.name}
        </h4>
        {collection.description && variant !== 'compact' && (
          <p className="collection-description" title={collection.description}>
            {collection.description}
          </p>
        )}
      </div>

      {showProgress && variant !== 'compact' && (
        <div className="collection-progress-container">
          <CollectionProgress 
            progress={collection.metadata.progress} 
            size={size}
          />
        </div>
      )}

      {showTags && collection.tags.length > 0 && (
        <div className="collection-tags">
          {collection.tags.slice(0, variant === 'compact' ? 2 : 4).map(tag => (
            <Tag
              key={tag}
              minimal
              small={size === 'small'}
              className="collection-tag"
            >
              {tag}
            </Tag>
          ))}
          {collection.tags.length > (variant === 'compact' ? 2 : 4) && (
            <Tag minimal small={size === 'small'} className="collection-tag-more">
              +{collection.tags.length - (variant === 'compact' ? 2 : 4)}
            </Tag>
          )}
        </div>
      )}

      {showMetadata && (
        <CollectionMetadata 
          collection={collection} 
          variant={variant === 'detailed' ? 'detailed' : 'compact'}
        />
      )}
    </div>
  );

  const renderFooter = () => {
    if (variant === 'compact') return null;

    return (
      <div className="collection-item-footer">
        <div className="collection-item-info">
          <span className="collection-updated">
            Updated by {collection.updatedBy}
          </span>
        </div>
        
        {collection.metadata.criticality && (
          <div className="collection-criticality">
            <Tag
              intent={
                collection.metadata.criticality === 'critical' ? 'danger' :
                collection.metadata.criticality === 'high' ? 'warning' :
                collection.metadata.criticality === 'medium' ? 'primary' : 'none'
              }
              minimal
              small
            >
              {collection.metadata.criticality.toUpperCase()}
            </Tag>
          </div>
        )}
      </div>
    );
  };

  // =============================================================================
  // Render
  // =============================================================================

  if (variant === 'compact') {
    return (
      <div
        className={cardClassName}
        style={style}
        onClick={handleCardClick}
        onDoubleClick={handleCardDoubleClick}
        role="listitem"
        aria-selected={selected}
        tabIndex={cardInteractive ? 0 : -1}
      >
        {renderHeader()}
        {renderContent()}
      </div>
    );
  }

  return (
    <Card
      className={cardClassName}
      style={style}
      elevation={cardElevation}
      interactive={cardInteractive}
      onClick={handleCardClick}
      onDoubleClick={handleCardDoubleClick}
      role="listitem"
      aria-selected={selected}
      tabIndex={cardInteractive ? 0 : -1}
    >
      {renderHeader()}
      {renderContent()}
      {renderFooter()}
    </Card>
  );
};

// =============================================================================
// Default Export
// =============================================================================

export default CollectionItem;