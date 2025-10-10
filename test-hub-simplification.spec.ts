import { test, expect } from '@playwright/test';

/**
 * Collection Hub Simplification Validation Test
 *
 * Purpose: Validate that redundant UI elements have been removed and
 * the simplified interface matches Round Table recommendations.
 *
 * Expected Changes:
 * ✅ SmartViewSelector removed (6 filter buttons)
 * ✅ Compact View toggle removed
 * ✅ Insights toggle removed
 * ✅ Statistics Dashboard simplified (6 cards → 2 cards: Health + Critical)
 * ✅ activeView state removed (no "Clear filter" button)
 */

test.describe('Collection Hub Simplification Validation', () => {
  test.beforeEach(async ({ page }) => {
    // Start dev server or navigate to running instance
    await page.goto('http://localhost:3000/collection/DECK-1758570229031/manage');

    // Wait for page to load
    await page.waitForSelector('.collection-opportunities-hub', { timeout: 10000 });
  });

  test('should NOT display SmartViewSelector component', async ({ page }) => {
    console.log('🔍 Checking for SmartViewSelector removal...');

    // Check that SmartViewSelector container does not exist
    const smartViewSelector = page.locator('.smart-view-selector');
    await expect(smartViewSelector).toHaveCount(0);

    // Check that none of the SmartView filter buttons exist
    const allOpportunitiesBtn = page.getByRole('button', { name: /All Opportunities/i });
    await expect(allOpportunitiesBtn).toHaveCount(0);

    const mySensorsBtn = page.getByRole('button', { name: /My Sensors/i });
    await expect(mySensorsBtn).toHaveCount(0);

    const needsReviewBtn = page.getByRole('button', { name: /Needs Review/i });
    await expect(needsReviewBtn).toHaveCount(0);

    const criticalViewBtn = page.getByRole('button', { name: /Critical Issues/i }).filter({ has: page.locator('.smart-view-selector') });
    await expect(criticalViewBtn).toHaveCount(0);

    const unmatchedBtn = page.getByRole('button', { name: /Unmatched/i });
    await expect(unmatchedBtn).toHaveCount(0);

    const validationBtn = page.getByRole('button', { name: /Needs Validation/i });
    await expect(validationBtn).toHaveCount(0);

    console.log('✅ SmartViewSelector successfully removed');
  });

  test('should NOT display activeView indicator or clear button', async ({ page }) => {
    console.log('🔍 Checking for activeView state removal...');

    // Check that active view indicator does not exist
    const activeViewIndicator = page.locator('.active-view-indicator');
    await expect(activeViewIndicator).toHaveCount(0);

    // Check that clear filter button does not exist
    const clearViewButton = page.locator('.clear-view-button');
    await expect(clearViewButton).toHaveCount(0);

    console.log('✅ activeView state successfully removed');
  });

  test('should NOT display Compact View toggle', async ({ page }) => {
    console.log('🔍 Checking for Compact View toggle removal...');

    // Scroll to status bar
    await page.locator('.hub-status-bar').scrollIntoViewIfNeeded();

    // Check that compact view toggle does not exist
    const compactToggle = page.getByRole('button', { name: /Compact view|Expand view/i });
    await expect(compactToggle).toHaveCount(0);

    // Check that minimize/maximize icons don't exist in status bar
    const minimizeIcon = page.locator('.hub-status-bar .bp5-icon-minimize');
    await expect(minimizeIcon).toHaveCount(0);

    const maximizeIcon = page.locator('.hub-status-bar .bp5-icon-maximize');
    await expect(maximizeIcon).toHaveCount(0);

    console.log('✅ Compact View toggle successfully removed');
  });

  test('should NOT display Insights toggle', async ({ page }) => {
    console.log('🔍 Checking for Insights toggle removal...');

    // Scroll to status bar
    await page.locator('.hub-status-bar').scrollIntoViewIfNeeded();

    // Check that insights toggle does not exist
    const insightsToggle = page.getByRole('button', { name: /Hide insights|Show insights/i });
    await expect(insightsToggle).toHaveCount(0);

    // Check that eye icons don't exist in status bar
    const eyeOpenIcon = page.locator('.hub-status-bar .bp5-icon-eye-open');
    await expect(eyeOpenIcon).toHaveCount(0);

    const eyeOffIcon = page.locator('.hub-status-bar .bp5-icon-eye-off');
    await expect(eyeOffIcon).toHaveCount(0);

    // Check that insights-toggle class doesn't exist
    const insightsToggleClass = page.locator('.insights-toggle');
    await expect(insightsToggleClass).toHaveCount(0);

    console.log('✅ Insights toggle successfully removed');
  });

  test('should display ONLY 2 stat cards: System Health + Critical Issues', async ({ page }) => {
    console.log('🔍 Checking Statistics Dashboard simplification...');

    // Wait for stats container
    await page.locator('.hub-stats-container').waitFor({ state: 'visible' });

    // Check that compact layout is used
    const compactStats = page.locator('.hub-stats-compact');
    await expect(compactStats).toBeVisible();

    // Count total stat cards - should be exactly 2
    const statCards = page.locator('.stat-card');
    const count = await statCards.count();
    expect(count).toBe(2);
    console.log(`✅ Found ${count} stat cards (expected: 2)`);

    // Verify System Health card exists
    const healthCard = page.locator('.stat-card.health-summary');
    await expect(healthCard).toBeVisible();
    await expect(healthCard.locator('#stat-health-label')).toContainText('System Health');

    // Verify health percentage is displayed
    const healthValue = healthCard.locator('.stat-value');
    await expect(healthValue).toBeVisible();
    const healthText = await healthValue.textContent();
    expect(healthText).toMatch(/\d+%/);
    console.log(`✅ System Health: ${healthText}`);

    // Verify health bar exists
    const healthBar = healthCard.locator('.health-bar');
    await expect(healthBar).toBeVisible();

    // Verify Critical Issues card exists
    const criticalCard = page.locator('.stat-card.critical');
    await expect(criticalCard).toBeVisible();
    await expect(criticalCard.locator('#stat-critical-label')).toContainText('Critical Issues');

    // Verify critical count is displayed
    const criticalValue = criticalCard.locator('.stat-value');
    await expect(criticalValue).toBeVisible();
    const criticalText = await criticalValue.textContent();
    expect(criticalText).toMatch(/\d+/);
    console.log(`✅ Critical Issues: ${criticalText}`);

    console.log('✅ Statistics Dashboard successfully simplified to 2 cards');
  });

  test('should NOT display removed stat cards (Total, Optimal, Warnings, Pending)', async ({ page }) => {
    console.log('🔍 Checking that removed stat cards are gone...');

    await page.locator('.hub-stats-container').waitFor({ state: 'visible' });

    // Check that Total Opportunities card does NOT exist
    const totalCard = page.locator('.stat-card.total');
    await expect(totalCard).toHaveCount(0);
    const totalLabel = page.locator('#stat-total-label');
    await expect(totalLabel).toHaveCount(0);
    console.log('✅ Total Opportunities card removed');

    // Check that Optimal card does NOT exist
    const optimalCard = page.locator('.stat-card.optimal');
    await expect(optimalCard).toHaveCount(0);
    const optimalLabel = page.locator('#stat-optimal-label');
    await expect(optimalLabel).toHaveCount(0);
    console.log('✅ Optimal card removed');

    // Check that Warnings card does NOT exist
    const warningCard = page.locator('.stat-card.warning');
    await expect(warningCard).toHaveCount(0);
    const warningLabel = page.locator('#stat-warning-label');
    await expect(warningLabel).toHaveCount(0);
    console.log('✅ Warnings card removed');

    // Check that Pending Changes card does NOT exist
    const pendingCard = page.locator('.stat-card.pending');
    await expect(pendingCard).toHaveCount(0);
    const pendingLabel = page.locator('#stat-pending-label');
    await expect(pendingLabel).toHaveCount(0);
    console.log('✅ Pending Changes card removed');
  });

  test('should verify Critical Issues card is interactive when issues exist', async ({ page }) => {
    console.log('🔍 Checking Critical Issues card interactivity...');

    const criticalCard = page.locator('.stat-card.critical');
    await expect(criticalCard).toBeVisible();

    // Get the critical count
    const criticalValue = criticalCard.locator('.stat-value');
    const criticalText = await criticalValue.textContent();
    const criticalCount = parseInt(criticalText?.match(/\d+/)?.[0] || '0');

    console.log(`Critical issues count: ${criticalCount}`);

    if (criticalCount > 0) {
      // Card should be interactive
      await expect(criticalCard).toHaveClass(/has-issues/);

      // Check for "Click to view" action text
      const actionText = criticalCard.locator('.stat-action');
      await expect(actionText).toContainText('Click to view');

      // Click the card
      await criticalCard.click();

      // Wait a bit for search to update
      await page.waitForTimeout(500);

      // Verify search bar has been updated with filter
      const searchInput = page.locator('.search-input-enhanced');
      const searchValue = await searchInput.inputValue();
      expect(searchValue).toContain('critical');

      console.log(`✅ Critical card clicked, search filter applied: "${searchValue}"`);
    } else {
      console.log('⚠️ No critical issues - skipping interactivity test');
    }
  });

  test('should verify Search bar is now primary filter mechanism', async ({ page }) => {
    console.log('🔍 Checking Search bar functionality...');

    // Search bar should be visible and prominent
    const searchInput = page.locator('.search-input-enhanced');
    await expect(searchInput).toBeVisible();

    // Search should have clear placeholder
    const placeholder = await searchInput.getAttribute('placeholder');
    expect(placeholder).toContain('Search');
    console.log(`✅ Search placeholder: "${placeholder}"`);

    // Test search functionality
    await searchInput.fill('critical');
    await page.waitForTimeout(500); // Wait for debounce

    // Result count should update
    const resultCount = page.locator('.result-count');
    await expect(resultCount).toBeVisible();
    const countText = await resultCount.textContent();
    console.log(`✅ Search results: ${countText}`);

    // Clear search
    const clearButton = page.locator('.search-clear-button');
    await expect(clearButton).toBeVisible();
    await clearButton.click();

    // Verify search cleared
    const clearedValue = await searchInput.inputValue();
    expect(clearedValue).toBe('');
    console.log('✅ Search cleared successfully');
  });

  test('should verify keyboard navigation is simplified', async ({ page }) => {
    console.log('🔍 Checking keyboard navigation...');

    // Start at search input
    const searchInput = page.locator('.search-input-enhanced');
    await searchInput.focus();

    let tabCount = 0;
    const maxTabs = 20;
    const tabbableElements: string[] = [];

    // Tab through elements and record what we encounter
    for (let i = 0; i < maxTabs; i++) {
      await page.keyboard.press('Tab');
      tabCount++;

      const focusedElement = await page.evaluate(() => {
        const el = document.activeElement;
        return {
          tag: el?.tagName,
          className: el?.className,
          ariaLabel: el?.getAttribute('aria-label'),
          text: el?.textContent?.substring(0, 50)
        };
      });

      const elementDesc = `${focusedElement.tag}.${focusedElement.className} [${focusedElement.ariaLabel || focusedElement.text}]`;
      tabbableElements.push(elementDesc);

      // Stop if we've reached the table (main content)
      if (focusedElement.className?.includes('tab-panel') || tabCount >= maxTabs) {
        break;
      }
    }

    console.log(`✅ Tab stops before main content: ${tabCount}`);
    console.log('Tabbable elements:', tabbableElements.slice(0, 10));

    // Should be significantly fewer than the old 30+ tab stops
    // Target: ~15 or less
    expect(tabCount).toBeLessThan(20);
    console.log(`✅ Keyboard navigation simplified (${tabCount} tab stops, target: <20)`);
  });

  test('should verify visual hierarchy improvements', async ({ page }) => {
    console.log('🔍 Checking visual hierarchy...');

    // Take screenshot for visual verification
    await page.screenshot({
      path: 'test-results/hub-simplification-after.png',
      fullPage: true
    });
    console.log('📸 Screenshot saved: test-results/hub-simplification-after.png');

    // Count total interactive elements in header area
    const headerSection = page.locator('.smart-views-container, .hub-stats-container').first();
    const interactiveElements = await headerSection.locator('button, a, input, [role="button"]').count();

    console.log(`✅ Interactive elements in header: ${interactiveElements}`);

    // Should be significantly fewer than before (old: 18+ elements)
    // New: Search input (1) + Clear button (1) + 2 stat cards (2 if critical > 0) = ~4 elements
    expect(interactiveElements).toBeLessThan(10);

    console.log('✅ Visual hierarchy simplified');
  });

  test('should verify "System Overview" replaces "Collection Overview"', async ({ page }) => {
    console.log('🔍 Checking stats header text...');

    const statsHeader = page.locator('.stats-header .stats-title');
    await expect(statsHeader).toContainText('System Overview');

    // Should NOT contain old text
    await expect(statsHeader).not.toContainText('Collection Overview');

    console.log('✅ Stats header updated to "System Overview"');
  });

  test('should calculate cognitive load reduction', async ({ page }) => {
    console.log('🔍 Calculating cognitive load metrics...');

    // Count total UI elements
    const totalButtons = await page.locator('button').count();
    const totalInputs = await page.locator('input').count();
    const totalCards = await page.locator('.stat-card').count();
    const totalTabs = await page.locator('[role="tab"]').count();

    console.log(`📊 UI Element Counts:`);
    console.log(`   Buttons: ${totalButtons}`);
    console.log(`   Inputs: ${totalInputs}`);
    console.log(`   Stat Cards: ${totalCards} (expected: 2)`);
    console.log(`   Tabs: ${totalTabs}`);

    // Verify stat cards = 2
    expect(totalCards).toBe(2);

    // Count decision points (interactive elements in header)
    const headerButtons = await page.locator('.hub-stats-container button, .smart-views-container button').count();
    console.log(`   Decision points in header area: ${headerButtons}`);

    // Should be minimal (ideally 0-1 in stats, since search is separate)
    expect(headerButtons).toBeLessThanOrEqual(2);

    console.log('✅ Cognitive load significantly reduced');
  });

  test('should verify all essential functionality preserved', async ({ page }) => {
    console.log('🔍 Verifying essential functionality preserved...');

    // 1. Search functionality
    const searchInput = page.locator('.search-input-enhanced');
    await expect(searchInput).toBeVisible();
    console.log('✅ Search functionality: PRESERVED');

    // 2. Tabs navigation
    const tabs = page.locator('[role="tab"]');
    const tabCount = await tabs.count();
    expect(tabCount).toBeGreaterThanOrEqual(2);
    console.log(`✅ Tab navigation: PRESERVED (${tabCount} tabs)`);

    // 3. System Health metric
    const healthCard = page.locator('.stat-card.health-summary');
    await expect(healthCard).toBeVisible();
    console.log('✅ System Health metric: PRESERVED');

    // 4. Critical Issues tracking
    const criticalCard = page.locator('.stat-card.critical');
    await expect(criticalCard).toBeVisible();
    console.log('✅ Critical Issues tracking: PRESERVED');

    // 5. Status bar
    const statusBar = page.locator('.hub-status-bar');
    await expect(statusBar).toBeVisible();
    console.log('✅ Status bar: PRESERVED');

    // 6. Main table/content area
    const tabPanel = page.locator('.tab-panel');
    await expect(tabPanel).toBeVisible();
    console.log('✅ Main content area: PRESERVED');

    console.log('✅ All essential functionality preserved');
  });

  test('should generate validation summary report', async ({ page }) => {
    console.log('\n' + '='.repeat(70));
    console.log('📋 COLLECTION HUB SIMPLIFICATION VALIDATION SUMMARY');
    console.log('='.repeat(70));

    const results = {
      removed: {
        smartViewSelector: false,
        activeViewState: false,
        compactToggle: false,
        insightsToggle: false,
        totalCard: false,
        optimalCard: false,
        warningCard: false,
        pendingCard: false
      },
      preserved: {
        healthCard: false,
        criticalCard: false,
        searchBar: false,
        tabs: false,
        statusBar: false,
        mainContent: false
      },
      metrics: {
        statCards: 0,
        keyboardStops: 0,
        headerButtons: 0
      }
    };

    // Check removals
    results.removed.smartViewSelector = await page.locator('.smart-view-selector').count() === 0;
    results.removed.activeViewState = await page.locator('.active-view-indicator').count() === 0;
    results.removed.compactToggle = await page.getByRole('button', { name: /Compact view/i }).count() === 0;
    results.removed.insightsToggle = await page.getByRole('button', { name: /insights/i }).count() === 0;
    results.removed.totalCard = await page.locator('.stat-card.total').count() === 0;
    results.removed.optimalCard = await page.locator('.stat-card.optimal').count() === 0;
    results.removed.warningCard = await page.locator('.stat-card.warning').count() === 0;
    results.removed.pendingCard = await page.locator('.stat-card.pending').count() === 0;

    // Check preserved
    results.preserved.healthCard = await page.locator('.stat-card.health-summary').count() === 1;
    results.preserved.criticalCard = await page.locator('.stat-card.critical').count() === 1;
    results.preserved.searchBar = await page.locator('.search-input-enhanced').count() === 1;
    results.preserved.tabs = await page.locator('[role="tab"]').count() >= 2;
    results.preserved.statusBar = await page.locator('.hub-status-bar').count() === 1;
    results.preserved.mainContent = await page.locator('.tab-panel').count() >= 1;

    // Metrics
    results.metrics.statCards = await page.locator('.stat-card').count();
    results.metrics.headerButtons = await page.locator('.hub-stats-container button, .smart-views-container button').count();

    console.log('\n✅ REMOVED (Expected: All ✅):');
    console.log(`   SmartViewSelector: ${results.removed.smartViewSelector ? '✅' : '❌'}`);
    console.log(`   ActiveView State: ${results.removed.activeViewState ? '✅' : '❌'}`);
    console.log(`   Compact Toggle: ${results.removed.compactToggle ? '✅' : '❌'}`);
    console.log(`   Insights Toggle: ${results.removed.insightsToggle ? '✅' : '❌'}`);
    console.log(`   Total Card: ${results.removed.totalCard ? '✅' : '❌'}`);
    console.log(`   Optimal Card: ${results.removed.optimalCard ? '✅' : '❌'}`);
    console.log(`   Warning Card: ${results.removed.warningCard ? '✅' : '❌'}`);
    console.log(`   Pending Card: ${results.removed.pendingCard ? '✅' : '❌'}`);

    console.log('\n✅ PRESERVED (Expected: All ✅):');
    console.log(`   Health Card: ${results.preserved.healthCard ? '✅' : '❌'}`);
    console.log(`   Critical Card: ${results.preserved.criticalCard ? '✅' : '❌'}`);
    console.log(`   Search Bar: ${results.preserved.searchBar ? '✅' : '❌'}`);
    console.log(`   Tabs: ${results.preserved.tabs ? '✅' : '❌'}`);
    console.log(`   Status Bar: ${results.preserved.statusBar ? '✅' : '❌'}`);
    console.log(`   Main Content: ${results.preserved.mainContent ? '✅' : '❌'}`);

    console.log('\n📊 METRICS:');
    console.log(`   Stat Cards: ${results.metrics.statCards} (target: 2)`);
    console.log(`   Header Buttons: ${results.metrics.headerButtons} (target: <3)`);

    console.log('\n' + '='.repeat(70));
    console.log('✅ VALIDATION COMPLETE');
    console.log('='.repeat(70) + '\n');

    // Assert all checks passed
    expect(Object.values(results.removed).every(v => v === true)).toBeTruthy();
    expect(Object.values(results.preserved).every(v => v === true)).toBeTruthy();
    expect(results.metrics.statCards).toBe(2);
  });
});
