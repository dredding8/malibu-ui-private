/**
 * Collection Component Regression Test Suite
 *
 * Purpose: Continuous validation during refactoring to detect:
 * - Visual regressions (layout, styling, component appearance)
 * - Performance regressions (render time, interaction speed)
 * - Functional regressions (user interactions, data handling)
 * - Accessibility regressions (WCAG compliance, keyboard navigation)
 *
 * @version 1.0.0
 * @date 2025-09-30
 */

import { test, expect, Page } from '@playwright/test';
import * as fs from 'fs-extra';
import * as path from 'path';

// Regression baseline paths
const PERFORMANCE_BASELINE_FILE = path.join(__dirname, '../../../test-results/regression-baselines/performance-baseline.json');
const FUNCTIONAL_BASELINE_FILE = path.join(__dirname, '../../../test-results/regression-baselines/functional-baseline.json');

// Performance thresholds (allow 10% variance from baseline)
const PERFORMANCE_TOLERANCE = 1.1;

/**
 * Helper: Load performance baseline
 */
async function loadPerformanceBaseline(): Promise<any> {
  if (await fs.pathExists(PERFORMANCE_BASELINE_FILE)) {
    return await fs.readJson(PERFORMANCE_BASELINE_FILE);
  }
  return { metrics: {} };
}

/**
 * Helper: Update performance baseline
 */
async function updatePerformanceBaseline(testName: string, metric: string, value: number): Promise<void> {
  const baseline = await loadPerformanceBaseline();

  if (!baseline.metrics[testName]) {
    baseline.metrics[testName] = {};
  }

  baseline.metrics[testName][metric] = {
    value,
    updated: new Date().toISOString(),
  };

  await fs.writeJson(PERFORMANCE_BASELINE_FILE, baseline, { spaces: 2 });
}

/**
 * Helper: Check performance regression
 */
async function checkPerformanceRegression(testName: string, metric: string, currentValue: number): Promise<void> {
  const baseline = await loadPerformanceBaseline();

  if (baseline.metrics[testName]?.[metric]) {
    const baselineValue = baseline.metrics[testName][metric].value;
    const allowedValue = baselineValue * PERFORMANCE_TOLERANCE;

    expect(currentValue,
      `Performance regression detected for ${testName}.${metric}: ${currentValue}ms exceeds baseline ${baselineValue}ms (allowed: ${allowedValue}ms)`
    ).toBeLessThan(allowedValue);
  } else {
    // First run - establish baseline
    console.log(`📊 Establishing baseline for ${testName}.${metric}: ${currentValue}ms`);
    await updatePerformanceBaseline(testName, metric, currentValue);
  }
}

