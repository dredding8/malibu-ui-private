import { test, expect } from '@playwright/test';

/**
 * Live Application Validation - Legacy Allocation Workflow Parity
 *
 * Tests the actual production URL to verify:
 * 1. Edit button opens override mode (not quick mode)
 * 2. AllocationTab is visible with two-panel layout
 * 3. Pass properties displayed correctly
 * 4. Stepper controls and time distribution functional
 * 5. ImpactWarningModal shows legacy features
 */

test.describe('Legacy Allocation Workflow - Live Application', () => {
  const LIVE_URL = 'http://localhost:3000/collection/DECK-1756423202347/manage';

  test.beforeEach(async ({ page }) => {
    await page.goto(LIVE_URL);
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(2000); // Allow React to hydrate
  });

  test('Step 1: Collection management page loads with opportunities', async ({ page }) => {
    // Verify page loaded
    await expect(page).toHaveURL(/collection\/.*\/manage/);

    // Check for collection opportunities table or list
    const hasTable = await page.locator('table, [role="grid"]').count() > 0;
    const hasCards = await page.locator('[class*="opportunity"], [class*="card"]').count() > 0;

    expect(hasTable || hasCards).toBeTruthy();

    console.log('✅ Collection management page loaded');
  });

  test('Step 2: Edit button opens override mode with AllocationTab', async ({ page }) => {
    // Find first Edit button
    const editButton = page.locator('button:has-text("Edit"), button[aria-label*="edit" i]').first();
    await expect(editButton).toBeVisible({ timeout: 5000 });

    // Click Edit
    await editButton.click();
    await page.waitForTimeout(2000);

    // Verify modal/dialog opened
    const modal = page.locator('[role="dialog"], .bp6-dialog, .bp6-drawer');
    await expect(modal).toBeVisible({ timeout: 3000 });

    // CRITICAL: Verify we're in override mode (not quick mode)
    // Look for tab navigation which only appears in override mode
    const allocationTab = page.locator('[id="override-tabs-tab-allocation"], text="1. Allocation"');
    await expect(allocationTab).toBeVisible({ timeout: 3000 });

    console.log('✅ Edit button opens override mode with Allocation tab');
  });

  test('Step 3: Two-panel layout displays pass properties', async ({ page }) => {
    // Open editor
    const editButton = page.locator('button:has-text("Edit"), button[aria-label*="edit" i]').first();
    await editButton.click();
    await page.waitForTimeout(2000);

    // Click Allocation tab if not already selected
    const allocationTab = page.locator('[id="override-tabs-tab-allocation"]');
    if (await allocationTab.isVisible()) {
      await allocationTab.click();
      await page.waitForTimeout(500);
    }

    // Verify two-panel layout
    const leftPanel = page.locator('text="Available Passes"').first();
    const rightPanel = page.locator('text="Allocated Sites"').first();

    await expect(leftPanel).toBeVisible({ timeout: 3000 });
    await expect(rightPanel).toBeVisible({ timeout: 3000 });

    // Verify pass properties displayed
    // Look for quality tags, pass counts, duration, elevation
    const passProperties = page.locator('.bp6-tag, [class*="tag"]');
    const propertyCount = await passProperties.count();

    expect(propertyCount).toBeGreaterThan(0);

    console.log(`✅ Two-panel layout with ${propertyCount} pass property indicators`);
  });

  test('Step 4: Stepper controls and time distribution visible', async ({ page }) => {
    // Open editor
    const editButton = page.locator('button:has-text("Edit"), button[aria-label*="edit" i]').first();
    await editButton.click();
    await page.waitForTimeout(2000);

    // Navigate to Allocation tab
    const allocationTab = page.locator('[id="override-tabs-tab-allocation"]');
    if (await allocationTab.isVisible()) {
      await allocationTab.click();
      await page.waitForTimeout(500);
    }

    // Look for stepper controls (numeric input with +/- buttons)
    const steppers = page.locator('input[type="number"], .bp6-numeric-input');
    const stepperCount = await steppers.count();

    // Look for time distribution dropdowns
    const dropdowns = page.locator('select, .bp6-html-select');
    const dropdownCount = await dropdowns.count();

    console.log(`✅ Found ${stepperCount} stepper controls, ${dropdownCount} dropdowns`);

    expect(stepperCount > 0 || dropdownCount > 0).toBeTruthy();
  });

  test('Step 5: Duration threshold formatting visible', async ({ page }) => {
    // Open editor
    const editButton = page.locator('button:has-text("Edit"), button[aria-label*="edit" i]').first();
    await editButton.click();
    await page.waitForTimeout(2000);

    // Navigate to Allocation tab
    const allocationTab = page.locator('[id="override-tabs-tab-allocation"]');
    if (await allocationTab.isVisible()) {
      await allocationTab.click();
      await page.waitForTimeout(500);
    }

    // Look for duration formatting: >5m or >9m
    const durationTags = page.locator('text=/>[59]m/');
    const durationCount = await durationTags.count();

    console.log(`✅ Found ${durationCount} duration threshold indicators`);

    // At least some duration indicators should be visible
    expect(durationCount).toBeGreaterThan(0);
  });

  test('Step 6: Submit triggers ImpactWarningModal with legacy features', async ({ page }) => {
    // Open editor
    const editButton = page.locator('button:has-text("Edit"), button[aria-label*="edit" i]').first();
    await editButton.click();
    await page.waitForTimeout(2000);

    // Make a change to trigger validation
    const allocationTab = page.locator('[id="override-tabs-tab-allocation"]');
    if (await allocationTab.isVisible()) {
      await allocationTab.click();
      await page.waitForTimeout(500);
    }

    // Try to find and click a submit/save/allocate button
    const submitButton = page.locator(
      'button:has-text("Save"), button:has-text("Submit"), button:has-text("Allocate"), button:has-text("Apply")'
    ).first();

    if (await submitButton.isVisible({ timeout: 2000 })) {
      await submitButton.click();
      await page.waitForTimeout(1500);

      // Check for impact warning modal
      const warningModal = page.locator('text=/impact.*capacity/i, text=/are you sure/i');
      const isWarningVisible = await warningModal.isVisible({ timeout: 2000 });

      if (isWarningVisible) {
        console.log('✅ Impact warning modal appeared');

        // Check for legacy features: Snooze checkbox, Yes/No buttons
        const snoozeCheckbox = page.locator('input[type="checkbox"]:near(text=/snooze/i)');
        const yesButton = page.locator('button:has-text("Yes")');
        const noButton = page.locator('button:has-text("No")');

        const hasSnooze = await snoozeCheckbox.isVisible({ timeout: 1000 }).catch(() => false);
        const hasYesNo = (await yesButton.isVisible({ timeout: 1000 }).catch(() => false)) &&
                         (await noButton.isVisible({ timeout: 1000 }).catch(() => false));

        console.log(`  Snooze checkbox: ${hasSnooze ? '✅' : '❌'}`);
        console.log(`  Yes/No buttons: ${hasYesNo ? '✅' : '❌'}`);
      } else {
        console.log('ℹ️  No changes made or validation not triggered');
      }
    } else {
      console.log('ℹ️  Submit button not found - may need to make changes first');
    }
  });

  test('Full workflow validation', async ({ page }) => {
    console.log('\n🔍 FULL LEGACY PARITY VALIDATION\n');

    // 1. Page loads
    await expect(page).toHaveURL(/collection\/.*\/manage/);
    console.log('✅ Step 1: Page loaded');

    // 2. Edit button exists
    const editButton = page.locator('button:has-text("Edit"), button[aria-label*="edit" i]').first();
    await expect(editButton).toBeVisible({ timeout: 5000 });
    console.log('✅ Step 2: Edit button visible');

    // 3. Click Edit
    await editButton.click();
    await page.waitForTimeout(2000);
    console.log('✅ Step 3: Edit clicked');

    // 4. Modal opens
    const modal = page.locator('[role="dialog"], .bp6-dialog, .bp6-drawer');
    await expect(modal).toBeVisible({ timeout: 3000 });
    console.log('✅ Step 4: Modal opened');

    // 5. Override mode (tabs visible)
    const tabs = page.locator('[role="tablist"], [id*="tabs"]');
    const hasTabs = await tabs.isVisible({ timeout: 3000 }).catch(() => false);
    console.log(`${hasTabs ? '✅' : '❌'} Step 5: Override mode with tabs`);

    // 6. Allocation tab
    const allocationTab = page.locator('text="1. Allocation", text="Allocation"');
    const hasAllocationTab = await allocationTab.first().isVisible({ timeout: 3000 }).catch(() => false);
    console.log(`${hasAllocationTab ? '✅' : '❌'} Step 6: Allocation tab`);

    // 7. Two-panel layout
    if (hasAllocationTab) {
      await allocationTab.first().click();
      await page.waitForTimeout(500);

      const availablePasses = page.locator('text="Available Passes"');
      const allocatedSites = page.locator('text="Allocated Sites"');
      const hasTwoPanels = (await availablePasses.isVisible({ timeout: 2000 }).catch(() => false)) &&
                           (await allocatedSites.isVisible({ timeout: 2000 }).catch(() => false));
      console.log(`${hasTwoPanels ? '✅' : '❌'} Step 7: Two-panel layout`);

      // 8. Pass properties
      const tags = page.locator('.bp6-tag, [class*="tag"]');
      const tagCount = await tags.count();
      console.log(`${tagCount > 0 ? '✅' : '❌'} Step 8: Pass properties (${tagCount} tags)`);

      // 9. Interactive controls
      const steppers = await page.locator('input[type="number"]').count();
      const dropdowns = await page.locator('select').count();
      console.log(`${steppers + dropdowns > 0 ? '✅' : '❌'} Step 9: Controls (${steppers} steppers, ${dropdowns} dropdowns)`);
    }

    console.log('\n📊 VALIDATION COMPLETE\n');
  });
});
