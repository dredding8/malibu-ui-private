/**
 * Quick Visual Check: OpportunityInfoHeaderEnhanced
 * Navigate directly and capture screenshots
 */

import { test, expect } from '@playwright/test';

test('Quick header visual check', async ({ page }) => {
  // Navigate to home
  await page.goto('http://localhost:3000');
  await page.waitForTimeout(3000);

  // Screenshot 1: Homepage
  await page.screenshot({
    path: '/Users/damon/malibu/screenshot-01-homepage.png',
    fullPage: true
  });

  console.log('✅ Screenshot 1: Homepage captured');

  // Click Collections in nav
  const collectionsNav = page.locator('a:has-text("Collections")');

  if (await collectionsNav.count() > 0) {
    await collectionsNav.click();
    await page.waitForTimeout(4000);

    // Screenshot 2: Collections page
    await page.screenshot({
      path: '/Users/damon/malibu/screenshot-02-collections-page.png',
      fullPage: true
    });

    console.log('✅ Screenshot 2: Collections page captured');
  } else {
    console.log('⚠️ Collections nav link not found');
  }

  // Try to find and click any clickable row/card
  const clickableElements = page.locator('[data-testid="opportunity-row"], .bp5-table tbody tr, .opportunity-card, .clickable');

  if (await clickableElements.count() > 0) {
    await clickableElements.first().click();
    await page.waitForTimeout(2000);

    // Screenshot 3: Modal/Drawer opened
    await page.screenshot({
      path: '/Users/damon/malibu/screenshot-03-modal-opened.png',
      fullPage: true
    });

    console.log('✅ Screenshot 3: Modal opened');

    // Look for our header
    const header = page.locator('.opportunity-info-header-enhanced');

    if (await header.count() > 0) {
      await header.screenshot({
        path: '/Users/damon/malibu/screenshot-04-header-closeup.png'
      });

      console.log('✅ Screenshot 4: Header found and captured!');

      // Check for priority value
      const priorityValue = header.locator('.priority-value');

      if (await priorityValue.count() > 0) {
        const text = await priorityValue.textContent();
        console.log('✅ Priority value found:', text);

        // Check it's NOT inside a Tag
        const isInTag = await header.locator('.bp5-tag .priority-value').count();

        if (isInTag > 0) {
          console.log('❌ ERROR: Priority is inside a Tag!');
        } else {
          console.log('✅ SUCCESS: Priority is plain number (not in Tag)');
        }
      }
    } else {
      console.log('⚠️ Header not found - may need different navigation');
    }
  } else {
    console.log('⚠️ No clickable elements found on page');
  }
});
