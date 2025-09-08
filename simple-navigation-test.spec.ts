import { test, expect } from '@playwright/test';

test('Simple navigation test', async ({ page }) => {
  console.log('🧪 Testing simple navigation...');
  
  await page.goto('/');
  await page.waitForLoadState('networkidle');
  
  // Force remove any overlays
  await page.evaluate(() => {
    const overlays = document.querySelectorAll('iframe, [id*="webpack"]');
    overlays.forEach(el => el.remove());
  });
  
  // Take screenshot before clicking
  await page.screenshot({ path: 'before-click.png', fullPage: true });
  
  // Find the button
  const button = page.locator('button:has-text("Create Collection")');
  await expect(button).toBeVisible();
  
  // Force click to bypass overlay issues
  await button.click({ force: true });
  
  // Wait a bit
  await page.waitForTimeout(2000);
  
  // Take screenshot after clicking
  await page.screenshot({ path: 'after-click.png', fullPage: true });
  
  // Check URL changed
  const currentUrl = page.url();
  console.log('Current URL after click:', currentUrl);
  
  // Check for expected content
  const pageText = await page.locator('body').textContent();
  console.log('Page contains "Build Your Collection":', pageText?.includes('Build Your Collection'));
  console.log('Page contains "Step 1":', pageText?.includes('Step 1'));
  console.log('Page contains data-testid elements:', await page.locator('[data-testid]').count());
  
  expect(currentUrl).toMatch(/create-collection-deck/);
});