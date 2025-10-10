/**
 * Direct Collection URL Validation
 * Navigate to /collection/XXX/manage to validate header implementation
 */

import { test, expect } from '@playwright/test';

test('Validate header on direct collection URL', async ({ page }) => {
  // Navigate directly to a collection manage page
  // Using a test collection ID
  const testCollectionId = '550e8400-e29b-41d4-a716-446655440000';
  const url = `http://localhost:3000/collection/${testCollectionId}/manage`;

  console.log('Navigating to:', url);
  await page.goto(url);
  await page.waitForTimeout(5000);

  // Screenshot 1: Full page
  await page.screenshot({
    path: '/Users/damon/malibu/direct-01-full-page.png',
    fullPage: true
  });
  console.log('✅ Screenshot 1: Full page captured');

  // Look for the UnifiedOpportunityEditor (drawer or dialog)
  const editor = page.locator('.bp5-drawer, .bp5-dialog, .unified-opportunity-editor');
  const editorCount = await editor.count();

  console.log(`Found ${editorCount} editor instances`);

  if (editorCount > 0) {
    await editor.first().screenshot({
      path: '/Users/damon/malibu/direct-02-editor.png'
    });
    console.log('✅ Screenshot 2: Editor captured');

    // Look for our header component
    const header = editor.first().locator('.opportunity-info-header-enhanced');
    const headerCount = await header.count();

    if (headerCount > 0) {
      console.log('🎉 SUCCESS: OpportunityInfoHeaderEnhanced found!');

      await header.screenshot({
        path: '/Users/damon/malibu/direct-03-HEADER-FOUND.png'
      });

      // Validate priority display
      const priorityValue = header.locator('.priority-value');
      const priorityCount = await priorityValue.count();

      if (priorityCount > 0) {
        const text = await priorityValue.textContent();
        console.log('✅ Priority value:', text?.trim());

        // Check if priority is inside a Tag (it should NOT be)
        const isInTag = await priorityValue.evaluate((el) => {
          return el.closest('.bp5-tag') !== null;
        });

        if (isInTag) {
          console.log('❌ FAIL: Priority is wrapped in a Tag');
        } else {
          console.log('✅ PASS: Priority is plain number (not in Tag)');
        }

        // Check styling
        const styles = await priorityValue.evaluate((el) => {
          const computed = window.getComputedStyle(el);
          return {
            fontSize: computed.fontSize,
            fontWeight: computed.fontWeight,
            color: computed.color
          };
        });

        console.log('Priority styles:', JSON.stringify(styles, null, 2));

        if (styles.fontSize === '16px') {
          console.log('✅ PASS: Font size = 16px');
        } else {
          console.log(`❌ FAIL: Font size = ${styles.fontSize}`);
        }

        if (styles.fontWeight === '600') {
          console.log('✅ PASS: Font weight = 600');
        } else {
          console.log(`❌ FAIL: Font weight = ${styles.fontWeight}`);
        }

      } else {
        console.log('❌ FAIL: .priority-value not found in header');
      }

      // Check other properties use Tags
      const sccTag = await header.locator('.property-item').filter({ hasText: 'SCC' }).locator('.bp5-tag').count();
      const orbitTag = await header.locator('.property-item').filter({ hasText: 'Orbit' }).locator('.bp5-tag').count();

      console.log(`SCC uses Tag: ${sccTag > 0 ? '✅' : '❌'}`);
      console.log(`Orbit uses Tag: ${orbitTag > 0 ? '✅' : '❌'}`);

      // Check satellite name is H5
      const satelliteName = header.locator('.satellite-name');
      if (await satelliteName.count() > 0) {
        const tagName = await satelliteName.evaluate(el => el.tagName);
        console.log(`Satellite name tag: ${tagName === 'H5' ? '✅ H5' : '❌ ' + tagName}`);
      }

    } else {
      console.log('❌ FAIL: .opportunity-info-header-enhanced not found');
      console.log('The page may still be using the old header component');

      // Check for old header
      const oldHeader = await editor.first().locator('.opportunity-info-header').count();
      if (oldHeader > 0) {
        console.log('⚠️ Found OLD header (.opportunity-info-header) instead');
      }
    }

  } else {
    console.log('⚠️ No editor found on page - looks like modal not open yet');
    console.log('Trying to click table row to open modal...');

    // Look for clickable opportunity rows using data-testid
    const rows = page.locator('[data-testid="opportunity-row"]');
    const rowCount = await rows.count();
    console.log(`Found ${rowCount} opportunity rows`);

    if (rowCount > 0) {
      // Click first row
      await rows.first().click();
      await page.waitForTimeout(3000);

      await page.screenshot({
        path: '/Users/damon/malibu/direct-04-after-row-click.png',
        fullPage: true
      });
      console.log('✅ Clicked first row');

      // Now check for editor/modal again
      const editorAfterClick = page.locator('.bp5-drawer, .bp5-dialog');
      const editorAfterClickCount = await editorAfterClick.count();

      if (editorAfterClickCount > 0) {
        console.log('🎉 Modal opened after row click!');

        await editorAfterClick.first().screenshot({
          path: '/Users/damon/malibu/direct-05-modal-opened.png'
        });

        // Check for header
        const headerAfterClick = editorAfterClick.first().locator('.opportunity-info-header-enhanced');
        const headerAfterClickCount = await headerAfterClick.count();

        if (headerAfterClickCount > 0) {
          console.log('🎉🎉 HEADER FOUND IN MODAL!');

          await headerAfterClick.screenshot({
            path: '/Users/damon/malibu/direct-06-HEADER-SUCCESS.png'
          });

          // Validate priority
          const priorityValue = headerAfterClick.locator('.priority-value');
          if (await priorityValue.count() > 0) {
            const text = await priorityValue.textContent();
            const isInTag = await priorityValue.evaluate(el => el.closest('.bp5-tag') !== null);

            console.log(`Priority value: ${text?.trim()}`);
            console.log(`In Tag: ${isInTag ? '❌ YES (FAIL)' : '✅ NO (PASS)'}`);

            const styles = await priorityValue.evaluate(el => {
              const computed = window.getComputedStyle(el);
              return {
                fontSize: computed.fontSize,
                fontWeight: computed.fontWeight,
                color: computed.color
              };
            });

            console.log(`Font size: ${styles.fontSize === '16px' ? '✅ 16px' : '❌ ' + styles.fontSize}`);
            console.log(`Font weight: ${styles.fontWeight === '600' ? '✅ 600' : '❌ ' + styles.fontWeight}`);
          }
        } else {
          console.log('❌ Header still not found after modal opened');
        }
      } else {
        console.log('❌ Modal did not open after clicking row');
      }
    }
  }
});
