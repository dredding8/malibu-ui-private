import { test, expect } from '@playwright/test';

test('Fixed wizard navigation test', async ({ page }) => {
  // Start from Collection Decks page
  await page.goto('/decks');
  await page.waitForLoadState('networkidle');
  
  // Navigate to Create Collection Deck wizard
  await page.getByTestId('create-collection-button').click();
  await expect(page).toHaveURL(/create-collection-deck/);
  await expect(page.getByTestId('create-collection-deck-page')).toBeVisible();
  
  // Fill basic form data
  await page.getByTestId('deck-name-input').fill('Fixed Test Collection');
  
  // Try to navigate without required fields to test validation
  await page.getByTestId('next-button').click();
  
  // Should show validation errors
  await expect(page.getByText('Start date is required')).toBeVisible();
  await expect(page.getByText('End date is required')).toBeVisible();
  await expect(page.getByText('TLE data source is required')).toBeVisible();
  
  // Handle Blueprint DateInput - try clicking and then typing
  // Start date
  await page.getByTestId('start-date-input').click();
  await page.keyboard.type('1/15/2024');
  await page.keyboard.press('Tab'); // Move away to trigger validation
  
  // End date  
  await page.getByTestId('end-date-input').click();
  await page.keyboard.type('1/30/2024');
  await page.keyboard.press('Tab'); // Move away to trigger validation
  
  // Set TLE data source
  await page.getByTestId('tle-source-select').selectOption('Manual Entry');
  
  // Now try to navigate to step 2
  await page.getByTestId('next-button').click();
  
  // Check if we successfully navigated or if there are still validation errors
  try {
    await expect(page).toHaveURL(/create-collection-deck\/parameters/, { timeout: 5000 });
    await expect(page.getByTestId('step2-container')).toBeVisible();
    console.log('✅ Successfully navigated to Step 2!');
    
    // Test step 2 navigation back
    await page.getByTestId('step2-back-button').click();
    await expect(page).toHaveURL(/create-collection-deck\/data/);
    await expect(page.getByTestId('step1-container')).toBeVisible();
    
    // Verify data is still there
    await expect(page.getByTestId('deck-name-input')).toHaveValue('Fixed Test Collection');
    
    console.log('✅ Back navigation and data persistence working!');
  } catch (error) {
    console.log('❌ Still on step 1, checking for validation errors...');
    
    // Take a screenshot to see the current state
    await page.screenshot({ path: 'validation-errors.png' });
    
    // Check what validation errors remain
    const startDateError = await page.locator('text=Start date is required').isVisible().catch(() => false);
    const endDateError = await page.locator('text=End date is required').isVisible().catch(() => false);
    const tleError = await page.locator('text=TLE data source is required').isVisible().catch(() => false);
    
    console.log('Validation errors:');
    console.log('- Start date required:', startDateError);
    console.log('- End date required:', endDateError);  
    console.log('- TLE source required:', tleError);
    
    throw error;
  }
});