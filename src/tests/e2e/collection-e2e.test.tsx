/**
 * Collection End-to-End Test Suite
 * 
 * Comprehensive E2E testing for the collection management system.
 * Tests complete user journeys, cross-browser compatibility,
 * mobile responsiveness, and performance metrics collection.
 * 
 * @version 2.0.0
 * @date 2025-09-30
 * @wave Wave 4 - Validation & Testing
 */

import { test, expect, Page, BrowserContext } from '@playwright/test';

// =============================================================================
// Test Configuration
// =============================================================================

const BASE_URL = process.env.PLAYWRIGHT_TEST_BASE_URL || 'http://localhost:3000';

// Test data configuration
const TEST_COLLECTION_DATA = {
  opportunities: [
    {
      id: 'e2e-001',
      title: 'E2E Test Opportunity 1',
      description: 'First opportunity for end-to-end testing',
      type: 'optimization',
      status: 'active',
      health: 0.85,
      priority: 'high'
    },
    {
      id: 'e2e-002', 
      title: 'E2E Test Opportunity 2',
      description: 'Second opportunity for testing workflows',
      type: 'expansion',
      status: 'pending',
      health: 0.65,
      priority: 'medium'
    },
    {
      id: 'e2e-003',
      title: 'E2E Test Opportunity 3',
      description: 'Third opportunity for comprehensive testing',
      type: 'testing',
      status: 'completed',
      health: 0.92,
      priority: 'low'
    }
  ]
};

// Performance thresholds
const PERFORMANCE_THRESHOLDS = {
  LOAD_TIME: 3000, // 3 seconds
  FIRST_CONTENTFUL_PAINT: 1800, // 1.8 seconds
  LARGEST_CONTENTFUL_PAINT: 2500, // 2.5 seconds
  TIME_TO_INTERACTIVE: 3500, // 3.5 seconds
  CUMULATIVE_LAYOUT_SHIFT: 0.1,
  FIRST_INPUT_DELAY: 100 // 100ms
};

// =============================================================================
// Test Utilities
// =============================================================================

async function setupTestData(page: Page) {
  // Mock API responses with test data
  await page.route('**/api/opportunities', async route => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify(TEST_COLLECTION_DATA.opportunities)
    });
  });

  await page.route('**/api/collections', async route => {
    if (route.request().method() === 'POST') {
      const requestData = await route.request().postDataJSON();
      await route.fulfill({
        status: 201,
        contentType: 'application/json',
        body: JSON.stringify({
          id: 'new-collection-' + Date.now(),
          ...requestData,
          createdAt: new Date().toISOString()
        })
      });
    } else {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify([])
      });
    }
  });
}

async function navigateToCollections(page: Page) {
  await page.goto(`${BASE_URL}/collections`);
  await page.waitForSelector('[data-testid="collection-opportunities-hub"]', { 
    state: 'visible',
    timeout: 10000 
  });
}

async function waitForCollectionLoad(page: Page) {
  await page.waitForSelector('[role="main"]', { state: 'visible' });
  await page.waitForSelector('[role="grid"]', { state: 'visible' });
  await page.waitForLoadState('networkidle');
}

async function collectPerformanceMetrics(page: Page) {
  const performanceMetrics = await page.evaluate(() => {
    const navigation = performance.getEntriesByType('navigation')[0] as PerformanceNavigationTiming;
    const paintEntries = performance.getEntriesByType('paint');
    
    return {
      loadTime: navigation.loadEventEnd - navigation.fetchStart,
      domContentLoaded: navigation.domContentLoadedEventEnd - navigation.fetchStart,
      firstContentfulPaint: paintEntries.find(entry => entry.name === 'first-contentful-paint')?.startTime || 0,
      largestContentfulPaint: 0, // Would be collected via PerformanceObserver in real app
      timeToInteractive: navigation.loadEventEnd - navigation.fetchStart,
      cumulativeLayoutShift: 0, // Would be collected via PerformanceObserver in real app
      firstInputDelay: 0 // Would be measured on first user interaction
    };
  });
  
  return performanceMetrics;
}

