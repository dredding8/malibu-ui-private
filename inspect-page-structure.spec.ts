/**
 * Inspect page structure to find the correct way to open UnifiedEditor
 */

import { test } from '@playwright/test';

test('Inspect Collection Management Page', async ({ page }) => {
  await page.goto('http://localhost:3000/collection/TEST-001/manage');
  await page.waitForLoadState('networkidle');
  await page.waitForTimeout(1000);

  console.log('\n🔍 INSPECTING PAGE STRUCTURE...\n');

  // Find all buttons
  const buttons = page.locator('button');
  const buttonCount = await buttons.count();
  console.log(`Found ${buttonCount} buttons on page`);

  if (buttonCount > 0) {
    console.log('\nFirst 10 buttons:');
    for (let i = 0; i < Math.min(buttonCount, 10); i++) {
      const text = await buttons.nth(i).textContent();
      const classes = await buttons.nth(i).getAttribute('class');
      console.log(`  ${i + 1}. "${text}" - classes: ${classes}`);
    }
  }

  // Find all table cells with specific text
  console.log('\n\n🔍 Looking for BASELINE/MATCH cells...');
  const baselineCells = page.locator('td, span, div').filter({ hasText: /BASELINE|UNMATCHED|SUBOPTIMAL/i });
  const cellCount = await baselineCells.count();
  console.log(`Found ${cellCount} cells with match status text`);

  // Check if there's a clickable element
  if (cellCount > 0) {
    const firstCell = baselineCells.first();
    const tagName = await firstCell.evaluate(el => el.tagName);
    const classes = await firstCell.getAttribute('class');
    const clickable = await firstCell.evaluate(el => {
      return window.getComputedStyle(el).cursor;
    });

    console.log(`\nFirst match status element:`);
    console.log(`  Tag: ${tagName}`);
    console.log(`  Classes: ${classes}`);
    console.log(`  Cursor: ${clickable}`);
  }

  // Look for any row actions or edit buttons
  console.log('\n\n🔍 Looking for row action buttons...');
  const editButtons = page.locator('button').filter({ hasText: /edit|view|open|manage/i });
  const editCount = await editButtons.count();
  console.log(`Found ${editCount} potential action buttons`);

  if (editCount > 0) {
    for (let i = 0; i < Math.min(editCount, 5); i++) {
      const text = await editButtons.nth(i).textContent();
      console.log(`  ${i + 1}. "${text}"`);
    }
  }

  // Check table rows for click handlers
  console.log('\n\n🔍 Checking table rows...');
  const rows = page.locator('table tbody tr');
  const rowCount = await rows.count();
  console.log(`Found ${rowCount} table rows`);

  if (rowCount > 0) {
    const firstRow = rows.first();
    const rowClass = await firstRow.getAttribute('class');
    const cursor = await firstRow.evaluate(el => window.getComputedStyle(el).cursor);

    console.log(`\nFirst row:`);
    console.log(`  Classes: ${rowClass}`);
    console.log(`  Cursor: ${cursor}`);
    console.log(`  Clickable: ${cursor === 'pointer' || rowClass?.includes('interactive')}`);
  }

  await page.screenshot({
    path: '/Users/damon/malibu/test-results/screenshots/DEBUG-page-structure.png',
    fullPage: true
  });

  console.log('\n✅ Screenshot saved for manual inspection\n');
});