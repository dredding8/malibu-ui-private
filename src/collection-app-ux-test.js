const { chromium } = require('playwright');
const fs = require('fs');
const path = require('path');

/**
 * Comprehensive UX Testing Suite for Collection Management App
 * Tests user experience, performance, accessibility, and interaction patterns
 */

class CollectionAppUXTester {
  constructor() {
    this.browser = null;
    this.page = null;
    this.results = {
      performance: {},
      accessibility: {},
      interactions: {},
      navigation: {},
      visual: {},
      errors: [],
      screenshots: [],
      summary: {}
    };
  }

  async initialize() {
    console.log('🚀 Initializing UX testing environment...');
    
    this.browser = await chromium.launch({
      headless: false,
      slowMo: 300,
      args: ['--disable-web-security', '--disable-features=VizDisplayCompositor']
    });
    
    const context = await this.browser.newContext({
      viewport: { width: 1280, height: 720 },
      userAgent: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
    });
    
    this.page = await context.newPage();
    
    // Set up event listeners
    this.page.on('console', msg => {
      this.results.errors.push({
        type: 'console',
        level: msg.type(),
        text: msg.text(),
        timestamp: new Date().toISOString()
      });
    });
    
    this.page.on('pageerror', error => {
      this.results.errors.push({
        type: 'error',
        message: error.message,
        stack: error.stack,
        timestamp: new Date().toISOString()
      });
    });
    
    this.page.on('requestfailed', request => {
      this.results.errors.push({
        type: 'network',
        url: request.url(),
        method: request.method(),
        failure: request.failure()?.errorText,
        timestamp: new Date().toISOString()
      });
    });
  }

  async testPageLoad() {
    console.log('📊 Testing page load performance...');
    
    const startTime = Date.now();
    
    try {
      await this.page.goto('http://localhost:3001', { 
        waitUntil: 'networkidle',
        timeout: 30000 
      });
      
      const loadTime = Date.now() - startTime;
      
      // Capture initial state
      await this.takeScreenshot('01-initial-load');
      
      // Get performance metrics
      const performanceMetrics = await this.page.evaluate(() => {
        const timing = performance.timing;
        const navigation = performance.getEntriesByType('navigation')[0];
        const paint = performance.getEntriesByType('paint');
        
        return {
          pageLoad: timing.loadEventEnd - timing.navigationStart,
          domReady: timing.domContentLoadedEventEnd - timing.navigationStart,
          firstContentfulPaint: paint.find(p => p.name === 'first-contentful-paint')?.startTime || 0,
          largestContentfulPaint: paint.find(p => p.name === 'largest-contentful-paint')?.startTime || 0,
          navigationTiming: navigation ? {
            dnsLookup: navigation.domainLookupEnd - navigation.domainLookupStart,
            tcpConnect: navigation.connectEnd - navigation.connectStart,
            serverResponse: navigation.responseEnd - navigation.requestStart,
            domProcessing: navigation.domContentLoadedEventEnd - navigation.responseEnd
          } : null
        };
      });
      
      this.results.performance = {
        totalLoadTime: loadTime,
        ...performanceMetrics,
        assessment: this.assessPerformance(performanceMetrics)
      };
      
      console.log(`  ✅ Page loaded in ${loadTime}ms`);
      console.log(`  ⚡ DOM ready in ${performanceMetrics.domReady}ms`);
      console.log(`  🎨 First paint at ${performanceMetrics.firstContentfulPaint}ms`);
      
    } catch (error) {
      console.log(`  ❌ Page load failed: ${error.message}`);
      this.results.errors.push({
        type: 'page-load',
        message: error.message,
        timestamp: new Date().toISOString()
      });
    }
  }

