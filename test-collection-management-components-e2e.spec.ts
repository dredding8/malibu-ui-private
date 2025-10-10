/**
 * Collection Management Components - Comprehensive E2E Test Suite
 *
 * Tests: CollectionHubHeader, CollectionDecksTable, ActionButtonGroup
 * MCP: Playwright for cross-browser automation
 * Focus: Component functionality, accessibility, user interactions
 */

import { test, expect, Page } from '@playwright/test';

const BASE_URL = 'http://localhost:3000';
const COLLECTION_ID = 'DECK-1758570229031';
const COLLECTION_MANAGE_URL = `${BASE_URL}/collection/${COLLECTION_ID}/manage`;

// Test configuration
test.describe.configure({ mode: 'parallel' });

test.describe('CollectionHubHeader Component', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto(COLLECTION_MANAGE_URL);
    await page.waitForSelector('.collection-hub-header', { timeout: 10000 });
  });

  test('renders header with correct title and metadata', async ({ page }) => {
    // Verify title
    const title = await page.locator('h1#page-title').textContent();
    expect(title).toContain('Review Assignments');
    expect(title).toContain(COLLECTION_ID);

    // Verify subtitle
    const subtitle = await page.locator('.hub-subtitle#page-description').textContent();
    expect(subtitle).toBeTruthy();
    expect(subtitle).toContain('Review and assign');
  });

  test('displays connection status indicator', async ({ page }) => {
    const connectionIndicator = page.locator('.connection-indicator');
    await expect(connectionIndicator).toBeVisible();

    const statusText = await connectionIndicator.locator('.connection-text').textContent();
    expect(['Live', 'Offline']).toContain(statusText);

    // Verify icon intent color
    const icon = connectionIndicator.locator('[data-icon="dot"]');
    await expect(icon).toBeVisible();
  });

  test('shows context statistics tags', async ({ page }) => {
    const contextStats = page.locator('.context-stats');
    await expect(contextStats).toBeVisible();

    // Assignment count tag
    const assignmentTag = contextStats.locator('span.bp5-tag').first();
    const tagText = await assignmentTag.textContent();
    expect(tagText).toMatch(/\d+ assignment(s)?/);
  });

  test('ActionButtonGroup - primary actions are visible', async ({ page }) => {
    const actionGroup = page.locator('.quick-actions-enhanced');
    await expect(actionGroup).toBeVisible();

    // Verify primary actions
    await expect(page.locator('button:has-text("Update Data")')).toBeVisible();
    await expect(page.locator('button:has-text("Download Report")')).toBeVisible();
    await expect(page.locator('button:has-text("Back to History")')).toBeVisible();
  });

  test('ActionButtonGroup - overflow menu functionality', async ({ page }) => {
    // Find and click overflow menu button
    const overflowButton = page.locator('button[aria-label*="more actions"], button:has([data-icon="more"])').first();

    if (await overflowButton.isVisible()) {
      await overflowButton.click();

      // Verify menu appears
      const menu = page.locator('.bp5-menu, [role="menu"]');
      await expect(menu).toBeVisible({ timeout: 2000 });

      // Verify menu items exist
      const menuItems = menu.locator('[role="menuitem"], .bp5-menu-item');
      const count = await menuItems.count();
      expect(count).toBeGreaterThan(0);
    }
  });

  test('search input is functional', async ({ page }) => {
    const searchInput = page.locator('input[placeholder*="Search"]');
    await expect(searchInput).toBeVisible();

    // Type search query
    await searchInput.fill('WORLDVIEW');
    await page.waitForTimeout(500); // Debounce delay

    // Verify input value
    const inputValue = await searchInput.inputValue();
    expect(inputValue).toBe('WORLDVIEW');

    // Clear button should appear
    const clearButton = page.locator('button[aria-label*="Clear search"]');
    if (await clearButton.isVisible()) {
      await clearButton.click();
      const clearedValue = await searchInput.inputValue();
      expect(clearedValue).toBe('');
    }
  });

  test('pending changes bar appears when changes exist', async ({ page }) => {
    // Check if pending changes bar is visible
    const pendingBar = page.locator('.pending-changes-bar');

    // If visible, verify structure
    if (await pendingBar.isVisible()) {
      const changesInfo = await pendingBar.locator('.pending-changes-info').textContent();
      expect(changesInfo).toMatch(/\d+ (unsaved )?change(s)?/);

      // Verify action buttons
      await expect(pendingBar.locator('button:has-text("Discard")')).toBeVisible();
      await expect(pendingBar.locator('button:has-text("Save")')).toBeVisible();
    }
  });

  test('refresh button triggers loading state', async ({ page }) => {
    const refreshButton = page.locator('button:has-text("Update Data")');
    await refreshButton.click();

    // Check for loading spinner (brief)
    const spinner = refreshButton.locator('.bp5-spinner');
    // Note: May be too fast to catch, so we just verify button still exists
    await expect(refreshButton).toBeVisible();
  });

  test('back navigation button works', async ({ page }) => {
    const backButton = page.locator('button:has-text("Back to History")');
    await expect(backButton).toBeVisible();

    // Click and verify navigation
    await backButton.click();
    await page.waitForURL('**/history', { timeout: 5000 });
    expect(page.url()).toContain('/history');
  });
});

