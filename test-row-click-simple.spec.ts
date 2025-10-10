import { test, expect } from '@playwright/test';

test('Click table cell opens Manual Override Modal', async ({ page }) => {
  await page.goto('http://localhost:3000/collection/DECK-1757517559289/manage');
  await page.waitForLoadState('networkidle');
  await page.waitForTimeout(3000);

  console.log('\n=== TEST: Row Click Opens Modal ===\n');

  // Find any cell in the table (click the clickable match status cells)
  const matchCell = page.locator('.match-status-cell.clickable').first();
  const cellExists = await matchCell.count() > 0;

  console.log(`✓ Clickable cell exists: ${cellExists}`);

  if (cellExists) {
    // Click the cell
    console.log('📍 Clicking match status cell...');
    await matchCell.click();
    await page.waitForTimeout(1500);

    // Look for the Manual Override Modal
    const dialog = page.locator('.bp5-dialog, .bp6-dialog');
    const dialogVisible = await dialog.isVisible().catch(() => false);

    console.log(`✓ Dialog visible: ${dialogVisible}`);

    if (dialogVisible) {
      const title = await dialog.locator('.bp5-dialog-header, .bp6-dialog-header').textContent().catch(() => 'No title');
      console.log(`✅ SUCCESS! Modal opened`);
      console.log(`📋 Modal title: ${title}`);

      await page.screenshot({ path: 'modal-success.png' });
    } else {
      console.log('❌ Modal did not open');
      await page.screenshot({ path: 'modal-fail.png', fullPage: true });
    }

    expect(dialogVisible).toBe(true);
  } else {
    console.log('❌ No clickable cells found');
    await page.screenshot({ path: 'no-cells.png', fullPage: true });
    expect(cellExists).toBe(true);
  }
});
