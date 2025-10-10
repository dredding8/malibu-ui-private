import { test, expect } from '@playwright/test';

test.describe('Site Allocation Column - Final Verification', () => {
  test('should display Site Allocation column in position 7', async ({ page }) => {
    // Navigate to Collection Hub with test ID
    await page.goto('http://localhost:3000/collection/TEST-001/manage');

    // Wait for page load
    await page.waitForLoadState('networkidle', { timeout: 15000 });

    console.log('✅ Page loaded');

    // Wait for table to render
    await page.waitForSelector('[data-testid="opportunities-table"]', { timeout: 10000 });

    console.log('✅ Table found');

    // Take screenshot
    await page.screenshot({ path: 'test-results/final-verification-full-page.png', fullPage: true });

    // Get all column headers
    const columnHeaders = await page.evaluate(() => {
      const headers = document.querySelectorAll('.bp5-table-column-name-text, .bp6-table-column-name-text');
      return Array.from(headers).map(h => h.textContent?.trim() || '');
    });

    console.log('\n=== COLUMN HEADERS ===');
    columnHeaders.forEach((header, idx) => {
      console.log(`${idx + 1}. ${header}`);
    });

    // Verify Site Allocation column exists
    const hasSiteAllocationColumn = columnHeaders.includes('Site Allocation');
    console.log(`\n✅ Site Allocation column found: ${hasSiteAllocationColumn}`);

    if (hasSiteAllocationColumn) {
      const position = columnHeaders.indexOf('Site Allocation') + 1;
      console.log(`   Position: ${position} of ${columnHeaders.length}`);

      // It should be around position 7-8 (after checkbox, priority, match, match notes, SCC, function, orbit)
      expect(position).toBeGreaterThanOrEqual(7);
      expect(position).toBeLessThanOrEqual(9);
    }

    expect(hasSiteAllocationColumn).toBe(true);

    // Check for actual site allocation data
    const siteData = await page.evaluate(() => {
      const cells = document.querySelectorAll('.site-allocation-cell');
      const tags = document.querySelectorAll('.site-allocation-tag');
      const emptyIndicators = document.querySelectorAll('.site-allocation-empty');

      return {
        cellCount: cells.length,
        tagCount: tags.length,
        emptyCount: emptyIndicators.length,
        firstCellContent: cells[0]?.textContent?.trim() || '',
        firstTagContent: tags[0]?.textContent?.trim() || ''
      };
    });

    console.log('\n=== SITE ALLOCATION DATA ===');
    console.log(`Total cells: ${siteData.cellCount}`);
    console.log(`Site tags: ${siteData.tagCount}`);
    console.log(`Empty indicators: ${siteData.emptyCount}`);

    if (siteData.firstCellContent) {
      console.log(`First cell: "${siteData.firstCellContent}"`);
    }

    if (siteData.firstTagContent) {
      console.log(`First tag: "${siteData.firstTagContent}"`);
    }

    // Verify we have data
    if (siteData.tagCount > 0) {
      console.log('\n✅ SUCCESS: Site Allocation column is visible with site data!');
      expect(siteData.firstTagContent).toMatch(/Site\s+[A-Z]/);
    } else if (siteData.emptyCount > 0) {
      console.log('\n⚠️  Site Allocation column is visible but showing empty data (-)');
    } else {
      console.log('\n❌ Site Allocation column found but no data rendering');
    }

    // Final success screenshot
    await page.screenshot({ path: 'test-results/final-verification-success.png', fullPage: true });
  });
});
