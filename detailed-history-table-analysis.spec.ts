import { test, expect } from '@playwright/test';

test('Detailed history table issue analysis', async ({ page }) => {
  await page.goto('http://localhost:3000/history');
  await page.waitForLoadState('networkidle');
  await page.waitForTimeout(3000);
  
  console.log('=== HISTORY TABLE ANALYSIS ===');
  
  // Look for the table structure (it might be div-based, not HTML table)
  const tableContainer = page.locator('[class*="table"], .your-collection-decks, .collection-decks').first();
  const hasTable = await tableContainer.count() > 0;
  
  if (!hasTable) {
    // Check for grid or div-based table structure
    const gridContainer = page.locator('div').filter({ hasText: 'Deck Name' }).first();
    console.log('Grid container found:', await gridContainer.count() > 0);
  }
  
  // Check for header issues - look for duplicate headers
  const deckNameHeaders = await page.locator('text="Deck Name"').count();
  const deckStatusHeaders = await page.locator('text="Deck Status"').count();
  const processingHeaders = await page.locator('text="Processing Status"').count();
  const progressHeaders = await page.locator('text="Progress"').count();
  const createdHeaders = await page.locator('text="Created"').count();
  const completedHeaders = await page.locator('text="Completed"').count();
  const actionsHeaders = await page.locator('text="Actions"').count();
  
  console.log('=== HEADER DUPLICATION ANALYSIS ===');
  console.log(`"Deck Name" headers: ${deckNameHeaders} (${deckNameHeaders > 1 ? 'DUPLICATE!' : 'OK'})`);
  console.log(`"Deck Status" headers: ${deckStatusHeaders} (${deckStatusHeaders > 1 ? 'DUPLICATE!' : 'OK'})`);
  console.log(`"Processing Status" headers: ${processingHeaders} (${processingHeaders > 1 ? 'DUPLICATE!' : 'OK'})`);
  console.log(`"Progress" headers: ${progressHeaders} (${progressHeaders > 1 ? 'DUPLICATE!' : 'OK'})`);
  console.log(`"Created" headers: ${createdHeaders} (${createdHeaders > 1 ? 'DUPLICATE!' : 'OK'})`);
  console.log(`"Completed" headers: ${completedHeaders} (${completedHeaders > 1 ? 'DUPLICATE!' : 'OK'})`);
  console.log(`"Actions" headers: ${actionsHeaders} (${actionsHeaders > 1 ? 'DUPLICATE!' : 'OK'})`);
  
  // Check for truncated text
  console.log('\\n=== TRUNCATION ANALYSIS ===');
  const truncatedProcessing = await page.locator('text="Processing S..."').count();
  console.log(`"Processing S..." truncated text found: ${truncatedProcessing} instances`);
  
  // Check the actual column headers in the header row
  const headerRow = page.locator('div, tr').filter({ hasText: 'Deck Name' }).filter({ hasText: 'Processing S' }).first();
  if (await headerRow.count() > 0) {
    const headerText = await headerRow.textContent();
    console.log('Header row text:', headerText);
    
    // Check if "Processing Status" is truncated to "Processing S..."
    if (headerText?.includes('Processing S') && !headerText?.includes('Processing Status')) {
      console.log('❌ ISSUE: "Processing Status" is truncated in header!');
    }
  }
  
  // Check column width issues by examining the layout
  const processingColumn = page.locator('text="Processing S"').first();
  if (await processingColumn.count() > 0) {
    const bounds = await processingColumn.boundingBox();
    console.log('Processing column bounds:', bounds);
  }
  
  // Look for cut-off content in rows
  console.log('\\n=== ROW CONTENT ANALYSIS ===');
  const rows = page.locator('[class*="row"], tr').filter({ hasText: 'Collection' });
  const rowCount = await rows.count();
  console.log(`Found ${rowCount} data rows`);
  
  // Check specific row content for truncation
  const firstRow = rows.first();
  if (await firstRow.count() > 0) {
    const rowText = await firstRow.textContent();
    console.log('First row content:', rowText);
    
    // Check for common truncation patterns
    const hasTruncation = rowText?.includes('...') || rowText?.includes('…');
    console.log('Row has truncation indicators:', hasTruncation);
  }
  
  // Check for responsive/overflow issues
  const viewport = page.viewportSize();
  console.log('Viewport size:', viewport);
  
  // Check if content overflows container
  const container = page.locator('.your-collection-decks, [class*="collection"]').first();
  if (await container.count() > 0) {
    const overflow = await container.evaluate((el) => {
      return {
        scrollWidth: el.scrollWidth,
        clientWidth: el.clientWidth,
        hasHorizontalOverflow: el.scrollWidth > el.clientWidth,
        style: window.getComputedStyle(el).overflow
      };
    }).catch(() => null);
    
    console.log('Container overflow info:', overflow);
  }
  
  // Take a focused screenshot of the table area
  await page.screenshot({ 
    path: 'detailed-history-table.png',
    fullPage: false,
    clip: { x: 0, y: 400, width: 1200, height: 600 }
  });
  
  console.log('\\n=== SUMMARY OF ISSUES FOUND ===');
  const issues = [];
  
  if (deckNameHeaders > 1 || deckStatusHeaders > 1 || processingHeaders > 1 || progressHeaders > 1 || createdHeaders > 1 || completedHeaders > 1 || actionsHeaders > 1) {
    issues.push('DUPLICATE HEADERS detected');
  }
  
  if (truncatedProcessing > 0) {
    issues.push('TEXT TRUNCATION: "Processing Status" truncated to "Processing S..."');
  }
  
  if (issues.length === 0) {
    console.log('✅ No major issues detected in this test run');
  } else {
    issues.forEach(issue => console.log(`❌ ${issue}`));
  }
});