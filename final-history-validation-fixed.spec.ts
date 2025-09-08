import { test, expect } from '@playwright/test';

test.describe('History Table Final Validation', () => {
  test('comprehensive final validation of all history table issues', async ({ page }) => {
    // Navigate to history page
    await page.goto('http://localhost:3000/history');
    
    // Wait for page to be fully loaded
    await page.waitForLoadState('networkidle');
    
    // Wait for the collection deck overview to be visible (this indicates page is loaded)
    await page.waitForSelector('text=Collection Deck Overview', { timeout: 10000 });
    
    console.log('🔍 Starting comprehensive validation...');
    
    // Take initial screenshot
    await page.screenshot({ 
      path: '/Users/damon/malibu/initial-history-state.png',
      fullPage: true
    });
    
    // ISSUE 1: Check for table headers - look for the actual header structure
    console.log('📊 Checking table structure...');
    
    // Look for the "Your Collection Decks" section which contains the table
    const collectionDecksSection = page.locator('text=Your Collection Decks').locator('..');
    await expect(collectionDecksSection).toBeVisible();
    
    // Check for the header row with all expected columns
    const headerColumns = [
      'Deck Name',
      'Deck Status', 
      'Processing Status',
      'Progress',
      'Created',
      'Completed',
      'Actions'
    ];
    
    console.log('Checking for header columns...');
    for (const column of headerColumns) {
      const columnHeader = page.getByText(column, { exact: false });
      await expect(columnHeader).toBeVisible();
      console.log(`✅ Found header: ${column}`);
    }
    
    // ISSUE 2: Processing Status text visibility - specifically check this column
    console.log('📝 Checking Processing Status column visibility...');
    const processingStatusText = page.getByText('Processing Status');
    await expect(processingStatusText).toBeVisible();
    
    // Get the bounding box to ensure it's not truncated
    const statusBox = await processingStatusText.boundingBox();
    if (statusBox) {
      console.log('Processing Status dimensions:', statusBox);
      expect(statusBox.width).toBeGreaterThan(80); // Should have adequate width
      expect(statusBox.height).toBeGreaterThan(15); // Should have adequate height
    }
    
    // ISSUE 3: Check for duplicate headers
    console.log('🔍 Checking for header duplication...');
    const processingStatusCount = await page.getByText('Processing Status').count();
    console.log(`Found ${processingStatusCount} "Processing Status" header(s)`);
    expect(processingStatusCount).toBe(1); // Should only have one
    
    // Check other headers for duplication
    for (const column of headerColumns) {
      const count = await page.getByText(column, { exact: true }).count();
      if (count > 1) {
        console.log(`⚠️  Found ${count} instances of "${column}" header`);
      }
      expect(count).toBeLessThanOrEqual(1); // Should have at most one of each
    }
    
    // ISSUE 4: Check table width and layout
    console.log('📏 Checking table layout...');
    
    // Find the container that holds the table data
    const tableContainer = page.locator('[class*="table"], [class*="grid"], div').filter({ 
      hasText: 'UX Test Collection Deck' 
    }).first();
    
    if (await tableContainer.isVisible()) {
      const containerBox = await tableContainer.boundingBox();
      if (containerBox) {
        console.log('Table container dimensions:', containerBox);
        expect(containerBox.width).toBeGreaterThan(800); // Should be reasonably wide
      }
    }
    
    // ISSUE 5: Check row content and heights
    console.log('📐 Checking row content...');
    
    // Look for the sample data row
    const testDeckRow = page.getByText('UX Test Collection Deck');
    if (await testDeckRow.isVisible()) {
      console.log('✅ Found test deck row');
      
      const rowBox = await testDeckRow.boundingBox();
      if (rowBox) {
        console.log('Test deck row dimensions:', rowBox);
        expect(rowBox.height).toBeGreaterThan(20); // Adequate height
      }
      
      // Check that the row contains expected elements
      const parentContainer = testDeckRow.locator('..').locator('..');
      
      // Look for progress indicator
      const progressElement = parentContainer.getByText('45%');
      if (await progressElement.isVisible()) {
        console.log('✅ Found progress indicator');
      }
      
      // Look for status elements
      const statusElements = await parentContainer.getByText(/BUILDING|PROCESSING|COLLECTION/i).count();
      console.log(`Found ${statusElements} status elements`);
    }
    
    // Additional layout checks
    console.log('🔍 Additional layout validation...');
    
    // Check page title
    await expect(page.getByText('Collection Deck History')).toBeVisible();
    
    // Check navigation elements
    await expect(page.getByText('History')).toBeVisible();
    
    // Check action buttons
    await expect(page.getByText('Create New Deck')).toBeVisible();
    await expect(page.getByText('Export Results')).toBeVisible();
    
    // Take final comprehensive screenshot
    console.log('📸 Taking final validation screenshot...');
    await page.screenshot({ 
      path: '/Users/damon/malibu/final-history-validation-complete.png',
      fullPage: true
    });
    
    // Test responsive behavior by resizing
    console.log('📱 Testing responsive behavior...');
    await page.setViewportSize({ width: 1200, height: 800 });
    await page.waitForTimeout(500);
    
    await page.screenshot({ 
      path: '/Users/damon/malibu/history-desktop-view.png',
      fullPage: true
    });
    
    // Test smaller screen
    await page.setViewportSize({ width: 768, height: 600 });
    await page.waitForTimeout(500);
    
    await page.screenshot({ 
      path: '/Users/damon/malibu/history-tablet-view.png',
      fullPage: true
    });
    
    console.log('✅ All validations completed successfully!');
    
    // Final verification that Processing Status is still visible after resize
    const finalProcessingStatus = page.getByText('Processing Status');
    await expect(finalProcessingStatus).toBeVisible();
    console.log('✅ Processing Status remains visible after responsive testing');
  });
});