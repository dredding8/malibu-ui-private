import { test, expect } from '@playwright/test';

test.describe('Collection Management Debug', () => {
  const testCollectionId = 'DECK-1757517559289';
  const pageUrl = `/collection/${testCollectionId}/manage`;

  test('Debug page loading and content', async ({ page }) => {
    console.log('Navigating to:', pageUrl);
    
    // Track console messages
    page.on('console', msg => {
      console.log(`Console ${msg.type()}: ${msg.text()}`);
    });

    // Track network requests
    page.on('request', request => {
      console.log(`Request: ${request.method()} ${request.url()}`);
    });

    page.on('response', response => {
      console.log(`Response: ${response.status()} ${response.url()}`);
    });

    // Navigate to page
    await page.goto(pageUrl);
    console.log('Current URL:', page.url());
    
    // Wait for initial load
    await page.waitForLoadState('domcontentloaded');
    console.log('DOM loaded');
    
    // Wait for network idle
    try {
      await page.waitForLoadState('networkidle', { timeout: 10000 });
      console.log('Network idle');
    } catch (e) {
      console.log('Network not idle within 10s, continuing...');
    }

    // Check page title
    const title = await page.title();
    console.log('Page title:', title);

    // Check if React has rendered
    await page.waitForSelector('#root', { timeout: 5000 });
    console.log('React root found');

    // Check for any immediate error states
    const errorElements = await page.locator('.bp5-non-ideal-state, .error-boundary, .error').count();
    console.log('Error elements found:', errorElements);

    // Check for loading states
    const loadingElements = await page.locator('.loading-content, .bp5-spinner, .loading').count();
    console.log('Loading elements found:', loadingElements);

    // Wait for loading to finish
    if (loadingElements > 0) {
      console.log('Waiting for loading to finish...');
      try {
        await page.waitForSelector('.loading-content, .bp5-spinner, .loading', { 
          state: 'hidden', 
          timeout: 15000 
        });
        console.log('Loading finished');
      } catch (e) {
        console.log('Loading did not finish within 15s, continuing...');
      }
    }

    // Check for main content containers
    const mainSelectors = [
      '.collection-opportunities-hub',
      '.hub-content', 
      'main',
      '.app',
      '.bp5-tab-panel',
      '[role="main"]'
    ];

    for (const selector of mainSelectors) {
      const count = await page.locator(selector).count();
      console.log(`${selector}: ${count} elements`);
    }

    // Check for navigation
    const navSelectors = [
      'nav',
      '.navbar',
      '.bp5-navbar',
      '[role="navigation"]'
    ];

    for (const selector of navSelectors) {
      const count = await page.locator(selector).count();
      console.log(`${selector}: ${count} elements`);
    }

    // Check for any tab content
    const tabContent = await page.locator('.bp5-tab-panel').count();
    console.log('Tab panels found:', tabContent);

    // Get page content summary
    const bodyText = await page.locator('body').textContent();
    const hasText = bodyText && bodyText.trim().length > 0;
    console.log('Body has text content:', hasText);
    console.log('Body text length:', bodyText?.length || 0);

    // Take screenshot for debugging
    await page.screenshot({ 
      path: 'test-results/debug-screenshot.png',
      fullPage: true 
    });
    console.log('Screenshot saved to test-results/debug-screenshot.png');

    // Try to identify what's actually being rendered
    const renderedContent = await page.evaluate(() => {
      const body = document.body;
      const root = document.getElementById('root');
      return {
        bodyHtml: body?.innerHTML?.substring(0, 500),
        rootHtml: root?.innerHTML?.substring(0, 500),
        bodyClasses: body?.className,
        rootClasses: root?.className
      };
    });

    console.log('Rendered content:', JSON.stringify(renderedContent, null, 2));

    // Basic assertion that page loaded
    await expect(page.locator('body')).toBeVisible();
  });
});