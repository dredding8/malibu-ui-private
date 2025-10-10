/**
 * Test: Verify Health & Alerts widget is hidden when LEGACY_HIDE_HEALTH_WIDGET=true
 *
 * Phase 4 Implementation Test
 */

import { test, expect } from '@playwright/test';

test.describe('Legacy Mode - Hide Health Widget', () => {
  test('should hide Health & Alerts widget when LEGACY_HIDE_HEALTH_WIDGET=true', async ({ page }) => {
    // Navigate with flag enabled
    await page.goto('http://localhost:3000/collection/DECK-1757517559289/manage?ff_LEGACY_HIDE_HEALTH_WIDGET=true');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(2000);

    // Try to find the Health & Alerts widget
    const healthWidget = page.locator('h2:has-text("Health & Alerts")');
    const widgetVisible = await healthWidget.count();

    console.log(`\n========================================`);
    console.log(`HEALTH WIDGET VISIBILITY TEST`);
    console.log(`========================================`);
    console.log(`Health & Alerts widget: ${widgetVisible === 0 ? 'HIDDEN ✅' : 'VISIBLE ❌'}`);
    console.log(`========================================\n`);

    // Widget should NOT be visible
    expect(widgetVisible).toBe(0);

    // Take screenshot
    await page.screenshot({ path: 'health-widget-hidden.png', fullPage: true });
    console.log(`Screenshot saved: health-widget-hidden.png`);
  });

  test('should show Health & Alerts widget when LEGACY_HIDE_HEALTH_WIDGET=false', async ({ page }) => {
    // Navigate WITHOUT flag (default)
    await page.goto('http://localhost:3000/collection/DECK-1757517559289/manage');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(2000);

    // Find the Health & Alerts widget
    const healthWidget = page.locator('h2:has-text("Health & Alerts")');
    const widgetVisible = await healthWidget.count();

    console.log(`\n========================================`);
    console.log(`DEFAULT MODE - HEALTH WIDGET TEST`);
    console.log(`========================================`);
    console.log(`Health & Alerts widget: ${widgetVisible > 0 ? 'VISIBLE ✅' : 'HIDDEN ❌'}`);
    console.log(`========================================\n`);

    // Widget SHOULD be visible
    expect(widgetVisible).toBeGreaterThan(0);

    // Take screenshot
    await page.screenshot({ path: 'health-widget-visible.png', fullPage: true });
    console.log(`Screenshot saved: health-widget-visible.png`);
  });

  test('visual comparison: with vs without Health widget', async ({ page }) => {
    // First, capture WITH widget (default)
    await page.goto('http://localhost:3000/collection/DECK-1757517559289/manage');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(2000);

    const withWidget = await page.locator('h2:has-text("Health & Alerts")').count();
    await page.screenshot({
      path: 'with-health-widget.png',
      clip: { x: 0, y: 0, width: 1280, height: 400 }
    });

    // Then, capture WITHOUT widget (legacy mode)
    await page.goto('http://localhost:3000/collection/DECK-1757517559289/manage?ff_LEGACY_HIDE_HEALTH_WIDGET=true');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(2000);

    const withoutWidget = await page.locator('h2:has-text("Health & Alerts")').count();
    await page.screenshot({
      path: 'without-health-widget.png',
      clip: { x: 0, y: 0, width: 1280, height: 400 }
    });

    console.log(`\n========================================`);
    console.log(`VISUAL COMPARISON`);
    console.log(`========================================`);
    console.log(`Default Mode: Widget ${withWidget > 0 ? 'PRESENT' : 'ABSENT'}`);
    console.log(`Legacy Mode:  Widget ${withoutWidget === 0 ? 'HIDDEN' : 'VISIBLE'}`);
    console.log(`\nScreenshots:`);
    console.log(`  - with-health-widget.png`);
    console.log(`  - without-health-widget.png`);
    console.log(`========================================\n`);

    // Verify the difference
    expect(withWidget).toBeGreaterThan(0);
    expect(withoutWidget).toBe(0);
  });
});
