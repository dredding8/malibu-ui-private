/**
 * FINAL LIVE VALIDATION
 * Check which header is actually being used and validate priority display
 */

import { test, expect } from '@playwright/test';

test('Final live validation - check header implementation', async ({ page }) => {
  // Navigate to collection manage page
  await page.goto('http://localhost:3000/collection/550e8400-e29b-41d4-a716-446655440000/manage');
  await page.waitForTimeout(5000);

  console.log('📍 Step 1: Navigated to collection page');

  // Click first opportunity row to open modal
  const row = page.locator('[data-testid="opportunity-row"]').first();
  await row.click();
  await page.waitForTimeout(3000);

  console.log('📍 Step 2: Clicked opportunity row');

  // Find modal
  const modal = page.locator('.bp5-dialog, .bp5-drawer, .bp6-dialog, .bp6-drawer').first();
  await expect(modal).toBeVisible({ timeout: 5000 });

  console.log('✅ Step 3: Modal is visible');

  // Screenshot: Full modal
  await modal.screenshot({ path: '/Users/damon/malibu/FINAL-01-modal-full.png' });

  // Check which header component is being used
  const enhancedHeader = modal.locator('.opportunity-info-header-enhanced');
  const oldHeader = modal.locator('.opportunity-info-header');

  const hasEnhanced = await enhancedHeader.count() > 0;
  const hasOld = await oldHeader.count() > 0;

  console.log(`\n🔍 HEADER DETECTION:`);
  console.log(`   Enhanced header (.opportunity-info-header-enhanced): ${hasEnhanced ? '✅ FOUND' : '❌ NOT FOUND'}`);
  console.log(`   Old header (.opportunity-info-header): ${hasOld ? '✅ FOUND' : '❌ NOT FOUND'}`);

  if (hasEnhanced) {
    console.log('\n🎉 SUCCESS: Using OpportunityInfoHeaderEnhanced!');

    await enhancedHeader.screenshot({ path: '/Users/damon/malibu/FINAL-02-ENHANCED-HEADER.png' });

    // Check priority display
    const priorityValue = enhancedHeader.locator('.priority-value');
    const priorityCount = await priorityValue.count();

    if (priorityCount > 0) {
      const text = await priorityValue.textContent();
      console.log(`\n📊 PRIORITY VALIDATION:`);
      console.log(`   Value: ${text?.trim()}`);

      // Check if inside Tag
      const isInTag = await priorityValue.evaluate(el => {
        return el.closest('.bp5-tag, .bp6-tag') !== null;
      });

      console.log(`   Inside Tag component: ${isInTag ? '❌ YES (INCORRECT)' : '✅ NO (CORRECT)'}`);

      // Check styling
      const styles = await priorityValue.evaluate(el => {
        const computed = window.getComputedStyle(el);
        return {
          fontSize: computed.fontSize,
          fontWeight: computed.fontWeight,
          tagName: el.tagName,
          className: el.className
        };
      });

      console.log(`   Font size: ${styles.fontSize === '16px' ? '✅ 16px (CORRECT)' : '❌ ' + styles.fontSize + ' (INCORRECT)'}`);
      console.log(`   Font weight: ${styles.fontWeight === '600' ? '✅ 600 (CORRECT)' : '❌ ' + styles.fontWeight + ' (INCORRECT)'}`);
      console.log(`   Tag name: ${styles.tagName}`);
      console.log(`   Class: ${styles.className}`);

      // Screenshot priority closeup
      await priorityValue.screenshot({ path: '/Users/damon/malibu/FINAL-03-PRIORITY-CLOSEUP.png' });

    } else {
      console.log('\n❌ .priority-value not found in enhanced header');
    }

    // Check other elements
    const satelliteName = await enhancedHeader.locator('.satellite-name').count();
    const sccTag = await enhancedHeader.locator('.property-item:has-text("SCC") .bp5-tag, .property-item:has-text("SCC") .bp6-tag').count();
    const orbitTag = await enhancedHeader.locator('.property-item:has-text("Orbit") .bp5-tag, .property-item:has-text("Orbit") .bp6-tag').count();

    console.log(`\n📋 OTHER ELEMENTS:`);
    console.log(`   Satellite name (H5): ${satelliteName > 0 ? '✅' : '❌'}`);
    console.log(`   SCC uses Tag: ${sccTag > 0 ? '✅' : '❌'}`);
    console.log(`   Orbit uses Tag: ${orbitTag > 0 ? '✅' : '❌'}`);

  } else if (hasOld) {
    console.log('\n⚠️ USING OLD HEADER: Changes not live yet');
    await oldHeader.screenshot({ path: '/Users/damon/malibu/FINAL-02-OLD-HEADER.png' });

    // Check if old header has priority as Tag
    const priorityTag = oldHeader.locator('.bp5-tag, .bp6-tag').filter({ hasText: /^(1|2|3|4|LOW|MEDIUM|HIGH|CRITICAL)$/i });
    const priorityTagCount = await priorityTag.count();

    if (priorityTagCount > 0) {
      const text = await priorityTag.first().textContent();
      console.log(`\n📊 OLD HEADER PRIORITY:`);
      console.log(`   Found priority in Tag: "${text?.trim()}"`);
      console.log(`   This needs to be updated to plain number`);
    }

  } else {
    console.log('\n❌ NO HEADER FOUND: Neither old nor new header detected');
  }

  console.log('\n' + '='.repeat(60));
  console.log('VALIDATION COMPLETE - Check screenshots for visual confirmation');
  console.log('='.repeat(60));
});
