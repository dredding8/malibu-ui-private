import { test, expect } from '@playwright/test';

test.describe('Override Workflow E2E Tests', () => {
  test.beforeEach(async ({ page }) => {
    // Navigate to the application
    await page.goto('http://localhost:3000');
    
    // Wait for the app to load
    await page.waitForSelector('[data-testid="app-header"]', { timeout: 10000 });
  });

  test('Complete override workflow with justification', async ({ page }) => {
    // Navigate to collection opportunities
    await page.click('a:has-text("Collection Opportunities")');
    await page.waitForSelector('[data-testid="collection-opportunities-table"]');
    
    // Click on first opportunity to view details
    await page.click('tr[data-testid="opportunity-row"]:first-child button:has-text("View Details")');
    
    // Wait for the opportunity details modal
    await page.waitForSelector('[data-testid="opportunity-details-modal"]');
    
    // Click override button
    await page.click('button:has-text("Override Allocation")');
    
    // Wait for override modal
    await page.waitForSelector('[data-testid="override-modal"]');
    
    // Select a new site from dropdown
    await page.click('[data-testid="site-select"]');
    await page.click('.bp6-menu-item:first-child');
    
    // Wait for impact analysis
    await page.waitForSelector('[data-testid="impact-analysis-results"]', { timeout: 5000 });
    
    // Check if high risk (requires justification)
    const requiresJustification = await page.isVisible('[data-testid="override-justification"]');
    
    if (requiresJustification) {
      // Fill justification
      await page.fill('[data-testid="override-justification"]', 'Mission critical requirement for improved coverage in this region. Approved by mission director.');
      
      // Submit with justification
      await page.click('button:has-text("Submit with Justification")');
    } else {
      // Low risk - direct confirm
      await page.click('button:has-text("Confirm Override")');
    }
    
    // Verify success notification
    await expect(page.locator('.bp6-toast:has-text("Override successful")')).toBeVisible({ timeout: 5000 });
  });

  test('Override workflow shows impact analysis', async ({ page }) => {
    // Navigate to collection opportunities
    await page.click('a:has-text("Collection Opportunities")');
    await page.waitForSelector('[data-testid="collection-opportunities-table"]');
    
    // Open first opportunity
    await page.click('tr[data-testid="opportunity-row"]:first-child button:has-text("View Details")');
    await page.waitForSelector('[data-testid="opportunity-details-modal"]');
    
    // Click override
    await page.click('button:has-text("Override Allocation")');
    await page.waitForSelector('[data-testid="override-modal"]');
    
    // Select a site
    await page.click('[data-testid="site-select"]');
    await page.click('.bp6-menu-item:nth-child(2)');
    
    // Verify impact analysis components
    await expect(page.locator('text=Capacity Impact')).toBeVisible();
    await expect(page.locator('text=Quality Assessment')).toBeVisible();
    await expect(page.locator('text=Risk Assessment')).toBeVisible();
    await expect(page.locator('text=Recommendations')).toBeVisible();
  });

  test('Blueprint components work correctly in override flow', async ({ page }) => {
    // Navigate to collection opportunities
    await page.click('a:has-text("Collection Opportunities")');
    await page.waitForSelector('[data-testid="collection-opportunities-table"]');
    
    // Verify Blueprint table components
    const table = page.locator('.bp6-html-table');
    await expect(table).toBeVisible();
    await expect(table).toHaveClass(/bp6-interactive/);
    
    // Check Blueprint buttons
    const viewButton = page.locator('button.bp6-button:has-text("View Details")').first();
    await expect(viewButton).toHaveClass(/bp6-intent-primary/);
    
    // Open modal with Blueprint styling
    await viewButton.click();
    const modal = page.locator('.bp6-dialog');
    await expect(modal).toBeVisible();
    await expect(modal).toHaveClass(/bp6-overlay-scroll-container/);
    
    // Check Blueprint tags in modal
    const tags = page.locator('.bp6-tag');
    await expect(tags.first()).toBeVisible();
    
    // Check Blueprint progress bars
    const progressBar = page.locator('.bp6-progress-bar');
    await expect(progressBar.first()).toBeVisible();
  });

  test('Accessibility - keyboard navigation works', async ({ page }) => {
    // Navigate to collection opportunities
    await page.click('a:has-text("Collection Opportunities")');
    await page.waitForSelector('[data-testid="collection-opportunities-table"]');
    
    // Tab to first button
    await page.keyboard.press('Tab');
    await page.keyboard.press('Tab');
    await page.keyboard.press('Tab');
    
    // Press Enter to open details
    await page.keyboard.press('Enter');
    await page.waitForSelector('[data-testid="opportunity-details-modal"]');
    
    // Tab to override button
    for (let i = 0; i < 5; i++) {
      await page.keyboard.press('Tab');
    }
    
    // Press Enter to open override modal
    await page.keyboard.press('Enter');
    await expect(page.locator('[data-testid="override-modal"]')).toBeVisible();
    
    // Escape to close modal
    await page.keyboard.press('Escape');
    await expect(page.locator('[data-testid="override-modal"]')).not.toBeVisible();
  });

  test('Performance - override workflow loads quickly', async ({ page }) => {
    const startTime = Date.now();
    
    // Navigate to collection opportunities
    await page.click('a:has-text("Collection Opportunities")');
    await page.waitForSelector('[data-testid="collection-opportunities-table"]');
    
    // Open first opportunity
    await page.click('tr[data-testid="opportunity-row"]:first-child button:has-text("View Details")');
    await page.waitForSelector('[data-testid="opportunity-details-modal"]');
    
    // Click override
    await page.click('button:has-text("Override Allocation")');
    await page.waitForSelector('[data-testid="override-modal"]');
    
    // Select site and wait for impact analysis
    await page.click('[data-testid="site-select"]');
    await page.click('.bp6-menu-item:first-child');
    await page.waitForSelector('[data-testid="impact-analysis-results"]');
    
    const loadTime = Date.now() - startTime;
    
    // Entire workflow should complete in under 3 seconds
    expect(loadTime).toBeLessThan(3000);
  });
});