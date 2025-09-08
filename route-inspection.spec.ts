import { test, expect } from '@playwright/test';

test('Inspect current route and DOM structure', async ({ page }) => {
  await page.goto('/decks');
  await page.waitForLoadState('networkidle');
  
  console.log('Initial URL:', page.url());
  
  await page.getByTestId('create-collection-button').click();
  await page.waitForLoadState('networkidle');
  
  console.log('After navigation URL:', page.url());
  
  // Check the current path
  const currentPath = new URL(page.url()).pathname;
  console.log('Current path:', currentPath);
  
  // Take screenshot
  await page.screenshot({ path: 'route-inspection.png' });
  
  // Look for step content elements
  const stepContentCard = await page.getByTestId('step-content-card').isVisible().catch(() => false);
  console.log('Step content card visible:', stepContentCard);
  
  // Check what's actually rendered inside step content
  if (stepContentCard) {
    const stepContent = page.getByTestId('step-content-card');
    const innerHTML = await stepContent.innerHTML().catch(() => 'Failed to get innerHTML');
    console.log('Step content innerHTML length:', innerHTML.length);
    console.log('Step content HTML (first 500 chars):', innerHTML.substring(0, 500));
  }
  
  // Check for any h3 elements that might be step headings
  const headings = await page.locator('h3').all();
  console.log('Found h3 headings:', headings.length);
  
  for (let i = 0; i < headings.length; i++) {
    const heading = headings[i];
    const text = await heading.textContent();
    const id = await heading.getAttribute('id');
    const testId = await heading.getAttribute('data-testid');
    console.log(`H3 ${i}: "${text}" id="${id}" data-testid="${testId}"`);
  }
});