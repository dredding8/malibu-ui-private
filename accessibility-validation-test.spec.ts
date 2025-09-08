/**
 * Quick Accessibility Validation Test
 * 
 * Validates the specific accessibility fixes implemented:
 * - aria-label attributes on form inputs
 * - Progress bar accessibility
 * - Landmark structure with main element
 * - Select elements with accessible names
 */

import { test, expect } from '@playwright/test';

test.describe('Accessibility Validation', () => {
  
  test('Form inputs have proper aria-labels', async ({ page }) => {
    // Navigate to create collection deck via dashboard
    await page.goto('/');
    await page.click('[data-testid="create-deck-button"]');
    await page.waitForLoadState('networkidle');
    
    // Validate deck name input has aria-label
    const deckNameInput = page.locator('[data-testid="deck-name-input"]');
    await expect(deckNameInput).toHaveAttribute('aria-label', 'Collection deck name');
    
    // Validate date inputs have aria-labels
    const startDateInput = page.locator('[data-testid="start-date-input"]');
    await expect(startDateInput).toHaveAttribute('aria-label', 'Collection start date');
    
    const endDateInput = page.locator('[data-testid="end-date-input"]');
    await expect(endDateInput).toHaveAttribute('aria-label', 'Collection end date');
    
    // Validate select elements have aria-labels
    const tleSourceSelect = page.locator('[data-testid="tle-source-select"]');
    await expect(tleSourceSelect).toHaveAttribute('aria-label', 'TLE data source selection');
    
    const sitesSourceSelect = page.locator('[data-testid="sites-source-select"]');
    await expect(sitesSourceSelect).toHaveAttribute('aria-label', 'Unavailable sites data source selection');
  });
  
  test('Progress bar has accessible name', async ({ page }) => {
    await page.goto('/');
    await page.click('[data-testid="create-deck-button"]');
    await page.waitForLoadState('networkidle');
    
    const progressBar = page.locator('[data-testid="progress-bar"]');
    await expect(progressBar).toHaveAttribute('aria-label');
    
    // Validate the aria-label contains step information
    const ariaLabel = await progressBar.getAttribute('aria-label');
    expect(ariaLabel).toContain('Step');
    expect(ariaLabel).toContain('of 4');
  });
  
  test('Main landmark structure exists', async ({ page }) => {
    await page.goto('/');
    await page.click('[data-testid="create-deck-button"]');
    await page.waitForLoadState('networkidle');
    
    // Validate main element exists
    const mainElement = page.locator('main');
    await expect(mainElement).toBeVisible();
    
    // Validate main contains the main content
    await expect(mainElement.locator('[data-testid="create-deck-title"]')).toBeVisible();
    await expect(mainElement.locator('[data-testid="progress-card"]')).toBeVisible();
  });
  
  test('Keyboard navigation reaches form inputs', async ({ page }) => {
    await page.goto('/');
    await page.click('[data-testid="create-deck-button"]');
    await page.waitForLoadState('networkidle');
    
    // Test keyboard navigation to deck name input
    await page.keyboard.press('Tab');
    await page.keyboard.type('Keyboard Test Collection');
    
    // Validate the input received focus and value
    const deckNameInput = page.locator('[data-testid="deck-name-input"]');
    await expect(deckNameInput).toHaveValue('Keyboard Test Collection');
    
    // Validate input is focused
    await expect(deckNameInput).toBeFocused();
  });
});