import { test, expect } from '@playwright/test';

test('debug Hub component errors', async ({ page }) => {
  // Capture console errors
  const consoleErrors: string[] = [];
  page.on('console', msg => {
    if (msg.type() === 'error') {
      consoleErrors.push(msg.text());
    }
  });
  
  page.on('pageerror', err => {
    consoleErrors.push(err.message);
  });
  
  // Navigate to Hub route
  await page.goto('http://localhost:3000/collection/123/manage');
  await page.waitForTimeout(3000);
  
  // Log any errors
  if (consoleErrors.length > 0) {
    console.log('Console Errors Found:');
    consoleErrors.forEach((err, i) => {
      console.log(`${i + 1}. ${err}`);
    });
  }
  
  // Check what's actually rendered
  const pageInfo = await page.evaluate(() => {
    const reactRoot = document.getElementById('root');
    const appDiv = document.querySelector('.app');
    
    return {
      hasReactRoot: !!reactRoot,
      reactRootHTML: reactRoot?.innerHTML.substring(0, 500),
      hasAppDiv: !!appDiv,
      routerRendered: document.body.innerHTML.includes('react-router'),
      currentPath: window.location.pathname,
      bodyHTML: document.body.innerHTML.substring(0, 1000)
    };
  });
  
  console.log('Page Debug Info:', JSON.stringify(pageInfo, null, 2));
  
  // Take screenshot
  await page.screenshot({ 
    path: 'test-results/screenshots/hub-debug-errors.png',
    fullPage: true 
  });
  
  // Try to force a re-render
  await page.evaluate(() => {
    // Trigger a route change
    const event = new PopStateEvent('popstate');
    window.dispatchEvent(event);
  });
  
  await page.waitForTimeout(2000);
  
  // Check again after potential re-render
  const afterRerender = await page.evaluate(() => {
    return {
      hubFound: !!document.querySelector('.collection-opportunities-hub'),
      enhancedFound: !!document.querySelector('.collection-opportunities-enhanced'),
      anyError: !!document.querySelector('.error, [class*="error"]'),
      loading: !!document.querySelector('.spinner, [class*="loading"]')
    };
  });
  
  console.log('After re-render check:', afterRerender);
});