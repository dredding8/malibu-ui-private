import React, { useState, useCallback, useEffect, useRef } from 'react';
import {
  Drawer,
  DrawerSize,
  Button,
  Intent,
  ButtonGroup,
  Tabs,
  Tab,
  TabId,
  Callout,
  Classes,
  Position,
  OverlayToaster,
  Toaster,
  ToastProps,
} from '@blueprintjs/core';
import { IconNames } from '@blueprintjs/icons';
import { CollectionOpportunity } from '../types/collectionOpportunities';
import { useAllocationContext } from '../contexts/AllocationContext';
import ReallocationWorkspace from './ReallocationWorkspace';
import './WorkspaceManager.css';

interface WorkspaceManagerProps {
  isOpen: boolean;
  onClose: () => void;
  opportunity: CollectionOpportunity | null;
  mode: 'quick-edit' | 'workspace' | 'guided-workflow';
  onSave: (changes: any) => Promise<void>;
}

const toasterRef = useRef<Toaster | null>(null);

useEffect(() => {
  OverlayToaster.create({
    position: Position.TOP,
  }).then(toaster => {
    toasterRef.current = toaster;
  });
}, []);

const WorkspaceManager: React.FC<WorkspaceManagerProps> = ({
  isOpen,
  onClose,
  opportunity,
  mode,
  onSave,
}) => {
  const { state, addAllocationChange, commitChanges } = useAllocationContext();
  const [selectedTab, setSelectedTab] = useState<TabId>('allocation');
  const [isDirty, setIsDirty] = useState(false);
  const [autoSaveEnabled, setAutoSaveEnabled] = useState(true);
  const [lastAutoSave, setLastAutoSave] = useState<Date | null>(null);
  
  // Auto-save functionality
  useEffect(() => {
    if (autoSaveEnabled && isDirty && opportunity) {
      const autoSaveTimer = setTimeout(async () => {
        try {
          await handleAutoSave();
          setLastAutoSave(new Date());
          toasterRef.current?.show({
            message: 'Changes auto-saved',
            intent: Intent.SUCCESS,
            icon: IconNames.CLOUD_UPLOAD,
            timeout: 2000,
          });
        } catch (error) {
          toasterRef.current?.show({
            message: 'Auto-save failed',
            intent: Intent.DANGER,
            icon: IconNames.ERROR,
          });
        }
      }, 5000); // 5 seconds delay

      return () => clearTimeout(autoSaveTimer);
    }
  }, [isDirty, autoSaveEnabled, opportunity]);

  const handleAutoSave = async () => {
    if (!opportunity) return;
    
    const changes = state.allocationChanges.get(opportunity.id) || [];
    if (changes.length > 0) {
      await commitChanges();
      setIsDirty(false);
    }
  };

  const handleClose = useCallback(() => {
    if (isDirty) {
      const confirmClose = window.confirm(
        'You have unsaved changes. Are you sure you want to close?'
      );
      if (!confirmClose) return;
    }
    onClose();
  }, [isDirty, onClose]);

  const getDrawerSize = () => {
    switch (mode) {
      case 'quick-edit':
        return DrawerSize.SMALL;
      case 'workspace':
        return DrawerSize.LARGE;
      case 'guided-workflow':
        return '80%' as DrawerSize;
      default:
        return DrawerSize.STANDARD;
    }
  };

  const renderQuickEdit = () => {
    if (!opportunity) return null;

    return (
      <div className="quick-edit-container">
        <h3>Quick Edit: {opportunity.name}</h3>
        <Callout intent={Intent.PRIMARY} icon={IconNames.INFO_SIGN}>
          Make simple changes quickly without entering full workspace mode.
        </Callout>
        
        <div className="quick-edit-form">
          {/* Priority adjustment */}
          <div className="form-group">
            <label>Priority</label>
            <ButtonGroup>
              <Button text="Low" />
              <Button text="Medium" />
              <Button text="High" intent={Intent.WARNING} />
              <Button text="Critical" intent={Intent.DANGER} />
            </ButtonGroup>
          </div>

          {/* Capacity adjustment */}
          <div className="form-group">
            <label>Capacity Adjustment</label>
            <div className="capacity-controls">
              <Button icon={IconNames.MINUS} minimal />
              <span className="capacity-value">{opportunity.capacity}%</span>
              <Button icon={IconNames.PLUS} minimal />
            </div>
          </div>
        </div>
      </div>
    );
  };

  const renderGuidedWorkflow = () => {
    if (!opportunity) return null;

    return (
      <div className="guided-workflow-container">
        <h3>Guided Allocation Workflow</h3>
        <Tabs
          id="guided-workflow-tabs"
          selectedTabId={selectedTab}
          onChange={setSelectedTab}
          animate
        >
          <Tab id="analyze" title="1. Analyze" panel={
            <div className="workflow-step">
              <h4>Current Allocation Analysis</h4>
              <p>Analyzing opportunity health and conflicts...</p>
              {/* Analysis content */}
            </div>
          } />
          <Tab id="recommend" title="2. Recommendations" panel={
            <div className="workflow-step">
              <h4>AI Recommendations</h4>
              <p>Based on analysis, here are suggested allocations...</p>
              {/* Recommendations content */}
            </div>
          } />
          <Tab id="adjust" title="3. Adjust" panel={
            <div className="workflow-step">
              <h4>Fine-tune Allocations</h4>
              <p>Make manual adjustments to the recommendations...</p>
              {/* Adjustment controls */}
            </div>
          } />
          <Tab id="validate" title="4. Validate" panel={
            <div className="workflow-step">
              <h4>Validation Results</h4>
              <p>Checking for conflicts and capacity issues...</p>
              {/* Validation results */}
            </div>
          } />
          <Tab id="confirm" title="5. Confirm" panel={
            <div className="workflow-step">
              <h4>Review & Confirm</h4>
              <p>Review all changes before applying...</p>
              {/* Confirmation summary */}
            </div>
          } />
        </Tabs>
      </div>
    );
  };

  const renderContent = () => {
    switch (mode) {
      case 'quick-edit':
        return renderQuickEdit();
      case 'workspace':
        return opportunity ? (
          <ReallocationWorkspace
            opportunity={opportunity}
            availableSites={state.availableSites}
            passes={state.availablePasses.get(opportunity.satellite.id) || []}
            onClose={onClose}
            onSave={onSave}
          />
        ) : null;
      case 'guided-workflow':
        return renderGuidedWorkflow();
      default:
        return null;
    }
  };

  return (
    <Drawer
      isOpen={isOpen}
      onClose={handleClose}
      title={
        <div className="workspace-header">
          <h2>{mode === 'quick-edit' ? 'Quick Edit' : mode === 'workspace' ? 'Allocation Workspace' : 'Guided Workflow'}</h2>
          {autoSaveEnabled && lastAutoSave && (
            <span className="auto-save-status">
              Last saved: {lastAutoSave.toLocaleTimeString()}
            </span>
          )}
        </div>
      }
      size={getDrawerSize()}
      canEscapeKeyClose={!isDirty}
      className="workspace-drawer"
    >
      <div className={Classes.DRAWER_BODY}>
        {renderContent()}
      </div>
      <div className={Classes.DRAWER_FOOTER}>
        <div className="drawer-footer-content">
          <div className="footer-left">
            {isDirty && (
              <Callout intent={Intent.WARNING} icon={IconNames.WARNING_SIGN}>
                You have unsaved changes
              </Callout>
            )}
          </div>
          <div className="footer-right">
            <Button onClick={handleClose} minimal>
              Cancel
            </Button>
            <Button
              intent={Intent.PRIMARY}
              onClick={() => onSave(state.allocationChanges.get(opportunity?.id || '') || [])}
              disabled={!isDirty}
            >
              Save Changes
            </Button>
          </div>
        </div>
      </div>
    </Drawer>
  );
};

export default WorkspaceManager;