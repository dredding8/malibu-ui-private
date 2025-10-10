import { test, expect } from '@playwright/test';

test('Navigate to Collection Opportunities Enhanced', async ({ page }) => {
  // Step 1: Go directly to a collection opportunities URL
  // Try with the default (enhanced) components first
  console.log('Navigating directly to collection opportunities...');
  
  // Use a known deck ID from the mock data
  await page.goto('http://localhost:3000/collection-opportunities/deck-0?ff_useRefactoredComponents=false');
  
  // Wait for page to load
  await page.waitForLoadState('networkidle');
  await page.waitForTimeout(3000);
  
  // Take screenshot
  await page.screenshot({ 
    path: 'collection-opportunities-enhanced-direct.png',
    fullPage: true 
  });
  
  // Check what component loaded
  const enhancedComponent = page.locator('.collection-opportunities-enhanced');
  const refactoredComponent = page.locator('.collection-opportunities-refactored');
  const legacyComponent = page.locator('.collection-opportunities');
  
  if (await enhancedComponent.isVisible()) {
    console.log('✅ CollectionOpportunitiesEnhanced component is loaded');
    
    // Document key features
    console.log('\nKey features of CollectionOpportunitiesEnhanced:');
    
    // Check for filters
    if (await page.locator('.opportunity-filters').isVisible()) {
      console.log('- Advanced filtering panel');
    }
    
    // Check for batch actions
    if (await page.locator('.batch-actions').isVisible()) {
      console.log('- Batch actions toolbar');
    }
    
    // Check for health indicators
    if (await page.locator('.health-badge').first().isVisible()) {
      console.log('- Health analysis badges');
    }
    
    // Check for quick edit
    if (await page.locator('.quick-edit-btn').first().isVisible()) {
      console.log('- Quick edit functionality');
    }
    
    // Check for workspace mode
    if (await page.locator('.workspace-btn').first().isVisible()) {
      console.log('- Workspace mode support');
    }
    
    // Try to open a modal
    const firstRow = page.locator('.bp5-table-row-cell').first();
    if (await firstRow.isVisible()) {
      await firstRow.click();
      await page.waitForTimeout(1000);
      
      // Check for quick edit modal
      const quickEditModal = page.locator('.quick-edit-modal');
      if (await quickEditModal.isVisible()) {
        console.log('- Quick Edit Modal is available');
        await page.screenshot({ 
          path: 'collection-opportunities-enhanced-modal.png',
          fullPage: true 
        });
      }
    }
    
  } else if (await refactoredComponent.isVisible()) {
    console.log('❌ Refactored component loaded instead of Enhanced');
  } else {
    console.log('❌ Legacy component loaded');
  }
  
  // Try the history page approach
  console.log('\nTrying navigation from history page...');
  await page.goto('http://localhost:3000/history');
  await page.waitForLoadState('networkidle');
  await page.waitForTimeout(2000);
  
  // Look for the collection table
  const table = page.locator('table, .bp5-table, .collection-decks-table').first();
  if (await table.isVisible()) {
    console.log('Found collection table on history page');
    
    // Find clickable elements
    const clickableCell = page.locator('td a, .bp5-table-cell a, .clickable-cell').first();
    const firstCell = page.locator('td, .bp5-table-cell').first();
    
    if (await clickableCell.isVisible()) {
      await clickableCell.click();
    } else if (await firstCell.isVisible()) {
      await firstCell.click();
    }
    
    // Wait for navigation
    await page.waitForTimeout(2000);
    
    // Check if we navigated
    if (page.url().includes('collection-opportunities')) {
      console.log('Successfully navigated to collection opportunities');
      
      await page.screenshot({ 
        path: 'collection-opportunities-from-history.png',
        fullPage: true 
      });
    }
  }
});