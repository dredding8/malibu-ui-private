/**
 * Performance Monitoring Service
 * Implements Web Vitals and custom performance metrics tracking
 */

import React from 'react';
import { onCLS, onFCP, onLCP, onTTFB, onINP } from 'web-vitals';

export interface PerformanceMetric {
  name: string;
  value: number;
  rating: 'good' | 'needs-improvement' | 'poor';
  timestamp: number;
}

export interface NavigationTiming {
  duration: number;
  loadTime: number;
  domContentLoadedTime: number;
  resourcesLoadTime: number;
}

class PerformanceMonitoringService {
  private metrics: Map<string, PerformanceMetric> = new Map();
  private observers: Map<string, PerformanceObserver> = new Map();
  private navigationStart: number = 0;

  constructor() {
    this.initializeWebVitals();
    this.initializeCustomMetrics();
  }

  /**
   * Initialize Core Web Vitals monitoring
   */
  private initializeWebVitals() {
    try {
      // Cumulative Layout Shift
      onCLS((metric) => {
        this.recordMetric({
          name: 'CLS',
          value: metric.value,
          rating: this.getCLSRating(metric.value),
          timestamp: Date.now()
        });
      });

      // Interaction to Next Paint (replaces FID in web-vitals v5)
      onINP((metric) => {
        this.recordMetric({
          name: 'INP',
          value: metric.value,
          rating: this.getINPRating(metric.value),
          timestamp: Date.now()
        });
      });

      // First Contentful Paint
      onFCP((metric) => {
        this.recordMetric({
          name: 'FCP',
          value: metric.value,
          rating: this.getFCPRating(metric.value),
          timestamp: Date.now()
        });
      });

      // Largest Contentful Paint
      onLCP((metric) => {
        this.recordMetric({
          name: 'LCP',
          value: metric.value,
          rating: this.getLCPRating(metric.value),
          timestamp: Date.now()
        });
      });

      // Time to First Byte
      onTTFB((metric) => {
        this.recordMetric({
          name: 'TTFB',
          value: metric.value,
          rating: this.getTTFBRating(metric.value),
          timestamp: Date.now()
        });
      });
    } catch (error) {
      console.warn('Web Vitals initialization failed:', error);
    }
  }

  /**
   * Initialize custom performance metrics
   */
  private initializeCustomMetrics() {
    // Track long tasks
    if ('PerformanceObserver' in window) {
      try {
        const longTaskObserver = new PerformanceObserver((entryList) => {
          for (const entry of entryList.getEntries()) {
            if (entry.duration > 50) {
              this.recordMetric({
                name: 'LongTask',
                value: entry.duration,
                rating: entry.duration > 100 ? 'poor' : 'needs-improvement',
                timestamp: Date.now()
              });
            }
          }
        });
        
        longTaskObserver.observe({ entryTypes: ['longtask'] });
        this.observers.set('longtask', longTaskObserver);
      } catch (e) {
        console.warn('Long task observer not supported');
      }
    }

    // Track resource loading
    this.trackResourceLoading();
  }

  /**
   * Track resource loading performance
   */
  private trackResourceLoading() {
    if ('PerformanceObserver' in window) {
      try {
        const resourceObserver = new PerformanceObserver((entryList) => {
          for (const entry of entryList.getEntries()) {
            const resourceEntry = entry as PerformanceResourceTiming;
            if (resourceEntry.duration > 1000) {
              console.warn(`Slow resource: ${resourceEntry.name} took ${resourceEntry.duration}ms`);
            }
          }
        });
        
        resourceObserver.observe({ entryTypes: ['resource'] });
        this.observers.set('resource', resourceObserver);
      } catch (e) {
        console.warn('Resource observer not supported');
      }
    }
  }

