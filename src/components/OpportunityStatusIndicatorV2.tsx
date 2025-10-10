import React, { useMemo, useCallback } from 'react';
import {
  Intent,
  Tooltip,
  Tag,
  Position,
  Classes
} from '@blueprintjs/core';
import { IconNames } from '@blueprintjs/icons';
import { Icon } from '@blueprintjs/core';
import { OpportunityStatus } from '../types/collectionOpportunities';
import './OpportunityStatusIndicatorV2.css';

// Multi-dimensional status interface
export interface EnhancedStatusDimensions {
  operational: OpportunityStatus;
  capacity: number;
  capacityLevel: 'normal' | 'high' | 'critical';
  priority: 'low' | 'medium' | 'high' | 'critical';
  conflicts: string[];
  trend?: 'improving' | 'stable' | 'degrading';
  lastUpdate?: string;
}

interface OpportunityStatusIndicatorV2Props {
  status: EnhancedStatusDimensions;
  showTooltip?: boolean;
  size?: 'small' | 'medium' | 'large';
  enableAnimation?: boolean;
  showMultiDimensional?: boolean;
  alertFatiguePrevention?: boolean;
  onStatusClick?: (status: EnhancedStatusDimensions) => void;
}

// Shape-based icons for colorblind accessibility
const STATUS_SHAPES = {
  optimal: { icon: IconNames.TICK_CIRCLE, shape: 'circle' },
  warning: { icon: IconNames.WARNING_SIGN, shape: 'triangle' },
  critical: { icon: IconNames.ERROR, shape: 'square' }
} as const;

// Extended intent mapping
const CRITICAL_INTENTS = {
  optimal: Intent.SUCCESS,
  warning: Intent.WARNING,
  critical: Intent.DANGER
} as const;

// Capacity thresholds
const CAPACITY_THRESHOLDS = {
  normal: { max: 70, intent: Intent.SUCCESS },
  high: { max: 90, intent: Intent.WARNING },
  critical: { max: 100, intent: Intent.DANGER }
};

const getCapacityLevel = (capacity: number): 'normal' | 'high' | 'critical' => {
  if (capacity >= 90) return 'critical';
  if (capacity >= 70) return 'high';
  return 'normal';
};

