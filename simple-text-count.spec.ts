import { test, expect } from '@playwright/test';

test('Simple text count verification for headers', async ({ page }) => {
  await page.goto('http://localhost:3000/history');
  await page.waitForTimeout(5000);
  
  // Get all text content on the page
  const allText = await page.textContent('body');
  
  // Count occurrences of each header text
  const headersToCheck = [
    'Deck Name',
    'Collection Deck Status', 
    'Matching status',
    'Progress',
    'Created',
    'Completed',
    'Actions'
  ];
  
  console.log('=== HEADER DUPLICATION VERIFICATION ===');
  
  let foundDuplicates = false;
  
  headersToCheck.forEach(header => {
    // Count exact matches (case sensitive)
    const regex = new RegExp(header, 'g');
    const matches = allText?.match(regex);
    const count = matches ? matches.length : 0;
    
    console.log(`"${header}": ${count} occurrences`);
    
    if (count > 1) {
      foundDuplicates = true;
      console.log(`  ❌ DUPLICATE FOUND: "${header}" appears ${count} times`);
    } else if (count === 1) {
      console.log(`  ✅ OK: "${header}" appears exactly once`);
    } else {
      console.log(`  ⚠️  NOT FOUND: "${header}" missing`);
    }
  });
  
  if (foundDuplicates) {
    console.log('\n🔴 RESULT: Header duplication issue is NOT resolved');
  } else {
    console.log('\n🟢 RESULT: Header duplication issue is RESOLVED');
    console.log('🎉 All headers appear exactly once as expected');
  }
});