import { test, expect } from '@playwright/test';

test('Quick visual check of Site Allocation column', async ({ page }) => {
  await page.goto('http://localhost:3000/test-opportunities');
  await page.waitForLoadState('networkidle');
  await page.waitForTimeout(5000);

  // Take full page screenshot
  await page.screenshot({
    path: 'site-allocation-AFTER-FIX.png',
    fullPage: true
  });

  // Count tags
  const tagCount = await page.locator('.site-allocation-tag').count();
  console.log(`✓ Site allocation tags found: ${tagCount}`);

  // Get first tag text
  if (tagCount > 0) {
    const firstTag = page.locator('.site-allocation-tag').first();
    const text = await firstTag.textContent();
    console.log(`✓ First tag text: ${text}`);
  }

  expect(tagCount).toBeGreaterThan(0);
});
