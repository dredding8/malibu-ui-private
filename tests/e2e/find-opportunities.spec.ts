import { test, expect } from '@playwright/test';

test('find collection opportunities hub', async ({ page }) => {
  // Start from home
  await page.goto('http://localhost:3000');
  await page.waitForTimeout(2000);
  
  // Try to find Collections button
  const collectionsButton = page.locator('button:has-text("Collections")');
  if (await collectionsButton.isVisible()) {
    await collectionsButton.click();
    await page.waitForTimeout(2000);
    console.log('Clicked Collections, URL:', page.url());
    await page.screenshot({ path: 'test-results/screenshots/collections-page.png', fullPage: true });
  }
  
  // Look for any links or buttons related to opportunities
  const opportunityLinks = await page.locator('a, button').filter({ hasText: /opportunit|manage|view|edit/i }).all();
  console.log('Found opportunity-related links:', opportunityLinks.length);
  
  for (const link of opportunityLinks.slice(0, 5)) {
    const text = await link.textContent();
    console.log('Link text:', text);
  }
  
  // Try direct navigation to CollectionOpportunitiesHub
  await page.goto('http://localhost:3000/collection/123/opportunities');
  await page.waitForTimeout(2000);
  console.log('Direct navigation URL:', page.url());
  await page.screenshot({ path: 'test-results/screenshots/direct-opportunities.png', fullPage: true });
  
  // Check what's rendered
  const pageContent = await page.evaluate(() => {
    return {
      bodyText: document.body.innerText.substring(0, 500),
      componentsFound: {
        collectionHub: !!document.querySelector('.collection-opportunities-hub'),
        enhancedTable: !!document.querySelector('.collection-opportunities-enhanced'),
        navbar: !!document.querySelector('.opportunities-navbar'),
        table: !!document.querySelector('.opportunities-table-enhanced'),
        anyTable: !!document.querySelector('table'),
        appNavbar: !!document.querySelector('[class*="navbar"]')
      },
      allClasses: Array.from(document.querySelectorAll('[class]'))
        .map(el => el.className)
        .filter(c => c.includes('opportunit'))
        .slice(0, 10)
    };
  });
  
  console.log('Page Content:', JSON.stringify(pageContent, null, 2));
  
  // Try to find the CollectionOpportunitiesEnhanced component
  const enhancedComponent = page.locator('.collection-opportunities-enhanced');
  if (await enhancedComponent.isVisible()) {
    console.log('Found CollectionOpportunitiesEnhanced component!');
    
    // Look for specific elements
    const manageText = await page.locator('text="Manage Opportunities"').isVisible();
    console.log('Found "Manage Opportunities":', manageText);
    
    const editButtons = await page.locator('button[aria-label="Quick Edit"]').count();
    console.log('Edit buttons found:', editButtons);
    
    const reallocateButtons = await page.locator('button[aria-label="Reallocate"]').count();
    console.log('Reallocate buttons found:', reallocateButtons);
  }
});