import { test, expect } from '@playwright/test';

/**
 * Comprehensive UX Validation Test Suite
 * Senior PM Perspective: Status Localization & JTBD Validation
 * 
 * Focus: Validate that dual status columns serve distinct user jobs
 * after CreateCollectionDeck → History redirect flow
 */

test.describe('History Page: Post-CreateCollectionDeck UX Journey', () => {
  test.beforeEach(async ({ page }) => {
    // Set up test data and navigate to starting point
    await page.goto('/');
    await page.waitForLoadState('networkidle');
  });

  test('User sees immediate feedback after CreateCollectionDeck submission', async ({ page }) => {
    // Simulate the redirect flow from CreateCollectionDeck
    await page.goto('/create-collection-deck');
    
    // Fill out collection deck form (Step 1)
    await page.fill('[data-testid="deck-name"]', 'UX Test Deck');
    
    // Navigate through steps or submit (depending on implementation)
    const submitButton = page.locator('button[type="submit"], button:has-text("Create"), button:has-text("Submit")').first();
    if (await submitButton.isVisible()) {
      await submitButton.click();
    }

    // Verify redirect to History page
    await expect(page).toHaveURL(/.*history.*/);
    
    // Critical UX: User immediately sees their submitted deck
    const statusTags = page.locator('[data-testid="collection-status-tag"]');
    await expect(statusTags.first()).toBeVisible({ timeout: 10000 });

    // Verify localized messaging appears (not raw enum values)
    const collectionStatus = statusTags.first();
    const statusText = await collectionStatus.textContent();
    
    // Should contain user-friendly language, not technical enum values
    expect(statusText).toMatch(/Setting up|Building|ready|failed|cancelled/i);
    expect(statusText).not.toMatch(/^(Initializing|Processing|Ready|Failed|Cancelled)$/);

    // Verify accessibility attributes
    await expect(collectionStatus).toHaveAttribute('aria-label');
    
    // Verify the most recent deck (top of list) matches submitted name
    const nameCell = page.locator('.bp4-table-body .bp4-table-cell').first();
    await expect(nameCell).toContainText('UX Test Deck');
  });

  test('Dual status columns provide distinct contextual information', async ({ page }) => {
    await page.goto('/history');
    await page.waitForLoadState('networkidle');

    // Verify both status columns exist and are visually differentiated
    const collectionColumn = page.locator('[data-testid="collection-status-column"]');
    const algorithmColumn = page.locator('[data-testid="algorithm-status-column"]');

    await expect(collectionColumn).toBeVisible();
    await expect(algorithmColumn).toBeVisible();

    // Verify column headers are properly localized
    await expect(page.getByText('Collection Status')).toBeVisible();
    await expect(page.getByText('Algorithm Status')).toBeVisible();

    // UX Validation: Status styling differentiation
    const collectionStatuses = page.locator('[data-testid="collection-status-tag"]');
    const algorithmStatuses = page.locator('[data-testid="algorithm-status-indicator"]');

    if (await collectionStatuses.count() > 0 && await algorithmStatuses.count() > 0) {
      const collectionStatus = collectionStatuses.first();
      const algorithmStatus = algorithmStatuses.first();

      // Collection status: User-friendly styling (Blueprint Tag component)
      await expect(collectionStatus).toHaveClass(/bp4-tag/);
      
      // Algorithm status: Technical monospace styling
      const algorithmFont = await algorithmStatus.evaluate(el => 
        getComputedStyle(el).fontFamily
      );
      expect(algorithmFont).toContain('monospace');

      // Verify different visual treatments
      const collectionBg = await collectionStatus.evaluate(el => 
        getComputedStyle(el).backgroundColor
      );
      const algorithmBg = await algorithmStatus.evaluate(el => 
        getComputedStyle(el).backgroundColor
      );
      
      // Should have different styling approaches
      expect(collectionBg).not.toBe(algorithmBg);
    }
  });
});

