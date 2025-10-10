import React from 'react';
import {
  Tag,
  Intent,
  Tooltip,
  Button,
  Popover,
  Position,
  Menu,
  MenuItem,
  MenuDivider
} from '@blueprintjs/core';
import { IconNames } from '@blueprintjs/icons';

export interface DataIntegrityIssue {
  type: 'NO_TLE' | 'STALE_EPHEMERIS' | 'SITE_OFFLINE' | 'SENSOR_FAILURE';
  severity: 'critical' | 'warning' | 'info';
  message: string;
  lastKnownGood?: Date;
  satelliteId: string;
}

interface DataIntegrityIndicatorProps {
  issues: DataIntegrityIssue[];
  satelliteId: string;
  onEscalate?: (satelliteId: string, issue: DataIntegrityIssue) => void;
  onRetry?: (satelliteId: string) => void;
  compact?: boolean;
}

/**
 * DataIntegrityIndicator - Shows data quality issues with actionable options
 * Addresses JTBD 3: Diagnose and Escalate Data Integrity Failures
 */
export const DataIntegrityIndicator: React.FC<DataIntegrityIndicatorProps> = ({
  issues,
  satelliteId,
  onEscalate,
  onRetry,
  compact = false
}) => {
  if (!issues || issues.length === 0) return null;

  const criticalIssues = issues.filter(i => i.severity === 'critical');
  const warningIssues = issues.filter(i => i.severity === 'warning');
  
  const mostSevereIssue = criticalIssues[0] || warningIssues[0] || issues[0];

  const getIssueIntent = (issue: DataIntegrityIssue): Intent => {
    switch (issue.severity) {
      case 'critical': return Intent.DANGER;
      case 'warning': return Intent.WARNING;
      default: return Intent.NONE;
    }
  };

  const getIssueIcon = (type: DataIntegrityIssue['type']) => {
    switch (type) {
      case 'NO_TLE': return IconNames.SATELLITE;
      case 'STALE_EPHEMERIS': return IconNames.TIME;
      case 'SITE_OFFLINE': return IconNames.OFFLINE;
      case 'SENSOR_FAILURE': return IconNames.ERROR;
    }
  };

  const actionMenu = (
    <Menu>
      <MenuItem
        icon={IconNames.PHONE}
        text="Escalate to Operations"
        intent={Intent.PRIMARY}
        onClick={() => onEscalate?.(satelliteId, mostSevereIssue)}
      />
      <MenuItem
        icon={IconNames.REFRESH}
        text="Request TLE Update"
        onClick={() => onRetry?.(satelliteId)}
      />
      <MenuDivider />
      <MenuItem
        icon={IconNames.HISTORY}
        text="Use Last Known Good"
        disabled={!mostSevereIssue.lastKnownGood}
        label={mostSevereIssue.lastKnownGood ? 
          `${new Date(mostSevereIssue.lastKnownGood).toLocaleTimeString()}` : 
          'N/A'
        }
      />
      <MenuItem
        icon={IconNames.BAN_CIRCLE}
        text="Mark as Untaskable"
        intent={Intent.DANGER}
      />
    </Menu>
  );

  if (compact) {
    return (
      <Popover content={actionMenu} position={Position.LEFT}>
        <Tag
          intent={getIssueIntent(mostSevereIssue)}
          icon={getIssueIcon(mostSevereIssue.type)}
          interactive
          minimal
        >
          {mostSevereIssue.type.replace('_', ' ')}
        </Tag>
      </Popover>
    );
  }

  return (
    <div className="data-integrity-indicator">
      <Tooltip content={mostSevereIssue.message}>
        <Tag
          intent={getIssueIntent(mostSevereIssue)}
          icon={getIssueIcon(mostSevereIssue.type)}
          rightIcon={issues.length > 1 ? <span>+{issues.length - 1}</span> : undefined}
        >
          {mostSevereIssue.type.replace('_', ' ')}
        </Tag>
      </Tooltip>
      {onEscalate && (
        <Button
          minimal
          small
          icon={IconNames.PHONE}
          intent={Intent.PRIMARY}
          onClick={() => onEscalate(satelliteId, mostSevereIssue)}
        />
      )}
      {onRetry && (
        <Button
          minimal
          small
          icon={IconNames.REFRESH}
          onClick={() => onRetry(satelliteId)}
        />
      )}
    </div>
  );
};

export default DataIntegrityIndicator;