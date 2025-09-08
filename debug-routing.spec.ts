import { test, expect } from '@playwright/test';

test('Debug: Check routing behavior', async ({ page }) => {
  console.log('🔍 Debugging routing behavior...');
  
  // Start from homepage
  await page.goto('/');
  await page.waitForLoadState('networkidle');
  console.log('Starting URL:', page.url());
  
  // Check what happens when we click
  console.log('Clicking Create Collection button...');
  const createButton = page.locator('button:has-text("Create Collection")');
  await expect(createButton).toBeVisible();
  
  // Monitor navigation events
  page.on('response', response => {
    console.log(`Response: ${response.status()} ${response.url()}`);
  });
  
  page.on('request', request => {
    console.log(`Request: ${request.method()} ${request.url()}`);
  });
  
  // Click and wait for navigation
  await createButton.click({ force: true });
  
  // Wait a bit and check URL
  await page.waitForTimeout(3000);
  console.log('URL after click:', page.url());
  
  // Try direct navigation to the expected URL
  console.log('\nTrying direct navigation...');
  await page.goto('/create-collection-deck/data');
  await page.waitForLoadState('networkidle');
  await page.waitForTimeout(2000);
  console.log('URL after direct navigation:', page.url());
  
  // Check page content
  const pageText = await page.locator('body').textContent();
  console.log('Page contains Build Your Collection:', pageText?.includes('Build Your Collection'));
  console.log('Page contains Step 1:', pageText?.includes('Step 1'));
  
  // Take screenshot
  await page.screenshot({ path: 'debug-routing.png', fullPage: true });
  
  // Check for any form elements after direct navigation
  const formElements = await page.locator('input, select, textarea').count();
  console.log('Form elements after direct navigation:', formElements);
});