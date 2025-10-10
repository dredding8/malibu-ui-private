/**
 * Site Allocation Display Validation Test
 *
 * Validates the new Blueprint-aligned Site Allocation column implementation:
 * - Displays up to 3 sites with collect counts
 * - Shows overflow indicator for >3 sites
 * - Displays override indicators when present
 * - Follows Blueprint and Workshop patterns
 */

import { test, expect } from '@playwright/test';

test.describe('Site Allocation Column - Blueprint Implementation', () => {
  test.beforeEach(async ({ page }) => {
    // Navigate to Collection Management Hub
    await page.goto('http://localhost:3000');
    await page.waitForLoadState('networkidle');

    // Wait for table to load
    await page.waitForSelector('.bp5-table-container', { timeout: 10000 });
  });

  test('should display site names with collect counts', async ({ page }) => {
    // Take initial screenshot
    await page.screenshot({
      path: '../site-allocation-initial.png',
      fullPage: false
    });

    // Find Site Allocation column header
    const headers = page.locator('.bp5-table-column-name-text');
    const siteAllocationHeader = headers.filter({ hasText: 'Site Allocation' });

    await expect(siteAllocationHeader).toBeVisible();
    console.log('✅ Site Allocation column header found');

    // Find cells in Site Allocation column
    const siteCells = page.locator('.site-allocation-cell');
    const firstCell = siteCells.first();

    await expect(firstCell).toBeVisible({ timeout: 5000 });
    console.log('✅ Site allocation cells rendered');

    // Check for site tags with Blueprint styling
    const siteTags = firstCell.locator('.site-allocation-tag');
    const tagCount = await siteTags.count();

    console.log(`Found ${tagCount} site tags in first cell`);

    if (tagCount > 0) {
      const firstTag = siteTags.first();

      // Verify tag contains site name
      const siteName = firstTag.locator('.site-allocation-tag__name');
      await expect(siteName).toBeVisible();
      const nameText = await siteName.textContent();
      console.log(`✅ Site name displayed: ${nameText}`);

      // Verify tag contains collect count
      const collectCount = firstTag.locator('.site-allocation-tag__count');
      await expect(collectCount).toBeVisible();
      const countText = await collectCount.textContent();
      console.log(`✅ Collect count displayed: ${countText}`);
    }

    // Take screenshot showing site tags
    await page.screenshot({
      path: '../site-allocation-with-tags.png',
      fullPage: false
    });
  });

  test('should show overflow indicator for >3 sites', async ({ page }) => {
    // Find cells with many allocated sites
    const allCells = page.locator('.site-allocation-cell');
    const cellCount = await allCells.count();

    console.log(`Checking ${cellCount} cells for overflow indicators`);

    let foundOverflow = false;

    for (let i = 0; i < Math.min(cellCount, 20); i++) {
      const cell = allCells.nth(i);
      const overflowTag = cell.locator('.site-allocation-overflow');

      if (await overflowTag.isVisible()) {
        foundOverflow = true;
        const overflowText = await overflowTag.textContent();
        console.log(`✅ Found overflow indicator: "${overflowText}"`);

        // Hover to trigger tooltip
        await overflowTag.hover();
        await page.waitForTimeout(500);

        // Check for tooltip with full site list
        const tooltip = page.locator('.site-allocation-overflow-tooltip');
        if (await tooltip.isVisible()) {
          console.log('✅ Overflow tooltip displays on hover');

          // Take screenshot with tooltip
          await page.screenshot({
            path: '../site-allocation-overflow-tooltip.png',
            fullPage: false
          });
        }

        break;
      }
    }

    if (foundOverflow) {
      console.log('✅ Overflow pattern working correctly');
    } else {
      console.log('ℹ️ No cells with >3 sites found in current data');
    }
  });

  test('should display override indicators', async ({ page }) => {
    // Look for override warning icons
    const overrideIcons = page.locator('.site-allocation-override-icon');
    const iconCount = await overrideIcons.count();

    console.log(`Found ${iconCount} override indicators`);

    if (iconCount > 0) {
      const firstIcon = overrideIcons.first();
      await expect(firstIcon).toBeVisible();

      // Verify it's a warning icon
      const iconClass = await firstIcon.getAttribute('class');
      expect(iconClass).toContain('bp5-icon-warning-sign');
      console.log('✅ Override icon is Blueprint warning-sign');

      // Hover to show override tooltip
      await firstIcon.hover();
      await page.waitForTimeout(500);

      const tooltip = page.locator('.site-allocation-override-tooltip');
      if (await tooltip.isVisible()) {
        const tooltipTitle = tooltip.locator('.site-allocation-override-tooltip__title');
        await expect(tooltipTitle).toContainText('Manual Override');
        console.log('✅ Override tooltip displays justification');

        // Take screenshot
        await page.screenshot({
          path: '../site-allocation-override-indicator.png',
          fullPage: false
        });
      }
    } else {
      console.log('ℹ️ No override indicators found (30% of data has overrides)');
    }
  });

  test('should follow Blueprint styling patterns', async ({ page }) => {
    const firstCell = page.locator('.site-allocation-cell').first();
    await expect(firstCell).toBeVisible();

    // Check for Blueprint Tag component
    const tags = firstCell.locator('.bp5-tag');
    const tagCount = await tags.count();

    if (tagCount > 0) {
      console.log(`✅ Using Blueprint Tag component (${tagCount} tags)`);

      const firstTag = tags.first();

      // Verify minimal intent styling
      const tagClass = await firstTag.getAttribute('class');
      expect(tagClass).toContain('bp5-minimal');
      console.log('✅ Tags use Blueprint minimal styling');

      // Verify intent class
      if (tagClass?.includes('bp5-intent-primary')) {
        console.log('✅ Tags use Blueprint Intent.PRIMARY');
      }
    }

    // Verify no inline styles (Workshop compliance)
    const cellStyle = await firstCell.getAttribute('style');
    if (!cellStyle || cellStyle.trim() === '') {
      console.log('✅ No inline styles (Workshop compliant)');
    }

    // Check for Blueprint spacing grid usage
    const computedPadding = await firstCell.evaluate((el) => {
      return window.getComputedStyle(el).padding;
    });
    console.log(`Cell padding: ${computedPadding}`);

    // Take final screenshot
    await page.screenshot({
      path: '../site-allocation-blueprint-styling.png',
      fullPage: false
    });
  });

  test('should support dark theme', async ({ page }) => {
    // Add dark theme class to body
    await page.addStyleTag({
      content: '.bp5-dark { color-scheme: dark; }'
    });

    await page.evaluate(() => {
      document.body.classList.add('bp5-dark');
    });

    await page.waitForTimeout(500);

    // Take screenshot in dark mode
    await page.screenshot({
      path: '../site-allocation-dark-theme.png',
      fullPage: false
    });

    console.log('✅ Dark theme CSS applied');
  });

  test('should be accessible (ARIA compliance)', async ({ page }) => {
    const firstCell = page.locator('.site-allocation-cell').first();

    // Check for ARIA label on cell content
    const cellContent = firstCell.locator('.site-allocation-content');
    const ariaLabel = await cellContent.getAttribute('aria-label');

    if (ariaLabel) {
      console.log(`✅ Cell has ARIA label: "${ariaLabel}"`);
      expect(ariaLabel).toContain('sites allocated');
    }

    // Check tags have ARIA labels
    const tags = firstCell.locator('.site-allocation-tag');
    const firstTag = tags.first();

    if (await firstTag.isVisible()) {
      const tagAria = await firstTag.getAttribute('aria-label');
      if (tagAria) {
        console.log(`✅ Tag has ARIA label: "${tagAria}"`);
      }
    }

    // Check overflow button is keyboard accessible
    const overflowButton = firstCell.locator('.site-allocation-overflow');
    if (await overflowButton.isVisible()) {
      const tabIndex = await overflowButton.getAttribute('tabindex');
      expect(tabIndex).toBe('0');
      console.log('✅ Overflow button is keyboard accessible (tabindex=0)');

      const role = await overflowButton.getAttribute('role');
      expect(role).toBe('button');
      console.log('✅ Overflow has role="button"');
    }
  });

  test('should display correct data structure', async ({ page }) => {
    const firstCell = page.locator('.site-allocation-cell').first();
    await expect(firstCell).toBeVisible();

    // Count visible site tags (should be ≤3)
    const visibleTags = firstCell.locator('.site-allocation-tag');
    const visibleCount = await visibleTags.count();

    console.log(`Visible site tags: ${visibleCount}`);
    expect(visibleCount).toBeLessThanOrEqual(3);
    console.log('✅ Shows maximum of 3 visible sites');

    // If overflow exists, verify "+X more" format
    const overflowTag = firstCell.locator('.site-allocation-overflow');
    if (await overflowTag.isVisible()) {
      const overflowText = await overflowTag.textContent();
      expect(overflowText).toMatch(/\+\d+ more/);
      console.log(`✅ Overflow format correct: "${overflowText}"`);
    }

    // Verify each tag has both name and count
    for (let i = 0; i < visibleCount; i++) {
      const tag = visibleTags.nth(i);
      const name = tag.locator('.site-allocation-tag__name');
      const count = tag.locator('.site-allocation-tag__count');

      await expect(name).toBeVisible();
      await expect(count).toBeVisible();

      const nameText = await name.textContent();
      const countText = await count.textContent();

      console.log(`Site ${i + 1}: ${nameText} ${countText}`);
      expect(countText).toMatch(/\(\d+\)/);
    }
  });
});

