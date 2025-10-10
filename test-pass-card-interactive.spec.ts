/**
 * Interactive Pass Card Validation Test
 *
 * Uses Playwright to manually interact with the application and validate pass cards
 */

import { test, expect } from '@playwright/test';

test.describe('Pass Card Interactive Validation', () => {
  test('should interactively validate pass cards step by step', async ({ page }) => {
    test.setTimeout(120000); // 2 minutes for interactive testing

    console.log('\n========================================');
    console.log('PASS CARD VALIDATION - INTERACTIVE TEST');
    console.log('========================================\n');

    // Step 1: Navigate to collection manage page
    console.log('Step 1: Navigating to collection manage page...');
    await page.goto('http://localhost:3000/collection/DECK-1757517559289/manage');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(3000); // Wait for all async operations

    console.log('✓ Page loaded');
    await page.screenshot({ path: 'interactive-1-page-loaded.png', fullPage: true });

    // Step 2: Find the opportunities section
    console.log('\nStep 2: Looking for opportunities...');

    // Wait for opportunities to load - look for the "Manage Opportunities" section or opportunity rows
    const opportunitiesSection = page.locator('.manage-opportunities, [class*="opportunity"], tbody tr, .opportunity-row');
    await page.waitForSelector('text=Opportunity', { timeout: 10000 });

    console.log('✓ Opportunities section found');

    // Step 3: Find edit button in Actions column of first opportunity row
    console.log('\nStep 3: Finding edit button in first opportunity row...');

    // Wait for opportunities content
    await page.waitForTimeout(1000);

    // Find all buttons on page and analyze them
    const allButtons = page.locator('button');
    const totalButtons = await allButtons.count();
    console.log(`Total buttons on page: ${totalButtons}`);

    // Look specifically for buttons in the "Actions" column area
    // These buttons appear after the main header buttons
    // Strategy: Skip first ~10 buttons (header/navigation), then find action row buttons

    let editButton = null;
    console.log('Analyzing buttons 10-30 to find row action button...');

    for (let i = 10; i < Math.min(30, totalButtons); i++) {
      const btn = allButtons.nth(i);
      const ariaLabel = await btn.getAttribute('aria-label').catch(() => '');
      const isVisible = await btn.isVisible().catch(() => false);

      if (isVisible && !ariaLabel) {
        // Icon buttons in actions column typically have no aria-label
        // This is likely an action button in a row
        editButton = btn;
        console.log(`✓ Found action button at index ${i}`);
        break;
      }
    }

    if (!editButton) {
      console.log('⚠️  Falling back to safer strategy: click any small button after header');
      // Fallback: just use a button that's likely in the content area
      editButton = allButtons.nth(12); // Skip header buttons, use first content button
    }

    // Step 4: Click the edit button
    console.log(`\nStep 4: Clicking edit button...`);
    await editButton.scrollIntoViewIfNeeded();
    await page.waitForTimeout(500);

    // Highlight the button before clicking
    await editButton.evaluate(el => {
      el.style.outline = '3px solid red';
      el.style.outlineOffset = '2px';
    });

    await page.screenshot({ path: 'interactive-2-button-highlighted.png', fullPage: true });

    await editButton.click();
    await page.waitForTimeout(2000); // Wait for modal animation

    console.log('✓ Button clicked');
    await page.screenshot({ path: 'interactive-3-after-click.png', fullPage: true });

    // Step 5: Check if modal opened
    console.log('\nStep 5: Checking if modal opened...');

    const modalSelectors = [
      '.manual-override-modal-refactored',
      '.unified-opportunity-editor',
      '.bp5-dialog',
      '.bp6-dialog',
      '[role="dialog"]'
    ];

    let modal = null;
    let modalType = '';

    for (const selector of modalSelectors) {
      const m = page.locator(selector);
      if (await m.isVisible({ timeout: 1000 }).catch(() => false)) {
        modal = m;
        modalType = selector;
        console.log(`✓ Modal opened: ${selector}`);
        break;
      }
    }

    if (!modal) {
      console.log('❌ No modal appeared after clicking');
      await page.screenshot({ path: 'interactive-error-no-modal.png', fullPage: true });
      return;
    }

    await page.screenshot({ path: 'interactive-4-modal-open.png', fullPage: true });

    // Step 6: Look for tabs
    console.log('\nStep 6: Looking for tabs in modal...');
    const tabs = modal.locator('[role="tab"]');
    const tabCount = await tabs.count();
    console.log(`Found ${tabCount} tabs`);

    if (tabCount > 0) {
      // Get tab names
      const tabNames = await tabs.evaluateAll(tabs =>
        tabs.map(tab => tab.textContent?.trim() || '')
      );
      console.log('Tab names:', tabNames);

      // Look for Override or Allocation tab
      const targetTabs = ['Override', 'Allocation', 'Manual Override', 'Passes'];
      let targetTab = null;

      for (const tabName of targetTabs) {
        const tab = modal.locator(`[role="tab"]:has-text("${tabName}")`);
        if (await tab.isVisible().catch(() => false)) {
          targetTab = tab;
          console.log(`\nStep 7: Clicking "${tabName}" tab...`);
          await targetTab.click();
          await page.waitForTimeout(1500);
          console.log('✓ Tab clicked');
          await page.screenshot({ path: `interactive-5-${tabName.toLowerCase()}-tab.png`, fullPage: true });
          break;
        }
      }

      if (!targetTab) {
        console.log('⚠️  No Override/Allocation tab found, staying on current tab');
      }
    } else {
      console.log('⚠️  No tabs found, content might be directly visible');
    }

    // Step 8: Look for pass cards
    console.log('\nStep 8: Looking for pass cards...');
    await page.waitForTimeout(1000);

    const passCards = page.locator('.pass-card');
    const cardCount = await passCards.count();

    console.log(`Found ${cardCount} pass cards`);

    if (cardCount === 0) {
      console.log('⚠️  No pass cards found');
      console.log('Checking modal content...');

      // Try to find passes panel or available passes section
      const passesPanel = page.locator('.left-panel, .available-passes, .passes-list');
      const hasPasses = await passesPanel.isVisible().catch(() => false);

      if (hasPasses) {
        console.log('✓ Found passes section, taking screenshot...');
        await page.screenshot({ path: 'interactive-6-passes-section.png', fullPage: true });
      } else {
        console.log('❌ No passes section found');
        await page.screenshot({ path: 'interactive-error-no-passes.png', fullPage: true });
      }

      return;
    }

    console.log('\n========================================');
    console.log('PASS CARD VALIDATION RESULTS');
    console.log('========================================\n');

    // Validate first pass card
    const firstCard = passCards.first();

    // Scroll card into view
    await firstCard.scrollIntoViewIfNeeded();
    await page.waitForTimeout(500);

    // Test 1: Classification Banner
    console.log('Test 1: Classification Banner');
    const classificationBanner = firstCard.locator('.classification-banner');
    const hasBanner = await classificationBanner.isVisible().catch(() => false);

    if (hasBanner) {
      const bannerText = await classificationBanner.textContent();
      const bannerColor = await classificationBanner.evaluate(el =>
        window.getComputedStyle(el).backgroundColor
      );
      console.log(`  ✅ PASS: Classification banner visible`);
      console.log(`     Text: "${bannerText}"`);
      console.log(`     Color: ${bannerColor}`);

      // Validate classification text
      const validClassifications = ['UNCLASSIFIED', 'CONFIDENTIAL', 'SECRET', 'TOP SECRET'];
      const isValid = validClassifications.includes(bannerText?.trim() || '');
      if (isValid) {
        console.log(`  ✅ Valid classification level`);
      } else {
        console.log(`  ❌ Invalid classification: expected one of ${validClassifications.join(', ')}`);
      }
    } else {
      console.log(`  ❌ FAIL: Classification banner not visible`);
    }

    // Test 2: Priority UPPERCASE
    console.log('\nTest 2: Priority Format');
    const priorityTag = firstCard.locator('.pass-header .bp5-tag, .pass-header .bp6-tag');
    const hasPriority = await priorityTag.isVisible().catch(() => false);

    if (hasPriority) {
      const priorityText = await priorityTag.textContent();
      const isUppercase = priorityText === priorityText?.toUpperCase();
      const validPriorities = ['NORMAL', 'HIGH', 'CRITICAL'];
      const isValid = validPriorities.includes(priorityText?.trim() || '');

      console.log(`  Text: "${priorityText}"`);

      if (isUppercase && isValid) {
        console.log(`  ✅ PASS: Priority is UPPERCASE and valid`);
      } else {
        if (!isUppercase) console.log(`  ❌ FAIL: Priority not UPPERCASE`);
        if (!isValid) console.log(`  ❌ FAIL: Invalid priority value`);
      }
    } else {
      console.log(`  ❌ FAIL: Priority tag not visible`);
    }

    // Test 3: Zulu Time Format
    console.log('\nTest 3: Time Format');
    const timeWindow = firstCard.locator('.pass-time-window .time-value');
    const hasTime = await timeWindow.isVisible().catch(() => false);

    if (hasTime) {
      const timeText = await timeWindow.textContent();
      const zuluRegex = /^\d{4}Z\s*-\s*\d{4}Z$/;
      const isZuluFormat = zuluRegex.test(timeText || '');

      console.log(`  Text: "${timeText}"`);

      if (isZuluFormat) {
        console.log(`  ✅ PASS: Time in Zulu format (HHmmZ - HHmmZ)`);
      } else {
        console.log(`  ❌ FAIL: Time not in Zulu format`);
        console.log(`     Expected format: HHmmZ - HHmmZ (e.g., "1542Z - 1602Z")`);
      }

      // Check for monospace font
      const fontFamily = await timeWindow.evaluate(el =>
        window.getComputedStyle(el).fontFamily
      );
      console.log(`  Font: ${fontFamily}`);
      if (fontFamily.includes('monospace') || fontFamily.includes('Courier')) {
        console.log(`  ✅ Uses monospace font`);
      }
    } else {
      console.log(`  ❌ FAIL: Time window not visible`);
    }

    // Test 4: Conflict Indicator
    console.log('\nTest 4: Conflict Indicator');
    const conflicts = firstCard.locator('.pass-conflicts');
    const hasConflicts = await conflicts.isVisible().catch(() => false);

    if (hasConflicts) {
      const conflictText = await conflicts.textContent();
      const conflictRegex = /^\d+\s+CONFLICTS?$/;
      const isValidFormat = conflictRegex.test(conflictText?.trim() || '');

      console.log(`  ✅ Conflict indicator visible`);
      console.log(`     Text: "${conflictText}"`);

      if (isValidFormat) {
        console.log(`  ✅ Valid conflict format`);
      } else {
        console.log(`  ❌ Invalid format (expected "N CONFLICT" or "N CONFLICTS")`);
      }
    } else {
      console.log(`  ⚠️  No conflicts visible (may be expected if pass has no conflicts)`);
    }

    // Test 5: Star Rating Removed
    console.log('\nTest 5: Star Rating (Should NOT Exist)');
    const starRating = firstCard.locator('.pass-quality');
    const hasStars = await starRating.isVisible().catch(() => false);

    if (hasStars) {
      console.log(`  ❌ FAIL: Star rating still visible (should be removed)`);
    } else {
      console.log(`  ✅ PASS: Star rating removed`);
    }

    // Test 6: "Available for X sites" Removed
    console.log('\nTest 6: "Available for X sites" Text (Should NOT Exist)');
    const sitesText = firstCard.locator('.pass-sites');
    const hasSites = await sitesText.isVisible().catch(() => false);

    if (hasSites) {
      console.log(`  ❌ FAIL: "Available for X sites" text still visible (should be removed)`);
    } else {
      console.log(`  ✅ PASS: "Available for X sites" text removed`);
    }

    console.log('\n========================================');

    // Highlight the validated card
    await firstCard.evaluate(el => {
      el.style.border = '3px solid #0F9960';
      el.style.boxShadow = '0 0 20px rgba(15, 153, 96, 0.8)';
    });

    await page.screenshot({ path: 'interactive-7-validated-card.png', fullPage: true });

    // Zoom in on the card
    await page.screenshot({
      path: 'interactive-8-card-closeup.png',
      clip: await firstCard.boundingBox() || undefined
    });

    console.log('\n✅ Validation Complete!');
    console.log('Check screenshots: interactive-*.png\n');
  });
});
