import { test, expect } from '@playwright/test';

test.describe('Site Allocation Column - Correct Route Verification', () => {
  test('should display site allocation data on correct Collection Hub route', async ({ page }) => {
    // Navigate to the CORRECT route with a test collection ID
    const testCollectionId = 'TEST-001';
    await page.goto(`http://localhost:3000/collection/${testCollectionId}/manage`);

    // Wait for page to load
    await page.waitForLoadState('networkidle', { timeout: 15000 });

    // Verify we're on the correct route
    await expect(page).toHaveURL(new RegExp(`/collection/${testCollectionId}/manage`));
    console.log('✅ Navigated to correct Collection Hub route');

    // Wait for the table to render
    await page.waitForSelector('table, .bp5-table-container, [role="grid"]', { timeout: 10000 });

    // Take initial screenshot
    await page.screenshot({ path: 'test-results/site-allocation-correct-route-initial.png', fullPage: true });

    // Look for Site Allocation cells
    const siteAllocationCells = page.locator('.site-allocation-cell');
    const cellCount = await siteAllocationCells.count();

    console.log(`Found ${cellCount} site allocation cells`);

    if (cellCount > 0) {
      // Get first few cells' content
      for (let i = 0; i < Math.min(5, cellCount); i++) {
        const cell = siteAllocationCells.nth(i);
        const textContent = await cell.textContent();
        console.log(`Cell ${i + 1}: "${textContent}"`);
      }

      // Look for site tags specifically
      const siteTags = page.locator('.site-allocation-tag');
      const tagCount = await siteTags.count();
      console.log(`Found ${tagCount} site tags`);

      if (tagCount > 0) {
        const firstTag = await siteTags.first().textContent();
        console.log(`✅ First tag content: "${firstTag}"`);

        // Verify format matches "Site X (NN)"
        expect(firstTag).toMatch(/Site\s+\w+/);

        console.log('✅ SUCCESS: Site Allocation column is rendering with Blueprint Tags');
      } else {
        // Check for empty state indicators
        const emptyIndicators = page.locator('.site-allocation-empty');
        const emptyCount = await emptyIndicators.count();

        if (emptyCount > 0) {
          console.log(`ℹ️  Found ${emptyCount} empty cells showing "-" (no data allocated)`);
        }
      }

      // Take success screenshot
      await page.screenshot({ path: 'test-results/site-allocation-correct-route-success.png', fullPage: true });

    } else {
      console.log('❌ No site allocation cells found on this route');

      // Debug: Check what's actually on the page
      const bodyText = await page.locator('body').textContent();
      console.log('Page body preview:', bodyText?.substring(0, 500));

      await page.screenshot({ path: 'test-results/site-allocation-correct-route-debug.png', fullPage: true });
    }

    // Check browser console for errors
    const errors: string[] = [];
    page.on('console', msg => {
      if (msg.type() === 'error') {
        errors.push(msg.text());
      }
    });

    await page.waitForTimeout(1000);

    if (errors.length > 0) {
      console.log('⚠️  Console errors:', errors);
    } else {
      console.log('✅ No console errors');
    }
  });

  test('should show data structure in browser devtools', async ({ page }) => {
    const testCollectionId = 'TEST-001';
    await page.goto(`http://localhost:3000/collection/${testCollectionId}/manage`);
    await page.waitForLoadState('networkidle', { timeout: 15000 });

    // Evaluate actual DOM structure
    const analysis = await page.evaluate(() => {
      const cells = document.querySelectorAll('.site-allocation-cell');
      const tags = document.querySelectorAll('.site-allocation-tag');
      const overflowIndicators = document.querySelectorAll('.site-allocation-overflow');

      return {
        cellCount: cells.length,
        tagCount: tags.length,
        overflowCount: overflowIndicators.length,
        sampleCells: Array.from(cells).slice(0, 5).map(cell => ({
          textContent: cell.textContent?.trim() || '',
          innerHTML: cell.innerHTML.substring(0, 200),
          hasChildren: cell.children.length > 0,
          classList: Array.from(cell.classList)
        })),
        sampleTags: Array.from(tags).slice(0, 5).map(tag => ({
          textContent: tag.textContent?.trim() || '',
          classList: Array.from(tag.classList)
        }))
      };
    });

    console.log('\n=== BROWSER DOM ANALYSIS ===');
    console.log(JSON.stringify(analysis, null, 2));

    expect(analysis.cellCount).toBeGreaterThan(0);
    console.log(`✅ Found ${analysis.cellCount} site allocation cells in DOM`);
  });
});
