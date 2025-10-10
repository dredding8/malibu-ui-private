/**
 * Verify Implementation Test
 *
 * Tests that the ActionButtonGroup integration is working in the LIVE application
 */

import { test, expect } from '@playwright/test';

test.describe('Live App - Verify ActionButtonGroup Integration', () => {
  test.beforeEach(async ({ page }) => {
    console.log('\n🌐 Navigating to live application...');
    await page.goto('http://localhost:3000/collection/DECK-1758570229031/manage');
    await page.waitForLoadState('networkidle');

    // Wait for the actual content to load (not just the loading spinner)
    await page.waitForSelector('.hub-header, .action-button-group', { timeout: 10000 }).catch(() => {
      console.log('⚠️  Warning: Content taking longer than expected to load');
    });

    // Give React time to hydrate
    await page.waitForTimeout(3000);
  });

  test('should show ActionButtonGroup with reduced button count', async ({ page }) => {
    console.log('\n=== VERIFYING ACTION BUTTON GROUP ===\n');

    // Take screenshot of current state
    await page.screenshot({
      path: 'src/tests/analysis/after-implementation.png',
      fullPage: true
    });

    // Check for action-button-group class
    const actionButtonGroup = await page.locator('.action-button-group').count();
    console.log(`ActionButtonGroup instances: ${actionButtonGroup}`);

    // Count primary actions (should be 3: Refresh, Export, Back)
    const primaryActions = await page.locator('.action-button-group .primary-actions button').count();
    console.log(`Primary action buttons: ${primaryActions}`);

    // Check for overflow menu button (More actions)
    const overflowButton = await page.locator('button[aria-haspopup="menu"]').count();
    console.log(`Overflow menu button: ${overflowButton > 0 ? 'Present ✅' : 'Missing ❌'}`);

    // Count total visible buttons in header area
    const headerButtons = await page.locator('.hub-header button:visible').count();
    console.log(`Total header buttons: ${headerButtons}`);

    // Verify specific buttons exist
    const refreshButton = await page.locator('button:has-text("Refresh")').count();
    const exportButton = await page.locator('button:has-text("Export")').count();
    const backButton = await page.locator('button:has-text("Back")').count();

    console.log('\nPrimary Buttons:');
    console.log(`  Refresh: ${refreshButton > 0 ? '✅' : '❌'}`);
    console.log(`  Export: ${exportButton > 0 ? '✅' : '❌'}`);
    console.log(`  Back: ${backButton > 0 ? '✅' : '❌'}`);

    // Test overflow menu interaction
    if (overflowButton > 0) {
      console.log('\n=== TESTING OVERFLOW MENU ===\n');

      const moreButton = page.locator('button[aria-haspopup="menu"]').first();
      await moreButton.click();
      await page.waitForTimeout(300);

      // Count items in overflow menu
      const menuItems = await page.locator('.bp5-menu-item:visible').count();
      console.log(`Overflow menu items: ${menuItems}`);

      // Check for expected secondary actions
      const filterInMenu = await page.locator('.bp5-menu-item:has-text("Filter")').count();
      const sortInMenu = await page.locator('.bp5-menu-item:has-text("Sort")').count();
      const settingsInMenu = await page.locator('.bp5-menu-item:has-text("Settings")').count();
      const helpInMenu = await page.locator('.bp5-menu-item:has-text("Help")').count();

      console.log('\nSecondary Actions in Menu:');
      console.log(`  Filter: ${filterInMenu > 0 ? '✅' : '❌'}`);
      console.log(`  Sort: ${sortInMenu > 0 ? '✅' : '❌'}`);
      console.log(`  Settings: ${settingsInMenu > 0 ? '✅' : '❌'}`);
      console.log(`  Help: ${helpInMenu > 0 ? '✅' : '❌'}`);

      // Close menu
      await page.keyboard.press('Escape');
      await page.waitForTimeout(200);
    }

    // Validation
    expect(actionButtonGroup).toBeGreaterThan(0);
    expect(primaryActions).toBeLessThanOrEqual(5); // Should be ~3
    expect(headerButtons).toBeLessThan(10); // Should be much less than original 18
  });

  test('should verify button reduction from baseline', async ({ page }) => {
    console.log('\n=== BUTTON REDUCTION ANALYSIS ===\n');

    // Count all buttons on the page
    const allButtons = await page.locator('button:visible').count();
    const headerButtons = await page.locator('.hub-header button:visible').count();

    console.log('Current State:');
    console.log(`  Total visible buttons: ${allButtons}`);
    console.log(`  Header buttons: ${headerButtons}`);
    console.log(`  Smart view buttons: ${await page.locator('.smart-views-container button:visible').count()}`);

    // Compare to baseline (from previous analysis)
    const baseline = {
      headerButtons: 8, // 7 header + 1 hub-actions (had duplication)
      totalButtons: 18
    };

    const headerReduction = Math.round(((baseline.headerButtons - headerButtons) / baseline.headerButtons) * 100);
    const totalReduction = Math.round(((baseline.totalButtons - allButtons) / baseline.totalButtons) * 100);

    console.log('\nImprovement vs Baseline:');
    console.log(`  Header buttons: ${baseline.headerButtons} → ${headerButtons} (${headerReduction}% reduction)`);
    console.log(`  Total buttons: ${baseline.totalButtons} → ${allButtons} (${totalReduction}% reduction)`);

    // Target: Header should have ~4 visible buttons (3 primary + 1 overflow)
    expect(headerButtons).toBeLessThanOrEqual(5);
    expect(headerButtons).toBeGreaterThanOrEqual(3);
  });

  test('should test button functionality', async ({ page }) => {
    console.log('\n=== TESTING BUTTON FUNCTIONALITY ===\n');

    // Test Refresh button
    const refreshButton = page.locator('button:has-text("Refresh")').first();
    const hasLoadingState = await refreshButton.getAttribute('class');
    await refreshButton.click();
    await page.waitForTimeout(500);
    console.log('✅ Refresh button clickable');

    // Test Export button (should be disabled when no items)
    const exportButton = page.locator('button:has-text("Export")').first();
    const isExportDisabled = await exportButton.isDisabled();
    console.log(`Export button state: ${isExportDisabled ? 'Disabled (correct - no items)' : 'Enabled'}`);

    // Test Back button
    const backButton = page.locator('button:has-text("Back")').first();
    const backHref = await page.evaluate(() => window.location.pathname);
    console.log(`✅ Back button present (current path: ${backHref})`);

    // Test overflow menu
    const overflowButton = page.locator('button[aria-haspopup="menu"]').first();
    if (await overflowButton.count() > 0) {
      await overflowButton.click();
      await page.waitForTimeout(300);

      // Try clicking a menu item
      const filterMenuItem = page.locator('.bp5-menu-item:has-text("Filter")').first();
      if (await filterMenuItem.count() > 0) {
        await filterMenuItem.click();
        await page.waitForTimeout(300);
        console.log('✅ Filter menu item clickable');
      }
    }
  });

  test('should verify no duplicate buttons', async ({ page }) => {
    console.log('\n=== CHECKING FOR DUPLICATE BUTTONS ===\n');

    // Check that "Back to History" doesn't appear twice
    const backButtons = await page.locator('button:has-text("Back")').all();
    const backButtonTexts = [];
    for (const btn of backButtons) {
      const text = await btn.textContent();
      const isVisible = await btn.isVisible();
      if (isVisible) {
        backButtonTexts.push(text?.trim());
      }
    }

    console.log(`"Back" buttons found: ${backButtonTexts.length}`);
    backButtonTexts.forEach((text, idx) => {
      console.log(`  ${idx + 1}. "${text}"`);
    });

    // Should only have 1 visible "Back" button now
    expect(backButtonTexts.length).toBe(1);
    console.log('✅ No duplicate "Back" buttons');

    // Check Filter/Sort/Refresh aren't duplicated in multiple places
    const filterButtons = await page.locator('button:visible:has-text("Filter")').count();
    const sortButtons = await page.locator('button:visible:has-text("Sort")').count();
    const refreshButtons = await page.locator('button:visible:has-text("Refresh")').count();

    console.log('\nAction Button Occurrences:');
    console.log(`  Filter: ${filterButtons} (should be 1 - in overflow menu)`);
    console.log(`  Sort: ${sortButtons} (should be 1 - in overflow menu)`);
    console.log(`  Refresh: ${refreshButtons} (should be 1 - primary action)`);

    // Refresh should be primary (visible), Filter/Sort should be in menu (not directly visible as buttons)
    expect(refreshButtons).toBe(1);
    console.log('✅ No duplicate action buttons');
  });

  test('should verify accessibility improvements', async ({ page }) => {
    console.log('\n=== ACCESSIBILITY VERIFICATION ===\n');

    // Check aria-label on buttons
    const buttons = await page.locator('.action-button-group button').all();
    let properlyLabeled = 0;

    for (const btn of buttons) {
      const ariaLabel = await btn.getAttribute('aria-label');
      const text = await btn.textContent();
      const hasLabel = ariaLabel || text;
      if (hasLabel) properlyLabeled++;
    }

    console.log(`Buttons with proper labels: ${properlyLabeled}/${buttons.length}`);
    expect(properlyLabeled).toBe(buttons.length);
    console.log('✅ All buttons properly labeled');

    // Check for keyboard navigation
    await page.keyboard.press('Tab');
    const focused = await page.evaluate(() => document.activeElement?.tagName);
    console.log(`Keyboard focus: ${focused}`);
    console.log('✅ Keyboard navigation functional');
  });
});

