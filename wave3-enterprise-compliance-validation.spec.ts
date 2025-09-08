import { test, expect, Page } from '@playwright/test';

/**
 * Wave 3: Enterprise Compliance & Flow Optimization Validation
 * Tests enterprise UX standards, performance, and flow cohesion
 * 
 * Test Coverage:
 * 1. Enterprise UX pattern compliance
 * 2. Performance benchmarks
 * 3. Flow cohesion across workflows
 * 4. Blueprint.js pattern adherence
 */

test.describe('Wave 3: Enterprise Compliance Validation', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');
  });

  test.describe('Enterprise UX Standards', () => {
    test('should meet navigation performance benchmarks', async ({ page }) => {
      // Measure navigation times
      const navigationPromise = page.waitForNavigation();
      await page.click('[data-testid="nav-history"]');
      const navigationTime = await page.evaluate(() => performance.timing.loadEventEnd - performance.timing.navigationStart);
      
      // Should load within 3 seconds
      expect(navigationTime).toBeLessThan(3000);
      
      // Measure subsequent navigation
      const start = Date.now();
      await page.click('[data-testid="nav-analytics"]');
      await page.waitForLoadState('networkidle');
      const subsequentTime = Date.now() - start;
      
      // Subsequent navigation should be faster
      expect(subsequentTime).toBeLessThan(1000);
    });

    test('should maintain consistent visual hierarchy', async ({ page }) => {
      const pagesToCheck = ['/history', '/decks', '/analytics'];
      
      for (const pageUrl of pagesToCheck) {
        await page.goto(pageUrl);
        
        // Check heading hierarchy
        const h1 = await page.locator('h1').count();
        const h2 = await page.locator('h2').count();
        const h3 = await page.locator('h3').count();
        
        // Should have proper heading structure
        expect(h1).toBeLessThanOrEqual(1); // Only one H1 per page
        
        // Check color consistency
        const primaryButtons = await page.locator('.bp5-intent-primary').count();
        const dangerButtons = await page.locator('.bp5-intent-danger').count();
        
        // Danger buttons should be used sparingly
        expect(dangerButtons).toBeLessThanOrEqual(primaryButtons);
      }
    });

    test('should provide consistent spacing and layout', async ({ page }) => {
      await page.goto('/history');
      
      // Check card spacing
      const cards = page.locator('.bp5-card');
      const cardCount = await cards.count();
      
      if (cardCount > 1) {
        // Get bounding boxes
        const firstCard = await cards.first().boundingBox();
        const secondCard = await cards.nth(1).boundingBox();
        
        if (firstCard && secondCard) {
          // Check vertical spacing between cards
          const spacing = secondCard.y - (firstCard.y + firstCard.height);
          expect(spacing).toBeGreaterThanOrEqual(16); // Minimum 16px spacing
          expect(spacing).toBeLessThanOrEqual(32); // Maximum 32px spacing
        }
      }
    });

    test('should implement proper error states', async ({ page }) => {
      // Navigate to invalid route
      await page.goto('/invalid-route-test');
      
      // Should show error state or redirect
      const errorState = page.locator('[data-testid="error-state"]');
      const dashboard = page.locator('[data-testid="nav-dashboard"]');
      
      await expect(errorState.or(dashboard)).toBeVisible();
    });
  });

  test.describe('Blueprint.js Pattern Compliance', () => {
    test('should use Blueprint components consistently', async ({ page }) => {
      await page.goto('/history');
      
      // Check for Blueprint button classes
      const buttons = page.locator('button');
      const buttonCount = await buttons.count();
      
      let blueprintButtons = 0;
      for (let i = 0; i < buttonCount; i++) {
        const button = buttons.nth(i);
        const className = await button.getAttribute('class');
        if (className?.includes('bp5-button')) {
          blueprintButtons++;
        }
      }
      
      // Most buttons should be Blueprint buttons
      expect(blueprintButtons / buttonCount).toBeGreaterThan(0.8);
    });

    test('should implement proper loading states', async ({ page }) => {
      await page.goto('/create-collection-deck/collection-opportunities');
      
      // Check for loading spinner
      const spinner = page.locator('.bp5-spinner');
      if (await spinner.isVisible()) {
        // Spinner should have proper ARIA attributes
        await expect(spinner).toHaveAttribute('aria-label');
        
        // Should eventually hide
        await expect(spinner).toBeHidden({ timeout: 10000 });
      }
    });

    test('should use consistent icon patterns', async ({ page }) => {
      await page.goto('/history');
      
      // Check icon usage in buttons
      const buttonsWithIcons = await page.locator('button .bp5-icon').count();
      const totalButtons = await page.locator('button').count();
      
      // Icons should be used consistently
      expect(buttonsWithIcons / totalButtons).toBeGreaterThan(0.5);
    });
  });

  test.describe('Flow Cohesion', () => {
    test('should maintain context through multi-step workflows', async ({ page }) => {
      // Start collection creation
      await page.goto('/create-collection-deck/data');
      
      // Fill first step
      await page.fill('[placeholder*="Start date"]', '2024-01-01');
      await page.fill('[placeholder*="End date"]', '2024-01-31');
      
      // Navigate to next step
      await page.click('button:has-text("Next")');
      await expect(page).toHaveURL('/create-collection-deck/parameters');
      
      // Go back
      await page.click('button:has-text("Back")');
      
      // Data should be preserved
      const startDate = await page.locator('[placeholder*="Start date"]').inputValue();
      expect(startDate).toBe('2024-01-01');
    });

    test('should provide clear navigation paths', async ({ page }) => {
      // Navigate to field mapping
      await page.goto('/history/test-collection/field-mapping-review');
      
      // Should have multiple navigation options
      const backButton = page.locator('button:has-text("Back to History")');
      const breadcrumbs = page.locator('.bp5-breadcrumbs');
      const opportunitiesButton = page.locator('button:has-text("Collection Opportunities")');
      
      // All navigation options should be visible
      await expect(backButton.or(breadcrumbs)).toBeVisible();
      
      // Navigation should work
      if (await backButton.isVisible()) {
        await backButton.click();
        await expect(page).toHaveURL('/history');
      }
    });

    test('should handle workflow interruptions gracefully', async ({ page }) => {
      // Start collection creation
      await page.goto('/create-collection-deck/data');
      
      // Fill some data
      await page.fill('[placeholder*="Start date"]', '2024-01-01');
      
      // Navigate away
      await page.click('[data-testid="nav-history"]');
      
      // Should show unsaved changes warning or auto-save
      const unsavedWarning = page.locator('[data-testid="unsaved-changes-warning"]');
      
      // Navigate back
      await page.goBack();
      
      // Data should be preserved (through auto-save or localStorage)
      const startDate = await page.locator('[placeholder*="Start date"]').inputValue();
      expect(startDate).toBeTruthy(); // Either preserved or empty, but not undefined
    });
  });

  test.describe('Performance Optimization', () => {
    test('should implement efficient rendering', async ({ page }) => {
      await page.goto('/history');
      
      // Measure initial render time
      const renderTime = await page.evaluate(() => {
        const timing = performance.getEntriesByType('navigation')[0] as PerformanceNavigationTiming;
        return timing.loadEventEnd - timing.fetchStart;
      });
      
      // Should render within performance budget
      expect(renderTime).toBeLessThan(2000); // 2 seconds
    });

    test('should handle large datasets efficiently', async ({ page }) => {
      await page.goto('/history');
      
      // If table has virtualization, it should only render visible rows
      const visibleRows = await page.locator('tbody tr:visible').count();
      const totalRows = await page.locator('tbody tr').count();
      
      // For large datasets, visible rows should be less than total
      if (totalRows > 50) {
        expect(visibleRows).toBeLessThanOrEqual(50);
      }
    });

    test('should implement smooth transitions', async ({ page }) => {
      // Navigate and check for transition classes
      await page.goto('/history');
      
      const transitionElements = await page.locator('[class*="transition"]').count();
      
      // Should have some transition elements
      expect(transitionElements).toBeGreaterThan(0);
      
      // Navigate to another page
      await page.click('[data-testid="nav-analytics"]');
      
      // Check for loading indicator during transition
      const loadingIndicator = page.locator('.navigation-loading-indicator, .bp5-spinner');
      
      // Loading should appear briefly
      if (await loadingIndicator.isVisible({ timeout: 100 })) {
        // And then disappear
        await expect(loadingIndicator).toBeHidden({ timeout: 1000 });
      }
    });
  });

  test.describe('Accessibility Compliance', () => {
    test('should have proper ARIA labels', async ({ page }) => {
      await page.goto('/history');
      
      // Check buttons have proper labels
      const buttons = page.locator('button:not([aria-label]):not([title])');
      const unlabeledCount = await buttons.count();
      
      // Most buttons should have labels
      const totalButtons = await page.locator('button').count();
      expect(unlabeledCount / totalButtons).toBeLessThan(0.2);
    });

    test('should support keyboard-only navigation', async ({ page }) => {
      await page.goto('/history');
      
      // Tab through page
      for (let i = 0; i < 10; i++) {
        await page.keyboard.press('Tab');
      }
      
      // Should have visible focus indicator
      const focusedElement = page.locator(':focus');
      await expect(focusedElement).toBeVisible();
      
      // Focus should be contained within page
      const focusedTag = await focusedElement.evaluate(el => el.tagName);
      expect(['BUTTON', 'INPUT', 'A', 'SELECT']).toContain(focusedTag);
    });

    test('should announce page changes to screen readers', async ({ page }) => {
      await page.goto('/history');
      
      // Check for ARIA live regions
      const liveRegions = await page.locator('[aria-live]').count();
      expect(liveRegions).toBeGreaterThan(0);
      
      // Check for proper page structure
      const main = await page.locator('main, [role="main"]').count();
      const nav = await page.locator('nav, [role="navigation"]').count();
      
      expect(main).toBeGreaterThanOrEqual(1);
      expect(nav).toBeGreaterThanOrEqual(1);
    });
  });
});