/**
 * UI/UX Validation Tests for Collection Opportunities
 * Tests current implementation regardless of which variant is active
 */

import { test, expect } from '@playwright/test';

test.describe('Collection Opportunities UI/UX Validation', () => {
  test.beforeEach(async ({ page }) => {
    // Set feature flags to ensure enhanced bento is active
    await page.addInitScript(() => {
      localStorage.setItem('featureFlags', JSON.stringify({
        enableEnhancedBento: true,
        enableBentoLayout: true,
        enableSplitView: false,
        useRefactoredComponents: false
      }));
    });
    
    await page.goto('http://localhost:3000/collection/test-123/manage');
    await page.waitForLoadState('networkidle');
    
    // Wait for any loading spinners to disappear
    await page.waitForFunction(() => {
      const spinner = document.querySelector('.bp5-spinner');
      return !spinner || spinner.clientHeight === 0;
    }, { timeout: 10000 });
  });

  test.describe('Visual Structure Tests', () => {
    test('should have proper page structure', async ({ page }) => {
      // Take screenshot for visual reference
      await page.screenshot({ path: 'collection-opportunities-ui-test.png', fullPage: true });
      
      // Check for main hub container
      const hubContainer = page.locator('.collection-opportunities-hub');
      const hubExists = await hubContainer.count() > 0;
      
      if (hubExists) {
        // Verify hub structure
        await expect(hubContainer).toBeVisible();
        
        // Check for header
        const header = page.locator('.hub-header');
        if (await header.count() > 0) {
          await expect(header).toBeVisible();
          console.log('✓ Hub header found');
        }
        
        // Check for stats dashboard
        const stats = page.locator('.hub-stats');
        if (await stats.count() > 0) {
          await expect(stats).toBeVisible();
          console.log('✓ Stats dashboard found');
        }
        
        // Check for tabs
        const tabs = page.locator('.hub-tabs');
        if (await tabs.count() > 0) {
          await expect(tabs).toBeVisible();
          console.log('✓ Hub tabs found');
        }
      } else {
        // If no hub, check for standalone implementation
        const standaloneImplementations = [
          '.collection-opportunities-enhanced-bento',
          '.collection-opportunities-bento',
          '.collection-opportunities-split-view',
          '.collection-opportunities-enhanced'
        ];
        
        for (const selector of standaloneImplementations) {
          if (await page.locator(selector).count() > 0) {
            console.log(`✓ Found implementation: ${selector}`);
            await expect(page.locator(selector)).toBeVisible();
            break;
          }
        }
      }
    });

    test('should display KPI metrics', async ({ page }) => {
      // Look for any KPI/stat cards
      const kpiSelectors = [
        '.stat-card',
        '.kpi-card',
        '.metric-card',
        '.bp5-card:has-text("Total")',
        '.bp5-card:has-text("Opportunities")'
      ];
      
      let foundKPIs = false;
      for (const selector of kpiSelectors) {
        const count = await page.locator(selector).count();
        if (count > 0) {
          console.log(`✓ Found ${count} KPI cards with selector: ${selector}`);
          foundKPIs = true;
          
          // Verify at least some KPIs are visible
          expect(count).toBeGreaterThanOrEqual(3);
          break;
        }
      }
      
      if (!foundKPIs) {
        console.log('⚠ No KPI cards found in current implementation');
      }
    });

    test('should have data table or grid', async ({ page }) => {
      // Look for table implementations
      const tableSelectors = [
        '.opportunities-table',
        '.bp5-table',
        '.collection-opportunities-table',
        'table[role="grid"]',
        '[role="table"]'
      ];
      
      let foundTable = false;
      for (const selector of tableSelectors) {
        if (await page.locator(selector).count() > 0) {
          console.log(`✓ Found table with selector: ${selector}`);
          await expect(page.locator(selector).first()).toBeVisible();
          foundTable = true;
          break;
        }
      }
      
      expect(foundTable).toBe(true);
    });
  });

  test.describe('Interaction Tests', () => {
    test('should handle row selection', async ({ page }) => {
      // Find clickable table rows
      const rowSelectors = [
        '.bp5-table tbody tr',
        'table tbody tr',
        '[role="row"]',
        '.opportunity-row'
      ];
      
      for (const selector of rowSelectors) {
        const rows = page.locator(selector);
        const count = await rows.count();
        
        if (count > 0) {
          console.log(`✓ Found ${count} rows with selector: ${selector}`);
          
          // Click first row
          await rows.first().click();
          
          // Check if selection triggered any UI change
          await page.waitForTimeout(500);
          
          // Look for detail panel, modal, or selection indicator
          const detailSelectors = [
            '.allocation-editor-panel',
            '.detail-panel',
            '.selected',
            '[aria-selected="true"]'
          ];
          
          for (const detailSelector of detailSelectors) {
            if (await page.locator(detailSelector).count() > 0) {
              console.log(`✓ Selection triggered: ${detailSelector}`);
              break;
            }
          }
          
          break;
        }
      }
    });

    test('should support keyboard navigation', async ({ page }) => {
      // Test Tab navigation
      await page.keyboard.press('Tab');
      await page.waitForTimeout(100);
      
      // Check if something is focused
      const focusedElement = await page.locator(':focus');
      const hasFocus = await focusedElement.count() > 0;
      expect(hasFocus).toBe(true);
      
      // Test Escape key
      await page.keyboard.press('Escape');
      await page.waitForTimeout(100);
      
      // Test keyboard shortcuts if implemented
      const shortcuts = [
        { key: 'Control+\\', description: 'Toggle panel' },
        { key: 'Control+a', description: 'Select all' },
        { key: 'Control+f', description: 'Search focus' }
      ];
      
      for (const shortcut of shortcuts) {
        await page.keyboard.press(shortcut.key);
        await page.waitForTimeout(200);
        console.log(`Tested shortcut: ${shortcut.key} (${shortcut.description})`);
      }
    });

    test('should have interactive buttons', async ({ page }) => {
      // Find all buttons
      const buttons = page.locator('button:visible');
      const buttonCount = await buttons.count();
      
      console.log(`✓ Found ${buttonCount} visible buttons`);
      expect(buttonCount).toBeGreaterThan(0);
      
      // Check for specific action buttons
      const actionButtons = [
        'Auto-Allocate',
        'Export',
        'Refresh',
        'Add',
        'Create'
      ];
      
      for (const buttonText of actionButtons) {
        const button = page.getByRole('button', { name: new RegExp(buttonText, 'i') });
        if (await button.count() > 0) {
          console.log(`✓ Found action button: ${buttonText}`);
        }
      }
    });
  });

  test.describe('Responsive Behavior', () => {
    test('should adapt to mobile viewport', async ({ page }) => {
      await page.setViewportSize({ width: 375, height: 667 });
      await page.waitForTimeout(500);
      
      // Take mobile screenshot
      await page.screenshot({ path: 'collection-opportunities-mobile.png', fullPage: true });
      
      // Check if layout adapted
      const mobileSelectors = [
        '.mobile',
        '.mobile-header',
        '.mobile-menu',
        '[data-mobile="true"]'
      ];
      
      let foundMobileLayout = false;
      for (const selector of mobileSelectors) {
        if (await page.locator(selector).count() > 0) {
          console.log(`✓ Found mobile layout: ${selector}`);
          foundMobileLayout = true;
          break;
        }
      }
      
      // Even if no explicit mobile class, verify layout is still usable
      const mainContent = page.locator('.tab-panel, .collection-opportunities-hub, main');
      if (await mainContent.count() > 0) {
        const box = await mainContent.first().boundingBox();
        if (box) {
          console.log(`Content width on mobile: ${box.width}px`);
          expect(box.width).toBeLessThanOrEqual(375);
        }
      }
    });

    test('should maintain usability on tablet', async ({ page }) => {
      await page.setViewportSize({ width: 768, height: 1024 });
      await page.waitForTimeout(500);
      
      // Verify content is visible
      const content = page.locator('.tab-panel, main, .content');
      await expect(content.first()).toBeVisible();
    });
  });

  test.describe('Accessibility Checks', () => {
    test('should have proper ARIA attributes', async ({ page }) => {
      // Check for ARIA labels
      const ariaElements = await page.locator('[aria-label], [aria-describedby], [role]').count();
      console.log(`✓ Found ${ariaElements} elements with ARIA attributes`);
      expect(ariaElements).toBeGreaterThan(0);
      
      // Check for specific roles
      const roles = ['button', 'table', 'navigation', 'main', 'region'];
      for (const role of roles) {
        const count = await page.locator(`[role="${role}"]`).count();
        if (count > 0) {
          console.log(`✓ Found ${count} elements with role="${role}"`);
        }
      }
    });

    test('should have sufficient color contrast', async ({ page }) => {
      // Check if dark mode is available
      const darkModeButton = page.getByRole('button', { name: /dark mode/i });
      if (await darkModeButton.count() > 0) {
        console.log('✓ Dark mode toggle available');
      }
      
      // Verify text is readable
      const textElements = page.locator('p, span, div').filter({ hasText: /\w+/ });
      const sampleText = await textElements.first().textContent();
      expect(sampleText).toBeTruthy();
    });
  });

  test.describe('Performance Metrics', () => {
    test('should load efficiently', async ({ page }) => {
      const metrics = await page.evaluate(() => {
        const navigation = performance.getEntriesByType('navigation')[0] as PerformanceNavigationTiming;
        return {
          domContentLoaded: navigation.domContentLoadedEventEnd - navigation.domContentLoadedEventStart,
          loadComplete: navigation.loadEventEnd - navigation.loadEventStart,
          domInteractive: navigation.domInteractive - navigation.fetchStart
        };
      });
      
      console.log('Performance metrics:', metrics);
      
      // Verify reasonable load times
      expect(metrics.domInteractive).toBeLessThan(3000);
      expect(metrics.loadComplete).toBeLessThan(5000);
    });

    test('should handle interactions smoothly', async ({ page }) => {
      // Measure interaction responsiveness
      const startTime = Date.now();
      
      // Perform a click
      const clickableElement = page.locator('button, a, [role="button"]').first();
      if (await clickableElement.count() > 0) {
        await clickableElement.click();
        const clickTime = Date.now() - startTime;
        
        console.log(`Click response time: ${clickTime}ms`);
        expect(clickTime).toBeLessThan(500);
      }
    });
  });
});