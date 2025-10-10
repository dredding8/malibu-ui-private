import { test } from '@playwright/test';

test('take screenshot of test opportunities page', async ({ page }) => {
  await page.goto('http://localhost:3000/test-opportunities');
  await page.waitForLoadState('networkidle');
  await page.waitForTimeout(2000); // Give it time to render
  
  await page.screenshot({ 
    path: 'test-opportunities-screenshot.png', 
    fullPage: true 
  });
  
  // Also log the table HTML to understand structure
  const tableHTML = await page.locator('.opportunities-table').innerHTML();
  console.log('Table HTML:', tableHTML.substring(0, 500));
});