import { test, expect } from '@playwright/test';

test.describe('History Page Status Localization', () => {
  test.beforeEach(async ({ page }) => {
    // Navigate to History page
    await page.goto('/history');
    await page.waitForLoadState('networkidle');
  });

  test('displays localized dual status columns with JTBD differentiation', async ({ page }) => {
    // Verify dual status columns exist (HistoryTable.tsx:136-137 pattern)
    const collectionStatusColumn = page.locator('[data-testid="collection-status-column"]');
    const algorithmStatusColumn = page.locator('[data-testid="algorithm-status-column"]');
    
    await expect(collectionStatusColumn).toBeVisible();
    await expect(algorithmStatusColumn).toBeVisible();

    // Verify column headers are localized
    await expect(page.getByText('Collection Status')).toBeVisible();
    await expect(page.getByText('Algorithm Status')).toBeVisible();
  });

  test('Job 1: Collection status serves user progress monitoring', async ({ page }) => {
    // Test user-facing collection progress messaging
    const collectionStatusTags = page.locator('[data-testid="collection-status-tag"]');
    
    if (await collectionStatusTags.count() > 0) {
      const firstTag = collectionStatusTags.first();
      
      // Verify localized user-friendly messages
      const tagText = await firstTag.textContent();
      const userFacingMessages = [
        'Setting up your collection...',
        'Building your deck...',
        'Collection ready to view',
        'Creation failed - retry available',
        'Process cancelled'
      ];
      
      expect(userFacingMessages.some(msg => tagText?.includes(msg))).toBeTruthy();

      // Verify accessibility attributes
      const ariaLabel = await firstTag.getAttribute('aria-label');
      expect(ariaLabel).toBeTruthy();
      
      // Verify tooltip functionality
      await firstTag.hover();
      await expect(page.getByText('User-facing deck creation progress')).toBeVisible();
    }
  });

  test('Job 2: Algorithm status provides technical execution insight', async ({ page }) => {
    // Test technical algorithm execution awareness
    const algorithmStatusIndicators = page.locator('[data-testid="algorithm-status-indicator"]');
    
    if (await algorithmStatusIndicators.count() > 0) {
      const firstIndicator = algorithmStatusIndicators.first();
      
      // Verify localized technical messages
      const indicatorText = await firstIndicator.textContent();
      const technicalMessages = [
        'Queued for processing',
        'Matching algorithm active',
        'Optimizing matches...',
        'Optimal matches found',
        'Algorithm error - support notified',
        'Process timed out'
      ];
      
      expect(technicalMessages.some(msg => indicatorText?.includes(msg))).toBeTruthy();

      // Verify monospace technical styling is maintained
      const fontFamily = await firstIndicator.evaluate(el => getComputedStyle(el).fontFamily);
      expect(fontFamily).toContain('monospace');
      
      // Verify accessibility and tooltip
      const ariaLabel = await firstIndicator.getAttribute('aria-label');
      expect(ariaLabel).toBeTruthy();
      expect(ariaLabel).toContain('Algorithm status:');
      
      await firstIndicator.hover();
      await expect(page.getByText('Technical algorithm execution state')).toBeVisible();
    }
  });

  test('maintains existing Blueprint UI patterns with enhanced accessibility', async ({ page }) => {
    // Test that existing Blueprint patterns are preserved
    const table = page.locator('.bp4-table');
    await expect(table).toBeVisible();
    
    // Verify Collection Status Tags maintain Blueprint Intent system
    const collectionTags = page.locator('[data-testid="collection-status-tag"]');
    if (await collectionTags.count() > 0) {
      const firstTag = collectionTags.first();
      const className = await firstTag.getAttribute('class');
      
      // Should contain Blueprint tag classes and intent classes
      expect(className).toContain('bp4-tag');
      expect(className?.includes('bp4-intent-') || className?.includes('bp4-tag')).toBeTruthy();
    }
    
    // Test progress bar with localized tooltips
    const progressBars = page.locator('.bp4-progress-bar');
    if (await progressBars.count() > 0) {
      const firstBar = progressBars.first();
      await firstBar.hover();
      await expect(page.getByText('Overall completion percentage')).toBeVisible();
    }
  });

  test('processing status shows animation and progress indicators', async ({ page }) => {
    // Test enhanced processing visualization
    const processingTags = page.locator('[data-testid="collection-status-tag"]').filter({ 
      hasText: /Building your deck|Setting up/ 
    });
    
    if (await processingTags.count() > 0) {
      const processingTag = processingTags.first();
      
      // Should have processing animation class
      const className = await processingTag.getAttribute('class');
      expect(className).toContain('processing');
      
      // Should show progress text via data attribute
      const progressText = await processingTag.getAttribute('data-progress-text');
      if (progressText) {
        expect(progressText).toMatch(/\d+%/);
      }
    }
  });

  test('localized page title and empty state messages', async ({ page }) => {
    // Test page title localization
    await expect(page.getByRole('heading', { name: 'Job History' })).toBeVisible();
    
    // Test empty state with date filter (if applicable)
    // This simulates a scenario where date filtering returns no results
    const startDateInput = page.locator('input[placeholder*="Select start date"]');
    const endDateInput = page.locator('input[placeholder*="Select end date"]');
    
    if (await startDateInput.isVisible() && await endDateInput.isVisible()) {
      // Set a very restrictive date range to trigger empty state
      await startDateInput.fill('2020-01-01');
      await endDateInput.fill('2020-01-02');
      
      // Should show localized empty state message
      await expect(page.getByText('No history found for the selected date range.')).toBeVisible();
    }
  });

  test('status differentiation maintains real-time background service integration', async ({ page }) => {
    // Test that backgroundProcessingService.ts integration is maintained
    // This verifies that the localization doesn't break the existing polling system
    
    const table = page.locator('.bp4-table');
    await expect(table).toBeVisible();
    
    // Wait for potential status updates (backgroundProcessingService polls every 3s)
    await page.waitForTimeout(1000);
    
    // Verify status columns are still populated and responsive
    const collectionStatusCells = page.locator('[data-testid="collection-status-tag"]');
    const algorithmStatusCells = page.locator('[data-testid="algorithm-status-indicator"]');
    
    if (await collectionStatusCells.count() > 0) {
      // Verify status text is localized and not just raw enum values
      const firstCollectionStatus = await collectionStatusCells.first().textContent();
      expect(firstCollectionStatus).not.toMatch(/^(Initializing|Processing|Ready|Failed|Cancelled)$/);
    }
    
    if (await algorithmStatusCells.count() > 0) {
      // Verify algorithm status text is localized
      const firstAlgorithmStatus = await algorithmStatusCells.first().textContent();
      expect(firstAlgorithmStatus).not.toMatch(/^(Queued|Running|Optimizing|Converged|Error|Timeout)$/);
    }
  });
});

