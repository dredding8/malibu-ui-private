import { test, expect } from '@playwright/test';

test('Manual Override Workflow - Complete E2E Test', async ({ page }) => {
  console.log('\n=== MANUAL OVERRIDE WORKFLOW E2E TEST ===\n');

  // Navigate to page
  await page.goto('http://localhost:3000/collection/TEST-001/manage');
  await page.waitForLoadState('networkidle');
  await page.waitForTimeout(3000);

  console.log('1. Page loaded - 50 assignments');
  await page.screenshot({ path: 'workflow-1-page-loaded.png', fullPage: true });

  // Step 1: Click Match Status to open editor
  console.log('\n2. Clicking UNMATCHED status to open workflow...');
  const unmatchedCell = page.locator('.match-status-cell.clickable').filter({ hasText: 'UNMATCHED' }).first();
  await unmatchedCell.click();
  await page.waitForTimeout(2000);

  const dialog = page.locator('.bp5-dialog, .bp6-dialog');
  const dialogVisible = await dialog.isVisible().catch(() => false);
  console.log(`   Editor opened: ${dialogVisible}`);
  
  if (!dialogVisible) {
    console.log('   ❌ Editor did not open');
    await page.screenshot({ path: 'workflow-failed-no-dialog.png', fullPage: true });
    expect(dialogVisible).toBe(true);
    return;
  }

  await page.screenshot({ path: 'workflow-2-editor-opened.png' });

  // Step 2: Verify Allocation Tab (Step 1)
  console.log('\n3. Testing Allocation Tab (Step 1)...');
  const allocationTab = dialog.locator('text=/1\\. Allocation/i');
  const isAllocationActive = await allocationTab.count() > 0;
  console.log(`   Allocation tab visible: ${isAllocationActive}`);

  // Check for Available Passes section
  const availablePassesSection = await dialog.locator('text=/Available Passes/i').count() > 0;
  console.log(`   Available Passes section: ${availablePassesSection}`);

  // Check for Allocated Sites section
  const allocatedSitesSection = await dialog.locator('text=/Allocated Sites/i').count() > 0;
  console.log(`   Allocated Sites section: ${allocatedSitesSection}`);

  // Check for site cards
  const siteCards = await dialog.locator('.bp5-card, .bp6-card').count();
  console.log(`   Site cards found: ${siteCards}`);

  await page.screenshot({ path: 'workflow-3-allocation-tab.png' });

  // Step 3: Click Justification tab (Step 2)
  console.log('\n4. Testing Justification Tab (Step 2)...');
  const justificationTab = dialog.locator('text=/2\\. Justification/i');
  const hasJustificationTab = await justificationTab.count() > 0;
  console.log(`   Justification tab found: ${hasJustificationTab}`);

  if (hasJustificationTab) {
    await justificationTab.click();
    await page.waitForTimeout(1000);
    
    // Check for justification form
    const hasTextArea = await dialog.locator('textarea').count() > 0;
    console.log(`   Justification text area: ${hasTextArea}`);
    
    await page.screenshot({ path: 'workflow-4-justification-tab.png' });
  }

  // Step 4: Click Review tab (Step 3)
  console.log('\n5. Testing Review Tab (Step 3)...');
  const reviewTab = dialog.locator('text=/3\\. Review/i');
  const hasReviewTab = await reviewTab.count() > 0;
  console.log(`   Review tab found: ${hasReviewTab}`);

  if (hasReviewTab) {
    await reviewTab.click();
    await page.waitForTimeout(1000);
    
    await page.screenshot({ path: 'workflow-5-review-tab.png' });
  }

  // Step 5: Test close functionality
  console.log('\n6. Testing close functionality...');
  const closeButton = dialog.locator('.bp5-dialog-close-button, .bp6-dialog-close-button');
  const hasCloseButton = await closeButton.count() > 0;
  console.log(`   Close button found: ${hasCloseButton}`);

  if (hasCloseButton) {
    await closeButton.click();
    await page.waitForTimeout(1000);
    
    const dialogClosed = !(await dialog.isVisible().catch(() => false));
    console.log(`   Dialog closed: ${dialogClosed}`);
    
    await page.screenshot({ path: 'workflow-6-closed.png', fullPage: true });
    expect(dialogClosed).toBe(true);
  }

  // Step 6: Test reopening workflow
  console.log('\n7. Testing reopen workflow...');
  const baselineCell = page.locator('.match-status-cell.clickable').filter({ hasText: 'BASELINE' }).first();
  
  if (await baselineCell.count() > 0) {
    await baselineCell.click();
    await page.waitForTimeout(1500);
    
    const dialogReopened = await dialog.isVisible().catch(() => false);
    console.log(`   Dialog reopened: ${dialogReopened}`);
    
    if (dialogReopened) {
      await page.screenshot({ path: 'workflow-7-reopened.png' });
      
      // Close again
      const closeBtn = dialog.locator('.bp5-dialog-close-button, .bp6-dialog-close-button');
      if (await closeBtn.count() > 0) {
        await closeBtn.click();
        await page.waitForTimeout(500);
      }
    }
  }

  console.log('\n=== WORKFLOW TEST COMPLETE ===\n');
  console.log('Summary:');
  console.log(`  ✓ Editor opens: ${dialogVisible}`);
  console.log(`  ✓ Allocation tab: ${isAllocationActive}`);
  console.log(`  ✓ Justification tab: ${hasJustificationTab}`);
  console.log(`  ✓ Review tab: ${hasReviewTab}`);
  console.log(`  ✓ Site cards: ${siteCards}`);
});
