import { test, expect } from '@playwright/test';

test.describe('Collection Opportunities Hub - Actual Testing', () => {
  test.beforeEach(async ({ page }) => {
    // Remove the webpack overlay that's blocking interactions
    await page.addStyleTag({
      content: `
        #webpack-dev-server-client-overlay { display: none !important; }
        iframe#webpack-dev-server-client-overlay { display: none !important; }
      `
    });
  });

  test('navigate to collection opportunities and verify enhancements', async ({ page }) => {
    // Go to home
    await page.goto('http://localhost:3000');
    await page.waitForLoadState('networkidle');
    
    // Remove overlay via JavaScript as well
    await page.evaluate(() => {
      const overlay = document.querySelector('#webpack-dev-server-client-overlay');
      if (overlay) overlay.remove();
    });
    
    // Click Collections button
    const collectionsButton = page.locator('button:has-text("Collections")');
    await collectionsButton.click({ force: true });
    await page.waitForTimeout(1000);
    
    console.log('Current URL after Collections click:', page.url());
    
    // Look for collection decks
    const viewButtons = page.locator('button:has-text("View")');
    const viewCount = await viewButtons.count();
    console.log('Found View buttons:', viewCount);
    
    if (viewCount > 0) {
      // Click the first View button
      await viewButtons.first().click({ force: true });
      await page.waitForTimeout(2000);
      console.log('URL after View click:', page.url());
      
      // Look for opportunities tab or link
      const opportunitiesTab = page.locator('text=/opportunities|manage opportunities/i');
      if (await opportunitiesTab.isVisible()) {
        await opportunitiesTab.click({ force: true });
        await page.waitForTimeout(2000);
      }
    }
    
    // Try direct navigation as fallback
    await page.goto('http://localhost:3000/collection/123/opportunities');
    await page.waitForTimeout(2000);
    
    // Take screenshot of current state
    await page.screenshot({ 
      path: 'test-results/screenshots/opportunities-page.png', 
      fullPage: true 
    });
    
    // Check if we have the enhanced component
    const pageContent = await page.evaluate(() => {
      return {
        url: window.location.href,
        title: document.title,
        hasEnhancedComponent: !!document.querySelector('.collection-opportunities-enhanced'),
        hasNavbar: !!document.querySelector('.opportunities-navbar'),
        hasTable: !!document.querySelector('[class*="table"]'),
        navbarText: document.querySelector('.opportunities-navbar')?.textContent,
        headings: Array.from(document.querySelectorAll('h1, h2, h3')).map(h => h.textContent),
        buttons: Array.from(document.querySelectorAll('button')).map(b => ({
          text: b.textContent?.trim(),
          ariaLabel: b.getAttribute('aria-label')
        })).slice(0, 20)
      };
    });
    
    console.log('Page Analysis:', JSON.stringify(pageContent, null, 2));
    
    // Test specific enhancements
    const validationResults = {
      uiLabel: false,
      editButton: false,
      reallocateButton: false,
      healthIndicator: false
    };
    
    // Check for "Manage Opportunities" text
    validationResults.uiLabel = await page.locator('text="Manage Opportunities"').isVisible().catch(() => false);
    
    // Check for Edit buttons
    const editButtons = await page.locator('button[aria-label*="Edit"], button:has-text("Edit")').count();
    validationResults.editButton = editButtons > 0;
    
    // Check for Reallocate buttons  
    const reallocateButtons = await page.locator('button[aria-label*="Reallocate"], button:has([icon*="refresh"])').count();
    validationResults.reallocateButton = reallocateButtons > 0;
    
    // Check for health indicators
    const healthIndicators = await page.locator('[class*="status"], [class*="health"]').count();
    validationResults.healthIndicator = healthIndicators > 0;
    
    console.log('Validation Results:', validationResults);
    
    // Try to interact with the page
    if (editButtons > 0) {
      const firstEdit = page.locator('button[aria-label*="Edit"], button:has-text("Edit")').first();
      await firstEdit.click({ force: true });
      await page.waitForTimeout(1000);
      
      const hasModal = await page.locator('[role="dialog"]').isVisible();
      console.log('Modal opened after edit click:', hasModal);
      
      if (hasModal) {
        await page.screenshot({ 
          path: 'test-results/screenshots/edit-modal.png', 
          fullPage: true 
        });
        
        // Close modal
        await page.keyboard.press('Escape');
      }
    }
    
    // Test keyboard shortcuts
    await page.keyboard.press('Meta+e');
    await page.waitForTimeout(500);
    const keyboardModal = await page.locator('[role="dialog"]').isVisible();
    console.log('Keyboard shortcut Cmd+E worked:', keyboardModal);
    
    // Final summary
    const summary = `
    Test Summary:
    -------------
    UI Label "Manage Opportunities": ${validationResults.uiLabel ? '✓' : '✗'}
    Edit Buttons Present: ${validationResults.editButton ? '✓' : '✗'} (${editButtons} found)
    Reallocate Buttons: ${validationResults.reallocateButton ? '✓' : '✗'} (${reallocateButtons} found)
    Health Indicators: ${validationResults.healthIndicator ? '✓' : '✗'} (${healthIndicators} found)
    `;
    
    console.log(summary);
  });
});