  async analyzePageStructure() {
    console.log('🏗️ Analyzing page structure and layout...');
    
    try {
      const structure = await this.page.evaluate(() => {
        const getElementCounts = (selector) => document.querySelectorAll(selector).length;
        
        return {
          navigation: {
            navElements: getElementCounts('nav, [role="navigation"]'),
            breadcrumbs: getElementCounts('.bp5-breadcrumbs, [role="navigation"] ol'),
            menuItems: getElementCounts('nav a, nav button, [role="menuitem"]')
          },
          content: {
            headings: {
              h1: getElementCounts('h1'),
              h2: getElementCounts('h2'),
              h3: getElementCounts('h3'),
              h4: getElementCounts('h4'),
              h5: getElementCounts('h5'),
              h6: getElementCounts('h6')
            },
            cards: getElementCounts('.bp5-card, .card, [role="region"]'),
            tables: getElementCounts('table, .bp5-html-table'),
            forms: getElementCounts('form'),
            lists: getElementCounts('ul, ol, .bp5-list')
          },
          interactive: {
            buttons: getElementCounts('button, [role="button"]'),
            inputs: getElementCounts('input, textarea, select'),
            links: getElementCounts('a[href]'),
            checkboxes: getElementCounts('input[type="checkbox"]'),
            dropdowns: getElementCounts('select, .bp5-select'),
            modals: getElementCounts('.bp5-dialog, .bp5-drawer, [role="dialog"]')
          },
          layout: {
            containers: getElementCounts('.container, .bp5-container'),
            grids: getElementCounts('.grid, .bp5-grid, [style*="grid"]'),
            flexboxes: getElementCounts('[style*="flex"], .flex')
          }
        };
      });
      
      this.results.visual.structure = structure;
      
      console.log('  📊 Structure Analysis:');
      console.log(`    Navigation: ${structure.navigation.navElements} nav elements, ${structure.navigation.menuItems} menu items`);
      console.log(`    Content: ${structure.content.cards} cards, ${structure.content.tables} tables`);
      console.log(`    Interactive: ${structure.interactive.buttons} buttons, ${structure.interactive.inputs} inputs`);
      
    } catch (error) {
      console.log(`  ❌ Structure analysis failed: ${error.message}`);
    }
  }

