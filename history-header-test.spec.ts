import { test, expect } from '@playwright/test';

test('History table headers test', async ({ page }) => {
  console.log('🧪 Testing Blueprint native header approach...\n');
  
  // Navigate to history page
  await page.goto('http://localhost:3000/history');
  await page.waitForLoadState('networkidle');
  await page.waitForTimeout(2000);
  
  // Take screenshot
  await page.screenshot({ 
    path: 'history_table_test.png', 
    fullPage: true 
  });
  console.log('📸 Screenshot saved to history_table_test.png');
  
  // Expected headers
  const expectedHeaders = [
    'Deck Name',
    'Collection Deck Status', 
    'Matching status',
    'Progress',
    'Created',
    'Completed',
    'Actions'
  ];
  
  console.log('\n=== HEADER ANALYSIS ===');
  
  const headerCounts: { [key: string]: number } = {};
  let totalIssues = 0;
  
  // Count each header instance
  for (const header of expectedHeaders) {
    const elements = await page.locator(`text="${header}"`).all();
    const count = elements.length;
    headerCounts[header] = count;
    
    console.log(`'${header}': ${count} instance(s)`);
    
    if (count === 0) {
      console.log(`  ❌ Missing header: ${header}`);
      totalIssues++;
    } else if (count > 1) {
      console.log(`  ⚠️  Duplicate header detected: ${header}`);
      totalIssues++;
    } else {
      console.log(`  ✅ Correct count: ${header}`);
    }
  }
  
  // Check thead structure
  console.log('\n=== HEADER LOCATION CHECK ===');
  const theadElements = await page.locator('thead').all();
  console.log(`Number of <thead> elements: ${theadElements.length}`);
  
  if (theadElements.length > 0) {
    const theadText = await page.locator('thead').textContent();
    console.log(`Content in <thead>: ${theadText}`);
    
    const headersInThead = expectedHeaders.every(header => theadText?.includes(header));
    console.log(`All headers found in <thead>: ${headersInThead}`);
  } else {
    console.log('❌ No <thead> element found');
    totalIssues++;
  }
  
  // Check table structure
  console.log('\n=== TABLE STRUCTURE CHECK ===');
  const tableElements = await page.locator('table').all();
  console.log(`Number of <table> elements: ${tableElements.length}`);
  
  // Detailed duplicate detection
  console.log('\n=== DUPLICATE DETECTION ===');
  for (const header of expectedHeaders) {
    const allElements = await page.locator(`text="${header}"`).all();
    if (allElements.length > 1) {
      console.log(`⚠️  Found ${allElements.length} instances of '${header}':`);
      for (let i = 0; i < allElements.length; i++) {
        try {
          const tagName = await allElements[i].evaluate(el => el.tagName);
          const parentTag = await allElements[i].evaluate(el => el.parentElement?.tagName);
          console.log(`  ${i+1}. <${tagName.toLowerCase()}> inside <${parentTag?.toLowerCase() || 'unknown'}>`);
        } catch {
          console.log(`  ${i+1}. Could not determine element details`);
        }
      }
    }
  }
  
  // Overall assessment
  console.log('\n=== OVERALL ASSESSMENT ===');
  
  const missingHeaders = Object.entries(headerCounts)
    .filter(([_, count]) => count === 0)
    .map(([header, _]) => header);
  
  const duplicateHeaders = Object.entries(headerCounts)
    .filter(([_, count]) => count > 1)
    .map(([header, _]) => header);
  
  if (missingHeaders.length > 0) {
    console.log(`❌ Missing headers: ${missingHeaders.join(', ')}`);
  }
  
  if (duplicateHeaders.length > 0) {
    console.log(`⚠️  Duplicate headers: ${duplicateHeaders.join(', ')}`);
  }
  
  if (theadElements.length === 0) {
    console.log('❌ No table header structure found');
    totalIssues++;
  } else if (theadElements.length > 1) {
    console.log('⚠️  Multiple table header structures found');
    totalIssues++;
  }
  
  if (totalIssues === 0) {
    console.log('✅ BLUEPRINT NATIVE HEADERS WORKING CORRECTLY!');
    console.log('- All 7 headers present exactly once');
    console.log('- Headers properly positioned in table structure');  
    console.log('- No duplicates detected');
  } else {
    console.log(`❌ ISSUES DETECTED: ${totalIssues} problems found`);
  }
  
  // Verify table is visible and functional
  await expect(page.locator('table')).toBeVisible();
  
  // Verify each header exists exactly once
  for (const header of expectedHeaders) {
    await expect(page.locator(`text="${header}"`)).toHaveCount(1);
  }
});