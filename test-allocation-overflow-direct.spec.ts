/**
 * Direct AllocationTab Overflow Test
 * Uses manual navigation and comprehensive overflow analysis
 */

import { test, expect } from '@playwright/test';

test.describe('AllocationTab Direct Overflow Test', () => {
  test('analyze AllocationTab overflow with all 9 columns', async ({ page }) => {
    console.log('=== STARTING ALLOCATION TAB OVERFLOW ANALYSIS ===\n');

    // Navigate directly
    await page.goto('http://localhost:3000/collection/TEST-001/manage');
    console.log('✓ Navigated to collection management page');

    await page.waitForTimeout(5000); // Give extra time for async loading
    await page.screenshot({ path: '../overflow-test-1-page-loaded.png', fullPage: true });

    // Find and click table row - more robust selector
    console.log('\nSearching for assignment table rows...');
    const tableBody = page.locator('table tbody');
    await tableBody.waitFor({ state: 'visible', timeout: 15000 });

    const rows = await page.locator('table tbody tr').count();
    console.log(`Found ${rows} assignment rows`);

    if (rows === 0) {
      console.log('❌ No rows found, cannot proceed');
      await page.screenshot({ path: '../overflow-test-ERROR-no-rows.png', fullPage: true });
      return;
    }

    // Click first visible row
    const firstRow = page.locator('table tbody tr').first();
    await page.screenshot({ path: '../overflow-test-2-before-row-click.png', fullPage: true });
    await firstRow.click({ force: true, timeout: 10000 });
    console.log('✓ Clicked first assignment row');

    await page.waitForTimeout(3000);

    // Wait for UnifiedEditor modal to open
    console.log('\nWaiting for UnifiedEditor modal...');
    const modal = page.locator('.bp6-overlay-content, .bp6-dialog').first();
    await modal.waitFor({ state: 'visible', timeout: 15000 });
    console.log('✓ UnifiedEditor modal opened');
    await page.screenshot({ path: '../overflow-test-3-editor-opened.png', fullPage: true });

    // Find and click Allocation tab
    console.log('\nSearching for Allocation tab...');
    const tabs = page.locator('[role="tab"]');
    const tabCount = await tabs.count();
    console.log(`Found ${tabCount} tabs`);

    // Find Allocation tab specifically
    let allocationTab = null;
    for (let i = 0; i < tabCount; i++) {
      const tab = tabs.nth(i);
      const tabText = await tab.textContent();
      console.log(`  Tab ${i}: "${tabText}"`);
      if (tabText?.toLowerCase().includes('allocation')) {
        allocationTab = tab;
        break;
      }
    }

    if (!allocationTab) {
      console.log('❌ Allocation tab not found');
      await page.screenshot({ path: '../overflow-test-ERROR-no-allocation-tab.png', fullPage: true });
      return;
    }

    await allocationTab.click();
    console.log('✓ Clicked Allocation tab');
    await page.waitForTimeout(2000);
    await page.screenshot({ path: '../overflow-test-4-allocation-tab-active.png', fullPage: true });

    // Now analyze overflow
    console.log('\n=== MULTI-PERSONA OVERFLOW ANALYSIS ===\n');

    const allocationContainer = page.locator('.allocation-tab').first();
    const leftPanel = page.locator('.allocation-tab__left-panel').first();
    const rightPanel = page.locator('.allocation-tab__right-panel').first();
    const table = page.locator('.allocation-tab__sites-table').first();

    if (!(await allocationContainer.isVisible())) {
      console.log('❌ AllocationTab container not visible');
      await page.screenshot({ path: '../overflow-test-ERROR-tab-not-visible.png', fullPage: true });
      return;
    }

    // === ARCHITECT PERSONA: Layout Analysis ===
    console.log('🏗️  ARCHITECT PERSONA: Container Layout Analysis');
    console.log('─'.repeat(60));

    const containerBox = await allocationContainer.boundingBox();
    const leftBox = await leftPanel.boundingBox();
    const rightBox = await rightPanel.boundingBox();
    const tableBox = await table.boundingBox();

    console.log('Container:', {
      width: containerBox?.width.toFixed(0) + 'px',
      height: containerBox?.height.toFixed(0) + 'px'
    });

    console.log('Left Panel:', {
      width: leftBox?.width.toFixed(0) + 'px',
      percentage: leftBox && containerBox ? ((leftBox.width / containerBox.width) * 100).toFixed(1) + '%' : 'N/A',
      target: '65% (per CSS)'
    });

    console.log('Right Panel:', {
      width: rightBox?.width.toFixed(0) + 'px',
      percentage: rightBox && containerBox ? ((rightBox.width / containerBox.width) * 100).toFixed(1) + '%' : 'N/A',
      target: '35% (per CSS)'
    });

    console.log('Sites Table:', {
      width: tableBox?.width.toFixed(0) + 'px',
      height: tableBox?.height.toFixed(0) + 'px'
    });

    // === FRONTEND PERSONA: Overflow Detection ===
    console.log('\n🎨 FRONTEND PERSONA: Overflow Detection');
    console.log('─'.repeat(60));

    // Check table horizontal overflow
    const tableMetrics = await table.evaluate((el) => ({
      scrollWidth: el.scrollWidth,
      clientWidth: el.clientWidth,
      scrollLeft: el.scrollLeft,
      scrollLeftMax: el.scrollWidth - el.clientWidth,
      computedOverflowX: getComputedStyle(el).overflowX,
      computedDisplay: getComputedStyle(el).display
    }));

    console.log('Table Overflow Analysis:', {
      scrollWidth: tableMetrics.scrollWidth + 'px',
      clientWidth: tableMetrics.clientWidth + 'px',
      overflow: (tableMetrics.scrollWidth - tableMetrics.clientWidth) + 'px',
      overflowX: tableMetrics.computedOverflowX,
      display: tableMetrics.computedDisplay,
      verdict: tableMetrics.scrollWidth > tableMetrics.clientWidth ? '❌ HAS OVERFLOW' : '✅ NO OVERFLOW'
    });

    // Check left panel overflow
    const leftPanelMetrics = await leftPanel.evaluate((el) => ({
      scrollWidth: el.scrollWidth,
      clientWidth: el.clientWidth,
      overflow: el.scrollWidth - el.clientWidth
    }));

    console.log('Left Panel Overflow:', {
      overflow: leftPanelMetrics.overflow + 'px',
      verdict: leftPanelMetrics.overflow > 0 ? '❌ HAS OVERFLOW' : '✅ NO OVERFLOW'
    });

    // === VISUAL DESIGNER PERSONA: Column Analysis ===
    console.log('\n🎨 VISUAL DESIGNER PERSONA: Column Width Analysis');
    console.log('─'.repeat(60));

    const headers = await page.locator('.allocation-tab__sites-table thead th').all();
    console.log(`Found ${headers.length} columns (expected: 9)\n`);

    let totalColumnWidth = 0;
    const columnData = [];

    for (let i = 0; i < headers.length; i++) {
      const header = headers[i];
      const box = await header.boundingBox();
      const text = (await header.textContent())?.trim() || '';
      const width = box?.width || 0;
      totalColumnWidth += width;

      columnData.push({
        index: i + 1,
        name: text,
        width: width.toFixed(0) + 'px'
      });

      console.log(`  ${i + 1}. ${text.padEnd(15)} → ${width.toFixed(0)}px`);
    }

    console.log('\nColumn Width Summary:');
    console.log('  Total column width:', totalColumnWidth.toFixed(0) + 'px');
    console.log('  Available space:   ', tableMetrics.clientWidth + 'px');
    console.log('  Difference:        ', (totalColumnWidth - tableMetrics.clientWidth).toFixed(0) + 'px');

    const fitsWithoutScroll = totalColumnWidth <= tableMetrics.clientWidth;
    console.log('  Verdict:           ', fitsWithoutScroll ? '✅ FITS' : '❌ OVERFLOW');

    // === FINAL VERDICT ===
    console.log('\n' + '='.repeat(60));
    console.log('FINAL OVERFLOW VERDICT');
    console.log('='.repeat(60));

    const hasTableOverflow = tableMetrics.scrollWidth > tableMetrics.clientWidth;
    const hasPanelOverflow = leftPanelMetrics.overflow > 0;
    const hasAnyOverflow = hasTableOverflow || hasPanelOverflow;

    if (!hasAnyOverflow) {
      console.log('✅ SUCCESS: No overflow detected');
      console.log('   - All 9 columns fit within container');
      console.log('   - No horizontal scrolling required');
      console.log('   - Left panel sizing: OPTIMAL');
    } else {
      console.log('❌ OVERFLOW DETECTED:');
      if (hasTableOverflow) {
        console.log(`   - Table overflow: ${tableMetrics.scrollWidth - tableMetrics.clientWidth}px`);
        console.log(`   - Columns total: ${totalColumnWidth.toFixed(0)}px vs available: ${tableMetrics.clientWidth}px`);
      }
      if (hasPanelOverflow) {
        console.log(`   - Left panel overflow: ${leftPanelMetrics.overflow}px`);
      }
      console.log('\n   RECOMMENDED FIXES:');
      console.log('   1. Increase left panel flex to 70%');
      console.log('   2. Reduce column widths proportionally');
      console.log('   3. Ensure display: block on table for overflow-x');
    }

    // Final screenshot with measurements
    await page.screenshot({ path: '../overflow-test-5-FINAL-ANALYSIS.png', fullPage: true });

    console.log('\n=== TEST COMPLETE ===\n');
  });
});