import { test, expect } from '@playwright/test';

test('Click Action Icons in Table - Direct Approach', async ({ page }) => {
  console.log('\n=== CLICKING ACTION ICONS DIRECTLY ===\n');

  await page.goto('http://localhost:3000/collection/DECK-1757517559289/manage', {
    waitUntil: 'networkidle',
    timeout: 30000
  });

  await page.waitForTimeout(2000);

  // ========================================
  // Find first row's action buttons by SVG icons
  // ========================================
  console.log('STEP 1: Finding action buttons in first row\n');

  const firstRow = page.locator('tbody tr').first();

  // Try to find buttons by their SVG icons
  const editButton = firstRow.locator('button').filter({ has: page.locator('svg[data-icon="edit"]') });
  const viewButton = firstRow.locator('button').filter({ has: page.locator('svg[data-icon="eye-open"]') });
  const moreButton = firstRow.locator('button').filter({ has: page.locator('svg[data-icon="more"]') });

  const editCount = await editButton.count();
  const viewCount = await viewButton.count();
  const moreCount = await moreButton.count();

  console.log('Edit button (✏️):', editCount > 0 ? 'FOUND' : 'NOT FOUND');
  console.log('View button (👁️):', viewCount > 0 ? 'FOUND' : 'NOT FOUND');
  console.log('More button (⋯):', moreCount > 0 ? 'FOUND' : 'NOT FOUND');

  // ========================================
  // TEST 1: Click Edit Button
  // ========================================
  if (editCount > 0) {
    console.log('\nTEST 1: Clicking Edit button\n');
    await editButton.click();
    await page.waitForTimeout(1500);

    const modalCount = await page.locator('[role="dialog"], .bp5-dialog, .bp5-overlay-open').count();
    console.log('Modal opened:', modalCount > 0 ? 'YES ✅' : 'NO');

    if (modalCount > 0) {
      await page.screenshot({ path: 'edit-button-modal.png', fullPage: true });

      const modalTitle = await page.locator('[role="dialog"] h2, .bp5-dialog h2').first().textContent().catch(() => 'No title');
      console.log('Modal Title:', modalTitle);

      // Check for two-panel layout
      const leftPanel = await page.locator('[role="dialog"] .left-panel, .bp5-dialog .left-panel').count();
      const rightPanel = await page.locator('[role="dialog"] .right-panel, .bp5-dialog .right-panel').count();
      console.log('Two-Panel Layout:', leftPanel > 0 && rightPanel > 0 ? 'YES - LEGACY PATTERN! ✅' : 'NO');

      // Check for tabs
      const tabs = await page.locator('[role="dialog"] [role="tab"]').allTextContents();
      console.log('Tabs:', tabs.length > 0 ? tabs : 'None');

      // Close modal
      await page.keyboard.press('Escape');
      await page.waitForTimeout(500);
    }
  }

  // ========================================
  // TEST 2: Click View Button
  // ========================================
  if (viewCount > 0) {
    console.log('\nTEST 2: Clicking View button\n');
    await viewButton.click();
    await page.waitForTimeout(1500);

    const modalCount = await page.locator('[role="dialog"], .bp5-dialog, .bp5-overlay-open').count();
    console.log('Modal/Drawer opened:', modalCount > 0 ? 'YES ✅' : 'NO');

    if (modalCount > 0) {
      await page.screenshot({ path: 'view-button-modal.png', fullPage: true });

      const modalTitle = await page.locator('[role="dialog"] h2, .bp5-dialog h2, .bp5-drawer h2').first().textContent().catch(() => 'No title');
      console.log('Modal/Drawer Title:', modalTitle);

      // Look for reallocate button
      const reallocateBtn = await page.locator('button:has-text("Reallocate"), button:has-text("Edit Allocation")').count();
      console.log('Reallocate button in view:', reallocateBtn > 0 ? 'YES ✅' : 'NO');

      if (reallocateBtn > 0) {
        console.log('\nClicking Reallocate button...');
        await page.locator('button:has-text("Reallocate"), button:has-text("Edit Allocation")').first().click();
        await page.waitForTimeout(1500);

        const overrideModal = await page.locator('[role="dialog"], .bp5-dialog').count();
        console.log('Override workflow modal opened:', overrideModal > 0 ? 'YES ✅' : 'NO');

        if (overrideModal > 0) {
          await page.screenshot({ path: 'override-workflow-modal.png', fullPage: true });

          const overrideTitle = await page.locator('[role="dialog"] h2').first().textContent();
          console.log('Override Modal Title:', overrideTitle);

          // DEEP ANALYSIS
          console.log('\n=== OVERRIDE WORKFLOW MODAL ANALYSIS ===\n');

          const leftPanel = await page.locator('[role="dialog"] .left-panel').count();
          const rightPanel = await page.locator('[role="dialog"] .right-panel').count();
          const tabs = await page.locator('[role="dialog"] [role="tab"]').allTextContents();
          const checkboxes = await page.locator('[role="dialog"] input[type="checkbox"]').count();
          const draggable = await page.locator('[role="dialog"] [draggable="true"]').count();
          const textareas = await page.locator('[role="dialog"] textarea').count();

          console.log('Structure:');
          console.log('  - Left Panel:', leftPanel > 0 ? 'YES ✅' : 'NO');
          console.log('  - Right Panel:', rightPanel > 0 ? 'YES ✅' : 'NO');
          console.log('  - Tabs:', tabs.length > 0 ? tabs : 'None');
          console.log('  - Checkboxes:', checkboxes);
          console.log('  - Draggable elements:', draggable);
          console.log('  - Textareas:', textareas);

          // THIS IS THE OVERRIDE WORKFLOW!
          console.log('\n✅ FOUND OVERRIDE WORKFLOW MODAL!\n');
        }
      }

      await page.keyboard.press('Escape');
      await page.waitForTimeout(500);
    }
  }

  // ========================================
  // TEST 3: Click More Menu Button
  // ========================================
  if (moreCount > 0) {
    console.log('\nTEST 3: Clicking More menu button\n');
    await moreButton.click();
    await page.waitForTimeout(500);

    const menuItems = await page.locator('[role="menuitem"]').allTextContents();
    console.log('Menu items:', menuItems);

    await page.screenshot({ path: 'more-menu-items.png' });

    const reallocateItem = page.locator('[role="menuitem"]:has-text("Reallocate")');
    const reallocateExists = await reallocateItem.count() > 0;

    if (reallocateExists) {
      console.log('\nClicking Reallocate menu item...');
      await reallocateItem.click();
      await page.waitForTimeout(1500);

      const modalCount = await page.locator('[role="dialog"], .bp5-dialog').count();
      console.log('Override modal opened:', modalCount > 0 ? 'YES ✅' : 'NO');

      if (modalCount > 0) {
        await page.screenshot({ path: 'override-workflow-from-menu.png', fullPage: true });
      }
    }
  }

  console.log('\n=== TEST COMPLETE ===\n');
});
