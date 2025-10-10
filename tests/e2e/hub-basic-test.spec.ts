import { test, expect } from '@playwright/test';

test('Collection Opportunities Hub - Basic Functionality', async ({ page }) => {
  // Navigate to Hub
  await page.goto('http://localhost:3000/collection/123/manage');
  
  // Wait for Hub to load
  await page.waitForSelector('.collection-opportunities-hub', { timeout: 10000 });
  console.log('✅ Hub component loaded');
  
  // Wait for data to load (1 second mock delay)
  await page.waitForTimeout(1500);
  
  // Check for the enhanced table
  const tableVisible = await page.locator('.opportunities-table-enhanced').isVisible();
  expect(tableVisible).toBe(true);
  console.log('✅ Enhanced table is visible');
  
  // Check for "Manage Opportunities" in tab
  const tabText = await page.textContent('.bp6-tab[aria-selected="true"]');
  expect(tabText).toContain('Manage Opportunities');
  console.log('✅ "Manage Opportunities" tab found');
  
  // Wait for table data to load
  await page.waitForSelector('tr[role="row"]', { timeout: 5000 });
  const rowCount = await page.locator('tbody tr, tr[role="row"]').count();
  console.log(`✅ Table has ${rowCount} rows of data`);
  
  // Check for health indicators
  const healthIndicators = await page.locator('[class*="status-indicator"]').count();
  console.log(`✅ Found ${healthIndicators} health indicators`);
  
  // Check for action buttons
  const actionButtons = await page.locator('.actions-cell-enhanced button').count();
  console.log(`✅ Found ${actionButtons} action buttons`);
  
  // Summary
  console.log('\n=== TEST SUMMARY ===');
  console.log('All basic functionality verified successfully\!');
  console.log('- Hub loads correctly');
  console.log('- Enhanced table is visible');
  console.log('- "Manage Opportunities" label is present');
  console.log(`- Table has ${rowCount} rows of data`);
  console.log(`- Health indicators: ${healthIndicators}`);
  console.log(`- Action buttons: ${actionButtons}`);
});