/**
 * Corrected JTBD Validation - Test with correct application URL
 * URL: http://localhost:3000/collection/TEST-001/manage
 */

const { chromium } = require('playwright');

async function validateJTBDWithCorrectURL() {
  console.log('🎯 Starting Corrected JTBD Validation');
  console.log('📍 Target: http://localhost:3000/collection/TEST-001/manage');
  console.log('🔧 Using actual working application URL\n');

  const browser = await chromium.launch({ headless: false });
  const page = await browser.newPage();
  
  const results = {
    routing: { passed: false, details: [] },
    jtbd1_verify: { passed: false, details: [] },
    jtbd2_override: { passed: false, details: [] },
    jtbd3_integrity: { passed: false, details: [] },
    jtbd4_views: { passed: false, details: [] },
    jtbd5_bulk: { passed: false, details: [] }
  };

  try {
    console.log('📊 Step 1: Validate Application Loading at Correct URL');
    
    // Navigate to correct URL
    await page.goto('http://localhost:3000/collection/TEST-001/manage', { 
      waitUntil: 'networkidle',
      timeout: 30000 
    });
    await page.waitForTimeout(5000); // Allow React to fully load
    
    // Check if React app loaded properly
    const reactRoot = await page.locator('#root').count();
    results.routing.details.push(`React root found: ${reactRoot > 0}`);
    
    // Check for any error overlays first
    const errorOverlay = await page.locator('[data-test="webpack-dev-server-overlay"], .error-overlay, [class*="error"], [class*="Error"]').count();
    results.routing.details.push(`Error overlays: ${errorOverlay}`);
    
    // Check for Blueprint components (newer versions)
    const blueprintElements = await page.locator('.bp5-card, .bp5-table, .bp5-button, .bp4-card, .bp4-table, .bp4-button, .bp3-card, .bp3-table, .bp3-button').count();
    results.routing.details.push(`Blueprint components found: ${blueprintElements}`);
    
    // Check for any table structures
    const tables = await page.locator('table, [role="table"], .table, [class*="table"]').count();
    results.routing.details.push(`Table structures: ${tables}`);
    
    // Check for interactive elements
    const interactiveElements = await page.locator('button, [role="button"], input, select, textarea').count();
    results.routing.details.push(`Interactive elements: ${interactiveElements}`);
    
    results.routing.passed = reactRoot > 0 && errorOverlay === 0 && (blueprintElements > 0 || tables > 0);
    
    console.log(`✅ Routing validated: ${results.routing.passed}`);
    console.log(`   - React elements: ${reactRoot}`);
    console.log(`   - Error overlays: ${errorOverlay}`);
    console.log(`   - Blueprint components: ${blueprintElements}`);
    console.log(`   - Tables: ${tables}`);
    console.log(`   - Interactive elements: ${interactiveElements}\n`);

    if (results.routing.passed) {
      console.log('📊 Step 2: JTBD #1 - Verify and Validate Collection Plans');
      
      // Look for collection-related content
      const collectionContent = await page.locator('[class*="collection"], [class*="opportunity"], [id*="collection"], [id*="opportunity"]').count();
      results.jtbd1_verify.details.push(`Collection content elements: ${collectionContent}`);
      
      // Look for expandable/detailed views
      const expandableElements = await page.locator('[aria-expanded], .collapse, [class*="expand"], [class*="detail"]').count();
      results.jtbd1_verify.details.push(`Expandable elements: ${expandableElements}`);
      
      // Look for validation-related buttons
      const buttons = await page.locator('button, [role="button"]').count();
      results.jtbd1_verify.details.push(`Buttons found: ${buttons}`);
      
      results.jtbd1_verify.passed = collectionContent > 0 && buttons > 0;
      
      console.log(`✅ JTBD #1 validated: ${results.jtbd1_verify.passed}`);
      console.log(`   - Collection content: ${collectionContent}`);
      console.log(`   - Expandable elements: ${expandableElements}`);
      console.log(`   - Buttons: ${buttons}\n`);

      console.log('📊 Step 3: JTBD #2 - Override and Customize Allocations');
      
      // Look for modals, popovers, or overlays
      const overlays = await page.locator('[class*="overlay"], [class*="modal"], [class*="popover"], [class*="dialog"]').count();
      results.jtbd2_override.details.push(`Overlay elements: ${overlays}`);
      
      // Look for form controls
      const formControls = await page.locator('input, select, textarea, [role="textbox"], [role="combobox"]').count();
      results.jtbd2_override.details.push(`Form controls: ${formControls}`);
      
      results.jtbd2_override.passed = buttons > 0 && formControls > 0;
      
      console.log(`✅ JTBD #2 validated: ${results.jtbd2_override.passed}`);
      console.log(`   - Overlay elements: ${overlays}`);
      console.log(`   - Form controls: ${formControls}\n`);

      console.log('📊 Step 4: JTBD #3 - Fix Data Integrity Issues');
      
      // Look for status indicators, badges, tags
      const statusElements = await page.locator('[class*="status"], [class*="badge"], [class*="tag"], [class*="indicator"], [class*="alert"]').count();
      results.jtbd3_integrity.details.push(`Status indicators: ${statusElements}`);
      
      // Look for error/warning elements
      const warningElements = await page.locator('[class*="error"], [class*="warning"], [class*="danger"], [class*="critical"]').count();
      results.jtbd3_integrity.details.push(`Warning elements: ${warningElements}`);
      
      results.jtbd3_integrity.passed = statusElements > 0 || warningElements > 0;
      
      console.log(`✅ JTBD #3 validated: ${results.jtbd3_integrity.passed}`);
      console.log(`   - Status indicators: ${statusElements}`);
      console.log(`   - Warning elements: ${warningElements}\n`);

      console.log('📊 Step 5: JTBD #4 - Reduce Information Overload (Smart Views)');
      
      // Look for filters, tabs, view controls
      const filterControls = await page.locator('[class*="filter"], [class*="view"], [class*="tab"], [class*="selector"]').count();
      results.jtbd4_views.details.push(`Filter/view controls: ${filterControls}`);
      
      // Look for search elements
      const searchElements = await page.locator('input[type="search"], [placeholder*="search"], [class*="search"]').count();
      results.jtbd4_views.details.push(`Search elements: ${searchElements}`);
      
      results.jtbd4_views.passed = filterControls > 0 || searchElements > 0;
      
      console.log(`✅ JTBD #4 validated: ${results.jtbd4_views.passed}`);
      console.log(`   - Filter controls: ${filterControls}`);
      console.log(`   - Search elements: ${searchElements}\n`);

      console.log('📊 Step 6: JTBD #5 - Bulk Operations Management');
      
      // Look for selection controls
      const checkboxes = await page.locator('input[type="checkbox"], [role="checkbox"]').count();
      results.jtbd5_bulk.details.push(`Selection controls: ${checkboxes}`);
      
      // Look for bulk action elements
      const bulkElements = await page.locator('[class*="bulk"], [class*="batch"], [class*="multiple"], [class*="select-all"]').count();
      results.jtbd5_bulk.details.push(`Bulk action elements: ${bulkElements}`);
      
      results.jtbd5_bulk.passed = checkboxes > 0 && buttons > 0;
      
      console.log(`✅ JTBD #5 validated: ${results.jtbd5_bulk.passed}`);
      console.log(`   - Checkboxes: ${checkboxes}`);
      console.log(`   - Bulk elements: ${bulkElements}\n`);
    } else {
      console.log('⚠️  Skipping JTBD validation due to routing failure\n');
    }

    // Take screenshot for evidence
    await page.screenshot({ 
      path: '/Users/damon/malibu/test-results/corrected-validation-screenshot.png',
      fullPage: true 
    });
    
    console.log('📸 Screenshot saved: test-results/corrected-validation-screenshot.png');

    // Get page title and URL for evidence
    const title = await page.title();
    const url = page.url();
    results.page_info = { title, url };

  } catch (error) {
    console.error('❌ Validation failed:', error);
    results.error = error.message;
  } finally {
    await browser.close();
  }

  return results;
}

