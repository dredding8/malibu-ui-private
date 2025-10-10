import { test } from '@playwright/test';

test('Screenshot actual collection page state', async ({ page }) => {
  await page.goto('http://localhost:3000/collection/DECK-1756423202347/manage');
  await page.waitForLoadState('networkidle');
  await page.waitForTimeout(3000); // Extra time for React to render

  // Take screenshot
  await page.screenshot({ path: 'test-results/collection-page-actual.png', fullPage: true });

  // Check what's visible
  const opportunitiesTab = await page.locator('text="Manage Opportunities"').isVisible();
  const table = await page.locator('.bp6-table, [class*="table"]').count();
  const nonIdeal = await page.locator('.bp6-non-ideal-state').count();

  console.log('Opportunities tab visible:', opportunitiesTab);
  console.log('Table elements:', table);
  console.log('NonIdealState elements:', nonIdeal);

  // Get page text
  const pageText = await page.locator('body').textContent();
  const hasNoOppsFound = pageText?.includes('No opportunities found');
  console.log('Shows "No opportunities found":', hasNoOppsFound);
});