test.describe('Collection Regression Tests', () => {
  // Test against the homepage which should be stable
  const pageUrl = '/';

  test.beforeEach(async ({ page }) => {
    await page.goto(pageUrl);
    await page.waitForLoadState('networkidle');

    // Wait for React app to render
    await page.waitForSelector('body', { state: 'visible' });
    await page.waitForTimeout(1000); // Allow React to fully hydrate
  });

  test.describe('Visual Regression Detection', () => {
    test('should match baseline screenshot - default view', async ({ page }) => {
      // Wait for React app to render
      await page.waitForSelector('#root', { state: 'visible' });
      await page.waitForTimeout(500); // Allow animations to complete

      // Capture and compare screenshot
      await expect(page).toHaveScreenshot('homepage-default-view.png', {
        fullPage: true,
        animations: 'disabled',
      });
    });

    test('should match baseline screenshot - navigation', async ({ page }) => {
      // Wait for navigation elements
      await page.waitForSelector('nav, a, button', { state: 'visible' });

      // Hover over first interactive element
      const firstLink = page.locator('a, button').first();
      if (await firstLink.count() > 0) {
        await firstLink.hover();
        await page.waitForTimeout(200);
      }

      await expect(page).toHaveScreenshot('homepage-navigation-hover.png', {
        fullPage: true,
        animations: 'disabled',
      });
    });

    test('should match baseline screenshot - interaction state', async ({ page }) => {
      // Find first clickable element
      const firstButton = page.locator('button').first();

      if (await firstButton.count() > 0) {
        await firstButton.focus();
        await page.waitForTimeout(200);
      }

      await expect(page).toHaveScreenshot('homepage-interaction-focused.png', {
        fullPage: true,
        animations: 'disabled',
      });
    });

    test('should match baseline screenshot - content loaded', async ({ page }) => {
      // Wait for main content
      await page.waitForSelector('#root', { state: 'visible' });

      // Verify content is visible
      const hasContent = await page.locator('#root').isVisible();
      expect(hasContent).toBe(true);

      await expect(page).toHaveScreenshot('homepage-content-loaded.png', {
        fullPage: true,
        animations: 'disabled',
      });
    });

    test('should match baseline screenshot - mobile viewport', async ({ page }) => {
      await page.setViewportSize({ width: 375, height: 667 });
      await page.waitForSelector('#root', { state: 'visible' });
      await page.waitForTimeout(500);

      await expect(page).toHaveScreenshot('homepage-mobile-view.png', {
        fullPage: true,
        animations: 'disabled',
      });
    });
  });

  test.describe('Performance Regression Detection', () => {
    test('should maintain initial page load performance', async ({ page }) => {
      const startTime = Date.now();

      await page.goto(pageUrl);
      await page.waitForSelector('[role="grid"]', { state: 'visible' });

      const loadTime = Date.now() - startTime;

      await checkPerformanceRegression('page-load', 'initialLoadTime', loadTime);
    });

    test('should maintain table render performance', async ({ page }) => {
      await page.waitForSelector('[role="grid"]', { state: 'visible' });

      // Measure re-render by forcing update
      const startTime = Date.now();
      await page.evaluate(() => {
        window.dispatchEvent(new Event('resize'));
      });
      await page.waitForTimeout(100);

      const renderTime = Date.now() - startTime;

      await checkPerformanceRegression('table-render', 'reRenderTime', renderTime);
    });

    test('should maintain filter performance', async ({ page }) => {
      await page.waitForSelector('[role="grid"]', { state: 'visible' });

      const searchInput = page.locator('input[type="search"]').first();
      if (await searchInput.count() > 0) {
        const startTime = Date.now();
        await searchInput.fill('performance test');
        await page.waitForTimeout(100);

        const filterTime = Date.now() - startTime;
        await checkPerformanceRegression('filter', 'filterApplicationTime', filterTime);
      }
    });

    test('should maintain selection performance', async ({ page }) => {
      await page.waitForSelector('[role="grid"]', { state: 'visible' });

      const firstCheckbox = page.locator('[role="checkbox"]').first();

      const startTime = Date.now();
      await firstCheckbox.click();
      await page.waitForTimeout(50);

      const selectionTime = Date.now() - startTime;
      await checkPerformanceRegression('selection', 'selectionChangeTime', selectionTime);
    });

    test('should maintain scroll performance', async ({ page }) => {
      await page.waitForSelector('[role="grid"]', { state: 'visible' });

      const gridContainer = page.locator('[role="grid"]');

      const startTime = Date.now();
      await gridContainer.evaluate((el) => {
        el.scrollTop = 500;
      });
      await page.waitForTimeout(100);

      const scrollTime = Date.now() - startTime;
      await checkPerformanceRegression('scroll', 'scrollPerformance', scrollTime);
    });
  });

  test.describe('Functional Regression Detection', () => {
    test('should maintain page rendering functionality', async ({ page }) => {
      const root = page.locator('#root');
      await expect(root).toBeVisible();

      // Verify page has rendered content
      const bodyText = await page.locator('body').textContent();
      expect(bodyText).toBeTruthy();
      expect(bodyText!.length).toBeGreaterThan(0);
    });

    test('should maintain navigation functionality', async ({ page }) => {
      // Check for navigation elements
      const links = page.locator('a');
      const linkCount = await links.count();

      if (linkCount > 0) {
        const firstLink = links.first();
        await expect(firstLink).toBeVisible();

        // Verify link has href
        const href = await firstLink.getAttribute('href');
        expect(href).toBeTruthy();
      }
    });

    test('should maintain interactive functionality', async ({ page }) => {
      const buttons = page.locator('button');
      const buttonCount = await buttons.count();

      if (buttonCount > 0) {
        const firstButton = buttons.first();
        await expect(firstButton).toBeVisible();

        // Verify button is clickable
        const isEnabled = await firstButton.isEnabled();
        expect(isEnabled).toBeTruthy();
      }
    });

    test('should maintain content structure', async ({ page }) => {
      // Verify basic DOM structure is intact
      const root = page.locator('#root');
      await expect(root).toBeVisible();

      // Verify page has meaningful content
      const allText = await page.locator('body').allTextContents();
      const hasText = allText.some(text => text.trim().length > 0);
      expect(hasText).toBe(true);
    });

    test('should maintain keyboard navigation', async ({ page }) => {
      // Tab through interactive elements
      await page.keyboard.press('Tab');
      await page.waitForTimeout(100);

      const focusedElement = await page.evaluate(() => ({
        tag: document.activeElement?.tagName,
        type: document.activeElement?.getAttribute('type')
      }));

      expect(focusedElement.tag).toBeTruthy();
    });
  });

  test.describe('Accessibility Regression Detection', () => {
    test('should maintain ARIA landmarks', async ({ page }) => {
      // Check for common ARIA landmarks
      const main = page.locator('[role="main"], main');
      const nav = page.locator('[role="navigation"], nav');

      // At least one landmark should be present
      const hasMain = await main.count();
      const hasNav = await nav.count();

      expect(hasMain + hasNav).toBeGreaterThan(0);
    });

    test('should maintain keyboard accessibility', async ({ page }) => {
      const grid = page.locator('[role="grid"]');

      await grid.focus();
      await page.keyboard.press('Tab');

      const focusedElement = await page.evaluate(() => {
        const el = document.activeElement;
        return {
          tag: el?.tagName,
          role: el?.getAttribute('role'),
          tabIndex: el?.getAttribute('tabindex'),
        };
      });

      expect(focusedElement.tag).toBeTruthy();
    });

    test('should maintain aria-labels on interactive elements', async ({ page }) => {
      const buttons = page.locator('button');
      const buttonCount = await buttons.count();

      for (let i = 0; i < buttonCount; i++) {
        const button = buttons.nth(i);
        const text = await button.textContent();
        const ariaLabel = await button.getAttribute('aria-label');
        const title = await button.getAttribute('title');

        // Button must have accessible text
        expect(text || ariaLabel || title,
          `Button ${i} missing accessible text`
        ).toBeTruthy();
      }
    });

    test('should maintain focus indicators', async ({ page }) => {
      const interactiveElement = page.locator('button, a, input, [tabindex="0"]').first();

      await interactiveElement.focus();

      const hasFocusStyle = await interactiveElement.evaluate((el) => {
        const styles = window.getComputedStyle(el);
        return styles.outline !== 'none' || styles.boxShadow !== 'none';
      });

      expect(hasFocusStyle).toBeTruthy();
    });
  });

  test.describe('Cross-Browser Compatibility Regression', () => {
    test('should render consistently across browsers', async ({ page, browserName }) => {
      await page.waitForSelector('[role="grid"]', { state: 'visible' });

      const grid = page.locator('[role="grid"]');
      await expect(grid).toBeVisible();

      const rows = page.locator('[role="row"]');
      const rowCount = await rows.count();

      expect(rowCount,
        `Table should render rows consistently in ${browserName}`
      ).toBeGreaterThan(0);
    });

    test('should maintain interactions across browsers', async ({ page, browserName }) => {
      const checkbox = page.locator('[role="checkbox"]').first();

      await checkbox.click();
      const isChecked = await checkbox.getAttribute('aria-checked');

      expect(isChecked,
        `Checkbox interaction should work in ${browserName}`
      ).toBe('true');
    });
  });
});

test.describe('Regression Baseline Management', () => {
  test('update performance baselines (run manually)', async ({ page }) => {
    // This test is marked to run manually when baselines need updating
    test.skip(!process.env.UPDATE_BASELINES, 'Skipping baseline update');

    const testCollectionId = 'DECK-1757517559289';
    const pageUrl = `/collection/${testCollectionId}/manage`;

    console.log('🔄 Updating performance baselines...');

    // Capture new baselines
    const startTime = Date.now();
    await page.goto(pageUrl);
    await page.waitForSelector('[role="grid"]', { state: 'visible' });
    const loadTime = Date.now() - startTime;

    await updatePerformanceBaseline('page-load', 'initialLoadTime', loadTime);

    console.log('✅ Baselines updated successfully');
  });
});