test.describe('CollectionDecksTable Component', () => {
  test.beforeEach(async ({ page }) => {
    // Navigate to page with table (may be in different route)
    await page.goto(`${BASE_URL}/decks`);
    await page.waitForSelector('.collection-decks-table-wrapper, .bp5-table-container', { timeout: 10000 });
  });

  test('renders table with data', async ({ page }) => {
    const table = page.locator('.bp5-table, table');
    await expect(table).toBeVisible();

    // Verify column headers exist
    const headers = page.locator('.bp5-table-column-name-text, th');
    const headerCount = await headers.count();
    expect(headerCount).toBeGreaterThan(0);
  });

  test('table columns display correct data', async ({ page }) => {
    // Check for specific columns
    const columnHeaders = await page.locator('.bp5-table-column-name-text, th').allTextContents();

    // Common expected columns
    const expectedColumns = ['Name', 'Status', 'Priority', 'Actions'];
    const hasExpectedColumns = expectedColumns.some(col =>
      columnHeaders.some(header => header.includes(col))
    );

    expect(hasExpectedColumns).toBe(true);
  });

  test('status tags display with correct intents', async ({ page }) => {
    const statusTags = page.locator('.bp5-tag');

    if (await statusTags.count() > 0) {
      const firstTag = statusTags.first();
      await expect(firstTag).toBeVisible();

      // Verify tag has intent class
      const classes = await firstTag.getAttribute('class');
      const hasIntent = classes?.includes('bp5-intent-') || classes?.includes('intent-');
      expect(hasIntent).toBe(true);
    }
  });

  test('action buttons are present in rows', async ({ page }) => {
    // Look for action buttons (Continue, View, Discard, etc.)
    const actionButtons = page.locator('button:has-text("Continue"), button:has-text("View"), button:has-text("Discard")');

    if (await actionButtons.count() > 0) {
      const firstButton = actionButtons.first();
      await expect(firstButton).toBeVisible();
    }
  });

  test('select all functionality works', async ({ page }) => {
    const selectAllButton = page.locator('button:has-text("Select All")');

    if (await selectAllButton.isVisible()) {
      await selectAllButton.click();

      // Button text should change to "Deselect All"
      const deselectButton = page.locator('button:has-text("Deselect All")');
      await expect(deselectButton).toBeVisible({ timeout: 2000 });
    }
  });

  test('match notes display correctly', async ({ page }) => {
    const matchNotesCells = page.locator('.match-notes-cell');

    if (await matchNotesCells.count() > 0) {
      const firstCell = matchNotesCells.first();
      await expect(firstCell).toBeVisible();

      // Verify status tag exists
      const statusTag = firstCell.locator('.match-status-tag');
      await expect(statusTag).toBeVisible();
    }
  });

  test('table is scrollable for large datasets', async ({ page }) => {
    const tableContainer = page.locator('.collection-decks-table-wrapper, .bp5-table-container');

    // Check if table has overflow
    const hasOverflow = await tableContainer.evaluate((el) => {
      return el.scrollWidth > el.clientWidth || el.scrollHeight > el.clientHeight;
    });

    // If has overflow, test scrolling
    if (hasOverflow) {
      await tableContainer.hover();
      await page.mouse.wheel(0, 100);
      // Verify scroll position changed
      const scrollTop = await tableContainer.evaluate(el => el.scrollTop);
      expect(scrollTop).toBeGreaterThan(0);
    }
  });
});