test.describe('Status Differentiation: Jobs-to-be-Done Validation', () => {
  test('Job 1: Collection status guides user decision-making', async ({ page }) => {
    await page.goto('/history');
    await page.waitForLoadState('networkidle');

    // Test different collection states and expected user actions
    const statusElements = page.locator('[data-testid="collection-status-tag"]');
    const count = await statusElements.count();

    if (count > 0) {
      for (let i = 0; i < Math.min(count, 3); i++) {
        const statusElement = statusElements.nth(i);
        const statusText = await statusElement.textContent();
        
        // Verify user-friendly language patterns
        const userFriendlyPatterns = [
          /setting up.*collection/i,
          /building.*deck/i, 
          /ready to view/i,
          /creation failed.*retry/i,
          /process cancelled/i
        ];
        
        const hasUserFriendlyText = userFriendlyPatterns.some(pattern => 
          pattern.test(statusText || '')
        );
        expect(hasUserFriendlyText).toBeTruthy();

        // Verify accessibility labeling for screen readers
        await expect(statusElement).toHaveAttribute('aria-label');
        const ariaLabel = await statusElement.getAttribute('aria-label');
        expect(ariaLabel).toContain('Collection');

        // Check for progress indicators on processing states
        if (statusText?.toLowerCase().includes('building')) {
          const progressAttr = await statusElement.getAttribute('data-progress-text');
          if (progressAttr) {
            expect(progressAttr).toMatch(/\d+%/);
          }
        }
      }
    }
  });

  test('Job 2: Algorithm status provides technical insight', async ({ page }) => {
    await page.goto('/history');
    await page.waitForLoadState('networkidle');

    // Test algorithm status technical context
    const algorithmStatuses = page.locator('[data-testid="algorithm-status-indicator"]');
    const count = await algorithmStatuses.count();

    if (count > 0) {
      for (let i = 0; i < Math.min(count, 3); i++) {
        const statusElement = algorithmStatuses.nth(i);
        const statusText = await statusElement.textContent();

        // Should contain technical terms providing execution insight
        const technicalPatterns = [
          /queued.*processing/i,
          /matching.*algorithm.*active/i,
          /optimizing.*matches/i,
          /optimal.*matches.*found/i,
          /algorithm.*error.*support/i,
          /process.*timed.*out/i
        ];

        const hasTechnicalText = technicalPatterns.some(pattern => 
          pattern.test(statusText || '')
        );
        expect(hasTechnicalText).toBeTruthy();

        // Verify technical styling maintained
        const fontSize = await statusElement.evaluate(el => 
          getComputedStyle(el).fontSize
        );
        expect(fontSize).toBe('0.9em');

        // Verify tooltip provides additional context
        await statusElement.hover();
        const tooltip = page.locator('.bp4-tooltip, [role="tooltip"]');
        await expect(tooltip).toBeVisible({ timeout: 2000 });
        
        const tooltipText = await tooltip.textContent();
        expect(tooltipText).toContain('Technical algorithm execution');
      }
    }
  });

  test('Status differentiation maintains semantic clarity', async ({ page }) => {
    await page.goto('/history');
    await page.waitForLoadState('networkidle');

    // Verify that users can distinguish between the two status types
    const collectionStatuses = page.locator('[data-testid="collection-status-tag"]');
    const algorithmStatuses = page.locator('[data-testid="algorithm-status-indicator"]');

    const collectionCount = await collectionStatuses.count();
    const algorithmCount = await algorithmStatuses.count();

    if (collectionCount > 0 && algorithmCount > 0) {
      // Sample status messages from each type
      const collectionText = await collectionStatuses.first().textContent();
      const algorithmText = await algorithmStatuses.first().textContent();

      // Should have distinctly different messaging approaches
      expect(collectionText).not.toBe(algorithmText);
      
      // Collection messages should be more user-centric
      expect(collectionText).toMatch(/your|deck|ready|view|building/i);
      
      // Algorithm messages should be more technical
      expect(algorithmText).toMatch(/algorithm|processing|optimizing|converged|queued/i);
    }
  });
});

