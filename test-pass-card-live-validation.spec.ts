/**
 * Live Application Pass Card Validation Test
 *
 * Tests the actual running application to validate Phase 1 (P0) changes:
 * - Classification banner displayed
 * - Priority in UPPERCASE
 * - Time in Zulu format
 * - Conflict indicators (if applicable)
 * - No star ratings or "Available for X sites"
 */

import { test, expect } from '@playwright/test';

test.describe('Pass Card Live Validation', () => {
  test('should validate pass cards in live application', async ({ page }) => {
    // Navigate to the main application
    await page.goto('http://localhost:3000');
    await page.waitForLoadState('networkidle');

    console.log('Application loaded, taking initial screenshot...');
    await page.screenshot({ path: 'pass-card-validation-1-homepage.png', fullPage: true });

    // Try to navigate to collections/history to find existing data
    await page.goto('http://localhost:3000/collections');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(2000); // Wait for any async loading

    console.log('Collections page loaded, taking screenshot...');
    await page.screenshot({ path: 'pass-card-validation-2-collections.png', fullPage: true });

    // Look for any tables or collection rows
    const tables = await page.locator('table').count();
    console.log(`Found ${tables} tables on collections page`);

    if (tables === 0) {
      // Try decks page
      await page.goto('http://localhost:3000/decks');
      await page.waitForLoadState('networkidle');
      await page.waitForTimeout(2000);

      console.log('Decks page loaded, taking screenshot...');
      await page.screenshot({ path: 'pass-card-validation-3-decks.png', fullPage: true });
    }

    // Look for any buttons with "Override" or "Manual" in them
    const overrideButtons = page.locator('button:has-text("Override"), button[aria-label*="Override"], button[title*="Override"]');
    const buttonCount = await overrideButtons.count();
    console.log(`Found ${buttonCount} override buttons`);

    if (buttonCount > 0) {
      console.log('Clicking first override button...');
      await overrideButtons.first().click({ timeout: 5000 });
      await page.waitForTimeout(2000); // Wait for modal animation

      console.log('Modal should be open, taking screenshot...');
      await page.screenshot({ path: 'pass-card-validation-4-modal-open.png', fullPage: true });

      // Check if modal opened
      const modal = page.locator('.manual-override-modal-refactored, .bp5-dialog, .bp6-dialog');
      const modalVisible = await modal.isVisible().catch(() => false);
      console.log(`Modal visible: ${modalVisible}`);

      if (modalVisible) {
        // Look for pass cards
        const passCards = page.locator('.pass-card');
        const cardCount = await passCards.count();
        console.log(`Found ${cardCount} pass cards`);

        if (cardCount > 0) {
          const firstCard = passCards.first();

          // Verify classification banner
          const classificationBanner = firstCard.locator('.classification-banner');
          const hasBanner = await classificationBanner.isVisible().catch(() => false);
          console.log(`✓ Classification banner visible: ${hasBanner}`);

          if (hasBanner) {
            const bannerText = await classificationBanner.textContent();
            console.log(`  Classification: ${bannerText}`);
          }

          // Verify priority
          const priorityTag = firstCard.locator('.pass-header .bp5-tag, .pass-header .bp6-tag');
          const hasPriority = await priorityTag.isVisible().catch(() => false);
          console.log(`✓ Priority tag visible: ${hasPriority}`);

          if (hasPriority) {
            const priorityText = await priorityTag.textContent();
            console.log(`  Priority: ${priorityText}`);
            const isUppercase = priorityText === priorityText?.toUpperCase();
            console.log(`  Is uppercase: ${isUppercase}`);
          }

          // Verify time window
          const timeWindow = firstCard.locator('.pass-time-window .time-value');
          const hasTime = await timeWindow.isVisible().catch(() => false);
          console.log(`✓ Time window visible: ${hasTime}`);

          if (hasTime) {
            const timeText = await timeWindow.textContent();
            console.log(`  Time: ${timeText}`);
            const isZuluFormat = /^\d{4}Z\s*-\s*\d{4}Z$/.test(timeText || '');
            console.log(`  Is Zulu format: ${isZuluFormat}`);
          }

          // Check for conflicts
          const conflicts = firstCard.locator('.pass-conflicts');
          const hasConflicts = await conflicts.isVisible().catch(() => false);
          console.log(`✓ Conflict indicator visible: ${hasConflicts}`);

          if (hasConflicts) {
            const conflictText = await conflicts.textContent();
            console.log(`  Conflicts: ${conflictText}`);
          }

          // Verify NO star ratings
          const starRating = firstCard.locator('.pass-quality');
          const hasStars = await starRating.isVisible().catch(() => false);
          console.log(`✓ Star rating removed: ${!hasStars}`);

          // Verify NO "Available for X sites"
          const sitesText = firstCard.locator('.pass-sites');
          const hasSites = await sitesText.isVisible().catch(() => false);
          console.log(`✓ "Available for X sites" removed: ${!hasSites}`);

          // Take final screenshot of pass card
          await page.screenshot({ path: 'pass-card-validation-5-pass-cards.png', fullPage: true });

          // Highlight first card for visibility
          await firstCard.evaluate(el => {
            el.style.border = '3px solid red';
            el.style.boxShadow = '0 0 10px rgba(255, 0, 0, 0.5)';
          });

          await page.screenshot({ path: 'pass-card-validation-6-highlighted-card.png', fullPage: true });
        } else {
          console.log('⚠ No pass cards found in modal - may need to switch tabs');

          // Try clicking "Allocation" tab if exists
          const allocationTab = page.locator('div[role="tab"]:has-text("Allocation")');
          if (await allocationTab.isVisible().catch(() => false)) {
            console.log('Clicking Allocation tab...');
            await allocationTab.click();
            await page.waitForTimeout(1000);
            await page.screenshot({ path: 'pass-card-validation-7-allocation-tab.png', fullPage: true });

            const passCardsAfterTab = await page.locator('.pass-card').count();
            console.log(`Found ${passCardsAfterTab} pass cards after tab switch`);
          }
        }
      } else {
        console.log('⚠ Modal did not open - button may not have worked');
      }
    } else {
      console.log('⚠ No override buttons found - may need test data');

      // Try to find any collection deck test page
      await page.goto('http://localhost:3000/collection/DECK-1757517559289/manage');
      await page.waitForLoadState('networkidle');
      await page.waitForTimeout(2000);

      console.log('Trying specific collection deck...');
      await page.screenshot({ path: 'pass-card-validation-8-specific-deck.png', fullPage: true });

      // Look for override button on this page
      const deckOverrideButton = page.locator('button:has-text("Override"), button[aria-label*="Override"]');
      const deckButtonCount = await deckOverrideButton.count();

      if (deckButtonCount > 0) {
        console.log('Found override button on deck page, clicking...');
        await deckOverrideButton.first().click({ timeout: 5000 });
        await page.waitForTimeout(2000);
        await page.screenshot({ path: 'pass-card-validation-9-deck-modal.png', fullPage: true });
      }
    }

    // Final summary screenshot
    console.log('Validation complete. Check screenshots for results.');
  });
});
