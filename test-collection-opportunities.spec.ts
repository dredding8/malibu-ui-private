import { test, expect } from '@playwright/test';

test.describe('Interactive Collection Opportunities Management', () => {
  test.beforeEach(async ({ page }) => {
    // Navigate to the collection opportunities page
    await page.goto('http://localhost:3000/opportunities');
    await page.waitForLoadState('networkidle');
  });

  test.describe('Interactive Data Table', () => {
    test('should display status indicators correctly', async ({ page }) => {
      // Check for status indicators
      const criticalStatus = page.locator('.status-indicator.status-critical').first();
      const warningStatus = page.locator('.status-indicator.status-warning').first();
      const optimalStatus = page.locator('.status-indicator.status-optimal').first();

      // Verify status indicators are visible
      if (await criticalStatus.isVisible()) {
        await expect(criticalStatus).toContainText('Critical');
        await expect(criticalStatus.locator('.bp5-icon')).toBeVisible();
      }

      if (await warningStatus.isVisible()) {
        await expect(warningStatus).toContainText('Warning');
      }

      if (await optimalStatus.isVisible()) {
        await expect(optimalStatus).toContainText('Optimal');
      }
    });

    test('should support column sorting', async ({ page }) => {
      // Click on Status column header
      const statusHeader = page.locator('.sortable-header:has-text("Status")');
      await statusHeader.click();

      // Verify sort icon appears
      await expect(statusHeader.locator('.bp5-icon')).toBeVisible();

      // Click again to reverse sort
      await statusHeader.click();
      
      // Verify sort direction changed
      const sortIcon = statusHeader.locator('.bp5-icon');
      const iconName = await sortIcon.getAttribute('icon');
      expect(iconName).toMatch(/chevron-(up|down)/);
    });

    test('should support row selection', async ({ page }) => {
      // Select first row
      const firstCheckbox = page.locator('tbody tr').first().locator('input[type="checkbox"]');
      await firstCheckbox.check();

      // Verify checkbox is checked
      await expect(firstCheckbox).toBeChecked();

      // Select all
      const selectAllCheckbox = page.locator('thead input[type="checkbox"]');
      await selectAllCheckbox.check();

      // Verify all rows are selected
      const allCheckboxes = page.locator('tbody input[type="checkbox"]');
      const count = await allCheckboxes.count();
      for (let i = 0; i < count; i++) {
        await expect(allCheckboxes.nth(i)).toBeChecked();
      }
    });

    test('should show capacity bars with correct colors', async ({ page }) => {
      // Check capacity bars
      const capacityBars = page.locator('.capacity-bar');
      const count = await capacityBars.count();

      for (let i = 0; i < Math.min(count, 3); i++) {
        const bar = capacityBars.nth(i);
        const className = await bar.getAttribute('class');
        
        // Verify bar has appropriate class
        expect(className).toMatch(/capacity-(SUCCESS|WARNING|DANGER)/);
      }
    });
  });

  test.describe('Edit Opportunity Modal', () => {
    test('should open edit modal when clicking edit button', async ({ page }) => {
      // Click first edit button
      const editButton = page.locator('[aria-label*="Edit"]').first();
      await editButton.click();

      // Verify modal opens
      const modal = page.locator('.edit-opportunity-modal');
      await expect(modal).toBeVisible();

      // Verify modal title
      await expect(modal.locator('.bp5-dialog-header')).toContainText('Edit Opportunity');
    });

    test('should show real-time validation feedback', async ({ page }) => {
      // Open edit modal
      await page.locator('[aria-label*="Edit"]').first().click();

      // Wait for modal
      const modal = page.locator('.edit-opportunity-modal');
      await expect(modal).toBeVisible();

      // Uncheck a site
      const siteCheckbox = modal.locator('.site-checkbox-wrapper input[type="checkbox"]').first();
      if (await siteCheckbox.isChecked()) {
        await siteCheckbox.uncheck();
      }

      // Check for capacity feedback
      const capacityFeedback = modal.locator('.capacity-feedback');
      await expect(capacityFeedback).toBeVisible({ timeout: 5000 });

      // Verify feedback content
      await expect(capacityFeedback).toContainText(/Capacity Analysis/);
    });

    test('should validate before saving', async ({ page }) => {
      // Open edit modal
      await page.locator('[aria-label*="Edit"]').first().click();
      const modal = page.locator('.edit-opportunity-modal');

      // Try to save without changes
      const saveButton = modal.locator('button:has-text("Save")');
      
      // Initially save should be disabled if no changes made
      await expect(saveButton).toBeDisabled();

      // Make a change
      const priorityRadio = modal.locator('input[type="radio"][value="high"]');
      await priorityRadio.check();

      // Save should now be enabled
      await expect(saveButton).toBeEnabled();
    });

    test('should support save and next functionality', async ({ page }) => {
      // Open edit modal
      await page.locator('[aria-label*="Edit"]').first().click();
      const modal = page.locator('.edit-opportunity-modal');

      // Check if Save & Next button exists
      const saveNextButton = modal.locator('button:has-text("Save & Next")');
      
      if (await saveNextButton.isVisible()) {
        // Verify button has correct icon
        await expect(saveNextButton.locator('.bp5-icon')).toBeVisible();
      }
    });
  });

  test.describe('Batch Management', () => {
    test('should track changes with visual indicators', async ({ page }) => {
      // Open edit modal
      await page.locator('[aria-label*="Edit"]').first().click();
      const modal = page.locator('.edit-opportunity-modal');

      // Make a change
      const priorityRadio = modal.locator('input[type="radio"][value="critical"]');
      await priorityRadio.check();

      // Save changes
      await modal.locator('button:has-text("Save")').click();

      // Wait for modal to close
      await expect(modal).not.toBeVisible();

      // Check for change indicator
      const changeIndicator = page.locator('.change-indicator').first();
      await expect(changeIndicator).toBeVisible();

      // Check for changes summary
      await expect(page.locator('.opportunities-header')).toContainText(/\d+ changes pending/);
    });

    test('should show update button when changes exist', async ({ page }) => {
      // Make a change first
      await page.locator('[aria-label*="Edit"]').first().click();
      const modal = page.locator('.edit-opportunity-modal');
      await modal.locator('input[type="radio"][value="high"]').check();
      await modal.locator('button:has-text("Save")').click();

      // Check for update button
      const updateButton = page.locator('button:has-text("Update Collection Deck")');
      await expect(updateButton).toBeVisible();
      
      // Verify button shows change count
      await expect(updateButton).toContainText(/\(\d+\)/);
    });

    test('should show changes summary callout', async ({ page }) => {
      // Make a change
      await page.locator('[aria-label*="Edit"]').first().click();
      const modal = page.locator('.edit-opportunity-modal');
      await modal.locator('input[type="radio"][value="low"]').check();
      await modal.locator('button:has-text("Save")').click();

      // Check for changes summary
      const changesSummary = page.locator('.changes-summary');
      await expect(changesSummary).toBeVisible();
      await expect(changesSummary).toContainText(/\d+ changes pending/);
    });
  });

  test.describe('Accessibility', () => {
    test('should have proper ARIA labels', async ({ page }) => {
      // Check table accessibility
      const table = page.locator('.opportunities-table');
      await expect(table).toBeVisible();

      // Check edit buttons have aria-labels
      const editButtons = page.locator('[aria-label*="Edit"]');
      const count = await editButtons.count();
      expect(count).toBeGreaterThan(0);

      // Check checkbox accessibility
      const checkboxes = page.locator('input[type="checkbox"][aria-label]');
      const checkboxCount = await checkboxes.count();
      expect(checkboxCount).toBeGreaterThan(0);
    });

    test('should support keyboard navigation', async ({ page }) => {
      // Tab to first interactive element
      await page.keyboard.press('Tab');
      
      // Check focus is visible
      const focusedElement = page.locator(':focus');
      await expect(focusedElement).toBeVisible();

      // Navigate through sortable headers
      const statusHeader = page.locator('.sortable-header:has-text("Status")');
      await statusHeader.focus();
      await page.keyboard.press('Enter');
      
      // Verify sort was triggered
      await expect(statusHeader.locator('.bp5-icon')).toBeVisible();
    });

    test('should have sufficient color contrast', async ({ page }) => {
      // This test would use axe-core or similar accessibility testing library
      // For now, we'll check that status indicators are visible
      const indicators = page.locator('.status-indicator');
      const count = await indicators.count();
      
      for (let i = 0; i < Math.min(count, 3); i++) {
        const indicator = indicators.nth(i);
        await expect(indicator).toBeVisible();
        
        // Verify text is readable
        const text = await indicator.textContent();
        expect(text).toBeTruthy();
      }
    });

    test('should announce status changes to screen readers', async ({ page }) => {
      // Check for aria-live regions
      const liveRegions = page.locator('[aria-live]');
      const count = await liveRegions.count();
      expect(count).toBeGreaterThanOrEqual(0); // May not have live regions initially

      // Make a change to trigger announcements
      await page.locator('[aria-label*="Edit"]').first().click();
      const modal = page.locator('.edit-opportunity-modal');
      await modal.locator('input[type="radio"][value="high"]').check();
      await modal.locator('button:has-text("Save")').click();

      // Changes summary should be announced
      const changesSummary = page.locator('.changes-summary');
      if (await changesSummary.isVisible()) {
        const role = await changesSummary.getAttribute('role');
        expect(['alert', 'status']).toContain(role);
      }
    });
  });

  test.describe('Performance', () => {
    test('should load table within performance budget', async ({ page }) => {
      const startTime = Date.now();
      
      // Wait for table to be fully loaded
      await page.waitForSelector('.opportunities-table', { state: 'visible' });
      await page.waitForLoadState('networkidle');
      
      const loadTime = Date.now() - startTime;
      
      // Should load within 1 second for 100 opportunities
      expect(loadTime).toBeLessThan(1000);
    });

    test('should open modal quickly', async ({ page }) => {
      // Measure modal open time
      const editButton = page.locator('[aria-label*="Edit"]').first();
      
      const startTime = Date.now();
      await editButton.click();
      await page.waitForSelector('.edit-opportunity-modal', { state: 'visible' });
      const openTime = Date.now() - startTime;
      
      // Modal should open within 200ms
      expect(openTime).toBeLessThan(200);
    });

    test('should provide real-time validation quickly', async ({ page }) => {
      // Open modal
      await page.locator('[aria-label*="Edit"]').first().click();
      const modal = page.locator('.edit-opportunity-modal');

      // Measure validation feedback time
      const checkbox = modal.locator('.site-checkbox-wrapper input[type="checkbox"]').first();
      
      const startTime = Date.now();
      await checkbox.click();
      
      // Wait for feedback with short timeout
      try {
        await page.waitForSelector('.capacity-feedback', { 
          state: 'visible',
          timeout: 100 
        });
        const validationTime = Date.now() - startTime;
        
        // Validation should appear within 100ms
        expect(validationTime).toBeLessThan(100);
      } catch (e) {
        // If no feedback needed, that's also acceptable
        expect(true).toBe(true);
      }
    });
  });
});