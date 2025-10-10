import { test, expect, Page } from '@playwright/test';

test.describe('Collection Opportunities Split View Functionality', () => {
  let page: Page;

  test.beforeEach(async ({ browser }) => {
    page = await browser.newPage();
    
    // Navigate to a specific collection opportunities page
    // Using the route pattern from navigation.ts: /collection/:collectionId/manage
    await page.goto('http://localhost:3000/collection/test-123/manage');
    
    // Wait for the page to load and data to be populated
    await page.waitForSelector('.collection-opportunities-hub', { timeout: 10000 });
    
    // Wait for opportunities to load
    await page.waitForSelector('.opportunities-table', { timeout: 10000 });
    
    // Take initial screenshot
    await page.screenshot({ 
      path: 'test-results/collection-opportunities-initial.png',
      fullPage: true 
    });
  });

  test('should display collection opportunities hub with split view toggle', async () => {
    // Verify main hub elements are present
    await expect(page.locator('.collection-opportunities-hub')).toBeVisible();
    await expect(page.locator('.hub-title h1')).toContainText('Collection Deck test-123');
    
    // Verify tabs are present
    await expect(page.locator('#hub-tabs')).toBeVisible();
    await expect(page.locator('text=Manage Opportunities')).toBeVisible();
    
    // Verify statistics dashboard
    await expect(page.locator('.hub-stats')).toBeVisible();
    await expect(page.locator('.stat-card.total')).toBeVisible();
    
    // Verify split view toggle button is present
    await expect(page.locator('button:has-text("Show Panel")')).toBeVisible();
  });

  test('should open split view panel when clicking opportunity row', async () => {
    // Wait for opportunities table to load
    await page.waitForSelector('.opportunities-table .bp5-table-body', { timeout: 10000 });
    
    // Find the first opportunity row with name cell
    const firstOpportunityRow = page.locator('.opportunities-table .bp5-table-body .bp5-table-row').first();
    await firstOpportunityRow.waitFor({ state: 'visible', timeout: 5000 });
    
    // Click on the first opportunity name cell
    const nameCell = firstOpportunityRow.locator('.opportunity-name-wrapper');
    if (await nameCell.count() > 0) {
      await nameCell.click();
    } else {
      // Fallback: click the row directly
      await firstOpportunityRow.click();
    }
    
    // Verify split view panel opens
    await expect(page.locator('.split-view-panel')).toHaveClass(/open/);
    await expect(page.locator('.allocation-editor-panel')).toBeVisible();
    
    // Verify main content adjusts width
    await expect(page.locator('.collection-opportunities-split-view')).toHaveClass(/split-view-active/);
    
    // Take screenshot of split view open
    await page.screenshot({ 
      path: 'test-results/split-view-opened.png',
      fullPage: true 
    });
  });

  test('should test split view resize functionality', async () => {
    // First open the split view
    const firstRow = page.locator('.opportunities-table .bp5-table-body .bp5-table-row').first();
    await firstRow.click();
    
    // Wait for split view to open
    await page.waitForSelector('.split-view-panel.open', { timeout: 5000 });
    
    // Get initial width
    const initialPanelWidth = await page.locator('.split-view-panel').evaluate(el => 
      window.getComputedStyle(el).width
    );
    
    // Find resize handle
    const resizeHandle = page.locator('.split-view-resize-handle');
    await expect(resizeHandle).toBeVisible();
    
    // Get resize handle position
    const handleBox = await resizeHandle.boundingBox();
    if (handleBox) {
      // Drag the resize handle to the left to make panel wider
      await page.mouse.move(handleBox.x + handleBox.width/2, handleBox.y + handleBox.height/2);
      await page.mouse.down();
      await page.mouse.move(handleBox.x - 100, handleBox.y + handleBox.height/2);
      await page.mouse.up();
      
      // Wait for resize animation
      await page.waitForTimeout(500);
      
      // Get new width and verify it changed
      const newPanelWidth = await page.locator('.split-view-panel').evaluate(el => 
        window.getComputedStyle(el).width
      );
      
      expect(newPanelWidth).not.toBe(initialPanelWidth);
      
      // Take screenshot of resized panel
      await page.screenshot({ 
        path: 'test-results/split-view-resized.png',
        fullPage: true 
      });
    }
  });

  test('should test allocation editor panel functionality', async () => {
    // Open split view
    const firstRow = page.locator('.opportunities-table .bp5-table-body .bp5-table-row').first();
    await firstRow.click();
    
    // Wait for allocation editor panel
    await page.waitForSelector('.allocation-editor-panel', { timeout: 5000 });
    
    // Verify panel header
    await expect(page.locator('.panel-header h3')).toContainText('Edit:');
    
    // Verify tabs are present
    await expect(page.locator('#editor-tabs')).toBeVisible();
    await expect(page.locator('text=Allocation')).toBeVisible();
    await expect(page.locator('text=Details')).toBeVisible();
    await expect(page.locator('text=History')).toBeVisible();
    
    // Test allocation tab
    await page.click('text=Allocation');
    await expect(page.locator('#site-select')).toBeVisible();
    await expect(page.locator('#justification')).toBeVisible();
    
    // Test details tab
    await page.click('text=Details');
    await expect(page.locator('#priority-select')).toBeVisible();
    await expect(page.locator('#capacity-input')).toBeVisible();
    
    // Test making a change
    if (await page.locator('#priority-select').count() > 0) {
      await page.selectOption('#priority-select', 'high');
      
      // Verify unsaved changes indicator appears
      await expect(page.locator('.unsaved-changes')).toBeVisible();
      await expect(page.locator('text=You have unsaved changes')).toBeVisible();
    }
    
    // Verify save button state
    const saveButton = page.locator('button:has-text("Save Changes")');
    await expect(saveButton).toBeVisible();
    
    // Take screenshot of editor panel
    await page.screenshot({ 
      path: 'test-results/allocation-editor-panel.png',
      fullPage: true 
    });
  });

  test('should test quick info bar in allocation editor', async () => {
    // Open split view
    const firstRow = page.locator('.opportunities-table .bp5-table-body .bp5-table-row').first();
    await firstRow.click();
    
    // Wait for allocation editor panel
    await page.waitForSelector('.allocation-editor-panel', { timeout: 5000 });
    
    // Verify quick info bar
    await expect(page.locator('.quick-info-bar')).toBeVisible();
    
    // Check for status, priority, health, and capacity info
    const infoItems = page.locator('.info-item');
    await expect(infoItems).toHaveCount(4);
    
    // Verify each info item has label and value
    await expect(page.locator('.info-item:has-text("Status:")')).toBeVisible();
    await expect(page.locator('.info-item:has-text("Priority:")')).toBeVisible();
    await expect(page.locator('.info-item:has-text("Health:")')).toBeVisible();
    await expect(page.locator('.info-item:has-text("Capacity:")')).toBeVisible();
  });

  test('should test keyboard shortcuts in split view', async () => {
    // Open split view
    const firstRow = page.locator('.opportunities-table .bp5-table-body .bp5-table-row').first();
    await firstRow.click();
    
    // Wait for split view to open
    await page.waitForSelector('.split-view-panel.open', { timeout: 5000 });
    
    // Test Escape key to close split view
    await page.keyboard.press('Escape');
    
    // Verify split view closes
    await expect(page.locator('.split-view-panel')).not.toHaveClass(/open/);
    
    // Reopen split view
    await firstRow.click();
    await page.waitForSelector('.split-view-panel.open', { timeout: 5000 });
    
    // Test Ctrl+S keyboard shortcut (should work when in editor)
    await page.keyboard.press('Control+s');
    
    // Take screenshot after keyboard shortcuts test
    await page.screenshot({ 
      path: 'test-results/keyboard-shortcuts-test.png',
      fullPage: true 
    });
  });

  test('should test workspace mode and reallocation workspace', async () => {
    // Check if workspace mode is enabled (feature flag dependent)
    const workspaceButton = page.locator('button:has-text("Workspace")');
    
    if (await workspaceButton.count() > 0) {
      await workspaceButton.click();
      
      // Wait for workspace modal/panel to appear
      await page.waitForSelector('.reallocation-workspace, .workspace-modal', { timeout: 5000 });
      
      // Take screenshot of workspace
      await page.screenshot({ 
        path: 'test-results/reallocation-workspace.png',
        fullPage: true 
      });
    } else {
      console.log('Workspace mode not available or not enabled');
    }
  });

  test('should test multiple opportunity selection and batch edit', async () => {
    // Wait for table to load
    await page.waitForSelector('.opportunities-table .bp5-table-body .bp5-table-row', { timeout: 10000 });
    
    const rows = page.locator('.opportunities-table .bp5-table-body .bp5-table-row');
    const rowCount = await rows.count();
    
    if (rowCount >= 2) {
      // Select first opportunity with Ctrl+click
      await rows.nth(0).click({ modifiers: ['Control'] });
      
      // Select second opportunity with Ctrl+click
      await rows.nth(1).click({ modifiers: ['Control'] });
      
      // Verify selection indicator appears
      await expect(page.locator('text=2 selected')).toBeVisible();
      
      // Verify batch edit button appears
      await expect(page.locator('button:has-text("Edit Selected")')).toBeVisible();
      
      // Click batch edit
      await page.click('button:has-text("Edit Selected")');
      
      // Verify split view opens with multi-edit indicator
      await expect(page.locator('.allocation-editor-panel')).toBeVisible();
      await expect(page.locator('.panel-header h3:has-text("Edit 2 Opportunities")')).toBeVisible();
      
      // Take screenshot of batch edit
      await page.screenshot({ 
        path: 'test-results/batch-edit-mode.png',
        fullPage: true 
      });
    }
  });

  test('should test split view panel close functionality', async () => {
    // Open split view
    const firstRow = page.locator('.opportunities-table .bp5-table-body .bp5-table-row').first();
    await firstRow.click();
    
    // Wait for split view to open
    await page.waitForSelector('.split-view-panel.open', { timeout: 5000 });
    
    // Test close button
    const closeButton = page.locator('.panel-header button[title*="Close"]');
    if (await closeButton.count() > 0) {
      await closeButton.click();
    } else {
      // Try alternative close button selector
      await page.click('button:has([icon="cross"])');
    }
    
    // Verify split view closes
    await expect(page.locator('.split-view-panel')).not.toHaveClass(/open/);
    
    // Verify main content takes full width again
    const mainContent = page.locator('.main-content');
    const width = await mainContent.evaluate(el => window.getComputedStyle(el).width);
    expect(width).toBe('100%');
  });

  test('should test responsive behavior on smaller screens', async () => {
    // Set viewport to tablet size
    await page.setViewportSize({ width: 768, height: 1024 });
    
    // Open split view
    const firstRow = page.locator('.opportunities-table .bp5-table-body .bp5-table-row').first();
    await firstRow.click();
    
    // On smaller screens, split view should take full width
    await page.waitForSelector('.split-view-panel.open', { timeout: 5000 });
    
    const panelWidth = await page.locator('.split-view-panel').evaluate(el => 
      window.getComputedStyle(el).width
    );
    
    // Panel should take full width on mobile
    expect(panelWidth).toBe('768px'); // Full viewport width
    
    // Main content should be hidden
    const mainContent = page.locator('.main-content');
    const display = await mainContent.evaluate(el => window.getComputedStyle(el).display);
    expect(display).toBe('none');
    
    // Take screenshot of mobile layout
    await page.screenshot({ 
      path: 'test-results/mobile-split-view.png',
      fullPage: true 
    });
  });

  test('should validate all split view components are working', async () => {
    // Comprehensive validation test
    const results = {
      hubLoaded: false,
      tableVisible: false,
      splitViewToggle: false,
      splitViewOpens: false,
      resizeHandlePresent: false,
      editorPanelLoaded: false,
      tabsWorking: false,
      saveButtonPresent: false
    };

    try {
      // Check hub loaded
      await expect(page.locator('.collection-opportunities-hub')).toBeVisible();
      results.hubLoaded = true;

      // Check table visible
      await expect(page.locator('.opportunities-table')).toBeVisible();
      results.tableVisible = true;

      // Check split view toggle
      await expect(page.locator('button:has-text("Show Panel")')).toBeVisible();
      results.splitViewToggle = true;

      // Open split view
      const firstRow = page.locator('.opportunities-table .bp5-table-body .bp5-table-row').first();
      await firstRow.click();
      await page.waitForSelector('.split-view-panel.open', { timeout: 5000 });
      results.splitViewOpens = true;

      // Check resize handle
      await expect(page.locator('.split-view-resize-handle')).toBeVisible();
      results.resizeHandlePresent = true;

      // Check editor panel
      await expect(page.locator('.allocation-editor-panel')).toBeVisible();
      results.editorPanelLoaded = true;

      // Check tabs
      await page.click('text=Details');
      await expect(page.locator('#priority-select')).toBeVisible();
      results.tabsWorking = true;

      // Check save button
      await expect(page.locator('button:has-text("Save Changes")')).toBeVisible();
      results.saveButtonPresent = true;

      // Log results
      console.log('Split View Validation Results:', results);
      
      // Take final validation screenshot
      await page.screenshot({ 
        path: 'test-results/split-view-validation-complete.png',
        fullPage: true 
      });

      // Assert all components are working
      Object.values(results).forEach(result => {
        expect(result).toBe(true);
      });

    } catch (error) {
      console.error('Validation failed:', error);
      console.log('Partial results:', results);
      
      // Take error screenshot
      await page.screenshot({ 
        path: 'test-results/split-view-validation-error.png',
        fullPage: true 
      });
      
      throw error;
    }
  });

  test.afterEach(async () => {
    await page.close();
  });
});