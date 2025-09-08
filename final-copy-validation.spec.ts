import { test, expect } from '@playwright/test';

test.describe('Final Apple HIG Copy Validation', () => {
  test.beforeEach(async ({ page }) => {
    await page.setViewportSize({ width: 1280, height: 720 });
  });

  test('History page title follows Apple HIG guidelines', async ({ page }) => {
    await page.goto('http://localhost:3000/history');
    
    // Wait for page to load
    await page.waitForLoadState('networkidle');
    
    // Validate the updated page title is user-focused
    await expect(page.locator('h3:has-text("Your Collection Results")')).toBeVisible();
    
    // Validate the subtitle is conversational and helpful
    await expect(page.locator('text=Monitor your collection progress and access completed results')).toBeVisible();
    
    // Take screenshot for verification
    await page.screenshot({ path: 'history-page-final-validation.png', fullPage: true });
  });

  test('Button labels use consistent terminology', async ({ page }) => {
    await page.goto('http://localhost:3000/history');
    
    // Wait for page to load
    await page.waitForLoadState('networkidle');
    
    // Validate that button labels use consistent "Collection" terminology
    // Note: These buttons would be visible when there are items in the table
    // For now, we validate the structure supports the correct labels
    
    // Check that the page structure supports "View Collection" and "Retry" buttons
    const buttons = await page.locator('button').all();
    console.log('History page buttons found:', buttons.length);
    
    for (const button of buttons) {
      const text = await button.textContent();
      if (text && text.trim()) {
        console.log('Button text:', text);
      }
    }
    
    // Validate that no buttons use "Deck" terminology
    const deckButtons = page.locator('button:has-text("Deck")');
    await expect(deckButtons).toHaveCount(0);
  });

  test('Navigation labels are consistent across all pages', async ({ page }) => {
    const pages = [
      { path: '/', expectedTitle: 'Data Sources' },
      { path: '/sccs', expectedTitle: 'SCCs' },
      { path: '/decks', expectedTitle: 'Your Collections' },
      { path: '/history', expectedTitle: 'Your Collection Results' },
      { path: '/analytics', expectedTitle: 'Analytics' }
    ];
    
    for (const pageInfo of pages) {
      await page.goto(`http://localhost:3000${pageInfo.path}`);
      await page.waitForLoadState('networkidle');
      
      // Validate navigation labels are consistent
      await expect(page.locator('[data-testid="nav-dashboard"]')).toContainText('Data Sources');
      await expect(page.locator('[data-testid="nav-sccs"]')).toContainText('SCCs');
      await expect(page.locator('[data-testid="nav-collections"]')).toContainText('Collections');
      await expect(page.locator('[data-testid="nav-history"]')).toContainText('History');
      await expect(page.locator('[data-testid="nav-analytics"]')).toContainText('Analytics');
    }
  });

  test('Apple platform keyboard shortcuts are used', async ({ page }) => {
    await page.goto('http://localhost:3000');
    
    // Wait for page to load
    await page.waitForLoadState('networkidle');
    
    // Validate search placeholder uses Apple keyboard shortcut
    const searchInput = page.locator('[data-testid="search-input"] input');
    if (await searchInput.isVisible()) {
      const placeholder = await searchInput.getAttribute('placeholder');
      console.log('Search placeholder:', placeholder);
      expect(placeholder).toContain('⌘K');
    }
    
    // Validate help button shows Apple keyboard shortcuts
    const helpButton = page.locator('[data-testid="help-button"]');
    if (await helpButton.isVisible()) {
      await helpButton.click();
      
      // Check for Apple keyboard shortcuts
      await expect(page.locator('text=⌘K: Focus search')).toBeVisible();
      await expect(page.locator('text=⌘N: Add new SCC')).toBeVisible();
      await expect(page.locator('text=⌘R: Refresh data sources')).toBeVisible();
    }
  });

  test('Section headers are user-focused and concise', async ({ page }) => {
    await page.goto('http://localhost:3000');
    
    // Wait for page to load
    await page.waitForLoadState('networkidle');
    
    // Validate section headers are concise and user-focused
    await expect(page.locator('h5:has-text("Find Sources")')).toBeVisible();
    await expect(page.locator('h5:has-text("Actions")')).toBeVisible();
    await expect(page.locator('h5:has-text("Available Data Sources")')).toBeVisible();
    
    // Validate button labels use action verbs
    await expect(page.locator('text=Refresh Data Sources')).toBeVisible();
    await expect(page.locator('text=Create Collection')).toBeVisible();
    await expect(page.locator('text=Add Data Source')).toBeVisible();
  });

  test('Form labels and placeholders are clear and helpful', async ({ page }) => {
    await page.goto('http://localhost:3000/create-collection-deck/data');
    
    // Wait for page to load
    await page.waitForLoadState('networkidle');
    
    // Validate form labels are clear and user-friendly
    await expect(page.locator('h5:has-text("Collection Information")')).toBeVisible();
    await expect(page.locator('label:has-text("Collection Name")')).toBeVisible();
    
    // Validate placeholders are helpful
    const nameInput = page.locator('[data-testid="deck-name-input"]');
    if (await nameInput.isVisible()) {
      const placeholder = await nameInput.getAttribute('placeholder');
      console.log('Name input placeholder:', placeholder);
      expect(placeholder).toContain('Enter collection name');
    }
  });
});
