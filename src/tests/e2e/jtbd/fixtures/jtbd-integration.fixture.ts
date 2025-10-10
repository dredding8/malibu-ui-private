import { Page, BrowserContext } from '@playwright/test';

export interface JTBDMetrics {
  workflowId: string;
  startTime: number;
  endTime?: number;
  duration?: number;
  actions: Array<{
    action: string;
    timestamp: number;
    duration: number;
    success: boolean;
  }>;
  errors: string[];
  performanceMarks: Map<string, number>;
}

export interface DataIntegrityIssue {
  type: 'stale_tle_data' | 'satellite_maintenance' | 'ground_station_offline' | 'orbit_prediction_stale';
  affectedOpportunities: string[];
  severity: 'low' | 'medium' | 'high' | 'critical';
  message: string;
  timestamp?: number;
  resolutionOptions?: Array<{
    action: string;
    label: string;
    testId: string;
  }>;
}

export class JTBDIntegrationFixture {
  private metrics: JTBDMetrics;
  private testId: string;

  constructor(
    private page: Page,
    private context: BrowserContext
  ) {
    this.testId = `integration-${Date.now()}`;
    this.metrics = {
      workflowId: this.testId,
      startTime: Date.now(),
      actions: [],
      errors: [],
      performanceMarks: new Map()
    };
  }

  async setup(): Promise<void> {
    // Setup test environment
    await this.setupTestHooks();
    await this.setupPerformanceMonitoring();
    await this.setupErrorTracking();
    await this.clearTestData();
  }

  async cleanup(): Promise<void> {
    // Save metrics
    await this.saveMetrics();
    
    // Clear test data
    await this.clearTestData();
    
    // Reset test hooks
    await this.page.evaluate(() => {
      if (window.testHooks) {
        window.testHooks.reset();
      }
    });
  }

  private async setupTestHooks(): Promise<void> {
    // Inject test hooks into the page
    await this.page.addInitScript(() => {
      window.testHooks = {
        dataIntegrityIssues: [],
        
        injectDataIntegrityIssues(issues: any[]) {
          this.dataIntegrityIssues = issues;
          
          // Dispatch custom event to notify components
          window.dispatchEvent(new CustomEvent('test:dataIntegrityIssues', {
            detail: { issues }
          }));
        },
        
        getDataIntegrityIssues() {
          return this.dataIntegrityIssues;
        },
        
        simulateNetworkDelay(ms: number) {
          window.testNetworkDelay = ms;
        },
        
        simulateError(type: string, message: string) {
          window.dispatchEvent(new CustomEvent('test:simulateError', {
            detail: { type, message }
          }));
        },
        
        reset() {
          this.dataIntegrityIssues = [];
          delete window.testNetworkDelay;
        }
      };
      
      // Override fetch to inject delays and errors for testing
      const originalFetch = window.fetch;
      window.fetch = async (...args) => {
        if (window.testNetworkDelay) {
          await new Promise(resolve => setTimeout(resolve, window.testNetworkDelay));
        }
        return originalFetch.apply(window, args);
      };
    });
  }

  private async setupPerformanceMonitoring(): Promise<void> {
    await this.page.addInitScript(() => {
      window.testMetrics = {
        workflowId: '',
        startTime: Date.now(),
        actions: [],
        performanceMarks: new Map()
      };
      
      // Monitor click events for timing
      document.addEventListener('click', (event) => {
        const target = event.target as HTMLElement;
        const testId = target.getAttribute('data-testid') || 
                      target.closest('[data-testid]')?.getAttribute('data-testid');
        
        if (testId && window.testMetrics) {
          window.testMetrics.actions.push({
            action: `click:${testId}`,
            timestamp: Date.now(),
            duration: 0,
            success: true
          });
        }
      });
      
      // Monitor navigation timing
      window.addEventListener('load', () => {
        if (window.testMetrics) {
          window.testMetrics.performanceMarks.set('load', Date.now());
        }
      });
    });
  }

