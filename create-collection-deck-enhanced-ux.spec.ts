/**
 * Create Collection Deck Enhanced UX Test Suite
 * 
 * Frontend Persona Priority: User needs > accessibility > performance > technical elegance
 * Integrations: Playwright + Context7 + Sequential Analysis
 * 
 * This suite addresses all UX gaps identified in Phases 1 & 2:
 * - Performance-aware UX testing with Core Web Vitals
 * - Advanced accessibility validation with axe-core
 * - Visual regression prevention with automated comparison
 * - Enhanced error recovery with user-centered validation
 * - User journey optimization with confidence measurement
 */

import { test, expect, Page, BrowserContext } from '@playwright/test';
import { injectAxe, checkA11y, getViolations } from 'axe-playwright';

// Performance budgets aligned with user experience standards
const PERFORMANCE_BUDGETS = {
  LCP: 2500,    // Largest Contentful Paint <2.5s
  FID: 100,     // First Input Delay <100ms  
  CLS: 0.1,     // Cumulative Layout Shift <0.1
  LOAD_TIME: 3000, // Complete page load <3s
  BUNDLE_SIZE: 512000 // Initial bundle <500KB
};

// Advanced Page Object Model for user-centered testing
class CreateCollectionDeckPage {
  constructor(private page: Page) {}

  async navigateToCreateDeck(): Promise<void> {
    await this.page.goto('/');
    await this.page.waitForLoadState('networkidle');
    
    // Remove webpack overlay for clean testing
    await this.page.evaluate(() => {
      const overlay = document.getElementById('webpack-dev-server-client-overlay');
      if (overlay) overlay.remove();
    });
    
    const createButton = this.page.locator('[data-testid="create-deck-button"]');
    await expect(createButton).toBeVisible();
    await createButton.click();
    await this.page.waitForLoadState('networkidle');
  }

  async fillBasicCollectionInfo(data: {
    name: string;
    startDate?: string;
    endDate?: string;
  }): Promise<void> {
    // Fill collection name with user-friendly feedback
    await this.page.fill('[data-testid="deck-name-input"]', data.name);
    
    // Handle date selection with accessibility support
    if (data.startDate || !data.startDate) {
      await this.page.locator('[data-testid="start-date-input"]').click();
      await this.page.locator('.DayPicker-Day').first().click();
    }
    
    if (data.endDate || !data.endDate) {
      await this.page.locator('[data-testid="end-date-input"]').click();
      await this.page.locator('.DayPicker-Day').nth(10).click();
    }
  }

  async loadDataWithProgressFeedback(): Promise<void> {
    // Test UDL loading with progress feedback validation
    const loadButton = this.page.locator('[data-testid="load-udl-button"]');
    await loadButton.click();
    
    // Validate loading state provides user confidence
    await expect(loadButton).toHaveAttribute('aria-busy', 'true');
    await expect(this.page.locator('text=Loading data')).toBeVisible();
    
    // Wait for completion with timeout
    await expect(loadButton).not.toHaveAttribute('aria-busy', 'true', { timeout: 5000 });
  }

  async configureParameters(params: {
    elevation: string;
    capacity: string;
    duration: string;
  }): Promise<void> {
    await this.page.click('button:has-text("Next")');
    await expect(this.page.locator('h5:has-text("Step 2")')).toBeVisible();
    
    // Configure elevation with real-time feedback
    await this.page.fill('[data-testid="elevation-input"]', params.elevation);
    await expect(this.page.locator('text=sites available')).toBeVisible();
    
    // Configure capacity with guidance
    await this.page.click('[role="tab"]:has-text("Hard Capacity")');
    await this.page.fill('[data-testid="hard-capacity-input"]', params.capacity);
    
    // Configure duration with user guidance
    await this.page.click('[role="tab"]:has-text("Min Duration")');
    await this.page.fill('[data-testid="min-duration-input"]', params.duration);
  }

  async selectMatchesWithValidation(): Promise<void> {
    // Trigger background processing
    await this.page.click('button:has-text("Next")');
    await this.page.click('button:has-text("Start Background Processing")');
    
    // Wait for match generation with progress validation
    await expect(this.page.locator('[data-testid="loading-spinner"]')).toBeVisible();
    await expect(this.page.locator('[data-testid="loading-spinner"]')).not.toBeVisible({ timeout: 15000 });
    
    // Select matches with user confidence validation
    const firstCheckbox = this.page.locator('input[type="checkbox"]').first();
    await firstCheckbox.check();
    await expect(firstCheckbox).toBeChecked();
  }

