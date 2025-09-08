import { test, expect } from '@playwright/test';

test.describe('Verify UX Components Are Working', () => {
  test('Dashboard has all UX components visible', async ({ page }) => {
    await page.goto('http://localhost:3000');
    await page.waitForLoadState('networkidle');
    
    // Take screenshot for verification
    await page.screenshot({ path: 'verify-dashboard-ux.png', fullPage: true });
    
    // 1. Check NavigationFAB is visible
    const fab = await page.locator('.navigation-fab');
    await expect(fab).toBeVisible();
    const fabPosition = await fab.evaluate(el => {
      const style = window.getComputedStyle(el);
      return {
        position: style.position,
        zIndex: style.zIndex,
        bottom: style.bottom,
        right: style.right
      };
    });
    expect(fabPosition.position).toBe('fixed');
    expect(fabPosition.zIndex).toBe('9999');
    
    // 2. Check Breadcrumbs are visible
    const breadcrumbs = await page.locator('.bp5-breadcrumbs, .bp6-breadcrumbs');
    await expect(breadcrumbs).toBeVisible();
    const breadcrumbText = await breadcrumbs.textContent();
    expect(breadcrumbText).toContain('Data Sources');
    
    // 3. Check Navbar is complete
    const navbar = await page.locator('.bp6-navbar, .bp5-navbar').first();
    await expect(navbar).toBeVisible();
    
    // Check all navigation buttons
    await expect(page.locator('[data-testid="nav-dashboard"]')).toBeVisible();
    await expect(page.locator('[data-testid="nav-sccs"]')).toBeVisible();
    await expect(page.locator('[data-testid="nav-collections"]')).toBeVisible();
    await expect(page.locator('[data-testid="nav-history"]')).toBeVisible();
    await expect(page.locator('[data-testid="nav-analytics"]')).toBeVisible();
    
    console.log('✅ Dashboard: All UX components visible');
  });

  test('History page has contextual help and real-time indicators', async ({ page }) => {
    await page.goto('http://localhost:3000/history');
    await page.waitForLoadState('networkidle');
    
    // Take screenshot
    await page.screenshot({ path: 'verify-history-ux.png', fullPage: true });
    
    // 1. Check NavigationFAB
    await expect(page.locator('.navigation-fab')).toBeVisible();
    
    // 2. Check Breadcrumbs
    const breadcrumbs = await page.locator('.bp5-breadcrumbs, .bp6-breadcrumbs');
    await expect(breadcrumbs).toBeVisible();
    const breadcrumbText = await breadcrumbs.textContent();
    expect(breadcrumbText).toContain('Collection History');
    
    // 3. Check Contextual Help
    const helpCard = await page.locator('text=Helpful Tips');
    await expect(helpCard).toBeVisible();
    
    // 4. Check Real-time Status Indicator
    const statusIndicator = await page.locator('text=Live').or(page.locator('text=Connecting').or(page.locator('text=Offline')));
    await expect(statusIndicator).toBeVisible();
    
    console.log('✅ History: Contextual help and real-time indicators visible');
  });

  test('Keyboard shortcuts are functional', async ({ page }) => {
    await page.goto('http://localhost:3000');
    await page.waitForLoadState('networkidle');
    
    // Test CMD+2 to navigate to SCCs
    await page.keyboard.down('Meta');
    await page.keyboard.press('2');
    await page.keyboard.up('Meta');
    
    // Wait for navigation
    await page.waitForURL('**/sccs', { timeout: 5000 });
    expect(page.url()).toContain('/sccs');
    
    // Take screenshot of SCCs page
    await page.screenshot({ path: 'verify-sccs-navigation.png', fullPage: true });
    
    // Verify SCCs page has UX components
    await expect(page.locator('.navigation-fab')).toBeVisible();
    await expect(page.locator('.bp5-breadcrumbs, .bp6-breadcrumbs')).toBeVisible();
    
    console.log('✅ Keyboard shortcuts working');
  });

  test('NavigationFAB help dialog works', async ({ page }) => {
    await page.goto('http://localhost:3000');
    await page.waitForLoadState('networkidle');
    
    // Click the FAB
    const fab = await page.locator('.navigation-fab');
    await fab.click();
    
    // Check if help card appears
    const helpCard = await page.locator('.navigation-help-card');
    await expect(helpCard).toBeVisible();
    
    // Take screenshot of help dialog
    await page.screenshot({ path: 'verify-fab-help-dialog.png', fullPage: true });
    
    // Check for keyboard shortcuts in help
    const shortcuts = await helpCard.locator('text=Keyboard Shortcuts');
    await expect(shortcuts).toBeVisible();
    
    console.log('✅ NavigationFAB help dialog functional');
  });

  test('Performance monitoring is active', async ({ page }) => {
    const consoleLogs: string[] = [];
    page.on('console', (msg) => {
      consoleLogs.push(msg.text());
    });
    
    await page.goto('http://localhost:3000');
    await page.waitForTimeout(4000); // Wait for performance metrics
    
    // Check for performance metric logs
    const hasPerformanceLogs = consoleLogs.some(log => 
      log.includes('performance') || 
      log.includes('Performance') ||
      log.includes('metrics')
    );
    
    expect(hasPerformanceLogs).toBe(true);
    console.log('✅ Performance monitoring active');
  });

  test('CSS and styling properly loaded', async ({ page }) => {
    await page.goto('http://localhost:3000');
    await page.waitForLoadState('networkidle');
    
    // Check if Blueprint CSS is loaded
    const blueprintStyles = await page.evaluate(() => {
      const stylesheets = Array.from(document.styleSheets);
      return stylesheets.some(sheet => {
        try {
          return sheet.href?.includes('blueprint') || false;
        } catch {
          return false;
        }
      });
    });
    
    expect(blueprintStyles).toBe(true);
    
    // Check if custom CSS files are loaded
    const customStyles = await page.evaluate(() => {
      const stylesheets = Array.from(document.styleSheets);
      const customCSS = ['NavigationAids.css', 'App.css', 'ProgressiveDisclosure.css'];
      return customCSS.every(cssFile => 
        stylesheets.some(sheet => {
          try {
            const rules = Array.from(sheet.cssRules || []);
            return rules.some(rule => rule.cssText?.includes('navigation-fab') || rule.cssText?.includes('progressive-disclosure'));
          } catch {
            return false;
          }
        })
      );
    });
    
    expect(customStyles).toBe(true);
    console.log('✅ All CSS properly loaded');
  });
});