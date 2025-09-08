import { test, expect } from '@playwright/test';

test.describe('UX Compliance Validation', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('http://localhost:3000');
    await page.waitForLoadState('networkidle');
  });

  test('Navigation components are present', async ({ page }) => {
    // Check for AppNavbar
    const navbar = await page.locator('nav').first();
    await expect(navbar).toBeVisible();
    
    // Check for breadcrumbs on Dashboard
    const breadcrumbs = await page.locator('.bp5-breadcrumbs, .bp6-breadcrumbs');
    await expect(breadcrumbs).toBeVisible();
    
    // Check for NavigationFAB
    const fab = await page.locator('.navigation-fab');
    await expect(fab).toBeVisible();
    await expect(fab).toHaveCSS('position', 'fixed');
    await expect(fab).toHaveCSS('z-index', '9999');
  });

  test('Keyboard shortcuts work globally', async ({ page }) => {
    // Test CMD+2 navigates to SCCs
    await page.keyboard.down('Meta');
    await page.keyboard.press('2');
    await page.keyboard.up('Meta');
    await page.waitForURL('**/sccs');
    expect(page.url()).toContain('/sccs');
    
    // Test CMD+4 navigates to History
    await page.keyboard.down('Meta');
    await page.keyboard.press('4');
    await page.keyboard.up('Meta');
    await page.waitForURL('**/history');
    expect(page.url()).toContain('/history');
  });

  test('Contextual help is present on History page', async ({ page }) => {
    await page.goto('http://localhost:3000/history');
    await page.waitForLoadState('networkidle');
    
    // Check for contextual help component
    const helpCard = await page.locator('text=Helpful Tips').first();
    await expect(helpCard).toBeVisible();
  });

  test('Performance monitoring is active', async ({ page }) => {
    // Check console for performance metrics
    const consoleLogs: string[] = [];
    page.on('console', (msg) => {
      if (msg.text().includes('performance metric') || msg.text().includes('Initial performance metrics')) {
        consoleLogs.push(msg.text());
      }
    });
    
    await page.reload();
    await page.waitForTimeout(4000); // Wait for performance metrics to be logged
    
    // We should have some performance logs
    expect(consoleLogs.length).toBeGreaterThan(0);
  });

  test('Real-time updates WebSocket connection', async ({ page }) => {
    await page.goto('http://localhost:3000/history');
    
    // Check for real-time status indicator
    const statusIndicator = await page.locator('text=Live').or(page.locator('text=Connecting...')).or(page.locator('text=Offline'));
    await expect(statusIndicator).toBeVisible();
  });

  test('Progressive disclosure components exist', async ({ page }) => {
    // Check if the CSS is loaded
    const progressiveDisclosureStyles = await page.evaluate(() => {
      const stylesheets = Array.from(document.styleSheets);
      return stylesheets.some(sheet => {
        try {
          const rules = Array.from(sheet.cssRules || []);
          return rules.some(rule => rule.cssText?.includes('progressive-disclosure'));
        } catch {
          return false;
        }
      });
    });
    
    expect(progressiveDisclosureStyles).toBe(true);
  });

  test('Error boundary is working', async ({ page }) => {
    // The app should be wrapped in an error boundary
    const appHtml = await page.content();
    expect(appHtml).toBeTruthy();
    
    // App should load without errors
    const errorMessages = await page.locator('text=Something went wrong').count();
    expect(errorMessages).toBe(0);
  });

  test('Navigation transitions are smooth', async ({ page }) => {
    // Check if navigation transition CSS is loaded
    const transitionStyles = await page.evaluate(() => {
      const stylesheets = Array.from(document.styleSheets);
      return stylesheets.some(sheet => {
        try {
          const rules = Array.from(sheet.cssRules || []);
          return rules.some(rule => rule.cssText?.includes('navigation-transition'));
        } catch {
          return false;
        }
      });
    });
    
    expect(transitionStyles).toBe(true);
  });

  test('Breadcrumbs update on navigation', async ({ page }) => {
    // Start on dashboard
    const dashboardBreadcrumb = await page.locator('.bp5-breadcrumb-current, .bp6-breadcrumb-current').textContent();
    expect(dashboardBreadcrumb).toContain('Data Sources');
    
    // Navigate to History
    await page.goto('http://localhost:3000/history');
    await page.waitForLoadState('networkidle');
    
    const historyBreadcrumb = await page.locator('.bp5-breadcrumb-current, .bp6-breadcrumb-current').textContent();
    expect(historyBreadcrumb).toContain('Collection History');
  });

  test('Help dialog shows keyboard shortcuts', async ({ page }) => {
    // Click help button if it exists
    const helpButton = await page.locator('[data-testid="help-button"]').or(page.locator('button:has-text("Help")'));
    
    if (await helpButton.isVisible()) {
      await helpButton.click();
      
      // Check for keyboard shortcuts in help content
      const shortcuts = await page.locator('text=Keyboard Shortcuts').or(page.locator('kbd'));
      await expect(shortcuts).toBeVisible();
    }
  });
});