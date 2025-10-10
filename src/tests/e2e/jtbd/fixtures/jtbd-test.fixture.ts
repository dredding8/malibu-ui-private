import { test as base, Page, Locator } from '@playwright/test';
import { AxeBuilder } from '@axe-core/playwright';

// JTBD Personas
export interface JTBDPersona {
  name: string;
  role: string;
  goals: string[];
  painPoints: string[];
  successCriteria: string[];
}

// JTBD Workflow
export interface JTBDWorkflow {
  id: string;
  name: string;
  steps: WorkflowStep[];
  expectedOutcome: string;
  metrics: WorkflowMetrics;
}

export interface WorkflowStep {
  action: string;
  element?: string;
  validation: string;
  timing?: number;
}

export interface WorkflowMetrics {
  maxDuration: number;
  maxClicks: number;
  errorTolerance: number;
  performanceTarget: PerformanceTarget;
}

export interface PerformanceTarget {
  lcp: number; // Largest Contentful Paint
  fid: number; // First Input Delay
  cls: number; // Cumulative Layout Shift
  ttfb: number; // Time to First Byte
}

// Performance metrics collector
class PerformanceCollector {
  private metrics: Map<string, any> = new Map();
  
  async collectWebVitals(page: Page): Promise<any> {
    const vitals = await page.evaluate(() => {
      return new Promise((resolve) => {
        const metrics: any = {};
        
        // Collect navigation timing
        if (window.performance && window.performance.timing) {
          const timing = window.performance.timing;
          metrics.ttfb = timing.responseStart - timing.navigationStart;
          metrics.domContentLoaded = timing.domContentLoadedEventEnd - timing.navigationStart;
          metrics.loadComplete = timing.loadEventEnd - timing.navigationStart;
        }
        
        // Collect resource timing
        if (window.performance && window.performance.getEntriesByType) {
          const resources = window.performance.getEntriesByType('resource');
          metrics.resourceCount = resources.length;
          metrics.totalResourceSize = resources.reduce((acc, r: any) => acc + (r.transferSize || 0), 0);
        }
        
        // Collect memory usage if available
        if ((window.performance as any).memory) {
          metrics.memory = {
            usedJSHeapSize: (window.performance as any).memory.usedJSHeapSize,
            totalJSHeapSize: (window.performance as any).memory.totalJSHeapSize,
          };
        }
        
        resolve(metrics);
      });
    });
    
    this.metrics.set('webVitals', vitals);
    return vitals;
  }
  
  async collectCoreWebVitals(page: Page): Promise<any> {
    // Inject web-vitals library
    await page.addScriptTag({
      content: `
        // Simplified Core Web Vitals collection
        window.coreWebVitals = {
          lcp: null,
          fid: null,
          cls: null,
          inp: null,
          ttfb: null
        };
        
        // Observe LCP
        new PerformanceObserver((list) => {
          const entries = list.getEntries();
          window.coreWebVitals.lcp = entries[entries.length - 1].startTime;
        }).observe({ entryTypes: ['largest-contentful-paint'] });
        
        // Observe CLS
        let clsValue = 0;
        new PerformanceObserver((list) => {
          for (const entry of list.getEntries()) {
            if (!entry.hadRecentInput) {
              clsValue += entry.value;
              window.coreWebVitals.cls = clsValue;
            }
          }
        }).observe({ entryTypes: ['layout-shift'] });
      `
    });
    
    // Wait for metrics to be collected
    await page.waitForTimeout(2000);
    
    const coreVitals = await page.evaluate(() => {
      return (window as any).coreWebVitals;
    });
    
    this.metrics.set('coreWebVitals', coreVitals);
    return coreVitals;
  }
  
  getMetrics(): Map<string, any> {
    return this.metrics;
  }
}

// JTBD Test Context
export interface JTBDTestContext {
  page: Page;
  persona: JTBDPersona;
  workflow: JTBDWorkflow;
  performanceCollector: PerformanceCollector;
  accessibilityScanner: AxeBuilder;
  startTime: number;
  actionCount: number;
  errorCount: number;
}

