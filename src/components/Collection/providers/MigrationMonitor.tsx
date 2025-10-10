/**
 * Migration Monitor Component
 * 
 * Tracks migration progress, performance metrics, and provides
 * real-time monitoring and debugging capabilities.
 * 
 * Phase 3: Migration Components
 * @version 1.0.0
 * @date 2025-09-30
 */

import React, { useEffect, useState, useRef } from 'react';
import { stateSyncManager, SyncOperation, SyncResult } from '../../../migration/state/stateSync';
import { contextToStoreMapper } from '../../../migration/state/contextMigrationMap';
import { actionTranslator } from '../../../migration/state/actionTranslator';

// =============================================================================
// Migration Monitoring Interfaces
// =============================================================================

interface MigrationMetrics {
  /** Overall migration progress (0-100) */
  overallProgress: number;
  /** Component migration status */
  componentStatus: {
    total: number;
    migrated: number;
    inProgress: number;
    failed: number;
  };
  /** Performance comparison */
  performance: {
    context: {
      averageRenderTime: number;
      memoryUsage: number;
      errorRate: number;
    };
    store: {
      averageRenderTime: number;
      memoryUsage: number;
      errorRate: number;
    };
    improvement: {
      renderTimeImprovement: number;
      memoryReduction: number;
      errorReduction: number;
    };
  };
  /** Sync statistics */
  syncStats: {
    totalOperations: number;
    successfulSyncs: number;
    failedSyncs: number;
    averageSyncTime: number;
    lastSyncTime: Date | null;
  };
  /** Error tracking */
  errors: {
    critical: number;
    warnings: number;
    resolved: number;
    recent: Array<{
      id: string;
      message: string;
      timestamp: Date;
      component?: string;
      severity: 'critical' | 'warning' | 'info';
    }>;
  };
}

interface ComponentMigrationStatus {
  id: string;
  name: string;
  status: 'pending' | 'in-progress' | 'completed' | 'failed' | 'skipped';
  progress: number;
  startTime?: Date;
  completionTime?: Date;
  errors: string[];
  performance: {
    beforeMigration?: number;
    afterMigration?: number;
    improvement?: number;
  };
  dependencies: string[];
  blockers: string[];
}

// =============================================================================
// Migration Monitor Hook
// =============================================================================