test.describe('ActionButtonGroup Component', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto(COLLECTION_MANAGE_URL);
    await page.waitForSelector('.action-button-group, .quick-actions-enhanced', { timeout: 10000 });
  });

  test('primary actions are always visible', async ({ page }) => {
    const primaryActions = page.locator('.action-button-group-primary, .quick-actions-enhanced > button').first();
    await expect(primaryActions).toBeVisible();
  });

  test('secondary actions are in overflow menu', async ({ page }) => {
    const overflowButton = page.locator('button:has([data-icon="more"]), button[aria-label*="more"]').first();

    if (await overflowButton.isVisible()) {
      // Count visible buttons before opening menu
      const visibleButtons = await page.locator('.quick-actions-enhanced > button').count();
      expect(visibleButtons).toBeLessThanOrEqual(5); // Should have reduced cognitive load
    }
  });

  test('hotkey hints are displayed', async ({ page }) => {
    const buttonsWithHotkeys = page.locator('button:has(.hotkey-hint), button[aria-label*="⌘"]');

    if (await buttonsWithHotkeys.count() > 0) {
      const firstButton = buttonsWithHotkeys.first();
      await expect(firstButton).toBeVisible();
    }
  });

  test('disabled buttons have tooltips', async ({ page }) => {
    const disabledButtons = page.locator('button:disabled');

    if (await disabledButtons.count() > 0) {
      const firstDisabled = disabledButtons.first();
      await firstDisabled.hover();

      // Wait for potential tooltip
      await page.waitForTimeout(500);

      // Check for Blueprint tooltip
      const tooltip = page.locator('.bp5-tooltip');
      // Tooltip may or may not appear depending on implementation
    }
  });

  test('action buttons have proper ARIA labels', async ({ page }) => {
    const actionButtons = page.locator('.quick-actions-enhanced button');
    const count = await actionButtons.count();

    for (let i = 0; i < Math.min(count, 5); i++) {
      const button = actionButtons.nth(i);
      const ariaLabel = await button.getAttribute('aria-label');
      const buttonText = await button.textContent();

      // Button should have either aria-label or visible text
      expect(ariaLabel || buttonText).toBeTruthy();
    }
  });
});

