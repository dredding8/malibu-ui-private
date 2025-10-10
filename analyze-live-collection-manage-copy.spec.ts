import { test, expect } from '@playwright/test';

/**
 * Comprehensive Copy Audit for Collection Management Page
 * Target: http://localhost:3000/collection/DECK-1757517559289/manage
 *
 * Goal: Identify ALL user-facing copy including:
 * - Modals, drawers, dialogs
 * - Popovers, tooltips
 * - Button labels, tab names
 * - Table headers, column names
 * - Messages, notifications
 * - Form labels, placeholders
 */

test.describe('Collection Management Page - Comprehensive Copy Audit', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('http://localhost:3000/collection/DECK-1757517559289/manage');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(2000);
  });

  test('Audit 1: Capture all visible static copy on page load', async ({ page }) => {
    console.log('\n=== STATIC PAGE COPY AUDIT ===\n');

    // Page title and headers
    const pageTitle = await page.locator('h1').first().textContent();
    console.log('Page Title:', pageTitle);

    // All headers (h1-h6)
    const headers = await page.locator('h1, h2, h3, h4, h5, h6').allTextContents();
    console.log('\nHeaders:', headers);

    // All buttons
    const buttons = await page.locator('button').allTextContents();
    console.log('\nButtons:', buttons.filter(b => b.trim()));

    // All tabs
    const tabs = await page.locator('[role="tab"]').allTextContents();
    console.log('\nTabs:', tabs);

    // All links
    const links = await page.locator('a').allTextContents();
    console.log('\nLinks:', links.filter(l => l.trim()));

    // Table headers (if any)
    const tableHeaders = await page.locator('th, .bp5-table-header, .bp6-table-header').allTextContents();
    console.log('\nTable Headers:', tableHeaders.filter(h => h.trim()));

    // Labels
    const labels = await page.locator('label').allTextContents();
    console.log('\nForm Labels:', labels.filter(l => l.trim()));
  });

  test('Audit 2: Find and analyze all action buttons in table', async ({ page }) => {
    console.log('\n=== TABLE ACTION BUTTONS AUDIT ===\n');

    // Find the Blueprint table
    const table = await page.locator('.bp6-table-container, .bp5-table-container').first();

    if (await table.count() > 0) {
      console.log('Table found');

      // Get all buttons within table cells
      const cellButtons = await table.locator('button').all();
      console.log(`Found ${cellButtons.length} buttons in table`);

      // Get button attributes
      for (let i = 0; i < Math.min(cellButtons.length, 10); i++) {
        const btn = cellButtons[i];
        const text = await btn.textContent();
        const ariaLabel = await btn.getAttribute('aria-label');
        const title = await btn.getAttribute('title');
        const icon = await btn.locator('svg').count();

        console.log(`\nButton ${i}:`, {
          text: text?.trim() || '(empty)',
          ariaLabel,
          title,
          hasIcon: icon > 0
        });
      }
    }
  });

  test('Audit 3: Open modals/drawers and capture all copy', async ({ page }) => {
    console.log('\n=== MODAL/DRAWER DISCOVERY ===\n');

    // Strategy: Click action buttons in table to open modals
    const table = await page.locator('.bp6-table-container, .bp5-table-container').first();

    if (await table.count() > 0) {
      // Get first few rows
      const rows = await table.locator('.bp6-table-cell, .bp5-table-cell').all();
      console.log(`Found ${rows.length} table cells`);

      // Try clicking health icons (Cell 7 based on previous analysis)
      const healthIcons = await page.locator('button[aria-label*="health"], button[title*="health"], svg[data-icon*="heart"]').all();

      if (healthIcons.length > 0) {
        console.log(`\nFound ${healthIcons.length} health-related buttons`);

        // Click first health icon
        console.log('\nClicking first health icon...');
        await healthIcons[0].click();
        await page.waitForTimeout(1000);

        // Check if modal/drawer opened
        const modal = page.locator('.bp5-dialog, .bp6-dialog, .bp5-drawer, .bp6-drawer, [role="dialog"]').first();

        if (await modal.isVisible()) {
          console.log('\n✅ MODAL/DRAWER OPENED\n');

          // Capture modal title
          const modalTitle = await modal.locator('h1, h2, h3, h4, h5, h6, .bp5-heading, .bp6-heading').first().textContent();
          console.log('Modal Title:', modalTitle);

          // Capture all text in modal
          const modalText = await modal.allTextContents();
          console.log('\nAll Modal Text:', modalText.filter(t => t.trim()));

          // Capture all buttons in modal
          const modalButtons = await modal.locator('button').allTextContents();
          console.log('\nModal Buttons:', modalButtons.filter(b => b.trim()));

          // Capture all tabs in modal
          const modalTabs = await modal.locator('[role="tab"]').allTextContents();
          console.log('\nModal Tabs:', modalTabs);

          // Capture all form labels in modal
          const modalLabels = await modal.locator('label').allTextContents();
          console.log('\nModal Form Labels:', modalLabels.filter(l => l.trim()));

          // Capture all placeholders
          const inputs = await modal.locator('input, textarea').all();
          const placeholders = [];
          for (const input of inputs) {
            const placeholder = await input.getAttribute('placeholder');
            if (placeholder) placeholders.push(placeholder);
          }
          console.log('\nModal Placeholders:', placeholders);

          // Check for tabs and click through them
          if (modalTabs.length > 0) {
            console.log('\n--- Analyzing Modal Tabs ---');

            for (let i = 0; i < modalTabs.length; i++) {
              console.log(`\n=== Tab ${i + 1}: ${modalTabs[i]} ===`);

              const tabButton = await modal.locator('[role="tab"]').nth(i);
              await tabButton.click();
              await page.waitForTimeout(500);

              // Capture tab panel content
              const tabPanel = await modal.locator('[role="tabpanel"]').first();
              const tabText = await tabPanel.allTextContents();
              console.log('Tab Panel Text:', tabText.filter(t => t.trim()));

              const tabButtons = await tabPanel.locator('button').allTextContents();
              console.log('Tab Panel Buttons:', tabButtons.filter(b => b.trim()));

              const tabLabels = await tabPanel.locator('label').allTextContents();
              console.log('Tab Panel Labels:', tabLabels.filter(l => l.trim()));
            }
          }

          // Take screenshot
          await page.screenshot({ path: 'modal-copy-audit.png', fullPage: true });
          console.log('\n📸 Screenshot saved: modal-copy-audit.png');

          // Close modal
          const closeButton = await modal.locator('button[aria-label*="Close"], button[aria-label*="close"], .bp5-dialog-close-button, .bp6-dialog-close-button').first();
          if (await closeButton.isVisible()) {
            await closeButton.click();
            await page.waitForTimeout(500);
          }
        }
      }
    }
  });

  test('Audit 4: Scan for popovers and tooltips', async ({ page }) => {
    console.log('\n=== POPOVER/TOOLTIP AUDIT ===\n');

    // Find all elements with tooltips
    const tooltipElements = await page.locator('[title], [data-tooltip], [aria-label]').all();
    console.log(`Found ${tooltipElements.length} elements with potential tooltips`);

    // Sample first 20
    for (let i = 0; i < Math.min(tooltipElements.length, 20); i++) {
      const el = tooltipElements[i];
      const title = await el.getAttribute('title');
      const tooltip = await el.getAttribute('data-tooltip');
      const ariaLabel = await el.getAttribute('aria-label');

      if (title || tooltip || ariaLabel) {
        console.log(`\nElement ${i}:`, {
          title,
          tooltip,
          ariaLabel,
          tagName: await el.evaluate(node => node.tagName)
        });
      }
    }

    // Try hovering over elements to trigger popovers
    const hoverTargets = await page.locator('button[title], [data-popover-target]').all();

    if (hoverTargets.length > 0) {
      console.log(`\nHovering over ${Math.min(hoverTargets.length, 3)} elements to trigger popovers...`);

      for (let i = 0; i < Math.min(hoverTargets.length, 3); i++) {
        await hoverTargets[i].hover();
        await page.waitForTimeout(500);

        // Check for visible popover
        const popover = page.locator('.bp5-popover, .bp6-popover, [role="tooltip"]').first();
        if (await popover.isVisible()) {
          const popoverText = await popover.textContent();
          console.log(`\nPopover ${i} text:`, popoverText);
        }
      }
    }
  });

  test('Audit 5: Comprehensive copy extraction with interaction', async ({ page }) => {
    console.log('\n=== COMPREHENSIVE INTERACTIVE COPY AUDIT ===\n');

    const allCopy = {
      pageElements: {},
      modals: [],
      tooltips: [],
      messages: []
    };

    // 1. Capture page-level copy
    allCopy.pageElements = {
      title: await page.locator('h1').first().textContent(),
      buttons: await page.locator('button').allTextContents(),
      tabs: await page.locator('[role="tab"]').allTextContents(),
      labels: await page.locator('label').allTextContents(),
      tableHeaders: await page.locator('th, [class*="table-header"]').allTextContents()
    };

    // 2. Find and interact with ALL clickable elements
    const clickableElements = await page.locator('button:visible, [role="button"]:visible').all();
    console.log(`\nFound ${clickableElements.length} clickable elements`);

    // Try clicking first 10 elements to discover modals/drawers
    for (let i = 0; i < Math.min(clickableElements.length, 10); i++) {
      try {
        console.log(`\nAttempting to click element ${i}...`);
        await clickableElements[i].click({ timeout: 1000 });
        await page.waitForTimeout(500);

        // Check for newly opened modal/drawer
        const dialog = page.locator('[role="dialog"]:visible, .bp5-dialog:visible, .bp6-dialog:visible, .bp5-drawer:visible, .bp6-drawer:visible').first();

        if (await dialog.isVisible({ timeout: 1000 })) {
          console.log(`✅ Dialog opened by element ${i}`);

          const modalCopy = {
            trigger: await clickableElements[i].textContent(),
            title: await dialog.locator('h1, h2, h3, h4, h5, h6').first().textContent().catch(() => ''),
            allText: await dialog.allTextContents(),
            buttons: await dialog.locator('button').allTextContents(),
            tabs: await dialog.locator('[role="tab"]').allTextContents(),
            labels: await dialog.locator('label').allTextContents(),
            placeholders: []
          };

          // Get placeholders
          const inputs = await dialog.locator('input, textarea').all();
          for (const input of inputs) {
            const placeholder = await input.getAttribute('placeholder');
            if (placeholder) modalCopy.placeholders.push(placeholder);
          }

          allCopy.modals.push(modalCopy);

          console.log('Modal Copy:', JSON.stringify(modalCopy, null, 2));

          // Close modal
          await page.keyboard.press('Escape');
          await page.waitForTimeout(500);
        }
      } catch (error) {
        // Element not clickable or interaction failed, continue
      }
    }

    // Save comprehensive audit results
    console.log('\n\n=== FINAL COMPREHENSIVE AUDIT RESULTS ===\n');
    console.log(JSON.stringify(allCopy, null, 2));
  });
});
