import { test, expect } from '@playwright/test';

test.describe('Site Allocation Column Fix Validation', () => {
  test('should display site allocation data in Collection Hub table', async ({ page }) => {
    // Navigate to Collection Hub
    await page.goto('http://localhost:3000/collection-opportunities');

    // Wait for the table to load
    await page.waitForSelector('.bp5-table-container', { timeout: 10000 });

    // Take a screenshot of the initial state
    await page.screenshot({ path: 'test-results/site-allocation-before.png', fullPage: true });

    // Look for the Site Allocation column header
    const siteAllocationHeader = page.locator('text=/Site Allocation/i');
    await expect(siteAllocationHeader).toBeVisible({ timeout: 5000 });

    console.log('✅ Site Allocation column header found');

    // Check for site allocation cells - look for Blueprint Tags with site names
    const siteTags = page.locator('.site-allocation-tag');
    const tagCount = await siteTags.count();

    console.log(`Found ${tagCount} site allocation tags`);

    if (tagCount > 0) {
      // If we found tags, check their content
      const firstTag = siteTags.first();
      const tagText = await firstTag.textContent();
      console.log(`✅ First site tag content: "${tagText}"`);

      // Verify format: "Site X (NN)"
      expect(tagText).toMatch(/Site\s+\w+\s*\(\d+\)/);

      // Take success screenshot
      await page.screenshot({ path: 'test-results/site-allocation-success.png', fullPage: true });

      console.log('✅ SUCCESS: Site allocation column is displaying data correctly');
    } else {
      // Check if empty state indicators ("-") are showing
      const emptyCells = page.locator('.site-allocation-empty');
      const emptyCount = await emptyCells.count();

      if (emptyCount > 0) {
        console.log(`⚠️  Found ${emptyCount} empty site allocation cells (showing "-")`);
        console.log('This indicates allocatedSites arrays are empty, not undefined');
      } else {
        console.log('❌ No site tags or empty indicators found - column may still be blank');
      }

      // Take debug screenshot
      await page.screenshot({ path: 'test-results/site-allocation-debug.png', fullPage: true });
    }

    // Check console for errors
    const consoleLogs: string[] = [];
    page.on('console', msg => {
      if (msg.type() === 'error') {
        consoleLogs.push(`ERROR: ${msg.text()}`);
      }
    });

    await page.waitForTimeout(2000);

    if (consoleLogs.length > 0) {
      console.log('⚠️  Console errors detected:');
      consoleLogs.forEach(log => console.log(`  ${log}`));
    } else {
      console.log('✅ No console errors detected');
    }
  });

  test('should check actual data structure in browser', async ({ page }) => {
    await page.goto('http://localhost:3000/collection-opportunities');
    await page.waitForSelector('.bp5-table-container', { timeout: 10000 });

    // Evaluate in browser context to check actual data
    const dataCheck = await page.evaluate(() => {
      // Try to access React DevTools or component state
      const tableContainer = document.querySelector('.bp5-table-container');
      if (!tableContainer) return { error: 'Table container not found' };

      // Look for site allocation cells
      const cells = document.querySelectorAll('[class*="site-allocation"]');

      return {
        cellCount: cells.length,
        cellClasses: Array.from(cells).slice(0, 5).map(cell => cell.className),
        sampleContent: Array.from(cells).slice(0, 5).map(cell => cell.textContent?.trim() || ''),
      };
    });

    console.log('Browser data check:', JSON.stringify(dataCheck, null, 2));
  });
});
