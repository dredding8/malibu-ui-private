/**
 * Opportunity Info Header Enhanced
 *
 * Blueprint.js-aligned persistent header showing key row data from table context.
 * Displays: Satellite Name, Priority (numeric), SCC, Orbit, Periodicity, Match Status
 *
 * Design Principles:
 * ✅ Mirrors table row data structure for continuity
 * ✅ Priority displayed as numeric value (1-4) matching table
 * ✅ Blueprint v5/v6 Tag components with Intent colors
 * ✅ 16px/24px spacing grid alignment
 * ✅ No progressive disclosure - simple, persistent display
 * ✅ WCAG 2.1 AA accessibility compliance
 */

import React from 'react';
import { Tag, Intent, H5 } from '@blueprintjs/core';
import { IconNames } from '@blueprintjs/icons';
import {
  CollectionOpportunity,
  Priority,
  MatchStatus,
} from '../../types/collectionOpportunities';
import { formatSccNumber } from '../../utils/sccFormatting';

import './OpportunityInfoHeaderEnhanced.css';

interface OpportunityInfoHeaderEnhancedProps {
  opportunity: CollectionOpportunity;
}

/**
 * Get numeric priority value matching table display
 * Table priority mapping: low=1, medium=2, high=3, critical=4
 */
const getPriorityNumeric = (priority: Priority, priorityValue?: number): number => {
  if (priorityValue) return priorityValue;

  const priorityMap: Record<Priority, number> = {
    low: 1,
    medium: 2,
    high: 3,
    critical: 4,
  };

  return priorityMap[priority] || 1;
};

/**
 * Get Blueprint Intent based on match status
 */
const getMatchIntent = (matchStatus: MatchStatus): Intent => {
  switch (matchStatus) {
    case 'baseline':
      return Intent.SUCCESS;
    case 'suboptimal':
      return Intent.WARNING;
    case 'unmatched':
      return Intent.DANGER;
    default:
      return Intent.NONE;
  }
};

/**
 * Format periodicity matching table display
 */
const formatPeriodicity = (
  periodicity?: number,
  unit?: 'hours' | 'days' | 'weeks'
): string => {
  if (!periodicity || !unit) return 'N/A';
  return `${periodicity} ${unit}`;
};

export const OpportunityInfoHeaderEnhanced: React.FC<OpportunityInfoHeaderEnhancedProps> = ({
  opportunity,
}) => {
  const {
    sccNumber,
    satellite,
    priority,
    priorityValue,
    periodicity,
    periodicityUnit,
    matchStatus,
  } = opportunity;

  const numericPriority = getPriorityNumeric(priority, priorityValue);

  return (
    <div
      className="opportunity-info-header-enhanced"
      role="region"
      aria-label="Opportunity Details"
    >
      {/* Satellite Identity */}
      <div className="header-identity">
        <H5 className="satellite-name">{satellite.name}</H5>
        {matchStatus && (
          <Tag
            minimal
            intent={getMatchIntent(matchStatus)}
            icon={matchStatus === 'baseline' ? IconNames.TICK_CIRCLE :
                  matchStatus === 'suboptimal' ? IconNames.WARNING_SIGN :
                  IconNames.ERROR}
          >
            {matchStatus.toUpperCase()}
          </Tag>
        )}
      </div>

      {/* Key Properties from Table Row */}
      <div className="header-properties">
        {/* Priority - Plain numeric display matching table exactly */}
        <div className="property-item" role="group" aria-labelledby="priority-label">
          <span id="priority-label" className="property-label">Priority:</span>
          <span className="priority-value" aria-label={`Priority level ${numericPriority}`}>
            {numericPriority}
          </span>
        </div>

        {/* SCC Number */}
        <div className="property-item">
          <span className="property-label">SCC:</span>
          <Tag minimal icon={IconNames.SATELLITE}>
            {formatSccNumber(sccNumber)}
          </Tag>
        </div>

        {/* Orbit Type */}
        <div className="property-item">
          <span className="property-label">Orbit:</span>
          <Tag minimal icon={IconNames.GLOBE}>
            {satellite.orbit}
          </Tag>
        </div>

        {/* Periodicity */}
        <div className="property-item">
          <span className="property-label">Periodicity:</span>
          <Tag minimal icon={IconNames.TIME}>
            {formatPeriodicity(periodicity, periodicityUnit)}
          </Tag>
        </div>
      </div>
    </div>
  );
};

export default OpportunityInfoHeaderEnhanced;
