import { test, expect } from '@playwright/test';

test('Collection management page renders successfully', async ({ page }) => {
  // Navigate to collection management route
  await page.goto('http://localhost:3000/collection/TEST-001/manage');

  // Wait for root element to be visible
  await expect(page.locator('#root')).toBeVisible({ timeout: 10000 });

  // Wait for collection management specific elements
  await expect(page.locator('text=Collection Deck TEST-001')).toBeVisible({ timeout: 10000 });

  // Check for interactive elements
  const buttons = await page.locator('button').count();
  const links = await page.locator('a').count();
  const inputs = await page.locator('input').count();

  console.log(`Found ${buttons} buttons, ${links} links, and ${inputs} inputs`);

  // Take screenshot for visual verification
  await page.screenshot({ path: '/Users/damon/malibu/test-results/collection-ui-rendering.png', fullPage: true });

  // Verify we have the expected elements for collection management
  expect(buttons).toBeGreaterThan(20); // Should have many action buttons
  expect(inputs).toBeGreaterThan(5);   // Should have search and filter inputs

  // Check for key collection management features
  await expect(page.locator('text=Smart Views')).toBeVisible();
  await expect(page.locator('text=Collection Overview')).toBeVisible();
  await expect(page.locator('button:has-text("Filter")')).toBeVisible();
  await expect(page.locator('button:has-text("Refresh")')).toBeVisible();
});
