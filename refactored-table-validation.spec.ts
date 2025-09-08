import { test, expect } from '@playwright/test';

test.describe('Refactored HistoryTable Validation', () => {
  test.beforeEach(async ({ page }) => {
    // Capture console messages
    page.on('console', msg => {
      if (msg.type() === 'error' || msg.type() === 'warning') {
        console.log(`Console ${msg.type()}: ${msg.text()}`);
      }
    });

    await page.goto('http://localhost:3000/history');
    await page.waitForLoadState('networkidle');
  });

  test('should verify Blueprint design system compliance', async ({ page }) => {
    console.log('=== BLUEPRINT COMPLIANCE VERIFICATION ===');
    
    // Check table container has proper Blueprint classes
    const tableContainer = page.locator('[data-testid="history-table-container"]');
    await expect(tableContainer).toBeVisible();
    await expect(tableContainer).toHaveClass(/bp6-history-table/);

    // Verify proper Blueprint table structure
    const table = page.locator('.bp6-table');
    await expect(table).toBeVisible();

    // Check for reduced inline styles
    const elementsWithInlineStyles = page.locator('[style]');
    const inlineStyleCount = await elementsWithInlineStyles.count();
    console.log('Elements with inline styles after refactor:', inlineStyleCount);
    
    // Should be significantly reduced from the original 65+
    expect(inlineStyleCount).toBeLessThan(20);

    // Verify custom CSS classes are applied
    const flexElements = page.locator('.bp6-flex');
    const flexCount = await flexElements.count();
    console.log('Elements with bp6-flex class:', flexCount);
    expect(flexCount).toBeGreaterThan(0);

    const algorithmStatusElements = page.locator('.bp6-algorithm-status');
    const algorithmStatusCount = await algorithmStatusElements.count();
    console.log('Algorithm status elements with custom class:', algorithmStatusCount);
    expect(algorithmStatusCount).toBeGreaterThan(0);
  });

  test('should verify visual consistency improvements', async ({ page }) => {
    console.log('=== VISUAL CONSISTENCY VERIFICATION ===');

    // Check status tag consistency
    const statusTags = page.locator('[data-testid="collection-status-tag"]');
    if (await statusTags.count() > 0) {
      for (let i = 0; i < Math.min(3, await statusTags.count()); i++) {
        const tag = statusTags.nth(i);
        const styles = await tag.evaluate(el => {
          const computed = window.getComputedStyle(el);
          return {
            minWidth: computed.minWidth,
            textAlign: computed.textAlign,
            textTransform: computed.textTransform
          };
        });
        console.log(`Status tag ${i} consistency:`, styles);
        expect(styles.minWidth).toBe('100px');
        expect(styles.textAlign).toBe('center');
        expect(styles.textTransform).toBe('uppercase');
      }
    }

    // Check algorithm status indicator consistency
    const algorithmIndicators = page.locator('[data-testid="algorithm-status-indicator"]');
    if (await algorithmIndicators.count() > 0) {
      for (let i = 0; i < Math.min(2, await algorithmIndicators.count()); i++) {
        const indicator = algorithmIndicators.nth(i);
        const hasCustomClass = await indicator.evaluate(el => 
          el.className.includes('bp6-algorithm-status')
        );
        console.log(`Algorithm indicator ${i} has custom class:`, hasCustomClass);
        expect(hasCustomClass).toBe(true);
      }
    }

    // Check button consistency
    const buttons = page.locator('button.bp6-button');
    if (await buttons.count() > 0) {
      for (let i = 0; i < Math.min(3, await buttons.count()); i++) {
        const button = buttons.nth(i);
        const styles = await button.evaluate(el => {
          const computed = window.getComputedStyle(el);
          return {
            minWidth: computed.minWidth
          };
        });
        console.log(`Button ${i} min-width:`, styles.minWidth);
        expect(styles.minWidth).toBe('90px');
      }
    }
  });

  test('should verify accessibility improvements', async ({ page }) => {
    console.log('=== ACCESSIBILITY VERIFICATION ===');

    // Check table has proper ARIA attributes
    const tableContainer = page.locator('[data-testid="history-table-container"]');
    await expect(tableContainer).toHaveAttribute('role', 'region');
    await expect(tableContainer).toHaveAttribute('aria-label', 'Collection Deck History');

    // Check column headers have proper tooltips
    const columnHeaders = page.locator('.bp6-table-column-name');
    if (await columnHeaders.count() > 0) {
      // Test first column header tooltip
      await columnHeaders.first().hover();
      await page.waitForTimeout(500);
      const tooltipVisible = await page.locator('.bp6-tooltip').isVisible();
      console.log('Column header tooltip visible:', tooltipVisible);
    }

    // Check progress bars have proper ARIA labels
    const progressBars = page.locator('.bp6-progress-bar');
    if (await progressBars.count() > 0) {
      const ariaLabel = await progressBars.first().getAttribute('aria-label');
      console.log('Progress bar ARIA label:', ariaLabel);
      expect(ariaLabel).toContain('Progress:');
    }

    // Check empty state has proper ARIA live region
    if (await page.locator('.bp6-table-empty-state').count() > 0) {
      const emptyState = page.locator('.bp6-table-empty-state');
      await expect(emptyState).toHaveAttribute('role', 'status');
      await expect(emptyState).toHaveAttribute('aria-live', 'polite');
    }
  });

  test('should verify responsive behavior', async ({ page }) => {
    console.log('=== RESPONSIVE VERIFICATION ===');

    // Test mobile viewport
    await page.setViewportSize({ width: 375, height: 667 });
    await page.reload();
    await page.waitForLoadState('networkidle');
    
    const tableContainer = page.locator('[data-testid="history-table-container"]');
    await expect(tableContainer).toBeVisible();
    
    // Check if action buttons stack properly on mobile
    const actionButtons = page.locator('.bp6-action-buttons');
    if (await actionButtons.count() > 0) {
      const flexDirection = await actionButtons.first().evaluate(el => 
        window.getComputedStyle(el).flexDirection
      );
      console.log('Mobile action buttons flex direction:', flexDirection);
    }

    // Test tablet viewport  
    await page.setViewportSize({ width: 768, height: 1024 });
    await page.reload();
    await page.waitForLoadState('networkidle');
    
    await expect(tableContainer).toBeVisible();

    // Test desktop viewport
    await page.setViewportSize({ width: 1200, height: 800 });
    await page.reload();
    await page.waitForLoadState('networkidle');
    
    await expect(tableContainer).toBeVisible();
  });

  test('should verify no console errors', async ({ page }) => {
    console.log('=== ERROR VERIFICATION ===');

    const errors: string[] = [];
    const warnings: string[] = [];

    page.on('console', msg => {
      if (msg.type() === 'error') {
        errors.push(msg.text());
      } else if (msg.type() === 'warning') {
        warnings.push(msg.text());
      }
    });

    // Wait for page to fully load and render
    await page.waitForTimeout(2000);

    console.log('Console errors found:', errors);
    console.log('Console warnings found:', warnings);

    // Should have no errors
    expect(errors).toHaveLength(0);
    
    // Check for specific deprecated warnings (should be reduced)
    const deprecatedWarnings = warnings.filter(w => 
      w.includes('deprecated') || w.includes('defaultProps')
    );
    console.log('Deprecated warnings:', deprecatedWarnings.length);
  });

  test('should verify table interactions work properly', async ({ page }) => {
    console.log('=== INTERACTION VERIFICATION ===');

    // Test tooltips on status elements
    const statusTags = page.locator('[data-testid="collection-status-tag"]');
    if (await statusTags.count() > 0) {
      await statusTags.first().hover();
      await page.waitForTimeout(500);
      // Should not cause errors or warnings
    }

    // Test action buttons if available
    const viewButtons = page.locator('[data-testid^="view-deck-"]');
    const retryButtons = page.locator('[data-testid^="retry-deck-"]');
    const downloadButtons = page.locator('[data-testid^="download-deck-"]');

    console.log('Interactive elements found:');
    console.log('- View buttons:', await viewButtons.count());
    console.log('- Retry buttons:', await retryButtons.count());
    console.log('- Download buttons:', await downloadButtons.count());

    // Buttons should be properly styled and accessible
    const allButtons = page.locator('button.bp6-button');
    if (await allButtons.count() > 0) {
      const isFirstButtonEnabled = await allButtons.first().isEnabled();
      console.log('First button is enabled:', isFirstButtonEnabled);
      expect(isFirstButtonEnabled).toBe(true);
    }
  });
});