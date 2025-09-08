import { test, expect } from '@playwright/test';

test('History page loads and shows table', async ({ page }) => {
  await page.goto('/history');
  await page.waitForLoadState('networkidle');
  
  // Check if the page loads
  await expect(page.getByText('Job History')).toBeVisible();
  
  // Check if table content is present - use .first() to handle duplicate elements
  await expect(page.getByText('Name').first()).toBeVisible();
  await expect(page.getByText('Collection Status').first()).toBeVisible();
  await expect(page.getByText('Algorithm Status').first()).toBeVisible();
  await expect(page.getByText('Progress').first()).toBeVisible();
  await expect(page.getByText('Created').first()).toBeVisible();
  await expect(page.getByText('Completed').first()).toBeVisible();
  
  // Check if table data is present (these should be unique)
  await expect(page.getByText('UX Test Collection Deck')).toBeVisible();
  await expect(page.getByText('Building your deck...')).toBeVisible();
  await expect(page.getByText('Matching algorithm active')).toBeVisible();
  
  console.log('History page loaded successfully');
});
