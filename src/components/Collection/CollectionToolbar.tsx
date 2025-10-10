/**
 * Collection Toolbar Component
 * 
 * Toolbar component with sorting controls, view options, and quick actions
 * for collection management interface.
 * 
 * @version 1.0.0
 * @date 2025-09-30
 */

import React from 'react';
import { 
  Button, 
  ButtonGroup, 
  Divider,
  Icon,
  Menu,
  MenuItem,
  Popover,
  Position,
  Tag,
  Tooltip
} from '@blueprintjs/core';
import { IconNames } from '@blueprintjs/icons';
import { useCollectionContext } from './CollectionProvider';
import './CollectionToolbar.css';

// =============================================================================
// Component Props
// =============================================================================

export interface CollectionToolbarProps {
  /** Show sort controls */
  showSort?: boolean;
  /** Show view density controls */
  showDensity?: boolean;
  /** Show quick actions */
  showQuickActions?: boolean;
  /** Show selection info */
  showSelection?: boolean;
  /** Custom class name */
  className?: string;
  /** Custom styles */
  style?: React.CSSProperties;
  /** Event handlers */
  onExportAll?: () => void;
  onImport?: () => void;
  onSettings?: () => void;
}

// =============================================================================
// Sort Options Configuration
// =============================================================================

const SORT_OPTIONS = [
  { field: 'name', label: 'Name', icon: IconNames.SORT_ALPHABETICAL },
  { field: 'type', label: 'Type', icon: IconNames.TAG },
  { field: 'status', label: 'Status', icon: IconNames.PULSE },
  { field: 'updatedAt', label: 'Last Modified', icon: IconNames.TIME },
  { field: 'createdAt', label: 'Created', icon: IconNames.CALENDAR },
  { field: 'progress', label: 'Progress', icon: IconNames.PERCENTAGE },
];

const DENSITY_OPTIONS = [
  { value: 'compact', label: 'Compact', icon: IconNames.COMPRESSED },
  { value: 'comfortable', label: 'Comfortable', icon: IconNames.STANDARD_VIEW },
  { value: 'spacious', label: 'Spacious', icon: IconNames.FULLSCREEN },
];

// =============================================================================
// Main Component
// =============================================================================

/**
 * Collection toolbar with sorting, view controls, and quick actions
 * 
 * @example
 * ```tsx
 * // Basic usage
 * <CollectionToolbar />
 * 
 * // Minimal toolbar
 * <CollectionToolbar
 *   showSort={false}
 *   showQuickActions={false}
 * />
 * 
 * // Custom configuration
 * <CollectionToolbar
 *   onExportAll={handleExport}
 *   onImport={handleImport}
 *   onSettings={handleSettings}
 * />
 * ```
 */
