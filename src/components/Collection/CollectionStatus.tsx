/**
 * Collection Status Component
 * 
 * Enhanced status display component showing system health, activity,
 * and performance metrics with multi-dimensional indicators.
 * 
 * @version 1.0.0
 * @date 2025-09-30
 */

import React, { useMemo } from 'react';
import { 
  Card,
  Icon,
  ProgressBar,
  Tag,
  Tooltip,
  Position
} from '@blueprintjs/core';
import { IconNames } from '@blueprintjs/icons';
import { useCollectionContext } from './CollectionProvider';
import { EnhancedStatusIndicator } from '../EnhancedStatusIndicator';
import './CollectionStatus.css';

// =============================================================================
// Component Props
// =============================================================================

export interface CollectionStatusProps {
  /** Show detailed metrics */
  showMetrics?: boolean;
  /** Show activity indicators */
  showActivity?: boolean;
  /** Show performance data */
  showPerformance?: boolean;
  /** Show system health */
  showHealth?: boolean;
  /** Layout variant */
  variant?: 'card' | 'inline' | 'compact';
  /** Custom class name */
  className?: string;
  /** Custom styles */
  style?: React.CSSProperties;
}

// =============================================================================
// Status Metrics Interface
// =============================================================================

interface SystemMetrics {
  totalCollections: number;
  healthyCollections: number;
  warningCollections: number;
  criticalCollections: number;
  offlineCollections: number;
  maintenanceCollections: number;
  activeOperations: number;
  loadTime: number;
  memoryUsage: number;
  lastUpdate: Date;
}

// =============================================================================
// Main Component
// =============================================================================

/**
 * Collection status component with enhanced metrics display
 * 
 * @example
 * ```tsx
 * // Basic usage
 * <CollectionStatus />
 * 
 * // Detailed metrics
 * <CollectionStatus
 *   showMetrics
 *   showActivity
 *   showPerformance
 *   variant="card"
 * />
 * 
 * // Compact inline display
 * <CollectionStatus
 *   variant="compact"
 *   showHealth={false}
 * />
 * ```
 */
