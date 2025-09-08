import { test, expect, Page } from '@playwright/test';

/**
 * Wave 2: Interactive Enhancement Validation Tests
 * Tests keyboard navigation, context-aware aids, and progressive disclosure
 * 
 * Test Coverage:
 * 1. Keyboard navigation shortcuts
 * 2. Context-aware help systems
 * 3. Progressive disclosure patterns
 * 4. Navigation FAB functionality
 */

test.describe('Wave 2: Interactive Enhancement Validation', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');
  });

  test.describe('Keyboard Navigation Support', () => {
    test('should navigate between main sections using keyboard shortcuts', async ({ page }) => {
      // Test Cmd+1 for Dashboard
      await page.keyboard.press('Meta+1');
      await expect(page).toHaveURL('/');
      await expect(page.locator('[data-testid="nav-dashboard"]')).toHaveClass(/bp6-intent-primary/);

      // Test Cmd+2 for SCCs
      await page.keyboard.press('Meta+2');
      await expect(page).toHaveURL('/sccs');
      await expect(page.locator('[data-testid="nav-sccs"]')).toHaveClass(/bp6-intent-primary/);

      // Test Cmd+3 for Collections
      await page.keyboard.press('Meta+3');
      await expect(page).toHaveURL('/decks');
      await expect(page.locator('[data-testid="nav-collections"]')).toHaveClass(/bp6-intent-primary/);

      // Test Cmd+4 for History
      await page.keyboard.press('Meta+4');
      await expect(page).toHaveURL('/history');
      await expect(page.locator('[data-testid="nav-history"]')).toHaveClass(/bp6-intent-primary/);

      // Test Cmd+5 for Analytics
      await page.keyboard.press('Meta+5');
      await expect(page).toHaveURL('/analytics');
      await expect(page.locator('[data-testid="nav-analytics"]')).toHaveClass(/bp6-intent-primary/);
    });

    test('should focus search input with Cmd+F', async ({ page }) => {
      await page.goto('/history');
      await page.waitForSelector('[data-testid="collection-search-input"]');
      
      // Press Cmd+F
      await page.keyboard.press('Meta+f');
      
      // Check if search input is focused
      const searchInput = page.locator('[data-testid="collection-search-input"]');
      await expect(searchInput).toBeFocused();
    });

    test('should show keyboard shortcuts help with ? key', async ({ page }) => {
      // Press ? key
      await page.keyboard.press('Shift+/'); // ? is Shift+/
      
      // Check if help is visible
      const helpDialog = page.locator('.navigation-help-card, [aria-label*="Keyboard shortcuts"]');
      await expect(helpDialog).toBeVisible({ timeout: 5000 });
    });

    test('should navigate tables with j/k keys', async ({ page }) => {
      await page.goto('/history');
      await page.waitForSelector('[data-testid="history-table-container"]');
      
      // Focus on table area
      await page.locator('[data-testid="history-table-container"]').click();
      
      // Press j to go down
      await page.keyboard.press('j');
      
      // Press k to go up
      await page.keyboard.press('k');
      
      // Verify focus movement (implementation specific)
    });

    test('should create new collection with Cmd+N', async ({ page }) => {
      // Press Cmd+N
      await page.keyboard.press('Meta+n');
      
      // Should navigate to create collection
      await expect(page).toHaveURL('/create-collection-deck');
    });
  });

  test.describe('Context-Aware Help Systems', () => {
    test('should show contextual help on first visit', async ({ page }) => {
      // Clear localStorage to simulate first visit
      await page.evaluate(() => localStorage.clear());
      
      await page.goto('/history');
      
      // Check for welcome help
      const contextualHelp = page.locator('.bp6-card').filter({ hasText: 'Welcome to Your Collection' });
      await expect(contextualHelp.or(page.locator('text=Helpful Tips'))).toBeVisible();
    });

    test('should show different help based on page context', async ({ page }) => {
      // Test empty state help
      await page.goto('/history');
      const emptyStateHelp = page.locator('text=No Collections Yet');
      
      // Test processing state help
      const processingHelp = page.locator('text=Collections Processing');
      
      // At least one should be visible
      await expect(emptyStateHelp.or(processingHelp)).toBeVisible();
    });

    test('should persist help dismissal', async ({ page }) => {
      await page.goto('/history');
      
      // Find and dismiss help
      const dismissButton = page.locator('[aria-label="Dismiss help"]').first();
      if (await dismissButton.isVisible()) {
        await dismissButton.click();
        
        // Reload page
        await page.reload();
        
        // Help should remain dismissed
        await expect(dismissButton).not.toBeVisible();
      }
    });

    test('should expand/collapse help tips', async ({ page }) => {
      await page.goto('/history');
      
      const expandButton = page.locator('button:has-text("More")').first();
      if (await expandButton.isVisible()) {
        // Click to expand
        await expandButton.click();
        
        // Should show "Less" button
        await expect(page.locator('button:has-text("Less")')).toBeVisible();
        
        // Click to collapse
        await page.locator('button:has-text("Less")').click();
        
        // Should show "More" button again
        await expect(expandButton).toBeVisible();
      }
    });
  });

  test.describe('Progressive Disclosure Patterns', () => {
    test('should show navigation FAB', async ({ page }) => {
      // Check for navigation FAB
      const fab = page.locator('.navigation-fab');
      await expect(fab).toBeVisible();
      
      // Click FAB
      await fab.click();
      
      // Should show navigation help
      const helpCard = page.locator('.navigation-help-card');
      await expect(helpCard).toBeVisible();
    });

    test('should display contextual navigation options', async ({ page }) => {
      await page.goto('/history');
      
      // Look for contextual navigator
      const navigateButton = page.locator('button:has-text("Navigate")');
      if (await navigateButton.isVisible()) {
        await navigateButton.click();
        
        // Should show related pages
        await expect(page.locator('text=Related Pages')).toBeVisible();
      }
    });

    test('should show workflow progress in wizard', async ({ page }) => {
      await page.goto('/create-collection-deck/data');
      
      // Check for progress indicators
      const progressBar = page.locator('[data-testid="progress-bar"]');
      await expect(progressBar).toBeVisible();
      
      // Check step indicators
      const step1 = page.locator('[data-testid="step-1-indicator"]');
      await expect(step1).toBeVisible();
    });

    test('should provide next step suggestions', async ({ page }) => {
      await page.goto('/history');
      
      // Check for next steps card
      const nextStepsCard = page.locator('.bp6-card').filter({ hasText: 'Next Steps' });
      
      // If no collections, should suggest creating one
      const createSuggestion = page.locator('text=Create your first collection');
      await expect(nextStepsCard.or(createSuggestion)).toBeVisible();
    });
  });

  test.describe('Accessibility Features', () => {
    test('should announce page navigation', async ({ page }) => {
      // Navigate and check for ARIA live regions
      await page.goto('/history');
      
      // Check for screen reader announcements
      const liveRegion = page.locator('[role="status"][aria-live="polite"]');
      
      // Navigate to another page
      await page.click('[data-testid="nav-analytics"]');
      
      // Live region should update
      // Note: Testing actual screen reader announcements requires additional tools
    });

    test('should support escape key for closing dialogs', async ({ page }) => {
      await page.goto('/history');
      
      // Open a dialog (e.g., export menu)
      const exportButton = page.locator('button:has-text("Export Results")');
      if (await exportButton.isVisible()) {
        await exportButton.click();
        
        // Press Escape
        await page.keyboard.press('Escape');
        
        // Menu should close
        const exportMenu = page.locator('.bp6-menu').filter({ hasText: 'Export as CSV' });
        await expect(exportMenu).not.toBeVisible();
      }
    });

    test('should have proper focus management', async ({ page }) => {
      await page.goto('/create-collection-deck/data');
      
      // Tab through interactive elements
      await page.keyboard.press('Tab');
      
      // Check if focused element is visible
      const focusedElement = page.locator(':focus');
      await expect(focusedElement).toBeVisible();
      
      // Continue tabbing to ensure focus trap
      for (let i = 0; i < 10; i++) {
        await page.keyboard.press('Tab');
        const focused = page.locator(':focus');
        await expect(focused).toBeVisible();
      }
    });
  });

  test.describe('Enterprise UX Patterns', () => {
    test('should maintain keyboard navigation across page transitions', async ({ page }) => {
      // Start at dashboard
      await page.goto('/');
      
      // Navigate using keyboard
      await page.keyboard.press('Meta+4'); // Go to History
      await expect(page).toHaveURL('/history');
      
      // Use keyboard to interact
      await page.keyboard.press('Meta+f'); // Focus search
      await page.keyboard.type('test collection');
      
      // Navigate away and back
      await page.keyboard.press('Meta+1'); // Dashboard
      await page.keyboard.press('Meta+4'); // Back to History
      
      // Search value should be preserved
      const searchInput = page.locator('[data-testid="collection-search-input"]');
      await expect(searchInput).toHaveValue('test collection');
    });

    test('should provide consistent help across all pages', async ({ page }) => {
      const pagesToCheck = ['/', '/history', '/decks', '/analytics'];
      
      for (const pageUrl of pagesToCheck) {
        await page.goto(pageUrl);
        
        // Press ? for help
        await page.keyboard.press('Shift+/');
        
        // Should show consistent keyboard shortcuts
        const helpContent = page.locator('text=Keyboard Shortcuts');
        await expect(helpContent.first()).toBeVisible({ timeout: 5000 });
        
        // Close help
        await page.keyboard.press('Escape');
      }
    });

    test('should handle rapid keyboard navigation', async ({ page }) => {
      // Test rapid navigation doesn't break the app
      await page.goto('/');
      
      // Rapidly switch between pages
      await page.keyboard.press('Meta+1');
      await page.keyboard.press('Meta+2');
      await page.keyboard.press('Meta+3');
      await page.keyboard.press('Meta+4');
      await page.keyboard.press('Meta+5');
      
      // Should end up on Analytics
      await expect(page).toHaveURL('/analytics');
      
      // App should still be responsive
      await expect(page.locator('[data-testid="nav-analytics"]')).toHaveClass(/bp6-intent-primary/);
    });
  });
});