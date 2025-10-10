/**
 * Validate Pass Data Display on Test Opportunities Page
 *
 * Click action buttons to open modals and validate pass information
 */

import { test, expect } from '@playwright/test';

test.describe('Validate Pass Data Display', () => {
  test('validate pass information on test opportunities page', async ({ page }) => {
    test.setTimeout(120000);

    console.log('\n========================================');
    console.log('PASS DATA VALIDATION - TEST PAGE');
    console.log('========================================\n');

    // Navigate to test opportunities page
    console.log('Step 1: Navigating to /test-opportunities...');
    await page.goto('http://localhost:3000/test-opportunities');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(2000);

    console.log('✓ Page loaded\n');
    await page.screenshot({ path: 'validate-1-test-page.png', fullPage: true });

    // Step 2: Click on first opportunity's action button
    console.log('Step 2: Looking for action buttons...');

    // Try clicking the pencil/edit icon in the Actions column
    const actionButtons = page.locator('td:last-child button, [class*="actions"] button');
    const buttonCount = await actionButtons.count();

    console.log(`Found ${buttonCount} action buttons`);

    if (buttonCount > 0) {
      console.log('Clicking first action button...');

      const firstButton = actionButtons.first();
      await firstButton.scrollIntoViewIfNeeded();
      await page.waitForTimeout(500);

      await firstButton.click();
      await page.waitForTimeout(2000);

      console.log('✓ Button clicked\n');
      await page.screenshot({ path: 'validate-2-after-click.png', fullPage: true });

      // Step 3: Check for modal
      console.log('Step 3: Checking for modal...');

      const modal = page.locator('[role="dialog"], .bp6-dialog, .bp5-dialog, [class*="modal"]');
      const modalVisible = await modal.isVisible({ timeout: 2000 }).catch(() => false);

      if (modalVisible) {
        console.log('✓ Modal opened\n');
        await page.screenshot({ path: 'validate-3-modal-open.png', fullPage: true });

        // Step 4: Look for pass information
        console.log('========================================');
        console.log('ANALYZING PASS DATA');
        console.log('========================================\n');

        const modalText = await modal.textContent();

        // Check 1: Priority information
        console.log('Check 1: PRIORITY');
        const priorityMatches = modalText?.match(/(CRITICAL|HIGH|MEDIUM|NORMAL|critical|high|medium|normal)/g);
        if (priorityMatches) {
          const uniquePriorities = [...new Set(priorityMatches)];
          console.log(`  Found: ${uniquePriorities.join(', ')}`);

          const allUppercase = uniquePriorities.every(p => p === p.toUpperCase());
          if (allUppercase) {
            console.log(`  ✅ All priorities are UPPERCASE (legacy compliant)`);
          } else {
            console.log(`  ❌ Some priorities are lowercase (NOT legacy compliant)`);
            console.log(`     Expected: CRITICAL, HIGH, MEDIUM, NORMAL`);
          }
        } else {
          console.log(`  ⚠️  No priority information found`);
        }

        // Check 2: Time format
        console.log('\nCheck 2: TIME FORMAT');
        const zuluTimeMatches = modalText?.match(/\d{4}Z/g);
        const localTimeMatches = modalText?.match(/\d{1,2}:\d{2}\s*(AM|PM)/gi);

        if (zuluTimeMatches && zuluTimeMatches.length > 0) {
          console.log(`  ✅ Found Zulu time format: ${zuluTimeMatches.slice(0, 3).join(', ')}`);
          console.log(`     (Legacy compliant: HHmmZ format)`);
        } else if (localTimeMatches && localTimeMatches.length > 0) {
          console.log(`  ❌ Found local time format: ${localTimeMatches.slice(0, 3).join(', ')}`);
          console.log(`     Expected: Zulu format (e.g., "1542Z")`);
        } else {
          console.log(`  ⚠️  No time information found`);
        }

        // Check 3: Classification
        console.log('\nCheck 3: CLASSIFICATION');
        const classMatches = modalText?.match(/(UNCLASSIFIED|CONFIDENTIAL|SECRET|TOP SECRET|S\/\/REL|S\/\/NF)/g);
        if (classMatches) {
          console.log(`  ✅ Found classifications: ${[...new Set(classMatches)].join(', ')}`);
        } else {
          console.log(`  ⚠️  No classification information found`);
        }

        // Check 4: Satellite information
        console.log('\nCheck 4: SATELLITE');
        const satMatches = modalText?.match(/(SAT-\d+|WV-\d+|GOES-\d+)/g);
        if (satMatches) {
          console.log(`  ✅ Found satellites: ${[...new Set(satMatches)].slice(0, 3).join(', ')}`);
        } else {
          console.log(`  ⚠️  No satellite information found`);
        }

        // Check 5: Conflict indicators
        console.log('\nCheck 5: CONFLICTS');
        if (modalText?.includes('CONFLICT')) {
          console.log(`  ✅ Found conflict indicators (UPPERCASE)`);
        } else if (modalText?.includes('conflict')) {
          console.log(`  ⚠️  Found conflict text but lowercase`);
        } else {
          console.log(`  ⚠️  No conflict indicators (may be expected if no conflicts)`);
        }

        // Step 5: Look for pass cards specifically
        console.log('\n========================================');
        console.log('LOOKING FOR PASS CARDS');
        console.log('========================================\n');

        const passCards = modal.locator('.pass-card');
        const cardCount = await passCards.count();

        console.log(`Pass cards with .pass-card class: ${cardCount}`);

        if (cardCount > 0) {
          console.log('\n✅✅✅ FOUND PASS CARDS! ✅✅✅\n');

          const firstCard = passCards.first();
          await firstCard.scrollIntoViewIfNeeded();

          // Detailed validation
          console.log('Validating first pass card:\n');

          // Classification banner
          const banner = firstCard.locator('.classification-banner');
          if (await banner.isVisible().catch(() => false)) {
            const bannerText = await banner.textContent();
            const bannerBg = await banner.evaluate(el => getComputedStyle(el).backgroundColor);
            console.log(`✅ Classification Banner: "${bannerText}"`);
            console.log(`   Color: ${bannerBg}`);
          } else {
            console.log(`❌ Classification Banner: NOT FOUND`);
          }

          // Priority
          const priority = firstCard.locator('.pass-header .bp6-tag, .pass-header .bp5-tag');
          if (await priority.isVisible().catch(() => false)) {
            const priorityText = await priority.textContent();
            const isUppercase = priorityText === priorityText?.toUpperCase();
            console.log(`${isUppercase ? '✅' : '❌'} Priority: "${priorityText}" (${isUppercase ? 'UPPERCASE' : 'lowercase'})`);
          } else {
            console.log(`❌ Priority Tag: NOT FOUND`);
          }

          // Time window
          const time = firstCard.locator('.pass-time-window .time-value');
          if (await time.isVisible().catch(() => false)) {
            const timeText = await time.textContent();
            const isZulu = /^\d{4}Z\s*-\s*\d{4}Z$/.test(timeText || '');
            console.log(`${isZulu ? '✅' : '❌'} Time: "${timeText}" (${isZulu ? 'Zulu format' : 'wrong format'})`);
          } else {
            console.log(`❌ Time Window: NOT FOUND`);
          }

          // Star ratings (should NOT exist)
          const stars = firstCard.locator('.pass-quality');
          const hasStars = await stars.isVisible().catch(() => false);
          console.log(`${!hasStars ? '✅' : '❌'} Star Rating: ${!hasStars ? 'REMOVED (correct)' : 'STILL EXISTS (wrong)'}`);

          // Sites text (should NOT exist)
          const sites = firstCard.locator('.pass-sites');
          const hasSites = await sites.isVisible().catch(() => false);
          console.log(`${!hasSites ? '✅' : '❌'} "Available for X sites": ${!hasSites ? 'REMOVED (correct)' : 'STILL EXISTS (wrong)'}`);

          // Highlight and screenshot
          await firstCard.evaluate(el => {
            el.style.border = '4px solid #0F9960';
            el.style.boxShadow = '0 0 20px rgba(15, 153, 96, 0.9)';
          });

          await page.screenshot({ path: 'validate-4-pass-card-found.png', fullPage: true });

          const cardBox = await firstCard.boundingBox();
          if (cardBox) {
            await page.screenshot({
              path: 'validate-5-pass-card-closeup.png',
              clip: cardBox
            });
          }

          console.log('\n========================================');
          console.log('✅ VALIDATION COMPLETE');
          console.log('========================================\n');

        } else {
          console.log('⚠️  No elements with .pass-card class found');
          console.log('Checking for other pass-related elements...\n');

          // Look for any pass-related content
          const passElements = modal.locator('[class*="pass"], [data-pass]');
          const passElCount = await passElements.count();
          console.log(`Found ${passElCount} elements with "pass" in class/data attributes`);

          if (passElCount > 0) {
            console.log('\nSample element text:');
            const sampleText = await passElements.first().textContent();
            console.log(`"${sampleText?.substring(0, 200)}..."`);
          }

          await page.screenshot({ path: 'validate-no-pass-cards.png', fullPage: true });
        }

      } else {
        console.log('❌ No modal opened after clicking button\n');
        await page.screenshot({ path: 'validate-error-no-modal.png', fullPage: true });
      }
    } else {
      console.log('❌ No action buttons found on page\n');
    }

    console.log('Test complete. Check validate-*.png screenshots.\n');
  });
});
