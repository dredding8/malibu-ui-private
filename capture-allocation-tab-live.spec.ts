/**
 * Capture AllocationTab Screenshots - Direct Navigation
 * Navigate to /collection/TEST-001/manage and click Baseline/Match button
 */

import { test } from '@playwright/test';

test('Capture AllocationTab Screenshots', async ({ page }) => {
  console.log('🎬 Starting screenshot capture for AllocationTab...\n');

  // Navigate directly to collection management page
  console.log('🎯 Navigating to /collection/TEST-001/manage...');
  await page.goto('http://localhost:3000/collection/TEST-001/manage');
  await page.waitForLoadState('networkidle');
  await page.waitForTimeout(1000);
  console.log('✅ Loaded collection management page');

  await page.screenshot({
    path: '/Users/damon/malibu/test-results/screenshots/01-collection-manage-page.png',
    fullPage: true
  });

  // Look for Baseline or Match buttons in table rows
  console.log('\n🔍 Looking for Baseline/Match buttons in table...');

  const baselineButtons = page.locator('button:has-text("Baseline"), button:has-text("Match")');
  const buttonCount = await baselineButtons.count();
  console.log(`Found ${buttonCount} Baseline/Match buttons`);

  if (buttonCount > 0) {
    const firstButton = baselineButtons.first();
    const buttonText = await firstButton.textContent();
    console.log(`Clicking "${buttonText}" button...`);

    await firstButton.click();
    await page.waitForTimeout(1500);
    console.log('✅ Clicked button - UnifiedEditor should open');

    await page.screenshot({
      path: '/Users/damon/malibu/test-results/screenshots/02-unified-editor-opened.png',
      fullPage: true
    });
  } else {
    console.log('⚠️ No Baseline/Match buttons found');
    console.log('Trying to click any table row...');

    const tableRows = page.locator('table tbody tr');
    const rowCount = await tableRows.count();
    console.log(`Found ${rowCount} table rows`);

    if (rowCount > 0) {
      await tableRows.first().click();
      await page.waitForTimeout(1500);

      await page.screenshot({
        path: '/Users/damon/malibu/test-results/screenshots/02-after-row-click.png',
        fullPage: true
      });
    }
  }

  // Check for UnifiedEditor modal/dialog
  const editor = page.locator('.unified-editor, .bp6-dialog, .bp6-overlay-content');
  const editorVisible = await editor.isVisible();
  console.log(`\n📋 UnifiedEditor: ${editorVisible ? 'VISIBLE ✅' : 'NOT VISIBLE ❌'}`);

  if (editorVisible) {
    // Look for Allocation tab
    console.log('\n🔍 Looking for Allocation tab...');
    const allocationTab = page.locator('[role="tab"]:has-text("Allocation"), .bp6-tab:has-text("Allocation"), text=/^allocation$/i, text=/1.*allocation/i').first();

    const tabVisible = await allocationTab.isVisible();
    console.log(`Allocation tab: ${tabVisible ? 'FOUND ✅' : 'NOT FOUND ❌'}`);

    if (tabVisible) {
      console.log('Clicking Allocation tab...');
      await allocationTab.click();
      await page.waitForTimeout(500);
      console.log('✅ Allocation tab active');

      await page.screenshot({
        path: '/Users/damon/malibu/test-results/screenshots/03-allocation-tab-opened.png',
        fullPage: true
      });

      // NOW FIND AND SCREENSHOT THE TABLE
      console.log('\n📸 CAPTURING TABLE SCREENSHOTS...\n');
      console.log('═══════════════════════════════════════════════════');

      const sitesTable = page.locator('table.allocation-tab__sites-table, .allocation-tab__left-panel table, table').first();
      const tableVisible = await sitesTable.isVisible();

      if (tableVisible) {
        console.log('✅✅✅ SITES TABLE FOUND! ✅✅✅\n');

        // Capture 1: Full page with table
        await page.screenshot({
          path: '/Users/damon/malibu/test-results/screenshots/TABLE-01-full-page-view.png',
          fullPage: true
        });
        console.log('📸 1. Full page view');

        // Capture 2: Table element only
        await sitesTable.screenshot({
          path: '/Users/damon/malibu/test-results/screenshots/TABLE-02-table-only.png'
        });
        console.log('📸 2. Table element close-up');

        // Get table info
        const headerCount = await sitesTable.locator('thead th').count();
        const rowCount = await sitesTable.locator('tbody tr').count();
        const headerTexts = await sitesTable.locator('thead th').allTextContents();

        console.log(`\n📊 TABLE METRICS:`);
        console.log(`   Columns: ${headerCount}`);
        console.log(`   Rows: ${rowCount}`);
        console.log(`   Headers: ${headerTexts.join(' | ')}`);

        // Capture 3: Hover state
        if (rowCount > 0) {
          const firstRow = sitesTable.locator('tbody tr').first();
          await firstRow.hover();
          await page.waitForTimeout(300);

          await page.screenshot({
            path: '/Users/damon/malibu/test-results/screenshots/TABLE-03-hover-state.png',
            fullPage: true
          });
          console.log('\n📸 3. Hover state');

          // Capture 4: Selection state
          const checkbox = firstRow.locator('input[type="checkbox"]');
          if (await checkbox.isVisible()) {
            await checkbox.click();
            await page.waitForTimeout(300);

            await page.screenshot({
              path: '/Users/damon/malibu/test-results/screenshots/TABLE-04-single-selection.png',
              fullPage: true
            });
            console.log('📸 4. Single selection');

            // Capture 5: Multi-selection
            if (rowCount > 1) {
              const secondRow = sitesTable.locator('tbody tr').nth(1);
              await secondRow.click(); // Test row click selection
              await page.waitForTimeout(300);

              await page.screenshot({
                path: '/Users/damon/malibu/test-results/screenshots/TABLE-05-multi-selection.png',
                fullPage: true
              });
              console.log('📸 5. Multi-selection (via row click)');
            }
          }
        }

        // Capture 6: Headers close-up
        const thead = sitesTable.locator('thead');
        await thead.screenshot({
          path: '/Users/damon/malibu/test-results/screenshots/TABLE-06-headers.png'
        });
        console.log('📸 6. Table headers');

        // Capture 7: Blueprint Tags (Quality column)
        const tags = sitesTable.locator('.bp6-tag');
        if (await tags.count() > 0) {
          const tagCell = tags.first().locator('xpath=ancestor::td');
          await tagCell.screenshot({
            path: '/Users/damon/malibu/test-results/screenshots/TABLE-07-quality-tags.png'
          });
          console.log('📸 7. Quality tags');
        }

        // Capture 8: Progress bars (Capacity column)
        const progressBars = sitesTable.locator('.bp6-progress-bar');
        if (await progressBars.count() > 0) {
          const progressCell = progressBars.first().locator('xpath=ancestor::td');
          await progressCell.screenshot({
            path: '/Users/damon/malibu/test-results/screenshots/TABLE-08-capacity-progressbar.png'
          });
          console.log('📸 8. Capacity progress bars');
        }

        // Capture 9: Dark theme
        console.log('\n🌙 Testing dark theme...');
        await page.evaluate(() => {
          document.body.classList.add('bp6-dark');
        });
        await page.waitForTimeout(300);

        await page.screenshot({
          path: '/Users/damon/malibu/test-results/screenshots/TABLE-09-dark-theme-full.png',
          fullPage: true
        });
        console.log('📸 9. Dark theme - full page');

        await sitesTable.screenshot({
          path: '/Users/damon/malibu/test-results/screenshots/TABLE-10-dark-theme-table.png'
        });
        console.log('📸 10. Dark theme - table only');

        // Restore light theme
        await page.evaluate(() => {
          document.body.classList.remove('bp6-dark');
        });

        // VALIDATION METRICS
        console.log('\n═══════════════════════════════════════════════════');
        console.log('   DESIGN VALIDATION METRICS');
        console.log('═══════════════════════════════════════════════════\n');

        const tableBox = await sitesTable.boundingBox();
        if (tableBox && rowCount > 0) {
          const avgRowHeight = tableBox.height / rowCount;
          const cardEquivalent = rowCount * 300;
          const savings = ((cardEquivalent - tableBox.height) / cardEquivalent * 100);

          console.log('📐 Space Efficiency:');
          console.log(`   Table width: ${tableBox.width}px`);
          console.log(`   Table height: ${tableBox.height.toFixed(0)}px`);
          console.log(`   Avg row height: ${avgRowHeight.toFixed(1)}px`);
          console.log(`   Card equivalent: ${cardEquivalent}px`);
          console.log(`   Space savings: ${savings.toFixed(1)}%`);
        }

        // Check for inline styles (should be 0)
        const inlineStyleCount = await sitesTable.evaluate(t => {
          return t.querySelectorAll('[style]').length;
        });
        console.log(`\n🚫 Inline styles: ${inlineStyleCount} ${inlineStyleCount === 0 ? '✅ PASS' : '❌ FAIL'}`);

        // Blueprint component counts
        const tagCount = await sitesTable.locator('.bp6-tag').count();
        const progressBarCount = await sitesTable.locator('.bp6-progress-bar').count();
        const checkboxCount = await sitesTable.locator('input[type="checkbox"]').count();

        console.log('\n🧩 Blueprint Components:');
        console.log(`   Tags: ${tagCount}`);
        console.log(`   Progress bars: ${progressBarCount}`);
        console.log(`   Checkboxes: ${checkboxCount}`);

        // Table classes
        const tableClasses = await sitesTable.getAttribute('class');
        console.log(`\n🎨 Table classes: ${tableClasses}`);

        const checks = {
          'HTMLTable component': tableClasses?.includes('bp6-html-table'),
          'Interactive prop': tableClasses?.includes('interactive'),
          'Striped prop': tableClasses?.includes('striped'),
          'Bordered prop': tableClasses?.includes('bordered')
        };

        console.log('\n✅ Blueprint Props:');
        Object.entries(checks).forEach(([name, pass]) => {
          console.log(`   ${name}: ${pass ? '✅' : '⚠️'}`);
        });

        console.log('\n✅✅✅ SCREENSHOT CAPTURE COMPLETE ✅✅✅');
        console.log('📁 All screenshots saved to: test-results/screenshots/\n');

      } else {
        console.log('❌ Sites table not found in Allocation tab');

        // Debug output
        const allTables = page.locator('table');
        const tableCount = await allTables.count();
        console.log(`\nDebugging: Found ${tableCount} <table> elements on page`);

        if (tableCount > 0) {
          for (let i = 0; i < tableCount; i++) {
            const cls = await allTables.nth(i).getAttribute('class');
            console.log(`  Table ${i + 1}: class="${cls}"`);
          }
        }
      }

    } else {
      console.log('❌ Allocation tab not found');

      // List available tabs
      const tabs = page.locator('[role="tab"], .bp6-tab');
      const tabCount = await tabs.count();
      console.log(`\nFound ${tabCount} tabs total`);

      if (tabCount > 0) {
        for (let i = 0; i < tabCount; i++) {
          const tabText = await tabs.nth(i).textContent();
          console.log(`  ${i + 1}. "${tabText}"`);
        }
      }
    }

  } else {
    console.log('❌ UnifiedEditor did not open');
    console.log('\nPlease verify:');
    console.log('  1. Collection TEST-001 exists');
    console.log('  2. There are opportunities in the table');
    console.log('  3. Baseline/Match buttons are present');
  }

  console.log('\n🎬 Test complete!');
});