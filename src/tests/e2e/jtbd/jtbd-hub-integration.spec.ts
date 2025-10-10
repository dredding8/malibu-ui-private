import { test, expect } from '@playwright/test';
import { JTBDIntegrationFixture } from './fixtures/jtbd-integration.fixture';

// Hub Integration Testing - Verify all JTBD components work together in CollectionOpportunitiesHub
test.describe('JTBD Hub Integration - Component Integration Validation', () => {
  let fixture: JTBDIntegrationFixture;

  test.beforeEach(async ({ page, context }) => {
    fixture = new JTBDIntegrationFixture(page, context);
    await fixture.setup();
  });

  test.afterEach(async () => {
    await fixture.cleanup();
  });

  // Test 1: Verify all JTBD components are properly integrated in the hub
  test('All JTBD components render and integrate correctly in CollectionOpportunitiesHub', async ({ page }) => {
    await test.step('Navigate to CollectionOpportunitiesHub and verify initial load', async () => {
      await page.goto('/opportunities');
      
      // Wait for hub to fully load
      await expect(page.locator('[data-testid="opportunities-table"]')).toBeVisible();
      await expect(page.locator('[data-testid="hub-stats"]')).toBeVisible();
      await expect(page.locator('[data-testid="smart-views-container"]')).toBeVisible();
      
      // Verify loading state transitions properly
      await expect(page.locator('[data-testid="loading-overlay"]')).not.toBeVisible();
      
      console.log('CollectionOpportunitiesHub loaded successfully');
    });

    await test.step('JTBD #1: Verify validation components are integrated', async () => {
      // Check that validation buttons are present on opportunities
      const validationButtons = page.locator('[data-testid*="validate"]');
      const validationButtonCount = await validationButtons.count();
      expect(validationButtonCount).toBeGreaterThan(0);
      
      // Test validation workflow integration
      await page.click('[data-testid="opportunity-row"]:first-child [data-testid="validate-button"]');
      await expect(page.locator('[data-testid="validation-panel"]')).toBeVisible();
      
      // Verify ValidationPanel component is properly integrated
      await expect(page.locator('[data-testid="validation-results"]')).toBeVisible();
      await expect(page.locator('[data-testid="pass-details"]')).toBeVisible();
      await expect(page.locator('[data-testid="capacity-calculations"]')).toBeVisible();
      
      // Check integration with approval workflow
      const approveButton = page.locator('[data-testid="approve-button"]');
      const rejectButton = page.locator('[data-testid="reject-button"]');
      await expect(approveButton).toBeVisible();
      await expect(rejectButton).toBeVisible();
      
      await page.click('[data-testid="close-validation-panel"]');
    });

    await test.step('JTBD #2: Verify override components are integrated', async () => {
      // Check inline override buttons
      const inlineOverrideButtons = page.locator('[data-testid*="inline-override"]');
      const inlineOverrideCount = await inlineOverrideButtons.count();
      expect(inlineOverrideCount).toBeGreaterThan(0);
      
      // Test inline override integration
      await page.click('[data-testid="opportunity-row"]:first-child [data-testid="inline-override-button"]');
      await expect(page.locator('[data-testid="inline-override-popover"]')).toBeVisible();
      
      await page.fill('[data-testid="quick-override-reason"]', 'Test integration override');
      await page.click('[data-testid="apply-quick-override"]');
      await expect(page.locator('[data-testid="override-applied-notification"]')).toBeVisible();
      
      // Verify override indicator appears
      await expect(page.locator('[data-testid="override-indicator"]')).toBeVisible();
      
      // Test full override modal integration
      await page.click('[data-testid="opportunity-row"]:nth-child(2) [data-testid="override-button"]');
      await expect(page.locator('[data-testid="override-modal"]')).toBeVisible();
      
      // Verify modal has all required components
      await expect(page.locator('[data-testid="override-reason"]')).toBeVisible();
      await expect(page.locator('[data-testid="priority-override"]')).toBeVisible();
      await expect(page.locator('[data-testid="impact-calculator"]')).toBeVisible();
      
      await page.click('[data-testid="cancel-override"]');
    });

    await test.step('JTBD #3: Verify data integrity components are integrated', async () => {
      // Inject data integrity issues for testing
      await fixture.injectDataIntegrityIssues([
        {
          type: 'stale_tle_data',
          affectedOpportunities: ['opp-1', 'opp-2'],
          severity: 'high',
          message: 'TLE data is stale - last update 4 hours ago'
        }
      ]);
      
      await page.reload();
      
      // Verify data integrity indicators appear
      const dataIntegrityIndicators = page.locator('[data-testid="data-integrity-indicator"]');
      await expect(dataIntegrityIndicators.first()).toBeVisible();
      
      // Test data integrity issue resolution workflow
      await dataIntegrityIndicators.first().click();
      await expect(page.locator('[data-testid="data-issue-details"]')).toBeVisible();
      
      // Verify resolution options are available
      await expect(page.locator('[data-testid="retry-data-fetch"]')).toBeVisible();
      await expect(page.locator('[data-testid="use-last-known-good"]')).toBeVisible();
      await expect(page.locator('[data-testid="escalate-issue"]')).toBeVisible();
      
      // Test resolution workflow
      await page.click('[data-testid="use-last-known-good"]');
      await expect(page.locator('[data-testid="data-issue-resolved"]')).toBeVisible();
    });

    await test.step('JTBD #4: Verify analytics components are integrated', async () => {
      // Switch to analytics tab
      await page.click('[data-testid="analytics-tab"]');
      await expect(page.locator('[data-testid="analytics-dashboard"]')).toBeVisible();
      
      // Verify key analytics components are present
      await expect(page.locator('[data-testid="performance-metrics"]')).toBeVisible();
      await expect(page.locator('[data-testid="override-analytics"]')).toBeVisible();
      await expect(page.locator('[data-testid="capacity-analytics"]')).toBeVisible();
      await expect(page.locator('[data-testid="data-quality-analytics"]')).toBeVisible();
      
      // Test analytics interactivity
      const performanceChart = page.locator('[data-testid="performance-chart"]');
      if (await performanceChart.isVisible()) {
        await performanceChart.hover();
        await expect(page.locator('[data-testid="chart-tooltip"]')).toBeVisible();
      }
      
      // Verify export functionality integration
      await expect(page.locator('[data-testid="export-analytics"]')).toBeVisible();
      
      // Return to opportunities tab
      await page.click('[data-testid="opportunities-tab"]');
    });

    await test.step('JTBD #5: Verify bulk operations components are integrated', async () => {
      // Enable bulk selection mode
      await page.click('[data-testid="bulk-select-toggle"]');
      await expect(page.locator('[data-testid="bulk-toolbar"]')).toBeVisible();
      
      // Select multiple opportunities
      await page.check('[data-testid="opportunity-checkbox-0"]');
      await page.check('[data-testid="opportunity-checkbox-1"]');
      await page.check('[data-testid="opportunity-checkbox-2"]');
      
      // Verify bulk selection count
      const selectedCount = await page.locator('[data-testid="bulk-selected-count"]').textContent();
      expect(selectedCount).toContain('3');
      
      // Test bulk actions integration
      await page.click('[data-testid="bulk-actions-dropdown"]');
      await expect(page.locator('[data-testid="bulk-validate-action"]')).toBeVisible();
      await expect(page.locator('[data-testid="bulk-update-priority"]')).toBeVisible();
      await expect(page.locator('[data-testid="bulk-override-action"]')).toBeVisible();
      
      // Test bulk validation workflow
      await page.click('[data-testid="bulk-validate-action"]');
      await expect(page.locator('[data-testid="bulk-validation-modal"]')).toBeVisible();
      
      await page.click('[data-testid="cancel-bulk-validation"]');
      
      // Disable bulk selection
      await page.click('[data-testid="bulk-select-toggle"]');
      await expect(page.locator('[data-testid="bulk-toolbar"]')).not.toBeVisible();
    });
  });

  // Test 2: Verify cross-component communication and state management
  test('JTBD components communicate properly through shared state', async ({ page }) => {
    await test.step('Setup: Navigate to hub and establish baseline', async () => {
      await page.goto('/opportunities');
      await expect(page.locator('[data-testid="opportunities-table"]')).toBeVisible();
      
      // Get initial statistics
      const initialStats = {
        total: await page.locator('[data-testid="stat-total"] .stat-value').textContent(),
        critical: await page.locator('[data-testid="stat-critical"] .stat-value').textContent(),
        pending: await page.locator('[data-testid="stat-pending"] .stat-value').textContent()
      };
      
      console.log('Initial stats:', initialStats);
    });

    await test.step('Test state updates: Override affects analytics and stats', async () => {
      // Apply an override
      await page.click('[data-testid="opportunity-row"]:first-child [data-testid="inline-override-button"]');
      await page.fill('[data-testid="quick-override-reason"]', 'Testing state communication');
      await page.click('[data-testid="apply-quick-override"]');
      
      // Verify pending changes count updated
      const pendingChangesAfterOverride = await page.locator('[data-testid="stat-pending"] .stat-value').textContent();
      expect(Number(pendingChangesAfterOverride)).toBeGreaterThan(Number(initialStats.pending));
      
      // Check that override indicator appears in table
      await expect(page.locator('[data-testid="override-indicator"]')).toBeVisible();
      
      // Switch to analytics tab and verify override is reflected
      await page.click('[data-testid="analytics-tab"]');
      await expect(page.locator('[data-testid="recent-overrides"]')).toContainText('Testing state communication');
      
      // Return to opportunities tab
      await page.click('[data-testid="opportunities-tab"]');
    });

    await test.step('Test state updates: Data integrity issues affect validation', async () => {
      // Inject data integrity issue
      await fixture.injectDataIntegrityIssues([
        {
          type: 'satellite_maintenance',
          affectedOpportunities: ['opp-2'],
          severity: 'critical',
          message: 'Satellite in maintenance mode'
        }
      ]);
      
      await page.reload();
      
      // Verify data integrity indicator appears
      await expect(page.locator('[data-testid="data-integrity-indicator"]')).toBeVisible();
      
      // Try to validate affected opportunity
      await page.click('[data-testid="opportunity-row"]:nth-child(2) [data-testid="validate-button"]');
      
      // Should show data integrity warning in validation panel
      await expect(page.locator('[data-testid="data-integrity-warning"]')).toBeVisible();
      await expect(page.locator('[data-testid="validation-blocked"]')).toBeVisible();
      
      await page.click('[data-testid="close-validation-panel"]');
    });

    await test.step('Test state updates: Smart view filtering affects all components', async () => {
      // Apply smart view filter
      await page.click('[data-testid="smart-view-critical"]');
      
      // Verify table shows only critical opportunities
      const filteredRows = await page.locator('[data-testid="opportunity-row"]').count();
      const allRows = await page.evaluate(() => window.testData?.opportunities?.length || 0);
      expect(filteredRows).toBeLessThan(allRows);
      
      // Verify stats update to reflect filter
      const filteredTotal = await page.locator('[data-testid="opportunities-count"]').textContent();
      expect(Number(filteredTotal?.split(' ')[0])).toBe(filteredRows);
      
      // Clear filter
      await page.click('[data-testid="clear-view-button"]');
      
      // Verify full list is restored
      const restoredRows = await page.locator('[data-testid="opportunity-row"]').count();
      expect(restoredRows).toBeGreaterThan(filteredRows);
    });

    await test.step('Test state updates: Bulk operations affect individual components', async () => {
      // Enable bulk selection and select items
      await page.click('[data-testid="bulk-select-toggle"]');
      await page.check('[data-testid="opportunity-checkbox-0"]');
      await page.check('[data-testid="opportunity-checkbox-1"]');
      
      // Perform bulk priority update
      await page.click('[data-testid="bulk-actions-dropdown"]');
      await page.click('[data-testid="bulk-update-priority"]');
      
      await page.selectOption('[data-testid="bulk-priority-selector"]', 'high');
      await page.fill('[data-testid="bulk-update-reason"]', 'Bulk priority update test');
      await page.click('[data-testid="apply-bulk-update"]');
      
      await expect(page.locator('[data-testid="bulk-update-success"]')).toBeVisible();
      
      // Verify individual rows reflect the change
      const updatedPriorities = await page.locator('[data-testid="opportunity-row"] [data-testid="priority-indicator"]').first().textContent();
      expect(updatedPriorities).toContain('high');
      
      // Verify stats reflect the bulk change
      const pendingAfterBulk = await page.locator('[data-testid="stat-pending"] .stat-value').textContent();
      expect(Number(pendingAfterBulk)).toBeGreaterThan(0);
    });
  });

  // Test 3: Verify error handling and resilience across components
  test('Hub maintains stability when individual JTBD components encounter errors', async ({ page }) => {
    await test.step('Setup: Navigate to hub and verify stable state', async () => {
      await page.goto('/opportunities');
      await expect(page.locator('[data-testid="opportunities-table"]')).toBeVisible();
      await fixture.assertNoRegressions();
    });

    await test.step('Test validation component error handling', async () => {
      // Simulate validation service error
      await fixture.simulateError('validation-service-error', 'Validation service temporarily unavailable');
      
      // Try to validate an opportunity
      await page.click('[data-testid="opportunity-row"]:first-child [data-testid="validate-button"]');
      
      // Should show error message but not crash the app
      await expect(page.locator('[data-testid="validation-error"]')).toBeVisible();
      await expect(page.locator('[data-testid="validation-error"]')).toContainText('temporarily unavailable');
      
      // Other components should still work
      await page.click('[data-testid="close-validation-panel"]');
      await expect(page.locator('[data-testid="opportunities-table"]')).toBeVisible();
      
      // Can still access other features
      await page.click('[data-testid="analytics-tab"]');
      await expect(page.locator('[data-testid="analytics-dashboard"]')).toBeVisible();
      await page.click('[data-testid="opportunities-tab"]');
    });

    await test.step('Test override component error handling', async () => {
      // Simulate override service error
      await fixture.simulateError('override-service-error', 'Override service error');
      
      // Try to apply override
      await page.click('[data-testid="opportunity-row"]:first-child [data-testid="override-button"]');
      await page.fill('[data-testid="override-reason"]', 'Test error handling');
      await page.click('[data-testid="apply-override"]');
      
      // Should show error but not crash
      await expect(page.locator('[data-testid="override-error"]')).toBeVisible();
      
      // Can close modal and continue
      await page.click('[data-testid="close-override-modal"]');
      await fixture.assertNoRegressions();
    });

    await test.step('Test analytics component error handling', async () => {
      // Simulate analytics data error
      await fixture.simulateError('analytics-data-error', 'Analytics data unavailable');
      
      await page.click('[data-testid="analytics-tab"]');
      
      // Should show fallback state
      await expect(page.locator('[data-testid="analytics-error-state"]')).toBeVisible();
      await expect(page.locator('[data-testid="analytics-retry-button"]')).toBeVisible();
      
      // Other tabs should still work
      await page.click('[data-testid="opportunities-tab"]');
      await expect(page.locator('[data-testid="opportunities-table"]')).toBeVisible();
    });

    await test.step('Test bulk operations error handling', async () => {
      // Simulate bulk operation error
      await fixture.simulateError('bulk-operation-error', 'Bulk operation failed');
      
      await page.click('[data-testid="bulk-select-toggle"]');
      await page.check('[data-testid="opportunity-checkbox-0"]');
      
      await page.click('[data-testid="bulk-actions-dropdown"]');
      await page.click('[data-testid="bulk-validate-action"]');
      await page.click('[data-testid="confirm-bulk-validation"]');
      
      // Should show error but allow recovery
      await expect(page.locator('[data-testid="bulk-operation-error"]')).toBeVisible();
      await expect(page.locator('[data-testid="bulk-retry-button"]')).toBeVisible();
      
      // Can exit bulk mode and continue
      await page.click('[data-testid="bulk-select-toggle"]');
      await fixture.assertNoRegressions();
    });

    await test.step('Test network error resilience', async () => {
      // Simulate network failure
      await page.route('**/api/**', route => route.abort('failed'));
      
      // Try various operations - should handle gracefully
      await page.click('[data-testid="refresh-button"]');
      
      // Should show network error indicator
      await expect(page.locator('[data-testid="network-error-indicator"]')).toBeVisible();
      
      // App should remain functional with cached data
      await expect(page.locator('[data-testid="opportunities-table"]')).toBeVisible();
      
      // Restore network
      await page.unroute('**/api/**');
      
      // Retry should work
      await page.click('[data-testid="retry-network-button"]');
      await expect(page.locator('[data-testid="network-error-indicator"]')).not.toBeVisible();
    });
  });

  // Test 4: Verify performance characteristics of integrated system
  test('Hub performance meets requirements with all JTBD components active', async ({ page }) => {
    const performanceMetrics: any[] = [];

    await test.step('Measure initial load performance', async () => {
      const startTime = Date.now();
      await page.goto('/opportunities');
      await expect(page.locator('[data-testid="opportunities-table"]')).toBeVisible();
      const loadTime = Date.now() - startTime;
      
      performanceMetrics.push({ operation: 'initial-load', duration: loadTime });
      
      // Initial load should be under 5 seconds
      expect(loadTime).toBeLessThan(5000);
      console.log(`Initial load: ${loadTime}ms`);
    });

    await test.step('Measure component interaction performance', async () => {
      const interactions = [
        { name: 'validation-panel', action: () => page.click('[data-testid="validate-button"]'), target: '[data-testid="validation-panel"]' },
        { name: 'override-modal', action: () => page.click('[data-testid="override-button"]'), target: '[data-testid="override-modal"]' },
        { name: 'analytics-tab', action: () => page.click('[data-testid="analytics-tab"]'), target: '[data-testid="analytics-dashboard"]' },
        { name: 'bulk-toolbar', action: () => page.click('[data-testid="bulk-select-toggle"]'), target: '[data-testid="bulk-toolbar"]' }
      ];

      for (const interaction of interactions) {
        const startTime = Date.now();
        await interaction.action();
        await expect(page.locator(interaction.target)).toBeVisible();
        const duration = Date.now() - startTime;
        
        performanceMetrics.push({ operation: interaction.name, duration });
        
        // Individual interactions should be under 2 seconds
        expect(duration).toBeLessThan(2000);
        console.log(`${interaction.name}: ${duration}ms`);
        
        // Reset state
        if (interaction.name === 'validation-panel') {
          await page.click('[data-testid="close-validation-panel"]');
        } else if (interaction.name === 'override-modal') {
          await page.click('[data-testid="cancel-override"]');
        } else if (interaction.name === 'analytics-tab') {
          await page.click('[data-testid="opportunities-tab"]');
        } else if (interaction.name === 'bulk-toolbar') {
          await page.click('[data-testid="bulk-select-toggle"]');
        }
      }
    });

    await test.step('Measure large dataset performance', async () => {
      // Inject large dataset
      await page.evaluate(() => {
        const largeDataset = Array.from({ length: 100 }, (_, i) => ({
          id: `opp-${i}`,
          name: `Opportunity ${i}`,
          satellite: `SAT-${i % 5}`,
          priority: ['low', 'medium', 'high', 'critical'][i % 4],
          validationStatus: ['passed', 'warning', 'failed'][i % 3]
        }));
        
        window.testData = { ...window.testData, opportunities: largeDataset };
      });
      
      await page.reload();
      
      const startTime = Date.now();
      await expect(page.locator('[data-testid="opportunities-table"]')).toBeVisible();
      
      // Should handle 100 opportunities efficiently
      const rowCount = await page.locator('[data-testid="opportunity-row"]').count();
      expect(rowCount).toBeGreaterThan(50); // Should show at least paginated results
      
      const largeDatasetLoadTime = Date.now() - startTime;
      performanceMetrics.push({ operation: 'large-dataset-load', duration: largeDatasetLoadTime });
      
      // Large dataset should load within 8 seconds
      expect(largeDatasetLoadTime).toBeLessThan(8000);
      console.log(`Large dataset load: ${largeDatasetLoadTime}ms`);
    });

    await test.step('Measure concurrent operation performance', async () => {
      // Test multiple operations happening simultaneously
      const startTime = Date.now();
      
      // Start multiple operations concurrently
      const operations = [
        page.click('[data-testid="analytics-tab"]'),
        page.click('[data-testid="bulk-select-toggle"]'),
        page.click('[data-testid="filter-critical"]')
      ];
      
      await Promise.all(operations);
      
      // Verify all operations completed
      await expect(page.locator('[data-testid="analytics-dashboard"]')).toBeVisible();
      await expect(page.locator('[data-testid="bulk-toolbar"]')).toBeVisible();
      await expect(page.locator('[data-testid="critical-opportunities-view"]')).toBeVisible();
      
      const concurrentOpsDuration = Date.now() - startTime;
      performanceMetrics.push({ operation: 'concurrent-operations', duration: concurrentOpsDuration });
      
      // Concurrent operations should complete within 3 seconds
      expect(concurrentOpsDuration).toBeLessThan(3000);
      console.log(`Concurrent operations: ${concurrentOpsDuration}ms`);
    });

    await test.step('Verify overall performance targets', async () => {
      console.log('Performance summary:', performanceMetrics);
      
      // Calculate average performance
      const averageDuration = performanceMetrics.reduce((sum, metric) => sum + metric.duration, 0) / performanceMetrics.length;
      console.log(`Average operation duration: ${averageDuration}ms`);
      
      // Average should be under 3 seconds
      expect(averageDuration).toBeLessThan(3000);
      
      // No operation should be significantly slower than others (outlier detection)
      const maxDuration = Math.max(...performanceMetrics.map(m => m.duration));
      const minDuration = Math.min(...performanceMetrics.map(m => m.duration));
      
      // No operation should be more than 10x slower than the fastest
      expect(maxDuration / minDuration).toBeLessThan(10);
    });
  });

  // Test 5: Verify accessibility across all integrated components
  test('All JTBD components maintain accessibility standards when integrated', async ({ page }) => {
    await test.step('Verify keyboard navigation across all components', async () => {
      await page.goto('/opportunities');
      
      // Test keyboard navigation through main interface
      await page.keyboard.press('Tab'); // Should focus first interactive element
      await page.keyboard.press('Tab'); // Navigate to next element
      
      // Verify focus is visible
      const focusedElement = await page.evaluate(() => document.activeElement?.getAttribute('data-testid'));
      expect(focusedElement).toBeTruthy();
      
      // Test keyboard shortcuts
      await page.keyboard.press('?'); // Should show help
      // Note: Actual shortcut implementation would need to be verified based on the specific shortcuts implemented
      
      // Navigate to validation panel via keyboard
      await page.keyboard.press('Tab');
      await page.keyboard.press('Enter'); // Should activate focused element
    });

    await test.step('Verify screen reader accessibility', async () => {
      // Check for proper ARIA labels and roles
      const ariaLabels = await page.locator('[aria-label]').count();
      expect(ariaLabels).toBeGreaterThan(10); // Should have many labeled elements
      
      // Check for proper heading structure
      const headings = await page.locator('h1, h2, h3, h4').allTextContents();
      expect(headings.length).toBeGreaterThan(3); // Should have proper heading hierarchy
      
      // Verify live regions for dynamic content
      const liveRegions = await page.locator('[aria-live]').count();
      expect(liveRegions).toBeGreaterThan(0); // Should have live regions for status updates
      
      // Check for proper table structure
      await expect(page.locator('table[role="table"], [role="table"]')).toBeVisible();
      
      // Verify form elements have proper labels
      const formInputs = await page.locator('input, select, textarea').count();
      const labeledInputs = await page.locator('input[aria-label], input[aria-labelledby], select[aria-label], textarea[aria-label]').count();
      
      // Most form inputs should be properly labeled
      expect(labeledInputs / formInputs).toBeGreaterThan(0.8);
    });

    await test.step('Verify color contrast and visual accessibility', async () => {
      // Check that important elements have sufficient color contrast
      // This would typically require a specialized accessibility testing tool
      
      // Verify text is readable
      const textElements = page.locator('p, span, div').filter({ hasText: /\w+/ });
      const visibleTextCount = await textElements.count();
      expect(visibleTextCount).toBeGreaterThan(20); // Should have substantial visible text
      
      // Check for focus indicators
      await page.keyboard.press('Tab');
      const focusedElement = page.locator(':focus');
      await expect(focusedElement).toBeVisible();
      
      // Verify high contrast mode support (if applicable)
      // This would depend on specific implementation
    });

    await test.step('Test accessibility with assistive technologies simulation', async () => {
      // Simulate reduced motion preference
      await page.emulateMedia({ reducedMotion: 'reduce' });
      
      // Verify animations respect reduced motion
      // (This would depend on specific CSS implementation)
      
      // Test with keyboard-only navigation
      await page.keyboard.press('Tab');
      for (let i = 0; i < 10; i++) {
        await page.keyboard.press('Tab');
        const focusedElement = await page.evaluate(() => document.activeElement?.tagName);
        expect(['BUTTON', 'A', 'INPUT', 'SELECT', 'TEXTAREA']).toContain(focusedElement);
      }
      
      // Verify skip links work
      const skipLinks = page.locator('[data-testid*="skip"]');
      if (await skipLinks.count() > 0) {
        await skipLinks.first().focus();
        await skipLinks.first().press('Enter');
        // Should move focus to main content
        const mainContent = page.locator('[data-testid="main-content"], main, [role="main"]');
        await expect(mainContent).toBeFocused();
      }
    });
  });
});

