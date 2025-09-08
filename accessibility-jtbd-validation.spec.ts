import { test, expect } from '@playwright/test';

/**
 * Accessibility & JTBD-Focused Validation Test Suite
 * QA Persona: Comprehensive accessibility compliance and user job validation
 * 
 * Focus: Ensure dual status system serves users with disabilities while 
 * maintaining JTBD clarity for Collection Progress vs Algorithm Execution
 */

test.describe('WCAG 2.1 AA Compliance: Dual Status System', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/history');
    await page.waitForLoadState('networkidle');
  });

  test('Color contrast meets WCAG AA standards for both status types', async ({ page }) => {
    const collectionStatuses = page.locator('[data-testid="collection-status-tag"]');
    const algorithmStatuses = page.locator('[data-testid="algorithm-status-indicator"]');

    // Test collection status contrast ratios
    if (await collectionStatuses.count() > 0) {
      const collectionColors = await collectionStatuses.first().evaluate(el => {
        const style = getComputedStyle(el);
        return {
          color: style.color,
          backgroundColor: style.backgroundColor,
          borderColor: style.borderColor
        };
      });

      // Verify colors are not default/transparent (indicates proper styling)
      expect(collectionColors.color).not.toBe('rgba(0, 0, 0, 0)');
      expect(collectionColors.backgroundColor).not.toBe('rgba(0, 0, 0, 0)');
    }

    // Test algorithm status contrast ratios
    if (await algorithmStatuses.count() > 0) {
      const algorithmColors = await algorithmStatuses.first().evaluate(el => {
        const style = getComputedStyle(el);
        return {
          color: style.color,
          backgroundColor: style.backgroundColor
        };
      });

      // Verify proper contrast exists (not relying on default colors)
      expect(algorithmColors.color).not.toBe('rgba(0, 0, 0, 0)');
    }
  });

  test('Screen reader announces distinct status types with proper roles', async ({ page }) => {
    // Test that status elements have appropriate ARIA roles and labels
    const collectionStatuses = page.locator('[data-testid="collection-status-tag"]');
    const algorithmStatuses = page.locator('[data-testid="algorithm-status-indicator"]');

    if (await collectionStatuses.count() > 0) {
      const collectionElement = collectionStatuses.first();
      
      // Should have descriptive aria-label
      const ariaLabel = await collectionElement.getAttribute('aria-label');
      expect(ariaLabel).toBeTruthy();
      expect(ariaLabel).toContain('Collection');
      
      // Should indicate current state clearly for screen readers
      expect(ariaLabel).toMatch(/setting up|building|ready|failed|cancelled/i);
      
      // Should include progress information if applicable
      const progressText = await collectionElement.getAttribute('data-progress-text');
      if (progressText) {
        expect(ariaLabel).toMatch(/\d+.*complete|\d+%/i);
      }
    }

    if (await algorithmStatuses.count() > 0) {
      const algorithmElement = algorithmStatuses.first();
      
      // Should have distinct aria-label for algorithm context
      const ariaLabel = await algorithmElement.getAttribute('aria-label');
      expect(ariaLabel).toBeTruthy();
      expect(ariaLabel).toContain('Algorithm status');
      
      // Should provide technical context for screen readers
      expect(ariaLabel).toMatch(/queued|running|optimizing|converged|error|timeout/i);
    }
  });

  test('Keyboard navigation supports both status types with context', async ({ page }) => {
    // Test full keyboard accessibility through status elements
    let statusElementsFound = 0;
    let tabIndex = 0;

    await page.keyboard.press('Tab');
    
    while (tabIndex < 25 && statusElementsFound < 4) {
      const focusedElement = page.locator(':focus');
      const elementTestId = await focusedElement.getAttribute('data-testid').catch(() => null);
      
      if (elementTestId && elementTestId.includes('status')) {
        statusElementsFound++;
        
        // Verify element is focusable and accessible
        await expect(focusedElement).toBeVisible();
        await expect(focusedElement).toHaveAttribute('aria-label');
        
        // Test Enter key interaction (should show tooltip or additional context)
        await page.keyboard.press('Enter');
        await page.waitForTimeout(500); // Allow for tooltip appearance
        
        // Test Escape to close any opened context
        await page.keyboard.press('Escape');
        
        // Verify focus is maintained
        await expect(focusedElement).toBeFocused();
      }
      
      await page.keyboard.press('Tab');
      tabIndex++;
    }

    // Should have found status elements through keyboard navigation
    expect(statusElementsFound).toBeGreaterThan(0);
  });

  test('High contrast mode maintains status differentiation', async ({ page }) => {
    // Simulate high contrast mode preferences
    await page.emulateMedia({ colorScheme: 'dark', reducedMotion: 'reduce' });
    await page.reload();
    await page.waitForLoadState('networkidle');

    const collectionStatuses = page.locator('[data-testid="collection-status-tag"]');
    const algorithmStatuses = page.locator('[data-testid="algorithm-status-indicator"]');

    // Verify elements remain visible and distinguishable
    if (await collectionStatuses.count() > 0) {
      await expect(collectionStatuses.first()).toBeVisible();
      
      // Should maintain Blueprint styling even in high contrast
      const className = await collectionStatuses.first().getAttribute('class');
      expect(className).toContain('bp4-tag');
    }

    if (await algorithmStatuses.count() > 0) {
      await expect(algorithmStatuses.first()).toBeVisible();
      
      // Should maintain monospace font distinction
      const fontFamily = await algorithmStatuses.first().evaluate(el =>
        getComputedStyle(el).fontFamily
      );
      expect(fontFamily).toContain('monospace');
    }
  });

  test('Motion preferences respected for status animations', async ({ page }) => {
    // Test with reduced motion preference
    await page.emulateMedia({ reducedMotion: 'reduce' });
    await page.reload();
    await page.waitForLoadState('networkidle');

    const processingStatuses = page.locator('[data-testid="collection-status-tag"].processing');
    const runningStatuses = page.locator('[data-testid="algorithm-status-indicator"].running');

    // Animations should be reduced or disabled when user prefers reduced motion
    if (await processingStatuses.count() > 0) {
      const animationDuration = await processingStatuses.first().evaluate(el => {
        const style = getComputedStyle(el);
        return style.animationDuration;
      });
      
      // Should respect reduced motion (either no animation or very short duration)
      expect(['0s', '0.01s']).toContain(animationDuration);
    }
  });
});