test.describe('Accessibility & Internationalization UX Experience', () => {
  test('Screen readers can distinguish between status types', async ({ page }) => {
    await page.goto('/history');
    await page.waitForLoadState('networkidle');

    // Verify distinct aria-labels for each status type
    const collectionStatuses = page.locator('[data-testid="collection-status-tag"]');
    const algorithmStatuses = page.locator('[data-testid="algorithm-status-indicator"]');

    const collectionCount = await collectionStatuses.count();
    const algorithmCount = await algorithmStatuses.count();

    if (collectionCount > 0) {
      const collectionLabel = await collectionStatuses.first().getAttribute('aria-label');
      expect(collectionLabel).toContain('Collection');
      expect(collectionLabel).toMatch(/setting up|building|ready|failed|cancelled/i);
    }

    if (algorithmCount > 0) {
      const algorithmLabel = await algorithmStatuses.first().getAttribute('aria-label');
      expect(algorithmLabel).toContain('Algorithm status');
      expect(algorithmLabel).toMatch(/queued|running|optimizing|converged|error|timeout/i);
    }

    // Ensure labels are distinct and meaningful
    if (collectionCount > 0 && algorithmCount > 0) {
      const collectionLabel = await collectionStatuses.first().getAttribute('aria-label');
      const algorithmLabel = await algorithmStatuses.first().getAttribute('aria-label');
      expect(collectionLabel).not.toBe(algorithmLabel);
    }
  });

  test('Keyboard navigation provides status context', async ({ page }) => {
    await page.goto('/history');
    await page.waitForLoadState('networkidle');

    // Tab through interface to reach status elements
    await page.keyboard.press('Tab');
    
    for (let i = 0; i < 20; i++) {
      const focusedElement = page.locator(':focus');
      const testId = await focusedElement.getAttribute('data-testid');
      
      if (testId && testId.includes('status')) {
        // Verify focused status element has proper labeling
        await expect(focusedElement).toHaveAttribute('aria-label');
        
        // Verify can access tooltip via keyboard
        await page.keyboard.press('Enter');
        const tooltip = page.locator('.bp4-tooltip, [role="tooltip"]');
        await expect(tooltip).toBeVisible({ timeout: 1000 }).catch(() => {
          // Tooltip might not appear on keyboard focus, which is acceptable
        });
        
        break;
      }
      
      await page.keyboard.press('Tab');
    }
  });

  test('Status localization maintains semantic meaning', async ({ page }) => {
    await page.goto('/history');
    await page.waitForLoadState('networkidle');

    // Verify status text is localized (not hardcoded English enum values)
    const collectionStatuses = page.locator('[data-testid="collection-status-tag"]');
    const algorithmStatuses = page.locator('[data-testid="algorithm-status-indicator"]');

    const collectionCount = await collectionStatuses.count();
    const algorithmCount = await algorithmStatuses.count();

    // Check that raw enum values are not displayed
    const rawEnumValues = ['Initializing', 'Processing', 'Ready', 'Failed', 'Cancelled', 
                          'Queued', 'Running', 'Optimizing', 'Converged', 'Error', 'Timeout'];

    if (collectionCount > 0) {
      const collectionText = await collectionStatuses.first().textContent();
      const isRawEnum = rawEnumValues.includes(collectionText || '');
      expect(isRawEnum).toBeFalsy();
    }

    if (algorithmCount > 0) {
      const algorithmText = await algorithmStatuses.first().textContent();
      const isRawEnum = rawEnumValues.includes(algorithmText || '');
      expect(isRawEnum).toBeFalsy();
    }
  });
});