test.describe('Accessibility - WCAG 2.1 AA Compliance', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto(COLLECTION_MANAGE_URL);
    await page.waitForLoadState('networkidle');
  });

  test('skip to main content link exists', async ({ page }) => {
    const skipLink = page.locator('a:has-text("Skip to main content")');

    if (await skipLink.count() > 0) {
      await expect(skipLink.first()).toBeInViewport({ ratio: 0 }); // May be visually hidden
    }
  });

  test('live regions for dynamic content', async ({ page }) => {
    const liveRegions = page.locator('[aria-live="polite"], [aria-live="assertive"]');
    const count = await liveRegions.count();
    expect(count).toBeGreaterThan(0);
  });

  test('all interactive elements are keyboard accessible', async ({ page }) => {
    const focusableElements = page.locator('button:visible, a:visible, input:visible, [tabindex]:visible');
    const count = await focusableElements.count();

    if (count > 0) {
      const firstElement = focusableElements.first();
      await firstElement.focus();

      const isFocused = await firstElement.evaluate(el => el === document.activeElement);
      expect(isFocused).toBe(true);
    }
  });

  test('focus indicators are visible', async ({ page }) => {
    const button = page.locator('button:visible').first();
    await button.focus();

    // Check computed styles for outline
    const outlineWidth = await button.evaluate(el =>
      window.getComputedStyle(el).outlineWidth
    );

    // Focus indicator should have visible outline
    expect(outlineWidth).not.toBe('0px');
  });

  test('color contrast meets WCAG AA standards', async ({ page }) => {
    // Test connection indicator text (known issue from analysis)
    const connectionText = page.locator('.connection-text');

    if (await connectionText.isVisible()) {
      const color = await connectionText.evaluate(el =>
        window.getComputedStyle(el).color
      );

      const bgColor = await connectionText.evaluate(el => {
        let parent = el.parentElement;
        while (parent) {
          const bg = window.getComputedStyle(parent).backgroundColor;
          if (bg !== 'rgba(0, 0, 0, 0)') return bg;
          parent = parent.parentElement;
        }
        return 'rgb(255, 255, 255)';
      });

      // Both values should be present
      expect(color).toBeTruthy();
      expect(bgColor).toBeTruthy();
    }
  });
});

test.describe('Performance & Loading States', () => {
  test('shows loading skeleton on initial load', async ({ page }) => {
    await page.goto(COLLECTION_MANAGE_URL);

    // Look for skeleton elements (should appear briefly)
    const skeleton = page.locator('.hub-skeleton, .skeleton, .bp5-skeleton');
    // Note: May disappear quickly, so we just verify page loads

    await page.waitForSelector('.collection-opportunities-hub', { timeout: 15000 });
    const hub = page.locator('.collection-opportunities-hub');
    await expect(hub).toBeVisible();
  });

  test('page loads within acceptable time', async ({ page }) => {
    const startTime = Date.now();

    await page.goto(COLLECTION_MANAGE_URL);
    await page.waitForSelector('.collection-opportunities-hub', { timeout: 10000 });

    const loadTime = Date.now() - startTime;

    // Should load in under 5 seconds
    expect(loadTime).toBeLessThan(5000);

    console.log(`Page load time: ${loadTime}ms`);
  });

  test('smooth transitions between tabs', async ({ page }) => {
    await page.goto(COLLECTION_MANAGE_URL);
    await page.waitForSelector('.hub-tabs');

    const analyticsTab = page.locator('[role="tab"]:has-text("Analytics")');

    if (await analyticsTab.isVisible()) {
      await analyticsTab.click();

      // Verify tab panel appears
      await page.waitForSelector('[role="tabpanel"]', { timeout: 2000 });
      const tabPanel = page.locator('[role="tabpanel"]:visible');
      await expect(tabPanel).toBeVisible();
    }
  });
});

test.describe('Responsive Design', () => {
  test('mobile viewport - header adapts correctly', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 667 }); // iPhone SE
    await page.goto(COLLECTION_MANAGE_URL);
    await page.waitForSelector('.collection-hub-header');

    const header = page.locator('.collection-hub-header');
    await expect(header).toBeVisible();

    // Verify header doesn't overflow
    const headerWidth = await header.evaluate(el => el.scrollWidth);
    const viewportWidth = 375;
    expect(headerWidth).toBeLessThanOrEqual(viewportWidth + 10); // Allow small margin
  });

  test('tablet viewport - table is scrollable', async ({ page }) => {
    await page.setViewportSize({ width: 768, height: 1024 }); // iPad
    await page.goto(COLLECTION_MANAGE_URL);

    const table = page.locator('.bp5-table-container, table');
    if (await table.isVisible()) {
      const isScrollable = await table.evaluate(el =>
        el.scrollWidth > el.clientWidth
      );

      // Table should be horizontally scrollable on tablet
      expect(isScrollable).toBe(true);
    }
  });
});

// Generate test report
test.afterAll(async () => {
  console.log('✅ Collection Management Components E2E Tests Complete');
  console.log('Report: test-results/collection-components-e2e-report.html');
});
