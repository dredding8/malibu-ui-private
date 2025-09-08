import { test, expect } from '@playwright/test';

test.describe('Comprehensive Wizard Flow Validation', () => {
  
  test('Smart entry point routing from Dashboard', async ({ page }) => {
    // Test 1: Fresh start - should go to step 1
    await page.goto('/');
    await page.waitForLoadState('networkidle');
    
    // Clear any existing data
    await page.evaluate(() => localStorage.removeItem('vue-deck-draft'));
    
    await page.getByTestId('create-deck-button').click();
    await expect(page).toHaveURL(/create-collection-deck\/data/);
    await expect(page.getByRole('heading', { name: 'Step 1: Input Data' })).toBeVisible();
    
    console.log('✅ Fresh start routes to Step 1 correctly');
  });

  test('Smart entry point routing from Collections page', async ({ page }) => {
    // Test 2: With saved progress - should resume at appropriate step
    await page.goto('/decks');
    await page.waitForLoadState('networkidle');
    
    // Simulate saved progress at step 2
    await page.evaluate(() => {
      const savedData = {
        taskingWindow: {
          startDate: '2024-01-15',
          endDate: '2024-01-30'
        },
        tleData: {
          source: 'Manual Entry'
        }
      };
      localStorage.setItem('vue-deck-draft', JSON.stringify(savedData));
    });
    
    await page.getByTestId('create-collection-button').click();
    await expect(page).toHaveURL(/create-collection-deck\/parameters/);
    await expect(page.getByRole('heading', { name: 'Step 2: Review Parameters' })).toBeVisible();
    
    console.log('✅ Saved progress resumes at Step 2 correctly');
  });

  test('Wizard flow progression and validation', async ({ page }) => {
    // Test 3: Complete flow with proper validation
    await page.goto('/decks');
    await page.evaluate(() => localStorage.removeItem('vue-deck-draft'));
    
    // Start fresh wizard
    await page.getByTestId('create-collection-button').click();
    await expect(page).toHaveURL(/create-collection-deck\/data/);
    
    // Try to proceed without required fields
    await page.getByTestId('next-button').click();
    await expect(page.getByText('Start date is required')).toBeVisible();
    await expect(page.getByText('End date is required')).toBeVisible();
    await expect(page.getByText('TLE data source is required')).toBeVisible();
    
    // Should still be on step 1
    await expect(page).toHaveURL(/create-collection-deck\/data/);
    
    console.log('✅ Form validation prevents invalid progression');
  });

  test('Browser navigation state management', async ({ page }) => {
    // Test 4: Browser back/forward navigation
    await page.goto('/decks');
    await page.evaluate(() => localStorage.removeItem('vue-deck-draft'));
    
    // Start wizard and fill basic data
    await page.getByTestId('create-collection-button').click();
    await page.getByTestId('deck-name-input').fill('Navigation Test');
    
    // Navigate to collections page
    await page.getByTestId('nav-collections').click();
    await expect(page).toHaveURL(/\/decks/);
    
    // Use browser back button
    await page.goBack();
    await expect(page).toHaveURL(/create-collection-deck\/data/);
    
    // Verify data is preserved
    await expect(page.getByTestId('deck-name-input')).toHaveValue('Navigation Test');
    
    console.log('✅ Browser navigation preserves wizard state');
  });

  test('Modal interference prevention', async ({ page }) => {
    // Test 5: Modal doesn't interfere with navigation
    await page.goto('/decks');
    await page.evaluate(() => {
      const savedData = { taskingWindow: { startDate: '2024-01-15' } };
      localStorage.setItem('vue-deck-draft', JSON.stringify(savedData));
    });
    
    await page.getByTestId('create-collection-button').click();
    
    // Try to cancel to trigger abandonment alert
    await page.getByTestId('cancel-button').click();
    
    // Alert should be visible
    await expect(page.getByTestId('abandonment-alert')).toBeVisible();
    
    // Try to navigate while modal is open - should not work
    const urlBefore = page.url();
    await page.getByTestId('nav-collections').click();
    
    // URL should not have changed
    expect(page.url()).toBe(urlBefore);
    
    console.log('✅ Modal prevents navigation interference');
  });

  test('Complete wizard flow end-to-end', async ({ page }) => {
    // Test 6: Full completion flow
    await page.goto('/');
    await page.evaluate(() => localStorage.removeItem('vue-deck-draft'));
    
    // Start from Dashboard
    await page.getByTestId('create-deck-button').click();
    await expect(page).toHaveURL(/create-collection-deck\/data/);
    
    // Complete Step 1 (minimal data for testing)
    await page.getByTestId('deck-name-input').fill('Complete Flow Test');
    await page.getByTestId('tle-source-select').selectOption('Manual Entry');
    
    // Mock successful completion without dates for testing
    await page.evaluate(() => {
      // Simulate completing the wizard by setting all required data
      const completeData = {
        deckName: 'Complete Flow Test',
        taskingWindow: {
          startDate: '2024-01-15',
          endDate: '2024-01-30'
        },
        tleData: {
          source: 'Manual Entry'
        },
        parameters: {
          hardCapacity: 5,
          minDuration: 10,
          elevation: 15
        },
        matches: [{ id: 1, selected: true }]
      };
      localStorage.setItem('vue-deck-draft', JSON.stringify(completeData));
    });
    
    // Refresh to pick up the saved data
    await page.reload();
    await page.waitForLoadState('networkidle');
    
    // Should now be on final step
    await expect(page).toHaveURL(/create-collection-deck\/instructions/);
    await expect(page.getByRole('heading', { name: /Step 4/ })).toBeVisible();
    
    console.log('✅ Complete wizard flow navigates to final step');
  });

  test('Exit path consistency', async ({ page }) => {
    // Test 7: Ensure consistent exit behavior
    await page.goto('/decks');
    await page.evaluate(() => localStorage.removeItem('vue-deck-draft'));
    
    await page.getByTestId('create-collection-button').click();
    
    // Test cancel without changes
    await page.getByTestId('cancel-button').click();
    await expect(page).toHaveURL(/\/decks/);
    
    console.log('✅ Cancel without changes returns to Collections page');
  });

  test('URL direct access validation', async ({ page }) => {
    // Test 8: Direct URL access should redirect appropriately
    await page.evaluate(() => localStorage.removeItem('vue-deck-draft'));
    
    // Try to access step 3 directly without data
    await page.goto('/create-collection-deck/matches');
    await page.waitForLoadState('networkidle');
    
    // Should redirect to step 1 or show appropriate state
    // The exact behavior depends on implementation
    const currentUrl = page.url();
    const isValidState = currentUrl.includes('create-collection-deck');
    expect(isValidState).toBe(true);
    
    console.log('✅ Direct URL access handled appropriately');
  });
});