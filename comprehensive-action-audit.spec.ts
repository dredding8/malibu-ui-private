import { test, expect } from '@playwright/test';
import * as fs from 'fs';
import * as path from 'path';

/**
 * Comprehensive Action Audit - Find ALL Buttons and Their Purposes
 *
 * Ruthless PM wants to know: What are those 200 buttons?
 */

test.describe('Comprehensive Action Audit', () => {
  test('Catalog all buttons with purposes and screenshots', async ({ page }) => {
    await page.goto('http://localhost:3000/collection/DECK-1757517559289/manage');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(2000);

    console.log('\n=== COMPREHENSIVE BUTTON AUDIT ===\n');

    // Create output directory
    const auditDir = 'action-audit';
    if (!fs.existsSync(auditDir)) {
      fs.mkdirSync(auditDir, { recursive: true });
    }

    // Initialize audit log
    const auditLog: any[] = [];

    // Get ALL visible buttons
    const buttons = await page.locator('button:visible').all();
    console.log(`\nTotal visible buttons found: ${buttons.length}\n`);

    // FIRST: Categorize buttons by location
    const categories = {
      navbar: [] as any[],
      pageHeader: [] as any[],
      tableHeader: [] as any[],
      tableRow: [] as any[],
      tabs: [] as any[],
      other: [] as any[]
    };

    for (let i = 0; i < buttons.length; i++) {
      const btn = buttons[i];

      // Get button properties
      const text = await btn.textContent().catch(() => '');
      const title = await btn.getAttribute('title').catch(() => null);
      const ariaLabel = await btn.getAttribute('aria-label').catch(() => null);
      const className = await btn.getAttribute('class').catch(() => '');
      const testId = await btn.getAttribute('data-testid').catch(() => null);

      // Determine location
      const boundingBox = await btn.boundingBox();
      const y = boundingBox?.y || 0;

      let category = 'other';
      if (className.includes('nav') || y < 100) {
        category = 'navbar';
      } else if (y < 200) {
        category = 'pageHeader';
      } else if (className.includes('table') || className.includes('bp6-table')) {
        category = 'tableRow';
      } else if (className.includes('tab')) {
        category = 'tabs';
      }

      const buttonInfo = {
        index: i,
        text: text?.trim() || '(empty)',
        title,
        ariaLabel,
        testId,
        className,
        category,
        y: Math.round(y)
      };

      categories[category].push(buttonInfo);
      auditLog.push(buttonInfo);
    }

    // REPORT BY CATEGORY
    console.log('='.repeat(80));
    console.log('BUTTONS BY CATEGORY');
    console.log('='.repeat(80));

    Object.entries(categories).forEach(([cat, btns]) => {
      if (btns.length > 0) {
        console.log(`\n### ${cat.toUpperCase()} (${btns.length} buttons)`);
        btns.slice(0, 10).forEach((btn: any) => {
          console.log(`  [${btn.index}] ${btn.text} | title: "${btn.title}" | aria: "${btn.ariaLabel}"`);
        });
        if (btns.length > 10) {
          console.log(`  ... and ${btns.length - 10} more`);
        }
      }
    });

    // DEEP DIVE: Table row buttons (the mystery 150+)
    console.log('\n\n' + '='.repeat(80));
    console.log('TABLE ROW ACTIONS - DETAILED ANALYSIS');
    console.log('='.repeat(80));

    const tableButtons = categories.tableRow;
    console.log(`\nTotal table row buttons: ${tableButtons.length}`);

    // Group by title/aria-label to find patterns
    const patternMap = new Map<string, number>();
    tableButtons.forEach((btn: any) => {
      const key = btn.title || btn.ariaLabel || btn.text || 'unknown';
      patternMap.set(key, (patternMap.get(key) || 0) + 1);
    });

    console.log('\nButton Patterns (grouped by title/label):');
    Array.from(patternMap.entries())
      .sort((a, b) => b[1] - a[1])
      .forEach(([pattern, count]) => {
        console.log(`  ${count}x - "${pattern}"`);
      });

    // SAMPLE: Click first button of each pattern to see what happens
    console.log('\n\n' + '='.repeat(80));
    console.log('INTERACTION TEST - Clicking Each Pattern');
    console.log('='.repeat(80));

    const testedPatterns = new Set<string>();

    for (const btnInfo of tableButtons.slice(0, 20)) {
      const pattern = btnInfo.title || btnInfo.ariaLabel || btnInfo.text || 'unknown';

      // Only test each pattern once
      if (testedPatterns.has(pattern)) continue;
      testedPatterns.add(pattern);

      console.log(`\n--- Testing: "${pattern}" ---`);

      try {
        const btn = buttons[btnInfo.index];

        // Highlight button
        await btn.evaluate(node => {
          (node as HTMLElement).style.border = '3px solid red';
          (node as HTMLElement).style.boxShadow = '0 0 10px red';
        });

        // Screenshot button
        await page.screenshot({
          path: path.join(auditDir, `button-${btnInfo.index}-highlighted.png`),
          fullPage: false
        });

        // Click it
        await btn.click({ timeout: 2000 });
        await page.waitForTimeout(800);

        // Check what happened
        const modal = page.locator('[role="dialog"]:visible, .bp5-dialog:visible, .bp6-dialog:visible').first();
        const popover = page.locator('.bp5-popover:visible, .bp6-popover:visible').first();
        const drawer = page.locator('.bp5-drawer:visible, .bp6-drawer:visible').first();

        let interaction = 'No visible change';

        if (await modal.isVisible({ timeout: 1000 })) {
          const modalTitle = await modal.locator('h1, h2, h3, h4, h5, h6').first().textContent().catch(() => 'Untitled Modal');
          interaction = `✅ Opens MODAL: "${modalTitle}"`;

          await page.screenshot({
            path: path.join(auditDir, `modal-${pattern.replace(/[^a-z0-9]/gi, '_')}.png`),
            fullPage: true
          });

          // Close modal
          await page.keyboard.press('Escape');
          await page.waitForTimeout(500);
        } else if (await popover.isVisible({ timeout: 500 })) {
          const popoverText = await popover.textContent();
          interaction = `✅ Opens POPOVER: "${popoverText?.substring(0, 50)}..."`;

          await page.screenshot({
            path: path.join(auditDir, `popover-${pattern.replace(/[^a-z0-9]/gi, '_')}.png`)
          });

          // Close popover
          await page.keyboard.press('Escape');
        } else if (await drawer.isVisible({ timeout: 500 })) {
          interaction = `✅ Opens DRAWER`;

          await page.screenshot({
            path: path.join(auditDir, `drawer-${pattern.replace(/[^a-z0-9]/gi, '_')}.png`),
            fullPage: true
          });

          // Close drawer
          await page.keyboard.press('Escape');
        }

        console.log(`  Result: ${interaction}`);

        // Remove highlight
        await btn.evaluate(node => {
          (node as HTMLElement).style.border = '';
          (node as HTMLElement).style.boxShadow = '';
        });

      } catch (error) {
        console.log(`  Result: ❌ Failed to interact (${error})`);
      }
    }

    // SAVE AUDIT LOG
    fs.writeFileSync(
      path.join(auditDir, 'full-audit-log.json'),
      JSON.stringify(auditLog, null, 2)
    );

    console.log('\n\n' + '='.repeat(80));
    console.log('AUDIT COMPLETE');
    console.log('='.repeat(80));
    console.log(`\nTotal buttons: ${buttons.length}`);
    console.log(`Screenshots saved to: ${auditDir}/`);
    console.log(`Full log: ${auditDir}/full-audit-log.json`);
  });

  test('Identify all tooltips and their targets', async ({ page }) => {
    await page.goto('http://localhost:3000/collection/DECK-1757517559289/manage');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(2000);

    console.log('\n=== TOOLTIP INVENTORY ===\n');

    // Get all elements with title attributes
    const tooltipElements = await page.locator('[title]').evaluateAll(elements =>
      elements.map(el => ({
        tag: el.tagName,
        title: el.getAttribute('title'),
        text: (el as HTMLElement).innerText?.substring(0, 30) || '',
        class: el.className
      }))
    );

    console.log(`Found ${tooltipElements.length} elements with tooltips\n`);

    // Group by tooltip text
    const tooltipGroups = new Map<string, number>();
    tooltipElements.forEach(el => {
      const title = el.title || '';
      tooltipGroups.set(title, (tooltipGroups.get(title) || 0) + 1);
    });

    console.log('Unique Tooltips:\n');
    Array.from(tooltipGroups.entries())
      .sort((a, b) => b[1] - a[1])
      .forEach(([tooltip, count]) => {
        if (tooltip) {
          console.log(`  ${count}x - "${tooltip}"`);
        }
      });
  });

  test('Extract all visible text content by region', async ({ page }) => {
    await page.goto('http://localhost:3000/collection/DECK-1757517559289/manage');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(2000);

    console.log('\n=== TEXT CONTENT BY REGION ===\n');

    // Page title area
    const pageTitle = await page.locator('h1').first().textContent();
    console.log('PAGE TITLE:', pageTitle);

    // Tab names
    const tabs = await page.locator('[role="tab"]').allTextContents();
    console.log('\nTABS:', tabs);

    // Table column headers
    const headers = await page.locator('[class*="bp6-table"] [class*="header"], th').evaluateAll(elements =>
      elements.map(el => (el as HTMLElement).innerText?.replace(/Press down to drag/g, '').trim()).filter(Boolean)
    );
    console.log('\nTABLE HEADERS:', headers);

    // All button text
    const buttons = await page.locator('button').evaluateAll(elements =>
      [...new Set(elements.map(el => (el as HTMLElement).innerText?.trim()).filter(Boolean))]
    );
    console.log('\nUNIQUE BUTTON TEXT:', buttons);
  });
});
