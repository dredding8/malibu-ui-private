/**
 * Test spec for Enhanced Bento Layout
 * Validates key interactions and UX improvements
 */

import { test, expect } from '@playwright/test';

test.describe('Enhanced Bento Layout Tests', () => {
  test.beforeEach(async ({ page }) => {
    // Navigate to collection opportunities hub
    await page.goto('http://localhost:3000/collection/test-123/manage');
    await page.waitForLoadState('networkidle');
  });

  test('should display enhanced bento layout by default', async ({ page }) => {
    // Check for bento layout structure
    await expect(page.locator('.collection-opportunities-enhanced-bento')).toBeVisible();
    
    // Verify split panels
    await expect(page.locator('.bento-table-panel')).toBeVisible();
    await expect(page.locator('.bento-content-panel')).toBeVisible();
    
    // Dashboard should be visible when no selection
    await expect(page.locator('.enhanced-dashboard-panel')).toBeVisible();
  });

  test('should show health overview and KPIs', async ({ page }) => {
    // Check health score display
    await expect(page.locator('.health-score-large')).toBeVisible();
    
    // Verify all 5 KPI cards are present
    const kpiCards = page.locator('.kpi-card');
    await expect(kpiCards).toHaveCount(5);
    
    // Check for specific KPIs
    await expect(page.locator('.kpi-card.total')).toBeVisible();
    await expect(page.locator('.kpi-card.success')).toBeVisible();
    await expect(page.locator('.kpi-card.warning')).toBeVisible();
    await expect(page.locator('.kpi-card.danger')).toBeVisible();
    await expect(page.locator('.kpi-card.critical')).toBeVisible();
  });

  test('should support keyboard navigation', async ({ page }) => {
    // Test Ctrl+\ to toggle panel
    await page.keyboard.press('Control+\\');
    await expect(page.locator('.bento-table-panel.expanded')).toBeVisible();
    
    await page.keyboard.press('Control+\\');
    await expect(page.locator('.bento-content-panel')).toBeVisible();
    
    // Test Ctrl+1 to focus table
    await page.keyboard.press('Control+1');
    const tablePanel = page.locator('.bento-table-panel');
    await expect(tablePanel).toBeFocused();
    
    // Test Ctrl+2 to focus detail panel
    await page.keyboard.press('Control+2');
    const detailPanel = page.locator('.bento-content-panel');
    await expect(detailPanel).toBeFocused();
  });

  test('should show editor panel on single selection', async ({ page }) => {
    // Click on first opportunity in table
    await page.locator('.opportunities-table tbody tr').first().click();
    
    // Verify editor panel appears
    await expect(page.locator('.allocation-editor-panel')).toBeVisible();
    
    // Dashboard should be hidden
    await expect(page.locator('.enhanced-dashboard-panel')).not.toBeVisible();
  });

  test('should show bulk operations on multiple selection', async ({ page }) => {
    // Select multiple items with Ctrl+Click
    const rows = page.locator('.opportunities-table tbody tr');
    await rows.nth(0).click();
    await rows.nth(1).click({ modifiers: ['Control'] });
    await rows.nth(2).click({ modifiers: ['Control'] });
    
    // Verify bulk operations panel
    await expect(page.locator('.enhanced-bulk-panel')).toBeVisible();
    await expect(page.locator('.selection-summary')).toBeVisible();
    await expect(page.getByText('3 opportunities selected')).toBeVisible();
  });

  test('should resize panels with splitter', async ({ page }) => {
    const splitter = page.locator('.bento-splitter');
    await expect(splitter).toBeVisible();
    
    // Get initial panel width
    const tablePanel = page.locator('.bento-table-panel');
    const initialWidth = await tablePanel.evaluate(el => el.style.width);
    
    // Drag splitter
    await splitter.hover();
    await page.mouse.down();
    await page.mouse.move(100, 0);
    await page.mouse.up();
    
    // Verify width changed
    const newWidth = await tablePanel.evaluate(el => el.style.width);
    expect(newWidth).not.toBe(initialWidth);
  });

  test('should be responsive on mobile', async ({ page }) => {
    // Set mobile viewport
    await page.setViewportSize({ width: 375, height: 667 });
    
    // Check mobile layout
    await expect(page.locator('.collection-opportunities-enhanced-bento.mobile')).toBeVisible();
    await expect(page.locator('.mobile-header')).toBeVisible();
    
    // Panel should be collapsible on mobile
    const toggleButton = page.locator('.mobile-header button');
    await toggleButton.click();
    
    // Panel should collapse
    await expect(page.locator('.mobile-panel')).not.toBeVisible();
  });

  test('should display quick actions', async ({ page }) => {
    // Check quick actions are visible
    await expect(page.locator('.quick-actions-card')).toBeVisible();
    
    // Verify action buttons
    await expect(page.getByRole('button', { name: /Auto-Allocate/i })).toBeVisible();
    await expect(page.getByRole('button', { name: /Resolve Conflicts/i })).toBeVisible();
    await expect(page.getByRole('button', { name: /Export Report/i })).toBeVisible();
    await expect(page.getByRole('button', { name: /Refresh Data/i })).toBeVisible();
  });

  test('should show keyboard shortcuts help', async ({ page }) => {
    // Expand keyboard help
    await page.locator('.keyboard-help summary').click();
    
    // Verify shortcuts are displayed
    await expect(page.getByText('Ctrl+\\')).toBeVisible();
    await expect(page.getByText('Toggle panel')).toBeVisible();
    await expect(page.getByText('Ctrl+1/2')).toBeVisible();
    await expect(page.getByText('Focus panels')).toBeVisible();
  });

  test('should maintain accessibility standards', async ({ page }) => {
    // Check ARIA labels
    await expect(page.locator('[aria-label="Collection opportunities dashboard"]')).toBeVisible();
    await expect(page.locator('[aria-label="Opportunities table"]')).toBeVisible();
    await expect(page.locator('[aria-label="Detail panel"]')).toBeVisible();
    
    // Check focus indicators
    const firstKPI = page.locator('.kpi-card').first();
    await firstKPI.focus();
    const hasFocusStyle = await firstKPI.evaluate(el => {
      const styles = window.getComputedStyle(el);
      return styles.borderColor !== 'transparent';
    });
    expect(hasFocusStyle).toBe(true);
  });
});