export const CollectionToolbar: React.FC<CollectionToolbarProps> = ({
  showSort = true,
  showDensity = true,
  showQuickActions = true,
  showSelection = true,
  className = '',
  style,
  onExportAll,
  onImport,
  onSettings,
}) => {
  // =============================================================================
  // Context and State
  // =============================================================================

  const {
    sort,
    density,
    selectedCollections,
    filteredCollections,
    toggleSort,
    setDensity,
    clearSelection,
    selectAll,
    exportAll,
    importCollections,
    features,
    loading,
  } = useCollectionContext();

  // =============================================================================
  // Computed Values
  // =============================================================================

  const selectedCount = selectedCollections.length;
  const totalCount = filteredCollections.length;
  const hasSelection = selectedCount > 0;
  const allSelected = totalCount > 0 && selectedCount === totalCount;

  const currentSortOption = SORT_OPTIONS.find(option => option.field === sort.field);
  const currentDensityOption = DENSITY_OPTIONS.find(option => option.value === density);

  // =============================================================================
  // Event Handlers
  // =============================================================================

  const handleSortChange = (field: string) => {
    toggleSort(field);
  };

  const handleDensityChange = (newDensity: 'compact' | 'comfortable' | 'spacious') => {
    setDensity(newDensity);
  };

  const handleSelectAll = () => {
    if (allSelected) {
      clearSelection();
    } else {
      selectAll();
    }
  };

  const handleExportAll = () => {
    if (onExportAll) {
      onExportAll();
    } else if (features.enableBulkOperations) {
      exportAll();
    }
  };

  const handleImport = () => {
    if (onImport) {
      onImport();
    } else if (features.enableImport) {
      importCollections();
    }
  };

  const handleSettings = () => {
    if (onSettings) {
      onSettings();
    }
  };

  // =============================================================================
  // Render Functions
  // =============================================================================

  const renderSortControls = () => {
    if (!showSort || !features.enableSorting) return null;

    const sortMenu = (
      <Menu>
        {SORT_OPTIONS.map(option => (
          <MenuItem
            key={option.field}
            icon={option.icon}
            text={option.label}
            active={sort.field === option.field}
            onClick={() => handleSortChange(option.field)}
          />
        ))}
      </Menu>
    );

    return (
      <div className="collection-toolbar-sort">
        <Popover content={sortMenu} position={Position.BOTTOM_LEFT}>
          <Button
            minimal
            icon={currentSortOption?.icon || IconNames.SORT}
            text={currentSortOption?.label || 'Sort'}
            rightIcon={IconNames.CARET_DOWN}
          />
        </Popover>
        
        {sort.field && (
          <Button
            minimal
            icon={sort.direction === 'asc' ? IconNames.SORT_ASC : IconNames.SORT_DESC}
            onClick={() => handleSortChange(sort.field)}
            title={`Sort ${sort.direction === 'asc' ? 'descending' : 'ascending'}`}
          />
        )}
      </div>
    );
  };

  const renderDensityControls = () => {
    if (!showDensity || !features.enableDensity) return null;

    const densityMenu = (
      <Menu>
        {DENSITY_OPTIONS.map(option => (
          <MenuItem
            key={option.value}
            icon={option.icon}
            text={option.label}
            active={density === option.value}
            onClick={() => handleDensityChange(option.value as any)}
          />
        ))}
      </Menu>
    );

    return (
      <div className="collection-toolbar-density">
        <Popover content={densityMenu} position={Position.BOTTOM_LEFT}>
          <Tooltip content="View Density" position={Position.TOP}>
            <Button
              minimal
              icon={currentDensityOption?.icon || IconNames.STANDARD_VIEW}
              rightIcon={IconNames.CARET_DOWN}
            />
          </Tooltip>
        </Popover>
      </div>
    );
  };

  const renderSelectionControls = () => {
    if (!showSelection || !features.enableSelection) return null;

    return (
      <div className="collection-toolbar-selection">
        {hasSelection ? (
          <div className="selection-info">
            <Tag intent="primary" minimal>
              {selectedCount} selected
            </Tag>
            <Button
              minimal
              small
              icon={IconNames.CROSS}
              onClick={clearSelection}
              title="Clear selection"
            />
          </div>
        ) : (
          <Button
            minimal
            text="Select All"
            icon={IconNames.SELECT}
            onClick={handleSelectAll}
            disabled={totalCount === 0}
          />
        )}
      </div>
    );
  };

  const renderQuickActions = () => {
    if (!showQuickActions) return null;

    return (
      <div className="collection-toolbar-actions">
        <ButtonGroup>
          {features.enableImport && (
            <Tooltip content="Import Collections" position={Position.TOP}>
              <Button
                minimal
                icon={IconNames.IMPORT}
                onClick={handleImport}
                disabled={loading.importing}
              />
            </Tooltip>
          )}
          
          {features.enableBulkOperations && (
            <Tooltip content="Export All" position={Position.TOP}>
              <Button
                minimal
                icon={IconNames.EXPORT}
                onClick={handleExportAll}
                disabled={loading.exporting || totalCount === 0}
              />
            </Tooltip>
          )}
          
          <Tooltip content="Settings" position={Position.TOP}>
            <Button
              minimal
              icon={IconNames.COG}
              onClick={handleSettings}
            />
          </Tooltip>
        </ButtonGroup>
      </div>
    );
  };

  // =============================================================================
  // Render
  // =============================================================================

  return (
    <div className={`collection-toolbar ${className}`} style={style}>
      <div className="collection-toolbar-left">
        {renderSortControls()}
        {showSort && showDensity && <Divider />}
        {renderDensityControls()}
        {(showSort || showDensity) && showSelection && <Divider />}
        {renderSelectionControls()}
      </div>

      <div className="collection-toolbar-right">
        {renderQuickActions()}
      </div>
    </div>
  );
};

// =============================================================================
// Default Export
// =============================================================================

export default CollectionToolbar;