import React, { useMemo } from 'react';
import { Tooltip, Tag, Intent, Popover, Button, Classes } from '@blueprintjs/core';
import { IconNames } from '@blueprintjs/icons';
import { OpportunityHealth } from '../utils/opportunityHealth';
import './OpportunityStatusIndicatorEnhanced.css';

interface OpportunityStatusIndicatorEnhancedProps {
  health: OpportunityHealth;
  showDetails?: boolean;
  onQuickAction?: (action: 'reallocate' | 'resolve-conflicts' | 'optimize') => void;
  compact?: boolean;
}

const OpportunityStatusIndicatorEnhanced: React.FC<OpportunityStatusIndicatorEnhancedProps> = ({
  health,
  showDetails = true,
  onQuickAction,
  compact = false
}) => {
  // Determine visual styling based on health level
  const { intent, icon, color } = useMemo(() => {
    switch (health.level) {
      case 'critical':
        return {
          intent: Intent.DANGER,
          icon: IconNames.ERROR,
          color: '#DB3737'
        };
      case 'warning':
        return {
          intent: Intent.WARNING,
          icon: IconNames.WARNING_SIGN,
          color: '#D9822B'
        };
      case 'optimal':
      default:
        return {
          intent: Intent.SUCCESS,
          icon: IconNames.TICK_CIRCLE,
          color: '#0F9960'
        };
    }
  }, [health.level]);

  // Health details popover content
  const healthDetailsContent = (
    <div className="health-details-popover">
      <div className="health-score-header">
        <h4>Health Score: {health.score}/100</h4>
        <Tag intent={intent} minimal>
          {health.level.toUpperCase()}
        </Tag>
      </div>

      <div className="health-metrics">
        <h5>Metrics Breakdown</h5>
        <div className="metric-row">
          <span>Capacity Score:</span>
          <span className="metric-value">{health.metrics.capacityScore}%</span>
        </div>
        <div className="metric-row">
          <span>Match Quality:</span>
          <span className="metric-value">{health.metrics.matchQuality}%</span>
        </div>
        <div className="metric-row">
          <span>Conflicts:</span>
          <span className="metric-value conflict">{health.metrics.conflictCount}</span>
        </div>
        <div className="metric-row">
          <span>Priority Alignment:</span>
          <span className="metric-value">{health.metrics.priorityAlignment}%</span>
        </div>
        <div className="metric-row">
          <span>Utilization Efficiency:</span>
          <span className="metric-value">{health.metrics.utilizationEfficiency}%</span>
        </div>
        <div className="metric-row">
          <span>Risk Score:</span>
          <span className="metric-value risk">{health.metrics.riskScore}%</span>
        </div>
      </div>

      {health.reasons.length > 0 && (
        <div className="health-reasons">
          <h5>Key Issues</h5>
          <ul>
            {health.reasons.slice(0, 3).map((reason, index) => (
              <li key={index}>{reason}</li>
            ))}
          </ul>
        </div>
      )}

      {health.recommendations.length > 0 && (
        <div className="health-recommendations">
          <h5>Recommendations</h5>
          <ul>
            {health.recommendations.slice(0, 3).map((rec, index) => (
              <li key={index}>{rec}</li>
            ))}
          </ul>
        </div>
      )}

      {onQuickAction && (
        <div className="quick-actions">
          <h5>Quick Actions</h5>
          <div className="action-buttons">
            {health.level === 'critical' && (
              <Button
                small
                intent={Intent.PRIMARY}
                icon={IconNames.FLOWS}
                onClick={() => onQuickAction('reallocate')}
              >
                Reallocate
              </Button>
            )}
            {health.metrics.conflictCount > 0 && (
              <Button
                small
                intent={Intent.WARNING}
                icon={IconNames.RESOLVE}
                onClick={() => onQuickAction('resolve-conflicts')}
              >
                Resolve Conflicts
              </Button>
            )}
            {health.level !== 'optimal' && (
              <Button
                small
                icon={IconNames.LIGHTBULB}
                onClick={() => onQuickAction('optimize')}
              >
                Optimize
              </Button>
            )}
          </div>
        </div>
      )}
    </div>
  );

  if (compact) {
    // Compact mode for table cells
    return (
      <Popover
        content={healthDetailsContent}
        position="right"
        interactionKind="hover"
        hoverOpenDelay={300}
      >
        <div className="status-indicator-compact">
          <Tag 
            icon={icon} 
            intent={intent}
            minimal
            className="health-icon"
          >
            {health.score}
          </Tag>
        </div>
      </Popover>
    );
  }

  // Full mode with inline details
  return (
    <div className={`status-indicator-enhanced ${health.level}`}>
      <div className="status-main">
        <Tag 
          icon={icon} 
          intent={intent}
          large
          minimal
        />
        <div className="status-info">
          <div className="status-label">
            {health.level.charAt(0).toUpperCase() + health.level.slice(1)}
          </div>
          <div className="status-score">
            Score: {health.score}/100
          </div>
        </div>
      </div>

      {showDetails && (
        <>
          {/* Mini metrics bar */}
          <div className="mini-metrics">
            <Tooltip content={`Capacity: ${health.metrics.capacityScore}%`}>
              <div 
                className="metric-bar capacity"
                style={{ 
                  width: `${health.metrics.capacityScore}%`,
                  backgroundColor: getMetricColor(health.metrics.capacityScore)
                }}
              />
            </Tooltip>
            <Tooltip content={`Match Quality: ${health.metrics.matchQuality}%`}>
              <div 
                className="metric-bar match"
                style={{ 
                  width: `${health.metrics.matchQuality}%`,
                  backgroundColor: getMetricColor(health.metrics.matchQuality)
                }}
              />
            </Tooltip>
            <Tooltip content={`Efficiency: ${health.metrics.utilizationEfficiency}%`}>
              <div 
                className="metric-bar efficiency"
                style={{ 
                  width: `${health.metrics.utilizationEfficiency}%`,
                  backgroundColor: getMetricColor(health.metrics.utilizationEfficiency)
                }}
              />
            </Tooltip>
          </div>

          {/* Primary reason */}
          {health.reasons.length > 0 && (
            <div className="primary-reason">
              <Tag minimal icon={IconNames.INFO_SIGN}>
                {health.reasons[0]}
              </Tag>
            </div>
          )}

          {/* Conflict indicator */}
          {health.metrics.conflictCount > 0 && (
            <div className="conflict-indicator">
              <Tag 
                minimal
                icon={IconNames.WARNING_SIGN} 
                intent={Intent.WARNING}
              >
                {health.metrics.conflictCount} conflict{health.metrics.conflictCount > 1 ? 's' : ''}
              </Tag>
            </div>
          )}
        </>
      )}

      {/* Hover for full details */}
      <Popover
        content={healthDetailsContent}
        position="right"
        interactionKind="hover"
        hoverOpenDelay={500}
      >
        <Button
          minimal
          small
          icon={IconNames.MORE}
          className="details-button"
        />
      </Popover>
    </div>
  );
};

// Helper function to determine metric bar color
const getMetricColor = (value: number): string => {
  if (value >= 70) return '#0F9960'; // Green
  if (value >= 30) return '#D9822B'; // Orange
  return '#DB3737'; // Red
};

export default OpportunityStatusIndicatorEnhanced;