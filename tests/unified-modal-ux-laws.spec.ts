/**
 * Suite 2: UX Laws Compliance
 * Automated validation against Hick's Law, Fitts's Law, Jakob's Law, and Gestalt Principles
 */

import { test, expect } from '@playwright/test';

test.describe('Unified Modal - UX Laws Compliance', () => {

  test.beforeEach(async ({ page }) => {
    await page.goto('http://localhost:3000/history');
    await page.waitForLoadState('networkidle');

    // Open modal
    const firstRow = page.locator('[data-testid="opportunities-table"] tbody tr').first();
    await firstRow.click();
    await page.waitForSelector('.bp5-dialog', { timeout: 5000 });
  });

  test('Hick\'s Law: Primary actions count ≤7', async ({ page }) => {
    const modal = page.locator('.bp5-dialog');

    // Count all primary interactive elements (buttons, links with significant visual weight)
    const interactiveElements = await page.locator(
      '.bp5-dialog button:visible:not([disabled]), ' +
      '.bp5-dialog [role="button"]:visible, ' +
      '.bp5-dialog a.bp5-button:visible'
    ).count();

    console.log(`\n📊 Hick's Law Analysis:`);
    console.log(`   Primary actions found: ${interactiveElements}`);
    console.log(`   Target: ≤7 actions`);

    if (interactiveElements <= 7) {
      console.log(`   ✅ PASS: Within Hick's Law threshold`);
    } else {
      console.log(`   ❌ FAIL: Exceeds recommended limit by ${interactiveElements - 7}`);

      // List all actions for review
      const actions = await page.locator('.bp5-dialog button:visible').allTextContents();
      console.log(`   Actions detected: ${actions.join(', ')}`);
    }

    expect(interactiveElements).toBeLessThanOrEqual(7);
  });

  test('Fitts\'s Law: Tap targets meet minimum size requirements', async ({ page }) => {
    const modal = page.locator('.bp5-dialog');

    // Get all interactive elements
    const buttons = await modal.locator('button:visible, [role="button"]:visible').all();

    const violations: Array<{label: string, width: number, height: number}> = [];
    const compliant: number[] = [];

    console.log(`\n📊 Fitts's Law Analysis:`);
    console.log(`   Minimum tap target: 44x44px (iOS), 48x48px (Android)`);

    for (const button of buttons) {
      const box = await button.boundingBox();
      const label = await button.getAttribute('aria-label') || await button.textContent() || 'unlabeled';

      if (box) {
        const meetsMinimum = box.width >= 44 && box.height >= 44;

        if (!meetsMinimum) {
          violations.push({
            label: label.trim(),
            width: Math.round(box.width),
            height: Math.round(box.height)
          });
        } else {
          compliant.push(box.width * box.height);
        }
      }
    }

    console.log(`   ✅ Compliant targets: ${compliant.length}`);

    if (violations.length > 0) {
      console.log(`   ❌ Violations found: ${violations.length}`);
      violations.forEach(v => {
        console.log(`      - "${v.label}": ${v.width}x${v.height}px (too small)`);
      });
    } else {
      console.log(`   ✅ PASS: All targets meet minimum size`);
    }

    expect(violations.length).toBe(0);
  });

  test('Fitts\'s Law: Frequently used actions are optimally sized', async ({ page }) => {
    const modal = page.locator('.bp5-dialog');

    // High-frequency actions should be larger
    const frequentActions = [
      'Save', 'Submit', 'Confirm', 'Apply',
      'Add', 'Create', 'Allocate'
    ];

    console.log(`\n📊 Fitts's Law - Action Hierarchy:`);

    for (const action of frequentActions) {
      const button = modal.locator(`button:has-text("${action}")`);

      if (await button.count() > 0) {
        const box = await button.first().boundingBox();
        if (box) {
          const area = Math.round(box.width * box.height);
          console.log(`   "${action}": ${Math.round(box.width)}x${Math.round(box.height)}px (${area}px² area)`);

          // Primary actions should be at least 48x48
          if (box.width >= 48 && box.height >= 48) {
            console.log(`      ✅ Optimal size for frequent action`);
          } else if (box.width >= 44 && box.height >= 44) {
            console.log(`      ⚠️  Meets minimum but could be larger for frequency`);
          }
        }
      }
    }
  });

  test('Jakob\'s Law: Table patterns match Blueprint conventions', async ({ page }) => {
    const modal = page.locator('.bp5-dialog');

    console.log(`\n📊 Jakob's Law - Blueprint Pattern Compliance:`);

    // Check for Blueprint Table2 component
    const blueprintTables = await modal.locator('.bp5-table2, .bp5-html-table').count();
    console.log(`   Blueprint tables found: ${blueprintTables}`);

    if (blueprintTables > 0) {
      console.log(`   ✅ Using standard Blueprint table components`);

      // Check for standard table features
      const hasHeaders = await modal.locator('thead th').count() > 0;
      const hasSortable = await modal.locator('th[role="columnheader"]').count() > 0;

      console.log(`   - Column headers: ${hasHeaders ? '✅' : '❌'}`);
      console.log(`   - Sortable columns: ${hasSortable ? '✅' : '⚠️  Optional'}`);
    } else {
      console.log(`   ⚠️  No Blueprint table components detected`);
    }

    expect(blueprintTables).toBeGreaterThan(0);
  });

  test('Gestalt Principles: Proximity and grouping', async ({ page }) => {
    const modal = page.locator('.bp5-dialog');

    console.log(`\n📊 Gestalt Principles - Visual Grouping:`);

    // Check spacing between sections
    const sections = await modal.locator('[class*="section"], .bp5-dialog-body > div').all();

    if (sections.length >= 2) {
      const spacings: number[] = [];

      for (let i = 0; i < sections.length - 1; i++) {
        const box1 = await sections[i].boundingBox();
        const box2 = await sections[i + 1].boundingBox();

        if (box1 && box2) {
          const spacing = box2.y - (box1.y + box1.height);
          spacings.push(Math.round(spacing));
        }
      }

      console.log(`   Section spacing: ${spacings.join('px, ')}px`);
      console.log(`   Recommended: 16-24px between unrelated sections`);

      const properlySpaced = spacings.filter(s => s >= 16 && s <= 32).length;
      console.log(`   ${properlySpaced}/${spacings.length} sections properly spaced`);

      if (properlySpaced === spacings.length) {
        console.log(`   ✅ PASS: Consistent grouping spacing`);
      }
    }

    // Check table row spacing (related items should be close)
    const tableRows = await modal.locator('tbody tr').all();
    if (tableRows.length >= 2) {
      const row1 = await tableRows[0].boundingBox();
      const row2 = await tableRows[1].boundingBox();

      if (row1 && row2) {
        const rowSpacing = row2.y - (row1.y + row1.height);
        console.log(`   Table row spacing: ${Math.round(rowSpacing)}px`);
        console.log(`   ${rowSpacing < 8 ? '✅ Related items close together' : '⚠️  May be too spaced'}`);
      }
    }
  });

  test('Gestalt Principles: Similarity and consistency', async ({ page }) => {
    const modal = page.locator('.bp5-dialog');

    console.log(`\n📊 Gestalt Principles - Visual Consistency:`);

    // Check button consistency
    const buttons = await modal.locator('button').all();
    const buttonClasses = new Set<string>();

    for (const button of buttons) {
      const className = await button.getAttribute('class') || '';
      const baseClass = className.split(' ')
        .find(c => c.includes('bp5-button') || c.includes('intent'));
      if (baseClass) buttonClasses.add(baseClass);
    }

    console.log(`   Button variants used: ${buttonClasses.size}`);
    console.log(`   Variants: ${Array.from(buttonClasses).join(', ')}`);

    if (buttonClasses.size <= 3) {
      console.log(`   ✅ PASS: Consistent button styling (≤3 variants)`);
    } else {
      console.log(`   ⚠️  Multiple variants may confuse users`);
    }
  });
});
