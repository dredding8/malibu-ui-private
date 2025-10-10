import { Page, Browser, BrowserContext } from '@playwright/test';
import fs from 'fs-extra';
import path from 'path';

export interface JTBDMetrics {
  workflow: string;
  timestamp: string;
  duration: number;
  success: boolean;
  performance: PerformanceMetrics;
  accessibility: AccessibilityMetrics;
  userExperience: UserExperienceMetrics;
  errors: ErrorMetrics;
}

export interface PerformanceMetrics {
  pageLoad: number;
  firstContentfulPaint: number;
  largestContentfulPaint: number;
  timeToInteractive: number;
  totalBlockingTime: number;
  cumulativeLayoutShift: number;
  firstInputDelay?: number;
  memoryUsage?: number;
  cpuUsage?: number;
}

export interface AccessibilityMetrics {
  violations: number;
  warnings: number;
  passes: number;
  wcagLevel: 'A' | 'AA' | 'AAA';
  keyboardNavigable: boolean;
  screenReaderCompatible: boolean;
}

export interface UserExperienceMetrics {
  taskCompletionTime: number;
  numberOfClicks: number;
  numberOfErrors: number;
  backtrackingOccurred: boolean;
  searchUsed: boolean;
  helpAccessed: boolean;
}

export interface ErrorMetrics {
  jsErrors: number;
  networkErrors: number;
  consoleWarnings: number;
  failedRequests: string[];
  errorMessages: string[];
}

export class JTBDMetricsCollector {
  private page: Page;
  private startTime: number;
  private metrics: Partial<JTBDMetrics>;
  private errorLogs: string[] = [];
  private networkErrors: string[] = [];
  
  constructor(page: Page) {
    this.page = page;
    this.startTime = Date.now();
    this.metrics = {
      timestamp: new Date().toISOString(),
      errors: {
        jsErrors: 0,
        networkErrors: 0,
        consoleWarnings: 0,
        failedRequests: [],
        errorMessages: [],
      },
      userExperience: {
        taskCompletionTime: 0,
        numberOfClicks: 0,
        numberOfErrors: 0,
        backtrackingOccurred: false,
        searchUsed: false,
        helpAccessed: false,
      },
    };
    
    this.setupListeners();
  }
  
  private setupListeners() {
    // Track JavaScript errors
    this.page.on('pageerror', (error) => {
      this.metrics.errors!.jsErrors!++;
      this.errorLogs.push(error.message);
      this.metrics.errors!.errorMessages!.push(error.message);
    });
    
    // Track console warnings and errors
    this.page.on('console', (msg) => {
      if (msg.type() === 'error') {
        this.metrics.errors!.jsErrors!++;
        this.errorLogs.push(msg.text());
      } else if (msg.type() === 'warning') {
        this.metrics.errors!.consoleWarnings!++;
      }
    });
    
    // Track network errors
    this.page.on('requestfailed', (request) => {
      this.metrics.errors!.networkErrors!++;
      this.networkErrors.push(request.url());
      this.metrics.errors!.failedRequests!.push(request.url());
    });
    
    // Track user interactions
    this.page.on('click', () => {
      this.metrics.userExperience!.numberOfClicks!++;
    });
  }
  
  async collectPerformanceMetrics(): Promise<PerformanceMetrics> {
    const perfMetrics = await this.page.evaluate(() => {
      const navigation = performance.getEntriesByType('navigation')[0] as PerformanceNavigationTiming;
      const paint = performance.getEntriesByType('paint');
      
      const fcp = paint.find(entry => entry.name === 'first-contentful-paint');
      const lcp = performance.getEntriesByType('largest-contentful-paint')[0];
      
      // Calculate Total Blocking Time
      let tbt = 0;
      const longTasks = performance.getEntriesByType('longtask');
      longTasks.forEach(task => {
        const blockingTime = task.duration - 50;
        if (blockingTime > 0) tbt += blockingTime;
      });
      
      // Get memory usage if available
      const memory = (performance as any).memory;
      
      return {
        pageLoad: navigation.loadEventEnd - navigation.fetchStart,
        firstContentfulPaint: fcp ? fcp.startTime : 0,
        largestContentfulPaint: lcp ? lcp.startTime : 0,
        timeToInteractive: navigation.domInteractive - navigation.fetchStart,
        totalBlockingTime: tbt,
        memoryUsage: memory ? memory.usedJSHeapSize : undefined,
      };
    });
    
    // Get CLS from page
    const cls = await this.page.evaluate(() => {
      return new Promise<number>((resolve) => {
        let clsValue = 0;
        const observer = new PerformanceObserver((list) => {
          for (const entry of list.getEntries()) {
            if (!(entry as any).hadRecentInput) {
              clsValue += (entry as any).value;
            }
          }
        });
        observer.observe({ entryTypes: ['layout-shift'] });
        
        // Collect for 5 seconds then resolve
        setTimeout(() => {
          observer.disconnect();
          resolve(clsValue);
        }, 5000);
      });
    });
    
    return {
      ...perfMetrics,
      cumulativeLayoutShift: cls,
    };
  }
  
  async collectAccessibilityMetrics(axeResults: any): Promise<AccessibilityMetrics> {
    const keyboardNav = await this.testKeyboardNavigation();
    const screenReader = await this.testScreenReaderCompatibility();
    
    return {
      violations: axeResults.violations.length,
      warnings: axeResults.incomplete.length,
      passes: axeResults.passes.length,
      wcagLevel: this.determineWCAGLevel(axeResults),
      keyboardNavigable: keyboardNav,
      screenReaderCompatible: screenReader,
    };
  }
  
