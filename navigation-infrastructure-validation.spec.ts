import { test, expect } from '@playwright/test';

test.describe('Wave 1: Navigation Infrastructure Validation', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('http://localhost:3000');
    await page.waitForLoadState('networkidle');
  });

  test('Blueprint breadcrumbs present on all pages', async ({ page }) => {
    const pagesToCheck = [
      { url: '/', expectedBreadcrumb: 'Data Sources' },
      { url: '/history', expectedBreadcrumb: 'History' },
      { url: '/sccs', expectedBreadcrumb: 'SCCs' },
      { url: '/decks', expectedBreadcrumb: 'Collections' },
      { url: '/analytics', expectedBreadcrumb: 'Analytics' },
    ];

    for (const pageInfo of pagesToCheck) {
      await page.goto(`http://localhost:3000${pageInfo.url}`);
      await page.waitForLoadState('networkidle');
      
      // Check for Blueprint breadcrumb component
      const breadcrumb = page.locator('.bp5-breadcrumbs');
      await expect(breadcrumb).toBeVisible();
      
      // Verify breadcrumb structure
      const breadcrumbItems = page.locator('.bp5-breadcrumb');
      await expect(breadcrumbItems).toHaveCount(2); // Data Sources + Current Page
      
      // Verify current page is highlighted
      const currentBreadcrumb = page.locator('.bp5-breadcrumb-current');
      await expect(currentBreadcrumb).toContainText(pageInfo.expectedBreadcrumb);
    }
  });

  test('standardized terminology is used consistently', async ({ page }) => {
    // Navigate to History page
    await page.goto('http://localhost:3000/history');
    
    // Check for standardized terminology
    await expect(page.locator('text="Collection Opportunities"')).toBeVisible();
    await expect(page.locator('text="Field Mapping Review"')).toBeVisible();
    
    // Verify no old terminology exists
    await expect(page.locator('text="Match Review"')).not.toBeVisible();
    await expect(page.locator('text="Review Matches"')).not.toBeVisible();
  });

  test('URL state preservation works correctly', async ({ page }) => {
    // Go to history page
    await page.goto('http://localhost:3000/history');
    
    // Apply a filter or search
    const searchInput = page.locator('input[placeholder*="Search"], input[type="search"]');
    await searchInput.fill('test-search');
    await searchInput.press('Enter');
    
    // Wait for URL to update
    await page.waitForTimeout(500);
    
    // Check URL contains search parameter
    expect(page.url()).toContain('search=test-search');
    
    // Navigate away and back
    await page.goto('http://localhost:3000/analytics');
    await page.goBack();
    
    // Verify search is preserved
    await expect(searchInput).toHaveValue('test-search');
  });

  test('navigation context provides proper metadata', async ({ page }) => {
    await page.goto('http://localhost:3000/history');
    
    // Check page context elements
    const pageTitle = page.locator('h1, [data-testid="page-title"]');
    await expect(pageTitle).toContainText('History');
    
    // Check for context-aware elements
    const contextualHelp = page.locator('[aria-label*="help"], [data-testid="contextual-help"]');
    await expect(contextualHelp).toBeVisible();
  });

  test('deep linking to collection views works', async ({ page }) => {
    // Direct navigation to collection opportunities view
    await page.goto('http://localhost:3000/history/test-collection/collection-opportunities');
    await page.waitForLoadState('networkidle');
    
    // Verify breadcrumbs show full path
    const breadcrumbs = page.locator('.bp5-breadcrumb');
    await expect(breadcrumbs).toHaveCount(4); // Data Sources > History > Collection > Opportunities
    
    // Verify page loaded correctly
    const pageTitle = page.locator('h1');
    await expect(pageTitle).toContainText('Collection Opportunities');
  });
});