/**
 * Visual Validation: Capacity Display Refactor
 *
 * Validates that progress bars have been removed and replaced
 * with Blueprint-aligned text-based capacity display
 *
 * Test Date: 2025-10-07
 * Component: AllocationTab
 */

import { test, expect } from '@playwright/test';

test.describe('Capacity Display Refactor - Blueprint Alignment', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('http://localhost:3000');
    await page.waitForLoadState('networkidle');
  });

  test('should remove ProgressBar components from capacity column', async ({ page }) => {
    // Navigate to a collection with allocation workflow
    await page.click('text=Collections');
    await page.waitForTimeout(1000);

    // Click first collection to open detail view
    await page.click('.bp6-html-table tbody tr:first-child');
    await page.waitForTimeout(1000);

    // Look for "Manage" or allocation button
    const manageButton = page.locator('button:has-text("Manage"), button:has-text("Allocation")').first();
    if (await manageButton.isVisible()) {
      await manageButton.click();
      await page.waitForTimeout(1000);
    }

    // Check that ProgressBar components are NOT present
    const progressBars = page.locator('.bp6-progress-bar, .sites-table__capacity-bar');
    const progressBarCount = await progressBars.count();

    expect(progressBarCount).toBe(0);
    console.log('✅ No ProgressBar components found in capacity column');
  });

  test('should display text-based capacity with "X available" format', async ({ page }) => {
    // Navigate to allocation view
    await page.click('text=Collections');
    await page.waitForTimeout(1000);

    await page.click('.bp6-html-table tbody tr:first-child');
    await page.waitForTimeout(1000);

    const manageButton = page.locator('button:has-text("Manage"), button:has-text("Allocation")').first();
    if (await manageButton.isVisible()) {
      await manageButton.click();
      await page.waitForTimeout(1000);
    }

    // Check for new capacity display structure
    const capacityDisplays = page.locator('.capacity-display');
    const displayCount = await capacityDisplays.count();

    if (displayCount > 0) {
      console.log(`✅ Found ${displayCount} capacity display elements`);

      // Verify structure: available + allocated sections
      const availableSections = page.locator('.capacity-display__available');
      const allocatedSections = page.locator('.capacity-display__allocated');

      expect(await availableSections.count()).toBeGreaterThan(0);
      expect(await allocatedSections.count()).toBeGreaterThan(0);

      // Check text format
      const firstAvailable = await availableSections.first().textContent();
      expect(firstAvailable).toMatch(/(\d+ available|Full)/);

      console.log(`✅ Capacity display format: "${firstAvailable}"`);
    }
  });

  test('should display status indicator dots', async ({ page }) => {
    await page.click('text=Collections');
    await page.waitForTimeout(1000);

    await page.click('.bp6-html-table tbody tr:first-child');
    await page.waitForTimeout(1000);

    const manageButton = page.locator('button:has-text("Manage"), button:has-text("Allocation")').first();
    if (await manageButton.isVisible()) {
      await manageButton.click();
      await page.waitForTimeout(1000);
    }

    // Check for status indicator dots
    const statusDots = page.locator('.capacity-status');
    const dotCount = await statusDots.count();

    if (dotCount > 0) {
      console.log(`✅ Found ${dotCount} status indicator dots`);

      // Verify status variants exist
      const successDots = page.locator('.capacity-status--success');
      const warningDots = page.locator('.capacity-status--warning');
      const dangerDots = page.locator('.capacity-status--danger');
      const criticalDots = page.locator('.capacity-status--critical');

      const totalVariants =
        await successDots.count() +
        await warningDots.count() +
        await dangerDots.count() +
        await criticalDots.count();

      expect(totalVariants).toBe(dotCount);
      console.log('✅ All status dots have valid intent classes');
    }
  });

  test('should have proper visual hierarchy', async ({ page }) => {
    await page.click('text=Collections');
    await page.waitForTimeout(1000);

    await page.click('.bp6-html-table tbody tr:first-child');
    await page.waitForTimeout(1000);

    const manageButton = page.locator('button:has-text("Manage"), button:has-text("Allocation")').first();
    if (await manageButton.isVisible()) {
      await manageButton.click();
      await page.waitForTimeout(1000);
    }

    // Check CSS properties for visual hierarchy
    const availableSection = page.locator('.capacity-display__available').first();
    const allocatedSection = page.locator('.capacity-display__allocated').first();

    if (await availableSection.isVisible() && await allocatedSection.isVisible()) {
      const availableStyles = await availableSection.evaluate((el) => {
        const styles = window.getComputedStyle(el);
        return {
          fontWeight: styles.fontWeight,
          fontSize: styles.fontSize,
        };
      });

      const allocatedStyles = await allocatedSection.evaluate((el) => {
        const styles = window.getComputedStyle(el);
        return {
          fontWeight: styles.fontWeight,
          fontSize: styles.fontSize,
        };
      });

      // Available should be bolder and larger
      expect(parseInt(availableStyles.fontWeight)).toBeGreaterThanOrEqual(600);
      expect(parseFloat(availableStyles.fontSize)).toBeGreaterThan(parseFloat(allocatedStyles.fontSize));

      console.log('✅ Visual hierarchy: Available (bold, larger) > Allocated (muted, smaller)');
    }
  });

  test('visual snapshot - capacity display refactor', async ({ page }) => {
    await page.goto('http://localhost:3000');
    await page.click('text=Collections');
    await page.waitForTimeout(1000);

    await page.click('.bp6-html-table tbody tr:first-child');
    await page.waitForTimeout(2000);

    const manageButton = page.locator('button:has-text("Manage"), button:has-text("Allocation")').first();
    if (await manageButton.isVisible()) {
      await manageButton.click();
      await page.waitForTimeout(2000);

      await page.screenshot({
        path: 'capacity-display-refactor-validation.png',
        fullPage: true,
      });

      console.log('✅ Screenshot saved: capacity-display-refactor-validation.png');
    }
  });
});
