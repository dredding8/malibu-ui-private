/**
 * Test: Verify Edit/Refresh/More buttons are hidden when LEGACY_SIMPLE_TABLE_ACTIONS=true
 *
 * Phase 2 Implementation Test
 */

import { test, expect } from '@playwright/test';

test.describe('Legacy Mode - Simple Table Actions', () => {
  test('should hide Edit, Refresh, and More buttons when LEGACY_SIMPLE_TABLE_ACTIONS=true', async ({ page }) => {
    // Navigate to page with feature flag enabled
    await page.goto('http://localhost:3000/collection/DECK-1757517559289/manage?ff_LEGACY_SIMPLE_TABLE_ACTIONS=true');

    // Wait for table to load
    await page.waitForSelector('.bp5-table', { timeout: 10000 });

    // Wait for opportunities to render
    await page.waitForTimeout(2000);

    // Count all buttons on page
    const allButtons = await page.locator('button').count();
    console.log(`Total buttons found: ${allButtons}`);

    // Count EDIT buttons (should be 0 in legacy mode)
    const editButtons = await page.locator('button[icon="edit"], button svg[data-icon="edit"]').count();
    console.log(`Edit buttons found: ${editButtons}`);

    // Count REFRESH buttons (should be 0 in legacy mode)
    const refreshButtons = await page.locator('button[icon="refresh"], button svg[data-icon="refresh"]').count();
    console.log(`Refresh buttons found: ${refreshButtons}`);

    // Count MORE (...) buttons (should be 0 in legacy mode)
    const moreButtons = await page.locator('button[icon="more"], button svg[data-icon="more"]').count();
    console.log(`More buttons found: ${moreButtons}`);

    // Verify Override buttons are still visible (should be ~50)
    const overrideButtons = await page.locator('button:has-text("Override"), button[title*="Override"], button[aria-label*="Override"]').count();
    console.log(`Override buttons found: ${overrideButtons}`);

    // Assertions
    expect(editButtons).toBe(0); // ✅ Edit buttons should be hidden
    expect(refreshButtons).toBe(0); // ✅ Refresh buttons should be hidden
    expect(moreButtons).toBe(0); // ✅ More buttons should be hidden
    expect(overrideButtons).toBeGreaterThan(40); // ✅ Override buttons should still be visible

    // Total button count should be significantly reduced
    // Before: ~213 buttons | After: ~60 buttons
    expect(allButtons).toBeLessThan(100);
    console.log(`\n✅ Button count reduced from ~213 to ${allButtons}`);
  });

  test('should show all buttons when LEGACY_SIMPLE_TABLE_ACTIONS=false (default)', async ({ page }) => {
    // Navigate to page WITHOUT feature flag
    await page.goto('http://localhost:3000/collection/DECK-1757517559289/manage');

    // Wait for table to load
    await page.waitForSelector('.bp5-table', { timeout: 10000 });
    await page.waitForTimeout(2000);

    // Count all buttons on page
    const allButtons = await page.locator('button').count();
    console.log(`Total buttons found (default mode): ${allButtons}`);

    // Count EDIT buttons (should be ~50)
    const editButtons = await page.locator('button[icon="edit"], button svg[data-icon="edit"]').count();
    console.log(`Edit buttons found: ${editButtons}`);

    // Count REFRESH buttons (should be ~50)
    const refreshButtons = await page.locator('button[icon="refresh"], button svg[data-icon="refresh"]').count();
    console.log(`Refresh buttons found: ${refreshButtons}`);

    // Count MORE buttons (should be ~50)
    const moreButtons = await page.locator('button[icon="more"], button svg[data-icon="more"]').count();
    console.log(`More buttons found: ${moreButtons}`);

    // Assertions - buttons should be visible
    expect(editButtons).toBeGreaterThan(40);
    expect(refreshButtons).toBeGreaterThan(40);
    expect(moreButtons).toBeGreaterThan(40);

    console.log(`\n✅ All action buttons visible in default mode`);
  });

  test('visual comparison: legacy vs default mode', async ({ page }) => {
    // First, capture legacy mode
    await page.goto('http://localhost:3000/collection/DECK-1757517559289/manage?ff_LEGACY_SIMPLE_TABLE_ACTIONS=true');
    await page.waitForSelector('.bp5-table', { timeout: 10000 });
    await page.waitForTimeout(2000);

    const legacyButtons = await page.locator('button').count();
    const legacyEdit = await page.locator('button svg[data-icon="edit"]').count();
    const legacyRefresh = await page.locator('button svg[data-icon="refresh"]').count();
    const legacyMore = await page.locator('button svg[data-icon="more"]').count();

    // Then, capture default mode
    await page.goto('http://localhost:3000/collection/DECK-1757517559289/manage');
    await page.waitForSelector('.bp5-table', { timeout: 10000 });
    await page.waitForTimeout(2000);

    const defaultButtons = await page.locator('button').count();
    const defaultEdit = await page.locator('button svg[data-icon="edit"]').count();
    const defaultRefresh = await page.locator('button svg[data-icon="refresh"]').count();
    const defaultMore = await page.locator('button svg[data-icon="more"]').count();

    // Generate comparison report
    console.log(`\n========================================`);
    console.log(`BUTTON COUNT COMPARISON`);
    console.log(`========================================`);
    console.log(`Total Buttons:`);
    console.log(`  Default Mode: ${defaultButtons}`);
    console.log(`  Legacy Mode:  ${legacyButtons}`);
    console.log(`  Reduction:    ${defaultButtons - legacyButtons} buttons (${Math.round((1 - legacyButtons/defaultButtons) * 100)}%)`);
    console.log(`\nEdit Buttons:`);
    console.log(`  Default: ${defaultEdit} | Legacy: ${legacyEdit}`);
    console.log(`\nRefresh Buttons:`);
    console.log(`  Default: ${defaultRefresh} | Legacy: ${legacyRefresh}`);
    console.log(`\nMore Buttons:`);
    console.log(`  Default: ${defaultMore} | Legacy: ${legacyMore}`);
    console.log(`========================================\n`);

    // Verify significant reduction
    expect(legacyButtons).toBeLessThan(defaultButtons * 0.5); // At least 50% reduction
    expect(legacyEdit).toBe(0);
    expect(legacyRefresh).toBe(0);
    expect(legacyMore).toBe(0);
  });
});
