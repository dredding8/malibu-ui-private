/**
 * Migration Metrics Utility
 * 
 * Tracks migration progress, performance, and success metrics for
 * the collection component migration.
 * 
 * @version 1.0.0
 * @date 2025-09-30
 */

// =============================================================================
// Type Definitions
// =============================================================================

export interface MigrationMetric {
  id: string;
  variant: string;
  timestamp: number;
  type: 'render' | 'interaction' | 'error' | 'performance' | 'fallback';
  data: Record<string, any>;
  sessionId: string;
  userId?: string;
}

export interface PerformanceMetric {
  renderTime: number;
  memoryUsage: number;
  bundleSize?: number;
  interactionDelay: number;
  timeToInteractive: number;
  firstContentfulPaint?: number;
  largestContentfulPaint?: number;
}

export interface MigrationFeatures {
  healthScoring: boolean;
  realTimeUpdates: boolean;
  splitView: boolean;
  bentoLayout: boolean;
  accessibilityMode: boolean;
  jtbdAnalytics: boolean;
  virtualizedTable: boolean;
  memoizedHealthScores: boolean;
  debouncedSearch: boolean;
}

export interface MigrationStats {
  totalRenders: number;
  successfulRenders: number;
  failedRenders: number;
  fallbackUsage: number;
  averageRenderTime: number;
  averageMemoryUsage: number;
  errorRate: number;
  userSatisfaction?: number;
}

export interface MigrationDashboardData {
  variantStats: Record<string, MigrationStats>;
  overallProgress: {
    migratedVariants: number;
    totalVariants: number;
    percentage: number;
  };
  performanceComparison: {
    legacy: PerformanceMetric;
    compound: PerformanceMetric;
    improvement: number;
  };
  issues: Array<{
    variant: string;
    type: string;
    count: number;
    impact: 'low' | 'medium' | 'high';
  }>;
  recommendations: string[];
}

// =============================================================================
// Metrics Storage
// =============================================================================

class MetricsStorage {
  private storageKey = 'collection_migration_metrics';
  private metrics: MigrationMetric[] = [];
  private sessionId: string;

  constructor() {
    this.sessionId = this.generateSessionId();
    this.loadFromStorage();
  }

  /**
   * Adds a metric to storage
   */
  addMetric(metric: Omit<MigrationMetric, 'timestamp' | 'sessionId'>): void {
    const fullMetric: MigrationMetric = {
      ...metric,
      timestamp: Date.now(),
      sessionId: this.sessionId
    };

    this.metrics.push(fullMetric);
    this.saveToStorage();

    // Limit storage size (keep last 1000 metrics)
    if (this.metrics.length > 1000) {
      this.metrics = this.metrics.slice(-1000);
      this.saveToStorage();
    }
  }

  /**
   * Gets metrics by variant
   */
  getMetricsByVariant(variant: string): MigrationMetric[] {
    return this.metrics.filter(m => m.variant === variant);
  }

  /**
   * Gets metrics by type
   */
  getMetricsByType(type: MigrationMetric['type']): MigrationMetric[] {
    return this.metrics.filter(m => m.type === type);
  }

  /**
   * Gets all metrics
   */
  getAllMetrics(): MigrationMetric[] {
    return [...this.metrics];
  }

  /**
   * Clears metrics older than specified days
   */
  clearOldMetrics(daysToKeep: number = 7): void {
    const cutoffTime = Date.now() - (daysToKeep * 24 * 60 * 60 * 1000);
    this.metrics = this.metrics.filter(m => m.timestamp > cutoffTime);
    this.saveToStorage();
  }

  /**
   * Exports metrics as JSON
   */
  exportMetrics(): string {
    return JSON.stringify(this.metrics, null, 2);
  }

  /**
   * Imports metrics from JSON
   */
  importMetrics(jsonData: string): void {
    try {
      const importedMetrics = JSON.parse(jsonData);
      this.metrics = [...this.metrics, ...importedMetrics];
      this.saveToStorage();
    } catch (err) {
      console.error('Failed to import metrics:', err);
    }
  }

