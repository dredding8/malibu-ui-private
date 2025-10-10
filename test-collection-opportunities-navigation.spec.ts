import { test, expect } from '@playwright/test';

test.describe('Collection Opportunities Enhanced Navigation', () => {
  test('Navigate from History to Collection Opportunities Enhanced', async ({ page }) => {
    console.log('Starting navigation test...');
    
    // Step 1: Navigate to history page
    await page.goto('http://localhost:3000/history');
    console.log('Navigated to history page');
    
    // Wait for the page to load completely
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(2000); // Give React time to render
    
    // Step 2: Take screenshot of history page
    await page.screenshot({ 
      path: 'navigation-1-history-page.png',
      fullPage: true 
    });
    console.log('Captured history page screenshot');
    
    // Step 3: Look for collection deck table
    const collectionTable = page.locator('.collection-decks-table, .bp5-table');
    await expect(collectionTable).toBeVisible({ timeout: 10000 });
    console.log('Collection table is visible');
    
    // Step 4: Click on the first collection deck row
    // Try multiple selectors to find the clickable element
    const firstRow = page.locator('.bp5-table-row-cell').first();
    await firstRow.waitFor({ state: 'visible', timeout: 10000 });
    
    // Take screenshot before clicking
    await page.screenshot({ 
      path: 'navigation-2-before-click.png',
      fullPage: true 
    });
    
    // Click on the first collection deck
    await firstRow.click();
    console.log('Clicked on first collection deck');
    
    // Step 5: Wait for navigation to collection opportunities
    await page.waitForURL(/\/collection-opportunities\//, { timeout: 10000 });
    console.log('Navigated to collection opportunities page');
    
    // Wait for the page to stabilize
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(3000);
    
    // Step 6: Check which component is loaded (Enhanced or Refactored)
    const enhancedComponent = page.locator('.collection-opportunities-enhanced');
    const refactoredComponent = page.locator('.collection-opportunities-refactored');
    
    // Take screenshot of the opportunities page
    await page.screenshot({ 
      path: 'navigation-3-opportunities-page.png',
      fullPage: true 
    });
    
    if (await enhancedComponent.isVisible()) {
      console.log('CollectionOpportunitiesEnhanced component is loaded');
      
      // Validate key elements of the Enhanced component
      await expect(page.locator('.opportunity-filters')).toBeVisible();
      await expect(page.locator('.batch-actions')).toBeVisible();
      await expect(page.locator('.bp5-table')).toBeVisible();
      
      // Take detailed screenshot of enhanced component
      await page.screenshot({ 
        path: 'navigation-4-enhanced-component.png',
        fullPage: true 
      });
      
      // Check for health analysis features if enabled
      const healthBadge = page.locator('.health-badge').first();
      if (await healthBadge.isVisible()) {
        console.log('Health analysis is enabled');
      }
      
    } else if (await refactoredComponent.isVisible()) {
      console.log('CollectionOpportunitiesRefactored component is loaded');
      
      // Validate key elements of the Refactored component
      await expect(page.locator('.opportunities-table')).toBeVisible();
      await expect(page.locator('.opportunity-tabs')).toBeVisible();
      
      // Take detailed screenshot of refactored component
      await page.screenshot({ 
        path: 'navigation-4-refactored-component.png',
        fullPage: true 
      });
    } else {
      console.log('Legacy CollectionOpportunities component is loaded');
    }
    
    // Step 7: Test the manage opportunities workflow
    console.log('Testing manage opportunities workflow...');
    
    // Look for and click on a row to select it
    const opportunityRow = page.locator('.bp5-table-row-cell').first();
    if (await opportunityRow.isVisible()) {
      await opportunityRow.click();
      console.log('Selected an opportunity');
      
      // Look for edit/manage buttons
      const editButton = page.locator('button:has-text("Edit"), button:has-text("Quick Edit"), button:has-text("Override")').first();
      if (await editButton.isVisible()) {
        await editButton.click();
        console.log('Clicked edit/manage button');
        
        // Wait for modal to appear
        await page.waitForTimeout(1000);
        
        // Take screenshot of the modal
        await page.screenshot({ 
          path: 'navigation-5-manage-modal.png',
          fullPage: true 
        });
        
        // Check which modal opened
        if (await page.locator('.quick-edit-modal').isVisible()) {
          console.log('Quick Edit Modal opened');
        } else if (await page.locator('.edit-opportunity-modal').isVisible()) {
          console.log('Edit Opportunity Modal opened');
        } else if (await page.locator('.override-modal').isVisible()) {
          console.log('Override Modal opened');
        } else if (await page.locator('.manual-override-modal-refactored').isVisible()) {
          console.log('Manual Override Modal Refactored opened');
        }
      }
    }
    
    // Step 8: Check for hub features
    const hubStats = page.locator('.hub-stats');
    if (await hubStats.isVisible()) {
      console.log('Collection Opportunities Hub is active');
      await page.screenshot({ 
        path: 'navigation-6-hub-stats.png',
        fullPage: true 
      });
    }
    
    console.log('Navigation test completed successfully');
  });
  
  test('Test feature flag switching', async ({ page }) => {
    // Navigate with feature flag to force refactored components
    await page.goto('http://localhost:3000/history?ff_useRefactoredComponents=true');
    await page.waitForLoadState('networkidle');
    
    // Click on collection deck
    const firstRow = page.locator('.bp5-table-row-cell').first();
    await firstRow.waitFor({ state: 'visible' });
    await firstRow.click();
    
    // Wait for navigation
    await page.waitForURL(/\/collection-opportunities\//);
    await page.waitForTimeout(2000);
    
    // Verify refactored component loads
    const refactoredComponent = page.locator('.collection-opportunities-refactored');
    await expect(refactoredComponent).toBeVisible();
    console.log('Feature flag successfully loaded refactored component');
    
    await page.screenshot({ 
      path: 'navigation-7-feature-flag-test.png',
      fullPage: true 
    });
  });
});