// =============================================================================
// Complete User Journey Tests
// =============================================================================

test.describe('Complete User Journeys', () => {
  test.beforeEach(async ({ page }) => {
    await setupTestData(page);
  });

  test('complete collection creation workflow', async ({ page }) => {
    await navigateToCollections(page);
    await waitForCollectionLoad(page);

    // Step 1: Verify initial load
    await expect(page.locator('[role="main"]')).toBeVisible();
    await expect(page.locator('[role="grid"]')).toBeVisible();

    // Step 2: Select opportunities
    const firstOpportunity = page.locator('[role="gridcell"]').first();
    await firstOpportunity.click();
    
    const thirdOpportunity = page.locator('[role="gridcell"]').nth(2);
    await page.keyboard.down('Control');
    await thirdOpportunity.click();
    await page.keyboard.up('Control');

    // Step 3: Verify selection feedback
    await expect(page.locator('[role="toolbar"][aria-label*="bulk"]')).toBeVisible();
    await expect(page.locator('text=2 selected')).toBeVisible();

    // Step 4: Create collection
    await page.locator('button:has-text("Create Collection")').click();
    await expect(page.locator('[role="dialog"][aria-label*="Create Collection"]')).toBeVisible();

    // Step 5: Fill collection details
    await page.locator('[data-testid="collection-name-input"]').fill('E2E Test Collection');
    await page.locator('[data-testid="collection-description-input"]').fill('Created via E2E test');

    // Step 6: Submit creation
    await page.locator('button:has-text("Create"):not(:disabled)').click();

    // Step 7: Verify success
    await expect(page.locator('text=Collection created successfully')).toBeVisible();
    await expect(page.locator('[role="dialog"]')).not.toBeVisible();
  });

  test('complete edit opportunity workflow', async ({ page }) => {
    await navigateToCollections(page);
    await waitForCollectionLoad(page);

    // Step 1: Enter edit mode
    const firstOpportunity = page.locator('[role="gridcell"]').first();
    await firstOpportunity.locator('button[aria-label="Edit"]').click();

    // Step 2: Verify edit mode activation
    await expect(page.locator('[data-testid="inline-edit-form"]')).toBeVisible();

    // Step 3: Modify opportunity
    const nameInput = page.locator('[data-testid="opportunity-name-input"]');
    await nameInput.clear();
    await nameInput.fill('Modified E2E Opportunity');

    // Step 4: Save changes
    await page.locator('button:has-text("Save")').click();

    // Step 5: Verify changes persisted
    await expect(page.locator('text=Modified E2E Opportunity')).toBeVisible();
    await expect(page.locator('[data-testid="inline-edit-form"]')).not.toBeVisible();
  });

  test('complete search and filter workflow', async ({ page }) => {
    await navigateToCollections(page);
    await waitForCollectionLoad(page);

    // Step 1: Use search functionality
    const searchInput = page.locator('[role="searchbox"]');
    await searchInput.fill('optimization');

    // Step 2: Verify search results
    await page.waitForTimeout(500); // Debounce delay
    await expect(page.locator('text=E2E Test Opportunity 1')).toBeVisible();
    await expect(page.locator('text=E2E Test Opportunity 2')).not.toBeVisible();

    // Step 3: Apply additional filters
    await page.locator('button:has-text("Filters")').click();
    await page.locator('[data-testid="status-filter"]').selectOption('active');
    await page.locator('button:has-text("Apply Filters")').click();

    // Step 4: Verify combined filtering
    const visibleRows = page.locator('[role="gridcell"]');
    await expect(visibleRows).toHaveCount(1);

    // Step 5: Clear filters
    await page.locator('button:has-text("Clear Filters")').click();
    await expect(visibleRows).toHaveCount(3);
  });

  test('complete bulk operations workflow', async ({ page }) => {
    await navigateToCollections(page);
    await waitForCollectionLoad(page);

    // Step 1: Select multiple opportunities
    await page.locator('[data-testid="select-all-checkbox"]').click();
    await expect(page.locator('text=3 selected')).toBeVisible();

    // Step 2: Open bulk operations
    await page.locator('button:has-text("Bulk Actions")').click();
    await expect(page.locator('[data-testid="bulk-operations-menu"]')).toBeVisible();

    // Step 3: Change status for all
    await page.locator('button:has-text("Change Status")').click();
    await page.locator('[data-testid="bulk-status-select"]').selectOption('paused');
    await page.locator('button:has-text("Apply to All")').click();

    // Step 4: Verify bulk update confirmation
    await expect(page.locator('[role="dialog"][aria-label*="Confirm Bulk Update"]')).toBeVisible();
    await page.locator('button:has-text("Confirm")').click();

    // Step 5: Verify changes applied
    await expect(page.locator('text=Bulk update completed')).toBeVisible();
  });

  test('complete sort and pagination workflow', async ({ page }) => {
    // Mock larger dataset for pagination
    await page.route('**/api/opportunities', async route => {
      const largeDataset = Array.from({ length: 50 }, (_, i) => ({
        id: `e2e-${String(i + 1).padStart(3, '0')}`,
        title: `E2E Opportunity ${i + 1}`,
        description: `Test opportunity ${i + 1}`,
        type: ['optimization', 'expansion', 'testing'][i % 3],
        status: ['active', 'pending', 'completed'][i % 3],
        health: 0.3 + (i % 7) * 0.1,
        priority: ['high', 'medium', 'low'][i % 3]
      }));
      
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify(largeDataset)
      });
    });

    await navigateToCollections(page);
    await waitForCollectionLoad(page);

    // Step 1: Sort by health descending
    await page.locator('[role="columnheader"]:has-text("Health")').click();
    await expect(page.locator('[role="columnheader"][aria-sort="descending"]')).toBeVisible();

    // Step 2: Verify sort order
    const healthValues = await page.locator('[data-testid="health-value"]').allTextContents();
    const healthNumbers = healthValues.map(val => parseFloat(val));
    expect(healthNumbers[0]).toBeGreaterThanOrEqual(healthNumbers[1]);

    // Step 3: Navigate pagination
    if (await page.locator('[data-testid="pagination-next"]').isVisible()) {
      await page.locator('[data-testid="pagination-next"]').click();
      await waitForCollectionLoad(page);
      
      // Verify page 2 loads
      await expect(page.locator('[data-testid="current-page"]:has-text("2")')).toBeVisible();
    }
  });
});

