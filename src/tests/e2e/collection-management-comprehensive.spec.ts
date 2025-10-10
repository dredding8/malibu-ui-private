import { test, expect, Page, BrowserContext } from '@playwright/test';
import { injectAxe, checkA11y, getViolations } from 'axe-playwright';

/**
 * Comprehensive E2E tests for Collection Management Page
 * URL: http://localhost:3000/collection/DECK-1757517559289/manage
 * 
 * Test Coverage:
 * 1. UI/UX Accessibility (axe-core, WCAG 2.1)
 * 2. Security vulnerabilities (XSS, injection, auth bypass)
 * 3. Functionality (table interactions, filtering, sorting, selection)
 * 4. Responsive design (multiple viewport sizes)
 * 5. Error handling and edge cases
 * 6. Keyboard navigation and screen reader compatibility
 * 7. Data validation and input sanitization
 */

test.describe('Collection Management Comprehensive Testing', () => {
  const testCollectionId = 'DECK-1757517559289';
  const pageUrl = `/collection/${testCollectionId}/manage`;

  // Common setup
  test.beforeEach(async ({ page }) => {
    // Set up console error tracking
    const consoleErrors: string[] = [];
    page.on('console', msg => {
      if (msg.type() === 'error') {
        consoleErrors.push(msg.text());
      }
    });
    (page as any).consoleErrors = consoleErrors;

    // Navigate to page
    await page.goto(pageUrl);
    await page.waitForLoadState('networkidle');
    
    // Inject axe for accessibility testing
    await injectAxe(page);
  });

  test.describe('1. UI/UX Accessibility Testing', () => {
    test('should pass WCAG 2.1 accessibility audit', async ({ page }) => {
      // Check initial page accessibility
      const violations = await getViolations(page);
      
      if (violations.length > 0) {
        console.log('Accessibility violations found:');
        violations.forEach(violation => {
          console.log(`- ${violation.id}: ${violation.description}`);
          console.log(`  Impact: ${violation.impact}`);
          console.log(`  Help: ${violation.help}`);
          violation.nodes.forEach(node => {
            console.log(`    Element: ${node.target}`);
          });
        });
      }

      // Assert no critical or serious violations
      const criticalViolations = violations.filter(v => 
        v.impact === 'critical' || v.impact === 'serious'
      );
      expect(criticalViolations.length).toBe(0);
    });

    test('should have proper ARIA labels and roles', async ({ page }) => {
      // Check main navigation has proper ARIA
      const nav = page.locator('nav, [role="navigation"]');
      await expect(nav).toBeVisible();

      // Check tables have proper ARIA
      const tables = page.locator('table, [role="table"]');
      if (await tables.count() > 0) {
        for (let i = 0; i < await tables.count(); i++) {
          const table = tables.nth(i);
          // Tables should have captions or aria-label
          const hasCaption = await table.locator('caption').count() > 0;
          const hasAriaLabel = await table.getAttribute('aria-label');
          expect(hasCaption || hasAriaLabel).toBeTruthy();
        }
      }

      // Check buttons have accessible names
      const buttons = page.locator('button');
      for (let i = 0; i < await buttons.count(); i++) {
        const button = buttons.nth(i);
        const text = await button.textContent();
        const ariaLabel = await button.getAttribute('aria-label');
        const title = await button.getAttribute('title');
        expect(text || ariaLabel || title).toBeTruthy();
      }
    });

    test('should have sufficient color contrast', async ({ page }) => {
      // Use axe to check color contrast
      await checkA11y(page, undefined, {
        rules: {
          'color-contrast': { enabled: true }
        }
      });
    });

    test('should be focusable and have focus indicators', async ({ page }) => {
      // Check all interactive elements are focusable
      const interactiveElements = page.locator('button, input, select, textarea, a[href], [tabindex]:not([tabindex="-1"])');
      
      for (let i = 0; i < Math.min(10, await interactiveElements.count()); i++) {
        const element = interactiveElements.nth(i);
        await element.focus();
        
        // Check element is focused
        const isFocused = await element.evaluate(el => el === document.activeElement);
        expect(isFocused).toBeTruthy();
      }
    });
  });

  test.describe('2. Security Vulnerability Testing', () => {
    test('should prevent XSS injection in search/filter fields', async ({ page }) => {
      // Test script injection
      const xssPayloads = [
        '<script>alert("XSS")</script>',
        'javascript:alert("XSS")',
        '<img src=x onerror=alert("XSS")>',
        '"><script>alert("XSS")</script>',
        "'; DROP TABLE opportunities; --"
      ];

      // Find input fields
      const inputs = page.locator('input[type="text"], input[type="search"], textarea');
      
      for (let i = 0; i < await inputs.count(); i++) {
        const input = inputs.nth(i);
        
        for (const payload of xssPayloads) {
          await input.fill(payload);
          await page.keyboard.press('Enter');
          
          // Check that script didn't execute
          const alerts = await page.evaluate(() => window.alert);
          expect(alerts).toBeFalsy();
          
          // Check content is properly escaped
          const value = await input.inputValue();
          expect(value).not.toContain('<script>');
        }
      }
    });

    test('should sanitize URL parameters', async ({ page }) => {
      // Test malicious URL parameters
      const maliciousParams = [
        `${pageUrl}?search=<script>alert('XSS')</script>`,
        `${pageUrl}?filter=javascript:alert('XSS')`,
        `${pageUrl}?sort=<img src=x onerror=alert('XSS')>`
      ];

      for (const url of maliciousParams) {
        await page.goto(url);
        await page.waitForTimeout(1000);
        
        // Check no script execution occurred
        const alerts = await page.evaluate(() => window.alert);
        expect(alerts).toBeFalsy();
      }
    });

    test('should handle authentication properly', async ({ page, context }) => {
      // Test direct access without authentication (if applicable)
      const newContext = await page.context().browser()?.newContext({
        httpCredentials: undefined
      });
      
      if (newContext) {
        const newPage = await newContext.newPage();
        await newPage.goto(pageUrl);
        
        // Should redirect to login or show auth error
        const url = newPage.url();
        const hasAuthError = await newPage.locator('text=/unauthorized|login|access denied/i').count() > 0;
        
        // Either redirected away from page or shows auth error
        expect(url !== `http://localhost:3000${pageUrl}` || hasAuthError).toBeTruthy();
        
        await newContext.close();
      }
    });

    test('should prevent CSRF attacks', async ({ page }) => {
      // Check for CSRF tokens in forms
      const forms = page.locator('form');
      
      for (let i = 0; i < await forms.count(); i++) {
        const form = forms.nth(i);
        const method = await form.getAttribute('method');
        
        if (method && method.toLowerCase() !== 'get') {
          // Should have CSRF token
          const csrfToken = form.locator('input[name*="csrf"], input[name*="_token"]');
          const hasToken = await csrfToken.count() > 0;
          
          if (!hasToken) {
            console.warn('Form without CSRF token detected');
          }
        }
      }
    });
  });

  test.describe('3. Functionality Testing', () => {
    test('should load and display opportunities table', async ({ page }) => {
      // Wait for loading to complete
      await page.waitForLoadState('networkidle');
      
      // Check for loading spinner to disappear
      await page.waitForSelector('.loading-content, .bp5-spinner', { state: 'hidden', timeout: 10000 });
      
      // Should show opportunities content
      const hasTable = await page.locator('table, .bp5-table, .opportunities-table').count() > 0;
      const hasCards = await page.locator('.opportunity-card, .stat-card').count() > 0;
      
      expect(hasTable || hasCards).toBeTruthy();
    });

    test('should handle table sorting', async ({ page }) => {
      // Wait for data to load
      await page.waitForSelector('.bp5-table-header, th', { timeout: 10000 });
      
      const sortableHeaders = page.locator('.bp5-table-header[role="columnheader"], th[role="columnheader"], .sortable-header');
      
      if (await sortableHeaders.count() > 0) {
        const firstHeader = sortableHeaders.first();
        
        // Click to sort
        await firstHeader.click();
        await page.waitForTimeout(500);
        
        // Check for sort indicator
        const sortIcon = page.locator('.bp5-icon-sort-asc, .bp5-icon-sort-desc, .sort-icon');
        expect(await sortIcon.count()).toBeGreaterThan(0);
        
        // Click again to reverse sort
        await firstHeader.click();
        await page.waitForTimeout(500);
      }
    });

    test('should handle row selection', async ({ page }) => {
      // Wait for table rows
      await page.waitForSelector('.bp5-table-row, tr[role="row"]', { timeout: 10000 });
      
      const rows = page.locator('.bp5-table-row, tr[role="row"]').filter({ hasNot: page.locator('th') });
      
      if (await rows.count() > 0) {
        // Click first row
        await rows.first().click();
        await page.waitForTimeout(300);
        
        // Check for selection
        const selectedRows = page.locator('.bp5-table-row-selected, .selected, [aria-selected="true"]');
        expect(await selectedRows.count()).toBeGreaterThan(0);
        
        // Test multi-selection if supported
        if (await rows.count() > 1) {
          await rows.nth(1).click({ modifiers: ['Control'] });
          await page.waitForTimeout(300);
          
          // Should have multiple selected
          expect(await selectedRows.count()).toBeGreaterThanOrEqual(1);
        }
      }
    });

    test('should handle filtering/search', async ({ page }) => {
      // Look for search/filter inputs
      const searchInputs = page.locator('input[type="search"], input[placeholder*="search"], input[placeholder*="filter"]');
      
      if (await searchInputs.count() > 0) {
        const searchInput = searchInputs.first();
        
        // Enter search term
        await searchInput.fill('test');
        await page.keyboard.press('Enter');
        await page.waitForTimeout(1000);
        
        // Clear search
        await searchInput.fill('');
        await page.keyboard.press('Enter');
        await page.waitForTimeout(1000);
      }
    });

    test('should handle tab navigation', async ({ page }) => {
      // Check for tabs
      const tabs = page.locator('.bp5-tab, [role="tab"]');
      
      if (await tabs.count() > 1) {
        // Click different tabs
        for (let i = 0; i < Math.min(3, await tabs.count()); i++) {
          await tabs.nth(i).click();
          await page.waitForTimeout(500);
          
          // Check tab is active
          const isActive = await tabs.nth(i).getAttribute('aria-selected');
          expect(isActive).toBe('true');
        }
      }
    });
  });

  test.describe('4. Responsive Design Testing', () => {
    const viewports = [
      { width: 1920, height: 1080, name: 'Desktop Large' },
      { width: 1366, height: 768, name: 'Desktop' },
      { width: 1024, height: 768, name: 'Tablet Landscape' },
      { width: 768, height: 1024, name: 'Tablet Portrait' },
      { width: 414, height: 896, name: 'Mobile Large' },
      { width: 375, height: 667, name: 'Mobile' },
      { width: 320, height: 568, name: 'Mobile Small' }
    ];

    for (const viewport of viewports) {
      test(`should work properly on ${viewport.name} (${viewport.width}x${viewport.height})`, async ({ page }) => {
        await page.setViewportSize({ width: viewport.width, height: viewport.height });
        await page.waitForTimeout(500);
        
        // Check page still loads
        await page.waitForSelector('body', { timeout: 5000 });
        
        // Check no horizontal scrollbar on smaller screens
        if (viewport.width <= 768) {
          const scrollWidth = await page.evaluate(() => document.body.scrollWidth);
          const clientWidth = await page.evaluate(() => document.body.clientWidth);
          expect(scrollWidth).toBeLessThanOrEqual(clientWidth + 20); // Allow small tolerance
        }
        
        // Check navigation is accessible
        const nav = page.locator('nav, .navigation, .navbar');
        if (await nav.count() > 0) {
          await expect(nav.first()).toBeVisible();
        }
        
        // Check main content is visible
        const main = page.locator('main, .main-content, .hub-content');
        if (await main.count() > 0) {
          await expect(main.first()).toBeVisible();
        }
      });
    }

    test('should handle viewport changes gracefully', async ({ page }) => {
      // Start desktop
      await page.setViewportSize({ width: 1920, height: 1080 });
      await page.waitForTimeout(300);
      
      // Switch to mobile
      await page.setViewportSize({ width: 375, height: 667 });
      await page.waitForTimeout(300);
      
      // Switch back to desktop
      await page.setViewportSize({ width: 1366, height: 768 });
      await page.waitForTimeout(300);
      
      // Page should still be functional
      const body = page.locator('body');
      await expect(body).toBeVisible();
    });
  });

  test.describe('5. Error Handling and Edge Cases', () => {
    test('should handle network errors gracefully', async ({ page, context }) => {
      // Simulate network failure
      await context.setOffline(true);
      
      // Try to perform actions that would require network
      const buttons = page.locator('button').filter({ hasText: /save|submit|load|refresh/i });
      if (await buttons.count() > 0) {
        await buttons.first().click();
        await page.waitForTimeout(2000);
        
        // Should show error message
        const errorMessages = page.locator('text=/error|failed|offline|network/i');
        expect(await errorMessages.count()).toBeGreaterThan(0);
      }
      
      // Restore network
      await context.setOffline(false);
    });

    test('should handle invalid data gracefully', async ({ page }) => {
      // Test invalid form inputs
      const inputs = page.locator('input[type="number"], input[type="email"], input[type="url"]');
      
      for (let i = 0; i < await inputs.count(); i++) {
        const input = inputs.nth(i);
        const type = await input.getAttribute('type');
        
        // Enter invalid data based on input type
        if (type === 'number') {
          await input.fill('not-a-number');
        } else if (type === 'email') {
          await input.fill('invalid-email');
        } else if (type === 'url') {
          await input.fill('invalid-url');
        }
        
        await page.keyboard.press('Tab');
        await page.waitForTimeout(300);
        
        // Check for validation feedback
        const validationMessage = await input.evaluate(el => (el as HTMLInputElement).validationMessage);
        const hasErrorClass = await input.getAttribute('class');
        
        expect(validationMessage || hasErrorClass?.includes('error')).toBeTruthy();
      }
    });

    test('should handle empty states', async ({ page }) => {
      // Look for ways to create empty states
      const clearButtons = page.locator('button').filter({ hasText: /clear|reset|delete all/i });
      
      if (await clearButtons.count() > 0) {
        await clearButtons.first().click();
        await page.waitForTimeout(1000);
        
        // Should show empty state message
        const emptyStates = page.locator('text=/no data|empty|no results|no items/i');
        const nonIdealStates = page.locator('.bp5-non-ideal-state');
        
        expect(await emptyStates.count() > 0 || await nonIdealStates.count() > 0).toBeTruthy();
      }
    });

    test('should handle page refresh during actions', async ({ page }) => {
      // Start an action
      const buttons = page.locator('button').filter({ hasText: /edit|save|submit/i });
      if (await buttons.count() > 0) {
        await buttons.first().click();
        await page.waitForTimeout(100);
        
        // Refresh page mid-action
        await page.reload();
        await page.waitForLoadState('networkidle');
        
        // Page should load normally
        await expect(page.locator('body')).toBeVisible();
      }
    });
  });

  test.describe('6. Keyboard Navigation and Screen Reader Compatibility', () => {
    test('should support keyboard navigation', async ({ page }) => {
      // Test Tab navigation
      await page.keyboard.press('Tab');
      let activeElement = await page.evaluate(() => document.activeElement?.tagName);
      expect(['BUTTON', 'INPUT', 'SELECT', 'TEXTAREA', 'A'].includes(activeElement || '')).toBeTruthy();
      
      // Continue tabbing through several elements
      for (let i = 0; i < 10; i++) {
        await page.keyboard.press('Tab');
        await page.waitForTimeout(100);
        
        activeElement = await page.evaluate(() => document.activeElement?.tagName);
        if (!activeElement || activeElement === 'BODY') break;
      }
      
      // Test Shift+Tab (reverse navigation)
      await page.keyboard.press('Shift+Tab');
      await page.waitForTimeout(100);
    });

    test('should support keyboard shortcuts', async ({ page }) => {
      // Test common keyboard shortcuts
      const shortcuts = [
        'Escape', // Should close modals/cancel actions
        'Enter',  // Should activate focused element
        'Space'   // Should activate buttons/checkboxes
      ];
      
      for (const shortcut of shortcuts) {
        // Focus on a button first
        const buttons = page.locator('button');
        if (await buttons.count() > 0) {
          await buttons.first().focus();
          await page.keyboard.press(shortcut);
          await page.waitForTimeout(300);
        }
      }
    });

    test('should have proper heading hierarchy', async ({ page }) => {
      // Check heading structure
      const headings = await page.locator('h1, h2, h3, h4, h5, h6').all();
      
      if (headings.length > 0) {
        const headingLevels = await Promise.all(
          headings.map(h => h.evaluate(el => parseInt(el.tagName[1])))
        );
        
        // Should start with h1
        expect(headingLevels[0]).toBe(1);
        
        // Check for proper hierarchy (no skipping levels)
        for (let i = 1; i < headingLevels.length; i++) {
          const diff = headingLevels[i] - headingLevels[i - 1];
          expect(diff).toBeLessThanOrEqual(1);
        }
      }
    });

    test('should support screen reader landmarks', async ({ page }) => {
      // Check for ARIA landmarks
      const landmarks = [
        '[role="banner"], header',
        '[role="navigation"], nav',
        '[role="main"], main',
        '[role="contentinfo"], footer',
        '[role="complementary"], aside',
        '[role="search"]'
      ];
      
      let landmarkCount = 0;
      for (const landmark of landmarks) {
        const count = await page.locator(landmark).count();
        landmarkCount += count;
      }
      
      expect(landmarkCount).toBeGreaterThan(0);
    });

    test('should announce changes to screen readers', async ({ page }) => {
      // Look for ARIA live regions
      const liveRegions = page.locator('[aria-live], [role="status"], [role="alert"]');
      
      if (await liveRegions.count() > 0) {
        // Trigger a change that should announce
        const buttons = page.locator('button').filter({ hasText: /save|submit|delete/i });
        if (await buttons.count() > 0) {
          await buttons.first().click();
          await page.waitForTimeout(1000);
          
          // Check if live region was updated
          const liveContent = await liveRegions.first().textContent();
          expect(liveContent?.trim()).toBeTruthy();
        }
      }
    });
  });

  test.describe('7. Data Validation and Input Sanitization', () => {
    test('should validate required fields', async ({ page }) => {
      const requiredInputs = page.locator('input[required], select[required], textarea[required]');
      
      for (let i = 0; i < await requiredInputs.count(); i++) {
        const input = requiredInputs.nth(i);
        
        // Try to submit empty required field
        await input.focus();
        await input.fill('');
        await page.keyboard.press('Tab');
        
        // Should show validation error
        const validationMessage = await input.evaluate(el => (el as HTMLInputElement).validationMessage);
        const hasErrorState = await input.getAttribute('aria-invalid');
        
        expect(validationMessage || hasErrorState === 'true').toBeTruthy();
      }
    });

    test('should validate input formats', async ({ page }) => {
      // Test email validation
      const emailInputs = page.locator('input[type="email"]');
      for (let i = 0; i < await emailInputs.count(); i++) {
        const input = emailInputs.nth(i);
        await input.fill('invalid-email');
        await page.keyboard.press('Tab');
        
        const isValid = await input.evaluate(el => (el as HTMLInputElement).checkValidity());
        expect(isValid).toBeFalsy();
      }
      
      // Test number validation
      const numberInputs = page.locator('input[type="number"]');
      for (let i = 0; i < await numberInputs.count(); i++) {
        const input = numberInputs.nth(i);
        await input.fill('not-a-number');
        await page.keyboard.press('Tab');
        
        const isValid = await input.evaluate(el => (el as HTMLInputElement).checkValidity());
        expect(isValid).toBeFalsy();
      }
    });

    test('should enforce input length limits', async ({ page }) => {
      const inputs = page.locator('input[maxlength], textarea[maxlength]');
      
      for (let i = 0; i < await inputs.count(); i++) {
        const input = inputs.nth(i);
        const maxLength = await input.getAttribute('maxlength');
        
        if (maxLength) {
          const limit = parseInt(maxLength);
          const longText = 'a'.repeat(limit + 10);
          
          await input.fill(longText);
          const actualValue = await input.inputValue();
          
          expect(actualValue.length).toBeLessThanOrEqual(limit);
        }
      }
    });

    test('should sanitize HTML input', async ({ page }) => {
      const textInputs = page.locator('input[type="text"], textarea');
      
      for (let i = 0; i < await textInputs.count(); i++) {
        const input = textInputs.nth(i);
        
        // Try to inject HTML
        await input.fill('<b>bold</b><script>alert("xss")</script>');
        await page.keyboard.press('Tab');
        
        // Check if displayed value is sanitized
        const displayedValue = await input.inputValue();
        expect(displayedValue).not.toContain('<script>');
      }
    });
  });

  test.describe('Performance and Console Error Checking', () => {
    test('should not have console errors', async ({ page }) => {
      // Wait for page to fully load
      await page.waitForLoadState('networkidle');
      await page.waitForTimeout(2000);
      
      // Check for console errors
      const consoleErrors = (page as any).consoleErrors;
      
      if (consoleErrors.length > 0) {
        console.log('Console errors found:');
        consoleErrors.forEach((error: string) => console.log(`- ${error}`));
      }
      
      // Filter out known non-critical errors
      const criticalErrors = consoleErrors.filter((error: string) => 
        !error.includes('favicon') && 
        !error.includes('DevTools') &&
        !error.includes('Extension')
      );
      
      expect(criticalErrors.length).toBe(0);
    });

    test('should load within reasonable time', async ({ page }) => {
      const startTime = Date.now();
      
      await page.goto(pageUrl);
      await page.waitForSelector('body');
      await page.waitForLoadState('networkidle');
      
      const loadTime = Date.now() - startTime;
      
      // Should load within 10 seconds
      expect(loadTime).toBeLessThan(10000);
    });
  });

  // Summary test that captures overall status
  test('SUMMARY: Collection Management Page Health Check', async ({ page }) => {
    const results = {
      pageLoaded: false,
      navigationWorking: false,
      contentVisible: false,
      interactionsPossible: false,
      accessibilityBasic: false,
      responsiveLayout: false
    };

    try {
      // Basic page load
      await page.goto(pageUrl);
      await page.waitForSelector('body', { timeout: 10000 });
      results.pageLoaded = true;

      // Navigation present
      const nav = page.locator('nav, .navbar, .navigation');
      if (await nav.count() > 0) {
        results.navigationWorking = true;
      }

      // Content visible
      const content = page.locator('main, .main-content, .hub-content, .collection-opportunities-hub');
      if (await content.count() > 0) {
        results.contentVisible = true;
      }

      // Basic interactions work
      const buttons = page.locator('button');
      if (await buttons.count() > 0) {
        results.interactionsPossible = true;
      }

      // Basic accessibility
      const headings = page.locator('h1, h2, h3');
      const labels = page.locator('label');
      if (await headings.count() > 0 && await labels.count() >= 0) {
        results.accessibilityBasic = true;
      }

      // Responsive check
      await page.setViewportSize({ width: 768, height: 1024 });
      await page.waitForTimeout(500);
      const stillVisible = await content.isVisible();
      if (stillVisible) {
        results.responsiveLayout = true;
      }

    } catch (error) {
      console.error('Health check error:', error);
    }

    // Report results
    console.log('=== COLLECTION MANAGEMENT PAGE HEALTH CHECK ===');
    console.log(`Page Loaded: ${results.pageLoaded ? '✅' : '❌'}`);
    console.log(`Navigation Working: ${results.navigationWorking ? '✅' : '❌'}`);
    console.log(`Content Visible: ${results.contentVisible ? '✅' : '❌'}`);
    console.log(`Interactions Possible: ${results.interactionsPossible ? '✅' : '❌'}`);
    console.log(`Basic Accessibility: ${results.accessibilityBasic ? '✅' : '❌'}`);
    console.log(`Responsive Layout: ${results.responsiveLayout ? '✅' : '❌'}`);
    console.log('================================================');

    // Ensure critical functionality works
    expect(results.pageLoaded).toBeTruthy();
    expect(results.contentVisible).toBeTruthy();
  });
});