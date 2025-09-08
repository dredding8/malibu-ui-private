import { test, expect } from '@playwright/test';

test('Simple application load test', async ({ page }) => {
  // Navigate to the application
  await page.goto('http://localhost:3001');
  
  // Wait for the page to load
  await page.waitForLoadState('networkidle');
  
  // Check if the root element exists
  const rootElement = await page.locator('#root');
  await expect(rootElement).toBeVisible();
  
  // Take a screenshot to see what's on the page
  await page.screenshot({ path: 'test-results/debug-screenshot.png' });
  
  // Log the page content for debugging
  const pageContent = await page.content();
  console.log('Page content:', pageContent.substring(0, 1000));
  
  // Check if there are any console errors
  const consoleErrors: string[] = [];
  page.on('console', msg => {
    if (msg.type() === 'error') {
      consoleErrors.push(msg.text());
    }
  });
  
  // Wait a bit more for any JavaScript to load
  await page.waitForTimeout(5000);
  
  // Log any console errors
  if (consoleErrors.length > 0) {
    console.log('Console errors:', consoleErrors);
  }
  
  // Try to find any text on the page
  const allText = await page.textContent('body');
  console.log('Body text:', allText?.substring(0, 500));
});
