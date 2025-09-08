import { test, expect } from '@playwright/test';

test('Debug Analytics Page Issue', async ({ page }) => {
  console.log('🔍 Debugging Analytics Page...');
  
  // Navigate to analytics page
  await page.goto('/analytics');
  await page.waitForLoadState('networkidle');
  await page.waitForTimeout(2000);
  
  console.log('Current URL:', page.url());
  
  // Take screenshot
  await page.screenshot({ path: 'debug-analytics.png', fullPage: true });
  
  // Check if page loads at all
  const bodyContent = await page.locator('body').textContent();
  console.log('Page has content:', bodyContent && bodyContent.length > 0);
  
  // Look for the specific text "Analytics"
  const analyticsText = page.locator('text=Analytics');
  const analyticsCount = await analyticsText.count();
  console.log('Number of "Analytics" text elements:', analyticsCount);
  
  // Check if H3 with Analytics exists
  const h3Analytics = page.locator('h3:has-text("Analytics")');
  const h3Count = await h3Analytics.count();
  const h3Visible = h3Count > 0 ? await h3Analytics.isVisible() : false;
  console.log('H3 Analytics count:', h3Count, 'visible:', h3Visible);
  
  // Check for any H3 elements
  const allH3 = page.locator('h3');
  const allH3Count = await allH3.count();
  console.log('Total H3 elements:', allH3Count);
  
  if (allH3Count > 0) {
    for (let i = 0; i < allH3Count; i++) {
      const h3Text = await allH3.nth(i).textContent();
      const h3Visible = await allH3.nth(i).isVisible();
      console.log(`H3 ${i + 1}: "${h3Text}" visible: ${h3Visible}`);
    }
  }
  
  // Check if AppNavbar is present
  const navbar = page.locator('[class*="navbar"], nav');
  const navbarCount = await navbar.count();
  console.log('Navbar elements:', navbarCount);
  
  // Check for any errors in console
  const errors: string[] = [];
  page.on('console', msg => {
    if (msg.type() === 'error') {
      errors.push(msg.text());
    }
  });
  
  await page.reload();
  await page.waitForTimeout(3000);
  
  console.log('Console errors:', errors);
  
  // Check if the page is actually rendering the Analytics component
  const analyticsClass = page.locator('.analytics');
  const analyticsClassExists = await analyticsClass.count() > 0;
  console.log('Analytics component class exists:', analyticsClassExists);
  
  // Check for Cards (should be multiple)
  const cards = page.locator('.bp4-card, [class*="card"]');
  const cardCount = await cards.count();
  console.log('Card elements found:', cardCount);
  
  // Look for any Blueprint components
  const blueprintElements = page.locator('[class*="bp4-"], [class*="bp6-"]');
  const blueprintCount = await blueprintElements.count();
  console.log('Blueprint elements found:', blueprintCount);
});