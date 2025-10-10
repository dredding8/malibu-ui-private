/**
 * Analytics Service - Test Suite
 * Tests for performance metrics calculation, trend analysis, and export functionality
 */

import AnalyticsService, { 
  PerformanceMetrics, 
  TrendData, 
  SitePerformance, 
  ConflictAnalytics,
  DashboardInsight,
  ExportFormat 
} from '../analyticsService';
import { CollectionOpportunity } from '../../types/collectionOpportunities';

describe('AnalyticsService', () => {
  let analyticsService: AnalyticsService;
  let mockOpportunities: CollectionOpportunity[];

  beforeEach(() => {
    analyticsService = AnalyticsService.getInstance();
    
    // Create mock opportunities data
    mockOpportunities = [
      {
        id: 'opp-1',
        name: 'Test Collection 1',
        satellite: {
          id: 'sat-1',
          name: 'Satellite 1',
          capacity: 100,
          currentLoad: 50,
          orbit: 'LEO',
          function: 'Imaging'
        },
        sites: [],
        allocatedSites: [
          {
            id: 'site-1',
            name: 'Site A',
            location: { lat: 0, lon: 0 },
            capacity: 50,
            allocated: 25
          }
        ],
        priority: 'high',
        status: 'optimal',
        capacityPercentage: 75,
        conflicts: [],
        createdDate: '2024-01-01T00:00:00.000Z',
        lastModified: '2024-01-02T00:00:00.000Z',
        collectionDeckId: 'deck-1',
        totalPasses: 5,
        capacity: 100,
        matchStatus: 'baseline'
      },
      {
        id: 'opp-2',
        name: 'Test Collection 2',
        satellite: {
          id: 'sat-2',
          name: 'Satellite 2',
          capacity: 100,
          currentLoad: 80,
          orbit: 'MEO',
          function: 'SIGINT'
        },
        sites: [],
        allocatedSites: [
          {
            id: 'site-2',
            name: 'Site B',
            location: { lat: 0, lon: 0 },
            capacity: 75,
            allocated: 50
          }
        ],
        priority: 'critical',
        status: 'warning',
        capacityPercentage: 90,
        conflicts: ['Resource conflict'],
        createdDate: '2024-01-02T00:00:00.000Z',
        lastModified: '2024-01-03T00:00:00.000Z',
        collectionDeckId: 'deck-2',
        totalPasses: 8,
        capacity: 150,
        matchStatus: 'suboptimal',
        dataIntegrityIssues: [{
          type: 'NO_TLE',
          severity: 'warning',
          message: 'TLE data is stale',
          satelliteId: 'sat-2'
        }]
      }
    ];
  });

  describe('Singleton Pattern', () => {
    test('returns same instance when called multiple times', () => {
      const instance1 = AnalyticsService.getInstance();
      const instance2 = AnalyticsService.getInstance();
      
      expect(instance1).toBe(instance2);
    });
  });

  describe('Performance Metrics Calculation', () => {
    test('calculates performance metrics correctly', () => {
      const metrics: PerformanceMetrics = analyticsService.calculatePerformanceMetrics(mockOpportunities);
      
      expect(metrics).toHaveProperty('totalOpportunities', 2);
      expect(metrics).toHaveProperty('matchSuccessRate');
      expect(metrics).toHaveProperty('averageProcessingTime');
      expect(metrics).toHaveProperty('conflictResolutionRate');
      expect(metrics).toHaveProperty('capacityUtilization');
      expect(metrics).toHaveProperty('dataIntegrityScore');
      
      expect(metrics.totalOpportunities).toBe(2);
      expect(metrics.matchSuccessRate).toBeGreaterThanOrEqual(0);
      expect(metrics.matchSuccessRate).toBeLessThanOrEqual(100);
    });

    test('handles empty opportunities array', () => {
      const metrics: PerformanceMetrics = analyticsService.calculatePerformanceMetrics([]);
      
      expect(metrics.totalOpportunities).toBe(0);
      expect(metrics.matchSuccessRate).toBe(0);
    });

    test('calculates match success rate correctly', () => {
      const metrics: PerformanceMetrics = analyticsService.calculatePerformanceMetrics(mockOpportunities);
      
      // With 2 opportunities, 1 optimal and 1 warning, we expect 50% success rate
      // (only optimal is considered successful)
      expect(metrics.matchSuccessRate).toBe(50);
    });

    test('calculates capacity utilization correctly', () => {
      const metrics: PerformanceMetrics = analyticsService.calculatePerformanceMetrics(mockOpportunities);
      
      // Total capacity: 100 + 150 = 250
      // Utilized capacity: (75% of 100) + (90% of 150) = 75 + 135 = 210
      // Utilization: 210/250 = 84%
      expect(metrics.capacityUtilization).toBe(84);
    });

    test('calculates data integrity score correctly', () => {
      const metrics: PerformanceMetrics = analyticsService.calculatePerformanceMetrics(mockOpportunities);
      
      // 1 data integrity issue out of 2 opportunities = 5 point deduction
      // Score: 100 - (1/2 * 10) = 95
      expect(metrics.dataIntegrityScore).toBe(95);
    });
  });

  describe('Trend Data Generation', () => {
    test('generates trend data for specified metric', () => {
      const trendData: TrendData[] = analyticsService.generateTrendData(mockOpportunities, 'matchSuccessRate');
      
      expect(trendData).toHaveLength(30); // 30 days
      expect(trendData[0]).toHaveProperty('date');
      expect(trendData[0]).toHaveProperty('value');
      expect(trendData[0]).toHaveProperty('change');
      expect(trendData[0]).toHaveProperty('changePercentage');
    });

    test('generates different values for different metrics', () => {
      const matchTrends = analyticsService.generateTrendData(mockOpportunities, 'matchSuccessRate');
      const capacityTrends = analyticsService.generateTrendData(mockOpportunities, 'capacityUtilization');
      
      expect(matchTrends).not.toEqual(capacityTrends);
    });

    test('trend data has correct date format', () => {
      const trendData: TrendData[] = analyticsService.generateTrendData(mockOpportunities, 'matchSuccessRate');
      
      trendData.forEach(item => {
        expect(item.date).toMatch(/^\d{4}-\d{2}-\d{2}$/);
        expect(new Date(item.date)).toBeInstanceOf(Date);
      });
    });
  });

  describe('Site Performance Analysis', () => {
    test('analyzes site performance correctly', () => {
      const sitePerformance: SitePerformance[] = analyticsService.analyzeSitePerformance(mockOpportunities);
      
      expect(sitePerformance).toHaveLength(2); // 2 unique sites
      
      const siteA = sitePerformance.find(site => site.siteName === 'Site A');
      expect(siteA).toBeDefined();
      expect(siteA?.totalAllocations).toBe(1);
      expect(siteA?.successRate).toBe(100); // Site A has optimal status
      
      const siteB = sitePerformance.find(site => site.siteName === 'Site B');
      expect(siteB).toBeDefined();
      expect(siteB?.totalAllocations).toBe(1);
      expect(siteB?.successRate).toBe(0); // Site B has warning status
    });

    test('sorts sites by total allocations', () => {
      const sitePerformance: SitePerformance[] = analyticsService.analyzeSitePerformance(mockOpportunities);
      
      // Both sites have 1 allocation, so order may vary, but should be sorted
      for (let i = 0; i < sitePerformance.length - 1; i++) {
        expect(sitePerformance[i].totalAllocations).toBeGreaterThanOrEqual(
          sitePerformance[i + 1].totalAllocations
        );
      }
    });
  });

  describe('Conflict Analytics', () => {
    test('analyzes conflicts correctly', () => {
      const conflictAnalytics: ConflictAnalytics = analyticsService.analyzeConflicts(mockOpportunities);
      
      expect(conflictAnalytics.totalConflicts).toBe(1); // Only opp-2 has conflicts
      expect(conflictAnalytics.resolvedConflicts).toBeGreaterThanOrEqual(0);
      expect(conflictAnalytics.pendingConflicts).toBeGreaterThanOrEqual(0);
      expect(conflictAnalytics.averageResolutionTime).toBeGreaterThan(0);
      expect(conflictAnalytics.conflictsByType).toBeDefined();
      expect(conflictAnalytics.resolutionTrends).toHaveLength(30);
    });

    test('conflict resolution rate calculation', () => {
      const conflictAnalytics: ConflictAnalytics = analyticsService.analyzeConflicts(mockOpportunities);
      
      expect(conflictAnalytics.resolvedConflicts + conflictAnalytics.pendingConflicts)
        .toBe(conflictAnalytics.totalConflicts);
    });
  });

  describe('Insights Generation', () => {
    test('generates insights based on performance metrics', () => {
      const metrics: PerformanceMetrics = analyticsService.calculatePerformanceMetrics(mockOpportunities);
      const insights: DashboardInsight[] = analyticsService.generateInsights(mockOpportunities, metrics);
      
      expect(Array.isArray(insights)).toBe(true);
      
      insights.forEach(insight => {
        expect(insight).toHaveProperty('id');
        expect(insight).toHaveProperty('type');
        expect(insight).toHaveProperty('severity');
        expect(insight).toHaveProperty('title');
        expect(insight).toHaveProperty('description');
        expect(insight).toHaveProperty('recommendation');
        expect(insight).toHaveProperty('impact');
        expect(insight).toHaveProperty('confidence');
        
        expect(['opportunity', 'risk', 'trend', 'anomaly']).toContain(insight.type);
        expect(['low', 'medium', 'high', 'critical']).toContain(insight.severity);
        expect(insight.confidence).toBeGreaterThanOrEqual(0);
        expect(insight.confidence).toBeLessThanOrEqual(100);
      });
    });

    test('generates insights for low match success rate', () => {
      // Create data with low match success rate
      const lowPerformanceOps = mockOpportunities.map(opp => ({
        ...opp,
        status: 'critical' as const
      }));
      
      const metrics = analyticsService.calculatePerformanceMetrics(lowPerformanceOps);
      const insights = analyticsService.generateInsights(lowPerformanceOps, metrics);
      
      const matchRateInsight = insights.find(insight => 
        insight.title.includes('Match Success Rate')
      );
      
      expect(matchRateInsight).toBeDefined();
      expect(['high', 'critical']).toContain(matchRateInsight!.severity);
    });

    test('sorts insights by severity', () => {
      const metrics = analyticsService.calculatePerformanceMetrics(mockOpportunities);
      const insights = analyticsService.generateInsights(mockOpportunities, metrics);
      
      const severityOrder = { critical: 4, high: 3, medium: 2, low: 1 };
      
      for (let i = 0; i < insights.length - 1; i++) {
        expect(severityOrder[insights[i].severity]).toBeGreaterThanOrEqual(
          severityOrder[insights[i + 1].severity]
        );
      }
    });
  });

  describe('Export Functionality', () => {
    test('exports data in CSV format', async () => {
      const exportFormat: ExportFormat = {
        format: 'csv',
        dateRange: {
          start: new Date('2024-01-01'),
          end: new Date('2024-01-31')
        }
      };
      
      const exportData = await analyticsService.exportData(mockOpportunities, exportFormat);
      
      expect(typeof exportData).toBe('string');
      expect(exportData).toContain('Metric,Value,Date');
      expect(exportData).toContain('Total Opportunities');
      expect(exportData).toContain('Match Success Rate');
    });

    test('exports data in JSON format', async () => {
      const exportFormat: ExportFormat = {
        format: 'json',
        dateRange: {
          start: new Date('2024-01-01'),
          end: new Date('2024-01-31')
        }
      };
      
      const exportData = await analyticsService.exportData(mockOpportunities, exportFormat);
      
      expect(typeof exportData).toBe('string');
      
      const parsedData = JSON.parse(exportData);
      expect(parsedData).toHaveProperty('exportDate');
      expect(parsedData).toHaveProperty('summary');
      expect(parsedData).toHaveProperty('sitePerformance');
      expect(parsedData).toHaveProperty('conflicts');
      expect(parsedData).toHaveProperty('opportunities');
    });

    test('creates blob for Excel format', async () => {
      const exportFormat: ExportFormat = {
        format: 'excel',
        dateRange: {
          start: new Date('2024-01-01'),
          end: new Date('2024-01-31')
        }
      };
      
      const exportData = await analyticsService.exportData(mockOpportunities, exportFormat);
      
      expect(exportData).toBeInstanceOf(Blob);
      expect((exportData as Blob).type).toBe('application/vnd.ms-excel');
    });

    test('applies filters when specified', async () => {
      const exportFormat: ExportFormat = {
        format: 'json',
        dateRange: {
          start: new Date('2024-01-01'),
          end: new Date('2024-01-31')
        },
        filters: {
          statuses: ['optimal']
        }
      };
      
      const exportData = await analyticsService.exportData(mockOpportunities, exportFormat);
      const parsedData = JSON.parse(exportData);
      
      // Should only include opportunities with optimal status
      expect(parsedData.opportunities).toHaveLength(1);
      expect(parsedData.opportunities[0].status).toBe('optimal');
    });

    test('throws error for unsupported format', async () => {
      const exportFormat: ExportFormat = {
        format: 'xml' as any,
        dateRange: {
          start: new Date('2024-01-01'),
          end: new Date('2024-01-31')
        }
      };
      
      await expect(analyticsService.exportData(mockOpportunities, exportFormat))
        .rejects.toThrow('Unsupported export format: xml');
    });
  });

  describe('Caching', () => {
    test.skip('caches performance metrics calculations', () => {
      const spy = jest.spyOn(analyticsService as any, 'calculateMetricValue');
      
      // Call twice with same data
      analyticsService.calculatePerformanceMetrics(mockOpportunities);
      analyticsService.calculatePerformanceMetrics(mockOpportunities);
      
      // Should use cache on second call (implementation dependent)
      expect(spy).toHaveBeenCalled();
      
      spy.mockRestore();
    });
  });

  describe('Edge Cases', () => {
    test('handles opportunities with missing optional fields', () => {
      const incompleteOpportunities = [{
        ...mockOpportunities[0],
        conflicts: undefined,
        dataIntegrityIssues: undefined,
        alternativeOptions: undefined
      }] as CollectionOpportunity[];
      
      expect(() => {
        analyticsService.calculatePerformanceMetrics(incompleteOpportunities);
      }).not.toThrow();
    });

    test('handles zero capacity scenarios', () => {
      const zeroCapacityOps = mockOpportunities.map(opp => ({
        ...opp,
        capacity: 0
      }));
      
      const metrics = analyticsService.calculatePerformanceMetrics(zeroCapacityOps);
      expect(metrics.capacityUtilization).toBe(0);
    });

    test('handles future dates in trend generation', () => {
      const futureOpportunities = mockOpportunities.map(opp => ({
        ...opp,
        createdDate: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString()
      }));
      
      const trends = analyticsService.generateTrendData(futureOpportunities, 'matchSuccessRate');
      expect(trends).toHaveLength(30);
    });
  });
});