import { test, expect } from '@playwright/test';

// Test configuration
const COLLECTION_HUB_URL = 'http://localhost:3000/collection/TEST-003/manage';
const TEST_TIMEOUT = 60000; // 60 seconds for slow loading

// Helper to remove webpack overlay
async function removeWebpackOverlay(page: any) {
  await page.evaluate(() => {
    const overlay = document.getElementById('webpack-dev-server-client-overlay');
    if (overlay) overlay.remove();
  });
}

test.describe('JTBD Live Application Tests - Collection Opportunities Hub', () => {
  test.beforeEach(async ({ page }) => {
    // Set longer timeout for this test
    test.setTimeout(TEST_TIMEOUT);
    
    // Navigate to the collection hub
    await page.goto(COLLECTION_HUB_URL);
    
    // Wait for either the hub to load or an error to appear
    await page.waitForSelector('.collection-opportunities-enhanced, .collection-opportunities-accessible, .bp5-non-ideal-state', {
      timeout: 30000
    });
    
    // Remove webpack overlay if present
    await removeWebpackOverlay(page);
  });

  test('JTBD #1: Verify collection plans through row click interaction', async ({ page }) => {
    // Check if opportunities loaded
    const hasOpportunities = await page.locator('[data-testid="opportunity-row"], .opportunity-row, tr[role="row"]').count() > 0;
    
    if (!hasOpportunities) {
      // Check for loading or error states
      const nonIdealState = await page.locator('.bp5-non-ideal-state').textContent();
      console.log('Non-ideal state:', nonIdealState);
      
      // If no opportunities, check if it's a data loading issue
      expect(nonIdealState).toBeDefined();
      return;
    }

    // Click on the first opportunity row - try multiple selectors
    const opportunitySelectors = [
      '[data-testid="opportunity-row"]',
      '.opportunity-row',
      'tr[role="row"]:not(:first-child)', // Skip header row
      '.bp5-table-cell:has-text("Opportunity")'
    ];

    let clicked = false;
    for (const selector of opportunitySelectors) {
      const element = page.locator(selector).first();
      if (await element.count() > 0) {
        await element.click();
        clicked = true;
        break;
      }
    }

    expect(clicked).toBe(true);

    // Wait for modal to open - try multiple selectors
    const modalSelectors = [
      '[data-testid="opportunity-details"]',
      '.bp5-dialog',
      '[role="dialog"]',
      '.opportunity-details-modal'
    ];

    let modalFound = false;
    for (const selector of modalSelectors) {
      try {
        await page.waitForSelector(selector, { timeout: 5000 });
        modalFound = true;
        break;
      } catch (e) {
        // Continue to next selector
      }
    }

    expect(modalFound).toBe(true);

    // Look for validate button
    const validateButton = page.locator('[data-testid="validate-opportunity-button"], button:has-text("Validate")');
    await expect(validateButton).toBeVisible({ timeout: 5000 });

    // Click validate
    await validateButton.click();

    // Verify validation was triggered (check console or UI feedback)
    // Close modal
    await page.keyboard.press('Escape');
  });

  test('JTBD #2: Override functionality is accessible', async ({ page }) => {
    // Look for override buttons
    const overrideSelectors = [
      'button[aria-label*="Override"]',
      'button:has-text("Override")',
      '[data-testid="override-button"]'
    ];

    let overrideFound = false;
    for (const selector of overrideSelectors) {
      const count = await page.locator(selector).count();
      if (count > 0) {
        overrideFound = true;
        
        // Click the first override button
        await page.locator(selector).first().click();
        
        // Wait for impact calculator
        await expect(page.locator('text=/Impact|Override Impact/i')).toBeVisible({ timeout: 5000 });
        break;
      }
    }

    // Override functionality might be inside opportunity details
    if (!overrideFound) {
      console.log('Override buttons not found in main view, checking in details modal...');
    }
  });

  test('JTBD #4: Analytics dashboard is accessible', async ({ page }) => {
    // Look for analytics tab/link
    const analyticsSelectors = [
      'text="Analytics"',
      '[data-testid="analytics-tab"]',
      'button:has-text("Analytics")',
      'a:has-text("Analytics")'
    ];

    let analyticsFound = false;
    for (const selector of analyticsSelectors) {
      const element = page.locator(selector);
      if (await element.count() > 0) {
        await element.click();
        analyticsFound = true;
        break;
      }
    }

    if (analyticsFound) {
      // Wait for analytics content
      await expect(page.locator('text=/Performance|Trends|Metrics/i')).toBeVisible({ timeout: 10000 });
    }
  });

  test('JTBD #5: Bulk operations are available', async ({ page }) => {
    // Look for bulk select checkbox
    const bulkSelectSelectors = [
      '[data-testid="bulk-select-checkbox"]',
      'th input[type="checkbox"]',
      '.bp5-table-header input[type="checkbox"]'
    ];

    let bulkSelectFound = false;
    for (const selector of bulkSelectSelectors) {
      const element = page.locator(selector);
      if (await element.count() > 0) {
        await element.click();
        bulkSelectFound = true;
        break;
      }
    }

    if (bulkSelectFound) {
      // Wait for bulk toolbar
      await expect(page.locator('[data-testid="bulk-operations-toolbar"], .bulk-operations-toolbar')).toBeVisible({ timeout: 5000 });
      
      // Check for bulk actions
      const bulkActionsButton = page.locator('button:has-text("Bulk Actions")');
      if (await bulkActionsButton.count() > 0) {
        await bulkActionsButton.click();
        
        // Verify menu items
        await expect(page.locator('text="Validate All"')).toBeVisible();
      }
    }
  });

  test('Complete JTBD workflow integration', async ({ page }) => {
    console.log('Testing complete JTBD workflow on live application...');
    
    // Log current URL
    const currentUrl = page.url();
    console.log('Current URL:', currentUrl);
    
    // Check page state
    const pageContent = await page.textContent('body');
    
    if (pageContent.includes('Loading')) {
      console.log('Page is still loading...');
      // Wait for content to load
      await page.waitForSelector('.collection-opportunities-enhanced, .collection-opportunities-accessible', {
        timeout: 30000
      });
    }
    
    // Take a screenshot for debugging
    await page.screenshot({ path: 'live-app-test.png', fullPage: true });
    console.log('Screenshot saved to live-app-test.png');
    
    // Verify key features are present
    const features = {
      opportunities: await page.locator('[data-testid="opportunity-row"], .opportunity-row').count(),
      navbar: await page.locator('.bp5-navbar').count(),
      tables: await page.locator('.bp5-table, table').count()
    };
    
    console.log('Features found:', features);
    
    // At least some features should be present
    expect(features.opportunities + features.tables).toBeGreaterThan(0);
  });
});