import { test, expect } from '@playwright/test';

test.describe('Collection Opportunities Refactored - Screenshot Validation', () => {
  test('Validate refactored implementation is working', async ({ page }) => {
    // Navigate to history page
    await page.goto('http://localhost:3000/history');
    await page.waitForSelector('.bp5-navbar');
    
    // Click on a collection deck to navigate to opportunities
    const firstDeck = await page.locator('.collection-decks-table .bp5-table-row-cell').first();
    await firstDeck.click();
    
    // Wait for navigation to collection opportunities
    await page.waitForURL(/\/collection-opportunities\//);
    await page.waitForTimeout(2000); // Allow time for component to fully render
    
    // Take screenshot of the main table
    await page.screenshot({ 
      path: 'refactored-implementation-table.png',
      fullPage: false 
    });
    
    // Verify key elements are present
    const tableContainer = await page.locator('.collection-opportunities-refactored');
    await expect(tableContainer).toBeVisible();
    
    // Check for table
    const table = await page.locator('.opportunities-table');
    await expect(table).toBeVisible();
    
    // Click on a row to test selection
    const firstRow = await page.locator('.bp5-table-row-cell').first();
    await firstRow.click();
    await page.waitForTimeout(500);
    
    // Click Override Selected button to open modal
    const overrideButton = await page.locator('button:has-text("Override Selected")');
    if (await overrideButton.isVisible()) {
      await overrideButton.click();
      await page.waitForSelector('.manual-override-modal-refactored');
      
      // Take screenshot of the override modal
      await page.screenshot({ 
        path: 'refactored-override-modal.png',
        fullPage: true 
      });
      
      // Verify modal elements
      await expect(page.locator('.split-workspace')).toBeVisible();
      await expect(page.locator('.left-panel')).toBeVisible();
      await expect(page.locator('.right-panel')).toBeVisible();
      
      console.log('✅ Refactored implementation validated successfully!');
    }
  });
});