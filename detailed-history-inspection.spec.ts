import { test, expect } from '@playwright/test';

test('Detailed history page inspection', async ({ page }) => {
  console.log('=== STARTING DETAILED INSPECTION ===');
  
  // Navigate to history page
  console.log('Navigating to history page...');
  await page.goto('http://localhost:3000/history');
  
  // Wait for page to load
  await page.waitForLoadState('networkidle');
  await page.waitForTimeout(3000);
  
  // Take screenshot for debugging
  await page.screenshot({ 
    path: 'test-results/history-page-debug.png', 
    fullPage: true 
  });
  
  // Check if page loaded correctly
  const title = await page.title();
  console.log(`Page title: ${title}`);
  
  // Check for React errors
  const consoleErrors = [];
  page.on('console', msg => {
    if (msg.type() === 'error') {
      consoleErrors.push(msg.text());
    }
  });
  
  // Look for any elements on the page
  const bodyContent = await page.locator('body').textContent();
  console.log(`Body content length: ${bodyContent?.length || 0}`);
  
  // Check for main app elements
  const appElement = await page.locator('#root').isVisible();
  console.log(`App root visible: ${appElement}`);
  
  // Look for navigation or any UI elements
  const navElements = await page.locator('nav, [role="navigation"]').count();
  console.log(`Navigation elements found: ${navElements}`);
  
  // Check for history-specific elements
  const historyContainer = await page.locator('[data-testid="history-table-container"]').count();
  console.log(`History table containers found: ${historyContainer}`);
  
  // Check for any Blueprint table elements
  const blueprintTables = await page.locator('.bp5-table, .bp4-table, [class*="bp"][class*="table"]').count();
  console.log(`Blueprint table elements found: ${blueprintTables}`);
  
  // Check for any table-like structures
  const tableElements = await page.locator('table, [role="table"], [role="grid"]').count();
  console.log(`Table-like elements found: ${tableElements}`);
  
  // Look for any error messages
  const errorMessages = await page.locator('text=/error/i, text=/failed/i, .error, .bp5-callout-intent-danger').count();
  console.log(`Error indicators found: ${errorMessages}`);
  
  // Check for loading indicators
  const loadingIndicators = await page.locator('text=/loading/i, [role="progressbar"], .spinner').count();
  console.log(`Loading indicators found: ${loadingIndicators}`);
  
  // Get all text content to see what's actually on the page
  const allText = await page.locator('body').textContent();
  const significantText = allText?.split('\n').filter(line => line.trim().length > 0).slice(0, 10);
  console.log('First 10 significant text lines:');
  significantText?.forEach((line, i) => {
    console.log(`  ${i + 1}: "${line.trim()}"`);
  });
  
  // Check for specific Blueprint classes that might indicate the table is there but styled differently
  const allElements = await page.locator('*').all();
  let blueprintElements = 0;
  let tableClasses = [];
  
  for (let i = 0; i < Math.min(allElements.length, 100); i++) {
    const className = await allElements[i].getAttribute('class');
    if (className && className.includes('bp')) {
      blueprintElements++;
      if (className.includes('table')) {
        tableClasses.push(className);
      }
    }
  }
  
  console.log(`Blueprint elements found (first 100 checked): ${blueprintElements}`);
  console.log(`Table-related classes found: ${JSON.stringify(tableClasses)}`);
  
  // Print any console errors
  if (consoleErrors.length > 0) {
    console.log('Console errors:');
    consoleErrors.forEach(error => console.log(`  - ${error}`));
  }
  
  console.log('=== INSPECTION COMPLETE ===');
});