import { test, expect } from '@playwright/test';

test.describe('Collection Management Page', () => {
  const COLLECTION_URL = 'http://localhost:3000/collection/DECK-1757517559289/manage';
  
  test.beforeEach(async ({ page }) => {
    // Navigate to the collection management page
    await page.goto(COLLECTION_URL);
  });

  test('Page loads successfully', async ({ page }) => {
    // Wait for the page to be fully loaded
    await page.waitForLoadState('networkidle');
    
    // Verify the page title or main heading
    const heading = page.locator('h1, h2').first();
    await expect(heading).toBeVisible();
    
    // Check if the URL is correct
    await expect(page).toHaveURL(COLLECTION_URL);
  });

  test('UI elements are present and visible', async ({ page }) => {
    // Check for navigation elements
    const nav = page.locator('nav, [role="navigation"]');
    await expect(nav).toBeVisible();
    
    // Check for main content area
    const mainContent = page.locator('main, [role="main"], .main-content');
    await expect(mainContent).toBeVisible();
    
    // Check for collection-specific elements
    const collectionElements = await page.locator('[data-testid*="collection"], [class*="collection"]').count();
    expect(collectionElements).toBeGreaterThan(0);
  });

  test('Collection details display correctly', async ({ page }) => {
    // Wait for collection data to load
    await page.waitForSelector('[data-testid*="collection"], [class*="collection"]', { timeout: 10000 });
    
    // Check for collection ID display
    const collectionId = await page.locator('text=DECK-1757517559289').count();
    expect(collectionId).toBeGreaterThan(0);
    
    // Check for collection metadata
    const metadataElements = await page.locator('[data-testid*="metadata"], [class*="metadata"], [class*="detail"]').count();
    expect(metadataElements).toBeGreaterThan(0);
  });

  test('Interactive features respond appropriately', async ({ page }) => {
    // Wait for interactive elements to be ready
    await page.waitForLoadState('networkidle');
    
    // Find all buttons and clickable elements
    const buttons = page.locator('button:visible, [role="button"]:visible');
    const buttonCount = await buttons.count();
    
    if (buttonCount > 0) {
      // Test hover states
      const firstButton = buttons.first();
      await firstButton.hover();
      
      // Test click functionality on non-destructive buttons
      const safeButtons = page.locator('button:not([class*="delete"]):not([class*="remove"]):visible');
      const safeButtonCount = await safeButtons.count();
      
      if (safeButtonCount > 0) {
        const testButton = safeButtons.first();
        const isDisabled = await testButton.isDisabled();
        
        if (!isDisabled) {
          await testButton.click();
          // Wait a moment for any response
          await page.waitForTimeout(500);
        }
      }
    }
    
    // Test form inputs if present
    const inputs = page.locator('input:visible, select:visible, textarea:visible');
    const inputCount = await inputs.count();
    
    if (inputCount > 0) {
      const firstInput = inputs.first();
      const isDisabled = await firstInput.isDisabled();
      
      if (!isDisabled) {
        await firstInput.focus();
        // Verify focus state
        await expect(firstInput).toBeFocused();
      }
    }
  });

  test('No console errors', async ({ page }) => {
    const consoleErrors: string[] = [];
    
    // Listen for console errors
    page.on('console', (msg) => {
      if (msg.type() === 'error') {
        consoleErrors.push(msg.text());
      }
    });
    
    // Navigate and wait for page to load
    await page.goto(COLLECTION_URL);
    await page.waitForLoadState('networkidle');
    
    // Perform some interactions to trigger any potential errors
    const clickableElements = page.locator('button:visible, a:visible, [role="button"]:visible');
    const elementCount = await clickableElements.count();
    
    if (elementCount > 0) {
      // Interact with first few elements
      for (let i = 0; i < Math.min(3, elementCount); i++) {
        const element = clickableElements.nth(i);
        const tagName = await element.evaluate(el => el.tagName.toLowerCase());
        
        if (tagName !== 'a') { // Don't click links that might navigate away
          const isDisabled = await element.isDisabled().catch(() => false);
          if (!isDisabled) {
            await element.click().catch(() => {}); // Ignore click errors
            await page.waitForTimeout(200);
          }
        }
      }
    }
    
    // Assert no console errors
    expect(consoleErrors).toHaveLength(0);
  });

  test('Performance metrics', async ({ page }) => {
    // Measure page load performance
    const startTime = Date.now();
    await page.goto(COLLECTION_URL);
    await page.waitForLoadState('networkidle');
    const loadTime = Date.now() - startTime;
    
    // Check load time is reasonable (under 5 seconds)
    expect(loadTime).toBeLessThan(5000);
    
    // Get performance metrics
    const performanceMetrics = await page.evaluate(() => {
      const navigation = performance.getEntriesByType('navigation')[0] as PerformanceNavigationTiming;
      return {
        domContentLoaded: navigation.domContentLoadedEventEnd - navigation.domContentLoadedEventStart,
        loadComplete: navigation.loadEventEnd - navigation.loadEventStart,
        firstPaint: performance.getEntriesByName('first-paint')[0]?.startTime || 0,
        firstContentfulPaint: performance.getEntriesByName('first-contentful-paint')[0]?.startTime || 0,
      };
    });
    
    // Log performance metrics
    console.log('Performance Metrics:', performanceMetrics);
    
    // Verify reasonable performance
    expect(performanceMetrics.firstContentfulPaint).toBeLessThan(3000);
  });

  test('Core functionality validation', async ({ page }) => {
    // Wait for page to be ready
    await page.waitForLoadState('networkidle');
    
    // Check for data loading indicators
    const loadingIndicators = await page.locator('[class*="loading"], [class*="spinner"], [aria-busy="true"]').count();
    
    if (loadingIndicators > 0) {
      // Wait for loading to complete
      await page.waitForSelector('[class*="loading"], [class*="spinner"], [aria-busy="true"]', { state: 'hidden', timeout: 10000 }).catch(() => {});
    }
    
    // Verify data has loaded
    const dataElements = await page.locator('[data-testid], [class*="item"], [class*="row"], [class*="card"]').count();
    expect(dataElements).toBeGreaterThan(0);
    
    // Check for action buttons
    const actionButtons = await page.locator('button[class*="action"], button[class*="edit"], button[class*="save"], button[class*="update"]').count();
    
    // Verify forms are functional if present
    const forms = page.locator('form');
    const formCount = await forms.count();
    
    if (formCount > 0) {
      const firstForm = forms.first();
      const formInputs = firstForm.locator('input, select, textarea');
      const inputCount = await formInputs.count();
      expect(inputCount).toBeGreaterThan(0);
    }
    
    // Take a screenshot for visual verification
    await page.screenshot({ path: 'collection-management-page.png', fullPage: true });
  });

  test('Responsive design check', async ({ page }) => {
    // Test desktop view
    await page.setViewportSize({ width: 1920, height: 1080 });
    await page.waitForTimeout(500);
    
    const desktopLayout = await page.locator('body').boundingBox();
    expect(desktopLayout).toBeTruthy();
    
    // Test tablet view
    await page.setViewportSize({ width: 768, height: 1024 });
    await page.waitForTimeout(500);
    
    // Test mobile view
    await page.setViewportSize({ width: 375, height: 667 });
    await page.waitForTimeout(500);
    
    // Verify key elements are still visible in mobile view
    const mobileNav = page.locator('nav, [role="navigation"]');
    await expect(mobileNav).toBeVisible();
  });
});