  private async setupErrorTracking(): Promise<void> {
    // Listen for console errors
    this.page.on('console', msg => {
      if (msg.type() === 'error') {
        this.metrics.errors.push(msg.text());
      }
    });

    // Listen for page errors
    this.page.on('pageerror', error => {
      this.metrics.errors.push(error.message);
    });
  }

  private async clearTestData(): Promise<void> {
    // Clear localStorage
    await this.page.evaluate(() => {
      localStorage.clear();
    });

    // Clear sessionStorage
    await this.page.evaluate(() => {
      sessionStorage.clear();
    });

    // Clear cookies
    await this.context.clearCookies();
  }

  async recordAction(action: string): Promise<void> {
    const timestamp = Date.now();
    this.metrics.actions.push({
      action,
      timestamp,
      duration: 0,
      success: true
    });
  }

  async measureActionDuration<T>(action: string, operation: () => Promise<T>): Promise<T> {
    const startTime = Date.now();
    let success = true;
    let result: T;

    try {
      result = await operation();
    } catch (error) {
      success = false;
      this.metrics.errors.push(`${action}: ${error}`);
      throw error;
    } finally {
      const duration = Date.now() - startTime;
      this.metrics.actions.push({
        action,
        timestamp: startTime,
        duration,
        success
      });
    }

    return result;
  }

  async injectDataIntegrityIssues(issues: DataIntegrityIssue[]): Promise<void> {
    await this.page.evaluate((issuesData) => {
      if (window.testHooks) {
        window.testHooks.injectDataIntegrityIssues(issuesData);
      }
    }, issues);
  }

  async simulateNetworkDelay(ms: number): Promise<void> {
    await this.page.evaluate((delay) => {
      if (window.testHooks) {
        window.testHooks.simulateNetworkDelay(delay);
      }
    }, ms);
  }

  async simulateError(type: string, message: string): Promise<void> {
    await this.page.evaluate(({ errorType, errorMessage }) => {
      if (window.testHooks) {
        window.testHooks.simulateError(errorType, errorMessage);
      }
    }, { errorType: type, errorMessage: message });
  }

  async getPerformanceMetrics(): Promise<JTBDMetrics> {
    // Get final metrics from page
    const pageMetrics = await this.page.evaluate(() => {
      return window.testMetrics;
    });

    if (pageMetrics) {
      this.metrics.actions = [...this.metrics.actions, ...pageMetrics.actions];
      
      pageMetrics.performanceMarks.forEach((value: number, key: string) => {
        this.metrics.performanceMarks.set(key, value);
      });
    }

    this.metrics.endTime = Date.now();
    this.metrics.duration = this.metrics.endTime - this.metrics.startTime;

    return { ...this.metrics };
  }

  async waitForJTBDWorkflow(workflowName: string, timeout: number = 30000): Promise<boolean> {
    try {
      await this.page.waitForFunction(
        (name) => {
          const indicators = document.querySelectorAll('[data-testid*="workflow-completion"]');
          return Array.from(indicators).some(el => 
            el.textContent?.includes(name) || el.getAttribute('data-workflow') === name
          );
        },
        workflowName,
        { timeout }
      );
      return true;
    } catch {
      return false;
    }
  }

  async validateJTBDIntegration(jtbd1: string, jtbd2: string): Promise<boolean> {
    // Validate that two JTBDs are properly integrated
    // by checking that actions in JTBD1 properly affect JTBD2
    
    try {
      const integration = await this.page.evaluate(({ firstJTBD, secondJTBD }) => {
        // Check for integration indicators
        const integrationIndicators = document.querySelectorAll('[data-testid*="integration-indicator"]');
        return Array.from(integrationIndicators).some(el => {
          const integrationData = el.getAttribute('data-integration');
          return integrationData?.includes(firstJTBD) && integrationData?.includes(secondJTBD);
        });
      }, { firstJTBD: jtbd1, secondJTBD: jtbd2 });

      return integration;
    } catch {
      return false;
    }
  }

