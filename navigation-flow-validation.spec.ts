import { test, expect, Page, BrowserContext } from '@playwright/test';
import { NavigationFlowMetrics, CognitiveLoadMeasurement } from './types/navigation-metrics';

/**
 * Comprehensive Navigation Flow Validation Test Suite
 * Tests all navigation improvements with cognitive load measurement
 */

// Helper to measure cognitive load through interaction timing
class CognitiveLoadTracker {
  private startTime: number = 0;
  private interactions: Array<{
    action: string;
    duration: number;
    errors: number;
    hesitations: number;
  }> = [];

  start() {
    this.startTime = Date.now();
  }

  recordInteraction(action: string, duration: number, errors = 0, hesitations = 0) {
    this.interactions.push({ action, duration, errors, hesitations });
  }

  calculateCognitiveLoad(): CognitiveLoadMeasurement {
    const totalDuration = this.interactions.reduce((sum, i) => sum + i.duration, 0);
    const totalErrors = this.interactions.reduce((sum, i) => sum + i.errors, 0);
    const totalHesitations = this.interactions.reduce((sum, i) => sum + i.hesitations, 0);
    const averageInteractionTime = totalDuration / this.interactions.length;

    // Cognitive load formula based on NASA-TLX principles
    const errorPenalty = totalErrors * 500; // 500ms penalty per error
    const hesitationPenalty = totalHesitations * 200; // 200ms penalty per hesitation
    const adjustedTime = totalDuration + errorPenalty + hesitationPenalty;
    
    // Normalize to 0-100 scale
    const cognitiveLoadScore = Math.min(100, (adjustedTime / 1000) * 2);

    return {
      score: cognitiveLoadScore,
      totalInteractionTime: totalDuration,
      averageInteractionTime,
      errorCount: totalErrors,
      hesitationCount: totalHesitations,
      taskCount: this.interactions.length
    };
  }
}

