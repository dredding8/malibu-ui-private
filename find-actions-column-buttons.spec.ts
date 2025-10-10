import { test, expect } from '@playwright/test';

test('Find Buttons in Actions Column', async ({ page }) => {
  console.log('\n=== FINDING ACTIONS COLUMN BUTTONS ===\n');

  await page.goto('http://localhost:3000/collection/DECK-1757517559289/manage', {
    waitUntil: 'networkidle',
    timeout: 30000
  });

  await page.waitForTimeout(2000);

  // Find the table
  const table = page.locator('table, [role="table"]').first();
  const tableExists = await table.count() > 0;

  if (!tableExists) {
    console.log('❌ Table not found');
    return;
  }

  console.log('✅ Table found\n');

  // Get first row
  const firstRow = page.locator('tbody tr').first();
  const rowExists = await firstRow.count() > 0;

  if (!rowExists) {
    console.log('❌ First row not found');
    return;
  }

  console.log('✅ First row found\n');

  // Get all cells in first row
  const cells = await firstRow.locator('td').all();
  console.log('Number of cells in first row:', cells.length);

  // Check last 3 cells (likely contains actions)
  console.log('\nExamining last 3 cells:\n');

  for (let i = Math.max(0, cells.length - 3); i < cells.length; i++) {
    const cell = cells[i];
    const cellText = await cell.textContent();
    const buttons = await cell.locator('button, a[role="button"]').all();

    console.log(`Cell ${i + 1}:`);
    console.log(`  Text: "${cellText?.trim()}"`);
    console.log(`  Buttons: ${buttons.length}`);

    // Try to click each button
    for (let j = 0; j < buttons.length; j++) {
      const btn = buttons[j];
      const isVisible = await btn.isVisible().catch(() => false);

      if (isVisible) {
        const innerHTML = await btn.innerHTML().catch(() => '');
        console.log(`\n  Button ${j + 1}:`);
        console.log(`    HTML: ${innerHTML.substring(0, 100)}...`);

        // Click it
        console.log(`    Clicking...`);
        await btn.click().catch((e) => console.log(`    Failed: ${e.message}`));
        await page.waitForTimeout(1000);

        // Check for modal/drawer
        const overlayOpen = await page.locator('.bp5-overlay-open, [role="dialog"]').count() > 0;
        console.log(`    Opened overlay: ${overlayOpen ? 'YES ✅' : 'NO'}`);

        if (overlayOpen) {
          await page.screenshot({ path: `action-button-${i + 1}-${j + 1}.png`, fullPage: true });
          console.log(`    Screenshot saved: action-button-${i + 1}-${j + 1}.png`);

          // Analyze what opened
          const modalTitle = await page.locator('[role="dialog"] h1, [role="dialog"] h2, [role="dialog"] h3').first().textContent().catch(() => '');
          console.log(`    Modal Title: "${modalTitle}"`);

          // Check structure
          const hasLeftPanel = await page.locator('.left-panel, [class*="left-panel"]').count() > 0;
          const hasRightPanel = await page.locator('.right-panel, [class*="right-panel"]').count() > 0;
          const hasTabs = await page.locator('[role="tab"]').count() > 0;

          console.log(`    Structure:`);
          console.log(`      - Left/Right Panels: ${hasLeftPanel && hasRightPanel ? 'YES ✅' : 'NO'}`);
          console.log(`      - Has Tabs: ${hasTabs ? 'YES' : 'NO'}`);

          // Close and continue
          await page.keyboard.press('Escape');
          await page.waitForTimeout(500);
        }
      }
    }
  }

  console.log('\n=== ANALYSIS COMPLETE ===\n');
});
