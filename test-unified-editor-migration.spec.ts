import { test, expect } from '@playwright/test';

test('UnifiedEditor Migration - Click Match Status Opens Editor', async ({ page }) => {
  console.log('\n=== UNIFIED EDITOR MIGRATION TEST ===\n');

  await page.goto('http://localhost:3000/collection/TEST-001/manage');
  await page.waitForLoadState('networkidle');
  await page.waitForTimeout(3000);

  console.log('1. Page loaded');
  await page.screenshot({ path: 'unified-migration-initial.png', fullPage: true });

  // Check clickable cells exist
  const clickableCells = await page.locator('.match-status-cell.clickable').count();
  console.log(`   Clickable cells: ${clickableCells}`);

  // Click first UNMATCHED status
  console.log('\n2. Clicking UNMATCHED status...');
  const unmatchedCell = page.locator('.match-status-cell.clickable').filter({ hasText: 'UNMATCHED' }).first();
  
  if (await unmatchedCell.count() > 0) {
    await unmatchedCell.click();
    await page.waitForTimeout(2000);

    // Check if UnifiedEditor opened
    const dialog = page.locator('.bp5-dialog, .bp6-dialog');
    const dialogVisible = await dialog.isVisible().catch(() => false);
    console.log(`   Dialog visible: ${dialogVisible}`);

    if (dialogVisible) {
      const dialogTitle = await dialog.locator('.bp5-dialog-header, .bp6-dialog-header').textContent();
      console.log(`   Dialog title: ${dialogTitle}`);

      // Check for Override mode indicators
      const allocationTab = await dialog.locator('text=/Allocation/i').count();
      const commentTab = await dialog.locator('text=/Comment/i').count();
      const reviewTab = await dialog.locator('text=/Review/i').count();
      
      console.log(`   Tabs found: Allocation(${allocationTab}) Comment(${commentTab}) Review(${reviewTab})`);

      await page.screenshot({ path: 'unified-migration-editor-open.png' });

      expect(dialogVisible).toBe(true);
      expect(allocationTab).toBeGreaterThan(0);
    } else {
      console.log('   ❌ Dialog did not open');
      await page.screenshot({ path: 'unified-migration-failed.png', fullPage: true });
      expect(dialogVisible).toBe(true);
    }
  } else {
    console.log('   ❌ No UNMATCHED cells found');
  }

  console.log('\n=== TEST COMPLETE ===\n');
});
