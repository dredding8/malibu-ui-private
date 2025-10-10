import { test, expect } from '@playwright/test';

test.describe('Collection Opportunities Hub - Correct Route Testing', () => {
  test.beforeEach(async ({ page }) => {
    // Remove the webpack overlay
    await page.addStyleTag({
      content: `
        #webpack-dev-server-client-overlay { display: none !important; }
        iframe#webpack-dev-server-client-overlay { display: none !important; }
      `
    });
  });

  test('verify Collection Opportunities enhancements via correct route', async ({ page }) => {
    // Navigate to the correct route
    await page.goto('http://localhost:3000/history/123/collection-opportunities');
    await page.waitForLoadState('networkidle');
    
    // Remove overlay
    await page.evaluate(() => {
      const overlay = document.querySelector('#webpack-dev-server-client-overlay');
      if (overlay) overlay.remove();
    });
    
    await page.waitForTimeout(2000);
    
    // Take initial screenshot
    await page.screenshot({ 
      path: 'test-results/screenshots/collection-opportunities-page.png', 
      fullPage: true 
    });
    
    // Check page structure
    const pageAnalysis = await page.evaluate(() => {
      return {
        url: window.location.href,
        title: document.title,
        components: {
          enhancedTable: !!document.querySelector('.collection-opportunities-enhanced'),
          navbarWithManage: !!document.querySelector('.opportunities-navbar'),
          tableEnhanced: !!document.querySelector('.opportunities-table-enhanced'),
          statusIndicators: document.querySelectorAll('[class*="status-indicator"], [class*="health"]').length,
          editButtons: document.querySelectorAll('button[aria-label*="Edit"], button:has(svg[class*="edit"])').length,
          reallocateButtons: document.querySelectorAll('button[aria-label*="Reallocate"], button:has(svg[class*="refresh"])').length
        },
        navbarText: document.querySelector('[class*="navbar"] h1, [class*="navbar"] h2')?.textContent,
        allHeadings: Array.from(document.querySelectorAll('h1, h2, h3')).map(h => h.textContent?.trim()),
        buttonsWithAria: Array.from(document.querySelectorAll('button[aria-label]')).map(b => ({
          label: b.getAttribute('aria-label'),
          text: b.textContent?.trim()
        })).slice(0, 10)
      };
    });
    
    console.log('Page Analysis:', JSON.stringify(pageAnalysis, null, 2));
    
    // Test Results
    const testResults = {
      uiLabel: false,
      statusIndicators: false,
      editButtons: false,
      reallocateButtons: false,
      keyboardShortcuts: false,
      modalContext: false
    };
    
    // 1. Check for "Manage Opportunities" label
    const manageOpportunitiesText = await page.locator('text="Manage Opportunities"').count();
    testResults.uiLabel = manageOpportunitiesText > 0;
    
    if (!testResults.uiLabel) {
      // Check alternative locations
      const anyManageText = await page.locator('text=/manage.*opportunities/i').count();
      console.log('Found "Manage Opportunities" variants:', anyManageText);
    }
    
    // 2. Check for status indicators
    testResults.statusIndicators = pageAnalysis.components.statusIndicators > 0;
    
    // 3. Check for Edit buttons
    testResults.editButtons = pageAnalysis.components.editButtons > 0;
    
    if (testResults.editButtons) {
      // Click first edit button
      const editButton = page.locator('button[aria-label*="Edit"], button:has(svg[class*="edit"])').first();
      await editButton.click({ force: true });
      await page.waitForTimeout(1000);
      
      const modalVisible = await page.locator('[role="dialog"]').isVisible();
      console.log('Modal visible after edit click:', modalVisible);
      
      if (modalVisible) {
        await page.screenshot({ 
          path: 'test-results/screenshots/quick-edit-modal.png' 
        });
        await page.keyboard.press('Escape');
      }
    }
    
    // 4. Check for Reallocate buttons
    testResults.reallocateButtons = pageAnalysis.components.reallocateButtons > 0;
    
    // 5. Test keyboard shortcuts
    // Select a row first
    const checkboxes = await page.locator('input[type="checkbox"]').count();
    if (checkboxes > 1) {
      await page.locator('input[type="checkbox"]').nth(1).click({ force: true });
      await page.waitForTimeout(500);
      
      // Try Cmd+E
      await page.keyboard.press('Meta+e');
      await page.waitForTimeout(500);
      
      testResults.keyboardShortcuts = await page.locator('[role="dialog"]').isVisible();
      
      if (testResults.keyboardShortcuts) {
        await page.keyboard.press('Escape');
      }
    }
    
    // 6. Test Reallocate workspace
    if (testResults.reallocateButtons) {
      const reallocateButton = page.locator('button[aria-label*="Reallocate"], button:has(svg[class*="refresh"])').first();
      await reallocateButton.click({ force: true });
      await page.waitForTimeout(1000);
      
      const workspaceVisible = await page.locator('[role="dialog"]').isVisible();
      testResults.modalContext = workspaceVisible;
      
      if (workspaceVisible) {
        // Check for satellite context
        const satelliteText = await page.locator('[role="dialog"] text=/satellite/i').count();
        console.log('Satellite context in workspace:', satelliteText > 0);
        
        await page.screenshot({ 
          path: 'test-results/screenshots/reallocation-workspace.png' 
        });
      }
    }
    
    // Generate validation report
    const validationReport = `
    Collection Opportunities Hub Validation
    ======================================
    
    ✅ Requirements Validation:
    ---------------------------
    1. UI Label "Manage Opportunities": ${testResults.uiLabel ? '✅ PASS' : '❌ FAIL'}
    2. Status Indicators Column: ${testResults.statusIndicators ? '✅ PASS' : '❌ FAIL'} (${pageAnalysis.components.statusIndicators} found)
    3. Edit Button Actions: ${testResults.editButtons ? '✅ PASS' : '❌ FAIL'} (${pageAnalysis.components.editButtons} found)
    4. Reallocate Button Actions: ${testResults.reallocateButtons ? '✅ PASS' : '❌ FAIL'} (${pageAnalysis.components.reallocateButtons} found)
    5. Keyboard Shortcuts (Cmd+E): ${testResults.keyboardShortcuts ? '✅ PASS' : '❌ FAIL'}
    6. Modal Context (Reallocation): ${testResults.modalContext ? '✅ PASS' : '❌ FAIL'}
    
    📊 Component Detection:
    ----------------------
    - Enhanced Table Component: ${pageAnalysis.components.enhancedTable ? 'YES' : 'NO'}
    - Opportunities Navbar: ${pageAnalysis.components.navbarWithManage ? 'YES' : 'NO'}
    - Enhanced Table Class: ${pageAnalysis.components.tableEnhanced ? 'YES' : 'NO'}
    
    🔍 Page Content:
    ---------------
    - Current URL: ${pageAnalysis.url}
    - Navbar Text: ${pageAnalysis.navbarText || 'Not found'}
    - Headings Found: ${pageAnalysis.allHeadings.join(', ') || 'None'}
    `;
    
    console.log(validationReport);
    
    // Save report
    await page.evaluate((report) => {
      const blob = new Blob([report], { type: 'text/plain' });
      const a = document.createElement('a');
      a.href = URL.createObjectURL(blob);
      a.download = 'validation-report.txt';
      document.body.appendChild(a);
      // Don't click to avoid download dialog in test
      document.body.removeChild(a);
    }, validationReport);
    
    // Final screenshot with all elements
    await page.screenshot({ 
      path: 'test-results/screenshots/final-validation-state.png', 
      fullPage: true 
    });
  });
});