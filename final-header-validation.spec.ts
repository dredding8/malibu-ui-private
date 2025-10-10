/**
 * Final Header Validation - Navigate to Collections and validate header
 */

import { test, expect } from '@playwright/test';

test('Validate OpportunityInfoHeaderEnhanced implementation', async ({ page }) => {
  // Navigate to app
  await page.goto('http://localhost:3000');
  await page.waitForLoadState('networkidle');

  // Screenshot: Initial page
  await page.screenshot({ path: '/Users/damon/malibu/validation-01-initial.png', fullPage: true });
  console.log('✅ Step 1: App loaded');

  // Click "Collections" in top navigation
  await page.click('a:has-text("Collections")');
  await page.waitForTimeout(3000);

  // Screenshot: Collections page
  await page.screenshot({ path: '/Users/damon/malibu/validation-02-collections.png', fullPage: true });
  console.log('✅ Step 2: Navigated to Collections');

  // Look for any table rows or opportunity cards
  const anyRow = await page.locator('tr, .opportunity-card, .bp5-card').count();
  console.log(`Found ${anyRow} potential clickable elements`);

  if (anyRow > 0) {
    // Click first row/card
    await page.locator('tr, .opportunity-card, .bp5-card').first().click();
    await page.waitForTimeout(2000);

    // Screenshot: Modal/Drawer
    await page.screenshot({ path: '/Users/damon/malibu/validation-03-modal.png', fullPage: true });
    console.log('✅ Step 3: Opened modal/drawer');

    // Find the header
    const header = page.locator('.opportunity-info-header-enhanced');
    const headerExists = await header.count() > 0;

    if (headerExists) {
      // Screenshot: Header closeup
      await header.screenshot({ path: '/Users/damon/malibu/validation-04-HEADER.png' });
      console.log('✅ SUCCESS: Header found!');

      // Find priority
      const priorityValue = header.locator('.priority-value');
      const priorityExists = await priorityValue.count() > 0;

      if (priorityExists) {
        const priorityText = await priorityValue.textContent();
        console.log('✅ Priority value:', priorityText);

        // Check styling
        const styles = await priorityValue.evaluate((el) => {
          const computed = window.getComputedStyle(el);
          return {
            fontSize: computed.fontSize,
            fontWeight: computed.fontWeight,
            tagName: el.tagName,
            parentTagName: el.parentElement?.tagName,
            hasTagClass: el.closest('.bp5-tag') !== null
          };
        });

        console.log('Priority styling:', styles);

        if (styles.hasTagClass) {
          console.log('❌ FAIL: Priority is inside a Tag component');
        } else {
          console.log('✅ PASS: Priority is plain number (not in Tag)');
        }

        if (styles.fontSize === '16px' && styles.fontWeight === '600') {
          console.log('✅ PASS: Priority styling matches table (16px, 600)');
        } else {
          console.log(`❌ FAIL: Priority styling incorrect (${styles.fontSize}, ${styles.fontWeight})`);
        }
      } else {
        console.log('❌ Priority value (.priority-value) not found');
      }

      // Check other elements
      const satelliteName = await header.locator('.satellite-name').count();
      const sccTag = await header.locator('.property-item:has-text("SCC") .bp5-tag').count();
      const orbitTag = await header.locator('.property-item:has-text("Orbit") .bp5-tag').count();

      console.log(`Satellite name: ${satelliteName > 0 ? '✅' : '❌'}`);
      console.log(`SCC uses Tag: ${sccTag > 0 ? '✅' : '❌'}`);
      console.log(`Orbit uses Tag: ${orbitTag > 0 ? '✅' : '❌'}`);

    } else {
      console.log('❌ Header (.opportunity-info-header-enhanced) not found');
      console.log('Page might still be using old header component');
    }
  } else {
    console.log('⚠️ No rows/cards found on Collections page');
  }
});
