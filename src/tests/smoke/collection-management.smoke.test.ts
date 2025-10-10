import { test, expect } from '@playwright/test';

test.describe('Collection Management Smoke Tests', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/collection-opportunities');
  });

  test('Critical: Page loads without errors', async ({ page }) => {
    // Check for console errors
    const consoleErrors: string[] = [];
    page.on('console', msg => {
      if (msg.type() === 'error') {
        consoleErrors.push(msg.text());
      }
    });

    // Wait for page to stabilize
    await page.waitForLoadState('networkidle');
    
    // Verify no critical errors
    const criticalErrors = consoleErrors.filter(err => 
      err.includes('VirtualizedOpportunitiesTable') ||
      err.includes('import(') ||
      err.includes('ChunkLoadError')
    );
    
    expect(criticalErrors).toHaveLength(0);
  });

  test('Critical: Table renders with data', async ({ page }) => {
    // Wait for table to be visible
    const table = page.locator('[role="grid"], .bp5-table-container, .bp4-table-container');
    await expect(table).toBeVisible({ timeout: 10000 });

    // Verify table has rows
    const rows = page.locator('[role="row"], .bp5-table-row-wrapper, .bp4-table-row-wrapper');
    const rowCount = await rows.count();
    expect(rowCount).toBeGreaterThan(0);
  });

  test('Critical: Table interactions work', async ({ page }) => {
    // Test sorting
    const headerCell = page.locator('[role="columnheader"]').first();
    await headerCell.click();
    
    // Test row selection
    const firstRow = page.locator('[role="row"]').nth(1);
    await firstRow.click();
    
    // Verify no errors after interactions
    await page.waitForTimeout(500);
    const hasError = await page.locator('.bp5-non-ideal-state, .bp4-non-ideal-state').count();
    expect(hasError).toBe(0);
  });

  test('Fallback: Error boundary activates gracefully', async ({ page }) => {
    // Intercept and fail the chunk request
    await page.route('**/CollectionOpportunitiesPerformance*.js', route => {
      route.abort('failed');
    });

    await page.reload();
    
    // Verify error boundary shows
    const errorBoundary = page.locator('text=/Table Loading Error|Using fallback table/i');
    const isErrorHandled = await errorBoundary.count() > 0;
    
    // Either error is shown OR fallback table works
    if (!isErrorHandled) {
      const table = page.locator('[role="grid"], .bp5-table-container, .bp4-table-container');
      await expect(table).toBeVisible();
    }
  });

  test('Performance: Page loads within threshold', async ({ page }) => {
    const startTime = Date.now();
    
    await page.goto('/collection-opportunities');
    await page.waitForLoadState('networkidle');
    
    const loadTime = Date.now() - startTime;
    
    // Should load within 3 seconds (Doherty threshold)
    expect(loadTime).toBeLessThan(3000);
    
    // Log for monitoring
    console.log(`Page load time: ${loadTime}ms`);
  });
});

// Quick smoke test runner
if (require.main === module) {
  console.log('Running Collection Management Smoke Tests...');
  require('child_process').execSync('npx playwright test collection-management.smoke.test.ts --reporter=list', {
    stdio: 'inherit'
  });
}