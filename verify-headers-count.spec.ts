import { test, expect } from '@playwright/test';

test('Verify history table headers count', async ({ page }) => {
  console.log('Navigating to http://localhost:3000/history');
  await page.goto('http://localhost:3000/history');
  
  // Wait for table to load
  await page.waitForTimeout(5000);
  
  // Take screenshot for verification
  await page.screenshot({ 
    path: '/Users/damon/malibu/headers-verification.png', 
    fullPage: true 
  });
  
  // Look for the table in the "Your Collection Decks" section
  const tableSection = page.locator('text=Your Collection Decks');
  await expect(tableSection).toBeVisible();
  console.log('✅ Found "Your Collection Decks" section');
  
  // Find the table by looking for the headers row
  const headerRow = page.locator('tr').filter({ hasText: 'Deck Name' }).first();
  await expect(headerRow).toBeVisible();
  console.log('✅ Found header row');
  
  // Count each header exactly
  const headersToCheck = [
    'Deck Name',
    'Collection Deck Status', 
    'Matching status',
    'Progress',
    'Created',
    'Completed',
    'Actions'
  ];
  
  const headerCounts: Record<string, number> = {};
  
  // Count headers in the header row specifically
  for (const header of headersToCheck) {
    const headerCells = headerRow.locator(`th:has-text("${header}")`);
    const count = await headerCells.count();
    headerCounts[header] = count;
    console.log(`'${header}': ${count} instances in header row`);
  }
  
  // Also count all th elements with these texts across the entire page
  console.log('\n--- Counting across entire page ---');
  for (const header of headersToCheck) {
    const allHeaderCells = page.locator(`th:has-text("${header}")`);
    const count = await allHeaderCells.count();
    console.log(`'${header}': ${count} total instances on page`);
  }
  
  // Check for duplicates in header row
  const duplicatesInHeaderRow = Object.entries(headerCounts)
    .filter(([, count]) => count > 1)
    .map(([header]) => header);
  
  if (duplicatesInHeaderRow.length > 0) {
    console.log(`\n❌ DUPLICATE HEADERS FOUND IN HEADER ROW: ${duplicatesInHeaderRow.join(', ')}`);
  } else {
    console.log('\n✅ NO DUPLICATE HEADERS IN HEADER ROW - All headers appear exactly once');
  }
  
  // Count total th elements in the header row
  const totalHeaderCells = await headerRow.locator('th').count();
  console.log(`\nTotal th elements in header row: ${totalHeaderCells}`);
  
  // List all th elements in header row
  for (let i = 0; i < totalHeaderCells; i++) {
    const headerText = await headerRow.locator('th').nth(i).textContent();
    console.log(`Header ${i + 1}: "${headerText}"`);
  }
});