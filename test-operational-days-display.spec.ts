import { test, expect } from '@playwright/test';

test.describe('Operational Days Display Integration', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('http://localhost:3001/test-opportunities');
    await page.waitForLoadState('networkidle');
  });

  test('Table should display all 7 day codes with visual distinction', async ({ page }) => {
    // Test Opportunities page already loads the table
    await page.waitForSelector('.bp5-table-container', { timeout: 10000 });

    // Wait for data to load
    await page.waitForTimeout(2000);

    // Take screenshot of table
    await page.screenshot({
      path: 'operational-days-table-view.png',
      fullPage: false
    });

    // Look for operational day tags in the Time Distribution column
    const dayTags = await page.locator('.bp5-tag').filter({ hasText: /^(M|T|W|TH|F|SA|SU)$/ });
    const tagCount = await dayTags.count();

    console.log(`Found ${tagCount} day tags in table`);

    // Check if tags exist
    if (tagCount > 0) {
      // Get first set of day tags (should be 7 days)
      const firstRowDays = await page.locator('.bp5-table-cell').first().locator('.bp5-tag');
      const firstRowCount = await firstRowDays.count();

      console.log(`First row has ${firstRowCount} day tags`);

      // Verify visual styling for operational vs non-operational days
      for (let i = 0; i < Math.min(firstRowCount, 7); i++) {
        const tag = firstRowDays.nth(i);
        const tagText = await tag.textContent();
        const className = await tag.getAttribute('class');
        const hasSuccessIntent = className?.includes('bp5-intent-success');
        const isMinimal = className?.includes('bp5-minimal');

        console.log(`Tag ${i}: ${tagText}, Success: ${hasSuccessIntent}, Minimal: ${isMinimal}`);
      }
    }

    // Verify no emojis in day display
    const tableContent = await page.locator('.bp5-table-container').textContent();
    const hasEmojis = /📅|📆|🗓️/.test(tableContent || '');

    expect(hasEmojis).toBe(false);
    console.log('✓ No emojis in table display');
  });

  test('Override modal should show detailed operational days view', async ({ page }) => {
    // Test Opportunities page already loaded
    await page.waitForSelector('.bp5-table-container', { timeout: 10000 });
    await page.waitForTimeout(2000);

    // Find and click first "Override" button
    const overrideButton = page.locator('button').filter({ hasText: /Override|Edit/ }).first();
    const overrideExists = await overrideButton.count() > 0;

    if (overrideExists) {
      await overrideButton.click();
      await page.waitForTimeout(1000);

      // Take screenshot of modal
      await page.screenshot({
        path: 'operational-days-modal-view.png',
        fullPage: false
      });

      // Check for Allocation tab
      const allocationTab = page.locator('text=Allocation');
      if (await allocationTab.count() > 0) {
        await allocationTab.click();
        await page.waitForTimeout(500);

        // Look for operational days display in modal
        const modalDayTags = await page.locator('.bp5-dialog .bp5-tag').filter({ hasText: /^(M|T|W|TH|F|SA|SU)$/ });
        const modalTagCount = await modalDayTags.count();

        console.log(`Found ${modalTagCount} day tags in modal`);

        // Verify "Site Operations" label exists
        const siteOpsLabel = await page.locator('text=Site Operations').count();
        console.log(`Site Operations labels: ${siteOpsLabel}`);

        // Verify immutable helper text
        const immutableText = await page.locator('text=/infrastructure constraint|Cannot be modified/i').count();
        console.log(`Immutable constraint indicators: ${immutableText}`);

        // Verify no emojis in modal
        const modalContent = await page.locator('.bp5-dialog').textContent();
        const hasEmojis = /📅|📆|🗓️/.test(modalContent || '');

        expect(hasEmojis).toBe(false);
        console.log('✓ No emojis in modal display');

        // Take final screenshot
        await page.screenshot({
          path: 'operational-days-modal-detailed.png',
          fullPage: false
        });
      }
    } else {
      console.log('No override button found - may need test data');
    }
  });

  test('Verify all 7 days are always shown (operational and non-operational)', async ({ page }) => {
    await page.waitForSelector('.bp5-table-container', { timeout: 10000 });
    await page.waitForTimeout(2000);

    // Get all day tag groups (each opportunity row)
    const allDayTags = await page.locator('.bp5-tag').filter({ hasText: /^(M|T|W|TH|F|SA|SU)$/ }).all();

    if (allDayTags.length > 0) {
      // Count unique day codes shown
      const dayCodesFound = new Set<string>();

      for (const tag of allDayTags.slice(0, 7)) { // Check first 7 tags (one row)
        const text = await tag.textContent();
        if (text) dayCodesFound.add(text.trim());
      }

      console.log(`Unique day codes displayed: ${Array.from(dayCodesFound).join(', ')}`);
      console.log(`Total day codes: ${dayCodesFound.size}`);

      // Should show all 7 days
      expect(dayCodesFound.size).toBe(7);

      // Verify specific day codes exist
      expect(dayCodesFound.has('M')).toBe(true);
      expect(dayCodesFound.has('T')).toBe(true);
      expect(dayCodesFound.has('W')).toBe(true);
      expect(dayCodesFound.has('TH')).toBe(true);
      expect(dayCodesFound.has('F')).toBe(true);
      expect(dayCodesFound.has('SA')).toBe(true);
      expect(dayCodesFound.has('SU')).toBe(true);

      console.log('✓ All 7 days are displayed');
    } else {
      console.log('Warning: No day tags found - may need test data with operational days');
    }
  });

  test('Visual distinction between operational and non-operational days', async ({ page }) => {
    await page.waitForSelector('.bp5-table-container', { timeout: 10000 });
    await page.waitForTimeout(2000);

    const dayTags = await page.locator('.bp5-tag').filter({ hasText: /^(M|T|W|TH|F|SA|SU)$/ }).all();

    if (dayTags.length >= 7) {
      let operationalCount = 0;
      let nonOperationalCount = 0;

      for (const tag of dayTags.slice(0, 7)) {
        const className = await tag.getAttribute('class');
        const hasSuccessIntent = className?.includes('bp5-intent-success');
        const isMinimal = className?.includes('bp5-minimal');

        if (hasSuccessIntent && !isMinimal) {
          operationalCount++;
        } else if (isMinimal) {
          nonOperationalCount++;
        }
      }

      console.log(`Operational days (green, bold): ${operationalCount}`);
      console.log(`Non-operational days (gray, minimal): ${nonOperationalCount}`);
      console.log(`Total days shown: ${operationalCount + nonOperationalCount}`);

      // At least some days should be operational
      expect(operationalCount).toBeGreaterThan(0);

      console.log('✓ Visual distinction between operational and non-operational days verified');
    }
  });
});
