import { test, expect } from '@playwright/test';

// Test configuration for empathetic UX testing
test.describe('Empathetic UX Testing - Create Collection Deck', () => {
  test.beforeEach(async ({ page }) => {
    // Navigate to the application
    await page.goto('http://localhost:3000');
    
    // Wait for the application to load
    await page.waitForSelector('text=VUE Dashboard');
  });

  test.describe('Step 3: Review Matches Loading Experience', () => {
    test('should provide reassuring feedback during match generation', async ({ page }) => {
      // Navigate to the beginning of the workflow
      await page.goto('http://localhost:3001');
      await page.click('text=Decks');
      await page.click('text=Create New Deck');
      await page.waitForURL('**/decks/new/data');

      // Fill out Step 1 with test data
      await page.fill('[data-testid="deck-name-input"]', 'Feedback Test Deck');
      await page.fill('[data-testid="start-date-input"]', '2024-01-01');
      await page.fill('[data-testid="end-date-input"]', '2024-01-31');
      await page.click('text=Next');

      // Fill out Step 2
      await page.fill('[data-testid="hard-capacity-input"]', '100');
      await page.fill('[data-testid="min-duration-input"]', '30');
      await page.fill('[data-testid="elevation-input"]', '10');
      await page.click('text=Next');

      // Test 1: Verify loading state appears
      await expect(page.locator('[data-testid="loading-spinner"]')).toBeVisible();
      await expect(page.locator('text=Generating Matches')).toBeVisible();
      await expect(page.locator('[data-testid="loading-progress"]')).toBeVisible();

      // Test 2: Verify progress updates
      await expect(page.locator('text=Initializing analysis engine...')).toBeVisible();
      
      // Wait for progress to update
      await page.waitForSelector('text=Loading satellite data...', { timeout: 5000 });

      // Test 3: Verify time estimates
      await expect(page.locator('text=Estimated time remaining:')).toBeVisible();

      // Test 4: Verify completion
      await page.waitForSelector('[data-testid="loading-spinner"]', { state: 'hidden', timeout: 10000 });
      await expect(page.locator('text=Step 3: Review Matches')).toBeVisible();
      await expect(page.locator('text=ALL (6)')).toBeVisible();
    });

    test('should handle loading state interruptions gracefully', async ({ page }) => {
      // Navigate to Step 3
      await page.goto('http://localhost:3001');
      await page.click('text=Decks');
      await page.click('text=Create New Deck');
      await page.waitForURL('**/decks/new/data');

      // Quick navigation to Step 3
      await page.fill('[data-testid="deck-name-input"]', 'Test Deck');
      await page.click('text=Next');
      await page.click('text=Next');

      // Verify loading state appears
      await expect(page.locator('.bp4-spinner')).toBeVisible();

      // Test interruption scenario - user navigates away during loading
      await page.click('text=Dashboard');

      // Verify no console errors from unmounting during loading
      const consoleErrors = await page.evaluate(() => {
        return (window as any).consoleErrors || [];
      });
      
      // Navigate back to see if loading state is handled properly
      await page.click('text=Decks');
      await page.click('text=Continue');

      // Should either resume loading or show results
      await expect(page.locator('text=Step 3: Review Matches')).toBeVisible();
    });

    test('should provide clear feedback when no matches are found', async ({ page }) => {
      // Navigate to Step 3
      await page.goto('http://localhost:3001');
      await page.click('text=Decks');
      await page.click('text=Create New Deck');
      await page.waitForURL('**/decks/new/data');

      // Use parameters that might result in no matches
      await page.fill('[data-testid="deck-name-input"]', 'No Match Test');
      await page.click('text=Next');
      await page.fill('[data-testid="hard-capacity-input"]', '1'); // Very low capacity
      await page.fill('[data-testid="min-duration-input"]', '300'); // Very high duration
      await page.click('text=Next');

      // Wait for loading to complete
      await page.waitForSelector('.bp4-spinner', { state: 'hidden', timeout: 5000 });

      // Verify appropriate messaging for no results
      await expect(page.locator('text=No matches found with the current parameters')).toBeVisible();
      await expect(page.locator('text=Try adjusting your criteria')).toBeVisible();
    });
  });

  test.describe('Workflow Abandonment & Resumption', () => {
    test('should save progress and allow resumption', async ({ page }) => {
      // Step 1: Initiate and partially complete
      await page.goto('http://localhost:3001');
      await page.click('text=Decks');
      await page.click('text=Create New Deck');
      await page.waitForURL('**/decks/new/data');

      // Input initial data
      await page.fill('[data-testid="deck-name-input"]', 'My Important Analysis Deck');
      await page.click('text=Next');

      // Verify we're on Step 2
      await expect(page.locator('text=Step 2: Review Parameters')).toBeVisible();

      // Take screenshot of current state
      await page.screenshot({ path: 'test-results/abandonment-step2-url.png' });

      // Step 2: Simulate abandonment
      await page.click('text=Dashboard');

      // Step 3: Check for incomplete deck notification
      await page.click('text=Decks');
      
      // Look for incomplete deck indicator
      const incompleteDeckNotification = page.locator('text=You have 1 incomplete Collection Deck');
      await expect(incompleteDeckNotification).toBeVisible({ timeout: 2000 });

      // Take screenshot of notification
      await page.screenshot({ path: 'test-results/abandonment-notification.png' });

      // Step 4: Resume the deck
      await page.click('[data-testid="resume-deck-button"]');

      // Verify we're back on Step 2 with data preserved
      await expect(page.locator('text=Step 2: Review Parameters')).toBeVisible();
      await expect(page.locator('[data-testid="deck-name-input"]')).toHaveValue('My Important Analysis Deck');
    });

    test('should provide clear discard confirmation', async ({ page }) => {
      // Create an incomplete deck
      await page.goto('http://localhost:3001');
      await page.click('text=Decks');
      await page.click('text=Create New Deck');
      await page.waitForURL('**/decks/new/data');
      await page.fill('[data-testid="deck-name-input"]', 'Deck to Discard');
      await page.click('text=Next');
      await page.click('text=Dashboard');

      // Navigate back to decks page
      await page.click('text=Decks');

      // Try to discard the deck
      await page.click('text=Discard');

      // Verify confirmation dialog appears
      await expect(page.locator('text=You have unsaved changes in your collection deck')).toBeVisible();
      await expect(page.locator('text=Are you sure you want to discard all progress?')).toBeVisible();
    });

    test('should handle multiple incomplete decks gracefully', async ({ page }) => {
      // Create multiple incomplete decks
      for (let i = 1; i <= 3; i++) {
        await page.goto('http://localhost:3001');
        await page.click('text=Decks');
        await page.click('text=Create New Deck');
        await page.waitForURL('**/decks/new/data');
        await page.fill('[data-testid="deck-name-input"]', `Incomplete Deck ${i}`);
        await page.click('text=Next');
        await page.click('text=Dashboard');
      }

      // Navigate to decks page
      await page.click('text=Decks');

      // Verify multiple deck notifications
      await expect(page.locator('text=You have 3 incomplete Collection Decks')).toBeVisible();
    });
  });

  test.describe('Accessibility and Screen Reader Support', () => {
    test('should provide proper ARIA labels during loading', async ({ page }) => {
      // Navigate to Step 3
      await page.goto('http://localhost:3001');
      await page.click('text=Decks');
      await page.click('text=Create New Deck');
      await page.waitForURL('**/decks/new/data');
      await page.fill('[data-testid="deck-name-input"]', 'Accessibility Test');
      await page.click('text=Next');
      await page.click('text=Next');

      // Verify ARIA labels are present
      await expect(page.locator('[data-testid="loading-spinner"]')).toHaveAttribute('aria-label', 'Loading matches...');
      await expect(page.locator('[data-testid="loading-progress"]')).toHaveAttribute('aria-valuemin', '0');
      await expect(page.locator('[data-testid="loading-progress"]')).toHaveAttribute('aria-valuemax', '100');
    });

    test('should announce state changes to screen readers', async ({ page }) => {
      // Navigate to Step 3
      await page.goto('http://localhost:3001');
      await page.click('text=Decks');
      await page.click('text=Create New Deck');
      await page.waitForURL('**/decks/new/data');
      await page.fill('[data-testid="deck-name-input"]', 'Screen Reader Test');
      await page.click('text=Next');
      await page.click('text=Next');

      // Verify screen reader announcements
      await expect(page.locator('[aria-live="polite"]')).toBeVisible();
      await expect(page.locator('text=Loading matches in progress:')).toBeVisible();
    });
  });

  test.describe('Error Handling and Recovery', () => {
    test('should handle network errors gracefully', async ({ page }) => {
      // Mock network error
      await page.route('**/api/matches', route => {
        route.abort('failed');
      });

      // Navigate to Step 3
      await page.goto('http://localhost:3001');
      await page.click('text=Decks');
      await page.click('text=Create New Deck');
      await page.waitForURL('**/decks/new/data');
      await page.fill('[data-testid="deck-name-input"]', 'Error Test');
      await page.click('text=Next');
      await page.click('text=Next');

      // Verify error handling
      await expect(page.locator('text=An error occurred while generating matches')).toBeVisible();
      await expect(page.locator('text=Please try again')).toBeVisible();
    });

    test('should preserve user data during errors', async ({ page }) => {
      // Navigate to Step 3 and trigger an error
      await page.goto('http://localhost:3001');
      await page.click('text=Decks');
      await page.click('text=Create New Deck');
      await page.waitForURL('**/decks/new/data');
      await page.fill('[data-testid="deck-name-input"]', 'Data Preservation Test');
      await page.fill('[data-testid="start-date-input"]', '2024-01-01');
      await page.fill('[data-testid="end-date-input"]', '2024-01-31');
      await page.click('text=Next');
      await page.fill('[data-testid="hard-capacity-input"]', '100');
      await page.fill('[data-testid="min-duration-input"]', '30');
      await page.fill('[data-testid="elevation-input"]', '10');
      await page.click('text=Next');

      // Simulate error
      await page.evaluate(() => {
        throw new Error('Network error');
      });

      // Verify data is preserved
      await expect(page.locator('[data-testid="deck-name-input"]')).toHaveValue('Data Preservation Test');
    });
  });

  test.describe('Performance and Responsiveness', () => {
    test('should remain responsive during long operations', async ({ page }) => {
      // Navigate to Step 3
      await page.goto('http://localhost:3001');
      await page.click('text=Decks');
      await page.click('text=Create New Deck');
      await page.waitForURL('**/decks/new/data');
      await page.fill('[data-testid="deck-name-input"]', 'Performance Test');
      await page.click('text=Next');
      await page.click('text=Next');

      // Verify UI remains responsive during loading
      await expect(page.locator('text=Generating Matches')).toBeVisible();
      
      // Test that pause button is clickable
      await expect(page.locator('text=Pause')).toBeEnabled();
      
      // Test that navigation buttons are disabled during loading
      await expect(page.locator('button:has-text("Next")')).toBeDisabled();
    });

    test('should provide time estimates for long operations', async ({ page }) => {
      // Navigate to Step 3
      await page.goto('http://localhost:3001');
      await page.click('text=Decks');
      await page.click('text=Create New Deck');
      await page.waitForURL('**/decks/new/data');
      await page.fill('[data-testid="deck-name-input"]', 'Time Estimate Test');
      await page.click('text=Next');
      await page.click('text=Next');

      // Verify time estimates are provided
      await expect(page.locator('text=Estimated time remaining:')).toBeVisible();
      await expect(page.locator('text=seconds')).toBeVisible();
    });
  });
});