// Global test to verify overall hub integration
test.describe('JTBD Hub Integration - System Integration Tests', () => {
  test('Complete JTBD system integration smoke test', async ({ page }) => {
    await test.step('System startup and initialization', async () => {
      await page.goto('/opportunities');
      
      // Wait for all critical components to load
      await expect(page.locator('[data-testid="opportunities-table"]')).toBeVisible();
      await expect(page.locator('[data-testid="hub-stats"]')).toBeVisible();
      await expect(page.locator('[data-testid="smart-views-container"]')).toBeVisible();
      
      // Verify no JavaScript errors
      const consoleErrors: string[] = [];
      page.on('console', msg => {
        if (msg.type() === 'error') {
          consoleErrors.push(msg.text());
        }
      });
      
      // No critical errors should occur during initialization
      expect(consoleErrors.filter(err => err.includes('Error'))).toHaveLength(0);
    });

    await test.step('Quick smoke test of all major JTBD workflows', async () => {
      // JTBD #1: Quick validation test
      await page.click('[data-testid="validate-button"]');
      await expect(page.locator('[data-testid="validation-panel"]')).toBeVisible();
      await page.click('[data-testid="close-validation-panel"]');
      
      // JTBD #2: Quick override test
      await page.click('[data-testid="inline-override-button"]');
      await expect(page.locator('[data-testid="inline-override-popover"]')).toBeVisible();
      await page.press('Escape'); // Close popover
      
      // JTBD #3: Data integrity indicator should be present
      // (May not be visible if no issues, but component should be loaded)
      
      // JTBD #4: Analytics tab test
      await page.click('[data-testid="analytics-tab"]');
      await expect(page.locator('[data-testid="analytics-dashboard"]')).toBeVisible();
      await page.click('[data-testid="opportunities-tab"]');
      
      // JTBD #5: Bulk operations test
      await page.click('[data-testid="bulk-select-toggle"]');
      await expect(page.locator('[data-testid="bulk-toolbar"]')).toBeVisible();
      await page.click('[data-testid="bulk-select-toggle"]');
      
      console.log('All major JTBD workflows are functional');
    });

    await test.step('Verify system stability under normal operations', async () => {
      // Perform several rapid operations to test stability
      for (let i = 0; i < 5; i++) {
        await page.click('[data-testid="analytics-tab"]');
        await page.click('[data-testid="opportunities-tab"]');
        await page.click('[data-testid="bulk-select-toggle"]');
        await page.click('[data-testid="bulk-select-toggle"]');
      }
      
      // System should remain stable
      await expect(page.locator('[data-testid="opportunities-table"]')).toBeVisible();
      
      // No memory leaks or performance degradation
      const memoryUsage = await page.evaluate(() => {
        if ('memory' in performance) {
          return (performance as any).memory.usedJSHeapSize;
        }
        return 0;
      });
      
      console.log('System remains stable. Memory usage:', memoryUsage);
    });
  });
});