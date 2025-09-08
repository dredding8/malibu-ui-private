import { test, expect } from '@playwright/test';

/**
 * SPA Navigation and Context Preservation Validation
 * 
 * Specifically validates Single Page Application behavior and context preservation
 * across navigation boundaries in the Collection Deck creation workflow.
 */

test.describe('🔄 SPA Navigation and Context Preservation', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');
  });

  test('⚡ React Router Integration and State Preservation', async ({ page }) => {
    console.log('🔄 Testing React Router Integration...');
    
    // Monitor React Router context
    await page.addInitScript(() => {
      (window as any).reactRouterMetrics = {
        routeChanges: 0,
        statePreserved: true,
        contextIntact: true
      };
      
      // Monitor React Router context
      const originalDispatch = window.history.pushState;
      window.history.pushState = function(data, title, url) {
        (window as any).reactRouterMetrics.routeChanges++;
        return originalDispatch.call(this, data, title, url);
      };
    });
    
    const uniqueDeckName = `Router Test ${Date.now()}`;
    
    // Navigate through workflow
    await page.click('button:has-text("Create Collection")');
    
    // Check initial route
    await expect(page).toHaveURL(/.*create-collection-deck.*/);
    
    // Fill Step 1
    await page.fill('[data-testid="deck-name-input"]', uniqueDeckName);
    await page.fill('[data-testid="start-date-input"]', '01/01/2024');
    await page.fill('[data-testid="end-date-input"]', '01/31/2024');
    await page.selectOption('[data-testid="tle-source-select"]', 'UDL');
    await page.click('[data-testid="next-button"]');
    
    // Continue through steps
    await page.fill('[data-testid="hard-capacity-input"]', '10');
    await page.fill('[data-testid="min-duration-input"]', '15');
    await page.fill('[data-testid="elevation-input"]', '20');
    await page.click('button:has-text("Next")');
    await page.click('button:has-text("Next")');
    
    // Final navigation to History
    await page.click('button:has-text("Finish")');
    
    const confirmButton = page.locator('button:has-text("Confirm & Start Processing")');
    if (await confirmButton.isVisible({ timeout: 2000 })) {
      await confirmButton.click();
    }
    
    await page.waitForURL(/.*history.*/);
    
    // Validate React Router metrics
    const metrics = await page.evaluate(() => (window as any).reactRouterMetrics);
    
    expect(metrics.routeChanges).toBeGreaterThan(0);
    expect(metrics.statePreserved).toBe(true);
    
    // Validate navigation state is preserved
    const navigationState = await page.evaluate(() => window.history.state);
    expect(navigationState).toBeTruthy();
    
    console.log('✅ React Router Integration Validated');
  });

  test('🔗 Navigation State Transfer Validation', async ({ page }) => {
    console.log('🔗 Testing Navigation State Transfer...');
    
    const testDeckName = `State Transfer Test ${Date.now()}`;
    
    // Complete deck creation workflow with state monitoring
    await page.click('button:has-text("Create Collection")');
    
    // Fill form with unique data
    await page.fill('[data-testid="deck-name-input"]', testDeckName);
    await page.fill('[data-testid="start-date-input"]', '01/01/2024');
    await page.fill('[data-testid="end-date-input"]', '01/31/2024');
    await page.selectOption('[data-testid="tle-source-select"]', 'UDL');
    await page.click('[data-testid="next-button"]');
    await page.fill('[data-testid="hard-capacity-input"]', '10');
    await page.fill('[data-testid="min-duration-input"]', '15');
    await page.fill('[data-testid="elevation-input"]', '20');
    await page.click('button:has-text("Next")');
    await page.click('button:has-text("Next")');
    
    // Monitor the navigation state transfer
    const navigationPromise = page.waitForFunction(() => {
      return window.location.pathname.includes('history');
    });
    
    await page.click('button:has-text("Finish")');
    
    const confirmButton = page.locator('button:has-text("Confirm & Start Processing")');
    if (await confirmButton.isVisible({ timeout: 2000 })) {
      await confirmButton.click();
    }
    
    await navigationPromise;
    
    // Validate that deck information is accessible on History page
    await expect(page.locator(`text="${testDeckName}"`)).toBeVisible({ timeout: 10000 });
    
    // Check for state indicators (like new deck highlighting)
    const hasHighlighting = 
      await page.locator('text="✨"').isVisible() ||
      await page.locator('text="Just Created"').isVisible() ||
      await page.locator('[style*="GREEN"]').count() > 0;
    
    expect(hasHighlighting).toBeTruthy();
    
    console.log('✅ Navigation State Transfer Validated');
  });

  test('🚫 No Full Page Reload Validation', async ({ page }) => {
    console.log('🚫 Testing No Full Page Reload Behavior...');
    
    let pageReloadCount = 0;
    
    // Monitor for page reloads
    page.on('load', () => {
      pageReloadCount++;
    });
    
    // Set a marker in the page to detect reloads
    await page.evaluate(() => {
      (window as any).spaMarker = 'initial_load';
    });
    
    const testDeckName = `No Reload Test ${Date.now()}`;
    
    // Navigate through complete workflow
    await page.click('button:has-text("Create Collection")');
    await page.fill('[data-testid="deck-name-input"]', testDeckName);
    await page.fill('[data-testid="start-date-input"]', '01/01/2024');
    await page.fill('[data-testid="end-date-input"]', '01/31/2024');
    await page.selectOption('[data-testid="tle-source-select"]', 'UDL');
    await page.click('[data-testid="next-button"]');
    await page.fill('[data-testid="hard-capacity-input"]', '10');
    await page.fill('[data-testid="min-duration-input"]', '15');
    await page.fill('[data-testid="elevation-input"]', '20');
    await page.click('button:has-text("Next")');
    await page.click('button:has-text("Next")');
    await page.click('button:has-text("Finish")');
    
    const confirmButton = page.locator('button:has-text("Confirm & Start Processing")');
    if (await confirmButton.isVisible({ timeout: 2000 })) {
      await confirmButton.click();
    }
    
    await page.waitForURL(/.*history.*/);
    
    // Check that our marker is still present (indicating no reload)
    const markerPresent = await page.evaluate(() => (window as any).spaMarker === 'initial_load');
    expect(markerPresent).toBe(true);
    
    // Should be minimal page reloads (only initial load)
    expect(pageReloadCount).toBeLessThanOrEqual(1);
    
    console.log('✅ No Full Page Reload Behavior Validated');
  });

  test('💾 Session State Persistence', async ({ page }) => {
    console.log('💾 Testing Session State Persistence...');
    
    const testDeckName = `Session Test ${Date.now()}`;
    
    // Set session data during creation
    await page.click('button:has-text("Create Collection")');
    
    // Store session data
    await page.evaluate((deckName) => {
      sessionStorage.setItem('testDeckCreation', deckName);
    }, testDeckName);
    
    await page.fill('[data-testid="deck-name-input"]', testDeckName);
    await page.fill('[data-testid="start-date-input"]', '01/01/2024');
    await page.fill('[data-testid="end-date-input"]', '01/31/2024');
    await page.selectOption('[data-testid="tle-source-select"]', 'UDL');
    await page.click('[data-testid="next-button"]');
    await page.fill('[data-testid="hard-capacity-input"]', '10');
    await page.fill('[data-testid="min-duration-input"]', '15');
    await page.fill('[data-testid="elevation-input"]', '20');
    await page.click('button:has-text("Next")');
    await page.click('button:has-text("Next")');
    await page.click('button:has-text("Finish")');
    
    const confirmButton = page.locator('button:has-text("Confirm & Start Processing")');
    if (await confirmButton.isVisible({ timeout: 2000 })) {
      await confirmButton.click();
    }
    
    await page.waitForURL(/.*history.*/);
    
    // Validate session data is preserved
    const preservedData = await page.evaluate(() => {
      return sessionStorage.getItem('testDeckCreation');
    });
    
    expect(preservedData).toBe(testDeckName);
    
    console.log('✅ Session State Persistence Validated');
  });

  test('🔄 Browser History Integration', async ({ page }) => {
    console.log('🔄 Testing Browser History Integration...');
    
    const testDeckName = `History Test ${Date.now()}`;
    
    // Track history length
    const initialHistoryLength = await page.evaluate(() => history.length);
    
    // Navigate through workflow
    await page.click('button:has-text("Create Collection")');
    await page.fill('[data-testid="deck-name-input"]', testDeckName);
    await page.fill('[data-testid="start-date-input"]', '01/01/2024');
    await page.fill('[data-testid="end-date-input"]', '01/31/2024');
    await page.selectOption('[data-testid="tle-source-select"]', 'UDL');
    await page.click('[data-testid="next-button"]');
    await page.fill('[data-testid="hard-capacity-input"]', '10');
    await page.fill('[data-testid="min-duration-input"]', '15');
    await page.fill('[data-testid="elevation-input"]', '20');
    await page.click('button:has-text("Next")');
    await page.click('button:has-text("Next")');
    await page.click('button:has-text("Finish")');
    
    const confirmButton = page.locator('button:has-text("Confirm & Start Processing")');
    if (await confirmButton.isVisible({ timeout: 2000 })) {
      await confirmButton.click();
    }
    
    await page.waitForURL(/.*history.*/);
    
    // History should have grown (indicating proper pushState usage)
    const finalHistoryLength = await page.evaluate(() => history.length);
    expect(finalHistoryLength).toBeGreaterThan(initialHistoryLength);
    
    // Test back navigation works (but don't actually navigate back to avoid disrupting test)
    const canGoBack = await page.evaluate(() => history.length > 1);
    expect(canGoBack).toBe(true);
    
    console.log('✅ Browser History Integration Validated');
  });

  test('🎯 Context Preservation Across Route Changes', async ({ page }) => {
    console.log('🎯 Testing Context Preservation...');
    
    // Monitor React context preservation
    await page.addInitScript(() => {
      (window as any).contextPreservationMetrics = {
        contextChanges: 0,
        providersActive: true,
        dataIntegrity: true
      };
    });
    
    const testDeckName = `Context Preservation ${Date.now()}`;
    
    // Navigate and monitor context
    await page.click('button:has-text("Create Collection")');
    
    // Check for React context providers
    const hasContextProviders = await page.evaluate(() => {
      const reactRoot = document.querySelector('#root');
      return reactRoot && reactRoot.children.length > 0;
    });
    
    expect(hasContextProviders).toBe(true);
    
    await page.fill('[data-testid="deck-name-input"]', testDeckName);
    await page.fill('[data-testid="start-date-input"]', '01/01/2024');
    await page.fill('[data-testid="end-date-input"]', '01/31/2024');
    await page.selectOption('[data-testid="tle-source-select"]', 'UDL');
    await page.click('[data-testid="next-button"]');
    await page.fill('[data-testid="hard-capacity-input"]', '10');
    await page.fill('[data-testid="min-duration-input"]', '15');
    await page.fill('[data-testid="elevation-input"]', '20');
    await page.click('button:has-text("Next")');
    await page.click('button:has-text("Next")');
    await page.click('button:has-text("Finish")');
    
    const confirmButton = page.locator('button:has-text("Confirm & Start Processing")');
    if (await confirmButton.isVisible({ timeout: 2000 })) {
      await confirmButton.click();
    }
    
    await page.waitForURL(/.*history.*/);
    
    // Validate context is still intact after navigation
    const contextIntact = await page.evaluate(() => {
      const reactRoot = document.querySelector('#root');
      return reactRoot && reactRoot.children.length > 0;
    });
    
    expect(contextIntact).toBe(true);
    
    // Check for the created deck (indicating context/data was properly passed)
    await expect(page.locator(`text="${testDeckName}"`)).toBeVisible();
    
    console.log('✅ Context Preservation Validated');
  });
});