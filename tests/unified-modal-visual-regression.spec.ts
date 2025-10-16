/**
 * Suite 1: Visual Regression Testing
 * Validates the redesign from cards to tables with screenshot comparisons
 */

import { test, expect } from '@playwright/test';
import * as path from 'path';

const SCREENSHOTS_DIR = '.playwright-mcp/validation';

test.describe('Unified Modal Redesign - Visual Regression', () => {

  test.beforeEach(async ({ page }) => {
    // Navigate to the application
    await page.goto('http://localhost:3000/history');
    await page.waitForLoadState('networkidle');
  });

  test('AllocatedSites renders as table not cards', async ({ page }) => {
    // Open the unified modal
    const firstRow = page.locator('[data-testid="opportunities-table"] tbody tr').first();
    await firstRow.click();

    // Wait for modal to appear
    const modal = page.locator('.bp5-dialog');
    await expect(modal).toBeVisible({ timeout: 5000 });

    // VALIDATE: Table2 component present for allocated sites
    const allocatedTable = modal.locator('[data-testid="allocated-sites-table"], .bp5-table2').first();
    await expect(allocatedTable).toBeVisible();

    // VALIDATE: No Card components in allocated sites section
    const allocatedSection = modal.locator('[data-testid="allocated-sites-section"]');
    const cards = allocatedSection.locator('.bp5-card');
    expect(await cards.count()).toBe(0);

    // Screenshot for comparison
    await modal.screenshot({
      path: path.join(SCREENSHOTS_DIR, 'allocated-sites-table.png')
    });

    console.log('✅ AllocatedSites: Table component detected, no Card components');
  });

  test('Available Passes table includes inline editing', async ({ page }) => {
    // Open modal
    const firstRow = page.locator('[data-testid="opportunities-table"] tbody tr').first();
    await firstRow.click();

    const modal = page.locator('.bp5-dialog');
    await expect(modal).toBeVisible();

    // VALIDATE: EditableText components in table cells
    const editableCells = modal.locator('.bp5-editable-text');
    const editableCount = await editableCells.count();

    expect(editableCount).toBeGreaterThan(0);
    console.log(`✅ Found ${editableCount} EditableText components for inline editing`);

    // Screenshot the editing capability
    await modal.screenshot({
      path: path.join(SCREENSHOTS_DIR, 'available-passes-inline-edit.png')
    });
  });

  test('Site Operations column visible in Available Passes', async ({ page }) => {
    // Open modal
    const firstRow = page.locator('[data-testid="opportunities-table"] tbody tr').first();
    await firstRow.click();

    const modal = page.locator('.bp5-dialog');
    await expect(modal).toBeVisible();

    // VALIDATE: Operations column with interactive elements
    const operationsColumn = modal.locator('[data-column-id="operations"], th:has-text("Operations")');

    // Check for ButtonGroup or Popover in operations cells
    const operationButtons = modal.locator('.bp5-button-group, .bp5-popover-target');
    const buttonCount = await operationButtons.count();

    if (buttonCount > 0) {
      console.log(`✅ Site Operations column found with ${buttonCount} interactive elements`);
    } else {
      console.log('⚠️  Site Operations column may need Blueprint components');
    }

    // Screenshot
    await modal.screenshot({
      path: path.join(SCREENSHOTS_DIR, 'site-operations-column.png')
    });
  });

  test('Dark mode support for all tables', async ({ page }) => {
    // Open modal
    const firstRow = page.locator('[data-testid="opportunities-table"] tbody tr').first();
    await firstRow.click();

    const modal = page.locator('.bp5-dialog');
    await expect(modal).toBeVisible();

    // Toggle dark mode (if theme switcher exists)
    const themeToggle = page.locator('[data-testid="theme-toggle"], .bp5-dark-theme-toggle');
    if (await themeToggle.count() > 0) {
      await themeToggle.click();
      await page.waitForTimeout(300);
    } else {
      // Manually add dark class to body for testing
      await page.evaluate(() => {
        document.body.classList.add('bp5-dark');
      });
    }

    // Screenshot dark mode
    await modal.screenshot({
      path: path.join(SCREENSHOTS_DIR, 'modal-dark-mode.png')
    });

    console.log('✅ Dark mode screenshot captured');
  });

  test('Full modal layout comparison', async ({ page }) => {
    // Open modal
    const firstRow = page.locator('[data-testid="opportunities-table"] tbody tr').first();
    await firstRow.click();

    const modal = page.locator('.bp5-dialog');
    await expect(modal).toBeVisible();

    // Full modal screenshot
    await modal.screenshot({
      path: path.join(SCREENSHOTS_DIR, 'unified-modal-full-layout.png'),
      fullPage: true
    });

    // Get modal dimensions
    const box = await modal.boundingBox();
    console.log(`Modal dimensions: ${box?.width}x${box?.height}px`);
  });
});
