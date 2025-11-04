import { test, expect } from '@playwright/test';

/**
 * Priority Item Visibility Tests
 *
 * Validates that the smart default filtering system makes high-priority items
 * immediately visible to users without requiring manual filter interaction.
 */

test.describe('Priority Item Visibility on Collection Management Page', () => {

  test.beforeEach(async ({ page }) => {
    // Clear localStorage to ensure priority hint is shown
    await page.goto('http://localhost:3000');
    await page.evaluate(() => localStorage.clear());
  });

  test('should show priority hint callout on first visit', async ({ page }) => {
    await page.goto('http://localhost:3000/collection/DECK-1757450666645/manage');

    // Wait for page to load
    await page.waitForSelector('.collection-opportunities-enhanced', { timeout: 10000 });

    // Look for the blue informational callout with the priority hint text
    // The callout should contain our key phrases
    const hintText = page.locator('text=/Priority items.*≥34.*data issues/i');
    await expect(hintText).toBeVisible({ timeout: 5000 });

    // Should also mention Clear All
    const calloutWithClearAll = page.locator('text=/Clear All.*to see all/i');
    await expect(calloutWithClearAll).toBeVisible();

    // Verify the dismiss button is present
    const dismissButton = page.locator('button[aria-label="Dismiss priority hint"]');
    await expect(dismissButton).toBeVisible();
  });

  test('should have high-priority and data-issues filters active by default', async ({ page }) => {
    await page.goto('http://localhost:3000/collection/DECK-1757450666645/manage');

    // Wait for filter chips to be visible
    await page.waitForSelector('text=Filters:', { timeout: 10000 });

    // Check that Priority filter chip is active with breadcrumb-style label
    const priorityChip = page.locator('text=Priority: ≥34');
    await expect(priorityChip).toBeVisible();

    // Check that Quality filter chip is active
    const qualityChip = page.locator('text=Quality: Has Issues');
    await expect(qualityChip).toBeVisible();

    // Clear all button should be visible (indicates filters are active)
    const clearAllButton = page.locator('button:has-text("Clear all")');
    await expect(clearAllButton).toBeVisible();
  });

  test('should dismiss priority hint and persist dismissal', async ({ page }) => {
    await page.goto('http://localhost:3000/collection/DECK-1757450666645/manage');

    await page.waitForSelector('.collection-opportunities-enhanced', { timeout: 10000 });

    // Find and click the dismiss button
    const dismissButton = page.locator('button[aria-label="Dismiss priority hint"]');
    await dismissButton.click();

    // Hint should disappear
    const priorityHint = page.locator('text=Priority items (≥34) and data issues shown first');
    await expect(priorityHint).not.toBeVisible();

    // Verify localStorage was set
    const isHintDismissed = await page.evaluate(() =>
      localStorage.getItem('malibu-priority-hint-dismissed')
    );
    expect(isHintDismissed).toBe('true');

    // Reload page - hint should stay dismissed
    await page.reload();
    await page.waitForSelector('.collection-opportunities-enhanced', { timeout: 10000 });
    await expect(priorityHint).not.toBeVisible();
  });

  test('should not show priority hint when filters are cleared', async ({ page }) => {
    await page.goto('http://localhost:3000/collection/DECK-1757450666645/manage');

    await page.waitForSelector('.collection-opportunities-enhanced', { timeout: 10000 });

    // Click "Clear all" to reset filters
    const clearAllButton = page.locator('button:has-text("Clear all")');
    await clearAllButton.click();

    // Priority hint should not be visible when showing all items
    const priorityHint = page.locator('text=Priority items (≥34) and data issues shown first');
    await expect(priorityHint).not.toBeVisible();
  });

  test('should show filtered result count', async ({ page }) => {
    await page.goto('http://localhost:3000/collection/DECK-1757450666645/manage');

    // Wait for filter chips to load
    await page.waitForSelector('text=Filters:', { timeout: 10000 });

    // Result count should be visible in the filter card
    const resultCount = page.locator('text=/Showing \\d+ of \\d+/');
    await expect(resultCount).toBeVisible();
  });

  test('should allow users to see all items via Clear All', async ({ page }) => {
    await page.goto('http://localhost:3000/collection/DECK-1757450666645/manage');

    // Wait for filter chips to load
    await page.waitForSelector('text=Filters:', { timeout: 10000 });

    // Get initial filtered count
    const initialSummary = await page.locator('text=/Showing \\d+ of \\d+/').textContent();
    const initialMatch = initialSummary?.match(/Showing (\d+) of (\d+)/);
    const filteredCount = initialMatch ? parseInt(initialMatch[1]) : 0;
    const totalCount = initialMatch ? parseInt(initialMatch[2]) : 0;

    // Click Clear all to reset filters
    await page.locator('button:has-text("Clear all")').click();

    // Filter result count should disappear (no filters active)
    await expect(page.locator('text=/Showing \\d+ of \\d+/')).not.toBeVisible();

    // Clear all button should disappear (all filters are now inactive)
    await expect(page.locator('button:has-text("Clear all")')).not.toBeVisible();

    // Filter chips should still be visible but in minimal/inactive state
    await expect(page.locator('text=Priority: ≥34')).toBeVisible();
    await expect(page.locator('text=Quality: Has Issues')).toBeVisible();

    // We expect total count to be greater than or equal to filtered count
    expect(totalCount).toBeGreaterThanOrEqual(filteredCount);
  });
});
