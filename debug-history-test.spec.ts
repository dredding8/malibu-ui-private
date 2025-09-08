import { test, expect } from '@playwright/test';

test('Debug History page content', async ({ page }) => {
  await page.goto('/history');
  await page.waitForLoadState('networkidle');
  
  // Take a screenshot to see what's on the page
  await page.screenshot({ path: 'debug-history-page.png', fullPage: true });
  
  // Log the page content
  const pageContent = await page.content();
  console.log('Page HTML:', pageContent.substring(0, 1000));
  
  // Check if React is loaded
  const reactLoaded = await page.evaluate(() => {
    return typeof window !== 'undefined' && typeof (window as any).React !== 'undefined';
  });
  console.log('React loaded:', reactLoaded);
  
  // Check if the app root is present
  const appRoot = page.locator('#root');
  await expect(appRoot).toBeVisible();
  
  // Check what's inside the root
  const rootContent = await appRoot.innerHTML();
  console.log('Root content:', rootContent.substring(0, 500));
  
  // Check for any error messages
  const errorElements = page.locator('.error, .error-message, [data-testid*="error"]');
  const errorCount = await errorElements.count();
  console.log('Error elements found:', errorCount);
  
  if (errorCount > 0) {
    for (let i = 0; i < errorCount; i++) {
      const errorText = await errorElements.nth(i).textContent();
      console.log('Error:', errorText);
    }
  }
  
  // Check for the history title
  const historyTitle = page.getByText('Job History');
  const titleVisible = await historyTitle.isVisible();
  console.log('History title visible:', titleVisible);
  
  // Check for any table elements
  const tables = page.locator('table, .bp4-table, .bp5-table, [role="table"]');
  const tableCount = await tables.count();
  console.log('Table elements found:', tableCount);
  
  // Check for any status elements
  const statusElements = page.locator('[data-testid*="status"]');
  const statusCount = await statusElements.count();
  console.log('Status elements found:', statusCount);
});
