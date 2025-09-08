import { test, expect } from '@playwright/test';

test('Debug History page elements', async ({ page }) => {
  await page.goto('/history');
  await page.waitForLoadState('networkidle');
  
  // Remove webpack overlay if present
  await page.evaluate(() => {
    const overlay = document.getElementById('webpack-dev-server-client-overlay');
    if (overlay) {
      overlay.remove();
    }
  });
  
  // Take a screenshot
  await page.screenshot({ path: 'debug-history.png', fullPage: true });
  
  // Check what elements are actually on the page
  const elements = await page.evaluate(() => {
    const allElements = document.querySelectorAll('*');
    const elementsWithTestIds = [];
    const dateElements = [];
    
    for (let i = 0; i < allElements.length; i++) {
      const el = allElements[i];
      const testId = el.getAttribute('data-testid');
      const className = String(el.className || '');
      const tagName = el.tagName.toLowerCase();
      
      if (testId) {
        elementsWithTestIds.push({
          tagName,
          testId,
          className,
          textContent: el.textContent?.substring(0, 50)
        });
      }
      
      if (className.includes('date') || tagName.includes('input') || className.includes('DateInput')) {
        dateElements.push({
          tagName,
          className,
          testId,
          textContent: el.textContent?.substring(0, 50)
        });
      }
    }
    
    return { elementsWithTestIds, dateElements };
  });
  
  console.log('Elements with test IDs:', elements.elementsWithTestIds);
  console.log('Date-related elements:', elements.dateElements);
  
  // Check for specific elements
  const startDateElements = await page.locator('[data-testid="start-date-input"]').count();
  const endDateElements = await page.locator('[data-testid="end-date-input"]').count();
  const resetButtonElements = await page.locator('[data-testid="reset-dates-button"]').count();
  const applyButtonElements = await page.locator('[data-testid="apply-filter-button"]').count();
  
  console.log(`Start date elements: ${startDateElements}`);
  console.log(`End date elements: ${endDateElements}`);
  console.log(`Reset button elements: ${resetButtonElements}`);
  console.log(`Apply button elements: ${applyButtonElements}`);
  
  // Check for any input elements
  const inputElements = await page.locator('input').count();
  const comboboxElements = await page.locator('[role="combobox"]').count();
  
  console.log(`Input elements: ${inputElements}`);
  console.log(`Combobox elements: ${comboboxElements}`);
  
  // Check for DateInput components
  const dateInputElements = await page.locator('.bp6-date-input').count();
  console.log(`DateInput elements: ${dateInputElements}`);
});