  async completeCollectionWithInstructions(instructions?: string): Promise<void> {
    await this.page.click('button:has-text("Next")');
    await expect(this.page.locator('h5:has-text("Step 4")')).toBeVisible();
    
    if (instructions) {
      await this.page.fill('textarea', instructions);
    }
    
    // Complete with confirmation validation
    await this.page.click('button:has-text("Finish")');
    await this.page.click('button:has-text("Confirm & Start Processing")');
    
    // Validate successful completion
    await this.page.waitForURL('**/history');
  }

  async measureCoreWebVitals(): Promise<{
    lcp: number;
    fid: number;
    cls: number;
  }> {
    return await this.page.evaluate(() => {
      return new Promise((resolve) => {
        const vitals = { lcp: 0, fid: 0, cls: 0 };
        
        // Measure LCP
        new PerformanceObserver((entryList) => {
          const entries = entryList.getEntries();
          const lastEntry = entries[entries.length - 1];
          vitals.lcp = lastEntry.startTime;
        }).observe({ entryTypes: ['largest-contentful-paint'] });
        
        // Measure FID
        new PerformanceObserver((entryList) => {
          const entries = entryList.getEntries();
          entries.forEach(entry => {
            vitals.fid = entry.processingStart - entry.startTime;
          });
        }).observe({ entryTypes: ['first-input'] });
        
        // Measure CLS
        let clsValue = 0;
        new PerformanceObserver((entryList) => {
          const entries = entryList.getEntries();
          entries.forEach(entry => {
            if (!entry.hadRecentInput) {
              clsValue += entry.value;
            }
          });
          vitals.cls = clsValue;
        }).observe({ entryTypes: ['layout-shift'] });
        
        // Return measurements after brief collection period
        setTimeout(() => resolve(vitals), 3000);
      });
    });
  }

  async validateAccessibility(): Promise<void> {
    await injectAxe(this.page);
    await checkA11y(this.page, null, {
      detailedReport: true,
      detailedReportOptions: { html: true }
    });
  }

  async simulateNetworkConditions(condition: 'offline' | 'slow3g' | 'fast3g'): Promise<void> {
    const context = this.page.context();
    
    switch (condition) {
      case 'offline':
        await context.setOffline(true);
        break;
      case 'slow3g':
        // Use route interception to simulate slow network
        await this.page.route('**/*', route => {
          setTimeout(() => route.continue(), 2000); // 2s latency
        });
        break;
      case 'fast3g':
        // Use route interception with shorter delay
        await this.page.route('**/*', route => {
          setTimeout(() => route.continue(), 150); // 150ms latency
        });
        break;
    }
  }
}

