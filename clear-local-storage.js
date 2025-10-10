// Clear localStorage for localhost:3000
const { chromium } = require('playwright');

(async () => {
  const browser = await chromium.launch();
  const context = await browser.newContext();
  const page = await context.newPage();
  
  // Navigate to the app
  await page.goto('http://localhost:3000');
  
  // Clear localStorage
  await page.evaluate(() => {
    localStorage.clear();
    sessionStorage.clear();
    console.log('Storage cleared');
  });
  
  console.log('Successfully cleared localStorage and sessionStorage');
  
  await browser.close();
})();