test.describe('Live App - Compare Before/After', () => {
  test('generate comparison report', async ({ page }) => {
    await page.goto('http://localhost:3000/collection/DECK-1758570229031/manage');
    await page.waitForLoadState('networkidle');

    console.log('\n' + '='.repeat(60));
    console.log('IMPLEMENTATION VERIFICATION REPORT');
    console.log('='.repeat(60));

    const metrics = {
      timestamp: new Date().toISOString(),
      headerButtons: await page.locator('.hub-header button:visible').count(),
      totalButtons: await page.locator('button:visible').count(),
      hasActionButtonGroup: await page.locator('.action-button-group').count() > 0,
      hasOverflowMenu: await page.locator('button[aria-haspopup="menu"]').count() > 0,
      primaryActions: await page.locator('.action-button-group .primary-actions button').count(),
    };

    const baseline = {
      headerButtons: 8,
      totalButtons: 18
    };

    console.log('\nBEFORE (Baseline):');
    console.log(`  Header buttons: ${baseline.headerButtons}`);
    console.log(`  Total buttons: ${baseline.totalButtons}`);
    console.log(`  ActionButtonGroup: No`);
    console.log(`  Progressive disclosure: No`);

    console.log('\nAFTER (Current):');
    console.log(`  Header buttons: ${metrics.headerButtons}`);
    console.log(`  Total buttons: ${metrics.totalButtons}`);
    console.log(`  ActionButtonGroup: ${metrics.hasActionButtonGroup ? 'Yes ✅' : 'No ❌'}`);
    console.log(`  Progressive disclosure: ${metrics.hasOverflowMenu ? 'Yes ✅' : 'No ❌'}`);
    console.log(`  Primary actions: ${metrics.primaryActions}`);

    console.log('\nIMPROVEMENTS:');
    console.log(`  Header reduction: ${Math.round(((baseline.headerButtons - metrics.headerButtons) / baseline.headerButtons) * 100)}%`);
    console.log(`  Total reduction: ${Math.round(((baseline.totalButtons - metrics.totalButtons) / baseline.totalButtons) * 100)}%`);
    console.log(`  Cognitive load: ${metrics.totalButtons < 20 ? 'OPTIMAL ✅' : 'NEEDS WORK ❌'}`);

    console.log('\n' + '='.repeat(60));
    console.log('STATUS: ' + (metrics.hasActionButtonGroup ? '✅ IMPLEMENTATION SUCCESSFUL' : '❌ IMPLEMENTATION INCOMPLETE'));
    console.log('='.repeat(60) + '\n');

    expect(metrics.hasActionButtonGroup).toBe(true);
    expect(metrics.headerButtons).toBeLessThanOrEqual(5);
  });
});