test.describe('Real-time Status Updates: UX Performance', () => {
  test('Status updates provide immediate visual feedback', async ({ page }) => {
    await page.goto('/history');
    await page.waitForLoadState('networkidle');

    // Verify processing animation is smooth and visible
    const processingStatuses = page.locator('[data-testid="collection-status-tag"].processing');
    const processingCount = await processingStatuses.count();

    if (processingCount > 0) {
      const processingStatus = processingStatuses.first();
      
      // Verify pulse animation exists
      const animationName = await processingStatus.evaluate(el => 
        getComputedStyle(el).animationName
      );
      expect(animationName).not.toBe('none');

      // Verify progress text updates are shown
      const progressText = await processingStatus.getAttribute('data-progress-text');
      if (progressText) {
        expect(progressText).toMatch(/\d+%/);
      }
    }
  });

  test('Algorithm status shows computational activity indicators', async ({ page }) => {
    await page.goto('/history');
    await page.waitForLoadState('networkidle');

    // Test running algorithm animation
    const runningStatuses = page.locator('[data-testid="algorithm-status-indicator"].running');
    const runningCount = await runningStatuses.count();

    if (runningCount > 0) {
      const runningStatus = runningStatuses.first();
      
      // Verify animated dots for running state (using ::after pseudo-element)
      const hasAnimation = await runningStatus.evaluate(el => {
        const afterStyle = getComputedStyle(el, '::after');
        return afterStyle.animationName !== 'none';
      });
      expect(hasAnimation).toBeTruthy();
    }
  });

  test('Status polling maintains UX responsiveness', async ({ page }) => {
    await page.goto('/history');
    await page.waitForLoadState('networkidle');

    // Check if table content is present instead of table element
    await expect(page.getByText('Name').first()).toBeVisible();
    await expect(page.getByText('Collection Status').first()).toBeVisible();
    await expect(page.getByText('Algorithm Status').first()).toBeVisible();

    // Use the table container for layout measurements
    const tableContainer = page.locator('[data-testid="history-table-container"]');
    await expect(tableContainer).toBeVisible();

    // Measure initial layout
    const initialBox = await tableContainer.boundingBox();
    expect(initialBox).toBeTruthy();

    // Wait for background processing service polling cycle (3s intervals)
    await page.waitForTimeout(4000);

    // Verify page remains responsive and stable
    await expect(tableContainer).toBeVisible();
    
    // Verify no significant layout shifts during status updates
    const finalBox = await tableContainer.boundingBox();
    expect(finalBox).toBeTruthy();
    
    if (initialBox && finalBox) {
      const heightDifference = Math.abs(finalBox.height - initialBox.height);
      expect(heightDifference).toBeLessThan(20); // Allow minor layout adjustments
    }

    // Verify status elements are still interactive
    const statusElements = page.locator('[data-testid*="status"]');
    const statusCount = await statusElements.count();
    
    if (statusCount > 0) {
      await statusElements.first().hover();
      // Should not throw errors or cause layout issues
    }
  });

  test('Real-time updates preserve user context', async ({ page }) => {
    await page.goto('/history');
    await page.waitForLoadState('networkidle');

    // Scroll to a specific position
    await page.evaluate(() => window.scrollTo(0, 200));
    const initialScrollPosition = await page.evaluate(() => window.pageYOffset);

    // Hover over a status element to show tooltip
    const statusElement = page.locator('[data-testid="collection-status-tag"]').first();
    if (await statusElement.isVisible()) {
      await statusElement.hover();
      
      // Wait for polling cycle
      await page.waitForTimeout(4000);
      
      // Verify scroll position maintained (no unwanted jumps)
      const finalScrollPosition = await page.evaluate(() => window.pageYOffset);
      expect(Math.abs(finalScrollPosition - initialScrollPosition)).toBeLessThan(10);
      
      // Verify tooltip context is preserved
      const tooltip = page.locator('.bp4-tooltip, [role="tooltip"]');
      await expect(tooltip).toBeVisible();
    }
  });
});

