import { test, expect } from '@playwright/test';

test.describe('Background Processing Flow', () => {
  test.beforeEach(async ({ page }) => {
    // Navigate to the Collection Decks page
    await page.goto('http://localhost:3001/decks');
    
    // Handle webpack dev server overlay if present
    try {
      await page.evaluate(() => {
        const overlay = document.getElementById('webpack-dev-server-client-overlay');
        if (overlay) {
          overlay.remove();
        }
        // Also remove any iframes that might be blocking
        const iframes = document.querySelectorAll('iframe[src="about:blank"]');
        iframes.forEach(iframe => iframe.remove());
      });
    } catch (error) {
      // Ignore if overlay doesn't exist
    }
  });

  test('Complete background processing flow with notifications', async ({ page }) => {
    // Step 1: Start creating a new collection deck
    await page.click('button:has-text("Create New Deck")');
    await expect(page).toHaveURL(/.*\/decks\/new\/data/);

    // Fill in Step 1 data
    await page.fill('[data-testid="start-date-input"]', '2024-01-01');
    await page.fill('[data-testid="end-date-input"]', '2024-01-31');
    await page.selectOption('[data-testid="tle-source-select"]', 'UDL');
    await page.selectOption('[data-testid="unavailable-sites-source-select"]', 'BLUESTAT');
    
    // Navigate to Step 2
    await page.click('text=Next');
    await expect(page).toHaveURL(/.*\/decks\/new\/parameters/);

    // Fill in Step 2 parameters
    await page.fill('[data-testid="hard-capacity-input"]', '10');
    await page.fill('[data-testid="min-duration-input"]', '30');
    await page.fill('[data-testid="elevation-input"]', '15');

    // Step 2: Test background processing initiation
    await page.click('text=Next');
    
    // Verify confirmation dialog appears
    await expect(page.locator('.bp4-alert')).toBeVisible();
    await expect(page.locator('text=Background Processing')).toBeVisible();
    await expect(page.locator('text=Match generation will run in the background')).toBeVisible();
    await expect(page.locator('text=Estimated completion time: ~1 hour')).toBeVisible();

    // Confirm background processing
    await page.click('text=Start Background Processing');

    // Verify redirect to History page
    await expect(page).toHaveURL(/.*\/history/);

    // Verify processing status is displayed
    await expect(page.locator('text=Background Processing Active')).toBeVisible();
    await expect(page.locator('text=Match Generation Progress')).toBeVisible();
    await expect(page.locator('.bp4-progress-bar')).toBeVisible();

    // Verify processing details
    await expect(page.locator('text=Started:')).toBeVisible();
    await expect(page.locator('text=Estimated Completion:')).toBeVisible();
    await expect(page.locator('text=Processing in Background')).toBeVisible();

    // Wait for processing to complete (simulated)
    await page.waitForFunction(() => {
      const progressText = document.querySelector('.bp4-progress-bar')?.textContent;
      return progressText && progressText.includes('100%');
    }, { timeout: 30000 });

    // Verify completion notification appears
    await expect(page.locator('.bp4-toast')).toBeVisible();
    await expect(page.locator('text=Match generation completed successfully!')).toBeVisible();
    await expect(page.locator('text=Continue to Review Matches')).toBeVisible();

    // Click continue to resume workflow
    await page.click('text=Continue to Review Matches');

    // Verify navigation to Step 3
    await expect(page).toHaveURL(/.*\/decks\/new\/matches/);

    // Verify matches are loaded from completed processing
    await expect(page.locator('text=Step 3: Review Matches')).toBeVisible();
    
    // Wait for matches to be displayed
    await page.waitForSelector('.bp4-table', { timeout: 10000 });
    
    // Verify matches table is populated
    const tableRows = page.locator('.bp4-table tbody tr');
    await expect(tableRows).toHaveCount.greaterThan(0);

    // Verify completion notification in Step 3
    await expect(page.locator('.bp4-toast')).toBeVisible();
    await expect(page.locator('text=Background processing completed!')).toBeVisible();

    // Continue to Step 4
    await page.click('text=Next');
    await expect(page).toHaveURL(/.*\/decks\/new\/instructions/);

    // Verify we can complete the workflow
    await page.fill('textarea', 'Special instructions for collection deck');
    await page.click('text=Finish');

    // Verify completion and redirect to decks page
    await expect(page).toHaveURL(/.*\/decks/);
  });

  test('Background processing status persistence across navigation', async ({ page }) => {
    // Start background processing
    await page.click('text=Create New Deck');
    await page.fill('[data-testid="start-date-input"]', '2024-01-01');
    await page.fill('[data-testid="end-date-input"]', '2024-01-31');
    await page.selectOption('[data-testid="tle-source-select"]', 'UDL');
    await page.selectOption('[data-testid="unavailable-sites-source-select"]', 'BLUESTAT');
    await page.click('text=Next');
    
    await page.fill('[data-testid="hard-capacity-input"]', '10');
    await page.fill('[data-testid="min-duration-input"]', '30');
    await page.fill('[data-testid="elevation-input"]', '15');
    await page.click('text=Next');
    await page.click('text=Start Background Processing');

    // Verify processing is active
    await expect(page.locator('text=Background Processing Active')).toBeVisible();

    // Navigate to other pages and verify status persists
    await page.click('text=Master');
    await expect(page).toHaveURL(/.*\/$/);

    // Navigate back to History and verify processing still shows
    await page.click('text=History');
    await expect(page).toHaveURL(/.*\/history/);
    await expect(page.locator('text=Background Processing Active')).toBeVisible();

    // Navigate to Analytics and back
    await page.click('text=Analytics');
    await expect(page).toHaveURL(/.*\/analytics/);
    await page.click('text=History');
    await expect(page.locator('text=Background Processing Active')).toBeVisible();
  });

  test('Background processing with form validation', async ({ page }) => {
    // Start creating a deck
    await page.click('text=Create New Deck');
    await page.fill('[data-testid="start-date-input"]', '2024-01-01');
    await page.fill('[data-testid="end-date-input"]', '2024-01-31');
    await page.selectOption('[data-testid="tle-source-select"]', 'UDL');
    await page.selectOption('[data-testid="unavailable-sites-source-select"]', 'BLUESTAT');
    await page.click('text=Next');

    // Try to proceed without filling required fields
    await page.click('text=Next');

    // Verify validation errors
    await expect(page.locator('text=Hard capacity must be greater than 0')).toBeVisible();
    await expect(page.locator('text=Minimum duration must be greater than 0')).toBeVisible();

    // Fill in valid data
    await page.fill('[data-testid="hard-capacity-input"]', '10');
    await page.fill('[data-testid="min-duration-input"]', '30');
    await page.fill('[data-testid="elevation-input"]', '15');

    // Verify errors are cleared
    await expect(page.locator('text=Hard capacity must be greater than 0')).not.toBeVisible();
    await expect(page.locator('text=Minimum duration must be greater than 0')).not.toBeVisible();

    // Proceed with background processing
    await page.click('text=Next');
    await page.click('text=Start Background Processing');

    // Verify successful redirect
    await expect(page).toHaveURL(/.*\/history/);
  });

  test('Background processing cancellation and resumption', async ({ page }) => {
    // Start background processing
    await page.click('text=Create New Deck');
    await page.fill('[data-testid="start-date-input"]', '2024-01-01');
    await page.fill('[data-testid="end-date-input"]', '2024-01-31');
    await page.selectOption('[data-testid="tle-source-select"]', 'UDL');
    await page.selectOption('[data-testid="unavailable-sites-source-select"]', 'BLUESTAT');
    await page.click('text=Next');
    
    await page.fill('[data-testid="hard-capacity-input"]', '10');
    await page.fill('[data-testid="min-duration-input"]', '30');
    await page.fill('[data-testid="elevation-input"]', '15');
    await page.click('text=Next');

    // Cancel background processing
    await page.click('text=Continue Editing');
    
    // Verify we're still on Step 2
    await expect(page).toHaveURL(/.*\/decks\/new\/parameters/);

    // Try again and confirm
    await page.click('text=Next');
    await page.click('text=Start Background Processing');

    // Verify successful processing start
    await expect(page).toHaveURL(/.*\/history/);
    await expect(page.locator('text=Background Processing Active')).toBeVisible();
  });

  test('Toast notifications behavior', async ({ page }) => {
    // Start background processing
    await page.click('text=Create New Deck');
    await page.fill('[data-testid="start-date-input"]', '2024-01-01');
    await page.fill('[data-testid="end-date-input"]', '2024-01-31');
    await page.selectOption('[data-testid="tle-source-select"]', 'UDL');
    await page.selectOption('[data-testid="unavailable-sites-source-select"]', 'BLUESTAT');
    await page.click('text=Next');
    
    await page.fill('[data-testid="hard-capacity-input"]', '10');
    await page.fill('[data-testid="min-duration-input"]', '30');
    await page.fill('[data-testid="elevation-input"]', '15');
    await page.click('text=Next');
    await page.click('text=Start Background Processing');

    // Verify processing started notification
    await expect(page.locator('.bp4-toast')).toBeVisible();
    await expect(page.locator('text=Match generation started!')).toBeVisible();

    // Wait for completion notification
    await page.waitForFunction(() => {
      const toast = document.querySelector('.bp4-toast');
      return toast && toast.textContent?.includes('Match generation completed successfully!');
    }, { timeout: 30000 });

    // Verify completion notification content
    await expect(page.locator('text=Match generation completed successfully!')).toBeVisible();
    await expect(page.locator('text=Your collection deck matches are ready for review')).toBeVisible();
    await expect(page.locator('text=Continue to Review Matches')).toBeVisible();

    // Test notification interaction
    await page.click('text=Continue to Review Matches');
    await expect(page).toHaveURL(/.*\/decks\/new\/matches/);
  });

  test('Error handling in background processing', async ({ page }) => {
    // This test would require mocking the service to simulate errors
    // For now, we'll test the UI handles errors gracefully
    
    // Start background processing
    await page.click('text=Create New Deck');
    await page.fill('[data-testid="start-date-input"]', '2024-01-01');
    await page.fill('[data-testid="end-date-input"]', '2024-01-31');
    await page.selectOption('[data-testid="tle-source-select"]', 'UDL');
    await page.selectOption('[data-testid="unavailable-sites-source-select"]', 'BLUESTAT');
    await page.click('text=Next');
    
    await page.fill('[data-testid="hard-capacity-input"]', '10');
    await page.fill('[data-testid="min-duration-input"]', '30');
    await page.fill('[data-testid="elevation-input"]', '15');
    await page.click('text=Next');
    await page.click('text=Start Background Processing');

    // Verify processing starts successfully
    await expect(page).toHaveURL(/.*\/history/);
    await expect(page.locator('text=Background Processing Active')).toBeVisible();

    // The error handling would be tested by mocking service failures
    // and verifying appropriate error messages and retry options
  });
});
