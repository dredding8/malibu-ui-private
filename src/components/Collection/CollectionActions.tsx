/**
 * Collection Actions Component
 * 
 * Bulk actions interface for collection management with confirmation
 * dialogs and progress tracking.
 * 
 * @version 1.0.0
 * @date 2025-09-30
 */

import React, { useState } from 'react';
import { 
  Alert,
  Button, 
  ButtonGroup,
  Callout,
  Dialog,
  Icon,
  Intent,
  Menu,
  MenuItem,
  Popover,
  Position,
  ProgressBar,
  Tag,
  Tooltip
} from '@blueprintjs/core';
import { IconNames } from '@blueprintjs/icons';
import { useCollectionContext } from './CollectionProvider';
import './CollectionActions.css';

// =============================================================================
// Component Props
// =============================================================================

export interface CollectionActionsProps {
  /** Show individual action buttons */
  showIndividualActions?: boolean;
  /** Show bulk actions menu */
  showBulkActions?: boolean;
  /** Show import/export actions */
  showImportExport?: boolean;
  /** Custom class name */
  className?: string;
  /** Custom styles */
  style?: React.CSSProperties;
  /** Event handlers */
  onCustomAction?: (action: string, collections: string[]) => void;
}

// =============================================================================
// Action Configuration
// =============================================================================

interface ActionConfig {
  key: string;
  label: string;
  icon: string;
  intent?: Intent;
  requiresConfirmation?: boolean;
  confirmationTitle?: string;
  confirmationMessage?: string;
  dangerous?: boolean;
}

const BULK_ACTIONS: ActionConfig[] = [
  {
    key: 'export',
    label: 'Export Selected',
    icon: IconNames.EXPORT,
    intent: 'primary',
  },
  {
    key: 'duplicate',
    label: 'Duplicate Selected',
    icon: IconNames.DUPLICATE,
    intent: 'none',
  },
  {
    key: 'archive',
    label: 'Archive Selected',
    icon: IconNames.ARCHIVE,
    intent: 'none',
    requiresConfirmation: true,
    confirmationTitle: 'Archive Collections',
    confirmationMessage: 'Are you sure you want to archive the selected collections? They will be moved to the archive but can be restored later.',
  },
  {
    key: 'delete',
    label: 'Delete Selected',
    icon: IconNames.TRASH,
    intent: 'danger',
    requiresConfirmation: true,
    confirmationTitle: 'Delete Collections',
    confirmationMessage: 'Are you sure you want to permanently delete the selected collections? This action cannot be undone.',
    dangerous: true,
  },
];

const IMPORT_EXPORT_ACTIONS: ActionConfig[] = [
  {
    key: 'import',
    label: 'Import Collections',
    icon: IconNames.IMPORT,
    intent: 'primary',
  },
  {
    key: 'export-all',
    label: 'Export All',
    icon: IconNames.EXPORT,
    intent: 'none',
  },
  {
    key: 'export-filtered',
    label: 'Export Filtered',
    icon: IconNames.FILTER,
    intent: 'none',
  },
];

// =============================================================================
// Main Component
// =============================================================================

/**
 * Collection actions component with bulk operations and confirmations
 * 
 * @example
 * ```tsx
 * // Basic usage
 * <CollectionActions />
 * 
 * // Custom configuration
 * <CollectionActions
 *   showIndividualActions={false}
 *   showImportExport
 *   onCustomAction={handleCustomAction}
 * />
 * ```
 */