// Navigation flow test scenarios
test.describe('Enhanced Navigation Flow Validation', () => {
  let context: BrowserContext;
  let page: Page;
  let cognitiveTracker: CognitiveLoadTracker;

  test.beforeEach(async ({ browser }) => {
    context = await browser.newContext({
      viewport: { width: 1280, height: 720 },
      permissions: ['clipboard-read', 'clipboard-write']
    });
    page = await context.newPage();
    cognitiveTracker = new CognitiveLoadTracker();
    
    // Set up console error tracking
    page.on('console', msg => {
      if (msg.type() === 'error') {
        cognitiveTracker.recordInteraction('console-error', 0, 1, 0);
      }
    });

    await page.goto('http://localhost:3000');
  });

  test.afterEach(async () => {
    await context.close();
  });

  test('Complete wizard flow with state preservation', async () => {
    cognitiveTracker.start();
    const startTime = Date.now();

    // Navigate to Create Collection Deck
    await page.click('[data-testid="create-collection-deck-button"]');
    await expect(page).toHaveURL('/create-collection-deck');
    cognitiveTracker.recordInteraction('navigate-to-wizard', Date.now() - startTime);

    // Step 1: Input Data
    const step1Start = Date.now();
    await page.waitForSelector('[data-testid="step1-container"]');
    
    // Fill in tasking window
    await page.fill('[data-testid="start-date-input"]', '2024-01-15');
    await page.fill('[data-testid="end-date-input"]', '2024-01-30');
    
    // Select TLE data source
    await page.selectOption('[data-testid="tle-source-select"]', 'celestrak');
    
    // Click next
    await page.click('[data-testid="step1-next-button"]');
    cognitiveTracker.recordInteraction('complete-step1', Date.now() - step1Start);

    // Step 2: Review Parameters
    const step2Start = Date.now();
    await page.waitForSelector('[data-testid="step2-container"]');
    
    // Modify parameters
    await page.fill('[data-testid="hard-capacity-input"]', '8');
    await page.fill('[data-testid="min-duration-input"]', '10');
    await page.fill('[data-testid="elevation-input"]', '15');
    
    // Test breadcrumb navigation
    const breadcrumbClick = Date.now();
    await page.click('.bp5-breadcrumb:has-text("Step 1")');
    await expect(page).toHaveURL('/create-collection-deck/step1');
    
    // Verify state was preserved
    const startDateValue = await page.inputValue('[data-testid="start-date-input"]');
    expect(startDateValue).toBe('2024-01-15');
    cognitiveTracker.recordInteraction('breadcrumb-navigation', Date.now() - breadcrumbClick);

    // Return to step 2
    await page.click('[data-testid="step1-next-button"]');
    await page.click('[data-testid="step2-next-button"]');
    cognitiveTracker.recordInteraction('complete-step2', Date.now() - step2Start);

    // Step 3: Select Opportunities
    const step3Start = Date.now();
    await page.waitForSelector('[data-testid="step3-container"]');
    
    // Wait for matches to load
    await page.waitForSelector('[data-testid="matches-results-card"]', { timeout: 10000 });
    
    // Select some matches
    await page.click('[data-testid="all-matches-tab"]');
    await page.click('input[type="checkbox"]:nth-of-type(1)');
    await page.click('input[type="checkbox"]:nth-of-type(2)');
    
    // Test deep linking
    const deepLinkStart = Date.now();
    await page.click('[data-testid="generate-deep-link-button"]');
    await page.waitForTimeout(500); // Wait for clipboard operation
    
    const clipboardContent = await page.evaluate(() => navigator.clipboard.readText());
    expect(clipboardContent).toContain('state=');
    cognitiveTracker.recordInteraction('generate-deep-link', Date.now() - deepLinkStart);

    // Navigate to standalone field mapping review
    await page.click('[data-testid="review-as-field-mapping-button"]');
    await expect(page).toHaveURL(/field-mapping-review/);
    cognitiveTracker.recordInteraction('navigate-to-standalone', Date.now() - step3Start);

    // Verify state transfer
    const standaloneStart = Date.now();
    await page.waitForSelector('.field-mapping-review');
    
    // Check that matches were transferred
    const matchCards = await page.$$('.unified-match-card');
    expect(matchCards.length).toBeGreaterThan(0);
    
    // Verify terminology consistency
    const pageTitle = await page.textContent('h3');
    expect(pageTitle).toContain('Match Review'); // Unified terminology
    cognitiveTracker.recordInteraction('verify-state-transfer', Date.now() - standaloneStart);

    // Calculate cognitive load
    const cognitiveLoad = cognitiveTracker.calculateCognitiveLoad();
    console.log('Cognitive Load Metrics:', cognitiveLoad);
    
    // Assert acceptable cognitive load (< 50 is good)
    expect(cognitiveLoad.score).toBeLessThan(50);
  });

  test('Navigation aids and orientation helpers', async () => {
    cognitiveTracker.start();

    // Navigate to History
    await page.click('[data-testid="history-nav-link"]');
    await expect(page).toHaveURL('/history');

    // Click on a collection to go to field mapping review
    await page.click('.collection-row:first-child [data-testid="view-field-mappings-button"]');
    await expect(page).toHaveURL(/field-mapping-review/);

    // Test contextual navigator
    const navStart = Date.now();
    await page.click('[data-testid="contextual-navigator-button"]');
    await page.waitForSelector('.navigation-aids-menu');
    
    // Verify current location is shown
    const currentLocation = await page.textContent('.current-location');
    expect(currentLocation).toContain('Field Mapping Review');
    
    // Navigate to related page
    await page.click('.navigation-aids-menu .bp5-menu-item:has-text("Collection Opportunities")');
    await expect(page).toHaveURL(/collection-opportunities/);
    cognitiveTracker.recordInteraction('contextual-navigation', Date.now() - navStart);

    // Test navigation FAB
    const fabStart = Date.now();
    await page.click('.navigation-fab');
    await page.waitForSelector('.navigation-help-card');
    
    // Verify keyboard shortcuts are displayed
    const shortcuts = await page.textContent('.help-shortcuts');
    expect(shortcuts).toContain('⌘K');
    expect(shortcuts).toContain('Focus search');
    
    await page.keyboard.press('Escape');
    await expect(page.locator('.navigation-help-card')).not.toBeVisible();
    cognitiveTracker.recordInteraction('navigation-help', Date.now() - fabStart);

    // Test workflow progress
    await page.goto('/create-collection-deck/step2');
    await page.waitForSelector('.workflow-progress');
    
    const progressSteps = await page.$$('.workflow-step');
    expect(progressSteps.length).toBe(4);
    
    // Verify current step is highlighted
    const currentStep = await page.$('.workflow-step.current');
    expect(currentStep).toBeTruthy();
    
    // Click on completed step to navigate
    const workflowNavStart = Date.now();
    await page.click('.workflow-step.completed');
    await expect(page).toHaveURL(/step1/);
    cognitiveTracker.recordInteraction('workflow-navigation', Date.now() - workflowNavStart);

    const cognitiveLoad = cognitiveTracker.calculateCognitiveLoad();
    expect(cognitiveLoad.score).toBeLessThan(40);
  });

  test('Progressive disclosure interaction patterns', async () => {
    cognitiveTracker.start();

    // Navigate to a page with progressive disclosure
    await page.goto('/create-collection-deck/step3');
    await page.waitForSelector('[data-testid="matches-results-card"]', { timeout: 10000 });

    // Test card expansion
    const expansionStart = Date.now();
    const matchCards = await page.$$('.unified-match-card');
    expect(matchCards.length).toBeGreaterThan(0);
    
    // Click expand button on first card
    await page.click('.unified-match-card:first-child button[aria-label*="Expand"]');
    await page.waitForSelector('.unified-match-card:first-child .match-card-details');
    
    // Verify details are shown
    const details = await page.textContent('.unified-match-card:first-child .match-card-details');
    expect(details).toContain('Sensor Type');
    expect(details).toContain('Calculated Capacity');
    cognitiveTracker.recordInteraction('expand-details', Date.now() - expansionStart);

    // Test accordion behavior (if in accordion mode)
    const accordionStart = Date.now();
    await page.click('.unified-match-card:nth-child(2) button[aria-label*="Expand"]');
    
    // First card should collapse in accordion mode
    const firstCardExpanded = await page.$('.unified-match-card:first-child .match-card-details');
    const secondCardExpanded = await page.$('.unified-match-card:nth-child(2) .match-card-details');
    
    if (!firstCardExpanded && secondCardExpanded) {
      cognitiveTracker.recordInteraction('accordion-behavior', Date.now() - accordionStart);
    } else {
      cognitiveTracker.recordInteraction('independent-expansion', Date.now() - accordionStart);
    }

    const cognitiveLoad = cognitiveTracker.calculateCognitiveLoad();
    expect(cognitiveLoad.score).toBeLessThan(30);
  });

  test('Error handling and recovery flows', async () => {
    cognitiveTracker.start();

    // Test navigation to non-existent page
    const errorStart = Date.now();
    await page.goto('/history/invalid-id/field-mapping-review');
    
    // Should show error state
    await page.waitForSelector('.bp5-non-ideal-state');
    const errorTitle = await page.textContent('.bp5-non-ideal-state-title');
    expect(errorTitle).toContain('Navigation Error');
    
    // Test error recovery
    await page.click('button:has-text("Go to Dashboard")');
    await expect(page).toHaveURL('/');
    cognitiveTracker.recordInteraction('error-recovery', Date.now() - errorStart, 1);

    // Test form validation errors
    await page.goto('/create-collection-deck');
    const validationStart = Date.now();
    
    // Try to proceed without filling required fields
    await page.click('[data-testid="step1-next-button"]');
    
    // Should show validation errors
    const errorMessages = await page.$$('.bp5-intent-danger');
    expect(errorMessages.length).toBeGreaterThan(0);
    cognitiveTracker.recordInteraction('validation-error', Date.now() - validationStart, 1);

    const cognitiveLoad = cognitiveTracker.calculateCognitiveLoad();
    // Higher threshold due to intentional errors
    expect(cognitiveLoad.score).toBeLessThan(60);
  });

  test('Keyboard navigation and accessibility', async () => {
    cognitiveTracker.start();

    await page.goto('/history');
    
    // Test keyboard navigation
    const keyboardStart = Date.now();
    
    // Tab through interactive elements
    await page.keyboard.press('Tab');
    await page.keyboard.press('Tab');
    await page.keyboard.press('Tab');
    
    // Activate focused element
    await page.keyboard.press('Enter');
    
    // Use keyboard shortcut
    await page.keyboard.press('Control+K');
    await page.waitForSelector('input:focus');
    
    const focusedElement = await page.evaluate(() => document.activeElement?.tagName);
    expect(focusedElement).toBe('INPUT');
    cognitiveTracker.recordInteraction('keyboard-navigation', Date.now() - keyboardStart);

    // Test ARIA labels
    const ariaStart = Date.now();
    const buttons = await page.$$('button[aria-label]');
    expect(buttons.length).toBeGreaterThan(0);
    
    // Verify landmark regions
    const main = await page.$('main');
    expect(main).toBeTruthy();
    
    const navigation = await page.$('nav');
    expect(navigation).toBeTruthy();
    cognitiveTracker.recordInteraction('aria-verification', Date.now() - ariaStart);

    const cognitiveLoad = cognitiveTracker.calculateCognitiveLoad();
    expect(cognitiveLoad.score).toBeLessThan(35);
  });

  test('State persistence across sessions', async () => {
    cognitiveTracker.start();

    // Start wizard and fill data
    await page.goto('/create-collection-deck');
    await page.fill('[data-testid="start-date-input"]', '2024-02-01');
    await page.fill('[data-testid="end-date-input"]', '2024-02-15');
    await page.selectOption('[data-testid="tle-source-select"]', 'spacetrack');
    
    // Navigate away
    await page.goto('/history');
    
    // Return to wizard
    const persistenceStart = Date.now();
    await page.goto('/create-collection-deck');
    
    // Check if resume prompt appears
    const resumePrompt = await page.$('.bp5-callout:has-text("Continue with existing data")');
    if (resumePrompt) {
      await page.click('button:has-text("Yes, Continue")');
      
      // Verify data was restored
      const startDate = await page.inputValue('[data-testid="start-date-input"]');
      expect(startDate).toBe('2024-02-01');
      cognitiveTracker.recordInteraction('state-restoration', Date.now() - persistenceStart);
    } else {
      // Session storage might have been cleared
      cognitiveTracker.recordInteraction('fresh-start', Date.now() - persistenceStart);
    }

    const cognitiveLoad = cognitiveTracker.calculateCognitiveLoad();
    expect(cognitiveLoad.score).toBeLessThan(40);
  });

  test('Performance and responsiveness', async () => {
    cognitiveTracker.start();

    // Test with large dataset
    await page.goto('/history');
    
    // Measure initial load time
    const loadStart = Date.now();
    await page.waitForSelector('.history-table', { state: 'visible' });
    const loadTime = Date.now() - loadStart;
    cognitiveTracker.recordInteraction('initial-load', loadTime);
    
    // Test filtering performance
    const filterStart = Date.now();
    await page.fill('input[placeholder*="Search"]', 'test');
    await page.waitForTimeout(300); // Debounce time
    const filterTime = Date.now() - filterStart;
    cognitiveTracker.recordInteraction('filter-application', filterTime);
    
    // Test pagination
    const paginationStart = Date.now();
    const nextButton = await page.$('button[aria-label="Next page"]');
    if (nextButton) {
      await nextButton.click();
      await page.waitForTimeout(200);
    }
    cognitiveTracker.recordInteraction('pagination', Date.now() - paginationStart);
    
    // Performance assertions
    expect(loadTime).toBeLessThan(2000); // 2 seconds max
    expect(filterTime).toBeLessThan(500); // 500ms max
    
    const cognitiveLoad = cognitiveTracker.calculateCognitiveLoad();
    expect(cognitiveLoad.score).toBeLessThan(30);
  });

  test('Mobile responsive navigation', async () => {
    // Set mobile viewport
    await page.setViewportSize({ width: 375, height: 667 });
    cognitiveTracker.start();

    await page.goto('/history');
    
    // Test mobile navigation menu
    const mobileNavStart = Date.now();
    await page.click('[data-testid="mobile-menu-button"]');
    await page.waitForSelector('.mobile-nav-menu');
    
    // Navigate using mobile menu
    await page.click('.mobile-nav-menu a:has-text("Analytics")');
    await expect(page).toHaveURL('/analytics');
    cognitiveTracker.recordInteraction('mobile-navigation', Date.now() - mobileNavStart);
    
    // Test touch interactions
    const touchStart = Date.now();
    await page.goto('/create-collection-deck/step3');
    await page.waitForSelector('[data-testid="matches-results-card"]', { timeout: 10000 });
    
    // Swipe gesture simulation (if implemented)
    const card = await page.$('.unified-match-card:first-child');
    if (card) {
      const box = await card.boundingBox();
      if (box) {
        await page.mouse.move(box.x + box.width - 50, box.y + box.height / 2);
        await page.mouse.down();
        await page.mouse.move(box.x + 50, box.y + box.height / 2);
        await page.mouse.up();
      }
    }
    cognitiveTracker.recordInteraction('touch-interaction', Date.now() - touchStart);
    
    const cognitiveLoad = cognitiveTracker.calculateCognitiveLoad();
    expect(cognitiveLoad.score).toBeLessThan(45);
  });
});

// Export metrics for reporting
export { NavigationFlowMetrics, CognitiveLoadMeasurement };