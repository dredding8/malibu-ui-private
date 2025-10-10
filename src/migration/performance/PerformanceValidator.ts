/**
 * Performance Validator
 * 
 * Validates performance improvements during migration with benchmarking,
 * comparison metrics, and automated performance regression detection.
 * 
 * Phase 3: Performance Validation
 * @version 1.0.0
 * @date 2025-09-30
 */

import { CollectionContextValue } from '../../components/Collection/CollectionProvider';
import { CollectionManagementState } from '../../types/collection.state';

// =============================================================================
// Performance Metrics Interfaces
// =============================================================================

interface PerformanceMetric {
  name: string;
  value: number;
  unit: string;
  timestamp: Date;
  source: 'context' | 'store' | 'hybrid';
  component?: string;
  operation?: string;
}

interface PerformanceBenchmark {
  id: string;
  name: string;
  description: string;
  target: number;
  threshold: number; // Acceptable range (+/- threshold)
  unit: string;
  category: 'render' | 'memory' | 'network' | 'interaction' | 'bundle';
}

interface PerformanceComparison {
  metric: string;
  context: {
    value: number;
    samples: number;
    stdDev: number;
  };
  store: {
    value: number;
    samples: number;
    stdDev: number;
  };
  improvement: {
    absolute: number;
    percentage: number;
    significant: boolean; // Statistical significance
  };
  verdict: 'better' | 'worse' | 'neutral' | 'inconclusive';
}

interface PerformanceReport {
  id: string;
  timestamp: Date;
  duration: number; // Test duration in ms
  environment: {
    userAgent: string;
    memory: number;
    cores: number;
    connection: string;
  };
  benchmarks: PerformanceBenchmark[];
  comparisons: PerformanceComparison[];
  summary: {
    totalTests: number;
    passing: number;
    failing: number;
    improved: number;
    regressed: number;
    overallScore: number; // 0-100
  };
  recommendations: string[];
}

// =============================================================================
// Performance Measurement Tools
// =============================================================================

class PerformanceMeasurement {
  private observers: Map<string, PerformanceObserver> = new Map();
  private metrics: Map<string, PerformanceMetric[]> = new Map();
  private isSupported: boolean;

  constructor() {
    this.isSupported = 'PerformanceObserver' in window && 'performance' in window;
    this.initializeObservers();
  }

  private initializeObservers() {
    if (!this.isSupported) return;

    // Measure rendering performance
    try {
      const renderObserver = new PerformanceObserver((list) => {
        list.getEntries().forEach((entry) => {
          if (entry.entryType === 'measure' && entry.name.includes('collection')) {
            this.addMetric({
              name: 'render-time',
              value: entry.duration,
              unit: 'ms',
              timestamp: new Date(),
              source: entry.name.includes('store') ? 'store' : 'context',
              operation: entry.name,
            });
          }
        });
      });
      
      renderObserver.observe({ entryTypes: ['measure'] });
      this.observers.set('render', renderObserver);
    } catch (error) {
      console.warn('[PerformanceMeasurement] Failed to initialize render observer:', error);
    }

    // Measure memory usage
    if ('memory' in performance) {
      setInterval(() => {
        const memory = (performance as any).memory;
        this.addMetric({
          name: 'memory-usage',
          value: memory.usedJSHeapSize / 1024 / 1024, // MB
          unit: 'MB',
          timestamp: new Date(),
          source: 'context', // Default, will be updated by specific measurements
        });
      }, 5000); // Every 5 seconds
    }

    // Measure long tasks
    try {
      const longTaskObserver = new PerformanceObserver((list) => {
        list.getEntries().forEach((entry) => {
          this.addMetric({
            name: 'long-task',
            value: entry.duration,
            unit: 'ms',
            timestamp: new Date(),
            source: 'context', // Will be attributed later
          });
        });
      });
      
      longTaskObserver.observe({ entryTypes: ['longtask'] });
      this.observers.set('longtask', longTaskObserver);
    } catch (error) {
      console.warn('[PerformanceMeasurement] Long task observation not supported');
    }
  }

