import { test, expect } from '@playwright/test';

test.describe('Operational Days Visual Verification', () => {
  test('Capture operational days display in table and modal', async ({ page }) => {
    // Navigate to test page
    await page.goto('http://localhost:3001/test-opportunities');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(2000);

    // Take initial screenshot
    await page.screenshot({
      path: 'operational-days-initial-view.png',
      fullPage: true
    });

    console.log('✓ Initial page screenshot captured');

    // Scroll table to the right to see Time Distribution column
    const table = page.locator('.bp5-table-container').first();
    await table.evaluate((el) => {
      const scrollContainer = el.querySelector('.bp5-table-quadrant-scroll-container');
      if (scrollContainer) {
        scrollContainer.scrollLeft = scrollContainer.scrollWidth;
      }
    });

    await page.waitForTimeout(1000);

    // Take screenshot of scrolled table
    await page.screenshot({
      path: 'operational-days-table-scrolled.png',
      fullPage: false
    });

    console.log('✓ Scrolled table screenshot captured');

    // Click first Override button to open modal
    const overrideButton = page.locator('button[title*="Override"]').first();
    if (await overrideButton.count() > 0) {
      await overrideButton.click();
      await page.waitForTimeout(1500);

      // Take screenshot of modal
      await page.screenshot({
        path: 'operational-days-modal-opened.png',
        fullPage: false
      });

      console.log('✓ Modal opened screenshot captured');

      // Click Allocation tab if it exists
      const allocationTab = page.locator('text=Allocation').first();
      if (await allocationTab.count() > 0) {
        await allocationTab.click();
        await page.waitForTimeout(500);

        // Take screenshot of allocation tab
        await page.screenshot({
          path: 'operational-days-allocation-tab.png',
          fullPage: false
        });

        console.log('✓ Allocation tab screenshot captured');

        // Look for operational days tags
        const dayTags = await page.locator('.bp5-tag').filter({ hasText: /^(M|T|W|TH|F|SA|SU)$/ }).count();
        console.log(`Found ${dayTags} day tags in modal`);

        // Check for operational days display component
        const operationalDaysDisplay = await page.locator('.operational-days-display').count();
        console.log(`Found ${operationalDaysDisplay} operational days display components`);

        // Get all visible tags
        const allTags = await page.locator('.bp5-tag').allTextContents();
        console.log(`All visible tags: ${allTags.slice(0, 20).join(', ')}`);

        // Verify no emojis
        const modalText = await page.locator('.bp5-dialog').textContent();
        const hasEmojis = /📅|📆|🗓️/.test(modalText || '');
        console.log(`Emojis in modal: ${hasEmojis ? 'YES ❌' : 'NO ✓'}`);

        // Verify "Site Operations" or "Site infrastructure constraint" text
        const siteOpsText = await page.locator('text=/Site Operations|infrastructure constraint/i').count();
        console.log(`Site operations labels: ${siteOpsText}`);
      }
    } else {
      console.log('⚠ No override button found');
    }

    console.log('\n=== Visual Test Complete ===');
    console.log('Screenshots saved:');
    console.log('  - operational-days-initial-view.png');
    console.log('  - operational-days-table-scrolled.png');
    console.log('  - operational-days-modal-opened.png');
    console.log('  - operational-days-allocation-tab.png');
  });

  test('Verify operational days data structure', async ({ page }) => {
    await page.goto('http://localhost:3001/test-opportunities');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(2000);

    // Check page structure
    const pageContent = await page.evaluate(() => {
      // Look for operational days in window or component state
      const results: any = {
        hasTable: !!document.querySelector('.bp5-table-container'),
        hasTimeDistColumn: !!document.querySelector('[data-column-id*="time"]'),
        tableCells: [],
        reactComponents: []
      };

      // Get table cells
      const cells = document.querySelectorAll('.bp5-table-cell');
      results.cellCount = cells.length;

      // Look for day tags
      const tags = document.querySelectorAll('.bp5-tag');
      results.tagTexts = Array.from(tags).slice(0, 20).map(t => t.textContent);

      return results;
    });

    console.log('Page Structure:', JSON.stringify(pageContent, null, 2));

    expect(pageContent.hasTable).toBe(true);
  });
});
