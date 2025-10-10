import { test, expect } from '@playwright/test';

test('Manual Inspection - What User Sees', async ({ page }) => {
  console.log('\n=== MANUAL INSPECTION TEST ===\n');

  // Visit the page
  console.log('1. Navigating to TEST-001 collection...');
  await page.goto('http://localhost:3000/collection/TEST-001/manage');
  await page.waitForLoadState('networkidle');
  await page.waitForTimeout(3000);

  console.log('2. Taking initial screenshot...');
  await page.screenshot({ path: 'manual-inspection-initial.png', fullPage: true });

  // Check what's actually rendering
  console.log('\n3. Inspecting page state...');
  
  // Check if table exists
  const tableVisible = await page.locator('.opportunities-table-enhanced').isVisible().catch(() => false);
  console.log(`   Table visible: ${tableVisible}`);

  // Check all column headers
  const columnHeaders = await page.locator('.bp5-table-column-name-text, .bp6-table-column-name-text').allTextContents();
  console.log('   Column headers:', columnHeaders);

  // Check if Match column cells are rendering
  const matchCells = await page.locator('[class*="match"]').count();
  console.log(`   Elements with 'match' in class: ${matchCells}`);

  // Check specifically for our clickable class
  const clickableCells = await page.locator('.match-status-cell.clickable').count();
  console.log(`   Elements with .match-status-cell.clickable: ${clickableCells}`);

  // Check if the old matchStatusCellRenderer is rendering
  const tagElements = await page.locator('.bp5-tag, .bp6-tag').count();
  console.log(`   Blueprint Tag elements: ${tagElements}`);

  // Get sample of what's in the Match column
  console.log('\n4. Inspecting Match column content...');
  const matchColumnCells = await page.locator('table').locator('[class*="bp"][class*="table"][class*="cell"]').nth(1).innerHTML();
  console.log('   First Match cell HTML sample:', matchColumnCells.substring(0, 200));

  // Check if there are any console errors
  const errors: string[] = [];
  page.on('console', msg => {
    if (msg.type() === 'error') {
      errors.push(msg.text());
    }
  });

  await page.waitForTimeout(2000);
  console.log(`\n5. Console errors: ${errors.length}`);
  if (errors.length > 0) {
    console.log('   First 3 errors:', errors.slice(0, 3));
  }

  // Try to hover over a Match status to see if cursor changes
  console.log('\n6. Testing cursor interaction...');
  const firstMatchTag = page.locator('.bp5-tag, .bp6-tag').filter({ hasText: /UNMATCHED|BASELINE|SUBOPTIMAL/ }).first();
  const tagExists = await firstMatchTag.count() > 0;
  
  if (tagExists) {
    await firstMatchTag.hover();
    await page.waitForTimeout(500);
    await page.screenshot({ path: 'manual-inspection-hover.png' });
    console.log('   Hovered over match status tag');
  }

  // Take final detailed screenshot
  await page.screenshot({ path: 'manual-inspection-final.png', fullPage: true });

  console.log('\n=== INSPECTION COMPLETE ===\n');
  console.log('Check screenshots: manual-inspection-initial.png, manual-inspection-hover.png, manual-inspection-final.png');
});
