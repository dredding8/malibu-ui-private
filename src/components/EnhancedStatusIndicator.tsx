import React, { useMemo } from 'react';
import { Icon, Intent, Tooltip, Position } from '@blueprintjs/core';
import { IconNames } from '@blueprintjs/icons';
import './EnhancedStatusIndicator.css';

export interface EnhancedStatusIndicatorProps {
  // Operational status
  status: 'nominal' | 'degraded' | 'critical' | 'offline';
  
  // Capacity utilization (0-100)
  capacity: number;
  
  // Priority level
  priority?: 'low' | 'normal' | 'high' | 'urgent';
  
  // Conflict count
  conflicts?: number;
  
  // Size variant
  size?: 'small' | 'medium' | 'large';
  
  // Additional metadata for tooltip
  metadata?: {
    lastUpdate?: Date;
    message?: string;
    details?: Record<string, any>;
  };
}

export const EnhancedStatusIndicator: React.FC<EnhancedStatusIndicatorProps> = ({
  status,
  capacity,
  priority = 'normal',
  conflicts = 0,
  size = 'medium',
  metadata
}) => {
  // Determine overall health based on multiple factors
  const overallHealth = useMemo(() => {
    if (status === 'critical' || status === 'offline') return 'critical';
    if (status === 'degraded' || capacity > 85 || conflicts > 0) return 'warning';
    return 'healthy';
  }, [status, capacity, conflicts]);
  
  // Status configuration
  const statusConfig = useMemo(() => {
    switch (status) {
      case 'nominal':
        return { icon: IconNames.TICK_CIRCLE, intent: Intent.SUCCESS, color: '#0F9960' };
      case 'degraded':
        return { icon: IconNames.WARNING_SIGN, intent: Intent.WARNING, color: '#D9822B' };
      case 'critical':
        return { icon: IconNames.ERROR, intent: Intent.DANGER, color: '#DB3737' };
      case 'offline':
        return { icon: IconNames.OFFLINE, intent: Intent.DANGER, color: '#5C7080' };
    }
  }, [status]);
  
  // Capacity ring calculation
  const capacityRingStyle = useMemo(() => {
    const circumference = 2 * Math.PI * 18; // radius = 18
    const dashOffset = circumference * (1 - capacity / 100);
    const color = capacity > 85 ? '#DB3737' : capacity > 70 ? '#D9822B' : '#0F9960';
    
    return {
      strokeDasharray: circumference,
      strokeDashoffset: dashOffset,
      stroke: color
    };
  }, [capacity]);
  
  // Priority badge
  const priorityConfig = useMemo(() => {
    switch (priority) {
      case 'low':
        return { text: 'L', color: '#738694' };
      case 'normal':
        return { text: 'N', color: '#137CBD' };
      case 'high':
        return { text: 'H', color: '#D9822B' };
      case 'urgent':
        return { text: 'U', color: '#DB3737', pulse: true };
    }
  }, [priority]);
  
  // Tooltip content
  const tooltipContent = (
    <div className="status-tooltip">
      <div className="tooltip-header">System Status</div>
      <div className="tooltip-grid">
        <div className="tooltip-item">
          <span className="tooltip-label">Status:</span>
          <span className="tooltip-value">{status}</span>
        </div>
        <div className="tooltip-item">
          <span className="tooltip-label">Capacity:</span>
          <span className="tooltip-value">{capacity}%</span>
        </div>
        <div className="tooltip-item">
          <span className="tooltip-label">Priority:</span>
          <span className="tooltip-value">{priority}</span>
        </div>
        {conflicts > 0 && (
          <div className="tooltip-item">
            <span className="tooltip-label">Conflicts:</span>
            <span className="tooltip-value conflict">{conflicts}</span>
          </div>
        )}
      </div>
      {metadata?.message && (
        <div className="tooltip-message">{metadata.message}</div>
      )}
      {metadata?.lastUpdate && (
        <div className="tooltip-timestamp">
          Last updated: {new Date(metadata.lastUpdate).toLocaleTimeString()}
        </div>
      )}
    </div>
  );
  
  return (
    <Tooltip
      content={tooltipContent}
      position={Position.TOP}
      className="status-indicator-tooltip"
    >
      <div 
        className={`enhanced-status-indicator size-${size} health-${overallHealth}`}
        role="status"
        aria-label={`Status: ${status}, Capacity: ${capacity}%, Priority: ${priority}`}
      >
        {/* Capacity Ring */}
        <svg className="capacity-ring" viewBox="0 0 40 40">
          <circle
            cx="20"
            cy="20"
            r="18"
            fill="none"
            strokeWidth="2"
            className="capacity-background"
          />
          <circle
            cx="20"
            cy="20"
            r="18"
            fill="none"
            strokeWidth="2"
            className="capacity-fill"
            style={capacityRingStyle}
            transform="rotate(-90 20 20)"
          />
        </svg>
        
        {/* Status Icon */}
        <div className="status-icon-container">
          <Icon 
            icon={statusConfig.icon} 
            size={size === 'small' ? 12 : size === 'medium' ? 16 : 20}
            intent={statusConfig.intent}
            className={`status-icon ${status === 'critical' ? 'pulse' : ''}`}
          />
        </div>
        
        {/* Priority Badge */}
        {priority !== 'normal' && (
          <div 
            className={`priority-badge ${priorityConfig.pulse ? 'pulse' : ''}`}
            style={{ backgroundColor: priorityConfig.color }}
          >
            {priorityConfig.text}
          </div>
        )}
        
        {/* Conflict Counter */}
        {conflicts > 0 && (
          <div className="conflict-counter">
            {conflicts}
          </div>
        )}
      </div>
    </Tooltip>
  );
};

export default EnhancedStatusIndicator;