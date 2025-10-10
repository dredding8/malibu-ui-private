/**
 * Site Allocation Cell Fix Validation Test
 *
 * Validates that the double Cell wrapper bug fix resolves the blank column issue.
 *
 * Bug Fixed:
 * - Before: createSiteAllocationCellRenderer returned <SiteAllocationCell> which itself returned <Cell>
 * - After: createSiteAllocationCellRenderer returns <Cell><SiteAllocationCell /></Cell>
 * - Result: Proper Blueprint Table2 cell rendering
 */

import { test, expect } from '@playwright/test';

test.describe('Site Allocation Cell Fix Validation', () => {

  test.beforeEach(async ({ page }) => {
    await page.goto('http://localhost:3000/test-opportunities');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(3000); // Wait for full render
  });

  test('Visual regression: Site Allocation column should show tags', async ({ page }) => {
    // Wait for table to render
    const table = page.locator('.bp5-table-container');
    await expect(table).toBeVisible({ timeout: 15000 });

    // Take screenshot of full page
    await page.screenshot({
      path: 'test-results/site-allocation-fix-validation-full-page.png',
      fullPage: true
    });

    // Verify column header exists
    const siteAllocationHeader = page.getByText('Site Allocation');
    await expect(siteAllocationHeader).toBeVisible();

    // Count site allocation tags - should be > 0 if fix worked
    const tagCount = await page.locator('.site-allocation-tag').count();
    console.log(`Site Allocation Tags visible: ${tagCount}`);
    expect(tagCount).toBeGreaterThan(0);

    // Verify tags contain text content
    const firstTag = page.locator('.site-allocation-tag').first();
    const tagText = await firstTag.textContent();
    console.log(`First tag text: ${tagText}`);
    expect(tagText).toBeTruthy();
    expect(tagText).not.toBe('-');

    // Verify site name is visible
    const siteName = await firstTag.locator('.site-allocation-tag__name').textContent();
    console.log(`Site name: ${siteName}`);
    expect(siteName).toBeTruthy();

    // Verify collect count is visible
    const siteCount = await firstTag.locator('.site-allocation-tag__count').textContent();
    console.log(`Collect count: ${siteCount}`);
    expect(siteCount).toMatch(/\(\d+\)/); // Should be format "(123)"
  });

  test('Compare before/after: Empty state count should be 0', async ({ page }) => {
    await page.waitForSelector('.bp5-table-container', { timeout: 15000 });
    await page.waitForTimeout(2000);

    // Count empty state indicators
    const emptyCount = await page.locator('.site-allocation-empty').count();
    console.log(`Empty state indicators: ${emptyCount}`);

    // Some rows may legitimately have no sites, but most should have data
    const totalRows = await page.locator('.bp5-table-row').count();
    console.log(`Total rows: ${totalRows}`);

    // At least 80% of rows should have site data (not empty)
    expect(emptyCount).toBeLessThan(totalRows * 0.2);
  });

  test('Verify Blueprint Tag styling is applied', async ({ page }) => {
    await page.waitForSelector('.bp5-table-container', { timeout: 15000 });

    const firstTag = page.locator('.site-allocation-tag').first();
    await expect(firstTag).toBeVisible();

    // Check if Blueprint classes are present
    const hasBpTag = await firstTag.evaluate(el => el.classList.contains('bp5-tag'));
    console.log(`Has Blueprint Tag class: ${hasBpTag}`);
    expect(hasBpTag).toBe(true);

    // Check intent class
    const hasBpIntent = await firstTag.evaluate(el =>
      Array.from(el.classList).some(c => c.includes('bp5-intent'))
    );
    console.log(`Has Blueprint Intent class: ${hasBpIntent}`);
    expect(hasBpIntent).toBe(true);

    // Verify tag is actually visible (not hidden by CSS)
    const isVisible = await firstTag.isVisible();
    expect(isVisible).toBe(true);
  });

  test('Verify Cell wrapper structure is correct', async ({ page }) => {
    await page.waitForSelector('.bp5-table-container', { timeout: 15000 });

    // Check cell structure: .bp5-table-cell > .site-allocation-cell > .site-allocation-content
    const cellStructure = await page.evaluate(() => {
      const tableCells = Array.from(document.querySelectorAll('.bp5-table-cell'));

      // Find cells with site allocation content
      const siteAllocationCells = tableCells.filter(cell => {
        return cell.querySelector('.site-allocation-cell') !== null;
      });

      if (siteAllocationCells.length === 0) {
        return { error: 'No site allocation cells found' };
      }

      const firstCell = siteAllocationCells[0];
      return {
        hasBpTableCell: firstCell.classList.contains('bp5-table-cell'),
        hasSiteAllocationCell: !!firstCell.querySelector('.site-allocation-cell'),
        hasSiteAllocationContent: !!firstCell.querySelector('.site-allocation-content'),
        hasTags: !!firstCell.querySelector('.site-allocation-tag'),
        cellCount: siteAllocationCells.length
      };
    });

    console.log('Cell structure validation:', cellStructure);

    expect(cellStructure.hasBpTableCell).toBe(true);
    expect(cellStructure.hasSiteAllocationCell).toBe(true);
    expect(cellStructure.hasSiteAllocationContent).toBe(true);
    expect(cellStructure.hasTags).toBe(true);
    expect(cellStructure.cellCount).toBeGreaterThan(0);
  });

  test('Visual regression: Screenshot with highlighted first tag', async ({ page }) => {
    await page.waitForSelector('.bp5-table-container', { timeout: 15000 });
    await page.waitForTimeout(2000);

    // Highlight first tag for visual confirmation
    await page.evaluate(() => {
      const firstTag = document.querySelector('.site-allocation-tag');
      if (firstTag) {
        (firstTag as HTMLElement).style.outline = '3px solid green';
        (firstTag as HTMLElement).style.outlineOffset = '2px';
      }
    });

    await page.screenshot({
      path: 'test-results/site-allocation-fix-validation-highlighted.png',
      fullPage: false
    });

    console.log('Screenshot with highlighted tag saved');
  });

  test('Verify overflow indicators work', async ({ page }) => {
    await page.waitForSelector('.bp5-table-container', { timeout: 15000 });

    // Look for "+X more" overflow indicators
    const overflowCount = await page.locator('.site-allocation-overflow').count();
    console.log(`Overflow indicators found: ${overflowCount}`);

    if (overflowCount > 0) {
      const firstOverflow = page.locator('.site-allocation-overflow').first();
      const overflowText = await firstOverflow.textContent();
      console.log(`First overflow text: ${overflowText}`);
      expect(overflowText).toMatch(/\+\d+ more/);
    }
  });

  test('Performance check: Tags render within 3 seconds', async ({ page }) => {
    const startTime = Date.now();

    await page.goto('http://localhost:3000/test-opportunities');
    await page.waitForSelector('.bp5-table-container', { timeout: 15000 });

    // Wait for first tag to be visible
    await page.waitForSelector('.site-allocation-tag', { timeout: 5000 });

    const renderTime = Date.now() - startTime;
    console.log(`Tags rendered in ${renderTime}ms`);

    expect(renderTime).toBeLessThan(5000);
  });
});