  /**
   * Record a performance metric
   */
  private recordMetric(metric: PerformanceMetric) {
    this.metrics.set(metric.name, metric);
    
    // Log poor performance
    if (metric.rating === 'poor') {
      console.warn(`Poor performance detected: ${metric.name} = ${metric.value}`);
    }

    // Send to analytics (if configured)
    this.sendToAnalytics(metric);
  }

  /**
   * Send metrics to analytics service
   */
  private sendToAnalytics(metric: PerformanceMetric) {
    // This would send to your analytics service
    // For now, we'll just log it
    if (process.env.NODE_ENV === 'development') {
      console.debug('Performance metric:', metric);
    }
  }

  /**
   * Mark navigation start time
   */
  markNavigationStart() {
    this.navigationStart = performance.now();
  }

  /**
   * Mark navigation end and calculate timing
   */
  markNavigationEnd(): NavigationTiming {
    const navigationEnd = performance.now();
    const duration = navigationEnd - this.navigationStart;

    const navigation = performance.getEntriesByType('navigation')[0] as PerformanceNavigationTiming;
    
    const timing: NavigationTiming = {
      duration,
      loadTime: navigation?.loadEventEnd - navigation?.loadEventStart || 0,
      domContentLoadedTime: navigation?.domContentLoadedEventEnd - navigation?.domContentLoadedEventStart || 0,
      resourcesLoadTime: navigation?.loadEventStart - navigation?.domContentLoadedEventEnd || 0
    };

    this.recordMetric({
      name: 'NavigationDuration',
      value: duration,
      rating: this.getNavigationRating(duration),
      timestamp: Date.now()
    });

    return timing;
  }

  /**
   * Get current performance metrics
   */
  getMetrics(): PerformanceMetric[] {
    return Array.from(this.metrics.values());
  }

  /**
   * Get specific metric
   */
  getMetric(name: string): PerformanceMetric | undefined {
    return this.metrics.get(name);
  }

  /**
   * Clear all metrics
   */
  clearMetrics() {
    this.metrics.clear();
  }

  /**
   * Cleanup observers
   */
  cleanup() {
    this.observers.forEach(observer => observer.disconnect());
    this.observers.clear();
  }

  // Rating functions based on Web Vitals thresholds
  private getCLSRating(value: number): PerformanceMetric['rating'] {
    if (value <= 0.1) return 'good';
    if (value <= 0.25) return 'needs-improvement';
    return 'poor';
  }

  private getINPRating(value: number): PerformanceMetric['rating'] {
    if (value <= 200) return 'good';
    if (value <= 500) return 'needs-improvement';
    return 'poor';
  }

  private getFCPRating(value: number): PerformanceMetric['rating'] {
    if (value <= 1800) return 'good';
    if (value <= 3000) return 'needs-improvement';
    return 'poor';
  }

  private getLCPRating(value: number): PerformanceMetric['rating'] {
    if (value <= 2500) return 'good';
    if (value <= 4000) return 'needs-improvement';
    return 'poor';
  }

  private getTTFBRating(value: number): PerformanceMetric['rating'] {
    if (value <= 800) return 'good';
    if (value <= 1800) return 'needs-improvement';
    return 'poor';
  }

  private getNavigationRating(value: number): PerformanceMetric['rating'] {
    if (value <= 100) return 'good';
    if (value <= 300) return 'needs-improvement';
    return 'poor';
  }
}

// Export singleton instance
export const performanceMonitoringService = new PerformanceMonitoringService();

// Export hook for React components
export const usePerformanceMonitoring = () => {
  React.useEffect(() => {
    performanceMonitoringService.markNavigationStart();
    
    return () => {
      const timing = performanceMonitoringService.markNavigationEnd();
      if (timing.duration > 300) {
        console.warn(`Slow navigation detected: ${timing.duration}ms`);
      }
    };
  }, []);

  return {
    getMetrics: () => performanceMonitoringService.getMetrics(),
    getMetric: (name: string) => performanceMonitoringService.getMetric(name),
  };
};