  private addMetric(metric: PerformanceMetric) {
    const key = `${metric.name}-${metric.source}`;
    const existing = this.metrics.get(key) || [];
    existing.push(metric);
    
    // Keep only last 100 measurements per metric
    if (existing.length > 100) {
      existing.shift();
    }
    
    this.metrics.set(key, existing);
  }

  measureRender<T>(
    operation: () => T,
    source: 'context' | 'store' | 'hybrid',
    component?: string
  ): T {
    const measureName = `collection-render-${source}-${Date.now()}`;
    
    if (this.isSupported) {
      performance.mark(`${measureName}-start`);
    }
    
    const startTime = performance.now();
    const result = operation();
    const endTime = performance.now();
    
    if (this.isSupported) {
      performance.mark(`${measureName}-end`);
      performance.measure(measureName, `${measureName}-start`, `${measureName}-end`);
    }
    
    this.addMetric({
      name: 'render-time',
      value: endTime - startTime,
      unit: 'ms',
      timestamp: new Date(),
      source,
      component,
      operation: measureName,
    });
    
    return result;
  }

  async measureAsync<T>(
    operation: () => Promise<T>,
    source: 'context' | 'store' | 'hybrid',
    metricName: string = 'async-operation'
  ): Promise<T> {
    const startTime = performance.now();
    const result = await operation();
    const endTime = performance.now();
    
    this.addMetric({
      name: metricName,
      value: endTime - startTime,
      unit: 'ms',
      timestamp: new Date(),
      source,
    });
    
    return result;
  }

  measureMemory(source: 'context' | 'store' | 'hybrid', component?: string) {
    if ('memory' in performance) {
      const memory = (performance as any).memory;
      this.addMetric({
        name: 'memory-usage',
        value: memory.usedJSHeapSize / 1024 / 1024,
        unit: 'MB',
        timestamp: new Date(),
        source,
        component,
      });
    }
  }

  getMetrics(name?: string, source?: 'context' | 'store' | 'hybrid'): PerformanceMetric[] {
    const allMetrics: PerformanceMetric[] = [];
    
    for (const [key, metrics] of this.metrics.entries()) {
      if (!name || key.includes(name)) {
        if (!source || key.includes(source)) {
          allMetrics.push(...metrics);
        }
      }
    }
    
    return allMetrics.sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime());
  }

  calculateStatistics(metrics: PerformanceMetric[]) {
    if (metrics.length === 0) {
      return { average: 0, median: 0, min: 0, max: 0, stdDev: 0, samples: 0 };
    }
    
    const values = metrics.map(m => m.value);
    const average = values.reduce((sum, val) => sum + val, 0) / values.length;
    
    const sortedValues = [...values].sort((a, b) => a - b);
    const median = sortedValues.length % 2 === 0
      ? (sortedValues[sortedValues.length / 2 - 1] + sortedValues[sortedValues.length / 2]) / 2
      : sortedValues[Math.floor(sortedValues.length / 2)];
    
    const variance = values.reduce((sum, val) => sum + Math.pow(val - average, 2), 0) / values.length;
    const stdDev = Math.sqrt(variance);
    
    return {
      average,
      median,
      min: Math.min(...values),
      max: Math.max(...values),
      stdDev,
      samples: values.length,
    };
  }

  cleanup() {
    for (const observer of this.observers.values()) {
      observer.disconnect();
    }
    this.observers.clear();
    this.metrics.clear();
  }
}

// =============================================================================
// Performance Benchmarks
// =============================================================================

const DEFAULT_BENCHMARKS: PerformanceBenchmark[] = [
  {
    id: 'render-time',
    name: 'Component Render Time',
    description: 'Time to render collection components',
    target: 16, // 60 FPS
    threshold: 8, // ±8ms
    unit: 'ms',
    category: 'render',
  },
  {
    id: 'memory-usage',
    name: 'Memory Usage',
    description: 'JavaScript heap memory usage',
    target: 50, // 50MB target
    threshold: 20, // ±20MB
    unit: 'MB',
    category: 'memory',
  },
  {
    id: 'state-access-time',
    name: 'State Access Time',
    description: 'Time to access state data',
    target: 1, // 1ms target
    threshold: 0.5, // ±0.5ms
    unit: 'ms',
    category: 'interaction',
  },
  {
    id: 'action-execution-time',
    name: 'Action Execution Time',
    description: 'Time to execute state actions',
    target: 5, // 5ms target
    threshold: 2, // ±2ms
    unit: 'ms',
    category: 'interaction',
  },
  {
    id: 'sync-time',
    name: 'State Sync Time',
    description: 'Time to synchronize between context and store',
    target: 10, // 10ms target
    threshold: 5, // ±5ms
    unit: 'ms',
    category: 'interaction',
  },
];

