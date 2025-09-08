// Simple console debugging script
const puppeteer = require('puppeteer');

(async () => {
  console.log('🔍 Starting browser console diagnostic...');
  
  const browser = await puppeteer.launch({ headless: true });
  const page = await browser.newPage();
  
  // Listen to console messages
  page.on('console', msg => {
    const type = msg.type();
    if (type === 'error' || type === 'warning' || type === 'log') {
      console.log(`[${type.toUpperCase()}] ${msg.text()}`);
    }
  });
  
  // Listen to page errors
  page.on('pageerror', error => {
    console.log(`[PAGE ERROR] ${error.message}`);
  });
  
  // Listen to request failures
  page.on('requestfailed', request => {
    console.log(`[REQUEST FAILED] ${request.method()} ${request.url()} - ${request.failure()?.errorText}`);
  });
  
  try {
    console.log('🌐 Navigating to http://localhost:3000...');
    await page.goto('http://localhost:3000', { waitUntil: 'networkidle2', timeout: 30000 });
    
    // Wait a bit more for React to mount
    await page.waitForTimeout(5000);
    
    // Check what's actually rendered
    const content = await page.evaluate(() => {
      const root = document.getElementById('root');
      return {
        hasRoot: !!root,
        rootHTML: root ? root.innerHTML.substring(0, 500) : 'NO ROOT',
        bodyText: document.body.innerText.substring(0, 200),
        title: document.title,
        errors: window.console.error?.toString() || 'no errors'
      };
    });
    
    console.log('📊 Page Content Analysis:', JSON.stringify(content, null, 2));
    
    // Take a screenshot
    await page.screenshot({ path: 'console-debug-screenshot.png' });
    console.log('📸 Screenshot saved as console-debug-screenshot.png');
    
  } catch (error) {
    console.log('❌ Error during navigation:', error.message);
  }
  
  await browser.close();
  console.log('✅ Diagnostic complete');
})();