/**
 * Impact Warning Modal
 *
 * Mandatory warning dialog shown before saving capacity-affecting changes.
 * User MUST acknowledge impact before save can proceed.
 *
 * PRIORITY: TIER 1 - CRITICAL (Week 2)
 * Part of forced impact acknowledgment gate
 */

import React, { useState } from 'react';
import {
  Dialog,
  Button,
  Intent,
  Callout,
  HTMLTable,
  Checkbox,
  Classes,
  Icon,
  Tag,
} from '@blueprintjs/core';
import { IconNames } from '@blueprintjs/icons';
import { AllocationImpact } from '../utils/impactCalculation';

export interface ImpactWarningModalProps {
  /** Whether modal is open */
  isOpen: boolean;

  /** Calculated impact data */
  impact: AllocationImpact;

  /** Callback when user confirms (acknowledges impact) */
  onConfirm: () => void;

  /** Callback when user cancels */
  onCancel: () => void;

  /** Loading state during save */
  isLoading?: boolean;

  /** Callback when user snoozed warning for session */
  onSnooze?: () => void;
}

/**
 * Shows impact warning with mandatory acknowledgment
 *
 * @example
 * <ImpactWarningModal
 *   isOpen={showWarning}
 *   impact={calculatedImpact}
 *   onConfirm={() => commitChanges()}
 *   onCancel={() => setShowWarning(false)}
 * />
 */
export const ImpactWarningModal: React.FC<ImpactWarningModalProps> = ({
  isOpen,
  impact,
  onConfirm,
  onCancel,
  isLoading = false,
  onSnooze,
}) => {
  const [acknowledged, setAcknowledged] = useState(false);
  const [snoozeChecked, setSnoozeChecked] = useState(false);

  // Reset state when modal opens
  React.useEffect(() => {
    if (isOpen) {
      setAcknowledged(false);
      setSnoozeChecked(false);
    }
  }, [isOpen]);

  // Handle confirmation with optional snooze
  const handleConfirm = () => {
    if (snoozeChecked && onSnooze) {
      onSnooze();
    }
    onConfirm();
  };

  return (
    <Dialog
      isOpen={isOpen}
      onClose={onCancel}
      title="Capacity Warning"
      icon={IconNames.WARNING_SIGN}
      canEscapeKeyClose={false}
      canOutsideClickClose={false}
      className="impact-warning-modal"
      style={{ width: '400px' }}
    >
      <div className={Classes.DIALOG_BODY}>
        {/* Simple Legacy-Style Message */}
        <p style={{ marginBottom: '1rem', fontSize: '14px' }}>
          This change may impact the weekly capacity. Are you sure you want to change?
        </p>

        {/* Snooze Option (Legacy Feature) */}
        {onSnooze && (
          <Checkbox
            checked={snoozeChecked}
            onChange={(e) => setSnoozeChecked((e.target as HTMLInputElement).checked)}
            label="Snooze until next session"
            style={{ marginBottom: '1rem' }}
          />
        )}

        {/* MANDATORY ACKNOWLEDGMENT (Our Enhancement - Keep for Audit) */}
        <div
          style={{
            padding: '0.75rem',
            backgroundColor: 'rgba(219, 55, 55, 0.1)',
            border: '1px solid #DB3737',
            borderRadius: '3px',
          }}
        >
          <Checkbox
            checked={acknowledged}
            onChange={(e) => setAcknowledged((e.target as HTMLInputElement).checked)}
            label={
              <span style={{ fontWeight: 500, fontSize: '0.9em' }}>
                I understand the capacity impact
              </span>
            }
          />
        </div>

        {!acknowledged && (
          <p style={{ marginTop: '0.5rem', color: '#DB3737', fontSize: '0.85em', fontStyle: 'italic' }}>
            You must acknowledge before proceeding.
          </p>
        )}
      </div>

      <div className={Classes.DIALOG_FOOTER}>
        <div className={Classes.DIALOG_FOOTER_ACTIONS}>
          <Button onClick={onCancel} disabled={isLoading}>
            No
          </Button>
          <Button
            intent={Intent.WARNING}
            onClick={handleConfirm}
            disabled={!acknowledged || isLoading}
            loading={isLoading}
          >
            Yes
          </Button>
        </div>
      </div>
    </Dialog>
  );
};

export default ImpactWarningModal;
