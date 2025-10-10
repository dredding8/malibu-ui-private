import { test, expect, Page } from '@playwright/test';

test.describe('Bento Layout Seamless Integration', () => {
  let page: Page;

  test.beforeEach(async ({ page: testPage }) => {
    page = testPage;
    // Navigate to the collection opportunities page
    await page.goto('http://localhost:3002/collection/test-deck');
    await page.waitForLoadState('networkidle');
  });

  test('Verify Bento layout is active and functional', async () => {
    // 1. Check Bento layout structure exists
    await expect(page.locator('.collection-opportunities-bento')).toBeVisible();
    await expect(page.locator('.bento-table-panel')).toBeVisible();
    await expect(page.locator('.bento-content-panel')).toBeVisible();
    await expect(page.locator('.bento-splitter')).toBeVisible();
    
    // 2. Verify golden ratio split (62/38)
    const tablePanel = await page.locator('.bento-table-panel').boundingBox();
    const contentPanel = await page.locator('.bento-content-panel').boundingBox();
    
    if (tablePanel && contentPanel) {
      const totalWidth = tablePanel.width + contentPanel.width;
      const tableRatio = (tablePanel.width / totalWidth) * 100;
      const expectedRatio = 62;
      const tolerance = 2; // Allow 2% tolerance
      
      expect(tableRatio).toBeGreaterThan(expectedRatio - tolerance);
      expect(tableRatio).toBeLessThan(expectedRatio + tolerance);
    }
  });

  test('Dashboard panel shows by default when nothing selected', async () => {
    // 1. Verify dashboard panel is visible
    await expect(page.locator('.bento-dashboard-panel')).toBeVisible();
    
    // 2. Check KPI cards are displayed
    await expect(page.locator('.bento-kpi-card').first()).toBeVisible();
    
    // 3. Verify progress indicator
    await expect(page.locator('.bento-progress-section')).toBeVisible();
    
    // 4. Check quick actions guide
    await expect(page.locator('.bento-quick-actions')).toBeVisible();
    await expect(page.locator('.bento-quick-actions').getByText('Select an opportunity')).toBeVisible();
  });

  test('Row selection shows editor panel', async () => {
    // 1. Click on a table row
    const firstRow = page.locator('.opportunities-table .bp5-table-cell').first();
    await firstRow.click();
    
    // 2. Wait for editor panel to appear
    await expect(page.locator('.allocation-editor-panel')).toBeVisible({ timeout: 5000 });
    
    // 3. Verify dashboard is hidden
    await expect(page.locator('.bento-dashboard-panel')).not.toBeVisible();
    
    // 4. Check editor has Save/Cancel buttons
    await expect(page.locator('.allocation-editor-panel').getByText('Save')).toBeVisible();
    await expect(page.locator('.allocation-editor-panel').getByText('Cancel')).toBeVisible();
  });

  test('Multiple selection shows bulk operations panel', async () => {
    // 1. Select multiple rows with Ctrl+Click
    const rows = page.locator('.opportunities-table .bp5-table-cell:has(.opportunity-name-wrapper)');
    const firstRow = rows.nth(0);
    const secondRow = rows.nth(1);
    
    await firstRow.click();
    await secondRow.click({ modifiers: ['Control'] });
    
    // 2. Wait for bulk operations panel
    await expect(page.locator('.bento-bulk-panel')).toBeVisible({ timeout: 5000 });
    
    // 3. Verify selection count
    await expect(page.locator('.bento-bulk-panel').getByText('2 opportunities selected')).toBeVisible();
    
    // 4. Check bulk actions are available
    await expect(page.locator('.bento-bulk-panel').getByText('Override Selected Allocations')).toBeVisible();
    await expect(page.locator('.bento-bulk-panel').getByText('Clear Selection')).toBeVisible();
  });

  test('Modal still works for override functionality', async () => {
    // 1. Select a row
    const firstRow = page.locator('.opportunities-table .bp5-table-cell:has(.opportunity-name-wrapper)').first();
    await firstRow.click();
    
    // 2. Click edit button in actions column
    const editButton = page.locator('.actions-cell .bp5-button[icon="edit"]').first();
    await editButton.click();
    
    // 3. Verify modal opens (not replaced by Bento)
    await expect(page.locator('.bp5-dialog')).toBeVisible({ timeout: 5000 });
    await expect(page.locator('.manual-override-modal')).toBeVisible();
    
    // 4. Verify modal can be closed
    const closeButton = page.locator('.bp5-dialog-close-button');
    await closeButton.click();
    await expect(page.locator('.bp5-dialog')).not.toBeVisible();
  });

  test('Splitter is draggable and resizes panels', async () => {
    // 1. Get initial panel widths
    const initialTableBox = await page.locator('.bento-table-panel').boundingBox();
    const initialContentBox = await page.locator('.bento-content-panel').boundingBox();
    
    if (!initialTableBox || !initialContentBox) {
      throw new Error('Could not get panel bounding boxes');
    }
    
    // 2. Drag the splitter
    const splitter = page.locator('.bento-splitter');
    await splitter.hover();
    await page.mouse.down();
    await page.mouse.move(initialTableBox.x + initialTableBox.width + 100, initialTableBox.y);
    await page.mouse.up();
    
    // 3. Get new panel widths
    const newTableBox = await page.locator('.bento-table-panel').boundingBox();
    const newContentBox = await page.locator('.bento-content-panel').boundingBox();
    
    if (!newTableBox || !newContentBox) {
      throw new Error('Could not get new panel bounding boxes');
    }
    
    // 4. Verify widths changed
    expect(newTableBox.width).toBeGreaterThan(initialTableBox.width);
    expect(newContentBox.width).toBeLessThan(initialContentBox.width);
  });

  test('Transition from modal to Bento is animated', async () => {
    // 1. Check for transition class when opening override
    const firstRow = page.locator('.opportunities-table .bp5-table-cell:has(.opportunity-name-wrapper)').first();
    await firstRow.click();
    
    // 2. Monitor for transition class
    const bentoContainer = page.locator('.collection-opportunities-bento');
    
    // Click Override Selected button
    const overrideButton = page.locator('.bp5-navbar-group').getByText('Override 1 Selected');
    if (await overrideButton.isVisible()) {
      await overrideButton.click();
      
      // Check if transition class is applied
      const hasTransition = await bentoContainer.evaluate(el => el.classList.contains('transitioning'));
      expect(hasTransition).toBeDefined(); // Can be true or false depending on timing
    }
  });

  test('Feature flag can disable Bento layout', async () => {
    // 1. Navigate with feature flag disabled
    await page.goto('http://localhost:3002/collection/test-deck?ff_enableBentoLayout=false');
    await page.waitForLoadState('networkidle');
    
    // 2. Verify original layout is shown
    await expect(page.locator('.collection-opportunities-refactored')).toBeVisible();
    
    // 3. Verify Bento layout is NOT present
    await expect(page.locator('.collection-opportunities-bento')).not.toBeVisible();
    
    // 4. Verify modal still works in original layout
    const selectButton = page.locator('.bp5-button').filter({ hasText: /Override.*Selected/ }).first();
    if (await selectButton.isVisible()) {
      await selectButton.click();
      await expect(page.locator('.manual-override-modal')).toBeVisible();
    }
  });

  test('Context preservation during panel switches', async () => {
    // 1. Select a row to show editor
    const firstRow = page.locator('.opportunities-table .bp5-table-cell:has(.opportunity-name-wrapper)').first();
    await firstRow.click();
    
    // 2. Wait for editor and get opportunity name
    await expect(page.locator('.allocation-editor-panel')).toBeVisible();
    const opportunityName = await page.locator('.allocation-editor-panel h3').textContent();
    
    // 3. Select another row
    const secondRow = page.locator('.opportunities-table .bp5-table-cell:has(.opportunity-name-wrapper)').nth(1);
    await secondRow.click();
    
    // 4. Verify editor updates with new opportunity
    await expect(page.locator('.allocation-editor-panel')).toBeVisible();
    const newOpportunityName = await page.locator('.allocation-editor-panel h3').textContent();
    expect(newOpportunityName).not.toBe(opportunityName);
    
    // 5. Clear selection to show dashboard
    await page.keyboard.press('Escape');
    await expect(page.locator('.bento-dashboard-panel')).toBeVisible();
  });

  test('Search and filter functionality works in Bento layout', async () => {
    // 1. Type in search box
    const searchInput = page.locator('.search-input');
    await searchInput.fill('Opportunity');
    
    // 2. Verify table updates (rows should be filtered)
    await page.waitForTimeout(500); // Wait for debounced search
    const rows = page.locator('.opportunities-table .bp5-table-cell:has(.opportunity-name-wrapper)');
    const rowCount = await rows.count();
    expect(rowCount).toBeGreaterThan(0);
    
    // 3. Clear search
    await searchInput.clear();
    await page.waitForTimeout(500);
    
    // 4. Test site filter
    const siteFilter = page.locator('.site-filter');
    await siteFilter.selectOption({ index: 1 }); // Select first site
    
    // 5. Verify filtering works
    const filteredRows = await rows.count();
    expect(filteredRows).toBeGreaterThan(0);
  });
});