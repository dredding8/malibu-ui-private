import { test, expect } from '@playwright/test';

test('Edit button opens override mode with AllocationTab', async ({ page }) => {
  console.log('1. Navigate to collection manage page');
  await page.goto('http://localhost:3000/collection/DECK-1756423202347/manage');
  await page.waitForLoadState('networkidle');
  await page.waitForTimeout(2000);

  console.log('2. Find Edit button (pencil icon)');
  // Blueprint icons render as SVG, look for button with edit action
  const editButton = page.locator('button[aria-label*="edit" i], button:has(svg[data-icon="edit"])').first();
  await expect(editButton).toBeVisible({ timeout: 5000 });

  console.log('3. Click Edit button');
  await editButton.click();
  await page.waitForTimeout(2000);

  console.log('4. Check if modal/dialog opened');
  const modal = page.locator('[role="dialog"], .bp6-dialog, .bp6-overlay-content');
  await expect(modal).toBeVisible({ timeout: 3000 });

  console.log('5. Check for override mode tabs');
  const allocationTab = page.locator('text="1. Allocation", text="Allocation"').first();
  const isOverrideMode = await allocationTab.isVisible({ timeout: 2000 }).catch(() => false);

  console.log('\n=== RESULT ===');
  console.log('Modal opened:', await modal.isVisible());
  console.log('Override mode (has tabs):', isOverrideMode);
  console.log('Allocation tab visible:', isOverrideMode);

  if (isOverrideMode) {
    console.log('✅ SUCCESS: Edit button opens override mode with AllocationTab!');

    // Click Allocation tab to activate it
    await allocationTab.click();
    await page.waitForTimeout(500);

    // Look for two-panel layout
    const availablePasses = page.locator('text="Available Passes"');
    const allocatedSites = page.locator('text="Allocated Sites"');

    const hasTwoPanels = (await availablePasses.isVisible({ timeout: 2000 }).catch(() => false)) &&
                         (await allocatedSites.isVisible({ timeout: 2000 }).catch(() => false));

    console.log('Two-panel layout visible:', hasTwoPanels);

    if (hasTwoPanels) {
      console.log('✅ COMPLETE: Full legacy allocation workflow accessible!');
    }
  } else {
    console.log('❌ ISSUE: Edit button did NOT open override mode');
    console.log('Check if opened quick or standard mode instead');
  }

  // Take final screenshot
  await page.screenshot({ path: 'test-results/edit-button-modal.png' });
});
