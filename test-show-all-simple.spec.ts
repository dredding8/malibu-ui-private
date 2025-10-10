/**
 * Simple test for Show All toggle - click the label directly
 */

import { test, expect } from '@playwright/test';

test.describe('Show All Toggle - Simple Test', () => {
  test('verify Show All checkbox exists and can be toggled', async ({ page }) => {
    // Navigate with flag
    await page.goto('http://localhost:3000/collection/DECK-1757517559289/manage?ff_LEGACY_SHOW_ALL_TOGGLE=true');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(2000);

    // Find the checkbox label
    const showAllLabel = page.locator('label:has-text("Show All")');

    // Verify it exists
    await expect(showAllLabel).toBeVisible();
    console.log('\n✅ "Show All" checkbox label is visible');

    // Get the checkbox input
    const checkbox = page.locator('.legacy-show-all-toggle input[type="checkbox"]');

    // Verify initial state (unchecked)
    await expect(checkbox).not.toBeChecked();
    console.log('✅ Checkbox is unchecked by default');

    // Take screenshot before
    await page.screenshot({ path: 'show-all-before.png', fullPage: true });

    // Click the LABEL (not the checkbox directly)
    await showAllLabel.click({ force: true });
    await page.waitForTimeout(1000);

    // Verify checked
    await expect(checkbox).toBeChecked();
    console.log('✅ Checkbox is now checked');

    // Take screenshot after
    await page.screenshot({ path: 'show-all-after.png', fullPage: true });

    // Click again to uncheck
    await showAllLabel.click({ force: true });
    await page.waitForTimeout(1000);

    // Verify unchecked
    await expect(checkbox).not.toBeChecked();
    console.log('✅ Checkbox is unchecked again\n');
  });
});
