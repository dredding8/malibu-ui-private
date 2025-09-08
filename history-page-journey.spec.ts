import { test, expect } from '@playwright/test';

// Jobs-to-be-Done Framework for Testing:
// Job 1: "When I create a collection deck, I want to feel confident that my request was received and is being processed"
// Job 2: "When I'm waiting for my collection deck to be built, I want to see real-time progress so I know it's working and can estimate when it will be ready"
// Job 3: "When my collection deck is ready, I want to be notified immediately so I can review the results"

test.describe('Collection Deck Creation Journey', () => {

  test('should create a collection deck and provide real-time progress feedback', async ({ page }) => {
    // Step 1: Set up the state to simulate a user who has completed the collection deck setup.
    // This simulates a user who has gone through the multi-step process and is ready to create their deck.
    await page.addInitScript(() => {
      const mockDeckData = {
        taskingWindow: { startDate: '2024-01-01', endDate: '2024-01-31' },
        parameters: { hardCapacity: 100, minDuration: 10, elevation: 15 },
        tleData: { source: 'Test TLE' },
        unavailableSites: { sites: ['Site A'] },
        matches: [{ id: '1', duration: 120, sccNumber: '12345', site: 'Site B' }], // User has selected matches
      };
      localStorage.setItem('vue-deck-draft', JSON.stringify(mockDeckData));
    });

    // Step 2: Navigate to the final step where the user can review and submit their collection deck.
    await page.goto('/create-collection-deck/instructions');

    // Job 1: User wants to feel confident their request was received
    // The "Finish" button should be clearly visible and enabled, showing the user can proceed.
    const finishButton = page.getByRole('button', { name: 'Finish' });
    await expect(finishButton).toBeEnabled();

    // Step 3: User submits their collection deck with confirmation.
    // The user expects a clear confirmation step to prevent accidental submission.
    await finishButton.click();
    const confirmButton = page.getByRole('button', { name: 'Confirm & Start Processing' });
    await expect(confirmButton).toBeVisible();
    await confirmButton.click();

    // Step 4: User is taken to the History page to monitor their collection deck creation.
    // This fulfills Job 1 - immediate confirmation that their request was received.
    await page.waitForURL('**/history');
    await expect(page).toHaveURL('/history');
    await expect(page.getByRole('heading', { name: 'Job History' })).toBeVisible();

    // Step 5: User sees their collection deck creation request in the history.
    // This provides immediate confirmation that their request was received and is being processed.
    await expect(page.locator('.bp6-table-truncated-text').filter({ hasText: 'Collection Deck' })).toBeVisible();

    // The initial status shows the user that their collection deck is being set up.
    await expect(page.getByText('Setting up your collection...')).toBeVisible();
    await expect(page.getByText('Queued for processing')).toBeVisible();

    // Step 6: Job 2 - User sees that their collection deck creation is in progress.
    // The user can see their collection deck in the history with initial status.
    await expect(page.getByText('Setting up your collection...')).toBeVisible();
    await expect(page.getByText('Queued for processing')).toBeVisible();

    // Job 3: User receives immediate feedback that their request was processed.
    // The toast notification confirms the collection deck creation started.
    await expect(page.getByText('Match generation started!')).toBeVisible();

    console.log('Test passed: User successfully created a collection deck and received immediate feedback.');
  });

});
