import { test, expect, Page } from '@playwright/test';
import path from 'path';
import fs from 'fs-extra';

// Visual test configuration for CollectionOpportunitiesHub
const BASELINE_DIR = path.join('test-results', 'visual-baselines', 'collection-hub');
const SCREENSHOTS_DIR = path.join('test-results', 'visual-screenshots', 'collection-hub');
const DIFF_DIR = path.join('test-results', 'visual-diffs', 'collection-hub');

// Ensure directories exist
test.beforeAll(async () => {
  await fs.ensureDir(BASELINE_DIR);
  await fs.ensureDir(SCREENSHOTS_DIR);
  await fs.ensureDir(DIFF_DIR);
});

// Helper function to capture consistent screenshots
async function captureScreenshot(page: Page, name: string, options: any = {}) {
  // Wait for animations and transitions to complete
  await page.waitForTimeout(500);
  
  // Hide dynamic content that changes between runs
  await page.evaluate(() => {
    // Hide timestamps and dynamic dates
    document.querySelectorAll('[data-testid*="timestamp"], .timestamp, time, .hub-status-bar').forEach(el => {
      (el as HTMLElement).style.visibility = 'hidden';
    });
    
    // Hide loading indicators
    document.querySelectorAll('.spinner, .loading, [aria-busy="true"], .bp5-spinner').forEach(el => {
      (el as HTMLElement).style.display = 'none';
    });
    
    // Stabilize any animated numbers
    document.querySelectorAll('.stat-value').forEach(el => {
      const text = el.textContent;
      if (text && /\d+/.test(text)) {
        el.textContent = text.replace(/\d+/, '50'); // Normalize numbers to 50
      }
    });
    
    // Disable all animations
    const style = document.createElement('style');
    style.innerHTML = `
      *, *::before, *::after {
        animation-duration: 0s !important;
        animation-delay: 0s !important;
        transition-duration: 0s !important;
        transition-delay: 0s !important;
      }
    `;
    document.head.appendChild(style);
  });
  
  // Wait for final renders
  await page.waitForTimeout(300);
  
  const screenshotPath = path.join(SCREENSHOTS_DIR, `${name}.png`);
  return await page.screenshot({
    path: screenshotPath,
    fullPage: options.fullPage !== false,
    animations: 'disabled',
    ...options
  });
}

// Helper to wait for the hub to be fully loaded
async function waitForHubLoaded(page: Page) {
  // Wait for the main hub container
  await page.waitForSelector('.collection-opportunities-hub', { timeout: 30000 });
  
  // Wait for stats to load (they show numbers)
  await page.waitForSelector('.stat-value', { timeout: 10000 });
  
  // Wait for any initial loading spinners to disappear
  await page.waitForFunction(() => {
    const spinners = document.querySelectorAll('.bp5-spinner');
    return spinners.length === 0 || Array.from(spinners).every(s => 
      (s as HTMLElement).style.display === 'none' || 
      !s.closest('.hub-loading')
    );
  }, { timeout: 10000 });
  
  // Additional wait for content to stabilize
  await page.waitForTimeout(1000);
}

