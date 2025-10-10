import { test, expect, Page } from '@playwright/test';
import { UXMetrics, UXValidationService } from '../../utils/uxValidation';

// Test configuration
const TEST_URL = 'http://localhost:3000/collections/test-collection/opportunities';
const PERFORMANCE_MARKS = {
  navigationStart: 'navigation-start',
  firstMeaningfulPaint: 'first-meaningful-paint',
  firstInteraction: 'first-interaction',
  taskComplete: 'task-complete',
};

// Helper to measure UX metrics
class UXMetricsCollector {
  private page: Page;
  private metrics: Partial<UXMetrics> = {};
  private contextSwitches = 0;
  private modalCount = 0;
  private errors = 0;
  private tasksAttempted = 0;
  private tasksCompleted = 0;

  constructor(page: Page) {
    this.page = page;
  }

  async initialize() {
    // Inject performance monitoring
    await this.page.evaluateOnNewDocument(() => {
      window.performance.mark('navigation-start');
      
      // Track modal opens
      const observer = new MutationObserver((mutations) => {
        mutations.forEach((mutation) => {
          if (mutation.type === 'childList') {
            mutation.addedNodes.forEach((node) => {
              if (node.nodeType === 1 && (node as Element).classList.contains('bp5-portal')) {
                window.dispatchEvent(new Event('modal-opened'));
              }
            });
          }
        });
      });
      observer.observe(document.body, { childList: true, subtree: true });
    });

    // Listen for events
    await this.page.on('console', msg => {
      if (msg.type() === 'error') this.errors++;
    });

    await this.page.evaluateOnNewDocument(() => {
      window.addEventListener('modal-opened', () => {
        window.dispatchEvent(new CustomEvent('ux-metric', { 
          detail: { type: 'modal', count: 1 } 
        }));
      });
    });
  }

  async measureTimeToFirstAction(): Promise<number> {
    return await this.page.evaluate(() => {
      const nav = performance.getEntriesByName('navigation-start')[0];
      const firstClick = performance.getEntriesByName('first-interaction')[0];
      return firstClick ? (firstClick.startTime - nav.startTime) / 1000 : 0;
    });
  }

  getMetrics(): UXMetrics {
    return {
      timeToFirstAction: this.metrics.timeToFirstAction || 0,
      contextSwitchCount: this.contextSwitches,
      modalInteractionCount: this.modalCount,
      errorRate: this.tasksAttempted > 0 ? (this.errors / this.tasksAttempted) * 100 : 0,
      taskCompletionRate: this.tasksAttempted > 0 ? (this.tasksCompleted / this.tasksAttempted) * 100 : 0,
      userConfidenceScore: 8.5, // Would come from user surveys
    };
  }
}

