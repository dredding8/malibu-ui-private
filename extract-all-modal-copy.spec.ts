import { test, expect } from '@playwright/test';

/**
 * Extract ALL copy from modals/drawers/popovers on Collection Management page
 * Focus: http://localhost:3000/collection/DECK-1757517559289/manage
 */

test.describe('Extract All Modal Copy', () => {
  test('Find and extract all copy from override modal', async ({ page }) => {
    await page.goto('http://localhost:3000/collection/DECK-1757517559289/manage');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(2000);

    console.log('\n=== FINDING OVERRIDE MODAL ===\n');

    // Find table with opportunities
    const table = await page.locator('.bp6-table-container').first();
    await expect(table).toBeVisible();

    // Find all buttons with "Override" in title/tooltip
    const overrideButtons = await page.locator('button[title*="Override"], button[title*="override"]').all();
    console.log(`Found ${overrideButtons.length} override buttons`);

    if (overrideButtons.length > 0) {
      // Click first override button
      console.log('\nClicking first override button...');
      await overrideButtons[0].click();
      await page.waitForTimeout(1500);

      // Check for modal
      const modal = page.locator('[role="dialog"]:visible').first();

      if (await modal.isVisible()) {
        console.log('\n✅ OVERRIDE MODAL OPENED\n');
        console.log('==================================================');

        // 1. MODAL TITLE
        const modalTitle = await modal.locator('h1, h2, h3, h4, [class*="dialog-header"]').first().textContent();
        console.log('\n📋 MODAL TITLE:');
        console.log(`   "${modalTitle}"`);

        // 2. ALL TAB NAMES
        const tabs = await modal.locator('[role="tab"]').all();
        console.log('\n📑 TAB NAMES:');
        for (let i = 0; i < tabs.length; i++) {
          const tabText = await tabs[i].textContent();
          console.log(`   Tab ${i + 1}: "${tabText?.trim()}"`);
        }

        // 3. ITERATE THROUGH EACH TAB
        for (let i = 0; i < tabs.length; i++) {
          await tabs[i].click();
          await page.waitForTimeout(800);

          const tabPanel = modal.locator('[role="tabpanel"]').first();
          const tabName = await tabs[i].textContent();

          console.log(`\n\n${'='.repeat(60)}`);
          console.log(`TAB ${i + 1}: ${tabName?.trim().toUpperCase()}`);
          console.log('='.repeat(60));

          // Headers in tab
          const headers = await tabPanel.locator('h1, h2, h3, h4, h5, h6, strong').allTextContents();
          if (headers.length > 0) {
            console.log('\n  📌 HEADERS/TITLES:');
            headers.forEach(h => {
              if (h.trim()) console.log(`     • "${h.trim()}"`);
            });
          }

          // All form labels
          const labels = await tabPanel.locator('label').allTextContents();
          if (labels.length > 0) {
            console.log('\n  🏷️  FORM LABELS:');
            labels.forEach(l => {
              if (l.trim()) console.log(`     • "${l.trim()}"`);
            });
          }

          // All buttons
          const buttons = await tabPanel.locator('button').allTextContents();
          if (buttons.length > 0) {
            console.log('\n  🔘 BUTTONS:');
            buttons.forEach(b => {
              if (b.trim()) console.log(`     • "${b.trim()}"`);
            });
          }

          // All placeholders
          const inputs = await tabPanel.locator('input, textarea, select').all();
          console.log('\n  📝 INPUT PLACEHOLDERS & HELPER TEXT:');
          for (const input of inputs) {
            const placeholder = await input.getAttribute('placeholder');
            const ariaLabel = await input.getAttribute('aria-label');
            const id = await input.getAttribute('id');

            if (placeholder) console.log(`     • Placeholder: "${placeholder}"`);
            if (ariaLabel) console.log(`     • Aria-label: "${ariaLabel}"`);

            // Find associated helper text
            if (id) {
              const helperText = await tabPanel.locator(`[class*="helper"], [class*="hint"]`).allTextContents();
              helperText.forEach(h => {
                if (h.trim() && h.length > 5) console.log(`     • Helper: "${h.trim()}"`);
              });
            }
          }

          // Callouts/alerts
          const callouts = await tabPanel.locator('[class*="callout"], [role="alert"]').allTextContents();
          if (callouts.length > 0) {
            console.log('\n  ⚠️  CALLOUTS/ALERTS:');
            callouts.forEach(c => {
              if (c.trim() && c.length > 10) console.log(`     "${c.trim().substring(0, 100)}..."`);
            });
          }

          // All paragraphs
          const paragraphs = await tabPanel.locator('p').allTextContents();
          if (paragraphs.length > 0) {
            console.log('\n  📄 DESCRIPTIONS/PARAGRAPHS:');
            paragraphs.forEach(p => {
              if (p.trim() && p.length > 10) console.log(`     "${p.trim()}"`);
            });
          }

          // Select options
          const selects = await tabPanel.locator('select').all();
          if (selects.length > 0) {
            console.log('\n  📋 DROPDOWN OPTIONS:');
            for (const select of selects) {
              const selectLabel = await select.locator('..').locator('label').textContent().catch(() => 'Unnamed');
              console.log(`\n     Dropdown: "${selectLabel?.trim()}"`);

              const options = await select.locator('option').allTextContents();
              options.forEach(opt => {
                if (opt.trim()) console.log(`       - "${opt.trim()}"`);
              });
            }
          }
        }

        // 4. FOOTER BUTTONS (outside tabs)
        console.log('\n\n' + '='.repeat(60));
        console.log('MODAL FOOTER BUTTONS');
        console.log('='.repeat(60));

        const footerButtons = await modal.locator('[class*="dialog-footer"] button, [class*="footer"] button').allTextContents();
        if (footerButtons.length > 0) {
          footerButtons.forEach(b => {
            if (b.trim()) console.log(`   • "${b.trim()}"`);
          });
        }

        // Take screenshot
        await page.screenshot({ path: 'override-modal-copy-audit.png', fullPage: true });
        console.log('\n\n📸 Screenshot saved: override-modal-copy-audit.png\n');
      } else {
        console.log('❌ Modal did not open');
      }
    }
  });

  test('Extract table header copy', async ({ page }) => {
    await page.goto('http://localhost:3000/collection/DECK-1757517559289/manage');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(2000);

    console.log('\n=== TABLE HEADERS ===\n');

    // Find table headers - Blueprint uses special classes
    const headers = await page.locator('[class*="bp6-table"] [class*="header-cell"], th').allTextContents();

    console.log('Column Headers:');
    headers.forEach((h, i) => {
      const clean = h.trim().replace(/Press down to drag/g, '');
      if (clean) console.log(`  ${i + 1}. "${clean}"`);
    });
  });

  test('Extract all tooltip copy', async ({ page }) => {
    await page.goto('http://localhost:3000/collection/DECK-1757517559289/manage');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(2000);

    console.log('\n=== TOOLTIP COPY ===\n');

    // Get all title attributes
    const tooltips = await page.locator('[title]').evaluateAll(elements =>
      elements
        .map(el => el.getAttribute('title'))
        .filter(title => title && title.length > 0)
    );

    console.log('Tooltips found:');
    const uniqueTooltips = [...new Set(tooltips)];
    uniqueTooltips.forEach((t, i) => {
      console.log(`  ${i + 1}. "${t}"`);
    });
  });
});
