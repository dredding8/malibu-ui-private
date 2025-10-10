/**
 * Inspect DOM structure to find clickable elements
 */

import { test } from '@playwright/test';

test('Inspect DOM structure', async ({ page }) => {
  await page.goto('http://localhost:3000/collection/550e8400-e29b-41d4-a716-446655440000/manage');
  await page.waitForTimeout(5000);

  // Get all table-related class names
  const tableClasses = await page.evaluate(() => {
    const tables = document.querySelectorAll('[class*="table"], [class*="Table"]');
    return Array.from(tables).map(el => el.className);
  });

  console.log('Table classes:', tableClasses);

  // Get all clickable elements
  const clickable = await page.evaluate(() => {
    const elements = document.querySelectorAll('[onclick], [data-testid], .clickable, [role="button"], [role="row"]');
    return Array.from(elements).map(el => ({
      tag: el.tagName,
      class: el.className,
      role: el.getAttribute('role'),
      testId: el.getAttribute('data-testid')
    }));
  });

  console.log('Clickable elements:', JSON.stringify(clickable, null, 2));

  // Count different element types
  const counts = {
    tr: await page.locator('tr').count(),
    td: await page.locator('td').count(),
    cell: await page.locator('.bp5-table-cell, [class*="cell"]').count(),
    row: await page.locator('[role="row"]').count(),
    checkbox: await page.locator('input[type="checkbox"]').count()
  };

  console.log('Element counts:', JSON.stringify(counts, null, 2));

  // Try to find Priority column cells
  const priorityCells = await page.locator('td, div').filter({ hasText: /^[1-4]$/ }).count();
  console.log(`Priority cells (showing 1-4): ${priorityCells}`);

  // Screenshot
  await page.screenshot({
    path: '/Users/damon/malibu/dom-inspection.png',
    fullPage: true
  });
});
