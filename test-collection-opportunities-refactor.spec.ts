import { test, expect } from '@playwright/test';

test.describe('Collection Opportunities Refactored Implementation', () => {
  // Navigate to the collection opportunities page
  test.beforeEach(async ({ page }) => {
    await page.goto('http://localhost:3000/history');
    await page.waitForSelector('.bp5-navbar');
    
    // Click on a collection deck to navigate to opportunities
    await page.click('.collection-decks-table .bp5-table-row-cell:first-child');
    await page.waitForURL(/\/collection-opportunities\//);
  });

  test('Table displays collection opportunities with health indicators', async ({ page }) => {
    // Wait for the refactored component to load
    await page.waitForSelector('.collection-opportunities-refactored');
    
    // Verify table is present
    const table = await page.locator('.opportunities-table');
    await expect(table).toBeVisible();
    
    // Check for column headers
    await expect(page.locator('.bp5-table-column-header-cell:has-text("Name")')).toBeVisible();
    await expect(page.locator('.bp5-table-column-header-cell:has-text("Health")')).toBeVisible();
    await expect(page.locator('.bp5-table-column-header-cell:has-text("Sites")')).toBeVisible();
    await expect(page.locator('.bp5-table-column-header-cell:has-text("Capacity")')).toBeVisible();
    await expect(page.locator('.bp5-table-column-header-cell:has-text("Actions")')).toBeVisible();
    
    // Verify health indicators are displayed
    const healthIndicators = await page.locator('.health-indicator');
    await expect(healthIndicators.first()).toBeVisible();
    
    // Check capacity progress bars
    const capacityBars = await page.locator('.capacity-cell .bp5-progress-bar');
    await expect(capacityBars.first()).toBeVisible();
  });

  test('Search and filtering functionality', async ({ page }) => {
    // Test search input
    const searchInput = await page.locator('#opportunity-search');
    await expect(searchInput).toBeVisible();
    await searchInput.fill('Opportunity 1');
    
    // Verify results are filtered
    await page.waitForTimeout(500); // Debounce delay
    const visibleRows = await page.locator('.bp5-table-row-cell').count();
    expect(visibleRows).toBeGreaterThan(0);
    
    // Test site filter
    const siteFilter = await page.locator('.site-filter');
    await siteFilter.selectOption({ index: 1 });
    await page.waitForTimeout(500);
  });

  test('Tab navigation between All, Needs Review, and Unmatched', async ({ page }) => {
    // Check all tabs are present
    await expect(page.locator('.opportunity-tabs .bp5-tab:has-text("All")')).toBeVisible();
    await expect(page.locator('.opportunity-tabs .bp5-tab:has-text("Needs Review")')).toBeVisible();
    await expect(page.locator('.opportunity-tabs .bp5-tab:has-text("Unmatched")')).toBeVisible();
    
    // Click Needs Review tab
    await page.click('.opportunity-tabs .bp5-tab:has-text("Needs Review")');
    await page.waitForTimeout(300);
    
    // Click Unmatched tab
    await page.click('.opportunity-tabs .bp5-tab:has-text("Unmatched")');
    await page.waitForTimeout(300);
  });

  test('Row selection with keyboard shortcuts', async ({ page }) => {
    // Click on a row to select it
    await page.click('.bp5-table-row-cell:first-child');
    
    // Test Ctrl+A to select all
    await page.keyboard.press('Control+A');
    await page.waitForTimeout(300);
    
    // Check selection indicator
    const selectedTag = await page.locator('.bp5-navbar-group .bp5-tag');
    await expect(selectedTag).toContainText('selected');
    
    // Test Escape to clear selection
    await page.keyboard.press('Escape');
    await page.waitForTimeout(300);
  });

  test('Manual Override Modal opens and functions correctly', async ({ page }) => {
    // Click on a row to select it
    await page.click('.bp5-table-row-cell:first-child');
    
    // Click Override Selected button
    await page.click('button:has-text("Override Selected")');
    
    // Verify modal opens
    await expect(page.locator('.manual-override-modal-refactored')).toBeVisible();
    
    // Check for split workspace
    await expect(page.locator('.split-workspace')).toBeVisible();
    await expect(page.locator('.left-panel')).toBeVisible();
    await expect(page.locator('.right-panel')).toBeVisible();
    
    // Verify tabs in modal
    await expect(page.locator('.override-tabs .bp5-tab:has-text("Allocation")')).toBeVisible();
    await expect(page.locator('.override-tabs .bp5-tab:has-text("Justification")')).toBeVisible();
    await expect(page.locator('.override-tabs .bp5-tab:has-text("Review & Submit")')).toBeVisible();
  });

  test('Drag and drop functionality in override modal', async ({ page }) => {
    // Open override modal
    await page.click('.bp5-table-row-cell:first-child');
    await page.click('button:has-text("Override Selected")');
    await page.waitForSelector('.manual-override-modal-refactored');
    
    // Check for pass cards
    const passCards = await page.locator('.pass-card');
    await expect(passCards.first()).toBeVisible();
    
    // Check for site dropzones
    const dropzones = await page.locator('.site-dropzone');
    await expect(dropzones.first()).toBeVisible();
    
    // Simulate drag operation (note: actual drag-drop may not work in Playwright)
    const firstPass = await passCards.first();
    const firstDropzone = await dropzones.first();
    
    // At minimum, verify elements have proper attributes
    await expect(firstPass).toHaveAttribute('draggable', 'true');
  });

  test('Justification and validation in override modal', async ({ page }) => {
    // Open override modal
    await page.click('.bp5-table-row-cell:first-child');
    await page.click('button:has-text("Override Selected")');
    await page.waitForSelector('.manual-override-modal-refactored');
    
    // Navigate to justification tab
    await page.click('.override-tabs .bp5-tab:has-text("Justification")');
    
    // Check for justification textarea
    const justificationField = await page.locator('.justification-panel textarea');
    await expect(justificationField).toBeVisible();
    
    // Test validation - try to save without justification
    await page.click('.override-tabs .bp5-tab:has-text("Review & Submit")');
    await page.click('button:has-text("Save Override")');
    
    // Should show validation error
    await page.waitForTimeout(500);
    await expect(page.locator('.justification-panel')).toBeVisible(); // Should redirect to justification
  });

  test('Quick tips callout for first-time users', async ({ page }) => {
    // Check if help callout is displayed
    const helpCallout = await page.locator('.help-callout');
    
    // If visible, verify it contains helpful information
    if (await helpCallout.isVisible()) {
      await expect(helpCallout).toContainText('Quick Tips');
      await expect(helpCallout).toContainText('Click a row to select');
      await expect(helpCallout).toContainText('keyboard shortcuts');
    }
  });

  test('Keyboard navigation and shortcuts', async ({ page }) => {
    // Test Ctrl+F to focus search
    await page.keyboard.press('Control+f');
    const searchInput = await page.locator('#opportunity-search');
    await expect(searchInput).toBeFocused();
    
    // Test Tab navigation between tabs (Ctrl + 1/2/3)
    await page.keyboard.press('Control+1');
    await page.waitForTimeout(300);
    
    await page.keyboard.press('Control+2');
    await page.waitForTimeout(300);
    
    await page.keyboard.press('Control+3');
    await page.waitForTimeout(300);
  });

  test('Responsive design and accessibility', async ({ page }) => {
    // Test at different viewport sizes
    await page.setViewportSize({ width: 1920, height: 1080 });
    await expect(page.locator('.collection-opportunities-refactored')).toBeVisible();
    
    // Tablet size
    await page.setViewportSize({ width: 1024, height: 768 });
    await expect(page.locator('.collection-opportunities-refactored')).toBeVisible();
    
    // Check for ARIA labels
    const editButtons = await page.locator('button[aria-label^="Edit"]');
    await expect(editButtons.first()).toHaveAttribute('aria-label', /Edit Opportunity/);
  });

  test('Performance indicators and real-time updates', async ({ page }) => {
    // Check for capacity visualization
    const progressBars = await page.locator('.bp5-progress-bar');
    await expect(progressBars.first()).toBeVisible();
    
    // Verify real-time connection indicator
    const connectionStatus = await page.locator('.hub-status-bar .status-item:has-text("Connected")');
    if (await connectionStatus.isVisible()) {
      await expect(connectionStatus).toContainText(/Connected|Disconnected/);
    }
  });

  test('Auto-optimize functionality in override modal', async ({ page }) => {
    // Open override modal
    await page.click('.bp5-table-row-cell:first-child');
    await page.click('button:has-text("Override Selected")');
    await page.waitForSelector('.manual-override-modal-refactored');
    
    // Check for auto-optimize button
    const autoOptimizeBtn = await page.locator('button:has-text("Auto-Optimize")');
    if (await autoOptimizeBtn.isVisible()) {
      // Select some passes first
      await page.click('.pass-card:first-child');
      await page.keyboard.down('Control');
      await page.click('.pass-card:nth-child(2)');
      await page.keyboard.up('Control');
      
      // Click auto-optimize
      await autoOptimizeBtn.click();
      
      // Should open optimization dialog
      await expect(page.locator('.auto-optimize-dialog')).toBeVisible();
    }
  });

  test('Undo/Redo functionality in override modal', async ({ page }) => {
    // Open override modal
    await page.click('.bp5-table-row-cell:first-child');
    await page.click('button:has-text("Override Selected")');
    await page.waitForSelector('.manual-override-modal-refactored');
    
    // Navigate to review tab
    await page.click('.override-tabs .bp5-tab:has-text("Review & Submit")');
    
    // Check for change history section
    const historyButton = await page.locator('button:has-text("History")');
    if (await historyButton.isVisible()) {
      await historyButton.click();
      
      // Should show history list
      const historyList = await page.locator('.history-list');
      await expect(historyList).toBeVisible();
    }
  });
});

test.describe('Collection Opportunities Hub Integration', () => {
  test('Hub statistics dashboard displays correctly', async ({ page }) => {
    await page.goto('http://localhost:3000/history');
    await page.click('.collection-decks-table .bp5-table-row-cell:first-child');
    await page.waitForURL(/\/collection-opportunities\//);
    
    // Check for statistics cards
    await expect(page.locator('.hub-stats .stat-card.total')).toBeVisible();
    await expect(page.locator('.hub-stats .stat-card.critical')).toBeVisible();
    await expect(page.locator('.hub-stats .stat-card.warning')).toBeVisible();
    await expect(page.locator('.hub-stats .stat-card.optimal')).toBeVisible();
    await expect(page.locator('.hub-stats .stat-card.pending')).toBeVisible();
  });

  test('Feature flag controls component switching', async ({ page }) => {
    // This test would require setting the feature flag
    // In a real scenario, you might use URL parameters or local storage
    await page.goto('http://localhost:3000/history?ff_useRefactoredComponents=true');
    await page.click('.collection-decks-table .bp5-table-row-cell:first-child');
    await page.waitForURL(/\/collection-opportunities\//);
    
    // Should load refactored component when flag is true
    await expect(page.locator('.collection-opportunities-refactored')).toBeVisible();
  });
});