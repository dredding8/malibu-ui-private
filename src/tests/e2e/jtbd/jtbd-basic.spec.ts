import { test, expect } from '@playwright/test';

test.describe('JTBD Basic Validation', () => {
  test.beforeEach(async ({ page }) => {
    // Navigate to the opportunities page
    await page.goto('/opportunities');
    await page.waitForLoadState('networkidle');
  });

  test('JTBD #1: Basic Verification Flow', async ({ page }) => {
    // Check if we're on the opportunities page
    const pageTitle = await page.title();
    console.log('Page title:', pageTitle);
    
    // Look for any table or data display
    const hasTable = await page.locator('table').count() > 0;
    const hasDataGrid = await page.locator('[role="grid"], [role="table"], .data-table, .bp5-table').count() > 0;
    
    expect(hasTable || hasDataGrid).toBe(true);
    
    // Try to find any opportunity row
    const rows = await page.locator('tr, [role="row"], .table-row').count();
    console.log('Found rows:', rows);
    
    if (rows > 1) { // More than just header row
      // Click on first data row
      const firstRow = page.locator('tr, [role="row"], .table-row').nth(1);
      await firstRow.click();
      
      // Wait for any detail view or modal
      await page.waitForTimeout(1000);
      
      // Check if something changed (modal, drawer, or detail view)
      const hasModal = await page.locator('.bp5-dialog, .modal, [role="dialog"]').isVisible().catch(() => false);
      const hasDrawer = await page.locator('.bp5-drawer, .drawer, .panel').isVisible().catch(() => false);
      const hasDetail = await page.locator('.detail, .details, [class*="detail"]').isVisible().catch(() => false);
      
      console.log('UI Response - Modal:', hasModal, 'Drawer:', hasDrawer, 'Detail:', hasDetail);
    }
  });

  test('JTBD #2: Basic Navigation Test', async ({ page }) => {
    // Check current URL
    const initialUrl = page.url();
    console.log('Initial URL:', initialUrl);
    
    // Look for navigation elements
    const navLinks = await page.locator('nav a, .nav a, [role="navigation"] a').count();
    console.log('Navigation links found:', navLinks);
    
    // Try to find any buttons or actions
    const buttons = await page.locator('button:visible').count();
    console.log('Visible buttons:', buttons);
    
    // Take a screenshot for visual inspection
    await page.screenshot({ 
      path: 'test-results/jtbd-artifacts/navigation-test.png',
      fullPage: true 
    });
    
    // Basic performance check
    const metrics = await page.evaluate(() => ({
      loadTime: performance.timing.loadEventEnd - performance.timing.navigationStart,
      domReady: performance.timing.domContentLoadedEventEnd - performance.timing.navigationStart,
    }));
    
    console.log('Performance metrics:', metrics);
    expect(metrics.loadTime).toBeLessThan(5000); // 5 seconds max
  });

  test('JTBD #3: Data Display Verification', async ({ page }) => {
    // Wait for any loading indicators to disappear
    await page.waitForSelector('.bp5-spinner, .spinner, [class*="loading"]', { 
      state: 'hidden',
      timeout: 5000 
    }).catch(() => console.log('No loading spinner found'));
    
    // Check for data display elements
    const dataElements = await page.evaluate(() => {
      const tables = document.querySelectorAll('table');
      const lists = document.querySelectorAll('ul, ol, .list');
      const cards = document.querySelectorAll('.card, .bp5-card, [class*="card"]');
      const grids = document.querySelectorAll('.grid, [class*="grid"]');
      
      return {
        tables: tables.length,
        lists: lists.length,
        cards: cards.length,
        grids: grids.length,
        totalDataElements: tables.length + lists.length + cards.length + grids.length
      };
    });
    
    console.log('Data display elements:', dataElements);
    expect(dataElements.totalDataElements).toBeGreaterThan(0);
  });

  test('JTBD Performance Baseline', async ({ page, browserName }) => {
    // Measure Core Web Vitals
    const vitals = await page.evaluate(() => {
      return new Promise((resolve) => {
        const metrics: any = {
          timestamp: new Date().toISOString(),
          userAgent: navigator.userAgent
        };
        
        // Navigation timing
        if (performance.timing) {
          const timing = performance.timing;
          metrics.navigationTiming = {
            dns: timing.domainLookupEnd - timing.domainLookupStart,
            tcp: timing.connectEnd - timing.connectStart,
            request: timing.responseStart - timing.requestStart,
            response: timing.responseEnd - timing.responseStart,
            domProcessing: timing.domComplete - timing.domLoading,
            loadComplete: timing.loadEventEnd - timing.navigationStart
          };
        }
        
        // Resource timing
        const resources = performance.getEntriesByType('resource') as PerformanceResourceTiming[];
        metrics.resources = {
          total: resources.length,
          scripts: resources.filter(r => r.initiatorType === 'script').length,
          styles: resources.filter(r => r.initiatorType === 'css').length,
          images: resources.filter(r => r.initiatorType === 'img').length,
          totalSize: resources.reduce((sum, r) => sum + (r.transferSize || 0), 0)
        };
        
        resolve(metrics);
      });
    });
    
    console.log(`Performance baseline for ${browserName}:`, vitals);
    
    // Save baseline
    await page.screenshot({ 
      path: `test-results/jtbd-artifacts/baseline-${browserName}.png`,
      fullPage: false 
    });
  });
});