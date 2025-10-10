/**
 * Capture AllocationTab Table Overflow Issue
 */

import { test } from '@playwright/test';

test('Capture Table Overflow in AllocationTab', async ({ page }) => {
  console.log('\n🔍 CAPTURING ALLOCATIONTAB TABLE OVERFLOW ISSUE\n');

  await page.goto('http://localhost:3000/collection/TEST-001/manage');
  await page.waitForLoadState('networkidle');
  await page.waitForTimeout(3000); // Wait for async table load

  // Click first visible row in assignments table
  const row = page.locator('table tbody tr').first();

  // Wait for row to be visible
  await row.waitFor({ state: 'visible', timeout: 5000 });

  console.log('Clicking assignment row...');
  await row.click({ force: true });
  await page.waitForTimeout(2000);

  // Check for editor
  const editor = page.locator('.bp6-dialog, .bp6-overlay');
  await editor.waitFor({ state: 'visible', timeout: 5000 });
  console.log('✅ Editor opened\n');

  // Click Allocation tab
  const allocationTab = page.locator('[role="tab"]').filter({ hasText: /allocation/i }).first();
  await allocationTab.waitFor({ state: 'visible', timeout: 5000 });
  await allocationTab.click();
  await page.waitForTimeout(1000);
  console.log('✅ Allocation tab active\n');

  // Find sites table
  const sitesTable = page.locator('table.allocation-tab__sites-table, table').first();
  await sitesTable.waitFor({ state: 'visible', timeout: 5000 });
  console.log('✅ Sites table found\n');

  // Capture the overflow issue
  console.log('📸 CAPTURING OVERFLOW SCREENSHOTS...\n');

  await page.screenshot({
    path: '/Users/damon/malibu/test-results/screenshots/OVERFLOW-01-full-page.png',
    fullPage: true
  });
  console.log('1. Full page view');

  await sitesTable.screenshot({
    path: '/Users/damon/malibu/test-results/screenshots/OVERFLOW-02-table-only.png'
  });
  console.log('2. Table element only');

  // Get table metrics
  const tableBox = await sitesTable.boundingBox();
  const headers = await sitesTable.locator('thead th').allTextContents();
  const rows = await sitesTable.locator('tbody tr').count();

  console.log('\n📊 TABLE METRICS:');
  console.log(`   Headers (${headers.length}): ${headers.join(' | ')}`);
  console.log(`   Rows: ${rows}`);
  if (tableBox) {
    console.log(`   Table width: ${tableBox.width}px`);
    console.log(`   Table height: ${tableBox.height}px`);
  }

  // Check parent container width
  const leftPanel = page.locator('.allocation-tab__left-panel');
  const panelBox = await leftPanel.boundingBox();
  if (panelBox && tableBox) {
    console.log(`\n⚠️  OVERFLOW ANALYSIS:`);
    console.log(`   Panel width: ${panelBox.width}px`);
    console.log(`   Table width: ${tableBox.width}px`);
    console.log(`   Overflow: ${tableBox.width > panelBox.width ? `YES (${(tableBox.width - panelBox.width).toFixed(0)}px)` : 'NO'}`);
  }

  // Check for horizontal scrollbar
  const hasScroll = await sitesTable.evaluate(el => {
    return el.scrollWidth > el.clientWidth;
  });
  console.log(`   Horizontal scroll: ${hasScroll ? 'YES ⚠️' : 'NO ✅'}`);

  // Scroll right to see hidden columns
  if (hasScroll) {
    console.log('\n📸 Scrolling to capture hidden columns...');
    await sitesTable.evaluate(el => el.scrollLeft = el.scrollWidth);
    await page.waitForTimeout(300);

    await page.screenshot({
      path: '/Users/damon/malibu/test-results/screenshots/OVERFLOW-03-scrolled-right.png',
      fullPage: true
    });
    console.log('3. Scrolled right view');
  }

  // Check computed styles
  const tableStyles = await sitesTable.evaluate(el => {
    const computed = window.getComputedStyle(el);
    return {
      maxHeight: computed.maxHeight,
      overflowX: computed.overflowX,
      overflowY: computed.overflowY,
      width: computed.width
    };
  });

  console.log('\n🎨 TABLE STYLES:');
  console.log(`   max-height: ${tableStyles.maxHeight}`);
  console.log(`   overflow-x: ${tableStyles.overflowX}`);
  console.log(`   overflow-y: ${tableStyles.overflowY}`);
  console.log(`   width: ${tableStyles.width}`);

  console.log('\n✅ Overflow screenshots captured!\n');
});