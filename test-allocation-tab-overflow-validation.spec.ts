/**
 * AllocationTab Overflow Validation Test
 *
 * Multi-Persona Analysis: Architect + Frontend + Visual Designer
 * Tests all elements in AllocationTab for overflow issues
 */

import { test, expect } from '@playwright/test';

test.describe('AllocationTab Overflow Validation', () => {
  test('should validate no horizontal overflow in AllocationTab sites table', async ({ page }) => {
    // Navigate to collection management page
    await page.goto('http://localhost:3000/collection/TEST-001/manage');
    await page.waitForTimeout(3000);

    // Take screenshot of initial page
    await page.screenshot({ path: '../allocation-tab-overflow-1-initial.png', fullPage: true });

    // Click first assignment row to open UnifiedEditor
    const row = page.locator('table tbody tr').first();
    await row.waitFor({ state: 'visible', timeout: 10000 });
    await page.screenshot({ path: '../allocation-tab-overflow-2-before-click.png', fullPage: true });

    await row.click({ force: true });
    await page.waitForTimeout(2000);

    // Wait for UnifiedEditor modal
    const editor = page.locator('.bp6-dialog, .bp6-overlay').first();
    await editor.waitFor({ state: 'visible', timeout: 10000 });
    await page.screenshot({ path: '../allocation-tab-overflow-3-editor-open.png', fullPage: true });

    // Click Allocation tab
    const allocationTab = page.locator('[role="tab"]').filter({ hasText: /allocation/i }).first();
    await allocationTab.waitFor({ state: 'visible', timeout: 10000 });
    await allocationTab.click();
    await page.waitForTimeout(2000);

    await page.screenshot({ path: '../allocation-tab-overflow-4-allocation-tab.png', fullPage: true });

    // ARCHITECT ANALYSIS: Container structure
    console.log('\n=== ARCHITECT ANALYSIS: Container Structure ===');

    const allocationTabContainer = page.locator('.allocation-tab').first();
    const leftPanel = page.locator('.allocation-tab__left-panel').first();
    const rightPanel = page.locator('.allocation-tab__right-panel').first();
    const sitesTable = page.locator('.allocation-tab__sites-table').first();

    if (await allocationTabContainer.isVisible()) {
      const containerBox = await allocationTabContainer.boundingBox();
      const leftBox = await leftPanel.boundingBox();
      const rightBox = await rightPanel.boundingBox();
      const tableBox = await sitesTable.boundingBox();

      console.log('Container dimensions:', {
        width: containerBox?.width,
        height: containerBox?.height
      });
      console.log('Left panel:', {
        width: leftBox?.width,
        percentage: leftBox && containerBox ? ((leftBox.width / containerBox.width) * 100).toFixed(1) + '%' : 'N/A'
      });
      console.log('Right panel:', {
        width: rightBox?.width,
        percentage: rightBox && containerBox ? ((rightBox.width / containerBox.width) * 100).toFixed(1) + '%' : 'N/A'
      });
      console.log('Table dimensions:', {
        width: tableBox?.width,
        height: tableBox?.height
      });

      // FRONTEND ANALYSIS: Overflow detection
      console.log('\n=== FRONTEND ANALYSIS: Overflow Detection ===');

      // Check if table has horizontal scroll
      const tableScrollWidth = await sitesTable.evaluate((el) => el.scrollWidth);
      const tableClientWidth = await sitesTable.evaluate((el) => el.clientWidth);
      const hasHorizontalScroll = tableScrollWidth > tableClientWidth;

      console.log('Table scroll analysis:', {
        scrollWidth: tableScrollWidth,
        clientWidth: tableClientWidth,
        overflow: tableScrollWidth - tableClientWidth,
        hasHorizontalScroll
      });

      // Check if left panel has overflow
      const leftPanelScrollWidth = await leftPanel.evaluate((el) => el.scrollWidth);
      const leftPanelClientWidth = await leftPanel.evaluate((el) => el.clientWidth);
      const leftPanelOverflow = leftPanelScrollWidth > leftPanelClientWidth;

      console.log('Left panel scroll analysis:', {
        scrollWidth: leftPanelScrollWidth,
        clientWidth: leftPanelClientWidth,
        overflow: leftPanelScrollWidth - leftPanelClientWidth,
        hasOverflow: leftPanelOverflow
      });

      // VISUAL DESIGNER ANALYSIS: Column widths
      console.log('\n=== VISUAL DESIGNER ANALYSIS: Column Widths ===');

      const headers = await page.locator('.allocation-tab__sites-table thead th').all();
      console.log(`Found ${headers.length} columns`);

      let totalColumnWidth = 0;
      for (let i = 0; i < headers.length; i++) {
        const header = headers[i];
        const box = await header.boundingBox();
        const text = await header.textContent();
        console.log(`Column ${i + 1} "${text?.trim()}":`, {
          width: box?.width,
          x: box?.x
        });
        if (box) totalColumnWidth += box.width;
      }

      console.log('Total column width:', totalColumnWidth);
      console.log('Available table width:', tableClientWidth);
      console.log('Overflow amount:', totalColumnWidth - tableClientWidth);

      // Check for text overflow in cells
      console.log('\n=== CELL CONTENT OVERFLOW CHECK ===');
      const firstRowCells = await page.locator('.allocation-tab__sites-table tbody tr').first().locator('td').all();

      for (let i = 0; i < Math.min(firstRowCells.length, headers.length); i++) {
        const cell = firstRowCells[i];
        const cellScrollWidth = await cell.evaluate((el) => el.scrollWidth);
        const cellClientWidth = await cell.evaluate((el) => el.clientWidth);
        const hasOverflow = cellScrollWidth > cellClientWidth;

        if (hasOverflow) {
          const headerText = await headers[i].textContent();
          console.log(`⚠️ Cell ${i + 1} (${headerText?.trim()}) has overflow:`, {
            scrollWidth: cellScrollWidth,
            clientWidth: cellClientWidth,
            overflow: cellScrollWidth - cellClientWidth
          });
        }
      }

      // Capture final state with annotations
      await page.screenshot({ path: '../allocation-tab-overflow-5-final-analysis.png', fullPage: true });

      // VERDICT
      console.log('\n=== OVERFLOW VERDICT ===');
      if (!hasHorizontalScroll && !leftPanelOverflow) {
        console.log('✅ NO OVERFLOW DETECTED - All columns fit within container');
      } else {
        console.log('❌ OVERFLOW DETECTED:');
        if (hasHorizontalScroll) {
          console.log(`  - Table has ${tableScrollWidth - tableClientWidth}px horizontal overflow`);
        }
        if (leftPanelOverflow) {
          console.log(`  - Left panel has ${leftPanelScrollWidth - leftPanelClientWidth}px overflow`);
        }
      }

    } else {
      console.log('❌ AllocationTab not visible');
      await page.screenshot({ path: '../allocation-tab-overflow-ERROR-not-found.png', fullPage: true });
    }
  });
});