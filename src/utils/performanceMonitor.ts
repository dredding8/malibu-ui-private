import React from 'react';

/**
 * Performance monitoring utility for enterprise UX compliance
 * Tracks navigation timing, component render times, and user interactions
 */

interface PerformanceMetric {
  name: string;
  value: number;
  unit: string;
  timestamp: number;
  context?: Record<string, any>;
}

interface NavigationTiming {
  start: number;
  end: number;
  duration: number;
  from: string;
  to: string;
  type: 'page' | 'modal' | 'tab';
}

class PerformanceMonitor {
  private metrics: PerformanceMetric[] = [];
  private navigationTimings: NavigationTiming[] = [];
  private observers: Map<string, PerformanceObserver> = new Map();
  
  constructor() {
    this.initializeObservers();
  }
  
  private initializeObservers() {
    // Navigation timing observer
    if ('PerformanceObserver' in window) {
      try {
        const navigationObserver = new PerformanceObserver((list) => {
          for (const entry of list.getEntries()) {
            if (entry.entryType === 'navigation') {
              this.recordMetric('page-load', entry.duration, 'ms', {
                type: 'navigation',
                name: entry.name
              });
            }
          }
        });
        
        navigationObserver.observe({ entryTypes: ['navigation'] });
        this.observers.set('navigation', navigationObserver);
      } catch (e) {
        console.warn('Navigation observer not supported');
      }
    }
  }
  
  /**
   * Record a performance metric
   */
  recordMetric(
    name: string, 
    value: number, 
    unit: string = 'ms', 
    context?: Record<string, any>
  ): void {
    const metric: PerformanceMetric = {
      name,
      value,
      unit,
      timestamp: Date.now(),
      context
    };
    
    this.metrics.push(metric);
    
    // Keep only last 100 metrics in memory
    if (this.metrics.length > 100) {
      this.metrics = this.metrics.slice(-100);
    }
    
    // Log to console in development
    if (process.env.NODE_ENV === 'development') {
      console.log(`[Performance] ${name}: ${value}${unit}`, context);
    }
    
    // Check thresholds
    this.checkThresholds(metric);
  }
  
  /**
   * Record navigation timing
   */
  recordNavigation(from: string, to: string, start: number, end: number): void {
    const timing: NavigationTiming = {
      start,
      end,
      duration: end - start,
      from,
      to,
      type: 'page'
    };
    
    this.navigationTimings.push(timing);
    
    // Record as metric
    this.recordMetric('navigation', timing.duration, 'ms', {
      from,
      to
    });
  }
  
  /**
   * Get average metric value
   */
  getAverageMetric(name: string): number | null {
    const relevantMetrics = this.metrics.filter(m => m.name === name);
    if (relevantMetrics.length === 0) return null;
    
    const sum = relevantMetrics.reduce((acc, m) => acc + m.value, 0);
    return sum / relevantMetrics.length;
  }
  
  /**
   * Check performance thresholds and log warnings
   */
  private checkThresholds(metric: PerformanceMetric): void {
    const thresholds: Record<string, number> = {
      'navigation': 1000, // 1 second
      'page-load': 3000, // 3 seconds
      'component-render': 100, // 100ms
      'api-call': 2000, // 2 seconds
      'search': 500 // 500ms
    };
    
    const threshold = thresholds[metric.name];
    if (threshold && metric.value > threshold) {
      console.warn(
        `[Performance Warning] ${metric.name} exceeded threshold: ${metric.value}${metric.unit} > ${threshold}ms`,
        metric.context
      );
    }
  }
  
  /**
   * Get performance report
   */
  getReport(): {
    metrics: Record<string, { avg: number; count: number; max: number; min: number }>;
    navigationAverage: number;
    warnings: string[];
  } {
    const metricsReport: Record<string, any> = {};
    
    // Group metrics by name
    const groupedMetrics = this.metrics.reduce((acc, metric) => {
      if (!acc[metric.name]) {
        acc[metric.name] = [];
      }
      acc[metric.name].push(metric.value);
      return acc;
    }, {} as Record<string, number[]>);
    
    // Calculate statistics
    Object.entries(groupedMetrics).forEach(([name, values]) => {
      metricsReport[name] = {
        avg: values.reduce((a, b) => a + b, 0) / values.length,
        count: values.length,
        max: Math.max(...values),
        min: Math.min(...values)
      };
    });
    
    // Calculate navigation average
    const navigationAverage = this.navigationTimings.length > 0
      ? this.navigationTimings.reduce((acc, t) => acc + t.duration, 0) / this.navigationTimings.length
      : 0;
    
    // Generate warnings
    const warnings: string[] = [];
    if (navigationAverage > 500) {
      warnings.push(`Navigation average (${navigationAverage.toFixed(0)}ms) exceeds 500ms target`);
    }
    
    return {
      metrics: metricsReport,
      navigationAverage,
      warnings
    };
  }
  
  /**
   * Clear all metrics
   */
  clear(): void {
    this.metrics = [];
    this.navigationTimings = [];
  }
  
  /**
   * Destroy observers
   */
  destroy(): void {
    this.observers.forEach(observer => observer.disconnect());
    this.observers.clear();
  }
}

// Singleton instance
export const performanceMonitor = new PerformanceMonitor();

/**
 * React hook for component performance tracking
 */
export function useComponentPerformance(componentName: string) {
  const startTime = React.useRef<number>(0);
  
  React.useEffect(() => {
    startTime.current = performance.now();
    
    return () => {
      const duration = performance.now() - startTime.current;
      performanceMonitor.recordMetric('component-render', duration, 'ms', {
        component: componentName
      });
    };
  }, [componentName]);
}

/**
 * React hook for tracking user interactions
 */
export function useInteractionTracking(interactionName: string) {
  const trackInteraction = React.useCallback((metadata?: Record<string, any>) => {
    performanceMonitor.recordMetric('user-interaction', 1, 'count', {
      interaction: interactionName,
      ...metadata
    });
  }, [interactionName]);
  
  return trackInteraction;
}

/**
 * Measure function execution time
 */
export function measurePerformance<T extends (...args: any[]) => any>(
  fn: T,
  name: string
): T {
  return ((...args: Parameters<T>) => {
    const start = performance.now();
    const result = fn(...args);
    const duration = performance.now() - start;
    
    performanceMonitor.recordMetric(name, duration, 'ms');
    
    return result;
  }) as T;
}