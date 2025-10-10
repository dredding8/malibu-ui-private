import { test } from '@playwright/test';

test('debug live application state', async ({ page }) => {
  console.log('\n=== DEBUGGING LIVE APPLICATION ===\n');

  // Listen for console messages
  page.on('console', msg => {
    if (msg.type() === 'error') {
      console.log('❌ Browser Error:', msg.text());
    } else if (msg.type() === 'warning') {
      console.log('⚠️  Browser Warning:', msg.text());
    }
  });

  // Listen for page errors
  page.on('pageerror', err => {
    console.log('❌ Page Error:', err.message);
  });

  await page.goto('http://localhost:3000/collection/DECK-1758570229031/manage');

  // Wait and see what loads
  await page.waitForTimeout(5000);

  // Take screenshot
  await page.screenshot({
    path: 'src/tests/analysis/debug-screenshot.png',
    fullPage: true
  });

  // Check what's actually on the page
  const content = await page.evaluate(() => {
    return {
      hasLoadingSpinner: !!document.querySelector('.bp5-spinner'),
      hasHeader: !!document.querySelector('.hub-header'),
      hasActionButtonGroup: !!document.querySelector('.action-button-group'),
      bodyText: document.body.innerText.substring(0, 500)
    };
  });

  console.log('\nPage Content:');
  console.log(JSON.stringify(content, null, 2));
});
