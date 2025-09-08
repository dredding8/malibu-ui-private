import { test, expect } from '@playwright/test';

test.describe('Simple UX Compliance Check', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('http://localhost:3000');
    await page.waitForLoadState('networkidle');
  });

  test('Basic navigation works', async ({ page }) => {
    // Check dashboard loads
    await expect(page).toHaveTitle(/Malibu/);
    
    // Check navigation elements exist
    const nav = page.locator('nav');
    await expect(nav).toBeVisible();
    
    // Navigate to History
    await page.click('[data-testid="nav-history"]');
    await page.waitForURL('**/history');
    await expect(page.locator('h2:has-text("History")')).toBeVisible();
    
    // Navigate to SCCs
    await page.click('[data-testid="nav-sccs"]');
    await page.waitForURL('**/sccs');
    await expect(page.locator('h2:has-text("SCCs")')).toBeVisible();
    
    // Navigate to Collections
    await page.click('[data-testid="nav-collections"]');
    await page.waitForURL('**/decks');
    await expect(page.locator('h2:has-text("Collection")')).toBeVisible();
  });

  test('Breadcrumbs exist', async ({ page }) => {
    // Check for Blueprint breadcrumbs
    const breadcrumbs = page.locator('.bp5-breadcrumbs');
    const hasBreadcrumbs = await breadcrumbs.count() > 0;
    
    console.log('Breadcrumbs found:', hasBreadcrumbs);
    
    // Check specific pages
    await page.goto('http://localhost:3000/create-collection-deck');
    await page.waitForLoadState('networkidle');
    
    const wizardBreadcrumbs = page.locator('.bp5-breadcrumbs');
    const hasWizardBreadcrumbs = await wizardBreadcrumbs.count() > 0;
    
    console.log('Wizard breadcrumbs found:', hasWizardBreadcrumbs);
  });

  test('Key UX features', async ({ page }) => {
    const results = {
      'Navigation': false,
      'Breadcrumbs': false,
      'Keyboard shortcuts': false,
      'Context help': false,
      'Progressive disclosure': false,
      'Performance monitoring': false,
      'Enhanced navigation context': false,
      'Standardized terminology': false
    };

    // Check navigation
    results['Navigation'] = await page.locator('nav').isVisible();

    // Check breadcrumbs
    results['Breadcrumbs'] = await page.locator('.bp5-breadcrumbs').count() > 0;

    // Check keyboard shortcuts
    const hasKeyboardProvider = await page.evaluate(() => {
      return document.querySelector('[data-keyboard-navigation]') !== null;
    });
    results['Keyboard shortcuts'] = hasKeyboardProvider;

    // Check context help
    results['Context help'] = await page.locator('.navigation-aids').count() > 0;

    // Check progressive disclosure
    results['Progressive disclosure'] = await page.locator('.progressive-disclosure').count() > 0;

    // Print results
    console.log('\n=== UX Compliance Check ===');
    for (const [feature, present] of Object.entries(results)) {
      console.log(`${present ? '✓' : '✗'} ${feature}`);
    }

    // Calculate compliance percentage
    const total = Object.keys(results).length;
    const passing = Object.values(results).filter(v => v).length;
    const percentage = Math.round((passing / total) * 100);
    
    console.log(`\nCompliance Score: ${percentage}% (${passing}/${total})`);
  });
});