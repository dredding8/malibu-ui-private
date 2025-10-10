import { jtbdTest as test, expect, JTBD_PERSONAS, JTBDPersona } from './fixtures/jtbd-test.fixture';
import { JTBD_WORKFLOWS, WORKFLOW_CATEGORIES } from './fixtures/jtbd-workflows';
import fs from 'fs-extra';
import path from 'path';

// Test configuration
const RUN_PARALLEL = process.env.JTBD_PARALLEL !== 'false';
const CAPTURE_SCREENSHOTS = process.env.JTBD_SCREENSHOTS !== 'false';
const VALIDATE_ACCESSIBILITY = process.env.JTBD_A11Y !== 'false';

// Test suite for comprehensive JTBD validation
test.describe('JTBD Complete Validation Suite', () => {
  // Setup before all tests
  test.beforeAll(async () => {
    console.log('🎯 Starting comprehensive JTBD validation suite');
    console.log(`📊 Testing ${Object.keys(JTBD_WORKFLOWS).length} workflows`);
    console.log(`👥 Testing with ${Object.keys(JTBD_PERSONAS).length} personas`);
  });
  
  // Setup before each test
  test.beforeEach(async ({ page, jtbdContext, browserName }) => {
    // Clear any previous session data
    await page.context().clearCookies();
    
    // Set test identification headers
    await page.setExtraHTTPHeaders({
      'X-Test-Suite': 'JTBD-Validation',
      'X-Test-ID': test.info().testId,
    });
    
    // Initialize performance monitoring (only on Chromium-based browsers)
    if (browserName === 'chromium') {
      try {
        await page.coverage.startJSCoverage();
        await page.coverage.startCSSCoverage();
      } catch (error) {
        console.log('Coverage API not available on this browser');
      }
    }
  });
  
  // Cleanup after each test
  test.afterEach(async ({ page, jtbdContext, collectMetrics, browserName }, testInfo) => {
    // Collect final metrics
    const metrics = await collectMetrics();
    
    // Collect coverage data (only on Chromium-based browsers)
    let jsCoverage = [];
    let cssCoverage = [];
    if (browserName === 'chromium') {
      try {
        jsCoverage = await page.coverage.stopJSCoverage();
        cssCoverage = await page.coverage.stopCSSCoverage();
      } catch (error) {
        console.log('Coverage data not available');
      }
    }
    
    // Save test artifacts
    const testArtifactsDir = path.join('test-results', 'jtbd-artifacts', testInfo.testId);
    await fs.ensureDir(testArtifactsDir);
    
    // Save metrics
    await fs.writeJson(path.join(testArtifactsDir, 'metrics.json'), {
      testId: testInfo.testId,
      title: testInfo.title,
      duration: testInfo.duration,
      status: testInfo.status,
      metrics,
      coverage: {
        js: calculateCoveragePercentage(jsCoverage),
        css: calculateCoveragePercentage(cssCoverage),
      },
    }, { spaces: 2 });
    
    // Update global metrics file
    await updateGlobalMetrics(testInfo, metrics).catch(err => {
      console.error('Failed to update global metrics:', err.message);
    });
    
    // Capture final screenshot if test failed
    if (testInfo.status === 'failed' && CAPTURE_SCREENSHOTS) {
      await page.screenshot({
        path: path.join(testArtifactsDir, 'failure-screenshot.png'),
        fullPage: true,
      });
    }
  });
  
  // Test JTBD #1: Verify and Validate Collection Plans
  test.describe('JTBD #1: Verify and Validate Collection Plans', () => {
    test('Analyst can verify collection plans against satellite capabilities', async ({
      page,
      setupPersona,
      executeWorkflow,
      validateJTBD,
      jtbdContext,
    }) => {
      // Setup persona
      await setupPersona(JTBD_PERSONAS.ANALYST);
      
      // Execute workflow
      const success = await executeWorkflow(JTBD_WORKFLOWS.VERIFY_VALIDATE);
      expect(success).toBe(true);
      
      // Validate JTBD completion
      const validated = await validateJTBD('jtbd-1-verify-validate');
      expect(validated).toBe(true);
      
      // Additional validations
      await test.step('Verify all passes are validated', async () => {
        const passesValidated = await page.locator('[data-testid="pass-validation-status"]').textContent();
        expect(passesValidated).toContain('All passes validated');
      });
      
      await test.step('Verify capacity calculations are accurate', async () => {
        const capacityStatus = await page.locator('[data-testid="capacity-validation-status"]').textContent();
        expect(capacityStatus).toContain('Within limits');
      });
      
      if (VALIDATE_ACCESSIBILITY) {
        await test.step('Verify accessibility compliance', async () => {
          const accessibilityResults = await jtbdContext.accessibilityScanner
            .include('[data-testid="validation-panel"]')
            .analyze();
          expect(accessibilityResults.violations).toHaveLength(0);
        });
      }
    });
    
    test('Mobile analyst can verify plans on mobile device', async ({
      page,
      setupPersona,
      executeWorkflow,
      validateJTBD,
    }) => {
      // Setup mobile persona
      await setupPersona(JTBD_PERSONAS.MOBILE_ANALYST);
      
      // Execute mobile-optimized workflow
      const mobileWorkflow = {
        ...JTBD_WORKFLOWS.VERIFY_VALIDATE,
        metrics: {
          ...JTBD_WORKFLOWS.VERIFY_VALIDATE.metrics,
          maxDuration: 180000, // Allow more time for mobile
        },
      };
      
      const success = await executeWorkflow(mobileWorkflow);
      expect(success).toBe(true);
      
      // Validate mobile experience
      await test.step('Verify mobile responsiveness', async () => {
        const viewportSize = page.viewportSize();
        expect(viewportSize?.width).toBeLessThan(500);
        
        // Check that all interactive elements are accessible
        const buttons = await page.locator('[data-testid*="button"]').all();
        for (const button of buttons) {
          const isVisible = await button.isVisible();
          if (isVisible) {
            const box = await button.boundingBox();
            expect(box?.width).toBeGreaterThan(44); // Touch target size
            expect(box?.height).toBeGreaterThan(44);
          }
        }
      });
    });
  });
  
  // Test JTBD #2: Override and Customize Allocations
  test.describe('JTBD #2: Override and Customize Allocations', () => {
    test('Analyst can override suboptimal allocations', async ({
      page,
      setupPersona,
      executeWorkflow,
      validateJTBD,
      jtbdContext,
    }) => {
      await setupPersona(JTBD_PERSONAS.ANALYST);
      
      const success = await executeWorkflow(JTBD_WORKFLOWS.OVERRIDE_CUSTOMIZE);
      expect(success).toBe(true);
      
      const validated = await validateJTBD('jtbd-2-override-customize');
      expect(validated).toBe(true);
      
      // Verify override was applied
      await test.step('Verify override is reflected in the UI', async () => {
        const overrideIndicator = await page.locator('[data-testid="override-indicator"]').isVisible();
        expect(overrideIndicator).toBe(true);
        
        const overrideDetails = await page.locator('[data-testid="override-details"]').textContent();
        expect(overrideDetails).toContain('Manual override applied');
      });
      
      // Verify audit trail
      await test.step('Verify audit trail captures override', async () => {
        await page.click('[data-testid="view-audit-trail"]');
        const auditEntry = await page.locator('[data-testid="audit-entry"]:first-child').textContent();
        expect(auditEntry).toContain('Override applied');
        expect(auditEntry).toContain('Critical mission requirement');
      });
    });
    
    test('Manager can approve high-priority overrides', async ({
      page,
      setupPersona,
      executeWorkflow,
      validateJTBD,
    }) => {
      await setupPersona(JTBD_PERSONAS.MANAGER);
      
      // Modified workflow for manager approval
      const approvalWorkflow = {
        ...JTBD_WORKFLOWS.OVERRIDE_CUSTOMIZE,
        steps: [
          ...JTBD_WORKFLOWS.OVERRIDE_CUSTOMIZE.steps.slice(0, -1),
          {
            action: 'click',
            element: '[data-testid="request-approval-button"]',
            validation: '[data-testid="approval-requested"]',
            timing: 1000,
          },
          {
            action: 'click',
            element: '[data-testid="approve-override-button"]',
            validation: '[data-testid="override-approved"]',
            timing: 2000,
          },
        ],
      };
      
      const success = await executeWorkflow(approvalWorkflow);
      expect(success).toBe(true);
      
      // Verify approval workflow
      await test.step('Verify approval notification sent', async () => {
        const notification = await page.locator('[data-testid="approval-notification"]').textContent();
        expect(notification).toContain('Override approved by Manager');
      });
    });
  });
  
  // Test JTBD #3: Fix Data Integrity Issues
  test.describe('JTBD #3: Fix Data Integrity Issues', () => {
    test('Analyst can identify and resolve data integrity issues', async ({
      page,
      setupPersona,
      executeWorkflow,
      validateJTBD,
      collectMetrics,
    }) => {
      await setupPersona(JTBD_PERSONAS.ANALYST);
      
      // First, verify issues exist
      await test.step('Verify data integrity issues are visible', async () => {
        await page.goto('/opportunities');
        const issueIndicator = await page.locator('[data-testid="data-integrity-indicator"]');
        await expect(issueIndicator).toBeVisible();
        
        const issueCount = await issueIndicator.getAttribute('data-issue-count');
        expect(Number(issueCount)).toBeGreaterThan(0);
      });
      
      const success = await executeWorkflow(JTBD_WORKFLOWS.FIX_DATA_INTEGRITY);
      expect(success).toBe(true);
      
      const validated = await validateJTBD('jtbd-3-fix-data-integrity');
      expect(validated).toBe(true);
      
      // Verify issue is resolved
      await test.step('Verify issue is marked as resolved', async () => {
        const resolvedIndicator = await page.locator('[data-testid="issue-resolved-indicator"]');
        await expect(resolvedIndicator).toBeVisible();
        
        const remainingIssues = await page.locator('[data-testid="critical-issues-count"]').textContent();
        expect(remainingIssues).toContain('0');
      });
      
      // Collect performance metrics for data operations
      const metrics = await collectMetrics();
      expect(metrics.performance.get('webVitals').ttfb).toBeLessThan(1500);
    });
    
    test('System prevents invalid data from being saved', async ({
      page,
      setupPersona,
    }) => {
      await setupPersona(JTBD_PERSONAS.ANALYST);
      
      await page.goto('/opportunities');
      
      // Try to save invalid data
      await test.step('Attempt to save invalid TLE data', async () => {
        await page.click('[data-testid="edit-opportunity-button"]:first-child');
        await page.fill('[data-testid="tle-input"]', 'INVALID_TLE_DATA');
        await page.click('[data-testid="save-button"]');
        
        // Verify validation error
        const errorMessage = await page.locator('[data-testid="validation-error"]');
        await expect(errorMessage).toBeVisible();
        await expect(errorMessage).toContainText('Invalid TLE format');
      });
      
      // Verify data wasn't saved
      await test.step('Verify invalid data was not persisted', async () => {
        await page.reload();
        const tleData = await page.locator('[data-testid="tle-display"]:first-child').textContent();
        expect(tleData).not.toContain('INVALID_TLE_DATA');
      });
    });
  });
  
  // Test JTBD #4: Analyze Performance Trends
  test.describe('JTBD #4: Analyze Performance Trends', () => {
    test('Manager can analyze collection performance trends', async ({
      page,
      setupPersona,
      executeWorkflow,
      validateJTBD,
      jtbdContext,
    }) => {
      await setupPersona(JTBD_PERSONAS.MANAGER);
      
      const success = await executeWorkflow(JTBD_WORKFLOWS.ANALYZE_PERFORMANCE);
      expect(success).toBe(true);
      
      const validated = await validateJTBD('jtbd-4-analyze-performance');
      expect(validated).toBe(true);
      
      // Verify charts are interactive
      await test.step('Verify chart interactivity', async () => {
        const chart = page.locator('[data-testid="capacity-chart"]');
        await expect(chart).toBeVisible();
        
        // Hover over data point
        const canvas = await chart.locator('canvas');
        const box = await canvas.boundingBox();
        if (box) {
          await page.mouse.move(box.x + box.width / 2, box.y + box.height / 2);
          const tooltip = await page.locator('[data-testid="trend-tooltip"]');
          await expect(tooltip).toBeVisible();
        }
      });
      
      // Verify export functionality
      await test.step('Verify report can be exported', async () => {
        // Set up download promise before clicking
        const downloadPromise = page.waitForEvent('download');
        await page.click('[data-testid="export-pdf"]');
        
        const download = await downloadPromise;
        expect(download.suggestedFilename()).toContain('performance-report');
        
        // Verify download completed
        const path = await download.path();
        expect(path).toBeTruthy();
      });
    });
    
    test('Performance metrics load within acceptable time', async ({
      page,
      setupPersona,
      jtbdContext,
    }) => {
      await setupPersona(JTBD_PERSONAS.MANAGER);
      
      const startTime = Date.now();
      await page.goto('/opportunities');
      await page.click('[data-testid="analytics-button"]');
      await page.waitForSelector('[data-testid="analytics-dashboard"]');
      const loadTime = Date.now() - startTime;
      
      expect(loadTime).toBeLessThan(4000); // 4 second max
      
      // Verify all charts load
      const charts = await page.locator('[data-testid$="-chart"]').all();
      expect(charts.length).toBeGreaterThan(0);
      
      for (const chart of charts) {
        await expect(chart).toBeVisible();
      }
    });
  });
  
  // Test JTBD #5: Bulk Operations Management
  test.describe('JTBD #5: Bulk Operations Management', () => {
    test('Analyst can perform bulk updates on multiple opportunities', async ({
      page,
      setupPersona,
      executeWorkflow,
      validateJTBD,
    }) => {
      await setupPersona(JTBD_PERSONAS.ANALYST);
      
      // Ensure we have items to select
      await test.step('Verify multiple opportunities exist', async () => {
        await page.goto('/opportunities');
        const rows = await page.locator('[data-testid="opportunity-row"]').count();
        expect(rows).toBeGreaterThan(5);
      });
      
      const success = await executeWorkflow(JTBD_WORKFLOWS.BULK_OPERATIONS);
      expect(success).toBe(true);
      
      const validated = await validateJTBD('jtbd-5-bulk-operations');
      expect(validated).toBe(true);
      
      // Verify bulk update was applied
      await test.step('Verify all selected items were updated', async () => {
        const summary = await page.locator('[data-testid="bulk-update-summary"]').textContent();
        expect(summary).toMatch(/\d+ opportunities updated successfully/);
        
        // Check that priority was updated
        const criticalItems = await page.locator('[data-priority="critical"]').count();
        expect(criticalItems).toBeGreaterThan(0);
      });
      
      // Verify undo capability
      await test.step('Verify bulk operations can be undone', async () => {
        const undoButton = await page.locator('[data-testid="undo-bulk-operation"]');
        await expect(undoButton).toBeVisible();
        await expect(undoButton).toBeEnabled();
      });
    });
    
    test('Bulk operations maintain data integrity', async ({
      page,
      setupPersona,
    }) => {
      await setupPersona(JTBD_PERSONAS.ANALYST);
      
      await page.goto('/opportunities');
      
      // Select items with different statuses
      await page.click('[data-testid="bulk-select-checkbox"]');
      await page.click('[data-testid="select-optimal"]');
      await page.click('[data-testid="select-warning"]');
      await page.click('[data-testid="select-critical"]');
      
      // Attempt bulk update
      await page.click('[data-testid="bulk-actions-dropdown"]');
      await page.click('[data-testid="bulk-validate-action"]');
      
      // Verify appropriate warnings/confirmations
      await test.step('Verify warnings for mixed selections', async () => {
        const warning = await page.locator('[data-testid="mixed-selection-warning"]');
        await expect(warning).toBeVisible();
        await expect(warning).toContainText('different statuses selected');
      });
    });
  });
  
  // Cross-cutting concerns tests
  test.describe('Cross-Cutting JTBD Requirements', () => {
    test('All workflows maintain accessibility standards', async ({
      page,
      setupPersona,
      jtbdContext,
    }) => {
      if (!VALIDATE_ACCESSIBILITY) {
        test.skip();
      }
      
      await setupPersona(JTBD_PERSONAS.ANALYST);
      
      const pagesToTest = [
        '/opportunities',
        '/opportunities?view=validation',
        '/opportunities?view=analytics',
      ];
      
      for (const url of pagesToTest) {
        await test.step(`Test accessibility for ${url}`, async () => {
          await page.goto(url);
          await page.waitForLoadState('networkidle');
          
          const results = await jtbdContext.accessibilityScanner.analyze();
          
          // Log violations for debugging
          if (results.violations.length > 0) {
            console.log(`Accessibility violations on ${url}:`, results.violations);
          }
          
          expect(results.violations).toHaveLength(0);
        });
      }
    });
    
    test('All workflows perform within acceptable limits', async ({
      page,
      setupPersona,
      jtbdContext,
    }) => {
      await setupPersona(JTBD_PERSONAS.ANALYST);
      
      // Test navigation performance
      const navigationMetrics: any[] = [];
      
      for (const [name, workflow] of Object.entries(JTBD_WORKFLOWS)) {
        await test.step(`Measure performance for ${name}`, async () => {
          const startTime = Date.now();
          
          await page.goto('/opportunities');
          await page.waitForLoadState('domcontentloaded');
          
          const metrics = await jtbdContext.performanceCollector.collectWebVitals(page);
          navigationMetrics.push({
            workflow: name,
            ttfb: metrics.ttfb,
            domContentLoaded: metrics.domContentLoaded,
            loadComplete: metrics.loadComplete,
          });
          
          // Verify against targets
          expect(metrics.ttfb).toBeLessThan(workflow.metrics.performanceTarget.ttfb);
        });
      }
      
      // Log aggregate metrics
      console.log('Navigation Performance Metrics:', navigationMetrics);
    });
    
    test('Error recovery works across all workflows', async ({
      page,
      setupPersona,
    }) => {
      await setupPersona(JTBD_PERSONAS.ANALYST);
      
      // Simulate network failure
      await page.route('**/api/**', route => {
        route.abort('failed');
      });
      
      await page.goto('/opportunities');
      
      // Verify error handling
      await test.step('Verify graceful error handling', async () => {
        const errorMessage = await page.locator('[data-testid="error-message"]');
        await expect(errorMessage).toBeVisible();
        await expect(errorMessage).toContainText('Unable to load data');
        
        // Verify retry option is available
        const retryButton = await page.locator('[data-testid="retry-button"]');
        await expect(retryButton).toBeVisible();
        await expect(retryButton).toBeEnabled();
      });
      
      // Restore network and retry
      await page.unroute('**/api/**');
      await page.click('[data-testid="retry-button"]');
      
      // Verify recovery
      await expect(page.locator('[data-testid="opportunities-table"]')).toBeVisible();
    });
  });
});