const OpportunityStatusIndicatorV2 = React.memo<OpportunityStatusIndicatorV2Props>(({
  status,
  showTooltip = true,
  size = 'medium',
  enableAnimation = true,
  showMultiDimensional = true,
  alertFatiguePrevention = true,
  onStatusClick
}) => {
  // Memoize status configuration
  const statusConfig = useMemo(() => {
    const config = STATUS_SHAPES[status.operational];
    const capacityLevel = getCapacityLevel(status.capacity);
    
    return {
      ...config,
      intent: CRITICAL_INTENTS[status.operational],
      capacityIntent: CAPACITY_THRESHOLDS[capacityLevel].intent,
      capacityLevel,
      label: status.operational.charAt(0).toUpperCase() + status.operational.slice(1),
      shouldAnimate: enableAnimation && status.operational === 'critical',
      isUrgent: status.operational === 'critical' || status.priority === 'critical',
      hasConflicts: status.conflicts.length > 0
    };
  }, [status, enableAnimation]);

  // Memoize click handler
  const handleClick = useCallback(() => {
    if (onStatusClick) {
      onStatusClick(status);
    }
  }, [status, onStatusClick]);

  // Generate tooltip content
  const tooltipContent = useMemo(() => (
    <div className="status-tooltip-v2">
      <div className="tooltip-header">
        <span>{statusConfig.label} Status</span>
        {status.trend && (
          <Tag minimal intent={Intent.NONE} className="trend-tag">
            {status.trend}
          </Tag>
        )}
      </div>
      
      <div className="tooltip-grid">
        <div className="tooltip-section">
          <strong>Operational:</strong>
          <span className={`status-${status.operational}`}>
            {statusConfig.label}
          </span>
        </div>
        
        <div className="tooltip-section">
          <strong>Capacity:</strong>
          <span className={`capacity-${statusConfig.capacityLevel}`}>
            {status.capacity.toFixed(1)}%
          </span>
        </div>
        
        <div className="tooltip-section">
          <strong>Priority:</strong>
          <span className={`priority-${status.priority}`}>
            {status.priority}
          </span>
        </div>
      </div>

      {status.conflicts.length > 0 && (
        <div className="tooltip-conflicts-v2">
          <strong>Active Conflicts ({status.conflicts.length}):</strong>
          <ul className="conflict-list">
            {status.conflicts.slice(0, 3).map((conflict, idx) => (
              <li key={idx}>
                <Icon icon={IconNames.DOT} size={8} />
                {conflict}
              </li>
            ))}
            {status.conflicts.length > 3 && (
              <li className="more-conflicts">
                +{status.conflicts.length - 3} more...
              </li>
            )}
          </ul>
        </div>
      )}

      {alertFatiguePrevention && status.lastUpdate && (
        <div className="tooltip-footer">
          <small>Last updated: {new Date(status.lastUpdate).toLocaleTimeString()}</small>
        </div>
      )}
    </div>
  ), [status, statusConfig, alertFatiguePrevention]);

  // Main indicator component
  const indicator = (
    <div 
      className={`
        status-indicator-v2 
        status-${size}
        shape-${statusConfig.shape}
        ${statusConfig.shouldAnimate ? 'animate-critical' : ''}
        ${statusConfig.isUrgent ? 'is-urgent' : ''}
        ${onStatusClick ? 'clickable' : ''}
      `}
      onClick={handleClick}
      role={onStatusClick ? 'button' : 'status'}
      tabIndex={onStatusClick ? 0 : -1}
      aria-label={`${statusConfig.label} status with ${status.capacity}% capacity`}
    >
      {/* Primary status indicator */}
      <div className="primary-status">
        <Icon 
          icon={statusConfig.icon} 
          intent={statusConfig.intent}
          size={size === 'small' ? 12 : size === 'large' ? 20 : 16}
        />
      </div>

      {/* Multi-dimensional display */}
      {showMultiDimensional && (
        <>
          {/* Capacity ring */}
          <svg className="capacity-ring" viewBox="0 0 36 36">
            <circle
              className="capacity-bg"
              cx="18"
              cy="18"
              r="16"
              fill="none"
              strokeWidth="2"
            />
            <circle
              className={`capacity-fill capacity-${statusConfig.capacityLevel}`}
              cx="18"
              cy="18"
              r="16"
              fill="none"
              strokeWidth="2"
              strokeDasharray={`${status.capacity} 100`}
              transform="rotate(-90 18 18)"
            />
          </svg>

          {/* Priority badge */}
          {(status.priority === 'high' || status.priority === 'critical') && (
            <div className={`priority-badge priority-${status.priority}`}>
              {status.priority === 'critical' ? '!' : '⚠'}
            </div>
          )}

          {/* Conflict indicator */}
          {statusConfig.hasConflicts && (
            <div className="conflict-count">
              {status.conflicts.length}
            </div>
          )}
        </>
      )}
    </div>
  );

  // Return with or without tooltip
  if (!showTooltip) {
    return indicator;
  }

  return (
    <Tooltip
      content={tooltipContent}
      position={Position.TOP}
      hoverOpenDelay={300}
      modifiers={{
        offset: { enabled: true, offset: [0, 8] }
      }}
    >
      {indicator}
    </Tooltip>
  );
});

OpportunityStatusIndicatorV2.displayName = 'OpportunityStatusIndicatorV2';

// Export helper components for composition
export const StatusGroup: React.FC<{
  statuses: EnhancedStatusDimensions[];
  maxVisible?: number;
}> = React.memo(({ statuses, maxVisible = 5 }) => {
  const visibleStatuses = statuses.slice(0, maxVisible);
  const remainingCount = statuses.length - maxVisible;

  return (
    <div className="status-group">
      {visibleStatuses.map((status, idx) => (
        <OpportunityStatusIndicatorV2
          key={idx}
          status={status}
          size="small"
          showMultiDimensional={false}
          enableAnimation={idx < 3} // Only animate first 3 to prevent performance issues
        />
      ))}
      {remainingCount > 0 && (
        <Tag minimal round>
          +{remainingCount}
        </Tag>
      )}
    </div>
  );
});

StatusGroup.displayName = 'StatusGroup';

export default OpportunityStatusIndicatorV2;