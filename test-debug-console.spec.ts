import { test } from '@playwright/test';

test('Debug console logs and page state', async ({ page }) => {
  // Capture console logs
  const logs: string[] = [];
  page.on('console', msg => {
    const text = msg.text();
    logs.push(`${msg.type()}: ${text}`);
    console.log(`[BROWSER ${msg.type()}]`, text);
  });

  // Capture errors
  page.on('pageerror', error => {
    console.log('[BROWSER ERROR]', error.message);
  });

  // Navigate
  await page.goto('http://localhost:3000/collection/DECK-1756423202347/manage');
  await page.waitForLoadState('networkidle');
  await page.waitForTimeout(3000);

  // Check what's in the DOM
  const pageContent = await page.content();

  // Look for key elements
  const hasTable = await page.locator('table, .opportunities-table, [role="grid"]').count();
  const hasNonIdeal = await page.locator('[class*="non-ideal"], .bp6-non-ideal-state').count();
  const searchValue = await page.locator('input[type="search"], input[placeholder*="search" i]').inputValue().catch(() => '');

  console.log('\n=== PAGE STATE ===');
  console.log('Tables found:', hasTable);
  console.log('NonIdealState components:', hasNonIdeal);
  console.log('Search input value:', searchValue);
  console.log('\n=== CONSOLE LOGS ===');
  logs.forEach(log => console.log(log));

  // Check React DevTools data if available
  const reactData = await page.evaluate(() => {
    // Try to access React state
    const root = document.querySelector('#root');
    if (root && (root as any)._reactRootContainer) {
      return 'React root found';
    }
    return 'No React root';
  });
  console.log('React state:', reactData);
});
