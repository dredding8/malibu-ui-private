import { test, expect } from '@playwright/test';

test('Find Override Workflow - Pragmatic Approach', async ({ page }) => {
  console.log('\n=== PRAGMATIC OVERRIDE WORKFLOW SEARCH ===\n');

  await page.goto('http://localhost:3000/collection/DECK-1757517559289/manage', {
    waitUntil: 'networkidle',
    timeout: 30000
  });

  await page.waitForTimeout(2000);
  await page.screenshot({ path: 'start-state.png', fullPage: true });

  // ========================================
  // STEP 1: Find ALL buttons on the page
  // ========================================
  console.log('STEP 1: Finding all clickable elements\n');

  const allButtons = await page.locator('button').all();
  console.log('Total buttons found:', allButtons.length);

  // Get first 10 visible buttons with text
  let foundButtons = [];
  for (const button of allButtons.slice(0, 50)) {
    const isVisible = await button.isVisible().catch(() => false);
    if (isVisible) {
      const text = await button.textContent().catch(() => '');
      const ariaLabel = await button.getAttribute('aria-label').catch(() => '');
      if (text || ariaLabel) {
        foundButtons.push({ text: text.trim(), ariaLabel });
      }
    }
  }

  console.log('\nVisible buttons (first 20):');
  foundButtons.slice(0, 20).forEach((btn, i) => {
    console.log(`  ${i + 1}. "${btn.text}" ${btn.ariaLabel ? `[${btn.ariaLabel}]` : ''}`);
  });

  // ========================================
  // STEP 2: Look in the Actions column
  // ========================================
  console.log('\n\nSTEP 2: Examining Actions column in table\n');

  // Find the Actions column
  const actionsColumn = page.locator('td').filter({ hasText: /edit|view|more/i }).first();
  const actionsExists = await actionsColumn.count() > 0;

  if (!actionsExists) {
    // Try finding by position (last column)
    const firstRow = page.locator('tbody tr').first();
    const lastCell = firstRow.locator('td').last();
    const buttonsInCell = await lastCell.locator('button, a').all();

    console.log('Buttons in last cell of first row:', buttonsInCell.length);

    for (let i = 0; i < Math.min(buttonsInCell.length, 5); i++) {
      const btn = buttonsInCell[i];
      const isVisible = await btn.isVisible().catch(() => false);
      if (isVisible) {
        const title = await btn.getAttribute('title').catch(() => '');
        const ariaLabel = await btn.getAttribute('aria-label').catch(() => '');
        console.log(`  Button ${i + 1}: title="${title}" aria-label="${ariaLabel}"`);

        // Try clicking each button to see what happens
        console.log(`  Trying to click button ${i + 1}...`);
        await btn.click().catch(() => console.log('  Failed to click'));
        await page.waitForTimeout(1000);

        // Check if modal/drawer appeared
        const modalCount = await page.locator('[role="dialog"], .bp5-dialog, .bp5-drawer').count();
        const overlayCount = await page.locator('.bp5-overlay-open').count();

        if (modalCount > 0 || overlayCount > 0) {
          console.log(`  ✅ SUCCESS! Button ${i + 1} opened a modal/overlay`);
          await page.screenshot({ path: `modal-opened-button-${i + 1}.png`, fullPage: true });

          // Analyze what opened
          const modalTitle = await page.locator('[role="dialog"] [class*="header"], .bp5-dialog [class*="header"], .bp5-drawer [class*="header"]').first().textContent().catch(() => 'No title');
          console.log(`  Modal Title: "${modalTitle}"`);

          // Check structure
          const hasLeftPanel = await page.locator('.left-panel, [class*="left"]').count() > 0;
          const hasRightPanel = await page.locator('.right-panel, [class*="right"]').count() > 0;
          const hasTabs = await page.locator('[role="tab"]').count() > 0;
          const hasCheckboxes = await page.locator('input[type="checkbox"]').count() > 5;

          console.log(`  Structure:`);
          console.log(`    - Left Panel: ${hasLeftPanel ? 'YES' : 'NO'}`);
          console.log(`    - Right Panel: ${hasRightPanel ? 'YES' : 'NO'}`);
          console.log(`    - Tabs: ${hasTabs ? 'YES' : 'NO'}`);
          console.log(`    - Checkboxes: ${hasCheckboxes ? 'YES' : 'NO'}`);

          // This is likely our override workflow!
          break;
        } else {
          console.log(`  No modal opened, trying next button...`);
          await page.keyboard.press('Escape');
          await page.waitForTimeout(500);
        }
      }
    }
  }

  // ========================================
  // STEP 3: Try clicking the row itself
  // ========================================
  console.log('\n\nSTEP 3: Trying to click the first row\n');

  const firstRow = page.locator('tbody tr').first();
  const rowExists = await firstRow.count() > 0;

  if (rowExists) {
    // Click the checkbox cell area (not the checkbox itself)
    const healthCell = firstRow.locator('td').nth(1); // Health column
    const healthCellExists = await healthCell.count() > 0;

    if (healthCellExists) {
      console.log('Clicking health cell area...');
      await healthCell.click();
      await page.waitForTimeout(1500);

      const modalCount = await page.locator('[role="dialog"], .bp5-dialog, .bp5-drawer').count();
      if (modalCount > 0) {
        console.log('✅ Row click opened modal/drawer');
        await page.screenshot({ path: 'modal-opened-row-click.png', fullPage: true });

        // Check for action buttons in the modal/drawer
        const allModalButtons = await page.locator('[role="dialog"] button, .bp5-dialog button, .bp5-drawer button').all();
        console.log(`\nButtons in modal/drawer: ${allModalButtons.length}`);

        for (const btn of allModalButtons.slice(0, 10)) {
          const text = await btn.textContent().catch(() => '');
          const ariaLabel = await btn.getAttribute('aria-label').catch(() => '');
          console.log(`  - "${text.trim()}" ${ariaLabel ? `[${ariaLabel}]` : ''}`);
        }
      }
    }
  }

  // ========================================
  // STEP 4: Dump ALL element text on page
  // ========================================
  console.log('\n\nSTEP 4: Looking for key terms in page text\n');

  const bodyText = await page.locator('body').textContent();
  const keywords = ['override', 'reallocate', 'allocate', 'manual', 'justify', 'capacity', 'pass'];

  keywords.forEach(keyword => {
    const count = (bodyText.match(new RegExp(keyword, 'gi')) || []).length;
    if (count > 0) {
      console.log(`  "${keyword}": found ${count} times`);
    }
  });

  console.log('\n=== SEARCH COMPLETE ===\n');
});
