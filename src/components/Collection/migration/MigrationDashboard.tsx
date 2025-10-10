/**
 * Migration Dashboard Component
 * 
 * Real-time dashboard for monitoring the collection component migration
 * progress, performance metrics, and rollback capabilities.
 * 
 * @version 1.0.0
 * @date 2025-09-30
 */

import React, { useState, useEffect, useMemo, useCallback } from 'react';
import {
  Card,
  ProgressBar,
  Tag,
  Intent,
  Button,
  HTMLTable,
  Callout,
  Tabs,
  Tab,
  NonIdealState,
  Switch,
  NumericInput,
  Divider
} from '@blueprintjs/core';
import { Icon } from '../../../utils/blueprintIconWrapper';
import {
  generateMigrationDashboard,
  getMigrationStatus,
  exportMigrationData,
  clearMigrationMetrics,
  MigrationDashboardData
} from '../../../utils/collection-migration/migrationMetrics';
import { useFeatureFlag } from '../../../hooks/useFeatureFlags';

// =============================================================================
// Type Definitions
// =============================================================================

interface MigrationControlConfig {
  variant: string;
  enabled: boolean;
  rolloutPercentage: number;
  abTestingEnabled: boolean;
  metricsEnabled: boolean;
}

interface DashboardState {
  dashboardData: MigrationDashboardData | null;
  migrationStatus: any;
  loading: boolean;
  error: string | null;
  lastUpdated: number;
  autoRefresh: boolean;
  refreshInterval: number;
}

// =============================================================================
// Main Dashboard Component
// =============================================================================

