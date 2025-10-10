import { test, expect } from '@playwright/test';

test('debug page structure', async ({ page }) => {
  // Try different URL patterns
  await page.goto('http://localhost:3000');
  await page.waitForTimeout(2000);
  
  console.log('Current URL:', page.url());
  
  // Capture what's on the page
  await page.screenshot({ path: 'test-results/screenshots/debug-home.png', fullPage: true });
  
  // Try to navigate to collection opportunities
  await page.goto('http://localhost:3000/collection-decks');
  await page.waitForTimeout(2000);
  await page.screenshot({ path: 'test-results/screenshots/debug-decks.png', fullPage: true });
  
  // Look for any collection deck to click on
  const deckLinks = page.locator('a[href*="/collection"], button:has-text("View")');
  const deckCount = await deckLinks.count();
  console.log('Found deck links:', deckCount);
  
  if (deckCount > 0) {
    await deckLinks.first().click();
    await page.waitForTimeout(2000);
    console.log('Navigated to:', page.url());
    await page.screenshot({ path: 'test-results/screenshots/debug-collection.png', fullPage: true });
  }
  
  // Look for opportunities or manage opportunities text
  const opportunitiesText = await page.locator('text=/opportunities|manage/i').count();
  console.log('Found opportunities text:', opportunitiesText);
  
  // Check page structure
  const pageStructure = await page.evaluate(() => {
    return {
      title: document.title,
      headers: Array.from(document.querySelectorAll('h1, h2, h3')).map(h => ({
        tag: h.tagName,
        text: h.textContent?.trim()
      })),
      navItems: Array.from(document.querySelectorAll('nav a, nav button')).map(a => a.textContent?.trim()),
      tables: document.querySelectorAll('table').length,
      buttons: Array.from(document.querySelectorAll('button')).map(b => b.textContent?.trim()).filter(t => t).slice(0, 10)
    };
  });
  
  console.log('Page Structure:', JSON.stringify(pageStructure, null, 2));
});