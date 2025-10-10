/**
 * Simple test to verify button reduction in legacy mode
 */

import { test, expect } from '@playwright/test';

test.describe('Legacy Simple Table Actions - Button Count Test', () => {
  test('count buttons with legacy mode enabled', async ({ page }) => {
    await page.goto('http://localhost:3000/collection/DECK-1757517559289/manage?ff_LEGACY_SIMPLE_TABLE_ACTIONS=true');

    // Wait for page to fully load
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(3000);

    // Scroll down to see the table
    await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight));
    await page.waitForTimeout(1000);

    // Count all buttons
    const allButtons = await page.locator('button').count();
    console.log(`\n========================================`);
    console.log(`LEGACY MODE (LEGACY_SIMPLE_TABLE_ACTIONS=true)`);
    console.log(`========================================`);
    console.log(`Total buttons: ${allButtons}`);

    // Take screenshot
    await page.screenshot({ path: 'legacy-mode-buttons.png', fullPage: true });

    console.log(`Screenshot saved: legacy-mode-buttons.png`);
    console.log(`========================================\n`);
  });

  test('count buttons with legacy mode disabled', async ({ page }) => {
    await page.goto('http://localhost:3000/collection/DECK-1757517559289/manage?ff_LEGACY_SIMPLE_TABLE_ACTIONS=false');

    // Wait for page to fully load
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(3000);

    // Scroll down to see the table
    await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight));
    await page.waitForTimeout(1000);

    // Count all buttons
    const allButtons = await page.locator('button').count();
    console.log(`\n========================================`);
    console.log(`DEFAULT MODE (LEGACY_SIMPLE_TABLE_ACTIONS=false)`);
    console.log(`========================================`);
    console.log(`Total buttons: ${allButtons}`);

    // Take screenshot
    await page.screenshot({ path: 'default-mode-buttons.png', fullPage: true });

    console.log(`Screenshot saved: default-mode-buttons.png`);
    console.log(`========================================\n`);
  });

  test('verify button icons - find Edit, Refresh, More buttons', async ({ page }) => {
    console.log(`\n========================================`);
    console.log(`BUTTON ICON ANALYSIS`);
    console.log(`========================================\n`);

    // Test with legacy mode OFF (default)
    await page.goto('http://localhost:3000/collection/DECK-1757517559289/manage');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(3000);

    // Try different selectors to find action buttons
    const editButtons1 = await page.locator('button').filter({ hasText: 'Edit' }).count();
    const editButtons2 = await page.locator('[data-icon="edit"]').count();
    const editButtons3 = await page.locator('svg[data-icon="edit"]').count();

    console.log(`Default Mode - Edit buttons:`);
    console.log(`  - hasText('Edit'): ${editButtons1}`);
    console.log(`  - [data-icon="edit"]: ${editButtons2}`);
    console.log(`  - svg[data-icon="edit"]: ${editButtons3}`);

    const moreButtons1 = await page.locator('[data-icon="more"]').count();
    const moreButtons2 = await page.locator('svg[data-icon="more"]').count();

    console.log(`\nDefault Mode - More buttons:`);
    console.log(`  - [data-icon="more"]: ${moreButtons1}`);
    console.log(`  - svg[data-icon="more"]: ${moreButtons2}`);

    // Now test with legacy mode ON
    await page.goto('http://localhost:3000/collection/DECK-1757517559289/manage?ff_LEGACY_SIMPLE_TABLE_ACTIONS=true');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(3000);

    const legacyEdit1 = await page.locator('button').filter({ hasText: 'Edit' }).count();
    const legacyEdit2 = await page.locator('[data-icon="edit"]').count();
    const legacyEdit3 = await page.locator('svg[data-icon="edit"]').count();

    console.log(`\nLegacy Mode - Edit buttons:`);
    console.log(`  - hasText('Edit'): ${legacyEdit1}`);
    console.log(`  - [data-icon="edit"]: ${legacyEdit2}`);
    console.log(`  - svg[data-icon="edit"]: ${legacyEdit3}`);

    const legacyMore1 = await page.locator('[data-icon="more"]').count();
    const legacyMore2 = await page.locator('svg[data-icon="more"]').count();

    console.log(`\nLegacy Mode - More buttons:`);
    console.log(`  - [data-icon="more"]: ${legacyMore1}`);
    console.log(`  - svg[data-icon="more"]: ${legacyMore2}`);

    console.log(`\n========================================\n`);

    // Verify reduction
    expect(legacyEdit3).toBeLessThan(editButtons3);
    expect(legacyMore2).toBeLessThan(moreButtons2);
  });
});
