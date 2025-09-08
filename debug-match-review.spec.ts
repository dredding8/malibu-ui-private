import { test, expect } from '@playwright/test';

test('Debug MatchReview page content', async ({ page }) => {
  await page.goto('http://localhost:3000/match-review/test-collection/test-deck');
  
  // Take screenshot to see what's rendered
  await page.screenshot({ path: 'match-review-debug.png' });
  
  // Check page title and basic elements
  const pageTitle = await page.title();
  console.log('Page title:', pageTitle);
  
  // Look for any visible elements
  const bodyText = await page.locator('body').textContent();
  console.log('Body text preview:', bodyText?.substring(0, 500));
  
  // Check for specific Blueprint classes
  const bp4Elements = await page.locator('[class*="bp4-"]').count();
  console.log('Blueprint elements found:', bp4Elements);
  
  // Look for any cards specifically
  const cards = await page.locator('.bp4-card').count();
  console.log('BP4 Cards found:', cards);
  
  // Check all class names on page
  const allElements = await page.locator('*').all();
  const classes = new Set();
  for (const element of allElements.slice(0, 50)) { // Check first 50 elements
    const className = await element.getAttribute('class');
    if (className && className.includes('bp4-')) {
      classes.add(className);
    }
  }
  console.log('Blueprint classes found:', Array.from(classes));
  
  // Check if there are any error messages or loading states
  const errors = await page.locator('.error, .bp4-callout-danger').count();
  const loading = await page.locator('.bp4-spinner').count();
  console.log('Errors found:', errors);
  console.log('Loading spinners found:', loading);
});