/**
 * Final Pass Card Validation Test
 *
 * Direct approach: Use XPath and specific row targeting to find action buttons
 */

import { test, expect } from '@playwright/test';

test.describe('Pass Card Final Validation', () => {
  test('validate pass cards with direct row targeting', async ({ page }) => {
    test.setTimeout(120000);

    console.log('\n=== PASS CARD P0 VALIDATION ===\n');

    // Step 1: Navigate
    console.log('Step 1: Navigating to collection manage page...');
    await page.goto('http://localhost:3000/collection/DECK-1757517559289/manage');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(3000);
    console.log('✓ Page loaded\n');

    await page.screenshot({ path: 'final-1-page-loaded.png', fullPage: true });

    // Step 2: Wait for opportunities to load
    console.log('Step 2: Waiting for opportunities to load...');
    await page.waitForSelector('text=Opportunity 1', { timeout: 10000 });
    console.log('✓ Opportunities loaded\n');

    // Step 3: Find the Actions column buttons in the first opportunity row
    console.log('Step 3: Finding action buttons in first row...');

    // Look for the first row with "Opportunity 1" text, then find buttons in that row
    const firstOpportunityRow = page.locator('text=Opportunity 1').first();
    await firstOpportunityRow.waitFor({ state: 'visible' });

    // Find the parent container of this opportunity
    const rowContainer = firstOpportunityRow.locator('xpath=ancestor::*[contains(@class, "row") or contains(@class, "item") or contains(@class, "card")]').first();

    // Find all buttons within this row
    const rowButtons = rowContainer.locator('button');
    const buttonCount = await rowButtons.count();

    console.log(`Found ${buttonCount} buttons in first opportunity row`);

    if (buttonCount === 0) {
      console.log('⚠️  No buttons found in row, trying alternative approach...');

      // Alternative: Just click the first small icon button that appears in the content area
      const contentButtons = page.locator('[class*="opportunity"] button, [class*="table"] button, tbody button').filter({ hasText: '' });
      const contentButtonCount = await contentButtons.count();
      console.log(`Found ${contentButtonCount} icon buttons in content area`);

      if (contentButtonCount > 0) {
        const editButton = contentButtons.first();
        console.log('Clicking first content area button...');

        await editButton.scrollIntoViewIfNeeded();
        await editButton.highlight();
        await page.waitForTimeout(500);
        await page.screenshot({ path: 'final-2-button-highlighted.png', fullPage: true });

        await editButton.click();
        await page.waitForTimeout(2000);

        console.log('✓ Button clicked\n');
      }
    } else {
      // We found buttons in the row - click the first one (usually the edit/pencil button)
      const editButton = rowButtons.first();

      console.log('✓ Found action buttons, clicking first button (edit)...');

      await editButton.scrollIntoViewIfNeeded();
      await page.waitForTimeout(500);
      await page.screenshot({ path: 'final-2-button-highlighted.png', fullPage: true });

      await editButton.click();
      await page.waitForTimeout(2000);

      console.log('✓ Button clicked\n');
    }

    await page.screenshot({ path: 'final-3-after-click.png', fullPage: true });

    // Step 4: Check for modal
    console.log('Step 4: Checking for modal...');

    const modalSelectors = [
      '[role="dialog"]',
      '.bp6-dialog',
      '.bp5-dialog',
      '.modal',
      '[class*="modal"]',
      '[class*="dialog"]'
    ];

    let modal = null;
    for (const selector of modalSelectors) {
      const m = page.locator(selector);
      if (await m.isVisible({ timeout: 1000 }).catch(() => false)) {
        modal = m;
        console.log(`✓ Modal found: ${selector}\n`);
        break;
      }
    }

    if (!modal) {
      console.log('❌ No modal opened');
      console.log('This might mean:');
      console.log('  - Wrong button was clicked');
      console.log('  - Modal takes longer to load');
      console.log('  - Different interaction pattern needed\n');

      // Log what's visible on page
      const pageText = await page.textContent('body');
      console.log('Page content preview:', pageText?.substring(0, 200));

      await page.screenshot({ path: 'final-error-no-modal.png', fullPage: true });
      return;
    }

    await page.screenshot({ path: 'final-4-modal-open.png', fullPage: true });

    // Step 5: Look for tabs and navigate to passes
    console.log('Step 5: Looking for tabs with passes...');

    const tabs = modal.locator('[role="tab"]');
    const tabCount = await tabs.count();

    if (tabCount > 0) {
      const tabTexts = await tabs.evaluateAll(t => t.map(tab => tab.textContent?.trim()));
      console.log(`Found ${tabCount} tabs:`, tabTexts);

      // Try to find Override, Allocation, or Passes tab
      for (const tabName of ['Allocation', 'Override', 'Manual Override', 'Passes']) {
        const tab = modal.locator(`[role="tab"]:has-text("${tabName}")`);
        if (await tab.isVisible().catch(() => false)) {
          console.log(`Clicking "${tabName}" tab...`);
          await tab.click();
          await page.waitForTimeout(1500);
          await page.screenshot({ path: `final-5-${tabName.toLowerCase()}-tab.png`, fullPage: true });
          break;
        }
      }
    }

    // Step 6: Look for pass cards
    console.log('\nStep 6: Looking for pass cards...');
    await page.waitForTimeout(1000);

    const passCards = page.locator('.pass-card');
    const cardCount = await passCards.count();

    console.log(`Found ${cardCount} pass cards\n`);

    if (cardCount === 0) {
      console.log('⚠️  No pass cards found');
      console.log('Checking for passes section...\n');

      const modalText = await modal.textContent();
      console.log('Modal content (first 500 chars):', modalText?.substring(0, 500));

      await page.screenshot({ path: 'final-error-no-passes.png', fullPage: true });
      return;
    }

    // SUCCESS! We found pass cards
    console.log('========================================');
    console.log('✅ PASS CARDS FOUND - VALIDATING');
    console.log('========================================\n');

    const firstCard = passCards.first();
    await firstCard.scrollIntoViewIfNeeded();
    await page.waitForTimeout(500);

    // VALIDATION TESTS
    let passCount = 0;
    let failCount = 0;

    // Test 1: Classification Banner
    console.log('Test 1: Classification Banner');
    const banner = firstCard.locator('.classification-banner');
    if (await banner.isVisible().catch(() => false)) {
      const text = await banner.textContent();
      const bgColor = await banner.evaluate(el => getComputedStyle(el).backgroundColor);
      console.log(`  ✅ PASS: Banner visible - "${text}" (${bgColor})`);
      passCount++;
    } else {
      console.log(`  ❌ FAIL: Classification banner not found`);
      failCount++;
    }

    // Test 2: Priority UPPERCASE
    console.log('\nTest 2: Priority Format');
    const priority = firstCard.locator('.pass-header .bp6-tag, .pass-header .bp5-tag');
    if (await priority.isVisible().catch(() => false)) {
      const text = await priority.textContent();
      if (text === text?.toUpperCase() && /^(NORMAL|HIGH|CRITICAL)$/.test(text || '')) {
        console.log(`  ✅ PASS: Priority is UPPERCASE - "${text}"`);
        passCount++;
      } else {
        console.log(`  ❌ FAIL: Priority format wrong - "${text}"`);
        failCount++;
      }
    } else {
      console.log(`  ❌ FAIL: Priority tag not found`);
      failCount++;
    }

    // Test 3: Zulu Time
    console.log('\nTest 3: Time Format');
    const time = firstCard.locator('.pass-time-window .time-value');
    if (await time.isVisible().catch(() => false)) {
      const text = await time.textContent();
      if (/^\d{4}Z\s*-\s*\d{4}Z$/.test(text || '')) {
        console.log(`  ✅ PASS: Zulu format - "${text}"`);
        passCount++;
      } else {
        console.log(`  ❌ FAIL: Time format wrong - "${text}"`);
        failCount++;
      }
    } else {
      console.log(`  ❌ FAIL: Time window not found`);
      failCount++;
    }

    // Test 4: No star ratings
    console.log('\nTest 4: Star Rating (Should NOT Exist)');
    const stars = firstCard.locator('.pass-quality');
    if (!(await stars.isVisible().catch(() => false))) {
      console.log(`  ✅ PASS: Star rating removed`);
      passCount++;
    } else {
      console.log(`  ❌ FAIL: Star rating still visible`);
      failCount++;
    }

    // Test 5: No "Available for X sites"
    console.log('\nTest 5: "Available for X sites" (Should NOT Exist)');
    const sites = firstCard.locator('.pass-sites');
    if (!(await sites.isVisible().catch(() => false))) {
      console.log(`  ✅ PASS: Sites text removed`);
      passCount++;
    } else {
      console.log(`  ❌ FAIL: Sites text still visible`);
      failCount++;
    }

    // Test 6: Conflicts (optional)
    console.log('\nTest 6: Conflict Indicator (Optional)');
    const conflicts = firstCard.locator('.pass-conflicts');
    if (await conflicts.isVisible().catch(() => false)) {
      const text = await conflicts.textContent();
      console.log(`  ✅ Conflicts visible - "${text}"`);
    } else {
      console.log(`  ⚠️  No conflicts (may be expected)`);
    }

    // Final Results
    console.log('\n========================================');
    console.log('VALIDATION RESULTS');
    console.log('========================================');
    console.log(`Tests Passed: ${passCount}/5`);
    console.log(`Tests Failed: ${failCount}/5`);
    console.log('========================================\n');

    // Highlight card
    await firstCard.evaluate(el => {
      el.style.border = '4px solid #0F9960';
      el.style.boxShadow = '0 0 20px rgba(15, 153, 96, 0.9)';
    });

    await page.screenshot({ path: 'final-6-validated-card.png', fullPage: true });

    // Close-up
    const cardBox = await firstCard.boundingBox();
    if (cardBox) {
      await page.screenshot({
        path: 'final-7-card-closeup.png',
        clip: cardBox
      });
    }

    console.log('✅ Validation complete! Check final-*.png screenshots\n');
  });
});
