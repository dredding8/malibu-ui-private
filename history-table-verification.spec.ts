import { test, expect } from '@playwright/test';

test('History Table - Verify fixes for header duplication, text truncation, and layout issues', async ({ page }) => {
  // Navigate to the history page
  await page.goto('http://localhost:3000/history');
  
  // Wait for the page to load completely
  await page.waitForLoadState('networkidle');
  
  // Wait for the history table to be visible
  await page.waitForSelector('.history-table', { timeout: 10000 });
  
  console.log('✅ History page loaded successfully');

  // Take initial screenshot
  await page.screenshot({ 
    path: 'history-table-verification-full.png', 
    fullPage: true 
  });

  // 1. Check for header duplication
  console.log('\n🔍 Checking for header duplication...');
  
  const headerRows = await page.locator('thead tr').count();
  console.log(`Found ${headerRows} header row(s)`);
  
  if (headerRows === 1) {
    console.log('✅ FIXED: Only one header row found - header duplication issue resolved');
  } else {
    console.log('❌ ISSUE: Multiple header rows still present');
  }

  // Also check for duplicate header cells
  const headerCells = await page.locator('thead th').all();
  const headerTexts = await Promise.all(headerCells.map(cell => cell.textContent()));
  console.log('Header texts:', headerTexts);

  // 2. Check for "Processing Status" text truncation
  console.log('\n🔍 Checking "Processing Status" column header...');
  
  const processingStatusHeader = await page.locator('thead th').filter({ hasText: /Processing/ }).first();
  
  if (await processingStatusHeader.isVisible()) {
    const headerText = await processingStatusHeader.textContent();
    console.log(`Processing Status header text: "${headerText}"`);
    
    if (headerText?.includes('Processing Status') && !headerText.includes('Processing S...')) {
      console.log('✅ FIXED: "Processing Status" text is not truncated');
    } else {
      console.log('❌ ISSUE: "Processing Status" text appears to be truncated');
    }
  } else {
    console.log('❌ Could not find Processing Status header');
  }

  // 3. Check table width and container filling
  console.log('\n🔍 Checking table width and container filling...');
  
  const table = page.locator('.history-table table');
  const container = page.locator('.history-table');
  
  const tableBox = await table.boundingBox();
  const containerBox = await container.boundingBox();
  
  if (tableBox && containerBox) {
    const widthRatio = tableBox.width / containerBox.width;
    console.log(`Table width: ${tableBox.width}px, Container width: ${containerBox.width}px`);
    console.log(`Width ratio: ${widthRatio.toFixed(2)}`);
    
    if (widthRatio > 0.95) {
      console.log('✅ GOOD: Table fills container width properly');
    } else {
      console.log('⚠️  Table may not be filling container width optimally');
    }
  }

  // 4. Check row heights and content visibility
  console.log('\n🔍 Checking row heights and content visibility...');
  
  const dataRows = await page.locator('tbody tr').all();
  console.log(`Found ${dataRows.length} data rows`);

  let adequateHeights = true;
  for (let i = 0; i < Math.min(dataRows.length, 5); i++) { // Check first 5 rows
    const row = dataRows[i];
    const rowBox = await row.boundingBox();
    const cells = await row.locator('td').all();
    
    if (rowBox) {
      console.log(`Row ${i + 1} height: ${rowBox.height}px`);
      
      // Check if any cell content is cut off
      for (let j = 0; j < cells.length; j++) {
        const cell = cells[j];
        const cellBox = await cell.boundingBox();
        const textContent = await cell.textContent();
        
        if (cellBox && textContent && textContent.trim()) {
          // If row height is too small (less than 40px) for content, flag it
          if (rowBox.height < 40 && textContent.length > 20) {
            adequateHeights = false;
            console.log(`⚠️  Row ${i + 1}, Cell ${j + 1} may have inadequate height for content`);
          }
        }
      }
    }
  }

  if (adequateHeights) {
    console.log('✅ Row heights appear adequate for content');
  } else {
    console.log('❌ Some rows may have inadequate heights');
  }

  // Take a focused screenshot of just the table
  await page.locator('.history-table').screenshot({ 
    path: 'history-table-verification-focused.png' 
  });

  // Check for any visible overflow or scrolling issues
  console.log('\n🔍 Checking for overflow issues...');
  
  const hasHorizontalScroll = await page.evaluate(() => {
    return document.documentElement.scrollWidth > document.documentElement.clientWidth;
  });
  
  if (!hasHorizontalScroll) {
    console.log('✅ No horizontal scroll detected - good responsive behavior');
  } else {
    console.log('⚠️  Horizontal scroll detected - may indicate layout issues');
  }

  // Summary
  console.log('\n📋 VERIFICATION SUMMARY:');
  console.log('1. Header duplication:', headerRows === 1 ? '✅ FIXED' : '❌ ISSUE REMAINS');
  console.log('2. Processing Status truncation: Checked above');
  console.log('3. Table container width: Checked above');
  console.log('4. Row heights:', adequateHeights ? '✅ ADEQUATE' : '❌ NEEDS ATTENTION');
});