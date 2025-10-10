import { test } from '@playwright/test';

test('Check URL and page navigation', async ({ page }) => {
  console.log('1. Navigating to collection manage URL...');
  await page.goto('http://localhost:3000/collection/DECK-1756423202347/manage');

  console.log('2. Waiting for page load...');
  await page.waitForLoadState('networkidle');
  await page.waitForTimeout(2000);

  const finalUrl = page.url();
  console.log('3. Final URL:', finalUrl);

  const title = await page.title();
  console.log('4. Page title:', title);

  const mainHeading = await page.locator('h1').first().textContent();
  console.log('5. Main heading:', mainHeading);

  // Check if we're on the right page
  const isCollectionPage = finalUrl.includes('/collection/') && finalUrl.includes('/manage');
  const isDataSources = finalUrl.includes('data-sources') || mainHeading?.includes('Data Sources');

  console.log('\n=== DIAGNOSIS ===');
  console.log('On collection manage page:', isCollectionPage);
  console.log('Redirected to Data Sources:', isDataSources);
  console.log('Expected URL: http://localhost:3000/collection/DECK-1756423202347/manage');
  console.log('Actual URL:', finalUrl);
});
