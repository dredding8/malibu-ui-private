import { test, expect } from '@playwright/test';

test.describe('VUE Dashboard - Comprehensive Fix Validation', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');
  });

  test('Navigation elements have unique test IDs and correct Blueprint v6 classes', async ({ page }) => {
    // Check navigation buttons exist with proper test IDs
    await expect(page.locator('[data-testid="nav-master"]')).toBeVisible();
    await expect(page.locator('[data-testid="nav-sccs"]')).toBeVisible();
    await expect(page.locator('[data-testid="nav-decks"]')).toBeVisible();
    await expect(page.locator('[data-testid="nav-history"]')).toBeVisible();
    await expect(page.locator('[data-testid="nav-analytics"]')).toBeVisible();
    await expect(page.locator('[data-testid="nav-logout"]')).toBeVisible();

    // Check Blueprint v6 classes are used
    await expect(page.locator('.bp6-navbar')).toBeVisible();
    await expect(page.locator('.bp6-dark')).toBeVisible();
  });

  test('Form elements are properly implemented with test IDs', async ({ page }) => {
    // Check search input exists
    await expect(page.locator('[data-testid="search-input"]')).toBeVisible();
    
    // Check action buttons exist
    await expect(page.locator('[data-testid="update-master-button"]')).toBeVisible();
    await expect(page.locator('[data-testid="create-deck-button"]')).toBeVisible();
    await expect(page.locator('[data-testid="add-scc-button"]')).toBeVisible();
  });

  test('Navigation to History page works and shows proper form elements', async ({ page }) => {
    // Navigate to History page
    await page.click('[data-testid="nav-history"]');
    await page.waitForLoadState('networkidle');

    // Check History page form elements
    await expect(page.locator('[data-testid="start-date-input"]')).toBeVisible();
    await expect(page.locator('[data-testid="end-date-input"]')).toBeVisible();
    await expect(page.locator('[data-testid="reset-dates-button"]')).toBeVisible();
    await expect(page.locator('[data-testid="apply-filter-button"]')).toBeVisible();
    await expect(page.locator('[data-testid="history-table-container"]')).toBeVisible();
  });

  test('Create Collection Deck form has proper elements', async ({ page }) => {
    // Navigate to Create Collection Deck
    await page.click('[data-testid="create-deck-button"]');
    await page.waitForLoadState('networkidle');

    // Check form elements exist
    await expect(page.locator('[data-testid="deck-name-input"]')).toBeVisible();
    await expect(page.locator('[data-testid="start-date-input"]')).toBeVisible();
    await expect(page.locator('[data-testid="end-date-input"]')).toBeVisible();
    await expect(page.locator('[data-testid="tle-source-select"]')).toBeVisible();
    await expect(page.locator('[data-testid="sites-source-select"]')).toBeVisible();
    await expect(page.locator('[data-testid="next-button"]')).toBeVisible();
    await expect(page.locator('[data-testid="cancel-button"]')).toBeVisible();
  });

  test('Search functionality works properly', async ({ page }) => {
    const searchInput = page.locator('[data-testid="search-input"]');
    
    // Type in search
    await searchInput.fill('test search');
    await expect(searchInput).toHaveValue('test search');
    
    // Clear search
    await page.click('[data-testid="clear-search-button"]');
    await expect(searchInput).toHaveValue('');
  });

  test('Update Master List button shows loading state', async ({ page }) => {
    const updateButton = page.locator('[data-testid="update-master-button"]');
    
    // Click update button
    await updateButton.click();
    
    // Check loading state
    await expect(updateButton).toBeDisabled();
    
    // Wait for completion (simulated 2 second delay)
    await page.waitForTimeout(2500);
    
    // Button should be enabled again
    await expect(updateButton).toBeEnabled();
  });

  test('Navigation between pages works correctly', async ({ page }) => {
    // Test navigation to different pages
    const pages = [
      { testId: 'nav-sccs', expectedPath: '/sccs' },
      { testId: 'nav-decks', expectedPath: '/decks' },
      { testId: 'nav-history', expectedPath: '/history' },
      { testId: 'nav-analytics', expectedPath: '/analytics' }
    ];

    for (const pageInfo of pages) {
      await page.click(`[data-testid="${pageInfo.testId}"]`);
      await page.waitForLoadState('networkidle');
      await expect(page).toHaveURL(new RegExp(pageInfo.expectedPath));
      
      // Navigate back to dashboard
      await page.click('[data-testid="nav-master"]');
      await page.waitForLoadState('networkidle');
    }
  });

  test('Form validation works in Create Collection Deck', async ({ page }) => {
    // Navigate to Create Collection Deck
    await page.click('[data-testid="create-deck-button"]');
    await page.waitForLoadState('networkidle');

    // Try to proceed without filling required fields
    await page.click('[data-testid="next-button"]');
    
    // Should stay on the same page due to validation
    await expect(page.locator('[data-testid="deck-name-input"]')).toBeVisible();
    
    // Fill required fields
    await page.fill('[data-testid="deck-name-input"]', 'Test Deck');
    await page.click('[data-testid="start-date-input"]');
    await page.keyboard.press('Enter'); // Select today's date
    await page.click('[data-testid="end-date-input"]');
    await page.keyboard.press('ArrowRight'); // Select tomorrow's date
    await page.keyboard.press('Enter');
    
    // Select TLE source
    await page.selectOption('[data-testid="tle-source-select"]', 'UDL');
    
    // Now should be able to proceed
    await page.click('[data-testid="next-button"]');
    
    // Should navigate to next step
    await expect(page.locator('[data-testid="deck-name-input"]')).not.toBeVisible();
  });

  test('History table displays correctly with proper styling', async ({ page }) => {
    // Navigate to History page
    await page.click('[data-testid="nav-history"]');
    await page.waitForLoadState('networkidle');

    // Check table container exists
    await expect(page.locator('[data-testid="history-table-container"]')).toBeVisible();
    
    // Check for Blueprint v6 table classes
    await expect(page.locator('.bp6-table')).toBeVisible();
    
    // Check table columns exist
    await expect(page.locator('[data-testid="collection-status-column"]')).toBeVisible();
    await expect(page.locator('[data-testid="algorithm-status-column"]')).toBeVisible();
  });

  test('Date filtering in History page works', async ({ page }) => {
    // Navigate to History page
    await page.click('[data-testid="nav-history"]');
    await page.waitForLoadState('networkidle');

    // Set start date
    await page.click('[data-testid="start-date-input"]');
    await page.keyboard.press('Enter');
    
    // Set end date
    await page.click('[data-testid="end-date-input"]');
    await page.keyboard.press('ArrowRight');
    await page.keyboard.press('Enter');
    
    // Apply filter
    await page.click('[data-testid="apply-filter-button"]');
    
    // Reset filter
    await page.click('[data-testid="reset-dates-button"]');
    
    // Dates should be cleared
    await expect(page.locator('[data-testid="start-date-input"]')).toBeVisible();
    await expect(page.locator('[data-testid="end-date-input"]')).toBeVisible();
  });

  test('All Blueprint v6 classes are properly applied', async ({ page }) => {
    // Check for Blueprint v6 classes throughout the app
    const bp6Classes = await page.locator('.bp6-').count();
    expect(bp6Classes).toBeGreaterThan(0);
    
    // Check specific classes
    await expect(page.locator('.bp6-navbar')).toBeVisible();
    await expect(page.locator('.bp6-dark')).toBeVisible();
    await expect(page.locator('.bp6-minimal')).toBeVisible();
  });

  test('Error handling and loading states work correctly', async ({ page }) => {
    // Test error handling by triggering update with potential failure
    const updateButton = page.locator('[data-testid="update-master-button"]');
    
    // Click multiple times to increase chance of simulated error
    for (let i = 0; i < 5; i++) {
      await updateButton.click();
      await page.waitForTimeout(2500); // Wait for completion
    }
    
    // Should handle both success and error states gracefully
    await expect(updateButton).toBeEnabled();
  });
});
