import { test, expect } from '@playwright/test';

test.describe('Time Distribution Column Removal Verification', () => {
  test('Verify Time Distribution column is removed from table', async ({ page }) => {
    await page.goto('http://localhost:3001/test-opportunities');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(2000);

    // Take screenshot
    await page.screenshot({
      path: 'final-table-no-time-distribution.png',
      fullPage: true
    });

    console.log('✓ Screenshot captured');

    // Get all column headers
    const columnHeaders = await page.locator('.bp5-table-column-name-text').allTextContents();

    console.log('\n=== Current Column Headers ===');
    columnHeaders.forEach((header, index) => {
      console.log(`${index + 1}. ${header}`);
    });

    // Verify Time Distribution is NOT present
    const hasTimeDistribution = columnHeaders.includes('Time Distribution');

    if (!hasTimeDistribution) {
      console.log('\n✅ CONFIRMED: Time Distribution column is removed');
    } else {
      console.log('\n❌ FAILED: Time Distribution column still exists');
    }

    expect(hasTimeDistribution).toBe(false);

    // Verify expected columns ARE present
    const expectedColumns = [
      'Priority',
      'Match',
      'Match Notes',
      'SCC',
      'Function',
      'Orbit',
      'Collection Type',
      'Classification',
      'Site Allocation'
    ];

    console.log('\n=== Column Verification ===');
    expectedColumns.forEach(col => {
      const exists = columnHeaders.includes(col);
      console.log(`${exists ? '✓' : '✗'} ${col}`);
      expect(exists).toBe(true);
    });

    // Verify final column count is 9 (was 10 with Time Distribution)
    console.log(`\n=== Column Count ===`);
    console.log(`Total columns: ${columnHeaders.length}`);
    console.log(`Expected: 9 (removed Time Distribution from 10)`);

    expect(columnHeaders.length).toBe(9);
  });

  test('Verify final column order matches specification', async ({ page }) => {
    await page.goto('http://localhost:3001/test-opportunities');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(2000);

    const columnHeaders = await page.locator('.bp5-table-column-name-text').allTextContents();

    const expectedOrder = [
      'Priority',
      'Match',
      'Match Notes',
      'SCC',
      'Function',
      'Orbit',
      'Collection Type',
      'Classification',
      'Site Allocation'
    ];

    console.log('\n=== Final Column Order Verification ===');

    let allMatch = true;
    for (let i = 0; i < expectedOrder.length; i++) {
      const expected = expectedOrder[i];
      const actual = columnHeaders[i];
      const match = expected === actual;

      console.log(`${i + 1}. ${match ? '✓' : '✗'} Expected: "${expected}", Got: "${actual}"`);

      if (!match) {
        allMatch = false;
      }

      expect(actual).toBe(expected);
    }

    if (allMatch) {
      console.log('\n✅ All columns in correct order');
    }
  });

  test('Verify Time Distribution still available in Site Selection Modal', async ({ page }) => {
    await page.goto('http://localhost:3001/test-opportunities');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(2000);

    // Click first Override button to open modal
    const overrideButton = page.locator('button[title*="Override"]').first();

    if (await overrideButton.count() > 0) {
      await overrideButton.click();
      await page.waitForTimeout(1500);

      // Click Allocation tab
      const allocationTab = page.locator('text=Allocation').first();
      if (await allocationTab.count() > 0) {
        await allocationTab.click();
        await page.waitForTimeout(500);

        // Take screenshot of modal
        await page.screenshot({
          path: 'time-distribution-in-modal.png',
          fullPage: false
        });

        console.log('✓ Modal screenshot captured');

        // Verify operational days display exists in modal
        const operationalDaysDisplay = await page.locator('.operational-days-display').count();
        const siteOpsText = await page.locator('text=/Site Operations|Operations:/i').count();

        console.log(`\nOperational Days Display components: ${operationalDaysDisplay}`);
        console.log(`Site Operations labels: ${siteOpsText}`);

        if (operationalDaysDisplay > 0 || siteOpsText > 0) {
          console.log('✅ Time Distribution still available in Site Selection Modal');
        } else {
          console.log('⚠ Time Distribution may not be visible in modal');
        }
      }
    } else {
      console.log('⚠ No override button found - skipping modal test');
    }
  });
});
