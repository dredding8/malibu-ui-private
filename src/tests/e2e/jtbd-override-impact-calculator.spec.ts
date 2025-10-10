import { test, expect } from '@playwright/test';

test.describe('JTBD #2: Override Impact Calculator E2E Tests', () => {
  test.beforeEach(async ({ page }) => {
    // Navigate to the opportunities page
    await page.goto('/opportunities');
    await page.waitForSelector('[data-testid="opportunities-table"]', { timeout: 10000 });
  });

  test('Complete override workflow with impact analysis', async ({ page }) => {
    // Step 1: Filter for suboptimal opportunities
    await page.click('[data-testid="filter-suboptimal"]');
    await page.waitForSelector('[data-testid="filtered-results"]');

    // Step 2: Select a suboptimal opportunity
    await page.click('[data-testid="opportunity-row"][data-match-status="suboptimal"]:first-child');
    await page.waitForSelector('[data-testid="opportunity-details"]');

    // Step 3: Click override allocation button
    await page.click('[data-testid="override-allocation-button"]');
    await page.waitForSelector('[data-testid="override-panel"]');

    // Verify current allocation is shown
    await expect(page.locator('text=Current Allocation:')).toBeVisible();
    
    // Step 4: Select alternative site
    const siteSelector = page.locator('[data-testid="alternative-site-option"]');
    await expect(siteSelector).toBeVisible();
    
    // Select the first available option (after the placeholder)
    await siteSelector.selectOption({ index: 1 });
    await page.waitForSelector('[data-testid="site-selected"]');

    // Step 5: Calculate impact
    const calculateButton = page.locator('[data-testid="calculate-impact-button"]');
    await expect(calculateButton).toBeEnabled();
    await calculateButton.click();
    
    // Wait for impact analysis to complete
    await page.waitForSelector('[data-testid="impact-analysis-results"]', { timeout: 5000 });

    // Verify impact analysis components are present
    await expect(page.locator('text=Override Impact Analysis')).toBeVisible();
    await expect(page.locator('text=Capacity Impact')).toBeVisible();
    await expect(page.locator('text=Quality Impact')).toBeVisible();

    // Step 6: Add justification if required
    const justificationField = page.locator('[data-testid="override-justification"]');
    if (await justificationField.isVisible()) {
      await justificationField.fill('Critical mission requirement - priority override needed');
    }

    // Step 7: Confirm override
    const confirmButton = page.locator('[data-testid="confirm-override-button"]');
    await expect(confirmButton).toBeEnabled();
    await confirmButton.click();

    // Step 8: Verify success
    await page.waitForSelector('[data-testid="override-success-message"]', { timeout: 3000 });
    await expect(page.locator('[data-testid="override-success-message"]')).toBeVisible();
  });

  test('High-risk override requires justification', async ({ page }) => {
    // Navigate to an opportunity that will trigger high-risk scenario
    await page.click('[data-testid="opportunity-row"]:first-child');
    await page.click('[data-testid="override-allocation-button"]');
    await page.waitForSelector('[data-testid="override-panel"]');

    // Select a site that will cause high capacity utilization
    const siteSelector = page.locator('[data-testid="alternative-site-option"]');
    await siteSelector.selectOption({ index: 1 });

    await page.click('[data-testid="calculate-impact-button"]');
    await page.waitForSelector('[data-testid="impact-analysis-results"]');

    // Check if high-risk scenario is triggered
    const riskTag = page.locator('text=High Risk');
    if (await riskTag.isVisible()) {
      // Verify approval is required
      await expect(page.locator('text=Approval Required:')).toBeVisible();
      
      // Verify confirm button is disabled without justification
      const confirmButton = page.locator('[data-testid="confirm-override-button"]');
      await expect(confirmButton).toBeDisabled();

      // Add justification
      const justificationField = page.locator('[data-testid="override-justification"]');
      await justificationField.fill('Emergency requirement - approved by mission commander. Risk mitigation strategies in place.');

      // Verify button is now enabled
      await expect(confirmButton).toBeEnabled();
      
      // Button should show "Submit for Approval"
      await expect(confirmButton).toContainText('Submit for Approval');
    }
  });

  test('Low-risk override proceeds without justification', async ({ page }) => {
    await page.click('[data-testid="opportunity-row"]:first-child');
    await page.click('[data-testid="override-allocation-button"]');
    await page.waitForSelector('[data-testid="override-panel"]');

    const siteSelector = page.locator('[data-testid="alternative-site-option"]');
    await siteSelector.selectOption({ index: 1 });

    await page.click('[data-testid="calculate-impact-button"]');
    await page.waitForSelector('[data-testid="impact-analysis-results"]');

    // Check for low-risk scenario
    const riskTag = page.locator('text=Low Risk');
    if (await riskTag.isVisible()) {
      // Should not require justification
      await expect(page.locator('text=Approval Required:')).not.toBeVisible();
      
      // Confirm button should be enabled and show "Confirm Override"
      const confirmButton = page.locator('[data-testid="confirm-override-button"]');
      await expect(confirmButton).toBeEnabled();
      await expect(confirmButton).toContainText('Confirm Override');
    }
  });

  test('Impact analysis shows capacity implications', async ({ page }) => {
    await page.click('[data-testid="opportunity-row"]:first-child');
    await page.click('[data-testid="override-allocation-button"]');
    await page.waitForSelector('[data-testid="override-panel"]');

    const siteSelector = page.locator('[data-testid="alternative-site-option"]');
    await siteSelector.selectOption({ index: 1 });

    await page.click('[data-testid="calculate-impact-button"]');
    await page.waitForSelector('[data-testid="impact-analysis-results"]');

    // Verify capacity impact table is shown
    await expect(page.locator('text=Capacity Impact')).toBeVisible();
    await expect(page.locator('text=Original Site')).toBeVisible();
    await expect(page.locator('text=Proposed Site')).toBeVisible();

    // Verify progress bars for capacity utilization
    const progressBars = page.locator('.bp4-progress-bar');
    await expect(progressBars).toHaveCount(2); // One for original, one for proposed

    // Verify percentage values are shown
    const percentagePattern = /\d+\.\d+%/;
    const percentageElements = page.locator('text=' + percentagePattern.source);
    await expect(percentageElements.first()).toBeVisible();
  });

  test('Impact analysis detects conflicts', async ({ page }) => {
    // This test assumes there are opportunities that will create conflicts
    await page.click('[data-testid="opportunity-row"]:first-child');
    await page.click('[data-testid="override-allocation-button"]');
    await page.waitForSelector('[data-testid="override-panel"]');

    const siteSelector = page.locator('[data-testid="alternative-site-option"]');
    await siteSelector.selectOption({ index: 1 });

    await page.click('[data-testid="calculate-impact-button"]');
    await page.waitForSelector('[data-testid="impact-analysis-results"]');

    // Check if conflicts are detected
    const conflictsSection = page.locator('text=Scheduling Conflicts');
    if (await conflictsSection.isVisible()) {
      // Verify conflict details are shown
      await expect(page.locator('[class*="conflict-item"]')).toBeVisible();
      
      // Verify conflict has opportunity ID and reason
      await expect(page.locator('text=Opportunity')).toBeVisible();
      await expect(page.locator('text=priority')).toBeVisible();
    }
  });

  test('Recommendations are provided based on risk factors', async ({ page }) => {
    await page.click('[data-testid="opportunity-row"]:first-child');
    await page.click('[data-testid="override-allocation-button"]');
    await page.waitForSelector('[data-testid="override-panel"]');

    const siteSelector = page.locator('[data-testid="alternative-site-option"]');
    await siteSelector.selectOption({ index: 1 });

    await page.click('[data-testid="calculate-impact-button"]');
    await page.waitForSelector('[data-testid="impact-analysis-results"]');

    // Verify recommendations section
    await expect(page.locator('text=Recommendations')).toBeVisible();
    
    // Should have at least one recommendation
    const recommendationsList = page.locator('ul >> li');
    await expect(recommendationsList.first()).toBeVisible();
  });

  test('Quality impact is analyzed and displayed', async ({ page }) => {
    await page.click('[data-testid="opportunity-row"]:first-child');
    await page.click('[data-testid="override-allocation-button"]');
    await page.waitForSelector('[data-testid="override-panel"]');

    const siteSelector = page.locator('[data-testid="alternative-site-option"]');
    await siteSelector.selectOption({ index: 1 });

    await page.click('[data-testid="calculate-impact-button"]');
    await page.waitForSelector('[data-testid="impact-analysis-results"]');

    // Verify quality impact section
    await expect(page.locator('text=Quality Impact')).toBeVisible();
    await expect(page.locator('text=Original:')).toBeVisible();
    await expect(page.locator('text=Proposed:')).toBeVisible();

    // Should show quality scores
    const qualityScorePattern = /\d+\.\d+/;
    const qualityScores = page.locator('text=' + qualityScorePattern.source);
    await expect(qualityScores.first()).toBeVisible();
  });

  test('Back navigation preserves site selection', async ({ page }) => {
    await page.click('[data-testid="opportunity-row"]:first-child');
    await page.click('[data-testid="override-allocation-button"]');
    await page.waitForSelector('[data-testid="override-panel"]');

    // Select a site
    const siteSelector = page.locator('[data-testid="alternative-site-option"]');
    await siteSelector.selectOption({ index: 1 });
    const selectedValue = await siteSelector.inputValue();

    // Calculate impact
    await page.click('[data-testid="calculate-impact-button"]');
    await page.waitForSelector('[data-testid="impact-analysis-results"]');

    // Go back
    await page.click('text=Back to Site Selection');
    await page.waitForSelector('[data-testid="alternative-site-option"]');

    // Verify site selection is preserved
    const backSiteSelector = page.locator('[data-testid="alternative-site-option"]');
    await expect(backSiteSelector).toHaveValue(selectedValue);
  });

  test('Dialog closes after successful override', async ({ page }) => {
    await page.click('[data-testid="opportunity-row"]:first-child');
    await page.click('[data-testid="override-allocation-button"]');
    await page.waitForSelector('[data-testid="override-panel"]');

    const siteSelector = page.locator('[data-testid="alternative-site-option"]');
    await siteSelector.selectOption({ index: 1 });

    await page.click('[data-testid="calculate-impact-button"]');
    await page.waitForSelector('[data-testid="impact-analysis-results"]');

    // Add justification if required
    const justificationField = page.locator('[data-testid="override-justification"]');
    if (await justificationField.isVisible()) {
      await justificationField.fill('Test override justification');
    }

    const confirmButton = page.locator('[data-testid="confirm-override-button"]');
    await confirmButton.click();

    // Dialog should close
    await expect(page.locator('[data-testid="override-panel"]')).not.toBeVisible({ timeout: 3000 });
  });

  test('Performance: Impact calculation completes within acceptable time', async ({ page }) => {
    await page.click('[data-testid="opportunity-row"]:first-child');
    await page.click('[data-testid="override-allocation-button"]');
    await page.waitForSelector('[data-testid="override-panel"]');

    const siteSelector = page.locator('[data-testid="alternative-site-option"]');
    await siteSelector.selectOption({ index: 1 });

    const startTime = Date.now();
    await page.click('[data-testid="calculate-impact-button"]');
    await page.waitForSelector('[data-testid="impact-analysis-results"]');
    const endTime = Date.now();

    const calculationTime = endTime - startTime;
    
    // Impact calculation should complete within 3 seconds
    expect(calculationTime).toBeLessThan(3000);
  });

  test('Accessibility: Proper ARIA labels and keyboard navigation', async ({ page }) => {
    await page.click('[data-testid="opportunity-row"]:first-child');
    await page.click('[data-testid="override-allocation-button"]');
    await page.waitForSelector('[data-testid="override-panel"]');

    // Verify dialog has proper role
    const dialog = page.locator('[data-testid="override-panel"]');
    await expect(dialog).toHaveAttribute('role', 'dialog');

    // Verify form elements have proper labels
    const siteSelector = page.locator('[data-testid="alternative-site-option"]');
    await expect(siteSelector).toHaveAccessibleName();

    // Test keyboard navigation
    await page.keyboard.press('Tab');
    await page.keyboard.press('Tab');
    
    // Should be able to operate with keyboard
    await page.keyboard.press('Enter');
  });
});