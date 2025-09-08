import { test, expect } from '@playwright/test';

test('Debug what\'s actually on the pages', async ({ page }) => {
  console.log('🔍 Testing Dashboard page...');
  await page.goto('http://localhost:3000');
  await page.waitForTimeout(2000); // Wait for React to load
  
  // Take a screenshot to see what's there
  await page.screenshot({ path: 'debug-dashboard.png' });
  
  // Check what navigation elements exist
  const navButtons = await page.locator('.bp6-navbar .bp6-button').allTextContents();
  console.log('Navigation buttons:', navButtons);
  
  // Check what headings exist
  const headings = await page.locator('h1, h2, h3, h4, h5, h6').allTextContents();
  console.log('All headings:', headings);
  
  // Check for specific elements
  const hasNavbar = await page.locator('.bp6-navbar').isVisible();
  console.log('Has navbar:', hasNavbar);
  
  console.log('🔍 Testing History page...');
  await page.goto('http://localhost:3000/history');
  await page.waitForTimeout(2000);
  
  await page.screenshot({ path: 'debug-history.png' });
  
  const historyHeadings = await page.locator('h1, h2, h3, h4, h5, h6').allTextContents();
  console.log('History headings:', historyHeadings);
  
  // Check what the page title actually shows
  const title = await page.title();
  console.log('Page title:', title);
  
  // Check if localization is working
  const hasI18nElements = await page.locator('[data-testid]').count();
  console.log('Elements with test IDs:', hasI18nElements);
});