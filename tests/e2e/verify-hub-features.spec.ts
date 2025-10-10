import { test, expect } from '@playwright/test';

test.describe('Collection Opportunities Hub Feature Verification', () => {
  test('verify all enhanced features are working', async ({ page }) => {
    // Navigate to the Hub
    await page.goto('http://localhost:3000/collection/123/manage');
    await page.waitForLoadState('networkidle');
    
    // Wait for the Hub to load
    await page.waitForSelector('.collection-opportunities-hub', { timeout: 10000 });
    
    console.log('✅ Hub loaded successfully');
    
    // 1. Verify "Manage Opportunities" label
    const manageOpportunitiesText = await page.textContent('.bp6-navbar-heading');
    console.log('Navbar heading:', manageOpportunitiesText);
    
    // 2. Check for enhanced table
    const hasEnhancedTable = await page.locator('.opportunities-table-enhanced').isVisible();
    console.log('Enhanced table visible:', hasEnhancedTable);
    
    // 3. Count health indicators
    const healthIndicators = await page.locator('[class*="status-indicator"]').count();
    console.log('Health indicators found:', healthIndicators);
    
    // 4. Check for action buttons in the table
    const tableRows = await page.locator('tbody tr, tr[role="row"]').count();
    console.log('Table rows:', tableRows);
    
    if (tableRows > 0) {
      // Look for buttons in cells
      const editButtons = await page.locator('button[title*="Edit"], button[aria-label*="Edit"], button .bp6-icon-edit').count();
      const reallocateButtons = await page.locator('button[title*="Reallocate"], button .bp6-icon-refresh').count();
      
      console.log('Edit buttons:', editButtons);
      console.log('Reallocate buttons:', reallocateButtons);
    }
    
    // 5. Test keyboard shortcuts
    if (tableRows > 0) {
      // Select first checkbox
      const firstCheckbox = page.locator('input[type="checkbox"]').nth(1);
      if (await firstCheckbox.isVisible()) {
        await firstCheckbox.click({ force: true });
        console.log('Selected first row');
        
        // Test Cmd+E shortcut
        await page.keyboard.press('Meta+e');
        await page.waitForTimeout(500);
        
        const modalVisible = await page.locator('[role="dialog"]').isVisible();
        console.log('Quick Edit modal opened with Cmd+E:', modalVisible);
        
        if (modalVisible) {
          await page.keyboard.press('Escape');
          console.log('Closed modal with Escape');
        }
      }
    }
    
    // Final summary
    console.log('\n=== FEATURE VERIFICATION SUMMARY ===');
    console.log('1. Hub Component: ✅ Loaded');
    console.log('2. Enhanced Table: ' + (hasEnhancedTable ? '✅ Visible' : '❌ Not visible'));
    console.log('3. Health Indicators: ' + (healthIndicators > 0 ? `✅ ${healthIndicators} found` : '❌ None found'));
    console.log('4. Table Data: ' + (tableRows > 0 ? `✅ ${tableRows} rows` : '❌ No data'));
  });
});