  async assertNoRegressions(): Promise<void> {
    // Ensure no existing functionality broke during integration
    const regressionChecks = [
      { testId: 'opportunities-table', description: 'Opportunities table loads' },
      { testId: 'navigation-menu', description: 'Navigation menu works' },
      { testId: 'search-functionality', description: 'Search functionality works' },
      { testId: 'filter-options', description: 'Filter options work' }
    ];

    for (const check of regressionChecks) {
      const element = this.page.locator(`[data-testid="${check.testId}"]`);
      const isVisible = await element.isVisible().catch(() => false);
      
      if (!isVisible) {
        throw new Error(`Regression detected: ${check.description} - element not visible`);
      }
    }
  }

  private async saveMetrics(): Promise<void> {
    const finalMetrics = await this.getPerformanceMetrics();
    
    // Save to file for analysis
    const fs = require('fs').promises;
    const path = require('path');
    
    const metricsDir = path.join(process.cwd(), 'test-results', 'integration-metrics');
    await fs.mkdir(metricsDir, { recursive: true }).catch(() => {});
    
    const metricsFile = path.join(metricsDir, `${this.testId}.json`);
    await fs.writeFile(metricsFile, JSON.stringify(finalMetrics, null, 2)).catch(console.error);
  }

  // Helper methods for common test patterns
  async selectOpportunity(index: number): Promise<void> {
    await this.measureActionDuration(`select-opportunity-${index}`, async () => {
      await this.page.click(`[data-testid="opportunity-row"]:nth-child(${index + 1})`);
    });
  }

  async performValidation(expectSuccess: boolean = true): Promise<boolean> {
    return await this.measureActionDuration('validation', async () => {
      await this.page.click('[data-testid="validate-button"]');
      
      // Wait for validation to complete
      await this.page.waitForSelector('[data-testid="validation-status"]', { timeout: 10000 });
      
      const status = await this.page.locator('[data-testid="validation-status"]').textContent();
      const success = status?.includes('Passed') || status?.includes('Success');
      
      if (expectSuccess && !success) {
        throw new Error(`Validation failed unexpectedly: ${status}`);
      }
      
      return success;
    });
  }

  async performOverride(reason: string, priority: string = 'medium'): Promise<void> {
    await this.measureActionDuration('override', async () => {
      await this.page.click('[data-testid="override-button"]');
      await this.page.waitForSelector('[data-testid="override-modal"]');
      
      await this.page.fill('[data-testid="override-reason"]', reason);
      await this.page.selectOption('[data-testid="priority-override"]', priority);
      await this.page.click('[data-testid="apply-override"]');
      
      await this.page.waitForSelector('[data-testid="override-success"]');
    });
  }

  async performBulkOperation(action: string, count: number): Promise<void> {
    await this.measureActionDuration(`bulk-${action}`, async () => {
      // Enable bulk selection
      await this.page.click('[data-testid="bulk-select-toggle"]');
      
      // Select specified number of opportunities
      for (let i = 0; i < count; i++) {
        await this.page.check(`[data-testid="opportunity-checkbox-${i}"]`);
      }
      
      // Perform bulk action
      await this.page.click('[data-testid="bulk-actions-dropdown"]');
      await this.page.click(`[data-testid="bulk-${action}-action"]`);
      
      // Wait for completion
      await this.page.waitForSelector(`[data-testid="bulk-${action}-complete"]`, { timeout: 30000 });
    });
  }
}

// Extend global window interface for TypeScript
declare global {
  interface Window {
    testHooks?: {
      dataIntegrityIssues: DataIntegrityIssue[];
      injectDataIntegrityIssues(issues: DataIntegrityIssue[]): void;
      getDataIntegrityIssues(): DataIntegrityIssue[];
      simulateNetworkDelay(ms: number): void;
      simulateError(type: string, message: string): void;
      reset(): void;
    };
    testMetrics?: JTBDMetrics;
    testNetworkDelay?: number;
  }
}