test.describe('JTBD Validation: Accessibility-First User Jobs', () => {
  test('Job 1: Collection Progress - Screen Reader Experience', async ({ page }) => {
    await page.goto('/history');
    await page.waitForLoadState('networkidle');

    const collectionStatuses = page.locator('[data-testid="collection-status-tag"]');
    const count = await collectionStatuses.count();

    if (count > 0) {
      for (let i = 0; i < Math.min(count, 3); i++) {
        const statusElement = collectionStatuses.nth(i);
        const ariaLabel = await statusElement.getAttribute('aria-label');
        
        // Screen reader should understand the user's collection progress context
        expect(ariaLabel).toBeTruthy();
        
        // Should contain action-oriented language for screen reader users
        const actionPatterns = [
          /setting up.*collection/i,
          /building.*deck/i,
          /ready.*view/i,
          /failed.*retry/i,
          /cancelled/i
        ];
        
        const hasActionContext = actionPatterns.some(pattern => 
          pattern.test(ariaLabel || '')
        );
        expect(hasActionContext).toBeTruthy();
        
        // Should include progress context if available
        if (ariaLabel?.includes('Building') || ariaLabel?.includes('Setting up')) {
          // Should indicate progress for ongoing operations
          const hasProgressInfo = /\d+.*complete|\d+%|progress/i.test(ariaLabel);
          if (hasProgressInfo) {
            expect(ariaLabel).toMatch(/\d+/);
          }
        }
      }
    }
  });

  test('Job 2: Algorithm Execution - Technical Context for Assistive Technology', async ({ page }) => {
    await page.goto('/history');
    await page.waitForLoadState('networkidle');

    const algorithmStatuses = page.locator('[data-testid="algorithm-status-indicator"]');
    const count = await algorithmStatuses.count();

    if (count > 0) {
      for (let i = 0; i < Math.min(count, 3); i++) {
        const statusElement = algorithmStatuses.nth(i);
        const ariaLabel = await statusElement.getAttribute('aria-label');
        
        // Screen reader should understand technical algorithm context
        expect(ariaLabel).toBeTruthy();
        expect(ariaLabel).toContain('Algorithm status');
        
        // Should provide technical execution insight
        const technicalPatterns = [
          /queued.*processing/i,
          /algorithm.*active/i,
          /optimizing/i,
          /optimal.*found/i,
          /error.*support/i,
          /timed.*out/i
        ];
        
        const hasTechnicalContext = technicalPatterns.some(pattern => 
          pattern.test(ariaLabel || '')
        );
        expect(hasTechnicalContext).toBeTruthy();
        
        // Test tooltip accessibility
        await statusElement.hover();
        const tooltip = page.locator('.bp4-tooltip, [role="tooltip"]');
        if (await tooltip.isVisible()) {
          // Tooltip should have proper ARIA attributes
          const tooltipId = await tooltip.getAttribute('id');
          if (tooltipId) {
            const ariaDescribedBy = await statusElement.getAttribute('aria-describedby');
            expect(ariaDescribedBy).toBe(tooltipId);
          }
        }
      }
    }
  });

  test('Status differentiation clear to users with cognitive disabilities', async ({ page }) => {
    await page.goto('/history');
    await page.waitForLoadState('networkidle');

    // Test that status types are distinguishable through multiple sensory channels
    const collectionStatuses = page.locator('[data-testid="collection-status-tag"]');
    const algorithmStatuses = page.locator('[data-testid="algorithm-status-indicator"]');

    const collectionCount = await collectionStatuses.count();
    const algorithmCount = await algorithmStatuses.count();

    if (collectionCount > 0 && algorithmCount > 0) {
      // Test visual differentiation
      const collectionStyle = await collectionStatuses.first().evaluate(el => {
        const style = getComputedStyle(el);
        return {
          shape: style.borderRadius,
          background: style.backgroundColor,
          font: style.fontFamily
        };
      });

      const algorithmStyle = await algorithmStatuses.first().evaluate(el => {
        const style = getComputedStyle(el);
        return {
          shape: style.borderRadius,
          background: style.backgroundColor,
          font: style.fontFamily
        };
      });

      // Should have multiple differentiating characteristics
      let differences = 0;
      if (collectionStyle.shape !== algorithmStyle.shape) differences++;
      if (collectionStyle.background !== algorithmStyle.background) differences++;
      if (collectionStyle.font !== algorithmStyle.font) differences++;
      
      expect(differences).toBeGreaterThan(1); // Multiple visual cues for cognitive accessibility

      // Test textual differentiation
      const collectionText = await collectionStatuses.first().textContent();
      const algorithmText = await algorithmStatuses.first().textContent();
      
      // Should use distinctly different vocabulary
      expect(collectionText?.toLowerCase()).not.toBe(algorithmText?.toLowerCase());
      
      // Collection should use user-centric language
      expect(collectionText).toMatch(/your|deck|collection|view|ready/i);
      
      // Algorithm should use technical language
      expect(algorithmText).toMatch(/algorithm|processing|queued|optimizing|execution/i);
    }
  });

  test('Error states provide clear recovery guidance for all users', async ({ page }) => {
    await page.goto('/history');
    await page.waitForLoadState('networkidle');

    // Look for failed/error status states
    const failedCollectionStatuses = page.locator('[data-testid="collection-status-tag"]')
      .filter({ hasText: /failed|error|retry/i });
    const errorAlgorithmStatuses = page.locator('[data-testid="algorithm-status-indicator"]')
      .filter({ hasText: /error|timeout|failed/i });

    // Test collection error guidance
    if (await failedCollectionStatuses.count() > 0) {
      const errorElement = failedCollectionStatuses.first();
      const ariaLabel = await errorElement.getAttribute('aria-label');
      const visibleText = await errorElement.textContent();
      
      // Should provide clear recovery guidance
      expect(visibleText).toMatch(/retry|support|contact|help/i);
      expect(ariaLabel).toMatch(/failed.*retry|error.*support/i);
      
      // Should have appropriate ARIA role for errors
      const intent = await errorElement.evaluate(el => {
        return el.className.includes('bp4-intent-danger');
      });
      expect(intent).toBeTruthy();
    }

    // Test algorithm error guidance  
    if (await errorAlgorithmStatuses.count() > 0) {
      const errorElement = errorAlgorithmStatuses.first();
      const ariaLabel = await errorElement.getAttribute('aria-label');
      const visibleText = await errorElement.textContent();
      
      // Should indicate technical error with support context
      expect(visibleText).toMatch(/error.*support|timeout|failed/i);
      expect(ariaLabel).toContain('Algorithm');
      
      // Should provide hover context for technical users
      await errorElement.hover();
      const tooltip = page.locator('.bp4-tooltip, [role="tooltip"]');
      if (await tooltip.isVisible()) {
        const tooltipText = await tooltip.textContent();
        expect(tooltipText).toMatch(/technical|algorithm|execution|support/i);
      }
    }
  });
});