// =============================================================================
// Cross-Browser Compatibility Tests
// =============================================================================

test.describe('Cross-Browser Compatibility', () => {
  ['chromium', 'firefox', 'webkit'].forEach(browserName => {
    test(`collection functionality in ${browserName}`, async ({ page, browserName: currentBrowser }) => {
      test.skip(currentBrowser !== browserName, `Skipping ${browserName} test in ${currentBrowser}`);
      
      await setupTestData(page);
      await navigateToCollections(page);
      await waitForCollectionLoad(page);

      // Test core functionality works across browsers
      await expect(page.locator('[role="main"]')).toBeVisible();
      await expect(page.locator('[role="grid"]')).toBeVisible();

      // Test interaction works
      const firstCell = page.locator('[role="gridcell"]').first();
      await firstCell.click();
      await expect(page.locator('[aria-selected="true"]')).toBeVisible();

      // Test search works
      const searchInput = page.locator('[role="searchbox"]');
      await searchInput.fill('test');
      await page.waitForTimeout(500);
      
      // Browser-specific adjustments would go here
      if (browserName === 'webkit') {
        // Safari-specific behavior testing
        await expect(page.locator('[role="grid"]')).toBeVisible();
      } else if (browserName === 'firefox') {
        // Firefox-specific behavior testing
        await expect(page.locator('[role="grid"]')).toBeVisible();
      }
    });
  });
});

