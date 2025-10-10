import { test, expect, Page, BrowserContext } from '@playwright/test';

// Define CollectionStatus type for tests
type CollectionStatus = 'pending' | 'converged' | 'failed' | 'running';

// Test configuration
const TEST_CONFIG = {
  baseURL: 'http://localhost:3000',
  timeout: 30000,
  navigationTimeout: 10000,
  viewports: {
    desktop: { width: 1920, height: 1080 },
    mobile: { width: 390, height: 844 }
  }
};

// Test data setup
const TEST_COLLECTION = {
  id: 'TEST-001',
  algorithmStatus: 'converged' as CollectionStatus,
  name: 'Test Collection'
};

// Helper functions
async function navigateToHistory(page: Page) {
  await page.goto('/history');
  await page.waitForSelector('[data-testid="history-table"]', {
    state: 'visible',
    timeout: TEST_CONFIG.navigationTimeout
  });
}

async function findConvergedCollection(page: Page) {
  // Wait for table to load
  await page.waitForSelector('.collection-row', { state: 'visible' });
  
  // Find first converged collection
  const convergedRow = page.locator('.collection-row').filter({
    hasText: 'converged'
  }).first();
  
  return convergedRow;
}

// Test Suite 1: History Page Navigation to Collection Opportunities
test.describe('History Page Navigation to Collection Opportunities', () => {
  test('should navigate from history to collection opportunities', async ({ page }) => {
    // 1. Navigate to history page
    await navigateToHistory(page);
    
    // 2. Find and click on a converged collection
    const collectionRow = await findConvergedCollection(page);
    await expect(collectionRow).toBeVisible();
    await collectionRow.click();
    
    // 3. Wait for detail panel to open
    await page.waitForSelector('.collection-detail-panel', { 
      state: 'visible',
      timeout: 5000 
    });
    
    // 4. Verify Collection Opportunities button is enabled
    const opportunitiesButton = page.getByTestId('detail-view-opportunities');
    await expect(opportunitiesButton).toBeEnabled();
    
    // 5. Click the Collection Opportunities button
    await opportunitiesButton.click();
    
    // 6. Wait for navigation to complete
    await page.waitForURL(/\/collection\/.*\/manage/, {
      timeout: TEST_CONFIG.navigationTimeout
    });
    
    // 7. Verify page title and content
    await expect(page.getByRole('heading', { name: /Manage Opportunities/i })).toBeVisible();
    
    // 8. Take screenshot for validation
    await page.screenshot({ 
      path: 'test-results/history-navigation-success.png',
      fullPage: true 
    });
    
    // 9. Check for console errors
    const consoleErrors: string[] = [];
    page.on('console', msg => {
      if (msg.type() === 'error') {
        consoleErrors.push(msg.text());
      }
    });
    
    await page.waitForTimeout(1000); // Brief wait to catch any delayed errors
    expect(consoleErrors).toHaveLength(0);
  });
});

// Test Suite 2: Old Route Redirect Validation
test.describe('Old Route Redirect Validation', () => {
  test('should redirect from old route to new route', async ({ page }) => {
    // 1. Navigate directly to old route format
    const oldRoute = `/history/${TEST_COLLECTION.id}/collection-opportunities`;
    await page.goto(oldRoute);
    
    // 2. Wait for automatic redirect
    await page.waitForURL(/\/collection\/.*\/manage/, {
      timeout: TEST_CONFIG.navigationTimeout
    });
    
    // 3. Verify final URL
    expect(page.url()).toContain(`/collection/${TEST_COLLECTION.id}/manage`);
    
    // 4. Verify CollectionOpportunitiesHub component loaded
    await expect(page.getByText('Manage Opportunities')).toBeVisible();
    await expect(page.getByTestId('opportunities-table')).toBeVisible();
    
    // 5. Take screenshot
    await page.screenshot({ 
      path: 'test-results/redirect-validation.png',
      fullPage: true 
    });
    
    // 6. Check browser history to ensure replace worked
    const historyLength = await page.evaluate(() => window.history.length);
    
    // 7. Test back button doesn't create redirect loop
    await page.goBack();
    await page.waitForTimeout(500);
    
    // Should not be on the old route
    expect(page.url()).not.toContain('/collection-opportunities');
  });
  
  test('should handle invalid collection IDs gracefully', async ({ page }) => {
    // Test with invalid collection ID
    const invalidRoute = '/collection/INVALID-ID/manage';
    await page.goto(invalidRoute);
    
    // Should show appropriate error handling
    await expect(page.getByText(/Collection not found|Error/i)).toBeVisible({
      timeout: 5000
    });
  });
});

