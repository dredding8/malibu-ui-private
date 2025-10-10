import { test } from '@playwright/test';

test('scroll table and capture all columns', async ({ page }) => {
  await page.goto('http://localhost:3000/collection/DECK-1757517559289/manage', { timeout: 60000 });
  await page.waitForLoadState('networkidle');
  await page.waitForTimeout(2000);

  console.log('\n📊 SCROLLING TABLE TO VIEW ALL COLUMNS\n');

  // Take screenshot at starting position
  await page.screenshot({ path: 'columns-position-0-left.png', fullPage: false });
  console.log('✅ Screenshot 1: Left side');

  // Scroll table container to the right
  const scrollDistance = await page.evaluate(() => {
    const containers = [
      document.querySelector('.bp6-table-quadrant-scroll-container'),
      document.querySelector('.bp6-table-container'),
      document.querySelector('.opportunities-table-enhanced')
    ];

    for (const container of containers) {
      if (container) {
        const maxScroll = container.scrollWidth - container.clientWidth;
        container.scrollLeft = maxScroll; // Scroll to far right
        return container.scrollLeft;
      }
    }
    return 0;
  });

  console.log(`   Scrolled ${scrollDistance}px to the right`);

  await page.waitForTimeout(500);
  await page.screenshot({ path: 'columns-position-1-right.png', fullPage: false });
  console.log('✅ Screenshot 2: Right side');

  // Get all visible column names
  const columns = await page.evaluate(() => {
    const headers = document.querySelectorAll('.bp6-table-column-name-text, .bp6-table-column-name');
    return Array.from(headers).map(h => h.textContent?.trim()).filter(Boolean);
  });

  console.log(`\n📋 Unique columns found: ${[...new Set(columns)].length}`);
  console.log('Columns:', [...new Set(columns)].join(', '));

  // Check for specific critical columns
  const hasActions = columns.some(c => c?.includes('Actions'));
  const hasOpportunity = columns.some(c => c?.includes('Opportunity'));
  const hasSiteAllocation = columns.some(c => c?.includes('Site Allocation'));

  console.log(`\n🔍 Critical columns check:`);
  console.log(`   Actions: ${hasActions ? '✅' : '❌'}`);
  console.log(`   Opportunity: ${hasOpportunity ? '✅' : '❌'}`);
  console.log(`   Site Allocation: ${hasSiteAllocation ? '✅' : '❌'}`);

  // Count action buttons in a cell
  const actionButtons = await page.locator('.bp6-table-cell button').count();
  console.log(`\n📊 Total action buttons in table: ${actionButtons}`);

  if (actionButtons > 0) {
    console.log('✅ Action buttons ARE rendering!');
  } else {
    console.log('❌ No action buttons found');
  }
});
