import { test, expect } from '@playwright/test';

test('Debug Create Collection Deck navigation', async ({ page }) => {
  await page.goto('/');
  await page.waitForLoadState('networkidle');
  
  // Remove webpack overlay if present
  await page.evaluate(() => {
    const overlay = document.getElementById('webpack-dev-server-client-overlay');
    if (overlay) {
      overlay.remove();
    }
  });
  
  // Check that the button exists
  const createDeckButton = page.locator('[data-testid="create-deck-button"]');
  await expect(createDeckButton).toBeVisible();
  console.log('✓ Create Collection Deck button is visible');
  
  // Click the button
  await createDeckButton.click();
  await page.waitForLoadState('networkidle');
  
  // Take a screenshot
  await page.screenshot({ path: 'debug-create-deck.png', fullPage: true });
  
  // Check the current URL
  const currentUrl = page.url();
  console.log('Current URL:', currentUrl);
  
  // Check for any console errors
  const consoleMessages = await page.evaluate(() => {
    return window.console && window.console.error ? 'Console errors present' : 'No console errors';
  });
  console.log('Console status:', consoleMessages);
  
  // Check what elements are on the page
  const pageContent = await page.evaluate(() => {
    const headings = Array.from(document.querySelectorAll('h1, h2, h3, h4, h5, h6')).map(h => ({
      tagName: h.tagName,
      textContent: h.textContent?.trim(),
      className: h.className
    }));
    
    const buttons = Array.from(document.querySelectorAll('button')).map(b => ({
      textContent: b.textContent?.trim(),
      className: b.className,
      testId: b.getAttribute('data-testid')
    }));
    
    return { headings, buttons };
  });
  
  console.log('Page headings:', pageContent.headings);
  console.log('Page buttons:', pageContent.buttons);
  
  // Check if we're still on the dashboard
  const dashboardElements = await page.locator('text=Search SCCs').count();
  const createDeckElements = await page.locator('text=Create Collection Deck').count();
  
  console.log(`Dashboard elements found: ${dashboardElements}`);
  console.log(`Create Collection Deck elements found: ${createDeckElements}`);
  
  if (dashboardElements > 0) {
    console.log('❌ Still on Dashboard page - navigation failed');
  } else if (createDeckElements > 0) {
    console.log('✅ Successfully navigated to Create Collection Deck page');
  } else {
    console.log('❓ Unknown page state');
  }
});
