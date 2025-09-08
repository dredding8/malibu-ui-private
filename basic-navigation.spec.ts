import { test, expect } from '@playwright/test';

test.describe('Basic Navigation and Application Health', () => {
  test('should load the application successfully', async ({ page }) => {
    await page.goto('/');
    
    // Handle webpack dev server overlay if present
    try {
      await page.waitForSelector('#webpack-dev-server-client-overlay', { timeout: 1000 });
      await page.evaluate(() => {
        const overlay = document.getElementById('webpack-dev-server-client-overlay');
        if (overlay) {
          overlay.style.display = 'none';
        }
      });
    } catch (e) {
      // Overlay not present, continue
    }
    
    // Verify the main dashboard loads
    await expect(page.locator('text=VUE Dashboard')).toBeVisible();
    
    // Verify navigation elements are present (use more specific selectors)
    await expect(page.locator('button:has-text("Master")').first()).toBeVisible();
    await expect(page.locator('button:has-text("SCCs")')).toBeVisible();
    await expect(page.locator('button:has-text("Decks")')).toBeVisible();
    await expect(page.locator('button:has-text("History")')).toBeVisible();
    await expect(page.locator('button:has-text("Analytics")')).toBeVisible();
  });

  test('should navigate to Collection Decks page', async ({ page }) => {
    await page.goto('/');
    
    // Handle webpack dev server overlay if present
    try {
      await page.waitForSelector('#webpack-dev-server-client-overlay', { timeout: 1000 });
      await page.evaluate(() => {
        const overlay = document.getElementById('webpack-dev-server-client-overlay');
        if (overlay) {
          overlay.style.display = 'none';
        }
      });
    } catch (e) {
      // Overlay not present, continue
    }
    
    // Click on Decks navigation
    await page.click('button:has-text("Decks")');
    
    // Verify we're on the Collection Decks page
    await expect(page.locator('h3:has-text("Collection Decks")')).toBeVisible();
    await expect(page.locator('text=Create New Deck')).toBeVisible();
    
    // Verify tabs are present
    await expect(page.locator('[role="tab"]:has-text("In Progress")')).toBeVisible();
    await expect(page.locator('[role="tab"]:has-text("Completed")')).toBeVisible();
  });

  test('should start Create Collection Deck workflow', async ({ page }) => {
    await page.goto('/');
    
    // Handle webpack dev server overlay if present
    try {
      await page.waitForSelector('#webpack-dev-server-client-overlay', { timeout: 1000 });
      await page.evaluate(() => {
        const overlay = document.getElementById('webpack-dev-server-client-overlay');
        if (overlay) {
          overlay.style.display = 'none';
        }
      });
    } catch (e) {
      // Overlay not present, continue
    }
    
    // Navigate to Collection Decks first
    await page.click('button:has-text("Decks")');
    
    // Click Create New Deck from the Collection Decks page
    await page.click('text=Create New Deck');
    
    // Verify we're on Step 1
    await expect(page.locator('text=Step 1: Input Data')).toBeVisible();
    await expect(page.locator('text=Deck Information')).toBeVisible();
    
    // Verify form elements are present
    await expect(page.locator('[data-testid="deck-name-input"]')).toBeVisible();
    await expect(page.locator('text=Tasking Window')).toBeVisible();
  });

  test('should handle basic form interaction', async ({ page }) => {
    await page.goto('/');
    
    // Handle webpack dev server overlay if present
    try {
      await page.waitForSelector('#webpack-dev-server-client-overlay', { timeout: 1000 });
      await page.evaluate(() => {
        const overlay = document.getElementById('webpack-dev-server-client-overlay');
        if (overlay) {
          overlay.style.display = 'none';
        }
      });
    } catch (e) {
      // Overlay not present, continue
    }
    
    // Navigate to Create Collection Deck
    await page.click('button:has-text("Decks")');
    await page.click('text=Create New Deck');
    
    // Fill out basic form data
    await page.fill('[data-testid="deck-name-input"]', 'Test Deck');
    
    // Verify form elements are present
    await expect(page.locator('text=Start Date')).toBeVisible();
    await expect(page.locator('text=End Date')).toBeVisible();
    await expect(page.locator('h5:has-text("TLE Data")')).toBeVisible();
    
    // Verify Next button is present (may be disabled due to validation)
    await expect(page.locator('button:has-text("Next")')).toBeVisible();
  });

  test('should display loading state in Step 3', async ({ page }) => {
    await page.goto('/');
    
    // Handle webpack dev server overlay if present
    try {
      await page.waitForSelector('#webpack-dev-server-client-overlay', { timeout: 1000 });
      await page.evaluate(() => {
        const overlay = document.getElementById('webpack-dev-server-client-overlay');
        if (overlay) {
          overlay.style.display = 'none';
        }
      });
    } catch (e) {
      // Overlay not present, continue
    }
    
    // Navigate through the workflow
    await page.click('button:has-text("Decks")');
    await page.click('text=Create New Deck');
    
    // Fill out Step 1
    await page.fill('[data-testid="deck-name-input"]', 'Loading Test Deck');
    
    // Verify we can proceed to Step 2
    await page.click('text=Next');
    await expect(page.locator('text=Step 2: Review Parameters')).toBeVisible();
    
    // Fill out Step 2
    await page.fill('[data-testid="hard-capacity-input"]', '100');
    await page.fill('[data-testid="min-duration-input"]', '30');
    await page.fill('[data-testid="elevation-input"]', '10');
    await page.click('text=Next');
    
    // Verify loading state appears
    await expect(page.locator('[data-testid="loading-spinner"]')).toBeVisible();
    await expect(page.locator('text=Generating Matches')).toBeVisible();
    await expect(page.locator('[data-testid="loading-progress"]')).toBeVisible();
    
    // Wait for loading to complete
    await page.waitForSelector('[data-testid="loading-spinner"]', { state: 'hidden', timeout: 10000 });
    
    // Verify results are displayed
    await expect(page.locator('text=Step 3: Review Matches')).toBeVisible();
    await expect(page.locator('text=ALL (6)')).toBeVisible();
  });
});