// =============================================================================
// Performance Validator Class
// =============================================================================

export class PerformanceValidator {
  private measurement: PerformanceMeasurement;
  private benchmarks: PerformanceBenchmark[];
  private isRunning: boolean = false;

  constructor(customBenchmarks?: PerformanceBenchmark[]) {
    this.measurement = new PerformanceMeasurement();
    this.benchmarks = customBenchmarks || DEFAULT_BENCHMARKS;
  }

  /**
   * Run performance validation comparing context vs store
   */
  async runValidation(
    contextImplementation: () => Promise<any>,
    storeImplementation: () => Promise<any>,
    iterations: number = 10
  ): Promise<PerformanceReport> {
    if (this.isRunning) {
      throw new Error('Performance validation already running');
    }

    this.isRunning = true;
    const startTime = performance.now();
    const reportId = `perf-validation-${Date.now()}`;

    try {
      // Collect environment information
      const environment = this.getEnvironmentInfo();
      
      // Run context implementation
      console.log('[PerformanceValidator] Running context implementation...');
      const contextMetrics = await this.runImplementation(
        contextImplementation,
        'context',
        iterations
      );
      
      // Small delay to prevent interference
      await new Promise(resolve => setTimeout(resolve, 100));
      
      // Run store implementation
      console.log('[PerformanceValidator] Running store implementation...');
      const storeMetrics = await this.runImplementation(
        storeImplementation,
        'store',
        iterations
      );
      
      // Generate comparisons
      const comparisons = this.generateComparisons(contextMetrics, storeMetrics);
      
      // Validate against benchmarks
      const benchmarkResults = this.validateBenchmarks(storeMetrics);
      
      // Generate summary
      const summary = this.generateSummary(comparisons, benchmarkResults);
      
      const endTime = performance.now();
      
      const report: PerformanceReport = {
        id: reportId,
        timestamp: new Date(),
        duration: endTime - startTime,
        environment,
        benchmarks: this.benchmarks,
        comparisons,
        summary,
        recommendations: this.generateRecommendations(comparisons, benchmarkResults),
      };
      
      console.log('[PerformanceValidator] Validation complete:', report);
      return report;
      
    } finally {
      this.isRunning = false;
    }
  }

  private async runImplementation(
    implementation: () => Promise<any>,
    source: 'context' | 'store',
    iterations: number
  ): Promise<Map<string, PerformanceMetric[]>> {
    const metrics = new Map<string, PerformanceMetric[]>();
    
    for (let i = 0; i < iterations; i++) {
      // Measure memory before
      this.measurement.measureMemory(source, `iteration-${i}`);
      
      // Run implementation with render measurement
      await this.measurement.measureAsync(async () => {
        this.measurement.measureRender(() => {
          return implementation();
        }, source, `iteration-${i}`);
      }, source, 'total-execution-time');
      
      // Measure memory after
      this.measurement.measureMemory(source, `iteration-${i}-after`);
      
      // Small delay between iterations
      if (i < iterations - 1) {
        await new Promise(resolve => setTimeout(resolve, 50));
      }
    }
    
    // Collect all metrics for this source
    const allMetrics = this.measurement.getMetrics(undefined, source);
    
    // Group by metric name
    allMetrics.forEach(metric => {
      const key = metric.name;
      if (!metrics.has(key)) {
        metrics.set(key, []);
      }
      metrics.get(key)!.push(metric);
    });
    
    return metrics;
  }

