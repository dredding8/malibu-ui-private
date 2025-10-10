import { test } from '@playwright/test';

test('debug Site Allocation cell rendering', async ({ page }) => {
  await page.goto('http://localhost:3000/collection/TEST-001/manage');
  await page.waitForLoadState('networkidle', { timeout: 15000 });

  // Wait a bit for data to load
  await page.waitForTimeout(3000);

  // Take full page screenshot
  await page.screenshot({ path: 'test-results/debug-full-page.png', fullPage: true });

  // Check React state and props
  const debug = await page.evaluate(() => {
    // Find the Site Allocation column cells
    const allCells = document.querySelectorAll('.bp5-table-cell, .bp6-table-cell');
    const siteAllocationCells: any[] = [];

    // Try to identify Site Allocation cells by column position (column 7)
    const rows = document.querySelectorAll('.bp5-table-row, .bp6-table-row');

    const analysis = {
      totalCells: allCells.length,
      rowCount: rows.length,
      siteAllocationSpecific: {
        bySiteAllocationClass: document.querySelectorAll('.site-allocation-cell').length,
        bySiteAllocationTag: document.querySelectorAll('.site-allocation-tag').length,
        byEmptyIndicator: document.querySelectorAll('.site-allocation-empty').length,
      },
      sampleCellsByPosition: [] as any[],
      consoleErrors: [] as string[]
    };

    // Get sample of cells from each row at column 7 position
    rows.forEach((row, rowIdx) => {
      if (rowIdx < 5) {  // First 5 rows
        const cells = row.querySelectorAll('.bp5-table-cell, .bp6-table-cell');
        const cell7 = cells[7];  // Column 7 (0-indexed, so 8th column including checkbox)

        if (cell7) {
          analysis.sampleCellsByPosition.push({
            row: rowIdx,
            textContent: cell7.textContent?.trim() || '',
            innerHTML: cell7.innerHTML.substring(0, 300),
            classList: Array.from(cell7.classList),
            hasChildren: cell7.children.length,
            isEmpty: !cell7.textContent?.trim()
          });
        }
      }
    });

    return analysis;
  });

  console.log('\n=== SITE ALLOCATION CELL DEBUG ===\n');
  console.log(JSON.stringify(debug, null, 2));

  // Check for console errors
  const errors: string[] = [];
  page.on('console', msg => {
    if (msg.type() === 'error') {
      errors.push(msg.text());
    }
  });

  await page.waitForTimeout(1000);

  if (errors.length > 0) {
    console.log('\n=== CONSOLE ERRORS ===');
    errors.forEach(err => console.log(err));
  }
});
