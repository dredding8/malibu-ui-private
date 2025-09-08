import { test, expect } from '@playwright/test';

test('Inspect form elements', async ({ page }) => {
  await page.goto('/decks');
  await page.waitForLoadState('networkidle');
  
  await page.getByTestId('create-collection-button').click();
  await page.waitForLoadState('networkidle');
  
  // Take screenshot
  await page.screenshot({ path: 'form-inspection.png' });
  
  // Check if step1-container exists
  const step1Container = await page.getByTestId('step1-container').isVisible().catch(() => false);
  console.log('Step 1 container visible:', step1Container);
  
  // Check if deck name input exists
  const deckNameInput = await page.getByTestId('deck-name-input').isVisible().catch(() => false);
  console.log('Deck name input visible:', deckNameInput);
  
  // Check if start date input exists
  const startDateInput = await page.getByTestId('start-date-input').isVisible().catch(() => false);
  console.log('Start date input visible:', startDateInput);
  
  // List all elements with data-testid attributes
  const testIds = await page.locator('[data-testid]').all();
  console.log('Found elements with data-testid:', testIds.length);
  
  for (let i = 0; i < Math.min(testIds.length, 20); i++) {
    const element = testIds[i];
    const testId = await element.getAttribute('data-testid');
    const tagName = await element.evaluate(el => el.tagName.toLowerCase());
    const visible = await element.isVisible();
    console.log(`${i}: ${tagName}[data-testid="${testId}"] visible=${visible}`);
  }
});