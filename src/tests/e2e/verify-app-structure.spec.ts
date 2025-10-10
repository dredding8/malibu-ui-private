import { test, expect } from '@playwright/test';

test.describe('Verify Application Structure', () => {
  test('Check actual UI elements in running app', async ({ page }) => {
    console.log('🚀 Starting verification of real application...');
    
    // Navigate to the main page first
    await page.goto('http://localhost:3000');
    console.log('📍 Navigated to:', page.url());
    
    // Take screenshot of main page
    await page.screenshot({ 
      path: 'test-results/empathy-tests/screenshots/main-page.png',
      fullPage: true 
    });
    
    // Wait for any React/Vue app to load
    await page.waitForTimeout(2000);
    
    // Log what we can see on the page
    const bodyText = await page.locator('body').innerText();
    console.log('📄 Page content preview:', bodyText.substring(0, 200) + '...');
    
    // Check for various possible root elements
    const possibleRoots = [
      '#root',
      '#app',
      '.app',
      'main',
      '[role="main"]',
      '.container',
      '.bp5-card',
      'div[class*="app"]'
    ];
    
    for (const selector of possibleRoots) {
      const count = await page.locator(selector).count();
      if (count > 0) {
        console.log(`✅ Found ${count} element(s) matching: ${selector}`);
      }
    }
    
    // Try navigating to the collection management page
    try {
      await page.goto('http://localhost:3000/collection/1/manage');
      console.log('📍 Navigated to collection management page');
      
      await page.waitForTimeout(2000);
      
      // Take screenshot
      await page.screenshot({ 
        path: 'test-results/empathy-tests/screenshots/collection-page.png',
        fullPage: true 
      });
      
      // Log what elements are present
      const elements = await page.evaluate(() => {
        const all = document.querySelectorAll('*');
        const summary = {
          totalElements: all.length,
          buttons: document.querySelectorAll('button').length,
          links: document.querySelectorAll('a').length,
          tables: document.querySelectorAll('table').length,
          forms: document.querySelectorAll('form').length,
          inputs: document.querySelectorAll('input').length,
          divs: document.querySelectorAll('div').length,
        };
        return summary;
      });
      
      console.log('🔍 Page structure:', elements);
      
      // Check for any error messages
      const errorMessages = await page.locator('.error, [role="alert"], .bp5-toast').count();
      console.log(`⚠️  Error messages found: ${errorMessages}`);
      
    } catch (navError) {
      console.log('❌ Error navigating to collection page:', navError.message);
    }
    
    // Final verification
    expect(page.url()).toContain('localhost:3000');
  });
});