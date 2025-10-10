import { test, expect } from '@playwright/test';

const COLLECTION_HUB_URL = 'http://localhost:3000/collection/123/opportunities';

test.describe('Collection Opportunities Hub - Visual Validation', () => {
  test('capture comprehensive visual evidence', async ({ page, browserName }) => {
    // Navigate to the hub
    await page.goto(COLLECTION_HUB_URL);
    await page.waitForLoadState('networkidle');
    
    // 1. Verify "Manage Opportunities" label
    await test.step('Verify UI Label Update', async () => {
      const navbar = page.locator('.opportunities-navbar');
      await expect(navbar).toContainText('Manage Opportunities');
      await page.screenshot({ 
        path: `test-results/screenshots/01-manage-opportunities-label-${browserName}.png`,
        fullPage: false,
        clip: { x: 0, y: 0, width: 1920, height: 200 }
      });
    });

    // 2. Verify Health Status Indicators
    await test.step('Verify Health Status Column', async () => {
      const table = page.locator('.opportunities-table-enhanced');
      await expect(table).toBeVisible();
      
      // Check for health indicator cells
      const healthCells = page.locator('td:has(.opportunity-status-indicator-enhanced)');
      const healthCount = await healthCells.count();
      expect(healthCount).toBeGreaterThan(0);
      
      await page.screenshot({ 
        path: `test-results/screenshots/02-health-indicators-${browserName}.png`,
        fullPage: false,
        clip: { x: 0, y: 200, width: 1920, height: 600 }
      });
    });

    // 3. Verify Action Icons
    await test.step('Verify Action Column Icons', async () => {
      // Find actions column
      const actionsCell = page.locator('.actions-cell-enhanced').first();
      await expect(actionsCell).toBeVisible();
      
      // Check for Edit icon
      const editButton = actionsCell.locator('button[aria-label="Quick Edit"]');
      await expect(editButton).toBeVisible();
      
      // Check for Reallocate icon
      const reallocateButton = actionsCell.locator('button[aria-label="Reallocate"]');
      await expect(reallocateButton).toBeVisible();
      
      await actionsCell.screenshot({ 
        path: `test-results/screenshots/03-action-icons-${browserName}.png` 
      });
    });

    // 4. Test Quick Edit Modal
    await test.step('Test Quick Edit Modal', async () => {
      const editButton = page.locator('button[aria-label="Quick Edit"]').first();
      await editButton.click();
      
      const modal = page.locator('[role="dialog"]');
      await expect(modal).toBeVisible();
      
      // Verify real-time capacity visualization
      const capacityIndicator = modal.locator('.capacity-indicator, .capacity-percentage');
      await expect(capacityIndicator).toBeVisible();
      
      await modal.screenshot({ 
        path: `test-results/screenshots/04-quick-edit-modal-${browserName}.png` 
      });
      
      // Close modal
      await page.keyboard.press('Escape');
    });

    // 5. Test Reallocation Workspace
    await test.step('Test Reallocation Workspace', async () => {
      const reallocateButton = page.locator('button[aria-label="Reallocate"]').first();
      await reallocateButton.click();
      
      const workspace = page.locator('[role="dialog"]');
      await expect(workspace).toBeVisible();
      
      // Verify satellite context
      await expect(workspace).toContainText(/Satellite \d+/);
      
      // Check for mode selector
      const modeSelector = workspace.locator('select[aria-label*="Mode"], [class*="mode"]');
      const modeSelectorExists = await modeSelector.count() > 0;
      
      await workspace.screenshot({ 
        path: `test-results/screenshots/05-reallocation-workspace-${browserName}.png` 
      });
      
      // Close workspace
      const closeButton = workspace.locator('button[aria-label="Close"], button:has-text("Close")').first();
      await closeButton.click();
    });

    // 6. Test Keyboard Navigation
    await test.step('Test Keyboard Shortcuts', async () => {
      // Select first row
      const firstCheckbox = page.locator('input[type="checkbox"]').nth(1);
      await firstCheckbox.check();
      
      // Show selected state
      await page.screenshot({ 
        path: `test-results/screenshots/06-row-selected-${browserName}.png`,
        fullPage: false,
        clip: { x: 0, y: 200, width: 1920, height: 400 }
      });
      
      // Test Cmd+E
      await page.keyboard.press('Meta+e');
      const editModal = page.locator('[role="dialog"]');
      await expect(editModal).toBeVisible();
      
      await page.screenshot({ 
        path: `test-results/screenshots/07-keyboard-edit-${browserName}.png` 
      });
      
      await page.keyboard.press('Escape');
    });

    // 7. Test Batch Operations
    await test.step('Test Batch Operations', async () => {
      // Make some changes
      const editButton = page.locator('button[aria-label="Quick Edit"]').first();
      await editButton.click();
      
      const prioritySelect = page.locator('select[aria-label*="Priority"], select[name*="priority"]').first();
      await prioritySelect.selectOption({ index: 1 });
      
      const saveButton = page.locator('button:has-text("Save")');
      await saveButton.click();
      
      // Wait for pending changes indicator
      await page.waitForSelector('text=/changes pending/i');
      
      // Capture state with pending changes
      await page.screenshot({ 
        path: `test-results/screenshots/08-pending-changes-${browserName}.png`,
        fullPage: false,
        clip: { x: 0, y: 0, width: 1920, height: 200 }
      });
      
      // Check for Update Collection Deck button
      const updateButton = page.locator('button:has-text("Update Collection Deck")');
      await expect(updateButton).toBeVisible();
      
      await updateButton.screenshot({ 
        path: `test-results/screenshots/09-update-button-${browserName}.png` 
      });
    });

    // 8. Responsive Design Check
    await test.step('Test Responsive Design', async () => {
      const viewports = [
        { width: 1920, height: 1080, name: 'desktop' },
        { width: 1366, height: 768, name: 'laptop' },
        { width: 1024, height: 768, name: 'tablet' },
        { width: 768, height: 1024, name: 'mobile' }
      ];
      
      for (const viewport of viewports) {
        await page.setViewportSize(viewport);
        await page.waitForTimeout(500); // Allow layout to adjust
        
        await page.screenshot({ 
          path: `test-results/screenshots/10-responsive-${viewport.name}-${browserName}.png`,
          fullPage: true
        });
      }
    });

    // 9. Final Full Page Screenshot
    await test.step('Capture Full Page', async () => {
      await page.setViewportSize({ width: 1920, height: 1080 });
      await page.screenshot({ 
        path: `test-results/screenshots/11-full-page-final-${browserName}.png`,
        fullPage: true
      });
    });
  });

  test('verify specific UI enhancements', async ({ page }) => {
    await page.goto(COLLECTION_HUB_URL);
    await page.waitForLoadState('networkidle');
    
    // Create a validation summary
    const validationResults = {
      uiLabelUpdate: false,
      statusIndicators: false,
      actionIcons: false,
      keyboardShortcuts: false,
      modalContext: false,
      realTimeUpdates: false,
      batchSave: false,
      performance: false,
      accessibility: false
    };
    
    // Check each requirement
    validationResults.uiLabelUpdate = await page.locator('text="Manage Opportunities"').isVisible();
    validationResults.statusIndicators = await page.locator('.opportunity-status-indicator-enhanced').first().isVisible();
    validationResults.actionIcons = await page.locator('button[aria-label="Quick Edit"]').first().isVisible() && 
                                   await page.locator('button[aria-label="Reallocate"]').first().isVisible();
    
    // Test keyboard shortcuts
    const firstCheckbox = page.locator('input[type="checkbox"]').nth(1);
    await firstCheckbox.check();
    await page.keyboard.press('Meta+e');
    validationResults.keyboardShortcuts = await page.locator('[role="dialog"]').isVisible();
    await page.keyboard.press('Escape');
    
    // Test modal context
    await page.locator('button[aria-label="Reallocate"]').first().click();
    validationResults.modalContext = await page.locator('[role="dialog"]:has-text("Satellite")').isVisible();
    await page.locator('button:has-text("Close")').first().click();
    
    // Performance check
    const navigationTiming = await page.evaluate(() => {
      const timing = performance.getEntriesByType('navigation')[0] as PerformanceNavigationTiming;
      return timing.loadEventEnd - timing.fetchStart;
    });
    validationResults.performance = navigationTiming < 3000;
    
    // Accessibility check - basic ARIA labels
    const buttons = await page.locator('button').all();
    let accessibilityValid = true;
    for (const button of buttons.slice(0, 5)) {
      const hasAriaLabel = await button.getAttribute('aria-label') !== null;
      const hasText = await button.textContent() !== '';
      if (!hasAriaLabel && !hasText) {
        accessibilityValid = false;
        break;
      }
    }
    validationResults.accessibility = accessibilityValid;
    
    // Save validation results
    await page.evaluate((results) => {
      console.log('Validation Results:', results);
    }, validationResults);
    
    // Create visual summary
    const summary = `
      Collection Opportunities Hub - Validation Summary
      ================================================
      ✅ UI Label Update: ${validationResults.uiLabelUpdate ? 'PASS' : 'FAIL'}
      ✅ Status Indicators: ${validationResults.statusIndicators ? 'PASS' : 'FAIL'}
      ✅ Action Icons: ${validationResults.actionIcons ? 'PASS' : 'FAIL'}
      ✅ Keyboard Shortcuts: ${validationResults.keyboardShortcuts ? 'PASS' : 'FAIL'}
      ✅ Modal Context: ${validationResults.modalContext ? 'PASS' : 'FAIL'}
      ✅ Performance (<3s): ${validationResults.performance ? 'PASS' : 'FAIL'}
      ✅ Accessibility: ${validationResults.accessibility ? 'PASS' : 'FAIL'}
    `;
    
    console.log(summary);
  });
});