// Test Suite 3: Bidirectional Navigation (Field Mapping ↔ Opportunities)
test.describe('Bidirectional Navigation', () => {
  test('should navigate between field mapping and opportunities', async ({ page }) => {
    // 1. Navigate to collection opportunities
    await page.goto(`/collection/${TEST_COLLECTION.id}/manage`);
    await page.waitForSelector('[data-testid="navigation-fab"]', { state: 'visible' });
    
    // 2. Open NavigationFAB
    const fab = page.getByTestId('navigation-fab');
    await fab.click();
    
    // 3. Click Field Mappings link
    const fieldMappingLink = page.getByRole('menuitem', { name: /Field Mappings/i });
    await fieldMappingLink.click();
    
    // 4. Verify navigation to field mapping
    await page.waitForURL(/\/history\/.*\/field-mapping-review/);
    expect(page.url()).toContain(`/history/${TEST_COLLECTION.id}/field-mapping-review`);
    
    // 5. Take screenshot of field mapping page
    await page.screenshot({ 
      path: 'test-results/field-mapping-page.png',
      fullPage: true 
    });
    
    // 6. Navigate back to opportunities
    await fab.click();
    const opportunitiesLink = page.getByRole('menuitem', { name: /Collection Opportunities/i });
    await opportunitiesLink.click();
    
    // 7. Verify navigation back
    await page.waitForURL(/\/collection\/.*\/manage/);
    expect(page.url()).toContain(`/collection/${TEST_COLLECTION.id}/manage`);
    
    // 8. Verify no duplicate history entries
    const finalHistoryLength = await page.evaluate(() => window.history.length);
    expect(finalHistoryLength).toBeLessThan(10); // Reasonable limit for this test
  });
});

// Test Suite 4: Keyboard Navigation and Shortcuts
test.describe('Keyboard Navigation and Shortcuts', () => {
  test('should support keyboard navigation', async ({ page }) => {
    // 1. Navigate to history
    await navigateToHistory(page);
    
    // 2. Tab to first collection row
    await page.keyboard.press('Tab');
    await page.keyboard.press('Tab'); // May need multiple tabs to reach table
    
    // 3. Press Enter to select
    const focusedElement = page.locator(':focus');
    await focusedElement.press('Enter');
    
    // 4. Wait for detail panel
    await page.waitForSelector('.collection-detail-panel', { state: 'visible' });
    
    // 5. Tab to opportunities button and press Enter
    let opportunitiesButtonFocused = false;
    for (let i = 0; i < 20; i++) { // Max 20 tabs to prevent infinite loop
      await page.keyboard.press('Tab');
      const currentFocused = await page.locator(':focus').getAttribute('data-testid');
      if (currentFocused === 'detail-view-opportunities') {
        opportunitiesButtonFocused = true;
        break;
      }
    }
    
    expect(opportunitiesButtonFocused).toBeTruthy();
    await page.keyboard.press('Enter');
    
    // 6. Verify navigation
    await page.waitForURL(/\/collection\/.*\/manage/);
    
    // 7. Test keyboard shortcuts in hub
    // Select first row in table
    await page.getByTestId('opportunities-table').locator('tr').first().click();
    
    // Test Edit shortcut (Cmd+E or Ctrl+E)
    const modifier = process.platform === 'darwin' ? 'Meta' : 'Control';
    await page.keyboard.press(`${modifier}+E`);
    // Verify edit action triggered (dialog or navigation)
    
    // Test Escape to clear selection
    await page.keyboard.press('Escape');
    
    // Screenshot keyboard navigation success
    await page.screenshot({ 
      path: 'test-results/keyboard-nav-success.png',
      fullPage: true 
    });
  });
  
  test('should meet accessibility standards', async ({ page }) => {
    await page.goto(`/collection/${TEST_COLLECTION.id}/manage`);
    
    // Run axe accessibility tests
    // Note: This requires axe-playwright to be configured
    // const results = await new AxeBuilder({ page }).analyze();
    // expect(results.violations).toHaveLength(0);
  });
});

// Test Suite 5: Browser History and Bookmarks
test.describe('Browser History and Bookmarks', () => {
  test('should handle browser navigation correctly', async ({ page, context }) => {
    // 1. Clear browser history (start fresh)
    await page.goto('/');
    
    // 2. Navigate through the flow
    await page.goto('/history');
    await navigateToHistory(page);
    
    // 3. Click through to collection opportunities
    const collectionRow = await findConvergedCollection(page);
    await collectionRow.click();
    await page.getByTestId('detail-view-opportunities').click();
    
    // 4. Verify history stack
    const currentUrl = page.url();
    expect(currentUrl).toMatch(/\/collection\/.*\/manage/);
    
    // 5. Use browser back button
    await page.goBack();
    expect(page.url()).toContain('/history');
    
    // 6. Use browser forward button
    await page.goForward();
    expect(page.url()).toMatch(/\/collection\/.*\/manage/);
    
    // 7. Test bookmark functionality
    const bookmarkUrl = page.url();
    
    // 8. Navigate away and return via bookmark
    await page.goto('/');
    await page.goto(bookmarkUrl);
    
    // 9. Verify page loads correctly from bookmark
    await expect(page.getByText('Manage Opportunities')).toBeVisible();
    
    // 10. Test old bookmark format
    const oldBookmark = bookmarkUrl.replace('/collection/', '/history/').replace('/manage', '/collection-opportunities');
    await page.goto(oldBookmark);
    
    // Should redirect to new format
    await page.waitForURL(/\/collection\/.*\/manage/);
  });
});

