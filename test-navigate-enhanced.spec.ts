import { test, expect } from '@playwright/test';

test('Navigate to CollectionOpportunitiesEnhanced and document features', async ({ page }) => {
  console.log('Starting navigation to CollectionOpportunitiesEnhanced...');
  
  // Step 1: Navigate to history page
  await page.goto('http://localhost:3000/history');
  await page.waitForLoadState('networkidle');
  await page.waitForTimeout(2000);
  
  console.log('On history page');
  
  // Step 2: Find and click on a collection deck
  // Try multiple selectors
  const selectors = [
    'table tbody tr td:first-child a',
    '.bp5-table-cell a',
    'table tbody tr td:first-child',
    '.collection-decks-table tbody tr td:first-child',
    '.bp5-table-row-cell:first-child'
  ];
  
  let clicked = false;
  for (const selector of selectors) {
    const element = page.locator(selector).first();
    if (await element.isVisible()) {
      console.log(`Found clickable element with selector: ${selector}`);
      await element.click();
      clicked = true;
      break;
    }
  }
  
  if (!clicked) {
    console.log('Could not find clickable element, taking screenshot of history page');
    await page.screenshot({ path: 'history-page-debug.png', fullPage: true });
    throw new Error('Could not find collection deck to click');
  }
  
  // Step 3: Wait for navigation to collection opportunities
  console.log('Waiting for navigation...');
  await page.waitForTimeout(3000);
  
  const currentUrl = page.url();
  console.log(`Current URL: ${currentUrl}`);
  
  if (!currentUrl.includes('collection-opportunities')) {
    console.log('Did not navigate to collection opportunities page');
    await page.screenshot({ path: 'navigation-failed.png', fullPage: true });
    return;
  }
  
  // Step 4: Check which component is loaded
  console.log('Checking which component loaded...');
  
  // Force enhanced component by setting feature flag
  if (currentUrl.includes('collection-opportunities')) {
    // Check if we need to force the enhanced component
    const refactoredComponent = page.locator('.collection-opportunities-refactored');
    if (await refactoredComponent.isVisible()) {
      console.log('Refactored component is currently loaded, switching to enhanced...');
      
      // Toggle feature flag in localStorage
      await page.evaluate(() => {
        const flags = JSON.parse(localStorage.getItem('featureFlags') || '{}');
        flags.useRefactoredComponents = false;
        flags.progressiveComplexityUI = true;
        localStorage.setItem('featureFlags', JSON.stringify(flags));
      });
      
      // Reload page
      await page.reload();
      await page.waitForLoadState('networkidle');
      await page.waitForTimeout(2000);
    }
  }
  
  // Take screenshot of the loaded component
  await page.screenshot({ 
    path: 'collection-opportunities-component.png',
    fullPage: true 
  });
  
  // Document what component is loaded
  const components = {
    enhanced: page.locator('.collection-opportunities-enhanced'),
    refactored: page.locator('.collection-opportunities-refactored'),
    legacy: page.locator('.collection-opportunities').locator(':not(.collection-opportunities-enhanced):not(.collection-opportunities-refactored)')
  };
  
  for (const [name, locator] of Object.entries(components)) {
    if (await locator.isVisible()) {
      console.log(`\n✅ ${name.toUpperCase()} component is loaded`);
      
      if (name === 'enhanced') {
        console.log('\n=== CollectionOpportunitiesEnhanced Features ===');
        
        // Document features
        const features = [
          { selector: '.opportunity-filters', name: 'Advanced Filters Panel' },
          { selector: '.batch-actions', name: 'Batch Actions Toolbar' },
          { selector: '.health-badge', name: 'Health Analysis Badges' },
          { selector: '.quick-edit-btn', name: 'Quick Edit Buttons' },
          { selector: '.workspace-btn', name: 'Workspace Mode' },
          { selector: '.site-optimization', name: 'Site Optimization' },
          { selector: '.real-time-validation', name: 'Real-time Validation' },
          { selector: '.bp5-table', name: 'Blueprint Table' }
        ];
        
        for (const feature of features) {
          const element = page.locator(feature.selector).first();
          if (await element.isVisible()) {
            console.log(`- ${feature.name}: ✓`);
          }
        }
        
        // Try to interact with the component
        console.log('\n=== Testing Interactions ===');
        
        // Click on a row
        const firstRow = page.locator('.bp5-table-row-cell').first();
        if (await firstRow.isVisible()) {
          await firstRow.click();
          console.log('- Clicked on first row');
          await page.waitForTimeout(1000);
          
          // Check for modals
          const modals = [
            { selector: '.quick-edit-modal', name: 'Quick Edit Modal' },
            { selector: '.edit-opportunity-modal', name: 'Edit Opportunity Modal' },
            { selector: '.override-modal', name: 'Override Modal' }
          ];
          
          for (const modal of modals) {
            if (await page.locator(modal.selector).isVisible()) {
              console.log(`- ${modal.name} opened`);
              await page.screenshot({ 
                path: `enhanced-${modal.name.toLowerCase().replace(/ /g, '-')}.png`,
                fullPage: true 
              });
              
              // Close modal
              const closeButton = page.locator('.bp5-dialog-close-button, .bp5-button:has-text("Cancel")').first();
              if (await closeButton.isVisible()) {
                await closeButton.click();
                await page.waitForTimeout(500);
              }
            }
          }
        }
        
        // Check batch operations
        const selectAll = page.locator('.select-all-checkbox, input[type="checkbox"]').first();
        if (await selectAll.isVisible()) {
          await selectAll.click();
          console.log('- Selected all items');
          await page.waitForTimeout(500);
          
          // Check if batch actions appear
          const batchActions = page.locator('.batch-actions button').all();
          console.log(`- Batch actions available: ${await batchActions.length}`);
        }
      }
      
      break;
    }
  }
  
  console.log('\n=== Test Complete ===');
});