import { test } from '@playwright/test';

test('Test collection management route', async ({ page }) => {
  console.log('Opening http://localhost:3000/collection/TEST-001/manage');

  // Try both ports since you mentioned 3001
  const urls = [
    'http://localhost:3000/collection/TEST-001/manage',
    'http://localhost:3001/collection/TEST-001/manage'
  ];

  for (const url of urls) {
    try {
      console.log(`\nTrying ${url}...`);
      await page.goto(url, { waitUntil: 'networkidle', timeout: 10000 });

      // Wait for any JS to execute
      await page.waitForTimeout(3000);

      // Take screenshot
      const filename = url.includes('3001') ? 'collection-route-3001.png' : 'collection-route-3000.png';
      await page.screenshot({
        path: `/Users/damon/malibu/test-results/${filename}`,
        fullPage: true
      });

      // Count elements
      const buttons = await page.locator('button').count();
      const links = await page.locator('a').count();
      const inputs = await page.locator('input').count();
      const tables = await page.locator('table').count();

      console.log(`  Elements - Buttons: ${buttons}, Links: ${links}, Inputs: ${inputs}, Tables: ${tables}`);

      // Check for errors
      const errorText = await page.locator('body').textContent();
      if (errorText?.includes('error') || errorText?.includes('Error')) {
        console.log('  Error text found on page');
      }

    } catch (e) {
      console.log(`  Failed: ${e.message}`);
    }
  }
});
