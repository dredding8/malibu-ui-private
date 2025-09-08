import { test, expect } from '@playwright/test';

test.describe('Debug Element Detection', () => {
  test('Check if create-deck-title exists and find alternatives', async ({ page }) => {
    console.log('Navigating to the page...');
    await page.goto('http://localhost:3000/create-collection-deck/data');
    
    // Wait for React to load
    await page.waitForSelector('#root', { timeout: 10000 });
    console.log('Root element loaded');
    
    // Wait for some content to load
    await page.waitForTimeout(3000);
    
    // Take a screenshot for debugging
    await page.screenshot({ path: 'debug-page-state.png', fullPage: true });
    
    // Check what's actually in the page
    const pageContent = await page.content();
    console.log('Page title:', await page.title());
    
    // Look for the expected element
    const titleElement = await page.locator('[data-testid="create-deck-title"]').count();
    console.log('Title element count:', titleElement);
    
    // Look for h1 elements as alternatives
    const h1Elements = await page.locator('h1').all();
    console.log('H1 elements found:', h1Elements.length);
    
    for (let i = 0; i < h1Elements.length; i++) {
      const text = await h1Elements[i].textContent();
      const testId = await h1Elements[i].getAttribute('data-testid');
      console.log(`H1 ${i}: "${text}", testid: ${testId}`);
    }
    
    // Look for other potential title elements
    const potentialTitles = await page.locator('h1, h2, h3').all();
    console.log('Total heading elements:', potentialTitles.length);
    
    for (let i = 0; i < Math.min(potentialTitles.length, 5); i++) {
      const text = await potentialTitles[i].textContent();
      const tagName = await potentialTitles[i].evaluate(el => el.tagName);
      console.log(`Heading ${i}: ${tagName} - "${text}"`);
    }
    
    // Check if we have any Blueprint components loaded
    const blueprintElements = await page.locator('.bp4-card, .bp5-card, .bp6-card').count();
    console.log('Blueprint elements found:', blueprintElements);
    
    // Check for React Router
    const routerElements = await page.locator('[data-testid*="create"], [class*="create"]').count();
    console.log('Create-related elements:', routerElements);
  });
});