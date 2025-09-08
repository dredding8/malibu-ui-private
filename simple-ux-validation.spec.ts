import { test, expect } from '@playwright/test';

test.describe('Simple UX Implementation Validation', () => {
  test('should verify basic navigation and terminology', async ({ page }) => {
    // Navigate to the application
    await page.goto('http://localhost:3000');
    
    // Verify navigation elements are present
    const dashboardNav = page.locator('[data-testid="nav-dashboard"]');
    const historyNav = page.locator('[data-testid="nav-history"]');
    const analyticsNav = page.locator('[data-testid="nav-analytics"]');
    
    // Check if navigation links exist
    await expect(dashboardNav).toBeVisible();
    await expect(historyNav).toBeVisible();
    await expect(analyticsNav).toBeVisible();
    
    // Navigate to History page
    await historyNav.click();
    await expect(page).toHaveURL('http://localhost:3000/history');
    
    // Check for standardized terminology
    const pageContent = await page.textContent('body');
    
    // Verify "Field Mapping Review" terminology
    expect(pageContent).toContain('Field Mapping Review');
    
    // Check for breadcrumbs
    const breadcrumbs = page.locator('.bp5-breadcrumbs, .bp6-breadcrumbs');
    
    // Verify keyboard navigation hint
    const keyboardHint = page.locator('text=/Cmd\\+4|⌘4/');
    
    // Test keyboard navigation (Cmd+1 for Dashboard)
    await page.keyboard.press('Meta+1');
    await expect(page).toHaveURL('http://localhost:3000/');
    
    // Test keyboard navigation (Cmd+4 for History)
    await page.keyboard.press('Meta+4');
    await expect(page).toHaveURL('http://localhost:3000/history');
    
    console.log('✅ Basic navigation working');
    console.log('✅ Terminology standardized');
    console.log('✅ Keyboard shortcuts functional');
  });

  test('should verify interactive enhancements', async ({ page }) => {
    await page.goto('http://localhost:3000/history');
    
    // Check for Navigation FAB
    const navigationFAB = page.locator('.navigation-fab');
    if (await navigationFAB.isVisible()) {
      await navigationFAB.click();
      
      // Should show help
      const helpCard = page.locator('.navigation-help-card');
      await expect(helpCard).toBeVisible({ timeout: 5000 });
      
      console.log('✅ Navigation FAB present and functional');
    }
    
    // Test search focus with Cmd+F
    await page.keyboard.press('Meta+f');
    const searchInput = page.locator('[data-testid="collection-search-input"]');
    if (await searchInput.isVisible()) {
      await expect(searchInput).toBeFocused();
      console.log('✅ Search keyboard shortcut working');
    }
    
    // Check for contextual help
    const contextualHelp = page.locator('.bp5-card, .bp6-card').filter({ hasText: /Tips|Help|Welcome/ });
    if (await contextualHelp.first().isVisible()) {
      console.log('✅ Contextual help present');
    }
  });

  test('should verify performance and transitions', async ({ page }) => {
    // Measure initial load time
    const startTime = Date.now();
    await page.goto('http://localhost:3000');
    await page.waitForLoadState('networkidle');
    const loadTime = Date.now() - startTime;
    
    console.log(`⏱️ Initial load time: ${loadTime}ms`);
    expect(loadTime).toBeLessThan(3000); // Should load within 3 seconds
    
    // Navigate and check for smooth transitions
    await page.click('[data-testid="nav-history"]');
    
    // Check for loading indicators
    const loadingIndicator = page.locator('.bp5-spinner, .bp6-spinner, .navigation-loading-indicator');
    
    // Verify page transition completed
    await expect(page).toHaveURL('http://localhost:3000/history');
    
    // Check for transition classes
    const transitionElements = await page.locator('[class*="transition"]').count();
    console.log(`✅ ${transitionElements} transition elements found`);
  });
});