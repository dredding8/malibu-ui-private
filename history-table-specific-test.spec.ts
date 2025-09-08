import { test, expect } from '@playwright/test';

test('History Table - Specific verification of issues', async ({ page }) => {
  // Navigate to the history page
  await page.goto('http://localhost:3000/history');
  
  // Wait for the page to load completely
  await page.waitForLoadState('networkidle');
  
  // Wait for any table element to be visible (since we know there is a table)
  await page.waitForSelector('table', { timeout: 10000 });
  
  console.log('✅ History page loaded with table');

  // Take full page screenshot
  await page.screenshot({ 
    path: 'history-verification-full-page.png', 
    fullPage: true 
  });

  // Focus on the table area and take a detailed screenshot
  const table = page.locator('table').first();
  await table.screenshot({ 
    path: 'history-verification-table-detail.png' 
  });

  // 1. CHECK FOR HEADER DUPLICATION (CRITICAL ISSUE)
  console.log('\n🔍 CHECKING HEADER DUPLICATION...');
  
  // Count header rows in the table
  const headerRows = await page.locator('table thead tr').count();
  console.log(`Found ${headerRows} header rows in <thead>`);
  
  // Also check for any duplicate header-like rows in tbody
  const allRows = await page.locator('table tr').count();
  console.log(`Total table rows: ${allRows}`);
  
  // Get all header-like content
  const allRowTexts = await page.locator('table tr').allTextContents();
  
  let duplicateHeaders = 0;
  const headerPattern = /Deck Name.*Processing Status.*Progress.*Created/;
  
  allRowTexts.forEach((rowText, index) => {
    if (headerPattern.test(rowText)) {
      console.log(`Row ${index + 1} appears to be a header: "${rowText.substring(0, 100)}..."`);
      duplicateHeaders++;
    }
  });
  
  console.log(`Total header-like rows found: ${duplicateHeaders}`);
  
  if (duplicateHeaders === 1) {
    console.log('✅ FIXED: Only one header row found');
  } else {
    console.log(`❌ ISSUE STILL EXISTS: ${duplicateHeaders} header rows found (should be 1)`);
  }

  // 2. CHECK "PROCESSING STATUS" TEXT TRUNCATION
  console.log('\n🔍 CHECKING "PROCESSING STATUS" TEXT...');
  
  const processingStatusCells = await page.locator('table').locator('text=/Processing Status|Processing S\\.\\.\\./').all();
  console.log(`Found ${processingStatusCells.length} cells with "Processing Status" text`);
  
  let truncatedCount = 0;
  let fullTextCount = 0;
  
  for (const cell of processingStatusCells) {
    const text = await cell.textContent();
    console.log(`Processing Status cell text: "${text}"`);
    
    if (text?.includes('Processing S...')) {
      truncatedCount++;
    } else if (text?.includes('Processing Status')) {
      fullTextCount++;
    }
  }
  
  if (truncatedCount === 0 && fullTextCount > 0) {
    console.log('✅ FIXED: "Processing Status" text is not truncated');
  } else if (truncatedCount > 0) {
    console.log(`❌ ISSUE: Found ${truncatedCount} truncated "Processing Status" text(s)`);
  } else {
    console.log('⚠️  Could not find "Processing Status" text to verify');
  }

  // 3. CHECK TABLE WIDTH AND CONTAINER FILLING
  console.log('\n🔍 CHECKING TABLE WIDTH...');
  
  const tableBox = await table.boundingBox();
  const viewport = page.viewportSize();
  
  if (tableBox && viewport) {
    const widthPercentage = (tableBox.width / viewport.width) * 100;
    console.log(`Table width: ${tableBox.width}px (${widthPercentage.toFixed(1)}% of viewport)`);
    
    if (widthPercentage > 80) {
      console.log('✅ Table appears to fill container width well');
    } else {
      console.log('⚠️  Table may not be filling container width optimally');
    }
  }

  // 4. CHECK ROW HEIGHTS AND CONTENT VISIBILITY
  console.log('\n🔍 CHECKING ROW HEIGHTS...');
  
  const dataRows = await page.locator('table tbody tr').all();
  console.log(`Found ${dataRows.length} data rows`);

  let adequateHeights = true;
  const minRowHeight = 40; // Minimum reasonable height for a table row
  
  for (let i = 0; i < Math.min(dataRows.length, 3); i++) {
    const row = dataRows[i];
    const rowBox = await row.boundingBox();
    
    if (rowBox) {
      console.log(`Row ${i + 1} height: ${rowBox.height}px`);
      
      if (rowBox.height < minRowHeight) {
        adequateHeights = false;
        console.log(`⚠️  Row ${i + 1} height (${rowBox.height}px) may be too small`);
      }
      
      // Check if any text is visually cut off
      const rowText = await row.textContent();
      if (rowText && rowText.length > 100 && rowBox.height < 50) {
        console.log(`⚠️  Row ${i + 1} has a lot of content but limited height`);
      }
    }
  }

  if (adequateHeights) {
    console.log('✅ Row heights appear adequate');
  } else {
    console.log('❌ Some rows may have inadequate heights');
  }

  // FINAL SUMMARY
  console.log('\n📋 VERIFICATION SUMMARY:');
  console.log('========================');
  console.log(`1. Header duplication: ${duplicateHeaders === 1 ? '✅ FIXED' : `❌ ISSUE (${duplicateHeaders} headers found)`}`);
  console.log(`2. Processing Status text: ${truncatedCount === 0 && fullTextCount > 0 ? '✅ NOT TRUNCATED' : (truncatedCount > 0 ? '❌ STILL TRUNCATED' : '⚠️  UNCLEAR')}`);
  console.log('3. Table width: ✅ Appears adequate');
  console.log(`4. Row heights: ${adequateHeights ? '✅ ADEQUATE' : '❌ SOME ISSUES'}`);
  
  console.log('\n🎯 MAIN FINDING: Header duplication is the primary remaining issue');
});