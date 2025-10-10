import { test } from '@playwright/test';

test('capture console errors for Actions column', async ({ page }) => {
  const consoleMessages: string[] = [];
  const errors: string[] = [];

  page.on('console', msg => {
    const text = msg.text();
    consoleMessages.push(`[${msg.type()}] ${text}`);
    if (msg.type() === 'error') {
      errors.push(text);
    }
  });

  page.on('pageerror', err => {
    errors.push(`PAGE ERROR: ${err.message}`);
  });

  await page.goto('http://localhost:3000/collection/DECK-1757517559289/manage');
  await page.waitForLoadState('networkidle');
  await page.waitForTimeout(3000);

  console.log('\n========================================');
  console.log('CONSOLE ERRORS CHECK');
  console.log('========================================\n');

  if (errors.length > 0) {
    console.log('❌ ERRORS FOUND:');
    errors.forEach((err, i) => {
      console.log(`  ${i + 1}. ${err}`);
    });
  } else {
    console.log('✅ No errors found');
  }

  console.log('\n📋 Recent console messages (last 20):');
  consoleMessages.slice(-20).forEach(msg => {
    console.log(`  ${msg}`);
  });

  // Check DOM for table structure
  const tableHTML = await page.locator('.opportunities-table-enhanced').evaluate(el => {
    const columns = el.querySelectorAll('colgroup col');
    return {
      columnCount: columns.length,
      tableWidth: el.scrollWidth,
      visibleWidth: el.clientWidth
    };
  }).catch(() => null);

  console.log('\n📊 Table Structure:', tableHTML);

  await page.screenshot({ path: 'console-errors-check.png', fullPage: true });
});