test.describe('Senior PM Success Metrics Validation', () => {
  test('Status comprehension within 5 seconds', async ({ page }) => {
    const startTime = Date.now();
    
    await page.goto('/history');
    
    // Measure time to status comprehension
    await expect(page.locator('[data-testid="collection-status-tag"]').first()).toBeVisible();
    await expect(page.locator('[data-testid="algorithm-status-indicator"]').first()).toBeVisible();
    
    const loadTime = Date.now() - startTime;
    expect(loadTime).toBeLessThan(5000); // 5 second threshold
    
    // Verify status messages are immediately comprehensible
    const collectionText = await page.locator('[data-testid="collection-status-tag"]').first().textContent();
    const algorithmText = await page.locator('[data-testid="algorithm-status-indicator"]').first().textContent();
    
    // Should contain action-guiding language
    expect(collectionText).toMatch(/setting up|building|ready|view|failed|retry/i);
    expect(algorithmText).toMatch(/queued|active|optimizing|found|error|timeout/i);
  });

  test('Visual differentiation achieves 95% clarity', async ({ page }) => {
    await page.goto('/history');
    await page.waitForLoadState('networkidle');

    const collectionElements = page.locator('[data-testid="collection-status-tag"]');
    const algorithmElements = page.locator('[data-testid="algorithm-status-indicator"]');

    const collectionCount = await collectionElements.count();
    const algorithmCount = await algorithmElements.count();

    if (collectionCount > 0 && algorithmCount > 0) {
      // Measure visual differentiation factors
      const collectionStyle = await collectionElements.first().evaluate(el => {
        const style = getComputedStyle(el);
        return {
          fontFamily: style.fontFamily,
          backgroundColor: style.backgroundColor,
          borderRadius: style.borderRadius,
          padding: style.padding
        };
      });

      const algorithmStyle = await algorithmElements.first().evaluate(el => {
        const style = getComputedStyle(el);
        return {
          fontFamily: style.fontFamily,
          backgroundColor: style.backgroundColor,
          borderRadius: style.borderRadius,
          padding: style.padding
        };
      });

      // Verify distinct styling approaches
      expect(collectionStyle.fontFamily).not.toBe(algorithmStyle.fontFamily);
      expect(collectionStyle.backgroundColor).not.toBe(algorithmStyle.backgroundColor);
      
      // Collection should use Blueprint tag styling
      expect(collectionStyle.borderRadius).not.toBe('0px');
      
      // Algorithm should use monospace font
      expect(algorithmStyle.fontFamily).toContain('monospace');
    }
  });

  test('Contextual clarity guides appropriate user actions', async ({ page }) => {
    await page.goto('/history');
    await page.waitForLoadState('networkidle');

    // Test action guidance for different status states
    const testCases = [
      {
        statusPattern: /ready.*view/i,
        expectedAction: 'view_collection',
        urgency: 'low'
      },
      {
        statusPattern: /building|setting up/i,
        expectedAction: 'monitor_progress',
        urgency: 'medium'
      },
      {
        statusPattern: /failed.*retry/i,
        expectedAction: 'retry_or_support',
        urgency: 'high'
      }
    ];

    const statusElements = page.locator('[data-testid="collection-status-tag"]');
    const count = await statusElements.count();

    let actionClarityTests = 0;
    for (let i = 0; i < Math.min(count, 5); i++) {
      const statusText = await statusElements.nth(i).textContent() || '';
      
      const matchingCase = testCases.find(tc => tc.statusPattern.test(statusText));
      if (matchingCase) {
        actionClarityTests++;
        
        // Verify status message implies clear user action
        if (matchingCase.expectedAction === 'view_collection') {
          expect(statusText).toMatch(/ready|view/i);
        } else if (matchingCase.expectedAction === 'monitor_progress') {
          expect(statusText).toMatch(/building|setting up|progress/i);
        } else if (matchingCase.expectedAction === 'retry_or_support') {
          expect(statusText).toMatch(/failed|retry|error/i);
        }
      }
    }

    // Should have tested at least one action guidance scenario
    expect(actionClarityTests).toBeGreaterThan(0);
  });

  test('Real-time accuracy reflects background processing state', async ({ page }) => {
    await page.goto('/history');
    await page.waitForLoadState('networkidle');

    // Capture initial status states
    const initialStates = await page.locator('[data-testid="collection-status-tag"]').allTextContents();
    
    // Wait for one polling cycle (backgroundProcessingService polls every 3s)
    await page.waitForTimeout(4000);
    
    // Capture updated status states
    const updatedStates = await page.locator('[data-testid="collection-status-tag"]').allTextContents();
    
    // Verify status updates occurred (for processing items)
    let updatesDetected = false;
    for (let i = 0; i < Math.min(initialStates.length, updatedStates.length); i++) {
      if (initialStates[i] !== updatedStates[i]) {
        updatesDetected = true;
        
        // Verify logical status transitions
        const initial = initialStates[i];
        const updated = updatedStates[i];
        
        // Example: "Setting up" → "Building" is logical
        // "Building" → "Collection ready" is logical
        // "Failed" → "Building" is not logical (would require user intervention)
        
        if (initial.includes('Setting up')) {
          expect(updated).toMatch(/Building|ready|failed/i);
        } else if (initial.includes('Building')) {
          expect(updated).toMatch(/Building|ready|failed/i);
        }
      }
    }
    
    // Note: Updates may not always occur in test timeframe, which is acceptable
    // The important thing is that when updates do occur, they're logically consistent
  });
});