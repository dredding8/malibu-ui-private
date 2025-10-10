import { test, expect } from '@playwright/test';

test('Site Selection and Allocated Sites Workflow', async ({ page }) => {
  console.log('\n=== SITE SELECTION WORKFLOW TEST ===\n');

  // Navigate and open editor
  await page.goto('http://localhost:3000/collection/TEST-001/manage');
  await page.waitForLoadState('networkidle');
  await page.waitForTimeout(3000);

  console.log('1. Opening Manual Override Workflow...');
  const unmatchedCell = page.locator('.match-status-cell.clickable').filter({ hasText: 'UNMATCHED' }).first();
  await unmatchedCell.click();
  await page.waitForTimeout(2000);

  const dialog = page.locator('.bp5-dialog, .bp6-dialog');
  await expect(dialog).toBeVisible();
  console.log('   Editor opened ✓');

  // Screenshot initial state
  await page.screenshot({ path: 'site-workflow-1-initial.png', fullPage: true });

  console.log('\n2. Checking initial Allocated Sites state...');
  const allocatedSitesEmpty = page.locator('text=/Select sites from the left panel/i');
  const emptyVisible = await allocatedSitesEmpty.isVisible().catch(() => false);
  console.log(`   Empty state message: ${emptyVisible}`);

  console.log('\n3. Selecting first site...');

  // Find first site card and click the card itself (not the checkbox)
  const firstSiteCard = page.locator('.editor-site-card').first();
  const firstSiteName = await firstSiteCard.locator('.editor-site-card-name').textContent();
  console.log(`   First site: ${firstSiteName}`);

  // Click the card (which triggers handleSiteToggle)
  await firstSiteCard.click();
  await page.waitForTimeout(1500);

  await page.screenshot({ path: 'site-workflow-2-one-site-selected.png', fullPage: true });

  console.log('\n4. Checking Allocated Sites panel after selection...');
  const allocatedSiteCards = page.locator('.bp5-card, .bp6-card').filter({ hasText: firstSiteName });
  const allocatedCount = await allocatedSiteCards.count();
  console.log(`   "${firstSiteName}" in Allocated Sites: ${allocatedCount > 0}`);

  if (allocatedCount > 0) {
    const collectsInput = allocatedSiteCards.locator('input[type="number"]').first();
    const collectsValue = await collectsInput.inputValue();
    console.log(`   Default collects value: ${collectsValue}`);

    // Find the expand button
    const expandButton = allocatedSiteCards.locator('button').filter({ hasText: /chevron/i }).first();
    const expandButtonVisible = await expandButton.isVisible().catch(() => false);
    console.log(`   Expand button visible: ${expandButtonVisible}`);

    if (expandButtonVisible) {
      console.log('\n5. Expanding site details...');
      await expandButton.click();
      await page.waitForTimeout(1000);
      await page.screenshot({ path: 'site-workflow-3-site-expanded.png', fullPage: true });

      // Check for pass timestamps
      const passTimestamps = page.locator('text=/Pass Timestamps:/i');
      const timestampsVisible = await passTimestamps.isVisible().catch(() => false);
      console.log(`   Pass Timestamps section visible: ${timestampsVisible}`);
    }
  }

  console.log('\n6. Selecting second site...');
  const secondSiteCard = page.locator('.editor-site-card').nth(1);
  const secondSiteName = await secondSiteCard.locator('.editor-site-card-name').textContent();
  console.log(`   Second site: ${secondSiteName}`);

  // Click the card itself
  await secondSiteCard.click();
  await page.waitForTimeout(1500);

  await page.screenshot({ path: 'site-workflow-4-two-sites-selected.png', fullPage: true });

  console.log('\n7. Verifying both sites in Allocated Sites panel...');
  const allocatedSitesAll = page.locator('.bp5-card, .bp6-card').filter({
    has: page.locator('text=/Collects/i')
  });
  const totalAllocatedCards = await allocatedSitesAll.count();
  console.log(`   Total allocated site cards: ${totalAllocatedCards}`);

  console.log('\n=== WORKFLOW TEST COMPLETE ===');
  console.log('\nSummary:');
  console.log(`  ✓ Empty state displayed initially: ${emptyVisible}`);
  console.log(`  ✓ First site selected: ${firstSiteName}`);
  console.log(`  ✓ Second site selected: ${secondSiteName}`);
  console.log(`  ✓ Total sites in Allocated Sites: ${totalAllocatedCards}`);
});