export const CollectionStatus: React.FC<CollectionStatusProps> = ({
  showMetrics = true,
  showActivity = true,
  showPerformance = true,
  showHealth = true,
  variant = 'card',
  className = '',
  style,
}) => {
  // =============================================================================
  // Context and State
  // =============================================================================

  const {
    collections,
    filteredCollections,
    loading,
    error,
    lastUpdated,
    operations,
    performance,
  } = useCollectionContext();

  // =============================================================================
  // Computed Metrics
  // =============================================================================

  const metrics: SystemMetrics = useMemo(() => {
    const statusCounts = collections.reduce((acc, collection) => {
      const status = collection.status.overall;
      acc[`${status}Collections`] = (acc[`${status}Collections`] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    return {
      totalCollections: collections.length,
      healthyCollections: statusCounts.healthyCollections || 0,
      warningCollections: statusCounts.warningCollections || 0,
      criticalCollections: statusCounts.criticalCollections || 0,
      offlineCollections: statusCounts.offlineCollections || 0,
      maintenanceCollections: statusCounts.maintenanceCollections || 0,
      activeOperations: operations.active.length,
      loadTime: performance.averageLoadTime || 0,
      memoryUsage: performance.memoryUsage || 0,
      lastUpdate: lastUpdated || new Date(),
    };
  }, [collections, operations, performance, lastUpdated]);

  const systemHealth = useMemo(() => {
    const { totalCollections, criticalCollections, warningCollections, offlineCollections } = metrics;
    
    if (totalCollections === 0) return 'unknown';
    
    const problemCollections = criticalCollections + offlineCollections;
    const problemRatio = problemCollections / totalCollections;
    
    if (problemRatio > 0.3) return 'critical';
    if (problemRatio > 0.1 || warningCollections > totalCollections * 0.2) return 'warning';
    if (problemCollections > 0) return 'degraded';
    
    return 'healthy';
  }, [metrics]);

  const isActive = useMemo(() => {
    return Object.values(loading).some(Boolean) || metrics.activeOperations > 0;
  }, [loading, metrics.activeOperations]);

  const hasErrors = useMemo(() => {
    return Object.values(error).some(Boolean);
  }, [error]);

  // =============================================================================
  // Render Functions
  // =============================================================================

  const renderSystemHealth = () => {
    if (!showHealth) return null;

    const healthConfig = {
      healthy: { intent: 'success', icon: IconNames.TICK_CIRCLE, label: 'System Healthy' },
      degraded: { intent: 'warning', icon: IconNames.WARNING_SIGN, label: 'System Degraded' },
      warning: { intent: 'warning', icon: IconNames.ERROR, label: 'System Warning' },
      critical: { intent: 'danger', icon: IconNames.ERROR, label: 'System Critical' },
      unknown: { intent: 'none', icon: IconNames.HELP, label: 'Status Unknown' },
    };

    const config = healthConfig[systemHealth as keyof typeof healthConfig];

    return (
      <div className="status-health">
        <div className="health-indicator">
          <Tag
            large={variant === 'card'}
            intent={config.intent as any}
            icon={config.icon}
          >
            {config.label}
          </Tag>
          {isActive && (
            <Tag minimal className="activity-indicator">
              <Icon icon={IconNames.REFRESH} className="spinning" />
              Active
            </Tag>
          )}
        </div>
        
        {hasErrors && (
          <div className="error-indicator">
            <Tag intent="danger" minimal icon={IconNames.WARNING_SIGN}>
              System Errors Detected
            </Tag>
          </div>
        )}
      </div>
    );
  };

  const renderMetrics = () => {
    if (!showMetrics || variant === 'compact') return null;

    return (
      <div className="status-metrics">
        <div className="metrics-grid">
          <div className="metric-item">
            <div className="metric-value">{metrics.totalCollections}</div>
            <div className="metric-label">Total Collections</div>
          </div>
          
          <div className="metric-item">
            <div className="metric-value">{metrics.healthyCollections}</div>
            <div className="metric-label">Healthy</div>
            <div className="metric-status healthy"></div>
          </div>
          
          {metrics.warningCollections > 0 && (
            <div className="metric-item">
              <div className="metric-value">{metrics.warningCollections}</div>
              <div className="metric-label">Warning</div>
              <div className="metric-status warning"></div>
            </div>
          )}
          
          {metrics.criticalCollections > 0 && (
            <div className="metric-item">
              <div className="metric-value">{metrics.criticalCollections}</div>
              <div className="metric-label">Critical</div>
              <div className="metric-status critical"></div>
            </div>
          )}
          
          {metrics.offlineCollections > 0 && (
            <div className="metric-item">
              <div className="metric-value">{metrics.offlineCollections}</div>
              <div className="metric-label">Offline</div>
              <div className="metric-status offline"></div>
            </div>
          )}
        </div>
      </div>
    );
  };

  const renderActivity = () => {
    if (!showActivity || variant === 'compact') return null;

    return (
      <div className="status-activity">
        <div className="activity-header">
          <span className="activity-title">System Activity</span>
          <span className="activity-time">
            Updated: {new Intl.DateTimeFormat('en-US', {
              hour: '2-digit',
              minute: '2-digit',
              second: '2-digit',
            }).format(metrics.lastUpdate)}
          </span>
        </div>
        
        <div className="activity-items">
          {metrics.activeOperations > 0 && (
            <div className="activity-item">
              <Icon icon={IconNames.COG} className="spinning" />
              <span>{metrics.activeOperations} active operation{metrics.activeOperations > 1 ? 's' : ''}</span>
            </div>
          )}
          
          {filteredCollections.length !== metrics.totalCollections && (
            <div className="activity-item">
              <Icon icon={IconNames.FILTER} />
              <span>Showing {filteredCollections.length} of {metrics.totalCollections} collections</span>
            </div>
          )}
          
          {Object.values(loading).some(Boolean) && (
            <div className="activity-item">
              <Icon icon={IconNames.REFRESH} className="spinning" />
              <span>Loading data...</span>
            </div>
          )}
        </div>
      </div>
    );
  };

  const renderPerformance = () => {
    if (!showPerformance || variant === 'compact') return null;

    const performanceScore = Math.max(0, Math.min(100, 100 - (metrics.loadTime / 10) - (metrics.memoryUsage)));
    const performanceIntent = performanceScore > 80 ? 'success' : performanceScore > 60 ? 'warning' : 'danger';

    return (
      <div className="status-performance">
        <div className="performance-header">
          <span className="performance-title">Performance</span>
          <Tag minimal intent={performanceIntent}>
            {Math.round(performanceScore)}%
          </Tag>
        </div>
        
        <div className="performance-metrics">
          <div className="performance-item">
            <Tooltip content={`Average load time: ${metrics.loadTime}ms`} position={Position.TOP}>
              <div className="performance-bar">
                <span className="performance-label">Load Time</span>
                <ProgressBar
                  value={Math.min(1, metrics.loadTime / 1000)}
                  intent={metrics.loadTime < 500 ? 'success' : metrics.loadTime < 1000 ? 'warning' : 'danger'}
                />
              </div>
            </Tooltip>
          </div>
          
          <div className="performance-item">
            <Tooltip content={`Memory usage: ${metrics.memoryUsage}%`} position={Position.TOP}>
              <div className="performance-bar">
                <span className="performance-label">Memory</span>
                <ProgressBar
                  value={metrics.memoryUsage / 100}
                  intent={metrics.memoryUsage < 60 ? 'success' : metrics.memoryUsage < 80 ? 'warning' : 'danger'}
                />
              </div>
            </Tooltip>
          </div>
        </div>
      </div>
    );
  };

  // =============================================================================
  // Render
  // =============================================================================

  const content = (
    <div className={`collection-status ${variant} ${className}`} style={style}>
      {renderSystemHealth()}
      {renderMetrics()}
      {renderActivity()}
      {renderPerformance()}
    </div>
  );

  return variant === 'card' ? <Card>{content}</Card> : content;
};

// =============================================================================
// Default Export
// =============================================================================

export default CollectionStatus;