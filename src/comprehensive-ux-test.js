const { chromium } = require('playwright');
const fs = require('fs');

async function comprehensiveUXTest() {
  console.log('🌊 COMPREHENSIVE UX/UI VALIDATION');
  console.log('=' * 60);
  
  const browser = await chromium.launch({ 
    headless: false,
    slowMo: 500 
  });
  
  const context = await browser.newContext({
    viewport: { width: 1920, height: 1080 }
  });
  
  const page = await context.newPage();
  
  const results = {
    userJourney: {},
    visualDesign: {},
    interactions: {},
    functionality: {},
    accessibility: {},
    performance: {}
  };
  
  try {
    // === WAVE 1: USER JOURNEY EFFECTIVENESS ===
    console.log('\n🌊 WAVE 1: User Journey Analysis');
    console.log('-'.repeat(40));
    
    await page.goto('http://localhost:3000/collection/TEST-001/manage', { 
      waitUntil: 'networkidle', 
      timeout: 30000 
    });
    
    await page.waitForTimeout(2000);
    
    // Check navigation structure
    const breadcrumbs = await page.locator('[aria-label*="breadcrumb"], .breadcrumb').count();
    const backButtons = await page.locator('button[aria-label*="back"], [aria-label*="Back"]').count();
    const navElements = await page.locator('nav, [role="navigation"]').count();
    
    console.log(`🧭 Navigation elements: breadcrumbs(${breadcrumbs}), back(${backButtons}), nav(${navElements})`);
    
    // Check for guidance/help elements
    const helpElements = await page.locator('[aria-label*="help"], [title*="help"], .help').count();
    const tooltips = await page.locator('[data-tooltip], [title]').count();
    const welcomeCards = await page.locator('.welcome, [class*="welcome"]').count();
    
    console.log(`💡 Guidance elements: help(${helpElements}), tooltips(${tooltips}), welcome(${welcomeCards})`);
    
    results.userJourney = {
      navigation: breadcrumbs + backButtons + navElements,
      guidance: helpElements + tooltips + welcomeCards,
      score: Math.min(100, (breadcrumbs + backButtons + navElements + helpElements + tooltips) * 10)
    };
    
    // === WAVE 2: VISUAL DESIGN CONSISTENCY ===
    console.log('\n🌊 WAVE 2: Visual Design Analysis');
    console.log('-'.repeat(40));
    
    // Check Blueprint UI implementation
    const blueprintElements = await page.locator('[class*="bp5"], [class*="bp6"], [class*="bp4"]').count();
    const cards = await page.locator('.bp6-card, .bp5-card, .card').count();
    const buttons = await page.locator('.bp6-button, .bp5-button, button').count();
    const tables = await page.locator('.bp6-table, .bp5-table, table').count();
    
    console.log(`🎨 Blueprint UI: elements(${blueprintElements}), cards(${cards}), buttons(${buttons}), tables(${tables})`);
    
    // Check color consistency
    const dangerElements = await page.locator('[class*="danger"], [class*="error"]').count();
    const warningElements = await page.locator('[class*="warning"]').count();
    const successElements = await page.locator('[class*="success"]').count();
    const primaryElements = await page.locator('[class*="primary"]').count();
    
    console.log(`🎯 Color system: danger(${dangerElements}), warning(${warningElements}), success(${successElements}), primary(${primaryElements})`);
    
    results.visualDesign = {
      blueprintUsage: blueprintElements,
      componentTypes: cards + buttons + tables,
      colorSystem: dangerElements + warningElements + successElements + primaryElements,
      score: Math.min(100, (blueprintElements / 10) + (cards + buttons + tables) * 2)
    };
    
    // === WAVE 3: INTERACTION PATTERNS ===
    console.log('\n🌊 WAVE 3: Interaction Testing');
    console.log('-'.repeat(40));
    
    // Test hover states
    const firstButton = page.locator('button').first();
    if (await firstButton.isVisible()) {
      await firstButton.hover();
      console.log('✅ Button hover state tested');
    }
    
    // Test keyboard navigation
    await page.keyboard.press('Tab');
    await page.waitForTimeout(500);
    await page.keyboard.press('Tab');
    await page.waitForTimeout(500);
    await page.keyboard.press('Tab');
    
    const focusableElements = await page.locator(':focus').count();
    console.log(`⌨️ Keyboard navigation: focusable elements found(${focusableElements})`);
    
    // Test form interactions if present
    const inputs = await page.locator('input, select, textarea').count();
    const checkboxes = await page.locator('input[type="checkbox"]').count();
    const dropdowns = await page.locator('select, [role="listbox"]').count();
    
    console.log(`📝 Form elements: inputs(${inputs}), checkboxes(${checkboxes}), dropdowns(${dropdowns})`);
    
    // Test table interactions
    const tableRows = await page.locator('tr, [role="row"]').count();
    const clickableRows = await page.locator('tr[onclick], [role="row"][onclick], .clickable-row').count();
    
    console.log(`📊 Table interactions: rows(${tableRows}), clickable(${clickableRows})`);
    
    results.interactions = {
      keyboardNavigation: focusableElements > 0,
      formElements: inputs + checkboxes + dropdowns,
      tableInteractions: tableRows + clickableRows,
      score: Math.min(100, (focusableElements * 10) + (inputs + checkboxes + dropdowns) * 5 + (tableRows / 10))
    };
    
    // === WAVE 4: FUNCTIONAL VALIDATION ===
    console.log('\n🌊 WAVE 4: Functionality Testing');
    console.log('-'.repeat(40));
    
    // Check for error handling
    const errorBoundaries = await page.locator('[class*="error-boundary"], [class*="ErrorBoundary"]').count();
    const errorMessages = await page.locator('[role="alert"], .error, [class*="error"]').count();
    const loadingStates = await page.locator('.loading, [class*="loading"], .spinner').count();
    
    console.log(`🛡️ Error handling: boundaries(${errorBoundaries}), messages(${errorMessages}), loading(${loadingStates})`);
    
    // Check for data validation
    const validationElements = await page.locator('[class*="validation"], [aria-invalid]').count();
    const requiredFields = await page.locator('[required], [aria-required="true"]').count();
    
    console.log(`✅ Validation: elements(${validationElements}), required(${requiredFields})`);
    
    // Check for CRUD operations availability
    const editButtons = await page.locator('button[aria-label*="edit"], [title*="edit"], .edit').count();
    const deleteButtons = await page.locator('button[aria-label*="delete"], [title*="delete"], .delete').count();
    const saveButtons = await page.locator('button[aria-label*="save"], [title*="save"], .save').count();
    
    console.log(`🔧 CRUD operations: edit(${editButtons}), delete(${deleteButtons}), save(${saveButtons})`);
    
    results.functionality = {
      errorHandling: errorBoundaries + errorMessages + loadingStates,
      validation: validationElements + requiredFields,
      crudOperations: editButtons + deleteButtons + saveButtons,
      score: Math.min(100, (errorBoundaries + errorMessages) * 10 + (validationElements + requiredFields) * 5 + (editButtons + deleteButtons + saveButtons) * 3)
    };
    
    // === WAVE 5: ACCESSIBILITY COMPLIANCE ===
    console.log('\n🌊 WAVE 5: Accessibility Testing');
    console.log('-'.repeat(40));
    
    // Check ARIA attributes
    const ariaLabels = await page.locator('[aria-label]').count();
    const ariaDescriptions = await page.locator('[aria-describedby]').count();
    const ariaRoles = await page.locator('[role]').count();
    const landmarks = await page.locator('[role="main"], [role="navigation"], [role="banner"], [role="contentinfo"]').count();
    
    console.log(`♿ ARIA: labels(${ariaLabels}), descriptions(${ariaDescriptions}), roles(${ariaRoles}), landmarks(${landmarks})`);
    
    // Check heading structure
    const headings = await page.locator('h1, h2, h3, h4, h5, h6').count();
    const h1s = await page.locator('h1').count();
    
    console.log(`📝 Headings: total(${headings}), h1s(${h1s})`);
    
    // Check alt text for images
    const images = await page.locator('img').count();
    const imagesWithAlt = await page.locator('img[alt]').count();
    const imagesWithoutAlt = images - imagesWithAlt;
    
    console.log(`🖼️ Images: total(${images}), with alt(${imagesWithAlt}), without alt(${imagesWithoutAlt})`);
    
    // Check color contrast indicators
    const highContrastElements = await page.locator('[class*="high-contrast"]').count();
    const contrastClasses = await page.locator('[class*="contrast"]').count();
    
    console.log(`🎨 Contrast: high contrast(${highContrastElements}), contrast classes(${contrastClasses})`);
    
    results.accessibility = {
      ariaImplementation: ariaLabels + ariaDescriptions + ariaRoles + landmarks,
      headingStructure: headings,
      imageAccessibility: imagesWithAlt,
      imageIssues: imagesWithoutAlt,
      score: Math.min(100, (ariaLabels + ariaDescriptions + ariaRoles) * 2 + headings * 5 + imagesWithAlt * 3 - imagesWithoutAlt * 5)
    };
    
    // === PERFORMANCE ANALYSIS ===
    console.log('\n🌊 WAVE 6: Performance Analysis');
    console.log('-'.repeat(40));
    
    // Measure performance metrics
    const performanceMetrics = await page.evaluate(() => {
      const navigation = performance.getEntriesByType('navigation')[0];
      const paint = performance.getEntriesByType('paint');
      
      return {
        domContentLoaded: navigation ? navigation.domContentLoadedEventEnd - navigation.fetchStart : 0,
        loadComplete: navigation ? navigation.loadEventEnd - navigation.fetchStart : 0,
        firstPaint: paint.find(p => p.name === 'first-paint')?.startTime || 0,
        firstContentfulPaint: paint.find(p => p.name === 'first-contentful-paint')?.startTime || 0
      };
    });
    
    console.log(`⚡ Performance: DOMContentLoaded(${performanceMetrics.domContentLoaded.toFixed(2)}ms), Load(${performanceMetrics.loadComplete.toFixed(2)}ms)`);
    console.log(`🎨 Paint: First Paint(${performanceMetrics.firstPaint.toFixed(2)}ms), FCP(${performanceMetrics.firstContentfulPaint.toFixed(2)}ms)`);
    
    // Check for performance optimizations
    const lazyElements = await page.locator('[loading="lazy"], [class*="lazy"]').count();
    const memoizedElements = await page.locator('[class*="memo"], [class*="cache"]').count();
    
    console.log(`🚀 Optimizations: lazy loading(${lazyElements}), memoization indicators(${memoizedElements})`);
    
    results.performance = {
      domContentLoaded: performanceMetrics.domContentLoaded,
      firstContentfulPaint: performanceMetrics.firstContentfulPaint,
      optimizations: lazyElements + memoizedElements,
      score: Math.max(0, 100 - (performanceMetrics.domContentLoaded / 100) - (performanceMetrics.firstContentfulPaint / 100) + (lazyElements + memoizedElements) * 5)
    };
    
    // === FINAL ASSESSMENT ===
    console.log('\n🎯 COMPREHENSIVE ASSESSMENT');
    console.log('=' * 60);
    
    const overallScore = Math.round(
      (results.userJourney.score + 
       results.visualDesign.score + 
       results.interactions.score + 
       results.functionality.score + 
       results.accessibility.score + 
       results.performance.score) / 6
    );
    
    results.overall = {
      score: overallScore,
      grade: overallScore >= 90 ? 'A' : overallScore >= 80 ? 'B' : overallScore >= 70 ? 'C' : overallScore >= 60 ? 'D' : 'F',
      recommendation: overallScore >= 90 ? 'Excellent - Ready for production' : 
                     overallScore >= 80 ? 'Good - Minor improvements needed' :
                     overallScore >= 70 ? 'Fair - Some improvements needed' :
                     overallScore >= 60 ? 'Poor - Significant improvements needed' :
                     'Critical - Major overhaul required'
    };
    
    console.log(`\n📊 SCORES:`);
    console.log(`   User Journey: ${results.userJourney.score}/100`);
    console.log(`   Visual Design: ${results.visualDesign.score}/100`);
    console.log(`   Interactions: ${results.interactions.score}/100`);
    console.log(`   Functionality: ${results.functionality.score}/100`);
    console.log(`   Accessibility: ${results.accessibility.score}/100`);
    console.log(`   Performance: ${results.performance.score.toFixed(1)}/100`);
    console.log(`\n🏆 OVERALL: ${overallScore}/100 (Grade: ${results.overall.grade})`);
    console.log(`📋 RECOMMENDATION: ${results.overall.recommendation}`);
    
    // Take final screenshot
    await page.screenshot({ path: '/tmp/ux-test-final.png', fullPage: true });
    console.log('\n📸 Final screenshot saved to /tmp/ux-test-final.png');
    
    return results;
    
  } catch (error) {
    console.error(`🚨 Test failed: ${error.message}`);
    return { error: error.message };
  } finally {
    await browser.close();
  }
}

// Run comprehensive test
comprehensiveUXTest().then(results => {
  console.log('\n📄 Saving detailed results...');
  fs.writeFileSync('/tmp/ux-test-results.json', JSON.stringify(results, null, 2));
  console.log('📄 Results saved to /tmp/ux-test-results.json');
}).catch(error => {
  console.error('❌ Test execution failed:', error);
});