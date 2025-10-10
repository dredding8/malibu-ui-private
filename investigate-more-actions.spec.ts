import { test } from '@playwright/test';

test('Investigate More Actions dropdown and 153 mystery buttons', async ({ page }) => {
  await page.goto('http://localhost:3000/collection/DECK-1757517559289/manage');
  await page.waitForLoadState('networkidle');
  await page.waitForTimeout(2000);

  console.log('\n' + '='.repeat(80));
  console.log('INVESTIGATION 1: MORE ACTIONS DROPDOWN');
  console.log('='.repeat(80));

  // Find and click More Actions button
  const moreActionsBtn = page.locator('[title="4 more actions"]').first();

  if (await moreActionsBtn.isVisible()) {
    console.log('\n✅ Found "More Actions" button');

    await moreActionsBtn.click();
    await page.waitForTimeout(800);

    // Look for dropdown/popover/menu
    const menu = page.locator('.bp6-menu:visible, .bp5-menu:visible, .bp6-popover-content:visible, .bp5-popover-content:visible').first();

    if (await menu.isVisible()) {
      console.log('\n✅ Dropdown opened');

      // Get all menu items
      const menuItems = await menu.locator('.bp6-menu-item, .bp5-menu-item, button, a').allTextContents();

      console.log('\nMenu Contents:');
      menuItems.forEach((item, i) => {
        if (item.trim()) {
          console.log(`  ${i + 1}. "${item.trim()}"`);
        }
      });

      // Screenshot
      await page.screenshot({
        path: 'more-actions-dropdown.png',
        fullPage: false
      });

      console.log('\n📸 Screenshot: more-actions-dropdown.png');

      // Close menu
      await page.keyboard.press('Escape');
    } else {
      console.log('\n❌ Dropdown did not open');
    }
  } else {
    console.log('\n❌ More Actions button not found');
  }

  await page.waitForTimeout(1000);

  console.log('\n' + '='.repeat(80));
  console.log('INVESTIGATION 2: MYSTERY 153 BUTTONS');
  console.log('='.repeat(80));

  // Get ALL buttons with bounding boxes
  const allButtons = await page.locator('button').evaluateAll(buttons => {
    return buttons.map((btn, index) => {
      const rect = btn.getBoundingClientRect();
      const isVisible = rect.width > 0 && rect.height > 0 &&
                       btn.offsetParent !== null &&
                       window.getComputedStyle(btn).display !== 'none';

      return {
        index,
        isVisible,
        text: (btn as HTMLButtonElement).innerText?.trim() || '',
        title: btn.getAttribute('title') || '',
        ariaLabel: btn.getAttribute('aria-label') || '',
        className: btn.className,
        width: Math.round(rect.width),
        height: Math.round(rect.height),
        x: Math.round(rect.x),
        y: Math.round(rect.y),
        hasIcon: btn.querySelector('svg') !== null
      };
    });
  });

  // Filter to "empty" buttons (no text, no title, no aria-label)
  const mysteryButtons = allButtons.filter(btn =>
    !btn.text && !btn.title && !btn.ariaLabel
  );

  console.log(`\nTotal buttons: ${allButtons.length}`);
  console.log(`Mystery buttons (empty): ${mysteryButtons.length}`);
  console.log(`  - Visible: ${mysteryButtons.filter(b => b.isVisible).length}`);
  console.log(`  - Hidden: ${mysteryButtons.filter(b => !b.isVisible).length}`);

  // Analyze visible mystery buttons
  const visibleMystery = mysteryButtons.filter(b => b.isVisible);

  console.log('\n--- Visible Mystery Buttons Analysis ---');

  // Group by size (likely same button type)
  const sizeGroups = new Map<string, number>();
  visibleMystery.forEach(btn => {
    const sizeKey = `${btn.width}x${btn.height}`;
    sizeGroups.set(sizeKey, (sizeGroups.get(sizeKey) || 0) + 1);
  });

  console.log('\nGrouped by Size:');
  Array.from(sizeGroups.entries())
    .sort((a, b) => b[1] - a[1])
    .forEach(([size, count]) => {
      console.log(`  ${count}x buttons at ${size}px`);
    });

  // Check if they have icons
  const withIcons = visibleMystery.filter(b => b.hasIcon).length;
  console.log(`\nButtons with SVG icons: ${withIcons}/${visibleMystery.length}`);

  // Sample first 5 visible mystery buttons with screenshots
  console.log('\n--- Sampling Mystery Buttons (First 5) ---');

  for (let i = 0; i < Math.min(visibleMystery.length, 5); i++) {
    const btnInfo = visibleMystery[i];
    console.log(`\nButton ${i + 1}:`);
    console.log(`  Position: (${btnInfo.x}, ${btnInfo.y})`);
    console.log(`  Size: ${btnInfo.width}x${btnInfo.height}`);
    console.log(`  Has Icon: ${btnInfo.hasIcon}`);
    console.log(`  Class: ${btnInfo.className}`);

    // Highlight and screenshot
    const btn = page.locator('button').nth(btnInfo.index);

    await btn.evaluate(node => {
      (node as HTMLElement).style.border = '3px solid red';
      (node as HTMLElement).style.boxShadow = '0 0 10px red';
    });

    await page.screenshot({
      path: `mystery-button-${i + 1}.png`,
      fullPage: false
    });

    await btn.evaluate(node => {
      (node as HTMLElement).style.border = '';
      (node as HTMLElement).style.boxShadow = '';
    });

    console.log(`  📸 Screenshot: mystery-button-${i + 1}.png`);
  }

  console.log('\n' + '='.repeat(80));
  console.log('INVESTIGATION 3: TABLE STRUCTURE');
  console.log('='.repeat(80));

  // Find table and analyze action column
  const table = page.locator('.bp6-table-container, .bp5-table-container').first();

  if (await table.isVisible()) {
    console.log('\n✅ Table found');

    // Get first row's action buttons
    const firstRowActions = await table.locator('button').evaluateAll(buttons => {
      return buttons.slice(0, 10).map(btn => ({
        text: (btn as HTMLButtonElement).innerText?.trim() || '(empty)',
        title: btn.getAttribute('title') || '(none)',
        hasIcon: btn.querySelector('svg') !== null,
        iconType: btn.querySelector('svg')?.getAttribute('data-icon') || 'unknown'
      }));
    });

    console.log('\nFirst Row Action Buttons:');
    firstRowActions.forEach((btn, i) => {
      console.log(`  ${i + 1}. Text: "${btn.text}" | Title: "${btn.title}" | Icon: ${btn.iconType}`);
    });

    // Screenshot table
    await page.screenshot({
      path: 'table-with-actions.png',
      clip: await table.boundingBox() || undefined
    });

    console.log('\n📸 Screenshot: table-with-actions.png');
  }

  console.log('\n' + '='.repeat(80));
  console.log('INVESTIGATION COMPLETE');
  console.log('='.repeat(80));
});
