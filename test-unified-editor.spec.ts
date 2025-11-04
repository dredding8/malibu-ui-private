import { test, expect } from '@playwright/test';

test.describe('Unified Editor Manual Testing', () => {
  test('Test Unified Editor changes', async ({ page }) => {
    // Navigate to the application
    await page.goto('http://localhost:3000');

    // Wait for initial load
    await page.waitForLoadState('networkidle');

    // Take a screenshot of the home page
    await page.screenshot({ path: 'screenshots/01-homepage.png', fullPage: true });

    // Try to find and click on any element that might open the Unified Editor
    // Looking for buttons or links that might trigger the editor
    const possibleTriggers = [
      'button:has-text("Override")',
      'button:has-text("Edit")',
      'button:has-text("Modify")',
      '[data-testid*="override"]',
      '[data-testid*="edit"]',
      '.override-button',
      '.edit-button'
    ];

    for (const selector of possibleTriggers) {
      try {
        const element = page.locator(selector).first();
        if (await element.isVisible({ timeout: 2000 })) {
          console.log(`Found trigger element: ${selector}`);
          await page.screenshot({ path: 'screenshots/02-before-click.png', fullPage: true });
          await element.click();
          await page.waitForTimeout(1000);
          break;
        }
      } catch (e) {
        // Continue to next selector
      }
    }

    // Wait for any modal or editor to appear
    await page.waitForTimeout(2000);
    await page.screenshot({ path: 'screenshots/03-after-potential-trigger.png', fullPage: true });

    // Check for the Unified Editor modal/dialog
    const modalSelectors = [
      '.bp5-dialog',
      '.bp5-overlay',
      '[role="dialog"]',
      '.unified-editor',
      '.allocation-tab'
    ];

    for (const selector of modalSelectors) {
      try {
        const modal = page.locator(selector);
        if (await modal.isVisible({ timeout: 2000 })) {
          console.log(`Found modal/editor: ${selector}`);
          await page.screenshot({ path: 'screenshots/04-editor-visible.png', fullPage: true });

          // Look for the Available Passes table
          const availablePassesTable = page.locator('table, .bp5-table, [role="table"]').first();
          if (await availablePassesTable.isVisible()) {
            await page.screenshot({ path: 'screenshots/05-available-passes-table.png' });

            // Check for "Total Duration" column header
            const totalDurationHeader = page.locator('th:has-text("Total Duration"), [role="columnheader"]:has-text("Total Duration")');
            const hasTotalDuration = await totalDurationHeader.count() > 0;
            console.log(`Total Duration column found: ${hasTotalDuration}`);

            // Check for ">" prefix in Duration column
            const durationCells = page.locator('td:has-text(">"), [role="cell"]:has-text(">")');
            const hasDurationPrefix = await durationCells.count() > 0;
            console.log(`Duration cells with ">" prefix found: ${hasDurationPrefix}`);
          }

          // Look for allocated sites details drawer (bottom drawer)
          const drawerSelectors = [
            '.bp5-drawer',
            '[role="complementary"]',
            '.allocated-sites-drawer',
            '.site-details-drawer'
          ];

          // Try to find and click something that opens the drawer
          const siteRow = page.locator('tr:has-text("Site"), [role="row"]:has-text("Site")').first();
          if (await siteRow.isVisible({ timeout: 2000 })) {
            console.log('Found site row, attempting to click');
            await siteRow.click();
            await page.waitForTimeout(1000);
            await page.screenshot({ path: 'screenshots/06-after-site-click.png', fullPage: true });
          }

          // Check if drawer opened
          for (const drawerSelector of drawerSelectors) {
            const drawer = page.locator(drawerSelector);
            if (await drawer.isVisible({ timeout: 2000 })) {
              console.log(`Found drawer: ${drawerSelector}`);
              await page.screenshot({ path: 'screenshots/07-drawer-visible.png', fullPage: true });

              // Look for pass breakdown table in drawer
              const passBreakdownTable = drawer.locator('table, .bp5-table, [role="table"]');
              if (await passBreakdownTable.isVisible()) {
                await page.screenshot({ path: 'screenshots/08-pass-breakdown-table.png' });

                // Check for Start and End time columns
                const timeHeaders = drawer.locator('th:has-text("Start"), th:has-text("End"), [role="columnheader"]:has-text("Start"), [role="columnheader"]:has-text("End")');
                const hasTimeColumns = await timeHeaders.count() >= 2;
                console.log(`Start/End time columns found: ${hasTimeColumns}`);

                // Check for ">" prefix in duration column in drawer
                const drawerDurationCells = drawer.locator('td:has-text(">"), [role="cell"]:has-text(">")');
                const hasDrawerDurationPrefix = await drawerDurationCells.count() > 0;
                console.log(`Drawer duration cells with ">" prefix found: ${hasDrawerDurationPrefix}`);
              }
            }
          }

          break;
        }
      } catch (e) {
        // Continue to next selector
      }
    }

    // Final full page screenshot
    await page.screenshot({ path: 'screenshots/09-final-state.png', fullPage: true });

    // Get page content for inspection
    const content = await page.content();
    console.log('Page structure contains:');
    console.log('- Unified Editor elements:', content.includes('unified') || content.includes('Unified'));
    console.log('- Allocation Tab elements:', content.includes('allocation') || content.includes('Allocation'));
    console.log('- Total Duration text:', content.includes('Total Duration'));
    console.log('- Duration prefix ">":', content.includes('">'));
  });
});
