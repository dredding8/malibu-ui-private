/**
 * Collection Filters Component
 * 
 * Advanced filtering interface with type, status, tag, and date filters
 * following Blueprint.js design patterns.
 * 
 * @version 1.0.0
 * @date 2025-09-30
 */

import React, { useState } from 'react';
import {
  Button,
  ButtonGroup,
  Card,
  Checkbox,
  Collapse,
  Divider,
  Icon,
  InputGroup,
  Tag,
  TagInput
} from '@blueprintjs/core';
import { DateRangeInput } from '@blueprintjs/datetime';
import { IconNames } from '@blueprintjs/icons';
import { useCollectionContext } from './CollectionProvider';
import { CollectionType, CollectionStatusType } from '../../types/collection.types';
import './CollectionFilters.css';

// =============================================================================
// Component Props
// =============================================================================

export interface CollectionFiltersProps {
  /** Show in panel format */
  isPanel?: boolean;
  /** Show advanced filters */
  showAdvanced?: boolean;
  /** Custom class name */
  className?: string;
  /** Custom styles */
  style?: React.CSSProperties;
  /** Event handlers */
  onApply?: () => void;
  onReset?: () => void;
}

// =============================================================================
// Filter Configuration
// =============================================================================

const COLLECTION_TYPES: Array<{ value: CollectionType; label: string; icon: string }> = [
  { value: 'satellite', label: 'Satellite', icon: IconNames.SATELLITE },
  { value: 'ground_station', label: 'Ground Station', icon: IconNames.CELLULAR_TOWER },
  { value: 'mission', label: 'Mission', icon: IconNames.ROCKET },
  { value: 'campaign', label: 'Campaign', icon: IconNames.PROJECTS },
  { value: 'analysis', label: 'Analysis', icon: IconNames.CHART },
  { value: 'custom', label: 'Custom', icon: IconNames.CUBE },
];

const STATUS_TYPES: Array<{ value: CollectionStatusType; label: string; intent: string }> = [
  { value: 'healthy', label: 'Healthy', intent: 'success' },
  { value: 'warning', label: 'Warning', intent: 'warning' },
  { value: 'critical', label: 'Critical', intent: 'danger' },
  { value: 'offline', label: 'Offline', intent: 'none' },
  { value: 'maintenance', label: 'Maintenance', intent: 'primary' },
];

// =============================================================================
// Main Component
// =============================================================================

/**
 * Collection filters component with advanced filtering options
 * 
 * @example
 * ```tsx
 * // Basic usage
 * <CollectionFilters />
 * 
 * // Panel format
 * <CollectionFilters
 *   isPanel
 *   showAdvanced
 *   onApply={handleApply}
 *   onReset={handleReset}
 * />
 * ```
 */
