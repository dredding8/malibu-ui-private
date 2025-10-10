import { test, expect } from '@playwright/test';

test('Debug rendering issue', async ({ page }) => {
  console.log('Navigating to collection management page...');
  
  // Navigate to the page
  await page.goto('http://localhost:3000/collection/DECK-1757517559289/manage');
  
  // Wait for the page to load
  await page.waitForLoadState('networkidle', { timeout: 30000 });
  
  // Take a screenshot to see what's actually rendered
  await page.screenshot({ path: 'debug-rendering.png', fullPage: true });
  
  // Get the page title
  const title = await page.title();
  console.log(`Page title: ${title}`);
  
  // Get the HTML content of the root element
  const rootContent = await page.locator('#root').innerHTML();
  console.log(`Root element content (first 500 chars): ${rootContent.substring(0, 500)}...`);
  
  // Check for any error messages
  const errorMessages = await page.locator('text=/error|Error|failed|Failed/i').allTextContents();
  if (errorMessages.length > 0) {
    console.log('Error messages found:', errorMessages);
  }
  
  // Check for any React error boundaries
  const errorBoundary = await page.locator('[data-error-boundary], .error-boundary').count();
  console.log(`Error boundaries found: ${errorBoundary}`);
  
  // Check for console errors
  const logs: string[] = [];
  page.on('console', msg => {
    if (msg.type() === 'error') {
      logs.push(msg.text());
    }
  });
  
  await page.waitForTimeout(2000);
  
  if (logs.length > 0) {
    console.log('Console errors:', logs);
  }
  
  // Check if the main React app is mounted
  const reactRoot = await page.evaluate(() => {
    const root = document.getElementById('root');
    return {
      hasChildren: root ? root.children.length > 0 : false,
      innerHTML: root ? root.innerHTML.substring(0, 200) : 'No root element'
    };
  });
  
  console.log('React root status:', reactRoot);
  
  // Basic assertion that the page loaded
  expect(title).toBeTruthy();
});