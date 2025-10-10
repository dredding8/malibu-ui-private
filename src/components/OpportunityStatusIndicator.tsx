import React from 'react';
import { Intent, Tooltip } from '@blueprintjs/core';
import { OpportunityStatus } from '../types/collectionOpportunities';
import './OpportunityStatusIndicator.css';

interface OpportunityStatusIndicatorProps {
  status: OpportunityStatus;
  capacity: number;
  conflicts: string[];
  showTooltip?: boolean;
}

const OpportunityStatusIndicator: React.FC<OpportunityStatusIndicatorProps> = ({
  status,
  capacity,
  conflicts,
  showTooltip = true,
}) => {
  // Determine icon and intent based on status
  const getStatusConfig = () => {
    switch (status) {
      case 'critical':
        return {
          icon: 'warning-sign',
          intent: Intent.DANGER,
          label: 'Critical',
          description: conflicts.length > 0 
            ? `Conflicts detected: ${conflicts.join(', ')}` 
            : `Capacity critically low (${capacity.toFixed(1)}%)`,
        };
      case 'warning':
        return {
          icon: 'issue',
          intent: Intent.WARNING,
          label: 'Warning',
          description: `Capacity below threshold (${capacity.toFixed(1)}%)`,
        };
      case 'optimal':
      default:
        return {
          icon: 'tick-circle',
          intent: Intent.SUCCESS,
          label: 'Optimal',
          description: `Operating at optimal capacity (${capacity.toFixed(1)}%)`,
        };
    }
  };

  const config = getStatusConfig();

  const indicator = (
    <div className={`status-indicator status-${status}`}>
      <span
        className={`bp5-icon bp5-icon-${config.icon}`}
        aria-label={config.label}
      />
      <span className="status-label">{config.label}</span>
    </div>
  );

  if (!showTooltip) {
    return indicator;
  }

  return (
    <Tooltip
      content={
        <div className="status-tooltip">
          <div className="tooltip-header">{config.label} Status</div>
          <div className="tooltip-description">{config.description}</div>
          {conflicts.length > 0 && (
            <div className="tooltip-conflicts">
              <strong>Conflicts:</strong>
              <ul>
                {conflicts.map((conflict, index) => (
                  <li key={index}>{conflict}</li>
                ))}
              </ul>
            </div>
          )}
          <div className="tooltip-metrics">
            <div>Capacity: {capacity.toFixed(1)}%</div>
            {conflicts.length > 0 && <div>Conflicts: {conflicts.length}</div>}
          </div>
        </div>
      }
      position="top"
      hoverOpenDelay={300}
    >
      {indicator}
    </Tooltip>
  );
};

export default OpportunityStatusIndicator;