export const CollectionFilters: React.FC<CollectionFiltersProps> = ({
  isPanel = false,
  showAdvanced = true,
  className = '',
  style,
  onApply,
  onReset,
}) => {
  // =============================================================================
  // Context and State
  // =============================================================================

  const {
    filter,
    updateFilter,
    clearFilters,
    hasActiveFilters,
    availableTags,
    features,
  } = useCollectionContext();

  const [isAdvancedOpen, setIsAdvancedOpen] = useState(false);
  const [tempDateRange, setTempDateRange] = useState<[Date | null, Date | null]>([null, null]);

  // =============================================================================
  // Event Handlers
  // =============================================================================

  const handleTypeToggle = (type: CollectionType) => {
    const newTypes = filter.types.includes(type)
      ? filter.types.filter(t => t !== type)
      : [...filter.types, type];
    updateFilter({ types: newTypes });
  };

  const handleStatusToggle = (status: CollectionStatusType) => {
    const newStatuses = filter.statuses.includes(status)
      ? filter.statuses.filter(s => s !== status)
      : [...filter.statuses, status];
    updateFilter({ statuses: newStatuses });
  };

  const handleTagsChange = (tags: string[]) => {
    updateFilter({ tags });
  };

  const handleDateRangeChange = (range: [Date | null, Date | null]) => {
    setTempDateRange(range);
    if (range[0] && range[1]) {
      updateFilter({ 
        dateRange: { 
          start: range[0], 
          end: range[1] 
        } 
      });
    } else {
      updateFilter({ dateRange: undefined });
    }
  };

  const handleSearchChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    updateFilter({ search: event.target.value });
  };

  const handleApply = () => {
    onApply?.();
  };

  const handleReset = () => {
    clearFilters();
    setTempDateRange([null, null]);
    onReset?.();
  };

  const toggleAdvanced = () => {
    setIsAdvancedOpen(!isAdvancedOpen);
  };

  // =============================================================================
  // Render Functions
  // =============================================================================

  const renderSearchFilter = () => (
    <div className="filter-section">
      <label className="filter-label">Search</label>
      <InputGroup
        placeholder="Search collections..."
        value={filter.search || ''}
        onChange={handleSearchChange}
        leftIcon={IconNames.SEARCH}
        rightElement={
          filter.search ? (
            <Button
              minimal
              icon={IconNames.CROSS}
              onClick={() => updateFilter({ search: '' })}
            />
          ) : undefined
        }
      />
    </div>
  );

  const renderTypeFilter = () => (
    <div className="filter-section">
      <label className="filter-label">
        Collection Types
        {filter.types.length > 0 && (
          <Tag minimal round className="filter-count">
            {filter.types.length}
          </Tag>
        )}
      </label>
      <div className="filter-checkboxes">
        {COLLECTION_TYPES.map(type => (
          <Checkbox
            key={type.value}
            checked={filter.types.includes(type.value)}
            onChange={() => handleTypeToggle(type.value)}
            label={
              <span className="checkbox-label">
                <Icon icon={type.icon} size={14} />
                {type.label}
              </span>
            }
          />
        ))}
      </div>
    </div>
  );

  const renderStatusFilter = () => (
    <div className="filter-section">
      <label className="filter-label">
        Status
        {filter.statuses.length > 0 && (
          <Tag minimal round className="filter-count">
            {filter.statuses.length}
          </Tag>
        )}
      </label>
      <div className="filter-checkboxes">
        {STATUS_TYPES.map(status => (
          <Checkbox
            key={status.value}
            checked={filter.statuses.includes(status.value)}
            onChange={() => handleStatusToggle(status.value)}
            label={
              <span className="checkbox-label">
                <Tag
                  minimal
                  intent={status.intent as any}
                  round
                  className="status-tag"
                >
                  {status.label}
                </Tag>
              </span>
            }
          />
        ))}
      </div>
    </div>
  );

  const renderTagFilter = () => (
    <div className="filter-section">
      <label className="filter-label">
        Tags
        {filter.tags.length > 0 && (
          <Tag minimal round className="filter-count">
            {filter.tags.length}
          </Tag>
        )}
      </label>
      <TagInput
        values={filter.tags}
        onChange={handleTagsChange}
        placeholder="Add tags..."
        leftIcon={IconNames.TAG}
        tagProps={{ minimal: true, intent: 'primary' }}
        inputProps={{ placeholder: 'Type to add tags...' }}
      />
      {availableTags.length > 0 && (
        <div className="available-tags">
          <small>Suggested:</small>
          {availableTags.slice(0, 8).map(tag => (
            <Tag
              key={tag}
              minimal
              interactive
              small
              onClick={() => {
                if (!filter.tags.includes(tag)) {
                  handleTagsChange([...filter.tags, tag]);
                }
              }}
            >
              {tag}
            </Tag>
          ))}
        </div>
      )}
    </div>
  );

  const renderDateFilter = () => (
    <div className="filter-section">
      <label className="filter-label">Date Range</label>
      <DateRangeInput
        allowSingleDayRange
        value={tempDateRange}
        onChange={handleDateRangeChange}
        shortcuts
        popoverProps={{ position: 'bottom-left' }}
      />
    </div>
  );

  const renderAdvancedFilters = () => {
    if (!showAdvanced) return null;

    return (
      <Collapse isOpen={isAdvancedOpen}>
        <div className="advanced-filters">
          <Divider />
          {renderTagFilter()}
          {renderDateFilter()}
        </div>
      </Collapse>
    );
  };

  const renderActions = () => {
    if (!isPanel) return null;

    return (
      <div className="filter-actions">
        <ButtonGroup fill>
          <Button
            intent="primary"
            onClick={handleApply}
            disabled={!hasActiveFilters}
          >
            Apply Filters
          </Button>
          <Button
            onClick={handleReset}
            disabled={!hasActiveFilters}
          >
            Reset
          </Button>
        </ButtonGroup>
      </div>
    );
  };

  // =============================================================================
  // Render
  // =============================================================================

  const content = (
    <div className={`collection-filters ${isPanel ? 'panel' : 'inline'} ${className}`} style={style}>
      {renderSearchFilter()}
      <Divider />
      {renderTypeFilter()}
      <Divider />
      {renderStatusFilter()}
      
      {showAdvanced && (
        <>
          <div className="advanced-toggle">
            <Button
              minimal
              small
              icon={isAdvancedOpen ? IconNames.CHEVRON_UP : IconNames.CHEVRON_DOWN}
              text="Advanced Filters"
              onClick={toggleAdvanced}
            />
          </div>
          {renderAdvancedFilters()}
        </>
      )}
      
      {renderActions()}
    </div>
  );

  return isPanel ? <Card>{content}</Card> : content;
};

// =============================================================================
// Default Export
// =============================================================================

export default CollectionFilters;