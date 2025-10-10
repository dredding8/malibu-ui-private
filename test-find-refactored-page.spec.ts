/**
 * Find Collection Opportunities Refactored Page
 *
 * This page might use the ManualOverrideModalRefactored with actual pass cards
 */

import { test } from '@playwright/test';

test.describe('Find Refactored Collection Opportunities Page', () => {
  test('try different routes to find pass cards', async ({ page }) => {
    test.setTimeout(120000);

    console.log('\n========================================');
    console.log('SEARCHING FOR PASS CARDS');
    console.log('========================================\n');

    const routesToTry = [
      '/opportunities',
      '/collection-opportunities',
      '/collections-refactored',
      '/opportunities-refactored',
      '/test-opportunities',
      '/opportunities/DECK-1757517559289',
      '/collection/DECK-1757517559289/opportunities',
      '/decks/DECK-1757517559289',
      '/decks'
    ];

    for (const route of routesToTry) {
      console.log(`\nTrying route: ${route}`);

      await page.goto(`http://localhost:3000${route}`);
      await page.waitForLoadState('networkidle');
      await page.waitForTimeout(2000);

      // Check if page loaded successfully (not 404)
      const pageTitle = await page.title();
      const bodyText = await page.textContent('body');

      if (bodyText?.includes('404') || bodyText?.includes('Not Found')) {
        console.log('  ❌ 404 - Page not found');
        continue;
      }

      console.log(`  ✓ Page loaded: "${pageTitle}"`);

      // Take screenshot
      await page.screenshot({ path: `route-${route.replace(/\//g, '-')}.png`, fullPage: true });

      // Look for pass-related content
      const hasPassContent = bodyText?.includes('pass') || bodyText?.includes('Pass');
      const hasOpportunityContent = bodyText?.includes('opportunity') || bodyText?.includes('Opportunity');

      console.log(`  Pass content: ${hasPassContent ? '✓' : '❌'}`);
      console.log(`  Opportunity content: ${hasOpportunityContent ? '✓' : '❌'}`);

      // Look for buttons that might open pass modal
      const buttons = page.locator('button');
      const buttonCount = await buttons.count();
      console.log(`  Buttons found: ${buttonCount}`);

      // Look for "Manual Override" or "Allocation" text
      if (bodyText?.includes('Manual Override') || bodyText?.includes('Allocation')) {
        console.log('  ✅ FOUND: Manual Override/Allocation content!');

        // Try to find and click button
        const manualOverrideBtn = page.locator('button:has-text("Manual Override"), button:has-text("Override")');
        const overrideBtnCount = await manualOverrideBtn.count();

        if (overrideBtnCount > 0) {
          console.log(`  Found ${overrideBtnCount} override buttons, clicking first...`);

          await manualOverrideBtn.first().click();
          await page.waitForTimeout(2000);

          await page.screenshot({ path: `route-${route.replace(/\//g, '-')}-modal.png`, fullPage: true });

          // Check for pass cards
          const passCards = page.locator('.pass-card');
          const cardCount = await passCards.count();

          if (cardCount > 0) {
            console.log(`  ✅✅✅ FOUND ${cardCount} PASS CARDS! ✅✅✅`);

            // Validate first pass card
            const firstCard = passCards.first();

            const hasBanner = await firstCard.locator('.classification-banner').isVisible().catch(() => false);
            const hasPriority = await firstCard.locator('.pass-header .bp6-tag').isVisible().catch(() => false);
            const hasTime = await firstCard.locator('.pass-time-window').isVisible().catch(() => false);

            console.log(`\n  VALIDATION:`);
            console.log(`    Classification Banner: ${hasBanner ? '✅' : '❌'}`);
            console.log(`    Priority Tag: ${hasPriority ? '✅' : '❌'}`);
            console.log(`    Time Window: ${hasTime ? '✅' : '❌'}`);

            // Take detailed screenshot
            await firstCard.evaluate(el => {
              el.style.border = '4px solid #0F9960';
              el.style.boxShadow = '0 0 20px rgba(15, 153, 96, 0.9)';
            });

            await page.screenshot({ path: 'FOUND-pass-cards-validated.png', fullPage: true });

            console.log(`\n✅✅✅ SUCCESS! Pass cards found and validated! ✅✅✅\n`);
            return; // Exit test on success
          } else {
            console.log(`  ⚠️  Modal opened but no pass cards found`);
          }
        }
      }
    }

    console.log('\n========================================');
    console.log('Tried all routes. Check screenshots.');
    console.log('========================================\n');
  });
});