export const MigrationDashboard: React.FC = () => {
  const [state, setState] = useState<DashboardState>({
    dashboardData: null,
    migrationStatus: null,
    loading: true,
    error: null,
    lastUpdated: 0,
    autoRefresh: true,
    refreshInterval: 5000
  });

  const [selectedTab, setSelectedTab] = useState<string>('overview');

  // Feature flags for dashboard access
  const canAccessDashboard = useFeatureFlag('ENABLE_MIGRATION_DASHBOARD');
  const canControlMigration = useFeatureFlag('ENABLE_MIGRATION_CONTROLS');

  // Refresh data function
  const refreshData = useCallback(async () => {
    setState(prev => ({ ...prev, loading: true, error: null }));

    try {
      const [dashboardData, migrationStatus] = await Promise.all([
        Promise.resolve(generateMigrationDashboard()),
        Promise.resolve(getMigrationStatus())
      ]);

      setState(prev => ({
        ...prev,
        dashboardData,
        migrationStatus,
        loading: false,
        lastUpdated: Date.now()
      }));
    } catch (error) {
      setState(prev => ({
        ...prev,
        loading: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      }));
    }
  }, []);

  // Auto-refresh effect
  useEffect(() => {
    refreshData();

    if (state.autoRefresh) {
      const interval = setInterval(refreshData, state.refreshInterval);
      return () => clearInterval(interval);
    }
  }, [refreshData, state.autoRefresh, state.refreshInterval]);

  // Export data function
  const handleExportData = useCallback(() => {
    const exportData = exportMigrationData();
    const blob = new Blob([JSON.stringify(exportData, null, 2)], {
      type: 'application/json'
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `migration-data-${new Date().toISOString().slice(0, 10)}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }, []);

  // Clear metrics function
  const handleClearMetrics = useCallback(() => {
    if (window.confirm('Are you sure you want to clear all migration metrics?')) {
      clearMigrationMetrics();
      refreshData();
    }
  }, [refreshData]);

  // Access control
  if (!canAccessDashboard) {
    return (
      <NonIdealState
        icon="lock"
        title="Access Denied"
        description="You don't have permission to access the migration dashboard."
      />
    );
  }

  // Loading state
  if (state.loading && !state.dashboardData) {
    return (
      <div className="migration-dashboard-loading">
        <NonIdealState
          icon={<Icon icon="timeline-line-chart" />}
          title="Loading Migration Dashboard"
          description="Gathering migration metrics and status..."
        />
      </div>
    );
  }

  // Error state
  if (state.error) {
    return (
      <div className="migration-dashboard-error">
        <Callout intent={Intent.DANGER} title="Dashboard Error">
          {state.error}
          <Button onClick={refreshData} minimal>
            Retry
          </Button>
        </Callout>
      </div>
    );
  }

  return (
    <div className="migration-dashboard">
      <div className="dashboard-header">
        <h2>Collection Migration Dashboard</h2>
        <div className="dashboard-controls">
          <Switch
            checked={state.autoRefresh}
            label="Auto-refresh"
            onChange={(e) => setState(prev => ({
              ...prev,
              autoRefresh: (e.target as HTMLInputElement).checked
            }))}
          />
          <Button icon="refresh" onClick={refreshData} minimal>
            Refresh
          </Button>
          <Button icon="download" onClick={handleExportData} minimal>
            Export Data
          </Button>
          {canControlMigration && (
            <Button 
              icon="trash" 
              onClick={handleClearMetrics} 
              intent={Intent.WARNING}
              minimal
            >
              Clear Metrics
            </Button>
          )}
        </div>
      </div>

      {state.lastUpdated && (
        <div className="last-updated">
          Last updated: {new Date(state.lastUpdated).toLocaleTimeString()}
        </div>
      )}

      <Tabs selectedTabId={selectedTab} onChange={setSelectedTab}>
        <Tab 
          id="overview" 
          title="Overview" 
          panel={<OverviewPanel data={state.dashboardData} status={state.migrationStatus} />} 
        />
        <Tab 
          id="performance" 
          title="Performance" 
          panel={<PerformancePanel data={state.dashboardData} />} 
        />
        <Tab 
          id="variants" 
          title="Variants" 
          panel={<VariantsPanel data={state.dashboardData} />} 
        />
        <Tab 
          id="issues" 
          title="Issues" 
          panel={<IssuesPanel data={state.dashboardData} />} 
        />
        {canControlMigration && (
          <Tab 
            id="controls" 
            title="Controls" 
            panel={<ControlsPanel onRefresh={refreshData} />} 
          />
        )}
      </Tabs>
    </div>
  );
};

// =============================================================================
// Panel Components
// =============================================================================

/**
 * Overview Panel - High-level migration status
 */
const OverviewPanel: React.FC<{
  data: MigrationDashboardData | null;
  status: any;
}> = ({ data, status }) => {
  if (!data) return <div>No data available</div>;

  return (
    <div className="overview-panel">
      <div className="overview-cards">
        <Card>
          <h4>Overall Progress</h4>
          <ProgressBar 
            value={data.overallProgress.percentage / 100}
            intent={data.overallProgress.percentage > 80 ? Intent.SUCCESS : Intent.PRIMARY}
          />
          <div className="progress-text">
            {data.overallProgress.migratedVariants} of {data.overallProgress.totalVariants} variants migrated
            ({Math.round(data.overallProgress.percentage)}%)
          </div>
        </Card>

        <Card>
          <h4>Migration Status</h4>
          <Tag 
            intent={status?.isActive ? Intent.SUCCESS : Intent.NONE}
            icon={status?.isActive ? "play" : "pause"}
          >
            {status?.isActive ? 'Active' : 'Inactive'}
          </Tag>
          <div>
            Active variants: {status?.activeVariants?.length || 0}
          </div>
        </Card>

        <Card>
          <h4>Performance Impact</h4>
          <div className="performance-summary">
            <div className={`improvement ${data.performanceComparison.improvement > 0 ? 'positive' : 'negative'}`}>
              {data.performanceComparison.improvement > 0 ? '+' : ''}
              {Math.round(data.performanceComparison.improvement)}%
            </div>
            <div className="performance-label">
              {data.performanceComparison.improvement > 0 ? 'Faster' : 'Slower'}
            </div>
          </div>
        </Card>

        <Card>
          <h4>Issues</h4>
          <div className="issues-summary">
            {data.issues.length === 0 ? (
              <Tag intent={Intent.SUCCESS}>No Issues</Tag>
            ) : (
              <div>
                {data.issues.filter(i => i.impact === 'high').length > 0 && (
                  <Tag intent={Intent.DANGER}>
                    {data.issues.filter(i => i.impact === 'high').length} High
                  </Tag>
                )}
                {data.issues.filter(i => i.impact === 'medium').length > 0 && (
                  <Tag intent={Intent.WARNING}>
                    {data.issues.filter(i => i.impact === 'medium').length} Medium
                  </Tag>
                )}
                {data.issues.filter(i => i.impact === 'low').length > 0 && (
                  <Tag intent={Intent.NONE}>
                    {data.issues.filter(i => i.impact === 'low').length} Low
                  </Tag>
                )}
              </div>
            )}
          </div>
        </Card>
      </div>

      {data.recommendations.length > 0 && (
        <Card>
          <h4>Recommendations</h4>
          <div className="recommendations">
            {data.recommendations.map((rec, index) => (
              <Callout key={index} intent={Intent.PRIMARY}>
                {rec}
              </Callout>
            ))}
          </div>
        </Card>
      )}
    </div>
  );
};

/**
 * Performance Panel - Detailed performance metrics
 */
const PerformancePanel: React.FC<{
  data: MigrationDashboardData | null;
}> = ({ data }) => {
  if (!data) return <div>No performance data available</div>;

  return (
    <div className="performance-panel">
      <Card>
        <h4>Performance Comparison</h4>
        <HTMLTable>
          <thead>
            <tr>
              <th>Metric</th>
              <th>Legacy</th>
              <th>Compound</th>
              <th>Change</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td>Render Time</td>
              <td>{Math.round(data.performanceComparison.legacy.renderTime)}ms</td>
              <td>{Math.round(data.performanceComparison.compound.renderTime)}ms</td>
              <td className={data.performanceComparison.improvement > 0 ? 'positive' : 'negative'}>
                {data.performanceComparison.improvement > 0 ? '-' : '+'}
                {Math.abs(Math.round(data.performanceComparison.improvement))}%
              </td>
            </tr>
            <tr>
              <td>Memory Usage</td>
              <td>{Math.round(data.performanceComparison.legacy.memoryUsage / 1024 / 1024)}MB</td>
              <td>{Math.round(data.performanceComparison.compound.memoryUsage / 1024 / 1024)}MB</td>
              <td>-</td>
            </tr>
            <tr>
              <td>Time to Interactive</td>
              <td>{Math.round(data.performanceComparison.legacy.timeToInteractive)}ms</td>
              <td>{Math.round(data.performanceComparison.compound.timeToInteractive)}ms</td>
              <td>-</td>
            </tr>
          </tbody>
        </HTMLTable>
      </Card>
    </div>
  );
};

/**
 * Variants Panel - Status of each variant migration
 */
const VariantsPanel: React.FC<{
  data: MigrationDashboardData | null;
}> = ({ data }) => {
  if (!data) return <div>No variant data available</div>;

  return (
    <div className="variants-panel">
      <Card>
        <h4>Variant Migration Status</h4>
        <HTMLTable>
          <thead>
            <tr>
              <th>Variant</th>
              <th>Renders</th>
              <th>Success Rate</th>
              <th>Avg Render Time</th>
              <th>Fallback Usage</th>
              <th>Status</th>
            </tr>
          </thead>
          <tbody>
            {Object.entries(data.variantStats).map(([variant, stats]) => (
              <tr key={variant}>
                <td>{variant}</td>
                <td>{stats.totalRenders}</td>
                <td>
                  <Tag intent={stats.errorRate < 0.05 ? Intent.SUCCESS : Intent.WARNING}>
                    {Math.round((1 - stats.errorRate) * 100)}%
                  </Tag>
                </td>
                <td>{Math.round(stats.averageRenderTime)}ms</td>
                <td>
                  <Tag intent={stats.fallbackUsage < stats.totalRenders * 0.1 ? Intent.SUCCESS : Intent.WARNING}>
                    {stats.fallbackUsage}
                  </Tag>
                </td>
                <td>
                  <Tag intent={
                    stats.errorRate < 0.05 && stats.fallbackUsage < stats.totalRenders * 0.1
                      ? Intent.SUCCESS 
                      : Intent.WARNING
                  }>
                    {stats.errorRate < 0.05 && stats.fallbackUsage < stats.totalRenders * 0.1
                      ? 'Healthy' 
                      : 'Issues'
                    }
                  </Tag>
                </td>
              </tr>
            ))}
          </tbody>
        </HTMLTable>
      </Card>
    </div>
  );
};

/**
 * Issues Panel - Migration issues and alerts
 */
const IssuesPanel: React.FC<{
  data: MigrationDashboardData | null;
}> = ({ data }) => {
  if (!data) return <div>No issue data available</div>;

  if (data.issues.length === 0) {
    return (
      <NonIdealState
        icon="tick-circle"
        title="No Issues"
        description="All migrations are running smoothly."
      />
    );
  }

  return (
    <div className="issues-panel">
      <Card>
        <h4>Current Issues</h4>
        <div className="issues-list">
          {data.issues.map((issue, index) => (
            <Callout
              key={index}
              intent={
                issue.impact === 'high' ? Intent.DANGER :
                issue.impact === 'medium' ? Intent.WARNING :
                Intent.NONE
              }
              title={issue.type}
            >
              <div>Variant: {issue.variant}</div>
              <div>Count: {issue.count}</div>
              <div>Impact: {issue.impact}</div>
            </Callout>
          ))}
        </div>
      </Card>
    </div>
  );
};

/**
 * Controls Panel - Migration controls and feature flags
 */
const ControlsPanel: React.FC<{
  onRefresh: () => void;
}> = ({ onRefresh }) => {
  const [configs, setConfigs] = useState<MigrationControlConfig[]>([
    { variant: 'standard', enabled: true, rolloutPercentage: 10, abTestingEnabled: true, metricsEnabled: true },
    { variant: 'enhanced', enabled: false, rolloutPercentage: 5, abTestingEnabled: true, metricsEnabled: true },
    { variant: 'bento', enabled: false, rolloutPercentage: 0, abTestingEnabled: false, metricsEnabled: true },
    { variant: 'table', enabled: true, rolloutPercentage: 15, abTestingEnabled: true, metricsEnabled: true },
  ]);

  const updateConfig = useCallback((index: number, updates: Partial<MigrationControlConfig>) => {
    setConfigs(prev => prev.map((config, i) => 
      i === index ? { ...config, ...updates } : config
    ));
  }, []);

  const applyConfigs = useCallback(() => {
    // In a real implementation, this would update feature flags via API
    console.log('Applying migration configs:', configs);
    onRefresh();
  }, [configs, onRefresh]);

  return (
    <div className="controls-panel">
      <Card>
        <h4>Migration Controls</h4>
        <Callout intent={Intent.WARNING}>
          Changes to migration controls will affect all users. Use with caution.
        </Callout>
        
        <div className="controls-table">
          <HTMLTable>
            <thead>
              <tr>
                <th>Variant</th>
                <th>Enabled</th>
                <th>Rollout %</th>
                <th>A/B Testing</th>
                <th>Metrics</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {configs.map((config, index) => (
                <tr key={config.variant}>
                  <td>{config.variant}</td>
                  <td>
                    <Switch
                      checked={config.enabled}
                      onChange={(e) => updateConfig(index, { 
                        enabled: (e.target as HTMLInputElement).checked 
                      })}
                    />
                  </td>
                  <td>
                    <NumericInput
                      value={config.rolloutPercentage}
                      min={0}
                      max={100}
                      stepSize={5}
                      onValueChange={(value) => updateConfig(index, { 
                        rolloutPercentage: value 
                      })}
                    />
                  </td>
                  <td>
                    <Switch
                      checked={config.abTestingEnabled}
                      onChange={(e) => updateConfig(index, { 
                        abTestingEnabled: (e.target as HTMLInputElement).checked 
                      })}
                    />
                  </td>
                  <td>
                    <Switch
                      checked={config.metricsEnabled}
                      onChange={(e) => updateConfig(index, { 
                        metricsEnabled: (e.target as HTMLInputElement).checked 
                      })}
                    />
                  </td>
                  <td>
                    <Button
                      text="Emergency Stop"
                      intent={Intent.DANGER}
                      minimal
                      small
                      onClick={() => updateConfig(index, { 
                        enabled: false, 
                        rolloutPercentage: 0 
                      })}
                    />
                  </td>
                </tr>
              ))}
            </tbody>
          </HTMLTable>
        </div>

        <Divider />
        
        <div className="controls-actions">
          <Button
            text="Apply Changes"
            intent={Intent.PRIMARY}
            onClick={applyConfigs}
          />
          <Button
            text="Emergency Rollback All"
            intent={Intent.DANGER}
            onClick={() => {
              if (window.confirm('This will disable all migrations. Are you sure?')) {
                setConfigs(prev => prev.map(config => ({
                  ...config,
                  enabled: false,
                  rolloutPercentage: 0
                })));
                applyConfigs();
              }
            }}
          />
        </div>
      </Card>
    </div>
  );
};

// =============================================================================
// Styles
// =============================================================================

const dashboardStyles = `
.migration-dashboard {
  padding: 20px;
  max-width: 1200px;
  margin: 0 auto;
}

.dashboard-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
}

.dashboard-controls {
  display: flex;
  gap: 10px;
  align-items: center;
}

.last-updated {
  text-align: right;
  color: #666;
  font-size: 12px;
  margin-bottom: 10px;
}

.overview-cards {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
  gap: 20px;
  margin-bottom: 20px;
}

.overview-cards .bp5-card {
  padding: 20px;
}

.progress-text {
  margin-top: 8px;
  font-size: 14px;
  color: #666;
}

.performance-summary {
  text-align: center;
}

.improvement {
  font-size: 24px;
  font-weight: bold;
}

.improvement.positive {
  color: #0d8050;
}

.improvement.negative {
  color: #c23030;
}

.performance-label {
  font-size: 12px;
  color: #666;
}

.issues-summary {
  display: flex;
  flex-wrap: wrap;
  gap: 5px;
}

.recommendations {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.positive {
  color: #0d8050;
}

.negative {
  color: #c23030;
}

.controls-table {
  margin: 20px 0;
}

.controls-actions {
  display: flex;
  gap: 10px;
  justify-content: flex-end;
}

.issues-list {
  display: flex;
  flex-direction: column;
  gap: 10px;
}
`;

// Inject styles
if (typeof document !== 'undefined') {
  const styleElement = document.createElement('style');
  styleElement.textContent = dashboardStyles;
  document.head.appendChild(styleElement);
}

// =============================================================================
// Export
// =============================================================================

export default MigrationDashboard;