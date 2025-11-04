/**
 * Unified Opportunity Editor
 *
 * Consolidates QuickEditModal, EditOpportunityModal, AllocationEditorPanel,
 * OverrideModal, and ManualOverrideModalRefactored into a single component
 * with three progressive modes: quick, standard, and override.
 *
 * ARCHITECTURE:
 * - Quick Mode: Drawer for simple edits (priority, notes)
 * - Standard Mode: Dialog for moderate edits (site selection + justification)
 * - Override Mode: Full dialog with tabs for complex workflows
 *
 * CONSOLIDATION BENEFITS:
 * - Single source of truth for editing logic
 * - Consistent validation across all modes
 * - Reduced code duplication (60%+ reduction)
 * - Improved user experience (clear progression)
 */

import React, { useCallback, useState, useEffect } from 'react';
import {
  Dialog,
  Drawer,
  Classes,
  Button,
  Intent,
  Position,
  Spinner,
} from '@blueprintjs/core';
import { IconNames } from '@blueprintjs/icons';

import { UnifiedEditorProps } from '../types/unifiedEditor';
import { useUnifiedEditor } from '../hooks/useUnifiedEditor';

// Mode-specific form components (to be implemented)
import { QuickEditForm } from './UnifiedEditor/QuickEditForm';
import { StandardEditForm } from './UnifiedEditor/StandardEditForm';
import { OverrideWorkflow } from './UnifiedEditor/OverrideWorkflow';
import { OpportunityInfoHeaderEnhanced } from './UnifiedEditor/OpportunityInfoHeaderEnhanced';

// Week 2: Impact warning gate
import { ImpactWarningModal } from './ImpactWarningModal';
import {
  calculateAllocationImpact,
  requiresImpactAcknowledgment,
  formatImpactForAudit,
  AllocationImpact,
} from '../utils/impactCalculation';

// UX Research: Single Ease Question (SEQ)
import { SingleEaseQuestion, SEQResponse } from './SEQ/SingleEaseQuestion';
import { seqService } from '../services/seqService';

import './UnifiedOpportunityEditor.css';

/**
 * Main Unified Editor Component
 */
