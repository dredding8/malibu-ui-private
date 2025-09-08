import { test, expect } from '@playwright/test';

test('Working wizard navigation test', async ({ page }) => {
  // Start from Collection Decks page
  await page.goto('/decks');
  await page.waitForLoadState('networkidle');
  
  // Navigate to Create Collection Deck wizard
  await page.getByTestId('create-collection-button').click();
  await expect(page).toHaveURL(/create-collection-deck/);
  await expect(page.getByTestId('create-collection-deck-page')).toBeVisible();
  
  // Fill basic form data
  await page.getByTestId('deck-name-input').fill('Working Test Collection');
  
  // Try to navigate without required fields to test validation
  await page.getByTestId('next-button').click();
  
  // Should show validation errors
  await expect(page.getByText('Start date is required')).toBeVisible();
  await expect(page.getByText('End date is required')).toBeVisible();
  await expect(page.getByText('TLE data source is required')).toBeVisible();
  
  // Fill required fields - try using placeholder text to find the inputs
  await page.getByPlaceholder('Select start date...').fill('01/15/2024');
  await page.getByPlaceholder('Select end date...').fill('01/30/2024');
  
  await page.getByTestId('tle-source-select').selectOption('Manual Entry');
  
  // Now try to navigate to step 2
  await page.getByTestId('next-button').click();
  await expect(page).toHaveURL(/create-collection-deck\/parameters/);
  await expect(page.getByTestId('step2-container')).toBeVisible();
  
  console.log('✅ Basic wizard navigation working!');
  
  // Test step 2 navigation back
  await page.getByTestId('step2-back-button').click();
  await expect(page).toHaveURL(/create-collection-deck\/data/);
  await expect(page.getByTestId('step1-container')).toBeVisible();
  
  // Verify data is still there
  await expect(page.getByTestId('deck-name-input')).toHaveValue('Working Test Collection');
  
  console.log('✅ Back navigation and data persistence working!');
});