// Helper functions
function calculateCoveragePercentage(coverage: any[]): number {
  let totalBytes = 0;
  let usedBytes = 0;
  
  for (const entry of coverage) {
    totalBytes += entry.text.length;
    for (const range of entry.ranges) {
      usedBytes += range.end - range.start;
    }
  }
  
  return totalBytes === 0 ? 0 : Math.round((usedBytes / totalBytes) * 100);
}

async function updateGlobalMetrics(testInfo: any, metrics: any) {
  const metricsFile = process.env.JTBD_METRICS_FILE;
  if (!metricsFile) return;
  
  try {
    const globalMetrics = await fs.readJson(metricsFile);
    
    const workflowId = testInfo.title.match(/jtbd-\d+-[\w-]+/)?.[0] || 'unknown';
    globalMetrics.workflows[workflowId] = {
      name: testInfo.title,
      passed: testInfo.status === 'passed',
      duration: testInfo.duration,
      errors: metrics.errorCount,
      actionCount: metrics.actionCount,
      performance: metrics.performance.get('coreWebVitals'),
      performanceScore: calculatePerformanceScore(metrics, JTBD_WORKFLOWS[workflowId]),
      targetMetrics: JTBD_WORKFLOWS[workflowId]?.metrics.performanceTarget,
      targetDuration: JTBD_WORKFLOWS[workflowId]?.metrics.maxDuration,
    };
    
    await fs.writeJson(metricsFile, globalMetrics, { spaces: 2 });
  } catch (error) {
    console.error('Failed to update global metrics:', error);
  }
}

function calculatePerformanceScore(metrics: any, workflow: any): number {
  if (!metrics.performance || !workflow) return 0;
  
  const coreVitals = metrics.performance.get('coreWebVitals');
  if (!coreVitals) return 0;
  
  let score = 100;
  const targets = workflow.metrics.performanceTarget;
  
  // Scoring based on Core Web Vitals
  if (coreVitals.lcp > targets.lcp) {
    score -= Math.min(20, (coreVitals.lcp - targets.lcp) / 100);
  }
  if (coreVitals.fid > targets.fid) {
    score -= Math.min(20, (coreVitals.fid - targets.fid) / 10);
  }
  if (coreVitals.cls > targets.cls) {
    score -= Math.min(20, (coreVitals.cls - targets.cls) * 100);
  }
  if (coreVitals.ttfb > targets.ttfb) {
    score -= Math.min(20, (coreVitals.ttfb - targets.ttfb) / 100);
  }
  if (metrics.duration > workflow.metrics.maxDuration) {
    score -= Math.min(20, (metrics.duration - workflow.metrics.maxDuration) / 1000);
  }
  
  return Math.max(0, Math.round(score));
}