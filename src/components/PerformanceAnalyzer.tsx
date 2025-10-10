import React, { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import {
  Card,
  H4,
  H5,
  H6,
  Button,
  ButtonGroup,
  Intent,
  Icon,
  Tag,
  ProgressBar,
  Callout,
  Tabs,
  Tab,
  Classes,
  Switch,
  Divider,
  Tooltip
} from '@blueprintjs/core';
import { IconNames } from '@blueprintjs/icons';
import './PerformanceAnalyzer.css';

// Performance metrics interfaces
export interface PerformanceMetrics {
  renderTime: number;
  memoryUsage: number;
  domNodes: number;
  bundleSize: number;
  interactionLatency: number;
  frameRate: number;
  networkRequests: number;
  cacheHitRate: number;
}

export interface ComponentMetrics {
  name: string;
  renderCount: number;
  averageRenderTime: number;
  memoryFootprint: number;
  reRenderTriggers: string[];
  optimizationScore: number;
}

export interface LoadTestResult {
  itemCount: number;
  renderTime: number;
  memoryUsage: number;
  frameRate: number;
  interactionDelay: number;
  status: 'excellent' | 'good' | 'warning' | 'critical';
}

interface PerformanceAnalyzerProps {
  isActive: boolean;
  targetComponents: string[];
  onOptimizationSuggestion: (suggestion: OptimizationSuggestion) => void;
}

export interface OptimizationSuggestion {
  id: string;
  component: string;
  type: 'memory' | 'render' | 'network' | 'accessibility';
  severity: 'low' | 'medium' | 'high' | 'critical';
  description: string;
  implementation: string;
  expectedImprovement: string;
  effort: 'low' | 'medium' | 'high';
}

export const PerformanceAnalyzer: React.FC<PerformanceAnalyzerProps> = ({
  isActive,
  targetComponents,
  onOptimizationSuggestion
}) => {
  const [currentMetrics, setCurrentMetrics] = useState<PerformanceMetrics | null>(null);
  const [componentMetrics, setComponentMetrics] = useState<ComponentMetrics[]>([]);
  const [loadTestResults, setLoadTestResults] = useState<LoadTestResult[]>([]);
  const [isMonitoring, setIsMonitoring] = useState(false);
  const [selectedTab, setSelectedTab] = useState('overview');
  const [enableRealTimeMode, setEnableRealTimeMode] = useState(false);
  const [optimizationSuggestions, setOptimizationSuggestions] = useState<OptimizationSuggestion[]>([]);

  const performanceObserver = useRef<PerformanceObserver | null>(null);
  const memoryMonitor = useRef<number | null>(null);
  const frameRateMonitor = useRef<number | null>(null);

  // Initialize performance monitoring
  useEffect(() => {
    if (!isActive) return;

    // Performance observer for paint and navigation timing
    if ('PerformanceObserver' in window) {
      performanceObserver.current = new PerformanceObserver((list) => {
        const entries = list.getEntries();
        updateMetricsFromEntries(entries);
      });

      performanceObserver.current.observe({ 
        entryTypes: ['measure', 'navigation', 'paint', 'layout-shift'] 
      });
    }

    // Memory monitoring (if available)
    if ('memory' in performance) {
      memoryMonitor.current = window.setInterval(() => {
        const memory = (performance as any).memory;
        if (memory && enableRealTimeMode) {
          setCurrentMetrics(prev => prev ? {
            ...prev,
            memoryUsage: memory.usedJSHeapSize / 1024 / 1024 // Convert to MB
          } : null);
        }
      }, 1000);
    }

    // Frame rate monitoring
    let lastTime = 0;
    let frameCount = 0;

    const measureFrameRate = (timestamp: number) => {
      frameCount++;
      if (timestamp - lastTime >= 1000) {
        if (enableRealTimeMode) {
          setCurrentMetrics(prev => prev ? {
            ...prev,
            frameRate: frameCount
          } : null);
        }
        frameCount = 0;
        lastTime = timestamp;
      }
      if (isMonitoring) {
        requestAnimationFrame(measureFrameRate);
      }
    };

    if (isMonitoring) {
      requestAnimationFrame(measureFrameRate);
    }

    return () => {
      performanceObserver.current?.disconnect();
      if (memoryMonitor.current) {
        clearInterval(memoryMonitor.current);
      }
    };
  }, [isActive, isMonitoring, enableRealTimeMode]);

  // Update metrics from performance entries
  const updateMetricsFromEntries = useCallback((entries: PerformanceEntry[]) => {
    const paintEntries = entries.filter(entry => entry.entryType === 'paint');
    const measureEntries = entries.filter(entry => entry.entryType === 'measure');

    if (paintEntries.length > 0) {
      const firstPaint = paintEntries.find(entry => entry.name === 'first-paint');
      if (firstPaint) {
        setCurrentMetrics(prev => prev ? {
          ...prev,
          renderTime: firstPaint.startTime
        } : {
          renderTime: firstPaint.startTime,
          memoryUsage: 0,
          domNodes: document.getElementsByTagName('*').length,
          bundleSize: 0,
          interactionLatency: 0,
          frameRate: 60,
          networkRequests: 0,
          cacheHitRate: 95
        });
      }
    }
  }, []);

  // Generate load test scenarios
  const runLoadTest = useCallback(async (itemCounts: number[]) => {
    const results: LoadTestResult[] = [];

    for (const count of itemCounts) {
      // Simulate rendering with different item counts
      const startTime = performance.now();
      
      // Mock load test - in real implementation, this would render actual components
      await new Promise(resolve => setTimeout(resolve, Math.log(count) * 10));
      
      const renderTime = performance.now() - startTime;
      const memoryUsage = 50 + (count * 0.1); // Estimated MB
      const frameRate = Math.max(30, 60 - (count * 0.01));
      const interactionDelay = Math.min(200, count * 0.05);

      const status: LoadTestResult['status'] = 
        renderTime < 100 && frameRate > 55 ? 'excellent' :
        renderTime < 300 && frameRate > 45 ? 'good' :
        renderTime < 1000 && frameRate > 30 ? 'warning' : 'critical';

      results.push({
        itemCount: count,
        renderTime,
        memoryUsage,
        frameRate,
        interactionDelay,
        status
      });
    }

    setLoadTestResults(results);
    generateOptimizationSuggestions(results);
  }, []);

  // Generate optimization suggestions based on performance data
  const generateOptimizationSuggestions = useCallback((results: LoadTestResult[]) => {
    const suggestions: OptimizationSuggestion[] = [];

    // Analyze render performance
    const slowRenders = results.filter(r => r.renderTime > 500);
    if (slowRenders.length > 0) {
      suggestions.push({
        id: 'render-optimization',
        component: 'Table Components',
        type: 'render',
        severity: 'high',
        description: 'Large datasets causing slow render times (>500ms)',
        implementation: 'Implement React.memo, useMemo for expensive calculations, and virtualization for large lists',
        expectedImprovement: '60-80% render time reduction',
        effort: 'medium'
      });
    }

    // Analyze memory usage
    const highMemoryUsage = results.filter(r => r.memoryUsage > 200);
    if (highMemoryUsage.length > 0) {
      suggestions.push({
        id: 'memory-optimization',
        component: 'All Components',
        type: 'memory',
        severity: 'medium',
        description: 'Memory usage exceeding 200MB threshold',
        implementation: 'Implement component unmounting, clear event listeners, and optimize object references',
        expectedImprovement: '40-50% memory reduction',
        effort: 'medium'
      });
    }

    // Analyze frame rate
    const lowFrameRate = results.filter(r => r.frameRate < 45);
    if (lowFrameRate.length > 0) {
      suggestions.push({
        id: 'animation-optimization',
        component: 'Status Indicators',
        type: 'render',
        severity: 'medium',
        description: 'Animation frame rate dropping below 45fps',
        implementation: 'Use CSS transforms, will-change property, and requestAnimationFrame for smooth animations',
        expectedImprovement: '15-20fps improvement',
        effort: 'low'
      });
    }

    // Analyze interaction latency
    const highLatency = results.filter(r => r.interactionDelay > 100);
    if (highLatency.length > 0) {
      suggestions.push({
        id: 'interaction-optimization',
        component: 'Interactive Elements',
        type: 'render',
        severity: 'high',
        description: 'User interaction delays exceeding 100ms threshold',
        implementation: 'Debounce user inputs, implement optimistic UI updates, and preload critical data',
        expectedImprovement: '50-70% latency reduction',
        effort: 'medium'
      });
    }

    setOptimizationSuggestions(suggestions);
    suggestions.forEach(onOptimizationSuggestion);
  }, [onOptimizationSuggestion]);

  // Component performance analysis
  const analyzeComponentPerformance = useCallback(() => {
    const mockMetrics: ComponentMetrics[] = [
      {
        name: 'CollectionOpportunities',
        renderCount: 156,
        averageRenderTime: 45.2,
        memoryFootprint: 12.3,
        reRenderTriggers: ['props.opportunities', 'state.selectedRows'],
        optimizationScore: 78
      },
      {
        name: 'OpportunityStatusIndicatorV2',
        renderCount: 892,
        averageRenderTime: 2.8,
        memoryFootprint: 1.1,
        reRenderTriggers: ['props.status'],
        optimizationScore: 95
      },
      {
        name: 'ProgressiveDisclosureTable',
        renderCount: 234,
        averageRenderTime: 89.4,
        memoryFootprint: 23.7,
        reRenderTriggers: ['props.opportunities', 'state.expandedRows'],
        optimizationScore: 65
      },
      {
        name: 'ConflictResolutionSystem',
        renderCount: 67,
        averageRenderTime: 125.6,
        memoryFootprint: 18.9,
        reRenderTriggers: ['props.conflicts', 'state.selectedConflict'],
        optimizationScore: 72
      }
    ];

    setComponentMetrics(mockMetrics);
  }, []);

  // Get performance score
  const getPerformanceScore = useMemo(() => {
    if (!currentMetrics) return 0;

    const renderScore = Math.max(0, 100 - (currentMetrics.renderTime / 10));
    const memoryScore = Math.max(0, 100 - (currentMetrics.memoryUsage / 5));
    const frameScore = (currentMetrics.frameRate / 60) * 100;
    const interactionScore = Math.max(0, 100 - (currentMetrics.interactionLatency / 2));

    return Math.round((renderScore + memoryScore + frameScore + interactionScore) / 4);
  }, [currentMetrics]);

  // Get intent based on score
  const getScoreIntent = (score: number): Intent => {
    if (score >= 90) return Intent.SUCCESS;
    if (score >= 70) return Intent.PRIMARY;
    if (score >= 50) return Intent.WARNING;
    return Intent.DANGER;
  };

  if (!isActive) {
    return (
      <Card>
        <Callout intent={Intent.NONE} icon={IconNames.OFFLINE}>
          Performance monitoring is disabled. Enable to track application performance metrics.
        </Callout>
      </Card>
    );
  }

  return (
    <div className="performance-analyzer">
      <Card className="analyzer-header">
        <div className="header-content">
          <H4>
            <Icon icon={IconNames.DASHBOARD} />
            Performance Analysis Dashboard
          </H4>
          <div className="header-controls">
            <Switch
              checked={isMonitoring}
              onChange={(e) => setIsMonitoring(e.currentTarget.checked)}
              label="Active Monitoring"
            />
            <Switch
              checked={enableRealTimeMode}
              onChange={(e) => setEnableRealTimeMode(e.currentTarget.checked)}
              label="Real-time Updates"
            />
          </div>
        </div>
      </Card>

      <Tabs selectedTabId={selectedTab} onChange={(newTabId) => setSelectedTab(newTabId as string)}>
        <Tab id="overview" title="Overview" panel={
          <div className="overview-panel">
            {/* Performance Score */}
            <Card className="performance-score-card">
              <H5>Overall Performance Score</H5>
              <div className="score-display">
                <div className="score-circle">
                  <span className={`score-value ${getScoreIntent(getPerformanceScore)}`}>
                    {getPerformanceScore}
                  </span>
                  <span className="score-label">/ 100</span>
                </div>
                <div className="score-details">
                  {currentMetrics && (
                    <>
                      <div className="metric-item">
                        <span>Render Time:</span>
                        <Tag intent={currentMetrics.renderTime < 100 ? Intent.SUCCESS : Intent.WARNING}>
                          {currentMetrics.renderTime.toFixed(1)}ms
                        </Tag>
                      </div>
                      <div className="metric-item">
                        <span>Memory Usage:</span>
                        <Tag intent={currentMetrics.memoryUsage < 100 ? Intent.SUCCESS : Intent.WARNING}>
                          {currentMetrics.memoryUsage.toFixed(1)}MB
                        </Tag>
                      </div>
                      <div className="metric-item">
                        <span>Frame Rate:</span>
                        <Tag intent={currentMetrics.frameRate > 55 ? Intent.SUCCESS : Intent.WARNING}>
                          {currentMetrics.frameRate.toFixed(0)}fps
                        </Tag>
                      </div>
                    </>
                  )}
                </div>
              </div>
            </Card>

            {/* Quick Actions */}
            <Card className="quick-actions">
              <H5>Performance Actions</H5>
              <ButtonGroup large>
                <Button
                  intent={Intent.PRIMARY}
                  icon={IconNames.PLAY}
                  onClick={() => runLoadTest([100, 500, 1000, 2500, 5000])}
                >
                  Run Load Test
                </Button>
                <Button
                  icon={IconNames.SEARCH}
                  onClick={analyzeComponentPerformance}
                >
                  Analyze Components
                </Button>
                <Button
                  icon={IconNames.REFRESH}
                  onClick={() => window.location.reload()}
                >
                  Reset Metrics
                </Button>
              </ButtonGroup>
            </Card>

            {/* Optimization Suggestions */}
            {optimizationSuggestions.length > 0 && (
              <Card className="optimization-suggestions">
                <H5>Optimization Recommendations</H5>
                <div className="suggestions-list">
                  {optimizationSuggestions.slice(0, 3).map(suggestion => (
                    <Callout
                      key={suggestion.id}
                      intent={suggestion.severity === 'critical' ? Intent.DANGER : 
                             suggestion.severity === 'high' ? Intent.WARNING : Intent.PRIMARY}
                      icon={IconNames.LIGHTBULB}
                    >
                      <strong>{suggestion.component}</strong>: {suggestion.description}
                      <br />
                      <small>Expected improvement: {suggestion.expectedImprovement}</small>
                    </Callout>
                  ))}
                </div>
              </Card>
            )}
          </div>
        } />

        <Tab id="loadtest" title="Load Testing" panel={
          <div className="loadtest-panel">
            <Card>
              <H5>Load Test Results</H5>
              {loadTestResults.length === 0 ? (
                <Callout icon={IconNames.INFO_SIGN}>
                  Run a load test to see performance across different data sizes.
                </Callout>
              ) : (
                <div className="load-test-results">
                  {loadTestResults.map((result, idx) => (
                    <div key={idx} className="load-test-item">
                      <div className="test-header">
                        <span className="item-count">{result.itemCount.toLocaleString()} items</span>
                        <Tag intent={getScoreIntent(result.status === 'excellent' ? 95 : 
                                                  result.status === 'good' ? 80 :
                                                  result.status === 'warning' ? 60 : 40)}>
                          {result.status}
                        </Tag>
                      </div>
                      <div className="test-metrics">
                        <div className="metric">
                          <span>Render:</span>
                          <span>{result.renderTime.toFixed(1)}ms</span>
                        </div>
                        <div className="metric">
                          <span>Memory:</span>
                          <span>{result.memoryUsage.toFixed(1)}MB</span>
                        </div>
                        <div className="metric">
                          <span>FPS:</span>
                          <span>{result.frameRate.toFixed(0)}</span>
                        </div>
                        <div className="metric">
                          <span>Delay:</span>
                          <span>{result.interactionDelay.toFixed(1)}ms</span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </Card>
          </div>
        } />

        <Tab id="components" title="Components" panel={
          <div className="components-panel">
            <Card>
              <H5>Component Performance Analysis</H5>
              {componentMetrics.length === 0 ? (
                <Callout icon={IconNames.INFO_SIGN}>
                  Click "Analyze Components" to see detailed performance metrics for each component.
                </Callout>
              ) : (
                <div className="component-metrics">
                  {componentMetrics.map((metric, idx) => (
                    <Card key={idx} className="component-metric-card">
                      <div className="component-header">
                        <H6>{metric.name}</H6>
                        <Tag intent={getScoreIntent(metric.optimizationScore)}>
                          {metric.optimizationScore}/100
                        </Tag>
                      </div>
                      <div className="metric-grid">
                        <div className="metric-item">
                          <span className="metric-label">Renders:</span>
                          <span className="metric-value">{metric.renderCount}</span>
                        </div>
                        <div className="metric-item">
                          <span className="metric-label">Avg Time:</span>
                          <span className="metric-value">{metric.averageRenderTime.toFixed(1)}ms</span>
                        </div>
                        <div className="metric-item">
                          <span className="metric-label">Memory:</span>
                          <span className="metric-value">{metric.memoryFootprint.toFixed(1)}MB</span>
                        </div>
                      </div>
                      <div className="render-triggers">
                        <span className="triggers-label">Re-render triggers:</span>
                        <div className="triggers-list">
                          {metric.reRenderTriggers.map((trigger, triggerIdx) => (
                            <Tag key={triggerIdx} minimal>
                              {trigger}
                            </Tag>
                          ))}
                        </div>
                      </div>
                    </Card>
                  ))}
                </div>
              )}
            </Card>
          </div>
        } />

        <Tab id="suggestions" title="Optimizations" panel={
          <div className="suggestions-panel">
            <Card>
              <H5>Detailed Optimization Suggestions</H5>
              {optimizationSuggestions.length === 0 ? (
                <Callout intent={Intent.SUCCESS} icon={IconNames.TICK}>
                  No optimization suggestions at this time. Run performance tests to generate recommendations.
                </Callout>
              ) : (
                <div className="detailed-suggestions">
                  {optimizationSuggestions.map((suggestion, idx) => (
                    <Card key={idx} className={`suggestion-card severity-${suggestion.severity}`}>
                      <div className="suggestion-header">
                        <div className="suggestion-title">
                          <Icon icon={IconNames.LIGHTBULB} />
                          <span>{suggestion.component}</span>
                          <Tag intent={suggestion.severity === 'critical' ? Intent.DANGER :
                                     suggestion.severity === 'high' ? Intent.WARNING : Intent.PRIMARY}>
                            {suggestion.severity.toUpperCase()}
                          </Tag>
                        </div>
                        <Tag minimal>
                          {suggestion.effort} effort
                        </Tag>
                      </div>
                      <p className="suggestion-description">{suggestion.description}</p>
                      <div className="suggestion-details">
                        <div className="detail-section">
                          <strong>Implementation:</strong>
                          <p>{suggestion.implementation}</p>
                        </div>
                        <div className="detail-section">
                          <strong>Expected Improvement:</strong>
                          <p>{suggestion.expectedImprovement}</p>
                        </div>
                      </div>
                    </Card>
                  ))}
                </div>
              )}
            </Card>
          </div>
        } />
      </Tabs>
    </div>
  );
};