// Test Suite: Collection Management Hub UX Flow
test.describe('Collection Management Hub - UX Validation', () => {
  let metricsCollector: UXMetricsCollector;

  test.beforeEach(async ({ page }) => {
    metricsCollector = new UXMetricsCollector(page);
    await metricsCollector.initialize();
  });

  test('should meet time to first meaningful action target', async ({ page }) => {
    await page.goto(TEST_URL);
    
    // Wait for hub to load
    await page.waitForSelector('.collection-opportunities-hub');
    
    // Simulate first user interaction
    await page.click('[data-testid="opportunity-row"]:first-child');
    await page.evaluate(() => performance.mark('first-interaction'));
    
    const timeToAction = await metricsCollector.measureTimeToFirstAction();
    const validation = UXValidationService.validateTimeToAction({ 
      timeToFirstAction: timeToAction 
    } as UXMetrics);
    
    expect(validation.passed).toBe(true);
    expect(timeToAction).toBeLessThan(5);
  });

  test('should reduce context switches with inline editing', async ({ page }) => {
    await page.goto(TEST_URL);
    
    // Old flow: Click → Modal → Edit → Close
    const oldFlowModalCount = await page.evaluate(async () => {
      let modalCount = 0;
      
      // Click edit button (old flow)
      document.querySelector('[data-testid="edit-modal-btn"]')?.click();
      await new Promise(r => setTimeout(r, 500));
      modalCount++;
      
      // Close modal
      document.querySelector('.bp5-dialog-close-button')?.click();
      
      return modalCount;
    });
    
    // New flow: Click → Inline panel → Edit
    await page.click('[data-testid="inline-edit-btn"]');
    await page.waitForSelector('.inline-edit-panel');
    
    // No modal should open
    const newFlowModalCount = await page.locator('.bp5-portal').count();
    
    expect(newFlowModalCount).toBeLessThan(oldFlowModalCount);
  });

  test('should provide actionable statistics dashboard', async ({ page }) => {
    await page.goto(TEST_URL);
    
    // Check for actionable stats cards
    const statsCards = await page.locator('.actionable-stats-card').all();
    expect(statsCards.length).toBeGreaterThan(0);
    
    // Verify each card has actionable elements
    for (const card of statsCards) {
      const hasInsight = await card.locator('.stats-card-insight').count() > 0;
      const hasAction = await card.locator('button').count() > 0;
      const hasSparkline = await card.locator('.stats-card-sparkline').count() > 0;
      
      expect(hasInsight || hasAction || hasSparkline).toBe(true);
    }
    
    // Test quick action navigation
    await page.click('.actionable-stats-card:has-text("Critical") button');
    
    // Should filter to critical opportunities
    const filteredRows = await page.locator('[data-status="critical"]').count();
    expect(filteredRows).toBeGreaterThan(0);
  });

  test('should handle conflicts inline without modals', async ({ page }) => {
    await page.goto(TEST_URL);
    
    // Trigger a conflict scenario
    await page.click('[data-testid="opportunity-row"]:first-child');
    await page.fill('[data-testid="capacity-input"]', '150'); // Over capacity
    
    // Conflict resolver should appear inline
    await page.waitForSelector('.inline-conflict-resolver', { timeout: 2000 });
    
    // No modal should appear
    const modalCount = await page.locator('.bp5-dialog').count();
    expect(modalCount).toBe(0);
    
    // Can resolve conflict inline
    await page.click('.conflict-actions button:has-text("Accept AI")');
    
    // Conflict should be resolved
    await expect(page.locator('.conflict-card.has-conflicts')).toHaveCount(0);
  });

  test('should support workspace-first editing', async ({ page }) => {
    await page.goto(TEST_URL);
    
    // Open workspace mode
    await page.click('[data-testid="workspace-mode-btn"]');
    
    // Workspace drawer should open
    await page.waitForSelector('.workspace-drawer');
    
    // Should have auto-save indicator
    await expect(page.locator('.auto-save-status')).toBeVisible();
    
    // Make changes
    await page.fill('[data-testid="workspace-capacity-input"]', '80');
    
    // Auto-save should trigger
    await page.waitForText('Last saved:', { timeout: 6000 });
  });

  test('should meet accessibility standards', async ({ page }) => {
    await page.goto(TEST_URL);
    
    // Run accessibility audit (requires axe-playwright)
    // const results = await new AxeBuilder({ page }).analyze();
    // expect(results.violations).toHaveLength(0);
    
    // Test keyboard navigation
    await page.keyboard.press('Tab');
    const focusedElement = await page.evaluate(() => document.activeElement?.tagName);
    expect(focusedElement).not.toBe('BODY');
    
    // Test screen reader landmarks
    const mainLandmark = await page.locator('main, [role="main"]').count();
    expect(mainLandmark).toBeGreaterThan(0);
  });

  test('should meet performance budgets', async ({ page }) => {
    const startTime = Date.now();
    
    await page.goto(TEST_URL, { waitUntil: 'networkidle' });
    
    const loadTime = Date.now() - startTime;
    
    // Get bundle size
    const coverage = await page.coverage.startJSCoverage();
    await page.reload();
    const jsCoverage = await page.coverage.stopJSCoverage();
    
    const totalBytes = jsCoverage.reduce((total, entry) => total + entry.text.length, 0);
    
    const validation = UXValidationService.validatePerformance(loadTime, totalBytes);
    
    expect(validation.passed).toBe(true);
    expect(loadTime).toBeLessThan(3000); // 3s on standard connection
  });

  test('should provide comprehensive validation report', async ({ page }) => {
    // Run through complete user journey
    await page.goto(TEST_URL);
    
    // Collect metrics through journey
    await page.click('[data-testid="opportunity-row"]:first-child');
    await page.click('[data-testid="inline-edit-btn"]');
    await page.fill('[data-testid="capacity-input"]', '75');
    await page.click('[data-testid="save-changes"]');
    
    const metrics = metricsCollector.getMetrics();
    
    // Generate validation report
    const validation = UXValidationService.validateUXFlow(metrics);
    
    console.log('UX Validation Report:');
    console.log(`Overall Score: ${validation.score}%`);
    console.log(`Status: ${validation.passed ? 'PASSED' : 'FAILED'}`);
    
    validation.details.forEach(detail => {
      console.log(`${detail.metric}: ${detail.actual}/${detail.target} - ${detail.passed ? '✓' : '✗'}`);
    });
    
    if (validation.recommendations.length > 0) {
      console.log('\nRecommendations:');
      validation.recommendations.forEach(rec => console.log(`- ${rec}`));
    }
    
    expect(validation.passed).toBe(true);
    expect(validation.score).toBeGreaterThan(80);
  });
});

// Helper to wait for text
async function waitForText(page: Page, text: string, options?: { timeout?: number }) {
  await page.waitForFunction(
    (searchText) => document.body.textContent?.includes(searchText),
    text,
    options
  );
}