/**
 * Opportunity Info Header
 *
 * Persistent header component displaying key opportunity properties:
 * - SCC Number
 * - Orbit Type
 * - Priority Level
 * - Periodicity
 *
 * Remains visible across all tabs and editor modes for context awareness.
 */

import React from 'react';
import { Tag, Intent } from '@blueprintjs/core';
import { IconNames } from '@blueprintjs/icons';
import { CollectionOpportunity, Priority } from '../../types/collectionOpportunities';
import { formatSccNumber } from '../../utils/sccFormatting';

import './OpportunityInfoHeader.css';

interface OpportunityInfoHeaderProps {
  opportunity: CollectionOpportunity;
}

/**
 * Get intent color based on priority level
 */
const getPriorityIntent = (priority: Priority): Intent => {
  switch (priority) {
    case 'critical':
      return Intent.DANGER;
    case 'high':
      return Intent.WARNING;
    case 'medium':
      return Intent.PRIMARY;
    case 'low':
      return Intent.NONE;
    default:
      return Intent.NONE;
  }
};

/**
 * Format periodicity for display
 */
const formatPeriodicity = (
  periodicity?: number,
  unit?: 'hours' | 'days' | 'weeks'
): string => {
  if (!periodicity || !unit) return 'N/A';
  return `${periodicity} ${unit}`;
};

export const OpportunityInfoHeader: React.FC<OpportunityInfoHeaderProps> = ({
  opportunity,
}) => {
  const { sccNumber, satellite, priority, periodicity, periodicityUnit } = opportunity;

  return (
    <div className="opportunity-info-header">
      <div className="opportunity-info-header-content">
        {/* SCC Number */}
        <div className="info-item">
          <span className="info-label">SCC:</span>
          <Tag
            minimal
            icon={IconNames.SATELLITE}
            className="info-value"
          >
            {formatSccNumber(sccNumber)}
          </Tag>
        </div>

        {/* Orbit Type */}
        <div className="info-item">
          <span className="info-label">Orbit:</span>
          <Tag
            minimal
            icon={IconNames.GLOBE}
            className="info-value"
          >
            {satellite.orbit}
          </Tag>
        </div>

        {/* Priority Level */}
        <div className="info-item">
          <span className="info-label">Priority:</span>
          <Tag
            intent={getPriorityIntent(priority)}
            icon={IconNames.FLAG}
            className="info-value priority-tag"
          >
            {priority.toUpperCase()}
          </Tag>
        </div>

        {/* Periodicity */}
        <div className="info-item">
          <span className="info-label">Periodicity:</span>
          <Tag
            minimal
            icon={IconNames.TIME}
            className="info-value"
          >
            {formatPeriodicity(periodicity, periodicityUnit)}
          </Tag>
        </div>
      </div>
    </div>
  );
};

export default OpportunityInfoHeader;
