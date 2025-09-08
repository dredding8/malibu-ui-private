import { test, expect } from '@playwright/test';

test.describe('VUE Dashboard - Simple Fix Validation', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');
    
    // Remove webpack overlay if present
    await page.evaluate(() => {
      const overlay = document.getElementById('webpack-dev-server-client-overlay');
      if (overlay) {
        overlay.remove();
      }
    });
  });

  test('Navigation elements exist with proper test IDs', async ({ page }) => {
    // Check that navigation buttons exist with proper test IDs
    const navElements = [
      'nav-master',
      'nav-sccs', 
      'nav-decks',
      'nav-history',
      'nav-analytics',
      'nav-logout'
    ];

    for (const testId of navElements) {
      const element = page.locator(`[data-testid="${testId}"]`);
      await expect(element).toBeVisible();
      console.log(`✓ Found navigation element: ${testId}`);
    }
  });

  test('Form elements exist with proper test IDs', async ({ page }) => {
    // Check that form elements exist
    const formElements = [
      'search-input',
      'update-master-button',
      'create-deck-button', 
      'add-scc-button'
    ];

    for (const testId of formElements) {
      const element = page.locator(`[data-testid="${testId}"]`);
      await expect(element).toBeVisible();
      console.log(`✓ Found form element: ${testId}`);
    }
  });

  test('Blueprint v6 classes are properly applied', async ({ page }) => {
    // Check for Blueprint v6 classes - use a more specific selector
    const bp6Elements = await page.locator('[class*="bp6-"]').count();
    expect(bp6Elements).toBeGreaterThan(0);
    console.log(`✓ Found ${bp6Elements} Blueprint v6 elements`);

    // Check specific classes
    await expect(page.locator('.bp6-navbar')).toBeVisible();
    await expect(page.locator('.bp6-dark')).toBeVisible();
    console.log('✓ Found .bp6-navbar and .bp6-dark classes');
  });

  test('App loads without errors', async ({ page }) => {
    // Check that the app loads properly
    await expect(page.locator('#root')).toBeVisible();
    
    // Check for VUE Dashboard title
    await expect(page.locator('text=VUE Dashboard')).toBeVisible();
    
    // Check for main content areas
    await expect(page.locator('text=Search SCCs')).toBeVisible();
    await expect(page.locator('text=Actions')).toBeVisible();
    
    console.log('✓ App loads successfully with main content');
  });

  test('History page navigation works', async ({ page }) => {
    // Navigate to History page
    await page.click('[data-testid="nav-history"]');
    await page.waitForLoadState('networkidle');
    
    // Check that we're on the history page
    await expect(page.locator('text=Date Range Filter')).toBeVisible();
    await expect(page.locator('text=Active and Recent Jobs')).toBeVisible();
    
    console.log('✓ Successfully navigated to History page');
  });

  test('History page form elements exist', async ({ page }) => {
    // Navigate to History page
    await page.click('[data-testid="nav-history"]');
    await page.waitForLoadState('networkidle');
    
    // Check that we're on the history page first
    await expect(page.locator('text=Date Range Filter')).toBeVisible();
    
    // Check for DateInput components (they render as divs with specific classes)
    const dateInputs = await page.locator('.bp6-date-input').count();
    expect(dateInputs).toBe(2); // Start date and end date
    console.log(`✓ Found ${dateInputs} DateInput components`);
    
    // Check for buttons with test IDs
    const resetButton = page.locator('[data-testid="reset-dates-button"]');
    const applyButton = page.locator('[data-testid="apply-filter-button"]');
    await expect(resetButton).toBeVisible();
    await expect(applyButton).toBeVisible();
    console.log('✓ Found Reset and Apply Filter buttons');
    
    // Check for history table container
    const tableContainer = page.locator('[data-testid="history-table-container"]');
    await expect(tableContainer).toBeVisible();
    console.log('✓ Found history table container');
  });

  test('Create Collection Deck navigation works', async ({ page }) => {
    // Navigate to Create Collection Deck
    await page.click('[data-testid="create-deck-button"]');
    await page.waitForLoadState('networkidle');
    
    // Check that we're on the create deck page
    await expect(page.locator('[data-testid="create-deck-title"]')).toBeVisible();
    await expect(page.locator('text=Create Collection Deck')).toBeVisible();
    
    console.log('✓ Successfully navigated to Create Collection Deck page');
  });

  test('Create Collection Deck form elements exist', async ({ page }) => {
    // Navigate to Create Collection Deck
    await page.click('[data-testid="create-deck-button"]');
    await page.waitForLoadState('networkidle');
    
    // Check that we're on the create deck page first
    await expect(page.locator('[data-testid="create-deck-title"]')).toBeVisible();
    
    // Check for elements that have test IDs
    const elementsWithTestIds = [
      'deck-name-input',
      'tle-source-select',
      'sites-source-select',
      'next-button',
      'cancel-button'
    ];

    for (const testId of elementsWithTestIds) {
      const element = page.locator(`[data-testid="${testId}"]`);
      await expect(element).toBeVisible();
      console.log(`✓ Found Create Deck element: ${testId}`);
    }
    
    // Check for DateInput components (they render as divs with specific classes)
    const dateInputs = await page.locator('.bp6-date-input').count();
    expect(dateInputs).toBe(2); // Start date and end date
    console.log(`✓ Found ${dateInputs} DateInput components`);
    
    // Check for other form elements that might not have test IDs
    const tleDataTextarea = page.locator('[data-testid="tle-data-textarea"]');
    await expect(tleDataTextarea).toBeVisible();
    console.log('✓ Found TLE data textarea');
  });

  test('Search functionality works', async ({ page }) => {
    const searchInput = page.locator('[data-testid="search-input"]');
    
    // Type in search
    await searchInput.fill('test search');
    await expect(searchInput).toHaveValue('test search');
    
    console.log('✓ Search input accepts text');
  });

  test('All pages are accessible', async ({ page }) => {
    const pages = [
      { testId: 'nav-sccs', expectedText: 'SCCs Master List', selector: 'h3' },
      { testId: 'nav-decks', expectedText: 'Collection Decks', selector: 'h3' },
      { testId: 'nav-history', expectedText: 'Date Range Filter', selector: 'h5' },
      { testId: 'nav-analytics', expectedText: 'Analytics', selector: 'h3' }
    ];

    for (const pageInfo of pages) {
      // Navigate to each page
      await page.click(`[data-testid="${pageInfo.testId}"]`);
      await page.waitForLoadState('networkidle');
      
      // Check that the page loaded with more specific selector
      await expect(page.locator(`${pageInfo.selector}:has-text("${pageInfo.expectedText}")`)).toBeVisible();
      console.log(`✓ Successfully navigated to ${pageInfo.testId}`);
      
      // Navigate back to dashboard using browser back instead of button click
      await page.goBack();
      await page.waitForLoadState('networkidle');
      
      // Verify we're back on dashboard
      await expect(page.locator('text=Search SCCs')).toBeVisible();
    }
  });
});
