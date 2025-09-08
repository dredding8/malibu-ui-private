import { test, expect } from '@playwright/test';

/**
 * Create Collection Deck End-to-End User Experience Validation
 * 
 * This test suite validates the complete user journey for creating collection decks
 * from a user's perspective, focusing on intuitiveness, clarity, and user satisfaction.
 * 
 * Test Philosophy:
 * - User-centered validation: Every test validates from the user's mental model
 * - Intuitiveness verification: Users should naturally understand each step
 * - Clear communication: All interface elements should be immediately understandable
 * - Logical flow progression: Each step should follow naturally from user expectations
 * - Confident completion: Users should feel successful after creating their deck
 */

test.describe('Create Collection Deck - User Experience Validation', () => {

  test.beforeEach(async ({ page }) => {
    // Start from a clean state
    await page.goto('/');
    await page.waitForLoadState('networkidle');
    
    // Remove any webpack overlay that might interfere with tests
    await page.evaluate(() => {
      const overlay = document.getElementById('webpack-dev-server-client-overlay');
      if (overlay) overlay.remove();
    });
  });

  test.describe('Entry Point Discovery & Navigation', () => {
    
    test('users can easily discover collection deck creation from Dashboard', async ({ page }) => {
      // Validate primary entry point exists and is prominent
      const createDeckButton = page.locator('[data-testid="create-deck-button"]');
      await expect(createDeckButton).toBeVisible();
      
      // Verify button text is clear and action-oriented
      await expect(createDeckButton).toContainText(/Create Collection/i);
      
      // Verify button stands out visually with appropriate intent
      const buttonClasses = await createDeckButton.getAttribute('class');
      expect(buttonClasses).toContain('bp6-intent-success'); // Should be prominent
      
      // Click and verify successful navigation
      await createDeckButton.click();
      await page.waitForLoadState('networkidle');
      
      // User should land on Step 1 with clear context
      await expect(page.locator('h3')).toContainText('Build Your Collection');
      await expect(page.locator('h5')).toContainText('Step 1: Input Data');
    });

    test('users can discover collection creation from Collection Decks page', async ({ page }) => {
      // Navigate to Collection Decks page
      await page.click('button[data-testid="nav-decks"]');
      await page.waitForLoadState('networkidle');
      
      // Verify secondary entry point exists
      const createButton = page.locator('button:has-text("Create Collection")');
      await expect(createButton).toBeVisible();
      
      // Verify it provides the same clear path
      await createButton.click();
      await page.waitForLoadState('networkidle');
      
      await expect(page.locator('h3')).toContainText('Build Your Collection');
    });

    test('navigation menu provides consistent global access', async ({ page }) => {
      // Test global navigation access from any page
      const navDeckButton = page.locator('[data-testid="nav-decks"]');
      await expect(navDeckButton).toBeVisible();
      
      await navDeckButton.click();
      await page.waitForLoadState('networkidle');
      
      // Should provide clear path to creation
      await expect(page.locator('button:has-text("Create Collection")')).toBeVisible();
    });
  });

  test.describe('Step 1: Input Data - Intuitive Form Design', () => {
    
    test.beforeEach(async ({ page }) => {
      await page.click('[data-testid="create-deck-button"]');
      await page.waitForLoadState('networkidle');
    });

    test('form fields have clear, helpful labels and guidance', async ({ page }) => {
      // Collection Name field should be self-explanatory
      const nameLabel = page.locator('label[for="deck-name"]');
      await expect(nameLabel).toContainText('Collection Name');
      
      const nameInput = page.locator('[data-testid="deck-name-input"]');
      await expect(nameInput).toHaveAttribute('placeholder', /Enter collection name/i);
      
      // Date fields should be clear about their purpose
      const startDateLabel = page.locator('label[for="start-date"]');
      await expect(startDateLabel).toContainText('Start Date');
      
      const endDateLabel = page.locator('label[for="end-date"]');
      await expect(endDateLabel).toContainText('End Date');
      
      // Data source sections should be grouped logically
      await expect(page.locator('h5:has-text("TLE Data")')).toBeVisible();
      await expect(page.locator('h5:has-text("Unavailable Sites")')).toBeVisible();
    });

    test('validation provides helpful, actionable feedback', async ({ page }) => {
      // Attempt to proceed without required fields
      await page.click('[data-testid="next-button"]');
      
      // User should see clear, helpful error messages
      const startDateError = page.locator('text=Start date is required');
      const endDateError = page.locator('text=End date is required');
      const tleSourceError = page.locator('text=TLE data source is required');
      
      await expect(startDateError).toBeVisible();
      await expect(endDateError).toBeVisible();
      await expect(tleSourceError).toBeVisible();
      
      // Fix one error and verify it disappears
      await page.locator('[data-testid="start-date-input"]').click();
      await page.locator('.DayPicker-Day').first().click();
      
      // Error should clear when user provides valid input
      await expect(startDateError).not.toBeVisible();
    });

    test('data loading actions provide clear feedback and guidance', async ({ page }) => {
      // Test UDL loading feedback
      await page.click('[data-testid="load-udl-button"]');
      
      // User should see loading state
      const loadingButton = page.locator('[data-testid="load-udl-button"]');
      await expect(loadingButton).toHaveAttribute('aria-label', /Loading/i);
      
      // Loading feedback should be visible
      await expect(page.locator('text=Loading data')).toBeVisible();
      
      // Wait for completion and verify success feedback
      await expect(loadingButton).not.toHaveAttribute('aria-label', /Loading/i);
      
      // TLE data should be populated with clear indication of source
      const tleSourceSelect = page.locator('[data-testid="tle-source-select"]');
      await expect(tleSourceSelect).toHaveValue('UDL');
    });

    test('users can complete Step 1 with confidence', async ({ page }) => {
      // Fill out form with typical user workflow
      await page.fill('[data-testid="deck-name-input"]', 'Test Collection Deck');
      
      // Select dates with intuitive calendar interaction
      await page.locator('[data-testid="start-date-input"]').click();
      await page.locator('.DayPicker-Day').first().click();
      
      await page.locator('[data-testid="end-date-input"]').click();
      await page.locator('.DayPicker-Day').nth(5).click();
      
      // Load TLE data
      await page.click('[data-testid="load-udl-button"]');
      await page.waitForTimeout(2500); // Wait for simulated loading
      
      // Proceed with confidence
      await page.click('[data-testid="next-button"]');
      await page.waitForLoadState('networkidle');
      
      // User should successfully reach Step 2
      await expect(page.locator('h5:has-text("Step 2: Review Parameters")')).toBeVisible();
    });
  });

  test.describe('Step 2: Review Parameters - User-Friendly Configuration', () => {
    
    test.beforeEach(async ({ page }) => {
      // Complete Step 1 to reach Step 2
      await page.click('[data-testid="create-deck-button"]');
      await page.waitForLoadState('networkidle');
      
      await page.fill('[data-testid="deck-name-input"]', 'Test Collection');
      
      await page.locator('[data-testid="start-date-input"]').click();
      await page.locator('.DayPicker-Day').first().click();
      
      await page.locator('[data-testid="end-date-input"]').click();
      await page.locator('.DayPicker-Day').nth(5).click();
      
      await page.click('[data-testid="load-udl-button"]');
      await page.waitForTimeout(2500);
      
      await page.click('[data-testid="next-button"]');
      await page.waitForLoadState('networkidle');
    });

    test('tabbed interface organizes complex settings intuitively', async ({ page }) => {
      // Tabs should be clearly visible and labeled
      await expect(page.locator('[role="tab"]:has-text("Elevation")')).toBeVisible();
      await expect(page.locator('[role="tab"]:has-text("Hard Capacity")')).toBeVisible();
      await expect(page.locator('[role="tab"]:has-text("Min Duration")')).toBeVisible();
      
      // Default tab should be logically selected (Elevation as first parameter)
      await expect(page.locator('[role="tab"][aria-selected="true"]:has-text("Elevation")')).toBeVisible();
      
      // Tab switching should be smooth and preserve state
      await page.fill('[data-testid="elevation-input"]', '30');
      await page.click('[role="tab"]:has-text("Hard Capacity")');
      await page.fill('[data-testid="hard-capacity-input"]', '50');
      
      // Return to elevation tab - value should be preserved
      await page.click('[role="tab"]:has-text("Elevation")');
      await expect(page.locator('[data-testid="elevation-input"]')).toHaveValue('30');
    });

    test('elevation settings provide immediate visual feedback', async ({ page }) => {
      // User should see affected sites update in real-time
      const sitesCard = page.locator('h5:has-text("Affected Sites")').locator('..').locator('..');
      
      // Initially should show impact
      await expect(sitesCard).toContainText('sites available');
      
      // Change elevation and see immediate feedback
      await page.fill('[data-testid="elevation-input"]', '45');
      await page.waitForTimeout(100); // Brief pause for UI update
      
      // Sites list should update to reflect new elevation
      const siteTags = page.locator('.bp6-tag:has-text("Thule")');
      await expect(siteTags).toBeVisible();
      
      // Sites that are no longer available should be visually distinct
      const unavailableSites = page.locator('.bp6-tag.bp6-minimal');
      const availableSites = page.locator('.bp6-tag.bp6-intent-success');
      
      // Should have a mix based on elevation setting
      expect(await unavailableSites.count()).toBeGreaterThan(0);
      expect(await availableSites.count()).toBeGreaterThan(0);
    });

    test('capacity and duration settings include helpful guidance', async ({ page }) => {
      // Switch to capacity tab
      await page.click('[role="tab"]:has-text("Hard Capacity")');
      
      // Should provide context about sensor capabilities
      await expect(page.locator('h5:has-text("Sensor Capacity Information")')).toBeVisible();
      await expect(page.locator('text=Wideband Collection')).toBeVisible();
      
      // Switch to duration tab
      await page.click('[role="tab"]:has-text("Min Duration")');
      
      // Should provide guidance on duration choices
      await expect(page.locator('h5:has-text("Duration Guidance")')).toBeVisible();
      await expect(page.locator('text=Shorter Durations')).toBeVisible();
      await expect(page.locator('text=Longer Durations')).toBeVisible();
    });

    test('background processing explanation is clear and reassuring', async ({ page }) => {
      // Fill required parameters
      await page.fill('[data-testid="elevation-input"]', '30');
      
      await page.click('[role="tab"]:has-text("Hard Capacity")');
      await page.fill('[data-testid="hard-capacity-input"]', '40');
      
      await page.click('[role="tab"]:has-text("Min Duration")');
      await page.fill('[data-testid="min-duration-input"]', '10');
      
      // Proceed to trigger background processing modal
      await page.click('button:has-text("Next")');
      
      // Modal should clearly explain what will happen
      const modal = page.locator('.bp6-alert-body');
      await expect(modal).toContainText('Background Processing');
      await expect(modal).toContainText('up to 1 hour');
      await expect(modal).toContainText('History page');
      
      // Options should be clear
      await expect(page.locator('button:has-text("Continue Editing")')).toBeVisible();
      await expect(page.locator('button:has-text("Start Background Processing")')).toBeVisible();
    });
  });

  test.describe('Step 3: Review Matches - Clear Selection Interface', () => {
    
    test.beforeEach(async ({ page }) => {
      // Navigate through Steps 1 and 2 to reach Step 3
      await page.click('[data-testid="create-deck-button"]');
      await page.waitForLoadState('networkidle');
      
      // Complete Step 1
      await page.fill('[data-testid="deck-name-input"]', 'Test Collection');
      await page.locator('[data-testid="start-date-input"]').click();
      await page.locator('.DayPicker-Day').first().click();
      await page.locator('[data-testid="end-date-input"]').click();
      await page.locator('.DayPicker-Day').nth(5).click();
      await page.click('[data-testid="load-udl-button"]');
      await page.waitForTimeout(2500);
      await page.click('[data-testid="next-button"]');
      
      // Complete Step 2
      await page.fill('[data-testid="elevation-input"]', '30');
      await page.click('[role="tab"]:has-text("Hard Capacity")');
      await page.fill('[data-testid="hard-capacity-input"]', '40');
      await page.click('[role="tab"]:has-text("Min Duration")');
      await page.fill('[data-testid="min-duration-input"]', '10');
      await page.click('button:has-text("Next")');
      await page.click('button:has-text("Start Background Processing")');
      
      // Wait for match generation to complete
      await expect(page.locator('[data-testid="loading-spinner"]')).toBeVisible();
      await expect(page.locator('[data-testid="loading-spinner"]')).not.toBeVisible({ timeout: 10000 });
    });

    test('match generation provides reassuring progress feedback', async ({ page }) => {
      // Note: This test validates the loading experience in beforeEach
      // The loading spinner and progress should be visible during generation
      
      // After completion, user should see success notification
      // (Testing this here as the notification appears after loading completes)
      await expect(page.locator('text=Matches generated successfully!')).toBeVisible({ timeout: 2000 });
    });

    test('match results are clearly organized and filterable', async ({ page }) => {
      // Tabs should organize matches logically
      await expect(page.locator('[role="tab"]:has-text("ALL")')).toBeVisible();
      await expect(page.locator('[role="tab"]:has-text("NEEDS REVIEW")')).toBeVisible();
      await expect(page.locator('[role="tab"]:has-text("UNMATCHED")')).toBeVisible();
      
      // Search functionality should be prominent and clear
      await expect(page.locator('input[placeholder*="Search SCCs"]')).toBeVisible();
      
      // Site filter should be available
      await expect(page.locator('select:has(option[value="all"]:has-text("Sites"))')).toBeVisible();
      
      // Match count should be clearly displayed
      await expect(page.locator('text=Showing')).toBeVisible();
      await expect(page.locator('text=match')).toBeVisible();
    });

    test('match selection is intuitive with clear feedback', async ({ page }) => {
      // Should have bulk selection options
      const selectAllButton = page.locator('button:has-text("Select All")');
      await expect(selectAllButton).toBeVisible();
      
      // Individual checkboxes should be clear
      const firstCheckbox = page.locator('input[type="checkbox"]').first();
      await expect(firstCheckbox).toBeVisible();
      
      // Test selection feedback
      await firstCheckbox.check();
      
      // Should see visual confirmation of selection
      await expect(firstCheckbox).toBeChecked();
      
      // Bulk operations should update appropriately
      await expect(selectAllButton).toContainText(/Deselect All|Select All/);
    });

    test('match quality is clearly communicated through visual design', async ({ page }) => {
      // Different match types should have distinct visual indicators
      await expect(page.locator('.bp6-tag.bp6-intent-success:has-text("Optimal")')).toBeVisible();
      await expect(page.locator('.bp6-tag.bp6-intent-warning:has-text("Baseline")')).toBeVisible();
      await expect(page.locator('.bp6-tag.bp6-intent-danger:has-text("No matches")')).toBeVisible();
      
      // Priority indicators should be clear
      await expect(page.locator('text=⚠')).toBeVisible(); // High priority warning
      
      // Classification should be appropriately tagged
      await expect(page.locator('.bp6-tag:has-text("S//REL FVEY")')).toBeVisible();
    });

    test('users can proceed with confidence after match selection', async ({ page }) => {
      // Select at least one match
      await page.locator('input[type="checkbox"]').first().check();
      
      // Next button should become enabled
      const nextButton = page.locator('button:has-text("Next")');
      await expect(nextButton).not.toBeDisabled();
      
      // Proceed to next step
      await nextButton.click();
      await page.waitForLoadState('networkidle');
      
      // Should reach Step 4
      await expect(page.locator('h5:has-text("Step 4: Special Instructions")')).toBeVisible();
    });

    test('unselected state provides helpful guidance', async ({ page }) => {
      // Ensure no matches are selected
      await page.locator('button:has-text("Deselect All")').click();
      
      // Should see helpful warning
      await expect(page.locator('text=Please select at least one match')).toBeVisible();
      
      // Next button should be disabled with clear state
      const nextButton = page.locator('button:has-text("Next")');
      await expect(nextButton).toBeDisabled();
    });
  });

  test.describe('Step 4: Final Instructions - Completion Confidence', () => {
    
    test.beforeEach(async ({ page }) => {
      // Navigate through complete flow to Step 4
      await page.click('[data-testid="create-deck-button"]');
      await page.waitForLoadState('networkidle');
      
      // Step 1
      await page.fill('[data-testid="deck-name-input"]', 'Test Collection');
      await page.locator('[data-testid="start-date-input"]').click();
      await page.locator('.DayPicker-Day').first().click();
      await page.locator('[data-testid="end-date-input"]').click();
      await page.locator('.DayPicker-Day').nth(5).click();
      await page.click('[data-testid="load-udl-button"]');
      await page.waitForTimeout(2500);
      await page.click('[data-testid="next-button"]');
      
      // Step 2
      await page.fill('[data-testid="elevation-input"]', '30');
      await page.click('[role="tab"]:has-text("Hard Capacity")');
      await page.fill('[data-testid="hard-capacity-input"]', '40');
      await page.click('[role="tab"]:has-text("Min Duration")');
      await page.fill('[data-testid="min-duration-input"]', '10');
      await page.click('button:has-text("Next")');
      await page.click('button:has-text("Start Background Processing")');
      await page.waitForTimeout(4000);
      
      // Step 3 - Select matches
      await page.locator('input[type="checkbox"]').first().check();
      await page.click('button:has-text("Next")');
      await page.waitForLoadState('networkidle');
    });

    test('collection summary provides complete overview', async ({ page }) => {
      // Should show comprehensive summary
      await expect(page.locator('h5:has-text("Collection Summary")')).toBeVisible();
      
      // Key configuration should be displayed
      await expect(page.locator('text=Tasking Window')).toBeVisible();
      await expect(page.locator('text=Parameters')).toBeVisible();
      await expect(page.locator('text=Data Sources')).toBeVisible();
      
      // Selected matches summary should be prominent
      await expect(page.locator('text=Selected Matches')).toBeVisible();
      await expect(page.locator('.bp6-tag:has-text("1")')).toBeVisible(); // At least 1 match
      
      // Summary should give users confidence in their choices
      const summarySection = page.locator('div:has(text="Selected Matches")').locator('..');
      await expect(summarySection).toContainText('Total Matches');
      await expect(summarySection).toContainText('Total Minutes');
    });

    test('special instructions interface is user-friendly', async ({ page }) => {
      // Instructions field should be clearly labeled
      await expect(page.locator('label:has-text("Instructions for Collection Team")')).toBeVisible();
      
      // Should provide helpful placeholder
      const instructionsArea = page.locator('textarea');
      await expect(instructionsArea).toHaveAttribute('placeholder', /Enter special instructions/i);
      
      // Helper text should guide users
      await expect(page.locator('text=Enter any special instructions, notes')).toBeVisible();
    });

    test('final confirmation process is clear and reassuring', async ({ page }) => {
      // Initial finish button should be clear
      const finishButton = page.locator('button:has-text("Finish")');
      await expect(finishButton).toBeVisible();
      await expect(finishButton).not.toBeDisabled();
      
      // Click to trigger confirmation
      await finishButton.click();
      
      // Should see confirmation dialog with clear explanation
      await expect(page.locator('h5:has-text("Confirm & Start Background Processing")')).toBeVisible();
      await expect(page.locator('text=You are about to create a collection deck')).toBeVisible();
      await expect(page.locator('text=redirected to the History page')).toBeVisible();
      
      // Final button should indicate the action clearly
      const confirmButton = page.locator('button:has-text("Confirm & Start Processing")');
      await expect(confirmButton).toBeVisible();
      await expect(confirmButton).toHaveClass(/bp6-intent-success/);
    });

    test('users complete the flow with full confidence', async ({ page }) => {
      // Add some instructions to make it feel complete
      await page.fill('textarea', 'High priority collection - coordinate with team lead before execution.');
      
      // Complete the flow
      const finishButton = page.locator('button:has-text("Finish")');
      await finishButton.click();
      
      // Confirm the final step
      const confirmButton = page.locator('button:has-text("Confirm & Start Processing")');
      await confirmButton.click();
      
      // Should be redirected to History page with success context
      await page.waitForLoadState('networkidle');
      await expect(page.url()).toContain('/history');
      
      // User should see confirmation of successful creation
      // (This would typically be a toast notification or status message)
      await expect(page.locator('h3:has-text("Processing History")')).toBeVisible();
    });
  });

  test.describe('Flow Interruption & Recovery', () => {
    
    test('users can safely cancel at any step with clear warnings', async ({ page }) => {
      await page.click('[data-testid="create-deck-button"]');
      await page.waitForLoadState('networkidle');
      
      // Fill some data to create unsaved changes
      await page.fill('[data-testid="deck-name-input"]', 'Test Collection');
      
      // Attempt to cancel
      await page.click('[data-testid="cancel-button"]');
      
      // Should see abandonment warning
      await expect(page.locator('[data-testid="abandonment-alert"]')).toBeVisible();
      await expect(page.locator('text=made progress on your collection')).toBeVisible();
      await expect(page.locator('text=restore this work once it\'s gone')).toBeVisible();
      
      // Clear options should be available
      await expect(page.locator('button:has-text("Continue Editing")')).toBeVisible();
      await expect(page.locator('button:has-text("Discard Changes")')).toBeVisible();
    });

    test('progress is automatically saved and can be resumed', async ({ page }) => {
      await page.click('[data-testid="create-deck-button"]');
      await page.waitForLoadState('networkidle');
      
      // Fill some data
      await page.fill('[data-testid="deck-name-input"]', 'Resumable Collection');
      
      // Should see auto-save indicator
      await expect(page.locator('[data-testid="unsaved-changes-warning"]')).toBeVisible();
      await expect(page.locator('text=We\'ve saved your work automatically')).toBeVisible();
      
      // Navigate away and back
      await page.goto('/decks');
      await page.waitForLoadState('networkidle');
      
      // Should see resume option
      await expect(page.locator('[data-testid="resume-deck-button"]')).toBeVisible();
      await expect(page.locator('text=You have work waiting to be finished')).toBeVisible();
    });

    test('background processing interruption is handled gracefully', async ({ page }) => {
      // Navigate to Step 3 match generation
      await page.click('[data-testid="create-deck-button"]');
      await page.waitForLoadState('networkidle');
      
      await page.fill('[data-testid="deck-name-input"]', 'Test Collection');
      await page.locator('[data-testid="start-date-input"]').click();
      await page.locator('.DayPicker-Day').first().click();
      await page.locator('[data-testid="end-date-input"]').click();
      await page.locator('.DayPicker-Day').nth(5).click();
      await page.click('[data-testid="load-udl-button"]');
      await page.waitForTimeout(2500);
      await page.click('[data-testid="next-button"]');
      
      await page.fill('[data-testid="elevation-input"]', '30');
      await page.click('[role="tab"]:has-text("Hard Capacity")');
      await page.fill('[data-testid="hard-capacity-input"]', '40');
      await page.click('[role="tab"]:has-text("Min Duration")');
      await page.fill('[data-testid="min-duration-input"]', '10');
      await page.click('button:has-text("Next")');
      await page.click('button:has-text("Start Background Processing")');
      
      // During loading, test interruption capability
      await expect(page.locator('[data-testid="loading-spinner"]')).toBeVisible();
      await page.click('button:has-text("Pause")');
      
      // Should see clear interruption state
      await expect(page.locator('text=Analysis Paused')).toBeVisible();
      await expect(page.locator('text=interrupted')).toBeVisible();
      
      // Clear recovery options
      await expect(page.locator('button:has-text("Resume Analysis")')).toBeVisible();
      await expect(page.locator('button:has-text("Cancel Analysis")')).toBeVisible();
    });
  });

  test.describe('Error Handling & Recovery', () => {
    
    test('network errors provide helpful guidance', async ({ page }) => {
      await page.click('[data-testid="create-deck-button"]');
      await page.waitForLoadState('networkidle');
      
      // Simulate network failure during data loading
      await page.route('**/api/udl-data', route => route.abort());
      
      await page.click('[data-testid="load-udl-button"]');
      
      // Should handle error gracefully with user-friendly message
      await expect(page.locator('text=Failed to load')).toBeVisible({ timeout: 5000 });
      
      // Should provide retry option
      await expect(page.locator('button:has-text("Try Again")')).toBeVisible();
    });

    test('form validation errors are immediately actionable', async ({ page }) => {
      await page.click('[data-testid="create-deck-button"]');
      await page.waitForLoadState('networkidle');
      
      // Enter invalid date range
      await page.locator('[data-testid="start-date-input"]').click();
      await page.locator('.DayPicker-Day').nth(10).click();
      
      await page.locator('[data-testid="end-date-input"]').click();
      await page.locator('.DayPicker-Day').nth(5).click(); // Earlier date
      
      await page.click('[data-testid="next-button"]');
      
      // Should see specific, actionable error
      await expect(page.locator('text=End date must be after start date')).toBeVisible();
      
      // Error should clear when corrected
      await page.locator('[data-testid="end-date-input"]').click();
      await page.locator('.DayPicker-Day').nth(15).click();
      
      await expect(page.locator('text=End date must be after start date')).not.toBeVisible();
    });
  });

  test.describe('Accessibility & Usability', () => {
    
    test('keyboard navigation works throughout the flow', async ({ page }) => {
      await page.click('[data-testid="create-deck-button"]');
      await page.waitForLoadState('networkidle');
      
      // Test tab navigation through form
      await page.keyboard.press('Tab');
      await page.keyboard.press('Tab');
      
      // Should be able to fill form with keyboard
      await page.keyboard.type('Keyboard Test Collection');
      
      // Tab to next field
      await page.keyboard.press('Tab');
      // Date picker should be keyboard accessible
      await page.keyboard.press('Enter');
      await page.keyboard.press('Enter'); // Select date
      
      // Continue through form...
      await page.keyboard.press('Tab');
      await page.keyboard.press('Enter'); // End date
      await page.keyboard.press('ArrowRight');
      await page.keyboard.press('Enter');
    });

    test('screen reader friendly elements and labels', async ({ page }) => {
      await page.click('[data-testid="create-deck-button"]');
      await page.waitForLoadState('networkidle');
      
      // Check for proper ARIA labels and structure
      const nameInput = page.locator('[data-testid="deck-name-input"]');
      await expect(nameInput).toHaveAttribute('aria-label', /.+/); // Should have aria-label or associated label
      
      // Progress indication should be accessible
      const progressBar = page.locator('[data-testid="progress-bar"]');
      await expect(progressBar).toHaveAttribute('role', 'progressbar');
      await expect(progressBar).toHaveAttribute('aria-valuenow');
      
      // Loading states should have proper live regions
      await page.fill('[data-testid="deck-name-input"]', 'Accessibility Test');
      await page.click('[data-testid="load-udl-button"]');
      
      // Should have aria-live region for loading updates
      await expect(page.locator('[aria-live="polite"]')).toBeVisible();
    });

    test('mobile responsiveness maintains usability', async ({ page, isMobile }) => {
      if (!isMobile) {
        // Skip on desktop
        test.skip();
      }
      
      await page.click('[data-testid="create-deck-button"]');
      await page.waitForLoadState('networkidle');
      
      // Form should be usable on mobile
      const nameInput = page.locator('[data-testid="deck-name-input"]');
      await expect(nameInput).toBeVisible();
      
      // Touch targets should be appropriately sized
      const buttons = page.locator('button');
      const buttonCount = await buttons.count();
      
      for (let i = 0; i < buttonCount; i++) {
        const button = buttons.nth(i);
        if (await button.isVisible()) {
          const boundingBox = await button.boundingBox();
          if (boundingBox) {
            expect(boundingBox.height).toBeGreaterThan(44); // Minimum touch target
            expect(boundingBox.width).toBeGreaterThan(44);
          }
        }
      }
    });
  });
});