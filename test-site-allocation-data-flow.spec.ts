/**
 * Data Flow Investigation Test
 *
 * Purpose: Trace the complete data flow from mock generation to cell rendering
 * to identify where allocatedSites data is being lost.
 */

import { test, expect } from '@playwright/test';

test('Trace Site Allocation data flow from generation to rendering', async ({ page }) => {
  // Capture console logs
  const logs: string[] = [];
  page.on('console', msg => {
    const text = msg.text();
    if (text.includes('Mock data loaded') ||
        text.includes('allocatedSites') ||
        text.includes('processedData') ||
        text.includes('CollectionOpportunitiesEnhanced') ||
        text.includes('Hub')) {
      logs.push(text);
    }
  });

  await page.goto('http://localhost:3000/collection/TEST-001/manage');

  // Wait for page to load
  await page.waitForTimeout(3000);

  // Execute script to inspect the data in browser context
  const dataInspection = await page.evaluate(() => {
    // Try to access the React component state
    const results: any = {
      mockDataGeneration: null,
      hubState: null,
      tableProps: null,
      cellRendering: null
    };

    // Check if mock data was generated
    const mockDataLogs = (window as any).__mockDataGenerated;
    if (mockDataLogs) {
      results.mockDataGeneration = {
        opportunitiesCount: mockDataLogs.opportunitiesCount,
        firstOpportunity: mockDataLogs.firstOpportunity
      };
    }

    // Try to inspect React DevTools data (if available)
    const reactRoot = document.querySelector('[data-reactroot]');
    if (reactRoot) {
      results.reactRoot = 'Found React root element';
    }

    // Check table cells
    const tableCells = document.querySelectorAll('.bp5-table-cell');
    results.tableCellCount = tableCells.length;

    // Check for Site Allocation column specifically
    const siteAllocationCells = document.querySelectorAll('.site-allocation-cell');
    results.siteAllocationCellCount = siteAllocationCells.length;

    // Sample first few cells
    results.siteAllocationCellSamples = Array.from(siteAllocationCells)
      .slice(0, 3)
      .map(cell => ({
        innerHTML: cell.innerHTML,
        textContent: cell.textContent?.trim(),
        classes: cell.className,
        hasContent: cell.children.length > 0
      }));

    return results;
  });

  console.log('\n=== DATA FLOW INSPECTION ===');
  console.log('Console Logs Captured:', logs.length);
  console.log('\nRelevant Logs:');
  logs.forEach(log => console.log('  ', log));

  console.log('\nBrowser Data Inspection:');
  console.log(JSON.stringify(dataInspection, null, 2));

  // Take screenshot for visual verification
  await page.screenshot({
    path: '/Users/damon/malibu/test-site-allocation-data-flow.png',
    fullPage: true
  });

  // Print findings
  console.log('\n=== FINDINGS ===');
  console.log('Site Allocation cells found:', dataInspection.siteAllocationCellCount);
  console.log('Sample cell contents:', dataInspection.siteAllocationCellSamples);
});
