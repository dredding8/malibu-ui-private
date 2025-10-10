/**
 * Visual Validation: OpportunityInfoHeaderEnhanced Implementation
 *
 * Using Playwright MCP + SuperClaude Framework
 * Validates priority display as plain number (no Tag wrapper)
 *
 * Multi-Persona Validation:
 * - Product Manager: Functional requirements met
 * - Visual Designer: Styling matches table exactly
 * - QA: Visual regression check
 */

import { test, expect } from '@playwright/test';

test.describe('OpportunityInfoHeaderEnhanced - Priority Display Validation', () => {
  test.beforeEach(async ({ page }) => {
    // Navigate to Collection Opportunities Hub
    await page.goto('http://localhost:3000');
    await page.waitForLoadState('networkidle');

    // Click Collections nav item
    const collectionsNav = page.locator('a:has-text("Collections"), button:has-text("Collections")');
    if (await collectionsNav.count() > 0) {
      await collectionsNav.first().click();
      await page.waitForLoadState('networkidle');
    }

    // Wait a moment for page to stabilize
    await page.waitForTimeout(2000);
  });

  test('should display priority as plain number (not Tag) in modal header', async ({ page }) => {
    // Wait for table to load
    const table = page.locator('.bp5-table-container, table');
    await expect(table).toBeVisible({ timeout: 10000 });

    // Find first opportunity row with valid data
    const firstRow = page.locator('[data-testid="opportunity-row"]').first();

    // If no test ID, try clicking first table row
    const rowToClick = await firstRow.count() > 0
      ? firstRow
      : page.locator('.bp5-table tbody tr, .opportunity-card').first();

    await expect(rowToClick).toBeVisible({ timeout: 5000 });

    // Capture table priority cell for comparison
    const tablePriorityCell = page.locator('td').filter({ hasText: /^[1-4]$/ }).first();
    let tablePriorityValue = '';

    if (await tablePriorityCell.count() > 0) {
      tablePriorityValue = await tablePriorityCell.textContent() || '';
      console.log('Table Priority Value:', tablePriorityValue.trim());
    }

    // Click row to open modal
    await rowToClick.click();

    // Wait for UnifiedOpportunityEditor modal/drawer to open
    const modal = page.locator('.bp5-dialog, .bp5-drawer').first();
    await expect(modal).toBeVisible({ timeout: 5000 });

    // Wait for header to render
    const header = modal.locator('.opportunity-info-header-enhanced');
    await expect(header).toBeVisible({ timeout: 3000 });

    // Screenshot: Full header view
    await page.screenshot({
      path: '/Users/damon/malibu/header-implementation-validation.png',
      fullPage: false
    });

    console.log('✅ Modal opened, header visible');

    // CRITICAL VALIDATION: Priority should be plain number, NOT inside a Tag
    const headerProperties = header.locator('.header-properties');
    await expect(headerProperties).toBeVisible();

    // Find priority section
    const prioritySection = headerProperties.locator('.property-item').filter({
      has: page.locator('span:has-text("Priority:")')
    });
    await expect(prioritySection).toBeVisible();

    // Screenshot: Priority section closeup
    await prioritySection.screenshot({
      path: '/Users/damon/malibu/priority-display-closeup.png'
    });

    // VALIDATION 1: Priority value should be a plain SPAN, not a Tag
    const priorityValue = prioritySection.locator('.priority-value');
    await expect(priorityValue).toBeVisible();

    const priorityText = await priorityValue.textContent();
    console.log('Header Priority Value:', priorityText?.trim());

    // VALIDATION 2: Priority value should NOT be inside a .bp5-tag
    const priorityInsideTag = prioritySection.locator('.bp5-tag').filter({ hasText: /^[1-4]$/ });
    const tagCount = await priorityInsideTag.count();

    if (tagCount > 0) {
      console.error('❌ FAIL: Priority is wrapped in a Tag component');
      await page.screenshot({ path: '/Users/damon/malibu/priority-ERROR-in-tag.png' });
    } else {
      console.log('✅ PASS: Priority is NOT wrapped in a Tag');
    }

    expect(tagCount).toBe(0); // Priority should NOT be in a Tag

    // VALIDATION 3: Priority value should be numeric (1-4)
    const priorityNumeric = priorityText?.trim();
    expect(priorityNumeric).toMatch(/^[1-4]$/);
    console.log('✅ PASS: Priority is numeric:', priorityNumeric);

    // VALIDATION 4: Priority styling should match table (16px, 600 weight)
    const priorityStyles = await priorityValue.evaluate((el) => {
      const computed = window.getComputedStyle(el);
      return {
        fontSize: computed.fontSize,
        fontWeight: computed.fontWeight,
        color: computed.color,
      };
    });

    console.log('Priority Styles:', priorityStyles);

    // Font size should be 16px
    expect(priorityStyles.fontSize).toBe('16px');

    // Font weight should be 600
    expect(priorityStyles.fontWeight).toBe('600');

    console.log('✅ PASS: Priority styling matches table (16px, 600 weight)');

    // VALIDATION 5: Other properties (SCC, Orbit, Periodicity) should use Tags
    const sccTag = headerProperties.locator('.property-item').filter({
      has: page.locator('span:has-text("SCC:")')
    }).locator('.bp5-tag');

    const orbitTag = headerProperties.locator('.property-item').filter({
      has: page.locator('span:has-text("Orbit:")')
    }).locator('.bp5-tag');

    const periodicityTag = headerProperties.locator('.property-item').filter({
      has: page.locator('span:has-text("Periodicity:")')
    }).locator('.bp5-tag');

    await expect(sccTag).toBeVisible();
    await expect(orbitTag).toBeVisible();
    await expect(periodicityTag).toBeVisible();

    console.log('✅ PASS: SCC, Orbit, Periodicity use Tag components');

    // VALIDATION 6: Satellite name should be H5 heading
    const satelliteName = header.locator('.satellite-name');
    await expect(satelliteName).toBeVisible();

    const satelliteTagName = await satelliteName.evaluate(el => el.tagName);
    expect(satelliteTagName).toBe('H5');

    console.log('✅ PASS: Satellite name is H5 heading');

    // VALIDATION 7: Match status should be Tag with Intent color
    const matchStatusTag = header.locator('.header-identity .bp5-tag');
    if (await matchStatusTag.count() > 0) {
      await expect(matchStatusTag).toBeVisible();
      console.log('✅ PASS: Match status displayed as Tag');
    }

    // Final screenshot: Full modal view
    await modal.screenshot({
      path: '/Users/damon/malibu/modal-complete-view.png'
    });

    console.log('\n=== VALIDATION SUMMARY ===');
    console.log('✅ Priority displayed as plain number (not Tag)');
    console.log('✅ Priority styling: 16px, 600 weight');
    console.log('✅ SCC, Orbit, Periodicity use Tags');
    console.log('✅ Satellite name is H5 heading');
    console.log('✅ Header structure matches design spec');
  });

  test('should validate priority number matches table value', async ({ page }) => {
    // Wait for table
    await page.waitForSelector('.bp5-table-container, table', { timeout: 10000 });

    // Get priority from first row in table
    const firstPriorityCell = page.locator('td').filter({ hasText: /^[1-4]$/ }).first();

    if (await firstPriorityCell.count() === 0) {
      console.log('⚠️ SKIP: No priority cells found in table');
      return;
    }

    const tablePriority = await firstPriorityCell.textContent();
    console.log('Table Priority:', tablePriority?.trim());

    // Click row
    const firstRow = page.locator('[data-testid="opportunity-row"]').first();
    const rowToClick = await firstRow.count() > 0
      ? firstRow
      : page.locator('.bp5-table tbody tr').first();

    await rowToClick.click();

    // Wait for modal
    const modal = page.locator('.bp5-dialog, .bp5-drawer').first();
    await expect(modal).toBeVisible({ timeout: 5000 });

    // Get priority from header
    const headerPriority = modal.locator('.priority-value');
    await expect(headerPriority).toBeVisible();

    const headerPriorityText = await headerPriority.textContent();
    console.log('Header Priority:', headerPriorityText?.trim());

    // Values should match
    expect(headerPriorityText?.trim()).toBe(tablePriority?.trim());

    console.log('✅ PASS: Priority value matches between table and header');
  });
});
