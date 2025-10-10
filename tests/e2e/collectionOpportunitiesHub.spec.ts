import { test, expect, Page, BrowserContext } from '@playwright/test';

// Test configuration
const TEST_URL = process.env.TEST_URL || 'http://localhost:3000';
const COLLECTION_HUB_URL = `${TEST_URL}/collection/123/manage`;

// Helper functions
async function waitForTableLoad(page: Page) {
  // Wait for the hub to load first
  await page.waitForSelector('.collection-opportunities-hub', { state: 'visible', timeout: 10000 });
  
  // Wait for loading to complete (mock data has 1 second delay)
  await page.waitForTimeout(1500);
  
  // Now wait for the table to appear
  await page.waitForSelector('.opportunities-table-enhanced', { state: 'visible', timeout: 10000 });
  await page.waitForLoadState('networkidle');
}

async function captureScreenshot(page: Page, name: string) {
  await page.screenshot({ 
    path: `./test-results/screenshots/${name}.png`, 
    fullPage: true 
  });
}

async function measurePerformance(page: Page) {
  const metrics = await page.evaluate(() => {
    const navigation = performance.getEntriesByType('navigation')[0] as PerformanceNavigationTiming;
    return {
      domContentLoaded: navigation.domContentLoadedEventEnd - navigation.domContentLoadedEventStart,
      loadComplete: navigation.loadEventEnd - navigation.loadEventStart,
      firstPaint: performance.getEntriesByName('first-paint')[0]?.startTime || 0,
      firstContentfulPaint: performance.getEntriesByName('first-contentful-paint')[0]?.startTime || 0
    };
  });
  return metrics;
}

