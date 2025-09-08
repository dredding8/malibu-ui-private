import { test, expect } from '@playwright/test';

/**
 * Terminology Consistency Validation Tests
 * Ensures standardized terminology across the application
 * 
 * Key terminology changes:
 * - "Match Review" → "Field Mapping Review"
 * - "Review Matches" → "Select Collection Opportunities"
 * - Consistent button labels and navigation text
 */

test.describe('Terminology Consistency Validation', () => {
  test.describe('Field Mapping Review Terminology', () => {
    test('should not contain any references to "Match Review"', async ({ page }) => {
      // Check all main pages
      const pagesToCheck = [
        '/',
        '/history',
        '/decks',
        '/analytics'
      ];

      for (const pageUrl of pagesToCheck) {
        await page.goto(pageUrl);
        await page.waitForLoadState('networkidle');
        
        // Search for old terminology in page content
        const content = await page.content();
        expect(content).not.toContain('Match Review');
        expect(content).not.toContain('match-review');
        expect(content).not.toContain('matchReview');
      }
    });

    test('should use "Field Mapping Review" consistently in History table', async ({ page }) => {
      await page.goto('/history');
      await page.waitForSelector('[data-testid="history-table-container"]');
      
      // Check button text
      const fieldMappingButtons = await page.locator('button:has-text("Field Mappings")').count();
      expect(fieldMappingButtons).toBeGreaterThan(0);
      
      // Check tooltip text
      const tooltip = page.locator('text=Review field mapping relationships and data transformations');
      await expect(tooltip).toHaveCount(await page.locator('[data-testid^="view-mappings-"]').count());
    });

    test('should use correct page title in Field Mapping Review', async ({ page }) => {
      await page.goto('/history/test-collection/field-mapping-review');
      
      // Check page heading
      await expect(page.locator('h3')).toContainText('Field Mapping Review');
      
      // Check breadcrumbs
      const breadcrumb = page.locator('.bp6-breadcrumb').filter({ hasText: 'Field Mapping Review' });
      await expect(breadcrumb).toBeVisible();
    });
  });

  test.describe('Collection Opportunities Terminology', () => {
    test('should not contain "Review Matches" in wizard', async ({ page }) => {
      await page.goto('/create-collection-deck/collection-opportunities');
      
      // Check step heading
      const heading = page.locator('[data-testid="step3-heading"]');
      await expect(heading).toContainText('Select Collection Opportunities');
      await expect(heading).not.toContainText('Review Matches');
      
      // Check progress indicators
      const stepIndicator = page.locator('[data-testid="step-3-name"]');
      await expect(stepIndicator).toContainText('Select Collection Opportunities');
    });

    test('should use "Collection Opportunities" in History table buttons', async ({ page }) => {
      await page.goto('/history');
      await page.waitForSelector('[data-testid="history-table-container"]');
      
      // Check button text
      const opportunityButtons = await page.locator('button:has-text("Collection Opportunities")').count();
      expect(opportunityButtons).toBeGreaterThan(0);
      
      // Check tooltip
      const tooltip = page.locator('text=View satellite collection opportunities and passes');
      await expect(tooltip).toHaveCount(await page.locator('[data-testid^="view-opportunities-"]').count());
    });
  });

  test.describe('Navigation Label Consistency', () => {
    test('should use consistent main navigation labels', async ({ page }) => {
      await page.goto('/');
      
      // Check navbar labels
      await expect(page.locator('[data-testid="nav-dashboard"]')).toContainText('Data Sources');
      await expect(page.locator('[data-testid="nav-sccs"]')).toContainText('SCCs');
      await expect(page.locator('[data-testid="nav-collections"]')).toContainText('Collections');
      await expect(page.locator('[data-testid="nav-history"]')).toContainText('History');
      await expect(page.locator('[data-testid="nav-analytics"]')).toContainText('Analytics');
    });

    test('should use consistent breadcrumb labels', async ({ page }) => {
      // Test Create Collection Deck breadcrumbs
      await page.goto('/create-collection-deck/data');
      
      const breadcrumbs = page.locator('.bp6-breadcrumb');
      await expect(breadcrumbs.nth(0)).toContainText('Data Sources');
      await expect(breadcrumbs.nth(1)).toContainText('Collection Decks');
      await expect(breadcrumbs.nth(2)).toContainText('Create Collection');
    });

    test('should use consistent wizard step names', async ({ page }) => {
      await page.goto('/create-collection-deck/data');
      
      // Check step names in progress indicators
      await expect(page.locator('[data-testid="step-1-name"]')).toContainText('Set Up Your Data');
      await expect(page.locator('[data-testid="step-2-name"]')).toContainText('Choose Your Settings');
      await expect(page.locator('[data-testid="step-3-name"]')).toContainText('Select Collection Opportunities');
      await expect(page.locator('[data-testid="step-4-name"]')).toContainText('Add Final Details');
    });
  });

  test.describe('Button Text Consistency', () => {
    test('should use consistent action button labels', async ({ page }) => {
      await page.goto('/history');
      
      // Check primary actions
      await expect(page.locator('button:has-text("Create Collection")')).toBeVisible();
      await expect(page.locator('button:has-text("Export Results")')).toBeVisible();
      
      // Check table actions
      const viewCollectionButtons = await page.locator('button:has-text("View Collection")').count();
      expect(viewCollectionButtons).toBeGreaterThan(0);
    });

    test('should use consistent navigation button labels', async ({ page }) => {
      // Check Field Mapping Review
      await page.goto('/history/test-collection/field-mapping-review');
      await expect(page.locator('button:has-text("Back to History")')).toBeVisible();
      
      // Check Collection Opportunities View
      await page.goto('/history/test-collection/collection-opportunities');
      await expect(page.locator('button:has-text("Back to History")')).toBeVisible();
      await expect(page.locator('button:has-text("Field Mappings")')).toBeVisible();
    });
  });

  test.describe('Cross-Page Terminology Validation', () => {
    test('should maintain terminology consistency during navigation flow', async ({ page }) => {
      // Start at History
      await page.goto('/history');
      
      // Click Collection Opportunities
      const opportunitiesBtn = page.locator('[data-testid^="view-opportunities-"]').first();
      await opportunitiesBtn.click();
      
      // Verify page loaded with correct terminology
      await expect(page.locator('.bp6-breadcrumb').last()).toContainText('Collection Opportunities');
      
      // Navigate to Field Mappings
      await page.click('button:has-text("Field Mappings")');
      
      // Verify correct terminology
      await expect(page.locator('h3')).toContainText('Field Mapping Review');
      await expect(page.locator('.bp6-breadcrumb').last()).toContainText('Field Mapping Review');
    });

    test('should use consistent terminology in error states', async ({ page }) => {
      // Navigate to invalid field mapping review
      await page.goto('/history/invalid-id/field-mapping-review');
      
      // If error message is shown, it should use correct terminology
      const errorMessage = page.locator('text=/field mapping|Field Mapping/i');
      if (await errorMessage.isVisible()) {
        await expect(errorMessage).not.toContainText('Match Review');
      }
    });
  });
});