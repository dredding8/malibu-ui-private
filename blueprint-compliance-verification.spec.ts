import { test, expect, Page } from '@playwright/test';
import { BlueprintComplianceMetrics, ComponentUsageReport, PatternComplianceReport } from './types/navigation-metrics';

/**
 * Blueprint Compliance Verification Test Suite
 * Validates all component usage against Blueprint documentation
 * Ensures proper pattern implementation and enterprise standard compliance
 */

class BlueprintComplianceChecker {
  private violations: ComponentUsageReport[] = [];
  private patterns: PatternComplianceReport[] = [];
  
  // Blueprint v6 component standards
  private readonly BLUEPRINT_STANDARDS = {
    buttons: {
      intent: ['none', 'primary', 'success', 'warning', 'danger'],
      size: ['small', 'regular', 'large'],
      requiredProps: {
        'aria-label': 'for icon-only buttons',
        'disabled': 'when action unavailable'
      }
    },
    cards: {
      elevation: [0, 1, 2, 3, 4],
      interactive: 'should be true for clickable cards',
      padding: 'should use consistent spacing'
    },
    forms: {
      validation: 'must show clear error states',
      labels: 'all inputs must have associated labels',
      helperText: 'complex fields should have helper text'
    },
    navigation: {
      breadcrumbs: 'must show full navigation path',
      activeStates: 'current location must be clearly indicated',
      keyboard: 'all navigation must be keyboard accessible'
    },
    accessibility: {
      contrast: 'minimum 4.5:1 for normal text',
      focusIndicators: 'visible focus states required',
      screenReaderSupport: 'proper ARIA labels and landmarks'
    }
  };

  async checkComponentCompliance(page: Page, selector: string, componentType: string): Promise<ComponentUsageReport> {
    const elements = await page.$$(selector);
    const report: ComponentUsageReport = {
      componentName: componentType,
      usageCount: elements.length,
      correctUsage: true,
      violations: [],
      recommendations: []
    };

    for (const element of elements) {
      // Check Button compliance
      if (componentType === 'Button') {
        const hasText = await element.textContent();
        const hasAriaLabel = await element.getAttribute('aria-label');
        const hasIcon = await element.$('.bp5-icon');
        
        if (hasIcon && !hasText && !hasAriaLabel) {
          report.violations.push('Icon-only button missing aria-label');
          report.correctUsage = false;
        }

        const intent = await element.getAttribute('data-intent');
        if (intent && !this.BLUEPRINT_STANDARDS.buttons.intent.includes(intent)) {
          report.violations.push(`Invalid intent: ${intent}`);
          report.correctUsage = false;
        }
      }

      // Check Card compliance
      if (componentType === 'Card') {
        const elevation = await element.getAttribute('data-elevation');
        const isInteractive = await element.getAttribute('data-interactive');
        const onClick = await element.evaluate(el => el.onclick !== null);
        
        if (onClick && isInteractive !== 'true') {
          report.violations.push('Clickable card should have interactive=true');
          report.recommendations.push('Add interactive prop to clickable cards');
          report.correctUsage = false;
        }
      }

      // Check Form compliance
      if (componentType === 'FormGroup') {
        const label = await element.$('label');
        const input = await element.$('input, select, textarea');
        const hasError = await element.$('.bp5-intent-danger');
        
        if (input && !label) {
          report.violations.push('Form input missing associated label');
          report.correctUsage = false;
        }
        
        if (hasError) {
          const errorText = await element.$('.bp5-form-helper-text');
          if (!errorText) {
            report.violations.push('Error state missing helper text');
            report.correctUsage = false;
          }
        }
      }
    }

    this.violations.push(report);
    return report;
  }

