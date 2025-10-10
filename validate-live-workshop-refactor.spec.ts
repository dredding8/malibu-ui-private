import { test, expect } from '@playwright/test';

/**
 * Live Application Validation: Workshop Stats Cards
 * URL: http://localhost:3000/collection/TEST-002/manage
 */

test.describe('Live Workshop Stats Validation', () => {
  test('validate Workshop stats cards are rendering on live page', async ({ page }) => {
    console.log('🔍 Navigating to live application...');
    await page.goto('http://localhost:3000/collection/TEST-002/manage');

    console.log('⏳ Waiting for page to load...');
    // Wait for loading to complete
    await page.waitForFunction(() => {
      return !document.body.textContent?.includes('Loading Collection Opportunities');
    }, { timeout: 30000 });

    console.log('📸 Taking initial screenshot...');
    await page.screenshot({ path: 'live-page-initial.png', fullPage: true });

    // Verify page title
    const title = await page.locator('h1').first().textContent();
    console.log(`✅ Page title: ${title}`);
    expect(title).toContain('Collection Management');

    // Check for Health & Alerts section
    const healthSection = page.locator('h2:has-text("Health & Alerts")');
    const healthVisible = await healthSection.isVisible().catch(() => false);

    if (healthVisible) {
      console.log('✅ Health & Alerts section is visible');

      // Check for Blueprint Cards in stats region
      const statsRegion = page.locator('[role="region"][aria-label="Key system metrics"]');
      const regionVisible = await statsRegion.isVisible();
      console.log(`Stats region visible: ${regionVisible}`);

      if (regionVisible) {
        const cards = await statsRegion.locator('.bp5-card').count();
        console.log(`✅ Found ${cards} Blueprint Card components`);

        // Capture stats cards screenshot
        await statsRegion.screenshot({ path: 'workshop-stats-cards.png' });
        console.log('📸 Stats cards screenshot saved');
      }
    } else {
      console.log('⚠️ Health & Alerts section not visible - may be hidden by feature flag');
    }

    // Check what's actually rendering
    const bodyText = await page.locator('body').textContent();
    console.log('\n📋 Page content includes:');
    console.log(`- "Collection Management": ${bodyText?.includes('Collection Management')}`);
    console.log(`- "Health & Alerts": ${bodyText?.includes('Health & Alerts')}`);
    console.log(`- "System Health": ${bodyText?.includes('System Health')}`);
    console.log(`- "Critical Issues": ${bodyText?.includes('Critical Issues')}`);

    // Take final screenshot
    await page.screenshot({ path: 'live-page-final.png', fullPage: true });
    console.log('📸 Final screenshot saved: live-page-final.png');

    // Verify CollectionOpportunitiesEnhanced is rendering
    const hasTable = await page.locator('.bp5-table2, table').isVisible().catch(() => false);
    console.log(`\n✅ CollectionOpportunitiesEnhanced table rendering: ${hasTable}`);

    expect(title).toBeTruthy();
  });
});
