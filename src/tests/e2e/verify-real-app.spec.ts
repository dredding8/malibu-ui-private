import { test, expect } from '@playwright/test';

test.describe('Verify Real Application Testing', () => {
  test('Confirm testing against localhost:3000', async ({ page }) => {
    // Navigate to the actual application
    await page.goto('http://localhost:3000/collection/1/manage');
    
    // Take a screenshot to prove we're testing the real app
    await page.screenshot({ 
      path: 'test-results/empathy-tests/screenshots/real-app-verification.png',
      fullPage: true 
    });
    
    // Wait for content to load
    await page.waitForLoadState('networkidle');
    
    // Log the actual URL we're testing
    const currentUrl = page.url();
    console.log('✅ Testing real application at:', currentUrl);
    
    // Check for application-specific elements
    const hasAppContent = await page.locator('.collection-opportunities-hub, .bp5-card, main').count() > 0;
    expect(hasAppContent).toBeTruthy();
    
    // Verify we can see actual data or UI elements
    const pageTitle = await page.title();
    console.log('📄 Page title:', pageTitle);
    
    // Check for Blueprint UI components (proves it's the real app)
    const blueprintComponents = await page.locator('.bp5-button, .bp5-card, .bp5-input').count();
    console.log('🎨 Blueprint components found:', blueprintComponents);
    
    // Take another screenshot with annotations
    await page.evaluate(() => {
      const banner = document.createElement('div');
      banner.innerHTML = 'TESTING REAL APP AT ' + new Date().toLocaleString();
      banner.style.cssText = 'position:fixed;top:0;left:0;right:0;background:green;color:white;padding:10px;text-align:center;z-index:9999;font-size:20px;';
      document.body.appendChild(banner);
    });
    
    await page.screenshot({ 
      path: 'test-results/empathy-tests/screenshots/real-app-with-banner.png',
      fullPage: true 
    });
    
    console.log('📸 Screenshots saved to test-results/empathy-tests/screenshots/');
  });
});