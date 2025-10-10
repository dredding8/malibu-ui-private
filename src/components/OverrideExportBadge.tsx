/**
 * Override Export Badge Component
 *
 * Phase 1 Implementation: Story 1.3 - High-Visibility Override Export
 * Evidence-validated through strategic round table and live testing
 *
 * Key Features:
 * - High-contrast visual indicator (unmissable by operators)
 * - Progressive disclosure: Badge → Category → Full justification
 * - Multiple rendering modes (inline, card, export)
 * - Accessible design (WCAG 2.1 AA compliant)
 * - Print-friendly for physical tasking sheets
 *
 * Priority: HIGH - Operator clarity (prevents confusion and rework)
 * Complexity: MEDIUM
 * Business Value: HIGH (addresses critical communication gap)
 */

import React, { useState } from 'react';
import {
  Tag,
  Callout,
  Intent,
  Icon,
  Card,
  Collapse,
  Button,
  Tooltip
} from '@blueprintjs/core';
import { IconNames } from '@blueprintjs/icons';
import {
  OverrideJustification,
  OverrideExportIndicator,
  getOverrideCategoryLabel,
  generateOperatorAlert
} from '../types/collectionOpportunities';
import './OverrideExportBadge.css';

export interface OverrideExportBadgeProps {
  indicator: OverrideExportIndicator;
  variant?: 'inline' | 'card' | 'export' | 'compact';
  showDetails?: boolean;
  className?: string;
}

/**
 * Renders high-visibility override indicator for operator awareness
 * Design based on IA recommendation: Progressive disclosure with unmissable primary signal
 */
export const OverrideExportBadge: React.FC<OverrideExportBadgeProps> = ({
  indicator,
  variant = 'inline',
  showDetails = false,
  className = ''
}) => {
  const [isExpanded, setIsExpanded] = useState(showDetails);

  if (!indicator.isOverride || !indicator.justification) {
    return null;
  }

  const { justification, visualPriority, operatorAlert } = indicator;

  // Intent mapping based on visual priority
  const intentMap: Record<typeof visualPriority, Intent> = {
    high: Intent.DANGER,
    medium: Intent.WARNING,
    low: Intent.PRIMARY
  };

  const intent = intentMap[visualPriority];

  // Render inline variant (for tables, lists)
  if (variant === 'inline') {
    return (
      <div className={`override-badge-inline ${className}`}>
        <Tooltip
          content={operatorAlert}
          position="top"
          intent={intent}
        >
          <Tag
            intent={intent}
            large
            icon={IconNames.HAND}
            className="override-tag-inline"
          >
            OVERRIDE
          </Tag>
        </Tooltip>
      </div>
    );
  }

  // Render compact variant (minimal space usage)
  if (variant === 'compact') {
    return (
      <Tooltip content={operatorAlert} intent={intent}>
        <Tag
          intent={intent}
          minimal
          icon={IconNames.HAND}
          className={`override-badge-compact ${className}`}
        >
          OVERRIDE
        </Tag>
      </Tooltip>
    );
  }

  // Render export variant (for printed/exported tasking)
  if (variant === 'export') {
    return (
      <div className={`override-badge-export ${className}`} data-print="visible">
        <div className="override-header-export">
          <Icon icon={IconNames.WARNING_SIGN} size={20} />
          <strong>MANUAL OVERRIDE</strong>
        </div>
        <div className="override-category-export">
          <strong>Reason:</strong> {getOverrideCategoryLabel(justification.category)}
        </div>
        <div className="override-explanation-export">
          <strong>Details:</strong> {justification.reason}
        </div>
        {justification.additionalContext && (
          <div className="override-context-export">
            <strong>Additional Context:</strong> {justification.additionalContext}
          </div>
        )}
        <div className="override-metadata-export">
          <span>Authorized by: {justification.userName || justification.userId}</span>
          <span>Date: {new Date(justification.timestamp).toLocaleString()}</span>
        </div>
      </div>
    );
  }

  // Render card variant (full details, collapsible)
  return (
    <Card
      className={`override-badge-card ${className}`}
      elevation={2}
      interactive={!isExpanded}
      onClick={() => !isExpanded && setIsExpanded(true)}
    >
      {/* Signal Level 1: Unmissable primary indicator */}
      <div className="override-header">
        <Tag intent={intent} large icon={IconNames.HAND} className="override-tag-primary">
          MANUAL OVERRIDE
        </Tag>
        <Button
          minimal
          small
          icon={isExpanded ? IconNames.CHEVRON_UP : IconNames.CHEVRON_DOWN}
          onClick={(e) => {
            e.stopPropagation();
            setIsExpanded(!isExpanded);
          }}
          aria-label={isExpanded ? 'Collapse details' : 'Expand details'}
        />
      </div>

      {/* Signal Level 2: Category and brief context */}
      <Callout
        intent={intent}
        icon={IconNames.INFO_SIGN}
        className="override-summary"
      >
        <strong>{getOverrideCategoryLabel(justification.category)}</strong>
        <div className="override-sites-summary">
          <Icon icon={IconNames.SWAP_HORIZONTAL} size={12} />
          <span className="site-change">
            System recommended <strong>{justification.originalSiteId}</strong>
            {' → '}
            Operator selected <strong>{justification.alternativeSiteId}</strong>
          </span>
        </div>
      </Callout>

      {/* Signal Level 3: Detailed justification (collapsible) */}
      <Collapse isOpen={isExpanded}>
        <div className="override-details">
          <div className="detail-section">
            <Icon icon={IconNames.DOCUMENT} size={14} />
            <div className="detail-content">
              <strong>Detailed Explanation:</strong>
              <p>{justification.reason}</p>
            </div>
          </div>

          {justification.additionalContext && (
            <div className="detail-section">
              <Icon icon={IconNames.ANNOTATION} size={14} />
              <div className="detail-content">
                <strong>Additional Context:</strong>
                <p>{justification.additionalContext}</p>
              </div>
            </div>
          )}

          <div className="detail-section metadata">
            <Icon icon={IconNames.USER} size={14} />
            <div className="detail-content">
              <strong>Authorization:</strong>
              <p>
                {justification.userName || justification.userId}
                {' • '}
                {new Date(justification.timestamp).toLocaleString()}
              </p>
            </div>
          </div>
        </div>
      </Collapse>

      {/* Operator action prompt */}
      {isExpanded && (
        <Callout intent={Intent.PRIMARY} className="operator-instruction">
          <Icon icon={IconNames.EYE_OPEN} size={14} />
          <strong>Operator Note:</strong> Review override justification before executing tasking.
          Contact collection manager if clarification needed.
        </Callout>
      )}
    </Card>
  );
};

/**
 * Utility function to create export indicator from justification
 * Used when saving override to generate operator-facing indicators
 */
export function createExportIndicator(
  justification: OverrideJustification,
  visualPriority: 'high' | 'medium' | 'low' = 'high'
): OverrideExportIndicator {
  return {
    isOverride: true,
    justification,
    visualPriority,
    operatorAlert: generateOperatorAlert(justification)
  };
}

export default OverrideExportBadge;
