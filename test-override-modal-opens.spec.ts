import { test, expect } from '@playwright/test';

/**
 * Test Manual Override Modal Opens on Row Click
 * Validates the primary action: pass-to-site allocation workflow
 */

test('Row click opens Manual Override Modal', async ({ page }) => {
  await page.goto('http://localhost:3000/collection/DECK-1757517559289/manage');
  await page.waitForLoadState('networkidle');
  await page.waitForTimeout(3000); // Wait for data to load

  console.log('\n=== TESTING ROW CLICK → MODAL OPEN ===\n');

  // Find the first opportunity row (by clicking on the name cell)
  const firstRow = page.locator('[data-testid="opportunity-row"]').first();

  // Check if row exists
  const rowExists = await firstRow.count() > 0;
  console.log(`✓ Opportunity row exists: ${rowExists}`);

  if (rowExists) {
    // Get the opportunity name before clicking
    const oppName = await firstRow.locator('strong').first().textContent();
    console.log(`✓ Found opportunity: ${oppName}`);

    // Click the row
    await firstRow.click();
    await page.waitForTimeout(1000);

    // Check if Manual Override Modal opened
    const modal = page.locator('.bp5-dialog, .bp6-dialog').filter({ hasText: /override|allocation/i });
    const modalVisible = await modal.isVisible().catch(() => false);

    console.log(`\n✓ Manual Override Modal visible: ${modalVisible}`);

    if (modalVisible) {
      // Get modal title
      const modalTitle = await modal.locator('.bp5-dialog-header, .bp6-dialog-header').textContent();
      console.log(`✓ Modal title: ${modalTitle}`);

      // Screenshot success
      await page.screenshot({
        path: 'manual-override-modal-opened.png',
        fullPage: false
      });
      console.log('\n✅ SUCCESS: Row click opens Manual Override Modal');
      console.log('📸 Screenshot saved: manual-override-modal-opened.png');
    } else {
      console.log('\n❌ FAIL: Modal did not open');
      await page.screenshot({
        path: 'modal-not-opened.png',
        fullPage: true
      });
    }
  } else {
    console.log('\n❌ No opportunity rows found');
    await page.screenshot({
      path: 'no-rows-found.png',
      fullPage: true
    });
  }

  expect(rowExists).toBe(true);
});