export const UnifiedOpportunityEditor: React.FC<UnifiedEditorProps> = ({
  opportunity,
  availableSites,
  availablePasses = [],
  mode: forcedMode,
  isOpen,
  onClose,
  onSave,
  onSaveAndNext,
  capacityThresholds = { critical: 10, warning: 30, optimal: 70 },
  enableRealTimeValidation = true,
  enableUndoRedo = false,
  enableBatchOperations = false,
}) => {
  // Use unified editor hook for state management
  const editor = useUnifiedEditor(opportunity, availableSites, {
    mode: forcedMode,
    enableUndoRedo: forcedMode === 'override' ? enableUndoRedo : false,
    enableRealTimeValidation,
    capacityThresholds,
  });

  const [isSaving, setIsSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [saveStatus, setSaveStatus] = useState<string | null>(null);

  // WEEK 2: Impact warning state
  const [showImpactWarning, setShowImpactWarning] = useState(false);
  const [pendingImpact, setPendingImpact] = useState<AllocationImpact | null>(null);
  const [impactAcknowledged, setImpactAcknowledged] = useState(false);

  // UX Research: SEQ state
  const [showSEQ, setShowSEQ] = useState(false);
  const [seqTaskId] = useState(() => `task_4_edit_satellite_${editor.mode}`);

  // Handle save with validation
  const handleSave = useCallback(async () => {
    // WEEK 1: GATE 1 - Override Detection + Forced Justification
    if (editor.requiresJustification) {
      setSaveError(
        'Justification is required when overriding system recommendations. ' +
        (editor.overrideDescription || 'Please provide a reason for this change.')
      );
      return; // BLOCKED - Cannot proceed without justification
    }

    // Validate before saving
    if (!editor.isValid) {
      console.warn('Validation failed:', editor.validation.errors);
      return;
    }

    // WEEK 2: GATE 2 - Impact Calculation + Forced Acknowledgment
    // Calculate impact of allocation changes
    const impact = calculateAllocationImpact(
      opportunity.allocatedSites,
      editor.state.opportunity.allocatedSites,
      availableSites
    );

    // If impact requires acknowledgment and not yet acknowledged, show warning
    if (requiresImpactAcknowledgment(impact) && !impactAcknowledged) {
      setPendingImpact(impact);
      setShowImpactWarning(true);
      return; // BLOCKED - Must acknowledge impact first
    }

    setIsSaving(true);
    setSaveError(null);

    try {
      // Prepare changes
      const changes: Partial<typeof opportunity> = {
        ...editor.state.opportunity,
        changeJustification: editor.state.justification,
        classificationLevel: editor.state.classificationLevel,
        lastModified: new Date().toISOString(),
        modifiedBy: 'current-user', // TODO: Get from auth context
      };

      // WEEK 2: Add impact acknowledgment to audit trail if acknowledged
      if (impactAcknowledged && pendingImpact) {
        const impactAudit = formatImpactForAudit(
          pendingImpact,
          true,
          'current-user' // TODO: Get from auth context
        );
        (changes as any).impactAcknowledgment = impactAudit;
      }

      // Call save callback
      await onSave(opportunity.id, changes);

      // Reset impact state
      setImpactAcknowledged(false);
      setPendingImpact(null);

      // Set success status for screen readers
      setSaveStatus('Changes saved successfully');
      setTimeout(() => setSaveStatus(null), 3000);

      // UX Research: Show SEQ based on sampling (33% of saves)
      if (seqService.shouldShowSEQ(seqTaskId)) {
        // Delay SEQ to allow success feedback to be noticed (Peak-End Rule)
        setTimeout(() => setShowSEQ(true), 500);
      } else {
        // Close editor immediately if no SEQ
        onClose();
      }
    } catch (error) {
      console.error('Failed to save opportunity:', error);
      setSaveError(error instanceof Error ? error.message : 'Failed to save changes');
    } finally {
      setIsSaving(false);
    }
  }, [
    opportunity.id,
    opportunity.allocatedSites,
    editor,
    availableSites,
    impactAcknowledged,
    pendingImpact,
    onSave,
    onClose,
  ]);

  // WEEK 2: Handle impact confirmation
  const handleImpactConfirm = useCallback(() => {
    setImpactAcknowledged(true);
    setShowImpactWarning(false);
    // Trigger save again now that impact is acknowledged
    setTimeout(() => handleSave(), 0);
  }, [handleSave]);

  // WEEK 2: Handle impact cancel
  const handleImpactCancel = useCallback(() => {
    setShowImpactWarning(false);
    setPendingImpact(null);
    setImpactAcknowledged(false);
  }, []);

  // UX Research: Handle SEQ response
  const handleSEQResponse = useCallback((response: SEQResponse) => {
    seqService.recordResponse(response);
    setShowSEQ(false);
    // Close editor after SEQ submission
    onClose();
  }, [onClose]);

  // UX Research: Handle SEQ dismissal
  const handleSEQDismiss = useCallback(() => {
    seqService.recordDismissal(
      seqTaskId,
      `TASK 4: Edit Satellite Data (${editor.mode} mode)`
    );
    setShowSEQ(false);
    // Close editor after SEQ dismissal
    onClose();
  }, [seqTaskId, editor.mode, onClose]);

  // Handle save and next
  const handleSaveAndNext = useCallback(async () => {
    if (!onSaveAndNext || !editor.isValid) return;

    setIsSaving(true);
    setSaveError(null);

    try {
      const changes: Partial<typeof opportunity> = {
        ...editor.state.opportunity,
        changeJustification: editor.state.justification,
        classificationLevel: editor.state.classificationLevel,
        lastModified: new Date().toISOString(),
        modifiedBy: 'current-user',
      };

      await onSaveAndNext(opportunity.id, changes);
      // Don't close - parent will navigate to next
    } catch (error) {
      console.error('Failed to save and next:', error);
      setSaveError(error instanceof Error ? error.message : 'Failed to save changes');
    } finally {
      setIsSaving(false);
    }
  }, [opportunity.id, editor, onSaveAndNext]);

  // Handle close with dirty check
  const handleClose = useCallback(() => {
    if (editor.hasChanges) {
      const confirmed = window.confirm(
        'You have unsaved changes. Are you sure you want to discard them?'
      );
      if (!confirmed) return;
    }
    onClose();
  }, [editor.hasChanges, onClose]);

  // Add scroll shadow effect for drawer header
  useEffect(() => {
    if (!isOpen || editor.mode !== 'override') return;

    const drawerBody = document.querySelector('.unified-editor-override-drawer .bp5-drawer-body, .unified-editor-override-drawer .bp6-drawer-body');
    const drawerHeader = document.querySelector('.unified-editor-override-drawer .bp5-drawer-header, .unified-editor-override-drawer .bp6-drawer-header');

    if (!drawerBody || !drawerHeader) return;

    const handleScroll = () => {
      if (drawerBody.scrollTop > 10) {
        drawerHeader.classList.add('has-scroll-shadow');
      } else {
        drawerHeader.classList.remove('has-scroll-shadow');
      }
    };

    drawerBody.addEventListener('scroll', handleScroll);
    return () => drawerBody.removeEventListener('scroll', handleScroll);
  }, [isOpen, editor.mode]);

  // Keyboard shortcuts
  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      // Ctrl/Cmd + S: Save
      if ((e.ctrlKey || e.metaKey) && e.key === 's') {
        e.preventDefault();
        handleSave();
      }

      // Ctrl/Cmd + Enter: Save
      if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') {
        e.preventDefault();
        handleSave();
      }

      // Escape: Close (if no changes)
      if (e.key === 'Escape' && !editor.hasChanges) {
        e.preventDefault();
        onClose();
      }

      // Ctrl/Cmd + Z: Undo (override mode only)
      if ((e.ctrlKey || e.metaKey) && e.key === 'z' && editor.canUndo) {
        e.preventDefault();
        editor.undo();
      }

      // Ctrl/Cmd + Shift + Z: Redo (override mode only)
      if ((e.ctrlKey || e.metaKey) && e.shiftKey && e.key === 'z' && editor.canRedo) {
        e.preventDefault();
        editor.redo();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, handleSave, onClose, editor]);

  // Render appropriate mode and impact warning modal
  const editorContent = (() => {
    switch (editor.mode) {
      case 'quick':
        return (
          <Drawer
            isOpen={isOpen}
            onClose={handleClose}
            position={Position.RIGHT}
            size="400px"
            title="Quick Edit"
            icon={IconNames.EDIT}
            className="unified-editor-drawer"
            canEscapeKeyClose={!editor.hasChanges}
            canOutsideClickClose={!editor.hasChanges}
          >
            <OpportunityInfoHeaderEnhanced opportunity={opportunity} />
            <div className={Classes.DRAWER_BODY}>
              <QuickEditForm
                editor={editor}
                opportunity={opportunity}
                availableSites={availableSites}
              />
            </div>

            <div className={Classes.DRAWER_FOOTER}>
              <div className={Classes.DIALOG_FOOTER_ACTIONS}>
                <Button onClick={handleClose} disabled={isSaving}>
                  Cancel
                </Button>
                <Button
                  intent={Intent.PRIMARY}
                  onClick={handleSave}
                  disabled={!editor.hasChanges || !editor.isValid || isSaving}
                  loading={isSaving}
                  icon={IconNames.FLOPPY_DISK}
                >
                  Save
                </Button>
              </div>
            </div>
          </Drawer>
        );

    case 'standard':
      return (
        <Dialog
          isOpen={isOpen}
          onClose={handleClose}
          title={`Edit: ${opportunity.name}`}
          icon={IconNames.EDIT}
          className="unified-editor-dialog"
          style={{ width: '600px' }}
          canEscapeKeyClose={!editor.hasChanges}
          canOutsideClickClose={!editor.hasChanges}
        >
          <OpportunityInfoHeaderEnhanced opportunity={opportunity} />
          <div className={Classes.DIALOG_BODY}>
            <StandardEditForm
              editor={editor}
              opportunity={opportunity}
              availableSites={availableSites}
              capacityThresholds={capacityThresholds}
            />

            {saveError && (
              <div className="save-error-message" style={{ marginTop: '1rem' }}>
                <p style={{ color: '#DB3737' }}>
                  <strong>Error:</strong> {saveError}
                </p>
              </div>
            )}
          </div>

          <div className={Classes.DIALOG_FOOTER}>
            <div className={Classes.DIALOG_FOOTER_ACTIONS}>
              <Button onClick={handleClose} disabled={isSaving}>
                Cancel
              </Button>
              {onSaveAndNext && (
                <Button
                  intent={Intent.PRIMARY}
                  onClick={handleSaveAndNext}
                  disabled={!editor.hasChanges || !editor.isValid || isSaving}
                  loading={isSaving}
                  icon={IconNames.ARROW_RIGHT}
                >
                  Save & Next
                </Button>
              )}
              <Button
                intent={Intent.PRIMARY}
                onClick={handleSave}
                disabled={!editor.hasChanges || !editor.isValid || isSaving}
                loading={isSaving}
                icon={IconNames.FLOPPY_DISK}
              >
                Save Changes
              </Button>
            </div>
          </div>
        </Dialog>
      );

    case 'override':
      return (
        <Drawer
          isOpen={isOpen}
          onClose={handleClose}
          position={Position.BOTTOM}
          size="90vh"
          title="Manual Override Workflow"
          icon={IconNames.EDIT}
          className="unified-editor-override-drawer"
          canEscapeKeyClose={!editor.hasChanges}
          canOutsideClickClose={!editor.hasChanges}
          hasBackdrop={true}
        >
          <OpportunityInfoHeaderEnhanced opportunity={opportunity} />
          <div className={Classes.DRAWER_BODY}>
            <OverrideWorkflow
              editor={editor}
              opportunity={opportunity}
              availableSites={availableSites}
              availablePasses={availablePasses}
              capacityThresholds={capacityThresholds}
              enableBatchOperations={enableBatchOperations}
            />

            {saveError && (
              <div className="save-error-message" style={{ marginTop: '1rem' }}>
                <p style={{ color: '#DB3737' }}>
                  <strong>Error:</strong> {saveError}
                </p>
              </div>
            )}
          </div>

          <div className={Classes.DRAWER_FOOTER}>
            <div className={Classes.DIALOG_FOOTER_ACTIONS}>
              {/* Undo/Redo Controls */}
              {enableUndoRedo && (
                <div style={{ marginRight: 'auto' }}>
                  <Button
                    minimal
                    icon={IconNames.UNDO}
                    onClick={editor.undo}
                    disabled={!editor.canUndo}
                    title="Undo (Ctrl+Z)"
                  />
                  <Button
                    minimal
                    icon={IconNames.REDO}
                    onClick={editor.redo}
                    disabled={!editor.canRedo}
                    title="Redo (Ctrl+Shift+Z)"
                  />
                </div>
              )}

              <Button onClick={handleClose} disabled={isSaving}>
                Cancel
              </Button>
              <Button
                intent={Intent.PRIMARY}
                onClick={handleSave}
                disabled={!editor.hasChanges || !editor.isValid || isSaving}
                loading={isSaving}
                icon={IconNames.ENDORSED}
              >
                Allocate
              </Button>
            </div>
          </div>
        </Drawer>
      );

      default:
        return null;
    }
  })();

  return (
    <>
      {editorContent}

      {/* WEEK 2: Impact warning modal (GATE 2) - renders across all modes */}
      {showImpactWarning && pendingImpact && (
        <ImpactWarningModal
          isOpen={showImpactWarning}
          impact={pendingImpact}
          onConfirm={handleImpactConfirm}
          onCancel={handleImpactCancel}
          isLoading={isSaving}
        />
      )}

      {/* UX Research: Single Ease Question (SEQ) - Post-task survey */}
      {showSEQ && (
        <SingleEaseQuestion
          taskId={seqTaskId}
          taskName={`TASK 4: Edit Satellite Data (${editor.mode} mode)`}
          onResponse={handleSEQResponse}
          onDismiss={handleSEQDismiss}
          enableComment={editor.mode === 'override'} // Only complex mode gets optional comment
          sessionId={seqService.getSessionId()}
        />
      )}

      {/* ARIA live regions for screen reader announcements */}
      <div
        role="status"
        aria-live="polite"
        aria-atomic="true"
        className="editor-sr-only"
      >
        {saveStatus}
      </div>

      <div
        role="alert"
        aria-live="assertive"
        aria-atomic="true"
        className="editor-sr-only"
      >
        {saveError}
      </div>
    </>
  );
};

export default UnifiedOpportunityEditor;
