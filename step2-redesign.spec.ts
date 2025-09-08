import { test, expect } from '@playwright/test';

test.describe('NOVA-1709: Step 2 Redesign Validation', () => {

  test.beforeEach(async ({ page }) => {
    // Navigate to the start of the Create Collection Deck workflow
    await page.goto('http://localhost:3001');
    await page.click('button:has-text("Decks")');
    await page.click('text=Create New Deck');

    // Fill out Step 1 to enable navigation to Step 2
    await page.fill('[data-testid="deck-name-input"]', 'Validation Test Deck');
    await page.click('.bp4-date-input'); // Open start date picker
    await page.click('.bp4-datepicker-day[aria-selected="true"]'); // Select today
    await page.click('.bp4-date-input'); // Close picker
    await page.click('button:has-text("Next")');

    // Ensure we are on Step 2
    await expect(page.locator('h5:has-text("Step 2: Review Parameters")')).toBeVisible();
  });

  test('should display tabs and preserve state between them', async ({ page }) => {
    // 1. Verify tabs are present and Elevation is the default
    await expect(page.locator('[role="tab"][aria-selected="true"]:has-text("Elevation")')).toBeVisible();
    await expect(page.locator('h5:has-text("Affected Sites")')).toBeVisible();

    // 2. Set an initial elevation value
    await page.fill('[data-testid="elevation-input"]', '30');
    await expect(page.locator('[data-testid="elevation-input"]')).toHaveValue('30');

    // 3. Switch to Hard Capacity tab and change value
    await page.click('[role="tab"]:has-text("Hard Capacity")');
    await expect(page.locator('[role="tab"][aria-selected="true"]:has-text("Hard Capacity")')).toBeVisible();
    await page.fill('[data-testid="hard-capacity-input"]', '50');
    await expect(page.locator('[data-testid="hard-capacity-input"]')).toHaveValue('50');

    // 4. Switch back to Elevation tab and verify state is preserved
    await page.click('[role="tab"]:has-text("Elevation")');
    await expect(page.locator('[data-testid="elevation-input"]')).toHaveValue('30');
  });

  test('should provide contextual feedback on the Elevation tab', async ({ page }) => {
    const elevationInput = page.locator('[data-testid="elevation-input"]');
    const affectedSitesCard = page.locator('div.bp4-card:has-text("Affected Sites")');

    // 1. Check initial state (Elevation 0)
    await expect(elevationInput).toHaveValue('0');
    await expect(affectedSitesCard.locator('text=0 of 12 sites available')).toBeVisible();

    // 2. Set elevation to 30
    await elevationInput.fill('30');
    await expect(affectedSitesCard.locator('text=7 of 12 sites available')).toBeVisible();

    // 3. Check that a specific site is now available
    await expect(affectedSitesCard.locator('span.bp4-tag:has-text("Pine Gap")')).not.toHaveClass(/bp4-minimal/);

    // 4. Set elevation to 90
    await elevationInput.fill('90');
    await expect(affectedSitesCard.locator('text=12 of 12 sites available')).toBeVisible();
  });

  test('should integrate with form validation and submission logic', async ({ page }) => {
    // 1. Fill out all parameters across tabs
    await page.click('[role="tab"]:has-text("Elevation")');
    await page.fill('[data-testid="elevation-input"]', '20');

    await page.click('[role="tab"]:has-text("Hard Capacity")');
    await page.fill('[data-testid="hard-capacity-input"]', '40');

    await page.click('[role="tab"]:has-text("Min Duration")');
    await page.fill('[data-testid="min-duration-input"]', '10');

    // 2. Click Next and verify the confirmation alert appears
    await page.click('button:has-text("Next")');
    await expect(page.locator('div.bp4-alert-body:has-text("Background Processing")')).toBeVisible();
    await expect(page.locator('button:has-text("Start Background Processing")')).toBeVisible();
  });

});
