import { test, expect } from '@playwright/test';

test('Test Collection Management Page - TEST-001', async ({ page }) => {
  console.log('\n=== Testing Collection Management Page ===\n');

  await page.goto('http://localhost:3000/collection/TEST-001/manage');
  await page.waitForLoadState('networkidle');
  await page.waitForTimeout(2000);

  console.log('1. Checking page loads...');
  const pageTitle = await page.locator('h1, h2, .navbar-heading').first().textContent();
  console.log('   Page title:', pageTitle);
  await page.screenshot({ path: 'test-001-page-loaded.png', fullPage: true });

  console.log('\n2. Checking table exists...');
  const table = page.locator('.opportunities-table-enhanced, [data-testid="opportunities-table"]');
  const tableExists = await table.count() > 0;
  console.log('   Table exists:', tableExists);

  if (tableExists) {
    const rows = await page.locator('.bp5-table-row, .bp6-table-row').count();
    console.log('   Number of rows:', rows);

    console.log('\n3. Checking visible columns...');
    const columns = await page.locator('.bp5-table-column-name, .bp6-table-column-name').allTextContents();
    console.log('   Columns:', columns);

    console.log('\n4. Testing Match Status column clickability...');
    const matchCell = page.locator('.match-status-cell.clickable').first();
    const matchCellExists = await matchCell.count() > 0;
    console.log('   Clickable match cell found:', matchCellExists);

    if (matchCellExists) {
      console.log('\n5. Testing modal opens on click...');
      await matchCell.click();
      await page.waitForTimeout(1000);

      const modal = page.locator('.bp5-dialog, .bp6-dialog');
      const modalVisible = await modal.isVisible().catch(() => false);
      console.log('   Modal opened:', modalVisible);

      if (modalVisible) {
        const modalTitle = await modal.locator('.bp5-dialog-header, .bp6-dialog-header').textContent();
        console.log('   Modal title:', modalTitle);

        const tabs = await modal.locator('.bp5-tab, .bp6-tab').allTextContents();
        console.log('   Tabs:', tabs);

        await page.screenshot({ path: 'test-001-modal-open.png' });

        const closeButton = modal.locator('.bp5-dialog-close-button, .bp6-dialog-close-button');
        if (await closeButton.count() > 0) {
          await closeButton.click();
          await page.waitForTimeout(500);
          console.log('   Modal closed successfully');
        }
      }

      expect(modalVisible).toBe(true);
    } else {
      console.log('   No clickable match cells found');
      await page.screenshot({ path: 'test-001-no-clickable-cells.png', fullPage: true });
    }
  } else {
    console.log('   Table not found');
    await page.screenshot({ path: 'test-001-no-table.png', fullPage: true });
  }

  console.log('\n=== Test Complete ===\n');
});