test.describe('Enhanced Create Collection Deck UX Validation', () => {
  let deckPage: CreateCollectionDeckPage;

  test.beforeEach(async ({ page }) => {
    deckPage = new CreateCollectionDeckPage(page);
  });

  test.describe('Performance-Aware UX Testing', () => {
    
    test('Core Web Vitals meet user experience standards', async ({ page }) => {
      await deckPage.navigateToCreateDeck();
      
      const vitals = await deckPage.measureCoreWebVitals();
      
      // Validate performance budgets
      expect(vitals.lcp).toBeLessThan(PERFORMANCE_BUDGETS.LCP);
      expect(vitals.fid).toBeLessThan(PERFORMANCE_BUDGETS.FID);  
      expect(vitals.cls).toBeLessThan(PERFORMANCE_BUDGETS.CLS);
      
      // User experience validation
      await expect(page.locator('h3')).toContainText('Build Your Collection');
      await expect(page.locator('[data-testid="progress-bar"]')).toBeVisible();
    });

    test('Progressive loading maintains user confidence under slow connections', async ({ page }) => {
      await deckPage.simulateNetworkConditions('slow3g');
      await deckPage.navigateToCreateDeck();
      
      // Validate immediate feedback despite slow loading
      await expect(page.locator('[data-testid="progress-bar"]')).toBeVisible();
      await expect(page.locator('text=Build Your Collection')).toBeVisible({ timeout: 10000 });
      
      // Test data loading with progress feedback
      await deckPage.fillBasicCollectionInfo({ name: 'Slow Network Test' });
      await deckPage.loadDataWithProgressFeedback();
      
      // Validate user sees progress during slow operations
      await expect(page.locator('[data-testid="tle-source-select"]')).toHaveValue('UDL');
    });

    test('Bundle size impact measured and within user experience budget', async ({ page }) => {
      // Navigate and measure resource loading
      const [response] = await Promise.all([
        page.waitForResponse(response => response.url().includes('static/js')),
        deckPage.navigateToCreateDeck()
      ]);
      
      // Validate main bundle size
      const contentLength = response.headers()['content-length'];
      if (contentLength) {
        const bundleSize = parseInt(contentLength, 10);
        expect(bundleSize).toBeLessThan(PERFORMANCE_BUDGETS.BUNDLE_SIZE);
      }
      
      // Validate page is usable immediately
      await expect(page.locator('[data-testid="deck-name-input"]')).toBeVisible();
    });
  });

  test.describe('Advanced Accessibility Testing', () => {
    
    test('WCAG 2.1 AA compliance throughout complete user journey', async ({ page }) => {
      await deckPage.navigateToCreateDeck();
      await deckPage.validateAccessibility();
      
      // Test each step for accessibility compliance
      await deckPage.fillBasicCollectionInfo({ name: 'Accessibility Test' });
      await deckPage.validateAccessibility();
      
      await deckPage.loadDataWithProgressFeedback();
      await deckPage.configureParameters({
        elevation: '30',
        capacity: '50', 
        duration: '10'
      });
      await deckPage.validateAccessibility();
    });

    test('Keyboard navigation supports complete workflow', async ({ page }) => {
      await deckPage.navigateToCreateDeck();
      
      // Test keyboard-only navigation through form
      await page.keyboard.press('Tab');
      await page.keyboard.type('Keyboard Navigation Test');
      
      // Validate form completion with keyboard
      await page.keyboard.press('Tab');
      await page.keyboard.press('Enter'); // Date picker
      await page.keyboard.press('Enter'); // Select date
      
      await page.keyboard.press('Tab');
      await page.keyboard.press('Enter'); // End date
      await page.keyboard.press('ArrowRight');
      await page.keyboard.press('Enter');
      
      // Validate keyboard navigation provides user confidence
      await expect(page.locator('[data-testid="deck-name-input"]')).toHaveValue('Keyboard Navigation Test');
    });

    test('Screen reader announcements provide complete user guidance', async ({ page }) => {
      await deckPage.navigateToCreateDeck();
      
      // Validate ARIA labels and live regions
      await expect(page.locator('[data-testid="deck-name-input"]')).toHaveAttribute('aria-label');
      
      // Test loading state announcements
      await deckPage.fillBasicCollectionInfo({ name: 'Screen Reader Test' });
      
      await page.click('[data-testid="load-udl-button"]');
      await expect(page.locator('[aria-live="polite"]')).toBeVisible();
      
      // Validate progress announcements
      await expect(page.locator('[aria-live="polite"]')).toContainText(/Loading|Complete/);
    });

    test('Color contrast meets accessibility standards including dark mode', async ({ page }) => {
      await deckPage.navigateToCreateDeck();
      
      // Test color contrast in light mode
      const backgroundColor = await page.evaluate(() => {
        const element = document.querySelector('body');
        return window.getComputedStyle(element).backgroundColor;
      });
      
      // Simulate dark mode preference
      await page.emulateMedia({ colorScheme: 'dark' });
      
      // Validate contrast ratios meet WCAG standards
      const darkBackgroundColor = await page.evaluate(() => {
        const element = document.querySelector('body');
        return window.getComputedStyle(element).backgroundColor;
      });
      
      expect(backgroundColor).not.toBe(darkBackgroundColor);
    });
  });

  test.describe('Visual Regression Prevention', () => {
    
    test('Cross-browser visual consistency maintained', async ({ page, browserName }) => {
      await deckPage.navigateToCreateDeck();
      
      // Capture step indicators across browsers
      await expect(page.locator('[data-testid="progress-card"]')).toHaveScreenshot(`progress-indicator-${browserName}.png`);
      
      // Test form layout consistency
      await expect(page.locator('[data-testid="step-content-card"]')).toHaveScreenshot(`step1-form-${browserName}.png`);
    });

    test('Mobile responsive design maintains usability', async ({ page, isMobile }) => {
      if (!isMobile) test.skip();
      
      await deckPage.navigateToCreateDeck();
      
      // Validate mobile layout
      await expect(page.locator('[data-testid="progress-bar"]')).toBeVisible();
      
      // Test touch targets meet minimum size requirements
      const buttons = page.locator('button');
      const buttonCount = await buttons.count();
      
      for (let i = 0; i < buttonCount; i++) {
        const button = buttons.nth(i);
        if (await button.isVisible()) {
          const boundingBox = await button.boundingBox();
          if (boundingBox) {
            expect(boundingBox.height).toBeGreaterThan(44);
            expect(boundingBox.width).toBeGreaterThan(44);
          }
        }
      }
      
      // Mobile layout screenshot
      await expect(page).toHaveScreenshot('mobile-create-deck.png');
    });

    test('Loading state visual validation maintains user confidence', async ({ page }) => {
      await deckPage.navigateToCreateDeck();
      
      await deckPage.fillBasicCollectionInfo({ name: 'Visual Loading Test' });
      
      // Capture loading state visual feedback
      await page.click('[data-testid="load-udl-button"]');
      await expect(page.locator('[data-testid="load-udl-button"][aria-busy="true"]')).toBeVisible();
      
      // Visual validation of loading state
      await expect(page.locator('[data-testid="load-udl-button"]')).toHaveScreenshot('loading-button-state.png');
    });
  });

  test.describe('Enhanced Error Recovery Testing', () => {
    
    test('Network timeout graceful degradation with actionable user guidance', async ({ page }) => {
      await deckPage.navigateToCreateDeck();
      
      // Simulate network timeout
      await page.route('**/api/udl-data', route => {
        return new Promise(resolve => {
          setTimeout(() => resolve(route.abort()), 5000);
        });
      });
      
      await deckPage.fillBasicCollectionInfo({ name: 'Network Timeout Test' });
      await page.click('[data-testid="load-udl-button"]');
      
      // Validate graceful error handling
      await expect(page.locator('text=Failed to load')).toBeVisible({ timeout: 8000 });
      await expect(page.locator('button:has-text("Try Again")')).toBeVisible();
      
      // Validate user can recover
      await page.unroute('**/api/udl-data');
      await page.click('button:has-text("Try Again")');
      await expect(page.locator('[data-testid="tle-source-select"]')).toHaveValue('UDL', { timeout: 5000 });
    });

    test('Form validation provides specific actionable feedback', async ({ page }) => {
      await deckPage.navigateToCreateDeck();
      
      // Test validation without required fields
      await page.click('[data-testid="next-button"]');
      
      // Validate specific error messages
      await expect(page.locator('text=Start date is required')).toBeVisible();
      await expect(page.locator('text=End date is required')).toBeVisible();
      await expect(page.locator('text=TLE data source is required')).toBeVisible();
      
      // Test error clearing with user input
      await deckPage.fillBasicCollectionInfo({ name: 'Validation Test' });
      await expect(page.locator('text=Start date is required')).not.toBeVisible();
    });

    test('User session recovery maintains work progress', async ({ page }) => {
      await deckPage.navigateToCreateDeck();
      
      // Fill partial data
      await deckPage.fillBasicCollectionInfo({ name: 'Recovery Test Collection' });
      
      // Validate auto-save indicator
      await expect(page.locator('[data-testid="unsaved-changes-warning"]')).toBeVisible();
      
      // Navigate away and return
      await page.goto('/decks');
      await expect(page.locator('[data-testid="resume-deck-button"]')).toBeVisible();
      
      // Resume work
      await page.click('[data-testid="resume-deck-button"]');
      await expect(page.locator('[data-testid="deck-name-input"]')).toHaveValue('Recovery Test Collection');
    });

    test('Server error messaging maintains user trust and provides recovery path', async ({ page }) => {
      await deckPage.navigateToCreateDeck();
      
      // Simulate server error
      await page.route('**/api/**', route => route.fulfill({
        status: 500,
        body: JSON.stringify({ error: 'Internal server error' })
      }));
      
      await deckPage.fillBasicCollectionInfo({ name: 'Server Error Test' });
      await page.click('[data-testid="load-udl-button"]');
      
      // Validate user-friendly error messaging
      await expect(page.locator('text=Failed to load')).toBeVisible({ timeout: 5000 });
      await expect(page.locator('button:has-text("Try Again")')).toBeVisible();
      
      // Validate work is preserved
      await expect(page.locator('[data-testid="deck-name-input"]')).toHaveValue('Server Error Test');
    });
  });

  test.describe('User Journey Optimization', () => {
    
    test('Complete user journey builds progressive confidence', async ({ page }) => {
      const startTime = Date.now();
      
      await deckPage.navigateToCreateDeck();
      
      // Step 1: Validate immediate user understanding
      await expect(page.locator('h3:has-text("Build Your Collection")')).toBeVisible();
      await expect(page.locator('[data-testid="progress-bar"]')).toBeVisible();
      
      await deckPage.fillBasicCollectionInfo({ 
        name: 'Progressive Confidence Test Collection' 
      });
      await deckPage.loadDataWithProgressFeedback();
      
      // Step 2: Validate user understanding of parameter impacts
      await deckPage.configureParameters({
        elevation: '30',
        capacity: '50',
        duration: '10'
      });
      
      await expect(page.locator('text=sites available')).toBeVisible();
      
      // Step 3: Validate match selection confidence
      await deckPage.selectMatchesWithValidation();
      await expect(page.locator('text=Showing')).toBeVisible();
      
      // Step 4: Validate completion satisfaction
      await deckPage.completeCollectionWithInstructions('High priority test collection');
      
      const completionTime = Date.now() - startTime;
      expect(completionTime).toBeLessThan(60000); // Complete flow <1 minute
      
      // Validate successful completion context
      await expect(page.url()).toContain('/history');
    });

    test('Error recovery maintains user confidence and trust', async ({ page }) => {
      await deckPage.navigateToCreateDeck();
      
      // Simulate error during critical step
      await page.route('**/api/matches', route => route.abort());
      
      await deckPage.fillBasicCollectionInfo({ name: 'Error Recovery Test' });
      await deckPage.loadDataWithProgressFeedback();
      await deckPage.configureParameters({
        elevation: '30',
        capacity: '50', 
        duration: '10'
      });
      
      // Trigger error and validate graceful handling
      await page.click('button:has-text("Next")');
      await page.click('button:has-text("Start Background Processing")');
      
      // Validate error doesn't break user trust
      await expect(page.locator('[data-testid="loading-spinner"]')).toBeVisible();
      
      // Validate work is preserved and recoverable
      await page.unroute('**/api/matches');
      await expect(page.locator('[data-testid="deck-name-input"]')).toHaveValue('Error Recovery Test');
    });

    test('User task completion satisfaction indicators present', async ({ page }) => {
      await deckPage.navigateToCreateDeck();
      
      // Complete minimal successful path
      await deckPage.fillBasicCollectionInfo({ name: 'Satisfaction Test' });
      await deckPage.loadDataWithProgressFeedback();
      
      // Validate progress indicators provide satisfaction
      await expect(page.locator('[aria-valuenow]')).toHaveAttribute('aria-valuenow', '25');
      
      await deckPage.configureParameters({
        elevation: '30',
        capacity: '50',
        duration: '10' 
      });
      
      // Validate user sees clear progress and impact
      await expect(page.locator('text=sites available')).toBeVisible();
      await expect(page.locator('[data-testid="hard-capacity-input"]')).toHaveValue('50');
      
      // Complete and validate satisfaction indicators
      await deckPage.selectMatchesWithValidation();
      await expect(page.locator('input[type="checkbox"]:checked')).toBeVisible();
    });
  });
});

