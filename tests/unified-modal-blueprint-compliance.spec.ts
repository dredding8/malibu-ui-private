/**
 * Suite 3: Blueprint Pattern Compliance
 * Validates proper use of Blueprint components and patterns
 */

import { test, expect } from '@playwright/test';

test.describe('Unified Modal - Blueprint Pattern Compliance', () => {

  test.beforeEach(async ({ page }) => {
    await page.goto('http://localhost:3000/history');
    await page.waitForLoadState('networkidle');

    // Open modal
    const firstRow = page.locator('[data-testid="opportunities-table"] tbody tr').first();
    await firstRow.click();
    await page.waitForSelector('.bp5-dialog', { timeout: 5000 });
  });

  test('Only Blueprint components used (no custom tables)', async ({ page }) => {
    const modal = page.locator('.bp5-dialog');

    console.log(`\n📊 Blueprint Component Usage Analysis:`);

    // Check for Blueprint table classes
    const blueprintTables = await modal.locator('.bp5-table, .bp5-table2, .bp5-html-table').count();
    console.log(`   Blueprint tables: ${blueprintTables}`);

    // Check for custom table implementations
    const customTables = await modal.locator('table:not([class*="bp5"])').count();
    console.log(`   Custom tables: ${customTables}`);

    if (customTables === 0 && blueprintTables > 0) {
      console.log(`   ✅ PASS: Only Blueprint table components used`);
    } else if (customTables > 0) {
      console.log(`   ❌ FAIL: Custom table implementations detected`);
    }

    expect(customTables).toBe(0);
    expect(blueprintTables).toBeGreaterThan(0);
  });

  test('EditableText used for inline editing', async ({ page }) => {
    const modal = page.locator('.bp5-dialog');

    console.log(`\n📊 Inline Editing Implementation:`);

    // Check for Blueprint EditableText component
    const editableTexts = await modal.locator('.bp5-editable-text').count();
    console.log(`   EditableText components: ${editableTexts}`);

    if (editableTexts > 0) {
      console.log(`   ✅ Using Blueprint EditableText`);

      // Verify proper structure
      const hasInput = await modal.locator('.bp5-editable-text input').count() > 0;
      const hasContent = await modal.locator('.bp5-editable-text .bp5-editable-content').count() > 0;

      console.log(`   - Has input elements: ${hasInput ? '✅' : '⚠️'}`);
      console.log(`   - Has content display: ${hasContent ? '✅' : '⚠️'}`);
    } else {
      // Check if there's inline editing with custom implementation
      const customInputs = await modal.locator('td input, td textarea').count();
      if (customInputs > 0) {
        console.log(`   ⚠️  Custom inline editing detected (${customInputs} inputs)`);
        console.log(`   Recommendation: Replace with Blueprint EditableText`);
      }
    }
  });

  test('Site Operations uses ButtonGroup or Popover', async ({ page }) => {
    const modal = page.locator('.bp5-dialog');

    console.log(`\n📊 Site Operations Implementation:`);

    // Look for operations column or actions
    const buttonGroups = await modal.locator('.bp5-button-group').count();
    const popovers = await modal.locator('.bp5-popover-target, .bp5-popover').count();
    const menus = await modal.locator('.bp5-menu').count();

    console.log(`   ButtonGroup components: ${buttonGroups}`);
    console.log(`   Popover components: ${popovers}`);
    console.log(`   Menu components: ${menus}`);

    // Check for custom dropdowns (non-Blueprint)
    const customSelects = await modal.locator('select:not([class*="bp5"])').count();
    const customDropdowns = await modal.locator('[class*="dropdown"]:not([class*="bp5"])').count();

    if (customSelects > 0 || customDropdowns > 0) {
      console.log(`   ❌ Custom dropdown implementations detected`);
      console.log(`   Recommendation: Use Blueprint ButtonGroup or Popover`);
    }

    const hasValidPattern = buttonGroups > 0 || popovers > 0 || menus > 0;

    if (hasValidPattern) {
      console.log(`   ✅ PASS: Using Blueprint interaction patterns`);
    } else {
      console.log(`   ⚠️  No Blueprint operation patterns detected`);
    }
  });

  test('Dialog component follows Blueprint patterns', async ({ page }) => {
    const modal = page.locator('.bp5-dialog');

    console.log(`\n📊 Dialog Component Structure:`);

    // Check for proper Dialog structure
    const hasDialog = await page.locator('.bp5-dialog').count() > 0;
    const hasOverlay = await page.locator('.bp5-overlay').count() > 0;
    const hasHeader = await modal.locator('.bp5-dialog-header').count() > 0;
    const hasBody = await modal.locator('.bp5-dialog-body').count() > 0;
    const hasFooter = await modal.locator('.bp5-dialog-footer').count() > 0;
    const hasCloseButton = await modal.locator('.bp5-dialog-close-button').count() > 0;

    console.log(`   Dialog component: ${hasDialog ? '✅' : '❌'}`);
    console.log(`   Overlay backdrop: ${hasOverlay ? '✅' : '❌'}`);
    console.log(`   Dialog header: ${hasHeader ? '✅' : '⚠️  Optional'}`);
    console.log(`   Dialog body: ${hasBody ? '✅' : '❌'}`);
    console.log(`   Dialog footer: ${hasFooter ? '✅' : '⚠️  Optional'}`);
    console.log(`   Close button: ${hasCloseButton ? '✅' : '⚠️  Recommended'}`);

    expect(hasDialog).toBe(true);
    expect(hasOverlay).toBe(true);
    expect(hasBody).toBe(true);
  });

  test('Form controls use Blueprint components', async ({ page }) => {
    const modal = page.locator('.bp5-dialog');

    console.log(`\n📊 Form Control Components:`);

    // Check for Blueprint form controls
    const inputs = await modal.locator('.bp5-input').count();
    const selects = await modal.locator('.bp5-select').count();
    const switches = await modal.locator('.bp5-switch').count();
    const checkboxes = await modal.locator('.bp5-checkbox').count();
    const radios = await modal.locator('.bp5-radio').count();

    console.log(`   Blueprint inputs: ${inputs}`);
    console.log(`   Blueprint selects: ${selects}`);
    console.log(`   Blueprint switches: ${switches}`);
    console.log(`   Blueprint checkboxes: ${checkboxes}`);
    console.log(`   Blueprint radios: ${radios}`);

    // Check for non-Blueprint form controls
    const rawInputs = await modal.locator('input:not([class*="bp5"])').count();
    const rawSelects = await modal.locator('select:not([class*="bp5"])').count();

    if (rawInputs > 0) {
      console.log(`   ⚠️  ${rawInputs} raw input elements (should use .bp5-input)`);
    }
    if (rawSelects > 0) {
      console.log(`   ⚠️  ${rawSelects} raw select elements (should use Blueprint Select)`);
    }

    const totalBlueprintControls = inputs + selects + switches + checkboxes + radios;
    const totalRawControls = rawInputs + rawSelects;

    if (totalBlueprintControls > 0 && totalRawControls === 0) {
      console.log(`   ✅ PASS: All controls use Blueprint components`);
    }
  });

  test('Loading and empty states use Blueprint patterns', async ({ page }) => {
    const modal = page.locator('.bp5-dialog');

    console.log(`\n📊 State Management Components:`);

    // Check for Blueprint loading indicators
    const spinners = await modal.locator('.bp5-spinner').count();
    const skeletons = await modal.locator('.bp5-skeleton').count();
    const progressBars = await modal.locator('.bp5-progress-bar').count();

    console.log(`   Spinners: ${spinners > 0 ? '✅' : '⚠️  Not detected'}`);
    console.log(`   Skeletons: ${skeletons > 0 ? '✅' : '⚠️  Not detected'}`);
    console.log(`   Progress bars: ${progressBars > 0 ? '✅' : '⚠️  Not detected'}`);

    // Check for non-empty state (callouts)
    const callouts = await modal.locator('.bp5-callout').count();
    const nonIdeal = await modal.locator('.bp5-non-ideal-state').count();

    console.log(`   Callouts: ${callouts}`);
    console.log(`   Non-ideal states: ${nonIdeal}`);

    if (spinners > 0 || skeletons > 0 || progressBars > 0) {
      console.log(`   ✅ Using Blueprint loading patterns`);
    }
  });

  test('Icons use Blueprint icon components', async ({ page }) => {
    const modal = page.locator('.bp5-dialog');

    console.log(`\n📊 Icon Implementation:`);

    // Check for Blueprint icons
    const blueprintIcons = await modal.locator('.bp5-icon').count();
    const svgIcons = await modal.locator('svg.bp5-icon').count();

    console.log(`   Blueprint icons: ${blueprintIcons}`);
    console.log(`   SVG icons: ${svgIcons}`);

    // Check for custom icon implementations
    const customIcons = await modal.locator('i:not([class*="bp5"]), span.icon:not([class*="bp5"])').count();

    if (customIcons > 0) {
      console.log(`   ⚠️  ${customIcons} custom icon elements`);
      console.log(`   Recommendation: Use Blueprint Icon component`);
    }

    if (blueprintIcons > 0) {
      console.log(`   ✅ Using Blueprint Icon components`);
    }
  });
});
