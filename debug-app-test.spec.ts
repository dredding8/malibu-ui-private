import { test, expect } from '@playwright/test';

test('debug app loading', async ({ page }) => {
  console.log('1. Navigating to app...');
  
  // Add console listener to catch errors
  page.on('console', msg => {
    if (msg.type() === 'error') {
      console.error('Console error:', msg.text());
    }
  });
  
  page.on('pageerror', error => {
    console.error('Page error:', error.message);
  });
  
  await page.goto('http://localhost:3000', { waitUntil: 'domcontentloaded' });
  
  console.log('2. Current URL:', page.url());
  
  // Wait a bit for React to render
  await page.waitForTimeout(2000);
  
  // Take a screenshot
  await page.screenshot({ path: 'debug-app-loading.png', fullPage: true });
  console.log('3. Screenshot saved as debug-app-loading.png');
  
  // Check page content
  const pageContent = await page.content();
  console.log('4. Page has content:', pageContent.length > 100 ? 'Yes' : 'No');
  
  // Look for any elements
  const bodyText = await page.textContent('body');
  console.log('5. Body text preview:', bodyText?.substring(0, 200));
  
  // Check for React root
  const reactRoot = await page.locator('#root').count();
  console.log('6. React root found:', reactRoot > 0);
  
  // Check for any Blueprint components
  const blueprintElements = await page.locator('[class*="bp"]').count();
  console.log('7. Blueprint elements found:', blueprintElements);
  
  // Check for navbar specifically
  const navbar = await page.locator('nav').count();
  console.log('8. Nav elements found:', navbar);
  
  // Try alternative selectors
  const buttonsWithTestId = await page.locator('[data-testid]').count();
  console.log('9. Elements with data-testid:', buttonsWithTestId);
  
  // Check for app content
  const appDiv = await page.locator('.app').count();
  console.log('10. App div found:', appDiv > 0);
  
  // List all visible buttons
  const buttons = await page.locator('button:visible').all();
  console.log('11. Visible buttons:', buttons.length);
  
  for (let i = 0; i < Math.min(buttons.length, 5); i++) {
    const text = await buttons[i].textContent();
    console.log(`   Button ${i + 1}: "${text}"`);
  }
});