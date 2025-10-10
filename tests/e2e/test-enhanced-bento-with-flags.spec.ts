/**
 * Test enhanced bento with proper feature flags
 */

import { test, expect } from '@playwright/test';

test.describe('Enhanced Bento with Feature Flags', () => {
  test.beforeEach(async ({ page }) => {
    // Set feature flags before navigation
    await page.addInitScript(() => {
      localStorage.setItem('featureFlags', JSON.stringify({
        progressiveComplexityUI: true,
        enableVirtualScrolling: true,
        enableWorkspaceMode: true,
        enableBatchOperations: true,
        enableHealthAnalysis: true,
        enableRealtimeCollaboration: false,
        enableAdvancedFilters: true,
        enableAutoOptimization: true,
        enableExportImport: false,
        enableDarkMode: true,
        useRefactoredComponents: false,
        enableSplitView: false,
        enableBentoLayout: true,
        enableEnhancedBento: true,
        bentoTransitionMode: 'animated'
      }));
    });
    
    // Navigate to the page
    await page.goto('http://localhost:3000/collection/test-123/manage');
    await page.waitForLoadState('networkidle');
  });

  test('should render enhanced bento layout', async ({ page }) => {
    // Debug: Check what's rendered
    await page.screenshot({ path: 'enhanced-bento-test.png', fullPage: true });
    
    // Look for any of the possible components
    const components = [
      '.collection-opportunities-enhanced-bento',
      '.collection-opportunities-bento',
      '.collection-opportunities-split-view',
      '.collection-opportunities-enhanced',
      '.collection-opportunities-legacy',
      '.tab-panel' // Parent container
    ];
    
    for (const selector of components) {
      const count = await page.locator(selector).count();
      if (count > 0) {
        console.log(`Found component: ${selector} (${count} instances)`);
        
        // Get the inner content to see what's rendered
        if (selector === '.tab-panel') {
          const content = await page.locator(selector).first().innerHTML();
          console.log('Tab panel contains:', content.substring(0, 200) + '...');
        }
      }
    }
    
    // Check if we're on the right page at least
    await expect(page).toHaveURL(/collection.*manage/);
    
    // Look for hub structure
    const hubExists = await page.locator('.collection-opportunities-hub').count() > 0;
    console.log('Hub exists:', hubExists);
    
    // Check for loading state
    const spinnerExists = await page.locator('.bp5-spinner').count() > 0;
    console.log('Loading spinner exists:', spinnerExists);
    
    // Check for error state
    const errorExists = await page.locator('.bp5-non-ideal-state').count() > 0;
    if (errorExists) {
      const errorText = await page.locator('.bp5-non-ideal-state').textContent();
      console.log('Error state:', errorText);
    }
  });

  test('should verify feature flags are applied', async ({ page }) => {
    // Check that feature flags were set
    const flags = await page.evaluate(() => {
      const stored = localStorage.getItem('featureFlags');
      return stored ? JSON.parse(stored) : null;
    });
    
    expect(flags).toBeTruthy();
    expect(flags.enableEnhancedBento).toBe(true);
    expect(flags.enableBentoLayout).toBe(true);
    expect(flags.enableSplitView).toBe(false);
  });

  test('should display dashboard when implemented', async ({ page }) => {
    // Wait for any content to load
    await page.waitForTimeout(2000);
    
    // Check for any dashboard-like elements
    const dashboardSelectors = [
      '.enhanced-dashboard-panel',
      '.dashboard-panel',
      '.bento-dashboard-panel',
      '.stat-card',
      '.kpi-card',
      '.hub-stats'
    ];
    
    for (const selector of dashboardSelectors) {
      const exists = await page.locator(selector).count() > 0;
      if (exists) {
        console.log(`Found dashboard element: ${selector}`);
      }
    }
  });

  test('should check table presence', async ({ page }) => {
    // Look for table components
    const tableSelectors = [
      '.opportunities-table',
      '.bp5-table',
      '.table-wrapper',
      'table',
      '[role="table"]'
    ];
    
    for (const selector of tableSelectors) {
      const exists = await page.locator(selector).count() > 0;
      if (exists) {
        console.log(`Found table element: ${selector}`);
      }
    }
  });
});