import { test, expect } from '@playwright/test';

test('Debug i18n loading', async ({ page }) => {
  // Clear browser cache
  await page.goto('about:blank');
  await page.evaluate(() => {
    localStorage.clear();
    sessionStorage.clear();
  });
  
  console.log('🔍 Testing with fresh browser state...');
  await page.goto('http://localhost:3000/history', { 
    waitUntil: 'networkidle' // Wait for all network requests to finish
  });
  
  await page.waitForTimeout(3000); // Extra wait for React/i18n to load
  
  await page.screenshot({ path: 'debug-i18n-history.png' });
  
  // Check what the main heading shows
  const mainHeading = await page.locator('h3').first().textContent();
  console.log('Main heading text:', mainHeading);
  
  // Check if localization hook is working by looking at console
  const logs = [];
  page.on('console', msg => {
    if (msg.type() === 'log' || msg.type() === 'error') {
      logs.push(`${msg.type()}: ${msg.text()}`);
    }
  });
  
  // Refresh to see any console messages
  await page.reload({ waitUntil: 'networkidle' });
  await page.waitForTimeout(2000);
  
  console.log('Console logs:', logs);
  
  // Check DOM for actual rendered content
  const historyContent = await page.locator('[class*="history"]').innerHTML();
  console.log('History page HTML contains "Your Collection":', historyContent.includes('Your Collection'));
});