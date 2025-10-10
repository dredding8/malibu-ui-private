import { test, expect } from '@playwright/test';

test('Manual Click Test - Fixed Implementation', async ({ page }) => {
  console.log('\n=== MANUAL CLICK TEST ===\n');

  await page.goto('http://localhost:3000/collection/TEST-001/manage');
  await page.waitForLoadState('networkidle');
  await page.waitForTimeout(3000);

  console.log('1. Page loaded - taking screenshot...');
  await page.screenshot({ path: 'manual-fixed-initial.png', fullPage: true });

  // Check clickable divs
  const clickableDivs = await page.locator('.match-status-cell.clickable').count();
  console.log(`   Clickable divs found: ${clickableDivs}`);

  // Check if tags are inside clickable divs
  const tagsInClickable = await page.locator('.match-status-cell.clickable .bp5-tag, .match-status-cell.clickable .bp6-tag').count();
  console.log(`   Tags inside clickable divs: ${tagsInClickable}`);

  // Try clicking the first UNMATCHED badge
  console.log('\n2. Clicking first UNMATCHED badge...');
  const unmatchedBadge = page.locator('.match-status-cell.clickable').filter({ hasText: 'UNMATCHED' }).first();
  
  if (await unmatchedBadge.count() > 0) {
    // Highlight before click
    await unmatchedBadge.hover();
    await page.waitForTimeout(500);
    await page.screenshot({ path: 'manual-fixed-before-click.png' });

    // Click
    await unmatchedBadge.click();
    await page.waitForTimeout(1500);

    // Check if modal opened
    const modal = page.locator('.bp5-dialog, .bp6-dialog');
    const modalVisible = await modal.isVisible().catch(() => false);
    console.log(`   Modal opened: ${modalVisible}`);

    if (modalVisible) {
      console.log('   ✅ SUCCESS - Modal opened!');
      await page.screenshot({ path: 'manual-fixed-modal-open.png' });
      
      const modalTitle = await modal.locator('.bp5-dialog-header, .bp6-dialog-header').textContent();
      console.log(`   Modal title: ${modalTitle}`);

      expect(modalVisible).toBe(true);
    } else {
      console.log('   ❌ FAILED - Modal did not open');
      await page.screenshot({ path: 'manual-fixed-modal-failed.png', fullPage: true });
      expect(modalVisible).toBe(true);
    }
  } else {
    console.log('   ❌ No UNMATCHED badges found');
  }

  console.log('\n=== TEST COMPLETE ===\n');
});
