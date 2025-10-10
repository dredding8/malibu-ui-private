/**
 * Analytics Service
 * Handles collection performance metrics, trends analysis, and reporting data
 */

import { CollectionOpportunity, Site, MatchStatus, OpportunityStatus } from '../types/collectionOpportunities';

// Analytics data interfaces
export interface PerformanceMetrics {
  totalOpportunities: number;
  matchSuccessRate: number;
  averageProcessingTime: number;
  conflictResolutionRate: number;
  capacityUtilization: number;
  dataIntegrityScore: number;
}

export interface TrendData {
  date: string;
  value: number;
  change?: number;
  changePercentage?: number;
}

export interface SitePerformance {
  siteId: string;
  siteName: string;
  totalAllocations: number;
  successRate: number;
  averageCapacityUsage: number;
  conflictCount: number;
  lastActivityDate: string;
}

export interface ConflictAnalytics {
  totalConflicts: number;
  resolvedConflicts: number;
  pendingConflicts: number;
  averageResolutionTime: number;
  conflictsByType: { [key: string]: number };
  resolutionTrends: TrendData[];
}

export interface ExportFormat {
  format: 'excel' | 'pdf' | 'csv' | 'json';
  dateRange: {
    start: Date;
    end: Date;
  };
  includeCharts?: boolean;
  filters?: {
    sites?: string[];
    satellites?: string[];
    statuses?: OpportunityStatus[];
  };
}

export interface DashboardInsight {
  id: string;
  type: 'opportunity' | 'risk' | 'trend' | 'anomaly';
  severity: 'low' | 'medium' | 'high' | 'critical';
  title: string;
  description: string;
  recommendation: string;
  impact: string;
  confidence: number; // 0-100
  dataPoints?: any[];
}

export class AnalyticsService {
  private static instance: AnalyticsService;
  private metricsCache: Map<string, any> = new Map();
  private cacheTimeout = 5 * 60 * 1000; // 5 minutes

  public static getInstance(): AnalyticsService {
    if (!AnalyticsService.instance) {
      AnalyticsService.instance = new AnalyticsService();
    }
    return AnalyticsService.instance;
  }

  /**
   * Calculate current performance metrics from opportunities data
   */
  public calculatePerformanceMetrics(opportunities: CollectionOpportunity[]): PerformanceMetrics {
    const cacheKey = `performance_metrics_${opportunities.length}_${Date.now()}`;
    
    if (this.metricsCache.has(cacheKey)) {
      return this.metricsCache.get(cacheKey);
    }

    const totalOpportunities = opportunities.length;
    
    // Match success rate calculation
    const matchedOpportunities = opportunities.filter(opp => 
      opp.status === 'optimal'
    );
    const matchSuccessRate = totalOpportunities > 0 ? 
      (matchedOpportunities.length / totalOpportunities) * 100 : 0;

    // Average processing time (simulated based on complexity)
    const averageProcessingTime = opportunities.reduce((acc, opp) => {
      const complexity = (opp.conflicts?.length || 0) + (opp.alternativeOptions?.length || 0);
      return acc + (30 + complexity * 5); // Base 30 seconds + complexity factor
    }, 0) / Math.max(totalOpportunities, 1);

    // Conflict resolution rate
    const conflictsTotal = opportunities.reduce((acc, opp) => acc + (opp.conflicts?.length || 0), 0);
    const resolvedConflicts = opportunities.filter(opp => 
      (opp.conflicts?.length || 0) > 0 && opp.status !== 'critical'
    ).length;
    const conflictResolutionRate = conflictsTotal > 0 ? 
      (resolvedConflicts / conflictsTotal) * 100 : 100;

    // Capacity utilization
    const totalCapacity = opportunities.reduce((acc, opp) => acc + opp.capacity, 0);
    const utilizedCapacity = opportunities.reduce((acc, opp) => 
      acc + (opp.capacityPercentage * opp.capacity / 100), 0
    );
    const capacityUtilization = totalCapacity > 0 ? 
      (utilizedCapacity / totalCapacity) * 100 : 0;

    // Data integrity score
    const issuesCount = opportunities.reduce((acc, opp) => 
      acc + (opp.dataIntegrityIssues?.length || 0), 0
    );
    const dataIntegrityScore = Math.max(0, 100 - (issuesCount / totalOpportunities) * 10);

    const metrics = {
      totalOpportunities,
      matchSuccessRate,
      averageProcessingTime,
      conflictResolutionRate,
      capacityUtilization,
      dataIntegrityScore
    };

    this.metricsCache.set(cacheKey, metrics);
    setTimeout(() => this.metricsCache.delete(cacheKey), this.cacheTimeout);

    return metrics;
  }

