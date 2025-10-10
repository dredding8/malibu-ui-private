/**
 * Operational Days Display Component
 *
 * Visual representation of site operational days showing all 7 days
 * with enabled/disabled state for quick scanning.
 */

import React from 'react';
import { Tag, Intent, Tooltip } from '@blueprintjs/core';
import { DayOfWeekCode } from '../types/collectionOpportunities';

interface OperationalDaysDisplayProps {
  operationalDays: readonly DayOfWeekCode[];
  size?: 'small' | 'medium' | 'large';
  compact?: boolean;
  className?: string;
}

interface DayInfo {
  code: DayOfWeekCode;
  label: string;
  fullName: string;
}

const ALL_DAYS: DayInfo[] = [
  { code: 'M', label: 'M', fullName: 'Monday' },
  { code: 'T', label: 'T', fullName: 'Tuesday' },
  { code: 'W', label: 'W', fullName: 'Wednesday' },
  { code: 'TH', label: 'TH', fullName: 'Thursday' },
  { code: 'F', label: 'F', fullName: 'Friday' },
  { code: 'SA', label: 'SA', fullName: 'Saturday' },
  { code: 'SU', label: 'SU', fullName: 'Sunday' },
];

export const OperationalDaysDisplay: React.FC<OperationalDaysDisplayProps> = ({
  operationalDays,
  size = 'small',
  compact = false,
  className = '',
}) => {
  const tagSize = size === 'small' ? 12 : size === 'medium' ? 14 : 16;
  const gap = compact ? 2 : size === 'small' ? 4 : size === 'medium' ? 6 : 8;

  // Defensive: handle undefined/null operationalDays
  const safeDays = operationalDays || [];

  return (
    <div
      className={`operational-days-display ${className}`}
      style={{
        display: 'inline-flex',
        gap: `${gap}px`,
        alignItems: 'center',
      }}
    >
      {ALL_DAYS.map((day) => {
        const isOperational = safeDays.includes(day.code);

        return (
          <Tooltip
            key={day.code}
            content={`${day.fullName}: ${isOperational ? 'Operational' : 'Closed'}`}
            position="top"
            compact
          >
            <Tag
              minimal={!isOperational}
              intent={isOperational ? Intent.SUCCESS : Intent.NONE}
              style={{
                fontSize: `${tagSize}px`,
                padding: size === 'small' ? '2px 6px' : '4px 8px',
                fontWeight: isOperational ? 600 : 400,
                color: isOperational ? undefined : '#A7B6C2',
                borderColor: isOperational ? undefined : '#E1E8ED',
                opacity: isOperational ? 1 : 0.5,
                cursor: 'default',
                userSelect: 'none',
              }}
            >
              {day.label}
            </Tag>
          </Tooltip>
        );
      })}
    </div>
  );
};

export const OperationalDaysCompact: React.FC<{
  operationalDays: readonly DayOfWeekCode[];
}> = ({ operationalDays }) => {
  return (
    <OperationalDaysDisplay
      operationalDays={operationalDays}
      size="small"
      compact
    />
  );
};

export const OperationalDaysDetailed: React.FC<{
  operationalDays: readonly DayOfWeekCode[];
}> = ({ operationalDays }) => {
  // Defensive: handle undefined/null operationalDays
  const safeDays = operationalDays || [];
  const operationalCount = safeDays.length;
  const is24x7 = operationalCount === 7;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
      <OperationalDaysDisplay
        operationalDays={safeDays}
        size="medium"
      />
      <div style={{ fontSize: '11px', color: '#5C7080', fontStyle: 'italic' }}>
        {is24x7 ? (
          '24/7 Operations'
        ) : operationalCount === 5 && safeDays.includes('M') && safeDays.includes('F') ? (
          'Weekdays Only (M-F)'
        ) : (
          `${operationalCount} day${operationalCount !== 1 ? 's' : ''} per week`
        )}
      </div>
    </div>
  );
};

export default OperationalDaysDisplay;
