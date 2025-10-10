import { test } from '@playwright/test';

test('check processedData length', async ({ page }) => {
  const logs: string[] = [];

  page.on('console', msg => {
    if (msg.type() === 'log') {
      logs.push(msg.text());
    }
  });

  await page.goto('http://localhost:3000/collection/DECK-1757517559289/manage');
  await page.waitForLoadState('networkidle');
  await page.waitForTimeout(3000);

  console.log('\n========================================');
  console.log('PROCESSEDDATA CHECK');
  console.log('========================================\n');

  // Filter logs for our component
  const relevantLogs = logs.filter(log =>
    log.includes('[CollectionOpportunitiesEnhanced]') ||
    log.includes('processedData') ||
    log.includes('Rendering decision')
  );

  console.log('📋 Component Logs:');
  relevantLogs.forEach(log => console.log(`  ${log}`));

  // Check DOM for actual row count
  const rowCount = await page.locator('.bp6-table-row').count();
  console.log(`\n📊 Actual rows in DOM: ${rowCount}`);

  // Check if Table2 has numRows prop set correctly
  const tableInfo = await page.evaluate(() => {
    const table = document.querySelector('.opportunities-table-enhanced');
    if (!table) return null;

    const rows = table.querySelectorAll('.bp6-table-row');
    const cells = table.querySelectorAll('.bp6-table-cell');

    return {
      rowElements: rows.length,
      cellElements: cells.length,
      tableClassList: Array.from(table.classList)
    };
  });

  console.log('\n📊 Table DOM Info:', JSON.stringify(tableInfo, null, 2));
});
