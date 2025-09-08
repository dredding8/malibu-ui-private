import { test, expect } from '@playwright/test';

test('Count duplicate headers in history table', async ({ page }) => {
  // Navigate to history page
  await page.goto('http://localhost:3000/history');
  await page.waitForLoadState('networkidle');
  await page.waitForSelector('text=Collection Deck Overview', { timeout: 10000 });
  
  console.log('📊 Counting headers for duplication analysis...');
  
  const headerNames = [
    'Deck Name',
    'Deck Status', 
    'Processing Status',
    'Progress',
    'Created',
    'Completed',
    'Actions'
  ];
  
  for (const header of headerNames) {
    const count = await page.getByText(header, { exact: true }).count();
    console.log(`"${header}": ${count} instances`);
  }
  
  // Also check for partial matches
  console.log('\n📝 Checking Processing Status specifically:');
  const processingStatusCount = await page.getByText('Processing Status').count();
  const processingPartialCount = await page.getByText('Processing').count();
  const statusPartialCount = await page.getByText('Status').count();
  
  console.log(`"Processing Status" (exact): ${processingStatusCount} instances`);
  console.log(`"Processing" (partial): ${processingPartialCount} instances`);
  console.log(`"Status" (partial): ${statusPartialCount} instances`);
  
  // Take a screenshot with annotations
  await page.screenshot({ 
    path: '/Users/damon/malibu/header-count-analysis.png',
    fullPage: true
  });
  
  // Report findings
  console.log('\n🔍 FINAL ANALYSIS:');
  if (processingStatusCount > 1) {
    console.log(`❌ HEADER DUPLICATION CONFIRMED: ${processingStatusCount} "Processing Status" headers found`);
  } else {
    console.log('✅ No header duplication detected for Processing Status');
  }
});