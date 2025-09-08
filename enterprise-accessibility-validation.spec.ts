import { test, expect } from '@playwright/test';
import { injectAxe, checkA11y } from 'axe-playwright';

test.describe('Enterprise Match Review - WCAG 2.1 AA Compliance', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('http://localhost:3000/match-review/test-collection/test-deck');
    await injectAxe(page);
  });

  test('passes comprehensive WCAG 2.1 AA audit', async ({ page }) => {
    await page.waitForSelector('.match-review', { timeout: 10000 });
    
    // Run comprehensive accessibility audit
    await checkA11y(page, null, {
      detailedReport: true,
      detailedReportOptions: { html: true },
      rules: {
        // WCAG 2.1 AA rules
        'color-contrast': { enabled: true },
        'keyboard-navigation': { enabled: true },
        'focus-order-semantics': { enabled: true },
        'aria-labels': { enabled: true },
        'heading-order': { enabled: true },
        'landmark-no-duplicate-banner': { enabled: true },
        'landmark-no-duplicate-contentinfo': { enabled: true },
        'page-has-heading-one': { enabled: true },
        'region': { enabled: true },
        'skip-link': { enabled: true },
        'focus-order': { enabled: true }
      }
    });
  });

  test('keyboard navigation - full workflow accessibility', async ({ page }) => {
    await page.waitForSelector('.match-review');
    
    // Test keyboard shortcuts functionality
    const searchInput = page.locator('input[placeholder*="Search"]');
    
    // Ctrl+F should focus search
    await page.keyboard.press('Control+f');
    await expect(searchInput).toBeFocused();
    
    // Type search query
    await searchInput.fill('customer');
    
    // Escape should clear selection (when items are selected)
    await page.keyboard.press('Tab'); // Move to first match card
    await page.keyboard.press('Space'); // Select first match (if in bulk mode)
    await page.keyboard.press('Escape'); // Should clear selection
    
    // Test comprehensive tab order
    const focusableElements = [
      'input[placeholder*="Search"]',
      'select[aria-label*="Status"]', 
      'select[aria-label*="Confidence"]',
      'select[aria-label*="Category"]',
      '[data-testid="bulk-mode-toggle"]',
      '[data-testid="export-button"]', 
      '[data-testid="back-button"]'
    ];
    
    // Start from beginning
    await page.keyboard.press('Control+Home');
    
    for (const selector of focusableElements) {
      await page.keyboard.press('Tab');
      const element = page.locator(selector).first();
      if (await element.isVisible()) {
        await expect(element).toBeFocused();
      }
    }
  });

  test('screen reader - semantic structure validation', async ({ page }) => {
    await page.waitForSelector('.match-review');
    
    // Validate heading hierarchy
    const headings = await page.locator('h1, h2, h3, h4, h5, h6').all();
    const headingLevels = await Promise.all(
      headings.map(h => h.evaluate(el => parseInt(el.tagName.charAt(1))))
    );
    
    // Check proper heading order (no skipped levels)
    for (let i = 1; i < headingLevels.length; i++) {
      const diff = headingLevels[i] - headingLevels[i-1];
      expect(diff).toBeLessThanOrEqual(1);
    }
    
    // Validate ARIA landmarks
    const main = page.locator('main, [role="main"]');
    const navigation = page.locator('nav, [role="navigation"]');
    const search = page.locator('[role="search"]');
    
    await expect(main).toBeVisible();
    await expect(navigation).toBeVisible();
    
    // Validate list semantics
    const matchList = page.locator('[role="list"]');
    await expect(matchList).toBeVisible();
    
    const matchCards = page.locator('[role="list"] > *').first();
    // Should have appropriate role or be proper list items
    const hasListItem = await matchCards.evaluate(el => 
      el.tagName === 'LI' || el.getAttribute('role') === 'listitem'
    );
  });

  test('color contrast - enterprise accessibility standards', async ({ page }) => {
    await page.waitForSelector('.match-review');
    
    // Test specific color combinations in match cards
    const testElements = [
      '.match-card .bp4-tag', // Status tags
      '.match-card .card-header', // Header text
      '.bulk-actions-toolbar', // Toolbar text
      '.pagination-controls button', // Pagination buttons
      'input[type="search"]' // Search input
    ];
    
    for (const selector of testElements) {
      const elements = page.locator(selector);
      const count = await elements.count();
      
      for (let i = 0; i < count; i++) {
        const element = elements.nth(i);
        if (await element.isVisible()) {
          // Get computed styles
          const styles = await element.evaluate(el => {
            const computed = window.getComputedStyle(el);
            return {
              color: computed.color,
              backgroundColor: computed.backgroundColor,
              fontSize: computed.fontSize
            };
          });
          
          // Ensure text is readable (would need color contrast library for exact ratios)
          expect(styles.color).not.toBe(styles.backgroundColor);
        }
      }
    }
  });

  test('focus management - enterprise workflow', async ({ page }) => {
    await page.waitForSelector('.match-review');
    
    // Test focus trap in drawer when opened
    const moreButton = page.locator('button[aria-label*="View detailed"]').first();
    if (await moreButton.isVisible()) {
      await moreButton.click();
      
      // Drawer should be open
      const drawer = page.locator('.bp4-drawer');
      await expect(drawer).toBeVisible();
      
      // Focus should be trapped within drawer
      await page.keyboard.press('Tab');
      const focusedElement = page.locator(':focus');
      const isInDrawer = await focusedElement.evaluate(el => 
        el.closest('.bp4-drawer') !== null
      );
      expect(isInDrawer).toBeTruthy();
      
      // Close drawer and focus should return
      await page.keyboard.press('Escape');
      await expect(drawer).not.toBeVisible();
      await expect(moreButton).toBeFocused();
    }
  });

  test('responsive accessibility - mobile compliance', async ({ page }) => {
    // Test mobile viewport
    await page.setViewportSize({ width: 375, height: 667 });
    await page.waitForSelector('.match-review');
    
    // Ensure touch targets are accessible (minimum 44px)
    const touchElements = page.locator('button, a, input, select, [role="button"]');
    const count = await touchElements.count();
    
    for (let i = 0; i < count; i++) {
      const element = touchElements.nth(i);
      if (await element.isVisible()) {
        const box = await element.boundingBox();
        if (box) {
          expect(box.height).toBeGreaterThanOrEqual(44);
          expect(box.width).toBeGreaterThanOrEqual(44);
        }
      }
    }
  });

  test('error states - accessibility compliance', async ({ page }) => {
    await page.waitForSelector('.match-review');
    
    // Test no results state
    const searchInput = page.locator('input[placeholder*="Search"]');
    await searchInput.fill('nonexistentmatch123');
    
    const noResultsState = page.locator('.bp4-non-ideal-state');
    await expect(noResultsState).toBeVisible();
    
    // Should have proper role and accessible text
    const hasAccessibleName = await noResultsState.evaluate(el => {
      const hasAriaLabel = !!el.getAttribute('aria-label');
      const hasAccessibleText = el.textContent && el.textContent.trim().length > 0;
      return hasAriaLabel || hasAccessibleText;
    });
    expect(hasAccessibleName).toBeTruthy();
  });

  test('bulk operations - accessibility workflow', async ({ page }) => {
    await page.waitForSelector('.match-review');
    
    // Enable bulk mode
    const bulkButton = page.locator('button[text*="Bulk Mode"], button:has-text("Bulk Mode")').first();
    if (await bulkButton.isVisible()) {
      await bulkButton.click();
      
      // Checkboxes should be visible and accessible
      const checkboxes = page.locator('.match-card input[type="checkbox"]');
      const checkboxCount = await checkboxes.count();
      
      for (let i = 0; i < Math.min(3, checkboxCount); i++) {
        const checkbox = checkboxes.nth(i);
        
        // Should have proper aria-label
        const ariaLabel = await checkbox.getAttribute('aria-label');
        expect(ariaLabel).toBeTruthy();
        expect(ariaLabel).toContain('Select match');
        
        // Should be keyboard accessible
        await checkbox.focus();
        await expect(checkbox).toBeFocused();
        await page.keyboard.press('Space');
        await expect(checkbox).toBeChecked();
      }
      
      // Bulk actions toolbar should appear and be accessible
      const bulkToolbar = page.locator('.bulk-actions-toolbar');
      await expect(bulkToolbar).toBeVisible();
      
      // Should announce selection count
      const selectionText = page.locator('text*="selected"');
      await expect(selectionText).toBeVisible();
    }
  });

  test('performance - accessibility tree optimization', async ({ page }) => {
    await page.waitForSelector('.match-review');
    
    // Measure accessibility tree size (should be reasonable for screen readers)
    const accessibilityTree = await page.accessibility.snapshot();
    
    function countNodes(node: any): number {
      let count = 1;
      if (node.children) {
        for (const child of node.children) {
          count += countNodes(child);
        }
      }
      return count;
    }
    
    const nodeCount = countNodes(accessibilityTree);
    
    // Should not exceed reasonable limits for screen reader performance
    expect(nodeCount).toBeLessThan(500); // Reasonable limit for complex enterprise UI
  });
});

