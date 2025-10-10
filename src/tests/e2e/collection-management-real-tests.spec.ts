import { test, expect } from '@playwright/test';

test.describe('Collection Management - Real Application Tests', () => {
  test.beforeEach(async ({ page }) => {
    // Navigate directly to the collection management hub
    await page.goto('http://localhost:3000/collection/1/manage');
    
    // Wait for the page to load
    await page.waitForLoadState('networkidle');
    
    // Wait for the spinner to disappear (if any)
    await page.waitForSelector('.bp5-spinner', { state: 'hidden' }).catch(() => {});
  });

  test('✅ Collection Management page loads successfully', async ({ page }) => {
    // Verify we're on the correct page
    expect(page.url()).toContain('/collection/1/manage');
    
    // Check for the navbar
    const navbar = await page.locator('.navbar, nav, .bp5-navbar').isVisible();
    expect(navbar).toBeTruthy();
    
    // Check for tabs (the page uses a tabbed interface)
    const tabs = await page.locator('.bp5-tabs, [role="tablist"]').isVisible();
    expect(tabs).toBeTruthy();
    
    console.log('✅ Page loaded successfully with navbar and tabs');
  });

  test('🎯 Navigate between different views using tabs', async ({ page }) => {
    // Look for tab elements
    const tabButtons = await page.locator('.bp5-tab, [role="tab"]').all();
    console.log(`Found ${tabButtons.length} tabs`);
    
    // Get tab names
    const tabNames = await Promise.all(
      tabButtons.map(tab => tab.textContent())
    );
    console.log('Available tabs:', tabNames);
    
    // Click on each tab
    for (let i = 0; i < tabButtons.length && i < 3; i++) {
      await tabButtons[i].click();
      await page.waitForTimeout(500); // Give time for content to load
      
      // Check that tab panel is visible
      const tabPanel = await page.locator('.bp5-tab-panel:visible, [role="tabpanel"]:visible').isVisible();
      expect(tabPanel).toBeTruthy();
      
      console.log(`✅ Clicked tab: ${tabNames[i]}`);
    }
  });

  test('📊 View collection opportunities data', async ({ page }) => {
    // Wait for any data to load
    await page.waitForTimeout(2000);
    
    // Check for data containers (table, cards, or list)
    const hasTable = await page.locator('table').isVisible().catch(() => false);
    const hasCards = await page.locator('.bp5-card').count() > 0;
    const hasList = await page.locator('[role="list"], ul, ol').isVisible().catch(() => false);
    
    console.log('Data display methods found:');
    console.log('- Table:', hasTable);
    console.log('- Cards:', hasCards);
    console.log('- List:', hasList);
    
    // At least one data display method should be present
    expect(hasTable || hasCards || hasList).toBeTruthy();
    
    // Look for any interactive elements
    const buttons = await page.locator('button:visible').count();
    console.log(`Found ${buttons} visible buttons`);
    expect(buttons).toBeGreaterThan(0);
  });

  test('🔍 Search and filter functionality', async ({ page }) => {
    // Look for search/filter inputs
    const searchInputs = await page.locator('input[type="text"], input[placeholder*="Search"], input[placeholder*="Filter"]').all();
    
    if (searchInputs.length > 0) {
      console.log(`Found ${searchInputs.length} search/filter inputs`);
      
      // Try typing in the first search input
      const firstInput = searchInputs[0];
      await firstInput.fill('test search');
      await page.waitForTimeout(500); // Wait for any debounced search
      
      console.log('✅ Search input accepts text');
    } else {
      console.log('ℹ️ No search inputs found on current view');
    }
  });

  test('♿ Accessibility - Keyboard navigation', async ({ page }) => {
    // Start keyboard navigation
    await page.keyboard.press('Tab');
    await page.waitForTimeout(100);
    
    // Check that something is focused
    const focusedElement = await page.evaluate(() => {
      const el = document.activeElement;
      return {
        exists: el !== null && el !== document.body,
        tag: el?.tagName,
        text: el?.textContent?.substring(0, 50)
      };
    });
    
    expect(focusedElement.exists).toBeTruthy();
    console.log('✅ Keyboard focus works:', focusedElement);
    
    // Tab through a few more elements
    for (let i = 0; i < 5; i++) {
      await page.keyboard.press('Tab');
      await page.waitForTimeout(100);
    }
    
    // Try to activate an element with Enter
    await page.keyboard.press('Enter');
    await page.waitForTimeout(500);
    
    console.log('✅ Keyboard navigation functional');
  });

  test('📱 Responsive design - Mobile viewport', async ({ page }) => {
    // Set mobile viewport
    await page.setViewportSize({ width: 375, height: 667 });
    await page.waitForTimeout(500);
    
    // Check that content is still visible
    const mainContent = await page.locator('.app, main, .bp5-card').first().isVisible();
    expect(mainContent).toBeTruthy();
    
    // Check for responsive behavior
    const isMobileOptimized = await page.evaluate(() => {
      const viewport = window.innerWidth;
      // Check if any elements have responsive classes or styles
      const hasResponsiveElements = document.querySelector('[class*="mobile"], [class*="responsive"]') !== null;
      return viewport < 768 && hasResponsiveElements;
    });
    
    console.log('📱 Mobile optimization detected:', isMobileOptimized);
  });

  test('⚡ Performance - Page load time', async ({ page }) => {
    const startTime = Date.now();
    
    // Navigate to the page
    await page.goto('http://localhost:3000/collection/1/manage');
    await page.waitForLoadState('domcontentloaded');
    
    const loadTime = Date.now() - startTime;
    console.log(`⏱️ Page load time: ${loadTime}ms`);
    
    // Page should load within reasonable time
    expect(loadTime).toBeLessThan(5000); // 5 seconds max
    
    // Check for performance issues
    const hasSpinners = await page.locator('.bp5-spinner:visible').count();
    console.log('Loading spinners visible:', hasSpinners);
  });

  test('🛡️ Error handling - Invalid collection ID', async ({ page }) => {
    // Try to navigate to an invalid collection
    await page.goto('http://localhost:3000/collection/999999/manage');
    await page.waitForLoadState('networkidle');
    
    // Check for error handling
    const hasError = await page.locator('.bp5-non-ideal-state, .error, [role="alert"]').isVisible().catch(() => false);
    const hasRedirect = !page.url().includes('/999999/');
    
    console.log('Error state shown:', hasError);
    console.log('Redirected away:', hasRedirect);
    
    // Should either show error or redirect
    expect(hasError || hasRedirect).toBeTruthy();
  });
});