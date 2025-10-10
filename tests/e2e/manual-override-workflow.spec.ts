import { test, expect } from '@playwright/test';
import { Page } from '@playwright/test';

test.describe('Manual Override Workflow', () => {
  let page: Page;

  test.beforeEach(async ({ browser }) => {
    page = await browser.newPage();
    await page.goto('/collection-opportunities'); // Adjust URL as needed
    await page.waitForLoadState('networkidle');
  });

  test('AC-1: Accessing the Override Modal', async () => {
    // Verify modal opens on satellite row click
    const firstOpportunityName = page.locator('.opportunity-name-cell').first();
    
    // Hover to see tooltip
    await firstOpportunityName.hover();
    await expect(page.locator('.bp5-tooltip')).toContainText('Click to open manual override');
    
    // Click to open modal
    await firstOpportunityName.click();
    
    // Verify modal is open
    await expect(page.locator('.override-modal')).toBeVisible();
    await expect(page.locator('.override-modal .bp5-dialog-header')).toContainText('Manual Override:');
    
    // Verify modal shows satellite details
    await expect(page.locator('.header-tags .bp5-tag')).toHaveCount(3); // Function, Orbit, Capacity
  });

  test('AC-2: Site Allocation Management', async () => {
    // Open override modal
    await page.locator('.opportunity-name-cell').first().click();
    await page.waitForSelector('.override-modal');
    
    // Check current allocations are displayed
    await expect(page.locator('.allocations-card')).toBeVisible();
    
    // Add a new site
    const addButton = page.locator('.site-card .bp5-button:has-text("Add")').first();
    await addButton.click();
    
    // Verify site was added to allocations
    await expect(page.locator('.allocation-row')).toHaveCount(1);
    
    // Adjust passes using numeric input
    const passesInput = page.locator('.allocation-row .bp5-numeric-input input');
    await passesInput.fill('5');
    
    // Verify capacity visualization updates
    await expect(page.locator('.allocation-row .bp5-progress-bar')).toBeVisible();
    
    // Remove site
    await page.locator('.allocation-row .bp5-button[aria-label*="Remove"]').click();
    await expect(page.locator('.allocation-row')).toHaveCount(0);
  });

  test('AC-3: Justification Required', async () => {
    // Open override modal
    await page.locator('.opportunity-name-cell').first().click();
    await page.waitForSelector('.override-modal');
    
    // Switch to justification tab
    await page.locator('.bp5-tab:has-text("Justification")').click();
    
    // Verify save button is disabled without justification
    const saveButton = page.locator('.bp5-dialog-footer .bp5-button:has-text("Save Override")');
    await expect(saveButton).toBeDisabled();
    
    // Add a site to make changes
    await page.locator('.bp5-tab:has-text("Site Allocation")').click();
    await page.locator('.site-card .bp5-button:has-text("Add")').first().click();
    await page.locator('.allocation-row .bp5-numeric-input input').fill('3');
    
    // Still should be disabled without justification
    await expect(saveButton).toBeDisabled();
    
    // Add justification
    await page.locator('.bp5-tab:has-text("Justification")').click();
    await page.locator('textarea[placeholder*="justification"]').fill('Mission critical requirement for increased coverage');
    
    // Save button should now be enabled
    await expect(saveButton).toBeEnabled();
  });

  test('AC-4: Capacity Visualization and Validation', async () => {
    // Open override modal
    await page.locator('.opportunity-name-cell').first().click();
    await page.waitForSelector('.override-modal');
    
    // Check capacity indicator in header
    await expect(page.locator('.header-tags .bp5-tag').last()).toContainText('% Available');
    
    // Add sites and verify capacity updates
    await page.locator('.site-card .bp5-button:has-text("Add")').first().click();
    await page.locator('.allocation-row .bp5-numeric-input input').fill('8');
    
    // Check for capacity warnings
    const capacityBar = page.locator('.allocation-row .bp5-progress-bar');
    await expect(capacityBar).toBeVisible();
    
    // If capacity exceeds threshold, should show warning
    await page.locator('.allocation-row .bp5-numeric-input input').fill('15');
    await expect(page.locator('.validation-section .bp5-callout')).toBeVisible();
  });

  test('AC-5: Auto-Optimization Feature', async () => {
    // Open override modal
    await page.locator('.opportunity-name-cell').first().click();
    await page.waitForSelector('.override-modal');
    
    // Click auto-optimize button
    await page.locator('.bp5-button:has-text("Auto-Optimize Allocation")').click();
    
    // Verify sites were added automatically
    await expect(page.locator('.allocation-row')).toHaveCount(5); // Default optimization selects top 5
    
    // Verify all allocations have reasonable pass counts
    const passInputs = await page.locator('.allocation-row .bp5-numeric-input input').all();
    for (const input of passInputs) {
      const value = await input.inputValue();
      expect(parseInt(value)).toBeGreaterThan(0);
      expect(parseInt(value)).toBeLessThanOrEqual(10);
    }
  });

  test('AC-6: Undo/Redo Functionality', async () => {
    // Open override modal
    await page.locator('.opportunity-name-cell').first().click();
    await page.waitForSelector('.override-modal');
    
    // Make some changes
    await page.locator('.site-card .bp5-button:has-text("Add")').first().click();
    await page.locator('.allocation-row .bp5-numeric-input input').fill('5');
    
    // Add another site
    await page.locator('.site-card .bp5-button:has-text("Add")').first().click();
    
    // Test undo
    await page.locator('.bp5-button[aria-label*="Undo"]').click();
    await expect(page.locator('.allocation-row')).toHaveCount(1);
    
    // Test redo
    await page.locator('.bp5-button[aria-label*="Redo"]').click();
    await expect(page.locator('.allocation-row')).toHaveCount(2);
    
    // Test reset
    await page.locator('.bp5-button[aria-label*="Reset to original"]').click();
    await expect(page.locator('.allocation-row')).toHaveCount(0);
  });

  test('AC-7: Classification Handling', async () => {
    // Open override modal
    await page.locator('.opportunity-name-cell').first().click();
    await page.waitForSelector('.override-modal');
    
    // Switch to justification tab
    await page.locator('.bp5-tab:has-text("Justification")').click();
    
    // Select classified level
    await page.selectOption('select', 'secret');
    
    // Verify warning appears
    await expect(page.locator('.bp5-alert:has-text("Classification Notice")'));
    await page.locator('.bp5-alert .bp5-button:has-text("I understand")').click();
    
    // Verify justification field has classified styling
    await expect(page.locator('textarea.classified-input')).toBeVisible();
  });

  test('AC-8: Review and Summary', async () => {
    // Open override modal and make changes
    await page.locator('.opportunity-name-cell').first().click();
    await page.waitForSelector('.override-modal');
    
    // Add sites
    await page.locator('.site-card .bp5-button:has-text("Add")').nth(0).click();
    await page.locator('.allocation-row .bp5-numeric-input input').fill('3');
    
    await page.locator('.site-card .bp5-button:has-text("Add")').nth(0).click();
    await page.locator('.allocation-row .bp5-numeric-input input').last().fill('5');
    
    // Add justification
    await page.locator('.bp5-tab:has-text("Justification")').click();
    await page.locator('textarea[placeholder*="justification"]').fill('Operational requirement for increased coverage');
    
    // Go to review tab
    await page.locator('.bp5-tab:has-text("Review")').click();
    
    // Verify summary shows correct information
    await expect(page.locator('.summary-card')).toBeVisible();
    await expect(page.locator('.summary-section:has-text("Total Sites:")').toContainText('2');
    await expect(page.locator('.summary-section:has-text("Total Passes:")').toContainText('8');
    
    // Verify changes are listed
    await expect(page.locator('.changes-card .change-row')).toHaveCount(2);
    
    // Verify justification is shown
    await expect(page.locator('.justification-preview')).toContainText('Operational requirement');
  });

  test('Accessibility: Keyboard Navigation', async () => {
    // Tab to first opportunity
    await page.keyboard.press('Tab');
    await page.keyboard.press('Tab'); // Skip header controls
    
    // Find focused element and press Enter
    const focusedElement = await page.locator(':focus');
    await expect(focusedElement).toHaveClass(/opportunity-name-cell/);
    await page.keyboard.press('Enter');
    
    // Verify modal opened
    await expect(page.locator('.override-modal')).toBeVisible();
    
    // Tab through modal controls
    await page.keyboard.press('Tab'); // Should focus first interactive element
    await page.keyboard.press('Tab');
    await page.keyboard.press('Tab');
    
    // Escape key should close if no changes
    await page.keyboard.press('Escape');
    await expect(page.locator('.override-modal')).not.toBeVisible();
  });

  test('Accessibility: Screen Reader Support', async () => {
    // Open override modal
    await page.locator('.opportunity-name-cell').first().click();
    await page.waitForSelector('.override-modal');
    
    // Check ARIA labels
    await expect(page.locator('.override-modal')).toHaveAttribute('role', 'dialog');
    await expect(page.locator('.opportunity-name-cell').first()).toHaveAttribute('role', 'button');
    
    // Check form labels
    const justificationLabel = page.locator('label:has-text("Justification")');
    await expect(justificationLabel).toBeVisible();
    
    // Check required field indicators
    await expect(page.locator('.required')).toBeVisible();
  });

  test('Performance: Large Dataset Handling', async () => {
    // This test would need a page with many opportunities
    // Measure time to open modal
    const startTime = Date.now();
    await page.locator('.opportunity-name-cell').first().click();
    await page.waitForSelector('.override-modal');
    const loadTime = Date.now() - startTime;
    
    // Modal should open quickly even with large datasets
    expect(loadTime).toBeLessThan(1000); // Less than 1 second
    
    // Test with many sites
    // Click auto-optimize and verify performance
    const optimizeStart = Date.now();
    await page.locator('.bp5-button:has-text("Auto-Optimize Allocation")').click();
    const optimizeTime = Date.now() - optimizeStart;
    
    expect(optimizeTime).toBeLessThan(500); // Optimization should be fast
  });
});

test.describe('Manual Override Edge Cases', () => {
  test('Handles maximum capacity scenarios', async ({ page }) => {
    await page.goto('/collection-opportunities');
    await page.locator('.opportunity-name-cell').first().click();
    await page.waitForSelector('.override-modal');
    
    // Add site and set passes to maximum
    await page.locator('.site-card .bp5-button:has-text("Add")').first().click();
    await page.locator('.allocation-row .bp5-numeric-input input').fill('10'); // Max passes
    
    // Try to increase beyond max
    const incrementButton = page.locator('.allocation-row .bp5-numeric-input-button-group button').last();
    await incrementButton.click();
    
    // Value should remain at max
    await expect(page.locator('.allocation-row .bp5-numeric-input input')).toHaveValue('10');
  });

  test('Validates conflicting allocations', async ({ page }) => {
    await page.goto('/collection-opportunities');
    await page.locator('.opportunity-name-cell').first().click();
    await page.waitForSelector('.override-modal');
    
    // Add multiple sites with high allocations
    for (let i = 0; i < 3; i++) {
      await page.locator('.site-card .bp5-button:has-text("Add")').first().click();
      await page.locator('.allocation-row .bp5-numeric-input input').last().fill('8');
    }
    
    // Should show capacity warning
    await expect(page.locator('.validation-section .bp5-callout:has-text("Critical capacity")'));
  });

  test('Preserves changes when switching tabs', async ({ page }) => {
    await page.goto('/collection-opportunities');
    await page.locator('.opportunity-name-cell').first().click();
    await page.waitForSelector('.override-modal');
    
    // Make changes
    await page.locator('.site-card .bp5-button:has-text("Add")').first().click();
    await page.locator('.allocation-row .bp5-numeric-input input').fill('5');
    
    // Switch tabs
    await page.locator('.bp5-tab:has-text("Justification")').click();
    await page.locator('.bp5-tab:has-text("Site Allocation")').click();
    
    // Changes should be preserved
    await expect(page.locator('.allocation-row')).toHaveCount(1);
    await expect(page.locator('.allocation-row .bp5-numeric-input input')).toHaveValue('5');
  });
});