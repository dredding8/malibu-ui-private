/**
 * Simple Live Pass Card Validation
 *
 * Directly navigates to the known collection deck and validates pass cards
 */

import { test, expect } from '@playwright/test';

test.describe('Pass Card Live Validation - Direct', () => {
  test('should validate pass cards on collection manage page', async ({ page }) => {
    // Navigate directly to the known collection deck
    await page.goto('http://localhost:3000/collection/DECK-1757517559289/manage');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(2000); // Wait for any async loading

    console.log('=== Collection Manage Page Loaded ===');
    await page.screenshot({ path: 'pass-card-live-1-manage-page.png', fullPage: true });

    // Look for override buttons
    const overrideButtons = page.locator('button:has-text("Override"), button[aria-label*="Override"], button[title*="Override"]');
    const buttonCount = await overrideButtons.count();
    console.log(`Found ${buttonCount} override buttons`);

    if (buttonCount === 0) {
      // Try looking in a table
      const tableButtons = page.locator('table button, tr button');
      const tableButtonCount = await tableButtons.count();
      console.log(`Found ${tableButtonCount} buttons in table`);

      if (tableButtonCount > 0) {
        // Look for button with specific icon or text
        const possibleButtons = await tableButtons.evaluateAll(buttons =>
          buttons.map((btn, idx) => ({
            index: idx,
            text: btn.textContent?.trim() || '',
            ariaLabel: btn.getAttribute('aria-label') || '',
            title: btn.getAttribute('title') || ''
          }))
        );

        console.log('Available buttons:', JSON.stringify(possibleButtons, null, 2));

        // Try clicking first button with icon
        const iconButton = page.locator('table button').first();
        console.log('Clicking first table button...');
        await iconButton.click({ timeout: 5000 });
        await page.waitForTimeout(2000);
      }
    } else {
      console.log('Clicking first override button...');
      await overrideButtons.first().click({ timeout: 5000 });
      await page.waitForTimeout(2000);
    }

    console.log('=== After Button Click ===');
    await page.screenshot({ path: 'pass-card-live-2-after-click.png', fullPage: true });

    // Check for modal
    const modal = page.locator('.manual-override-modal-refactored, .bp5-dialog, .bp6-dialog');
    const modalVisible = await modal.isVisible().catch(() => false);
    console.log(`Modal visible: ${modalVisible}`);

    if (modalVisible) {
      console.log('=== Modal Opened ===');

      // Check for tabs - might need to click Allocation tab
      const tabs = page.locator('div[role="tab"]');
      const tabCount = await tabs.count();
      console.log(`Found ${tabCount} tabs`);

      if (tabCount > 0) {
        const tabTexts = await tabs.evaluateAll(tabs =>
          tabs.map(tab => tab.textContent?.trim())
        );
        console.log('Tabs:', tabTexts);

        // Click Allocation tab if it exists
        const allocationTab = page.locator('div[role="tab"]:has-text("Allocation")');
        if (await allocationTab.isVisible().catch(() => false)) {
          console.log('Clicking Allocation tab...');
          await allocationTab.click();
          await page.waitForTimeout(1000);
        }
      }

      await page.screenshot({ path: 'pass-card-live-3-modal-content.png', fullPage: true });

      // Look for pass cards
      const passCards = page.locator('.pass-card');
      const cardCount = await passCards.count();
      console.log(`\nFound ${cardCount} pass cards\n`);

      if (cardCount > 0) {
        console.log('=== PASS CARD VALIDATION ===\n');
        const firstCard = passCards.first();

        // 1. Classification Banner
        const classificationBanner = firstCard.locator('.classification-banner');
        const hasBanner = await classificationBanner.isVisible().catch(() => false);
        console.log(`✓ Classification Banner: ${hasBanner ? '✅ PRESENT' : '❌ MISSING'}`);

        if (hasBanner) {
          const bannerText = await classificationBanner.textContent();
          console.log(`  └─ Text: "${bannerText}"`);

          // Check if it's a valid classification
          const validClassifications = ['UNCLASSIFIED', 'CONFIDENTIAL', 'SECRET', 'TOP SECRET'];
          const isValid = validClassifications.includes(bannerText?.trim() || '');
          console.log(`  └─ Valid: ${isValid ? '✅' : '❌'}`);
        }

        // 2. Priority (UPPERCASE)
        const priorityTag = firstCard.locator('.pass-header .bp5-tag, .pass-header .bp6-tag');
        const hasPriority = await priorityTag.isVisible().catch(() => false);
        console.log(`\n✓ Priority Tag: ${hasPriority ? '✅ PRESENT' : '❌ MISSING'}`);

        if (hasPriority) {
          const priorityText = await priorityTag.textContent();
          console.log(`  └─ Text: "${priorityText}"`);

          const isUppercase = priorityText === priorityText?.toUpperCase();
          console.log(`  └─ Uppercase: ${isUppercase ? '✅ YES' : '❌ NO'}`);

          const validPriorities = ['NORMAL', 'HIGH', 'CRITICAL'];
          const isValid = validPriorities.includes(priorityText?.trim() || '');
          console.log(`  └─ Valid: ${isValid ? '✅' : '❌'}`);
        }

        // 3. Time Window (Zulu Format)
        const timeWindow = firstCard.locator('.pass-time-window .time-value');
        const hasTime = await timeWindow.isVisible().catch(() => false);
        console.log(`\n✓ Time Window: ${hasTime ? '✅ PRESENT' : '❌ MISSING'}`);

        if (hasTime) {
          const timeText = await timeWindow.textContent();
          console.log(`  └─ Text: "${timeText}"`);

          const isZuluFormat = /^\d{4}Z\s*-\s*\d{4}Z$/.test(timeText || '');
          console.log(`  └─ Zulu Format (HHmmZ): ${isZuluFormat ? '✅ YES' : '❌ NO'}`);
        }

        // 4. Conflict Indicator
        const conflicts = firstCard.locator('.pass-conflicts');
        const hasConflicts = await conflicts.isVisible().catch(() => false);
        console.log(`\n✓ Conflict Indicator: ${hasConflicts ? '✅ PRESENT' : '⚠️  NONE (may be expected)'}`);

        if (hasConflicts) {
          const conflictText = await conflicts.textContent();
          console.log(`  └─ Text: "${conflictText}"`);

          const validFormat = /^\d+\s+CONFLICTS?$/.test(conflictText?.trim() || '');
          console.log(`  └─ Valid Format: ${validFormat ? '✅' : '❌'}`);
        }

        // 5. Star Rating (should NOT exist)
        const starRating = firstCard.locator('.pass-quality');
        const hasStars = await starRating.isVisible().catch(() => false);
        console.log(`\n✓ Star Rating Removed: ${!hasStars ? '✅ YES (correct)' : '❌ STILL EXISTS'}`);

        // 6. "Available for X sites" (should NOT exist)
        const sitesText = firstCard.locator('.pass-sites');
        const hasSites = await sitesText.isVisible().catch(() => false);
        console.log(`✓ "Available for X sites" Removed: ${!hasSites ? '✅ YES (correct)' : '❌ STILL EXISTS'}`);

        console.log('\n=== VALIDATION COMPLETE ===\n');

        // Highlight first card for screenshot
        await firstCard.evaluate(el => {
          el.style.border = '3px solid #0F9960';
          el.style.boxShadow = '0 0 15px rgba(15, 153, 96, 0.6)';
        });

        await page.screenshot({ path: 'pass-card-live-4-validated-card.png', fullPage: true });

        // Zoom in on the card
        await firstCard.scrollIntoViewIfNeeded();
        await page.screenshot({ path: 'pass-card-live-5-card-closeup.png' });

      } else {
        console.log('⚠️  No pass cards found in modal');

        // Debug: Show modal content
        const modalContent = await modal.textContent();
        console.log('Modal content preview:', modalContent?.substring(0, 500));
      }
    } else {
      console.log('⚠️  Modal did not open');
    }

    console.log('\n=== Test Complete ===');
  });
});
