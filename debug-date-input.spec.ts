import { test, expect } from '@playwright/test';

test('Debug DateInput structure', async ({ page }) => {
  await page.goto('/decks');
  await page.getByTestId('create-collection-button').click();
  await page.waitForLoadState('networkidle');
  
  // Take a screenshot
  await page.screenshot({ path: 'wizard-step1-debug.png', fullPage: true });
  
  // Look at the start date input structure  
  const startDateInput = page.getByTestId('start-date-input');
  const innerHTML = await startDateInput.innerHTML();
  console.log('Start date input HTML structure:', innerHTML);
  
  // Look for any input elements inside it
  const inputs = await startDateInput.locator('input').all();
  console.log('Found input elements inside start-date-input:', inputs.length);
  
  for (let i = 0; i < inputs.length; i++) {
    const input = inputs[i];
    const type = await input.getAttribute('type');
    const placeholder = await input.getAttribute('placeholder');
    const className = await input.getAttribute('class');
    console.log(`Input ${i}: type="${type}", placeholder="${placeholder}", class="${className}"`);
  }
  
  // Try to interact with the date input directly
  try {
    await startDateInput.click();
    console.log('✅ DateInput clicked successfully');
  } catch (error) {
    console.log('❌ Error clicking DateInput:', error);
  }
});