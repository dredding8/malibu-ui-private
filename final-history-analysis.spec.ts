import { test } from '@playwright/test';

test('Final history table screenshot analysis', async ({ page }) => {
  await page.goto('http://localhost:3000/history');
  await page.waitForLoadState('networkidle');
  await page.waitForTimeout(3000);
  
  // Take a screenshot of just the table section
  const tableSection = page.locator('div').filter({ hasText: 'Your Collection Decks' }).locator('..').first();
  
  await tableSection.screenshot({ 
    path: 'history-table-final-analysis.png'
  });
  
  console.log('Final analysis screenshot captured');
  
  // Check the exact structure causing duplicate headers
  const allHeaderText = await page.locator('*').filter({ hasText: /^(Deck Name|Deck Status|Processing Status|Progress|Created|Completed|Actions)$/ }).allTextContents();
  console.log('All header instances found:', allHeaderText);
  
  // Check column widths in the table
  const processingHeaders = page.locator('text="Processing S"');
  const count = await processingHeaders.count();
  
  if (count > 0) {
    for (let i = 0; i < count; i++) {
      const bounds = await processingHeaders.nth(i).boundingBox();
      console.log(`Processing header ${i + 1} bounds:`, bounds);
    }
  }
  
  // Check if the table headers appear twice by looking at the Blueprint table structure
  const blueprintHeaders = await page.locator('.bp6-table .bp6-table-column-name').count();
  const otherHeaders = await page.locator('[class*="header"], th, [role="columnheader"]').count();
  
  console.log(`Blueprint table headers: ${blueprintHeaders}`);
  console.log(`Other header elements: ${otherHeaders}`);
  
  // Check the table container setup
  const tableContainer = page.locator('[data-testid="history-table-container"]');
  const hasContainer = await tableContainer.count() > 0;
  console.log('Has table container:', hasContainer);
  
  if (hasContainer) {
    const containerHTML = await tableContainer.innerHTML();
    // Just log a snippet to understand the structure
    console.log('Container structure (first 200 chars):', containerHTML.substring(0, 200));
  }
});