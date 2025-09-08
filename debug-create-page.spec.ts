import { test, expect } from '@playwright/test';

test('Debug: Check create collection page content', async ({ page }) => {
  console.log('🔍 Debugging create collection page...');
  
  await page.goto('/');
  await page.waitForLoadState('networkidle');
  
  // Click create collection
  await page.click('button:has-text("Create Collection")');
  await page.waitForLoadState('networkidle');
  
  // Take screenshot
  await page.screenshot({ path: 'debug-create-collection-page.png', fullPage: true });
  
  // Get current URL
  const currentUrl = page.url();
  console.log('Current URL:', currentUrl);
  
  // Get page title and main text
  const title = await page.title();
  console.log('Page title:', title);
  
  const mainHeading = await page.locator('h1, h2, h3, h4, h5').first().textContent();
  console.log('Main heading:', mainHeading);
  
  // Look for form elements
  const inputs = page.locator('input');
  const inputCount = await inputs.count();
  console.log('Number of inputs found:', inputCount);
  
  for (let i = 0; i < Math.min(inputCount, 10); i++) {
    const inputType = await inputs.nth(i).getAttribute('type');
    const inputPlaceholder = await inputs.nth(i).getAttribute('placeholder');
    const inputTestId = await inputs.nth(i).getAttribute('data-testid');
    const inputVisible = await inputs.nth(i).isVisible();
    console.log(`Input ${i + 1}: type="${inputType}" placeholder="${inputPlaceholder}" testid="${inputTestId}" visible=${inputVisible}`);
  }
  
  // Look for specific test IDs mentioned in our tests
  const testIds = [
    'deck-name-input',
    'start-date-input', 
    'end-date-input',
    'tle-source-select',
    'next-button'
  ];
  
  for (const testId of testIds) {
    const element = page.locator(`[data-testid="${testId}"]`);
    const exists = await element.count() > 0;
    const visible = exists ? await element.isVisible() : false;
    console.log(`Element [data-testid="${testId}"]: exists=${exists}, visible=${visible}`);
  }
  
  // Get all text on page
  const bodyText = await page.locator('body').textContent();
  const hasStep1 = bodyText?.includes('Step 1');
  const hasInputData = bodyText?.includes('Input Data');
  const hasBuildCollection = bodyText?.includes('Build Your Collection');
  
  console.log('Page contains:');
  console.log('  "Step 1":', hasStep1);
  console.log('  "Input Data":', hasInputData);
  console.log('  "Build Your Collection":', hasBuildCollection);
});