  async testAccessibility() {
    console.log('♿ Testing accessibility compliance...');
    
    try {
      const accessibilityMetrics = await this.page.evaluate(() => {
        const elements = document.querySelectorAll('*');
        let metrics = {
          images: { total: 0, withAlt: 0, withMeaningfulAlt: 0 },
          forms: { total: 0, withLabels: 0, withFieldsets: 0 },
          navigation: { landmarks: 0, skipLinks: 0, focusableElements: 0 },
          headings: { structure: [], hierarchyIssues: 0 },
          contrast: { violations: 0, checkedElements: 0 },
          keyboardNav: { tabIndex: 0, accessKeys: 0, focusVisible: 0 }
        };
        
        // Check images
        const images = document.querySelectorAll('img');
        metrics.images.total = images.length;
        images.forEach(img => {
          const alt = img.getAttribute('alt');
          if (alt !== null) {
            metrics.images.withAlt++;
            if (alt.trim().length > 0 && alt.trim().length > 2) {
              metrics.images.withMeaningfulAlt++;
            }
          }
        });
        
        // Check forms
        const forms = document.querySelectorAll('form');
        metrics.forms.total = forms.length;
        
        const inputs = document.querySelectorAll('input, textarea, select');
        inputs.forEach(input => {
          const label = document.querySelector(`label[for="${input.id}"]`) || 
                       input.closest('label') ||
                       input.getAttribute('aria-label') ||
                       input.getAttribute('aria-labelledby');
          if (label) metrics.forms.withLabels++;
        });
        
        // Check landmarks and navigation
        metrics.navigation.landmarks = document.querySelectorAll('[role="main"], [role="navigation"], [role="banner"], [role="contentinfo"], [role="complementary"], main, nav, header, footer, aside').length;
        metrics.navigation.skipLinks = document.querySelectorAll('a[href^="#"], .skip-link').length;
        
        // Check focusable elements
        const focusableSelectors = 'a[href], button, input, textarea, select, [tabindex]:not([tabindex="-1"])';
        metrics.navigation.focusableElements = document.querySelectorAll(focusableSelectors).length;
        
        // Check heading structure
        const headings = document.querySelectorAll('h1, h2, h3, h4, h5, h6');
        let lastLevel = 0;
        headings.forEach(heading => {
          const level = parseInt(heading.tagName.charAt(1));
          metrics.headings.structure.push({
            level,
            text: heading.textContent.trim().substring(0, 50),
            hasId: !!heading.id
          });
          
          if (level > lastLevel + 1) {
            metrics.headings.hierarchyIssues++;
          }
          lastLevel = level;
        });
        
        // Check for keyboard navigation attributes
        metrics.keyboardNav.tabIndex = document.querySelectorAll('[tabindex]').length;
        metrics.keyboardNav.accessKeys = document.querySelectorAll('[accesskey]').length;
        metrics.keyboardNav.focusVisible = document.querySelectorAll(':focus-visible, .focus-visible').length;
        
        return metrics;
      });
      
      this.results.accessibility = {
        ...accessibilityMetrics,
        score: this.calculateAccessibilityScore(accessibilityMetrics),
        recommendations: this.generateAccessibilityRecommendations(accessibilityMetrics)
      };
      
      console.log('  ♿ Accessibility Assessment:');
      console.log(`    Images: ${accessibilityMetrics.images.withMeaningfulAlt}/${accessibilityMetrics.images.total} have meaningful alt text`);
      console.log(`    Forms: ${accessibilityMetrics.forms.withLabels} labeled inputs found`);
      console.log(`    Navigation: ${accessibilityMetrics.navigation.landmarks} landmarks, ${accessibilityMetrics.navigation.focusableElements} focusable elements`);
      console.log(`    Headings: ${accessibilityMetrics.headings.structure.length} found, ${accessibilityMetrics.headings.hierarchyIssues} hierarchy issues`);
      
    } catch (error) {
      console.log(`  ❌ Accessibility testing failed: ${error.message}`);
    }
  }

  async testUserInteractions() {
    console.log('🎯 Testing user interactions and workflows...');
    
    try {
      // Test button interactions
      const buttons = await this.page.$$('button:visible, [role="button"]:visible');
      console.log(`  🖱️ Found ${buttons.length} interactive buttons`);
      
      const interactionResults = [];
      
      for (let i = 0; i < Math.min(5, buttons.length); i++) {
        try {
          const button = buttons[i];
          const text = await button.textContent();
          const isEnabled = await button.isEnabled();
          const isVisible = await button.isVisible();
          
          console.log(`    Testing button ${i + 1}: "${text?.substring(0, 30)}"`);
          
          if (isEnabled && isVisible) {
            await this.takeScreenshot(`interaction-before-${i + 1}`);
            
            // Click and observe
            await button.click();
            await this.page.waitForTimeout(500);
            
            await this.takeScreenshot(`interaction-after-${i + 1}`);
            
            interactionResults.push({
              index: i + 1,
              text: text?.substring(0, 50),
              success: true,
              enabled: isEnabled,
              visible: isVisible
            });
            
            console.log(`    ✅ Successfully interacted with button ${i + 1}`);
          }
        } catch (error) {
          console.log(`    ❌ Failed to interact with button ${i + 1}: ${error.message}`);
          interactionResults.push({
            index: i + 1,
            success: false,
            error: error.message
          });
        }
      }
      
      // Test form inputs
      const inputs = await this.page.$$('input:visible, textarea:visible');
      console.log(`  📝 Found ${inputs.length} form inputs`);
      
      const inputResults = [];
      
      for (let i = 0; i < Math.min(3, inputs.length); i++) {
        try {
          const input = inputs[i];
          const type = await input.getAttribute('type');
          const placeholder = await input.getAttribute('placeholder');
          
          console.log(`    Testing input ${i + 1}: type="${type}", placeholder="${placeholder}"`);
          
          if (['text', 'search', 'email', 'number', null].includes(type)) {
            await input.fill('test input value');
            await this.page.waitForTimeout(300);
            
            const value = await input.inputValue();
            
            inputResults.push({
              index: i + 1,
              type,
              placeholder,
              testValue: value,
              success: true
            });
            
            console.log(`    ✅ Successfully filled input ${i + 1}`);
          }
        } catch (error) {
          console.log(`    ❌ Failed to test input ${i + 1}: ${error.message}`);
          inputResults.push({
            index: i + 1,
            success: false,
            error: error.message
          });
        }
      }
      
      this.results.interactions = {
        buttons: interactionResults,
        inputs: inputResults,
        summary: {
          totalButtonsFound: buttons.length,
          totalInputsFound: inputs.length,
          successfulButtonInteractions: interactionResults.filter(r => r.success).length,
          successfulInputInteractions: inputResults.filter(r => r.success).length
        }
      };
      
    } catch (error) {
      console.log(`  ❌ Interaction testing failed: ${error.message}`);
    }
  }

