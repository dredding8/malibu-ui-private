import { test, expect } from '@playwright/test';

test('Simple navigation test', async ({ page }) => {
  await page.goto('/');
  await page.waitForLoadState('domcontentloaded');
  
  // Check if page loads
  await expect(page).toHaveURL('/');
  
  // Look for any navigation-related elements
  const navbar = page.locator('.bp6-navbar');
  await expect(navbar).toBeVisible({ timeout: 5000 });
  
  // Check for VUE Dashboard text
  const heading = page.getByText('VUE Dashboard');
  await expect(heading).toBeVisible({ timeout: 5000 });
  
  // Check for basic navigation buttons
  const navButtons = page.locator('.bp6-navbar .bp6-button');
  await expect(navButtons).toHaveCount(6); // 5 nav items + 1 logout
});