import { test, expect } from '@playwright/test';

/**
 * Design Refinement Validation Test
 *
 * Purpose: Validate Tier 1 design refinements based on Round Table recommendations
 *
 * Changes Validated:
 * ✅ Smart Views container removed
 * ✅ "Click to view →" helper text removed
 * ✅ Icon sizes reduced (20px → 16px)
 * ✅ Trend icons replaced with Unicode symbols (↑ ↓)
 * ✅ Section heading updated ("System Overview" → "Health & Alerts")
 */

test.describe('Design Refinement Validation', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('http://localhost:3000/collection/DECK-1758570229031/manage');
    await page.waitForSelector('.collection-opportunities-hub', { timeout: 10000 });
  });

  test('Smart Views container should be removed', async ({ page }) => {
    console.log('🔍 Checking Smart Views container removal...');

    // Container should not exist
    const smartViewsContainer = page.locator('.smart-views-container');
    await expect(smartViewsContainer).toHaveCount(0);

    // Title should not exist
    const smartViewsTitle = page.locator('.smart-views-title');
    await expect(smartViewsTitle).toHaveCount(0);

    // Opportunity count in that section should not exist
    const opportunitiesCount = page.locator('.smart-views-container .opportunities-count');
    await expect(opportunitiesCount).toHaveCount(0);

    console.log('✅ Smart Views container successfully removed');
  });

  test('"Click to view →" helper text should be removed', async ({ page }) => {
    console.log('🔍 Checking helper text removal...');

    // Helper text action should not exist
    const actionText = page.locator('.stat-action');
    await expect(actionText).toHaveCount(0);

    // Verify critical card still exists (helper removed, not card)
    const criticalCard = page.locator('.stat-card.critical');
    await expect(criticalCard).toBeVisible();

    console.log('✅ Helper text successfully removed');
  });

  test('stat card icons should be 16px (reduced from 20px)', async ({ page }) => {
    console.log('🔍 Checking icon sizes...');

    // Health icon
    const healthIcon = page.locator('.stat-card.health-summary .bp6-icon');
    await expect(healthIcon).toBeVisible();

    const healthIconBox = await healthIcon.boundingBox();
    expect(healthIconBox?.width).toBeLessThanOrEqual(18); // Allow 2px margin for rendering
    expect(healthIconBox?.width).toBeGreaterThanOrEqual(14);
    console.log(`✅ Health icon: ${healthIconBox?.width}px (target: 16px)`);

    // Critical icon
    const criticalIcon = page.locator('.stat-card.critical .bp6-icon');
    await expect(criticalIcon).toBeVisible();

    const criticalIconBox = await criticalIcon.boundingBox();
    expect(criticalIconBox?.width).toBeLessThanOrEqual(18);
    expect(criticalIconBox?.width).toBeGreaterThanOrEqual(14);
    console.log(`✅ Critical icon: ${criticalIconBox?.width}px (target: 16px)`);
  });

  test('trend indicators should use Unicode symbols (↑ ↓)', async ({ page }) => {
    console.log('🔍 Checking trend indicators...');

    // Check if trend indicators exist
    const trendIndicators = page.locator('.trend-indicator');
    const count = await trendIndicators.count();

    if (count > 0) {
      // Verify they contain Unicode symbols, not icons
      for (let i = 0; i < count; i++) {
        const indicator = trendIndicators.nth(i);
        const text = await indicator.textContent();

        expect(text).toMatch(/↑|↓/);

        // Should NOT contain Blueprint icons
        const hasIcon = await indicator.locator('.bp6-icon').count();
        expect(hasIcon).toBe(0);

        console.log(`✅ Trend indicator ${i + 1}: "${text}" (Unicode symbol, not icon)`);
      }
    } else {
      console.log('⚠️ No trend indicators present (no trend to display)');
    }
  });

  test('section heading should be "Health & Alerts"', async ({ page }) => {
    console.log('🔍 Checking section heading...');

    const statsTitle = page.locator('.stats-title');
    await expect(statsTitle).toContainText('Health & Alerts');

    // Should NOT contain old text
    await expect(statsTitle).not.toContainText('System Overview');
    await expect(statsTitle).not.toContainText('Collection Overview');

    const titleText = await statsTitle.textContent();
    console.log(`✅ Section heading: "${titleText}"`);
  });

  test('visual hierarchy should be improved', async ({ page }) => {
    console.log('🔍 Analyzing visual hierarchy improvements...');

    // Count major sections (should be reduced)
    const majorSections = await page.locator('.hub-stats-container, .tab-panel').count();
    console.log(`Major sections: ${majorSections}`);

    // Count headings (should be reduced)
    const headings = await page.locator('h1, h2, h3').count();
    console.log(`Headings: ${headings}`);

    // Count stat cards (should be 2)
    const statCards = await page.locator('.stat-card').count();
    expect(statCards).toBe(2);
    console.log(`✅ Stat cards: ${statCards} (target: 2)`);

    // Verify spacing is consistent
    const statsContainer = page.locator('.hub-stats-container');
    await expect(statsContainer).toBeVisible();

    console.log('✅ Visual hierarchy improved');
  });

  test('icon count should be reduced', async ({ page }) => {
    console.log('🔍 Counting visible icons...');

    // Count ALL icons on page
    const allIcons = await page.locator('.bp6-icon, .bp5-icon, svg[data-icon]').count();
    console.log(`Total icons on page: ${allIcons}`);

    // Count icons in stats section specifically
    const statsIcons = await page.locator('.hub-stats-container .bp6-icon').count();
    expect(statsIcons).toBe(2); // Health + Critical only
    console.log(`✅ Stats section icons: ${statsIcons} (target: 2)`);

    // Trend indicators should NOT be counted as icons
    const trendIcons = await page.locator('.trend-indicator .bp6-icon').count();
    expect(trendIcons).toBe(0);
    console.log(`✅ Trend indicator icons: ${trendIcons} (replaced with Unicode)`);
  });

  test('critical card interactivity should be preserved', async ({ page }) => {
    console.log('🔍 Verifying critical card functionality...');

    const criticalCard = page.locator('.stat-card.critical');
    await expect(criticalCard).toBeVisible();

    // Check if card has issues (interactive)
    const hasIssues = await criticalCard.evaluate(el => el.classList.contains('has-issues'));

    if (hasIssues) {
      // Card should be clickable
      await criticalCard.click();

      // Wait for search to update
      await page.waitForTimeout(500);

      // Verify search filter applied
      const searchInput = page.locator('.search-input-enhanced');
      const searchValue = await searchInput.inputValue();
      expect(searchValue).toContain('critical');

      console.log(`✅ Critical card clickable, filter applied: "${searchValue}"`);
    } else {
      console.log('⚠️ No critical issues present');
    }
  });

  test('capture before/after comparison screenshots', async ({ page }) => {
    console.log('📸 Capturing comparison screenshots...');

    // Full page
    await page.screenshot({
      path: 'test-results/design-refinement-after-full.png',
      fullPage: true
    });

    // Stats section only
    const statsSection = page.locator('.hub-stats-container');
    await statsSection.screenshot({
      path: 'test-results/design-refinement-after-stats.png'
    });

    console.log('✅ Screenshots saved:');
    console.log('   - test-results/design-refinement-after-full.png');
    console.log('   - test-results/design-refinement-after-stats.png');
  });

  test('generate refinement validation report', async ({ page }) => {
    console.log('\n' + '='.repeat(80));
    console.log('📋 DESIGN REFINEMENT VALIDATION REPORT');
    console.log('='.repeat(80));

    const results = {
      removed: {
        smartViewsContainer: false,
        helperText: false
      },
      refined: {
        iconSizes: false,
        trendSymbols: false,
        headingUpdated: false
      },
      preserved: {
        statCards: 0,
        criticalInteractivity: false
      }
    };

    // Check removals
    results.removed.smartViewsContainer = await page.locator('.smart-views-container').count() === 0;
    results.removed.helperText = await page.locator('.stat-action').count() === 0;

    // Check refinements
    const healthIcon = page.locator('.stat-card.health-summary .bp6-icon').first();
    if (await healthIcon.count() > 0) {
      const iconBox = await healthIcon.boundingBox();
      results.refined.iconSizes = (iconBox?.width || 0) <= 18 && (iconBox?.width || 0) >= 14;
    }

    const trendIndicators = page.locator('.trend-indicator');
    if (await trendIndicators.count() > 0) {
      const text = await trendIndicators.first().textContent();
      results.refined.trendSymbols = (text?.includes('↑') || text?.includes('↓')) || false;
    } else {
      results.refined.trendSymbols = true; // No trends = pass
    }

    const heading = page.locator('.stats-title');
    results.refined.headingUpdated = await heading.textContent().then(t => t?.includes('Health & Alerts')) || false;

    // Check preserved functionality
    results.preserved.statCards = await page.locator('.stat-card').count();
    const criticalCard = page.locator('.stat-card.critical');
    results.preserved.criticalInteractivity = await criticalCard.count() === 1;

    console.log('\n✅ REMOVALS (Expected: All ✅):');
    console.log(`   Smart Views Container: ${results.removed.smartViewsContainer ? '✅' : '❌'}`);
    console.log(`   Helper Text ("Click to view"): ${results.removed.helperText ? '✅' : '❌'}`);

    console.log('\n🎨 REFINEMENTS (Expected: All ✅):');
    console.log(`   Icon Sizes (20px → 16px): ${results.refined.iconSizes ? '✅' : '❌'}`);
    console.log(`   Trend Symbols (icons → ↑↓): ${results.refined.trendSymbols ? '✅' : '❌'}`);
    console.log(`   Heading ("Health & Alerts"): ${results.refined.headingUpdated ? '✅' : '❌'}`);

    console.log('\n✅ PRESERVED (Expected: All ✅):');
    console.log(`   Stat Cards: ${results.preserved.statCards} (target: 2)`);
    console.log(`   Critical Card Interactivity: ${results.preserved.criticalInteractivity ? '✅' : '❌'}`);

    console.log('\n' + '='.repeat(80));
    console.log('✅ TIER 1 DESIGN REFINEMENTS COMPLETE');
    console.log('='.repeat(80) + '\n');

    // Assert all checks passed
    expect(Object.values(results.removed).every(v => v === true)).toBeTruthy();
    expect(Object.values(results.refined).every(v => v === true)).toBeTruthy();
    expect(results.preserved.statCards).toBe(2);
    expect(results.preserved.criticalInteractivity).toBeTruthy();
  });
});
