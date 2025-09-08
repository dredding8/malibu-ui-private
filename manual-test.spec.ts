import { test, expect } from '@playwright/test';

test('Manual background processing validation', async ({ page }) => {
  // Navigate to the application
  await page.goto('http://localhost:3001');
  
  // Wait for the page to load
  await page.waitForLoadState('networkidle');
  
  // Handle webpack overlay
  await page.evaluate(() => {
    const overlay = document.getElementById('webpack-dev-server-client-overlay');
    if (overlay) overlay.remove();
    const iframes = document.querySelectorAll('iframe[src="about:blank"]');
    iframes.forEach(iframe => iframe.remove());
  });
  
  // Verify the dashboard is loaded
  await expect(page.locator('text=VUE Dashboard')).toBeVisible();
  
  // Navigate to Collection Decks
  await page.click('button:has-text("Decks")');
  await expect(page).toHaveURL(/.*\/decks/);
  
  // Click Create New Deck
  await page.click('button:has-text("Create New Deck")');
  await expect(page).toHaveURL(/.*\/decks\/new\/data/);
  
  // Fill in Step 1 data
  await page.fill('input[placeholder*="start"]', '2024-01-01');
  await page.fill('input[placeholder*="end"]', '2024-01-31');
  await page.selectOption('select', 'UDL');
  await page.selectOption('select:last-of-type', 'BLUESTAT');
  
  // Navigate to Step 2
  await page.click('button:has-text("Next")');
  await expect(page).toHaveURL(/.*\/decks\/new\/parameters/);
  
  // Fill in Step 2 parameters
  await page.fill('input[placeholder*="capacity"]', '10');
  await page.fill('input[placeholder*="duration"]', '30');
  await page.fill('input[placeholder*="elevation"]', '15');
  
  // Test background processing initiation
  await page.click('button:has-text("Next")');
  
  // Verify confirmation dialog appears
  await expect(page.locator('.bp4-alert')).toBeVisible();
  await expect(page.locator('text=Background Processing')).toBeVisible();
  
  // Confirm background processing
  await page.click('button:has-text("Start Background Processing")');
  
  // Verify redirect to History page
  await expect(page).toHaveURL(/.*\/history/);
  
  // Verify processing status is displayed
  await expect(page.locator('text=Background Processing Active')).toBeVisible();
  await expect(page.locator('.bp4-progress-bar')).toBeVisible();
  
  console.log('Background processing test completed successfully!');
});