  async testNavigation() {
    console.log('🧭 Testing navigation patterns and routing...');
    
    try {
      // Find navigation elements
      const navLinks = await this.page.$$('nav a, [role="navigation"] a, .nav a');
      console.log(`  🔗 Found ${navLinks.length} navigation links`);
      
      const navigationResults = [];
      
      for (let i = 0; i < Math.min(3, navLinks.length); i++) {
        try {
          const link = navLinks[i];
          const href = await link.getAttribute('href');
          const text = await link.textContent();
          
          if (href && !href.startsWith('http') && !href.startsWith('mailto:')) {
            console.log(`    Testing navigation to: "${text}" (${href})`);
            
            const currentUrl = this.page.url();
            await link.click();
            await this.page.waitForTimeout(1000);
            
            const newUrl = this.page.url();
            const navigationSuccessful = currentUrl !== newUrl;
            
            await this.takeScreenshot(`navigation-${i + 1}`);
            
            navigationResults.push({
              index: i + 1,
              text: text?.trim(),
              href,
              fromUrl: currentUrl,
              toUrl: newUrl,
              navigationSuccessful
            });
            
            console.log(`    ${navigationSuccessful ? '✅' : '⚠️'} Navigation ${navigationSuccessful ? 'successful' : 'stayed on same page'}`);
            
            // Go back to test next link
            if (navigationSuccessful) {
              await this.page.goBack();
              await this.page.waitForTimeout(500);
            }
          }
        } catch (error) {
          console.log(`    ❌ Navigation test ${i + 1} failed: ${error.message}`);
          navigationResults.push({
            index: i + 1,
            success: false,
            error: error.message
          });
        }
      }
      
      this.results.navigation = {
        links: navigationResults,
        summary: {
          totalLinksFound: navLinks.length,
          successfulNavigations: navigationResults.filter(r => r.navigationSuccessful).length
        }
      };
      
    } catch (error) {
      console.log(`  ❌ Navigation testing failed: ${error.message}`);
    }
  }

