import { test, expect } from '@playwright/test';

test('Examine Blueprint Table Cells', async ({ page }) => {
  console.log('\n=== EXAMINING BLUEPRINT TABLE CELLS ===\n');

  await page.goto('http://localhost:3000/collection/DECK-1757517559289/manage', {
    waitUntil: 'networkidle',
    timeout: 30000
  });

  await page.waitForTimeout(3000);

  // Find the Blueprint table
  const table = page.locator('.bp6-table-container.opportunities-table-enhanced').first();
  const tableExists = await table.count() > 0;

  console.log('Blueprint table found:', tableExists);

  if (!tableExists) {
    console.log('❌ Table not found');
    return;
  }

  // Blueprint tables use specific class structure
  // Find the table body
  const tableBody = table.locator('.bp6-table-body, [class*="table-body"]').first();
  console.log('Table body found:', await tableBody.count() > 0);

  // Get all cells
  const allCells = await table.locator('[class*="bp6-table-cell"]').all();
  console.log(`\nTotal cells found: ${allCells.length}`);

  // Check first 50 cells for buttons/actions
  console.log('\nExamining first 50 cells for interactive elements:\n');

  let cellsWithButtons = 0;
  for (let i = 0; i < Math.min(allCells.length, 50); i++) {
    const cell = allCells[i];
    const buttons = await cell.locator('button').count();

    if (buttons > 0) {
      cellsWithButtons++;
      const cellText = await cell.textContent();
      console.log(`  Cell ${i}: ${buttons} buttons, text="${cellText?.trim()?.substring(0, 50)}"`);

      if (cellsWithButtons === 1) {
        // Click first button in first cell with buttons
        const firstButton = cell.locator('button').first();
        console.log(`    Clicking first button...`);
        await firstButton.click().catch(e => console.log(`    Failed: ${e.message}`));
        await page.waitForTimeout(1500);

        const modalOpen = await page.locator('[role="dialog"]').count() > 0;
        console.log(`    Modal opened: ${modalOpen ? 'YES ✅' : 'NO'}`);

        if (modalOpen) {
          await page.screenshot({ path: 'blueprint-table-button-modal.png', fullPage: true });
        }
      }
    }
  }

  console.log(`\nCells with buttons: ${cellsWithButtons}`);

  // Try a different approach - look for cells in the Actions column specifically
  console.log('\n\nLooking for Actions column:\n');

  // Blueprint tables might have column headers
  const headers = await table.locator('[class*="column-header"], [class*="bp6-table-header"]').allTextContents();
  console.log('Column headers:', headers);

  // Find index of Actions column
  const actionsIndex = headers.findIndex(h => h.toLowerCase().includes('action'));
  console.log('Actions column index:', actionsIndex);

  if (actionsIndex >= 0) {
    // Try to find cells in that column
    console.log(`\nFinding cells in column ${actionsIndex}...\n`);

    // Blueprint tables use column index in class names
    const actionsCells = await table.locator(`[class*="bp6-table-cell"][class*="col-${actionsIndex}"]`).all();
    console.log(`Actions cells found: ${actionsCells.length}`);

    if (actionsCells.length > 0) {
      const firstActionsCell = actionsCells[0];
      const cellButtons = await firstActionsCell.locator('button').all();

      console.log(`Buttons in first actions cell: ${cellButtons.length}`);

      for (let i = 0; i < cellButtons.length; i++) {
        const btn = cellButtons[i];
        const innerHTML = await btn.innerHTML();
        console.log(`  Button ${i + 1}: ${innerHTML.substring(0, 100)}`);

        console.log(`  Clicking button ${i + 1}...`);
        await btn.click().catch(e => console.log(`  Failed: ${e.message}`));
        await page.waitForTimeout(1500);

        const modalOpen = await page.locator('[role="dialog"]').count() > 0;
        console.log(`  Modal opened: ${modalOpen ? 'YES ✅' : 'NO'}`);

        if (modalOpen) {
          await page.screenshot({ path: `actions-button-${i + 1}-modal.png`, fullPage: true });

          // Analyze modal
          const modalTitle = await page.locator('[role="dialog"] h2').first().textContent();
          console.log(`  Modal title: "${modalTitle}"`);

          // Check for override workflow patterns
          const leftPanel = await page.locator('[role="dialog"] .left-panel').count();
          const rightPanel = await page.locator('[role="dialog"] .right-panel').count();
          const tabs = await page.locator('[role="dialog"] [role="tab"]').allTextContents();

          console.log(`  Structure:`);
          console.log(`    - Two-panel layout: ${leftPanel > 0 && rightPanel > 0 ? 'YES ✅' : 'NO'}`);
          console.log(`    - Tabs: ${tabs.length > 0 ? tabs : 'None'}`);

          // This is likely our override workflow!
          if (leftPanel > 0 && rightPanel > 0) {
            console.log(`\n  ✅ FOUND OVERRIDE WORKFLOW WITH TWO-PANEL LAYOUT!\n`);
          }

          await page.keyboard.press('Escape');
          await page.waitForTimeout(500);
        }
      }
    }
  }

  console.log('\n=== EXAMINATION COMPLETE ===\n');
});