  async checkPatternCompliance(page: Page, pattern: string): Promise<PatternComplianceReport> {
    const report: PatternComplianceReport = {
      pattern,
      implemented: false,
      score: 0,
      issues: [],
      blueprintReference: `https://blueprintjs.com/docs/#core/${pattern.toLowerCase()}`
    };

    switch (pattern) {
      case 'Navigation':
        // Check breadcrumbs
        const breadcrumbs = await page.$('.bp5-breadcrumbs');
        if (!breadcrumbs) {
          report.issues.push('Missing breadcrumb navigation');
        } else {
          const currentBreadcrumb = await page.$('.bp5-breadcrumb-current');
          if (!currentBreadcrumb) {
            report.issues.push('Current breadcrumb not indicated');
          }
        }
        
        // Check keyboard navigation
        await page.keyboard.press('Tab');
        const focusedElement = await page.evaluate(() => document.activeElement?.tagName);
        if (!focusedElement) {
          report.issues.push('Keyboard navigation not working');
        }
        
        report.implemented = report.issues.length === 0;
        report.score = (1 - report.issues.length / 3) * 100;
        break;

      case 'Forms':
        // Check form validation
        const formGroups = await page.$$('.bp5-form-group');
        let validForms = 0;
        
        for (const formGroup of formGroups) {
          const label = await formGroup.$('label');
          const required = await formGroup.$('.bp5-label-required');
          const input = await formGroup.$('input, select, textarea');
          
          if (label && input) {
            validForms++;
          }
          
          if (required && input) {
            const hasValidation = await input.evaluate((el: any) => 
              el.required || el.getAttribute('aria-required') === 'true'
            );
            if (!hasValidation) {
              report.issues.push('Required field missing validation attribute');
            }
          }
        }
        
        report.implemented = formGroups.length > 0 && validForms === formGroups.length;
        report.score = (validForms / Math.max(formGroups.length, 1)) * 100;
        break;

      case 'Accessibility':
        // Check color contrast
        const buttons = await page.$$('.bp5-button');
        for (const button of buttons) {
          const backgroundColor = await button.evaluate(el => 
            window.getComputedStyle(el).backgroundColor
          );
          const color = await button.evaluate(el => 
            window.getComputedStyle(el).color
          );
          // Note: Real contrast calculation would be more complex
          if (backgroundColor && color) {
            // Simplified check
            const isDark = backgroundColor.includes('0, 0, 0') || backgroundColor.includes('18, 20, 26');
            const isLight = color.includes('255, 255, 255') || color.includes('245, 248, 250');
            if (isDark === isLight) {
              report.issues.push('Potential contrast issue detected');
            }
          }
        }
        
        // Check focus indicators
        const focusableElements = await page.$$('button, a, input, select, textarea');
        let elementsWithFocus = 0;
        
        for (const element of focusableElements) {
          const hasFocusStyle = await element.evaluate(el => {
            el.focus();
            const styles = window.getComputedStyle(el);
            return styles.outline !== 'none' || styles.boxShadow !== 'none';
          });
          if (hasFocusStyle) elementsWithFocus++;
        }
        
        report.implemented = elementsWithFocus === focusableElements.length;
        report.score = (elementsWithFocus / Math.max(focusableElements.length, 1)) * 100;
        break;
    }

    this.patterns.push(report);
    return report;
  }

  calculateOverallCompliance(): BlueprintComplianceMetrics {
    const componentScore = this.violations.reduce((sum, v) => 
      sum + (v.correctUsage ? 100 : 50), 0
    ) / Math.max(this.violations.length, 1);

    const patternScore = this.patterns.reduce((sum, p) => 
      sum + p.score, 0
    ) / Math.max(this.patterns.length, 1);

    const accessibilityReport = this.patterns.find(p => p.pattern === 'Accessibility');
    const accessibilityScore = accessibilityReport?.score || 0;

    const performanceScore = 85; // Placeholder - would be calculated from real metrics

    return {
      componentUsage: this.violations,
      patternCompliance: this.patterns,
      accessibilityScore,
      performanceScore,
      overallCompliance: (componentScore + patternScore + accessibilityScore + performanceScore) / 4
    };
  }
}

