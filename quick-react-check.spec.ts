import { test, expect } from '@playwright/test';

test('Quick React Mount Check', async ({ page }) => {
  console.log('🔍 Checking if React is now mounting properly...');

  // Navigate to dashboard
  await page.goto('http://localhost:3000/dashboard');
  await page.waitForLoadState('networkidle');
  await page.waitForTimeout(3000);

  // Check React mounting
  const reactMountCheck = await page.evaluate(() => {
    const rootElement = document.getElementById('root');
    return {
      exists: !!rootElement,
      hasChildren: rootElement?.children.length || 0,
      innerHTML: rootElement?.innerHTML?.slice(0, 500) || 'No content',
      totalElements: document.querySelectorAll('*').length
    };
  });

  console.log('React mount status:', reactMountCheck);

  // Look for any JavaScript errors
  const jsErrors = [];
  page.on('pageerror', error => {
    jsErrors.push(error.message);
  });

  // Take screenshot
  await page.screenshot({ 
    path: 'quick-react-check.png', 
    fullPage: true 
  });

  // Check for basic app elements
  const hasApp = await page.evaluate(() => {
    return !!(document.querySelector('[data-testid="app"], .App, #app') ||
              document.querySelector('div[class*="App"]') ||
              document.querySelector('main, section, article'));
  });

  console.log('Has app elements:', hasApp);
  console.log('JavaScript errors:', jsErrors);

  // Log some basic facts
  console.log(`React mounted: ${reactMountCheck.exists && reactMountCheck.hasChildren > 0}`);
  console.log(`Total DOM elements: ${reactMountCheck.totalElements}`);
  console.log(`Has app content: ${hasApp}`);
});