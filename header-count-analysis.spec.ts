import { test, expect } from '@playwright/test';

test('Header Count Analysis', async ({ page }) => {
  await page.goto('http://localhost:3000/history');
  await page.waitForSelector('[data-testid="history-table-container"]');
  await page.waitForTimeout(3000); // Allow dynamic content to load
  
  // Take screenshot for analysis
  await page.screenshot({ 
    path: 'header-count-analysis.png', 
    fullPage: true 
  });
  
  console.log('\n=== BLUEPRINT TABLE HEADER ANALYSIS ===');
  
  // Count "Deck Name" instances specifically
  const deckNameElements = await page.locator('text="Deck Name"').all();
  console.log(`"Deck Name" appears ${deckNameElements.length} times`);
  
  // Count all table header elements
  const allHeaders = await page.locator('.bp3-table-header').all();
  console.log(`Blueprint table headers found: ${allHeaders.length}`);
  
  // Check for column name elements  
  const columnNames = await page.locator('.bp3-table-column-name').all();
  console.log(`Column name elements: ${columnNames.length}`);
  
  // Print all column name texts
  for (let i = 0; i < columnNames.length; i++) {
    const text = await columnNames[i].textContent();
    console.log(`  Column ${i + 1}: "${text}"`);
  }
  
  // Check for table rows in header
  const headerRows = await page.locator('.bp3-table-thead .bp3-table-row').all();
  console.log(`Header rows: ${headerRows.length}`);
  
  // Look for any duplicate text content
  const allText = await page.locator('[data-testid="history-table-container"] *').allTextContents();
  const deckNameCount = allText.filter(text => text.includes('Deck Name')).length;
  console.log(`Total "Deck Name" text occurrences: ${deckNameCount}`);
  
  console.log('=== ANALYSIS COMPLETE ===\n');
  
  // The test should fail if we have duplicates, confirming the issue
  expect(deckNameElements.length, 'Deck Name should appear only once').toBeLessThanOrEqual(1);
});