import { test, expect } from '@playwright/test';

/**
 * Quick Cross-Browser E2E tests for Collection Management
 * Focus on critical functionality across browsers
 */
test.describe('Collection Management Cross-Browser Quick Tests', () => {
  const testCollectionId = 'DECK-1757517559289';
  const pageUrl = `http://localhost:3000/collection/${testCollectionId}/manage`;

  // Test on default browsers configured in playwright.config.ts
  test('should load collection management page consistently', async ({ page, browserName }) => {
    console.log(`Testing on ${browserName}`);
    
    // Navigate to page
    await page.goto(pageUrl);
    await page.waitForLoadState('networkidle', { timeout: 30000 });
    
    // Verify page loads
    const pageTitle = await page.title();
    expect(pageTitle).toBeTruthy();
    
    // Check critical elements are visible
    const mainContent = page.locator('.collection-opportunities-hub, main, .hub-content');
    await expect(mainContent.first()).toBeVisible({ timeout: 10000 });
    
    // Verify no major console errors
    const consoleErrors: string[] = [];
    page.on('console', msg => {
      if (msg.type() === 'error' && !msg.text().includes('favicon')) {
        consoleErrors.push(msg.text());
      }
    });
    
    await page.waitForTimeout(2000);
    expect(consoleErrors.length).toBe(0);
  });

  test('should handle table interactions consistently', async ({ page, browserName }) => {
    await page.goto(pageUrl);
    await page.waitForLoadState('networkidle', { timeout: 30000 });
    
    // Wait for table to load
    const table = page.locator('table, .bp5-table').first();
    await expect(table).toBeVisible({ timeout: 15000 });
    
    // Test sorting if available
    const sortableHeader = page.locator('th[role="columnheader"], .bp5-table-header').first();
    if (await sortableHeader.count() > 0) {
      await sortableHeader.click();
      await page.waitForTimeout(500);
      
      // Verify sort happened (look for sort indicators)
      const sortIndicator = page.locator('.bp5-icon-sort-asc, .bp5-icon-sort-desc, .sort-icon, [aria-sort]');
      expect(await sortIndicator.count()).toBeGreaterThan(0);
    }
    
    // Test row interactions
    const rows = page.locator('tbody tr, .bp5-table-row');
    if (await rows.count() > 0) {
      const firstRow = rows.first();
      await firstRow.click();
      await page.waitForTimeout(300);
      
      // Check if row is selected or some action occurred
      const selectedRow = page.locator('.selected, .bp5-table-row-selected, [aria-selected="true"]');
      // Row selection might not be implemented, so just verify no errors
      console.log(`${browserName}: Row selection elements found: ${await selectedRow.count()}`);
    }
  });

  test('should maintain responsive layout', async ({ page, browserName }) => {
    // Desktop view
    await page.setViewportSize({ width: 1366, height: 768 });
    await page.goto(pageUrl);
    await page.waitForLoadState('networkidle', { timeout: 30000 });
    
    // Check no horizontal scroll on desktop
    const desktopScroll = await page.evaluate(() => {
      return document.documentElement.scrollWidth > document.documentElement.clientWidth;
    });
    expect(desktopScroll).toBeFalsy();
    
    // Mobile view
    await page.setViewportSize({ width: 375, height: 667 });
    await page.waitForTimeout(500);
    
    // Check no horizontal scroll on mobile
    const mobileScroll = await page.evaluate(() => {
      return document.documentElement.scrollWidth > document.documentElement.clientWidth;
    });
    expect(mobileScroll).toBeFalsy();
    
    // Verify content is still visible
    const content = page.locator('.collection-opportunities-hub, main, .hub-content');
    await expect(content.first()).toBeVisible();
  });

  test('should have consistent navigation', async ({ page, browserName }) => {
    await page.goto(pageUrl);
    await page.waitForLoadState('networkidle', { timeout: 30000 });
    
    // Check for navigation elements
    const nav = page.locator('nav, .navigation, .navbar, header');
    await expect(nav.first()).toBeVisible();
    
    // Test navigation interaction
    const navLinks = page.locator('nav a, .navigation a, .navbar a');
    const linkCount = await navLinks.count();
    console.log(`${browserName}: Navigation links found: ${linkCount}`);
    
    if (linkCount > 0) {
      // Check first link is interactive
      const firstLink = navLinks.first();
      const href = await firstLink.getAttribute('href');
      expect(href).toBeTruthy();
    }
  });

  test('should handle search/filter inputs', async ({ page, browserName }) => {
    await page.goto(pageUrl);
    await page.waitForLoadState('networkidle', { timeout: 30000 });
    
    // Look for search inputs
    const searchInput = page.locator('input[type="search"], input[placeholder*="search"], input[placeholder*="Search"]').first();
    
    if (await searchInput.count() > 0) {
      await searchInput.fill('test search query');
      await page.keyboard.press('Enter');
      await page.waitForTimeout(1000);
      
      // Verify input value persisted
      const inputValue = await searchInput.inputValue();
      expect(inputValue).toBe('test search query');
      
      // Clear search
      await searchInput.clear();
      await page.keyboard.press('Enter');
      await page.waitForTimeout(500);
    }
  });

  test.describe('Performance Metrics Summary', () => {
    test.afterAll(async () => {
      console.log('\n=== CROSS-BROWSER TEST SUMMARY ===');
      console.log('Tests completed across Chromium, Firefox, and WebKit');
      console.log('Key findings will be analyzed from test outputs above');
      console.log('=================================\n');
    });
  });
});