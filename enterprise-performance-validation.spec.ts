import { test, expect } from '@playwright/test';

test.describe('Enterprise Match Review - Performance Validation', () => {
  test('handles 1000+ matches with optimal performance', async ({ page }) => {
    // Create large dataset simulation
    await page.addInitScript(() => {
      // Mock large dataset for testing
      window.mockLargeMatches = Array.from({ length: 1500 }, (_, i) => ({
        id: `match-${i}`,
        sourceField: `source_field_${i}`,
        targetField: `target_field_${i}`,
        matchScore: Math.random() * 0.4 + 0.6, // 0.6-1.0
        confidence: ['high', 'medium', 'low'][Math.floor(Math.random() * 3)],
        matchType: ['exact', 'fuzzy', 'semantic', 'manual'][Math.floor(Math.random() * 4)],
        status: ['approved', 'rejected', 'pending', 'modified'][Math.floor(Math.random() * 4)],
        category: ['Identity', 'Contact', 'Address', 'Temporal', 'Product'][Math.floor(Math.random() * 5)],
        dataType: ['string', 'number', 'email', 'datetime', 'identifier'][Math.floor(Math.random() * 5)],
        usage: ['frequent', 'occasional', 'rare'][Math.floor(Math.random() * 3)],
        lastModified: new Date(),
        notes: i % 10 === 0 ? `Notes for match ${i}` : undefined,
        validationErrors: i % 20 === 0 ? ['Validation error'] : undefined
      }));
    });

    await page.goto('http://localhost:3000/match-review/test-collection/test-deck');
    
    // Measure initial load performance
    const loadStartTime = Date.now();
    await page.waitForSelector('.match-review', { timeout: 10000 });
    const loadEndTime = Date.now();
    const initialLoadTime = loadEndTime - loadStartTime;
    
    console.log(`Initial load time: ${initialLoadTime}ms`);
    expect(initialLoadTime).toBeLessThan(3000); // Should load within 3 seconds

    // Test pagination performance
    const paginationControls = page.locator('.pagination-controls');
    if (await paginationControls.isVisible()) {
      const nextButton = page.locator('button[aria-label="Next page"]');
      
      // Measure pagination performance
      const paginationStartTime = Date.now();
      await nextButton.click();
      await page.waitForSelector('.match-card', { timeout: 2000 });
      const paginationEndTime = Date.now();
      const paginationTime = paginationEndTime - paginationStartTime;
      
      console.log(`Pagination time: ${paginationTime}ms`);
      expect(paginationTime).toBeLessThan(500); // Should paginate within 500ms
    }

    // Test filtering performance
    const searchInput = page.locator('input[placeholder*="Search"]');
    const filterStartTime = Date.now();
    await searchInput.fill('source_field_100');
    
    // Wait for filtered results
    await page.waitForFunction(() => {
      const results = document.querySelectorAll('.match-card');
      return results.length > 0 && results.length < 50; // Should be filtered down
    }, { timeout: 2000 });
    
    const filterEndTime = Date.now();
    const filterTime = filterEndTime - filterStartTime;
    
    console.log(`Filter time: ${filterTime}ms`);
    expect(filterTime).toBeLessThan(300); // Should filter within 300ms
  });

  test('bulk operations performance with large selections', async ({ page }) => {
    await page.goto('http://localhost:3000/match-review/test-collection/test-deck');
    await page.waitForSelector('.match-review');
    
    // Enable bulk mode
    const bulkButton = page.locator('button:has-text("Bulk Mode")').first();
    await bulkButton.click();
    
    // Test select all performance
    const selectAllButton = page.locator('button:has-text("Select Page"), button:has-text("Select All")').first();
    if (await selectAllButton.isVisible()) {
      const selectStartTime = Date.now();
      await selectAllButton.click();
      
      // Wait for selections to be processed
      await page.waitForSelector('.bulk-actions-toolbar', { timeout: 2000 });
      const selectEndTime = Date.now();
      const selectTime = selectEndTime - selectStartTime;
      
      console.log(`Select all time: ${selectTime}ms`);
      expect(selectTime).toBeLessThan(1000); // Should select within 1 second
      
      // Test bulk action performance
      const approveButton = page.locator('button:has-text("Approve Selected")');
      if (await approveButton.isVisible()) {
        const bulkActionStartTime = Date.now();
        await approveButton.click();
        
        // Wait for bulk action to complete (simulate API call)
        await page.waitForTimeout(100); // Small wait for UI update
        const bulkActionEndTime = Date.now();
        const bulkActionTime = bulkActionEndTime - bulkActionStartTime;
        
        console.log(`Bulk action time: ${bulkActionTime}ms`);
        expect(bulkActionTime).toBeLessThan(2000); // Should complete within 2 seconds
      }
    }
  });

  test('memory usage optimization', async ({ page }) => {
    await page.goto('http://localhost:3000/match-review/test-collection/test-deck');
    await page.waitForSelector('.match-review');
    
    // Get initial memory usage
    const initialMetrics = await page.evaluate(() => {
      if ('memory' in performance) {
        return (performance as any).memory;
      }
      return null;
    });
    
    if (initialMetrics) {
      console.log('Initial memory usage:', initialMetrics.usedJSHeapSize / 1024 / 1024, 'MB');
      
      // Perform heavy operations
      const searchInput = page.locator('input[placeholder*="Search"]');
      
      // Multiple filter operations to stress test
      const searchTerms = ['source', 'target', 'field', 'match', 'test'];
      for (const term of searchTerms) {
        await searchInput.fill(term);
        await page.waitForTimeout(200);
      }
      
      // Enable/disable bulk mode multiple times
      const bulkButton = page.locator('button:has-text("Bulk"), button:has-text("Exit Bulk")').first();
      for (let i = 0; i < 5; i++) {
        if (await bulkButton.isVisible()) {
          await bulkButton.click();
          await page.waitForTimeout(100);
        }
      }
      
      // Get final memory usage
      const finalMetrics = await page.evaluate(() => {
        if ('memory' in performance) {
          return (performance as any).memory;
        }
        return null;
      });
      
      if (finalMetrics) {
        console.log('Final memory usage:', finalMetrics.usedJSHeapSize / 1024 / 1024, 'MB');
        
        const memoryIncrease = finalMetrics.usedJSHeapSize - initialMetrics.usedJSHeapSize;
        const memoryIncreaseMB = memoryIncrease / 1024 / 1024;
        
        console.log('Memory increase:', memoryIncreaseMB, 'MB');
        
        // Should not leak significant memory during normal operations
        expect(memoryIncreaseMB).toBeLessThan(50); // Less than 50MB increase
      }
    }
  });

  test('expand/collapse performance with many items', async ({ page }) => {
    await page.goto('http://localhost:3000/match-review/test-collection/test-deck');
    await page.waitForSelector('.match-review');
    
    // Get all expand buttons
    const expandButtons = page.locator('button[aria-label*="Expand details"]');
    const buttonCount = await expandButtons.count();
    
    if (buttonCount > 0) {
      // Test expanding multiple items
      const expandStartTime = Date.now();
      
      // Expand first 10 items
      const itemsToExpand = Math.min(10, buttonCount);
      for (let i = 0; i < itemsToExpand; i++) {
        await expandButtons.nth(i).click();
        await page.waitForTimeout(50); // Small delay between expansions
      }
      
      const expandEndTime = Date.now();
      const expandTime = expandEndTime - expandStartTime;
      const avgExpandTime = expandTime / itemsToExpand;
      
      console.log(`Average expand time: ${avgExpandTime}ms`);
      expect(avgExpandTime).toBeLessThan(100); // Should expand within 100ms each
      
      // Test collapsing performance
      const collapseStartTime = Date.now();
      
      const collapseButtons = page.locator('button[aria-label*="Collapse details"]');
      const collapseCount = await collapseButtons.count();
      
      for (let i = 0; i < collapseCount; i++) {
        await collapseButtons.nth(i).click();
        await page.waitForTimeout(50);
      }
      
      const collapseEndTime = Date.now();
      const collapseTime = collapseEndTime - collapseStartTime;
      const avgCollapseTime = collapseTime / collapseCount;
      
      console.log(`Average collapse time: ${avgCollapseTime}ms`);
      expect(avgCollapseTime).toBeLessThan(100); // Should collapse within 100ms each
    }
  });

  test('responsive performance across breakpoints', async ({ page }) => {
    const breakpoints = [
      { width: 1920, height: 1080, name: 'Desktop Large' },
      { width: 1366, height: 768, name: 'Desktop Standard' },
      { width: 768, height: 1024, name: 'Tablet' },
      { width: 375, height: 667, name: 'Mobile' }
    ];
    
    for (const breakpoint of breakpoints) {
      await page.setViewportSize({ width: breakpoint.width, height: breakpoint.height });
      
      const loadStartTime = Date.now();
      await page.goto('http://localhost:3000/match-review/test-collection/test-deck');
      await page.waitForSelector('.match-review', { timeout: 5000 });
      const loadEndTime = Date.now();
      
      const loadTime = loadEndTime - loadStartTime;
      console.log(`${breakpoint.name} load time: ${loadTime}ms`);
      
      expect(loadTime).toBeLessThan(3000); // Should load within 3 seconds at all breakpoints
      
      // Test responsive interaction performance
      const searchInput = page.locator('input[placeholder*="Search"]');
      const interactionStartTime = Date.now();
      await searchInput.fill('test');
      await page.waitForSelector('.match-card', { timeout: 2000 });
      const interactionEndTime = Date.now();
      
      const interactionTime = interactionEndTime - interactionStartTime;
      console.log(`${breakpoint.name} interaction time: ${interactionTime}ms`);
      
      expect(interactionTime).toBeLessThan(500); // Should respond within 500ms
    }
  });

  test('keyboard navigation performance', async ({ page }) => {
    await page.goto('http://localhost:3000/match-review/test-collection/test-deck');
    await page.waitForSelector('.match-review');
    
    // Test keyboard shortcuts performance
    const shortcuts = [
      { key: 'Control+f', expectedFocus: 'input[placeholder*="Search"]' },
      { key: 'Escape', action: 'clear_selection' },
      { key: 'Control+a', action: 'select_all' }
    ];
    
    for (const shortcut of shortcuts) {
      const shortcutStartTime = Date.now();
      await page.keyboard.press(shortcut.key);
      
      if (shortcut.expectedFocus) {
        await page.waitForSelector(shortcut.expectedFocus + ':focus', { timeout: 1000 });
      } else {
        await page.waitForTimeout(100); // Wait for action to complete
      }
      
      const shortcutEndTime = Date.now();
      const shortcutTime = shortcutEndTime - shortcutStartTime;
      
      console.log(`Keyboard shortcut ${shortcut.key} time: ${shortcutTime}ms`);
      expect(shortcutTime).toBeLessThan(200); // Should respond within 200ms
    }
  });

  test('drawer performance with large content', async ({ page }) => {
    await page.goto('http://localhost:3000/match-review/test-collection/test-deck');
    await page.waitForSelector('.match-review');
    
    // Test drawer open performance
    const moreButton = page.locator('button[aria-label*="View detailed"]').first();
    if (await moreButton.isVisible()) {
      const drawerOpenStartTime = Date.now();
      await moreButton.click();
      
      const drawer = page.locator('.bp4-drawer');
      await expect(drawer).toBeVisible({ timeout: 2000 });
      
      const drawerOpenEndTime = Date.now();
      const drawerOpenTime = drawerOpenEndTime - drawerOpenStartTime;
      
      console.log(`Drawer open time: ${drawerOpenTime}ms`);
      expect(drawerOpenTime).toBeLessThan(500); // Should open within 500ms
      
      // Test drawer close performance
      const drawerCloseStartTime = Date.now();
      await page.keyboard.press('Escape');
      
      await expect(drawer).not.toBeVisible({ timeout: 2000 });
      
      const drawerCloseEndTime = Date.now();
      const drawerCloseTime = drawerCloseEndTime - drawerCloseStartTime;
      
      console.log(`Drawer close time: ${drawerCloseTime}ms`);
      expect(drawerCloseTime).toBeLessThan(500); // Should close within 500ms
    }
  });
});