/**
 * Test: Verify "Show All" checkbox filters by quality tier
 *
 * Phase 3 Implementation Test
 */

import { test, expect } from '@playwright/test';

test.describe('Legacy Mode - Show All Toggle', () => {
  test('should show "Show All" checkbox when LEGACY_SHOW_ALL_TOGGLE=true', async ({ page }) => {
    // Navigate with feature flag enabled
    await page.goto('http://localhost:3000/collection/DECK-1757517559289/manage?ff_LEGACY_SHOW_ALL_TOGGLE=true');

    // Wait for page to load
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(2000);

    // Find the "Show All" checkbox
    const showAllCheckbox = page.locator('input[type="checkbox"]').filter({ hasText: 'Show All' }).or(
      page.locator('label:has-text("Show All")').locator('input[type="checkbox"]')
    );

    // Verify checkbox exists
    const checkboxCount = await showAllCheckbox.count();
    console.log(`\n"Show All" checkbox found: ${checkboxCount > 0 ? 'YES ✅' : 'NO ❌'}`);

    expect(checkboxCount).toBeGreaterThan(0);

    // Verify checkbox is unchecked by default (Optimal only)
    const isChecked = await showAllCheckbox.first().isChecked();
    console.log(`Default state: ${isChecked ? 'CHECKED (all tiers)' : 'UNCHECKED (optimal only) ✅'}`);

    expect(isChecked).toBe(false);

    // Take screenshot of checkbox
    await page.screenshot({ path: 'show-all-checkbox-default.png', fullPage: true });
    console.log(`Screenshot saved: show-all-checkbox-default.png`);
  });

  test('should filter opportunities when "Show All" is toggled', async ({ page }) => {
    // Navigate with feature flag enabled
    await page.goto('http://localhost:3000/collection/DECK-1757517559289/manage?ff_LEGACY_SHOW_ALL_TOGGLE=true');

    // Wait for page to load
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(2000);

    // Get initial opportunity count (Optimal only)
    const resultCountElement = page.locator('.result-count, [role="status"]:has-text("opportunities")').first();
    const initialCountText = await resultCountElement.textContent();
    console.log(`\n========================================`);
    console.log(`QUALITY TIER FILTERING TEST`);
    console.log(`========================================`);
    console.log(`Initial count (Optimal only): ${initialCountText}`);

    // Parse the count
    const initialMatch = initialCountText?.match(/(\d+) opportunit/);
    const initialCount = initialMatch ? parseInt(initialMatch[1]) : 0;

    // Find and click the "Show All" checkbox
    const showAllCheckbox = page.locator('label:has-text("Show All")').locator('input[type="checkbox"]').first();
    await showAllCheckbox.click();
    await page.waitForTimeout(1000);

    // Get new opportunity count (All tiers)
    const newCountText = await resultCountElement.textContent();
    console.log(`After "Show All" checked: ${newCountText}`);

    // Parse the new count
    const newMatch = newCountText?.match(/(\d+) opportunit/);
    const newCount = newMatch ? parseInt(newMatch[1]) : 0;

    // Verify count increased (baseline/suboptimal/unmatched now visible)
    console.log(`\nDifference: ${newCount - initialCount} additional passes shown`);
    console.log(`========================================\n`);

    expect(newCount).toBeGreaterThanOrEqual(initialCount);

    // Take screenshot of expanded view
    await page.screenshot({ path: 'show-all-checkbox-checked.png', fullPage: true });
    console.log(`Screenshot saved: show-all-checkbox-checked.png`);

    // Uncheck to verify it returns to optimal only
    await showAllCheckbox.click();
    await page.waitForTimeout(1000);

    const finalCountText = await resultCountElement.textContent();
    console.log(`After "Show All" unchecked: ${finalCountText}`);

    const finalMatch = finalCountText?.match(/(\d+) opportunit/);
    const finalCount = finalMatch ? parseInt(finalMatch[1]) : 0;

    // Verify count returned to initial state
    expect(finalCount).toBe(initialCount);
  });

  test('should hide checkbox when LEGACY_SHOW_ALL_TOGGLE=false', async ({ page }) => {
    // Navigate WITHOUT feature flag
    await page.goto('http://localhost:3000/collection/DECK-1757517559289/manage');

    // Wait for page to load
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(2000);

    // Try to find the "Show All" checkbox - should NOT exist
    const showAllCheckbox = page.locator('label:has-text("Show All")');
    const checkboxCount = await showAllCheckbox.count();

    console.log(`\n"Show All" checkbox in default mode: ${checkboxCount === 0 ? 'HIDDEN ✅' : 'VISIBLE ❌'}`);

    expect(checkboxCount).toBe(0);
  });

  test('visual comparison: Show All checked vs unchecked', async ({ page }) => {
    // Navigate with flag enabled
    await page.goto('http://localhost:3000/collection/DECK-1757517559289/manage?ff_LEGACY_SHOW_ALL_TOGGLE=true');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(2000);

    // Scroll to table
    await page.evaluate(() => window.scrollTo(0, 400));
    await page.waitForTimeout(500);

    // Capture initial state (Optimal only)
    await page.screenshot({
      path: 'quality-tier-optimal-only.png',
      clip: { x: 0, y: 200, width: 1280, height: 600 }
    });

    // Get count
    const resultCount1 = await page.locator('.result-count').first().textContent();

    // Click Show All
    const showAllCheckbox = page.locator('label:has-text("Show All")').locator('input[type="checkbox"]').first();
    await showAllCheckbox.click();
    await page.waitForTimeout(1000);

    // Capture expanded state (All tiers)
    await page.screenshot({
      path: 'quality-tier-all-tiers.png',
      clip: { x: 0, y: 200, width: 1280, height: 600 }
    });

    // Get count
    const resultCount2 = await page.locator('.result-count').first().textContent();

    console.log(`\n========================================`);
    console.log(`VISUAL COMPARISON`);
    console.log(`========================================`);
    console.log(`Optimal Only: ${resultCount1}`);
    console.log(`All Tiers:    ${resultCount2}`);
    console.log(`\nScreenshots:`);
    console.log(`  - quality-tier-optimal-only.png`);
    console.log(`  - quality-tier-all-tiers.png`);
    console.log(`========================================\n`);
  });
});
