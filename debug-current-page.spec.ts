import { test, expect } from '@playwright/test';

test('Debug: Check current page content', async ({ page }) => {
  console.log('🔍 Debugging current page content...');
  
  await page.goto('/');
  await page.waitForLoadState('networkidle');
  
  // Take screenshot
  await page.screenshot({ path: 'debug-current-page.png', fullPage: true });
  
  // Get page title
  const title = await page.title();
  console.log('Page title:', title);
  
  // Get all text content
  const bodyText = await page.locator('body').textContent();
  console.log('Page text (first 500 chars):', bodyText?.substring(0, 500));
  
  // Look for any buttons
  const buttons = page.locator('button');
  const buttonCount = await buttons.count();
  console.log('Number of buttons found:', buttonCount);
  
  for (let i = 0; i < Math.min(buttonCount, 10); i++) {
    const buttonText = await buttons.nth(i).textContent();
    const buttonVisible = await buttons.nth(i).isVisible();
    console.log(`Button ${i + 1}: "${buttonText}" (visible: ${buttonVisible})`);
  }
  
  // Look for specific elements
  const hasNavbar = await page.locator('.bp4-navbar').isVisible();
  const hasCards = await page.locator('.bp4-card').count();
  const hasTable = await page.locator('table').isVisible();
  
  console.log('Has navbar:', hasNavbar);
  console.log('Number of cards:', hasCards);
  console.log('Has table:', hasTable);
  
  // Check for Create Collection Deck variations
  const createDeckVariations = [
    'Create Collection Deck',
    'Create Deck',
    'New Collection',
    'Add Collection'
  ];
  
  for (const variation of createDeckVariations) {
    const found = await page.locator(`button:has-text("${variation}")`).count();
    if (found > 0) {
      console.log(`Found button with text: "${variation}"`);
    }
  }
  
  // Get all unique button texts
  const allButtonTexts = await page.$$eval('button', buttons => 
    buttons.map(button => button.textContent?.trim()).filter(Boolean)
  );
  console.log('All button texts:', allButtonTexts);
});