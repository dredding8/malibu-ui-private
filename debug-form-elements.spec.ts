import { test, expect } from '@playwright/test';

test('Debug: Check form elements on create collection page', async ({ page }) => {
  console.log('🔍 Debugging form elements...');
  
  await page.goto('/');
  await page.waitForLoadState('networkidle');
  
  // Navigate to create collection
  await page.click('button:has-text("Create Collection")', { force: true });
  await page.waitForLoadState('networkidle');
  await page.waitForTimeout(2000); // Give extra time for form to load
  
  // Take screenshot
  await page.screenshot({ path: 'debug-form-elements.png', fullPage: true });
  
  console.log('Current URL:', page.url());
  
  // Check for all input elements
  const allInputs = page.locator('input, select, textarea');
  const inputCount = await allInputs.count();
  console.log(`Found ${inputCount} form elements`);
  
  for (let i = 0; i < inputCount; i++) {
    const element = allInputs.nth(i);
    const tagName = await element.evaluate(el => el.tagName);
    const type = await element.getAttribute('type');
    const id = await element.getAttribute('id');
    const testId = await element.getAttribute('data-testid');
    const placeholder = await element.getAttribute('placeholder');
    const visible = await element.isVisible();
    
    console.log(`Element ${i + 1}: ${tagName} type="${type}" id="${id}" testid="${testId}" placeholder="${placeholder}" visible=${visible}`);
  }
  
  // Check for specific test IDs we're looking for
  const expectedTestIds = [
    'deck-name-input',
    'start-date-input',
    'end-date-input',
    'tle-source-select',
    'next-button'
  ];
  
  console.log('\nChecking for expected test IDs:');
  for (const testId of expectedTestIds) {
    const element = page.locator(`[data-testid="${testId}"]`);
    const exists = await element.count();
    const visible = exists > 0 ? await element.isVisible() : false;
    console.log(`  [data-testid="${testId}"]: count=${exists}, visible=${visible}`);
  }
  
  // Check page text to understand structure
  const bodyText = await page.locator('body').textContent();
  const hasStep1 = bodyText?.includes('Step 1');
  const hasInputData = bodyText?.includes('Input Data');
  const hasTLE = bodyText?.includes('TLE');
  const hasTasking = bodyText?.includes('Tasking');
  
  console.log('\nPage content analysis:');
  console.log(`  Contains "Step 1": ${hasStep1}`);
  console.log(`  Contains "Input Data": ${hasInputData}`);
  console.log(`  Contains "TLE": ${hasTLE}`);
  console.log(`  Contains "Tasking": ${hasTasking}`);
});