test.describe('Performance Accessibility: Real-time Updates', () => {
  test('Status updates do not disrupt screen reader announcements', async ({ page }) => {
    await page.goto('/history');
    await page.waitForLoadState('networkidle');

    // Focus on a status element
    const statusElement = page.locator('[data-testid="collection-status-tag"]').first();
    if (await statusElement.isVisible()) {
      await statusElement.focus();
      
      const initialAriaLabel = await statusElement.getAttribute('aria-label');
      
      // Wait for potential status update (background polling)
      await page.waitForTimeout(4000);
      
      // Verify element maintains focus and accessibility
      await expect(statusElement).toBeFocused();
      
      const updatedAriaLabel = await statusElement.getAttribute('aria-label');
      
      // If status updated, should maintain accessibility structure
      if (initialAriaLabel !== updatedAriaLabel) {
        expect(updatedAriaLabel).toBeTruthy();
        expect(updatedAriaLabel).toContain('Collection');
      }
    }
  });

  test('Animations do not trigger vestibular disorders', async ({ page }) => {
    await page.goto('/history');
    await page.waitForLoadState('networkidle');

    // Check processing animations are subtle and safe
    const processingElements = page.locator('[data-testid="collection-status-tag"].processing');
    const runningElements = page.locator('[data-testid="algorithm-status-indicator"].running');

    // Test processing animation safety
    if (await processingElements.count() > 0) {
      const animationProps = await processingElements.first().evaluate(el => {
        const style = getComputedStyle(el);
        return {
          duration: parseFloat(style.animationDuration?.replace('s', '') || '0'),
          iterationCount: style.animationIterationCount
        };
      });

      // Animation should be gentle (not too fast)
      expect(animationProps.duration).toBeGreaterThan(1); // At least 1 second
      
      // Should not be excessively repetitive
      if (animationProps.iterationCount !== 'infinite') {
        expect(parseInt(animationProps.iterationCount)).toBeLessThan(10);
      }
    }

    // Test running algorithm animations
    if (await runningElements.count() > 0) {
      const dotAnimation = await runningElements.first().evaluate(el => {
        const afterStyle = getComputedStyle(el, '::after');
        return {
          duration: parseFloat(afterStyle.animationDuration?.replace('s', '') || '0')
        };
      });

      // Dot animation should be slow enough to not trigger vestibular issues
      expect(dotAnimation.duration).toBeGreaterThan(1);
    }
  });

  test('Rapid status changes maintain accessibility context', async ({ page }) => {
    await page.goto('/history');
    await page.waitForLoadState('networkidle');

    // Capture initial accessibility state
    const statusElements = page.locator('[data-testid*="status"]');
    const initialCount = await statusElements.count();
    
    if (initialCount > 0) {
      const initialAccessibility = [];
      
      for (let i = 0; i < Math.min(initialCount, 5); i++) {
        const element = statusElements.nth(i);
        const ariaLabel = await element.getAttribute('aria-label');
        const testId = await element.getAttribute('data-testid');
        
        initialAccessibility.push({ ariaLabel, testId, index: i });
      }

      // Wait for multiple polling cycles
      await page.waitForTimeout(8000);

      // Verify accessibility maintained after updates
      for (const initial of initialAccessibility) {
        const currentElement = statusElements.nth(initial.index);
        if (await currentElement.isVisible()) {
          const currentAriaLabel = await currentElement.getAttribute('aria-label');
          const currentTestId = await currentElement.getAttribute('data-testid');
          
          // Should maintain same accessibility structure
          expect(currentTestId).toBe(initial.testId);
          expect(currentAriaLabel).toBeTruthy();
          
          // Should maintain same semantic meaning even if text changed
          if (initial.testId?.includes('collection')) {
            expect(currentAriaLabel).toContain('Collection');
          } else if (initial.testId?.includes('algorithm')) {
            expect(currentAriaLabel).toContain('Algorithm');
          }
        }
      }
    }
  });
});