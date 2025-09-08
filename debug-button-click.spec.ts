import { test, expect } from '@playwright/test';

test('Debug: Button click behavior', async ({ page }) => {
  console.log('🔍 Debugging button click behavior...');
  
  await page.goto('/');
  await page.waitForLoadState('networkidle');
  
  // Find the create collection button
  const createButton = page.locator('button:has-text("Create Collection")');
  await expect(createButton).toBeVisible();
  
  // Get button details
  const buttonText = await createButton.textContent();
  const buttonTestId = await createButton.getAttribute('data-testid');
  const buttonClass = await createButton.getAttribute('class');
  const buttonType = await createButton.getAttribute('type');
  
  console.log('Button details:');
  console.log(`  Text: "${buttonText}"`);
  console.log(`  Test ID: ${buttonTestId}`);
  console.log(`  Class: ${buttonClass}`);
  console.log(`  Type: ${buttonType}`);
  
  // Try clicking by test ID instead
  if (buttonTestId) {
    console.log(`\nTrying click by test ID: ${buttonTestId}`);
    const buttonByTestId = page.locator(`[data-testid="${buttonTestId}"]`);
    await buttonByTestId.click({ force: true });
    await page.waitForTimeout(2000);
    console.log('URL after test ID click:', page.url());
  }
  
  // Try using evaluate to trigger the click handler directly
  console.log('\nTrying to trigger click handler directly...');
  await page.evaluate(() => {
    const button = document.querySelector('button:contains("Create Collection")') as HTMLButtonElement;
    if (button && button.onclick) {
      button.onclick(new MouseEvent('click'));
    }
  });
  await page.waitForTimeout(2000);
  console.log('URL after direct handler:', page.url());
  
  // Try finding and clicking by different selector
  console.log('\nTrying alternative selectors...');
  const alternativeSelectors = [
    '[data-testid="create-deck-button"]',
    'button[data-testid="create-deck-button"]',
    'button.bp6-intent-success:has-text("Create Collection")'
  ];
  
  for (const selector of alternativeSelectors) {
    const element = page.locator(selector);
    const exists = await element.count() > 0;
    if (exists) {
      console.log(`Found element with selector: ${selector}`);
      await element.click({ force: true });
      await page.waitForTimeout(1000);
      const newUrl = page.url();
      console.log(`URL after clicking ${selector}: ${newUrl}`);
      if (newUrl !== 'http://localhost:3000/') {
        break; // Success
      }
    }
  }
});