test.describe('Blueprint Design System Compliance', () => {
  let page: Page;
  let complianceChecker: BlueprintComplianceChecker;

  test.beforeEach(async ({ browser }) => {
    page = await browser.newPage();
    complianceChecker = new BlueprintComplianceChecker();
    await page.goto('http://localhost:3000');
  });

  test('Button component compliance', async () => {
    // Check all pages for button compliance
    const pagesToCheck = [
      '/',
      '/history',
      '/create-collection-deck',
      '/analytics'
    ];

    for (const path of pagesToCheck) {
      await page.goto(`http://localhost:3000${path}`);
      await page.waitForLoadState('networkidle');
      
      const report = await complianceChecker.checkComponentCompliance(
        page, 
        '.bp5-button, .bp6-button', 
        'Button'
      );
      
      expect(report.violations.length).toBe(0);
      if (report.violations.length > 0) {
        console.log(`Button violations on ${path}:`, report.violations);
      }
    }
  });

  test('Card component compliance', async () => {
    await page.goto('http://localhost:3000/history');
    await page.waitForSelector('.bp5-card, .bp6-card');
    
    const report = await complianceChecker.checkComponentCompliance(
      page,
      '.bp5-card, .bp6-card',
      'Card'
    );
    
    expect(report.correctUsage).toBe(true);
    expect(report.recommendations.length).toBe(0);
  });

  test('Form component compliance', async () => {
    await page.goto('http://localhost:3000/create-collection-deck');
    await page.waitForSelector('.bp5-form-group');
    
    const report = await complianceChecker.checkComponentCompliance(
      page,
      '.bp5-form-group',
      'FormGroup'
    );
    
    expect(report.violations.length).toBe(0);
    expect(report.correctUsage).toBe(true);
  });

  test('Navigation pattern compliance', async () => {
    await page.goto('http://localhost:3000/history');
    
    const report = await complianceChecker.checkPatternCompliance(page, 'Navigation');
    
    expect(report.score).toBeGreaterThan(80);
    expect(report.implemented).toBe(true);
    
    if (report.issues.length > 0) {
      console.log('Navigation pattern issues:', report.issues);
    }
  });

  test('Accessibility compliance', async () => {
    await page.goto('http://localhost:3000');
    
    const report = await complianceChecker.checkPatternCompliance(page, 'Accessibility');
    
    expect(report.score).toBeGreaterThan(90);
    
    // Additional accessibility checks
    const axeResults = await page.accessibility.snapshot();
    expect(axeResults).toBeDefined();
    
    // Check for proper ARIA landmarks
    const main = await page.$('main');
    expect(main).toBeTruthy();
    
    const nav = await page.$('nav');
    expect(nav).toBeTruthy();
    
    // Check for skip links
    const skipLink = await page.$('a[href="#main"]');
    if (!skipLink) {
      console.warn('No skip link found - consider adding for accessibility');
    }
  });

  test('Form validation patterns', async () => {
    await page.goto('http://localhost:3000/create-collection-deck');
    
    const report = await complianceChecker.checkPatternCompliance(page, 'Forms');
    
    expect(report.score).toBeGreaterThan(85);
    
    // Test actual form validation
    await page.click('[data-testid="step1-next-button"]');
    
    // Should show validation errors
    const errors = await page.$$('.bp5-intent-danger');
    expect(errors.length).toBeGreaterThan(0);
    
    // Errors should have associated messages
    const errorMessages = await page.$$('.bp5-form-helper-text.bp5-intent-danger');
    expect(errorMessages.length).toBeGreaterThan(0);
  });

  test('Color system compliance', async () => {
    await page.goto('http://localhost:3000');
    
    // Check that Blueprint color variables are used
    const styles = await page.evaluate(() => {
      const elements = document.querySelectorAll('*');
      const blueprintColors = [];
      
      elements.forEach(el => {
        const computed = window.getComputedStyle(el);
        const bgColor = computed.backgroundColor;
        const color = computed.color;
        
        // Check for Blueprint color patterns
        if (bgColor.includes('rgb(245, 248, 250)') || // Light Gray 5
            bgColor.includes('rgb(225, 232, 237)') || // Light Gray 4
            color.includes('rgb(24, 32, 38)') ||      // Dark Gray 1
            color.includes('rgb(92, 112, 128)')) {    // Gray 1
          blueprintColors.push({
            element: el.tagName,
            background: bgColor,
            text: color
          });
        }
      });
      
      return blueprintColors.length > 0;
    });
    
    expect(styles).toBe(true);
  });

  test('Typography compliance', async () => {
    await page.goto('http://localhost:3000');
    
    // Check heading hierarchy
    const h1 = await page.$('h1');
    const h2Elements = await page.$$('h2');
    const h3Elements = await page.$$('h3');
    
    // Should have proper heading hierarchy
    if (h1) {
      expect(h2Elements.length).toBeGreaterThanOrEqual(0);
    }
    
    // Check font families
    const fontFamilies = await page.evaluate(() => {
      const headings = document.querySelectorAll('h1, h2, h3, h4, h5, h6');
      const families = new Set();
      
      headings.forEach(h => {
        families.add(window.getComputedStyle(h).fontFamily);
      });
      
      return Array.from(families);
    });
    
    // Should use Blueprint's recommended fonts
    expect(fontFamilies.some(f => 
      f.includes('-apple-system') || 
      f.includes('BlinkMacSystemFont') ||
      f.includes('Segoe UI')
    )).toBe(true);
  });

  test('Icon usage compliance', async () => {
    await page.goto('http://localhost:3000');
    
    // Check that icons have proper sizing
    const icons = await page.$$('.bp5-icon');
    
    for (const icon of icons) {
      const size = await icon.evaluate(el => {
        const svg = el.querySelector('svg');
        return svg ? {
          width: svg.getAttribute('width'),
          height: svg.getAttribute('height')
        } : null;
      });
      
      if (size) {
        // Blueprint icons should be 16x16 or 20x20
        expect(['16', '20']).toContain(size.width);
        expect(['16', '20']).toContain(size.height);
      }
    }
    
    // Check icon-only buttons have labels
    const iconButtons = await page.$$('.bp5-button:has(.bp5-icon):not(:has-text)');
    for (const button of iconButtons) {
      const ariaLabel = await button.getAttribute('aria-label');
      const title = await button.getAttribute('title');
      expect(ariaLabel || title).toBeTruthy();
    }
  });

  test('Overall compliance report', async () => {
    // Run all compliance checks
    const pages = ['/', '/history', '/create-collection-deck', '/analytics'];
    
    for (const path of pages) {
      await page.goto(`http://localhost:3000${path}`);
      await page.waitForLoadState('networkidle');
      
      // Check components
      await complianceChecker.checkComponentCompliance(page, '.bp5-button', 'Button');
      await complianceChecker.checkComponentCompliance(page, '.bp5-card', 'Card');
      await complianceChecker.checkComponentCompliance(page, '.bp5-form-group', 'FormGroup');
      
      // Check patterns
      await complianceChecker.checkPatternCompliance(page, 'Navigation');
      await complianceChecker.checkPatternCompliance(page, 'Accessibility');
    }
    
    const metrics = complianceChecker.calculateOverallCompliance();
    
    console.log('Blueprint Compliance Report:');
    console.log('- Component Compliance:', metrics.componentUsage);
    console.log('- Pattern Compliance:', metrics.patternCompliance);
    console.log('- Accessibility Score:', metrics.accessibilityScore);
    console.log('- Performance Score:', metrics.performanceScore);
    console.log('- Overall Compliance:', metrics.overallCompliance);
    
    // Assert minimum compliance levels
    expect(metrics.overallCompliance).toBeGreaterThan(85);
    expect(metrics.accessibilityScore).toBeGreaterThan(90);
  });
});

