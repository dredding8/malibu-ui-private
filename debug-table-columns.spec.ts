import { test } from '@playwright/test';

test('debug table column rendering', async ({ page }) => {
  await page.goto('http://localhost:3000/collection/DECK-1757517559289/manage');
  await page.waitForLoadState('networkidle');
  await page.waitForTimeout(2000);

  // Get the actual rendered column elements
  const columnInfo = await page.evaluate(() => {
    const table = document.querySelector('.opportunities-table-enhanced');
    if (!table) return { error: 'Table not found' };

    // Check for Column components in React
    const headers = Array.from(table.querySelectorAll('.bp6-table-header'));
    const headerTexts = headers.map(h => h.textContent?.trim());

    // Check colgroup
    const cols = Array.from(table.querySelectorAll('colgroup col'));

    // Check actual cells in first row
    const firstRow = table.querySelector('.bp6-table-row');
    const cells = firstRow ? Array.from(firstRow.querySelectorAll('.bp6-table-cell')) : [];

    return {
      headerCount: headers.length,
      headerTexts,
      colgroupCount: cols.length,
      firstRowCellCount: cells.length,
      tableHTML: table.outerHTML.substring(0, 500) // First 500 chars
    };
  });

  console.log('\n========================================');
  console.log('TABLE COLUMN DEBUG');
  console.log('========================================');
  console.log(JSON.stringify(columnInfo, null, 2));

  // Check if Table2 component rendered at all
  const table2Exists = await page.locator('.opportunities-table-enhanced').count();
  console.log(`\n✅ Table2 element exists: ${table2Exists > 0}`);

  // Check React DevTools info if available
  const reactInfo = await page.evaluate(() => {
    const table = document.querySelector('.opportunities-table-enhanced');
    if (!table) return null;

    // Try to get React fiber
    const key = Object.keys(table).find(k => k.startsWith('__reactFiber'));
    if (!key) return { hasReact: false };

    return { hasReact: true, reactKey: key };
  });

  console.log('\n📊 React Info:', reactInfo);
});
