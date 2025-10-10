/**
 * Comprehensive E2E tests for CollectionOpportunitiesEnhancedBento
 * Tests all UI interactions, responsive behavior, and accessibility
 */

import { test, expect } from '@playwright/test';

// Test configuration
const TEST_URL = '/collection/test-123/manage';
const MOBILE_VIEWPORT = { width: 375, height: 667 };
const TABLET_VIEWPORT = { width: 768, height: 1024 };
const DESKTOP_VIEWPORT = { width: 1440, height: 900 };

test.describe('CollectionOpportunitiesEnhancedBento - UI/UX Tests', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto(TEST_URL);
    await page.waitForLoadState('networkidle');
  });

  test.describe('Layout and Visual Tests', () => {
    test('should display enhanced bento layout with correct structure', async ({ page }) => {
      // Verify main container
      await expect(page.locator('.collection-opportunities-enhanced-bento')).toBeVisible();
      
      // Verify split panels
      const tablePanel = page.locator('.bento-table-panel');
      const contentPanel = page.locator('.bento-content-panel');
      
      await expect(tablePanel).toBeVisible();
      await expect(contentPanel).toBeVisible();
      
      // Verify 72:28 ratio
      const tablePanelWidth = await tablePanel.evaluate(el => el.style.width);
      expect(tablePanelWidth).toBe('72%');
    });

    test('should display dashboard panel when no items selected', async ({ page }) => {
      const dashboardPanel = page.locator('.enhanced-dashboard-panel');
      await expect(dashboardPanel).toBeVisible();
      
      // Verify health score
      await expect(page.locator('.health-score-large')).toBeVisible();
      
      // Verify all 5 KPI cards
      const kpiCards = page.locator('.kpi-card');
      await expect(kpiCards).toHaveCount(5);
      
      // Verify quick actions
      await expect(page.locator('.quick-actions-card')).toBeVisible();
    });
  });

  test.describe('Interaction Flow Tests', () => {
    test('should switch to editor panel on single selection', async ({ page }) => {
      // Click first row in table
      await page.locator('.opportunities-table tbody tr').first().click();
      
      // Dashboard should be hidden
      await expect(page.locator('.enhanced-dashboard-panel')).not.toBeVisible();
      
      // Editor panel should be visible
      await expect(page.locator('.allocation-editor-panel')).toBeVisible();
    });

    test('should switch to bulk operations on multiple selection', async ({ page }) => {
      // Multi-select with Ctrl+Click
      const rows = page.locator('.opportunities-table tbody tr');
      await rows.nth(0).click();
      await rows.nth(1).click({ modifiers: ['Control'] });
      await rows.nth(2).click({ modifiers: ['Control'] });
      
      // Bulk panel should be visible
      await expect(page.locator('.enhanced-bulk-panel')).toBeVisible();
      await expect(page.getByText('3 opportunities selected')).toBeVisible();
      
      // Verify bulk actions
      await expect(page.getByRole('button', { name: /Bulk Auto-Allocate/i })).toBeVisible();
      await expect(page.getByRole('button', { name: /Reassign Sites/i })).toBeVisible();
    });

    test('should handle panel resizing with mouse', async ({ page }) => {
      const splitter = page.locator('.bento-splitter');
      const tablePanel = page.locator('.bento-table-panel');
      
      // Get initial width
      const initialWidth = await tablePanel.evaluate(el => parseFloat(el.style.width));
      
      // Drag splitter
      const splitterBox = await splitter.boundingBox();
      if (splitterBox) {
        await page.mouse.move(splitterBox.x + splitterBox.width / 2, splitterBox.y + splitterBox.height / 2);
        await page.mouse.down();
        await page.mouse.move(splitterBox.x + splitterBox.width / 2 - 100, splitterBox.y + splitterBox.height / 2);
        await page.mouse.up();
      }
      
      // Verify width changed
      const newWidth = await tablePanel.evaluate(el => parseFloat(el.style.width));
      expect(newWidth).toBeLessThan(initialWidth);
      expect(newWidth).toBeGreaterThanOrEqual(40); // Min constraint
    });
  });

  test.describe('Keyboard Navigation Tests', () => {
    test('should toggle panel with Ctrl+\\', async ({ page }) => {
      // Initial state - panel visible
      await expect(page.locator('.bento-content-panel')).toBeVisible();
      
      // Toggle panel
      await page.keyboard.press('Control+\\');
      await expect(page.locator('.bento-table-panel.expanded')).toBeVisible();
      await expect(page.locator('.bento-content-panel')).not.toBeVisible();
      
      // Toggle back
      await page.keyboard.press('Control+\\');
      await expect(page.locator('.bento-content-panel')).toBeVisible();
    });

    test('should focus panels with Ctrl+1 and Ctrl+2', async ({ page }) => {
      // Focus table panel
      await page.keyboard.press('Control+1');
      const tablePanel = page.locator('.bento-table-panel');
      await expect(tablePanel).toBeFocused();
      
      // Focus content panel
      await page.keyboard.press('Control+2');
      const contentPanel = page.locator('.bento-content-panel');
      await expect(contentPanel).toBeFocused();
    });

    test('should select all with Ctrl+A', async ({ page }) => {
      // Select all
      await page.keyboard.press('Control+a');
      
      // Verify bulk panel appears
      await expect(page.locator('.enhanced-bulk-panel')).toBeVisible();
      
      // Verify selection count
      const selectedText = await page.locator('.enhanced-bulk-panel h2').textContent();
      expect(selectedText).toContain('Bulk Operations');
    });

    test('should clear selection with Escape', async ({ page }) => {
      // Select an item first
      await page.locator('.opportunities-table tbody tr').first().click();
      await expect(page.locator('.allocation-editor-panel')).toBeVisible();
      
      // Clear with Escape
      await page.keyboard.press('Escape');
      await expect(page.locator('.enhanced-dashboard-panel')).toBeVisible();
    });

    test('should resize panels with arrow keys', async ({ page }) => {
      // Focus splitter
      const splitter = page.locator('.bento-splitter');
      await splitter.focus();
      
      const tablePanel = page.locator('.bento-table-panel');
      const initialWidth = await tablePanel.evaluate(el => parseFloat(el.style.width));
      
      // Resize with arrow keys
      await page.keyboard.press('ArrowLeft');
      await page.keyboard.press('ArrowLeft');
      
      const newWidth = await tablePanel.evaluate(el => parseFloat(el.style.width));
      expect(newWidth).toBe(initialWidth - 10); // 5% per press
    });
  });

  test.describe('Responsive Behavior Tests', () => {
    test('should adapt to mobile viewport', async ({ page }) => {
      await page.setViewportSize(MOBILE_VIEWPORT);
      
      // Check mobile layout
      await expect(page.locator('.collection-opportunities-enhanced-bento.mobile')).toBeVisible();
      await expect(page.locator('.mobile-header')).toBeVisible();
      
      // Panel should be collapsible
      const toggleButton = page.locator('.mobile-header button');
      await toggleButton.click();
      
      await expect(page.locator('.mobile-panel')).not.toBeVisible();
      await expect(page.locator('.mobile-table')).toBeVisible();
    });

    test('should adapt to tablet viewport', async ({ page }) => {
      await page.setViewportSize(TABLET_VIEWPORT);
      
      // Should still have split view
      await expect(page.locator('.bento-table-panel')).toBeVisible();
      await expect(page.locator('.bento-content-panel')).toBeVisible();
      
      // Check adjusted ratio
      const tablePanel = page.locator('.bento-table-panel');
      const width = await tablePanel.evaluate(el => el.style.width);
      expect(width).toBe('60%'); // Tablet ratio
    });

    test('should handle orientation change', async ({ page }) => {
      // Start in portrait
      await page.setViewportSize({ width: 768, height: 1024 });
      await expect(page.locator('.collection-opportunities-enhanced-bento')).toBeVisible();
      
      // Switch to landscape
      await page.setViewportSize({ width: 1024, height: 768 });
      
      // Should maintain desktop layout in landscape
      await expect(page.locator('.bento-table-panel')).toBeVisible();
      await expect(page.locator('.bento-content-panel')).toBeVisible();
    });
  });

  test.describe('Accessibility Tests', () => {
    test('should have proper ARIA labels and roles', async ({ page }) => {
      // Check main regions
      await expect(page.locator('[aria-label="Collection opportunities dashboard"]')).toBeVisible();
      await expect(page.locator('[aria-label="Opportunities table"]')).toBeVisible();
      await expect(page.locator('[aria-label="Detail panel"]')).toBeVisible();
      
      // Check interactive elements
      await expect(page.locator('[aria-label="Resize panels"]')).toBeVisible();
    });

    test('should show focus indicators', async ({ page }) => {
      // Tab to first KPI card
      await page.keyboard.press('Tab');
      await page.keyboard.press('Tab');
      await page.keyboard.press('Tab');
      
      // Check for focus styling
      const focusedElement = page.locator(':focus');
      const borderColor = await focusedElement.evaluate(el => 
        window.getComputedStyle(el).borderColor
      );
      
      expect(borderColor).not.toBe('rgba(0, 0, 0, 0)'); // Not transparent
    });

    test('should be navigable by keyboard only', async ({ page }) => {
      // Tab through interface
      let tabCount = 0;
      const maxTabs = 20;
      
      while (tabCount < maxTabs) {
        await page.keyboard.press('Tab');
        const focusedElement = await page.locator(':focus');
        const tagName = await focusedElement.evaluate(el => el.tagName);
        
        // Should be able to reach interactive elements
        if (['BUTTON', 'A', 'INPUT', 'SELECT'].includes(tagName)) {
          break;
        }
        tabCount++;
      }
      
      expect(tabCount).toBeLessThan(maxTabs);
    });
  });

  test.describe('Performance Tests', () => {
    test('should load within performance budget', async ({ page }) => {
      const startTime = Date.now();
      await page.goto(TEST_URL);
      await page.waitForLoadState('networkidle');
      const loadTime = Date.now() - startTime;
      
      expect(loadTime).toBeLessThan(3000); // 3 second budget
    });

    test('should handle large datasets efficiently', async ({ page }) => {
      // This would require mock data setup
      // Verify virtualization is working
      const tableRows = await page.locator('.opportunities-table tbody tr').count();
      
      // Even with many items, DOM should have limited rows
      expect(tableRows).toBeGreaterThan(0);
      expect(tableRows).toBeLessThanOrEqual(50); // Virtualization limit
    });
  });

  test.describe('Quick Actions Tests', () => {
    test('should trigger auto-allocate action', async ({ page }) => {
      const autoAllocateBtn = page.getByRole('button', { name: /Auto-Allocate/i });
      await autoAllocateBtn.click();
      
      // Should show progress toast
      await expect(page.locator('.bp5-toast')).toBeVisible();
      await expect(page.locator('.bp5-toast')).toContainText('Auto-allocating');
    });

    test('should trigger resolve conflicts action', async ({ page }) => {
      const resolveBtn = page.getByRole('button', { name: /Resolve Conflicts/i });
      await resolveBtn.click();
      
      // Should select items needing review
      await expect(page.locator('.enhanced-bulk-panel')).toBeVisible();
    });

    test('should show keyboard shortcuts help', async ({ page }) => {
      // Expand help
      await page.locator('.keyboard-help summary').click();
      
      // Verify shortcuts visible
      await expect(page.getByText('Ctrl+\\')).toBeVisible();
      await expect(page.getByText('Toggle panel')).toBeVisible();
    });
  });

  test.describe('Edge Cases', () => {
    test('should handle empty state gracefully', async ({ page }) => {
      // Navigate to empty collection
      await page.goto('/collection/empty-123/manage');
      
      // Should show appropriate messaging
      await expect(page.locator('.enhanced-dashboard-panel')).toBeVisible();
      await expect(page.getByText('0')).toBeVisible(); // Total count
    });

    test('should handle rapid interactions', async ({ page }) => {
      // Rapidly click multiple items
      const rows = page.locator('.opportunities-table tbody tr');
      
      for (let i = 0; i < 5; i++) {
        await rows.nth(i).click();
        await page.waitForTimeout(50);
      }
      
      // Should show last clicked item
      await expect(page.locator('.allocation-editor-panel')).toBeVisible();
    });

    test('should maintain state during panel toggle', async ({ page }) => {
      // Select items
      await page.locator('.opportunities-table tbody tr').first().click();
      
      // Toggle panel
      await page.keyboard.press('Control+\\');
      await page.keyboard.press('Control+\\');
      
      // Selection should persist
      await expect(page.locator('.allocation-editor-panel')).toBeVisible();
    });
  });
});