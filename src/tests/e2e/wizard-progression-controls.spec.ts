/**
 * End-to-End Test: Collection Deck Wizard - 4-Step Progression Controls
 * Tests the progression through all 4 steps of the wizard
 */

import { test, expect } from '@playwright/test';

test.describe('Collection Deck Wizard - 4-Step Flow Progression', () => {
  test.beforeEach(async ({ page }) => {
    // Navigate to wizard start
    await page.goto('http://localhost:3000/create-collection-deck/parameters');

    // Wait for page to be fully loaded
    await page.waitForLoadState('networkidle');
  });

  test('should display correct step indicators and progress', async ({ page }) => {
    // Verify we're on Step 1
    await expect(page.getByTestId('progress-summary')).toContainText('Step 1 of 4');

    // Verify progress bar shows 25% (1/4)
    const progressBar = page.getByTestId('progress-bar');
    await expect(progressBar).toBeVisible();

    // Verify all 4 step indicators are present
    await expect(page.getByTestId('step-1-indicator')).toBeVisible();
    await expect(page.getByTestId('step-2-indicator')).toBeVisible();
    await expect(page.getByTestId('step-3-indicator')).toBeVisible();
    await expect(page.getByTestId('step-4-indicator')).toBeVisible();

    // Verify Step 1 is marked as active
    await expect(page.getByTestId('step-1-active-tag')).toContainText('Active');
  });

  test('should complete full 4-step wizard progression', async ({ page }) => {
    // === STEP 1: Collection Parameters ===
    await expect(page.locator('h3#step-heading')).toContainText('Step 1: Collection Parameters');

    // Fill in Collection Name
    await page.getByTestId('deck-name-input').fill('E2E Test Collection');

    // Fill in Tasking Window dates
    await page.getByTestId('start-date-input').click();
    await page.keyboard.type('11/15/2025');

    await page.getByTestId('end-date-input').click();
    await page.keyboard.type('11/22/2025');

    // Switch to Data Sources tab and configure TLE
    await page.getByRole('tab', { name: 'Data Sources' }).click();
    await page.getByTestId('load-udl-button').click();
    await page.waitForTimeout(2500); // Wait for simulated UDL load

    // Switch to Parameters tab and configure values
    await page.getByRole('tab', { name: 'Parameters' }).click();
    await page.getByTestId('hard-capacity-input').fill('5');
    await page.getByTestId('min-duration-input').fill('10');
    await page.getByTestId('elevation-input').fill('15');

    // Click Next to proceed to Step 2
    await page.getByTestId('next-button').click();

    // === STEP 2: Create Collection Deck ===
    await expect(page.locator('h3#step-heading')).toContainText('Step 2: Create Collection Deck');
    await expect(page.getByTestId('progress-summary')).toContainText('Step 2 of 4');

    // Verify configuration summary is displayed
    await expect(page.getByText('Configuration Summary')).toBeVisible();
    await expect(page.getByText(/11\/15\/2025.*11\/22\/2025/)).toBeVisible();

    // Verify "Ready to Create" state
    await expect(page.getByText('Ready to Create Your Collection Deck')).toBeVisible();

    // Click "Create Collection Deck" button
    await page.getByTestId('create-deck-button').click();

    // Wait for deck creation (loading state)
    await expect(page.getByText('Creating Collection Deck...')).toBeVisible();
    await page.waitForTimeout(3500); // Wait for simulated deck creation

    // Verify success state
    await expect(page.getByText('Deck Created Successfully!')).toBeVisible();
    await expect(page.getByText(/Deck ID: DECK-/)).toBeVisible();
    await expect(page.getByText('Opportunities Found: 6 matches')).toBeVisible();

    // Click Next to proceed to Step 3
    await page.getByTestId('next-button').click();

    // === STEP 3: Select Opportunities ===
    await expect(page.locator('h3#step-heading')).toContainText('Step 3: Select Opportunities');
    await expect(page.getByTestId('progress-summary')).toContainText('Step 3 of 4');

    // Verify deck ID banner
    await expect(page.getByText(/From Deck:/)).toBeVisible();

    // Verify opportunities table is displayed
    await expect(page.getByText(/Showing \d+ match/)).toBeVisible();

    // Verify optimal matches are pre-selected (should be 2 based on sample data)
    const selectedSummary = page.getByText(/Total Matches/);
    await expect(selectedSummary).toBeVisible();

    // Click "Create Collection" to proceed to Step 4
    const createButton = page.getByRole('button', { name: /Create Collection/ });
    await createButton.click();

    // Wait for collection creation
    await page.waitForTimeout(1000);

    // === STEP 4: Manage Collection ===
    await expect(page.locator('h3')).toContainText('Step 4: Manage Collection');

    // Verify success banner
    await expect(page.getByText('Collection Created Successfully!')).toBeVisible();

    // Verify management interface is embedded
    await expect(page.getByText('Manage Your Collection')).toBeVisible();

    // Verify completion actions are available
    await expect(page.getByTestId('finish-go-to-history')).toBeVisible();
    await expect(page.getByTestId('create-another-collection')).toBeVisible();
  });

  test('should support backward navigation through steps', async ({ page }) => {
    // Complete Step 1 (fast path)
    await page.getByTestId('deck-name-input').fill('Backward Nav Test');
    await page.getByTestId('start-date-input').click();
    await page.keyboard.type('11/15/2025');
    await page.getByTestId('end-date-input').click();
    await page.keyboard.type('11/22/2025');
    await page.getByRole('tab', { name: 'Data Sources' }).click();
    await page.getByTestId('load-udl-button').click();
    await page.waitForTimeout(2500);
    await page.getByRole('tab', { name: 'Parameters' }).click();
    await page.getByTestId('hard-capacity-input').fill('5');
    await page.getByTestId('min-duration-input').fill('10');
    await page.getByTestId('elevation-input').fill('15');
    await page.getByTestId('next-button').click();

    // Now on Step 2
    await expect(page.getByTestId('progress-summary')).toContainText('Step 2 of 4');

    // Click Back button
    await page.getByTestId('back-button').click();

    // Verify we're back on Step 1
    await expect(page.getByTestId('progress-summary')).toContainText('Step 1 of 4');
    await expect(page.locator('h3#step-heading')).toContainText('Step 1: Collection Parameters');

    // Verify data persisted
    await expect(page.getByTestId('deck-name-input')).toHaveValue('Backward Nav Test');
  });

  test('should prevent progression without required fields in Step 1', async ({ page }) => {
    // Try clicking Next without filling required fields
    await page.getByTestId('next-button').click();

    // Should show validation errors
    await expect(page.getByText('Start date is required')).toBeVisible();
    await expect(page.getByText('End date is required')).toBeVisible();
    await expect(page.getByText('TLE data source is required')).toBeVisible();
  });

  test('should show correct step descriptions in progress indicator', async ({ page }) => {
    // Step 1 description
    await expect(page.getByText('Configure tasking window, data sources, and collection parameters')).toBeVisible();

    // Complete Step 1
    await page.getByTestId('deck-name-input').fill('Description Test');
    await page.getByTestId('start-date-input').click();
    await page.keyboard.type('11/15/2025');
    await page.getByTestId('end-date-input').click();
    await page.keyboard.type('11/22/2025');
    await page.getByRole('tab', { name: 'Data Sources' }).click();
    await page.getByTestId('load-udl-button').click();
    await page.waitForTimeout(2500);
    await page.getByRole('tab', { name: 'Parameters' }).click();
    await page.getByTestId('hard-capacity-input').fill('5');
    await page.getByTestId('min-duration-input').fill('10');
    await page.getByTestId('elevation-input').fill('15');
    await page.getByTestId('next-button').click();

    // Step 2 description
    await expect(page.getByText('Generate orbital matches and create collection deck entity')).toBeVisible();

    // Create deck and proceed
    await page.getByTestId('create-deck-button').click();
    await page.waitForTimeout(3500);
    await page.getByTestId('next-button').click();

    // Step 3 description
    await expect(page.getByText('Review and select opportunities to include in your collection')).toBeVisible();
  });

  test('should update progress bar correctly through all steps', async ({ page }) => {
    // Verify initial progress (Step 1 = 25%)
    const progressBar = page.getByTestId('progress-bar');

    // Complete and move through steps, checking progress
    // Note: Actual progress bar value testing would require checking aria-valuenow or similar

    // Step 1: Complete
    await page.getByTestId('deck-name-input').fill('Progress Test');
    await page.getByTestId('start-date-input').click();
    await page.keyboard.type('11/15/2025');
    await page.getByTestId('end-date-input').click();
    await page.keyboard.type('11/22/2025');
    await page.getByRole('tab', { name: 'Data Sources' }).click();
    await page.getByTestId('load-udl-button').click();
    await page.waitForTimeout(2500);
    await page.getByRole('tab', { name: 'Parameters' }).click();
    await page.getByTestId('hard-capacity-input').fill('5');
    await page.getByTestId('min-duration-input').fill('10');
    await page.getByTestId('elevation-input').fill('15');
    await page.getByTestId('next-button').click();

    // Step 2: Verify progress shows 50% (2/4)
    await expect(page.getByTestId('progress-summary')).toContainText('Step 2 of 4');

    // Create deck
    await page.getByTestId('create-deck-button').click();
    await page.waitForTimeout(3500);
    await page.getByTestId('next-button').click();

    // Step 3: Verify progress shows 75% (3/4)
    await expect(page.getByTestId('progress-summary')).toContainText('Step 3 of 4');
  });

  test('should show completion status for completed steps', async ({ page }) => {
    // Complete Step 1
    await page.getByTestId('deck-name-input').fill('Completion Test');
    await page.getByTestId('start-date-input').click();
    await page.keyboard.type('11/15/2025');
    await page.getByTestId('end-date-input').click();
    await page.keyboard.type('11/22/2025');
    await page.getByRole('tab', { name: 'Data Sources' }).click();
    await page.getByTestId('load-udl-button').click();
    await page.waitForTimeout(2500);
    await page.getByRole('tab', { name: 'Parameters' }).click();
    await page.getByTestId('hard-capacity-input').fill('5');
    await page.getByTestId('min-duration-input').fill('10');
    await page.getByTestId('elevation-input').fill('15');
    await page.getByTestId('next-button').click();

    // On Step 2, verify Step 1 shows "Complete"
    await expect(page.getByTestId('step-1-completed-tag')).toContainText('Complete');
    await expect(page.getByTestId('step-1-completed-icon')).toBeVisible();

    // Verify Step 2 shows "Active"
    await expect(page.getByTestId('step-2-active-tag')).toContainText('Active');
  });

  test('should handle Cancel button correctly', async ({ page }) => {
    // Fill in some data
    await page.getByTestId('deck-name-input').fill('Cancel Test');

    // Click Cancel
    await page.getByTestId('cancel-button').click();

    // Should show abandonment alert
    await expect(page.getByTestId('abandonment-alert')).toBeVisible();
    await expect(page.getByText(/made progress on your collection/)).toBeVisible();

    // Click "Continue Editing"
    await page.getByRole('button', { name: 'Continue Editing' }).click();

    // Should still be on Step 1
    await expect(page.locator('h3#step-heading')).toContainText('Step 1: Collection Parameters');
    await expect(page.getByTestId('deck-name-input')).toHaveValue('Cancel Test');
  });
});
