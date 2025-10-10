/**
 * Final AllocationTab Screenshot Capture
 * Click Match status buttons (BASELINE/UNMATCHED/SUBOPTIMAL) to open UnifiedEditor
 */

import { test } from '@playwright/test';

test('Capture AllocationTab Screenshots - Collection Management', async ({ page }) => {
  console.log('🎬 Capturing AllocationTab screenshots from live application\n');

  // Navigate to collection management page
  await page.goto('http://localhost:3000/collection/TEST-001/manage');
  await page.waitForLoadState('networkidle');
  await page.waitForTimeout(1000);
  console.log('✅ Loaded: /collection/TEST-001/manage\n');

  await page.screenshot({
    path: '/Users/damon/malibu/test-results/screenshots/STEP-01-manage-page.png',
    fullPage: true
  });

  // Find and click a Match status button (BASELINE, UNMATCHED, or SUBOPTIMAL)
  console.log('🔍 Looking for Match status buttons...');

  // Try clicking BASELINE first (green badge)
  let matchButton = page.locator('td:has-text("BASELINE")').first();
  let buttonType = 'BASELINE';

  if (!await matchButton.isVisible()) {
    // Try SUBOPTIMAL (yellow badge)
    matchButton = page.locator('td:has-text("SUBOPTIMAL")').first();
    buttonType = 'SUBOPTIMAL';
  }

  if (!await matchButton.isVisible()) {
    // Try UNMATCHED (red badge)
    matchButton = page.locator('td:has-text("UNMATCHED")').first();
    buttonType = 'UNMATCHED';
  }

  if (await matchButton.isVisible()) {
    console.log(`✅ Found ${buttonType} status, clicking...`);
    await matchButton.click();
    await page.waitForTimeout(1500);
    console.log('✅ Clicked match status button\n');

    await page.screenshot({
      path: '/Users/damon/malibu/test-results/screenshots/STEP-02-editor-opened.png',
      fullPage: true
    });
  } else {
    console.log('❌ No match status buttons found, trying table row click...');
    const tableRow = page.locator('table tbody tr').first();
    if (await tableRow.isVisible()) {
      await tableRow.click();
      await page.waitForTimeout(1500);
    }
  }

  // Check if UnifiedEditor opened
  const editor = page.locator('.unified-editor, .bp6-dialog-container, .bp6-overlay-content').first();
  const editorOpen = await editor.isVisible();
  console.log(`UnifiedEditor: ${editorOpen ? '✅ OPEN' : '❌ NOT OPEN'}\n`);

  if (editorOpen) {
    // Click Allocation tab
    const allocationTab = page.locator('[role="tab"]').filter({ hasText: /allocation/i }).first();

    if (await allocationTab.isVisible()) {
      console.log('✅ Found Allocation tab, clicking...');
      await allocationTab.click();
      await page.waitForTimeout(500);

      await page.screenshot({
        path: '/Users/damon/malibu/test-results/screenshots/STEP-03-allocation-tab.png',
        fullPage: true
      });

      // FIND THE SITES TABLE
      console.log('\n═══════════════════════════════════════════════════');
      console.log('  ALLOCATIONTAB SITES TABLE VALIDATION');
      console.log('═══════════════════════════════════════════════════\n');

      const sitesTable = page.locator('table').first();

      if (await sitesTable.isVisible()) {
        console.log('✅✅✅ SITES TABLE FOUND! ✅✅✅\n');

        // Get table metrics
        const headers = await sitesTable.locator('thead th').allTextContents();
        const rowCount = await sitesTable.locator('tbody tr').count();

        console.log('📊 Table Structure:');
        console.log(`   Columns: ${headers.length}`);
        console.log(`   Headers: ${headers.join(' | ')}`);
        console.log(`   Rows: ${rowCount}\n`);

        // Screenshot 1: Full view
        await page.screenshot({
          path: '/Users/damon/malibu/test-results/screenshots/TABLE-01-full-view.png',
          fullPage: true
        });
        console.log('📸 1/10: Full page view');

        // Screenshot 2: Table only
        await sitesTable.screenshot({
          path: '/Users/damon/malibu/test-results/screenshots/TABLE-02-table-closeup.png'
        });
        console.log('📸 2/10: Table close-up');

        // Screenshot 3: Hover state
        if (rowCount > 0) {
          const row1 = sitesTable.locator('tbody tr').first();
          await row1.hover();
          await page.waitForTimeout(200);

          await page.screenshot({
            path: '/Users/damon/malibu/test-results/screenshots/TABLE-03-hover-state.png',
            fullPage: true
          });
          console.log('📸 3/10: Row hover state');

          // Screenshot 4: Single selection
          const checkbox = row1.locator('input[type="checkbox"]');
          if (await checkbox.isVisible()) {
            await checkbox.click();
            await page.waitForTimeout(300);

            await page.screenshot({
              path: '/Users/damon/malibu/test-results/screenshots/TABLE-04-single-selection.png',
              fullPage: true
            });
            console.log('📸 4/10: Single selection');

            // Screenshot 5: Multi-selection
            if (rowCount > 1) {
              const row2 = sitesTable.locator('tbody tr').nth(1);
              await row2.click();
              await page.waitForTimeout(300);

              await page.screenshot({
                path: '/Users/damon/malibu/test-results/screenshots/TABLE-05-multi-selection.png',
                fullPage: true
              });
              console.log('📸 5/10: Multi-selection');
            }
          }
        }

        // Screenshot 6: Headers
        await sitesTable.locator('thead').screenshot({
          path: '/Users/damon/malibu/test-results/screenshots/TABLE-06-headers.png'
        });
        console.log('📸 6/10: Table headers');

        // Screenshot 7: Quality tags
        const qualityTag = sitesTable.locator('.bp6-tag').first();
        if (await qualityTag.isVisible()) {
          const tagCell = qualityTag.locator('xpath=ancestor::td');
          await tagCell.screenshot({
            path: '/Users/damon/malibu/test-results/screenshots/TABLE-07-quality-tags.png'
          });
          console.log('📸 7/10: Quality tags');
        }

        // Screenshot 8: Capacity progress bars
        const progressBar = sitesTable.locator('.bp6-progress-bar').first();
        if (await progressBar.isVisible()) {
          const progressCell = progressBar.locator('xpath=ancestor::td');
          await progressCell.screenshot({
            path: '/Users/damon/malibu/test-results/screenshots/TABLE-08-capacity-bars.png'
          });
          console.log('📸 8/10: Capacity progress bars');
        }

        // Screenshot 9 & 10: Dark theme
        console.log('🌙 Enabling dark theme...');
        await page.evaluate(() => document.body.classList.add('bp6-dark'));
        await page.waitForTimeout(300);

        await page.screenshot({
          path: '/Users/damon/malibu/test-results/screenshots/TABLE-09-dark-theme-full.png',
          fullPage: true
        });
        console.log('📸 9/10: Dark theme full page');

        await sitesTable.screenshot({
          path: '/Users/damon/malibu/test-results/screenshots/TABLE-10-dark-theme-table.png'
        });
        console.log('📸 10/10: Dark theme table');

        // Restore light theme
        await page.evaluate(() => document.body.classList.remove('bp6-dark'));

        // VALIDATION METRICS
        console.log('\n═══════════════════════════════════════════════════');
        console.log('  DESIGN VALIDATION RESULTS');
        console.log('═══════════════════════════════════════════════════\n');

        const tableBox = await sitesTable.boundingBox();
        if (tableBox) {
          console.log('📐 Dimensions:');
          console.log(`   Width: ${tableBox.width}px`);
          console.log(`   Height: ${tableBox.height.toFixed(0)}px`);

          if (rowCount > 0) {
            const avgRow = tableBox.height / rowCount;
            const cardEquiv = rowCount * 300;
            const savings = ((cardEquiv - tableBox.height) / cardEquiv * 100);

            console.log(`   Avg row height: ${avgRow.toFixed(1)}px`);
            console.log(`\n💡 Space Efficiency:`);
            console.log(`   Card grid (estimated): ${cardEquiv}px`);
            console.log(`   Table (actual): ${tableBox.height.toFixed(0)}px`);
            console.log(`   Savings: ${savings.toFixed(1)}%`);
          }
        }

        // Check inline styles
        const inlineCount = await sitesTable.evaluate(t =>
          t.querySelectorAll('[style]').length
        );
        console.log(`\n✅ Inline styles: ${inlineCount} ${inlineCount === 0 ? '(PASS)' : '(FAIL)'}`);

        // Blueprint components
        const tagCount = await sitesTable.locator('.bp6-tag').count();
        const progressCount = await sitesTable.locator('.bp6-progress-bar').count();
        const checkboxCount = await sitesTable.locator('input[type="checkbox"]').count();

        console.log('\n🧩 Blueprint Components:');
        console.log(`   Tags: ${tagCount}`);
        console.log(`   Progress bars: ${progressCount}`);
        console.log(`   Checkboxes: ${checkboxCount}`);

        // Table props
        const tableClass = await sitesTable.getAttribute('class');
        console.log(`\n🎨 Table classes: ${tableClass}`);

        const props = {
          'HTMLTable': tableClass?.includes('bp6-html-table'),
          'Interactive': tableClass?.includes('interactive'),
          'Striped': tableClass?.includes('striped'),
          'Bordered': tableClass?.includes('bordered')
        };

        console.log('\n✅ Blueprint Props:');
        Object.entries(props).forEach(([name, val]) => {
          console.log(`   ${name}: ${val ? '✅' : '⚠️'}`);
        });

        console.log('\n✅✅✅ ALL SCREENSHOTS CAPTURED SUCCESSFULLY ✅✅✅');
        console.log('📁 Location: test-results/screenshots/\n');

      } else {
        console.log('❌ Sites table not found in Allocation tab');
      }

    } else {
      console.log('❌ Allocation tab not found');
    }

  } else {
    console.log('❌ UnifiedEditor did not open');
  }

  console.log('\n🎬 Screenshot capture complete!\n');
});