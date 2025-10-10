import { test, expect } from '@playwright/test';

test.describe('Collection Detail Panel', () => {
  test.beforeEach(async ({ page }) => {
    // Navigate to history page
    await page.goto('http://localhost:3000/history');
    
    // Wait for the app to load
    await page.waitForSelector('.bp6-table-container', { timeout: 10000 });
    
    console.log('History page loaded');
  });

  test('should display detail panel when clicking table row', async ({ page }) => {
    // Wait for table to have rows
    await page.waitForSelector('.bp6-table-cell', { timeout: 10000 });
    
    // Get all table rows
    const tableCells = await page.$$('.bp6-table-cell');
    console.log(`Found ${tableCells.length} table cells`);
    
    // Click on the first collection name cell
    const firstNameCell = await page.$('.bp6-table-cell:first-child');
    if (firstNameCell) {
      await firstNameCell.click();
      console.log('Clicked on first collection name cell');
    }
    
    // Wait for detail panel to appear
    try {
      await page.waitForSelector('[data-testid="collection-detail-panel"]', { 
        timeout: 5000 
      });
      console.log('✅ Detail panel appeared after clicking row');
      
      // Verify panel content
      const panelTitle = await page.$eval(
        '[data-testid="collection-detail-panel"] h3',
        el => el.textContent
      );
      expect(panelTitle).toBeTruthy();
      console.log(`Panel title: ${panelTitle}`);
      
      // Check if action buttons are present
      const buttons = await page.$$('[data-testid="collection-detail-panel"] button');
      expect(buttons.length).toBeGreaterThan(0);
      console.log(`Found ${buttons.length} action buttons in detail panel`);
      
      // Take screenshot of success state
      await page.screenshot({ 
        path: 'collection-detail-panel-success.png',
        fullPage: true 
      });
      
    } catch (error) {
      console.log('❌ Detail panel did not appear');
      
      // Take screenshot of failure state
      await page.screenshot({ 
        path: 'collection-detail-panel-failure.png',
        fullPage: true 
      });
      
      // Log current page state
      const pageContent = await page.content();
      console.log('Current page state:', pageContent.substring(0, 500) + '...');
      
      throw new Error('Detail panel did not appear after clicking row');
    }
  });

  test('should close detail panel when clicking close button', async ({ page }) => {
    // First click to open panel
    const firstNameCell = await page.$('.bp6-table-cell:first-child');
    if (firstNameCell) {
      await firstNameCell.click();
    }
    
    // Wait for panel to appear
    await page.waitForSelector('[data-testid="collection-detail-panel"]', { 
      timeout: 5000 
    });
    
    // Click close button
    const closeButton = await page.$('[data-testid="collection-detail-panel-close"]');
    if (closeButton) {
      await closeButton.click();
      console.log('Clicked close button');
    }
    
    // Verify panel is hidden
    await expect(page.locator('[data-testid="collection-detail-panel"]')).toBeHidden({ 
      timeout: 2000 
    });
    console.log('✅ Detail panel closed successfully');
  });

  test('should highlight selected row', async ({ page }) => {
    // Click on a row
    const firstNameCell = await page.$('.bp6-table-cell:first-child');
    if (firstNameCell) {
      await firstNameCell.click();
    }
    
    // Check if the row has selection styling
    const selectedCell = await page.$('.bp6-table-cell[style*="background-color"]');
    expect(selectedCell).toBeTruthy();
    console.log('✅ Row highlighting works');
    
    // Take screenshot of highlighted row
    await page.screenshot({ 
      path: 'selected-row-highlight.png',
      fullPage: true 
    });
  });

  test('should handle clicking different table cells', async ({ page }) => {
    // Test clicking on different columns
    const columnSelectors = [
      '.bp6-table-cell:nth-child(1)', // Collection Name
      '.bp6-table-cell:nth-child(2)', // Created Date
      '.bp6-table-cell:nth-child(3)', // Created By
      '.bp6-table-cell:nth-child(4)', // Collection Status
      '.bp6-table-cell:nth-child(5)', // Algorithm Status
      '.bp6-table-cell:nth-child(6)', // Completed Date
    ];
    
    for (const selector of columnSelectors) {
      const cell = await page.$(selector);
      if (cell) {
        await cell.click();
        
        // Check if detail panel appears
        const panelVisible = await page.isVisible('[data-testid="collection-detail-panel"]');
        console.log(`Clicking ${selector}: Panel visible = ${panelVisible}`);
        
        // Small delay between clicks
        await page.waitForTimeout(500);
      }
    }
  });

  test('should display correct collection data in detail panel', async ({ page }) => {
    // Get the collection name from the first row
    const firstNameCell = await page.$('.bp6-table-cell:first-child');
    const collectionName = await firstNameCell?.textContent();
    console.log(`Collection name in table: ${collectionName}`);
    
    // Click the row
    if (firstNameCell) {
      await firstNameCell.click();
    }
    
    // Wait for panel
    await page.waitForSelector('[data-testid="collection-detail-panel"]', { 
      timeout: 5000 
    });
    
    // Verify the panel shows the same collection name
    const panelTitle = await page.$eval(
      '[data-testid="collection-detail-panel"] h3',
      el => el.textContent
    );
    
    expect(panelTitle).toBe(collectionName?.trim());
    console.log('✅ Detail panel shows correct collection data');
  });
});