  async testResponsiveDesign() {
    console.log('📱 Testing responsive design...');
    
    const viewports = [
      { name: 'mobile', width: 375, height: 667 },
      { name: 'tablet', width: 768, height: 1024 },
      { name: 'desktop', width: 1280, height: 720 }
    ];
    
    const responsiveResults = [];
    
    for (const viewport of viewports) {
      try {
        console.log(`  📐 Testing ${viewport.name} viewport (${viewport.width}x${viewport.height})`);
        
        await this.page.setViewportSize({ width: viewport.width, height: viewport.height });
        await this.page.waitForTimeout(500);
        
        await this.takeScreenshot(`responsive-${viewport.name}`);
        
        // Check for responsive behaviors
        const responsiveMetrics = await this.page.evaluate(() => {
          return {
            hasOverflow: document.body.scrollWidth > window.innerWidth,
            hasHorizontalScroll: window.scrollX > 0 || document.body.scrollWidth > window.innerWidth,
            visibleElements: document.querySelectorAll(':visible').length,
            hiddenElements: document.querySelectorAll('[style*="display: none"], [hidden]').length
          };
        });
        
        responsiveResults.push({
          viewport: viewport.name,
          dimensions: viewport,
          metrics: responsiveMetrics,
          hasIssues: responsiveMetrics.hasHorizontalScroll
        });
        
        console.log(`    ${responsiveMetrics.hasHorizontalScroll ? '⚠️' : '✅'} ${viewport.name} layout ${responsiveMetrics.hasHorizontalScroll ? 'has overflow issues' : 'looks good'}`);
        
      } catch (error) {
        console.log(`    ❌ ${viewport.name} testing failed: ${error.message}`);
      }
    }
    
    this.results.visual.responsive = responsiveResults;
    
    // Reset to original viewport
    await this.page.setViewportSize({ width: 1280, height: 720 });
  }

  async takeScreenshot(name) {
    try {
      const filename = `ux-test-${name}-${Date.now()}.png`;
      await this.page.screenshot({
        path: filename,
        fullPage: true
      });
      this.results.screenshots.push(filename);
      return filename;
    } catch (error) {
      console.log(`Failed to take screenshot ${name}: ${error.message}`);
    }
  }

  assessPerformance(metrics) {
    const scores = {
      excellent: 0,
      good: 0,
      needsImprovement: 0,
      poor: 0
    };
    
    // Assess DOM ready time
    if (metrics.domReady < 1000) scores.excellent++;
    else if (metrics.domReady < 2500) scores.good++;
    else if (metrics.domReady < 4000) scores.needsImprovement++;
    else scores.poor++;
    
    // Assess First Contentful Paint
    if (metrics.firstContentfulPaint < 1800) scores.excellent++;
    else if (metrics.firstContentfulPaint < 3000) scores.good++;
    else if (metrics.firstContentfulPaint < 4500) scores.needsImprovement++;
    else scores.poor++;
    
    const total = Object.values(scores).reduce((a, b) => a + b, 0);
    
    if (scores.poor > 0) return 'poor';
    if (scores.needsImprovement > scores.good + scores.excellent) return 'needs-improvement';
    if (scores.excellent >= scores.good) return 'excellent';
    return 'good';
  }

  calculateAccessibilityScore(metrics) {
    let score = 0;
    let maxScore = 0;
    
    // Images with alt text
    maxScore += 10;
    if (metrics.images.total > 0) {
      score += (metrics.images.withMeaningfulAlt / metrics.images.total) * 10;
    } else {
      score += 10; // No images is fine
    }
    
    // Form labels
    maxScore += 15;
    if (metrics.forms.total > 0) {
      score += (metrics.forms.withLabels / metrics.forms.total) * 15;
    } else {
      score += 15; // No forms is fine
    }
    
    // Landmarks
    maxScore += 10;
    score += Math.min(metrics.navigation.landmarks * 2, 10);
    
    // Heading structure
    maxScore += 10;
    if (metrics.headings.structure.length > 0) {
      const headingScore = Math.max(0, 10 - metrics.headings.hierarchyIssues * 2);
      score += headingScore;
    }
    
    // Focusable elements
    maxScore += 5;
    if (metrics.navigation.focusableElements > 0) {
      score += 5;
    }
    
    return Math.round((score / maxScore) * 100);
  }

  generateAccessibilityRecommendations(metrics) {
    const recommendations = [];
    
    if (metrics.images.total > 0 && metrics.images.withMeaningfulAlt < metrics.images.total) {
      recommendations.push('Add meaningful alt text to all images');
    }
    
    if (metrics.forms.withLabels < metrics.forms.total) {
      recommendations.push('Ensure all form inputs have associated labels');
    }
    
    if (metrics.navigation.landmarks < 3) {
      recommendations.push('Add more landmark roles (main, navigation, banner, contentinfo)');
    }
    
    if (metrics.headings.hierarchyIssues > 0) {
      recommendations.push('Fix heading hierarchy (don\'t skip heading levels)');
    }
    
    if (metrics.navigation.skipLinks === 0) {
      recommendations.push('Add skip links for keyboard navigation');
    }
    
    return recommendations;
  }

