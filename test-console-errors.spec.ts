import { test, expect } from '@playwright/test';

test('Capture console errors on collection route', async ({ page }) => {
  const consoleMessages: string[] = [];
  const errors: string[] = [];

  // Listen to all console messages
  page.on('console', msg => {
    consoleMessages.push(`${msg.type()}: ${msg.text()}`);
  });

  // Listen to page errors
  page.on('pageerror', error => {
    errors.push(error.message);
  });

  console.log('Navigating to collection management route...');

  try {
    await page.goto('http://localhost:3000/collection/TEST-001/manage', {
      waitUntil: 'networkidle',
      timeout: 10000
    });

    // Wait a bit to see if errors occur
    await page.waitForTimeout(3000);

  } catch (error) {
    console.log('Navigation failed:', error);
  }

  console.log('\n=== CONSOLE MESSAGES ===');
  consoleMessages.forEach(msg => console.log(msg));

  console.log('\n=== PAGE ERRORS ===');
  errors.forEach(err => console.log(err));

  // Take screenshot
  await page.screenshot({ path: 'test-results/console-debug.png', fullPage: true });
});
