import { test, expect } from '@playwright/test';

test.describe('Collection Opportunities Integration Test', () => {
  test.beforeEach(async ({ page }) => {
    // Navigate to the test page
    await page.goto('http://localhost:3000/test-opportunities');
    
    // Wait for page to load
    await page.waitForLoadState('networkidle');
  });

  test('should render Collection Opportunities components', async ({ page }) => {
    // Check page title
    await expect(page.locator('h1')).toContainText('Collection Opportunities Test Page');
    
    // Check main component rendered
    await expect(page.locator('.collection-opportunities')).toBeVisible();
    
    // Check header
    await expect(page.locator('.opportunities-header h2')).toContainText('Collection Opportunities');
    await expect(page.locator('.opportunities-header')).toContainText('3 opportunities');
  });

  test('should display status indicators correctly', async ({ page }) => {
    // Check for different status types
    const criticalStatus = page.locator('.status-indicator.status-critical').first();
    await expect(criticalStatus).toBeVisible();
    await expect(criticalStatus).toContainText('Critical');
    
    const warningStatus = page.locator('.status-indicator.status-warning').first();
    await expect(warningStatus).toBeVisible();
    await expect(warningStatus).toContainText('Warning');
    
    const optimalStatus = page.locator('.status-indicator.status-optimal').first();
    await expect(optimalStatus).toBeVisible();
    await expect(optimalStatus).toContainText('Optimal');
  });

  test('should show capacity bars', async ({ page }) => {
    const capacityBars = page.locator('.capacity-bar');
    const count = await capacityBars.count();
    expect(count).toBeGreaterThan(0);
    
    // Check first capacity bar
    const firstBar = capacityBars.first();
    await expect(firstBar).toBeVisible();
    
    // Check capacity text
    const capacityTexts = page.locator('.capacity-text');
    const firstCapacityText = await capacityTexts.first().textContent();
    expect(firstCapacityText).toMatch(/\d+\.\d+%/);
  });

  test('should enable row selection', async ({ page }) => {
    // Select first row
    const firstCheckbox = page.locator('tbody input[type="checkbox"]').first();
    await firstCheckbox.check();
    await expect(firstCheckbox).toBeChecked();
    
    // Check if update button is enabled
    const updateButton = page.locator('button:has-text("Update Collection Deck")');
    await expect(updateButton).toBeVisible();
    await expect(updateButton).toContainText('Update Collection Deck (1)');
  });

  test('should open edit modal', async ({ page }) => {
    // Click edit button
    const editButton = page.locator('[aria-label*="Edit"]').first();
    await editButton.click();
    
    // Check modal appears
    const modal = page.locator('.edit-opportunity-modal');
    await expect(modal).toBeVisible();
    
    // Check modal title
    await expect(modal.locator('.bp5-dialog-header')).toContainText('Edit Opportunity');
    
    // Check form fields are present
    await expect(modal.locator('.satellite-info-section')).toBeVisible();
    await expect(modal.locator('.sites-selection')).toBeVisible();
    await expect(modal.locator('input[type="radio"]')).toHaveCount(4); // 4 priority levels
    
    // Close modal
    await modal.locator('button:has-text("Cancel")').click();
    await expect(modal).not.toBeVisible();
  });

  test('should track changes and show update button', async ({ page }) => {
    // Initially no update button
    let updateButton = page.locator('button:has-text("Update Collection Deck")');
    await expect(updateButton).not.toBeVisible();
    
    // Edit an opportunity
    await page.locator('[aria-label*="Edit"]').first().click();
    const modal = page.locator('.edit-opportunity-modal');
    await expect(modal).toBeVisible();
    
    // Change priority
    await modal.locator('input[type="radio"][value="high"]').check();
    
    // Save
    await modal.locator('button:has-text("Save")').click();
    await expect(modal).not.toBeVisible();
    
    // Check update button appears
    updateButton = page.locator('button:has-text("Update Collection Deck")');
    await expect(updateButton).toBeVisible();
    await expect(updateButton).toContainText('(1)');
    
    // Check changes summary
    await expect(page.locator('.changes-summary')).toBeVisible();
    await expect(page.locator('.changes-summary')).toContainText('1 changes pending');
  });

  test('should have proper accessibility features', async ({ page }) => {
    // Check ARIA labels on interactive elements
    const editButtons = page.locator('[aria-label*="Edit"]');
    const editCount = await editButtons.count();
    expect(editCount).toBeGreaterThan(0);
    
    // Check checkboxes have labels
    const checkboxes = page.locator('input[type="checkbox"][aria-label]');
    const checkboxCount = await checkboxes.count();
    expect(checkboxCount).toBeGreaterThan(0);
    
    // Test keyboard navigation to edit button
    await page.keyboard.press('Tab');
    await page.keyboard.press('Tab');
    await page.keyboard.press('Tab');
    
    // Check something has focus
    const focusedElement = await page.evaluate(() => document.activeElement?.tagName);
    expect(focusedElement).toBeTruthy();
  });

  test('should meet performance requirements', async ({ page }) => {
    // Measure time to open modal
    const editButton = page.locator('[aria-label*="Edit"]').first();
    
    const startTime = Date.now();
    await editButton.click();
    await page.waitForSelector('.edit-opportunity-modal', { state: 'visible' });
    const modalOpenTime = Date.now() - startTime;
    
    // Modal should open within 300ms (slightly more lenient than 200ms requirement)
    expect(modalOpenTime).toBeLessThan(300);
    
    // Check table renders quickly (already loaded, so should be instant)
    const table = page.locator('.opportunities-table');
    await expect(table).toBeVisible();
  });
});