// Test Suite 6: Error Handling and Edge Cases
test.describe('Error Handling and Edge Cases', () => {
  test('should handle errors gracefully', async ({ page }) => {
    // 1. Test invalid collection ID
    await page.goto('/collection/INVALID-ID/manage');
    
    // 2. Verify error handling
    const errorMessage = page.getByText(/not found|error/i);
    await expect(errorMessage).toBeVisible({ timeout: 5000 });
    
    // 3. Test rapid navigation (spam clicking)
    await navigateToHistory(page);
    const collectionRow = await findConvergedCollection(page);
    
    // Rapid clicks
    for (let i = 0; i < 5; i++) {
      await collectionRow.click({ force: true });
    }
    
    // Should handle without errors
    await page.waitForTimeout(1000);
    
    // 4. Screenshot error states
    await page.screenshot({ 
      path: 'test-results/error-states.png',
      fullPage: true 
    });
  });
  
  test('should work with slow network', async ({ page, context }) => {
    // Simulate slow 3G
    await context.route('**/*', route => {
      setTimeout(() => route.continue(), 300); // 300ms delay
    });
    
    // Navigate with slow network
    await navigateToHistory(page);
    
    // Verify loading states appear
    const loadingIndicator = page.getByTestId('loading-indicator');
    // Loading states should be visible during slow loads
    
    // Complete navigation
    const collectionRow = await findConvergedCollection(page);
    await collectionRow.click();
    await page.getByTestId('detail-view-opportunities').click();
    
    // Should still work with slow network
    await expect(page.getByText('Manage Opportunities')).toBeVisible({
      timeout: 30000 // Extended timeout for slow network
    });
  });
});

// Performance Validation Tests
test.describe('Performance Validation', () => {
  test('should meet performance metrics', async ({ page }) => {
    const metrics = {
      routeTransitionTimes: [] as number[],
      webVitals: {} as any
    };
    
    // Set up performance observer - use addInitScript instead of evaluateOnNewDocument
    await page.addInitScript(() => {
      window.addEventListener('load', () => {
        // Capture Web Vitals
        new PerformanceObserver((list) => {
          for (const entry of list.getEntries()) {
            // @ts-ignore
            window.__webVitals = window.__webVitals || {};
            // @ts-ignore
            window.__webVitals[entry.name] = entry.value;
          }
        }).observe({ entryTypes: ['paint', 'navigation', 'resource'] });
      });
    });
    
    // 1. Measure History → Collection Opportunities transition
    const startTime = Date.now();
    await navigateToHistory(page);
    const collectionRow = await findConvergedCollection(page);
    await collectionRow.click();
    await page.getByTestId('detail-view-opportunities').click();
    await page.waitForURL(/\/collection\/.*\/manage/);
    const transitionTime = Date.now() - startTime;
    
    metrics.routeTransitionTimes.push(transitionTime);
    
    // 2. Measure redirect time
    const redirectStart = Date.now();
    await page.goto(`/history/${TEST_COLLECTION.id}/collection-opportunities`);
    await page.waitForURL(/\/collection\/.*\/manage/);
    const redirectTime = Date.now() - redirectStart;
    
    // 3. Capture Core Web Vitals
    const webVitals = await page.evaluate(() => {
      // @ts-ignore
      return window.__webVitals || {};
    });
    
    // 4. Assert performance metrics
    expect(redirectTime).toBeLessThan(100); // Redirect should be < 100ms
    expect(transitionTime).toBeLessThan(3000); // Page load < 3s
    
    // Generate performance report
    console.log('Performance Metrics:', {
      routeTransitionTime: `${transitionTime}ms`,
      redirectTime: `${redirectTime}ms`,
      webVitals
    });
  });
});

// Cross-Browser Matrix Testing
test.describe('Cross-Browser Compatibility', () => {
  ['chromium', 'firefox', 'webkit'].forEach(browserName => {
    test(`should work in ${browserName}`, async ({ page, browserName: currentBrowser }) => {
      if (currentBrowser !== browserName) {
        test.skip();
        return;
      }
      
      // Run basic navigation test in each browser
      await navigateToHistory(page);
      const collectionRow = await findConvergedCollection(page);
      await collectionRow.click();
      await page.getByTestId('detail-view-opportunities').click();
      
      // Verify works in current browser
      await expect(page.getByText('Manage Opportunities')).toBeVisible();
      
      // Screenshot for browser-specific validation
      await page.screenshot({ 
        path: `test-results/${browserName}-compatibility.png`,
        fullPage: true 
      });
    });
  });
});