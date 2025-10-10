import { test, expect } from '@playwright/test';

test('Comprehensive Validation - Collection Management Actions', async ({ page }) => {
  console.log('\n=== COMPREHENSIVE VALIDATION TEST ===\n');

  // Test multiple collection IDs to validate consistency
  const testCollections = ['TEST-001', 'DECK-1757517559289'];

  for (const collectionId of testCollections) {
    console.log(`\n--- Testing Collection: ${collectionId} ---\n`);

    await page.goto(`http://localhost:3000/collection/${collectionId}/manage`);
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(2000);

    // 1. Validate NO actions column exists
    console.log('1. Validating NO actions column in table...');
    const actionsColumn = page.locator('text=/^Actions$/i, text=/^Action$/i').first();
    const actionsColumnExists = await actionsColumn.count() > 0;
    console.log(`   ✓ Actions column exists: ${actionsColumnExists}`);
    
    if (actionsColumnExists) {
      console.log('   ❌ CONSTRAINT VIOLATION: Actions column should NOT exist!');
      await page.screenshot({ path: `${collectionId}-actions-column-found.png`, fullPage: true });
    }

    // 2. Validate NO inline action buttons in table cells
    console.log('\n2. Checking for inline action buttons in table...');
    const inlineButtons = await page.locator('table .bp5-button, table .bp6-button').count();
    console.log(`   ✓ Inline buttons found: ${inlineButtons}`);
    
    if (inlineButtons > 0) {
      console.log('   ⚠️  WARNING: Found inline buttons - checking if they are action buttons...');
      const buttonTexts = await page.locator('table .bp5-button, table .bp6-button').allTextContents();
      console.log('   Button texts:', buttonTexts.slice(0, 5));
    }

    // 3. Validate Match Status column is clickable
    console.log('\n3. Validating Match Status column clickability...');
    const matchCells = page.locator('.match-status-cell.clickable');
    const matchCellCount = await matchCells.count();
    console.log(`   ✓ Clickable match cells: ${matchCellCount}`);

    if (matchCellCount === 0) {
      console.log('   ❌ ERROR: No clickable match status cells found!');
      await page.screenshot({ path: `${collectionId}-no-clickable-cells.png`, fullPage: true });
      continue;
    }

    // 4. Test clicking first UNMATCHED cell
    console.log('\n4. Testing click on UNMATCHED status...');
    const unmatchedCell = page.locator('.match-status-cell.clickable').filter({ hasText: 'UNMATCHED' }).first();
    const unmatchedExists = await unmatchedCell.count() > 0;
    
    if (unmatchedExists) {
      await unmatchedCell.click();
      await page.waitForTimeout(1500);

      const modal = page.locator('.bp5-dialog, .bp6-dialog');
      const modalVisible = await modal.isVisible().catch(() => false);
      console.log(`   ✓ Modal opened: ${modalVisible}`);

      if (modalVisible) {
        const modalTitle = await modal.locator('.bp5-dialog-header, .bp6-dialog-header').textContent();
        console.log(`   ✓ Modal title: ${modalTitle}`);
        
        // Validate modal has correct content (using more specific selectors)
        const allocationTab = await modal.locator('.bp5-tab, .bp6-tab').filter({ hasText: 'Allocation' }).count() > 0;
        const commentTab = await modal.locator('.bp5-tab, .bp6-tab').filter({ hasText: 'Comment' }).count() > 0;
        const reviewTab = await modal.locator('.bp5-tab, .bp6-tab').filter({ hasText: 'Review & Submit' }).count() > 0;
        console.log(`   ✓ Tabs present - Allocation: ${allocationTab}, Comment: ${commentTab}, Review: ${reviewTab}`);

        await page.screenshot({ path: `${collectionId}-unmatched-modal.png` });

        // Close modal
        const closeBtn = modal.locator('.bp5-dialog-close-button, .bp6-dialog-close-button');
        await closeBtn.click();
        await page.waitForTimeout(500);
      }

      expect(modalVisible).toBe(true);
    }

    // 5. Test clicking BASELINE cell
    console.log('\n5. Testing click on BASELINE status...');
    const baselineCell = page.locator('.match-status-cell.clickable').filter({ hasText: 'BASELINE' }).first();
    const baselineExists = await baselineCell.count() > 0;

    if (baselineExists) {
      await baselineCell.click();
      await page.waitForTimeout(1500);

      const modal = page.locator('.bp5-dialog, .bp6-dialog');
      const modalVisible = await modal.isVisible().catch(() => false);
      console.log(`   ✓ Modal opened for BASELINE: ${modalVisible}`);

      if (modalVisible) {
        await page.screenshot({ path: `${collectionId}-baseline-modal.png` });
        
        const closeBtn = modal.locator('.bp5-dialog-close-button, .bp6-dialog-close-button');
        await closeBtn.click();
        await page.waitForTimeout(500);
      }

      expect(modalVisible).toBe(true);
    }

    // 6. Test clicking SUBOPTIMAL cell
    console.log('\n6. Testing click on SUBOPTIMAL status...');
    const suboptimalCell = page.locator('.match-status-cell.clickable').filter({ hasText: 'SUBOPTIMAL' }).first();
    const suboptimalExists = await suboptimalCell.count() > 0;

    if (suboptimalExists) {
      await suboptimalCell.click();
      await page.waitForTimeout(1500);

      const modal = page.locator('.bp5-dialog, .bp6-dialog');
      const modalVisible = await modal.isVisible().catch(() => false);
      console.log(`   ✓ Modal opened for SUBOPTIMAL: ${modalVisible}`);

      if (modalVisible) {
        await page.screenshot({ path: `${collectionId}-suboptimal-modal.png` });
        
        const closeBtn = modal.locator('.bp5-dialog-close-button, .bp6-dialog-close-button');
        await closeBtn.click();
        await page.waitForTimeout(500);
      }

      expect(modalVisible).toBe(true);
    }

    // 7. Validate cursor style on match cells
    console.log('\n7. Validating cursor style on match cells...');
    const firstMatchCell = matchCells.first();
    const cursorStyle = await firstMatchCell.evaluate(el => window.getComputedStyle(el).cursor);
    console.log(`   ✓ Cursor style: ${cursorStyle}`);
    expect(cursorStyle).toBe('pointer');

    // 8. Final screenshot
    await page.screenshot({ path: `${collectionId}-final-state.png`, fullPage: true });
    
    console.log(`\n✅ Validation complete for ${collectionId}\n`);
  }

  console.log('\n=== ALL VALIDATIONS COMPLETE ===\n');
});
