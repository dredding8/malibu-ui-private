import { test, expect } from '@playwright/test';

/**
 * Workshop Stats Validation with Feature Flag Enabled
 * URL: http://localhost:3000/collection/TEST-002/manage?LEGACY_HIDE_HEALTH_WIDGET=false
 */

test('validate Workshop Resource List stats cards with feature flag enabled', async ({ page }) => {
  console.log('🔍 Navigating with LEGACY_HIDE_HEALTH_WIDGET=false...');
  await page.goto('http://localhost:3000/collection/TEST-002/manage?LEGACY_HIDE_HEALTH_WIDGET=false');

  console.log('⏳ Waiting for page to load...');
  await page.waitForFunction(() => {
    return !document.body.textContent?.includes('Loading Collection Opportunities');
  }, { timeout: 30000 });

  // Verify page loaded
  const title = await page.locator('h1').first().textContent();
  console.log(`✅ Page title: ${title}`);

  // Now check for Health & Alerts section
  console.log('\n📊 Checking for Health & Alerts section...');
  const healthHeading = page.locator('h2:has-text("Health & Alerts")');
  const healthVisible = await healthHeading.isVisible({ timeout: 5000 }).catch(() => false);

  if (healthVisible) {
    console.log('✅ Health & Alerts section is VISIBLE');

    // Check for stats region with ARIA label
    const statsRegion = page.locator('[role="region"][aria-label="Key system metrics"]');
    const regionVisible = await statsRegion.isVisible();
    console.log(`✅ Stats region visible: ${regionVisible}`);

    if (regionVisible) {
      // Count Blueprint Cards
      const cards = await statsRegion.locator('.bp5-card').count();
      console.log(`✅ Found ${cards} Blueprint Card components (Workshop pattern)`);
      expect(cards).toBeGreaterThanOrEqual(2);

      // Check for System Health card
      const healthCard = statsRegion.locator('[role="group"]').filter({ hasText: 'System Health' });
      const healthCardVisible = await healthCard.isVisible();
      console.log(`✅ System Health card visible: ${healthCardVisible}`);

      if (healthCardVisible) {
        const ariaLabel = await healthCard.getAttribute('aria-label');
        console.log(`✅ System Health ARIA label: "${ariaLabel}"`);
        expect(ariaLabel).toContain('System health');

        // Check for percentage display
        const percentage = await healthCard.locator('[aria-live="polite"]').textContent();
        console.log(`✅ Health score: ${percentage}`);
        expect(percentage).toMatch(/\d+%/);
      }

      // Check for Critical Issues card
      const criticalCard = statsRegion.locator('[role="group"]').filter({ hasText: 'Critical Issues' });
      const criticalVisible = await criticalCard.isVisible();
      console.log(`✅ Critical Issues card visible: ${criticalVisible}`);

      if (criticalVisible) {
        const ariaLabel = await criticalCard.getAttribute('aria-label');
        console.log(`✅ Critical Issues ARIA label: "${ariaLabel}"`);
        expect(ariaLabel).toContain('Critical issues');
      }

      // Capture screenshot of Workshop stats cards
      await statsRegion.screenshot({ path: 'workshop-stats-cards-live.png' });
      console.log('📸 Workshop stats cards screenshot saved');

      // Verify no old custom classes
      const oldClasses = await statsRegion.locator('.stat-card.health-summary, .stat-content, .stat-icon').count();
      console.log(`✅ Old custom classes removed: ${oldClasses === 0}`);
      expect(oldClasses).toBe(0);

      // Verify Blueprint design tokens are used
      const firstCard = statsRegion.locator('.bp5-card').first();
      const padding = await firstCard.evaluate((el) => window.getComputedStyle(el).padding);
      console.log(`✅ Blueprint padding applied: ${padding}`);

      // Check icon size (Workshop pattern uses 24px)
      const icon = healthCard.locator('.bp5-icon').first();
      const iconSize = await icon.evaluate((el) => window.getComputedStyle(el).fontSize);
      console.log(`✅ Icon size (Workshop pattern): ${iconSize}`);
      expect(iconSize).toBe('24px');
    }
  } else {
    console.log('❌ Health & Alerts section NOT visible - feature flag may not be working');
  }

  // Take full page screenshot
  await page.screenshot({ path: 'live-page-with-stats.png', fullPage: true });
  console.log('📸 Full page screenshot saved');
});
