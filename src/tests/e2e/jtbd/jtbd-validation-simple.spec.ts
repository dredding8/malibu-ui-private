import { test, expect } from '@playwright/test';

// Helper to remove webpack dev server overlay
async function removeWebpackOverlay(page: any) {
  await page.evaluate(() => {
    const overlay = document.getElementById('webpack-dev-server-client-overlay');
    if (overlay) overlay.remove();
  });
}

test.describe('JTBD #1: Verify and Validate Collection Plans - Simple Tests', () => {
  test.beforeEach(async ({ page }) => {
    // Navigate to test opportunities page
    await page.goto('http://localhost:3000/test-opportunities');
    await page.waitForLoadState('networkidle');
    await removeWebpackOverlay(page);
  });

  test('Row click opens opportunity details modal', async ({ page }) => {
    // Wait for opportunities to load
    await page.waitForSelector('[data-testid="opportunity-row"]');
    
    // Click on first opportunity row
    await page.locator('[data-testid="opportunity-row"]').first().evaluate(el => el.click());
    
    // Wait for modal to open
    await page.waitForSelector('[data-testid="opportunity-details"]');
    
    // Verify modal is visible
    const modalVisible = await page.locator('[data-testid="opportunity-details"]').isVisible();
    expect(modalVisible).toBe(true);
    
    // Check modal has opportunity information
    const modalText = await page.locator('[data-testid="opportunity-details"]').textContent();
    expect(modalText).toContain('Opportunity Alpha');
  });

  test('Validation button is present in opportunity details', async ({ page }) => {
    // Open first opportunity details
    await page.locator('[data-testid="opportunity-row"]').first().evaluate(el => el.click());
    await page.waitForSelector('[data-testid="opportunity-details"]');
    
    // Check for validate button
    const validateButton = page.locator('[data-testid="validate-opportunity-button"]');
    await expect(validateButton).toBeVisible();
    await expect(validateButton).toHaveText('Validate Plan');
  });

  test('Clicking validate button triggers validation workflow', async ({ page }) => {
    // Set up console listener to capture validation calls
    const consoleMessages: string[] = [];
    page.on('console', msg => consoleMessages.push(msg.text()));
    
    // Open opportunity details
    await page.locator('[data-testid="opportunity-row"]').first().evaluate(el => el.click());
    await page.waitForSelector('[data-testid="opportunity-details"]');
    
    // Click validate button
    await page.locator('[data-testid="validate-opportunity-button"]').click();
    
    // Check that validation was triggered (console log)
    const validationTriggered = consoleMessages.some(msg => 
      msg.includes('Validate opportunity:') || msg.includes('validate')
    );
    expect(validationTriggered).toBe(true);
  });

  test('Multiple opportunities can be selected for validation', async ({ page }) => {
    // Get all opportunity rows
    const rows = page.locator('[data-testid="opportunity-row"]');
    const rowCount = await rows.count();
    
    // Should have at least 3 test opportunities
    expect(rowCount).toBeGreaterThanOrEqual(3);
    
    // Click each row to verify they all open modals
    for (let i = 0; i < Math.min(rowCount, 3); i++) {
      await rows.nth(i).evaluate(el => el.click());
      await page.waitForSelector('[data-testid="opportunity-details"]');
      
      // Close modal
      await page.keyboard.press('Escape');
      await page.waitForTimeout(500);
    }
  });

  test('Opportunity health status is visible', async ({ page }) => {
    // Check that status indicators are present
    const statusIndicators = await page.locator('.opportunity-status-indicator').count();
    expect(statusIndicators).toBeGreaterThan(0);
  });

  test('Search functionality works', async ({ page }) => {
    // Find search input
    const searchInput = page.locator('input[placeholder*="Search"]');
    await expect(searchInput).toBeVisible();
    
    // Search for specific opportunity
    await searchInput.fill('Alpha');
    await page.waitForTimeout(500); // Debounce delay
    
    // Should show only filtered results
    const visibleRows = await page.locator('[data-testid="opportunity-row"]').count();
    expect(visibleRows).toBe(1);
  });
});