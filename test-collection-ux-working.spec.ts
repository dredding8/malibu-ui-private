import { test, expect, Page } from '@playwright/test';

// Test the actual working collection opportunities pages
test.describe('Collection Opportunities UX/UI Validation - Working Pages', () => {
  
  test('Complete UX Analysis - Test Opportunities Page', async ({ page }) => {
    // Navigate to test page
    await page.goto('http://localhost:3000/test-opportunities');
    await page.waitForLoadState('networkidle');

    // Take full page screenshot
    await page.screenshot({ path: 'ux-test-opportunities.png', fullPage: true });

    // Visual Design Analysis
    const visualAnalysis = await page.evaluate(() => {
      const analysis: any = {
        colors: new Set(),
        fonts: new Set(),
        spacing: new Set(),
        buttons: []
      };

      // Analyze colors
      document.querySelectorAll('*').forEach(el => {
        const styles = getComputedStyle(el);
        if (styles.backgroundColor !== 'rgba(0, 0, 0, 0)') {
          analysis.colors.add(styles.backgroundColor);
        }
        analysis.fonts.add(styles.fontFamily);
      });

      // Analyze buttons
      document.querySelectorAll('button').forEach(btn => {
        const rect = btn.getBoundingClientRect();
        analysis.buttons.push({
          text: btn.textContent?.trim(),
          width: rect.width,
          height: rect.height,
          adequate: rect.width >= 44 && rect.height >= 44
        });
      });

      return {
        colorCount: analysis.colors.size,
        fontCount: analysis.fonts.size,
        buttons: analysis.buttons
      };
    });

    console.log('Visual Analysis - Test Page:', visualAnalysis);

    // User Journey Test - Filter and Edit
    const journeyMetrics: any = {
      flows: {},
      errors: []
    };

    // Flow 1: Search/Filter
    const searchStart = Date.now();
    const searchInput = page.locator('input[type="search"], input[placeholder*="Search"], input[class*="search"]');
    if (await searchInput.count() > 0) {
      await searchInput.fill('Alpha');
      await page.waitForTimeout(300); // Debounce
      journeyMetrics.flows.search = Date.now() - searchStart;
    }

    // Flow 2: Click Edit Button
    const editStart = Date.now();
    const editButton = page.locator('button:has-text("Edit")').first();
    if (await editButton.count() > 0) {
      await editButton.click();
      await page.waitForTimeout(500);
      
      // Check if modal opened
      const modal = page.locator('.bp5-dialog, .bp6-dialog, [role="dialog"]');
      if (await modal.count() > 0) {
        journeyMetrics.flows.openModal = Date.now() - editStart;
        
        // Close modal
        await page.keyboard.press('Escape');
      }
    }

    console.log('User Journey Metrics:', journeyMetrics);

    // Accessibility Check
    const a11y = await page.evaluate(() => {
      const results: any = {
        landmarks: [],
        headings: [],
        buttons: [],
        forms: []
      };

      // Check landmarks
      ['main', 'navigation', 'banner'].forEach(role => {
        const element = document.querySelector(`[role="${role}"]`);
        if (element) results.landmarks.push(role);
      });

      // Check headings
      document.querySelectorAll('h1,h2,h3,h4,h5,h6').forEach(h => {
        results.headings.push({
          level: h.tagName,
          text: h.textContent?.trim()
        });
      });

      // Check button accessibility
      document.querySelectorAll('button').forEach(btn => {
        results.buttons.push({
          text: btn.textContent?.trim(),
          hasAriaLabel: btn.hasAttribute('aria-label'),
          hasTitle: btn.hasAttribute('title')
        });
      });

      // Check form elements
      document.querySelectorAll('input, select, textarea').forEach(input => {
        const hasLabel = !!input.labels?.length || 
                        input.hasAttribute('aria-label') || 
                        input.hasAttribute('aria-labelledby');
        results.forms.push({
          type: input.getAttribute('type') || input.tagName,
          hasLabel
        });
      });

      return results;
    });

    console.log('Accessibility Analysis:', a11y);

    // Performance Metrics
    const perfMetrics = await page.evaluate(() => {
      const navigation = performance.getEntriesByType('navigation')[0] as PerformanceNavigationTiming;
      return {
        domContentLoaded: navigation.domContentLoadedEventEnd - navigation.domContentLoadedEventStart,
        loadComplete: navigation.loadEventEnd - navigation.loadEventStart,
        firstPaint: performance.getEntriesByName('first-paint')[0]?.startTime || 0,
        firstContentfulPaint: performance.getEntriesByName('first-contentful-paint')[0]?.startTime || 0,
      };
    });

    console.log('Performance Metrics:', perfMetrics);

    // Blueprint.js Compliance
    const bpCompliance = await page.evaluate(() => {
      const bpElements = document.querySelectorAll('[class*="bp5-"], [class*="bp6-"]');
      const customElements = document.querySelectorAll('[class]:not([class*="bp"])');
      return {
        blueprintCount: bpElements.length,
        customCount: customElements.length,
        ratio: bpElements.length / (bpElements.length + customElements.length)
      };
    });

    console.log('Blueprint Compliance:', bpCompliance);

    // Responsive Check
    const viewports = [
      { name: 'mobile', width: 375, height: 667 },
      { name: 'tablet', width: 768, height: 1024 },
      { name: 'desktop', width: 1920, height: 1080 }
    ];

    for (const viewport of viewports) {
      await page.setViewportSize(viewport);
      await page.waitForTimeout(500);
      await page.screenshot({ path: `ux-responsive-${viewport.name}.png`, fullPage: true });
    }
  });

  test('Collection Management Hub - Full UX Validation', async ({ page }) => {
    // Navigate to collection management hub
    await page.goto('http://localhost:3000/collection/test-collection/manage');
    await page.waitForLoadState('networkidle');

    // Comprehensive UX Analysis
    const uxAnalysis = await page.evaluate(() => {
      const analysis: any = {
        navigation: { tabs: 0, breadcrumbs: false },
        statistics: { cards: 0, metrics: [] },
        dataDisplay: { hasTable: false, rows: 0 },
        interactions: { buttons: 0, modals: 0 },
        feedback: { loading: false, tooltips: 0 }
      };

      // Navigation analysis
      analysis.navigation.tabs = document.querySelectorAll('[role="tab"], .bp5-tab, .bp6-tab').length;
      analysis.navigation.breadcrumbs = !!document.querySelector('.breadcrumbs, [aria-label="breadcrumb"]');

      // Statistics cards
      const cards = document.querySelectorAll('.bp5-card, .bp6-card, .card');
      analysis.statistics.cards = cards.length;
      
      // Look for metrics
      cards.forEach(card => {
        const text = card.textContent || '';
        const numbers = text.match(/\d+/g);
        if (numbers) {
          analysis.statistics.metrics.push(...numbers);
        }
      });

      // Data display
      const tables = document.querySelectorAll('table, [role="table"], .bp5-table');
      analysis.dataDisplay.hasTable = tables.length > 0;
      if (tables[0]) {
        analysis.dataDisplay.rows = tables[0].querySelectorAll('tbody tr').length;
      }

      // Interactions
      analysis.interactions.buttons = document.querySelectorAll('button').length;
      analysis.interactions.modals = document.querySelectorAll('.bp5-portal, .bp6-portal').length;

      // Feedback mechanisms
      analysis.feedback.loading = !!document.querySelector('.loading, .spinner, [class*="loading"]');
      analysis.feedback.tooltips = document.querySelectorAll('[title], [aria-describedby]').length;

      return analysis;
    });

    console.log('Collection Hub UX Analysis:', uxAnalysis);

    // Test tab navigation
    const tabs = page.locator('[role="tab"], .bp5-tab, .bp6-tab');
    const tabCount = await tabs.count();
    
    if (tabCount > 0) {
      console.log(`Testing ${tabCount} tabs`);
      for (let i = 0; i < Math.min(tabCount, 3); i++) {
        await tabs.nth(i).click();
        await page.waitForTimeout(500);
        
        // Check if content changed
        const content = await page.locator('[role="tabpanel"], .tab-content').textContent();
        console.log(`Tab ${i} content preview:`, content?.substring(0, 100));
      }
    }

    // Test workspace mode (if available)
    const workspaceButton = page.locator('button:has-text("Workspace"), button:has-text("workspace")');
    if (await workspaceButton.count() > 0) {
      await workspaceButton.click();
      await page.waitForTimeout(1000);
      
      const workspaceActive = await page.locator('.workspace, [class*="workspace"]').count() > 0;
      console.log('Workspace mode active:', workspaceActive);
      
      // Take screenshot
      await page.screenshot({ path: 'ux-workspace-mode.png', fullPage: true });
    }

    // Final comprehensive screenshot
    await page.screenshot({ path: 'ux-collection-hub.png', fullPage: true });

    // Generate UX recommendations
    const recommendations = [];
    
    if (uxAnalysis.navigation.tabs < 2) {
      recommendations.push('Consider adding clear navigation tabs for different views');
    }
    
    if (!uxAnalysis.navigation.breadcrumbs) {
      recommendations.push('Add breadcrumb navigation for better orientation');
    }
    
    if (uxAnalysis.dataDisplay.rows === 0) {
      recommendations.push('Ensure data loads properly or show empty state');
    }
    
    if (uxAnalysis.feedback.tooltips < 5) {
      recommendations.push('Add more contextual help via tooltips');
    }

    console.log('UX Recommendations:', recommendations);
  });

  test('Performance and Interaction Quality', async ({ page }) => {
    // Test interaction responsiveness
    await page.goto('http://localhost:3000/test-opportunities');
    await page.waitForLoadState('networkidle');

    const interactionMetrics: any = {
      clickDelays: [],
      hoverFeedback: [],
      transitionSmoothness: []
    };

    // Test button click responsiveness
    const buttons = page.locator('button:visible');
    const buttonCount = await buttons.count();

    for (let i = 0; i < Math.min(buttonCount, 5); i++) {
      const button = buttons.nth(i);
      const clickStart = Date.now();
      
      await button.click({ force: true });
      await page.waitForTimeout(50);
      
      interactionMetrics.clickDelays.push({
        buttonIndex: i,
        delay: Date.now() - clickStart
      });
    }

    // Test hover feedback
    for (let i = 0; i < Math.min(buttonCount, 3); i++) {
      const button = buttons.nth(i);
      
      // Check if button has hover state
      const beforeHover = await button.evaluate(el => {
        return window.getComputedStyle(el).backgroundColor;
      });
      
      await button.hover();
      await page.waitForTimeout(100);
      
      const afterHover = await button.evaluate(el => {
        return window.getComputedStyle(el).backgroundColor;
      });
      
      interactionMetrics.hoverFeedback.push({
        buttonIndex: i,
        hasHoverState: beforeHover !== afterHover
      });
    }

    console.log('Interaction Metrics:', interactionMetrics);

    // Visual feedback test
    const visualFeedback = await page.evaluate(() => {
      const results: any = {
        transitions: [],
        animations: []
      };

      // Check for CSS transitions
      document.querySelectorAll('*').forEach(el => {
        const transition = window.getComputedStyle(el).transition;
        if (transition && transition !== 'none') {
          results.transitions.push({
            element: el.tagName + (el.className ? '.' + el.className.split(' ')[0] : ''),
            transition
          });
        }
      });

      // Check for animations
      document.querySelectorAll('*').forEach(el => {
        const animation = window.getComputedStyle(el).animation;
        if (animation && animation !== 'none') {
          results.animations.push({
            element: el.tagName,
            animation
          });
        }
      });

      return results;
    });

    console.log('Visual Feedback Analysis:', visualFeedback);

    // Final UX Score Calculation
    const uxScore = {
      accessibility: a11y.landmarks.length > 0 ? 25 : 0,
      performance: perfMetrics.firstContentfulPaint < 2000 ? 25 : 10,
      interactions: interactionMetrics.hoverFeedback.filter(h => h.hasHoverState).length > 0 ? 25 : 10,
      visual: bpCompliance.ratio > 0.8 ? 25 : 15,
      total: 0
    };

    uxScore.total = uxScore.accessibility + uxScore.performance + uxScore.interactions + uxScore.visual;

    console.log('UX Quality Score:', uxScore);
    console.log(`Overall UX Score: ${uxScore.total}/100`);
  });
});