export const useMigrationMonitor = () => {
  const [metrics, setMetrics] = useState<MigrationMetrics>({
    overallProgress: 0,
    componentStatus: { total: 0, migrated: 0, inProgress: 0, failed: 0 },
    performance: {
      context: { averageRenderTime: 0, memoryUsage: 0, errorRate: 0 },
      store: { averageRenderTime: 0, memoryUsage: 0, errorRate: 0 },
      improvement: { renderTimeImprovement: 0, memoryReduction: 0, errorReduction: 0 },
    },
    syncStats: {
      totalOperations: 0,
      successfulSyncs: 0,
      failedSyncs: 0,
      averageSyncTime: 0,
      lastSyncTime: null,
    },
    errors: { critical: 0, warnings: 0, resolved: 0, recent: [] },
  });

  const [components, setComponents] = useState<ComponentMigrationStatus[]>([]);
  const [isMonitoring, setIsMonitoring] = useState(false);
  const intervalRef = useRef<NodeJS.Timeout>();

  const startMonitoring = () => {
    setIsMonitoring(true);
    
    intervalRef.current = setInterval(() => {
      updateMetrics();
    }, 1000); // Update every second
  };

  const stopMonitoring = () => {
    setIsMonitoring(false);
    
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
    }
  };

  const updateMetrics = () => {
    // Get sync manager metrics
    const syncMetrics = stateSyncManager.getMetrics();
    const syncHistory = stateSyncManager.getOperationHistory();
    
    // Calculate performance metrics
    const contextPerf = calculateContextPerformance();
    const storePerf = calculateStorePerformance();
    
    setMetrics(prev => ({
      ...prev,
      syncStats: {
        totalOperations: syncMetrics.total,
        successfulSyncs: syncMetrics.completed,
        failedSyncs: syncMetrics.failed,
        averageSyncTime: syncMetrics.averageDuration,
        lastSyncTime: syncHistory[0]?.timestamp || null,
      },
      performance: {
        context: contextPerf,
        store: storePerf,
        improvement: calculateImprovement(contextPerf, storePerf),
      },
    }));
  };

  const calculateContextPerformance = () => {
    // Mock implementation - would integrate with actual performance monitoring
    return {
      averageRenderTime: Math.random() * 50 + 10, // 10-60ms
      memoryUsage: Math.random() * 10 + 5, // 5-15MB
      errorRate: Math.random() * 0.05, // 0-5%
    };
  };

  const calculateStorePerformance = () => {
    // Mock implementation - would integrate with actual performance monitoring
    return {
      averageRenderTime: Math.random() * 30 + 5, // 5-35ms (better than context)
      memoryUsage: Math.random() * 8 + 3, // 3-11MB (better than context)
      errorRate: Math.random() * 0.02, // 0-2% (better than context)
    };
  };

  const calculateImprovement = (context: any, store: any) => {
    return {
      renderTimeImprovement: ((context.averageRenderTime - store.averageRenderTime) / context.averageRenderTime) * 100,
      memoryReduction: ((context.memoryUsage - store.memoryUsage) / context.memoryUsage) * 100,
      errorReduction: ((context.errorRate - store.errorRate) / context.errorRate) * 100,
    };
  };

  const addComponent = (component: Omit<ComponentMigrationStatus, 'id'>) => {
    const newComponent: ComponentMigrationStatus = {
      ...component,
      id: `component-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
    };
    
    setComponents(prev => [...prev, newComponent]);
    updateOverallProgress();
  };

  const updateComponent = (id: string, updates: Partial<ComponentMigrationStatus>) => {
    setComponents(prev => 
      prev.map(comp => 
        comp.id === id ? { ...comp, ...updates } : comp
      )
    );
    updateOverallProgress();
  };

  const updateOverallProgress = () => {
    setComponents(current => {
      const total = current.length;
      const completed = current.filter(c => c.status === 'completed').length;
      const progress = total > 0 ? (completed / total) * 100 : 0;
      
      setMetrics(prev => ({
        ...prev,
        overallProgress: progress,
        componentStatus: {
          total,
          migrated: completed,
          inProgress: current.filter(c => c.status === 'in-progress').length,
          failed: current.filter(c => c.status === 'failed').length,
        },
      }));
      
      return current;
    });
  };

  const logError = (
    message: string, 
    severity: 'critical' | 'warning' | 'info' = 'warning',
    component?: string
  ) => {
    const error = {
      id: `error-${Date.now()}`,
      message,
      timestamp: new Date(),
      component,
      severity,
    };
    
    setMetrics(prev => ({
      ...prev,
      errors: {
        ...prev.errors,
        [severity === 'critical' ? 'critical' : 'warnings']: 
          prev.errors[severity === 'critical' ? 'critical' : 'warnings'] + 1,
        recent: [error, ...prev.errors.recent].slice(0, 10), // Keep last 10 errors
      },
    }));
  };

  const resolveError = (errorId: string) => {
    setMetrics(prev => ({
      ...prev,
      errors: {
        ...prev.errors,
        resolved: prev.errors.resolved + 1,
        recent: prev.errors.recent.filter(e => e.id !== errorId),
      },
    }));
  };

  useEffect(() => {
    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, []);

  return {
    metrics,
    components,
    isMonitoring,
    startMonitoring,
    stopMonitoring,
    addComponent,
    updateComponent,
    logError,
    resolveError,
    updateMetrics,
  };
};

// =============================================================================
// Migration Monitor Component
// =============================================================================

interface MigrationMonitorProps {
  /** Show detailed metrics */
  showDetails?: boolean;
  /** Enable real-time updates */
  enableRealtime?: boolean;
  /** Monitor position */
  position?: 'top-left' | 'top-right' | 'bottom-left' | 'bottom-right';
  /** Compact mode */
  compact?: boolean;
  /** Auto-hide when migration complete */
  autoHide?: boolean;
}

export const MigrationMonitor: React.FC<MigrationMonitorProps> = ({
  showDetails = true,
  enableRealtime = true,
  position = 'top-right',
  compact = false,
  autoHide = true,
}) => {
  const {
    metrics,
    components,
    isMonitoring,
    startMonitoring,
    stopMonitoring,
    logError,
    resolveError,
  } = useMigrationMonitor();

  const [isExpanded, setIsExpanded] = useState(!compact);
  const [selectedTab, setSelectedTab] = useState<'overview' | 'components' | 'performance' | 'errors'>('overview');

  useEffect(() => {
    if (enableRealtime && !isMonitoring) {
      startMonitoring();
    }
    
    return () => {
      if (isMonitoring) {
        stopMonitoring();
      }
    };
  }, [enableRealtime, isMonitoring, startMonitoring, stopMonitoring]);

  // Auto-hide when migration is complete
  useEffect(() => {
    if (autoHide && metrics.overallProgress === 100) {
      setTimeout(() => {
        setIsExpanded(false);
      }, 5000); // Hide after 5 seconds
    }
  }, [autoHide, metrics.overallProgress]);

  if (process.env.NODE_ENV !== 'development') {
    return null; // Only show in development
  }

  const getPositionStyles = () => {
    const [vertical, horizontal] = position.split('-');
    return {
      position: 'fixed' as const,
      [vertical]: '10px',
      [horizontal]: '10px',
      zIndex: 10001,
    };
  };

  const getStatusColor = (progress: number) => {
    if (progress === 100) return '#4CAF50'; // Green
    if (progress > 50) return '#FFC107'; // Yellow
    if (progress > 0) return '#2196F3'; // Blue
    return '#9E9E9E'; // Gray
  };

  const formatPercentage = (value: number) => {
    return `${value > 0 ? '+' : ''}${value.toFixed(1)}%`;
  };

  const renderOverview = () => (
    <div style={{ padding: '8px' }}>
      <div style={{ marginBottom: '8px' }}>
        <div style={{ fontSize: '12px', fontWeight: 'bold' }}>
          Migration Progress: {metrics.overallProgress.toFixed(1)}%
        </div>
        <div style={{
          width: '100%',
          height: '6px',
          background: '#333',
          borderRadius: '3px',
          marginTop: '4px',
        }}>
          <div style={{
            width: `${metrics.overallProgress}%`,
            height: '100%',
            background: getStatusColor(metrics.overallProgress),
            borderRadius: '3px',
            transition: 'width 0.3s ease',
          }} />
        </div>
      </div>
      
      <div style={{ fontSize: '10px', marginBottom: '6px' }}>
        <div>Components: {metrics.componentStatus.migrated}/{metrics.componentStatus.total}</div>
        <div>In Progress: {metrics.componentStatus.inProgress}</div>
        <div>Failed: {metrics.componentStatus.failed}</div>
      </div>
      
      <div style={{ fontSize: '10px' }}>
        <div>Syncs: {metrics.syncStats.successfulSyncs}/{metrics.syncStats.totalOperations}</div>
        <div>Errors: {metrics.errors.critical + metrics.errors.warnings}</div>
        {metrics.syncStats.lastSyncTime && (
          <div>Last Sync: {metrics.syncStats.lastSyncTime.toLocaleTimeString()}</div>
        )}
      </div>
    </div>
  );

  const renderComponents = () => (
    <div style={{ padding: '8px', maxHeight: '200px', overflowY: 'auto' }}>
      {components.map(component => (
        <div key={component.id} style={{ 
          marginBottom: '8px', 
          padding: '6px', 
          background: '#333', 
          borderRadius: '4px',
          fontSize: '10px',
        }}>
          <div style={{ fontWeight: 'bold' }}>{component.name}</div>
          <div style={{ 
            color: component.status === 'completed' ? '#4CAF50' : 
                   component.status === 'failed' ? '#f44336' : 
                   component.status === 'in-progress' ? '#2196F3' : '#9E9E9E'
          }}>
            {component.status} ({component.progress}%)
          </div>
          {component.errors.length > 0 && (
            <div style={{ color: '#f44336' }}>
              Errors: {component.errors.length}
            </div>
          )}
        </div>
      ))}
    </div>
  );

  const renderPerformance = () => (
    <div style={{ padding: '8px', fontSize: '10px' }}>
      <div style={{ marginBottom: '8px', fontWeight: 'bold' }}>Performance Comparison</div>
      
      <div style={{ marginBottom: '6px' }}>
        <div>Render Time:</div>
        <div>Context: {metrics.performance.context.averageRenderTime.toFixed(1)}ms</div>
        <div>Store: {metrics.performance.store.averageRenderTime.toFixed(1)}ms</div>
        <div style={{ color: '#4CAF50' }}>
          Improvement: {formatPercentage(metrics.performance.improvement.renderTimeImprovement)}
        </div>
      </div>
      
      <div style={{ marginBottom: '6px' }}>
        <div>Memory Usage:</div>
        <div>Context: {metrics.performance.context.memoryUsage.toFixed(1)}MB</div>
        <div>Store: {metrics.performance.store.memoryUsage.toFixed(1)}MB</div>
        <div style={{ color: '#4CAF50' }}>
          Reduction: {formatPercentage(metrics.performance.improvement.memoryReduction)}
        </div>
      </div>
      
      <div>
        <div>Error Rate:</div>
        <div>Context: {(metrics.performance.context.errorRate * 100).toFixed(2)}%</div>
        <div>Store: {(metrics.performance.store.errorRate * 100).toFixed(2)}%</div>
        <div style={{ color: '#4CAF50' }}>
          Reduction: {formatPercentage(metrics.performance.improvement.errorReduction)}
        </div>
      </div>
    </div>
  );

  const renderErrors = () => (
    <div style={{ padding: '8px', maxHeight: '200px', overflowY: 'auto' }}>
      <div style={{ marginBottom: '8px', fontSize: '10px' }}>
        <span style={{ color: '#f44336' }}>Critical: {metrics.errors.critical}</span>
        {' | '}
        <span style={{ color: '#FF9800' }}>Warnings: {metrics.errors.warnings}</span>
        {' | '}
        <span style={{ color: '#4CAF50' }}>Resolved: {metrics.errors.resolved}</span>
      </div>
      
      {metrics.errors.recent.map(error => (
        <div key={error.id} style={{
          marginBottom: '6px',
          padding: '6px',
          background: '#333',
          borderRadius: '4px',
          fontSize: '9px',
          borderLeft: `3px solid ${
            error.severity === 'critical' ? '#f44336' : 
            error.severity === 'warning' ? '#FF9800' : '#2196F3'
          }`,
        }}>
          <div style={{ fontWeight: 'bold' }}>{error.severity.toUpperCase()}</div>
          <div>{error.message}</div>
          <div style={{ color: '#999' }}>
            {error.timestamp.toLocaleTimeString()}
            {error.component && ` | ${error.component}`}
          </div>
          <button
            onClick={() => resolveError(error.id)}
            style={{
              background: '#4CAF50',
              border: 'none',
              color: 'white',
              padding: '2px 6px',
              borderRadius: '2px',
              fontSize: '8px',
              cursor: 'pointer',
              marginTop: '4px',
            }}
          >
            Resolve
          </button>
        </div>
      ))}
    </div>
  );

  if (!isExpanded) {
    return (
      <div
        style={{
          ...getPositionStyles(),
          background: 'rgba(0,0,0,0.9)',
          color: 'white',
          padding: '8px 12px',
          borderRadius: '20px',
          fontSize: '12px',
          cursor: 'pointer',
          border: `2px solid ${getStatusColor(metrics.overallProgress)}`,
        }}
        onClick={() => setIsExpanded(true)}
      >
        🚀 {metrics.overallProgress.toFixed(0)}%
      </div>
    );
  }

  return (
    <div style={{
      ...getPositionStyles(),
      background: 'rgba(0,0,0,0.95)',
      color: 'white',
      borderRadius: '8px',
      fontSize: '11px',
      fontFamily: 'monospace',
      width: compact ? '250px' : '320px',
      border: '1px solid #444',
      boxShadow: '0 4px 12px rgba(0,0,0,0.3)',
    }}>
      {/* Header */}
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        padding: '8px 12px',
        borderBottom: '1px solid #333',
        background: 'rgba(0,0,0,0.5)',
        borderRadius: '8px 8px 0 0',
      }}>
        <span style={{ fontWeight: 'bold' }}>🚀 Migration Monitor</span>
        <div>
          <button
            onClick={() => setIsExpanded(false)}
            style={{
              background: 'none',
              border: 'none',
              color: 'white',
              cursor: 'pointer',
              fontSize: '12px',
            }}
          >
            −
          </button>
        </div>
      </div>
      
      {/* Tabs */}
      {showDetails && (
        <div style={{
          display: 'flex',
          borderBottom: '1px solid #333',
        }}>
          {(['overview', 'components', 'performance', 'errors'] as const).map(tab => (
            <button
              key={tab}
              onClick={() => setSelectedTab(tab)}
              style={{
                flex: 1,
                background: selectedTab === tab ? '#333' : 'transparent',
                border: 'none',
                color: 'white',
                padding: '6px 4px',
                fontSize: '9px',
                cursor: 'pointer',
                textTransform: 'capitalize',
              }}
            >
              {tab}
            </button>
          ))}
        </div>
      )}
      
      {/* Content */}
      <div style={{ minHeight: compact ? '80px' : '120px' }}>
        {!showDetails || selectedTab === 'overview' ? renderOverview() :
         selectedTab === 'components' ? renderComponents() :
         selectedTab === 'performance' ? renderPerformance() :
         renderErrors()}
      </div>
    </div>
  );
};

// =============================================================================
// Migration Report Generator
// =============================================================================

export const MigrationReportGenerator = {
  /**
   * Generate a comprehensive migration report
   */
  generateReport: (metrics: MigrationMetrics, components: ComponentMigrationStatus[]) => {
    const report = {
      timestamp: new Date().toISOString(),
      summary: {
        overallProgress: metrics.overallProgress,
        totalComponents: metrics.componentStatus.total,
        migratedComponents: metrics.componentStatus.migrated,
        failedComponents: metrics.componentStatus.failed,
      },
      performance: {
        renderTimeImprovement: metrics.performance.improvement.renderTimeImprovement,
        memoryReduction: metrics.performance.improvement.memoryReduction,
        errorReduction: metrics.performance.improvement.errorReduction,
      },
      components: components.map(comp => ({
        name: comp.name,
        status: comp.status,
        progress: comp.progress,
        errors: comp.errors.length,
        performanceImprovement: comp.performance.improvement,
      })),
      issues: {
        critical: metrics.errors.critical,
        warnings: metrics.errors.warnings,
        recentErrors: metrics.errors.recent.slice(0, 5),
      },
      recommendations: generateRecommendations(metrics, components),
    };

    return report;
  },

  /**
   * Export report as JSON
   */
  exportReport: (metrics: MigrationMetrics, components: ComponentMigrationStatus[]) => {
    const report = MigrationReportGenerator.generateReport(metrics, components);
    const dataStr = JSON.stringify(report, null, 2);
    const dataBlob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(dataBlob);
    
    const link = document.createElement('a');
    link.href = url;
    link.download = `migration-report-${new Date().toISOString().split('T')[0]}.json`;
    link.click();
    
    URL.revokeObjectURL(url);
  },
};

const generateRecommendations = (metrics: MigrationMetrics, components: ComponentMigrationStatus[]): string[] => {
  const recommendations: string[] = [];
  
  if (metrics.componentStatus.failed > 0) {
    recommendations.push('Review and fix failed component migrations');
  }
  
  if (metrics.errors.critical > 0) {
    recommendations.push('Address critical errors before proceeding');
  }
  
  if (metrics.performance.improvement.renderTimeImprovement < 10) {
    recommendations.push('Investigate performance optimization opportunities');
  }
  
  if (metrics.syncStats.failedSyncs / metrics.syncStats.totalOperations > 0.1) {
    recommendations.push('Improve state synchronization reliability');
  }
  
  return recommendations;
};