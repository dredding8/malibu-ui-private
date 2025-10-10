import { test, expect } from '@playwright/test';

test('check if Actions column is scrolled off-screen', async ({ page }) => {
  await page.goto('http://localhost:3000/collection/DECK-1757517559289/manage');
  await page.waitForLoadState('networkidle');
  await page.waitForTimeout(2000);

  // Check all column headers
  const columnHeaders = await page.locator('th.bp6-table-header').allTextContents();
  console.log('\n📋 All Column Headers Found:');
  columnHeaders.forEach((header, index) => {
    console.log(`  ${index + 1}. ${header}`);
  });

  // Check if Actions column header exists
  const actionsHeaderExists = columnHeaders.some(h => h.includes('Actions'));
  console.log(`\n✅ Actions header exists: ${actionsHeaderExists}`);

  // Check if Opportunity column exists
  const opportunityHeaderExists = columnHeaders.some(h => h.includes('Opportunity'));
  console.log(`✅ Opportunity header exists: ${opportunityHeaderExists}`);

  // Get table element and check its width
  const table = page.locator('.bp6-table-container, table');
  const tableBoundingBox = await table.boundingBox();
  console.log(`\n📊 Table dimensions:`, tableBoundingBox);

  // Try to scroll the table to the right
  await page.evaluate(() => {
    const tableContainer = document.querySelector('.bp6-table-container') as HTMLElement;
    if (tableContainer) {
      tableContainer.scrollLeft = 10000; // Scroll far right
    }
  });

  await page.waitForTimeout(1000);

  // Take screenshot after scrolling
  await page.screenshot({ path: 'table-scrolled-right.png', fullPage: true });
  console.log('✅ Screenshot saved after scrolling right');

  // Check column headers again
  const columnHeadersAfterScroll = await page.locator('th.bp6-table-header').allTextContents();
  console.log('\n📋 Column Headers After Scroll:');
  columnHeadersAfterScroll.forEach((header, index) => {
    console.log(`  ${index + 1}. ${header}`);
  });
});
