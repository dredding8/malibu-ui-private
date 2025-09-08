import { test, expect } from '@playwright/test';

test('History table header verification after disabling Blueprint enableColumnHeader', async ({ page }) => {
  // Navigate to history page
  await page.goto('http://localhost:3000/history');
  
  // Wait for the table to load
  await page.waitForSelector('[data-testid="history-table-container"]', { timeout: 10000 });
  
  // Wait a bit for any dynamic content to render
  await page.waitForTimeout(2000);
  
  // Take a screenshot for visual verification
  await page.screenshot({ 
    path: 'test-results/history-header-test.png', 
    fullPage: true 
  });
  
  // Count header instances by looking for column header cells
  const headerCells = await page.locator('.bp5-table-column-header-cell, .bp4-table-column-header-cell, [class*="column-header"]').all();
  console.log(`Found ${headerCells.length} header cells`);
  
  // Get all text content from potential headers
  const allHeaderTexts = [];
  
  // Check Blueprint table headers specifically
  const blueprintHeaders = await page.locator('.bp5-table-column-header, .bp4-table-column-header, .bp5-table-column-header-cell, .bp4-table-column-header-cell').all();
  for (const header of blueprintHeaders) {
    const text = await header.textContent();
    if (text && text.trim()) {
      allHeaderTexts.push(text.trim());
      console.log(`Blueprint header found: "${text.trim()}"`);
    }
  }
  
  // Also check for any elements with header-like content
  const potentialHeaders = await page.locator('text=/^(Name|Collection Status|Processing Status|Algorithm Status|Progress|Created|Completed|Actions)$/i').all();
  for (const header of potentialHeaders) {
    const text = await header.textContent();
    if (text && text.trim()) {
      allHeaderTexts.push(text.trim());
      console.log(`Potential header found: "${text.trim()}"`);
    }
  }
  
  // Count duplicates
  const headerCounts = {};
  allHeaderTexts.forEach(text => {
    headerCounts[text] = (headerCounts[text] || 0) + 1;
  });
  
  console.log('Header counts:', headerCounts);
  
  // Check for duplicates
  const duplicates = Object.entries(headerCounts).filter(([_, count]) => count > 1);
  
  if (duplicates.length > 0) {
    console.log('❌ DUPLICATES FOUND:');
    duplicates.forEach(([header, count]) => {
      console.log(`  - "${header}": ${count} instances`);
    });
  } else {
    console.log('✅ No duplicate headers found');
  }
  
  // Check if table has data rows
  const dataRows = await page.locator('[data-testid="history-table-container"] .bp5-table-body .bp5-table-cell, [data-testid="history-table-container"] .bp4-table-body .bp4-table-cell').all();
  console.log(`Found ${dataRows.length} data cells`);
  
  // Check if table structure looks correct
  const table = await page.locator('[data-testid="history-table-container"] table, [data-testid="history-table-container"] .bp5-table, [data-testid="history-table-container"] .bp4-table').first();
  const isVisible = await table.isVisible();
  console.log(`Table is visible: ${isVisible}`);
  
  // Final assessment
  console.log('\n=== FINAL ASSESSMENT ===');
  console.log(`Total headers found: ${allHeaderTexts.length}`);
  console.log(`Unique headers: ${Object.keys(headerCounts).length}`);
  console.log(`Duplicate headers: ${duplicates.length}`);
  console.log(`Data cells found: ${dataRows.length}`);
  console.log(`Table visible: ${isVisible}`);
  
  if (duplicates.length === 0 && isVisible) {
    console.log('✅ SUCCESS: Header duplication appears to be fixed!');
  } else if (duplicates.length > 0) {
    console.log('❌ ISSUE: Header duplicates still present');
  } else {
    console.log('⚠️  WARNING: Table may not be rendering properly');
  }
});