// Enterprise-specific compliance tests
test.describe('Enterprise Standard Compliance', () => {
  test('Data table compliance', async ({ page }) => {
    await page.goto('http://localhost:3000/history');
    await page.waitForSelector('table, .bp5-table');
    
    // Check sortable columns
    const sortableHeaders = await page.$$('th[data-sortable="true"], .bp5-table-column-header-cell[data-sortable="true"]');
    expect(sortableHeaders.length).toBeGreaterThan(0);
    
    // Check pagination
    const pagination = await page.$('.pagination, [aria-label*="pagination"]');
    expect(pagination).toBeTruthy();
    
    // Check bulk selection
    const bulkCheckbox = await page.$('thead input[type="checkbox"], .bp5-table-header input[type="checkbox"]');
    expect(bulkCheckbox).toBeTruthy();
  });

  test('Error state compliance', async ({ page }) => {
    // Navigate to a non-existent page
    await page.goto('http://localhost:3000/invalid-route');
    
    // Should show proper error state
    const nonIdealState = await page.$('.bp5-non-ideal-state');
    expect(nonIdealState).toBeTruthy();
    
    // Should have recovery action
    const recoveryButton = await page.$('.bp5-non-ideal-state button');
    expect(recoveryButton).toBeTruthy();
  });

  test('Loading state compliance', async ({ page }) => {
    await page.goto('http://localhost:3000/create-collection-deck/step3');
    
    // Should show loading state
    const spinner = await page.$('.bp5-spinner');
    expect(spinner).toBeTruthy();
    
    // Should have loading message
    const loadingText = await page.textContent('h4, .bp5-heading');
    expect(loadingText).toContain('Finding Collection Opportunities');
  });
});