  private generateComparisons(
    contextMetrics: Map<string, PerformanceMetric[]>,
    storeMetrics: Map<string, PerformanceMetric[]>
  ): PerformanceComparison[] {
    const comparisons: PerformanceComparison[] = [];
    
    // Get all metric names from both sources
    const allMetricNames = new Set([
      ...contextMetrics.keys(),
      ...storeMetrics.keys(),
    ]);
    
    for (const metricName of allMetricNames) {
      const contextData = contextMetrics.get(metricName) || [];
      const storeData = storeMetrics.get(metricName) || [];
      
      if (contextData.length === 0 || storeData.length === 0) {
        continue; // Skip if missing data
      }
      
      const contextStats = this.measurement.calculateStatistics(contextData);
      const storeStats = this.measurement.calculateStatistics(storeData);
      
      const absolute = storeStats.average - contextStats.average;
      const percentage = contextStats.average !== 0 
        ? ((absolute / contextStats.average) * 100)
        : 0;
      
      // Statistical significance test (simplified t-test)
      const significant = this.isStatisticallySignificant(contextStats, storeStats);
      
      // Determine verdict
      let verdict: PerformanceComparison['verdict'] = 'neutral';
      if (significant) {
        if (metricName.includes('time') || metricName.includes('memory')) {
          // Lower is better for time and memory
          verdict = absolute < 0 ? 'better' : 'worse';
        } else {
          // Higher might be better for other metrics
          verdict = absolute > 0 ? 'better' : 'worse';
        }
      } else {
        verdict = 'inconclusive';
      }
      
      comparisons.push({
        metric: metricName,
        context: {
          value: contextStats.average,
          samples: contextStats.samples,
          stdDev: contextStats.stdDev,
        },
        store: {
          value: storeStats.average,
          samples: storeStats.samples,
          stdDev: storeStats.stdDev,
        },
        improvement: {
          absolute,
          percentage,
          significant,
        },
        verdict,
      });
    }
    
    return comparisons;
  }

  private isStatisticallySignificant(
    stats1: ReturnType<PerformanceMeasurement['calculateStatistics']>,
    stats2: ReturnType<PerformanceMeasurement['calculateStatistics']>
  ): boolean {
    // Simplified two-sample t-test
    if (stats1.samples < 3 || stats2.samples < 3) {
      return false; // Not enough samples
    }
    
    const pooledStdDev = Math.sqrt(
      ((stats1.samples - 1) * Math.pow(stats1.stdDev, 2) + 
       (stats2.samples - 1) * Math.pow(stats2.stdDev, 2)) /
      (stats1.samples + stats2.samples - 2)
    );
    
    const standardError = pooledStdDev * Math.sqrt(
      1 / stats1.samples + 1 / stats2.samples
    );
    
    if (standardError === 0) {
      return false; // Cannot determine significance
    }
    
    const tStatistic = Math.abs(stats1.average - stats2.average) / standardError;
    
    // Use a simplified critical value for 95% confidence (approximately 2.0)
    return tStatistic > 2.0;
  }

  private validateBenchmarks(
    metrics: Map<string, PerformanceMetric[]>
  ): Array<{ benchmark: PerformanceBenchmark; passed: boolean; value: number; }> {
    return this.benchmarks.map(benchmark => {
      const metricData = metrics.get(benchmark.id) || [];
      const stats = this.measurement.calculateStatistics(metricData);
      
      const passed = stats.samples > 0 && 
        Math.abs(stats.average - benchmark.target) <= benchmark.threshold;
      
      return {
        benchmark,
        passed,
        value: stats.average,
      };
    });
  }

  private generateSummary(
    comparisons: PerformanceComparison[],
    benchmarkResults: Array<{ benchmark: PerformanceBenchmark; passed: boolean; value: number; }>
  ) {
    const totalTests = comparisons.length + benchmarkResults.length;
    const passingBenchmarks = benchmarkResults.filter(r => r.passed).length;
    const improved = comparisons.filter(c => c.verdict === 'better').length;
    const regressed = comparisons.filter(c => c.verdict === 'worse').length;
    
    const overallScore = totalTests > 0 
      ? ((passingBenchmarks + improved) / totalTests) * 100
      : 0;
    
    return {
      totalTests,
      passing: passingBenchmarks,
      failing: benchmarkResults.length - passingBenchmarks,
      improved,
      regressed,
      overallScore: Math.round(overallScore),
    };
  }

