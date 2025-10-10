import { test, expect } from '@playwright/test';

/**
 * Example: How to add custom visual tests for CollectionOpportunitiesHub
 * 
 * This file demonstrates how to extend the visual testing suite
 * with project-specific visual regression tests.
 */

test.describe('Custom Hub Visual Tests - Example', () => {
  test.beforeEach(async ({ page }) => {
    // Navigate to the Hub
    await page.goto('/collection/example-collection/manage');
    
    // Wait for Hub to load
    await page.waitForSelector('.collection-opportunities-hub', { timeout: 30000 });
    await page.waitForLoadState('networkidle');
  });
  
  test('Example: Capture specific workflow state', async ({ page }) => {
    // Example: Open a modal or dropdown
    const filterButton = page.locator('button:has-text("Filter")').first();
    if (await filterButton.isVisible()) {
      await filterButton.click();
      await page.waitForTimeout(300); // Wait for animation
      
      // Capture the filter dropdown
      await expect(page.locator('.filter-dropdown')).toHaveScreenshot('filter-dropdown-open.png');
    }
  });
  
  test('Example: Test custom theme', async ({ page }) => {
    // Apply custom theme via localStorage or API
    await page.evaluate(() => {
      localStorage.setItem('theme', 'custom-brand');
    });
    
    await page.reload();
    await page.waitForSelector('.collection-opportunities-hub');
    
    // Capture with custom theme
    await expect(page).toHaveScreenshot('hub-custom-theme.png', {
      fullPage: true,
      animations: 'disabled',
    });
  });
  
  test('Example: Test with specific data state', async ({ page }) => {
    // Mock specific data scenario
    await page.route('**/api/opportunities**', async route => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          opportunities: [
            {
              id: 'test-1',
              name: 'Critical Opportunity',
              status: 'critical',
              satellite: { name: 'SAT-1', capacity: 10 },
              priority: 'critical',
              capacityPercentage: 95,
            },
          ],
          total: 1,
        }),
      });
    });
    
    await page.reload();
    await page.waitForSelector('.stat-card.critical');
    
    // Capture critical state
    await expect(page.locator('.hub-stats')).toHaveScreenshot('stats-critical-state.png');
  });
  
  test('Example: Test tooltip visibility', async ({ page }) => {
    // Hover over element with tooltip
    const infoIcon = page.locator('.bp5-icon-info-sign').first();
    if (await infoIcon.isVisible()) {
      await infoIcon.hover();
      
      // Wait for tooltip to appear
      await page.waitForSelector('.bp5-tooltip2-content', { timeout: 5000 });
      
      // Capture tooltip
      await expect(page.locator('body')).toHaveScreenshot('tooltip-visible.png', {
        clip: await infoIcon.boundingBox(),
      });
    }
  });
  
  test('Example: Test print layout', async ({ page }) => {
    // Trigger print preview
    await page.emulateMedia({ media: 'print' });
    
    // Capture print view
    await expect(page).toHaveScreenshot('hub-print-layout.png', {
      fullPage: true,
    });
  });
  
  test('Example: Test keyboard navigation focus', async ({ page }) => {
    // Tab through interactive elements
    await page.keyboard.press('Tab');
    await page.keyboard.press('Tab');
    await page.keyboard.press('Tab');
    
    // Capture focus state
    await expect(page).toHaveScreenshot('hub-keyboard-focus.png', {
      animations: 'disabled',
    });
  });
});

/**
 * Advanced Visual Testing Patterns
 */
test.describe('Advanced Visual Patterns', () => {
  test('Pattern: Component isolation', async ({ page }) => {
    await page.goto('/collection/test/manage');
    await page.waitForSelector('.collection-opportunities-hub');
    
    // Isolate and test individual components
    const components = [
      { selector: '.smart-view-selector', name: 'smart-view' },
      { selector: '.hub-actions', name: 'action-bar' },
      { selector: '.stat-card.critical', name: 'critical-stat' },
    ];
    
    for (const component of components) {
      const element = page.locator(component.selector).first();
      if (await element.isVisible()) {
        // Add white background for isolation
        await element.evaluate(el => {
          (el as HTMLElement).style.backgroundColor = 'white';
          (el as HTMLElement).style.padding = '20px';
        });
        
        await expect(element).toHaveScreenshot(`isolated-${component.name}.png`);
      }
    }
  });
  
  test('Pattern: Animation states', async ({ page }) => {
    await page.goto('/collection/test/manage');
    await page.waitForSelector('.collection-opportunities-hub');
    
    // Enable animations temporarily
    await page.evaluate(() => {
      document.querySelectorAll('*').forEach(el => {
        (el as HTMLElement).style.transition = 'all 0.3s ease';
      });
    });
    
    // Trigger state change
    const button = page.locator('.bp5-button').first();
    await button.hover();
    
    // Capture mid-animation (use sparingly)
    await page.waitForTimeout(150); // Mid-transition
    await expect(button).toHaveScreenshot('button-mid-transition.png');
  });
  
  test('Pattern: Responsive breakpoints', async ({ page }) => {
    const breakpoints = [
      { name: 'mobile-small', width: 320, height: 568 },
      { name: 'mobile-large', width: 414, height: 896 },
      { name: 'tablet-portrait', width: 768, height: 1024 },
      { name: 'tablet-landscape', width: 1024, height: 768 },
      { name: 'desktop-hd', width: 1920, height: 1080 },
      { name: 'desktop-4k', width: 3840, height: 2160 },
    ];
    
    for (const breakpoint of breakpoints) {
      await page.setViewportSize({ width: breakpoint.width, height: breakpoint.height });
      await page.goto('/collection/test/manage');
      await page.waitForSelector('.collection-opportunities-hub');
      
      // Capture at specific breakpoint
      await expect(page).toHaveScreenshot(`hub-${breakpoint.name}.png`, {
        fullPage: false, // Viewport only
        animations: 'disabled',
      });
    }
  });
});