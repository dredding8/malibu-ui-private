import { test, expect, Page } from '@playwright/test';
import path from 'path';
import fs from 'fs-extra';

// Visual baseline test configuration
const BASELINE_DIR = path.join('test-results', 'visual-baselines');
const SCREENSHOTS_DIR = path.join('test-results', 'visual-screenshots');
const DIFF_DIR = path.join('test-results', 'visual-diffs');

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
    // Hide timestamps
    document.querySelectorAll('[data-testid*="timestamp"], .timestamp, time').forEach(el => {
      (el as HTMLElement).style.visibility = 'hidden';
    });
    
    // Hide loading indicators
    document.querySelectorAll('.spinner, .loading, [aria-busy="true"]').forEach(el => {
      (el as HTMLElement).style.display = 'none';
    });
    
    // Disable animations
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
  
  // Wait a bit more for any final renders
  await page.waitForTimeout(300);
  
  return await page.screenshot({
    path: path.join(SCREENSHOTS_DIR, `${name}.png`),
    fullPage: options.fullPage !== false,
    animations: 'disabled',
    ...options
  });
}

test.describe('Visual Baseline Tests', () => {
  test.describe.configure({ mode: 'parallel' });
  
  test('Dashboard - Full Page', async ({ page, browserName }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');
    
    const screenshotName = `dashboard-full-${browserName}`;
    await captureScreenshot(page, screenshotName, { fullPage: true });
    
    // Compare with baseline if it exists
    const baselinePath = path.join(BASELINE_DIR, `${screenshotName}.png`);
    if (await fs.pathExists(baselinePath)) {
      await expect(page).toHaveScreenshot(`${screenshotName}.png`, {
        maxDiffPixels: 100,
        threshold: 0.2,
      });
    } else {
      // Create baseline
      await fs.copy(
        path.join(SCREENSHOTS_DIR, `${screenshotName}.png`),
        baselinePath
      );
      console.log(`✅ Created baseline: ${screenshotName}`);
    }
  });
  
  test('Opportunities Page - Main View', async ({ page, browserName }) => {
    await page.goto('/opportunities');
    await page.waitForLoadState('networkidle');
    
    const screenshotName = `opportunities-main-${browserName}`;
    await captureScreenshot(page, screenshotName);
    
    // Visual assertions for key elements
    const mainContent = page.locator('main, [role="main"], #root > div');
    await expect(mainContent).toBeVisible();
    
    // Compare with baseline
    const baselinePath = path.join(BASELINE_DIR, `${screenshotName}.png`);
    if (await fs.pathExists(baselinePath)) {
      await expect(page).toHaveScreenshot(`${screenshotName}.png`, {
        maxDiffPixels: 100,
        threshold: 0.2,
      });
    } else {
      await fs.copy(
        path.join(SCREENSHOTS_DIR, `${screenshotName}.png`),
        baselinePath
      );
      console.log(`✅ Created baseline: ${screenshotName}`);
    }
  });
  
  test('Opportunities Page - Cards View', async ({ page, browserName }) => {
    await page.goto('/opportunities');
    await page.waitForLoadState('networkidle');
    
    // Focus on card area if exists
    const cards = page.locator('.bp5-card, .card').first();
    if (await cards.isVisible()) {
      const screenshotName = `opportunities-cards-${browserName}`;
      
      // Capture just the cards area
      await cards.screenshot({
        path: path.join(SCREENSHOTS_DIR, `${screenshotName}.png`),
      });
      
      console.log(`📸 Captured cards view: ${screenshotName}`);
    }
  });
  
  test('Navigation Elements', async ({ page, browserName }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');
    
    // Capture navigation/header
    const nav = page.locator('nav, header, .navbar, .bp5-navbar').first();
    if (await nav.isVisible()) {
      const screenshotName = `navigation-${browserName}`;
      
      await nav.screenshot({
        path: path.join(SCREENSHOTS_DIR, `${screenshotName}.png`),
      });
      
      console.log(`📸 Captured navigation: ${screenshotName}`);
    }
  });
  
  test('Responsive Views', async ({ page, browserName }) => {
    // Skip mobile browsers as they're already mobile
    if (browserName === 'Mobile Chrome' || browserName === 'Mobile Safari') {
      test.skip();
    }
    
    const viewports = [
      { name: 'mobile', width: 375, height: 812 },
      { name: 'tablet', width: 768, height: 1024 },
      { name: 'desktop', width: 1920, height: 1080 },
    ];
    
    for (const viewport of viewports) {
      await page.setViewportSize(viewport);
      await page.goto('/opportunities');
      await page.waitForLoadState('networkidle');
      
      const screenshotName = `opportunities-${viewport.name}-${browserName}`;
      await captureScreenshot(page, screenshotName, { fullPage: false });
      
      console.log(`📸 Captured ${viewport.name} view: ${screenshotName}`);
    }
  });
  
  test('Interactive States', async ({ page, browserName }) => {
    await page.goto('/opportunities');
    await page.waitForLoadState('networkidle');
    
    // Capture hover states
    const buttons = page.locator('button').first();
    if (await buttons.isVisible()) {
      await buttons.hover();
      await page.waitForTimeout(200);
      
      const screenshotName = `button-hover-${browserName}`;
      await captureScreenshot(page, screenshotName, { fullPage: false });
      
      console.log(`📸 Captured hover state: ${screenshotName}`);
    }
    
    // Capture focus states
    const inputs = page.locator('input[type="text"], input[type="search"]').first();
    if (await inputs.isVisible()) {
      await inputs.focus();
      await page.waitForTimeout(200);
      
      const screenshotName = `input-focus-${browserName}`;
      await captureScreenshot(page, screenshotName, { fullPage: false });
      
      console.log(`📸 Captured focus state: ${screenshotName}`);
    }
  });
  
  test('Dark Mode / Theme Variations', async ({ page, browserName }) => {
    // Check if theme toggle exists
    await page.goto('/');
    await page.waitForLoadState('networkidle');
    
    const themeToggle = page.locator('[data-testid*="theme"], [aria-label*="theme"], button:has-text("Dark"), button:has-text("Light")').first();
    
    if (await themeToggle.isVisible()) {
      // Capture light mode (default)
      const lightScreenshot = `theme-light-${browserName}`;
      await captureScreenshot(page, lightScreenshot);
      
      // Toggle to dark mode
      await themeToggle.click();
      await page.waitForTimeout(500);
      
      // Capture dark mode
      const darkScreenshot = `theme-dark-${browserName}`;
      await captureScreenshot(page, darkScreenshot);
      
      console.log(`📸 Captured theme variations`);
    } else {
      // Force dark mode via CSS if no toggle
      await page.emulateMedia({ colorScheme: 'dark' });
      const darkScreenshot = `theme-dark-emulated-${browserName}`;
      await captureScreenshot(page, darkScreenshot);
    }
  });
  
  test('Error States', async ({ page, browserName }) => {
    // Simulate network error
    await page.route('**/api/**', route => route.abort());
    
    await page.goto('/opportunities');
    await page.waitForTimeout(2000); // Wait for error state
    
    const screenshotName = `error-state-${browserName}`;
    await captureScreenshot(page, screenshotName);
    
    console.log(`📸 Captured error state: ${screenshotName}`);
  });
  
  test('Loading States', async ({ page, browserName }) => {
    // Slow down network to capture loading state
    await page.route('**/api/**', async route => {
      await page.waitForTimeout(2000);
      await route.continue();
    });
    
    await page.goto('/opportunities');
    
    // Capture while loading
    const screenshotName = `loading-state-${browserName}`;
    await page.screenshot({
      path: path.join(SCREENSHOTS_DIR, `${screenshotName}.png`),
      fullPage: false,
    });
    
    console.log(`📸 Captured loading state: ${screenshotName}`);
  });
  
  test('Component Gallery', async ({ page, browserName }) => {
    await page.goto('/opportunities');
    await page.waitForLoadState('networkidle');
    
    // Capture specific UI components
    const components = [
      { selector: '.bp5-button', name: 'buttons' },
      { selector: '.bp5-card', name: 'cards' },
      { selector: '.bp5-input', name: 'inputs' },
      { selector: '.bp5-icon', name: 'icons' },
      { selector: '.bp5-tag', name: 'tags' },
      { selector: '.bp5-callout', name: 'callouts' },
    ];
    
    for (const component of components) {
      const element = page.locator(component.selector).first();
      if (await element.isVisible().catch(() => false)) {
        try {
          await element.screenshot({
            path: path.join(SCREENSHOTS_DIR, `component-${component.name}-${browserName}.png`),
          });
          console.log(`📸 Captured ${component.name} component`);
        } catch (e) {
          console.log(`⚠️  Could not capture ${component.name}`);
        }
      }
    }
  });
});

