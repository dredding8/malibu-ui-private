import { test, expect } from '@playwright/test';

/**
 * Multi-Persona UX Critique: Collection Management Page
 *
 * Captures comprehensive screenshots of the live application at
 * http://localhost:3000/collection/TEST-002/manage for expert review.
 */

test.describe('Collection Management Page - UX Critique Capture', () => {
  test('capture full page state for multi-persona analysis', async ({ page }) => {
    console.log('🎯 Navigating to Collection Management page...');
    await page.goto('http://localhost:3000/collection/TEST-002/manage');
    await page.waitForLoadState('networkidle');

    // Wait for content to fully render
    await page.waitForSelector('[role="main"]', { timeout: 10000 });
    await page.waitForTimeout(2000); // Allow animations to settle

    console.log('📸 Capturing initial page state...');
    await page.screenshot({
      path: 'test-results/ux-critique/01-full-page-initial.png',
      fullPage: true
    });

    // Capture header region specifically
    console.log('📸 Capturing header region...');
    const header = page.locator('[role="banner"]');
    if (await header.count() > 0) {
      await header.screenshot({
        path: 'test-results/ux-critique/02-header-region.png'
      });
    }

    // Capture navigation/breadcrumbs
    console.log('📸 Capturing navigation region...');
    const nav = page.locator('[role="navigation"]');
    if (await nav.count() > 0) {
      await nav.screenshot({
        path: 'test-results/ux-critique/03-breadcrumbs-navigation.png'
      });
    }

    // Capture action toolbar
    console.log('📸 Capturing action toolbar...');
    const toolbar = page.locator('[role="toolbar"]');
    if (await toolbar.count() > 0) {
      await toolbar.screenshot({
        path: 'test-results/ux-critique/04-action-toolbar.png'
      });
    }

    // Capture tabs section
    console.log('📸 Capturing tabs interface...');
    const tabs = page.locator('[role="tablist"]').first();
    if (await tabs.count() > 0) {
      await tabs.screenshot({
        path: 'test-results/ux-critique/05-tabs-navigation.png'
      });
    }

    // Capture table area
    console.log('📸 Capturing main data table...');
    const tableContainer = page.locator('[role="region"]').filter({ hasText: 'Review Assignments' });
    if (await tableContainer.count() > 0) {
      await tableContainer.screenshot({
        path: 'test-results/ux-critique/06-data-table-full.png'
      });
    }

    // Scroll table horizontally if possible to capture all columns
    console.log('📸 Capturing table scrolled state...');
    const table = page.locator('table').first();
    if (await table.count() > 0) {
      await table.evaluate((el) => {
        el.scrollLeft = el.scrollWidth / 2;
      });
      await page.waitForTimeout(500);
      await tableContainer.screenshot({
        path: 'test-results/ux-critique/07-data-table-scrolled.png'
      });
    }

    // Test interactive states - hover on button
    console.log('📸 Capturing button hover state...');
    const firstButton = page.locator('button').first();
    if (await firstButton.count() > 0) {
      await firstButton.hover();
      await page.waitForTimeout(300);
      await page.screenshot({
        path: 'test-results/ux-critique/08-button-hover-state.png'
      });
    }

    // Capture color contrast analysis area
    console.log('📸 Capturing key UI elements for color contrast...');
    const tags = page.locator('.bp5-tag').first();
    if (await tags.count() > 0) {
      await tags.screenshot({
        path: 'test-results/ux-critique/09-tag-elements.png'
      });
    }

    // Extract computed styles for design token analysis
    console.log('📊 Extracting computed styles for design analysis...');
    const styleAnalysis = await page.evaluate(() => {
      const results: any = {
        colors: {},
        spacing: {},
        typography: {},
        layout: {}
      };

      // Check for Blueprint design tokens
      const root = document.documentElement;
      const rootStyles = window.getComputedStyle(root);

      // Extract color tokens
      const colorVars = ['--bp5-text-color', '--bp5-text-color-muted', '--bp5-intent-primary', '--bp5-intent-success', '--bp5-intent-warning', '--bp5-intent-danger'];
      colorVars.forEach(varName => {
        results.colors[varName] = rootStyles.getPropertyValue(varName);
      });

      // Check header
      const header = document.querySelector('[role="banner"]');
      if (header) {
        const headerStyles = window.getComputedStyle(header);
        results.layout.headerPadding = headerStyles.padding;
        results.layout.headerBackground = headerStyles.backgroundColor;
      }

      // Check main title
      const title = document.querySelector('h1');
      if (title) {
        const titleStyles = window.getComputedStyle(title);
        results.typography.titleFontSize = titleStyles.fontSize;
        results.typography.titleFontWeight = titleStyles.fontWeight;
        results.typography.titleColor = titleStyles.color;
        results.typography.titleLineHeight = titleStyles.lineHeight;
      }

      // Check buttons
      const button = document.querySelector('button');
      if (button) {
        const buttonStyles = window.getComputedStyle(button);
        results.spacing.buttonPadding = buttonStyles.padding;
        results.spacing.buttonMargin = buttonStyles.margin;
        results.colors.buttonBackground = buttonStyles.backgroundColor;
        results.colors.buttonColor = buttonStyles.color;
      }

      // Check table
      const table = document.querySelector('table');
      if (table) {
        const tableStyles = window.getComputedStyle(table);
        results.layout.tableWidth = tableStyles.width;
        results.spacing.tableBorderSpacing = tableStyles.borderSpacing;
      }

      return results;
    });

    console.log('📊 Design Token Analysis:', JSON.stringify(styleAnalysis, null, 2));

    // Write analysis data to file
    await page.evaluate((data) => {
      const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
      console.log('Style analysis captured');
    }, styleAnalysis);

    // Capture accessibility tree
    console.log('♿ Capturing accessibility snapshot...');
    const a11ySnapshot = await page.accessibility.snapshot();

    // Take final full-page screenshot
    console.log('📸 Final full-page capture...');
    await page.screenshot({
      path: 'test-results/ux-critique/10-full-page-final.png',
      fullPage: true
    });

    console.log('✅ Screenshot capture complete - ready for persona analysis');
    console.log(`📁 Screenshots saved to: test-results/ux-critique/`);
  });

  test('capture responsive breakpoints for IA analysis', async ({ page }) => {
    const breakpoints = [
      { name: 'desktop-wide', width: 1920, height: 1080 },
      { name: 'desktop-standard', width: 1440, height: 900 },
      { name: 'laptop', width: 1280, height: 800 },
      { name: 'tablet', width: 768, height: 1024 }
    ];

    for (const bp of breakpoints) {
      console.log(`📱 Testing ${bp.name} (${bp.width}x${bp.height})...`);
      await page.setViewportSize({ width: bp.width, height: bp.height });
      await page.goto('http://localhost:3000/collection/TEST-002/manage');
      await page.waitForLoadState('networkidle');
      await page.waitForTimeout(1000);

      await page.screenshot({
        path: `test-results/ux-critique/responsive-${bp.name}.png`,
        fullPage: true
      });
    }

    console.log('✅ Responsive analysis captures complete');
  });
});
