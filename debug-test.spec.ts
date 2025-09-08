import { test, expect } from '@playwright/test';

test('Debug React app loading', async ({ page }) => {
  // Collect console messages and errors
  const consoleMessages: string[] = [];
  const consoleErrors: string[] = [];
  
  page.on('console', msg => {
    consoleMessages.push(`${msg.type()}: ${msg.text()}`);
    if (msg.type() === 'error') {
      consoleErrors.push(msg.text());
    }
  });

  // Collect page errors
  const pageErrors: string[] = [];
  page.on('pageerror', error => {
    pageErrors.push(error.message);
  });

  // Navigate to the application
  await page.goto('http://localhost:3001');
  
  // Wait for the page to load
  await page.waitForLoadState('networkidle');
  
  // Wait a bit more for React to initialize
  await page.waitForTimeout(3000);
  
  // Take a screenshot
  await page.screenshot({ path: 'test-results/debug-page.png' });
  
  // Log all console messages
  console.log('Console messages:', consoleMessages);
  
  // Log errors
  if (consoleErrors.length > 0) {
    console.log('Console errors:', consoleErrors);
  }
  
  if (pageErrors.length > 0) {
    console.log('Page errors:', pageErrors);
  }
  
  // Check what's actually in the DOM
  const bodyContent = await page.content();
  console.log('Body content length:', bodyContent.length);
  
  // Check if React root has any content
  const rootElement = await page.locator('#root');
  const rootHTML = await rootElement.innerHTML();
  console.log('Root HTML:', rootHTML);
  
  // Check if there are any script tags
  const scripts = await page.locator('script').count();
  console.log('Number of script tags:', scripts);
  
  // Check if bundle.js loaded
  const bundleLoaded = await page.evaluate(() => {
    return window.location.href.includes('localhost:3001');
  });
  console.log('Bundle loaded check:', bundleLoaded);
  
  // Try to evaluate if React is available
  const reactAvailable = await page.evaluate(() => {
    return typeof window !== 'undefined' && window.React !== undefined;
  }).catch(() => false);
  console.log('React available:', reactAvailable);
});
