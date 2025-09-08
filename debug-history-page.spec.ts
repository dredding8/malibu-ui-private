import { test, expect } from '@playwright/test';

test('Debug History Page - Check actual structure', async ({ page }) => {
  // Navigate to the history page
  await page.goto('http://localhost:3000/history');
  
  // Wait for the page to load completely
  await page.waitForLoadState('networkidle');
  
  console.log('✅ History page loaded');

  // Take initial screenshot to see what's actually there
  await page.screenshot({ 
    path: 'debug-history-current-state.png', 
    fullPage: true 
  });

  // Check what's actually on the page
  const bodyContent = await page.locator('body').innerHTML();
  console.log('Page content preview:', bodyContent.substring(0, 1000) + '...');

  // Look for any table elements
  const tables = await page.locator('table').count();
  console.log(`Found ${tables} table element(s)`);

  if (tables > 0) {
    // Check table structure
    const tableHTML = await page.locator('table').first().innerHTML();
    console.log('Table HTML preview:', tableHTML.substring(0, 500) + '...');

    // Check headers
    const headerRows = await page.locator('table thead tr').count();
    console.log(`Header rows: ${headerRows}`);

    if (headerRows > 0) {
      const headerCells = await page.locator('table thead th').all();
      const headerTexts = await Promise.all(headerCells.map(cell => cell.textContent()));
      console.log('Header texts:', headerTexts);

      // Check for Processing Status specifically
      const processingHeaders = headerTexts.filter(text => text && text.includes('Processing'));
      console.log('Processing Status headers:', processingHeaders);
    }

    // Check data rows
    const dataRows = await page.locator('table tbody tr').count();
    console.log(`Data rows: ${dataRows}`);

    // Take table screenshot
    await page.locator('table').first().screenshot({ 
      path: 'debug-history-table-only.png' 
    });
  }

  // Look for any elements with common class names
  const possibleContainers = [
    '.history-table',
    '.table-container', 
    '.history-container',
    '.table',
    '[class*="history"]',
    '[class*="table"]'
  ];

  for (const selector of possibleContainers) {
    const count = await page.locator(selector).count();
    if (count > 0) {
      console.log(`Found ${count} element(s) with selector: ${selector}`);
    }
  }

  // Check the actual page title and main content
  const title = await page.title();
  console.log('Page title:', title);

  const h1Elements = await page.locator('h1').all();
  const h1Texts = await Promise.all(h1Elements.map(h1 => h1.textContent()));
  console.log('H1 elements:', h1Texts);
});