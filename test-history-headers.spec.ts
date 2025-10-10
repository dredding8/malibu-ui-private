import { test, expect } from '@playwright/test';

test('Test history table header duplication', async ({ page }) => {
  console.log('Navigating to http://localhost:3000/history');
  await page.goto('http://localhost:3000/history');
  
  // Wait for page to load
  await page.waitForTimeout(3000);
  
  // Take screenshot first
  await page.screenshot({ 
    path: '/Users/damon/malibu/history-table-test.png', 
    fullPage: true 
  });
  console.log('📸 Screenshot saved to: /Users/damon/malibu/history-table-test.png');
  
  // Check if history table exists
  const historyTable = page.locator('[data-testid="history-table"]');
  const tableExists = await historyTable.count() > 0;
  
  if (tableExists) {
    console.log('✅ History table found');
    
    // Count header instances for each expected column
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
    
    for (const header of headersToCheck) {
      const headerElements = page.locator(`th:has-text("${header}")`);
      const count = await headerElements.count();
      headerCounts[header] = count;
      console.log(`'${header}': ${count} instances`);
    }
    
    // Check for duplicates
    const duplicates = Object.entries(headerCounts)
      .filter(([, count]) => count > 1)
      .map(([header]) => header);
    
    if (duplicates.length > 0) {
      console.log(`\n❌ DUPLICATE HEADERS FOUND: ${duplicates.join(', ')}`);
      console.log('Header duplication issue is NOT resolved');
    } else {
      console.log('\n✅ NO DUPLICATE HEADERS - All headers appear exactly once');
      console.log('Header duplication issue appears to be resolved');
    }
    
    // Log all th elements for debugging
    const allHeaders = page.locator('th');
    const allHeaderCount = await allHeaders.count();
    console.log(`\nTotal th elements found: ${allHeaderCount}`);
    
    for (let i = 0; i < allHeaderCount; i++) {
      const headerText = await allHeaders.nth(i).textContent();
      console.log(`th[${i}]: "${headerText}"`);
    }
    
  } else {
    console.log('❌ History table not found');
    
    // Check what's actually on the page
    const pageTitle = await page.title();
    console.log(`Page title: ${pageTitle}`);
    
    const bodyText = await page.locator('body').textContent();
    console.log(`Page contains: ${bodyText?.substring(0, 200)}...`);
  }
});