// Visual baseline management commands
test.describe('Visual Baseline Management', () => {
  test('Generate Baseline Report', async ({ page }) => {
    const baselines = await fs.readdir(BASELINE_DIR);
    const screenshots = await fs.readdir(SCREENSHOTS_DIR);
    
    const report = {
      generated: new Date().toISOString(),
      baselines: baselines.length,
      screenshots: screenshots.length,
      coverage: {
        dashboard: baselines.filter(f => f.includes('dashboard')).length,
        opportunities: baselines.filter(f => f.includes('opportunities')).length,
        responsive: baselines.filter(f => f.includes('mobile') || f.includes('tablet')).length,
        components: baselines.filter(f => f.includes('component')).length,
      },
      files: baselines,
    };
    
    await fs.writeJson(path.join('test-results', 'visual-baseline-report.json'), report, { spaces: 2 });
    
    console.log('📊 Visual Baseline Report:');
    console.log(`  Total Baselines: ${report.baselines}`);
    console.log(`  Dashboard Views: ${report.coverage.dashboard}`);
    console.log(`  Opportunities Views: ${report.coverage.opportunities}`);
    console.log(`  Responsive Views: ${report.coverage.responsive}`);
    console.log(`  Component Library: ${report.coverage.components}`);
  });
  
  test.skip('Update All Baselines', async () => {
    // Only run when UPDATE_BASELINES=true
    if (process.env.UPDATE_BASELINES !== 'true') {
      return;
    }
    
    const screenshots = await fs.readdir(SCREENSHOTS_DIR);
    let updated = 0;
    
    for (const screenshot of screenshots) {
      if (screenshot.endsWith('.png')) {
        await fs.copy(
          path.join(SCREENSHOTS_DIR, screenshot),
          path.join(BASELINE_DIR, screenshot),
          { overwrite: true }
        );
        updated++;
      }
    }
    
    console.log(`✅ Updated ${updated} baselines`);
  });
});