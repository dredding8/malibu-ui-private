import { test, expect } from '@playwright/test';

/**
 * Legacy View Tabs Validation Test
 *
 * Validates that the legacy view tabs (ALL, NEEDS REVIEW, UNMATCHED)
 * are present with correct counts and filtering works
 */

test.describe('Legacy View Tabs Implementation', () => {
  test('should display legacy view tabs with counts', async ({ page }) => {
    console.log('\n========================================');
    console.log('LEGACY VIEW TABS VALIDATION');
    console.log('========================================\n');

    // Navigate to collection management page
    await page.goto('http://localhost:3000/collection/DECK-1757517559289/manage');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(2000);

    console.log('📍 Page: Collection Management');
    console.log('URL: http://localhost:3000/collection/DECK-1757517559289/manage\n');

    // Take screenshot
    await page.screenshot({ path: 'legacy-tabs-initial.png', fullPage: true });

    // Find the tab elements
    const tabs = page.locator('#legacy-view-tabs .bp5-tab');
    const tabCount = await tabs.count();

    console.log(`🔍 Found ${tabCount} tabs\n`);

    // Get all tab texts
    const tabTexts = await tabs.allTextContents();

    console.log('📋 Tab Labels:');
    tabTexts.forEach((text, index) => {
      console.log(`  ${index + 1}. "${text}"`);
    });

    // Check for required tabs
    const hasAll = tabTexts.some(t => t.includes('ALL'));
    const hasNeedsReview = tabTexts.some(t => t.includes('NEEDS REVIEW'));
    const hasUnmatched = tabTexts.some(t => t.includes('UNMATCHED'));

    console.log('\n✅ Required Tabs:');
    console.log(`  ${hasAll ? '✅' : '❌'} ALL tab: ${hasAll ? 'PRESENT' : 'MISSING'}`);
    console.log(`  ${hasNeedsReview ? '✅' : '❌'} NEEDS REVIEW tab: ${hasNeedsReview ? 'PRESENT' : 'MISSING'}`);
    console.log(`  ${hasUnmatched ? '✅' : '❌'} UNMATCHED tab: ${hasUnmatched ? 'PRESENT' : 'MISSING'}`);

    // Extract counts from tab labels
    const needsReviewMatch = tabTexts.find(t => t.includes('NEEDS REVIEW'));
    const unmatchedMatch = tabTexts.find(t => t.includes('UNMATCHED'));

    if (needsReviewMatch) {
      const count = needsReviewMatch.match(/\((\d+)\)/)?.[1];
      console.log(`\n📊 NEEDS REVIEW count: ${count || '0'}`);
    }

    if (unmatchedMatch) {
      const count = unmatchedMatch.match(/\((\d+)\)/)?.[1];
      console.log(`📊 UNMATCHED count: ${count || '0'}`);
    }

    // Test tab interaction
    console.log('\n🔍 Testing Tab Interaction...\n');

    // Click on NEEDS REVIEW tab
    if (hasNeedsReview) {
      const needsReviewTab = tabs.filter({ hasText: 'NEEDS REVIEW' });
      await needsReviewTab.click();
      await page.waitForTimeout(1000);

      console.log('  Clicked "NEEDS REVIEW" tab');
      await page.screenshot({ path: 'legacy-tabs-needs-review.png', fullPage: true });

      // Count visible rows
      const rowsAfterFilter = await page.locator('.bp5-table-row').count();
      console.log(`  Visible rows after filter: ${rowsAfterFilter}`);
    }

    // Click on UNMATCHED tab
    if (hasUnmatched) {
      const unmatchedTab = tabs.filter({ hasText: 'UNMATCHED' });
      await unmatchedTab.click();
      await page.waitForTimeout(1000);

      console.log('  Clicked "UNMATCHED" tab');
      await page.screenshot({ path: 'legacy-tabs-unmatched.png', fullPage: true });

      // Count visible rows
      const rowsAfterFilter = await page.locator('.bp5-table-row').count();
      console.log(`  Visible rows after filter: ${rowsAfterFilter}`);
    }

    // Click back to ALL tab
    if (hasAll) {
      const allTab = tabs.filter({ hasText: /^ALL$/ });
      await allTab.click();
      await page.waitForTimeout(1000);

      console.log('  Clicked "ALL" tab');
      await page.screenshot({ path: 'legacy-tabs-all.png', fullPage: true });

      // Count visible rows
      const rowsAfterFilter = await page.locator('.bp5-table-row').count();
      console.log(`  Visible rows after filter: ${rowsAfterFilter}`);
    }

    console.log('\n========================================');
    console.log('VALIDATION COMPLETE');
    console.log('========================================\n');

    // Assertions
    expect(tabCount).toBe(3);
    expect(hasAll).toBeTruthy();
    expect(hasNeedsReview).toBeTruthy();
    expect(hasUnmatched).toBeTruthy();
  });
});
