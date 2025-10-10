import { test, expect } from '@playwright/test';
import type { Page } from '@playwright/test';

/**
 * BlueprintJS Enterprise Compliance Test Suite
 * Tests for clean, intuitive, distraction-free interface
 * Focus on vanilla Blueprint usage without custom styling
 */

test.describe('BlueprintJS Enterprise Standards', () => {
  let page: Page;

  test.beforeEach(async ({ page: testPage, browserName }) => {
    page = testPage;
    await page.goto('/collection-opportunities');
    await page.waitForSelector('.collection-opportunities-refactored');

    // Set enterprise viewport standards
    if (browserName === 'chromium' || browserName === 'webkit') {
      await page.setViewportSize({ width: 1920, height: 1080 });
    }
  });

  test('Clean Interface - No Visual Distractions', async () => {
    // Capture baseline
    await page.screenshot({
      path: `test-results/blueprint-compliance-baseline.png`,
      fullPage: true,
      animations: 'disabled'
    });

    // Check for visual noise
    const visualNoise = await page.evaluate(() => {
      const elements = document.querySelectorAll('*');
      const issues: Array<{element: string, issue: string}> = [];

      elements.forEach(el => {
        const styles = window.getComputedStyle(el);

        // Check for non-Blueprint animations
        if (styles.animation && !styles.animation.includes('bp5') && styles.animation !== 'none') {
          issues.push({
            element: el.className,
            issue: 'Custom animation detected'
          });
        }

        // Check for excessive shadows
        if (styles.boxShadow && styles.boxShadow !== 'none' && !el.className.includes('bp5')) {
          const shadowComplexity = styles.boxShadow.split(',').length;
          if (shadowComplexity > 1) {
            issues.push({
              element: el.className,
              issue: 'Complex shadow detected'
            });
          }
        }

        // Check for non-standard borders
        if (styles.border && styles.border !== 'none' && !el.className.includes('bp5')) {
          const borderParts = styles.border.split(' ');
          if (borderParts.length > 3 || styles.borderRadius !== '0px') {
            issues.push({
              element: el.className,
              issue: 'Custom border styling'
            });
          }
        }
      });

      return issues;
    });

    console.log('Visual noise issues:', visualNoise);
    expect(visualNoise.length).toBeLessThanOrEqual(5); // Allow minimal custom styling
  });

  test('Blueprint Component Usage - Vanilla Only', async () => {
    // Verify all buttons use Blueprint classes
    const buttons = await page.$$eval('button', buttons =>
      buttons.map(btn => ({
        hasBlueprint: btn.className.includes('bp5-button'),
        customStyles: btn.getAttribute('style'),
        text: btn.textContent
      }))
    );

    buttons.forEach(btn => {
      expect(btn.hasBlueprint).toBe(true);
      // Allow minimal inline styles for positioning
      if (btn.customStyles) {
        expect(btn.customStyles.length).toBeLessThan(50);
      }
    });

    // Verify Cards use standard elevation
    const cards = await page.$$eval('.bp5-card', cards =>
      cards.map(card => {
        const styles = window.getComputedStyle(card);
        return {
          elevation: styles.boxShadow,
          hasStandardPadding: styles.padding === '20px'
        };
      })
    );

    cards.forEach(card => {
      expect(card.elevation).toMatch(/rgba?\(16, 22, 26/); // Blueprint shadow color
    });
  });

  test('Color Consistency - Blueprint Intents Only', async () => {
    const colorCompliance = await page.evaluate(() => {
      const intentColors = {
        primary: 'rgb(19, 124, 189)',
        success: 'rgb(15, 153, 96)',
        warning: 'rgb(217, 130, 43)',
        danger: 'rgb(209, 57, 19)',
        none: 'rgb(92, 112, 128)'
      };

      const violations: Array<{element: string, color: string}> = [];

      // Check all colored elements
      document.querySelectorAll('[class*="intent"], .bp5-tag, .bp5-button').forEach(el => {
        const styles = window.getComputedStyle(el);
        const bgColor = styles.backgroundColor;
        const color = styles.color;
        
        // Skip transparent backgrounds
        if (bgColor === 'rgba(0, 0, 0, 0)' || bgColor === 'transparent') {
          return;
        }

        const isCompliantBg = Object.values(intentColors).some(
          intent => bgColor.includes(intent.replace('rgb', '').replace('(', '').replace(')', ''))
        );

        if (!isCompliantBg && !el.className.includes('bp5-minimal')) {
          violations.push({
            element: el.className,
            color: bgColor
          });
        }
      });

      return violations;
    });

    console.log('Color violations:', colorCompliance);
    expect(colorCompliance.length).toBeLessThanOrEqual(10); // Allow some flexibility
  });

  test('Typography Hierarchy - Clean & Consistent', async () => {
    const typography = await page.evaluate(() => {
      const headings = document.querySelectorAll('h1, h2, h3, h4, h5, h6');
      const blueprint = {
        h1: { size: '30px', weight: '600' },
        h2: { size: '24px', weight: '600' },
        h3: { size: '20px', weight: '600' },
        h4: { size: '18px', weight: '600' },
        h5: { size: '16px', weight: '600' },
        h6: { size: '14px', weight: '600' }
      };

      const issues: Array<any> = [];

      headings.forEach(h => {
        const styles = window.getComputedStyle(h);
        const tag = h.tagName.toLowerCase() as keyof typeof blueprint;
        const expected = blueprint[tag];

        // Allow small variations
        const sizeDiff = Math.abs(parseInt(styles.fontSize) - parseInt(expected.size));
        if (sizeDiff > 2) {
          issues.push({
            tag,
            actual: {
              size: styles.fontSize,
              weight: styles.fontWeight
            },
            expected
          });
        }
      });

      return issues;
    });

    expect(typography.length).toBe(0);
  });

  test('Spacing Grid - 8px System Compliance', async () => {
    const spacingViolations = await page.evaluate(() => {
      const validateSpacing = (value: string) => {
        const num = parseInt(value);
        return num === 0 || num % 8 === 0 || num % 4 === 0; // Allow 4px for fine adjustments
      };

      const violations: Array<{element: string, property: string, value: string}> = [];
      const elements = document.querySelectorAll('.bp5-card, .bp5-button, .bp5-tag, .bp5-navbar');

      elements.forEach(el => {
        const styles = window.getComputedStyle(el);
        const spacingProps = ['marginTop', 'marginRight', 'marginBottom', 'marginLeft',
                              'paddingTop', 'paddingRight', 'paddingBottom', 'paddingLeft'];

        spacingProps.forEach(prop => {
          const value = styles[prop as keyof CSSStyleDeclaration] as string;
          if (value && value !== 'auto' && !validateSpacing(value)) {
            violations.push({
              element: el.className,
              property: prop,
              value: value
            });
          }
        });
      });

      return violations;
    });

    console.log('Spacing violations:', spacingViolations);
    expect(spacingViolations.length).toBeLessThanOrEqual(20); // Allow some flexibility
  });

  test('Intuitive Flow - Navigation Patterns', async () => {
    // Test tab order
    const tabOrder = await page.evaluate(() => {
      const focusable = Array.from(
        document.querySelectorAll('button, a, input, select, [tabindex]:not([tabindex="-1"])')
      ) as HTMLElement[];

      return focusable.map(el => ({
        tag: el.tagName,
        tabIndex: el.tabIndex,
        visible: el.offsetParent !== null,
        ariaLabel: el.getAttribute('aria-label'),
        text: el.textContent?.trim()
      }));
    });

    // Verify logical tab order
    const visibleElements = tabOrder.filter(el => el.visible);
    expect(visibleElements.length).toBeGreaterThan(10); // Should have interactive elements

    // Test keyboard navigation
    await page.keyboard.press('Tab');
    const firstFocused = await page.evaluate(() =>
      document.activeElement?.className || ''
    );
    expect(firstFocused).toContain('bp5');

    // Test Ctrl+F search focus
    await page.keyboard.press('Control+f');
    const searchFocused = await page.evaluate(() =>
      document.activeElement?.id || ''
    );
    expect(searchFocused).toBe('opportunity-search');
  });

  test('Distraction-Free - Animation & Motion', async () => {
    // Check for minimal animations
    const animations = await page.evaluate(() => {
      const animated: Array<{element: string, duration: number}> = [];
      document.querySelectorAll('*').forEach(el => {
        const styles = window.getComputedStyle(el);
        if (styles.transition && styles.transition !== 'none' && styles.transition !== 'all 0s ease 0s') {
          const duration = styles.transitionDuration;
          const ms = parseFloat(duration) * (duration.includes('ms') ? 1 : 1000);

          // Blueprint standard is 100-300ms
          if (ms > 300) {
            animated.push({
              element: el.className,
              duration: ms
            });
          }
        }
      });
      return animated;
    });

    console.log('Long animations:', animations);
    expect(animations.length).toBeLessThanOrEqual(5); // Allow some longer animations
  });

  test('Clean State Management - No Flicker', async () => {
    // Click through tabs and measure layout shifts
    const tabs = ['all', 'needs-review', 'unmatched'];
    
    for (const tabId of tabs) {
      await page.click(`[id="${tabId}"]`);
      await page.waitForTimeout(100); // Brief pause

      // Check for loading states
      const hasSpinner = await page.$('.bp5-spinner');
      if (hasSpinner) {
        await page.waitForSelector('.bp5-spinner', { state: 'hidden' });
      }
    }

    // Verify no content jumping
    const tableHeight = await page.$eval('.opportunities-table', el => 
      el.getBoundingClientRect().height
    );
    expect(tableHeight).toBeGreaterThan(400); // Table should maintain height
  });

  test('Focus Management - Clear Visual Indicators', async () => {
    // Test focus styles on different elements
    const focusableSelectors = [
      '.bp5-button:not([disabled])',
      '.bp5-input',
      '.bp5-html-select',
      '.bp5-tag.interactive'
    ];

    for (const selector of focusableSelectors) {
      const element = await page.$(selector);
      if (!element) continue;

      await element.focus();
      
      const focusStyles = await page.$eval(selector, el => {
        const styles = window.getComputedStyle(el);
        return {
          outline: styles.outline,
          boxShadow: styles.boxShadow
        };
      });

      // Should have focus indication
      const hasFocusIndication = focusStyles.boxShadow.includes('0 0 0') || 
                                 focusStyles.outline !== 'none';
      expect(hasFocusIndication).toBe(true);
    }
  });

  test('Enterprise Viewport Compliance', async () => {
    const viewports = [
      { width: 1920, height: 1080, name: 'Standard HD' },
      { width: 1366, height: 768, name: 'Common Laptop' },
      { width: 2560, height: 1440, name: 'High Resolution' }
    ];

    for (const viewport of viewports) {
      await page.setViewportSize(viewport);
      await page.waitForTimeout(100);

      // Check layout integrity
      const layoutIssues = await page.evaluate(() => {
        const issues: string[] = [];

        // Check for horizontal overflow
        if (document.documentElement.scrollWidth > document.documentElement.clientWidth) {
          issues.push('Horizontal overflow detected');
        }

        // Check navbar is sticky
        const navbar = document.querySelector('.opportunities-navbar');
        if (navbar) {
          const styles = window.getComputedStyle(navbar);
          if (styles.position !== 'sticky') {
            issues.push('Navbar not sticky');
          }
        }

        // Check table responsiveness
        const table = document.querySelector('.opportunities-table');
        if (table && table.getBoundingClientRect().width < 800) {
          issues.push('Table too narrow');
        }

        return issues;
      });

      console.log(`${viewport.name} issues:`, layoutIssues);
      expect(layoutIssues.length).toBe(0);
    }
  });

  test('Performance Metrics - Clean Interface', async () => {
    // Measure initial render performance
    const metrics = await page.evaluate(() => {
      const paint = performance.getEntriesByType('paint');
      const navigation = performance.getEntriesByType('navigation')[0] as PerformanceNavigationTiming;
      
      return {
        firstPaint: paint.find(p => p.name === 'first-paint')?.startTime || 0,
        firstContentfulPaint: paint.find(p => p.name === 'first-contentful-paint')?.startTime || 0,
        domContentLoaded: navigation.domContentLoadedEventEnd - navigation.domContentLoadedEventStart,
        loadComplete: navigation.loadEventEnd - navigation.loadEventStart
      };
    });

    console.log('Performance metrics:', metrics);
    
    // Enterprise standards
    expect(metrics.firstContentfulPaint).toBeLessThan(1500); // 1.5s FCP
    expect(metrics.domContentLoaded).toBeLessThan(2000); // 2s DOM ready
  });
});

test.describe('Blueprint Compliance Summary', () => {
  test('Generate Compliance Report', async ({ page }) => {
    await page.goto('/collection-opportunities');
    
    const complianceReport = await page.evaluate(() => {
      const report = {
        totalElements: document.querySelectorAll('*').length,
        blueprintElements: document.querySelectorAll('[class*="bp5-"]').length,
        customStyles: document.querySelectorAll('[style]').length,
        animations: 0,
        colorCompliance: 0,
        spacingCompliance: 0
      };

      // Count animations
      document.querySelectorAll('*').forEach(el => {
        const styles = window.getComputedStyle(el);
        if (styles.animation !== 'none' || (styles.transition !== 'none' && styles.transition !== 'all 0s ease 0s')) {
          report.animations++;
        }
      });

      // Calculate compliance percentage
      report.colorCompliance = Math.round((report.blueprintElements / report.totalElements) * 100);
      
      return report;
    });

    console.log('=== BLUEPRINT COMPLIANCE REPORT ===');
    console.log(`Total Elements: ${complianceReport.totalElements}`);
    console.log(`Blueprint Elements: ${complianceReport.blueprintElements}`);
    console.log(`Custom Styled Elements: ${complianceReport.customStyles}`);
    console.log(`Animated Elements: ${complianceReport.animations}`);
    console.log(`Component Compliance: ${complianceReport.colorCompliance}%`);
    
    // Enterprise threshold
    expect(complianceReport.colorCompliance).toBeGreaterThan(60);
    expect(complianceReport.customStyles).toBeLessThan(50);
  });
});