import { test, expect } from '@playwright/test';

test('Trace Override Workflow Entry Points', async ({ page }) => {
  console.log('\n=== TRACING OVERRIDE WORKFLOW ENTRY ===\n');

  // Navigate to collection management page
  await page.goto('http://localhost:3000/collection/DECK-1757517559289/manage', {
    waitUntil: 'networkidle',
    timeout: 30000
  });

  await page.waitForTimeout(2000);

  // ========================================
  // TEST 1: Click Edit Button on First Row
  // ========================================
  console.log('TEST 1: Clicking Edit button on first opportunity\n');

  const firstEditButton = page.locator('tbody tr').first().locator('button[aria-label*="Edit"], button:has(svg[data-icon="edit"])').first();
  const editButtonExists = await firstEditButton.count() > 0;

  if (editButtonExists) {
    console.log('✅ Edit button found, clicking...');
    await firstEditButton.click();
    await page.waitForTimeout(1500);

    // Check what opened
    const modalAfterEdit = await page.locator('[role="dialog"], .bp5-dialog, .bp5-overlay').count();
    console.log('Modal opened after edit:', modalAfterEdit > 0 ? 'YES' : 'NO');

    if (modalAfterEdit > 0) {
      const modalTitle = await page.locator('[role="dialog"] h1, [role="dialog"] h2, .bp5-dialog h1, .bp5-dialog h2, .bp5-dialog-header').first().textContent();
      console.log('Modal Title:', modalTitle);

      // Check for two-panel layout
      const leftPanel = await page.locator('[role="dialog"] .left-panel, .bp5-dialog .left-panel, [role="dialog"] [data-panel="left"]').count();
      const rightPanel = await page.locator('[role="dialog"] .right-panel, .bp5-dialog .right-panel, [role="dialog"] [data-panel="right"]').count();
      console.log('Two-Panel Layout:', leftPanel > 0 && rightPanel > 0 ? 'YES - LEGACY PATTERN!' : 'NO');

      await page.screenshot({ path: 'override-workflow-edit-button.png', fullPage: true });
      console.log('✅ Screenshot: override-workflow-edit-button.png');

      // Close modal
      const closeButton = page.locator('[role="dialog"] button[aria-label*="Close"], .bp5-dialog button[aria-label*="Close"]').first();
      if (await closeButton.count() > 0) {
        await closeButton.click();
        await page.waitForTimeout(500);
      }
    }
  } else {
    console.log('❌ Edit button not found');
  }

  // ========================================
  // TEST 2: Click More Menu (⋯) on First Row
  // ========================================
  console.log('\nTEST 2: Clicking More menu on first opportunity\n');

  const firstMoreButton = page.locator('tbody tr').first().locator('button[aria-label*="More"], button:has(svg[data-icon="more"])').first();
  const moreButtonExists = await firstMoreButton.count() > 0;

  if (moreButtonExists) {
    console.log('✅ More menu button found, clicking...');
    await firstMoreButton.click();
    await page.waitForTimeout(500);

    // Check for menu items
    const menuItems = await page.locator('[role="menuitem"], .bp5-menu-item').allTextContents();
    console.log('Menu Items:', menuItems);

    // Look for Reallocate/Override option
    const reallocateOption = page.locator('[role="menuitem"]:has-text("Reallocate"), [role="menuitem"]:has-text("Override"), .bp5-menu-item:has-text("Reallocate")');
    const reallocateExists = await reallocateOption.count() > 0;

    if (reallocateExists) {
      console.log('✅ Reallocate option found, clicking...');
      await reallocateOption.click();
      await page.waitForTimeout(1500);

      // Check what opened
      const modalAfterReallocate = await page.locator('[role="dialog"], .bp5-dialog').count();
      console.log('Modal opened after reallocate:', modalAfterReallocate > 0 ? 'YES' : 'NO');

      if (modalAfterReallocate > 0) {
        const modalTitle = await page.locator('[role="dialog"] h1, [role="dialog"] h2, .bp5-dialog h1, .bp5-dialog h2').first().textContent();
        console.log('Modal Title:', modalTitle);

        // Check for two-panel layout
        const leftPanel = await page.locator('[role="dialog"] .left-panel, .bp5-dialog .left-panel').count();
        const rightPanel = await page.locator('[role="dialog"] .right-panel, .bp5-dialog .right-panel').count();
        console.log('Two-Panel Layout:', leftPanel > 0 && rightPanel > 0 ? 'YES - LEGACY PATTERN!' : 'NO');

        await page.screenshot({ path: 'override-workflow-reallocate-menu.png', fullPage: true });
        console.log('✅ Screenshot: override-workflow-reallocate-menu.png');

        // Close modal
        const closeButton = page.locator('[role="dialog"] button[aria-label*="Close"], .bp5-dialog button[aria-label*="Close"]').first();
        if (await closeButton.count() > 0) {
          await closeButton.click();
          await page.waitForTimeout(500);
        }
      }
    } else {
      console.log('❌ Reallocate option not found in menu');
      await page.screenshot({ path: 'more-menu-items.png' });
      console.log('✅ Screenshot: more-menu-items.png');
    }
  } else {
    console.log('❌ More menu button not found');
  }

  // ========================================
  // TEST 3: Click Entire Row
  // ========================================
  console.log('\nTEST 3: Clicking first opportunity row\n');

  // Close any open menus first
  await page.keyboard.press('Escape');
  await page.waitForTimeout(500);

  const firstRow = page.locator('tbody tr').first();
  const rowExists = await firstRow.count() > 0;

  if (rowExists) {
    console.log('✅ Row found, clicking...');
    await firstRow.click();
    await page.waitForTimeout(1500);

    // Check for detail panel (drawer)
    const drawer = await page.locator('.drawer, .side-panel, aside[data-visible="true"], [role="complementary"]').count();
    console.log('Drawer/Detail Panel opened:', drawer > 0 ? 'YES' : 'NO');

    // Check for modal
    const modalAfterRowClick = await page.locator('[role="dialog"], .bp5-dialog').count();
    console.log('Modal opened after row click:', modalAfterRowClick > 0 ? 'YES' : 'NO');

    if (drawer > 0 || modalAfterRowClick > 0) {
      await page.screenshot({ path: 'override-workflow-row-click.png', fullPage: true });
      console.log('✅ Screenshot: override-workflow-row-click.png');

      // Look for action buttons in drawer/modal
      const reallocateButton = await page.locator('button:has-text("Reallocate"), button:has-text("Edit Allocation"), button:has-text("Override")').count();
      console.log('Reallocate button in panel/modal:', reallocateButton > 0 ? 'YES' : 'NO');

      if (reallocateButton > 0) {
        console.log('✅ Found reallocate button, clicking...');
        await page.locator('button:has-text("Reallocate"), button:has-text("Edit Allocation")').first().click();
        await page.waitForTimeout(1500);

        // Now check for the override workflow modal
        const overrideModal = await page.locator('[role="dialog"], .bp5-dialog').count();
        console.log('Override workflow modal opened:', overrideModal > 0 ? 'YES' : 'NO');

        if (overrideModal > 0) {
          const modalTitle = await page.locator('[role="dialog"] h1, [role="dialog"] h2, .bp5-dialog h1, .bp5-dialog h2').first().textContent();
          console.log('Modal Title:', modalTitle);

          // Check for two-panel layout
          const leftPanel = await page.locator('[role="dialog"] .left-panel, .bp5-dialog .left-panel').count();
          const rightPanel = await page.locator('[role="dialog"] .right-panel, .bp5-dialog .right-panel').count();
          console.log('Two-Panel Layout:', leftPanel > 0 && rightPanel > 0 ? 'YES - LEGACY PATTERN!' : 'NO');

          // Check for tabs
          const tabs = await page.locator('[role="dialog"] [role="tab"], .bp5-dialog [role="tab"]').allTextContents();
          console.log('Tabs in Modal:', tabs);

          await page.screenshot({ path: 'override-workflow-final-modal.png', fullPage: true });
          console.log('✅ Screenshot: override-workflow-final-modal.png');

          // DEEP ANALYSIS OF THE MODAL
          console.log('\n=== DEEP MODAL ANALYSIS ===\n');

          // Check for specific legacy elements
          const checkboxes = await page.locator('[role="dialog"] input[type="checkbox"], .bp5-dialog input[type="checkbox"]').count();
          console.log('Checkboxes in modal:', checkboxes);

          const draggableElements = await page.locator('[role="dialog"] [draggable="true"], .bp5-dialog [draggable="true"]').count();
          console.log('Draggable elements:', draggableElements);

          const capacityIndicators = await page.locator('[role="dialog"] text=/\\d+\\/\\d+/, .bp5-dialog text=/\\d+\\/\\d+/').count();
          console.log('Capacity indicators (e.g., "9/100"):', capacityIndicators);

          const justificationForm = await page.locator('[role="dialog"] textarea, .bp5-dialog textarea').count();
          console.log('Justification textarea:', justificationForm);

          const showAllToggle = await page.locator('[role="dialog"] text=/Show All/i, .bp5-dialog text=/Show All/i').count();
          console.log('Show All toggle:', showAllToggle);
        }
      }
    }
  } else {
    console.log('❌ Row not found');
  }

  // ========================================
  // TEST 4: Search for Specific Buttons
  // ========================================
  console.log('\n\nTEST 4: Searching for any override-related buttons on main page\n');

  const allButtons = await page.locator('button').allTextContents();
  const overrideRelated = allButtons.filter(text =>
    text.toLowerCase().includes('override') ||
    text.toLowerCase().includes('reallocate') ||
    text.toLowerCase().includes('allocate') ||
    text.toLowerCase().includes('manual')
  );

  console.log('Override-related buttons found:', overrideRelated.length > 0 ? overrideRelated : 'None');

  console.log('\n=== TRACE COMPLETE ===\n');
});
