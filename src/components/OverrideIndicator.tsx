/**
 * Override Indicator Component
 *
 * Visual indicator shown when user is overriding system recommendations.
 * Displays override status, description of changes, and required action.
 *
 * PRIORITY: TIER 1 - CRITICAL (Week 1)
 * Part of forced override workflow implementation
 */

import React from 'react';
import { Callout, Intent, Tag } from '@blueprintjs/core';
import { IconNames } from '@blueprintjs/icons';

export interface OverrideIndicatorProps {
  /** Whether user is currently overriding system recommendations */
  isOverride: boolean;

  /** Human-readable description of what changed */
  overrideDescription?: string | null;

  /** Whether justification is required */
  requiresJustification?: boolean;

  /** Additional CSS classes */
  className?: string;
}

/**
 * Displays visual indication when user overrides system recommendations
 *
 * @example
 * <OverrideIndicator
 *   isOverride={true}
 *   overrideDescription="Removed: Site DG; Added: Alternative"
 *   requiresJustification={true}
 * />
 */
export const OverrideIndicator: React.FC<OverrideIndicatorProps> = ({
  isOverride,
  overrideDescription,
  requiresJustification = false,
  className,
}) => {
  if (!isOverride) {
    return null; // No indicator needed when following recommendations
  }

  return (
    <Callout
      intent={Intent.WARNING}
      icon={IconNames.WARNING_SIGN}
      title="Override Detected"
      className={className}
      style={{ marginBottom: '1rem' }}
    >
      <p style={{ marginBottom: '0.5rem' }}>
        <strong>You are overriding system recommendations.</strong>
      </p>

      {overrideDescription && (
        <p style={{ marginBottom: '0.5rem', fontFamily: 'monospace', fontSize: '0.9em' }}>
          {overrideDescription}
        </p>
      )}

      {requiresJustification && (
        <div style={{ marginTop: '0.75rem' }}>
          <Tag intent={Intent.DANGER} icon={IconNames.ISSUE}>
            Justification Required (minimum 50 characters)
          </Tag>
        </div>
      )}
    </Callout>
  );
};

export default OverrideIndicator;