// =============================================================================
// Mobile Responsiveness Tests
// =============================================================================

test.describe('Mobile Responsiveness', () => {
  test('mobile portrait layout', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 667 });
    await setupTestData(page);
    await navigateToCollections(page);
    await waitForCollectionLoad(page);

    // Verify mobile optimizations
    await expect(page.locator('[data-testid="mobile-navigation"]')).toBeVisible();
    await expect(page.locator('[data-testid="mobile-grid-view"]')).toBeVisible();

    // Test mobile interactions
    const firstOpportunity = page.locator('[data-testid="opportunity-card"]').first();
    await firstOpportunity.tap();
    await expect(page.locator('[data-testid="mobile-detail-panel"]')).toBeVisible();
  });

  test('tablet landscape layout', async ({ page }) => {
    await page.setViewportSize({ width: 1024, height: 768 });
    await setupTestData(page);
    await navigateToCollections(page);
    await waitForCollectionLoad(page);

    // Verify tablet layout
    await expect(page.locator('[data-testid="tablet-split-view"]')).toBeVisible();
    
    // Test tablet-specific interactions
    const opportunity = page.locator('[role="gridcell"]').first();
    await opportunity.click();
    await expect(page.locator('[data-testid="side-panel"]')).toBeVisible();
  });

  test('responsive breakpoint transitions', async ({ page }) => {
    await setupTestData(page);
    await navigateToCollections(page);

    const breakpoints = [
      { width: 375, height: 667, name: 'mobile' },
      { width: 768, height: 1024, name: 'tablet' },
      { width: 1440, height: 900, name: 'desktop' }
    ];

    for (const breakpoint of breakpoints) {
      await page.setViewportSize(breakpoint);
      await waitForCollectionLoad(page);
      
      // Verify layout adapts properly
      await expect(page.locator('[role="main"]')).toBeVisible();
      await expect(page.locator('[role="grid"]')).toBeVisible();
      
      // Take screenshot for visual regression testing
      await page.screenshot({
        path: `test-results/responsive-${breakpoint.name}.png`,
        fullPage: true
      });
    }
  });

  test('touch interaction patterns', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 667 });
    await setupTestData(page);
    await navigateToCollections(page);
    await waitForCollectionLoad(page);

    // Test touch gestures
    const opportunity = page.locator('[data-testid="opportunity-card"]').first();
    
    // Tap to select
    await opportunity.tap();
    await expect(page.locator('[aria-selected="true"]')).toBeVisible();

    // Long press for context menu
    await opportunity.locator('[data-testid="context-menu-trigger"]').tap({ delay: 500 });
    await expect(page.locator('[data-testid="context-menu"]')).toBeVisible();

    // Swipe gesture simulation
    const boundingBox = await opportunity.boundingBox();
    if (boundingBox) {
      await page.mouse.move(boundingBox.x + 10, boundingBox.y + boundingBox.height / 2);
      await page.mouse.down();
      await page.mouse.move(boundingBox.x + boundingBox.width - 10, boundingBox.y + boundingBox.height / 2);
      await page.mouse.up();
      
      await expect(page.locator('[data-testid="swipe-actions"]')).toBeVisible();
    }
  });
});

// =============================================================================
// Performance Metrics Collection
// =============================================================================

