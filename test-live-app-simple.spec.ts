import { test } from '@playwright/test';

/**
 * Simple live app debugging test
 */

test('Debug: Check what actually renders and find errors', async ({ page }) => {
  // Listen for all console messages
  page.on('console', msg => {
    const type = msg.type();
    const text = msg.text();
    console.log(`[CONSOLE ${type.toUpperCase()}] ${text}`);
  });

  // Listen for page errors
  page.on('pageerror', error => {
    console.log(`[PAGE ERROR] ${error.message}`);
    console.log(error.stack);
  });

  // Listen for request failures
  page.on('requestfailed', request => {
    console.log(`[REQUEST FAILED] ${request.url()}: ${request.failure()?.errorText}`);
  });

  // Navigate to the page
  console.log('\n=== NAVIGATING TO PAGE ===');
  await page.goto('http://localhost:3000/collection/DECK-1758570229031/manage');

  // Wait for page to stabilize
  await page.waitForLoadState('domcontentloaded');
  await page.waitForTimeout(5000);

  console.log('\n=== CURRENT URL ===');
  console.log(page.url());

  // Take screenshot
  await page.screenshot({ path: 'test-results/live-app-simple.png', fullPage: true });

  console.log('\n=== CHECKING FOR COMPONENTS ===');

  // Check for various possible selectors
  const selectors = [
    'body',
    '#root',
    '.app',
    '.collection-opportunities-hub',
    '.collection-hub-header',
    '.collection-decks-table-wrapper',
    '.action-button-group',
    '.bp5-navbar',
    '.bp5-card',
    '.bp5-non-ideal-state',
    '.bp5-spinner',
    'h1',
    'h2',
    'button',
    'table'
  ];

  for (const selector of selectors) {
    const count = await page.locator(selector).count();
    const visible = count > 0 && await page.locator(selector).first().isVisible().catch(() => false);
    console.log(`${selector}: ${count} elements (visible: ${visible})`);

    if (count > 0) {
      const text = await page.locator(selector).first().textContent().catch(() => '');
      if (text && text.trim().length > 0 && text.length < 200) {
        console.log(`  Text: "${text.trim()}"`);
      }
    }
  }

  console.log('\n=== BODY TEXT (first 500 chars) ===');
  const bodyText = await page.locator('body').textContent();
  console.log(bodyText?.substring(0, 500));

  console.log('\n=== TEST COMPLETE ===');
});
