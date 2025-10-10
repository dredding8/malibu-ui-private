/**
 * Capture AllocationTab Screenshots for Design Validation
 *
 * This test navigates to the AllocationTab and captures comprehensive screenshots
 * to validate all design assumptions made in the assessment report.
 */

import { test } from '@playwright/test';

test('Capture AllocationTab Screenshots', async ({ page }) => {
  console.log('🎬 Starting screenshot capture for AllocationTab...\n');

  // Navigate to homepage
  await page.goto('http://localhost:3000');
  await page.waitForLoadState('networkidle');
  console.log('✅ Loaded homepage');

  await page.screenshot({
    path: '/Users/damon/malibu/test-results/screenshots/01-homepage.png',
    fullPage: true
  });

  // Click on first deck/collection
  const decks = page.locator('.bp6-card, [class*="card"]');
  const deckCount = await decks.count();
  console.log(`📦 Found ${deckCount} deck cards`);

  if (deckCount > 0) {
    await decks.first().click();
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(1000);
    console.log('✅ Navigated to collection page');

    await page.screenshot({
      path: '/Users/damon/malibu/test-results/screenshots/02-collection-page.png',
      fullPage: true
    });
  }

  // Try different methods to open UnifiedEditor
  console.log('\n🔍 Looking for ways to open UnifiedEditor...');

  // Method 1: More Actions button
  const moreActions = page.locator('button:has-text("More Actions"), button:has-text("Actions")');
  if (await moreActions.isVisible()) {
    console.log('Found "More Actions" button');
    await moreActions.click();
    await page.waitForTimeout(500);

    await page.screenshot({
      path: '/Users/damon/malibu/test-results/screenshots/03-more-actions-menu.png'
    });

    const overrideOption = page.locator('text=/override/i, text=/manual/i, text=/edit/i').first();
    if (await overrideOption.isVisible()) {
      await overrideOption.click();
      await page.waitForTimeout(1000);
      console.log('✅ Clicked override option');
    }
  }

  // Method 2: Direct edit button
  const editButtons = page.locator('button:has-text("Edit"), button:has-text("Override"), button[aria-label*="edit"]');
  if (await editButtons.count() > 0) {
    const editBtn = editButtons.first();
    if (await editBtn.isVisible()) {
      console.log('Found edit button');
      await editBtn.click();
      await page.waitForTimeout(1000);
      console.log('✅ Clicked edit button');
    }
  }

  // Method 3: Click opportunity row
  const opportunityRows = page.locator('tr.bp6-interactive, [data-opportunity-id], .opportunity-row');
  if (await opportunityRows.count() > 0) {
    const row = opportunityRows.first();
    if (await row.isVisible()) {
      console.log('Found opportunity row, clicking...');
      await row.click();
      await page.waitForTimeout(1000);
      console.log('✅ Clicked opportunity row');
    }
  }

  await page.screenshot({
    path: '/Users/damon/malibu/test-results/screenshots/04-after-trigger.png',
    fullPage: true
  });

  // Check for UnifiedEditor modal/dialog
  const editor = page.locator('.unified-editor, .bp6-dialog, .bp6-overlay-content, [class*="editor"]');
  const editorVisible = await editor.isVisible();
  console.log(`\n📋 UnifiedEditor ${editorVisible ? 'FOUND ✅' : 'NOT FOUND ❌'}`);

  if (editorVisible) {
    await page.screenshot({
      path: '/Users/damon/malibu/test-results/screenshots/05-unified-editor-open.png',
      fullPage: true
    });

    // Click Allocation tab
    const allocationTab = page.locator('[role="tab"]:has-text("Allocation"), text=/allocation/i, .bp6-tab:has-text("Allocation")').first();

    if (await allocationTab.isVisible()) {
      console.log('✅ Found Allocation tab, clicking...');
      await allocationTab.click();
      await page.waitForTimeout(500);

      await page.screenshot({
        path: '/Users/damon/malibu/test-results/screenshots/06-allocation-tab-active.png',
        fullPage: true
      });

      // NOW CAPTURE DETAILED TABLE SCREENSHOTS
      console.log('\n📸 CAPTURING DETAILED TABLE SCREENSHOTS...\n');

      const sitesTable = page.locator('table.allocation-tab__sites-table, table');

      if (await sitesTable.isVisible()) {
        console.log('✅✅✅ TABLE FOUND! Capturing comprehensive screenshots...\n');

        // Screenshot 1: Full table view
        await page.screenshot({
          path: '/Users/damon/malibu/test-results/screenshots/TABLE-01-full-view.png',
          fullPage: true
        });
        console.log('📸 Captured: Full table view');

        // Screenshot 2: Table close-up
        await sitesTable.screenshot({
          path: '/Users/damon/malibu/test-results/screenshots/TABLE-02-table-closeup.png'
        });
        console.log('📸 Captured: Table close-up');

        // Screenshot 3: Hover state
        const firstRow = sitesTable.locator('tbody tr').first();
        if (await firstRow.isVisible()) {
          await firstRow.hover();
          await page.waitForTimeout(300);
          await page.screenshot({
            path: '/Users/damon/malibu/test-results/screenshots/TABLE-03-hover-state.png',
            fullPage: true
          });
          console.log('📸 Captured: Hover state');
        }

        // Screenshot 4: Selection state
        const checkbox = firstRow.locator('input[type="checkbox"]');
        if (await checkbox.isVisible()) {
          await checkbox.click();
          await page.waitForTimeout(300);
          await page.screenshot({
            path: '/Users/damon/malibu/test-results/screenshots/TABLE-04-single-selection.png',
            fullPage: true
          });
          console.log('📸 Captured: Single selection');

          // Screenshot 5: Multi-selection
          const secondRow = sitesTable.locator('tbody tr').nth(1);
          if (await secondRow.isVisible()) {
            await secondRow.click();
            await page.waitForTimeout(300);
            await page.screenshot({
              path: '/Users/damon/malibu/test-results/screenshots/TABLE-05-multi-selection.png',
              fullPage: true
            });
            console.log('📸 Captured: Multi-selection');
          }
        }

        // Screenshot 6: Header close-up
        const headers = sitesTable.locator('thead');
        await headers.screenshot({
          path: '/Users/damon/malibu/test-results/screenshots/TABLE-06-headers-closeup.png'
        });
        console.log('📸 Captured: Headers close-up');

        // Screenshot 7: Quality column
        const qualityColumn = sitesTable.locator('td').filter({ hasText: /\d\/5/ }).first();
        if (await qualityColumn.isVisible()) {
          await qualityColumn.screenshot({
            path: '/Users/damon/malibu/test-results/screenshots/TABLE-07-quality-tags.png'
          });
          console.log('📸 Captured: Quality tags');
        }

        // Screenshot 8: Capacity column with progress bars
        const capacityCell = sitesTable.locator('td').filter({ has: page.locator('.bp6-progress-bar') }).first();
        if (await capacityCell.isVisible()) {
          await capacityCell.screenshot({
            path: '/Users/damon/malibu/test-results/screenshots/TABLE-08-capacity-progressbar.png'
          });
          console.log('📸 Captured: Capacity progress bars');
        }

        // Screenshot 9: Dark theme
        console.log('\n🌙 Testing dark theme...');
        await page.evaluate(() => {
          document.body.classList.add('bp6-dark');
        });
        await page.waitForTimeout(300);
        await page.screenshot({
          path: '/Users/damon/malibu/test-results/screenshots/TABLE-09-dark-theme.png',
          fullPage: true
        });
        console.log('📸 Captured: Dark theme');

        // Screenshot 10: Dark theme table close-up
        await sitesTable.screenshot({
          path: '/Users/damon/malibu/test-results/screenshots/TABLE-10-dark-theme-closeup.png'
        });
        console.log('📸 Captured: Dark theme close-up');

        // Restore light theme
        await page.evaluate(() => {
          document.body.classList.remove('bp6-dark');
        });
        await page.waitForTimeout(300);

        // Get table metrics
        console.log('\n📊 TABLE METRICS:');
        console.log('─────────────────────────────────────');

        const headerCount = await sitesTable.locator('thead th').count();
        const rowCount = await sitesTable.locator('tbody tr').count();
        console.log(`Columns: ${headerCount}`);
        console.log(`Rows: ${rowCount}`);

        const headerTexts = await sitesTable.locator('thead th').allTextContents();
        console.log(`Headers: ${headerTexts.join(' | ')}`);

        const tableBox = await sitesTable.boundingBox();
        if (tableBox) {
          console.log(`\nDimensions:`);
          console.log(`  Width: ${tableBox.width}px`);
          console.log(`  Height: ${tableBox.height}px`);

          if (rowCount > 0) {
            const avgRowHeight = tableBox.height / rowCount;
            console.log(`  Avg row height: ${avgRowHeight.toFixed(1)}px`);

            const cardEquivalent = rowCount * 300;
            const savings = ((cardEquivalent - tableBox.height) / cardEquivalent * 100);
            console.log(`\nSpace Efficiency:`);
            console.log(`  Card grid estimate: ${cardEquivalent}px`);
            console.log(`  Table actual: ${tableBox.height.toFixed(0)}px`);
            console.log(`  Savings: ${savings.toFixed(1)}%`);
          }
        }

        // Check for inline styles
        const inlineStyleCount = await sitesTable.evaluate(table => {
          return table.querySelectorAll('[style]').length;
        });
        console.log(`\nInline styles: ${inlineStyleCount} ${inlineStyleCount === 0 ? '✅' : '⚠️'}`);

        // Check Blueprint components
        const tagCount = await sitesTable.locator('.bp6-tag').count();
        const progressBarCount = await sitesTable.locator('.bp6-progress-bar').count();
        console.log(`\nBlueprint components:`);
        console.log(`  Tags: ${tagCount}`);
        console.log(`  Progress bars: ${progressBarCount}`);

        // Check table classes
        const tableClasses = await sitesTable.getAttribute('class');
        console.log(`\nTable classes: ${tableClasses}`);
        console.log(`  HTMLTable: ${tableClasses?.includes('bp6-html-table') ? '✅' : '⚠️'}`);
        console.log(`  Interactive: ${tableClasses?.includes('interactive') ? '✅' : '⚠️'}`);
        console.log(`  Striped: ${tableClasses?.includes('striped') ? '✅' : '⚠️'}`);
        console.log(`  Bordered: ${tableClasses?.includes('bordered') ? '✅' : '⚠️'}`);

        console.log('\n✅✅✅ ALL SCREENSHOTS CAPTURED SUCCESSFULLY ✅✅✅');

      } else {
        console.log('❌ Sites table not found in Allocation tab');

        // Debug: Show what's on the page
        const pageHTML = await page.evaluate(() => {
          return document.querySelector('.allocation-tab, [class*="allocation"]')?.innerHTML.substring(0, 500);
        });
        console.log('\nPage content preview:', pageHTML);
      }

    } else {
      console.log('❌ Allocation tab not found');

      // List available tabs
      const tabs = page.locator('[role="tab"], .bp6-tab');
      const tabCount = await tabs.count();
      console.log(`\nFound ${tabCount} tabs:`);
      for (let i = 0; i < Math.min(tabCount, 5); i++) {
        const tabText = await tabs.nth(i).textContent();
        console.log(`  ${i + 1}. ${tabText}`);
      }
    }

  } else {
    console.log('❌ Could not open UnifiedEditor');
    console.log('\nTrying alternative navigation...');

    // Navigate directly to test-opportunities
    await page.goto('http://localhost:3000/test-opportunities');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(1000);

    await page.screenshot({
      path: '/Users/damon/malibu/test-results/screenshots/ALT-test-opportunities-page.png',
      fullPage: true
    });

    console.log('📸 Captured test-opportunities page as fallback');
  }

  console.log('\n🎬 Screenshot capture complete!');
  console.log('📁 Screenshots saved to: /Users/damon/malibu/test-results/screenshots/');
});