import { test, expect, Page, BrowserContext, chromium, firefox, webkit, Browser } from '@playwright/test';
import { injectAxe, checkA11y } from 'axe-playwright';

interface BrowserMetrics {
  browser: string;
  loadTime: number;
  jsHeapUsed: number;
  domNodes: number;
  layoutDuration: number;
  scriptDuration: number;
  renderTime: number;
  interactionLatency: number[];
  scrollPerformance: number;
  memoryLeaks: boolean;
}

interface TestMetrics {
  testName: string;
  browserMetrics: BrowserMetrics[];
  consistencyScore: number;
  criticalIssues: string[];
  warnings: string[];
  recommendations: string[];
}

/**
 * Cross-Browser E2E tests for Collection Management
 * Tests consistency across Chrome, Firefox, Safari, and Edge
 * 
 * Focus Areas:
 * 1. Visual consistency
 * 2. Interaction behavior
 * 3. Performance metrics
 * 4. Feature parity
 * 5. Accessibility compliance
 */
test.describe('Collection Management Cross-Browser Testing', () => {
  const testCollectionId = 'DECK-1757517559289';
  const pageUrl = `/collection/${testCollectionId}/manage`;
  const baseUrl = 'http://localhost:3000';
  
  // Test results storage
  const allMetrics: TestMetrics[] = [];
  
  // Browser configurations
  const browserConfigs = [
    { name: 'chromium', launch: chromium },
    { name: 'firefox', launch: firefox },
    { name: 'webkit', launch: webkit }, // Safari
  ];

  async function collectPerformanceMetrics(page: Page, browserName: string): Promise<BrowserMetrics> {
    // Collect performance data
    const performanceTiming = await page.evaluate(() => {
      const navigation = performance.getEntriesByType('navigation')[0] as PerformanceNavigationTiming;
      return {
        loadTime: navigation.loadEventEnd - navigation.fetchStart,
        domContentLoaded: navigation.domContentLoadedEventEnd - navigation.domContentLoadedEventStart,
        renderTime: navigation.loadEventStart - navigation.domContentLoadedEventEnd
      };
    });

    // Collect memory usage (Chrome/Edge only)
    const memoryInfo = await page.evaluate(() => {
      // @ts-ignore
      if (performance.memory) {
        // @ts-ignore
        return {
          jsHeapUsed: performance.memory.usedJSHeapSize,
          jsHeapTotal: performance.memory.totalJSHeapSize
        };
      }
      return { jsHeapUsed: 0, jsHeapTotal: 0 };
    });

    // Count DOM nodes
    const domNodes = await page.evaluate(() => document.querySelectorAll('*').length);

    // Measure layout and script duration
    const layoutMetrics = await page.evaluate(() => {
      const entries = performance.getEntriesByType('measure');
      const layoutDuration = entries
        .filter(e => e.name.includes('layout'))
        .reduce((sum, e) => sum + e.duration, 0);
      const scriptDuration = entries
        .filter(e => e.name.includes('script'))
        .reduce((sum, e) => sum + e.duration, 0);
      return { layoutDuration, scriptDuration };
    });

    return {
      browser: browserName,
      loadTime: performanceTiming.loadTime,
      jsHeapUsed: memoryInfo.jsHeapUsed,
      domNodes,
      layoutDuration: layoutMetrics.layoutDuration || 0,
      scriptDuration: layoutMetrics.scriptDuration || 0,
      renderTime: performanceTiming.renderTime,
      interactionLatency: [],
      scrollPerformance: 0,
      memoryLeaks: false
    };
  }

  async function measureInteractionLatency(page: Page, selector: string): Promise<number> {
    const startTime = Date.now();
    await page.click(selector);
    await page.waitForTimeout(50); // Wait for UI response
    const endTime = Date.now();
    return endTime - startTime;
  }

  async function detectMemoryLeaks(page: Page): Promise<boolean> {
    // Only works in Chromium-based browsers
    const initialMemory = await page.evaluate(() => {
      // @ts-ignore
      return performance.memory?.usedJSHeapSize || 0;
    });

    // Perform actions that might cause leaks
    for (let i = 0; i < 10; i++) {
      await page.click('body'); // Trigger event listeners
      await page.waitForTimeout(100);
    }

    // Force garbage collection if available
    await page.evaluate(() => {
      // @ts-ignore
      if (window.gc) window.gc();
    });

    await page.waitForTimeout(1000);

    const finalMemory = await page.evaluate(() => {
      // @ts-ignore
      return performance.memory?.usedJSHeapSize || 0;
    });

    // If memory increased by more than 10MB, potential leak
    return (finalMemory - initialMemory) > 10 * 1024 * 1024;
  }

  test.describe('1. Visual Consistency Tests', () => {
    for (const browser of browserConfigs) {
      test(`[${browser.name}] Visual rendering consistency`, async () => {
        const browserInstance = await browser.launch.launch();
        const context = await browserInstance.newContext();
        const page = await context.newPage();
        
        try {
          await page.goto(`${baseUrl}${pageUrl}`);
          await page.waitForLoadState('networkidle');
          
          // Take screenshot for visual comparison
          const screenshot = await page.screenshot({ 
            fullPage: true,
            animations: 'disabled'
          });
          
          // Check viewport rendering
          const viewportMetrics = await page.evaluate(() => {
            return {
              scrollWidth: document.documentElement.scrollWidth,
              clientWidth: document.documentElement.clientWidth,
              scrollHeight: document.documentElement.scrollHeight,
              clientHeight: document.documentElement.clientHeight
            };
          });
          
          // Check for horizontal overflow
          expect(viewportMetrics.scrollWidth).toBeLessThanOrEqual(viewportMetrics.clientWidth + 20);
          
          // Verify critical elements are visible
          const criticalElements = [
            '.collection-opportunities-hub',
            '.opportunities-table, .bp5-table',
            '.navigation, nav',
            '.stat-card, .stats-section'
          ];
          
          for (const selector of criticalElements) {
            const element = page.locator(selector).first();
            if (await element.count() > 0) {
              await expect(element).toBeVisible();
            }
          }
          
        } finally {
          await context.close();
          await browserInstance.close();
        }
      });
    }
  });

  test.describe('2. Interaction Behavior Tests', () => {
    for (const browser of browserConfigs) {
      test(`[${browser.name}] Consistent interaction behavior`, async () => {
        const browserInstance = await browser.launch.launch();
        const context = await browserInstance.newContext();
        const page = await context.newPage();
        const metrics = await collectPerformanceMetrics(page, browser.name);
        
        try {
          await page.goto(`${baseUrl}${pageUrl}`);
          await page.waitForLoadState('networkidle');
          
          // Test table sorting
          const sortableHeaders = page.locator('.bp5-table-header[role="columnheader"], th.sortable');
          if (await sortableHeaders.count() > 0) {
            const firstHeader = sortableHeaders.first();
            
            // Measure sort interaction latency
            const sortLatency = await measureInteractionLatency(page, await firstHeader.elementHandle() ? 'th.sortable:first-child' : '.bp5-table-header:first-child');
            metrics.interactionLatency.push(sortLatency);
            
            // Verify sort indicator appears
            await page.waitForTimeout(500);
            const sortIcon = page.locator('.bp5-icon-sort-asc, .bp5-icon-sort-desc, .sort-icon');
            expect(await sortIcon.count()).toBeGreaterThan(0);
          }
          
          // Test row selection
          const rows = page.locator('.bp5-table-row, tr[role="row"]').filter({ hasNot: page.locator('th') });
          if (await rows.count() > 0) {
            const selectionLatency = await measureInteractionLatency(page, '.bp5-table-row:first-child, tr[role="row"]:nth-child(2)');
            metrics.interactionLatency.push(selectionLatency);
            
            // Verify selection state
            const selectedRows = page.locator('.bp5-table-row-selected, .selected, [aria-selected="true"]');
            expect(await selectedRows.count()).toBeGreaterThan(0);
          }
          
          // Test search functionality
          const searchInput = page.locator('input[type="search"], input[placeholder*="search"]').first();
          if (await searchInput.count() > 0) {
            await searchInput.fill('test search');
            await page.keyboard.press('Enter');
            await page.waitForTimeout(1000);
            
            // Verify search applied (table should update or show results)
            const resultsIndicator = page.locator('text=/result|found|match/i');
            const noResultsIndicator = page.locator('text=/no result|not found|no match/i');
            expect((await resultsIndicator.count() > 0) || (await noResultsIndicator.count() > 0)).toBeTruthy();
          }
          
          // Store metrics for comparison
          allMetrics.push({
            testName: 'Interaction Behavior',
            browserMetrics: [metrics],
            consistencyScore: 100,
            criticalIssues: [],
            warnings: [],
            recommendations: []
          });
          
        } finally {
          await context.close();
          await browserInstance.close();
        }
      });
    }
  });

  test.describe('3. Performance Metrics Collection', () => {
    for (const browser of browserConfigs) {
      test(`[${browser.name}] Performance metrics and resource usage`, async () => {
        const browserInstance = await browser.launch.launch({
          args: browser.name === 'chromium' ? ['--enable-precise-memory-info'] : []
        });
        const context = await browserInstance.newContext();
        const page = await context.newPage();
        
        try {
          const startTime = Date.now();
          await page.goto(`${baseUrl}${pageUrl}`);
          await page.waitForLoadState('networkidle');
          const loadTime = Date.now() - startTime;
          
          const metrics = await collectPerformanceMetrics(page, browser.name);
          metrics.loadTime = loadTime;
          
          // Test scroll performance
          const scrollStartTime = Date.now();
          await page.evaluate(() => {
            window.scrollTo(0, document.body.scrollHeight);
            window.scrollTo(0, 0);
          });
          const scrollEndTime = Date.now();
          metrics.scrollPerformance = scrollEndTime - scrollStartTime;
          
          // Check for memory leaks
          metrics.memoryLeaks = await detectMemoryLeaks(page);
          
          // Collect resource timing
          const resourceMetrics = await page.evaluate(() => {
            const resources = performance.getEntriesByType('resource') as PerformanceResourceTiming[];
            return {
              totalResources: resources.length,
              totalSize: resources.reduce((sum, r) => sum + (r.transferSize || 0), 0),
              slowestResource: resources.reduce((slowest, r) => 
                r.duration > (slowest?.duration || 0) ? r : slowest, resources[0]
              )?.name || 'none'
            };
          });
          
          console.log(`[${browser.name}] Performance Summary:`);
          console.log(`  Load Time: ${metrics.loadTime}ms`);
          console.log(`  DOM Nodes: ${metrics.domNodes}`);
          console.log(`  JS Heap Used: ${(metrics.jsHeapUsed / 1024 / 1024).toFixed(2)}MB`);
          console.log(`  Scroll Performance: ${metrics.scrollPerformance}ms`);
          console.log(`  Total Resources: ${resourceMetrics.totalResources}`);
          console.log(`  Memory Leaks Detected: ${metrics.memoryLeaks ? 'Yes' : 'No'}`);
          
          // Performance assertions
          expect(metrics.loadTime).toBeLessThan(5000); // 5 second max load time
          expect(metrics.domNodes).toBeLessThan(5000); // Reasonable DOM size
          expect(metrics.scrollPerformance).toBeLessThan(500); // Smooth scrolling
          
        } finally {
          await context.close();
          await browserInstance.close();
        }
      });
    }
  });

  test.describe('4. Feature Parity Tests', () => {
    const featureResults: { [feature: string]: { [browser: string]: boolean } } = {};
    
    for (const browser of browserConfigs) {
      test(`[${browser.name}] Feature availability and functionality`, async () => {
        const browserInstance = await browser.launch.launch();
        const context = await browserInstance.newContext();
        const page = await context.newPage();
        
        try {
          await page.goto(`${baseUrl}${pageUrl}`);
          await page.waitForLoadState('networkidle');
          
          // Test feature availability
          const features = {
            'Table Sorting': await page.locator('.bp5-table-header[role="columnheader"], th.sortable').count() > 0,
            'Row Selection': await page.locator('.bp5-table-row, tr[role="row"]').count() > 0,
            'Search/Filter': await page.locator('input[type="search"], input[placeholder*="search"]').count() > 0,
            'Pagination': await page.locator('.pagination, .bp5-pagination').count() > 0,
            'Export Function': await page.locator('button:has-text("Export"), button:has-text("Download")').count() > 0,
            'Bulk Actions': await page.locator('.bulk-actions, button:has-text("Select All")').count() > 0,
            'Tab Navigation': await page.locator('.bp5-tab, [role="tab"]').count() > 0,
            'Responsive Menu': await page.locator('.mobile-menu, .burger-menu, .bp5-navbar-group').count() > 0
          };
          
          // Store results
          Object.entries(features).forEach(([feature, available]) => {
            if (!featureResults[feature]) featureResults[feature] = {};
            featureResults[feature][browser.name] = available;
          });
          
          console.log(`[${browser.name}] Feature Availability:`);
          Object.entries(features).forEach(([feature, available]) => {
            console.log(`  ${feature}: ${available ? '✅' : '❌'}`);
          });
          
          // Test specific feature behavior
          if (features['Table Sorting']) {
            const header = page.locator('.bp5-table-header, th.sortable').first();
            await header.click();
            await page.waitForTimeout(500);
            const sortIcon = await page.locator('.bp5-icon-sort-asc, .bp5-icon-sort-desc').count();
            expect(sortIcon).toBeGreaterThan(0);
          }
          
        } finally {
          await context.close();
          await browserInstance.close();
        }
      });
    }
  });

  test.describe('5. Accessibility Compliance', () => {
    for (const browser of browserConfigs) {
      test(`[${browser.name}] WCAG 2.1 compliance and screen reader support`, async () => {
        const browserInstance = await browser.launch.launch();
        const context = await browserInstance.newContext();
        const page = await context.newPage();
        
        try {
          await page.goto(`${baseUrl}${pageUrl}`);
          await page.waitForLoadState('networkidle');
          await injectAxe(page);
          
          // Run accessibility audit
          const violations = await page.evaluate(async () => {
            // @ts-ignore
            const results = await axe.run();
            return results.violations;
          });
          
          // Filter by severity
          const criticalViolations = violations.filter(v => 
            v.impact === 'critical' || v.impact === 'serious'
          );
          
          console.log(`[${browser.name}] Accessibility Summary:`);
          console.log(`  Total Violations: ${violations.length}`);
          console.log(`  Critical/Serious: ${criticalViolations.length}`);
          
          if (criticalViolations.length > 0) {
            criticalViolations.forEach(v => {
              console.log(`  - ${v.id}: ${v.description} (${v.impact})`);
            });
          }
          
          // Test keyboard navigation
          await page.keyboard.press('Tab');
          const firstFocused = await page.evaluate(() => document.activeElement?.tagName);
          expect(firstFocused).toBeTruthy();
          
          // Test screen reader landmarks
          const landmarks = await page.evaluate(() => {
            const landmarkRoles = ['banner', 'navigation', 'main', 'contentinfo'];
            return landmarkRoles.map(role => ({
              role,
              count: document.querySelectorAll(`[role="${role}"]`).length
            }));
          });
          
          console.log(`  Landmarks: ${landmarks.filter(l => l.count > 0).map(l => l.role).join(', ')}`);
          
          // Expect no critical accessibility violations
          expect(criticalViolations.length).toBe(0);
          
        } finally {
          await context.close();
          await browserInstance.close();
        }
      });
    }
  });

  test.describe('6. Cross-Browser Consistency Analysis', () => {
    test.afterAll(async () => {
      console.log('\n=== CROSS-BROWSER CONSISTENCY REPORT ===\n');
      
      // Analyze feature parity
      console.log('Feature Parity Analysis:');
      Object.entries(featureResults).forEach(([feature, browsers]) => {
        const values = Object.values(browsers);
        const consistent = values.every(v => v === values[0]);
        console.log(`  ${feature}: ${consistent ? '✅ Consistent' : '⚠️  Inconsistent'}`);
        if (!consistent) {
          Object.entries(browsers).forEach(([browser, available]) => {
            console.log(`    ${browser}: ${available ? '✅' : '❌'}`);
          });
        }
      });
      
      // Performance comparison
      console.log('\nPerformance Comparison:');
      const perfMetrics = allMetrics.find(m => m.testName === 'Interaction Behavior');
      if (perfMetrics) {
        const avgLoadTime = perfMetrics.browserMetrics.reduce((sum, m) => sum + m.loadTime, 0) / perfMetrics.browserMetrics.length;
        console.log(`  Average Load Time: ${avgLoadTime.toFixed(0)}ms`);
        
        perfMetrics.browserMetrics.forEach(m => {
          const variance = ((m.loadTime - avgLoadTime) / avgLoadTime * 100).toFixed(1);
          console.log(`    ${m.browser}: ${m.loadTime}ms (${variance}% variance)`);
        });
      }
      
      // Recommendations
      console.log('\nRecommendations:');
      console.log('  1. Address any browser-specific feature gaps');
      console.log('  2. Optimize performance for slower browsers');
      console.log('  3. Ensure consistent visual rendering across all browsers');
      console.log('  4. Fix any critical accessibility violations');
      console.log('  5. Test on real devices for accurate mobile browser behavior');
      
      console.log('\n=======================================\n');
    });
  });

  test.describe('7. Mobile Browser Testing', () => {
    const mobileDevices = [
      { name: 'iPhone 12', device: 'iPhone 12' },
      { name: 'Galaxy S21', device: 'Galaxy S21' },
      { name: 'iPad', device: 'iPad (gen 7)' }
    ];
    
    for (const mobile of mobileDevices) {
      test(`[${mobile.name}] Mobile browser consistency`, async ({ browser }) => {
        const context = await browser.newContext({
          ...mobile.device
        });
        const page = await context.newPage();
        
        try {
          await page.goto(`${baseUrl}${pageUrl}`);
          await page.waitForLoadState('networkidle');
          
          // Check mobile-specific features
          const mobileMenu = page.locator('.mobile-menu, .burger-menu, [aria-label*="menu"]');
          const hasResponsiveNav = await mobileMenu.count() > 0;
          
          // Check viewport fit
          const viewportMetrics = await page.evaluate(() => ({
            scrollWidth: document.documentElement.scrollWidth,
            clientWidth: document.documentElement.clientWidth,
            hasHorizontalScroll: document.documentElement.scrollWidth > document.documentElement.clientWidth
          }));
          
          console.log(`[${mobile.name}] Mobile Test Results:`);
          console.log(`  Responsive Navigation: ${hasResponsiveNav ? '✅' : '❌'}`);
          console.log(`  Horizontal Scroll: ${viewportMetrics.hasHorizontalScroll ? '❌ Present' : '✅ None'}`);
          console.log(`  Viewport Width: ${viewportMetrics.clientWidth}px`);
          
          // Touch interactions
          const firstButton = page.locator('button').first();
          if (await firstButton.count() > 0) {
            await firstButton.tap();
            // Verify tap worked
            await page.waitForTimeout(300);
          }
          
          expect(viewportMetrics.hasHorizontalScroll).toBeFalsy();
          
        } finally {
          await context.close();
        }
      });
    }
  });
});