// Test suite
test.describe('Collection Opportunities Management Hub - Comprehensive E2E Tests', () => {
  test.beforeEach(async ({ page }) => {
    // Navigate to the Collection Opportunities Hub
    await page.goto(COLLECTION_HUB_URL);
    await waitForTableLoad(page);
  });

  test.describe('Test 1: Quick Edit Flow Validation', () => {
    test('should complete quick edit in less than 3 clicks', async ({ page }) => {
      // Verify "Manage Opportunities" label is visible
      await expect(page.locator('.opportunities-navbar')).toContainText('Manage Opportunities');
      
      // Find and click the first Edit icon
      const firstEditButton = page.locator('button[aria-label="Quick Edit"]').first();
      await firstEditButton.click();
      
      // Verify QuickEditModal opens
      const modal = page.locator('[role="dialog"]');
      await expect(modal).toBeVisible();
      
      // Change priority from current to CRITICAL
      const prioritySelect = page.locator('select[aria-label="Priority"]');
      await prioritySelect.selectOption('critical');
      
      // Verify real-time capacity updates
      await expect(page.locator('.capacity-indicator')).toBeVisible();
      
      // Click Save
      await page.locator('button:has-text("Save")').click();
      
      // Verify modal closes
      await expect(modal).not.toBeVisible();
      
      // Verify table row shows modified indicator
      await expect(page.locator('.change-indicator').first()).toBeVisible();
      
      // Capture screenshot
      await captureScreenshot(page, 'quick-edit-completed');
    });

    test('should update capacity in real-time when sites change', async ({ page }) => {
      const firstEditButton = page.locator('button[aria-label="Quick Edit"]').first();
      await firstEditButton.click();
      
      // Get initial capacity
      const initialCapacity = await page.locator('.capacity-percentage').textContent();
      
      // Toggle a site selection
      const siteCheckbox = page.locator('input[type="checkbox"][name^="site"]').first();
      await siteCheckbox.click();
      
      // Wait for capacity recalculation
      await page.waitForTimeout(500);
      
      // Verify capacity changed
      const updatedCapacity = await page.locator('.capacity-percentage').textContent();
      expect(updatedCapacity).not.toBe(initialCapacity);
    });
  });

  test.describe('Test 2: Reallocation Workspace Journey', () => {
    test('should open workspace with pre-populated satellite context', async ({ page }) => {
      // Find a specific satellite row or use first available
      const satelliteRow = page.locator('tr:has-text("Satellite")').first();
      const satelliteName = await satelliteRow.locator('.satellite-name').textContent();
      
      // Click Reallocate icon
      const reallocateButton = satelliteRow.locator('button[aria-label="Reallocate"]');
      await reallocateButton.click();
      
      // Verify ReallocationWorkspace opens
      const workspace = page.locator('[role="dialog"]:has-text("Reallocation Workspace")');
      await expect(workspace).toBeVisible();
      
      // Confirm satellite context pre-populated
      await expect(workspace).toContainText(satelliteName || '');
      
      // Test mode switching
      const modeSelector = workspace.locator('select[aria-label="Mode"]');
      await modeSelector.selectOption('simple');
      await expect(workspace).toContainText('Simple Mode');
      
      await modeSelector.selectOption('advanced');
      await expect(workspace).toContainText('Advanced Mode');
      
      await modeSelector.selectOption('expert');
      await expect(workspace).toContainText('Expert Mode');
      
      // Select a pass
      const passCheckbox = workspace.locator('input[type="checkbox"][name^="pass"]').first();
      await passCheckbox.check();
      
      // Click ALLOCATE
      await workspace.locator('button:has-text("ALLOCATE")').click();
      
      // Save workspace changes
      await workspace.locator('button:has-text("Save")').click();
      
      // Verify workspace closes
      await expect(workspace).not.toBeVisible();
      
      // Check table row shows modified state
      await expect(satelliteRow.locator('.change-indicator')).toBeVisible();
      
      await captureScreenshot(page, 'reallocation-completed');
    });
  });

  test.describe('Test 3: Keyboard Navigation Accessibility', () => {
    test('should support all keyboard shortcuts', async ({ page }) => {
      // Select first row
      const firstCheckbox = page.locator('.opportunities-table-enhanced input[type="checkbox"]').nth(1);
      await firstCheckbox.check();
      
      // Test Cmd+E for edit (or Ctrl+E on non-Mac)
      await page.keyboard.press('Meta+e');
      await expect(page.locator('[role="dialog"]')).toBeVisible();
      
      // Close with Escape
      await page.keyboard.press('Escape');
      await expect(page.locator('[role="dialog"]')).not.toBeVisible();
      
      // Test Cmd+R for reallocate
      await page.keyboard.press('Meta+r');
      await expect(page.locator('[role="dialog"]:has-text("Reallocation")')).toBeVisible();
      
      // Close workspace
      await page.locator('button[aria-label="Close"]').click();
      
      // Make a change to enable save
      await page.locator('button[aria-label="Quick Edit"]').first().click();
      await page.locator('select[aria-label="Priority"]').selectOption('high');
      await page.locator('button:has-text("Save")').click();
      
      // Test Cmd+S for save changes
      await page.keyboard.press('Meta+s');
      
      // Test Escape to clear selection
      await page.keyboard.press('Escape');
      const isChecked = await firstCheckbox.isChecked();
      expect(isChecked).toBe(false);
    });

    test('should be fully keyboard navigable', async ({ page }) => {
      // Start at top of page
      await page.keyboard.press('Tab');
      
      // Navigate through interactive elements
      let activeElement = await page.evaluate(() => document.activeElement?.tagName);
      expect(activeElement).toBeTruthy();
      
      // Tab through navbar
      for (let i = 0; i < 5; i++) {
        await page.keyboard.press('Tab');
        const element = await page.evaluate(() => {
          const el = document.activeElement;
          return {
            tagName: el?.tagName,
            ariaLabel: el?.getAttribute('aria-label'),
            isVisible: el ? window.getComputedStyle(el).visibility !== 'hidden' : false
          };
        });
        expect(element.isVisible).toBe(true);
      }
      
      // Verify focus indicators
      const focusedElement = page.locator(':focus');
      await expect(focusedElement).toHaveCSS('outline-style', 'solid');
    });

    test('should pass WCAG 2.1 AA accessibility checks', async ({ page }) => {
      // Check ARIA labels
      const buttons = page.locator('button');
      const buttonCount = await buttons.count();
      
      for (let i = 0; i < Math.min(buttonCount, 10); i++) {
        const button = buttons.nth(i);
        const hasAriaLabel = await button.getAttribute('aria-label') !== null;
        const hasText = await button.textContent() !== '';
        expect(hasAriaLabel || hasText).toBe(true);
      }
      
      // Check color contrast ratios
      const contrastCheck = await page.evaluate(() => {
        // This is a simplified check - in production use axe-core
        const elements = document.querySelectorAll('button, a, [role="button"]');
        const issues = [];
        elements.forEach(el => {
          const styles = window.getComputedStyle(el);
          const bg = styles.backgroundColor;
          const fg = styles.color;
          // Basic check - real implementation would calculate actual contrast ratio
          if (bg === fg) {
            issues.push(el.textContent);
          }
        });
        return issues;
      });
      expect(contrastCheck.length).toBe(0);
    });
  });

  test.describe('Test 4: Batch Operations Performance', () => {
    test('should handle batch operations efficiently', async ({ page }) => {
      const startTime = Date.now();
      
      // Select multiple opportunities (5)
      for (let i = 1; i <= 5; i++) {
        const checkbox = page.locator(`.opportunities-table-enhanced input[type="checkbox"]`).nth(i);
        await checkbox.check();
      }
      
      // Edit first selected opportunity
      await page.locator('button[aria-label="Quick Edit"]').first().click();
      await page.locator('select[aria-label="Priority"]').selectOption('high');
      await page.locator('button:has-text("Save")').click();
      
      // Make reallocation for another
      await page.locator('button[aria-label="Reallocate"]').nth(1).click();
      await page.waitForSelector('[role="dialog"]:has-text("Reallocation")');
      await page.locator('button:has-text("ALLOCATE")').click();
      await page.locator('button:has-text("Save")').click();
      
      // Verify pending changes count
      await expect(page.locator('text=/\\d+ changes pending/')).toBeVisible();
      
      // Click "Update Collection Deck"
      const updateButton = page.locator('button:has-text("Update Collection Deck")');
      await updateButton.click();
      
      // Measure batch save performance
      await page.waitForSelector('text=/changes pending/', { state: 'hidden' });
      const endTime = Date.now();
      const totalTime = endTime - startTime;
      
      // Should complete within 3 seconds
      expect(totalTime).toBeLessThan(3000);
      
      // Verify changes persist after refresh
      await page.reload();
      await waitForTableLoad(page);
      
      // Check that changes are still visible
      const modifiedRows = await page.locator('.change-indicator').count();
      expect(modifiedRows).toBeGreaterThan(0);
      
      // Capture performance metrics
      const metrics = await measurePerformance(page);
      console.log('Performance Metrics:', metrics);
    });

    test('should maintain WebSocket connection during batch operations', async ({ page }) => {
      // Monitor WebSocket messages
      const wsMessages: any[] = [];
      page.on('websocket', ws => {
        ws.on('framereceived', event => wsMessages.push({ type: 'received', payload: event.payload }));
        ws.on('framesent', event => wsMessages.push({ type: 'sent', payload: event.payload }));
      });
      
      // Perform batch operations
      for (let i = 1; i <= 3; i++) {
        const checkbox = page.locator(`.opportunities-table-enhanced input[type="checkbox"]`).nth(i);
        await checkbox.check();
      }
      
      // Make changes
      await page.locator('button[aria-label="Quick Edit"]').first().click();
      await page.locator('select[aria-label="Priority"]').selectOption('critical');
      await page.locator('button:has-text("Save")').click();
      
      // Wait for WebSocket activity
      await page.waitForTimeout(1000);
      
      // Verify WebSocket messages were exchanged
      expect(wsMessages.length).toBeGreaterThan(0);
    });
  });

  test.describe('Test 5: Responsive Design Cross-Browser', () => {
    const viewports = [
      { width: 1920, height: 1080, name: 'desktop' },
      { width: 1366, height: 768, name: 'laptop' },
      { width: 1024, height: 768, name: 'tablet-landscape' },
      { width: 768, height: 1024, name: 'tablet-portrait' }
    ];

    for (const viewport of viewports) {
      test(`should render correctly at ${viewport.name} (${viewport.width}x${viewport.height})`, async ({ page }) => {
        await page.setViewportSize({ width: viewport.width, height: viewport.height });
        await page.goto(COLLECTION_HUB_URL);
        await waitForTableLoad(page);
        
        // Verify table is visible
        await expect(page.locator('.opportunities-table-enhanced')).toBeVisible();
        
        // Check for horizontal scroll
        const hasHorizontalScroll = await page.evaluate(() => {
          return document.documentElement.scrollWidth > document.documentElement.clientWidth;
        });
        expect(hasHorizontalScroll).toBe(false);
        
        // Test modal scaling
        await page.locator('button[aria-label="Quick Edit"]').first().click();
        const modal = page.locator('[role="dialog"]');
        await expect(modal).toBeVisible();
        
        // Verify modal fits in viewport
        const modalBounds = await modal.boundingBox();
        expect(modalBounds).toBeTruthy();
        if (modalBounds) {
          expect(modalBounds.width).toBeLessThanOrEqual(viewport.width);
          expect(modalBounds.height).toBeLessThanOrEqual(viewport.height);
        }
        
        await page.locator('button[aria-label="Close"]').click();
        
        // Check button tap targets (min 44x44px for touch)
        if (viewport.width <= 1024) {
          const buttons = await page.locator('button').all();
          for (const button of buttons.slice(0, 5)) {
            const box = await button.boundingBox();
            if (box) {
              expect(box.width).toBeGreaterThanOrEqual(44);
              expect(box.height).toBeGreaterThanOrEqual(44);
            }
          }
        }
        
        await captureScreenshot(page, `responsive-${viewport.name}`);
      });
    }

    test('should support touch interactions on tablet', async ({ browser }) => {
      const context = await browser.newContext({
        viewport: { width: 768, height: 1024 },
        hasTouch: true,
        isMobile: true
      });
      const page = await context.newPage();
      
      await page.goto(COLLECTION_HUB_URL);
      await waitForTableLoad(page);
      
      // Test swipe gesture in table (horizontal scroll if needed)
      const table = page.locator('.opportunities-table-enhanced');
      await table.tap({ position: { x: 400, y: 200 } });
      await page.waitForTimeout(100);
      
      // Test tap on button
      await page.tap('button[aria-label="Quick Edit"]');
      await expect(page.locator('[role="dialog"]')).toBeVisible();
      
      // Test pinch-to-zoom gesture (simulated)
      await page.evaluate(() => {
        const event = new WheelEvent('wheel', {
          deltaY: -100,
          ctrlKey: true
        });
        document.dispatchEvent(event);
      });
      
      await context.close();
    });
  });

  test.describe('Visual Regression Testing', () => {
    test('should match visual baseline', async ({ page }) => {
      // Wait for all dynamic content
      await waitForTableLoad(page);
      await page.waitForLoadState('networkidle');
      
      // Hide dynamic timestamps to ensure consistency
      await page.evaluate(() => {
        document.querySelectorAll('[data-testid*="timestamp"]').forEach(el => {
          el.textContent = '2024-01-01 00:00:00';
        });
      });
      
      // Take screenshot for visual comparison
      await expect(page).toHaveScreenshot('collection-hub-baseline.png', {
        fullPage: true,
        animations: 'disabled',
        mask: [page.locator('.timestamp'), page.locator('.loading-spinner')]
      });
    });
  });

  test.describe('Error Handling and Edge Cases', () => {
    test('should handle network failures gracefully', async ({ page }) => {
      // Simulate offline mode
      await page.context().setOffline(true);
      
      // Try to save changes
      await page.locator('button[aria-label="Quick Edit"]').first().click();
      await page.locator('select[aria-label="Priority"]').selectOption('high');
      await page.locator('button:has-text("Save")').click();
      
      // Should show error message
      await expect(page.locator('text=/error|failed|offline/i')).toBeVisible({ timeout: 5000 });
      
      // Go back online
      await page.context().setOffline(false);
    });

    test('should handle concurrent edits', async ({ browser }) => {
      // Open two browser contexts (simulating two users)
      const context1 = await browser.newContext();
      const context2 = await browser.newContext();
      
      const page1 = await context1.newPage();
      const page2 = await context2.newPage();
      
      // Both navigate to same page
      await page1.goto(COLLECTION_HUB_URL);
      await page2.goto(COLLECTION_HUB_URL);
      
      await waitForTableLoad(page1);
      await waitForTableLoad(page2);
      
      // Both edit same opportunity
      await page1.locator('button[aria-label="Quick Edit"]').first().click();
      await page2.locator('button[aria-label="Quick Edit"]').first().click();
      
      // User 1 saves first
      await page1.locator('select[aria-label="Priority"]').selectOption('high');
      await page1.locator('button:has-text("Save")').click();
      
      // User 2 tries to save
      await page2.locator('select[aria-label="Priority"]').selectOption('critical');
      await page2.locator('button:has-text("Save")').click();
      
      // Should handle conflict (either merge or show conflict warning)
      const hasConflictWarning = await page2.locator('text=/conflict|updated|refresh/i').count() > 0;
      expect(hasConflictWarning).toBe(true);
      
      await context1.close();
      await context2.close();
    });
  });

  test.describe('Performance Monitoring', () => {
    test('should meet performance budgets', async ({ page }) => {
      // Enable performance monitoring
      await page.coverage.startJSCoverage();
      await page.coverage.startCSSCoverage();
      
      const startTime = performance.now();
      await page.goto(COLLECTION_HUB_URL);
      await waitForTableLoad(page);
      const loadTime = performance.now() - startTime;
      
      // Check load time is under 3 seconds
      expect(loadTime).toBeLessThan(3000);
      
      // Get Core Web Vitals
      const vitals = await page.evaluate(() => {
        return new Promise((resolve) => {
          let lcp = 0;
          let fid = 0;
          let cls = 0;
          
          new PerformanceObserver((list) => {
            const entries = list.getEntries();
            entries.forEach((entry) => {
              if (entry.entryType === 'largest-contentful-paint') {
                lcp = entry.startTime;
              }
            });
          }).observe({ entryTypes: ['largest-contentful-paint'] });
          
          new PerformanceObserver((list) => {
            const entries = list.getEntries();
            entries.forEach((entry) => {
              if (entry.entryType === 'first-input') {
                fid = entry.processingStart - entry.startTime;
              }
            });
          }).observe({ entryTypes: ['first-input'] });
          
          new PerformanceObserver((list) => {
            const entries = list.getEntries();
            entries.forEach((entry) => {
              if (entry.entryType === 'layout-shift') {
                cls += entry.value;
              }
            });
          }).observe({ entryTypes: ['layout-shift'] });
          
          setTimeout(() => {
            resolve({ lcp, fid, cls });
          }, 3000);
        });
      });
      
      // Verify Core Web Vitals thresholds
      expect(vitals.lcp).toBeLessThan(2500); // LCP < 2.5s
      expect(vitals.fid).toBeLessThan(100);  // FID < 100ms
      expect(vitals.cls).toBeLessThan(0.1);  // CLS < 0.1
      
      // Get coverage
      const [jsCoverage, cssCoverage] = await Promise.all([
        page.coverage.stopJSCoverage(),
        page.coverage.stopCSSCoverage()
      ]);
      
      // Calculate coverage percentages
      let totalBytes = 0;
      let usedBytes = 0;
      
      [...jsCoverage, ...cssCoverage].forEach((entry) => {
        totalBytes += entry.text.length;
        entry.ranges.forEach((range) => {
          usedBytes += range.end - range.start - 1;
        });
      });
      
      const coverage = (usedBytes / totalBytes) * 100;
      console.log(`Code coverage: ${coverage.toFixed(2)}%`);
    });
  });
});

// Test configuration for different browsers
export const projects = [
  {
    name: 'chromium',
    use: {
      browserName: 'chromium',
      viewport: { width: 1920, height: 1080 },
    },
  },
  {
    name: 'firefox',
    use: {
      browserName: 'firefox',
      viewport: { width: 1920, height: 1080 },
    },
  },
  {
    name: 'webkit',
    use: {
      browserName: 'webkit',
      viewport: { width: 1920, height: 1080 },
    },
  },
  {
    name: 'mobile-chrome',
    use: {
      browserName: 'chromium',
      viewport: { width: 375, height: 667 },
      isMobile: true,
      hasTouch: true,
    },
  },
  {
    name: 'mobile-safari',
    use: {
      browserName: 'webkit',
      viewport: { width: 375, height: 667 },
      isMobile: true,
      hasTouch: true,
    },
  },
];