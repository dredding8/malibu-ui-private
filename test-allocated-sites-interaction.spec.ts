import { test, expect } from '@playwright/test';

test('Allocated Sites - Pass Click Interaction Test', async ({ page }) => {
  console.log('\n=== ALLOCATED SITES INTERACTION TEST ===\n');

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

  // Take screenshot of initial state
  await page.screenshot({ path: 'allocated-sites-1-initial.png', fullPage: true });

  // Check Allocation Tab structure
  console.log('\n2. Analyzing Allocation Tab structure...');

  const allocationTab = page.locator('[role="tab"]').filter({ hasText: /Allocation/i });
  await allocationTab.click();
  await page.waitForTimeout(1000);

  // Look for Available Passes section
  const availablePassesSection = page.locator('text=/Available Passes/i').first();
  const availablePassesVisible = await availablePassesSection.isVisible().catch(() => false);
  console.log(`   Available Passes section: ${availablePassesVisible}`);

  // Look for Allocated Sites section
  const allocatedSitesSection = page.locator('text=/Allocated Sites/i').first();
  const allocatedSitesVisible = await allocatedSitesSection.isVisible().catch(() => false);
  console.log(`   Allocated Sites section: ${allocatedSitesVisible}`);

  // Count passes in Available Passes
  const passes = page.locator('.pass-card, [class*="pass"]').filter({ hasText: /Pass|Satellite/i });
  const passCount = await passes.count();
  console.log(`   Pass cards found: ${passCount}`);

  // Screenshot before clicking
  await page.screenshot({ path: 'allocated-sites-2-before-click.png', fullPage: true });

  // Try clicking the first pass
  if (passCount > 0) {
    console.log('\n3. Clicking first pass...');
    const firstPass = passes.first();

    // Get pass details
    const passText = await firstPass.textContent();
    console.log(`   Pass text: ${passText}`);

    await firstPass.click();
    await page.waitForTimeout(2000);

    await page.screenshot({ path: 'allocated-sites-3-after-click.png', fullPage: true });

    // Check Allocated Sites panel for content
    console.log('\n4. Checking Allocated Sites panel...');

    // Look for site cards in allocated sites area
    const allocatedSiteCards = page.locator('[class*="site-card"]');
    const allocatedCount = await allocatedSiteCards.count();
    console.log(`   Site cards in Allocated Sites: ${allocatedCount}`);

    // Look for any content in the allocated sites area
    const allocatedContent = page.locator('text=/Allocated Sites/i').locator('..').locator('..');
    const contentText = await allocatedContent.textContent().catch(() => '');
    console.log(`   Allocated Sites content length: ${contentText.length}`);
    console.log(`   Allocated Sites content preview: ${contentText.substring(0, 200)}`);

    // Look for empty state messages
    const emptyState = page.locator('text=/No sites allocated|Select a pass|Click a pass/i');
    const emptyStateVisible = await emptyState.isVisible().catch(() => false);
    console.log(`   Empty state message visible: ${emptyStateVisible}`);

    if (emptyStateVisible) {
      const emptyStateText = await emptyState.textContent();
      console.log(`   Empty state text: ${emptyStateText}`);
    }
  }

  console.log('\n=== TEST COMPLETE ===');
});
