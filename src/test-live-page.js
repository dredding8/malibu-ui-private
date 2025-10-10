const { chromium } = require('playwright');

async function testCollectionPage() {
  console.log('🌊 Starting Live Collection Management Page Test');
  console.log('=' * 60);
  
  const browser = await chromium.launch({ 
    headless: false,
    slowMo: 1000 
  });
  
  const context = await browser.newContext({
    viewport: { width: 1920, height: 1080 }
  });
  
  const page = await context.newPage();
  
  // Track console messages and errors
  const consoleMessages = [];
  const errors = [];
  
  page.on('console', msg => {
    consoleMessages.push(`${msg.type()}: ${msg.text()}`);
    console.log(`📝 Console: ${msg.type()}: ${msg.text()}`);
  });
  
  page.on('pageerror', error => {
    errors.push(error.message);
    console.log(`🚨 Error: ${error.message}`);
  });
  
  try {
    // Navigate to the collection management page
    const targetUrl = 'http://localhost:3000/collection/TEST-001/manage';
    console.log(`📍 Navigating to: ${targetUrl}`);
    
    await page.goto(targetUrl, { waitUntil: 'networkidle', timeout: 30000 });
    
    // Wait for React to load
    console.log('⏳ Waiting for React app to initialize...');
    await page.waitForTimeout(3000);
    
    // Take initial screenshot
    await page.screenshot({ path: '/tmp/collection-page-live.png', fullPage: true });
    console.log('📸 Screenshot saved to /tmp/collection-page-live.png');
    
    // Check what actually rendered
    const pageTitle = await page.title();
    console.log(`📝 Page title: ${pageTitle}`);
    
    // Check for main app container
    const rootElement = await page.locator('#root').innerHTML();
    const hasContent = rootElement.length > 100;
    console.log(`📦 Root element has content: ${hasContent}`);
    
    // Look for specific collection management elements
    const collectionElements = await page.locator('[class*="collection"]').count();
    console.log(`🗂️ Collection-related elements found: ${collectionElements}`);
    
    // Look for opportunity-related elements  
    const opportunityElements = await page.locator('[class*="opportunit"]').count();
    console.log(`🎯 Opportunity-related elements found: ${opportunityElements}`);
    
    // Check for Blueprint UI elements
    const blueprintElements = await page.locator('[class*="bp5"], [class*="bp4"]').count();
    console.log(`🎨 Blueprint UI elements found: ${blueprintElements}`);
    
    // Check for navigation or routing indicators
    const currentUrl = page.url();
    console.log(`🧭 Current URL: ${currentUrl}`);
    
    // Look for error messages or 404 indicators
    const errorMessages = await page.locator('text=/error|404|not found/i').count();
    console.log(`🚨 Error message indicators: ${errorMessages}`);
    
    // Check if we can find the specific collection opportunities component
    const collectionOpportunities = await page.locator('.collection-opportunities').count();
    console.log(`📊 Collection opportunities component: ${collectionOpportunities}`);
    
    // Look for any data tables
    const tables = await page.locator('table, [class*="table"]').count();
    console.log(`📋 Table elements found: ${tables}`);
    
    // Test basic keyboard navigation
    console.log('⌨️ Testing keyboard navigation...');
    await page.keyboard.press('Tab');
    const focusedElement = await page.evaluate(() => {
      const focused = document.activeElement;
      return `${focused.tagName} ${focused.className}`;
    });
    console.log(`🎯 Focused element: ${focusedElement}`);
    
    // Summary of findings
    console.log('\n🎯 LIVE PAGE ASSESSMENT:');
    console.log(`   Page loads: ${currentUrl.includes('manage') ? '✅' : '❌'}`);
    console.log(`   Has content: ${hasContent ? '✅' : '❌'}`);
    console.log(`   Collection elements: ${collectionElements > 0 ? '✅' : '❌'}`);
    console.log(`   Blueprint UI: ${blueprintElements > 0 ? '✅' : '❌'}`);
    console.log(`   JavaScript errors: ${errors.length === 0 ? '✅' : '❌'}`);
    console.log(`   Data tables: ${tables > 0 ? '✅' : '❌'}`);
    
    if (errors.length > 0) {
      console.log('\n🚨 JavaScript Errors:');
      errors.forEach(error => console.log(`   - ${error}`));
    }
    
    console.log(`\n📝 Console messages: ${consoleMessages.length}`);
    if (consoleMessages.length > 0) {
      console.log('Recent messages:');
      consoleMessages.slice(-5).forEach(msg => console.log(`   ${msg}`));
    }
    
    return {
      pageLoads: currentUrl.includes('manage'),
      hasContent,
      collectionElements,
      blueprintElements,
      tables,
      errors: errors.length,
      consoleMessages: consoleMessages.length
    };
    
  } catch (error) {
    console.log(`🚨 Test failed: ${error.message}`);
    return { error: error.message };
  } finally {
    await browser.close();
  }
}

// Run the test
testCollectionPage().then(result => {
  console.log('\n📊 Final Test Result:', JSON.stringify(result, null, 2));
}).catch(error => {
  console.error('❌ Test execution failed:', error);
});