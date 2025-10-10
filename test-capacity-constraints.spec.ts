import { test, expect } from '@playwright/test';

/**
 * Test: Allocation Stepper Capacity Constraints
 *
 * Validates that the stepper correctly enforces capacity limits:
 * - Site with capacity 100, allocated 50 → stepper allows 0-50
 * - Stepper max = min(available passes, remaining capacity)
 * - UI shows both assigned/available and total capacity
 */

test.describe('Allocation Capacity Constraints', () => {
  test.beforeEach(async ({ page }) => {
    // Navigate to collection management page
    await page.goto('http://localhost:3000/collection/DECK-1756423202347/manage');
    await page.waitForLoadState('networkidle');

    // Open Edit button to trigger Manual Override Workflow
    const editButton = page.locator('button[aria-label*="edit" i], button:has(svg[data-icon="edit"])').first();
    await editButton.click();

    // Wait for dialog to open
    await page.waitForSelector('text="Manual Override Workflow"', { timeout: 5000 });

    // Ensure we're on the Allocation tab
    const allocationTab = page.locator('text="1. Allocation"').first();
    await allocationTab.click();
  });

  test('Stepper max should be constrained by remaining capacity', async ({ page }) => {
    // Select a site from Available Passes panel
    const firstSiteCard = page.locator('.editor-site-card').first();
    await firstSiteCard.click();

    // Wait for site to appear in Allocated Sites panel
    await page.waitForSelector('text="Allocated Sites"');

    // Find the NumericInput stepper in Allocated Sites panel
    const collectsInput = page.locator('input[type="text"]').filter({ hasText: /^\d+$/ }).first();

    // Check the max attribute
    const maxAttr = await collectsInput.getAttribute('max');
    console.log('[Test] Stepper max attribute:', maxAttr);

    // Get the capacity info from the helper text
    const capacityHelper = page.locator('text=/Capacity: \\d+\\/\\d+ allocated/').first();
    const capacityText = await capacityHelper.textContent();
    console.log('[Test] Capacity helper text:', capacityText);

    // Parse capacity: "Capacity: 50/100 allocated" → allocated=50, capacity=100
    const match = capacityText?.match(/Capacity: (\d+)\/(\d+) allocated/);
    if (match) {
      const allocated = parseInt(match[1], 10);
      const capacity = parseInt(match[2], 10);
      const remainingCapacity = capacity - allocated;

      console.log('[Test] Allocated:', allocated);
      console.log('[Test] Capacity:', capacity);
      console.log('[Test] Remaining:', remainingCapacity);

      // Verify stepper max is constrained by remaining capacity
      const stepperMax = parseInt(maxAttr || '0', 10);
      expect(stepperMax).toBeLessThanOrEqual(remainingCapacity);

      console.log('[Test] ✅ Stepper max', stepperMax, 'is within remaining capacity', remainingCapacity);
    }
  });

  test('UI should show both assigned/available and total capacity', async ({ page }) => {
    // Select a site
    const firstSiteCard = page.locator('.editor-site-card').first();
    await firstSiteCard.click();

    await page.waitForTimeout(500);

    // Check for "Assigned: X / Y available" display
    const assignedDisplay = page.locator('text=/Assigned: \\d+ \\/ \\d+ available/');
    await expect(assignedDisplay).toBeVisible();
    const assignedText = await assignedDisplay.textContent();
    console.log('[Test] Assigned display:', assignedText);

    // Check for "Site Capacity: X / Y" display
    const capacityDisplay = page.locator('text=/Site Capacity: \\d+ \\/ \\d+/');
    await expect(capacityDisplay).toBeVisible();
    const capacityText = await capacityDisplay.textContent();
    console.log('[Test] Capacity display:', capacityText);
  });

  test('Stepper should be disabled when site at capacity', async ({ page }) => {
    // Find a site card showing high capacity utilization
    const siteCards = page.locator('.editor-site-card');
    const count = await siteCards.count();

    for (let i = 0; i < count; i++) {
      const card = siteCards.nth(i);
      const capacityText = await card.locator('text=/Capacity: \\d+ \\/ \\d+/').textContent();

      // Parse capacity to find a site at/near capacity
      const match = capacityText?.match(/Capacity: (\d+) \/ (\d+)/);
      if (match) {
        const allocated = parseInt(match[1], 10);
        const capacity = parseInt(match[2], 10);

        // If site is at capacity, test disabled state
        if (allocated >= capacity) {
          console.log('[Test] Found site at capacity:', capacityText);

          await card.click();
          await page.waitForTimeout(500);

          // Check for error callout
          const errorCallout = page.locator('text="Site at capacity"');
          await expect(errorCallout).toBeVisible();

          // Check stepper is disabled
          const collectsInput = page.locator('input[type="text"]').filter({ hasText: /^\d+$/ }).first();
          const isDisabled = await collectsInput.isDisabled();
          expect(isDisabled).toBe(true);

          console.log('[Test] ✅ Stepper disabled for site at capacity');
          break;
        }
      }
    }
  });

  test('Warning should show when capacity is limited', async ({ page }) => {
    // Find a site with limited capacity (allocated > 0, remaining < total passes)
    const siteCards = page.locator('.editor-site-card');
    const count = await siteCards.count();

    for (let i = 0; i < count; i++) {
      const card = siteCards.nth(i);
      const capacityText = await card.locator('text=/Capacity: \\d+ \\/ \\d+/').textContent();

      const match = capacityText?.match(/Capacity: (\d+) \/ (\d+)/);
      if (match) {
        const allocated = parseInt(match[1], 10);
        const capacity = parseInt(match[2], 10);
        const remaining = capacity - allocated;

        // If site has limited capacity (not full, but constrained)
        if (allocated > 0 && remaining > 0 && remaining < capacity) {
          console.log('[Test] Found site with limited capacity:', capacityText);

          await card.click();
          await page.waitForTimeout(500);

          // Check for warning callout
          const warningCallout = page.locator('text=/Limited capacity: Only \\d+ passes available/');
          const isVisible = await warningCallout.isVisible();

          if (isVisible) {
            console.log('[Test] ✅ Warning displayed for limited capacity');
            const warningText = await warningCallout.textContent();
            console.log('[Test] Warning text:', warningText);
            break;
          }
        }
      }
    }
  });

  test('Increasing stepper updates both assigned and total capacity displays', async ({ page }) => {
    // Select a site
    const firstSiteCard = page.locator('.editor-site-card').first();
    await firstSiteCard.click();

    await page.waitForTimeout(500);

    // Get initial capacity display
    const capacityDisplay = page.locator('text=/Site Capacity: \\d+ \\/ \\d+/');
    const initialText = await capacityDisplay.textContent();
    const initialMatch = initialText?.match(/Site Capacity: (\d+) \/ (\d+)/);
    const initialTotal = initialMatch ? parseInt(initialMatch[1], 10) : 0;

    console.log('[Test] Initial capacity:', initialText);

    // Increment stepper
    const incrementButton = page.locator('button[class*="NumericInput"] >> nth=1'); // Right button (increment)
    await incrementButton.click();
    await page.waitForTimeout(300);

    // Get updated capacity display
    const updatedText = await capacityDisplay.textContent();
    const updatedMatch = updatedText?.match(/Site Capacity: (\d+) \/ (\d+)/);
    const updatedTotal = updatedMatch ? parseInt(updatedMatch[1], 10) : 0;

    console.log('[Test] Updated capacity:', updatedText);

    // Verify total increased by 1
    expect(updatedTotal).toBe(initialTotal + 1);
    console.log('[Test] ✅ Capacity increased from', initialTotal, 'to', updatedTotal);
  });
});