test.describe('Performance Metrics', () => {
  test('page load performance', async ({ page }) => {
    await setupTestData(page);
    
    const startTime = Date.now();
    await navigateToCollections(page);
    await waitForCollectionLoad(page);
    const endTime = Date.now();
    
    const loadTime = endTime - startTime;
    expect(loadTime).toBeLessThan(PERFORMANCE_THRESHOLDS.LOAD_TIME);

    const metrics = await collectPerformanceMetrics(page);
    
    expect(metrics.firstContentfulPaint).toBeLessThan(PERFORMANCE_THRESHOLDS.FIRST_CONTENTFUL_PAINT);
    expect(metrics.timeToInteractive).toBeLessThan(PERFORMANCE_THRESHOLDS.TIME_TO_INTERACTIVE);
  });

  test('interaction performance', async ({ page }) => {
    await setupTestData(page);
    await navigateToCollections(page);
    await waitForCollectionLoad(page);

    // Measure selection interaction time
    const startTime = performance.now();
    await page.locator('[role="gridcell"]').first().click();
    await page.waitForSelector('[aria-selected="true"]');
    const interactionTime = performance.now() - startTime;

    expect(interactionTime).toBeLessThan(PERFORMANCE_THRESHOLDS.FIRST_INPUT_DELAY);
  });

  test('large dataset performance', async ({ page }) => {
    // Mock large dataset
    await page.route('**/api/opportunities', async route => {
      const largeDataset = Array.from({ length: 1000 }, (_, i) => ({
        id: `perf-${i}`,
        title: `Performance Test ${i}`,
        description: `Large dataset test opportunity ${i}`,
        type: 'testing',
        status: 'active',
        health: Math.random(),
        priority: 'medium'
      }));
      
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify(largeDataset)
      });
    });

    const startTime = Date.now();
    await navigateToCollections(page);
    await waitForCollectionLoad(page);
    const renderTime = Date.now() - startTime;

    // Should handle large datasets efficiently
    expect(renderTime).toBeLessThan(PERFORMANCE_THRESHOLDS.LOAD_TIME * 2);
    
    // Verify virtualization is working
    const visibleRows = await page.locator('[role="gridcell"]').count();
    expect(visibleRows).toBeLessThan(100); // Should not render all 1000 items
  });

  test('memory usage monitoring', async ({ page }) => {
    await setupTestData(page);
    await navigateToCollections(page);
    await waitForCollectionLoad(page);

    // Monitor memory usage during interaction
    const initialMemory = await page.evaluate(() => {
      return (performance as any).memory?.usedJSHeapSize || 0;
    });

    // Perform memory-intensive operations
    for (let i = 0; i < 50; i++) {
      await page.locator('[role="gridcell"]').nth(i % 3).click();
      await page.keyboard.press('Escape');
    }

    const finalMemory = await page.evaluate(() => {
      return (performance as any).memory?.usedJSHeapSize || 0;
    });

    // Memory should not grow excessively
    if (initialMemory > 0 && finalMemory > 0) {
      const memoryIncrease = finalMemory - initialMemory;
      expect(memoryIncrease).toBeLessThan(50 * 1024 * 1024); // Less than 50MB increase
    }
  });
});

// =============================================================================
// Error Handling and Recovery Tests
// =============================================================================

test.describe('Error Handling and Recovery', () => {
  test('network error recovery', async ({ page }) => {
    await page.goto(`${BASE_URL}/collections`);

    // Mock network failure
    await page.route('**/api/opportunities', async route => {
      await route.abort('failed');
    });

    // Verify error state
    await expect(page.locator('[data-testid="error-message"]')).toBeVisible();
    await expect(page.locator('button:has-text("Retry")')).toBeVisible();

    // Restore network and retry
    await page.unroute('**/api/opportunities');
    await setupTestData(page);
    await page.locator('button:has-text("Retry")').click();

    // Verify recovery
    await waitForCollectionLoad(page);
    await expect(page.locator('[role="grid"]')).toBeVisible();
  });

  test('graceful degradation', async ({ page }) => {
    await setupTestData(page);
    
    // Mock partial API failure
    await page.route('**/api/collections', async route => {
      await route.abort('failed');
    });

    await navigateToCollections(page);
    await waitForCollectionLoad(page);

    // Should still show opportunities even if collections API fails
    await expect(page.locator('[role="grid"]')).toBeVisible();
    await expect(page.locator('text=Unable to load collections')).toBeVisible();
  });

  test('offline behavior', async ({ page, context }) => {
    await setupTestData(page);
    await navigateToCollections(page);
    await waitForCollectionLoad(page);

    // Go offline
    await context.setOffline(true);

    // Attempt to create collection
    await page.locator('[role="gridcell"]').first().click();
    await page.locator('button:has-text("Create Collection")').click();
    await page.locator('[data-testid="collection-name-input"]').fill('Offline Test');
    await page.locator('button:has-text("Create"):not(:disabled)').click();

    // Should show offline message
    await expect(page.locator('text=You are currently offline')).toBeVisible();

    // Go back online
    await context.setOffline(false);
    
    // Should retry automatically or show retry option
    await expect(page.locator('button:has-text("Retry")')).toBeVisible();
  });
});

