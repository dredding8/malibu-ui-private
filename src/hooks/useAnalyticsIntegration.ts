/**
 * Analytics Integration Hook
 * Connects Analytics Dashboard with CollectionOpportunitiesHub for real-time data
 */

import { useState, useEffect, useCallback } from 'react';
import { CollectionOpportunity } from '../types/collectionOpportunities';
import AnalyticsService, { PerformanceMetrics, TrendData, SitePerformance, ConflictAnalytics, DashboardInsight } from '../services/analyticsService';

export interface AnalyticsData {
  opportunities: CollectionOpportunity[];
  performanceMetrics: PerformanceMetrics | null;
  trendData: { [key: string]: TrendData[] };
  sitePerformance: SitePerformance[];
  conflictAnalytics: ConflictAnalytics | null;
  insights: DashboardInsight[];
  isLoading: boolean;
  error: string | null;
  lastUpdated: Date | null;
}

export interface AnalyticsIntegrationOptions {
  autoRefresh?: boolean;
  refreshInterval?: number; // milliseconds
  enableRealTime?: boolean;
  dataSource?: 'mock' | 'api' | 'hub';
}

export const useAnalyticsIntegration = (options: AnalyticsIntegrationOptions = {}) => {
  const {
    autoRefresh = false,
    refreshInterval = 30000, // 30 seconds
    enableRealTime = false,
    dataSource = 'mock'
  } = options;

  const [analyticsData, setAnalyticsData] = useState<AnalyticsData>({
    opportunities: [],
    performanceMetrics: null,
    trendData: {},
    sitePerformance: [],
    conflictAnalytics: null,
    insights: [],
    isLoading: true,
    error: null,
    lastUpdated: null
  });

  const analyticsService = AnalyticsService.getInstance();

  // Load data from CollectionOpportunitiesHub context or API
  const loadOpportunitiesData = useCallback(async (): Promise<CollectionOpportunity[]> => {
    // In a real implementation, this would connect to the hub's data
    // For now, generate mock data similar to the hub
    try {
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
            orbit: ['LEO', 'MEO', 'GEO'][Math.floor(Math.random() * 3)],
            function: ['Imaging', 'SIGINT', 'Weather'][Math.floor(Math.random() * 3)]
          },
          sites: [],
          allocatedSites: [
            {
              id: `site-${(i % 15) + 1}`,
              name: `Site ${String.fromCharCode(65 + (i % 15))}`,
              location: { 
                lat: -90 + Math.random() * 180, 
                lon: -180 + Math.random() * 360 
              },
              capacity: 50 + Math.random() * 50,
              allocated: Math.random() * 40 + 5
            }
          ],
          priority: ['low', 'medium', 'high', 'critical'][Math.floor(Math.random() * 4)] as any,
          status: ['optimal', 'warning', 'critical'][Math.floor(Math.random() * 3)] as any,
          capacityPercentage: Math.random() * 100,
          conflicts: Math.random() > 0.7 ? [`Scheduling conflict`, `Resource conflict`] : [],
          createdDate: new Date(Date.now() - Math.random() * 30 * 24 * 60 * 60 * 1000).toISOString(),
          lastModified: new Date(Date.now() - Math.random() * 7 * 24 * 60 * 60 * 1000).toISOString(),
          collectionDeckId: `deck-${(i % 5) + 1}`,
          totalPasses: Math.floor(Math.random() * 10) + 1,
          capacity: Math.floor(Math.random() * 100) + 50,
          matchStatus: ['baseline', 'suboptimal', 'unmatched'][Math.floor(Math.random() * 3)] as any,
          dataIntegrityIssues: Math.random() > 0.8 ? [{
            type: ['NO_TLE', 'STALE_EPHEMERIS', 'SITE_OFFLINE', 'SENSOR_FAILURE'][Math.floor(Math.random() * 4)] as any,
            severity: ['critical', 'warning', 'info'][Math.floor(Math.random() * 3)] as any,
            message: 'Data quality issue detected',
            satelliteId: `sat-${(i % 10) + 1}`
          }] : []
        };
        
        mockOpportunities.push(opportunity);
      }
      
      return mockOpportunities;
    } catch (error) {
      console.error('Error loading opportunities data:', error);
      throw error;
    }
  }, []);

  // Process analytics data
  const processAnalyticsData = useCallback(async (opportunities: CollectionOpportunity[]) => {
    try {
      // Calculate performance metrics
      const metrics = analyticsService.calculatePerformanceMetrics(opportunities);
      
      // Generate trend data for different metrics
      const trends = {
        matchSuccessRate: analyticsService.generateTrendData(opportunities, 'matchSuccessRate'),
        capacityUtilization: analyticsService.generateTrendData(opportunities, 'capacityUtilization'),
        conflictResolution: analyticsService.generateTrendData(opportunities, 'conflictResolution'),
        dataIntegrity: analyticsService.generateTrendData(opportunities, 'dataIntegrity')
      };
      
      // Analyze site performance
      const sitePerf = analyticsService.analyzeSitePerformance(opportunities);
      
      // Analyze conflicts
      const conflicts = analyticsService.analyzeConflicts(opportunities);
      
      // Generate actionable insights
      const dashboardInsights = analyticsService.generateInsights(opportunities, metrics);
      
      return {
        performanceMetrics: metrics,
        trendData: trends,
        sitePerformance: sitePerf,
        conflictAnalytics: conflicts,
        insights: dashboardInsights
      };
    } catch (error) {
      console.error('Error processing analytics data:', error);
      throw error;
    }
  }, [analyticsService]);

  // Main data loading function
  const loadAnalyticsData = useCallback(async () => {
    try {
      setAnalyticsData(prev => ({ ...prev, isLoading: true, error: null }));
      
      // Load opportunities data
      const opportunities = await loadOpportunitiesData();
      
      // Process analytics
      const analytics = await processAnalyticsData(opportunities);
      
      setAnalyticsData({
        opportunities,
        ...analytics,
        isLoading: false,
        error: null,
        lastUpdated: new Date()
      });
      
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
      setAnalyticsData(prev => ({
        ...prev,
        isLoading: false,
        error: errorMessage
      }));
    }
  }, [loadOpportunitiesData, processAnalyticsData]);

  // Refresh data manually
  const refreshData = useCallback(() => {
    loadAnalyticsData();
  }, [loadAnalyticsData]);

  // Initialize data on mount
  useEffect(() => {
    loadAnalyticsData();
  }, [loadAnalyticsData]);

  // Set up auto-refresh if enabled
  useEffect(() => {
    if (autoRefresh || enableRealTime) {
      const interval = setInterval(loadAnalyticsData, refreshInterval);
      return () => clearInterval(interval);
    }
  }, [autoRefresh, enableRealTime, refreshInterval, loadAnalyticsData]);

  // Performance monitoring - track key metrics changes
  const getPerformanceAlerts = useCallback(() => {
    if (!analyticsData.performanceMetrics) return [];
    
    const alerts = [];
    const metrics = analyticsData.performanceMetrics;
    
    if (metrics.matchSuccessRate < 70) {
      alerts.push({
        type: 'warning',
        message: `Match success rate is low: ${metrics.matchSuccessRate.toFixed(1)}%`,
        action: 'Review matching algorithms and site availability'
      });
    }
    
    if (metrics.capacityUtilization > 90) {
      alerts.push({
        type: 'critical',
        message: `Capacity utilization is high: ${metrics.capacityUtilization.toFixed(1)}%`,
        action: 'Consider load balancing or capacity expansion'
      });
    }
    
    if (metrics.dataIntegrityScore < 80) {
      alerts.push({
        type: 'warning',
        message: `Data integrity issues detected: ${metrics.dataIntegrityScore.toFixed(1)}%`,
        action: 'Investigate data sources and validation processes'
      });
    }
    
    return alerts;
  }, [analyticsData.performanceMetrics]);

  // Get trends summary
  const getTrendsSummary = useCallback(() => {
    if (!analyticsData.trendData.matchSuccessRate) return null;
    
    const recent = analyticsData.trendData.matchSuccessRate.slice(-7); // Last 7 days
    const older = analyticsData.trendData.matchSuccessRate.slice(-14, -7); // Previous 7 days
    
    if (recent.length === 0 || older.length === 0) return null;
    
    const recentAvg = recent.reduce((acc, item) => acc + item.value, 0) / recent.length;
    const olderAvg = older.reduce((acc, item) => acc + item.value, 0) / older.length;
    
    const trend = recentAvg > olderAvg ? 'improving' : recentAvg < olderAvg ? 'declining' : 'stable';
    const change = Math.abs(recentAvg - olderAvg);
    const changePercent = olderAvg > 0 ? (change / olderAvg) * 100 : 0;
    
    return {
      trend,
      change,
      changePercent,
      current: recentAvg,
      previous: olderAvg
    };
  }, [analyticsData.trendData]);

  return {
    analyticsData,
    refreshData,
    loadAnalyticsData,
    getPerformanceAlerts,
    getTrendsSummary,
    isLoading: analyticsData.isLoading,
    error: analyticsData.error,
    lastUpdated: analyticsData.lastUpdated
  };
};

export default useAnalyticsIntegration;