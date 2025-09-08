import { test, expect } from '@playwright/test';

test.describe('Debug Console Errors', () => {
  test('Capture console errors and page state', async ({ page }) => {
    const consoleMessages: string[] = [];
    const pageErrors: string[] = [];
    
    // Capture console messages
    page.on('console', msg => {
      const text = `[${msg.type().toUpperCase()}] ${msg.text()}`;
      consoleMessages.push(text);
      console.log('Console message:', text);
    });
    
    // Capture page errors
    page.on('pageerror', err => {
      const errorText = err.toString();
      pageErrors.push(errorText);
      console.log('Page error:', errorText);
    });
    
    console.log('Navigating to the page...');
    await page.goto('http://localhost:3000/create-collection-deck/data');
    
    // Wait for React to load
    await page.waitForSelector('#root', { timeout: 10000 });
    console.log('Root element loaded');
    
    // Wait longer to see if the app loads
    await page.waitForTimeout(5000);
    
    // Take screenshot for debugging
    await page.screenshot({ path: 'debug-console-errors.png', fullPage: true });
    
    // Check what's on the page
    const pageContent = await page.textContent('body');
    console.log('Page body content:');
    console.log(pageContent?.substring(0, 500) + '...');
    
    // Print all console messages
    console.log('\n--- Console Messages ---');
    consoleMessages.forEach(msg => console.log(msg));
    
    // Print all page errors  
    console.log('\n--- Page Errors ---');
    pageErrors.forEach(err => console.log(err));
    
    // Check for error elements
    const errorElements = await page.locator(':has-text("Error")').count();
    console.log('Elements containing "Error":', errorElements);
    
    if (errorElements > 0) {
      const errorText = await page.locator(':has-text("Error")').first().textContent();
      console.log('Error element text:', errorText);
    }
    
    // Test will pass regardless - this is just for debugging
    expect(true).toBe(true);
  });
});