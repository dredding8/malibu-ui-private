import { test } from '@playwright/test';

/**
 * Debug test to see what's actually rendering on the page
 */

test('Debug: Capture what renders on collection management page', async ({ page }) => {
  await page.goto('http://localhost:3000/collection/DECK-1758570229031/manage');

  // Wait for network to settle
  await page.waitForLoadState('networkidle');

  // Take a screenshot
  await page.screenshot({ path: 'test-results/page-current-state.png', fullPage: true });

  // Get the HTML content
  const html = await page.content();
  console.log('=== PAGE HTML ===');
  console.log(html);

  // Get all visible elements
  const bodyText = await page.locator('body').textContent();
  console.log('\n=== BODY TEXT ===');
  console.log(bodyText);

  // Check for errors in console
  page.on('console', msg => {
    console.log(`CONSOLE ${msg.type()}: ${msg.text()}`);
  });

  page.on('pageerror', error => {
    console.log(`PAGE ERROR: ${error.message}`);
  });

  // Wait a bit to catch any delayed rendering
  await page.waitForTimeout(3000);

  // Check what components exist
  const selectors = [
    '.collection-hub-header',
    '.collection-decks-table-wrapper',
    '.action-button-group',
    '[data-testid="collection-management-page"]',
    '.bp5-card',
    '.bp5-non-ideal-state'
  ];

  console.log('\n=== COMPONENT PRESENCE ===');
  for (const selector of selectors) {
    const exists = await page.locator(selector).count() > 0;
    console.log(`${selector}: ${exists ? 'EXISTS' : 'NOT FOUND'}`);
  }

  // Get current URL
  console.log('\n=== CURRENT URL ===');
  console.log(page.url());
});