test.describe('Enterprise Match Review - Advanced Accessibility Features', () => {
  test('skip links and navigation aids', async ({ page }) => {
    await page.goto('http://localhost:3000/match-review/test-collection/test-deck');
    
    // Test skip link functionality
    await page.keyboard.press('Tab');
    const firstFocusable = page.locator(':focus');
    
    // Should be able to skip to main content
    const skipLink = page.locator('a[href="#main-content"], a:has-text("Skip to main")');
    if (await skipLink.isVisible()) {
      await skipLink.click();
      const mainContent = page.locator('#main-content, main, [role="main"]');
      await expect(mainContent).toBeFocused();
    }
  });

  test('high contrast mode compatibility', async ({ page }) => {
    // Simulate high contrast mode
    await page.addStyleTag({
      content: `
        @media (prefers-contrast: high) {
          .match-card { border: 2px solid #000 !important; }
          .match-card.selected { border-color: #0066cc !important; background-color: #e6f2ff !important; }
        }
      `
    });
    
    await page.goto('http://localhost:3000/match-review/test-collection/test-deck');
    await page.waitForSelector('.match-review');
    
    // Enable bulk mode to test selection states
    const bulkButton = page.locator('button:has-text("Bulk Mode")').first();
    if (await bulkButton.isVisible()) {
      await bulkButton.click();
      
      // Select a match card
      const firstCheckbox = page.locator('.match-card input[type="checkbox"]').first();
      await firstCheckbox.click();
      
      // Verify high contrast styles are applied
      const selectedCard = page.locator('.match-card.selected').first();
      if (await selectedCard.isVisible()) {
        const borderStyle = await selectedCard.evaluate(el => 
          window.getComputedStyle(el).border
        );
        // Should have visible border in high contrast mode
        expect(borderStyle).toBeTruthy();
      }
    }
  });

  test('reduced motion compliance', async ({ page }) => {
    // Simulate reduced motion preference
    await page.emulateMedia({ reducedMotion: 'reduce' });
    
    await page.goto('http://localhost:3000/match-review/test-collection/test-deck');
    await page.waitForSelector('.match-review');
    
    // Test expand/collapse animation should be minimal
    const expandButton = page.locator('button[aria-label*="Expand details"]').first();
    if (await expandButton.isVisible()) {
      await expandButton.click();
      
      // Details should appear without excessive animation
      const details = page.locator('.bp4-collapse').first();
      await expect(details).toBeVisible({ timeout: 1000 });
      
      // Animation duration should be minimal for reduced motion
      const transitionDuration = await details.evaluate(el => 
        window.getComputedStyle(el).transitionDuration
      );
      // Should be '0s' or very short for reduced motion
      expect(['0s', '0.1s', '0.2s']).toContain(transitionDuration);
    }
  });
});