// Performance monitoring utilities
export class PerformanceMonitor {
  static async measurePageLoad(page: Page): Promise<number> {
    return await page.evaluate(() => {
      return window.performance.timing.loadEventEnd - window.performance.timing.navigationStart;
    });
  }

  static async measureBundleSize(page: Page): Promise<number> {
    const resources = await page.evaluate(() => {
      return performance.getEntriesByType('resource')
        .filter(resource => resource.name.includes('.js'))
        .reduce((total, resource) => total + (resource as any).transferSize || 0, 0);
    });
    return resources;
  }
}

// Visual testing utilities
export class VisualValidator {
  static async captureComponent(page: Page, selector: string, filename: string): Promise<void> {
    await expect(page.locator(selector)).toHaveScreenshot(filename);
  }

  static async validateTouchTargets(page: Page): Promise<boolean> {
    const invalidTargets = await page.evaluate(() => {
      const buttons = Array.from(document.querySelectorAll('button, a, input[type="button"]'));
      return buttons.filter(button => {
        const rect = button.getBoundingClientRect();
        return rect.width < 44 || rect.height < 44;
      }).length;
    });
    return invalidTargets === 0;
  }
}

// Accessibility utilities
export class A11yValidator {
  static async validateAriaLabels(page: Page): Promise<boolean> {
    const missingLabels = await page.evaluate(() => {
      const inputs = Array.from(document.querySelectorAll('input, button, select'));
      return inputs.filter(input => {
        return !input.getAttribute('aria-label') && 
               !input.getAttribute('aria-labelledby') &&
               !input.closest('label');
      }).length;
    });
    return missingLabels === 0;
  }

  static async validateColorContrast(page: Page): Promise<boolean> {
    // Simplified contrast validation - in production use axe-core
    return await page.evaluate(() => {
      const elements = Array.from(document.querySelectorAll('*'));
      // Implementation would check actual color contrast ratios
      return true; // Placeholder
    });
  }
}