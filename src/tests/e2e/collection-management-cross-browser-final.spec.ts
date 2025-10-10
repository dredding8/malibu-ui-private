import { test, expect } from '@playwright/test';

interface CrossBrowserMetrics {
  browser: string;
  loadTime: number;
  elementsFound: {
    navigation: boolean;
    mainContent: boolean;
    table: boolean;
    searchInput: boolean;
  };
  interactions: {
    sorting: boolean;
    rowSelection: boolean;
    search: boolean;
  };
  responsive: {
    desktop: boolean;
    mobile: boolean;
  };
  errors: string[];
}

/**
 * Final Cross-Browser E2E tests for Collection Management
 * Robust tests with proper waiting and metrics collection
 */
test.describe('Collection Management - Cross-Browser Consistency', () => {
  const testCollectionId = 'DECK-1757517559289';
  const pageUrl = `http://localhost:3000/collection/${testCollectionId}/manage`;
  const metrics: CrossBrowserMetrics[] = [];

  test.beforeEach(async ({ page }) => {
    // Set up console error tracking
    const consoleErrors: string[] = [];
    page.on('console', msg => {
      if (msg.type() === 'error' && 
          !msg.text().includes('favicon') && 
          !msg.text().includes('DevTools')) {
        consoleErrors.push(msg.text());
      }
    });
    (page as any).consoleErrors = consoleErrors;
  });

  test('Cross-browser consistency check', async ({ page, browserName }) => {
    const metric: CrossBrowserMetrics = {
      browser: browserName,
      loadTime: 0,
      elementsFound: {
        navigation: false,
        mainContent: false,
        table: false,
        searchInput: false
      },
      interactions: {
        sorting: false,
        rowSelection: false,
        search: false
      },
      responsive: {
        desktop: false,
        mobile: false
      },
      errors: []
    };

    console.log(`\n=== Testing ${browserName.toUpperCase()} ===`);

    // 1. Page Load Test
    const startTime = Date.now();
    await page.goto(pageUrl, { waitUntil: 'networkidle', timeout: 60000 });
    
    // Wait for React app to render
    await page.waitForTimeout(3000);
    
    metric.loadTime = Date.now() - startTime;
    console.log(`✓ Page loaded in ${metric.loadTime}ms`);

    // 2. Element Visibility Tests
    // Try multiple selectors for each element type
    const elementTests = [
      {
        name: 'navigation',
        selectors: ['nav', '.navbar', '.navigation', 'header', '[role="navigation"]']
      },
      {
        name: 'mainContent',
        selectors: ['main', '.main-content', '.hub-content', '.collection-opportunities-hub', '#root > div']
      },
      {
        name: 'table',
        selectors: ['table', '.bp5-table', '.opportunities-table', '[role="table"]']
      },
      {
        name: 'searchInput',
        selectors: ['input[type="search"]', 'input[placeholder*="search" i]', 'input[placeholder*="filter" i]', '.bp5-input']
      }
    ];

    for (const test of elementTests) {
      for (const selector of test.selectors) {
        const element = page.locator(selector).first();
        if (await element.count() > 0) {
          try {
            await element.waitFor({ state: 'visible', timeout: 5000 });
            metric.elementsFound[test.name as keyof typeof metric.elementsFound] = true;
            console.log(`✓ Found ${test.name}: ${selector}`);
            break;
          } catch {
            // Continue to next selector
          }
        }
      }
      if (!metric.elementsFound[test.name as keyof typeof metric.elementsFound]) {
        console.log(`✗ ${test.name} not found`);
      }
    }

    // 3. Interaction Tests
    // Test table sorting
    if (metric.elementsFound.table) {
      const sortableHeaders = page.locator('th[role="columnheader"], .bp5-table-header, th.sortable, th');
      if (await sortableHeaders.count() > 0) {
        try {
          await sortableHeaders.first().click();
          await page.waitForTimeout(1000);
          
          // Check for sort indicators
          const sortIndicators = await page.locator('.bp5-icon-sort-asc, .bp5-icon-sort-desc, .sort-icon, [aria-sort]').count();
          metric.interactions.sorting = sortIndicators > 0;
          console.log(metric.interactions.sorting ? '✓ Sorting works' : '✗ Sorting not functional');
        } catch (e) {
          console.log('✗ Sorting test failed:', e);
        }
      }

      // Test row selection
      const rows = page.locator('tbody tr, .bp5-table-row').filter({ hasNot: page.locator('th') });
      if (await rows.count() > 0) {
        try {
          await rows.first().click();
          await page.waitForTimeout(500);
          
          const selected = await page.locator('.selected, .bp5-table-row-selected, [aria-selected="true"]').count();
          metric.interactions.rowSelection = selected > 0;
          console.log(metric.interactions.rowSelection ? '✓ Row selection works' : '✗ Row selection not functional');
        } catch (e) {
          console.log('✗ Row selection test failed:', e);
        }
      }
    }

    // Test search
    if (metric.elementsFound.searchInput) {
      try {
        const searchInput = page.locator('input[type="search"], input[placeholder*="search" i]').first();
        await searchInput.fill('test query');
        await searchInput.press('Enter');
        await page.waitForTimeout(1000);
        
        const value = await searchInput.inputValue();
        metric.interactions.search = value === 'test query';
        console.log(metric.interactions.search ? '✓ Search input works' : '✗ Search input not functional');
      } catch (e) {
        console.log('✗ Search test failed:', e);
      }
    }

    // 4. Responsive Tests
    // Desktop view
    await page.setViewportSize({ width: 1366, height: 768 });
    await page.waitForTimeout(500);
    const desktopScroll = await page.evaluate(() => 
      document.documentElement.scrollWidth <= document.documentElement.clientWidth + 20
    );
    metric.responsive.desktop = desktopScroll;
    console.log(metric.responsive.desktop ? '✓ Desktop layout OK' : '✗ Desktop has horizontal scroll');

    // Mobile view
    await page.setViewportSize({ width: 375, height: 667 });
    await page.waitForTimeout(500);
    const mobileScroll = await page.evaluate(() => 
      document.documentElement.scrollWidth <= document.documentElement.clientWidth + 20
    );
    metric.responsive.mobile = mobileScroll;
    console.log(metric.responsive.mobile ? '✓ Mobile layout OK' : '✗ Mobile has horizontal scroll');

    // 5. Console Errors
    metric.errors = (page as any).consoleErrors || [];
    if (metric.errors.length > 0) {
      console.log(`⚠ Console errors: ${metric.errors.length}`);
      metric.errors.slice(0, 3).forEach(err => console.log(`  - ${err}`));
    } else {
      console.log('✓ No console errors');
    }

    // Store metrics
    metrics.push(metric);

    // Summary for this browser
    const score = 
      (metric.loadTime < 5000 ? 1 : 0) +
      Object.values(metric.elementsFound).filter(v => v).length +
      Object.values(metric.interactions).filter(v => v).length +
      Object.values(metric.responsive).filter(v => v).length +
      (metric.errors.length === 0 ? 1 : 0);
    
    console.log(`\n${browserName} Score: ${score}/10`);
  });

  test.afterAll(async () => {
    console.log('\n\n=== CROSS-BROWSER CONSISTENCY REPORT ===\n');

    // Compare metrics across browsers
    const browsers = metrics.map(m => m.browser);
    console.log(`Browsers tested: ${browsers.join(', ')}\n`);

    // Load time comparison
    console.log('Load Times:');
    metrics.forEach(m => {
      console.log(`  ${m.browser}: ${m.loadTime}ms`);
    });
    const avgLoadTime = metrics.reduce((sum, m) => sum + m.loadTime, 0) / metrics.length;
    console.log(`  Average: ${avgLoadTime.toFixed(0)}ms\n`);

    // Element consistency
    console.log('Element Visibility Consistency:');
    const elementKeys = Object.keys(metrics[0]?.elementsFound || {});
    elementKeys.forEach(key => {
      const results = metrics.map(m => m.elementsFound[key as keyof typeof m.elementsFound]);
      const consistent = results.every(r => r === results[0]);
      console.log(`  ${key}: ${consistent ? '✅ Consistent' : '⚠️  Inconsistent'}`);
      if (!consistent) {
        metrics.forEach(m => {
          console.log(`    ${m.browser}: ${m.elementsFound[key as keyof typeof m.elementsFound] ? '✓' : '✗'}`);
        });
      }
    });

    // Interaction consistency
    console.log('\nInteraction Consistency:');
    const interactionKeys = Object.keys(metrics[0]?.interactions || {});
    interactionKeys.forEach(key => {
      const results = metrics.map(m => m.interactions[key as keyof typeof m.interactions]);
      const consistent = results.every(r => r === results[0]);
      console.log(`  ${key}: ${consistent ? '✅ Consistent' : '⚠️  Inconsistent'}`);
      if (!consistent) {
        metrics.forEach(m => {
          console.log(`    ${m.browser}: ${m.interactions[key as keyof typeof m.interactions] ? '✓' : '✗'}`);
        });
      }
    });

    // Responsive consistency
    console.log('\nResponsive Design Consistency:');
    ['desktop', 'mobile'].forEach(view => {
      const results = metrics.map(m => m.responsive[view as keyof typeof m.responsive]);
      const consistent = results.every(r => r === results[0]);
      console.log(`  ${view}: ${consistent ? '✅ Consistent' : '⚠️  Inconsistent'}`);
    });

    // Error summary
    console.log('\nConsole Errors:');
    metrics.forEach(m => {
      console.log(`  ${m.browser}: ${m.errors.length} errors`);
    });

    // Overall consistency score
    const overallScores = metrics.map(m => {
      const score = 
        (m.loadTime < 5000 ? 1 : 0) +
        Object.values(m.elementsFound).filter(v => v).length +
        Object.values(m.interactions).filter(v => v).length +
        Object.values(m.responsive).filter(v => v).length +
        (m.errors.length === 0 ? 1 : 0);
      return { browser: m.browser, score };
    });

    console.log('\nOverall Scores (out of 10):');
    overallScores.forEach(s => {
      console.log(`  ${s.browser}: ${s.score}/10`);
    });

    // Recommendations
    console.log('\n📋 RECOMMENDATIONS:');
    
    const allElementsFound = elementKeys.every(key => 
      metrics.every(m => m.elementsFound[key as keyof typeof m.elementsFound])
    );
    if (!allElementsFound) {
      console.log('  ⚠️  Some UI elements are not rendering consistently across browsers');
      console.log('     - Check CSS compatibility and JavaScript polyfills');
      console.log('     - Verify React hydration works correctly');
    }

    const allInteractionsWork = interactionKeys.every(key => 
      metrics.every(m => m.interactions[key as keyof typeof m.interactions])
    );
    if (!allInteractionsWork) {
      console.log('  ⚠️  Interactions behave differently across browsers');
      console.log('     - Test event handlers for browser compatibility');
      console.log('     - Check for browser-specific JavaScript APIs');
    }

    const allResponsive = metrics.every(m => m.responsive.desktop && m.responsive.mobile);
    if (!allResponsive) {
      console.log('  ⚠️  Responsive design issues detected');
      console.log('     - Review CSS Grid/Flexbox compatibility');
      console.log('     - Test viewport meta tag settings');
    }

    const avgScore = overallScores.reduce((sum, s) => sum + s.score, 0) / overallScores.length;
    if (avgScore < 8) {
      console.log('  ⚠️  Overall cross-browser compatibility needs improvement');
      console.log(`     Current average score: ${avgScore.toFixed(1)}/10`);
    } else {
      console.log('  ✅ Good cross-browser compatibility');
      console.log(`     Average score: ${avgScore.toFixed(1)}/10`);
    }

    console.log('\n========================================\n');
  });
});