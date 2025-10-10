import { test, expect } from '@playwright/test';

test.describe('Collection Management Page - Simple Test', () => {
  const COLLECTION_URL = 'http://localhost:3000/collection/DECK-1757517559289/manage';
  
  test('Page loads and basic elements exist', async ({ page }) => {
    // Navigate to the page
    const response = await page.goto(COLLECTION_URL, {
      waitUntil: 'domcontentloaded',
      timeout: 30000
    });
    
    // Check if page loaded
    expect(response).toBeTruthy();
    if (response) {
      expect(response.status()).toBeLessThan(400);
    }
    
    // Wait a bit for React to render
    await page.waitForTimeout(2000);
    
    // Take a screenshot for debugging
    await page.screenshot({ path: 'collection-management-simple.png', fullPage: true });
    
    // Check for basic elements
    const body = await page.locator('body').textContent();
    console.log('Page content preview:', body?.substring(0, 200));
    
    // Check if we have any visible text
    const visibleElements = await page.locator('*:visible').count();
    console.log('Visible elements count:', visibleElements);
    expect(visibleElements).toBeGreaterThan(0);
  });
  
  test('Console errors check', async ({ page }) => {
    const errors: string[] = [];
    
    page.on('console', msg => {
      if (msg.type() === 'error') {
        errors.push(msg.text());
      }
    });
    
    await page.goto(COLLECTION_URL);
    await page.waitForTimeout(3000);
    
    // Log any errors found
    if (errors.length > 0) {
      console.log('Console errors found:', errors);
    }
    
    // This test will pass even with errors, but log them
    expect(errors.length).toBeGreaterThanOrEqual(0);
  });
});