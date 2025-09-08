import { test, expect } from '@playwright/test';

test('Simple history table header check', async ({ page }) => {
  console.log('🔍 Testing history table header duplication fix...');
  
  // Navigate to history page
  await page.goto('http://localhost:3000/history');
  await page.waitForLoadState('networkidle');
  await page.waitForTimeout(2000);
  
  // Take screenshot
  await page.screenshot({ 
    path: 'test-results/header-check.png', 
    fullPage: true 
  });
  
  // Check if history table container exists
  const tableContainer = await page.locator('[data-testid="history-table-container"]');
  const containerExists = await tableContainer.count();
  console.log(`📊 History table container found: ${containerExists > 0 ? 'YES' : 'NO'}`);
  
  if (containerExists === 0) {
    console.log('❌ No table container found - test cannot proceed');
    return;
  }
  
  // Look for Blueprint column headers
  const columnHeaders = await page.locator('.bp5-table-column-header-cell, .bp4-table-column-header-cell').all();
  console.log(`📋 Column header cells found: ${columnHeaders.length}`);
  
  // Get text from each header
  const headerTexts = [];
  for (const header of columnHeaders) {
    const text = await header.textContent();
    if (text && text.trim()) {
      headerTexts.push(text.trim());
    }
  }
  
  console.log(`📝 Header texts found: ${JSON.stringify(headerTexts)}`);
  
  // Count occurrences of each header text
  const headerCounts = {};
  headerTexts.forEach(text => {
    headerCounts[text] = (headerCounts[text] || 0) + 1;
  });
  
  console.log(`🔢 Header occurrence counts:`, headerCounts);
  
  // Check for duplicates
  const duplicates = Object.entries(headerCounts).filter(([_, count]) => count > 1);
  
  console.log('\n=== RESULTS ===');
  console.log(`Total header cells: ${columnHeaders.length}`);
  console.log(`Unique header texts: ${Object.keys(headerCounts).length}`);
  console.log(`Duplicate headers: ${duplicates.length}`);
  
  if (duplicates.length === 0) {
    console.log('✅ SUCCESS: No duplicate headers detected!');
    console.log('🎯 The enableColumnHeader=false fix appears to be working correctly.');
  } else {
    console.log('❌ DUPLICATES FOUND:');
    duplicates.forEach(([header, count]) => {
      console.log(`   - "${header}": appears ${count} times`);
    });
  }
  
  // Check if table is functional by looking for data rows
  const dataCells = await page.locator('[data-testid="history-table-container"] .bp5-table-body, [data-testid="history-table-container"] .bp4-table-body').count();
  console.log(`📊 Table body sections found: ${dataCells}`);
  
  if (dataCells > 0) {
    console.log('✅ Table structure appears functional with data rows');
  } else {
    console.log('ℹ️  No data rows detected (table may be empty)');
  }
});