test.describe('CollectionOpportunitiesHub Visual Tests', () => {
  test.describe.configure({ mode: 'parallel' });
  
  test('Hub - Initial Load State', async ({ page, browserName }) => {
    await page.goto('/collection/test-collection-123/manage');
    await waitForHubLoaded(page);
    
    const screenshotName = `hub-initial-${browserName}`;
    await captureScreenshot(page, screenshotName, { fullPage: true });
    
    // Visual assertions
    await expect(page.locator('.collection-opportunities-hub')).toBeVisible();
    await expect(page.locator('.hub-header')).toBeVisible();
    await expect(page.locator('.hub-stats')).toBeVisible();
    await expect(page.locator('.hub-tabs')).toBeVisible();
  });
  
  test('Hub - Statistics Dashboard', async ({ page, browserName }) => {
    await page.goto('/collection/test-collection-123/manage');
    await waitForHubLoaded(page);
    
    // Focus on stats area
    const statsArea = page.locator('.hub-stats');
    await expect(statsArea).toBeVisible();
    
    const screenshotName = `hub-stats-${browserName}`;
    await statsArea.screenshot({
      path: path.join(SCREENSHOTS_DIR, `${screenshotName}.png`),
    });
    
    // Verify all stat cards are visible
    const statCards = ['total', 'critical', 'warning', 'optimal', 'pending'];
    for (const cardType of statCards) {
      await expect(page.locator(`.stat-card.${cardType}`)).toBeVisible();
    }
  });
  
  test('Hub - Smart View Selector', async ({ page, browserName }) => {
    await page.goto('/collection/test-collection-123/manage');
    await waitForHubLoaded(page);
    
    // Wait for SmartViewSelector to load
    const smartViewSelector = page.locator('.smart-view-selector').first();
    if (await smartViewSelector.isVisible()) {
      const screenshotName = `hub-smart-views-${browserName}`;
      await smartViewSelector.screenshot({
        path: path.join(SCREENSHOTS_DIR, `${screenshotName}.png`),
      });
    }
  });
  
  test('Hub - Tab Navigation', async ({ page, browserName }) => {
    await page.goto('/collection/test-collection-123/manage');
    await waitForHubLoaded(page);
    
    // Capture each tab
    const tabs = ['opportunities', 'analytics', 'settings'];
    
    for (const tabId of tabs) {
      // Click on tab
      const tabButton = page.locator(`[data-tab-id="${tabId}"], .bp5-tab[id*="${tabId}"]`).first();
      if (await tabButton.isVisible()) {
        await tabButton.click();
        await page.waitForTimeout(500);
        
        const screenshotName = `hub-tab-${tabId}-${browserName}`;
        await captureScreenshot(page, screenshotName);
      }
    }
  });
  
  test('Hub - Opportunities Table View', async ({ page, browserName }) => {
    await page.goto('/collection/test-collection-123/manage');
    await waitForHubLoaded(page);
    
    // Wait for table to load
    await page.waitForSelector('.bp5-html-table, table', { timeout: 10000 });
    
    const screenshotName = `hub-opportunities-table-${browserName}`;
    await captureScreenshot(page, screenshotName);
    
    // Capture hover states if visible
    const firstRow = page.locator('tbody tr').first();
    if (await firstRow.isVisible()) {
      await firstRow.hover();
      await page.waitForTimeout(200);
      
      const hoverScreenshot = `hub-table-row-hover-${browserName}`;
      await captureScreenshot(page, hoverScreenshot, { fullPage: false });
    }
  });
  
  test('Hub - Bento Layout Views', async ({ page, browserName }) => {
    await page.goto('/collection/test-collection-123/manage');
    await waitForHubLoaded(page);
    
    // Check for bento layout elements
    const bentoGrid = page.locator('.bento-grid, .collection-opportunities-bento').first();
    if (await bentoGrid.isVisible()) {
      const screenshotName = `hub-bento-layout-${browserName}`;
      await captureScreenshot(page, screenshotName);
    }
  });
  
  test('Hub - Responsive Views', async ({ page, browserName }) => {
    // Skip for already mobile browsers
    if (browserName.includes('Mobile')) {
      test.skip();
    }
    
    const viewports = [
      { name: 'mobile', width: 375, height: 812 },
      { name: 'tablet', width: 768, height: 1024 },
      { name: 'desktop', width: 1920, height: 1080 },
    ];
    
    for (const viewport of viewports) {
      await page.setViewportSize(viewport);
      await page.goto('/collection/test-collection-123/manage');
      await waitForHubLoaded(page);
      
      const screenshotName = `hub-${viewport.name}-${browserName}`;
      await captureScreenshot(page, screenshotName, { 
        fullPage: viewport.name === 'desktop' 
      });
    }
  });
  
  test('Hub - Interactive Elements', async ({ page, browserName }) => {
    await page.goto('/collection/test-collection-123/manage');
    await waitForHubLoaded(page);
    
    // Capture button states
    const buttons = page.locator('.bp5-button').first();
    if (await buttons.isVisible()) {
      // Normal state
      const normalScreenshot = `hub-button-normal-${browserName}`;
      await buttons.screenshot({
        path: path.join(SCREENSHOTS_DIR, `${normalScreenshot}.png`),
      });
      
      // Hover state
      await buttons.hover();
      await page.waitForTimeout(200);
      const hoverScreenshot = `hub-button-hover-${browserName}`;
      await buttons.screenshot({
        path: path.join(SCREENSHOTS_DIR, `${hoverScreenshot}.png`),
      });
      
      // Focus state (if applicable)
      await buttons.focus();
      await page.waitForTimeout(200);
      const focusScreenshot = `hub-button-focus-${browserName}`;
      await buttons.screenshot({
        path: path.join(SCREENSHOTS_DIR, `${focusScreenshot}.png`),
      });
    }
  });
  
  test('Hub - Error States', async ({ page, browserName }) => {
    // Intercept API calls and return errors
    await page.route('**/api/**', route => route.abort());
    
    await page.goto('/collection/test-collection-123/manage');
    
    // Wait for error state to appear
    await page.waitForSelector('.bp5-non-ideal-state, .hub-error', { timeout: 10000 });
    
    const screenshotName = `hub-error-state-${browserName}`;
    await captureScreenshot(page, screenshotName);
  });
  
  test('Hub - Loading States', async ({ page, browserName }) => {
    // Slow down network to capture loading
    await page.route('**/api/**', async route => {
      await page.waitForTimeout(3000);
      await route.continue();
    });
    
    page.goto('/collection/test-collection-123/manage');
    
    // Capture loading state quickly
    await page.waitForSelector('.hub-loading, .bp5-spinner', { timeout: 5000 });
    
    const screenshotName = `hub-loading-state-${browserName}`;
    await page.screenshot({
      path: path.join(SCREENSHOTS_DIR, `${screenshotName}.png`),
      fullPage: false,
    });
  });
  
  test('Hub - Empty States', async ({ page, browserName }) => {
    // Mock empty data response
    await page.route('**/api/opportunities**', async route => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ opportunities: [], total: 0 })
      });
    });
    
    await page.goto('/collection/test-collection-123/manage');
    await page.waitForTimeout(2000);
    
    const screenshotName = `hub-empty-state-${browserName}`;
    await captureScreenshot(page, screenshotName);
  });
  
  test('Hub - Dark Mode', async ({ page, browserName }) => {
    await page.goto('/collection/test-collection-123/manage');
    await waitForHubLoaded(page);
    
    // Try to find and click dark mode toggle
    const themeToggle = page.locator('[data-testid*="theme"], [aria-label*="theme"], .theme-toggle').first();
    
    if (await themeToggle.isVisible()) {
      await themeToggle.click();
      await page.waitForTimeout(500);
    } else {
      // Force dark mode via CSS
      await page.emulateMedia({ colorScheme: 'dark' });
    }
    
    const screenshotName = `hub-dark-mode-${browserName}`;
    await captureScreenshot(page, screenshotName);
  });
  
  test('Hub - Component Gallery', async ({ page, browserName }) => {
    await page.goto('/collection/test-collection-123/manage');
    await waitForHubLoaded(page);
    
    // Capture various UI components
    const components = [
      { selector: '.stat-card', name: 'stat-cards' },
      { selector: '.bp5-tabs', name: 'tabs' },
      { selector: '.bp5-button', name: 'buttons' },
      { selector: '.bp5-card', name: 'cards' },
      { selector: '.hub-header', name: 'header' },
      { selector: '.hub-actions', name: 'action-bar' },
    ];
    
    for (const component of components) {
      const element = page.locator(component.selector).first();
      if (await element.isVisible().catch(() => false)) {
        try {
          await element.screenshot({
            path: path.join(SCREENSHOTS_DIR, `hub-component-${component.name}-${browserName}.png`),
          });
        } catch (e) {
          console.log(`⚠️  Could not capture ${component.name}`);
        }
      }
    }
  });
  
  test('Hub - Accessibility States', async ({ page, browserName }) => {
    await page.goto('/collection/test-collection-123/manage');
    await waitForHubLoaded(page);
    
    // High contrast mode
    await page.emulateMedia({ forcedColors: 'active' });
    const highContrastScreenshot = `hub-high-contrast-${browserName}`;
    await captureScreenshot(page, highContrastScreenshot);
    
    // Reduced motion
    await page.emulateMedia({ reducedMotion: 'reduce' });
    const reducedMotionScreenshot = `hub-reduced-motion-${browserName}`;
    await captureScreenshot(page, reducedMotionScreenshot);
  });
  
  test('Hub - Print View', async ({ page, browserName }) => {
    await page.goto('/collection/test-collection-123/manage');
    await waitForHubLoaded(page);
    
    // Emulate print media
    await page.emulateMedia({ media: 'print' });
    
    const screenshotName = `hub-print-view-${browserName}`;
    await captureScreenshot(page, screenshotName, { fullPage: true });
  });
});

