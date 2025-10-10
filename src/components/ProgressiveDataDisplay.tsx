import React, { useState, useCallback, useMemo } from 'react';
import { Card, Button, Collapse, Icon, Intent } from '@blueprintjs/core';
import { IconNames } from '@blueprintjs/icons';
import './ProgressiveDataDisplay.css';

export interface ProgressiveDataDisplayProps {
  // Glance level - 2 second assessment
  glanceData: {
    title: string;
    value: string | number;
    intent?: Intent;
    icon?: IconNames | string;
    critical?: boolean;
  };
  
  // Operational level - 10 second understanding
  operationalData?: {
    subtitle?: string;
    metrics?: Array<{
      label: string;
      value: string | number;
      trend?: 'up' | 'down' | 'stable';
    }>;
    actions?: Array<{
      label: string;
      icon?: IconNames | string;
      intent?: Intent;
      onClick: () => void;
      primary?: boolean;
    }>;
  };
  
  // Analytical level - Deep dive
  analyticalData?: React.ReactNode;
  
  // Control props
  defaultExpanded?: boolean;
  expandable?: boolean;
  className?: string;
  onExpandChange?: (expanded: boolean) => void;
}

export const ProgressiveDataDisplay: React.FC<ProgressiveDataDisplayProps> = ({
  glanceData,
  operationalData,
  analyticalData,
  defaultExpanded = false,
  expandable = true,
  className = '',
  onExpandChange
}) => {
  const [isExpanded, setIsExpanded] = useState(defaultExpanded);
  const [showAnalytical, setShowAnalytical] = useState(false);
  
  const handleToggleExpand = useCallback(() => {
    const newState = !isExpanded;
    setIsExpanded(newState);
    onExpandChange?.(newState);
  }, [isExpanded, onExpandChange]);
  
  const handleToggleAnalytical = useCallback(() => {
    setShowAnalytical(!showAnalytical);
  }, [showAnalytical]);
  
  // Determine visual importance based on criticality
  const visualImportance = useMemo(() => {
    if (glanceData.critical) return 'critical';
    if (glanceData.intent === Intent.DANGER) return 'high';
    if (glanceData.intent === Intent.WARNING) return 'medium';
    return 'normal';
  }, [glanceData.critical, glanceData.intent]);
  
  // Primary actions (max 2 for 2-click access)
  const primaryActions = useMemo(() => 
    operationalData?.actions?.filter(a => a.primary).slice(0, 2) || [],
    [operationalData?.actions]
  );
  
  return (
    <Card 
      className={`progressive-data-display ${className} importance-${visualImportance}`}
      interactive={expandable}
      onClick={expandable && !isExpanded ? handleToggleExpand : undefined}
    >
      {/* Glance Level - Always Visible */}
      <div className="glance-level">
        <div className="glance-header">
          {glanceData.icon && (
            <Icon 
              icon={glanceData.icon as any} 
              size={24}
              intent={glanceData.intent}
              className="glance-icon"
            />
          )}
          <div className="glance-content">
            <div className="glance-value">{glanceData.value}</div>
            <div className="glance-title">{glanceData.title}</div>
          </div>
        </div>
        
        {/* Quick Actions - Visible at glance level for 2-click access */}
        {primaryActions.length > 0 && (
          <div className="glance-actions">
            {primaryActions.map((action, idx) => (
              <Button
                key={idx}
                size="small"
                text={action.label}
                icon={action.icon as any}
                intent={action.intent}
                onClick={(e: React.MouseEvent) => {
                  e.stopPropagation();
                  action.onClick();
                }}
                className="quick-action-button"
              />
            ))}
          </div>
        )}
        
        {expandable && (
          <Button
            variant="minimal"
            size="small"
            icon={isExpanded ? IconNames.CHEVRON_UP : IconNames.CHEVRON_DOWN}
            onClick={(e: React.MouseEvent) => {
              e.stopPropagation();
              handleToggleExpand();
            }}
            className="expand-button"
            aria-label={isExpanded ? "Collapse details" : "Expand details"}
          />
        )}
      </div>
      
      {/* Operational Level - Progressive Disclosure */}
      <Collapse isOpen={isExpanded && !!operationalData}>
        <div className="operational-level">
          {operationalData?.subtitle && (
            <p className="operational-subtitle">{operationalData.subtitle}</p>
          )}
          
          {operationalData?.metrics && (
            <div className="operational-metrics">
              {operationalData.metrics.map((metric, idx) => (
                <div key={idx} className="metric-item">
                  <span className="metric-label">{metric.label}</span>
                  <span className="metric-value">
                    {metric.value}
                    {metric.trend && (
                      <Icon
                        icon={metric.trend === 'up' ? IconNames.TRENDING_UP : 
                              metric.trend === 'down' ? IconNames.TRENDING_DOWN : 
                              IconNames.MINUS}
                        size={12}
                        className={`trend-icon trend-${metric.trend}`}
                      />
                    )}
                  </span>
                </div>
              ))}
            </div>
          )}
          
          {/* Secondary Actions */}
          {operationalData?.actions && operationalData.actions.length > 2 && (
            <div className="operational-actions">
              {operationalData.actions
                .filter(a => !a.primary)
                .map((action, idx) => (
                  <Button
                    key={idx}
                    size="small"
                    variant="minimal"
                    text={action.label}
                    icon={action.icon as any}
                    intent={action.intent}
                    onClick={action.onClick}
                  />
                ))}
            </div>
          )}
          
          {analyticalData && (
            <Button
              variant="minimal"
              size="small"
              text={showAnalytical ? "Hide Analysis" : "Show Analysis"}
              icon={IconNames.CHART}
              onClick={handleToggleAnalytical}
              className="analytical-toggle"
            />
          )}
        </div>
      </Collapse>
      
      {/* Analytical Level - Deep Dive */}
      <Collapse isOpen={showAnalytical && !!analyticalData}>
        <div className="analytical-level">
          {analyticalData}
        </div>
      </Collapse>
    </Card>
  );
};

export default ProgressiveDataDisplay;