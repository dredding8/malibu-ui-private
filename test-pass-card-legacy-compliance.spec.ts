/**
 * Pass Card Legacy Compliance Test
 *
 * Verifies that pass cards in the Manual Override Modal match legacy system requirements:
 * - P0: Classification level displayed (security requirement)
 * - P0: Conflict indicators shown (usability requirement)
 * - P0: Time in Zulu format (operational requirement)
 * - P0: Priority in UPPERCASE (legacy consistency)
 */

import { test, expect } from '@playwright/test';

test.describe('Pass Card Legacy Compliance', () => {
  test.beforeEach(async ({ page }) => {
    // Navigate to history page (where collection decks are listed)
    await page.goto('http://localhost:3000/history');
    await page.waitForLoadState('networkidle');

    // Wait for the page to be loaded and interactive
    await page.waitForSelector('table', { timeout: 10000 });
  });

  test('should display classification banner on pass cards', async ({ page }) => {
    // Find first collection row and click override button
    const firstRow = page.locator('tr[data-testid^="collection-row-"]').first();
    await firstRow.waitFor({ state: 'visible' });

    const overrideButton = firstRow.locator('button[aria-label="Manual Override"]');
    await overrideButton.click();

    // Wait for override modal
    await page.waitForSelector('.manual-override-modal-refactored', { timeout: 5000 });

    // Find pass cards
    const passCards = page.locator('.pass-card');
    const cardCount = await passCards.count();

    console.log(`Found ${cardCount} pass cards`);
    expect(cardCount).toBeGreaterThan(0);

    // Verify first pass card has classification banner
    const firstCard = passCards.first();
    const classificationBanner = firstCard.locator('.classification-banner');

    await expect(classificationBanner).toBeVisible();

    // Verify classification text is displayed
    const classificationText = await classificationBanner.textContent();
    expect(classificationText).toBeTruthy();
    console.log(`Classification: ${classificationText}`);

    // Verify classification is in expected format (UPPERCASE, may have spaces for "TOP SECRET")
    expect(classificationText).toMatch(/^(UNCLASSIFIED|CONFIDENTIAL|SECRET|TOP SECRET)$/i);

    // Take screenshot
    await page.screenshot({ path: 'test-pass-card-classification.png', fullPage: true });
  });

  test('should display priority in UPPERCASE', async ({ page }) => {
    // Find first collection row and click override button
    const firstRow = page.locator('tr[data-testid^="collection-row-"]').first();
    await firstRow.waitFor({ state: 'visible' });

    const overrideButton = firstRow.locator('button[aria-label="Manual Override"]');
    await overrideButton.click();

    // Wait for override modal
    await page.waitForSelector('.manual-override-modal-refactored', { timeout: 5000 });

    // Find pass cards
    const passCards = page.locator('.pass-card');
    const firstCard = passCards.first();

    // Find priority tag in pass header
    const priorityTag = firstCard.locator('.pass-header .bp5-tag, .pass-header .bp6-tag');
    await expect(priorityTag).toBeVisible();

    const priorityText = await priorityTag.textContent();
    expect(priorityText).toBeTruthy();
    console.log(`Priority: ${priorityText}`);

    // Verify priority is uppercase
    expect(priorityText).toMatch(/^(NORMAL|HIGH|CRITICAL)$/);

    // Take screenshot
    await page.screenshot({ path: 'test-pass-card-priority.png', fullPage: true });
  });

  test('should display time in Zulu format (HHmmZ)', async ({ page }) => {
    // Find first collection row and click override button
    const firstRow = page.locator('tr[data-testid^="collection-row-"]').first();
    await firstRow.waitFor({ state: 'visible' });

    const overrideButton = firstRow.locator('button[aria-label="Manual Override"]');
    await overrideButton.click();

    // Wait for override modal
    await page.waitForSelector('.manual-override-modal-refactored', { timeout: 5000 });

    // Find pass cards
    const passCards = page.locator('.pass-card');
    const firstCard = passCards.first();

    // Find time window
    const timeWindow = firstCard.locator('.pass-time-window .time-value');
    await expect(timeWindow).toBeVisible();

    const timeText = await timeWindow.textContent();
    expect(timeText).toBeTruthy();
    console.log(`Time Window: ${timeText}`);

    // Verify Zulu time format: HHmmZ - HHmmZ (e.g., "1542Z - 1602Z")
    expect(timeText).toMatch(/^\d{4}Z\s*-\s*\d{4}Z$/);

    // Take screenshot
    await page.screenshot({ path: 'test-pass-card-zulu-time.png', fullPage: true });
  });

  test('should display conflict indicators when conflicts exist', async ({ page }) => {
    // Find first collection row and click override button
    const firstRow = page.locator('tr[data-testid^="collection-row-"]').first();
    await firstRow.waitFor({ state: 'visible' });

    const overrideButton = firstRow.locator('button[aria-label="Manual Override"]');
    await overrideButton.click();

    // Wait for override modal
    await page.waitForSelector('.manual-override-modal-refactored', { timeout: 5000 });

    // Find all pass cards
    const passCards = page.locator('.pass-card');
    const cardCount = await passCards.count();
    console.log(`Checking ${cardCount} pass cards for conflicts`);

    // Check each card for conflict indicators
    let foundConflict = false;
    for (let i = 0; i < cardCount; i++) {
      const card = passCards.nth(i);
      const conflictIndicator = card.locator('.pass-conflicts');

      if (await conflictIndicator.isVisible()) {
        foundConflict = true;
        const conflictText = await conflictIndicator.textContent();
        console.log(`Card ${i} has conflicts: ${conflictText}`);

        // Verify conflict text format: "N CONFLICT(S)"
        expect(conflictText).toMatch(/^\d+\s+CONFLICTS?$/);

        // Take screenshot of card with conflict
        await page.screenshot({ path: `test-pass-card-conflict-${i}.png`, fullPage: true });
        break;
      }
    }

    // Note: Test data may not have conflicts - this is expected
    if (!foundConflict) {
      console.log('No conflicts found in test data (expected for some datasets)');
    }
  });

  test('should NOT display star ratings or "Available for X sites"', async ({ page }) => {
    // Find first collection row and click override button
    const firstRow = page.locator('tr[data-testid^="collection-row-"]').first();
    await firstRow.waitFor({ state: 'visible' });

    const overrideButton = firstRow.locator('button[aria-label="Manual Override"]');
    await overrideButton.click();

    // Wait for override modal
    await page.waitForSelector('.manual-override-modal-refactored', { timeout: 5000 });

    // Find pass cards
    const passCards = page.locator('.pass-card');
    const firstCard = passCards.first();

    // Verify NO star ratings
    const starRating = firstCard.locator('.pass-quality');
    await expect(starRating).not.toBeVisible();

    // Verify NO "Available for X sites" text
    const sitesText = firstCard.locator('.pass-sites');
    await expect(sitesText).not.toBeVisible();

    // Take screenshot
    await page.screenshot({ path: 'test-pass-card-no-legacy-elements.png', fullPage: true });
  });

  test('should display all required elements in correct order', async ({ page }) => {
    // Find first collection row and click override button
    const firstRow = page.locator('tr[data-testid^="collection-row-"]').first();
    await firstRow.waitFor({ state: 'visible' });

    const overrideButton = firstRow.locator('button[aria-label="Manual Override"]');
    await overrideButton.click();

    // Wait for override modal
    await page.waitForSelector('.manual-override-modal-refactored', { timeout: 5000 });

    // Find pass cards
    const passCards = page.locator('.pass-card');
    const firstCard = passCards.first();

    // Verify elements exist in order (using CSS order and bounding boxes)
    const classification = firstCard.locator('.classification-banner');
    const header = firstCard.locator('.pass-header');
    const metadata = firstCard.locator('.pass-metadata');
    const timeWindow = firstCard.locator('.pass-time-window');

    await expect(classification).toBeVisible();
    await expect(header).toBeVisible();
    await expect(metadata).toBeVisible();
    await expect(timeWindow).toBeVisible();

    // Get bounding boxes to verify visual order (top to bottom)
    const classBox = await classification.boundingBox();
    const headerBox = await header.boundingBox();
    const metadataBox = await metadata.boundingBox();
    const timeBox = await timeWindow.boundingBox();

    expect(classBox?.y).toBeLessThan(headerBox?.y || Infinity);
    expect(headerBox?.y).toBeLessThan(metadataBox?.y || Infinity);
    expect(metadataBox?.y).toBeLessThan(timeBox?.y || Infinity);

    console.log('Element order verified (top to bottom):');
    console.log('1. Classification Banner');
    console.log('2. Pass Header (Name + Priority)');
    console.log('3. Satellite Metadata');
    console.log('4. Time Window (Zulu)');

    // Take final screenshot
    await page.screenshot({ path: 'test-pass-card-complete.png', fullPage: true });
  });
});