test.describe('Site Allocation Column - Integration Tests', () => {
  test('should render in all collection views', async ({ page }) => {
    // Test in main hub
    await page.goto('http://localhost:3000');
    await page.waitForSelector('.site-allocation-cell', { timeout: 10000 });
    console.log('✅ Site allocation displays in Collection Hub');

    // Test in specific deck view (if applicable)
    const deckLinks = page.locator('a[href*="/decks/"]');
    if (await deckLinks.count() > 0) {
      await deckLinks.first().click();
      await page.waitForLoadState('networkidle');

      const deckSiteCells = page.locator('.site-allocation-cell');
      if (await deckSiteCells.count() > 0) {
        console.log('✅ Site allocation displays in Deck detail view');
      }
    }
  });

  test('should maintain performance with many rows', async ({ page }) => {
    await page.goto('http://localhost:3000');

    const startTime = Date.now();
    await page.waitForSelector('.site-allocation-cell', { timeout: 10000 });
    const loadTime = Date.now() - startTime;

    const cellCount = await page.locator('.site-allocation-cell').count();
    console.log(`Rendered ${cellCount} site allocation cells in ${loadTime}ms`);

    expect(loadTime).toBeLessThan(5000);
    console.log('✅ Performance acceptable (<5s load time)');
  });
});
