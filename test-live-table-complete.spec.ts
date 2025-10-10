import { test } from '@playwright/test';

test('comprehensive live table inspection', async ({ page }) => {
  console.log('\n========================================');
  console.log('LIVE APPLICATION TABLE INSPECTION');
  console.log('========================================\n');

  await page.goto('http://localhost:3000/collection/DECK-1757517559289/manage');
  await page.waitForLoadState('networkidle');
  await page.waitForTimeout(3000);

  // Take initial screenshot
  await page.screenshot({ path: 'live-table-full.png', fullPage: true });
  console.log('✅ Full page screenshot saved');

  // Get ALL column headers by text content
  const headers = await page.locator('.bp6-table-column-name, .bp6-table-header').allTextContents();
  console.log('\n📋 ALL Column Headers:');
  headers.forEach((header, i) => {
    console.log(`  ${i + 1}. "${header.trim()}"`);
  });

  console.log(`\n📊 Total headers found: ${headers.length}`);

  // Check for Actions column specifically
  const actionsHeader = headers.filter(h => h.includes('Actions'));
  console.log(`\n✅ Actions column header found: ${actionsHeader.length > 0}`);
  if (actionsHeader.length > 0) {
    console.log(`   Text: "${actionsHeader[0]}"`);
  }

  // Check for Override buttons in first visible row
  const firstRow = page.locator('.bp6-table-row').first();
  await firstRow.scrollIntoViewIfNeeded();

  // Get all buttons in first row
  const buttonsInRow = await firstRow.locator('button').count();
  console.log(`\n📊 Buttons in first row: ${buttonsInRow}`);

  if (buttonsInRow > 0) {
    const buttonInfo = await firstRow.locator('button').evaluateAll(buttons =>
      buttons.map(btn => ({
        icon: btn.querySelector('[icon]')?.getAttribute('icon') || btn.className,
        title: btn.getAttribute('title') || btn.getAttribute('aria-label') || '',
        text: btn.textContent?.trim() || ''
      }))
    );

    console.log('\n📋 Buttons found in first row:');
    buttonInfo.forEach((btn, i) => {
      console.log(`  ${i + 1}. Icon: ${btn.icon}, Title: ${btn.title}, Text: ${btn.text}`);
    });
  }

  // Check for override button specifically
  const overrideButtons = await page.locator('button:has([icon="edit"]), button:has-text("Override")').count();
  console.log(`\n📊 Override buttons found: ${overrideButtons}`);

  // Check for workspace buttons
  const workspaceButtons = await page.locator('button:has([icon="flows"]), button:has-text("Workspace")').count();
  console.log(`📊 Workspace buttons found: ${workspaceButtons}`);

  // Scroll table horizontally to see all columns
  console.log('\n🔄 Scrolling table to the right...');
  await page.evaluate(() => {
    const container = document.querySelector('.bp6-table-quadrant-scroll-container, .bp6-table-container');
    if (container) {
      container.scrollLeft = 5000; // Scroll far right
    }
  });

  await page.waitForTimeout(1000);
  await page.screenshot({ path: 'live-table-scrolled-right.png', fullPage: true });
  console.log('✅ Scrolled screenshot saved');

  // Check headers again after scroll
  const headersAfterScroll = await page.locator('.bp6-table-column-name, .bp6-table-header').allTextContents();
  console.log(`\n📊 Headers visible after scroll: ${headersAfterScroll.length}`);

  // Check actual table cells
  const cellCount = await page.locator('.bp6-table-cell').count();
  const rowCount = await page.locator('.bp6-table-row').count();
  console.log(`\n📊 Total cells in table: ${cellCount}`);
  console.log(`📊 Total rows in table: ${rowCount}`);

  if (rowCount > 0 && cellCount > 0) {
    const cellsPerRow = Math.round(cellCount / rowCount);
    console.log(`📊 Approximate cells per row: ${cellsPerRow}`);
  }

  // Take screenshot of first row zoomed in
  const firstRowBox = await firstRow.boundingBox();
  if (firstRowBox) {
    await page.screenshot({
      path: 'live-table-first-row.png',
      clip: {
        x: 0,
        y: firstRowBox.y,
        width: 1280,
        height: Math.min(firstRowBox.height + 100, 200)
      }
    });
    console.log('✅ First row close-up screenshot saved');
  }

  console.log('\n========================================');
  console.log('END LIVE TABLE INSPECTION');
  console.log('========================================\n');
});
