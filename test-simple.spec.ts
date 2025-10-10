import { test, expect } from '@playwright/test';

test('Collection page loads without error overlay', async ({ page }) => {
  // Navigate to collection management route
  await page.goto('http://localhost:3000/collection/TEST-001/manage');

  // Wait for page to load
  await page.waitForTimeout(5000);

  // Check if error overlay exists
  const errorOverlay = page.locator('text=Maximum update depth exceeded').first();
  const hasError = await errorOverlay.isVisible({ timeout: 1000 }).catch(() => false);

  if (hasError) {
    console.log('ERROR: Infinite loop detected on collection page!');
    await page.screenshot({ path: '/Users/damon/malibu/test-results/collection-error-overlay.png', fullPage: true });
  } else {
    console.log('SUCCESS: No error overlay detected');
  }

  // Try to close any error overlay if it exists
  const closeButton = page.locator('button:has-text("×")').first();
  if (await closeButton.isVisible({ timeout: 1000 }).catch(() => false)) {
    await closeButton.click();
    await page.waitForTimeout(1000);
  }

  // Take screenshot
  await page.screenshot({ path: '/Users/damon/malibu/test-results/collection-page-state.png', fullPage: true });

  // Check for collection management elements
  const pageContent = await page.content();
  console.log('Page has content length:', pageContent.length);

  const buttons = await page.locator('button').count();
  const links = await page.locator('a').count();
  const inputs = await page.locator('input').count();

  console.log(`Found ${buttons} buttons, ${links} links, and ${inputs} inputs`);

  // Verify we have a working page (not just error overlay)
  expect(buttons).toBeGreaterThan(20);

  // Verify no infinite loop error
  expect(hasError).toBe(false);
});
