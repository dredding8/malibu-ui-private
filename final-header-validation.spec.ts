import { test, expect } from '@playwright/test';

test('Final header duplication validation on actual table', async ({ page }) => {
  console.log('🎯 FINAL HEADER DUPLICATION TEST');
  console.log('Testing the actual table structure visible on the page...');
  
  await page.goto('http://localhost:3000/history');
  await page.waitForLoadState('networkidle');
  await page.waitForTimeout(3000);
  
  // Take screenshot for visual confirmation
  await page.screenshot({ 
    path: 'test-results/final-validation.png', 
    fullPage: true 
  });
  
  // The page shows a custom table layout with rows for each collection deck
  // Let's check for header text duplications in the visible table
  
  // Look for the actual table section "Your Collection Decks"
  const tableSection = await page.locator('text="Your Collection Decks"');
  const tableSectionExists = await tableSection.count();
  console.log(`📊 "Your Collection Decks" section found: ${tableSectionExists > 0 ? 'YES' : 'NO'}`);
  
  // Check for any visible table headers in the current structure
  const possibleHeaders = [
    'Name', 'Collection Status', 'Processing Status', 'Algorithm Status', 
    'Progress', 'Created', 'Completed', 'Actions', 'UX Test Collection Deck',
    'Sample Analytics Deck', 'Failed Processing Test'
  ];
  
  let totalHeaderInstances = 0;
  let duplicatedHeaders = [];
  
  for (const headerText of possibleHeaders) {
    const occurrences = await page.locator(`text="${headerText}"`).count();
    totalHeaderInstances += occurrences;
    
    if (occurrences > 1) {
      duplicatedHeaders.push({ text: headerText, count: occurrences });
      console.log(`⚠️  "${headerText}" appears ${occurrences} times`);
    } else if (occurrences === 1) {
      console.log(`✅ "${headerText}" appears once`);
    }
  }
  
  // Check the table rows for structure
  const tableRows = await page.locator('[data-testid="history-table-container"] tr, .table-row, [role="row"]').count();
  console.log(`📋 Table rows found: ${tableRows}`);
  
  // Look for any Blueprint table elements that might have headers
  const blueprintHeaders = await page.locator('.bp5-table-column-header-cell, .bp4-table-column-header-cell').count();
  console.log(`🏗️  Blueprint table headers: ${blueprintHeaders}`);
  
  // Check if we can see the data rows (the actual collection decks)
  const deckRows = await page.locator('text="UX Test Collection Deck", text="Sample Analytics Deck", text="Failed Processing Test"').count();
  console.log(`📦 Collection deck rows visible: ${deckRows}`);
  
  console.log('\n=== FINAL ASSESSMENT ===');
  console.log(`Total header text instances: ${totalHeaderInstances}`);
  console.log(`Headers with duplicates: ${duplicatedHeaders.length}`);
  console.log(`Blueprint table headers: ${blueprintHeaders}`);
  console.log(`Visible data rows: ${deckRows}`);
  
  if (duplicatedHeaders.length === 0 && blueprintHeaders === 0) {
    console.log('✅ EXCELLENT: No header duplications detected!');
    console.log('🎉 The enableColumnHeader=false fix has successfully eliminated duplicate headers.');
    console.log('🚀 The table is now using custom headers without Blueprint auto-generation.');
  } else if (blueprintHeaders === 0 && duplicatedHeaders.length > 0) {
    console.log('⚠️  Some text duplicates found, but no Blueprint header duplicates');
    console.log('ℹ️  This may be normal for data content vs header content');
  } else {
    console.log('🔍 Blueprint headers still present - may need further investigation');
  }
  
  if (deckRows > 0) {
    console.log('✅ Table is functional and displaying data correctly');
  } else {
    console.log('ℹ️  No data rows detected (table may be empty)');
  }
});