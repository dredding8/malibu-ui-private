import { test, expect } from '@playwright/test';

/**
 * Create Collection Deck - Comprehensive E2E Flow Validation
 * 
 * This test suite validates the complete user journey through the Create Collection Deck wizard,
 * ensuring reliable navigation, form validation, and successful completion across all steps.
 * 
 * Focus Areas:
 * - Navigation system reliability
 * - Form validation and data persistence 
 * - Step progression and state management
 * - User feedback and error handling
 * - Cross-browser compatibility
 * - Mobile responsiveness
 */

test.describe('Create Collection Deck - Complete Wizard Flow', () => {
  
  test.beforeEach(async ({ page }) => {
    // Start from Collection Decks page - primary entry point
    await page.goto('/decks');
    await page.waitForLoadState('networkidle');
  });

  test('Complete wizard flow - Happy path journey', async ({ page }) => {
    // Phase 1: Navigation to wizard
    await test.step('Navigate to Create Collection Deck wizard', async () => {
      await page.getByTestId('create-collection-button').click();
      await expect(page).toHaveURL(/create-collection-deck/);
      await expect(page.getByTestId('create-collection-deck-page')).toBeVisible();
      await expect(page.getByTestId('create-deck-title')).toHaveText('Build Your Collection');
    });

    // Phase 2: Step 1 - Input Data
    await test.step('Complete Step 1: Input Data', async () => {
      // Verify we're on step 1
      await expect(page.getByTestId('step1-container')).toBeVisible();
      await expect(page.getByTestId('step-1-indicator')).toBeVisible();
      
      // Fill collection name
      await page.getByTestId('deck-name-input').fill('E2E Test Collection');
      
      // Set tasking window dates
      const startDateInput = page.getByTestId('start-date-input').locator('input');
      await startDateInput.fill('01/15/2024');
      
      const endDateInput = page.getByTestId('end-date-input').locator('input');
      await endDateInput.fill('01/30/2024');
      
      // Set TLE data source
      await page.getByTestId('tle-source-select').selectOption('UDL');
      await page.getByTestId('load-udl-button').click();
      
      // Wait for loading simulation
      await page.waitForSelector('[data-testid="load-udl-button"]:not([aria-busy="true"])', { timeout: 3000 });
      
      // Set unavailable sites
      await page.getByTestId('sites-source-select').selectOption('Manual Entry');
      
      // Navigate to step 2
      await page.getByTestId('next-button').click();
      await expect(page).toHaveURL(/create-collection-deck\/parameters/);
    });

    // Phase 3: Step 2 - Review Parameters  
    await test.step('Complete Step 2: Review Parameters', async () => {
      // Verify we're on step 2
      await expect(page.getByTestId('step2-container')).toBeVisible();
      await expect(page.getByTestId('step-2-indicator')).toBeVisible();
      
      // Verify step 1 data summary is displayed
      await expect(page.getByTestId('step1-data-summary-card')).toBeVisible();
      
      // Test tabbed interface
      await page.getByTestId('elevation-tab').click();
      await expect(page.getByTestId('elevation-panel')).toBeVisible();
      
      // Set elevation using slider
      await page.getByTestId('elevation-slider').fill('15');
      await expect(page.getByTestId('elevation-input')).toHaveValue('15');
      
      // Test capacity tab
      await page.getByTestId('capacity-tab').click();
      await expect(page.getByTestId('capacity-panel')).toBeVisible();
      await page.getByTestId('hard-capacity-input').fill('5');
      
      // Test duration tab
      await page.getByTestId('duration-tab').click(); 
      await expect(page.getByTestId('duration-panel')).toBeVisible();
      await page.getByTestId('min-duration-input').fill('10');
      
      // Navigate to step 3
      await page.getByTestId('step2-next-button').click();
      
      // Handle background processing alert
      await expect(page.getByTestId('background-processing-alert')).toBeVisible();
      await page.getByRole('button', { name: 'Start Background Processing' }).click();
    });

    // Phase 4: Step 3 - Review Matches
    await test.step('Complete Step 3: Review Matches', async () => {
      // Wait for matches generation
      await expect(page.getByTestId('step3-container')).toBeVisible();
      
      // Wait for loading to complete
      await expect(page.getByTestId('loading-spinner')).toBeVisible();
      await expect(page.getByTestId('matches-results-card')).toBeVisible({ timeout: 10000 });
      
      // Verify match filter controls are present
      await expect(page.getByTestId('match-filter-controls')).toBeVisible();
      await expect(page.getByTestId('all-matches-tab')).toBeVisible();
      
      // Test search functionality
      await page.getByTestId('search-sccs-input').fill('13113');
      
      // Test site filtering
      await page.getByTestId('site-filter-select').selectOption('THU');
      
      // Clear filters to see all matches
      await page.getByTestId('search-sccs-input').clear();
      await page.getByTestId('site-filter-select').selectOption('all');
      
      // Select at least one match for progression
      await expect(page.getByTestId('matches-data-table')).toBeVisible();
      
      // Use select all functionality 
      await page.getByTestId('select-all-matches-button').click();
      
      // Navigate to step 4
      await page.getByTestId('step3-next-button').click();
      await expect(page).toHaveURL(/create-collection-deck\/instructions/);
    });

    // Phase 5: Step 4 - Special Instructions & Finish
    await test.step('Complete Step 4: Special Instructions & Finish', async () => {
      // Verify we're on step 4
      await expect(page.getByTestId('step4-container')).toBeVisible();
      await expect(page.getByTestId('step-4-indicator')).toBeVisible();
      
      // Verify collection summary is displayed
      await expect(page.getByTestId('collection-summary-card')).toBeVisible();
      await expect(page.getByTestId('selected-matches-summary')).toBeVisible();
      
      // Add special instructions
      await page.getByTestId('special-instructions-textarea').fill('E2E Test: Automated collection created for validation purposes.');
      
      // Finish the wizard
      await page.getByTestId('step4-finish-button').click();
      
      // Handle confirmation
      await expect(page.getByTestId('confirmation-card')).toBeVisible();
      await page.getByTestId('step4-finish-button').click();
      
      // Verify redirection to history or collection decks page
      await expect(page).toHaveURL(/\/(history|decks)/);
    });

    // Phase 6: Validation
    await test.step('Validate successful completion', async () => {
      // Check if we're on history page (background processing) or decks page
      const currentUrl = page.url();
      if (currentUrl.includes('/history')) {
        await expect(page.getByText('History')).toBeVisible();
      } else if (currentUrl.includes('/decks')) {
        await expect(page.getByText('Collections')).toBeVisible();
      }
    });
  });

  test('Form validation - Required fields enforcement', async ({ page }) => {
    await test.step('Navigate to wizard and test validation', async () => {
      await page.getByTestId('create-collection-button').click();
      await expect(page.getByTestId('create-collection-deck-page')).toBeVisible();
      
      // Try to proceed without filling required fields
      await page.getByTestId('next-button').click();
      
      // Should show validation errors
      await expect(page.getByText('Start date is required')).toBeVisible();
      await expect(page.getByText('End date is required')).toBeVisible();
      await expect(page.getByText('TLE data source is required')).toBeVisible();
    });
  });

  test('Navigation system - Back/Cancel functionality', async ({ page }) => {
    await test.step('Test navigation controls throughout wizard', async () => {
      // Start wizard
      await page.getByTestId('create-collection-button').click();
      
      // Fill minimum data for step 1
      await page.getByTestId('deck-name-input').fill('Navigation Test');
      const startDateInput = page.getByTestId('start-date-input').locator('input');
      await startDateInput.fill('01/15/2024');
      const endDateInput = page.getByTestId('end-date-input').locator('input');
      await endDateInput.fill('01/30/2024');
      await page.getByTestId('tle-source-select').selectOption('Manual Entry');
      
      // Go to step 2
      await page.getByTestId('next-button').click();
      await expect(page.getByTestId('step2-container')).toBeVisible();
      
      // Test back button
      await page.getByTestId('step2-back-button').click();
      await expect(page.getByTestId('step1-container')).toBeVisible();
      
      // Test cancel functionality
      await page.getByTestId('cancel-button').click();
      await expect(page).toHaveURL(/\/decks/);
    });
  });

  test('Data persistence - Auto-save functionality', async ({ page }) => {
    await test.step('Test data persistence across sessions', async () => {
      // Start wizard and enter data
      await page.getByTestId('create-collection-button').click();
      await page.getByTestId('deck-name-input').fill('Persistence Test');
      await page.getByTestId('start-date-input').click();
      await page.keyboard.type('01/15/2024');
      
      // Navigate away and return
      await page.getByTestId('nav-collections').click();
      await expect(page).toHaveURL(/\/decks/);
      
      // Should show resume notification
      await expect(page.getByTestId('resume-deck-button')).toBeVisible();
      
      // Resume and verify data is preserved
      await page.getByTestId('resume-deck-button').click();
      await expect(page.getByTestId('deck-name-input')).toHaveValue('Persistence Test');
    });
  });

  test('Accessibility - Keyboard navigation', async ({ page }) => {
    await test.step('Test keyboard-only navigation through wizard', async () => {
      await page.getByTestId('create-collection-button').click();
      
      // Use Tab key to navigate through form elements
      await page.keyboard.press('Tab');
      await expect(page.getByTestId('deck-name-input')).toBeFocused();
      
      await page.keyboard.press('Tab');
      await page.keyboard.press('Tab');
      await expect(page.getByTestId('start-date-input')).toBeFocused();
      
      // Test form submission with keyboard
      await page.keyboard.press('Tab');
      await page.keyboard.press('Tab');  
      await page.keyboard.press('Tab');
      await page.keyboard.press('Tab');
      await page.keyboard.press('Tab');
      await page.keyboard.press('Tab');
      await page.keyboard.press('Tab');
      await expect(page.getByTestId('next-button')).toBeFocused();
    });
  });

  test('Error handling - Invalid data scenarios', async ({ page }) => {
    await test.step('Test error handling for invalid inputs', async () => {
      await page.getByTestId('create-collection-button').click();
      
      // Test invalid date range (end before start)
      const startDateInput = page.getByTestId('start-date-input').locator('input');
      await startDateInput.fill('01/30/2024');
      const endDateInput = page.getByTestId('end-date-input').locator('input');
      await endDateInput.fill('01/15/2024');
      await page.getByTestId('tle-source-select').selectOption('Manual Entry');
      
      await page.getByTestId('next-button').click();
      await expect(page.getByText('End date must be after start date')).toBeVisible();
    });
  });

  // Mobile-specific tests
  test.describe('Mobile Experience', () => {
    test.use({ viewport: { width: 375, height: 667 }, hasTouch: true });
    
    test('Mobile wizard flow - Touch interactions', async ({ page }) => {
      await test.step('Complete wizard on mobile viewport', async () => {
        await page.getByTestId('create-collection-button').click();
        
        // Verify mobile-friendly layout
        await expect(page.getByTestId('create-collection-deck-page')).toBeVisible();
        await expect(page.getByTestId('progress-card')).toBeVisible();
        
        // Test touch interactions for form elements
        await page.getByTestId('deck-name-input').tap();
        await page.keyboard.type('Mobile Test Collection');
        
        // Verify touch targets meet minimum size (44px)
        const nextButton = page.getByTestId('next-button');
        const boundingBox = await nextButton.boundingBox();
        expect(boundingBox?.height).toBeGreaterThanOrEqual(44);
        expect(boundingBox?.width).toBeGreaterThanOrEqual(44);
      });
    });
  });

  // Cross-browser compatibility tests  
  test.describe('Cross-Browser Compatibility', () => {
    ['chromium', 'firefox', 'webkit'].forEach(browserName => {
      test(`Wizard functionality in ${browserName}`, async ({ page, browserName: currentBrowser }) => {
        test.skip(currentBrowser !== browserName);
        
        await test.step(`Test basic wizard flow in ${browserName}`, async () => {
          await page.getByTestId('create-collection-button').click();
          await expect(page.getByTestId('create-collection-deck-page')).toBeVisible();
          
          // Fill minimal data
          await page.getByTestId('deck-name-input').fill(`${browserName} Test`);
          await page.getByTestId('tle-source-select').selectOption('Manual Entry');
          
          // Verify form elements work across browsers
          await expect(page.getByTestId('deck-name-input')).toHaveValue(`${browserName} Test`);
          await expect(page.getByTestId('tle-source-select')).toHaveValue('Manual Entry');
        });
      });
    });
  });

  test('Performance - Page load and navigation timing', async ({ page }) => {
    await test.step('Measure critical performance metrics', async () => {
      const startTime = Date.now();
      
      await page.getByTestId('create-collection-button').click();
      await page.waitForLoadState('networkidle');
      
      const loadTime = Date.now() - startTime;
      expect(loadTime).toBeLessThan(3000); // Should load within 3 seconds
      
      // Test step navigation performance
      const stepStartTime = Date.now();
      await page.getByTestId('deck-name-input').fill('Performance Test');
      await page.getByTestId('tle-source-select').selectOption('Manual Entry');
      await page.getByTestId('next-button').click();
      await page.waitForURL(/parameters/);
      
      const stepNavigationTime = Date.now() - stepStartTime;
      expect(stepNavigationTime).toBeLessThan(1000); // Step navigation should be under 1s
    });
  });
});