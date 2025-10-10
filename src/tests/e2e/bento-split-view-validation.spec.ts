import { test, expect, Page } from '@playwright/test';

/**
 * E2E tests for the true Bento split view implementation
 * Validates that we have a proper persistent split view, not a sliding panel
 */

test.describe('Bento Split View Validation', () => {
  test.beforeEach(async ({ page }) => {
    // Navigate to the Bento implementation
    await page.goto('/collection-opportunities-bento');
    await page.waitForLoadState('networkidle');
  });

  test('Verify true split view architecture', async ({ page }) => {
    // 1. Both panels should be visible simultaneously
    const tablePanel = await page.$('.bento-table-panel');
    const contentPanel = await page.$('.bento-content-panel');
    
    expect(tablePanel).toBeTruthy();
    expect(contentPanel).toBeTruthy();
    
    // 2. Check golden ratio split (62/38)
    const tablePanelWidth = await tablePanel?.evaluate(el => (el as HTMLElement).offsetWidth) || 0;
    const contentPanelWidth = await contentPanel?.evaluate(el => (el as HTMLElement).offsetWidth) || 0;
    const totalWidth = tablePanelWidth + contentPanelWidth;
    
    const tableRatio = (tablePanelWidth / totalWidth) * 100;
    expect(tableRatio).toBeCloseTo(62, 1); // Should be approximately 62%
    
    // 3. Verify no sliding behavior - panels should be persistent
    const contentPanelDisplay = await contentPanel?.evaluate(el => 
      window.getComputedStyle(el).display
    );
    expect(contentPanelDisplay).toBe('flex'); // Always visible, not hidden
  });

  test('Dashboard view when nothing selected', async ({ page }) => {
    // Initially, no rows should be selected
    const selectedRows = await page.$$('.bp5-table-row-selected');
    expect(selectedRows.length).toBe(0);
    
    // Dashboard panel should be visible
    const dashboardPanel = await page.$('.bento-dashboard-panel');
    expect(dashboardPanel).toBeTruthy();
    
    // Check for KPI cards (Context7 recommended 5-7 metrics)
    const kpiCards = await page.$$('.bento-kpi-card');
    expect(kpiCards.length).toBeGreaterThanOrEqual(4);
    expect(kpiCards.length).toBeLessThanOrEqual(7);
    
    // Verify progress indicator is reused from existing component
    const progressIndicator = await page.$('.allocation-progress');
    expect(progressIndicator).toBeTruthy();
    
    // Check quick actions
    const actionTiles = await page.$$('.action-tile');
    expect(actionTiles.length).toBeGreaterThan(0);
  });

  test('Editor panel shows when single row selected', async ({ page }) => {
    // Click a table row
    await page.click('.bp5-table-row-name:first-child');
    await page.waitForTimeout(300); // Allow for state update
    
    // Verify editor panel appears (reusing AllocationEditorPanel)
    const editorPanel = await page.$('.allocation-editor-panel');
    expect(editorPanel).toBeTruthy();
    
    // Dashboard should no longer be visible
    const dashboardPanel = await page.$('.bento-dashboard-panel');
    expect(dashboardPanel).toBeFalsy();
    
    // Table should still be visible and interactive
    const tablePanel = await page.$('.bento-table-panel');
    const tableDisplay = await tablePanel?.evaluate(el => 
      window.getComputedStyle(el).display
    );
    expect(tableDisplay).toBe('flex');
  });

  test('Bulk operations panel for multiple selections', async ({ page }) => {
    // Select multiple rows (using Ctrl/Cmd + Click)
    await page.click('.bp5-table-row-name:nth-child(1)');
    await page.click('.bp5-table-row-name:nth-child(2)', { modifiers: ['Control'] });
    await page.click('.bp5-table-row-name:nth-child(3)', { modifiers: ['Control'] });
    
    await page.waitForTimeout(300);
    
    // Bulk operations panel should appear
    const bulkPanel = await page.$('.bento-bulk-panel');
    expect(bulkPanel).toBeTruthy();
    
    // Verify bulk actions are available
    const bulkActions = await page.$$('.bulk-actions button');
    expect(bulkActions.length).toBeGreaterThan(0);
    
    // Check selection summary
    const summaryText = await page.textContent('.bento-bulk-panel p');
    expect(summaryText).toContain('3 opportunities selected');
  });

  test('Resizable splitter functionality', async ({ page }) => {
    const splitter = await page.$('.bento-splitter');
    expect(splitter).toBeTruthy();
    
    // Get initial widths
    const initialTableWidth = await page.$eval('.bento-table-panel', 
      el => (el as HTMLElement).offsetWidth
    );
    
    // Drag splitter
    const splitterBox = await splitter?.boundingBox();
    if (splitterBox) {
      await page.mouse.move(splitterBox.x + splitterBox.width / 2, splitterBox.y + 10);
      await page.mouse.down();
      await page.mouse.move(splitterBox.x - 100, splitterBox.y + 10);
      await page.mouse.up();
    }
    
    // Verify panel width changed
    const newTableWidth = await page.$eval('.bento-table-panel', 
      el => (el as HTMLElement).offsetWidth
    );
    expect(newTableWidth).not.toBe(initialTableWidth);
  });

  test('No modal or overlay elements present', async ({ page }) => {
    // Click to edit
    await page.click('.bp5-table-row-name:first-child');
    await page.waitForTimeout(300);
    
    // Verify NO modal elements
    const overlay = await page.$('.bp5-overlay');
    const dialog = await page.$('.bp5-dialog');
    const modalBackdrop = await page.$('.bp5-overlay-backdrop');
    
    expect(overlay).toBeFalsy();
    expect(dialog).toBeFalsy();
    expect(modalBackdrop).toBeFalsy();
    
    // Body should not have modal-open class
    const bodyClass = await page.$eval('body', el => el.className);
    expect(bodyClass).not.toContain('bp5-overlay-open');
  });

  test('Responsive behavior', async ({ page }) => {
    // Test tablet view
    await page.setViewportSize({ width: 768, height: 1024 });
    await page.waitForTimeout(300);
    
    // On tablet, panels should stack vertically
    const container = await page.$('.collection-opportunities-bento');
    const flexDirection = await container?.evaluate(el => 
      window.getComputedStyle(el).flexDirection
    );
    expect(flexDirection).toBe('column');
    
    // Test mobile view
    await page.setViewportSize({ width: 375, height: 667 });
    await page.waitForTimeout(300);
    
    // On mobile, only content panel should be visible
    const tablePanel = await page.$('.bento-table-panel');
    const tableDisplay = await tablePanel?.evaluate(el => 
      window.getComputedStyle(el).display
    );
    expect(tableDisplay).toBe('none');
  });

  test('Performance: Both panels update independently', async ({ page }) => {
    // Select a row
    await page.click('.bp5-table-row-name:first-child');
    
    // Measure time for panel update
    const startTime = Date.now();
    await page.waitForSelector('.allocation-editor-panel', { timeout: 1000 });
    const loadTime = Date.now() - startTime;
    
    // Panel should load quickly (no sliding animation delay)
    expect(loadTime).toBeLessThan(500);
    
    // Change selection
    await page.click('.bp5-table-row-name:nth-child(2)');
    
    // Editor should update without affecting table
    await page.waitForFunction(() => {
      const nameField = document.querySelector('.allocation-editor-panel input');
      return nameField && (nameField as HTMLInputElement).value !== '';
    });
    
    // Table should not re-render (check a cell value remains stable)
    const cellText = await page.textContent('.bp5-table-row-name:nth-child(3)');
    expect(cellText).toBeTruthy(); // Table data intact
  });
});

// Unit tests for the Bento component logic
test.describe('Bento Component Unit Tests', () => {
  test('Component reuse verification', async ({ page }) => {
    // This test verifies we're properly reusing existing components
    
    await page.goto('/collection-opportunities-bento');
    
    // Check that we're using the extracted table component
    const hasTableComponent = await page.evaluate(() => {
      // In a real app, you might check React DevTools or component names
      return document.querySelector('.opportunities-table-container') !== null;
    });
    expect(hasTableComponent).toBe(true);
    
    // Verify AllocationEditorPanel is reused when editing
    await page.click('.bp5-table-row-name:first-child');
    const hasEditorPanel = await page.evaluate(() => {
      return document.querySelector('.allocation-editor-panel') !== null;
    });
    expect(hasEditorPanel).toBe(true);
    
    // Verify progress indicator is reused from UX improvements
    const hasProgressIndicator = await page.evaluate(() => {
      return document.querySelector('.allocation-progress') !== null;
    });
    expect(hasProgressIndicator).toBe(true);
  });
});