import { chromium, FullConfig } from '@playwright/test';

async function globalTeardown(config: FullConfig) {
  const browser = await chromium.launch();
  const page = await browser.newPage();
  
  // Navigate to the application
  await page.goto('http://localhost:3000');
  
  // Clean up any test data if needed
  // For example, remove any test decks that were created
  
  // Take a final screenshot
  await page.screenshot({ path: 'test-results/final-state.png' });
  
  await browser.close();
  
  console.log('🧹 Global teardown completed');
}

export default globalTeardown;
