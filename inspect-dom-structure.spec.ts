import { test, expect } from '@playwright/test';

test('Inspect Actual DOM Structure', async ({ page }) => {
  console.log('\n=== INSPECTING DOM STRUCTURE ===\n');

  await page.goto('http://localhost:3000/collection/DECK-1757517559289/manage', {
    waitUntil: 'networkidle',
    timeout: 30000
  });

  await page.waitForTimeout(3000);

  // Get the HTML structure of the main content area
  const mainContent = page.locator('[role="main"], main, .collection-opportunities-hub');
  const mainExists = await mainContent.count() > 0;

  console.log('Main content found:', mainExists);

  if (mainExists) {
    // Get all direct children
    const children = await mainContent.locator('> *').all();
    console.log('\nMain content children:', children.length);

    for (let i = 0; i < Math.min(children.length, 10); i++) {
      const child = children[i];
      const tagName = await child.evaluate(el => el.tagName);
      const className = await child.getAttribute('class');
      console.log(`  ${i + 1}. <${tagName.toLowerCase()}> class="${className}"`);
    }
  }

  // Look for anything that looks like a table/list structure
  console.log('\n\nSearching for table-like structures:\n');

  const possibleTables = await page.locator('[class*="table"], [class*="grid"], [class*="list"], [role="grid"]').all();
  console.log('Possible table structures found:', possibleTables.length);

  for (let i = 0; i < Math.min(possibleTables.length, 5); i++) {
    const elem = possibleTables[i];
    const tagName = await elem.evaluate(el => el.tagName);
    const className = await elem.getAttribute('class');
    const role = await elem.getAttribute('role');

    console.log(`\n  Structure ${i + 1}:`);
    console.log(`    Tag: <${tagName.toLowerCase()}>`);
    console.log(`    Class: "${className}"`);
    console.log(`    Role: "${role}"`);

    // Check if it has rows
    const rows = await elem.locator('[role="row"], tr, [class*="row"]').count();
    console.log(`    Rows: ${rows}`);

    if (rows > 0) {
      console.log(`    ✅ This looks like our table!`);

      // Get first row
      const firstRow = elem.locator('[role="row"], tr, [class*="row"]').first();
      const firstRowExists = await firstRow.count() > 0;

      if (firstRowExists) {
        // Get all interactive elements in first row
        const buttons = await firstRow.locator('button').all();
        const links = await firstRow.locator('a').all();

        console.log(`    Buttons in first row: ${buttons.length}`);
        console.log(`    Links in first row: ${links.length}`);

        // Try clicking first button
        if (buttons.length > 0) {
          console.log(`\n    Attempting to click first button...`);
          const firstButton = buttons[buttons.length - 1]; // Try last button (likely actions column)
          await firstButton.click().catch(e => console.log(`    Failed: ${e.message}`));
          await page.waitForTimeout(1500);

          const modalOpen = await page.locator('[role="dialog"], .bp5-overlay-open').count() > 0;
          console.log(`    Modal opened: ${modalOpen ? 'YES ✅' : 'NO'}`);

          if (modalOpen) {
            await page.screenshot({ path: 'modal-from-table-button.png', fullPage: true });
            console.log(`    Screenshot: modal-from-table-button.png`);

            const modalContent = await page.locator('[role="dialog"]').first().textContent();
            console.log(`    Modal content preview: ${modalContent?.substring(0, 200)}...`);
          }
        }
      }
    }
  }

  // Search specifically for action buttons by looking for SVGs
  console.log('\n\nSearching for action buttons with icons:\n');

  const allButtons = await page.locator('button').all();
  let actionButtonsFound = 0;

  for (const btn of allButtons) {
    const isVisible = await btn.isVisible().catch(() => false);
    if (!isVisible) continue;

    const hasSvg = await btn.locator('svg').count() > 0;
    const hasText = (await btn.textContent()).trim().length > 0;

    // Icon-only buttons are likely action buttons
    if (hasSvg && !hasText) {
      actionButtonsFound++;
      if (actionButtonsFound <= 5) {
        const svgClass = await btn.locator('svg').first().getAttribute('class');
        console.log(`  Icon button ${actionButtonsFound}: svg class="${svgClass}"`);

        // Try clicking it
        if (actionButtonsFound === 1) {
          console.log(`    Clicking first icon button...`);
          await btn.click().catch(e => console.log(`    Failed: ${e.message}`));
          await page.waitForTimeout(1500);

          const modalOpen = await page.locator('[role="dialog"]').count() > 0;
          console.log(`    Modal opened: ${modalOpen ? 'YES ✅' : 'NO'}`);

          if (modalOpen) {
            await page.screenshot({ path: 'modal-from-icon-button.png', fullPage: true });
          }
        }
      }
    }
  }

  console.log(`\nTotal icon-only buttons found: ${actionButtonsFound}`);

  console.log('\n=== INSPECTION COMPLETE ===\n');
});