  private generateSessionId(): string {
    return `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  private saveToStorage(): void {
    try {
      localStorage.setItem(this.storageKey, JSON.stringify(this.metrics));
    } catch (err) {
      console.warn('Failed to save metrics to localStorage:', err);
    }
  }

  private loadFromStorage(): void {
    try {
      const stored = localStorage.getItem(this.storageKey);
      if (stored) {
        this.metrics = JSON.parse(stored);
      }
    } catch (err) {
      console.warn('Failed to load metrics from localStorage:', err);
      this.metrics = [];
    }
  }
}

// Global metrics storage instance
const metricsStorage = new MetricsStorage();

// =============================================================================
// Performance Monitoring
// =============================================================================

/**
 * Measures render performance
 */
function measureRenderPerformance(): PerformanceMetric {
  const navigation = performance.getEntriesByType('navigation')[0] as PerformanceNavigationTiming;
  const paint = performance.getEntriesByType('paint');
  
  return {
    renderTime: performance.now(),
    memoryUsage: (performance as any).memory?.usedJSHeapSize || 0,
    interactionDelay: 0, // To be measured on first interaction
    timeToInteractive: navigation?.loadEventEnd - navigation?.fetchStart || 0,
    firstContentfulPaint: paint.find(p => p.name === 'first-contentful-paint')?.startTime || 0,
    largestContentfulPaint: paint.find(p => p.name === 'largest-contentful-paint')?.startTime || 0
  };
}

/**
 * Measures interaction delay
 */
function measureInteractionDelay(startTime: number): number {
  return performance.now() - startTime;
}

// =============================================================================
// Main Tracking Functions
// =============================================================================

/**
 * Tracks component render metrics
 */
export function trackMigrationMetrics(
  id: string,
  data: {
    variant: string;
    useNewSystem: boolean;
    opportunitiesCount: number;
    selectedCount: number;
    features: Partial<MigrationFeatures>;
    performance?: Partial<PerformanceMetric>;
    [key: string]: any;
  }
): void {
  const performanceData = data.performance || measureRenderPerformance();

  metricsStorage.addMetric({
    id,
    variant: data.variant,
    type: 'render',
    data: {
      ...data,
      performance: performanceData,
      renderTimestamp: Date.now()
    }
  });
}

/**
 * Tracks user interaction metrics
 */
export function trackInteractionMetrics(
  id: string,
  variant: string,
  interaction: {
    type: string;
    target: string;
    duration?: number;
    success: boolean;
    data?: any;
  }
): void {
  metricsStorage.addMetric({
    id: `${id}_interaction`,
    variant,
    type: 'interaction',
    data: {
      ...interaction,
      timestamp: Date.now()
    }
  });
}

/**
 * Tracks migration errors
 */
export function trackMigrationError(
  id: string,
  variant: string,
  error: {
    type: string;
    message: string;
    stack?: string;
    context?: any;
  }
): void {
  metricsStorage.addMetric({
    id: `${id}_error`,
    variant,
    type: 'error',
    data: {
      ...error,
      timestamp: Date.now(),
      userAgent: navigator.userAgent
    }
  });
}

/**
 * Tracks performance metrics
 */
export function trackPerformanceMetrics(
  id: string,
  variant: string,
  metrics: PerformanceMetric
): void {
  metricsStorage.addMetric({
    id: `${id}_performance`,
    variant,
    type: 'performance',
    data: {
      ...metrics,
      timestamp: Date.now()
    }
  });
}

/**
 * Tracks fallback usage
 */
export function trackFallbackUsage(
  id: string,
  variant: string,
  reason: string,
  context?: any
): void {
  metricsStorage.addMetric({
    id: `${id}_fallback`,
    variant,
    type: 'fallback',
    data: {
      reason,
      context,
      timestamp: Date.now()
    }
  });
}

// =============================================================================
// Analytics Functions
// =============================================================================

/**
 * Calculates migration stats for a variant
 */
export function calculateVariantStats(variant: string): MigrationStats {
  const metrics = metricsStorage.getMetricsByVariant(variant);
  const renderMetrics = metrics.filter(m => m.type === 'render');
  const errorMetrics = metrics.filter(m => m.type === 'error');
  const fallbackMetrics = metrics.filter(m => m.type === 'fallback');

  const totalRenders = renderMetrics.length;
  const failedRenders = errorMetrics.length;
  const successfulRenders = totalRenders - failedRenders;
  const fallbackUsage = fallbackMetrics.length;

  const renderTimes = renderMetrics
    .map(m => m.data.performance?.renderTime)
    .filter(t => typeof t === 'number');
  
  const memoryUsages = renderMetrics
    .map(m => m.data.performance?.memoryUsage)
    .filter(m => typeof m === 'number');

  return {
    totalRenders,
    successfulRenders,
    failedRenders,
    fallbackUsage,
    averageRenderTime: renderTimes.length > 0 ? 
      renderTimes.reduce((a, b) => a + b, 0) / renderTimes.length : 0,
    averageMemoryUsage: memoryUsages.length > 0 ?
      memoryUsages.reduce((a, b) => a + b, 0) / memoryUsages.length : 0,
    errorRate: totalRenders > 0 ? failedRenders / totalRenders : 0
  };
}

/**
 * Generates migration dashboard data
 */
export function generateMigrationDashboard(): MigrationDashboardData {
  const allMetrics = metricsStorage.getAllMetrics();
  const variants = [...new Set(allMetrics.map(m => m.variant))];
  
  const variantStats: Record<string, MigrationStats> = {};
  variants.forEach(variant => {
    variantStats[variant] = calculateVariantStats(variant);
  });

  // Calculate overall progress
  const totalVariants = 24; // Known from migration map
  const migratedVariants = variants.length;
  const progressPercentage = (migratedVariants / totalVariants) * 100;

  // Calculate performance comparison
  const legacyMetrics = allMetrics.filter(m => m.data.useNewSystem === false);
  const compoundMetrics = allMetrics.filter(m => m.data.useNewSystem === true);
  
  const avgLegacyRender = calculateAverageRenderTime(legacyMetrics);
  const avgCompoundRender = calculateAverageRenderTime(compoundMetrics);
  const improvement = avgLegacyRender > 0 ? 
    ((avgLegacyRender - avgCompoundRender) / avgLegacyRender) * 100 : 0;

  // Identify issues
  const issues = variants
    .map(variant => {
      const stats = variantStats[variant];
      const issues = [];
      
      if (stats.errorRate > 0.05) {
        issues.push({
          variant,
          type: 'High error rate',
          count: stats.failedRenders,
          impact: 'high' as const
        });
      }
      
      if (stats.fallbackUsage > stats.totalRenders * 0.1) {
        issues.push({
          variant,
          type: 'High fallback usage',
          count: stats.fallbackUsage,
          impact: 'medium' as const
        });
      }
      
      return issues;
    })
    .flat();

  // Generate recommendations
  const recommendations = generateRecommendations(variantStats, issues);

  return {
    variantStats,
    overallProgress: {
      migratedVariants,
      totalVariants,
      percentage: progressPercentage
    },
    performanceComparison: {
      legacy: { renderTime: avgLegacyRender, memoryUsage: 0, interactionDelay: 0, timeToInteractive: 0 },
      compound: { renderTime: avgCompoundRender, memoryUsage: 0, interactionDelay: 0, timeToInteractive: 0 },
      improvement
    },
    issues,
    recommendations
  };
}

/**
 * Calculates average render time from metrics
 */
function calculateAverageRenderTime(metrics: MigrationMetric[]): number {
  const renderTimes = metrics
    .filter(m => m.type === 'render' && m.data.performance?.renderTime)
    .map(m => m.data.performance.renderTime);
  
  return renderTimes.length > 0 ?
    renderTimes.reduce((a, b) => a + b, 0) / renderTimes.length : 0;
}

/**
 * Generates recommendations based on metrics
 */
function generateRecommendations(
  stats: Record<string, MigrationStats>,
  issues: Array<{ variant: string; type: string; count: number; impact: string }>
): string[] {
  const recommendations: string[] = [];

  // High error rate recommendations
  const highErrorVariants = Object.entries(stats)
    .filter(([_, stat]) => stat.errorRate > 0.05)
    .map(([variant]) => variant);

  if (highErrorVariants.length > 0) {
    recommendations.push(
      `Address high error rates in variants: ${highErrorVariants.join(', ')}`
    );
  }

  // High fallback usage recommendations
  const highFallbackVariants = Object.entries(stats)
    .filter(([_, stat]) => stat.fallbackUsage > stat.totalRenders * 0.1)
    .map(([variant]) => variant);

  if (highFallbackVariants.length > 0) {
    recommendations.push(
      `Investigate fallback usage in variants: ${highFallbackVariants.join(', ')}`
    );
  }

  // Performance recommendations
  const slowVariants = Object.entries(stats)
    .filter(([_, stat]) => stat.averageRenderTime > 100)
    .map(([variant]) => variant);

  if (slowVariants.length > 0) {
    recommendations.push(
      `Optimize render performance for variants: ${slowVariants.join(', ')}`
    );
  }

  // General recommendations
  if (recommendations.length === 0) {
    recommendations.push('Migration is proceeding well. Continue monitoring.');
  }

  return recommendations;
}

// =============================================================================
// Export Functions
// =============================================================================

/**
 * Exports all migration data
 */
export function exportMigrationData(): {
  metrics: MigrationMetric[];
  dashboard: MigrationDashboardData;
  exportDate: string;
} {
  return {
    metrics: metricsStorage.getAllMetrics(),
    dashboard: generateMigrationDashboard(),
    exportDate: new Date().toISOString()
  };
}

/**
 * Clears all migration metrics
 */
export function clearMigrationMetrics(): void {
  metricsStorage.clearOldMetrics(0);
}

/**
 * Gets real-time migration status
 */
export function getMigrationStatus(): {
  isActive: boolean;
  activeVariants: string[];
  lastActivity: number;
} {
  const recentMetrics = metricsStorage.getAllMetrics()
    .filter(m => m.timestamp > Date.now() - 60000); // Last minute

  const activeVariants = [...new Set(recentMetrics.map(m => m.variant))];
  const lastActivity = Math.max(...recentMetrics.map(m => m.timestamp), 0);

  return {
    isActive: recentMetrics.length > 0,
    activeVariants,
    lastActivity
  };
}

// =============================================================================
// Export All
// =============================================================================

export {
  metricsStorage,
  measureRenderPerformance,
  measureInteractionDelay
};

export default trackMigrationMetrics;