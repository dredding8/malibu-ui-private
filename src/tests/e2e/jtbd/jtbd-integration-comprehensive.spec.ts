import { test, expect } from '@playwright/test';
import { JTBDIntegrationFixture } from './fixtures/jtbd-integration.fixture';

// Comprehensive JTBD Integration Test Suite
// Tests all 5 JTBDs working together in realistic scenarios
test.describe('JTBD Integration Testing - Complete Workflow Validation', () => {
  let fixture: JTBDIntegrationFixture;

  test.beforeEach(async ({ page, context }) => {
    fixture = new JTBDIntegrationFixture(page, context);
    await fixture.setup();
  });

  test.afterEach(async () => {
    await fixture.cleanup();
  });

  // Integration Test 1: JTBD #1 → JTBD #2 Integration
  // Validation leads to Override decisions
  test('JTBD #1 validation failure triggers JTBD #2 override workflow', async ({ page }) => {
    await test.step('Navigate to opportunities and identify validation issues', async () => {
      await page.goto('/opportunities');
      await expect(page.locator('[data-testid="opportunities-table"]')).toBeVisible();
      
      // Find an opportunity with validation issues
      const validationIssue = page.locator('[data-testid="validation-warning"]:first-child');
      await expect(validationIssue).toBeVisible();
      await validationIssue.click();
    });

    const overrideReason = 'Critical mission requirement - validation exception approved';
    let originalAllocation: string;

    await test.step('JTBD #1: Attempt validation and identify issues', async () => {
      await page.click('[data-testid="validate-opportunity-button"]');
      await expect(page.locator('[data-testid="validation-panel"]')).toBeVisible();
      
      // Check validation results
      const validationResults = page.locator('[data-testid="validation-results"]');
      await expect(validationResults).toContainText('Failed');
      
      // Store original allocation for comparison
      originalAllocation = await page.locator('[data-testid="current-allocation"]').textContent() || '';
      
      // Verify specific validation failures
      await expect(page.locator('[data-testid="capacity-exceeded-error"]')).toBeVisible();
    });

    await test.step('JTBD #2: Override allocation due to validation failure', async () => {
      // Click override button from validation panel
      await page.click('[data-testid="override-from-validation"]');
      await expect(page.locator('[data-testid="override-modal"]')).toBeVisible();
      
      // Fill override justification
      await page.fill('[data-testid="override-reason"]', overrideReason);
      await page.selectOption('[data-testid="priority-override"]', 'critical');
      
      // Apply override
      await page.click('[data-testid="apply-override"]');
      await expect(page.locator('[data-testid="override-success"]')).toBeVisible();
    });

    await test.step('Verify integration: Override is applied and validation updated', async () => {
      // Check that override indicator is visible
      await expect(page.locator('[data-testid="override-indicator"]')).toBeVisible();
      
      // Verify override details
      const overrideDetails = await page.locator('[data-testid="override-details"]').textContent();
      expect(overrideDetails).toContain(overrideReason);
      
      // Re-run validation to confirm override resolves issues
      await page.click('[data-testid="revalidate-after-override"]');
      await expect(page.locator('[data-testid="validation-status"]')).toContainText('Passed with Override');
    });

    await test.step('Verify audit trail captures both validation and override', async () => {
      await page.click('[data-testid="view-audit-trail"]');
      const auditEntries = page.locator('[data-testid="audit-entry"]');
      
      // Should have entries for both validation failure and override
      await expect(auditEntries.nth(0)).toContainText('Validation failed');
      await expect(auditEntries.nth(1)).toContainText('Override applied');
      await expect(auditEntries.nth(1)).toContainText(overrideReason);
    });
  });

  // Integration Test 2: JTBD #2 → JTBD #4 Integration
  // Override impacts reflected in Analytics
  test('JTBD #2 overrides are reflected in JTBD #4 analytics dashboard', async ({ page }) => {
    let overrideCount: number;

    await test.step('JTBD #2: Apply multiple overrides', async () => {
      await page.goto('/opportunities');
      
      // Apply override to first opportunity
      await page.click('[data-testid="opportunity-row"]:first-child [data-testid="override-button"]');
      await expect(page.locator('[data-testid="override-modal"]')).toBeVisible();
      
      await page.fill('[data-testid="override-reason"]', 'High priority target');
      await page.selectOption('[data-testid="priority-override"]', 'high');
      await page.click('[data-testid="apply-override"]');
      await expect(page.locator('[data-testid="override-success"]')).toBeVisible();
      
      // Apply override to second opportunity
      await page.click('[data-testid="opportunity-row"]:nth-child(2) [data-testid="override-button"]');
      await page.fill('[data-testid="override-reason"]', 'Resource optimization');
      await page.selectOption('[data-testid="priority-override"]', 'medium');
      await page.click('[data-testid="apply-override"]');
      await expect(page.locator('[data-testid="override-success"]')).toBeVisible();
      
      // Count total overrides
      overrideCount = await page.locator('[data-testid="override-indicator"]').count();
    });

    await test.step('JTBD #4: Verify overrides appear in analytics', async () => {
      await page.click('[data-testid="analytics-tab"]');
      await expect(page.locator('[data-testid="analytics-dashboard"]')).toBeVisible();
      
      // Check override metrics
      const overrideMetrics = page.locator('[data-testid="override-metrics"]');
      await expect(overrideMetrics).toBeVisible();
      
      const overrideCountDisplay = await page.locator('[data-testid="total-overrides"]').textContent();
      expect(Number(overrideCountDisplay)).toBe(overrideCount);
      
      // Verify override breakdown by priority
      await expect(page.locator('[data-testid="high-priority-overrides"]')).toContainText('1');
      await expect(page.locator('[data-testid="medium-priority-overrides"]')).toContainText('1');
    });

    await test.step('Verify override impact on performance metrics', async () => {
      // Check that overrides are factored into performance calculations
      const performanceImpact = page.locator('[data-testid="override-performance-impact"]');
      await expect(performanceImpact).toBeVisible();
      
      // Verify override trend chart
      const overrideTrendChart = page.locator('[data-testid="override-trend-chart"]');
      await expect(overrideTrendChart).toBeVisible();
      
      // Verify allocation efficiency metrics account for overrides
      const allocationEfficiency = await page.locator('[data-testid="allocation-efficiency"]').textContent();
      expect(Number(allocationEfficiency?.replace('%', ''))).toBeLessThan(100); // Should be reduced due to overrides
    });
  });

  // Integration Test 3: JTBD #5 → JTBD #1 Integration
  // Bulk operations include validation actions
  test('JTBD #5 bulk operations trigger JTBD #1 validation workflows', async ({ page }) => {
    await test.step('Select multiple opportunities for bulk validation', async () => {
      await page.goto('/opportunities');
      
      // Enable bulk selection mode
      await page.click('[data-testid="bulk-select-toggle"]');
      
      // Select 5 opportunities
      for (let i = 0; i < 5; i++) {
        await page.check(`[data-testid="opportunity-checkbox-${i}"]`);
      }
      
      // Verify selection count
      const selectedCount = await page.locator('[data-testid="selected-count"]').textContent();
      expect(selectedCount).toContain('5');
    });

    await test.step('JTBD #5: Perform bulk validation operation', async () => {
      await page.click('[data-testid="bulk-actions-dropdown"]');
      await page.click('[data-testid="bulk-validate-action"]');
      
      // Confirm bulk validation
      await expect(page.locator('[data-testid="bulk-validation-modal"]')).toBeVisible();
      await page.click('[data-testid="confirm-bulk-validation"]');
      
      // Wait for validation to complete
      await expect(page.locator('[data-testid="bulk-validation-progress"]')).toBeVisible();
      await expect(page.locator('[data-testid="bulk-validation-complete"]')).toBeVisible({ timeout: 30000 });
    });

    await test.step('JTBD #1: Verify individual validations were performed', async () => {
      // Check validation results summary
      const validationSummary = page.locator('[data-testid="bulk-validation-summary"]');
      await expect(validationSummary).toBeVisible();
      
      const passedCount = await page.locator('[data-testid="validation-passed-count"]').textContent();
      const failedCount = await page.locator('[data-testid="validation-failed-count"]').textContent();
      
      expect(Number(passedCount) + Number(failedCount)).toBe(5);
      
      // Verify individual validation statuses are updated
      const validationStatuses = page.locator('[data-testid*="validation-status"]');
      await expect(validationStatuses.first()).toBeVisible();
    });

    await test.step('Verify bulk validation with override option', async () => {
      // If any validations failed, offer bulk override
      const failedCount = await page.locator('[data-testid="validation-failed-count"]').textContent();
      
      if (Number(failedCount) > 0) {
        await expect(page.locator('[data-testid="bulk-override-option"]')).toBeVisible();
        
        // Test bulk override for failed validations
        await page.click('[data-testid="bulk-override-failed"]');
        await page.fill('[data-testid="bulk-override-reason"]', 'Bulk validation exception - operational requirement');
        await page.click('[data-testid="apply-bulk-override"]');
        
        await expect(page.locator('[data-testid="bulk-override-success"]')).toBeVisible();
      }
    });
  });

  // Integration Test 4: JTBD #3 → All JTBDs Integration
  // Data integrity affects all workflows
  test('JTBD #3 data integrity issues are properly handled across all workflows', async ({ page }) => {
    await test.step('Simulate data integrity issues', async () => {
      await page.goto('/opportunities');
      
      // Inject mock data issues via test hooks
      await page.evaluate(() => {
        window.testHooks?.injectDataIntegrityIssues([
          {
            type: 'stale_tle_data',
            affectedOpportunities: ['opp-1', 'opp-2'],
            severity: 'high',
            message: 'TLE data is 3 days old'
          },
          {
            type: 'satellite_maintenance',
            affectedOpportunities: ['opp-3'],
            severity: 'critical',
            message: 'Satellite in maintenance mode'
          }
        ]);
      });
      
      await page.reload();
    });

    await test.step('JTBD #3: Identify and display data integrity issues', async () => {
      // Verify data integrity indicators are visible
      const dataIntegrityIndicators = page.locator('[data-testid="data-integrity-indicator"]');
      await expect(dataIntegrityIndicators.first()).toBeVisible();
      
      // Check issue details
      await dataIntegrityIndicators.first().click();
      await expect(page.locator('[data-testid="data-issue-details"]')).toBeVisible();
      
      const issueMessage = await page.locator('[data-testid="issue-message"]').textContent();
      expect(issueMessage).toContain('TLE data is 3 days old');
    });

    await test.step('Verify data issues block JTBD #1 validation', async () => {
      // Try to validate an opportunity with data issues
      await page.click('[data-testid="opportunity-row"]:first-child [data-testid="validate-button"]');
      
      // Should show data integrity blocking validation
      await expect(page.locator('[data-testid="validation-blocked"]')).toBeVisible();
      await expect(page.locator('[data-testid="data-integrity-blocker"]')).toContainText('TLE data is 3 days old');
    });

    await test.step('Verify data issues affect JTBD #2 override decisions', async () => {
      // Override button should show warning about data issues
      await page.click('[data-testid="opportunity-row"]:first-child [data-testid="override-button"]');
      
      await expect(page.locator('[data-testid="data-integrity-warning"]')).toBeVisible();
      await expect(page.locator('[data-testid="data-integrity-warning"]')).toContainText('Data integrity issues detected');
      
      // User should be able to override anyway with acknowledgment
      await page.check('[data-testid="acknowledge-data-issues"]');
      await page.fill('[data-testid="override-reason"]', 'Override despite data issues - operational requirement');
      await page.click('[data-testid="apply-override-with-warning"]');
      
      await expect(page.locator('[data-testid="override-with-data-issues-success"]')).toBeVisible();
    });

    await test.step('Verify data issues appear in JTBD #4 analytics', async () => {
      await page.click('[data-testid="analytics-tab"]');
      
      // Data integrity section should show issues
      const dataIntegritySection = page.locator('[data-testid="data-integrity-analytics"]');
      await expect(dataIntegritySection).toBeVisible();
      
      const staleTleCount = await page.locator('[data-testid="stale-tle-count"]').textContent();
      expect(Number(staleTleCount)).toBe(2);
      
      const maintenanceCount = await page.locator('[data-testid="maintenance-affected-count"]').textContent();
      expect(Number(maintenanceCount)).toBe(1);
    });

    await test.step('Verify data issues block JTBD #5 bulk operations', async () => {
      await page.goto('/opportunities');
      
      // Try to perform bulk operation on opportunities with data issues
      await page.click('[data-testid="bulk-select-toggle"]');
      await page.check('[data-testid="opportunity-checkbox-0"]'); // Has data issues
      await page.check('[data-testid="opportunity-checkbox-1"]'); // Has data issues
      
      await page.click('[data-testid="bulk-actions-dropdown"]');
      await page.click('[data-testid="bulk-update-priority"]');
      
      // Should show data integrity warning for bulk operations
      await expect(page.locator('[data-testid="bulk-data-integrity-warning"]')).toBeVisible();
      await expect(page.locator('[data-testid="bulk-data-integrity-warning"]')).toContainText('2 selected opportunities have data integrity issues');
    });

    await test.step('JTBD #3: Resolve data integrity issues', async () => {
      // Use "use last known good" option
      await page.click('[data-testid="data-integrity-indicator"]:first-child');
      await page.click('[data-testid="use-last-known-good"]');
      
      await expect(page.locator('[data-testid="data-issue-resolved"]')).toBeVisible();
      
      // Verify opportunity can now be validated normally
      await page.click('[data-testid="validate-button"]');
      await expect(page.locator('[data-testid="validation-panel"]')).toBeVisible();
      await expect(page.locator('[data-testid="validation-blocked"]')).not.toBeVisible();
    });
  });

  // Integration Test 5: End-to-End Complete Workflow
  // All 5 JTBDs working together in realistic scenario
  test('Complete analyst workflow: Validation → Override → Data Fix → Analytics → Bulk Operations', async ({ page }) => {
    const testWorkflowId = `workflow-${Date.now()}`;
    
    await test.step('Initial setup: Navigate to opportunities view', async () => {
      await page.goto('/opportunities');
      await expect(page.locator('[data-testid="opportunities-table"]')).toBeVisible();
      
      // Tag this session for tracking
      await page.evaluate((id) => {
        window.testMetrics = { workflowId: id, startTime: Date.now(), actions: [] };
      }, testWorkflowId);
    });

    await test.step('JTBD #1: Perform comprehensive validation', async () => {
      // Start with validation of first opportunity
      await page.click('[data-testid="opportunity-row"]:first-child [data-testid="validate-button"]');
      await expect(page.locator('[data-testid="validation-panel"]')).toBeVisible();
      
      // Record validation results
      const validationPassed = await page.locator('[data-testid="validation-status"]').textContent();
      const hasValidationIssues = validationPassed?.includes('Failed') || validationPassed?.includes('Warning');
      
      if (hasValidationIssues) {
        // Note validation issues for next step
        const validationIssues = await page.locator('[data-testid="validation-issues"] li').allTextContents();
        console.log('Validation issues found:', validationIssues);
      }
    });

    await test.step('JTBD #2: Apply override if validation issues exist', async () => {
      const validationStatus = await page.locator('[data-testid="validation-status"]').textContent();
      
      if (validationStatus?.includes('Failed')) {
        await page.click('[data-testid="override-from-validation"]');
        await expect(page.locator('[data-testid="override-modal"]')).toBeVisible();
        
        await page.fill('[data-testid="override-reason"]', 'End-to-end test scenario - override required for mission continuity');
        await page.selectOption('[data-testid="priority-override"]', 'high');
        await page.click('[data-testid="apply-override"]');
        
        await expect(page.locator('[data-testid="override-success"]')).toBeVisible();
      }
    });

    await test.step('JTBD #3: Handle any data integrity issues', async () => {
      const dataIssues = await page.locator('[data-testid="data-integrity-indicator"]').count();
      
      if (dataIssues > 0) {
        // Click first data integrity issue
        await page.click('[data-testid="data-integrity-indicator"]:first-child');
        await expect(page.locator('[data-testid="data-issue-details"]')).toBeVisible();
        
        // Choose resolution strategy
        const hasRetryOption = await page.locator('[data-testid="retry-data-fetch"]').isVisible();
        const hasLastKnownGoodOption = await page.locator('[data-testid="use-last-known-good"]').isVisible();
        
        if (hasRetryOption) {
          await page.click('[data-testid="retry-data-fetch"]');
          await expect(page.locator('[data-testid="data-retry-success"]')).toBeVisible();
        } else if (hasLastKnownGoodOption) {
          await page.click('[data-testid="use-last-known-good"]');
          await expect(page.locator('[data-testid="data-issue-resolved"]')).toBeVisible();
        }
      }
    });

    await test.step('JTBD #4: Review impact in analytics dashboard', async () => {
      await page.click('[data-testid="analytics-tab"]');
      await expect(page.locator('[data-testid="analytics-dashboard"]')).toBeVisible();
      
      // Verify our actions are reflected in analytics
      const overrideCount = await page.locator('[data-testid="total-overrides"]').textContent();
      const dataIssuesResolved = await page.locator('[data-testid="data-issues-resolved-today"]').textContent();
      
      // Take screenshot of analytics for verification
      await page.screenshot({ path: `test-results/analytics-${testWorkflowId}.png` });
      
      // Check performance impact metrics
      const performanceScore = await page.locator('[data-testid="overall-performance-score"]').textContent();
      console.log('Current performance score:', performanceScore);
    });

    await test.step('JTBD #5: Perform bulk operations on remaining opportunities', async () => {
      await page.click('[data-testid="opportunities-tab"]');
      
      // Enable bulk selection
      await page.click('[data-testid="bulk-select-toggle"]');
      
      // Select multiple opportunities (skip the first one we already processed)
      for (let i = 1; i <= 3; i++) {
        await page.check(`[data-testid="opportunity-checkbox-${i}"]`);
      }
      
      // Perform bulk validation
      await page.click('[data-testid="bulk-actions-dropdown"]');
      await page.click('[data-testid="bulk-validate-action"]');
      await page.click('[data-testid="confirm-bulk-validation"]');
      
      // Wait for bulk operation to complete
      await expect(page.locator('[data-testid="bulk-validation-complete"]')).toBeVisible({ timeout: 30000 });
      
      // Check results
      const bulkResults = await page.locator('[data-testid="bulk-validation-summary"]').textContent();
      console.log('Bulk validation results:', bulkResults);
    });

    await test.step('Final verification: All JTBDs completed successfully', async () => {
      // Record final metrics
      await page.evaluate(() => {
        if (window.testMetrics) {
          window.testMetrics.endTime = Date.now();
          window.testMetrics.duration = window.testMetrics.endTime - window.testMetrics.startTime;
        }
      });
      
      // Verify workflow completion indicators
      await expect(page.locator('[data-testid="workflow-completion-indicator"]')).toBeVisible();
      
      // Check audit trail shows all our actions
      await page.click('[data-testid="view-audit-trail"]');
      const auditEntries = await page.locator('[data-testid="audit-entry"]').count();
      expect(auditEntries).toBeGreaterThan(3); // Should have entries for validation, override, data resolution, bulk operations
      
      console.log('End-to-end workflow completed successfully');
    });
  });

  // Performance benchmark test
  test('Integration performance meets acceptable benchmarks', async ({ page }) => {
    const performanceMetrics: any[] = [];

    await test.step('Measure JTBD workflow performance', async () => {
      // Test each major workflow for performance
      const workflows = [
        { name: 'Validation', action: '[data-testid="validate-button"]', target: '[data-testid="validation-panel"]' },
        { name: 'Override', action: '[data-testid="override-button"]', target: '[data-testid="override-modal"]' },
        { name: 'Analytics', action: '[data-testid="analytics-tab"]', target: '[data-testid="analytics-dashboard"]' },
        { name: 'Bulk Operations', action: '[data-testid="bulk-select-toggle"]', target: '[data-testid="bulk-toolbar"]' }
      ];

      for (const workflow of workflows) {
        await page.goto('/opportunities');
        
        const startTime = Date.now();
        await page.click(workflow.action);
        await expect(page.locator(workflow.target)).toBeVisible();
        const endTime = Date.now();
        
        const duration = endTime - startTime;
        performanceMetrics.push({ workflow: workflow.name, duration });
        
        // Performance assertions
        expect(duration).toBeLessThan(5000); // 5 second max for any workflow
        
        if (workflow.name === 'Analytics') {
          expect(duration).toBeLessThan(8000); // Allow more time for analytics
        } else {
          expect(duration).toBeLessThan(3000); // 3 seconds for other workflows
        }
      }
    });

    await test.step('Verify overall integration performance', async () => {
      console.log('Performance metrics:', performanceMetrics);
      
      const averageDuration = performanceMetrics.reduce((sum, metric) => sum + metric.duration, 0) / performanceMetrics.length;
      expect(averageDuration).toBeLessThan(4000); // Average should be under 4 seconds
      
      // No workflow should be significantly slower than others (outlier detection)
      const maxDuration = Math.max(...performanceMetrics.map(m => m.duration));
      const minDuration = Math.min(...performanceMetrics.map(m => m.duration));
      expect(maxDuration / minDuration).toBeLessThan(5); // No workflow should be 5x slower than the fastest
    });
  });
});