  /**
   * Generate trend data for the last 30 days
   */
  public generateTrendData(opportunities: CollectionOpportunity[], metricType: string): TrendData[] {
    const days = 30;
    const trends: TrendData[] = [];
    const now = new Date();

    for (let i = days - 1; i >= 0; i--) {
      const date = new Date(now);
      date.setDate(date.getDate() - i);
      
      // Simulate historical data based on current patterns
      const dayOpportunities = this.simulateHistoricalData(opportunities, i);
      const value = this.calculateMetricValue(dayOpportunities, metricType);
      
      const previousValue = i < days - 1 ? trends[trends.length - 1]?.value : value;
      const change = value - previousValue;
      const changePercentage = previousValue !== 0 ? (change / previousValue) * 100 : 0;

      trends.push({
        date: date.toISOString().split('T')[0],
        value,
        change,
        changePercentage
      });
    }

    return trends;
  }

  /**
   * Analyze site performance metrics
   */
  public analyzeSitePerformance(opportunities: CollectionOpportunity[]): SitePerformance[] {
    const siteMap = new Map<string, {
      allocations: number;
      successes: number;
      totalCapacity: number;
      usedCapacity: number;
      conflicts: number;
      lastActivity: Date;
    }>();

    opportunities.forEach(opp => {
      opp.allocatedSites.forEach(site => {
        const existing = siteMap.get(site.id) || {
          allocations: 0,
          successes: 0,
          totalCapacity: 0,
          usedCapacity: 0,
          conflicts: 0,
          lastActivity: new Date(0)
        };

        existing.allocations++;
        if (opp.status === 'optimal') existing.successes++;
        existing.totalCapacity += site.capacity;
        existing.usedCapacity += site.allocated;
        existing.conflicts += opp.conflicts.length;
        
        const lastModified = new Date(opp.lastModified);
        if (lastModified > existing.lastActivity) {
          existing.lastActivity = lastModified;
        }

        siteMap.set(site.id, existing);
      });
    });

    return Array.from(siteMap.entries()).map(([siteId, data]) => {
      const site = opportunities
        .flatMap(opp => opp.allocatedSites)
        .find(s => s.id === siteId);

      return {
        siteId,
        siteName: site?.name || `Site ${siteId}`,
        totalAllocations: data.allocations,
        successRate: data.allocations > 0 ? (data.successes / data.allocations) * 100 : 0,
        averageCapacityUsage: data.totalCapacity > 0 ? (data.usedCapacity / data.totalCapacity) * 100 : 0,
        conflictCount: data.conflicts,
        lastActivityDate: data.lastActivity.toISOString()
      };
    }).sort((a, b) => b.totalAllocations - a.totalAllocations);
  }

  /**
   * Generate conflict analytics
   */
  public analyzeConflicts(opportunities: CollectionOpportunity[]): ConflictAnalytics {
    const conflicts = opportunities.flatMap(opp => opp.conflicts);
    const totalConflicts = conflicts.length;
    
    // Simulate resolved vs pending conflicts
    const resolvedConflicts = Math.floor(totalConflicts * 0.7); // 70% resolution rate
    const pendingConflicts = totalConflicts - resolvedConflicts;
    
    // Average resolution time (simulated)
    const averageResolutionTime = 2.5; // hours

    // Conflicts by type
    const conflictsByType: { [key: string]: number } = {
      'Scheduling Conflict': Math.floor(totalConflicts * 0.4),
      'Capacity Limit': Math.floor(totalConflicts * 0.3),
      'Resource Unavailable': Math.floor(totalConflicts * 0.2),
      'Data Quality': Math.floor(totalConflicts * 0.1)
    };

    // Resolution trends
    const resolutionTrends = this.generateTrendData(opportunities, 'conflictResolution');

    return {
      totalConflicts,
      resolvedConflicts,
      pendingConflicts,
      averageResolutionTime,
      conflictsByType,
      resolutionTrends
    };
  }