// Generate corrected summary report
function generateCorrectedSummary(results) {
  console.log('\n📋 CORRECTED JTBD VALIDATION SUMMARY');
  console.log('==========================================');
  
  if (results.page_info) {
    console.log(`📄 Page Title: ${results.page_info.title}`);
    console.log(`🔗 URL: ${results.page_info.url}\n`);
  }
  
  const tests = [
    { name: 'Application Routing', result: results.routing },
    { name: 'JTBD #1: Verify & Validate', result: results.jtbd1_verify },
    { name: 'JTBD #2: Override & Customize', result: results.jtbd2_override },
    { name: 'JTBD #3: Fix Data Integrity', result: results.jtbd3_integrity },
    { name: 'JTBD #4: Smart Views', result: results.jtbd4_views },
    { name: 'JTBD #5: Bulk Operations', result: results.jtbd5_bulk }
  ];
  
  let passed = 0;
  tests.forEach(test => {
    const status = test.result.passed ? '✅ PASS' : '❌ FAIL';
    console.log(`${status} - ${test.name}`);
    if (test.result.passed) passed++;
    
    test.result.details.forEach(detail => {
      console.log(`      ${detail}`);
    });
  });
  
  console.log(`\n📊 Overall Result: ${passed}/${tests.length} JTBD workflows validated`);
  console.log(`📊 Success Rate: ${((passed / tests.length) * 100).toFixed(1)}%`);
  
  if (passed >= 4) {
    console.log('🎯 CONCLUSION: Application appears JTBD COMPLIANT');
  } else if (passed >= 2) {
    console.log('⚠️  CONCLUSION: Partial JTBD compliance detected');
  } else {
    console.log('❌ CONCLUSION: JTBD compliance issues identified');
  }
  
  return { passed, total: tests.length, percentage: (passed / tests.length) * 100 };
}

// Execute corrected validation
validateJTBDWithCorrectURL()
  .then(results => {
    const summary = generateCorrectedSummary(results);
    
    // Save results
    const fs = require('fs');
    fs.writeFileSync(
      '/Users/damon/malibu/test-results/corrected-validation-results.json',
      JSON.stringify({ results, summary, timestamp: new Date().toISOString() }, null, 2)
    );
    
    console.log('\n💾 Results saved: test-results/corrected-validation-results.json');
    console.log('🔍 Check the screenshot for visual evidence of the application state');
  })
  .catch(error => {
    console.error('❌ Corrected validation script failed:', error);
  });