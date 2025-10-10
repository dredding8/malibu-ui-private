/**
 * Debug test to check what's actually being rendered
 */

import { test, expect } from '@playwright/test';

test('debug bento rendering', async ({ page }) => {
  // Navigate to the collection opportunities hub
  await page.goto('http://localhost:3000/collection/test-123/manage');
  
  // Wait for page to load
  await page.waitForLoadState('networkidle');
  
  // Take a screenshot for debugging
  await page.screenshot({ path: 'debug-bento-state.png', fullPage: true });
  
  // Log page content
  const bodyContent = await page.locator('body').innerHTML();
  console.log('Page contains enhanced bento:', bodyContent.includes('collection-opportunities-enhanced-bento'));
  console.log('Page contains regular bento:', bodyContent.includes('collection-opportunities-bento'));
  console.log('Page contains split view:', bodyContent.includes('collection-opportunities-split-view'));
  
  // Check which component is actually rendered
  const components = [
    '.collection-opportunities-enhanced-bento',
    '.collection-opportunities-bento',
    '.collection-opportunities-split-view',
    '.collection-opportunities-enhanced',
    '.collection-opportunities'
  ];
  
  for (const selector of components) {
    const exists = await page.locator(selector).count() > 0;
    console.log(`${selector}: ${exists ? 'EXISTS' : 'NOT FOUND'}`);
  }
  
  // Check feature flags
  const featureFlags = await page.evaluate(() => {
    // Try to access feature flags from window or localStorage
    const localFlags = localStorage.getItem('featureFlags');
    return localFlags ? JSON.parse(localFlags) : null;
  });
  
  console.log('Feature flags:', featureFlags);
  
  // Check for any error messages
  const errors = await page.locator('.bp5-non-ideal-state').count();
  if (errors > 0) {
    const errorText = await page.locator('.bp5-non-ideal-state').textContent();
    console.log('Error state found:', errorText);
  }
});