  /**
   * Generate actionable insights from data
   */
  public generateInsights(opportunities: CollectionOpportunity[], metrics: PerformanceMetrics): DashboardInsight[] {
    const insights: DashboardInsight[] = [];

    // Low match success rate insight
    if (metrics.matchSuccessRate < 80) {
      insights.push({
        id: 'low-match-rate',
        type: 'risk',
        severity: metrics.matchSuccessRate < 60 ? 'critical' : 'high',
        title: 'Low Match Success Rate',
        description: `Current match success rate is ${metrics.matchSuccessRate.toFixed(1)}%, below optimal threshold of 80%`,
        recommendation: 'Review matching algorithms and consider expanding site capacity or adjusting collection priorities',
        impact: 'Reduced collection efficiency and potential mission impact',
        confidence: 85
      });
    }

    // High capacity utilization insight
    if (metrics.capacityUtilization > 90) {
      insights.push({
        id: 'high-capacity',
        type: 'risk',
        severity: 'medium',
        title: 'High Capacity Utilization',
        description: `System capacity is at ${metrics.capacityUtilization.toFixed(1)}%, approaching maximum`,
        recommendation: 'Consider load balancing across sites or increasing capacity to prevent bottlenecks',
        impact: 'Potential service degradation during peak periods',
        confidence: 90
      });
    }

    // Data integrity issues
    if (metrics.dataIntegrityScore < 85) {
      insights.push({
        id: 'data-integrity',
        type: 'anomaly',
        severity: 'high',
        title: 'Data Integrity Concerns',
        description: `Data integrity score is ${metrics.dataIntegrityScore.toFixed(1)}%, indicating potential data quality issues`,
        recommendation: 'Investigate data sources and implement additional validation checks',
        impact: 'Poor data quality affects matching accuracy and operational decisions',
        confidence: 75
      });
    }

    // Opportunity for optimization
    if (metrics.averageProcessingTime > 60) {
      insights.push({
        id: 'processing-optimization',
        type: 'opportunity',
        severity: 'medium',
        title: 'Processing Time Optimization',
        description: `Average processing time is ${metrics.averageProcessingTime.toFixed(1)} seconds, above optimal range`,
        recommendation: 'Optimize algorithms and consider caching strategies for frequently accessed data',
        impact: 'Faster processing leads to improved user experience and system throughput',
        confidence: 80
      });
    }

    // Positive trend insight
    const recentOpportunities = opportunities.filter(opp => {
      const daysSince = (Date.now() - new Date(opp.createdDate).getTime()) / (1000 * 60 * 60 * 24);
      return daysSince <= 7;
    });

    if (recentOpportunities.length > opportunities.length * 0.3) {
      insights.push({
        id: 'increased-activity',
        type: 'trend',
        severity: 'low',
        title: 'Increased Collection Activity',
        description: `Collection activity has increased by ${((recentOpportunities.length / opportunities.length) * 100).toFixed(1)}% in the past week`,
        recommendation: 'Monitor system performance and ensure adequate resources are available',
        impact: 'Higher activity may require additional capacity planning',
        confidence: 70
      });
    }

    return insights.sort((a, b) => {
      const severityOrder = { critical: 4, high: 3, medium: 2, low: 1 };
      return severityOrder[b.severity] - severityOrder[a.severity];
    });
  }

  /**
   * Export data in specified format
   */
  public async exportData(opportunities: CollectionOpportunity[], format: ExportFormat): Promise<Blob | string> {
    const metrics = this.calculatePerformanceMetrics(opportunities);
    const sitePerformance = this.analyzeSitePerformance(opportunities);
    const conflicts = this.analyzeConflicts(opportunities);

    const data = {
      exportDate: new Date().toISOString(),
      dateRange: format.dateRange,
      summary: metrics,
      sitePerformance,
      conflicts,
      opportunities: format.filters ? this.applyFilters(opportunities, format.filters) : opportunities
    };

    switch (format.format) {
      case 'json':
        return JSON.stringify(data, null, 2);
      
      case 'csv':
        return this.generateCSV(data);
      
      case 'excel':
        // In a real implementation, this would generate an Excel file
        return new Blob([this.generateCSV(data)], { type: 'application/vnd.ms-excel' });
      
      case 'pdf':
        // In a real implementation, this would generate a PDF report
        return new Blob([JSON.stringify(data, null, 2)], { type: 'application/pdf' });
      
      default:
        throw new Error(`Unsupported export format: ${format.format}`);
    }
  }

  // Private helper methods

  private simulateHistoricalData(opportunities: CollectionOpportunity[], daysAgo: number): CollectionOpportunity[] {
    // Simulate data variation based on days ago
    const variance = 0.1 + (Math.random() * 0.2); // 10-30% variance
    const factor = 1 + (Math.random() - 0.5) * variance;
    
    return opportunities.slice(0, Math.floor(opportunities.length * factor));
  }

  private calculateMetricValue(opportunities: CollectionOpportunity[], metricType: string): number {
    const metrics = this.calculatePerformanceMetrics(opportunities);
    
    switch (metricType) {
      case 'matchSuccessRate':
        return metrics.matchSuccessRate;
      case 'capacityUtilization':
        return metrics.capacityUtilization;
      case 'conflictResolution':
        return metrics.conflictResolutionRate;
      case 'dataIntegrity':
        return metrics.dataIntegrityScore;
      default:
        return opportunities.length;
    }
  }

  private applyFilters(opportunities: CollectionOpportunity[], filters: any): CollectionOpportunity[] {
    return opportunities.filter(opp => {
      if (filters.sites && filters.sites.length > 0) {
        const hasSite = opp.allocatedSites.some(site => filters.sites.includes(site.id));
        if (!hasSite) return false;
      }
      
      if (filters.satellites && filters.satellites.length > 0) {
        if (!filters.satellites.includes(opp.satellite.id)) return false;
      }
      
      if (filters.statuses && filters.statuses.length > 0) {
        if (!filters.statuses.includes(opp.status)) return false;
      }
      
      return true;
    });
  }

  private generateCSV(data: any): string {
    const headers = ['Metric', 'Value', 'Date'];
    const rows = [
      ['Total Opportunities', data.summary.totalOpportunities, data.exportDate],
      ['Match Success Rate', `${data.summary.matchSuccessRate.toFixed(1)}%`, data.exportDate],
      ['Capacity Utilization', `${data.summary.capacityUtilization.toFixed(1)}%`, data.exportDate],
      ['Data Integrity Score', `${data.summary.dataIntegrityScore.toFixed(1)}%`, data.exportDate]
    ];

    return [headers, ...rows].map(row => row.join(',')).join('\n');
  }
}

export default AnalyticsService;