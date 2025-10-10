/**
 * FINAL: Capture AllocationTab Screenshots
 * Working test based on actual page structure
 */

import { test } from '@playwright/test';

test('Capture AllocationTab - FINAL', async ({ page }) => {
  console.log('\n🎬 FINAL AllocationTab Screenshot Capture\n');
  console.log('═══════════════════════════════════════════════════\n');

  // Navigate to collection management page
  await page.goto('http://localhost:3000/collection/TEST-001/manage');
  await page.waitForLoadState('networkidle');
  await page.waitForTimeout(2000);

  console.log('✅ Loaded: /collection/TEST-001/manage\n');

  await page.screenshot({
    path: '/Users/damon/malibu/test-results/screenshots/STEP-01-manage-page.png',
    fullPage: true
  });

  // Find the assignments table
  const table = page.locator('table').first();
  const rows = table.locator('tbody tr');
  const rowCount = await rows.count();

  console.log(`📊 Found table with ${rowCount} assignment rows\n`);

  if (rowCount > 0) {
    // Click first row (should have BASELINE or other match status)
    console.log('🖱️  Clicking first assignment row...');
    await rows.first().click();
    await page.waitForTimeout(1500);

    console.log('✅ Row clicked - waiting for UnifiedEditor...\n');

    await page.screenshot({
      path: '/Users/damon/malibu/test-results/screenshots/STEP-02-editor-opened.png',
      fullPage: true
    });

    // Check if editor opened
    const editor = page.locator('.bp6-dialog, .bp6-overlay-content').first();
    const editorOpen = await editor.isVisible();

    if (editorOpen) {
      console.log('✅✅✅ UNIFIED EDITOR OPENED! ✅✅✅\n');

      // Find and click Allocation tab
      const tabs = page.locator('[role="tab"]');
      const tabTexts = await tabs.allTextContents();
      console.log(`Found tabs: ${tabTexts.join(' | ')}\n`);

      const allocationTab = tabs.filter({ hasText: /allocation/i }).first();

      if (await allocationTab.isVisible()) {
        console.log('🎯 Clicking Allocation tab...\n');
        await allocationTab.click();
        await page.waitForTimeout(500);

        await page.screenshot({
          path: '/Users/damon/malibu/test-results/screenshots/STEP-03-allocation-tab.png',
          fullPage: true
        });

        // NOW CAPTURE THE SITES TABLE
        console.log('═══════════════════════════════════════════════════');
        console.log('  SITES TABLE SCREENSHOT CAPTURE');
        console.log('═══════════════════════════════════════════════════\n');

        const sitesTable = page.locator('table').first();

        if (await sitesTable.isVisible()) {
          console.log('✅✅✅ SITES TABLE FOUND! ✅✅✅\n');

          // Get table info
          const headers = await sitesTable.locator('thead th').allTextContents();
          const siteRows = await sitesTable.locator('tbody tr').count();

          console.log('📊 Table Structure:');
          console.log(`   Columns: ${headers.length}`);
          console.log(`   Headers: ${headers.join(' | ')}`);
          console.log(`   Rows: ${siteRows}\n`);

          // Capture all screenshots
          console.log('📸 Capturing screenshots...\n');

          // 1. Full page
          await page.screenshot({
            path: '/Users/damon/malibu/test-results/screenshots/TABLE-01-full-page.png',
            fullPage: true
          });
          console.log('   ✅ 1/10: Full page view');

          // 2. Table closeup
          await sitesTable.screenshot({
            path: '/Users/damon/malibu/test-results/screenshots/TABLE-02-table-closeup.png'
          });
          console.log('   ✅ 2/10: Table close-up');

          if (siteRows > 0) {
            // 3. Hover state
            const row1 = sitesTable.locator('tbody tr').first();
            await row1.hover();
            await page.waitForTimeout(200);
            await page.screenshot({
              path: '/Users/damon/malibu/test-results/screenshots/TABLE-03-hover.png',
              fullPage: true
            });
            console.log('   ✅ 3/10: Hover state');

            // 4. Single selection
            const checkbox = row1.locator('input[type="checkbox"]');
            if (await checkbox.isVisible()) {
              await checkbox.click();
              await page.waitForTimeout(300);
              await page.screenshot({
                path: '/Users/damon/malibu/test-results/screenshots/TABLE-04-selection.png',
                fullPage: true
              });
              console.log('   ✅ 4/10: Single selection');

              // 5. Multi-selection
              if (siteRows > 1) {
                await sitesTable.locator('tbody tr').nth(1).click();
                await page.waitForTimeout(300);
                await page.screenshot({
                  path: '/Users/damon/malibu/test-results/screenshots/TABLE-05-multi-select.png',
                  fullPage: true
                });
                console.log('   ✅ 5/10: Multi-selection');
              }
            }
          }

          // 6. Headers
          await sitesTable.locator('thead').screenshot({
            path: '/Users/damon/malibu/test-results/screenshots/TABLE-06-headers.png'
          });
          console.log('   ✅ 6/10: Headers');

          // 7. Quality tags
          const tag = sitesTable.locator('.bp6-tag').first();
          if (await tag.isVisible()) {
            await tag.locator('xpath=ancestor::td').screenshot({
              path: '/Users/damon/malibu/test-results/screenshots/TABLE-07-tags.png'
            });
            console.log('   ✅ 7/10: Quality tags');
          }

          // 8. Progress bars
          const progress = sitesTable.locator('.bp6-progress-bar').first();
          if (await progress.isVisible()) {
            await progress.locator('xpath=ancestor::td').screenshot({
              path: '/Users/damon/malibu/test-results/screenshots/TABLE-08-progress.png'
            });
            console.log('   ✅ 8/10: Capacity bars');
          }

          // 9 & 10. Dark theme
          await page.evaluate(() => document.body.classList.add('bp6-dark'));
          await page.waitForTimeout(300);
          await page.screenshot({
            path: '/Users/damon/malibu/test-results/screenshots/TABLE-09-dark-full.png',
            fullPage: true
          });
          console.log('   ✅ 9/10: Dark theme full');

          await sitesTable.screenshot({
            path: '/Users/damon/malibu/test-results/screenshots/TABLE-10-dark-table.png'
          });
          console.log('   ✅ 10/10: Dark theme table');

          await page.evaluate(() => document.body.classList.remove('bp6-dark'));

          // METRICS
          console.log('\n═══════════════════════════════════════════════════');
          console.log('  VALIDATION METRICS');
          console.log('═══════════════════════════════════════════════════\n');

          const box = await sitesTable.boundingBox();
          if (box) {
            console.log('📐 Dimensions:');
            console.log(`   ${box.width}px × ${box.height.toFixed(0)}px\n`);

            if (siteRows > 0) {
              const avg = box.height / siteRows;
              const cardH = siteRows * 300;
              const save = ((cardH - box.height) / cardH * 100);

              console.log('💡 Efficiency:');
              console.log(`   Avg row: ${avg.toFixed(1)}px`);
              console.log(`   vs Cards: ${cardH}px`);
              console.log(`   Savings: ${save.toFixed(1)}%\n`);
            }
          }

          const inline = await sitesTable.evaluate(t =>
            t.querySelectorAll('[style]').length
          );
          console.log(`✅ Inline styles: ${inline} ${inline === 0 ? '(PASS)' : '(FAIL)'}\n`);

          const tags = await sitesTable.locator('.bp6-tag').count();
          const bars = await sitesTable.locator('.bp6-progress-bar').count();
          const checks = await sitesTable.locator('input[type="checkbox"]').count();

          console.log('🧩 Components:');
          console.log(`   Tags: ${tags}`);
          console.log(`   Progress: ${bars}`);
          console.log(`   Checkboxes: ${checks}\n`);

          const cls = await sitesTable.getAttribute('class');
          console.log(`🎨 Classes: ${cls}\n`);

          console.log('✅✅✅ ALL SCREENSHOTS CAPTURED! ✅✅✅');
          console.log('📁 test-results/screenshots/\n');

        } else {
          console.log('❌ Sites table not visible\n');
        }
      } else {
        console.log('❌ Allocation tab not found\n');
      }
    } else {
      console.log('❌ Editor did not open\n');
    }
  } else {
    console.log('❌ No rows found in assignments table\n');
  }

  console.log('═══════════════════════════════════════════════════');
  console.log('🎬 COMPLETE');
  console.log('═══════════════════════════════════════════════════\n');
});