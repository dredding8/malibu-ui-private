import { test, expect } from '@playwright/test';

test.describe('Phase 1 Blueprint-Only Enhancements Validation', () => {
  
  test.beforeEach(async ({ page }) => {
    await page.goto('http://localhost:3000/create-collection-deck/data');
    // Wait for page to be fully loaded
    await page.waitForSelector('[data-testid="create-deck-title"]');
  });

  test('Enhanced progress indicators display correctly', async ({ page }) => {
    // Check for enhanced progress elements
    await expect(page.locator('[data-testid="progress-summary"]')).toBeVisible();
    await expect(page.locator('[data-testid="current-step-context"]')).toBeVisible();
    await expect(page.locator('[data-testid="progress-bar"]')).toBeVisible();
    
    // Verify step indicators with icons and status
    await expect(page.locator('[data-testid="step-1-current-icon"]')).toBeVisible();
    await expect(page.locator('[data-testid="step-1-active-tag"]')).toContainText('Active');
    
    // Check contextual information is displayed
    const contextCallout = page.locator('[data-testid="current-step-context"]');
    await expect(contextCallout).toContainText('Set up your collection data sources and time window');
    await expect(contextCallout).toContainText('Estimated time remaining');
  });

  test('Modern Select components work properly', async ({ page }) => {
    // Test TLE Data source Select component
    const tleSelect = page.locator('[data-testid="tle-source-select"] button');
    await expect(tleSelect).toBeVisible();
    await expect(tleSelect).toContainText('Select source...');
    
    // Click to open dropdown
    await tleSelect.click();
    
    // Verify dropdown options with descriptions
    await expect(page.locator('text="UDL"')).toBeVisible();
    await expect(page.locator('text="Unified Data Library"')).toBeVisible();
    
    // Select an option
    await page.locator('text="UDL"').click();
    
    // Verify selection
    await expect(tleSelect).toContainText('UDL');
    
    // Test Sites source Select component
    const sitesSelect = page.locator('[data-testid="sites-source-select"] button');
    await expect(sitesSelect).toBeVisible();
    await sitesSelect.click();
    
    // Verify sites dropdown
    await expect(page.locator('text="BLUESTAT"')).toBeVisible();
    await expect(page.locator('text="Blue Force Tracking Status System"')).toBeVisible();
  });

  test('Contextual help popover functionality', async ({ page }) => {
    // Test Collection Name help
    const collectionNameHelp = page.locator('label:has-text("Collection Name") button[aria-haspopup="true"]');
    await expect(collectionNameHelp).toBeVisible();
    
    // Hover to show popover
    await collectionNameHelp.hover();
    
    // Wait for popover to appear and check content
    await page.waitForSelector('text="Collection Name Tips:"', { timeout: 3000 });
    await expect(page.locator('text="Use descriptive names like"')).toBeVisible();
    await expect(page.locator('text="Include orbit type, function, or time period"')).toBeVisible();
    
    // Move away to hide popover
    await page.locator('h1').hover();
    
    // Test Tasking Window help
    const taskingWindowHelp = page.locator('h4:has-text("Tasking Window") + * button[aria-haspopup="true"]');
    await expect(taskingWindowHelp).toBeVisible();
    
    await taskingWindowHelp.hover();
    await page.waitForSelector('text="Tasking Window Guidelines:"', { timeout: 3000 });
    await expect(page.locator('text="Longer windows provide more collection opportunities"')).toBeVisible();
    
    // Test TLE Data help  
    await page.locator('h1').hover(); // Move away first
    const tleDataHelp = page.locator('h4:has-text("TLE Data") + * button[aria-haspopup="true"]');
    await expect(tleDataHelp).toBeVisible();
    
    await tleDataHelp.hover();
    await page.waitForSelector('text="Two-Line Element (TLE) Data:"', { timeout: 3000 });
    await expect(page.locator('text="TLE data determines satellite positions"')).toBeVisible();
  });

  test('Responsive layout adapts properly', async ({ page }) => {
    // Test desktop layout
    await page.setViewportSize({ width: 1200, height: 800 });
    
    // Verify grid layouts display properly
    const taskingWindowGrid = page.locator('div:has(> [label*="Start Date"])').first();
    await expect(taskingWindowGrid).toBeVisible();
    
    // Test tablet layout
    await page.setViewportSize({ width: 768, height: 1024 });
    
    // Elements should still be visible and accessible
    await expect(page.locator('[data-testid="deck-name-input"]')).toBeVisible();
    await expect(page.locator('[data-testid="tle-source-select"]')).toBeVisible();
    
    // Test mobile layout
    await page.setViewportSize({ width: 375, height: 667 });
    
    // Verify form elements stack properly on mobile
    await expect(page.locator('[data-testid="progress-card"]')).toBeVisible();
    await expect(page.locator('[data-testid="current-step-context"]')).toBeVisible();
  });

  test('Enhanced accessibility features work', async ({ page }) => {
    // Check ARIA labels and descriptions
    const deckNameInput = page.locator('[data-testid="deck-name-input"]');
    await expect(deckNameInput).toHaveAttribute('aria-label', 'Collection deck name');
    await expect(deckNameInput).toHaveAttribute('aria-describedby', 'deck-name-help');
    
    // Verify hidden help text for screen readers
    const helpText = page.locator('#deck-name-help');
    await expect(helpText).toBeHidden(); // Hidden from visual users
    await expect(helpText).toContainText('Enter a descriptive name for your collection deck');
    
    // Check date inputs have proper accessibility
    const startDateInput = page.locator('[data-testid="start-date-input"]');
    await expect(startDateInput).toHaveAttribute('aria-label', 'Collection start date');
    await expect(startDateInput).toHaveAttribute('aria-describedby', 'start-date-help');
    
    // Test keyboard navigation
    await page.keyboard.press('Tab'); // Should focus on first input
    await expect(deckNameInput).toBeFocused();
    
    // Continue tabbing through form elements
    await page.keyboard.press('Tab');
    // Should focus on start date or next focusable element
  });

  test('Progress indicators update correctly on navigation', async ({ page }) => {
    // Fill out Step 1 form
    await page.locator('[data-testid="deck-name-input"]').fill('Test Collection ISR-LEO-2024');
    
    // Select dates
    await page.locator('[data-testid="start-date-input"] input').click();
    await page.keyboard.type('01/01/2024');
    await page.keyboard.press('Tab');
    
    await page.locator('[data-testid="end-date-input"] input').click();
    await page.keyboard.type('01/31/2024');
    await page.keyboard.press('Tab');
    
    // Select TLE source
    await page.locator('[data-testid="tle-source-select"] button').click();
    await page.locator('text="UDL"').click();
    
    // Navigate to next step
    await page.locator('[data-testid="next-button"]').click();
    
    // Wait for navigation
    await page.waitForURL('**/parameters');
    
    // Check progress indicators updated
    await expect(page.locator('[data-testid="step-1-completed-tag"]')).toContainText('Complete');
    await expect(page.locator('[data-testid="step-1-completed-icon"]')).toBeVisible();
    await expect(page.locator('[data-testid="step-2-active-tag"]')).toContainText('Active');
    await expect(page.locator('[data-testid="step-2-current-icon"]')).toBeVisible();
    
    // Check updated context
    const contextCallout = page.locator('[data-testid="current-step-context"]');
    await expect(contextCallout).toContainText('Configure your collection parameters and site requirements');
    await expect(page.locator('[data-testid="progress-summary"]')).toContainText('Step 2 of 4');
  });

});