// Extend base test with JTBD fixtures
export const jtbdTest = base.extend<{
  jtbdContext: JTBDTestContext;
  setupPersona: (persona: JTBDPersona) => Promise<void>;
  executeWorkflow: (workflow: JTBDWorkflow) => Promise<boolean>;
  validateJTBD: (jobId: string) => Promise<boolean>;
  collectMetrics: () => Promise<any>;
}>({
  // JTBD context fixture
  jtbdContext: async ({ page }, use) => {
    const context: JTBDTestContext = {
      page,
      persona: null!,
      workflow: null!,
      performanceCollector: new PerformanceCollector(),
      accessibilityScanner: new AxeBuilder({ page }),
      startTime: Date.now(),
      actionCount: 0,
      errorCount: 0,
    };
    
    // Track errors
    page.on('pageerror', () => {
      context.errorCount++;
    });
    
    // Track console errors
    page.on('console', (msg) => {
      if (msg.type() === 'error') {
        context.errorCount++;
      }
    });
    
    await use(context);
  },
  
  // Setup persona fixture
  setupPersona: async ({ jtbdContext }, use) => {
    await use(async (persona: JTBDPersona) => {
      jtbdContext.persona = persona;
      
      // Set persona-specific viewport or preferences if needed
      if (persona.name === 'Mobile Analyst') {
        await jtbdContext.page.setViewportSize({ width: 375, height: 812 });
      }
      
      // Add persona identification for tracking
      await jtbdContext.page.evaluate((personaName) => {
        window.localStorage.setItem('test-persona', personaName);
      }, persona.name);
    });
  },
  
  // Execute workflow fixture
  executeWorkflow: async ({ jtbdContext }, use) => {
    await use(async (workflow: JTBDWorkflow) => {
      jtbdContext.workflow = workflow;
      const { page } = jtbdContext;
      
      try {
        for (const step of workflow.steps) {
          // Track action count
          jtbdContext.actionCount++;
          
          // Execute step action
          if (step.element) {
            const element = page.locator(step.element);
            
            switch (step.action) {
              case 'click':
                await element.click();
                break;
              case 'fill':
                await element.fill(step.validation);
                break;
              case 'select':
                await element.selectOption(step.validation);
                break;
              case 'hover':
                await element.hover();
                break;
              case 'navigate':
                await page.goto(step.element);
                break;
              default:
                await page.evaluate(() => {
                  console.log(`Executing custom action: ${step.action}`);
                });
            }
          }
          
          // Wait for timing if specified
          if (step.timing) {
            await page.waitForTimeout(step.timing);
          }
          
          // Validate step completion
          if (step.validation && step.action !== 'fill') {
            await page.waitForSelector(step.validation, { state: 'visible' });
          }
        }
        
        return true;
      } catch (error) {
        console.error(`Workflow ${workflow.id} failed:`, error);
        return false;
      }
    });
  },
  
  // Validate JTBD fixture
  validateJTBD: async ({ jtbdContext }, use) => {
    await use(async (jobId: string) => {
      const { page, workflow, persona, performanceCollector } = jtbdContext;
      
      // Collect performance metrics
      const webVitals = await performanceCollector.collectWebVitals(page);
      const coreVitals = await performanceCollector.collectCoreWebVitals(page);
      
      // Run accessibility scan
      const accessibilityResults = await jtbdContext.accessibilityScanner.analyze();
      
      // Calculate workflow duration
      const duration = Date.now() - jtbdContext.startTime;
      
      // Validate against success criteria
      const validations = {
        workflowCompleted: true,
        performanceMet: duration <= workflow.metrics.maxDuration,
        errorsFree: jtbdContext.errorCount <= workflow.metrics.errorTolerance,
        actionsEfficient: jtbdContext.actionCount <= workflow.metrics.maxClicks,
        accessibilityPassed: accessibilityResults.violations.length === 0,
        coreVitalsMet: coreVitals.lcp <= workflow.metrics.performanceTarget.lcp &&
                      coreVitals.cls <= workflow.metrics.performanceTarget.cls,
      };
      
      // Log validation results
      console.log(`JTBD Validation for ${jobId}:`, validations);
      
      return Object.values(validations).every(v => v === true);
    });
  },
  
  // Collect metrics fixture
  collectMetrics: async ({ jtbdContext }, use) => {
    await use(async () => {
      const { performanceCollector, accessibilityScanner, page } = jtbdContext;
      
      // Collect final metrics
      const finalMetrics = {
        duration: Date.now() - jtbdContext.startTime,
        actionCount: jtbdContext.actionCount,
        errorCount: jtbdContext.errorCount,
        performance: performanceCollector.getMetrics(),
        accessibility: await accessibilityScanner.analyze(),
        coverage: await page.evaluate(() => {
          // Get feature coverage if instrumented
          return (window as any).__coverage__ || null;
        }),
      };
      
      return finalMetrics;
    });
  },
});

// Re-export everything from Playwright test
export { expect, Page, Locator } from '@playwright/test';

// JTBD Personas definitions
export const JTBD_PERSONAS: Record<string, JTBDPersona> = {
  ANALYST: {
    name: 'Collection Analyst',
    role: 'Primary user managing satellite collections',
    goals: [
      'Verify collection plans match satellite capabilities',
      'Optimize collection schedules for maximum coverage',
      'Resolve conflicts and capacity issues quickly',
    ],
    painPoints: [
      'Data integrity issues not immediately visible',
      'Complex manual verification processes',
      'Lack of real-time conflict detection',
    ],
    successCriteria: [
      'Complete verification in under 2 minutes',
      'Zero data integrity issues missed',
      'All conflicts resolved within 5 minutes',
    ],
  },
  MANAGER: {
    name: 'Operations Manager',
    role: 'Oversees collection operations and approvals',
    goals: [
      'Monitor overall collection efficiency',
      'Approve high-priority overrides',
      'Track team performance metrics',
    ],
    painPoints: [
      'Lack of real-time visibility into operations',
      'Manual approval processes',
      'Limited performance analytics',
    ],
    successCriteria: [
      'Dashboard loads in under 3 seconds',
      'Approval workflow completes in under 30 seconds',
      'Performance metrics updated in real-time',
    ],
  },
  MOBILE_ANALYST: {
    name: 'Mobile Analyst',
    role: 'Field analyst using mobile devices',
    goals: [
      'Access collection data on mobile devices',
      'Quick verification of critical collections',
      'Respond to urgent requests remotely',
    ],
    painPoints: [
      'Desktop-optimized interfaces',
      'Slow loading on mobile networks',
      'Limited mobile functionality',
    ],
    successCriteria: [
      'Mobile interface fully responsive',
      'Load time under 5 seconds on 3G',
      'All critical features accessible on mobile',
    ],
  },
};