import { test, expect } from '@playwright/test';

test.describe('Override Workflow Visibility', () => {
  test('verify override button and workspace are visible', async ({ page }) => {
    console.log('\n========================================');
    console.log('OVERRIDE WORKFLOW VISIBILITY CHECK');
    console.log('========================================\n');

    await page.goto('http://localhost:3000/collection/DECK-1757517559289/manage');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(2000);

    // Take full page screenshot
    await page.screenshot({ path: 'override-workflow-check.png', fullPage: true });

    // Check for override buttons in action column
    const overrideButtons = await page.locator('button[icon="edit"], button:has-text("Override")').count();
    console.log(`📊 Override buttons found: ${overrideButtons}`);

    // Check for workspace menu items
    const workspaceMenuItems = await page.locator('text="Open in Workspace", text="Workspace", text="Reallocate"').count();
    console.log(`📊 Workspace options found: ${workspaceMenuItems}`);

    // Check for inline override buttons (specific component)
    const inlineOverrideButtons = await page.locator('.inline-override-button, button.override-button').count();
    console.log(`📊 Inline override buttons: ${inlineOverrideButtons}`);

    // Try clicking on a row to see actions menu
    const firstRow = page.locator('tr.bp6-table-row').first();
    if (await firstRow.isVisible()) {
      console.log('✅ Table row found, checking for row actions...');

      // Look for action buttons in the row
      const actionsInRow = await firstRow.locator('button').count();
      console.log(`📊 Buttons in first row: ${actionsInRow}`);

      // List all button icons/text in first row
      const buttonTexts = await firstRow.locator('button').allTextContents();
      console.log('📋 Button contents:', buttonTexts);
    }

    // Check if LEGACY_SIMPLE_TABLE_ACTIONS might be hiding the workspace button
    console.log('\n⚠️  CHECKING FEATURE FLAGS:');
    console.log('If workspace button is missing, check:');
    console.log('1. LEGACY_SIMPLE_TABLE_ACTIONS flag');
    console.log('2. showWorkspaceOption prop');
    console.log('3. CollectionOpportunitiesEnhanced.tsx line 635-643');

    console.log('\n========================================');
    console.log('END OVERRIDE WORKFLOW CHECK');
    console.log('========================================\n');
  });

  test('check actions column structure', async ({ page }) => {
    await page.goto('http://localhost:3000/collection/DECK-1757517559289/manage');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(2000);

    // Find the Actions column header
    const actionsHeader = await page.locator('th:has-text("Actions")').isVisible();
    console.log(`\n📊 Actions column header visible: ${actionsHeader}`);

    // Count cells in Actions column
    const actionsCells = await page.locator('td.bp6-table-cell').last().screenshot({ path: 'actions-cell-sample.png' });
    console.log('✅ Screenshot of actions cell saved');

    // Get HTML of first actions cell to inspect structure
    const firstActionsCell = await page.locator('tr.bp6-table-row').first().locator('td').last();
    const innerHTML = await firstActionsCell.innerHTML();
    console.log('\n📋 Actions cell HTML structure:');
    console.log(innerHTML);
  });
});