export const CollectionActions: React.FC<CollectionActionsProps> = ({
  showIndividualActions = true,
  showBulkActions = true,
  showImportExport = true,
  className = '',
  style,
  onCustomAction,
}) => {
  // =============================================================================
  // Context and State
  // =============================================================================

  const {
    selectedCollections,
    filteredCollections,
    deleteSelected,
    duplicateSelected,
    exportSelected,
    exportAll,
    exportFiltered,
    archiveSelected,
    importCollections,
    clearSelection,
    features,
    loading,
    operations,
  } = useCollectionContext();

  const [confirmDialog, setConfirmDialog] = useState<{
    isOpen: boolean;
    action?: ActionConfig;
    onConfirm?: () => void;
  }>({ isOpen: false });

  // =============================================================================
  // Computed Values
  // =============================================================================

  const selectedCount = selectedCollections.length;
  const hasSelection = selectedCount > 0;
  const isOperationInProgress = Object.values(loading).some(Boolean);

  // =============================================================================
  // Event Handlers
  // =============================================================================

  const executeAction = async (action: ActionConfig) => {
    if (action.requiresConfirmation) {
      setConfirmDialog({
        isOpen: true,
        action,
        onConfirm: () => performAction(action),
      });
      return;
    }

    await performAction(action);
  };

  const performAction = async (action: ActionConfig) => {
    try {
      switch (action.key) {
        case 'export':
          await exportSelected();
          break;
        case 'duplicate':
          await duplicateSelected();
          break;
        case 'archive':
          await archiveSelected();
          break;
        case 'delete':
          await deleteSelected();
          break;
        case 'import':
          await importCollections();
          break;
        case 'export-all':
          await exportAll();
          break;
        case 'export-filtered':
          await exportFiltered();
          break;
        default:
          if (onCustomAction) {
            onCustomAction(action.key, selectedCollections);
          }
      }
    } catch (error) {
      console.error(`Action ${action.key} failed:`, error);
    }
  };

  const closeConfirmDialog = () => {
    setConfirmDialog({ isOpen: false });
  };

  const confirmAction = () => {
    if (confirmDialog.onConfirm) {
      confirmDialog.onConfirm();
    }
    closeConfirmDialog();
  };

  // =============================================================================
  // Render Functions
  // =============================================================================

  const renderIndividualActions = () => {
    if (!showIndividualActions || !hasSelection) return null;

    const quickActions = BULK_ACTIONS.filter(action => !action.dangerous).slice(0, 2);

    return (
      <div className="collection-actions-individual">
        <ButtonGroup>
          {quickActions.map(action => (
            <Tooltip key={action.key} content={action.label} position={Position.TOP}>
              <Button
                minimal
                icon={action.icon}
                intent={action.intent}
                onClick={() => executeAction(action)}
                disabled={isOperationInProgress}
              />
            </Tooltip>
          ))}
        </ButtonGroup>
      </div>
    );
  };

  const renderBulkActionsMenu = () => {
    if (!showBulkActions || !hasSelection) return null;

    const bulkMenu = (
      <Menu>
        {BULK_ACTIONS.map(action => (
          <MenuItem
            key={action.key}
            icon={action.icon}
            text={action.label}
            intent={action.intent}
            onClick={() => executeAction(action)}
            disabled={isOperationInProgress}
          />
        ))}
      </Menu>
    );

    return (
      <div className="collection-actions-bulk">
        <Popover content={bulkMenu} position={Position.BOTTOM_RIGHT}>
          <Button
            intent="primary"
            rightIcon={IconNames.CARET_DOWN}
            disabled={isOperationInProgress}
          >
            Bulk Actions ({selectedCount})
          </Button>
        </Popover>
      </div>
    );
  };

  const renderImportExportActions = () => {
    if (!showImportExport) return null;

    const importExportMenu = (
      <Menu>
        {IMPORT_EXPORT_ACTIONS.map(action => (
          <MenuItem
            key={action.key}
            icon={action.icon}
            text={action.label}
            intent={action.intent}
            onClick={() => executeAction(action)}
            disabled={
              isOperationInProgress ||
              (action.key === 'export-filtered' && filteredCollections.length === 0)
            }
          />
        ))}
      </Menu>
    );

    return (
      <div className="collection-actions-import-export">
        <Popover content={importExportMenu} position={Position.BOTTOM_RIGHT}>
          <Button
            minimal
            icon={IconNames.IMPORT}
            rightIcon={IconNames.CARET_DOWN}
            disabled={isOperationInProgress}
          />
        </Popover>
      </div>
    );
  };

  const renderOperationProgress = () => {
    const currentOperation = operations.current;
    if (!currentOperation) return null;

    return (
      <div className="collection-actions-progress">
        <Callout intent="primary" icon={IconNames.TIME}>
          <div className="operation-info">
            <div className="operation-header">
              <span className="operation-title">{currentOperation.type}</span>
              <Tag minimal>{currentOperation.progress}%</Tag>
            </div>
            <ProgressBar
              value={currentOperation.progress / 100}
              intent="primary"
              stripes={currentOperation.progress < 100}
            />
            <div className="operation-details">
              Processed {currentOperation.processed} of {currentOperation.total} items
            </div>
          </div>
        </Callout>
      </div>
    );
  };

  const renderSelectionInfo = () => {
    if (!hasSelection) return null;

    return (
      <div className="collection-actions-selection">
        <Tag intent="primary" large>
          <Icon icon={IconNames.SELECTION} />
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
    );
  };

  const renderConfirmationDialog = () => {
    const { isOpen, action } = confirmDialog;
    if (!isOpen || !action) return null;

    return (
      <Alert
        isOpen={isOpen}
        canEscapeKeyCancel
        canOutsideClickCancel
        confirmButtonText={action.dangerous ? 'Delete' : 'Confirm'}
        cancelButtonText="Cancel"
        intent={action.intent || 'primary'}
        icon={action.icon}
        onCancel={closeConfirmDialog}
        onConfirm={confirmAction}
      >
        <div className="confirmation-content">
          <h4>{action.confirmationTitle}</h4>
          <p>{action.confirmationMessage}</p>
          {selectedCount > 0 && (
            <div className="confirmation-details">
              <strong>Affected collections:</strong> {selectedCount}
            </div>
          )}
          {action.dangerous && (
            <Callout intent="danger" icon={IconNames.WARNING_SIGN}>
              This action cannot be undone. Please confirm you want to proceed.
            </Callout>
          )}
        </div>
      </Alert>
    );
  };

  // =============================================================================
  // Render
  // =============================================================================

  return (
    <div className={`collection-actions ${className}`} style={style}>
      {renderOperationProgress()}
      
      <div className="collection-actions-controls">
        {renderSelectionInfo()}
        {renderIndividualActions()}
        {renderBulkActionsMenu()}
        {renderImportExportActions()}
      </div>

      {renderConfirmationDialog()}
    </div>
  );
};

// =============================================================================
// Default Export
// =============================================================================

export default CollectionActions;