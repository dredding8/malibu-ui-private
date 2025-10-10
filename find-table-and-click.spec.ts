/**
 * Find the assignments table and click a row to open UnifiedEditor
 */

import { test } from '@playwright/test';

test('Find and Click Assignment Row', async ({ page }) => {
  await page.goto('http://localhost:3000/collection/TEST-001/manage');
  await page.waitForLoadState('networkidle');
  await page.waitForTimeout(2000); // Wait longer for table to render

  console.log('\n🔍 SEARCHING FOR ASSIGNMENTS TABLE...\n');

  // Check if there's an Assignments tab or section
  const assignmentsTab = page.locator('text=/assignments/i');
  if (await assignmentsTab.isVisible()) {
    console.log('Found Assignments tab, clicking...');
    await assignmentsTab.click();
    await page.waitForTimeout(1000);
  }

  await page.screenshot({
    path: '/Users/damon/malibu/test-results/screenshots/DEBUG-01-initial-page.png',
    fullPage: true
  });

  // Find ALL tables on page
  const tables = page.locator('table');
  const tableCount = await tables.count();
  console.log(`Found ${tableCount} table(s) on page`);

  if (tableCount > 0) {
    for (let i = 0; i < tableCount; i++) {
      const table = tables.nth(i);
      const rows = table.locator('tbody tr');
      const rowCount = await rows.count();
      console.log(`  Table ${i + 1}: ${rowCount} rows`);

      if (rowCount > 0) {
        console.log(`\n✅ Found table with rows! Clicking first row...`);

        const firstRow = rows.first();

        // Get row info
        const rowText = await firstRow.textContent();
        console.log(`Row text: ${rowText?.substring(0, 100)}...`);

        // Check if row has Match status
        const hasMatch = rowText?.includes('BASELINE') || rowText?.includes('UNMATCHED') || rowText?.includes('SUBOPTIMAL');
        console.log(`Has match status: ${hasMatch}`);

        // Click the row
        await firstRow.click();
        await page.waitForTimeout(1500);

        await page.screenshot({
          path: '/Users/damon/malibu/test-results/screenshots/DEBUG-02-after-row-click.png',
          fullPage: true
        });

        // Check if modal/editor opened
        const modal = page.locator('.bp6-dialog, .bp6-overlay-content, .unified-editor');
        const modalOpen = await modal.isVisible();
        console.log(`\nModal/Editor opened: ${modalOpen ? '✅ YES' : '❌ NO'}`);

        if (modalOpen) {
          console.log('\n✅✅✅ UNIFIED EDITOR OPENED! ✅✅✅');

          // Look for tabs
          const tabs = page.locator('[role="tab"]');
          const tabCount = await tabs.count();
          console.log(`\nFound ${tabCount} tabs:`);

          for (let j = 0; j < tabCount; j++) {
            const tabText = await tabs.nth(j).textContent();
            console.log(`  ${j + 1}. "${tabText}"`);
          }

          // Click Allocation tab (should be first or second)
          const allocationTab = page.locator('[role="tab"]').filter({ hasText: /allocation|1/i }).first();
          if (await allocationTab.isVisible()) {
            console.log(`\nClicking Allocation tab...`);
            await allocationTab.click();
            await page.waitForTimeout(500);

            await page.screenshot({
              path: '/Users/damon/malibu/test-results/screenshots/DEBUG-03-allocation-tab.png',
              fullPage: true
            });

            // NOW LOOK FOR SITES TABLE
            const sitesTable = page.locator('table').first();
            if (await sitesTable.isVisible()) {
              console.log('\n✅✅✅ SITES TABLE FOUND IN ALLOCATION TAB! ✅✅✅');

              const headers = await sitesTable.locator('thead th').allTextContents();
              console.log(`\nTable headers: ${headers.join(' | ')}`);

              const siteRows = await sitesTable.locator('tbody tr').count();
              console.log(`Site rows: ${siteRows}`);

              await sitesTable.screenshot({
                path: '/Users/damon/malibu/test-results/screenshots/FINAL-SITES-TABLE.png'
              });

              console.log('\n✅ Sites table screenshot captured!');
            } else {
              console.log('\n❌ Sites table not found');
            }
          }
        } else {
          console.log('\n⚠️ Editor did not open - row might not be clickable');
          console.log('Trying to find a button in the row...');

          // Look for buttons within the row
          const rowButtons = firstRow.locator('button');
          const btnCount = await rowButtons.count();
          console.log(`Found ${btnCount} buttons in row`);

          if (btnCount > 0) {
            for (let b = 0; b < btnCount; b++) {
              const btnText = await rowButtons.nth(b).textContent();
              console.log(`  Button ${b + 1}: "${btnText}"`);
            }

            console.log('\nClicking first button in row...');
            await rowButtons.first().click();
            await page.waitForTimeout(1500);

            await page.screenshot({
              path: '/Users/damon/malibu/test-results/screenshots/DEBUG-after-button-click.png',
              fullPage: true
            });
          }
        }

        break; // Found a table with rows, stop searching
      }
    }
  } else {
    console.log('❌ No tables found on page');
  }

  console.log('\n🎬 Test complete\n');
});