// =============================================================================
// Accessibility Compliance Tests
// =============================================================================

test.describe('Accessibility Compliance', () => {
  test('keyboard navigation', async ({ page }) => {
    await setupTestData(page);
    await navigateToCollections(page);
    await waitForCollectionLoad(page);

    // Test tab navigation
    await page.keyboard.press('Tab');
    await expect(page.locator(':focus')).toBeVisible();

    // Navigate through grid with arrow keys
    await page.keyboard.press('ArrowDown');
    await page.keyboard.press('ArrowRight');
    
    // Test selection with keyboard
    await page.keyboard.press('Space');
    await expect(page.locator('[aria-selected="true"]')).toBeVisible();

    // Test escape to clear selection
    await page.keyboard.press('Escape');
    await expect(page.locator('[aria-selected="true"]')).not.toBeVisible();
  });

  test('screen reader compatibility', async ({ page }) => {
    await setupTestData(page);
    await navigateToCollections(page);
    await waitForCollectionLoad(page);

    // Verify ARIA labels and roles
    await expect(page.locator('[role="main"]')).toBeVisible();
    await expect(page.locator('[role="grid"]')).toHaveAttribute('aria-label');
    await expect(page.locator('[role="gridcell"]').first()).toHaveAttribute('aria-describedby');

    // Test live region announcements
    await page.locator('[role="gridcell"]').first().click();
    await expect(page.locator('[role="status"]')).toContainText('selected');
  });

  test('high contrast mode compatibility', async ({ page }) => {
    // Enable high contrast mode
    await page.addStyleTag({
      content: `
        @media (prefers-contrast: high) {
          * { 
            background-color: black !important; 
            color: white !important; 
            border-color: white !important;
          }
        }
      `
    });

    await setupTestData(page);
    await navigateToCollections(page);
    await waitForCollectionLoad(page);

    // Verify component still functions in high contrast
    await expect(page.locator('[role="main"]')).toBeVisible();
    await page.locator('[role="gridcell"]').first().click();
    await expect(page.locator('[aria-selected="true"]')).toBeVisible();
  });

  test('reduced motion compliance', async ({ page }) => {
    // Mock reduced motion preference
    await page.addStyleTag({
      content: `
        @media (prefers-reduced-motion: reduce) {
          *, *::before, *::after {
            animation-duration: 0.01ms !important;
            animation-iteration-count: 1 !important;
            transition-duration: 0.01ms !important;
          }
        }
      `
    });

    await setupTestData(page);
    await navigateToCollections(page);
    await waitForCollectionLoad(page);

    // Verify functionality works with reduced motion
    await page.locator('[role="gridcell"]').first().click();
    await expect(page.locator('[aria-selected="true"]')).toBeVisible();
  });
});

// =============================================================================
// Test Cleanup and Reporting
// =============================================================================

test.afterEach(async ({ page }, testInfo) => {
  // Collect performance metrics for reporting
  if (testInfo.status === 'passed') {
    const metrics = await collectPerformanceMetrics(page);
    
    // Attach metrics to test report
    await testInfo.attach('performance-metrics', {
      body: JSON.stringify(metrics, null, 2),
      contentType: 'application/json'
    });
  }

  // Take screenshot on failure
  if (testInfo.status === 'failed') {
    await testInfo.attach('failure-screenshot', {
      body: await page.screenshot(),
      contentType: 'image/png'
    });
  }

  // Clear any test data
  await page.evaluate(() => {
    localStorage.clear();
    sessionStorage.clear();
  });
});