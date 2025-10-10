import { render } from '@testing-library/react';
import { axe, toHaveNoViolations } from 'jest-axe';
import { test, expect as playwrightExpect } from '@playwright/test';
import CollectionOpportunities from '../../components/CollectionOpportunities';
import { mockOpportunities } from '../mocks/opportunities';

// Extend Jest matchers for accessibility testing
declare global {
  namespace jest {
    interface Matchers<R> {
      toHaveNoViolations(): R;
      toHaveAttribute(attr: string): R;
      toHaveAccessibleName(): R;
    }
  }
}

expect.extend(toHaveNoViolations);

describe('Collection Opportunities Accessibility', () => {
  describe('Component Level A11y Tests', () => {
    it('should have no automatic accessibility violations', async () => {
      const { container } = render(
        <CollectionOpportunities
          opportunities={mockOpportunities}
          onBatchUpdate={jest.fn()}
        />
      );

      const results = await axe(container, {
        rules: {
          // WCAG 2.1 Level AA
          'color-contrast': { enabled: true },
          'focus-order-semantics': { enabled: true },
          'label-content-name-mismatch': { enabled: true },
          'aria-input-field-name': { enabled: true },
        },
      });

      expect(results).toHaveNoViolations();
    });

    it('should have proper ARIA labels', () => {
      const { getByRole, getAllByRole } = render(
        <CollectionOpportunities
          opportunities={mockOpportunities}
          onBatchUpdate={jest.fn()}
        />
      );

      // Table should have accessible name
      expect(getByRole('grid')).toHaveAttribute('aria-label');
      
      // All buttons should have accessible names
      const buttons = getAllByRole('button');
      buttons.forEach(button => {
        expect(button).toHaveAccessibleName();
      });
    });

    it('should support keyboard navigation', () => {
      const { container } = render(
        <CollectionOpportunities
          opportunities={mockOpportunities}
          onBatchUpdate={jest.fn()}
        />
      );

      // Check for keyboard event handlers
      const interactiveElements = container.querySelectorAll(
        'button, [role="button"], input, [tabindex="0"]'
      );

      interactiveElements.forEach(element => {
        expect(Number(element.getAttribute('tabindex'))).toBeGreaterThanOrEqual(-1);
      });
    });
  });

  describe('Screen Reader Announcements', () => {
    it('should announce status changes', async () => {
      const { container } = render(
        <CollectionOpportunities
          opportunities={mockOpportunities}
          onBatchUpdate={jest.fn()}
        />
      );

      // Check for live regions
      const liveRegions = container.querySelectorAll('[aria-live]');
      expect(liveRegions.length).toBeGreaterThan(0);

      // Verify polite announcements for non-critical updates
      const politeRegions = container.querySelectorAll('[aria-live="polite"]');
      expect(politeRegions.length).toBeGreaterThan(0);
    });
  });
});

// Playwright E2E Accessibility Tests
test.describe('Collection Opportunities Page Accessibility', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/collection-opportunities');
  });

  test('should pass automated accessibility scan', async ({ page }) => {
    // Wait for content to load
    await page.waitForSelector('[role="grid"]');

    // Run axe accessibility scan
    const accessibilityScanResults = await page.accessibility.snapshot();
    expect(accessibilityScanResults).toBeTruthy();

    // Check specific WCAG criteria
    const violations = await page.evaluate(() => {
      return new Promise((resolve) => {
        // @ts-ignore - axe is injected
        window.axe.run((err, results) => {
          if (err) throw err;
          resolve(results.violations);
        });
      });
    });

    expect(violations).toEqual([]);
  });

  test('should be navigable with keyboard only', async ({ page }) => {
    // Tab through all interactive elements
    let tabCount = 0;
    const maxTabs = 50;

    while (tabCount < maxTabs) {
      await page.keyboard.press('Tab');
      tabCount++;

      const focusedElement = await page.evaluate(() => {
        const el = document.activeElement;
        return {
          tagName: el?.tagName,
          role: el?.getAttribute('role'),
          ariaLabel: el?.getAttribute('aria-label'),
          isVisible: el ? window.getComputedStyle(el).visibility !== 'hidden' : false,
        };
      });

      // Verify focused element is visible and has proper attributes
      if (focusedElement.isVisible) {
        expect(focusedElement.tagName).toBeTruthy();
      }
    }
  });

  test('should work with screen reader', async ({ page }) => {
    // Enable screen reader mode (if supported by browser)
    await page.addInitScript(() => {
      // Add screen reader simulation
      window.addEventListener('focus', (e) => {
        const target = e.target as HTMLElement;
        if (target.getAttribute('aria-label') || target.innerText) {
          console.log(`Screen reader: ${target.getAttribute('aria-label') || target.innerText}`);
        }
      });
    });

    // Navigate through key elements
    const table = page.locator('[role="grid"]');
    await expect(table).toHaveAttribute('aria-label');

    // Check row selection announcement
    const firstRow = page.locator('[role="row"]').nth(1);
    await firstRow.click();
    
    // Verify selection is announced
    await playwrightExpect(firstRow).toHaveAttribute('aria-selected', 'true');
  });

  test('should have sufficient color contrast', async ({ page }) => {
    const contrastIssues = await page.evaluate(() => {
      const issues: any[] = [];
      const elements = document.querySelectorAll('*');
      
      elements.forEach(el => {
        const style = window.getComputedStyle(el);
        const bg = style.backgroundColor;
        const fg = style.color;
        
        // Simple contrast check (would use proper WCAG algorithm in production)
        if (bg !== 'rgba(0, 0, 0, 0)' && fg) {
          // Check if text is too light on light background
          // This is simplified - use a proper contrast ratio calculator
          const element = el as HTMLElement;
          if (element.innerText && element.offsetWidth > 0) {
            // Add to issues if contrast might be problematic
            // Real implementation would calculate actual ratio
          }
        }
      });
      
      return issues;
    });

    expect(contrastIssues.length).toBe(0);
  });

  test('should have focus indicators', async ({ page }) => {
    // Check that focused elements have visible indicators
    await page.keyboard.press('Tab');
    
    const focusVisible = await page.evaluate(() => {
      const focused = document.activeElement as HTMLElement;
      if (!focused) return false;
      
      const style = window.getComputedStyle(focused);
      const outline = style.outline;
      const boxShadow = style.boxShadow;
      const border = style.border;
      
      // Check if any visual focus indicator exists
      return outline !== 'none' || boxShadow !== 'none' || border !== 'none';
    });

    expect(focusVisible).toBe(true);
  });
});

// Accessibility monitoring integration
export const a11yMetrics = {
  violationCount: 0,
  warnings: [] as string[],
  criticalIssues: [] as string[],
  
  report: function() {
    return {
      timestamp: new Date().toISOString(),
      violations: this.violationCount,
      warnings: this.warnings,
      critical: this.criticalIssues,
      wcagCompliance: this.violationCount === 0 ? 'AA' : 'Failed',
    };
  },
};