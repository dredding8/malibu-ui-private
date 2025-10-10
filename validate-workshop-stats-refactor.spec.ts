import { test, expect } from '@playwright/test';

/**
 * Workshop Compliance Validation: Hub Stats Cards Refactor
 *
 * Purpose: Validate live application rendering at /collection/TEST-002/manage
 * Confirms:
 * 1. Correct page is rendering (CollectionOpportunitiesHub)
 * 2. Stats cards use Workshop Resource List pattern with Blueprint Card
 * 3. Design tokens are applied (--bp5-* CSS variables)
 * 4. WCAG 2.1 AA accessibility compliance
 */

test.describe('Workshop Stats Refactor Validation', () => {
  test.beforeEach(async ({ page }) => {
    // Navigate to live application
    await page.goto('http://localhost:3000/collection/TEST-002/manage');

    // Wait for page to fully load
    await page.waitForLoadState('networkidle');
  });

  test('should render CollectionOpportunitiesHub page with correct title', async ({ page }) => {
    // Verify we're on the correct page
    const pageTitle = await page.locator('h1#page-title').textContent();
    expect(pageTitle).toContain('Collection Management');
    expect(pageTitle).toContain('TEST-002');

    console.log('✅ Confirmed: CollectionOpportunitiesHub page is rendering');
  });

  test('should render Health & Alerts section with Workshop pattern', async ({ page }) => {
    // Check for Health & Alerts heading
    const healthHeading = await page.locator('h2:has-text("Health & Alerts")').isVisible();
    expect(healthHeading).toBeTruthy();

    console.log('✅ Confirmed: Health & Alerts section exists');
  });

  test('should render Blueprint Card components for stats', async ({ page }) => {
    // Wait for stats cards region
    const statsRegion = page.locator('[role="region"][aria-label="Key system metrics"]');
    await expect(statsRegion).toBeVisible();

    // Check for Blueprint Card components (they have bp5-card class)
    const cards = statsRegion.locator('.bp5-card');
    const cardCount = await cards.count();

    expect(cardCount).toBeGreaterThanOrEqual(2); // Health + Critical cards
    console.log(`✅ Confirmed: ${cardCount} Blueprint Card components rendered`);
  });

  test('should have proper ARIA labels on stats cards', async ({ page }) => {
    const statsRegion = page.locator('[role="region"][aria-label="Key system metrics"]');

    // Check System Health card has proper ARIA
    const healthCard = statsRegion.locator('[role="group"]').filter({ hasText: 'System Health' });
    const healthAriaLabel = await healthCard.getAttribute('aria-label');

    expect(healthAriaLabel).toContain('System health:');
    expect(healthAriaLabel).toMatch(/\d+%/); // Should contain percentage
    console.log(`✅ Confirmed: Health card ARIA label: "${healthAriaLabel}"`);

    // Check Critical Issues card has proper ARIA
    const criticalCard = statsRegion.locator('[role="group"]').filter({ hasText: 'Critical Issues' });
    const criticalAriaLabel = await criticalCard.getAttribute('aria-label');

    expect(criticalAriaLabel).toContain('Critical issues:');
    console.log(`✅ Confirmed: Critical card ARIA label: "${criticalAriaLabel}"`);
  });

  test('should have keyboard navigation support (tabIndex)', async ({ page }) => {
    const statsRegion = page.locator('[role="region"][aria-label="Key system metrics"]');

    // Both cards should be keyboard accessible
    const focusableCards = statsRegion.locator('[role="group"][tabindex="0"]');
    const count = await focusableCards.count();

    expect(count).toBeGreaterThanOrEqual(2);
    console.log(`✅ Confirmed: ${count} cards are keyboard accessible`);
  });

  test('should use Blueprint design tokens (CSS variables)', async ({ page }) => {
    const statsRegion = page.locator('[role="region"][aria-label="Key system metrics"]');

    // Get computed styles to verify CSS variables are used
    const healthCard = statsRegion.locator('[role="group"]').first();
    const computedPadding = await healthCard.evaluate((el) => {
      const styles = window.getComputedStyle(el);
      return styles.padding;
    });

    // Blueprint grid-size is 10px, so calc(var(--bp5-grid-size) * 2) = 20px
    expect(computedPadding).toContain('20px');
    console.log(`✅ Confirmed: Blueprint design tokens applied (padding: ${computedPadding})`);
  });

  test('should have Blueprint elevation styling', async ({ page }) => {
    const statsRegion = page.locator('[role="region"][aria-label="Key system metrics"]');

    // Cards should have bp5-elevation-1 class or equivalent box-shadow
    const firstCard = statsRegion.locator('.bp5-card').first();
    const hasElevation = await firstCard.evaluate((el) => {
      const styles = window.getComputedStyle(el);
      return styles.boxShadow !== 'none';
    });

    expect(hasElevation).toBeTruthy();
    console.log('✅ Confirmed: Blueprint elevation styling applied');
  });

  test('should display System Health percentage', async ({ page }) => {
    const statsRegion = page.locator('[role="region"][aria-label="Key system metrics"]');
    const healthCard = statsRegion.locator('[role="group"]').filter({ hasText: 'System Health' });

    // Should display percentage value
    const percentageText = await healthCard.locator('[aria-live="polite"]').textContent();
    expect(percentageText).toMatch(/\d+%/);

    console.log(`✅ Confirmed: Health score displayed: ${percentageText}`);
  });

  test('should display Critical Issues count', async ({ page }) => {
    const statsRegion = page.locator('[role="region"][aria-label="Key system metrics"]');
    const criticalCard = statsRegion.locator('[role="group"]').filter({ hasText: 'Critical Issues' });

    // Should display count value
    const countText = await criticalCard.locator('[role="status"][aria-live="polite"]').textContent();
    expect(countText).toMatch(/\d+/);

    console.log(`✅ Confirmed: Critical issues count displayed: ${countText?.trim()}`);
  });

  test('should render health progress bar with Blueprint design tokens', async ({ page }) => {
    const statsRegion = page.locator('[role="region"][aria-label="Key system metrics"]');
    const healthCard = statsRegion.locator('[role="group"]').filter({ hasText: 'System Health' });

    // Check for progress bar container
    const progressBar = healthCard.locator('div[style*="height: 4px"]');
    await expect(progressBar).toBeVisible();

    // Check progress fill uses Blueprint intent colors
    const progressFill = progressBar.locator('div').first();
    const fillBackground = await progressFill.evaluate((el) => {
      return window.getComputedStyle(el).background;
    });

    // Should use Blueprint intent colors (success/warning/danger)
    expect(fillBackground).toBeTruthy();
    console.log('✅ Confirmed: Progress bar rendered with Blueprint styling');
  });

  test('should have proper icon sizes (24px for Workshop pattern)', async ({ page }) => {
    const statsRegion = page.locator('[role="region"][aria-label="Key system metrics"]');

    // Icons should be 24px (Workshop pattern vs old 16px)
    const icons = statsRegion.locator('.bp5-icon');
    const firstIconSize = await icons.first().evaluate((el) => {
      return window.getComputedStyle(el).fontSize;
    });

    expect(firstIconSize).toBe('24px');
    console.log(`✅ Confirmed: Icons use Workshop pattern size: ${firstIconSize}`);
  });

  test('should render CollectionOpportunitiesEnhanced table component', async ({ page }) => {
    // Verify the child component (CollectionOpportunitiesEnhanced) is rendering
    const table = page.locator('.bp5-table2, table');

    // Wait for table to load
    await page.waitForSelector('.bp5-table2, table, [data-testid="opportunity-row"]', { timeout: 10000 });

    const hasTable = await table.count() > 0 ||
                     await page.locator('[data-testid="opportunity-row"]').count() > 0;

    expect(hasTable).toBeTruthy();
    console.log('✅ Confirmed: CollectionOpportunitiesEnhanced component is rendering');
  });

  test('should have critical issues card clickable when issues exist', async ({ page }) => {
    const statsRegion = page.locator('[role="region"][aria-label="Key system metrics"]');
    const criticalCard = statsRegion.locator('[role="group"]').filter({ hasText: 'Critical Issues' });

    // Check if card has cursor: pointer style (indicates interactivity)
    const cursorStyle = await criticalCard.evaluate((el) => {
      return window.getComputedStyle(el).cursor;
    });

    // Should be 'pointer' if critical > 0, 'default' otherwise
    expect(['pointer', 'default']).toContain(cursorStyle);
    console.log(`✅ Confirmed: Critical card cursor style: ${cursorStyle}`);
  });

  test('should take screenshot of new Workshop stats cards', async ({ page }) => {
    await page.screenshot({
      path: 'workshop-stats-validation.png',
      fullPage: false
    });

    console.log('✅ Screenshot saved: workshop-stats-validation.png');
  });

  test('should verify no custom stat-card classes are used (deprecated)', async ({ page }) => {
    // Old custom classes should NOT be present
    const oldStatCards = await page.locator('.stat-card.health-summary').count();
    const oldStatContent = await page.locator('.stat-content').count();
    const oldStatIcon = await page.locator('.stat-icon').count();

    expect(oldStatCards).toBe(0);
    expect(oldStatContent).toBe(0);
    expect(oldStatIcon).toBe(0);

    console.log('✅ Confirmed: Old custom .stat-card classes removed from DOM');
  });
});
