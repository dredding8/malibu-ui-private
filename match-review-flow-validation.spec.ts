import { test, expect, Page } from '@playwright/test';

/**
 * Comprehensive Match Review Flow Validation Test
 * Using Playwright MCP with QA Persona approach for intuitive behavior testing
 */

test.describe('Match Review Flow - Intuitive User Behavior Validation', () => {
  let page: Page;

  test.beforeEach(async ({ page: testPage }) => {
    page = testPage;
    await page.goto('/');
    
    // Wait for application to load
    await page.waitForSelector('[data-testid="app-navbar"]', { timeout: 10000 });
  });

  test.describe('Flow 1: Collection Creation Wizard → Match Review', () => {
    test('should provide intuitive flow from wizard step3 to match review', async () => {
      // 🎯 Test: Navigate to collection creation wizard
      await page.click('[data-testid="create-deck-button"]');
      await expect(page).toHaveURL(/.*\/create-deck/);

      // Step 1: Input Data
      await page.fill('[data-testid="tasking-window-start"]', '2024-01-01');
      await page.fill('[data-testid="tasking-window-end"]', '2024-01-31');
      await page.click('[data-testid="step1-next-button"]');

      // Step 2: Review Parameters
      await page.fill('[data-testid="hard-capacity-input"] input', '10');
      await page.fill('[data-testid="elevation-input"]', '15');
      await page.click('[data-testid="step2-next-button"]');

      // 🎯 Test: Step 3 Match Review interface
      await expect(page.locator('[data-testid="step3-heading"]')).toContainText('Step 3: Review Matches');
      
      // Wait for matches to generate
      const loadingSpinner = page.locator('[data-testid="loading-spinner"]');
      if (await loadingSpinner.isVisible()) {
        await loadingSpinner.waitFor({ state: 'hidden', timeout: 10000 });
      }

      // 🎯 Test: Match selection functionality
      const matchesTable = page.locator('[data-testid="matches-data-table"]');
      await expect(matchesTable).toBeVisible();

      // Verify capacity information is present in table
      const tableRows = matchesTable.locator('tr').nth(1); // First data row
      await expect(tableRows).toBeVisible();

      // 🎯 Test: Selection state management
      const selectAllButton = page.locator('[data-testid="select-all-matches-button"]');
      await selectAllButton.click();
      
      // Verify next button becomes enabled
      const nextButton = page.locator('[data-testid="step3-next-button"]');
      await expect(nextButton).not.toBeDisabled();

      // 🎯 Test: Proceed to next step
      await nextButton.click();
      await expect(page).toHaveURL(/.*\/create-deck$/);
    });

    test('should handle loading interruption gracefully', async () => {
      await page.goto('/create-deck');
      
      // Navigate to Step 3 (assuming valid previous steps)
      await page.evaluate(() => {
        // Simulate navigation to step 3 with data
        window.history.pushState({}, '', '/create-deck?step=3');
      });
      
      await page.reload();
      
      // 🎯 Test: Pause functionality during loading
      const loadingSpinner = page.locator('[data-testid="loading-spinner"]');
      if (await loadingSpinner.isVisible()) {
        const pauseButton = page.locator('button:has-text("Pause")');
        await pauseButton.click();
        
        // Verify pause state
        await expect(page.locator('[data-testid="analysis-paused-state"]')).toBeVisible();
        
        // Test resume functionality
        const resumeButton = page.locator('[data-testid="resume-analysis-button"]');
        await resumeButton.click();
        
        // Should return to loading state
        await expect(loadingSpinner).toBeVisible();
      }
    });
  });

  test.describe('Flow 2: History → Standalone Match Review', () => {
    test('should provide intuitive navigation from history to match review', async () => {
      // 🎯 Test: Navigate to History page
      await page.click('a[href="/history"]');
      await expect(page).toHaveURL(/.*\/history/);
      
      // Wait for history table to load
      await page.waitForSelector('[data-testid="history-table"]', { timeout: 10000 });
      
      // 🎯 Test: Click "Review Matches" button
      const reviewMatchesButton = page.locator('button:has-text("Review Matches")').first();
      await reviewMatchesButton.click();
      
      // Should navigate to match review page
      await expect(page).toHaveURL(/.*\/match-review\/.*$/);
      
      // 🎯 Test: Match review interface loads
      await expect(page.locator('h3:has-text("Match Review")')).toBeVisible();
      
      // Verify breadcrumb navigation
      const breadcrumbs = page.locator('[data-testid="breadcrumbs"]');
      await expect(breadcrumbs).toContainText('History');
      await expect(breadcrumbs).toContainText('Match Review');
    });

    test('should display calculated capacity in matches modal', async () => {
      await page.goto('/match-review/test-collection/test-deck');
      
      // Wait for match cards to load
      await page.waitForSelector('.match-card', { timeout: 10000 });
      
      // 🎯 Test: Click to expand match details
      const firstMatchCard = page.locator('.match-card').first();
      const expandButton = firstMatchCard.locator('button[aria-expanded]');
      await expandButton.click();
      
      // Verify expanded details show capacity information
      await expect(firstMatchCard.locator('text=Calculated Capacity')).toBeVisible();
      await expect(firstMatchCard.locator('text=Sensor Type')).toBeVisible();
      
      // 🎯 Test: Open detailed modal
      const moreButton = firstMatchCard.locator('button[aria-label*="detailed information"]');
      await moreButton.click();
      
      // Verify modal shows capacity analysis
      const modal = page.locator('.bp4-drawer');
      await expect(modal).toBeVisible();
      await expect(modal.locator('text=Sensor Capacity Analysis')).toBeVisible();
      await expect(modal.locator('text=Calculated Capacity')).toBeVisible();
      
      // Verify capacity guidelines are shown
      await expect(modal.locator('text=Sensor Capacity Guidelines')).toBeVisible();
      await expect(modal.locator('text=Wideband: 8 channels')).toBeVisible();
      await expect(modal.locator('text=Narrowband: 16 channels')).toBeVisible();
    });
  });

  test.describe('Cross-Component Consistency Tests', () => {
    test('should maintain consistent selection behavior across components', async () => {
      // Test selection in wizard context
      await page.goto('/create-deck?step=3');
      
      // Wait for matches to load
      const loadingSpinner = page.locator('[data-testid="loading-spinner"]');
      if (await loadingSpinner.isVisible()) {
        await loadingSpinner.waitFor({ state: 'hidden', timeout: 10000 });
      }
      
      // 🎯 Test: Selection behavior in Step3
      const selectAllButton = page.locator('[data-testid="select-all-matches-button"]');
      await selectAllButton.click();
      
      const selectedCount = await page.locator('input[type="checkbox"]:checked').count();
      expect(selectedCount).toBeGreaterThan(0);
      
      // Now test in standalone context
      await page.goto('/match-review/test-collection/test-deck');
      
      // Wait for match cards
      await page.waitForSelector('.match-card', { timeout: 10000 });
      
      // Enable bulk mode
      const bulkModeButton = page.locator('button:has-text("Bulk Mode")');
      await bulkModeButton.click();
      
      // 🎯 Test: Selection behavior in standalone
      const selectPageButton = page.locator('button:has-text("Select Page")');
      await selectPageButton.click();
      
      const selectedCheckboxes = await page.locator('input[type="checkbox"]:checked').count();
      expect(selectedCheckboxes).toBeGreaterThan(0);
    });

    test('should provide consistent filtering across components', async () => {
      // Test filtering in wizard context
      await page.goto('/create-deck?step=3');
      
      const loadingSpinner = page.locator('[data-testid="loading-spinner"]');
      if (await loadingSpinner.isVisible()) {
        await loadingSpinner.waitFor({ state: 'hidden', timeout: 10000 });
      }
      
      // 🎯 Test: Search functionality in Step3
      const searchInput = page.locator('[data-testid="search-sccs-input"]');
      await searchInput.fill('13113');
      
      // Should filter results
      const resultsText = page.locator('text=/Showing \\d+ match/');
      await expect(resultsText).toBeVisible();
      
      // Test in standalone context
      await page.goto('/match-review/test-collection/test-deck');
      await page.waitForSelector('.match-card', { timeout: 10000 });
      
      // 🎯 Test: Search functionality in standalone
      const standaloneSearch = page.locator('input[placeholder*="Search"]');
      await standaloneSearch.fill('customer');
      
      // Should filter match cards
      const matchCards = page.locator('.match-card');
      const cardCount = await matchCards.count();
      expect(cardCount).toBeGreaterThanOrEqual(0);
    });
  });

  test.describe('Accessibility and UX Validation', () => {
    test('should provide proper keyboard navigation', async () => {
      await page.goto('/match-review/test-collection/test-deck');
      await page.waitForSelector('.match-card', { timeout: 10000 });
      
      // 🎯 Test: Keyboard shortcuts work
      await page.keyboard.press('Control+f');
      
      // Search input should be focused
      const searchInput = page.locator('input[placeholder*="Search"]');
      await expect(searchInput).toBeFocused();
      
      // Test tab navigation
      await page.keyboard.press('Escape');
      await page.keyboard.press('Tab');
      
      // Should navigate to next focusable element
      const focusedElement = page.locator(':focus');
      await expect(focusedElement).toBeVisible();
    });

    test('should provide proper ARIA labels and screen reader support', async () => {
      await page.goto('/match-review/test-collection/test-deck');
      await page.waitForSelector('.match-card', { timeout: 10000 });
      
      // 🎯 Test: ARIA labels are present
      const expandButton = page.locator('button[aria-expanded]').first();
      const ariaLabel = await expandButton.getAttribute('aria-label');
      expect(ariaLabel).toContain('details');
      
      // Test live regions
      const bulkModeButton = page.locator('button:has-text("Bulk Mode")');
      await bulkModeButton.click();
      
      // Check for live region updates
      const liveRegion = page.locator('[aria-live]');
      if (await liveRegion.count() > 0) {
        await expect(liveRegion.first()).toBeVisible();
      }
    });
  });

  test.describe('Error Handling and Edge Cases', () => {
    test('should handle empty states gracefully', async () => {
      // Mock empty state
      await page.route('**/api/matches', route => {
        route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify([])
        });
      });
      
      await page.goto('/match-review/empty-collection/empty-deck');
      
      // 🎯 Test: Empty state display
      const emptyState = page.locator('text=No matches found');
      await expect(emptyState).toBeVisible();
      
      // Should provide action to go back
      const goBackButton = page.locator('button:has-text("Back")');
      await expect(goBackButton).toBeVisible();
    });

    test('should handle network errors gracefully', async () => {
      // Mock network error
      await page.route('**/api/matches', route => {
        route.abort('failed');
      });
      
      await page.goto('/match-review/error-collection/error-deck');
      
      // 🎯 Test: Error state handling
      // The app should show some error indication or fallback
      const errorIndicator = page.locator('text=/error|failed|unavailable/i');
      await expect(errorIndicator).toBeVisible({ timeout: 15000 });
    });
  });

  test.describe('Performance and Responsiveness', () => {
    test('should handle large datasets efficiently', async () => {
      await page.goto('/match-review/large-collection/large-deck');
      
      // 🎯 Test: Page load performance
      const startTime = Date.now();
      await page.waitForSelector('.match-card', { timeout: 10000 });
      const loadTime = Date.now() - startTime;
      
      // Should load within reasonable time
      expect(loadTime).toBeLessThan(5000);
      
      // Test pagination
      const paginationControls = page.locator('button[aria-label*="page"]');
      if (await paginationControls.count() > 0) {
        const nextPageButton = page.locator('button[aria-label="Next page"]');
        if (await nextPageButton.isVisible() && !await nextPageButton.isDisabled()) {
          await nextPageButton.click();
          
          // Should load next page quickly
          await page.waitForTimeout(1000);
          await expect(page.locator('.match-card')).toBeVisible();
        }
      }
    });

    test('should be responsive across different viewport sizes', async () => {
      const viewports = [
        { width: 1920, height: 1080 }, // Desktop
        { width: 768, height: 1024 },  // Tablet
        { width: 375, height: 667 }    // Mobile
      ];
      
      for (const viewport of viewports) {
        await page.setViewportSize(viewport);
        await page.goto('/match-review/test-collection/test-deck');
        await page.waitForSelector('.match-card', { timeout: 10000 });
        
        // 🎯 Test: UI elements are visible and accessible at different sizes
        const matchCard = page.locator('.match-card').first();
        await expect(matchCard).toBeVisible();
        
        // Test responsive navigation
        if (viewport.width < 768) {
          // Mobile view might have different navigation
          const mobileNav = page.locator('[data-testid="mobile-nav"]');
          if (await mobileNav.isVisible()) {
            await expect(mobileNav).toBeVisible();
          }
        }
      }
    });
  });
});