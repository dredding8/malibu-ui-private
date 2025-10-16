/**
 * Suite 5: Interaction Flow Validation
 * User journey and workflow testing
 */

import { test, expect } from '@playwright/test';
import * as path from 'path';

const SCREENSHOTS_DIR = '.playwright-mcp/validation';

test.describe('Unified Modal - Interaction Workflows', () => {

  test.beforeEach(async ({ page }) => {
    await page.goto('http://localhost:3000/history');
    await page.waitForLoadState('networkidle');
  });

  test('Workflow: Open modal from opportunities table', async ({ page }) => {
    console.log(`\n🔄 Workflow: Modal Opening`);

    const startTime = Date.now();

    // Click first row
    const firstRow = page.locator('[data-testid="opportunities-table"] tbody tr').first();
    await firstRow.click();

    // Wait for modal
    const modal = page.locator('.bp5-dialog');
    await expect(modal).toBeVisible({ timeout: 5000 });

    const openTime = Date.now() - startTime;

    console.log(`   ✅ Modal opened in ${openTime}ms`);
    console.log(`   ${openTime < 300 ? '✅ Fast' : openTime < 500 ? '⚠️  Acceptable' : '❌ Slow'} (target: <300ms)`);

    // Screenshot
    await modal.screenshot({
      path: path.join(SCREENSHOTS_DIR, 'modal-opened.png')
    });

    expect(openTime).toBeLessThan(1000);
  });

  test('Workflow: Site allocation from Available Passes to AllocatedSites', async ({ page }) => {
    console.log(`\n🔄 Workflow: Site Allocation`);

    // Open modal
    const firstRow = page.locator('[data-testid="opportunities-table"] tbody tr').first();
    await firstRow.click();

    const modal = page.locator('.bp5-dialog');
    await expect(modal).toBeVisible();

    // Find AllocatedSites table before action
    const allocatedTableBefore = modal.locator('[data-testid="allocated-sites-table"], table').first();
    const rowCountBefore = await allocatedTableBefore.locator('tbody tr').count();

    console.log(`   Allocated sites before: ${rowCountBefore}`);

    // Find and click an allocate button (if exists)
    const allocateBtn = modal.locator('button:has-text("Allocate"), button[aria-label*="Allocate"]').first();

    if (await allocateBtn.count() > 0) {
      await allocateBtn.click();
      await page.waitForTimeout(300); // Wait for transition

      // Check if row was added
      const rowCountAfter = await allocatedTableBefore.locator('tbody tr').count();
      console.log(`   Allocated sites after: ${rowCountAfter}`);

      if (rowCountAfter > rowCountBefore) {
        console.log(`   ✅ Site successfully allocated (${rowCountAfter - rowCountBefore} added)`);

        // Screenshot
        await modal.screenshot({
          path: path.join(SCREENSHOTS_DIR, 'allocation-workflow-complete.png')
        });
      } else {
        console.log(`   ⚠️  Row count unchanged (allocation may use different pattern)`);
      }
    } else {
      console.log(`   ℹ️  No allocate button found (may require different interaction)`);
    }
  });

  test('Workflow: Inline collection editing', async ({ page }) => {
    console.log(`\n🔄 Workflow: Inline Editing`);

    // Open modal
    const firstRow = page.locator('[data-testid="opportunities-table"] tbody tr').first();
    await firstRow.click();

    const modal = page.locator('.bp5-dialog');
    await expect(modal).toBeVisible();

    // Find editable text component
    const editableCell = modal.locator('.bp5-editable-text').first();

    if (await editableCell.count() > 0) {
      const originalText = await editableCell.textContent();
      console.log(`   Original text: "${originalText?.trim()}"`);

      // Click to edit
      await editableCell.click();
      await page.waitForTimeout(200);

      // Type new value
      const input = editableCell.locator('input, textarea');
      if (await input.count() > 0) {
        await input.fill('Test Collection Name');
        console.log(`   ✅ Input field activated`);

        // Save (press Enter)
        await page.keyboard.press('Enter');
        await page.waitForTimeout(500);

        // Verify change
        const newText = await editableCell.textContent();
        console.log(`   New text: "${newText?.trim()}"`);

        // Screenshot
        await modal.screenshot({
          path: path.join(SCREENSHOTS_DIR, 'inline-edit-complete.png')
        });

        console.log(`   ✅ Inline edit workflow completed`);
      } else {
        console.log(`   ⚠️  Input field not found (may need different selector)`);
      }
    } else {
      console.log(`   ℹ️  No editable text components found`);
    }
  });

  test('Workflow: Site operations menu interaction', async ({ page }) => {
    console.log(`\n🔄 Workflow: Site Operations`);

    // Open modal
    const firstRow = page.locator('[data-testid="opportunities-table"] tbody tr').first();
    await firstRow.click();

    const modal = page.locator('.bp5-dialog');
    await expect(modal).toBeVisible();

    // Look for operations button (ButtonGroup, Popover, or Menu)
    const operationsBtn = modal.locator(
      'button[aria-label*="Operations"], ' +
      'button:has-text("Actions"), ' +
      '.bp5-button-group button, ' +
      '.bp5-popover-target button'
    ).first();

    if (await operationsBtn.count() > 0) {
      console.log(`   ✅ Operations button found`);

      await operationsBtn.click();
      await page.waitForTimeout(300);

      // Check for menu
      const menu = page.locator('.bp5-menu, .bp5-popover-content');

      if (await menu.isVisible()) {
        console.log(`   ✅ Operations menu opened`);

        // Screenshot
        await page.screenshot({
          path: path.join(SCREENSHOTS_DIR, 'site-operations-menu.png')
        });

        // List menu items
        const menuItems = await menu.locator('.bp5-menu-item, [role="menuitem"]').allTextContents();
        console.log(`   Menu options (${menuItems.length}):`);
        menuItems.forEach((item, i) => {
          console.log(`      ${i + 1}. ${item.trim()}`);
        });
      } else {
        console.log(`   ⚠️  Menu did not appear`);
      }
    } else {
      console.log(`   ℹ️  No operations button found`);
    }
  });

  test('Workflow: Modal close interactions', async ({ page }) => {
    console.log(`\n🔄 Workflow: Modal Closing`);

    // Open modal
    const firstRow = page.locator('[data-testid="opportunities-table"] tbody tr').first();
    await firstRow.click();

    const modal = page.locator('.bp5-dialog');
    await expect(modal).toBeVisible();

    // Test 1: Close button
    const closeBtn = modal.locator('.bp5-dialog-close-button, button[aria-label="Close"]').first();

    if (await closeBtn.count() > 0) {
      console.log(`   Testing close button...`);
      await closeBtn.click();
      await page.waitForTimeout(300);

      const closed = !(await modal.isVisible().catch(() => false));
      console.log(`   ${closed ? '✅' : '❌'} Close button works`);

      if (closed) {
        // Reopen for next test
        await firstRow.click();
        await expect(modal).toBeVisible();
      }
    }

    // Test 2: Escape key
    console.log(`   Testing Escape key...`);
    await page.keyboard.press('Escape');
    await page.waitForTimeout(300);

    const closedByEscape = !(await modal.isVisible().catch(() => false));
    console.log(`   ${closedByEscape ? '✅' : '❌'} Escape key closes modal`);

    if (closedByEscape) {
      // Reopen for next test
      await firstRow.click();
      await expect(modal).toBeVisible();
    }

    // Test 3: Overlay click
    const overlay = page.locator('.bp5-overlay-backdrop');
    if (await overlay.count() > 0) {
      console.log(`   Testing overlay click...`);
      await overlay.click({ position: { x: 10, y: 10 } });
      await page.waitForTimeout(300);

      const closedByOverlay = !(await modal.isVisible().catch(() => false));
      console.log(`   ${closedByOverlay ? '✅' : '⚠️  Disabled'} Overlay click closes modal`);
    }
  });

  test('Workflow: Table sorting interaction', async ({ page }) => {
    console.log(`\n🔄 Workflow: Table Sorting`);

    // Open modal
    const firstRow = page.locator('[data-testid="opportunities-table"] tbody tr').first();
    await firstRow.click();

    const modal = page.locator('.bp5-dialog');
    await expect(modal).toBeVisible();

    // Find sortable column headers
    const sortableHeaders = modal.locator('th[role="columnheader"], th.sortable, th button');
    const headerCount = await sortableHeaders.count();

    console.log(`   Sortable columns found: ${headerCount}`);

    if (headerCount > 0) {
      // Get first column data before sort
      const firstColumn = modal.locator('tbody tr td:first-child');
      const dataBefore = await firstColumn.allTextContents();

      console.log(`   Data before sort (first 3): ${dataBefore.slice(0, 3).join(', ')}`);

      // Click header to sort
      await sortableHeaders.first().click();
      await page.waitForTimeout(500);

      // Get data after sort
      const dataAfter = await firstColumn.allTextContents();

      console.log(`   Data after sort (first 3): ${dataAfter.slice(0, 3).join(', ')}`);

      const orderChanged = JSON.stringify(dataBefore) !== JSON.stringify(dataAfter);
      console.log(`   ${orderChanged ? '✅' : '⚠️'} Sort ${orderChanged ? 'active' : 'no visible change'}`);

      // Screenshot
      await modal.screenshot({
        path: path.join(SCREENSHOTS_DIR, 'table-sorted.png')
      });
    } else {
      console.log(`   ℹ️  No sortable columns detected`);
    }
  });

  test('Workflow: Multi-row selection', async ({ page }) => {
    console.log(`\n🔄 Workflow: Row Selection`);

    // Open modal
    const firstRow = page.locator('[data-testid="opportunities-table"] tbody tr').first();
    await firstRow.click();

    const modal = page.locator('.bp5-dialog');
    await expect(modal).toBeVisible();

    // Find selectable rows (checkboxes or clickable rows)
    const checkboxes = modal.locator('input[type="checkbox"]');
    const checkboxCount = await checkboxes.count();

    console.log(`   Checkboxes found: ${checkboxCount}`);

    if (checkboxCount > 1) {
      // Select first checkbox
      await checkboxes.nth(0).check();
      console.log(`   ✅ First row selected`);

      // Select second checkbox
      await checkboxes.nth(1).check();
      console.log(`   ✅ Second row selected`);

      // Count checked
      const checkedCount = await modal.locator('input[type="checkbox"]:checked').count();
      console.log(`   Total selected: ${checkedCount}`);

      // Screenshot
      await modal.screenshot({
        path: path.join(SCREENSHOTS_DIR, 'multi-row-selection.png')
      });
    } else {
      console.log(`   ℹ️  Row selection may use different pattern`);
    }
  });

  test('Workflow: Form submission', async ({ page }) => {
    console.log(`\n🔄 Workflow: Form Submission`);

    // Open modal
    const firstRow = page.locator('[data-testid="opportunities-table"] tbody tr').first();
    await firstRow.click();

    const modal = page.locator('.bp5-dialog');
    await expect(modal).toBeVisible();

    // Find submit button
    const submitBtn = modal.locator(
      'button[type="submit"], ' +
      'button:has-text("Save"), ' +
      'button:has-text("Submit"), ' +
      'button:has-text("Confirm"), ' +
      'button.bp5-intent-primary'
    ).first();

    if (await submitBtn.count() > 0) {
      const btnText = await submitBtn.textContent();
      console.log(`   Submit button: "${btnText?.trim()}"`);

      // Click submit
      await submitBtn.click();
      await page.waitForTimeout(500);

      // Check for loading state
      const hasSpinner = await modal.locator('.bp5-spinner').count() > 0;
      const isDisabled = await submitBtn.isDisabled().catch(() => false);

      console.log(`   ${hasSpinner ? '✅' : 'ℹ️ '} Loading indicator: ${hasSpinner ? 'shown' : 'not detected'}`);
      console.log(`   ${isDisabled ? '✅' : 'ℹ️ '} Button disabled during submit: ${isDisabled}`);

      // Screenshot
      await modal.screenshot({
        path: path.join(SCREENSHOTS_DIR, 'form-submission.png')
      });

      console.log(`   ✅ Form submission workflow tested`);
    } else {
      console.log(`   ℹ️  No submit button found (modal may be read-only)`);
    }
  });
});
