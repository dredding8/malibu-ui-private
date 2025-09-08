import { test, expect } from '@playwright/test';

test('Working E2E wizard test', async ({ page }) => {
  // Start from Collection Decks page
  await page.goto('/decks');
  await page.waitForLoadState('networkidle');
  
  // Navigate to Create Collection Deck wizard
  await page.getByTestId('create-collection-button').click();
  await expect(page).toHaveURL(/create-collection-deck\/data/);
  
  // Verify we're on the wizard page
  await expect(page.getByTestId('create-collection-deck-page')).toBeVisible();
  await expect(page.getByRole('heading', { name: 'Step 1: Input Data' })).toBeVisible();
  
  console.log('✅ Successfully navigated to Create Collection Deck wizard');
  
  // Fill collection name
  await page.getByTestId('deck-name-input').fill('Working E2E Test Collection');
  console.log('✅ Filled collection name');
  
  // Try to proceed without required fields to test validation
  await page.getByTestId('next-button').click();
  
  // Should show validation errors
  await expect(page.getByText('Start date is required')).toBeVisible();
  await expect(page.getByText('End date is required')).toBeVisible(); 
  await expect(page.getByText('TLE data source is required')).toBeVisible();
  
  console.log('✅ Form validation working correctly');
  
  // Fill TLE data source first (this should work)
  await page.getByTestId('tle-source-select').selectOption('Manual Entry');
  console.log('✅ Selected TLE data source');
  
  // For the date inputs, let's try a different approach
  // Let's see if we can find the actual input elements within the DateInput components
  
  // Look for input elements that might be the date inputs
  const allInputs = await page.locator('input').all();
  console.log(`Found ${allInputs.length} input elements`);
  
  // Try to find date inputs by their placeholder text or other attributes
  const startDateInput = page.locator('input[placeholder*="start" i], input[aria-label*="start" i]');
  const endDateInput = page.locator('input[placeholder*="end" i], input[aria-label*="end" i]');
  
  const startDateExists = await startDateInput.count();
  const endDateExists = await endDateInput.count();
  
  console.log(`Start date inputs found: ${startDateExists}`);
  console.log(`End date inputs found: ${endDateExists}`);
  
  if (startDateExists > 0) {
    await startDateInput.first().fill('01/15/2024');
    console.log('✅ Filled start date');
  }
  
  if (endDateExists > 0) {
    await endDateInput.first().fill('01/30/2024');
    console.log('✅ Filled end date');
  }
  
  // Try to proceed to step 2
  await page.getByTestId('next-button').click();
  
  try {
    await expect(page).toHaveURL(/create-collection-deck\/parameters/, { timeout: 5000 });
    console.log('✅ Successfully navigated to Step 2!');
    
    // Verify Step 2 content
    await expect(page.getByRole('heading', { name: 'Step 2: Review Parameters' })).toBeVisible();
    console.log('✅ Step 2 content loaded correctly');
    
  } catch (error) {
    console.log('❌ Failed to navigate to Step 2');
    
    // Take a screenshot for debugging
    await page.screenshot({ path: 'step1-failure.png' });
    
    // Log any remaining validation errors
    const errors = await page.locator('.bp6-form-helper-text').allTextContents();
    console.log('Validation errors:', errors);
    
    throw error;
  }
});