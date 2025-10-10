import { test, expect, Page } from '@playwright/test';

// Helper to capture UX metrics
interface UXMetrics {
  timeToInteractive: number;
  firstMeaningfulPaint: number;
  clickTargetSizes: { selector: string; size: { width: number; height: number } }[];
  colorContrast: { selector: string; ratio: number }[];
  loadingStates: string[];
  errorStates: string[];
  userFlowCompletionTime: { [flow: string]: number };
}

test.describe('Collection Management UX/UI Validation', () => {
  const COLLECTION_URL = 'http://localhost:3000/collection/DECK-1757517559289/manage';
  let metrics: UXMetrics;

  test.beforeEach(async ({ page }) => {
    metrics = {
      timeToInteractive: 0,
      firstMeaningfulPaint: 0,
      clickTargetSizes: [],
      colorContrast: [],
      loadingStates: [],
      errorStates: [],
      userFlowCompletionTime: {}
    };

    // Listen for console messages
    page.on('console', msg => {
      if (msg.type() === 'error') {
        metrics.errorStates.push(msg.text());
      }
    });
  });

  test('Wave 1: User Journey - Critical Flows', async ({ page }) => {
    const startTime = Date.now();
    
    // Navigate and measure initial load
    await page.goto(COLLECTION_URL);
    await page.waitForLoadState('networkidle');
    
    metrics.timeToInteractive = Date.now() - startTime;

    // Flow 1: View Collection Overview
    const flowStart = Date.now();
    
    // Check if summary stats are visible
    const statsVisible = await page.locator('text=/\\d+ Allocated/').isVisible();
    expect(statsVisible).toBeTruthy();
    
    // Verify key information hierarchy
    const headings = await page.locator('h1, h2, h3').allTextContents();
    console.log('Information Hierarchy:', headings);
    
    metrics.userFlowCompletionTime['viewOverview'] = Date.now() - flowStart;

    // Flow 2: Filter and Search Opportunities
    const searchStart = Date.now();
    
    // Look for search input
    const searchInput = page.locator('input[type="search"], input[placeholder*="Search"], input[placeholder*="search"]');
    const hasSearch = await searchInput.count() > 0;
    
    if (hasSearch) {
      await searchInput.first().fill('Opportunity');
      await page.waitForTimeout(500); // Debounce delay
      
      // Check if results update
      const resultsChanged = await page.waitForFunction(() => {
        const rows = document.querySelectorAll('tr, [role="row"]');
        return rows.length > 0;
      }, { timeout: 3000 }).catch(() => false);
      
      expect(resultsChanged).toBeTruthy();
    }
    
    metrics.userFlowCompletionTime['searchFilter'] = Date.now() - searchStart;

    // Flow 3: Interact with Opportunity
    const interactionStart = Date.now();
    
    // Find actionable elements
    const actionButtons = page.locator('button:has-text("Edit"), button[aria-label*="edit"], button[title*="edit"]');
    const buttonCount = await actionButtons.count();
    
    if (buttonCount > 0) {
      // Test hover state
      await actionButtons.first().hover();
      await page.waitForTimeout(100);
      
      // Check for tooltip or hover feedback
      const hasTooltip = await page.locator('.bp5-tooltip, [role="tooltip"]').count() > 0;
      console.log('Has hover feedback:', hasTooltip);
      
      // Click action (but cancel if modal appears)
      await actionButtons.first().click();
      await page.waitForTimeout(500);
      
      // Check for modal or state change
      const modalAppeared = await page.locator('.bp5-dialog, [role="dialog"]').count() > 0;
      if (modalAppeared) {
        // Close modal
        const closeButton = page.locator('.bp5-dialog-close-button, button[aria-label="Close"]');
        if (await closeButton.count() > 0) {
          await closeButton.click();
        } else {
          await page.keyboard.press('Escape');
        }
      }
    }
    
    metrics.userFlowCompletionTime['interactWithItem'] = Date.now() - interactionStart;

    // Take screenshot for visual analysis
    await page.screenshot({ path: 'ux-user-journey.png', fullPage: true });
    
    console.log('User Flow Metrics:', metrics.userFlowCompletionTime);
  });

  test('Wave 2: Visual Design Consistency', async ({ page }) => {
    await page.goto(COLLECTION_URL);
    await page.waitForLoadState('networkidle');

    // Analyze color palette consistency
    const colors = await page.evaluate(() => {
      const elements = document.querySelectorAll('*');
      const colorMap = new Map<string, number>();
      
      elements.forEach(el => {
        const styles = window.getComputedStyle(el);
        const bgColor = styles.backgroundColor;
        const textColor = styles.color;
        
        if (bgColor && bgColor !== 'rgba(0, 0, 0, 0)') {
          colorMap.set(bgColor, (colorMap.get(bgColor) || 0) + 1);
        }
        if (textColor) {
          colorMap.set(textColor, (colorMap.get(textColor) || 0) + 1);
        }
      });
      
      return Array.from(colorMap.entries())
        .sort((a, b) => b[1] - a[1])
        .slice(0, 10);
    });
    
    console.log('Top 10 Colors Used:', colors);

    // Check spacing consistency
    const spacing = await page.evaluate(() => {
      const elements = document.querySelectorAll('.bp5-card, .card, [class*="container"]');
      const spacings = new Set<string>();
      
      elements.forEach(el => {
        const styles = window.getComputedStyle(el);
        spacings.add(styles.padding);
        spacings.add(styles.margin);
      });
      
      return Array.from(spacings);
    });
    
    console.log('Spacing Values:', spacing);

    // Check typography consistency
    const typography = await page.evaluate(() => {
      const elements = document.querySelectorAll('h1, h2, h3, p, span, div');
      const fonts = new Map<string, number>();
      const sizes = new Map<string, number>();
      
      elements.forEach(el => {
        const styles = window.getComputedStyle(el);
        fonts.set(styles.fontFamily, (fonts.get(styles.fontFamily) || 0) + 1);
        sizes.set(styles.fontSize, (sizes.get(styles.fontSize) || 0) + 1);
      });
      
      return {
        fonts: Array.from(fonts.entries()).sort((a, b) => b[1] - a[1]).slice(0, 5),
        sizes: Array.from(sizes.entries()).sort((a, b) => b[1] - a[1]).slice(0, 10)
      };
    });
    
    console.log('Typography Analysis:', typography);

    // Blueprint.js compliance check
    const blueprintCompliance = await page.evaluate(() => {
      const bpClasses = Array.from(document.querySelectorAll('[class*="bp5-"], [class*="bp6-"]'));
      const customClasses = Array.from(document.querySelectorAll('[class]:not([class*="bp"])'));
      
      return {
        blueprintElements: bpClasses.length,
        customElements: customClasses.length,
        ratio: bpClasses.length / (bpClasses.length + customClasses.length)
      };
    });
    
    console.log('Blueprint.js Compliance:', blueprintCompliance);

    await page.screenshot({ path: 'ux-visual-design.png', fullPage: true });
  });

  test('Wave 3: Interaction Patterns', async ({ page }) => {
    await page.goto(COLLECTION_URL);
    await page.waitForLoadState('networkidle');

    // Test click target sizes (WCAG recommends minimum 44x44px)
    const clickTargets = await page.evaluate(() => {
      const targets = document.querySelectorAll('button, a, input, select, [role="button"]');
      const sizes: { selector: string; size: { width: number; height: number }; adequate: boolean }[] = [];
      
      targets.forEach(target => {
        const rect = target.getBoundingClientRect();
        sizes.push({
          selector: target.tagName + (target.className ? '.' + target.className.split(' ')[0] : ''),
          size: { width: rect.width, height: rect.height },
          adequate: rect.width >= 44 && rect.height >= 44
        });
      });
      
      return sizes;
    });
    
    const inadequateTargets = clickTargets.filter(t => !t.adequate);
    console.log('Inadequate Click Targets:', inadequateTargets);

    // Test keyboard navigation
    await page.keyboard.press('Tab');
    await page.waitForTimeout(100);
    
    const focusedElement = await page.evaluate(() => {
      const el = document.activeElement;
      return {
        tag: el?.tagName,
        class: el?.className,
        visible: el ? window.getComputedStyle(el).outline !== 'none' : false
      };
    });
    
    console.log('First Focused Element:', focusedElement);

    // Test loading states
    const loadingIndicators = await page.locator('.bp5-spinner, [class*="loading"], [class*="spinner"]').count();
    console.log('Loading Indicators Found:', loadingIndicators);

    // Test error states
    const errorStates = await page.locator('.bp5-intent-danger, [class*="error"], [class*="Error"]').count();
    console.log('Error States Found:', errorStates);

    // Test feedback mechanisms
    const buttons = page.locator('button:visible');
    const buttonCount = await buttons.count();
    
    if (buttonCount > 0) {
      // Test button feedback
      const button = buttons.first();
      const beforeClick = await button.screenshot();
      
      await button.hover();
      await page.waitForTimeout(100);
      const onHover = await button.screenshot();
      
      // Compare screenshots to detect visual feedback
      const hasHoverFeedback = beforeClick.compare(onHover) !== 0;
      console.log('Has Hover Feedback:', hasHoverFeedback);
    }

    await page.screenshot({ path: 'ux-interactions.png', fullPage: true });
  });

  test('Wave 4: Functional Completeness', async ({ page }) => {
    await page.goto(COLLECTION_URL);
    await page.waitForLoadState('networkidle');

    // Test data display
    const dataRows = await page.locator('tr[class*="row"], [role="row"]').count();
    console.log('Data Rows Displayed:', dataRows);
    expect(dataRows).toBeGreaterThan(0);

    // Test sorting (if available)
    const sortableHeaders = await page.locator('th[class*="sort"], [role="columnheader"][aria-sort]').count();
    console.log('Sortable Columns:', sortableHeaders);

    // Test filtering
    const filters = await page.locator('[class*="filter"], select, input[type="checkbox"]').count();
    console.log('Filter Controls:', filters);

    // Test pagination (if available)
    const paginationControls = await page.locator('[class*="pagination"], [aria-label*="page"]').count();
    console.log('Pagination Controls:', paginationControls);

    // Test bulk actions
    const checkboxes = await page.locator('input[type="checkbox"]').count();
    const hasBulkActions = checkboxes > 1; // More than just a header checkbox
    console.log('Has Bulk Actions:', hasBulkActions);

    // Test data refresh
    const refreshButton = page.locator('button:has-text("Refresh"), button[aria-label*="refresh"]');
    const hasRefresh = await refreshButton.count() > 0;
    console.log('Has Refresh Capability:', hasRefresh);

    await page.screenshot({ path: 'ux-functional.png', fullPage: true });
  });

  test('Wave 5: Accessibility Audit', async ({ page }) => {
    await page.goto(COLLECTION_URL);
    await page.waitForLoadState('networkidle');

    // Check ARIA landmarks
    const landmarks = await page.evaluate(() => {
      const roles = ['main', 'navigation', 'banner', 'contentinfo', 'search'];
      const found: string[] = [];
      
      roles.forEach(role => {
        if (document.querySelector(`[role="${role}"]`)) {
          found.push(role);
        }
      });
      
      return found;
    });
    
    console.log('ARIA Landmarks:', landmarks);

    // Check heading structure
    const headingStructure = await page.evaluate(() => {
      const headings = Array.from(document.querySelectorAll('h1, h2, h3, h4, h5, h6'));
      return headings.map(h => ({
        level: h.tagName,
        text: h.textContent?.trim().substring(0, 50)
      }));
    });
    
    console.log('Heading Structure:', headingStructure);

    // Check alt text for images
    const images = await page.evaluate(() => {
      const imgs = Array.from(document.querySelectorAll('img'));
      return imgs.map(img => ({
        src: img.src.substring(img.src.lastIndexOf('/') + 1),
        hasAlt: img.hasAttribute('alt'),
        altText: img.alt
      }));
    });
    
    console.log('Image Accessibility:', images);

    // Check form labels
    const formAccessibility = await page.evaluate(() => {
      const inputs = Array.from(document.querySelectorAll('input, select, textarea'));
      return inputs.map(input => ({
        type: input.getAttribute('type') || input.tagName.toLowerCase(),
        hasLabel: !!input.labels?.length || input.hasAttribute('aria-label') || input.hasAttribute('aria-labelledby'),
        hasDescription: input.hasAttribute('aria-describedby')
      }));
    });
    
    console.log('Form Accessibility:', formAccessibility);

    // Check color contrast (simplified)
    const contrastIssues = await page.evaluate(() => {
      const elements = document.querySelectorAll('*');
      const issues: any[] = [];
      
      elements.forEach(el => {
        const styles = window.getComputedStyle(el);
        const bgColor = styles.backgroundColor;
        const textColor = styles.color;
        
        // Simple check for very low contrast
        if (bgColor === textColor && bgColor !== 'rgba(0, 0, 0, 0)') {
          issues.push({
            element: el.tagName + (el.className ? '.' + el.className.split(' ')[0] : ''),
            issue: 'Same background and text color'
          });
        }
      });
      
      return issues.slice(0, 5); // Limit to first 5 issues
    });
    
    console.log('Contrast Issues:', contrastIssues);

    await page.screenshot({ path: 'ux-accessibility.png', fullPage: true });
  });

  test('Wave 6: Performance Metrics', async ({ page }) => {
    // Clear cache for clean performance test
    await page.context().clearCookies();
    
    const performanceMetrics: any = {
      pageLoad: {},
      interactions: {},
      memory: {}
    };

    // Measure page load performance
    const loadStart = Date.now();
    await page.goto(COLLECTION_URL);
    
    // Wait for meaningful content
    await page.waitForSelector('table, [role="table"], .bp5-table');
    performanceMetrics.pageLoad.timeToContent = Date.now() - loadStart;
    
    await page.waitForLoadState('networkidle');
    performanceMetrics.pageLoad.timeToIdle = Date.now() - loadStart;

    // Get Core Web Vitals
    const webVitals = await page.evaluate(() => {
      return new Promise((resolve) => {
        const metrics: any = {};
        
        // First Contentful Paint
        const paintEntries = performance.getEntriesByType('paint');
        const fcp = paintEntries.find(entry => entry.name === 'first-contentful-paint');
        metrics.fcp = fcp ? fcp.startTime : 0;
        
        // Largest Contentful Paint (simplified)
        const lcpEntries = performance.getEntriesByType('largest-contentful-paint');
        metrics.lcp = lcpEntries.length > 0 ? lcpEntries[lcpEntries.length - 1].startTime : 0;
        
        // First Input Delay (we'll simulate with a click)
        metrics.fid = 0; // Will be measured below
        
        resolve(metrics);
      });
    });
    
    performanceMetrics.webVitals = webVitals;

    // Measure interaction responsiveness
    const button = page.locator('button:visible').first();
    if (await button.count() > 0) {
      const interactionStart = Date.now();
      await button.click();
      await page.waitForTimeout(50); // Small delay to capture response
      performanceMetrics.interactions.firstClickDelay = Date.now() - interactionStart;
    }

    // Measure search performance
    const searchInput = page.locator('input[type="search"], input[placeholder*="Search"]').first();
    if (await searchInput.count() > 0) {
      const searchStart = Date.now();
      await searchInput.fill('test');
      await page.waitForTimeout(300); // Account for debounce
      performanceMetrics.interactions.searchResponseTime = Date.now() - searchStart;
    }

    // Memory usage (if available)
    const memoryUsage = await page.evaluate(() => {
      if ('memory' in performance) {
        return {
          usedJSHeapSize: (performance as any).memory.usedJSHeapSize / 1048576, // Convert to MB
          totalJSHeapSize: (performance as any).memory.totalJSHeapSize / 1048576
        };
      }
      return null;
    });
    
    if (memoryUsage) {
      performanceMetrics.memory = memoryUsage;
    }

    console.log('Performance Metrics:', performanceMetrics);
    
    // Performance assertions
    expect(performanceMetrics.pageLoad.timeToContent).toBeLessThan(3000); // 3s
    expect(performanceMetrics.webVitals.fcp).toBeLessThan(2500); // 2.5s
    if (performanceMetrics.interactions.firstClickDelay) {
      expect(performanceMetrics.interactions.firstClickDelay).toBeLessThan(100); // 100ms
    }

    await page.screenshot({ path: 'ux-performance.png', fullPage: true });
  });

  test('Wave 7: Comprehensive UX Report', async ({ page }) => {
    await page.goto(COLLECTION_URL);
    await page.waitForLoadState('networkidle');

    // Compile comprehensive UX analysis
    const uxAnalysis = await page.evaluate(() => {
      const analysis: any = {
        layout: {},
        navigation: {},
        content: {},
        feedback: {},
        responsive: {}
      };

      // Layout analysis
      const mainContent = document.querySelector('main, [role="main"], .main-content');
      analysis.layout = {
        hasMainContent: !!mainContent,
        contentWidth: mainContent?.getBoundingClientRect().width,
        isResponsive: window.matchMedia('(max-width: 768px)').matches ? 'mobile' : 'desktop'
      };

      // Navigation analysis
      const navElements = document.querySelectorAll('nav, [role="navigation"], .navigation, .nav');
      analysis.navigation = {
        hasNavigation: navElements.length > 0,
        navigationItems: Array.from(navElements).flatMap(nav => 
          Array.from(nav.querySelectorAll('a, button')).map(item => item.textContent?.trim())
        ).filter(Boolean)
      };

      // Content analysis
      const tables = document.querySelectorAll('table, [role="table"]');
      const forms = document.querySelectorAll('form');
      analysis.content = {
        hasTables: tables.length > 0,
        hasForms: forms.length > 0,
        dataRows: tables[0] ? tables[0].querySelectorAll('tbody tr').length : 0
      };

      // Feedback mechanisms
      analysis.feedback = {
        hasLoadingStates: document.querySelectorAll('.loading, .spinner, [class*="loading"]').length > 0,
        hasErrorStates: document.querySelectorAll('.error, [class*="error"]').length > 0,
        hasSuccessStates: document.querySelectorAll('.success, [class*="success"]').length > 0,
        hasTooltips: document.querySelectorAll('[title], [aria-label], .tooltip').length > 0
      };

      // Responsive design
      analysis.responsive = {
        viewport: {
          width: window.innerWidth,
          height: window.innerHeight
        },
        hasMediaQueries: Array.from(document.styleSheets).some(sheet => {
          try {
            return Array.from(sheet.cssRules || []).some(rule => 
              rule instanceof CSSMediaRule
            );
          } catch {
            return false;
          }
        })
      };

      return analysis;
    });

    console.log('Comprehensive UX Analysis:', JSON.stringify(uxAnalysis, null, 2));

    // Generate final recommendations
    const recommendations = {
      critical: [],
      important: [],
      nice_to_have: []
    };

    // Analyze results and generate recommendations
    if (!uxAnalysis.navigation.hasNavigation) {
      recommendations.critical.push('Add clear navigation structure with ARIA landmarks');
    }
    
    if (uxAnalysis.content.dataRows === 0) {
      recommendations.critical.push('Ensure data is loading and displaying correctly');
    }
    
    if (!uxAnalysis.feedback.hasLoadingStates) {
      recommendations.important.push('Add loading indicators for better user feedback');
    }
    
    if (!uxAnalysis.layout.isResponsive) {
      recommendations.important.push('Implement responsive design for mobile devices');
    }

    console.log('UX Recommendations:', recommendations);

    // Final screenshot
    await page.screenshot({ path: 'ux-final-analysis.png', fullPage: true });
  });
});