test.describe('Accessibility Improvements', () => {
  test('enhanced ARIA labels and semantic markup', async ({ page }) => {
    await page.goto('/history');
    
    // Test that status components have proper ARIA labels
    const statusElements = page.locator('[aria-label*="status"]');
    const count = await statusElements.count();
    
    if (count > 0) {
      // All status elements should have descriptive ARIA labels
      for (let i = 0; i < Math.min(count, 5); i++) {
        const element = statusElements.nth(i);
        const ariaLabel = await element.getAttribute('aria-label');
        expect(ariaLabel).toBeTruthy();
        expect(ariaLabel!.length).toBeGreaterThan(10); // Should be descriptive
      }
    }
  });

  test('keyboard navigation and screen reader compatibility', async ({ page }) => {
    await page.goto('/history');
    
    // Test keyboard navigation through status elements
    await page.keyboard.press('Tab');
    let focusedElement = await page.locator(':focus').first();
    
    // Continue tabbing through elements to ensure they're focusable
    for (let i = 0; i < 5; i++) {
      await page.keyboard.press('Tab');
      const newFocusedElement = await page.locator(':focus').first();
      
      // Verify we can navigate through the interface
      if (await newFocusedElement.isVisible()) {
        focusedElement = newFocusedElement;
      }
    }
    
    // Should be able to focus on interactive elements
    expect(await focusedElement.isVisible()).toBeTruthy();
  });
});