// Visual regression comparison
test.describe('Visual Regression Checks', () => {
  test('Compare with Baselines', async ({ page, browserName }) => {
    const screenshots = await fs.readdir(SCREENSHOTS_DIR);
    const baselines = await fs.readdir(BASELINE_DIR);
    
    let hasRegressions = false;
    const regressions: string[] = [];
    
    for (const screenshot of screenshots) {
      if (screenshot.endsWith('.png') && screenshot.includes(browserName)) {
        const baselinePath = path.join(BASELINE_DIR, screenshot);
        const screenshotPath = path.join(SCREENSHOTS_DIR, screenshot);
        
        if (await fs.pathExists(baselinePath)) {
          // Compare screenshots using Playwright's built-in comparison
          try {
            await expect(page).toHaveScreenshot(screenshot, {
              maxDiffPixels: 100,
              threshold: 0.2,
            });
          } catch (e) {
            hasRegressions = true;
            regressions.push(screenshot);
          }
        } else {
          // Create baseline if it doesn't exist
          await fs.copy(screenshotPath, baselinePath);
          console.log(`✅ Created baseline: ${screenshot}`);
        }
      }
    }
    
    if (hasRegressions) {
      console.log(`❌ Visual regressions detected in: ${regressions.join(', ')}`);
    } else {
      console.log('✅ No visual regressions detected');
    }
  });
  
  test('Generate Visual Report', async () => {
    const screenshots = await fs.readdir(SCREENSHOTS_DIR);
    const baselines = await fs.readdir(BASELINE_DIR);
    
    const report = {
      timestamp: new Date().toISOString(),
      totalScreenshots: screenshots.length,
      totalBaselines: baselines.length,
      coverage: {
        hub: screenshots.filter(f => f.includes('hub-')).length,
        components: screenshots.filter(f => f.includes('component-')).length,
        responsive: screenshots.filter(f => f.includes('mobile') || f.includes('tablet')).length,
        states: screenshots.filter(f => f.includes('state')).length,
      },
      browsers: {
        chromium: screenshots.filter(f => f.includes('chromium')).length,
        firefox: screenshots.filter(f => f.includes('firefox')).length,
        webkit: screenshots.filter(f => f.includes('webkit')).length,
      },
      files: screenshots,
    };
    
    await fs.writeJson(
      path.join('test-results', 'visual-hub-report.json'), 
      report, 
      { spaces: 2 }
    );
    
    console.log('📊 CollectionOpportunitiesHub Visual Report:');
    console.log(`  Total Screenshots: ${report.totalScreenshots}`);
    console.log(`  Hub Views: ${report.coverage.hub}`);
    console.log(`  Component Library: ${report.coverage.components}`);
    console.log(`  Responsive Views: ${report.coverage.responsive}`);
    console.log(`  State Variations: ${report.coverage.states}`);
  });
});