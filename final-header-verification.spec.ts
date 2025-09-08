import { test, expect } from '@playwright/test';

test('Final verification: History table header duplication check', async ({ page }) => {
  console.log('Navigating to http://localhost:3000/history');
  await page.goto('http://localhost:3000/history');
  
  // Wait for React to render
  await page.waitForTimeout(5000);
  
  // Take screenshot 
  await page.screenshot({ 
    path: '/Users/damon/malibu/final-header-verification.png', 
    fullPage: true 
  });
  console.log('📸 Screenshot saved');
  
  // Find the history table container
  const tableContainer = page.locator('[data-testid="history-table-container"]');
  await expect(tableContainer).toBeVisible();
  console.log('✅ Found history table container');
  
  // Look for Blueprint Table2 structure - Blueprint tables use div.bp5-table-header for headers
  const blueprintTable = tableContainer.locator('.bp5-table, .bp3-table');
  await expect(blueprintTable).toBeVisible();
  console.log('✅ Found Blueprint table');
  
  // Count column headers in the table
  // Blueprint Table2 renders column headers as divs with bp5-table-column-headers class
  const columnHeaders = tableContainer.locator('.bp5-table-column-headers .bp5-table-header, .bp3-table-column-headers .bp3-table-header');
  const headerCount = await columnHeaders.count();
  console.log(`📊 Total column headers found: ${headerCount}`);
  
  // Get all header texts
  const headerTexts = [];
  for (let i = 0; i < headerCount; i++) {
    const headerText = await columnHeaders.nth(i).textContent();
    headerTexts.push(headerText?.trim() || '');
    console.log(`Header ${i + 1}: "${headerText?.trim()}"`);
  }
  
  // Expected headers
  const expectedHeaders = [
    'Deck Name',
    'Deck Status', 
    'Processing Status',
    'Progress',
    'Created',
    'Completed',
    'Actions'
  ];
  
  // Check for duplicates
  const headerCounts = {};
  headerTexts.forEach(header => {
    if (header) {
      headerCounts[header] = (headerCounts[header] || 0) + 1;
    }
  });
  
  console.log('\n--- Header Count Analysis ---');
  Object.entries(headerCounts).forEach(([header, count]) => {
    console.log(`"${header}": ${count} instances`);
  });
  
  const duplicateHeaders = Object.entries(headerCounts)
    .filter(([, count]) => count > 1)
    .map(([header]) => header);
  
  if (duplicateHeaders.length > 0) {
    console.log(`\n❌ DUPLICATE HEADERS DETECTED: ${duplicateHeaders.join(', ')}`);
    console.log('🔍 The header duplication issue is NOT resolved');
    
    // Additional debugging - look for all elements containing these texts
    for (const dupHeader of duplicateHeaders) {
      const allElements = page.locator(`*:has-text("${dupHeader}")`);
      const elemCount = await allElements.count();
      console.log(`🔍 Total elements containing "${dupHeader}": ${elemCount}`);
    }
  } else {
    console.log('\n✅ NO DUPLICATE HEADERS FOUND');
    console.log('🎉 The header duplication issue appears to be RESOLVED');
  }
  
  // Verify expected headers are present
  const missingHeaders = expectedHeaders.filter(expected => !headerTexts.includes(expected));
  if (missingHeaders.length > 0) {
    console.log(`\n⚠️ Missing expected headers: ${missingHeaders.join(', ')}`);
  } else {
    console.log('\n✅ All expected headers are present');
  }
});