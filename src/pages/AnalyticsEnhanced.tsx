/**
 * Enhanced Analytics Dashboard - JTBD #4: Analyze Performance Trends
 * Comprehensive performance analytics with trends, insights, and export capabilities
 */

import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Card,
  H3,
  H4,
  H5,
  H6,
  Icon,
  HTMLSelect,
  Tag,
  FormGroup,
  Intent,
  Callout,
  Button,
  Breadcrumbs,
  Tabs,
  Tab,
  Switch,
  Spinner,
  NonIdealState,
  Menu,
  MenuItem,
  Popover,
  Position,
  Divider
} from '@blueprintjs/core';
import { Cell, Column, Table } from '@blueprintjs/table';
import { IconNames } from '@blueprintjs/icons';
import AppNavbar from '../components/AppNavbar';
import { PerformanceTrendChart, MetricsSummaryChart, ConflictAnalysisChart } from '../components/charts/PerformanceTrendChart';
import AnalyticsService, { 
  PerformanceMetrics, 
  TrendData, 
  SitePerformance, 
  ConflictAnalytics, 
  DashboardInsight, 
  ExportFormat 
} from '../services/analyticsService';
import { CollectionOpportunity } from '../types/collectionOpportunities';
import './Analytics.css';

const Analytics: React.FC = () => {
  const navigate = useNavigate();
  const [selectedTab, setSelectedTab] = useState('overview');
  const [isRealTimeEnabled, setIsRealTimeEnabled] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [opportunities, setOpportunities] = useState<CollectionOpportunity[]>([]);
  const [performanceMetrics, setPerformanceMetrics] = useState<PerformanceMetrics | null>(null);
  const [trendData, setTrendData] = useState<{ [key: string]: TrendData[] }>({});
  const [sitePerformance, setSitePerformance] = useState<SitePerformance[]>([]);
  const [conflictAnalytics, setConflictAnalytics] = useState<ConflictAnalytics | null>(null);
  const [insights, setInsights] = useState<DashboardInsight[]>([]);
  const [refreshInterval, setRefreshInterval] = useState<NodeJS.Timeout | null>(null);
  
  const analyticsService = useMemo(() => AnalyticsService.getInstance(), []);

  // Generate mock opportunities for analytics
  const generateMockOpportunities = async (): Promise<CollectionOpportunity[]> => {
    const mockOpportunities: CollectionOpportunity[] = [];
    
    for (let i = 0; i < 150; i++) {
      const opportunity: CollectionOpportunity = {
        id: `opp-${i + 1}`,
        name: `Collection Task ${i + 1}`,
        satellite: {
          id: `sat-${(i % 10) + 1}`,
          name: `Satellite ${(i % 10) + 1}`,
          capacity: 100,
          currentLoad: Math.random() * 80 + 10,
          orbit: 'LEO',
          function: 'Imaging'
        },
        sites: [],
        allocatedSites: [
          {
            id: `site-${(i % 15) + 1}`,
            name: `Site ${String.fromCharCode(65 + (i % 15))}`,
            location: { lat: 0, lon: 0 },
            capacity: 50,
            allocated: Math.random() * 40 + 5
          }
        ],
        priority: ['low', 'medium', 'high', 'critical'][Math.floor(Math.random() * 4)] as any,
        status: ['optimal', 'warning', 'critical'][Math.floor(Math.random() * 3)] as any,
        capacityPercentage: Math.random() * 100,
        conflicts: Math.random() > 0.7 ? [`Conflict ${i}`] : [],
        createdDate: new Date(Date.now() - Math.random() * 30 * 24 * 60 * 60 * 1000).toISOString(),
        lastModified: new Date(Date.now() - Math.random() * 7 * 24 * 60 * 60 * 1000).toISOString(),
        collectionDeckId: `deck-${(i % 5) + 1}`,
        totalPasses: Math.floor(Math.random() * 10) + 1,
        capacity: Math.floor(Math.random() * 100) + 50,
        matchStatus: ['baseline', 'suboptimal', 'unmatched'][Math.floor(Math.random() * 3)] as any,
        dataIntegrityIssues: Math.random() > 0.8 ? [{
          type: 'NO_TLE' as any,
          severity: 'warning' as any,
          message: 'TLE data is stale',
          satelliteId: `sat-${(i % 10) + 1}`
        }] : []
      };
      
      mockOpportunities.push(opportunity);
    }
    
    return mockOpportunities;
  };

  // Load and refresh data
  const loadAnalyticsData = useCallback(async () => {
    try {
      setIsLoading(true);
      
      const mockOpportunities = await generateMockOpportunities();
      setOpportunities(mockOpportunities);
      
      // Calculate metrics
      const metrics = analyticsService.calculatePerformanceMetrics(mockOpportunities);
      setPerformanceMetrics(metrics);
      
      // Generate trend data
      const trends = {
        matchSuccessRate: analyticsService.generateTrendData(mockOpportunities, 'matchSuccessRate'),
        capacityUtilization: analyticsService.generateTrendData(mockOpportunities, 'capacityUtilization'),
        conflictResolution: analyticsService.generateTrendData(mockOpportunities, 'conflictResolution'),
        dataIntegrity: analyticsService.generateTrendData(mockOpportunities, 'dataIntegrity')
      };
      setTrendData(trends);
      
      // Analyze site performance
      const sitePerf = analyticsService.analyzeSitePerformance(mockOpportunities);
      setSitePerformance(sitePerf);
      
      // Analyze conflicts
      const conflicts = analyticsService.analyzeConflicts(mockOpportunities);
      setConflictAnalytics(conflicts);
      
      // Generate insights
      const dashboardInsights = analyticsService.generateInsights(mockOpportunities, metrics);
      setInsights(dashboardInsights);
      
    } catch (error) {
      console.error('Error loading analytics data:', error);
    } finally {
      setIsLoading(false);
    }
  }, [analyticsService]);
  
  // Initialize data on mount
  useEffect(() => {
    loadAnalyticsData();
  }, [loadAnalyticsData]);
  
  // Handle real-time updates
  useEffect(() => {
    if (isRealTimeEnabled) {
      const interval = setInterval(loadAnalyticsData, 30000); // Refresh every 30 seconds
      setRefreshInterval(interval);
    } else {
      if (refreshInterval) {
        clearInterval(refreshInterval);
        setRefreshInterval(null);
      }
    }
    
    return () => {
      if (refreshInterval) clearInterval(refreshInterval);
    };
  }, [isRealTimeEnabled, loadAnalyticsData]);
  
  // Export handlers
  const handleExportData = async (format: 'excel' | 'pdf' | 'csv' | 'json') => {
    if (!performanceMetrics) return;
    
    try {
      const exportFormat: ExportFormat = {
        format,
        dateRange: {
          start: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000), // 30 days ago
          end: new Date()
        },
        includeCharts: format === 'pdf'
      };
      
      const exportData = await analyticsService.exportData(opportunities, exportFormat);
      
      // Create download link
      const blob = typeof exportData === 'string' ? 
        new Blob([exportData], { type: getContentType(format) }) : exportData;
      
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `analytics-report-${new Date().toISOString().split('T')[0]}.${format}`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
      
    } catch (error) {
      console.error(`Error exporting ${format}:`, error);
    }
  };
  
  const handleDownloadChart = (chartType: string) => {
    // In a real implementation, this would generate and download chart images
    console.log(`Downloading ${chartType} chart...`);
  };
  
  // Helper function to get content type for exports
  const getContentType = (format: string): string => {
    switch (format) {
      case 'json': return 'application/json';
      case 'csv': return 'text/csv';
      case 'excel': return 'application/vnd.ms-excel';
      case 'pdf': return 'application/pdf';
      default: return 'text/plain';
    }
  };

  // Audit log data
  const auditLogData = opportunities.slice(0, 10).map((opp, idx) => ({
    scc: opp.satellite.id,
    action: ['Created', 'Updated', 'Completed', 'Validated'][Math.floor(Math.random() * 4)],
    date: new Date(opp.lastModified).toLocaleDateString()
  }));

  // Table renderers for audit log
  const sccCellRenderer = (rowIndex: number) => (
    <Cell>{auditLogData[rowIndex]?.scc}</Cell>
  );

  const actionCellRenderer = (rowIndex: number) => {
    const action = auditLogData[rowIndex]?.action;
    let intent: Intent;
    switch (action) {
      case 'Created':
        intent = Intent.SUCCESS;
        break;
      case 'Updated':
        intent = Intent.PRIMARY;
        break;
      case 'Completed':
        intent = Intent.WARNING;
        break;
      case 'Validated':
        intent = Intent.SUCCESS;
        break;
      default:
        intent = Intent.NONE;
    }
    return (
      <Cell>
        <Tag intent={intent}>{action}</Tag>
      </Cell>
    );
  };

  const dateCellRenderer = (rowIndex: number) => (
    <Cell>{auditLogData[rowIndex]?.date}</Cell>
  );

  if (isLoading) {
    return (
      <div className="analytics">
        <AppNavbar />
        <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '60vh' }}>
          <Spinner size={60} />
        </div>
      </div>
    );
  }
  
  if (!performanceMetrics) {
    return (
      <div className="analytics">
        <AppNavbar />
        <div style={{ padding: '20px' }}>
          <NonIdealState
            icon={IconNames.ERROR}
            title="Analytics Data Unavailable"
            description="Unable to load performance analytics data. Please try again later."
            action={<Button icon={IconNames.REFRESH} onClick={loadAnalyticsData}>Retry</Button>}
          />
        </div>
      </div>
    );
  }

  return (
    <div className="analytics">
      {/* Header */}
      <AppNavbar />
      
      {/* Breadcrumbs */}
      <div style={{ 
        padding: '16px 24px 0 24px',
        maxWidth: '1400px',
        margin: '0 auto'
      }}>
        <Breadcrumbs
          items={[
            {
              text: 'Data Sources',
              icon: IconNames.DATABASE,
              onClick: () => navigate('/')
            },
            {
              text: 'Performance Analytics',
              icon: IconNames.CHART,
              current: true
            }
          ]}
        />
      </div>

      {/* Main Content */}
      <div className="analytics-content" style={{ padding: '20px', maxWidth: '1400px', margin: '0 auto' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
          <div>
            <H3 style={{ margin: 0 }}>Performance Trends Analytics</H3>
            <p style={{ margin: '8px 0 0 0', color: '#666' }}>JTBD #4: Monitor collection efficiency and identify optimization opportunities</p>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
            <Switch
              checked={isRealTimeEnabled}
              onChange={(e) => setIsRealTimeEnabled(e.currentTarget.checked)}
              label="Real-time Updates"
            />
            <Button
              icon={IconNames.REFRESH}
              onClick={loadAnalyticsData}
              disabled={isLoading}
            >
              Refresh
            </Button>
            <Popover
              content={
                <Menu>
                  <MenuItem icon={IconNames.DOCUMENT} text="Export as CSV" onClick={() => handleExportData('csv')} />
                  <MenuItem icon={IconNames.DOCUMENT} text="Export as Excel" onClick={() => handleExportData('excel')} />
                  <MenuItem icon={IconNames.DOCUMENT} text="Export as JSON" onClick={() => handleExportData('json')} />
                  <MenuItem icon={IconNames.DOCUMENT} text="Export as PDF" onClick={() => handleExportData('pdf')} />
                </Menu>
              }
              position={Position.BOTTOM_RIGHT}
            >
              <Button icon={IconNames.EXPORT} rightIcon={IconNames.CARET_DOWN}>
                Export Report
              </Button>
            </Popover>
          </div>
        </div>

        {/* Key Insights Alert */}
        {insights.length > 0 && (
          <div style={{ marginBottom: '24px' }}>
            {insights.slice(0, 3).map(insight => (
              <Callout
                key={insight.id}
                intent={insight.severity === 'critical' ? Intent.DANGER : 
                       insight.severity === 'high' ? Intent.WARNING : Intent.PRIMARY}
                icon={insight.type === 'risk' ? IconNames.WARNING_SIGN : 
                     insight.type === 'opportunity' ? IconNames.LIGHTBULB : IconNames.INFO_SIGN}
                style={{ marginBottom: '12px' }}
              >
                <H6>{insight.title}</H6>
                <p>{insight.description}</p>
                <small><strong>Recommendation:</strong> {insight.recommendation}</small>
              </Callout>
            ))}
          </div>
        )}
        
        {/* Analytics Dashboard Tabs */}
        <Tabs selectedTabId={selectedTab} onChange={(newTabId) => setSelectedTab(newTabId as string)} large>
          <Tab id="overview" title="Overview" panel={
            <div className="overview-panel" style={{ padding: '20px 0' }}>
              {/* Performance Summary Cards */}
              <div className="performance-summary-grid">
                <Card className="performance-summary-card">
                  <H4 className="performance-metric-value" style={{ color: '#0F9960' }}>
                    {performanceMetrics.matchSuccessRate.toFixed(1)}%
                  </H4>
                  <p className="performance-metric-label">Match Success Rate</p>
                </Card>
                <Card className="performance-summary-card">
                  <H4 className="performance-metric-value" style={{ color: '#2965CC' }}>
                    {performanceMetrics.capacityUtilization.toFixed(1)}%
                  </H4>
                  <p className="performance-metric-label">Capacity Utilization</p>
                </Card>
                <Card className="performance-summary-card">
                  <H4 className="performance-metric-value" style={{ color: '#D9822B' }}>
                    {performanceMetrics.conflictResolutionRate.toFixed(1)}%
                  </H4>
                  <p className="performance-metric-label">Conflict Resolution</p>
                </Card>
                <Card className="performance-summary-card">
                  <H4 className="performance-metric-value" style={{ color: '#A82A2A' }}>
                    {performanceMetrics.dataIntegrityScore.toFixed(1)}%
                  </H4>
                  <p className="performance-metric-label">Data Integrity</p>
                </Card>
              </div>
              
              {/* Charts Grid */}
              <div className="charts-grid">
                <div className="charts-column">
                  {trendData.matchSuccessRate && (
                    <PerformanceTrendChart
                      title="Match Success Rate Trends"
                      data={trendData.matchSuccessRate}
                      type="area"
                      color="#0F9960"
                      onDownload={() => handleDownloadChart('match-success')}
                    />
                  )}
                  {trendData.capacityUtilization && (
                    <PerformanceTrendChart
                      title="Capacity Utilization Trends"
                      data={trendData.capacityUtilization}
                      type="line"
                      color="#2965CC"
                      onDownload={() => handleDownloadChart('capacity')}
                    />
                  )}
                </div>
                <MetricsSummaryChart
                  metrics={performanceMetrics}
                  onDownload={() => handleDownloadChart('summary')}
                />
              </div>
            </div>
          } />
          
          <Tab id="trends" title="Detailed Trends" panel={
            <div className="trends-panel" style={{ padding: '20px 0' }}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '24px' }}>
                {trendData.conflictResolution && (
                  <PerformanceTrendChart
                    title="Conflict Resolution Trends"
                    data={trendData.conflictResolution}
                    type="line"
                    color="#D9822B"
                    onDownload={() => handleDownloadChart('conflicts')}
                  />
                )}
                {trendData.dataIntegrity && (
                  <PerformanceTrendChart
                    title="Data Integrity Trends"
                    data={trendData.dataIntegrity}
                    type="area"
                    color="#A82A2A"
                    onDownload={() => handleDownloadChart('data-integrity')}
                  />
                )}
              </div>
              
              {conflictAnalytics && (
                <div style={{ marginTop: '24px' }}>
                  <ConflictAnalysisChart
                    conflictsByType={conflictAnalytics.conflictsByType}
                    resolutionTrends={conflictAnalytics.resolutionTrends}
                    onDownload={() => handleDownloadChart('conflict-analysis')}
                  />
                </div>
              )}
            </div>
          } />
          
          <Tab id="sites" title="Site Performance" panel={
            <div className="sites-panel" style={{ padding: '20px 0' }}>
              <Card>
                <H5>Site Performance Analysis</H5>
                <div style={{ marginTop: '16px' }}>
                  {sitePerformance.length > 0 ? (
                    <div style={{ display: 'grid', gap: '12px' }}>
                      {sitePerformance.slice(0, 10).map(site => (
                        <Card key={site.siteId} style={{ padding: '12px' }}>
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <div>
                              <H6 style={{ margin: 0 }}>{site.siteName}</H6>
                              <p style={{ margin: '4px 0 0 0', fontSize: '12px', color: '#666' }}>
                                {site.totalAllocations} allocations • Last active: {new Date(site.lastActivityDate).toLocaleDateString()}
                              </p>
                            </div>
                            <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
                              <div style={{ textAlign: 'center' }}>
                                <div style={{ fontSize: '14px', fontWeight: 'bold', color: site.successRate > 80 ? '#0F9960' : site.successRate > 60 ? '#D9822B' : '#A82A2A' }}>
                                  {site.successRate.toFixed(1)}%
                                </div>
                                <div style={{ fontSize: '10px', color: '#666' }}>Success</div>
                              </div>
                              <div style={{ textAlign: 'center' }}>
                                <div style={{ fontSize: '14px', fontWeight: 'bold' }}>
                                  {site.averageCapacityUsage.toFixed(1)}%
                                </div>
                                <div style={{ fontSize: '10px', color: '#666' }}>Capacity</div>
                              </div>
                              <div style={{ textAlign: 'center' }}>
                                <div style={{ fontSize: '14px', fontWeight: 'bold', color: site.conflictCount > 5 ? '#A82A2A' : '#666' }}>
                                  {site.conflictCount}
                                </div>
                                <div style={{ fontSize: '10px', color: '#666' }}>Conflicts</div>
                              </div>
                            </div>
                          </div>
                        </Card>
                      ))}
                    </div>
                  ) : (
                    <NonIdealState
                      icon={IconNames.SEARCH}
                      title="No Site Data Available"
                      description="Site performance data will appear here once collection activities begin."
                    />
                  )}
                </div>
              </Card>
            </div>
          } />
          
          <Tab id="insights" title="Insights" panel={
            <div className="insights-panel" style={{ padding: '20px 0' }}>
              <Card>
                <H5>Actionable Insights</H5>
                <div style={{ marginTop: '16px' }}>
                  {insights.length > 0 ? (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                      {insights.map(insight => (
                        <Card key={insight.id} style={{ padding: '16px' }}>
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '8px' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                              <Tag
                                intent={insight.severity === 'critical' ? Intent.DANGER : 
                                       insight.severity === 'high' ? Intent.WARNING : Intent.PRIMARY}
                                minimal
                              >
                                {insight.severity.toUpperCase()}
                              </Tag>
                              <H6 style={{ margin: 0 }}>{insight.title}</H6>
                            </div>
                            <div style={{ fontSize: '12px', color: '#666' }}>
                              Confidence: {insight.confidence}%
                            </div>
                          </div>
                          <p style={{ margin: '8px 0', fontSize: '14px' }}>{insight.description}</p>
                          <div style={{ marginTop: '12px' }}>
                            <strong style={{ fontSize: '12px', color: '#666' }}>Recommendation:</strong>
                            <p style={{ margin: '4px 0 8px 0', fontSize: '13px' }}>{insight.recommendation}</p>
                            <strong style={{ fontSize: '12px', color: '#666' }}>Expected Impact:</strong>
                            <p style={{ margin: '4px 0 0 0', fontSize: '13px' }}>{insight.impact}</p>
                          </div>
                        </Card>
                      ))}
                    </div>
                  ) : (
                    <NonIdealState
                      icon={IconNames.LIGHTBULB}
                      title="No Insights Available"
                      description="Performance insights will appear here as the system analyzes your data."
                    />
                  )}
                </div>
              </Card>
            </div>
          } />
          
          <Tab id="audit" title="Activity Log" panel={
            <div className="audit-panel" style={{ padding: '20px 0' }}>
              <Card>
                <H5>Recent Activity</H5>
                <Divider style={{ margin: '16px 0' }} />
                {auditLogData.length > 0 ? (
                  <Table numRows={auditLogData.length} enableRowHeader={false}>
                    <Column name="Satellite" cellRenderer={sccCellRenderer} />
                    <Column name="Action" cellRenderer={actionCellRenderer} />
                    <Column name="Date" cellRenderer={dateCellRenderer} />
                  </Table>
                ) : (
                  <NonIdealState
                    icon={IconNames.HISTORY}
                    title="No Recent Activity"
                    description="Activity logs will appear here as operations are performed."
                  />
                )}
              </Card>
            </div>
          } />
        </Tabs>
      </div>
    </div>
  );
};

export default Analytics;