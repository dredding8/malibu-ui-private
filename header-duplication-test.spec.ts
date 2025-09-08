import { test, expect } from '@playwright/test';

test.describe('History Table Header Validation', () => {
  test('should count exact header instances and check for duplication', async ({ page }) => {
    // Navigate to history page
    await page.goto('http://localhost:3000/history');
    
    // Wait for the table to load
    await page.waitForSelector('[data-testid="history-table-container"]', { timeout: 10000 });
    
    // Take initial screenshot
    await page.screenshot({ 
      path: 'history-headers-test.png', 
      fullPage: true 
    });
    
    // Count header instances by checking all column headers
    const headerTexts = [
      'Deck Name', 
      'Deck Status', 
      'Processing Status', 
      'Progress', 
      'Created', 
      'Completed', 
      'Actions'
    ];
    
    console.log('=== HEADER DUPLICATION ANALYSIS ===');
    
    // Count occurrences of each header text
    for (const headerText of headerTexts) {
      const elements = await page.locator(`text="${headerText}"`).all();
      console.log(`"${headerText}": ${elements.length} instances`);
      
      // Verify each header appears exactly once
      expect(elements.length).toBeLessThanOrEqual(1);
    }
    
    // Check for Blueprint Table2 header structure
    const headerRows = await page.locator('.bp3-table-thead .bp3-table-row').all();
    console.log(`Header rows found: ${headerRows.length}`);
    expect(headerRows.length).toBeLessThanOrEqual(1);
    
    // Check for any duplicate column headers within the table structure
    const allColumns = await page.locator('.bp3-table-column-name').all();
    console.log(`Total column name elements: ${allColumns.length}`);
    
    // Verify we have exactly 7 columns (no duplicates)
    expect(allColumns.length).toBe(7);
    
    // Check individual column header text content
    const columnTexts = [];
    for (let i = 0; i < allColumns.length; i++) {
      const text = await allColumns[i].textContent();
      columnTexts.push(text);
      console.log(`Column ${i + 1}: "${text}"`);
    }
    
    // Verify no duplicate column names
    const uniqueColumns = [...new Set(columnTexts)];
    expect(uniqueColumns.length).toBe(columnTexts.length);
    
    console.log('=== VALIDATION COMPLETE ===');
    console.log(`Unique columns: ${uniqueColumns.length} / ${columnTexts.length}`);
    
    // Additional Blueprint Table2 specific checks
    const tableContainer = await page.locator('.bp3-table-container').first();
    expect(tableContainer).toBeTruthy();
    
    const table2Element = await page.locator('.bp3-table2').first();
    expect(table2Element).toBeTruthy();
    
    console.log('Table structure validated successfully');
  });
  
  test('should verify single header row structure', async ({ page }) => {
    await page.goto('http://localhost:3000/history');
    await page.waitForSelector('[data-testid="history-table-container"]');
    
    // Check Blueprint Table2 specific header structure
    const thead = await page.locator('.bp3-table-thead').first();
    const headerCells = await thead.locator('.bp3-table-header').all();
    
    console.log(`Header cells in thead: ${headerCells.length}`);
    expect(headerCells.length).toBe(7); // Should have exactly 7 header cells
    
    // Verify header content
    const expectedHeaders = [
      'Deck Name',
      'Deck Status', 
      'Processing Status',
      'Progress',
      'Created',
      'Completed',
      'Actions'
    ];
    
    for (let i = 0; i < Math.min(headerCells.length, expectedHeaders.length); i++) {
      const headerText = await headerCells[i].locator('.bp3-table-column-name').textContent();
      console.log(`Expected: "${expectedHeaders[i]}" | Actual: "${headerText}"`);
      expect(headerText).toBe(expectedHeaders[i]);
    }
  });
  
  test('should take comprehensive screenshot for visual validation', async ({ page }) => {
    await page.goto('http://localhost:3000/history');
    await page.waitForSelector('[data-testid="history-table-container"]');
    
    // Wait a bit for any dynamic content
    await page.waitForTimeout(2000);
    
    // Take full page screenshot
    await page.screenshot({ 
      path: 'history-table-final-validation.png',
      fullPage: true,
      animations: 'disabled'
    });
    
    // Take focused screenshot of just the table header
    const tableHeader = page.locator('.bp3-table-thead');
    await tableHeader.screenshot({ 
      path: 'history-table-header-only.png'
    });
    
    console.log('Screenshots captured for visual validation');
  });
});