import { test } from '@playwright/test';

test('Capture current state of collection management page', async ({ page }) => {
  console.log('Opening http://localhost:3000/collection/TEST-001/manage');

  // Set up console listener before navigation
  page.on('console', msg => {
    const type = msg.type();
    if (type === 'error' || type === 'warning') {
      console.log(`BROWSER ${type.toUpperCase()}:`, msg.text());
    }
  });

  // Set up error listener
  page.on('pageerror', error => {
    console.log('PAGE ERROR:', error.message);
  });

  await page.goto('http://localhost:3000/collection/TEST-001/manage', {
    waitUntil: 'networkidle',
    timeout: 30000
  });

  // Wait a bit for any JS to execute
  await page.waitForTimeout(3000);

  // Take full page screenshot
  await page.screenshot({
    path: '/Users/damon/malibu/test-results/collection-current-state.png',
    fullPage: true
  });

  // Get page HTML
  const html = await page.content();
  console.log('Page HTML length:', html.length);

  // Count elements
  const buttons = await page.locator('button').count();
  const links = await page.locator('a').count();
  const inputs = await page.locator('input').count();
  const tables = await page.locator('table').count();
  const divs = await page.locator('div').count();

  console.log(`Buttons: ${buttons}, Links: ${links}, Inputs: ${inputs}, Tables: ${tables}, Divs: ${divs}`);

  // Check for error overlays
  const errorOverlay = await page.locator('.Overlay--error, [class*="error"]').count();
  const infiniteLoopError = await page.locator('text=Maximum update depth exceeded').count();
  console.log('Error overlays found:', errorOverlay);
  console.log('Infinite loop errors found:', infiniteLoopError);

  // Check for collection-specific elements
  const collectionDeck = await page.locator('text=Collection Deck').count();
  const smartViews = await page.locator('text=Smart Views').count();
  const collectionOverview = await page.locator('text=Collection Overview').count();

  console.log('Collection-specific elements:');
  console.log('  - Collection Deck header:', collectionDeck);
  console.log('  - Smart Views section:', smartViews);
  console.log('  - Collection Overview section:', collectionOverview);

  // Get all tab names
  const tabs = await page.locator('[role="tab"]').allTextContents();
  console.log('Available tabs:', tabs);

  // Check stats cards
  const statCards = await page.locator('.stat-card, [class*="stat"]').count();
  console.log('Statistics cards found:', statCards);
});