  generateSummary() {
    const { performance, accessibility, interactions, navigation, visual, errors } = this.results;
    
    return {
      overall: {
        performanceGrade: performance.assessment || 'unknown',
        accessibilityScore: accessibility.score || 0,
        interactionSuccess: interactions.summary ? 
          Math.round((interactions.summary.successfulButtonInteractions / Math.max(interactions.summary.totalButtonsFound, 1)) * 100) : 0,
        navigationSuccess: navigation.summary ?
          Math.round((navigation.summary.successfulNavigations / Math.max(navigation.summary.totalLinksFound, 1)) * 100) : 0,
        errorCount: errors.length,
        screenshotCount: this.results.screenshots.length
      },
      keyFindings: {
        strengths: [],
        concerns: [],
        recommendations: accessibility.recommendations || []
      },
      technicalMetrics: {
        loadTime: performance.totalLoadTime,
        domReady: performance.domReady,
        firstPaint: performance.firstContentfulPaint,
        elementsFound: visual.structure ? 
          Object.values(visual.structure).reduce((sum, category) => {
            if (typeof category === 'object') {
              return sum + Object.values(category).reduce((catSum, val) => 
                catSum + (typeof val === 'number' ? val : 0), 0);
            }
            return sum + (typeof category === 'number' ? category : 0);
          }, 0) : 0
      }
    };
  }

  async cleanup() {
    if (this.browser) {
      await this.browser.close();
    }
  }

  async runComprehensiveTest() {
    console.log('🎭 Starting Comprehensive UX Testing Suite');
    console.log('=' * 60);
    
    try {
      await this.initialize();
      await this.testPageLoad();
      await this.analyzePageStructure();
      await this.testAccessibility();
      await this.testUserInteractions();
      await this.testNavigation();
      await this.testResponsiveDesign();
      
      this.results.summary = this.generateSummary();
      
      // Save results
      const resultsFile = `ux-test-results-${Date.now()}.json`;
      fs.writeFileSync(resultsFile, JSON.stringify(this.results, null, 2));
      
      console.log('\n🎯 TEST SUMMARY');
      console.log('=' * 30);
      console.log(`⚡ Performance: ${this.results.summary.overall.performanceGrade}`);
      console.log(`♿ Accessibility Score: ${this.results.summary.overall.accessibilityScore}%`);
      console.log(`🎯 Interaction Success: ${this.results.summary.overall.interactionSuccess}%`);
      console.log(`🧭 Navigation Success: ${this.results.summary.overall.navigationSuccess}%`);
      console.log(`❌ Errors Found: ${this.results.summary.overall.errorCount}`);
      console.log(`📸 Screenshots Captured: ${this.results.summary.overall.screenshotCount}`);
      console.log(`📋 Full results saved to: ${resultsFile}`);
      
      if (this.results.summary.keyFindings.recommendations.length > 0) {
        console.log('\n💡 Key Recommendations:');
        this.results.summary.keyFindings.recommendations.forEach((rec, i) => {
          console.log(`  ${i + 1}. ${rec}`);
        });
      }
      
      return this.results;
      
    } catch (error) {
      console.log(`❌ Testing suite failed: ${error.message}`);
      throw error;
    } finally {
      await this.cleanup();
    }
  }
}

// Export for use
module.exports = CollectionAppUXTester;

// Run if called directly
if (require.main === module) {
  (async () => {
    const tester = new CollectionAppUXTester();
    try {
      await tester.runComprehensiveTest();
      console.log('🏁 UX testing completed successfully!');
    } catch (error) {
      console.error('💥 UX testing failed:', error.message);
      process.exit(1);
    }
  })();
}