  private determineWCAGLevel(axeResults: any): 'A' | 'AA' | 'AAA' {
    const violations = axeResults.violations;
    const hasAAA = violations.some((v: any) => v.tags.includes('wcag2aaa'));
    const hasAA = violations.some((v: any) => v.tags.includes('wcag2aa'));
    const hasA = violations.some((v: any) => v.tags.includes('wcag2a'));
    
    if (!hasA && !hasAA && !hasAAA) return 'AAA';
    if (!hasA && !hasAA) return 'AA';
    return 'A';
  }
  
  private async testKeyboardNavigation(): Promise<boolean> {
    try {
      // Test tab navigation through interactive elements
      const interactiveElements = await this.page.$$('[role="button"], button, a, input, select, textarea, [tabindex]');
      
      if (interactiveElements.length === 0) return true;
      
      // Tab through first few elements
      for (let i = 0; i < Math.min(5, interactiveElements.length); i++) {
        await this.page.keyboard.press('Tab');
        const focusedElement = await this.page.evaluate(() => document.activeElement?.tagName);
        if (!focusedElement) return false;
      }
      
      return true;
    } catch {
      return false;
    }
  }
  
  private async testScreenReaderCompatibility(): Promise<boolean> {
    try {
      // Check for ARIA labels and roles
      const ariaElements = await this.page.evaluate(() => {
        const elements = document.querySelectorAll('[aria-label], [aria-describedby], [role]');
        return elements.length;
      });
      
      const hasLandmarks = await this.page.evaluate(() => {
        const landmarks = document.querySelectorAll('[role="main"], [role="navigation"], [role="banner"]');
        return landmarks.length > 0;
      });
      
      return ariaElements > 0 && hasLandmarks;
    } catch {
      return false;
    }
  }
  
  updateUserExperience(updates: Partial<UserExperienceMetrics>) {
    this.metrics.userExperience = {
      ...this.metrics.userExperience,
      ...updates,
    };
  }
  
  async finalize(workflow: string, success: boolean): Promise<JTBDMetrics> {
    const duration = Date.now() - this.startTime;
    
    const performanceMetrics = await this.collectPerformanceMetrics();
    
    return {
      workflow,
      timestamp: this.metrics.timestamp!,
      duration,
      success,
      performance: performanceMetrics,
      accessibility: this.metrics.accessibility || {
        violations: 0,
        warnings: 0,
        passes: 0,
        wcagLevel: 'AA',
        keyboardNavigable: true,
        screenReaderCompatible: true,
      },
      userExperience: {
        ...this.metrics.userExperience!,
        taskCompletionTime: duration,
      },
      errors: this.metrics.errors!,
    };
  }
  
  async saveMetrics(outputDir: string, filename?: string) {
    const metrics = await this.finalize('unknown', true);
    const file = filename || `jtbd-metrics-${Date.now()}.json`;
    const filepath = path.join(outputDir, file);
    
    await fs.ensureDir(outputDir);
    await fs.writeJson(filepath, metrics, { spaces: 2 });
    
    return filepath;
  }
}

// Metrics aggregator for multiple test runs
export class JTBDMetricsAggregator {
  private metrics: JTBDMetrics[] = [];
  
  add(metric: JTBDMetrics) {
    this.metrics.push(metric);
  }
  
  getAverages(): any {
    if (this.metrics.length === 0) return null;
    
    const avgDuration = this.metrics.reduce((sum, m) => sum + m.duration, 0) / this.metrics.length;
    const successRate = this.metrics.filter(m => m.success).length / this.metrics.length;
    
    const avgPerformance = {
      pageLoad: this.average(this.metrics.map(m => m.performance.pageLoad)),
      firstContentfulPaint: this.average(this.metrics.map(m => m.performance.firstContentfulPaint)),
      largestContentfulPaint: this.average(this.metrics.map(m => m.performance.largestContentfulPaint)),
      timeToInteractive: this.average(this.metrics.map(m => m.performance.timeToInteractive)),
      totalBlockingTime: this.average(this.metrics.map(m => m.performance.totalBlockingTime)),
      cumulativeLayoutShift: this.average(this.metrics.map(m => m.performance.cumulativeLayoutShift)),
    };
    
    const totalErrors = this.metrics.reduce((sum, m) => sum + m.errors.jsErrors + m.errors.networkErrors, 0);
    
    return {
      totalRuns: this.metrics.length,
      successRate: (successRate * 100).toFixed(2) + '%',
      averageDuration: avgDuration,
      averagePerformance: avgPerformance,
      totalErrors,
      workflows: this.groupByWorkflow(),
    };
  }
  
  private average(values: number[]): number {
    return values.reduce((sum, v) => sum + v, 0) / values.length;
  }
  
  private groupByWorkflow(): any {
    const grouped: { [key: string]: JTBDMetrics[] } = {};
    
    this.metrics.forEach(m => {
      if (!grouped[m.workflow]) {
        grouped[m.workflow] = [];
      }
      grouped[m.workflow].push(m);
    });
    
    const result: any = {};
    Object.entries(grouped).forEach(([workflow, metrics]) => {
      result[workflow] = {
        runs: metrics.length,
        successRate: (metrics.filter(m => m.success).length / metrics.length * 100).toFixed(2) + '%',
        averageDuration: this.average(metrics.map(m => m.duration)),
      };
    });
    
    return result;
  }
  
  async saveReport(outputPath: string) {
    const report = {
      summary: this.getAverages(),
      details: this.metrics,
      generated: new Date().toISOString(),
    };
    
    await fs.writeJson(outputPath, report, { spaces: 2 });
  }
}