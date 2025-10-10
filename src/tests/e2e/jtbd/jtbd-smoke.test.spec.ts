import { test, expect } from '@playwright/test';

test.describe('JTBD Smoke Tests', () => {
  test('Application loads successfully', async ({ page }) => {
    // Navigate to the application
    await page.goto('/');
    
    // Wait for the app to load
    await page.waitForLoadState('networkidle');
    
    // Verify the page loaded
    await expect(page).toHaveTitle(/Collection|Dashboard|Malibu/i);
    
    // Check for main navigation or content
    const mainContent = page.locator('main, [role="main"], #root, .App');
    await expect(mainContent).toBeVisible();
  });
  
  test('Navigation to opportunities page works', async ({ page }) => {
    // Navigate to opportunities
    await page.goto('/opportunities');
    
    // Wait for content to load
    await page.waitForLoadState('domcontentloaded');
    
    // Verify we're on the opportunities page
    const url = page.url();
    expect(url).toContain('opportunities');
    
    // Look for opportunities-related content
    const opportunitiesContent = page.locator('[data-testid*="opportunit"], h1:has-text("Opportunit"), .opportunities');
    await expect(opportunitiesContent.first()).toBeVisible({ timeout: 10000 });
  });
  
  test('Basic performance metrics can be collected', async ({ page, browserName }) => {
    await page.goto('/opportunities');
    
    // Collect basic timing metrics
    const performanceTiming = await page.evaluate(() => {
      const timing = performance.timing;
      return {
        loadTime: timing.loadEventEnd - timing.navigationStart,
        domContentLoaded: timing.domContentLoadedEventEnd - timing.navigationStart,
        firstPaint: performance.getEntriesByType('paint')[0]?.startTime || 0,
      };
    });
    
    console.log(`Performance metrics for ${browserName}:`, performanceTiming);
    
    // Basic assertions
    expect(performanceTiming.loadTime).toBeLessThan(10000); // 10 seconds max
    expect(performanceTiming.domContentLoaded).toBeLessThan(5000); // 5 seconds max
  });
  
  test('Visual elements are present', async ({ page }) => {
    await page.goto('/opportunities');
    
    // Take a screenshot for visual verification
    await page.screenshot({ 
      path: `test-results/jtbd-artifacts/smoke-test-${Date.now()}.png`,
      fullPage: false 
    });
    
    // Check for key visual elements
    const hasTable = await page.locator('table, [role="table"], .bp5-table').isVisible().catch(() => false);
    const hasCards = await page.locator('.card, .bp5-card, [data-testid*="card"]').isVisible().catch(() => false);
    const hasButtons = await page.locator('button, .bp5-button').isVisible().catch(() => false);
    
    // At least some UI elements should be present
    expect(hasTable || hasCards || hasButtons).toBe(true);
  });
});