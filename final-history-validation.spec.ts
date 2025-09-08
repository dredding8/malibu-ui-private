import { test, expect } from '@playwright/test';

test.describe('History Table Final Validation', () => {
  test('comprehensive final validation of all history table issues', async ({ page }) => {
    // Navigate to history page
    await page.goto('http://localhost:3000/history');
    
    // Wait for page to be fully loaded
    await page.waitForLoadState('networkidle');
    
    // Wait for table to be visible
    await page.waitForSelector('table', { timeout: 10000 });
    
    console.log('🔍 Starting comprehensive validation...');
    
    // ISSUE 1: Header duplication check
    console.log('📊 Checking header duplication...');
    const headerRows = await page.locator('thead tr').count();
    console.log(`Found ${headerRows} header row(s)`);
    expect(headerRows).toBe(1);
    
    // Get all th elements to verify header structure
    const headers = await page.locator('thead th').allTextContents();
    console.log('Headers found:', headers);
    expect(headers.length).toBeGreaterThan(0);
    
    // ISSUE 2: Processing Status text visibility
    console.log('📝 Checking Processing Status column visibility...');
    const processingStatusHeader = page.locator('thead th').filter({ hasText: /processing.*status/i });
    await expect(processingStatusHeader).toBeVisible();
    
    // Get the actual text content and check it's not truncated
    const statusHeaderText = await processingStatusHeader.textContent();
    console.log('Processing Status header text:', statusHeaderText);
    expect(statusHeaderText?.toLowerCase()).toContain('processing');
    expect(statusHeaderText?.toLowerCase()).toContain('status');
    
    // Check that the header is not visually cut off
    const headerBox = await processingStatusHeader.boundingBox();
    if (headerBox) {
      console.log('Processing Status header dimensions:', headerBox);
      expect(headerBox.width).toBeGreaterThan(100); // Should have adequate width
    }
    
    // ISSUE 3: Table width check
    console.log('📏 Checking table width...');
    const table = page.locator('table');
    const tableContainer = page.locator('div').filter({ has: table }).first();
    
    const tableBox = await table.boundingBox();
    const containerBox = await tableContainer.boundingBox();
    
    if (tableBox && containerBox) {
      console.log('Table dimensions:', tableBox);
      console.log('Container dimensions:', containerBox);
      
      // Table should fill most of the container (allowing for some padding)
      const widthRatio = tableBox.width / containerBox.width;
      console.log('Width ratio (table/container):', widthRatio);
      expect(widthRatio).toBeGreaterThan(0.8); // Table should use at least 80% of container width
    }
    
    // ISSUE 4: Row heights check
    console.log('📐 Checking row heights...');
    
    // Check header row height
    const headerRow = page.locator('thead tr').first();
    const headerRowBox = await headerRow.boundingBox();
    if (headerRowBox) {
      console.log('Header row height:', headerRowBox.height);
      expect(headerRowBox.height).toBeGreaterThan(30); // Adequate height for text
    }
    
    // Check data row heights (if any data exists)
    const dataRows = page.locator('tbody tr');
    const dataRowCount = await dataRows.count();
    console.log(`Found ${dataRowCount} data rows`);
    
    if (dataRowCount > 0) {
      const firstDataRowBox = await dataRows.first().boundingBox();
      if (firstDataRowBox) {
        console.log('First data row height:', firstDataRowBox.height);
        expect(firstDataRowBox.height).toBeGreaterThan(30); // Adequate height for content
      }
    }
    
    // Additional comprehensive checks
    console.log('🔍 Additional comprehensive checks...');
    
    // Check for any overlapping elements
    const allTableCells = page.locator('td, th');
    const cellCount = await allTableCells.count();
    console.log(`Total table cells: ${cellCount}`);
    
    // Ensure table is properly styled and visible
    const tableStyles = await table.evaluate((el) => {
      const computed = window.getComputedStyle(el);
      return {
        display: computed.display,
        visibility: computed.visibility,
        opacity: computed.opacity,
        width: computed.width,
        tableLayout: computed.tableLayout
      };
    });
    console.log('Table computed styles:', tableStyles);
    
    expect(tableStyles.display).not.toBe('none');
    expect(tableStyles.visibility).not.toBe('hidden');
    expect(tableStyles.opacity).not.toBe('0');
    
    // Take comprehensive screenshot
    console.log('📸 Taking final validation screenshot...');
    await page.screenshot({ 
      path: '/Users/damon/malibu/final-history-validation.png',
      fullPage: true
    });
    
    // Test scrolling behavior
    console.log('🖱️ Testing table scrolling behavior...');
    await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight));
    await page.waitForTimeout(500);
    await page.evaluate(() => window.scrollTo(0, 0));
    await page.waitForTimeout(500);
    
    // Final screenshot after scrolling test
    await page.screenshot({ 
      path: '/Users/damon/malibu/final-history-validation-after-scroll.png',
      fullPage: false
    });
    
    console.log('✅ All validations completed successfully!');
  });
});