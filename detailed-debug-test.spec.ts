import { test, expect } from '@playwright/test';

test('Detailed debug of History page', async ({ page }) => {
  await page.goto('/history');
  await page.waitForLoadState('networkidle');
  
  // Take a screenshot
  await page.screenshot({ path: 'detailed-debug.png', fullPage: true });
  
  // Check console errors
  const consoleMessages = await page.evaluate(() => {
    return (window as any).console && (window as any).console.error ? 'Console errors present' : 'No console errors';
  });
  console.log('Console status:', consoleMessages);
  
  // Get the full HTML content
  const fullHTML = await page.content();
  console.log('Full HTML length:', fullHTML.length);
  
  // Look for any table-related elements with correct Blueprint v6 classes
  const tableElements = await page.evaluate(() => {
    const elements = document.querySelectorAll('*');
    const tableRelated: Array<{
      tagName: string;
      className: string;
      id: string;
      textContent: string | undefined;
    }> = [];
    for (let i = 0; i < elements.length; i++) {
      const el = elements[i];
      const tagName = el.tagName.toLowerCase();
      const className = el.className || '';
      if (tagName.includes('table') || className.includes('table') || className.includes('bp6') || className.includes('bp5')) {
        tableRelated.push({
          tagName,
          className,
          id: el.id,
          textContent: el.textContent?.substring(0, 100)
        });
      }
    }
    return tableRelated;
  });
  
  console.log('Table-related elements found:', tableElements.length);
  tableElements.forEach((el, i) => {
    console.log(`Element ${i}:`, el);
  });
  
  // Check if React is actually loaded
  const reactStatus = await page.evaluate(() => {
    return {
      react: typeof window !== 'undefined' && typeof (window as any).React !== 'undefined',
      reactDOM: typeof window !== 'undefined' && typeof (window as any).ReactDOM !== 'undefined',
      blueprint: typeof window !== 'undefined' && typeof (window as any).Blueprint !== 'undefined'
    };
  });
  console.log('React status:', reactStatus);
  
  // Check for any error boundaries or error states
  const errorElements = await page.locator('[data-testid*="error"], .error, .error-message, [class*="error"]').all();
  console.log('Error elements found:', errorElements.length);
  
  // Check the root content more carefully
  const rootContent = await page.locator('#root').innerHTML();
  console.log('Root content length:', rootContent.length);
  console.log('Root content preview:', rootContent.substring(0, 1000));
  
  // Check for specific test IDs that should exist
  const testIds = [
    'nav-master',
    'nav-history', 
    'nav-analytics',
    'nav-logout',
    'start-date-input',
    'end-date-input',
    'reset-dates-button',
    'apply-filter-button',
    'history-table-container'
  ];
  
  for (const testId of testIds) {
    const element = await page.locator(`[data-testid="${testId}"]`).count();
    console.log(`Test ID "${testId}" found: ${element} elements`);
  }
  
  // Check for Blueprint v6 classes
  const bp6Classes = await page.locator('.bp6-').count();
  console.log('Blueprint v6 classes found:', bp6Classes);
  
  // Check for navigation elements
  const navButtons = await page.locator('nav button, .bp6-navbar button').count();
  console.log('Navigation buttons found:', navButtons);
});