  private generateRecommendations(
    comparisons: PerformanceComparison[],
    benchmarkResults: Array<{ benchmark: PerformanceBenchmark; passed: boolean; value: number; }>
  ): string[] {
    const recommendations: string[] = [];
    
    // Check for regressions
    const regressions = comparisons.filter(c => c.verdict === 'worse');
    if (regressions.length > 0) {
      recommendations.push(
        `Address ${regressions.length} performance regression(s): ${regressions.map(r => r.metric).join(', ')}`
      );
    }
    
    // Check for failed benchmarks
    const failed = benchmarkResults.filter(r => !r.passed);
    if (failed.length > 0) {
      recommendations.push(
        `Optimize ${failed.length} failing benchmark(s): ${failed.map(r => r.benchmark.name).join(', ')}`
      );
    }
    
    // Check for significant improvements
    const improvements = comparisons.filter(c => c.verdict === 'better');
    if (improvements.length > 0) {
      recommendations.push(
        `Leverage ${improvements.length} performance improvement(s) in production`
      );
    }
    
    // Memory-specific recommendations
    const memoryComparison = comparisons.find(c => c.metric.includes('memory'));
    if (memoryComparison && memoryComparison.verdict === 'worse') {
      recommendations.push('Consider memory optimization techniques');
    }
    
    // Render-specific recommendations
    const renderComparison = comparisons.find(c => c.metric.includes('render'));
    if (renderComparison && renderComparison.verdict === 'worse') {
      recommendations.push('Optimize component rendering performance');
    }
    
    if (recommendations.length === 0) {
      recommendations.push('Performance validation passed - ready for migration');
    }
    
    return recommendations;
  }

  private getEnvironmentInfo() {
    return {
      userAgent: navigator.userAgent,
      memory: 'memory' in performance ? (performance as any).memory?.jsHeapSizeLimit / 1024 / 1024 || 0 : 0,
      cores: navigator.hardwareConcurrency || 0,
      connection: 'connection' in navigator ? (navigator as any).connection?.effectiveType || 'unknown' : 'unknown',
    };
  }

  /**
   * Generate a performance test report
   */
  generateReport(report: PerformanceReport): string {
    let output = '# Performance Validation Report\n\n';
    output += `**Report ID:** ${report.id}\n`;
    output += `**Timestamp:** ${report.timestamp.toISOString()}\n`;
    output += `**Duration:** ${report.duration.toFixed(2)}ms\n`;
    output += `**Overall Score:** ${report.summary.overallScore}/100\n\n`;
    
    output += '## Environment\n';
    output += `- Browser: ${report.environment.userAgent}\n`;
    output += `- Memory: ${report.environment.memory.toFixed(0)}MB\n`;
    output += `- CPU Cores: ${report.environment.cores}\n`;
    output += `- Connection: ${report.environment.connection}\n\n`;
    
    output += '## Summary\n';
    output += `- Total Tests: ${report.summary.totalTests}\n`;
    output += `- Passing: ${report.summary.passing}\n`;
    output += `- Failing: ${report.summary.failing}\n`;
    output += `- Improved: ${report.summary.improved}\n`;
    output += `- Regressed: ${report.summary.regressed}\n\n`;
    
    output += '## Performance Comparisons\n';
    report.comparisons.forEach(comparison => {
      output += `### ${comparison.metric}\n`;
      output += `- Context: ${comparison.context.value.toFixed(2)} (±${comparison.context.stdDev.toFixed(2)})\n`;
      output += `- Store: ${comparison.store.value.toFixed(2)} (±${comparison.store.stdDev.toFixed(2)})\n`;
      output += `- Improvement: ${comparison.improvement.percentage.toFixed(1)}%\n`;
      output += `- Verdict: ${comparison.verdict}\n\n`;
    });
    
    output += '## Recommendations\n';
    report.recommendations.forEach(rec => {
      output += `- ${rec}\n`;
    });
    
    return output;
  }

  /**
   * Cleanup resources
   */
  cleanup() {
    this.measurement.cleanup();
  }
}

// =============================================================================
// Export Default Instance
// =============================================================================

export const performanceValidator = new PerformanceValidator();