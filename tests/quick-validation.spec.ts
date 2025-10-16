/**
 * Quick Validation - Pragmatic inspection of collection management page
 * Tests actual implementation at /collection/TEST-001/manage
 */

import { test, expect } from '@playwright/test';

test.describe('Collection Management Page - Quick Validation', () => {

  test('Page loads and displays content', async ({ page }) => {
    console.log('\n🔍 Quick Validation Starting...\n');

    // Navigate to collection management
    await page.goto('http://localhost:3000/collection/TEST-001/manage');

    // Wait for page to stabilize
    await page.waitForLoadState('domcontentloaded');
    await page.waitForTimeout(2000);

    console.log('✅ Page loaded');

    // Take screenshot
    await page.screenshot({
      path: '.playwright-mcp/validation/collection-page-loaded.png',
      fullPage: true
    });

    console.log('📸 Screenshot captured: collection-page-loaded.png');

    // Check for Blueprint components
    const blueprintElements = await page.locator('[class*="bp5-"]').count();
    console.log(`✅ Blueprint components found: ${blueprintElements}`);

    // Check for tables
    const tables = await page.locator('table').count();
    console.log(`📊 Tables found: ${tables}`);

    // Check for cards
    const cards = await page.locator('.bp5-card').count();
    console.log(`🃏 Cards found: ${cards}`);

    // Check for modals/dialogs
    const dialogs = await page.locator('.bp5-dialog, .bp5-drawer').count();
    console.log(`💬 Dialogs/Drawers: ${dialogs}`);

    // Check for buttons
    const buttons = await page.locator('button').count();
    console.log(`🔘 Buttons found: ${buttons}`);

    // List all headings
    const headings = await page.locator('h1, h2, h3, h4').allTextContents();
    console.log(`\n📝 Page Headings:`);
    headings.forEach((h, i) => console.log(`   ${i + 1}. ${h.trim()}`));

    // Check for interactive elements
    const interactiveCount = await page.locator('button, a, input, select, [role="button"]').count();
    console.log(`\n🎯 Total interactive elements: ${interactiveCount}`);

    expect(blueprintElements).toBeGreaterThan(0);
  });

  test('Check for allocation tab structure', async ({ page }) => {
    console.log('\n🔍 Checking Allocation Tab...\n');

    await page.goto('http://localhost:3000/collection/TEST-001/manage');
    await page.waitForLoadState('domcontentloaded');
    await page.waitForTimeout(2000);

    // Look for allocation-related elements
    const allocationText = await page.locator('text=/allocat/i').count();
    console.log(`📍 Elements mentioning "allocation": ${allocationText}`);

    // Look for tabs
    const tabs = await page.locator('.bp5-tab, [role="tab"]').count();
    console.log(`📑 Tabs found: ${tabs}`);

    if (tabs > 0) {
      const tabLabels = await page.locator('.bp5-tab, [role="tab"]').allTextContents();
      console.log(`\n📑 Tab Labels:`);
      tabLabels.forEach((label, i) => console.log(`   ${i + 1}. ${label.trim()}`));

      // Try clicking Allocation tab if it exists
      const allocationTab = page.locator('[role="tab"]:has-text("Allocation"), .bp5-tab:has-text("Allocation")');
      if (await allocationTab.count() > 0) {
        console.log('\n🖱️  Clicking Allocation tab...');
        await allocationTab.first().click();
        await page.waitForTimeout(500);

        // Screenshot after clicking
        await page.screenshot({
          path: '.playwright-mcp/validation/allocation-tab-active.png',
          fullPage: true
        });
        console.log('📸 Allocation tab screenshot captured');

        // Check structure
        const tableAfterClick = await page.locator('table').count();
        const cardsAfterClick = await page.locator('.bp5-card').count();
        console.log(`   Tables visible: ${tableAfterClick}`);
        console.log(`   Cards visible: ${cardsAfterClick}`);
      }
    }
  });

  test('Check for side panel implementation', async ({ page }) => {
    console.log('\n🔍 Checking Side Panel...\n');

    await page.goto('http://localhost:3000/collection/TEST-001/manage');
    await page.waitForLoadState('domcontentloaded');
    await page.waitForTimeout(2000);

    // Look for side panel elements
    const sidePanels = await page.locator('[class*="side-panel"], [class*="sidebar"], .bp5-drawer').count();
    console.log(`📐 Side panels found: ${sidePanels}`);

    // Check for split layout
    const layouts = await page.locator('[style*="display: flex"], [style*="grid"]').count();
    console.log(`📏 Flex/Grid layouts: ${layouts}`);

    // Look for resizable elements
    const resizable = await page.locator('[class*="resize"], [class*="splitter"]').count();
    console.log(`↔️  Resizable elements: ${resizable}`);
  });

  test('UX Laws - Quick Check', async ({ page }) => {
    console.log('\n⚖️  UX Laws Quick Check...\n');

    await page.goto('http://localhost:3000/collection/TEST-001/manage');
    await page.waitForLoadState('domcontentloaded');
    await page.waitForTimeout(2000);

    // Hick's Law - Count primary actions
    const primaryButtons = await page.locator('button.bp5-intent-primary, button[class*="primary"]').count();
    console.log(`🎯 Primary action buttons: ${primaryButtons}`);
    console.log(`   Hick's Law: ${primaryButtons <= 7 ? '✅ PASS' : '❌ FAIL'} (≤7 recommended)`);

    // Fitts's Law - Check button sizes
    const allButtons = await page.locator('button:visible').all();
    let smallButtons = 0;

    for (const btn of allButtons.slice(0, 10)) { // Sample first 10
      const box = await btn.boundingBox();
      if (box && (box.width < 44 || box.height < 44)) {
        smallButtons++;
      }
    }

    console.log(`📏 Fitts's Law: ${smallButtons === 0 ? '✅ PASS' : '⚠️  WARNING'} (${smallButtons} buttons < 44x44px)`);

    // Blueprint compliance
    const blueprintTables = await page.locator('.bp5-table, .bp5-table2, .bp5-html-table').count();
    const customTables = await page.locator('table:not([class*="bp5"])').count();

    console.log(`\n📦 Blueprint Compliance:`);
    console.log(`   Blueprint tables: ${blueprintTables}`);
    console.log(`   Custom tables: ${customTables}`);
    console.log(`   ${customTables === 0 ? '✅ PASS' : '⚠️  WARNING'} (Should use Blueprint components)`);
  });

  test('Accessibility - Quick Check', async ({ page }) => {
    console.log('\n♿ Accessibility Quick Check...\n');

    await page.goto('http://localhost:3000/collection/TEST-001/manage');
    await page.waitForLoadState('domcontentloaded');
    await page.waitForTimeout(2000);

    // Check for ARIA labels
    const ariaLabels = await page.locator('[aria-label]').count();
    console.log(`🏷️  Elements with aria-label: ${ariaLabels}`);

    // Check for unlabeled buttons
    const buttons = await page.locator('button').all();
    let unlabeled = 0;

    for (const btn of buttons.slice(0, 20)) { // Sample first 20
      const ariaLabel = await btn.getAttribute('aria-label');
      const textContent = await btn.textContent();

      if (!ariaLabel && (!textContent || textContent.trim().length === 0)) {
        unlabeled++;
      }
    }

    console.log(`🔘 Unlabeled buttons: ${unlabeled}`);
    console.log(`   ${unlabeled === 0 ? '✅ PASS' : '⚠️  WARNING'} (All buttons should have labels)`);

    // Check keyboard navigation
    console.log(`\n⌨️  Testing keyboard navigation...`);
    await page.keyboard.press('Tab');
    await page.waitForTimeout(200);

    const focused = await page.evaluate(() => {
      const el = document.activeElement;
      return {
        tag: el?.tagName,
        hasOutline: window.getComputedStyle(el as Element).outline !== 'none',
        hasShadow: window.getComputedStyle(el as Element).boxShadow !== 'none'
      };
    });

    console.log(`   Focus visible: ${focused.hasOutline || focused.hasShadow ? '✅' : '❌'}`);
  });

  test('Generate summary report', async ({ page }) => {
    console.log('\n📊 VALIDATION SUMMARY\n');
    console.log('='.repeat(60));

    await page.goto('http://localhost:3000/collection/TEST-001/manage');
    await page.waitForLoadState('domcontentloaded');
    await page.waitForTimeout(2000);

    // Comprehensive check
    const summary = {
      blueprintComponents: await page.locator('[class*="bp5-"]').count(),
      tables: await page.locator('table').count(),
      blueprintTables: await page.locator('.bp5-table, .bp5-table2').count(),
      cards: await page.locator('.bp5-card').count(),
      buttons: await page.locator('button').count(),
      primaryButtons: await page.locator('button.bp5-intent-primary').count(),
      tabs: await page.locator('.bp5-tab, [role="tab"]').count(),
      ariaLabels: await page.locator('[aria-label]').count(),
      headings: await page.locator('h1, h2, h3, h4').count(),
    };

    console.log('\n📈 Component Inventory:');
    console.log(`   Blueprint components: ${summary.blueprintComponents}`);
    console.log(`   Total tables: ${summary.tables}`);
    console.log(`   Blueprint tables: ${summary.blueprintTables}`);
    console.log(`   Cards: ${summary.cards}`);
    console.log(`   Buttons: ${summary.buttons}`);
    console.log(`   Primary buttons: ${summary.primaryButtons}`);
    console.log(`   Tabs: ${summary.tabs}`);
    console.log(`   ARIA labels: ${summary.ariaLabels}`);
    console.log(`   Headings: ${summary.headings}`);

    console.log('\n✅ Validation Checks:');
    console.log(`   ${summary.blueprintComponents > 50 ? '✅' : '⚠️ '} Using Blueprint design system`);
    console.log(`   ${summary.blueprintTables > 0 ? '✅' : '⚠️ '} Blueprint tables present`);
    console.log(`   ${summary.primaryButtons <= 7 ? '✅' : '⚠️ '} Hick's Law (≤7 primary actions)`);
    console.log(`   ${summary.ariaLabels > 10 ? '✅' : '⚠️ '} Accessibility labels present`);

    console.log('\n📸 Screenshots saved to: .playwright-mcp/validation/');
    console.log('='.repeat(60));
  });
});
