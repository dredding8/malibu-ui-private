import { test, expect } from '@playwright/test';

test('Debug Collection Decks page elements', async ({ page }) => {
  await page.goto('/decks');
  await page.waitForLoadState('networkidle');
  
  // Take a screenshot to see what's on the page
  await page.screenshot({ path: 'collection-decks-debug.png', fullPage: true });
  
  // List all buttons on the page
  const buttons = await page.locator('button').all();
  console.log('Found buttons:', buttons.length);
  
  for (let i = 0; i < buttons.length; i++) {
    const button = buttons[i];
    const text = await button.textContent();
    const testId = await button.getAttribute('data-testid');
    console.log(`Button ${i}: "${text}" with testid: "${testId}"`);
  }
  
  // Look for the create collection button specifically
  const createButtons = await page.locator('button:has-text("Create")').all();
  console.log('Create buttons found:', createButtons.length);
  
  for (let i = 0; i < createButtons.length; i++) {
    const button = createButtons[i];
    const text = await button.textContent();
    const testId = await button.getAttribute('data-testid');
    console.log(`Create Button ${i}: "${text}" with testid: "${testId}"`);
  }
});