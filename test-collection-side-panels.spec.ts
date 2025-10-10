import { test, expect } from '@playwright/test';

test.describe('Collection Management - Side Panel Testing', () => {
  
  test('Side Panel Discovery and Interaction', async ({ page }) => {
    // Test multiple URLs to find side panels
    const urlsToTest = [
      'http://localhost:3000/test-opportunities',
      'http://localhost:3000/collection/test-collection/manage',
      'http://localhost:3000/decks'
    ];

    for (const url of urlsToTest) {
      console.log(`\n=== Testing Side Panels on: ${url} ===`);
      
      await page.goto(url);
      await page.waitForLoadState('networkidle');
      
      // Look for side panel indicators
      const sidePanelSelectors = [
        // Common side panel selectors
        '.side-panel',
        '.side-view',
        '.detail-panel',
        '.split-view',
        '[class*="panel"]',
        '[class*="sidebar"]',
        '[class*="drawer"]',
        '.bp5-drawer',
        '.bp6-drawer',
        // Split view specific
        '.split-view-panel',
        '.collection-detail-panel',
        '.opportunity-details',
        // Workspace mode
        '.workspace-panel',
        '.allocation-editor-panel'
      ];
      
      let panelFound = false;
      
      for (const selector of sidePanelSelectors) {
        const panels = await page.locator(selector).count();
        if (panels > 0) {
          console.log(`Found ${panels} panel(s) with selector: ${selector}`);
          panelFound = true;
          
          // Check panel visibility and state
          const panel = page.locator(selector).first();
          const isVisible = await panel.isVisible();
          const bounds = await panel.boundingBox();
          
          console.log(`Panel visible: ${isVisible}`);
          if (bounds) {
            console.log(`Panel dimensions: ${bounds.width}x${bounds.height}`);
            console.log(`Panel position: x=${bounds.x}, y=${bounds.y}`);
          }
        }
      }
      
      if (!panelFound) {
        console.log('No side panels found with default selectors');
      }
      
      // Look for panel triggers
      const triggerSelectors = [
        'button:has-text("View Details")',
        'button:has-text("Details")',
        'button:has-text("Open")',
        'button[aria-label*="details"]',
        'button[aria-label*="panel"]',
        'button[aria-label*="view"]',
        '[class*="view-details"]',
        '[class*="toggle-panel"]',
        // Table row clicks
        'tr[class*="clickable"]',
        'tr[role="row"]',
        '.bp5-table-row-name',
        '.bp6-table-row-name'
      ];
      
      console.log('\nLooking for panel triggers...');
      
      for (const trigger of triggerSelectors) {
        const triggers = await page.locator(trigger).count();
        if (triggers > 0) {
          console.log(`Found ${triggers} trigger(s): ${trigger}`);
          
          // Try clicking the first trigger
          const firstTrigger = page.locator(trigger).first();
          
          try {
            // Click and wait for potential panel animation
            await firstTrigger.click({ timeout: 5000 });
            await page.waitForTimeout(1000);
            
            // Check if any panel appeared or changed state
            for (const panelSelector of sidePanelSelectors) {
              const panel = page.locator(panelSelector).first();
              if (await panel.count() > 0) {
                const afterClickVisible = await panel.isVisible();
                const afterClickBounds = await panel.boundingBox();
                
                if (afterClickVisible && afterClickBounds) {
                  console.log(`Panel appeared/changed after click!`);
                  console.log(`New dimensions: ${afterClickBounds.width}x${afterClickBounds.height}`);
                  
                  // Test panel content
                  const panelContent = await panel.textContent();
                  console.log(`Panel content preview: ${panelContent?.substring(0, 100)}...`);
                  
                  // Look for panel controls
                  const closeButton = panel.locator('button[aria-label*="close"], .close-button, [class*="close"]');
                  if (await closeButton.count() > 0) {
                    console.log('Panel has close button');
                  }
                  
                  // Test resizing if available
                  const resizeHandle = panel.locator('.resize-handle, [class*="resize"], .resizer');
                  if (await resizeHandle.count() > 0) {
                    console.log('Panel has resize handle');
                  }
                  
                  // Take screenshot
                  await page.screenshot({ 
                    path: `side-panel-${url.split('/').pop()}.png`, 
                    fullPage: true 
                  });
                  
                  break;
                }
              }
            }
          } catch (error) {
            console.log(`Could not click trigger: ${error.message}`);
          }
        }
      }
      
      // Check for split view specific functionality
      const splitViewContainer = page.locator('.split-view-container, [class*="split-view"]');
      if (await splitViewContainer.count() > 0) {
        console.log('\nSplit view detected!');
        
        // Look for resize functionality
        const resizer = page.locator('.split-view-resizer, .resize-handle, [class*="resiz"]');
        if (await resizer.count() > 0) {
          console.log('Split view has resizer');
          
          // Test resize
          const resizerBounds = await resizer.boundingBox();
          if (resizerBounds) {
            // Simulate drag
            await page.mouse.move(resizerBounds.x + resizerBounds.width / 2, resizerBounds.y + resizerBounds.height / 2);
            await page.mouse.down();
            await page.mouse.move(resizerBounds.x - 100, resizerBounds.y + resizerBounds.height / 2);
            await page.mouse.up();
            
            console.log('Attempted to resize split view');
            await page.waitForTimeout(500);
          }
        }
      }
    }
  });

  test('Focused Side Panel UX Analysis', async ({ page }) => {
    // Go to a page likely to have side panels
    await page.goto('http://localhost:3000/collection/test-collection/manage');
    await page.waitForLoadState('networkidle');
    
    // Comprehensive panel analysis
    const panelAnalysis = await page.evaluate(() => {
      const analysis: any = {
        panels: [],
        triggers: [],
        accessibility: {},
        responsive: {}
      };
      
      // Find all potential panels
      const panelSelectors = [
        '.side-panel', '.detail-panel', '.split-view-panel',
        '[class*="panel"]', '[class*="sidebar"]', '[class*="drawer"]'
      ];
      
      panelSelectors.forEach(selector => {
        const elements = document.querySelectorAll(selector);
        elements.forEach(el => {
          const rect = el.getBoundingClientRect();
          const styles = window.getComputedStyle(el);
          
          analysis.panels.push({
            selector,
            visible: rect.width > 0 && rect.height > 0,
            width: rect.width,
            height: rect.height,
            position: styles.position,
            zIndex: styles.zIndex,
            overflow: styles.overflow,
            transition: styles.transition
          });
        });
      });
      
      // Find triggers
      const triggerElements = document.querySelectorAll(
        'button[onclick*="panel"], button[onclick*="detail"], [class*="trigger"]'
      );
      
      analysis.triggers = Array.from(triggerElements).map(el => ({
        text: el.textContent?.trim(),
        class: el.className,
        hasAriaControls: el.hasAttribute('aria-controls'),
        hasAriaExpanded: el.hasAttribute('aria-expanded')
      }));
      
      // Accessibility checks
      const panels = document.querySelectorAll('[role="complementary"], [role="region"]');
      analysis.accessibility = {
        hasComplementaryRole: panels.length > 0,
        panelsWithLabels: Array.from(panels).filter(p => 
          p.hasAttribute('aria-label') || p.hasAttribute('aria-labelledby')
        ).length,
        focusManagement: document.querySelector('[tabindex="-1"]') !== null
      };
      
      // Responsive behavior
      analysis.responsive = {
        viewportWidth: window.innerWidth,
        hasMediaQueries: Array.from(document.styleSheets).some(sheet => {
          try {
            return Array.from(sheet.cssRules || []).some(rule => 
              rule instanceof CSSMediaRule && rule.conditionText.includes('width')
            );
          } catch {
            return false;
          }
        })
      };
      
      return analysis;
    });
    
    console.log('Comprehensive Panel Analysis:', JSON.stringify(panelAnalysis, null, 2));
    
    // Test keyboard navigation for panels
    await page.keyboard.press('Tab');
    let tabCount = 0;
    const maxTabs = 20;
    
    while (tabCount < maxTabs) {
      const focusedElement = await page.evaluate(() => {
        const el = document.activeElement;
        return {
          tag: el?.tagName,
          class: el?.className,
          role: el?.getAttribute('role'),
          ariaLabel: el?.getAttribute('aria-label')
        };
      });
      
      if (focusedElement.class?.includes('panel') || 
          focusedElement.role === 'complementary' ||
          focusedElement.ariaLabel?.includes('panel')) {
        console.log('Focused on panel element:', focusedElement);
        break;
      }
      
      await page.keyboard.press('Tab');
      tabCount++;
    }
    
    // Generate UX recommendations for side panels
    const recommendations = [];
    
    if (panelAnalysis.panels.length === 0) {
      recommendations.push('No side panels detected - consider implementing detail views');
    } else {
      panelAnalysis.panels.forEach((panel: any) => {
        if (panel.width < 300 && panel.visible) {
          recommendations.push(`Panel too narrow (${panel.width}px) - minimum 300px recommended`);
        }
        if (!panel.transition || panel.transition === 'none') {
          recommendations.push('Add smooth transitions for panel open/close');
        }
      });
    }
    
    if (panelAnalysis.accessibility.panelsWithLabels === 0) {
      recommendations.push('Add aria-label or aria-labelledby to panels');
    }
    
    if (panelAnalysis.triggers.filter((t: any) => !t.hasAriaExpanded).length > 0) {
      recommendations.push('Add aria-expanded to panel triggers');
    }
    
    console.log('\nSide Panel UX Recommendations:', recommendations);
  });

  test('Collection Opportunities Split View Test', async ({ page }) => {
    // Specifically test the collection opportunities split view
    await page.goto('http://localhost:3000/test-opportunities');
    await page.waitForLoadState('networkidle');
    
    // Look for split view implementation
    const splitViewImplementations = [
      'CollectionOpportunitiesSplitView',
      'collection-opportunities-split-view',
      '.split-view',
      '[class*="split"]'
    ];
    
    for (const implementation of splitViewImplementations) {
      const elements = await page.locator(implementation).count();
      if (elements > 0) {
        console.log(`Found split view implementation: ${implementation}`);
        
        // Test split view specific features
        const splitView = page.locator(implementation).first();
        
        // Check if it has the expected structure
        const hasLeftPanel = await splitView.locator('.left-panel, .main-panel, [class*="left"]').count() > 0;
        const hasRightPanel = await splitView.locator('.right-panel, .detail-panel, [class*="right"]').count() > 0;
        
        console.log(`Has left panel: ${hasLeftPanel}`);
        console.log(`Has right panel: ${hasRightPanel}`);
        
        // Check for collection detail panel
        const detailPanel = await page.locator('.collection-detail-panel, [class*="detail-panel"]').first();
        if (await detailPanel.count() > 0) {
          const detailPanelBounds = await detailPanel.boundingBox();
          console.log('Detail panel found:', detailPanelBounds);
          
          // Check panel content structure
          const hasTabs = await detailPanel.locator('[role="tablist"], .bp5-tabs').count() > 0;
          const hasForm = await detailPanel.locator('form').count() > 0;
          const hasActions = await detailPanel.locator('button').count();
          
          console.log(`Detail panel structure:
            - Has tabs: ${hasTabs}
            - Has form: ${hasForm}
            - Action buttons: ${hasActions}
          `);
        }
      }
    }
    
    // Take final screenshot
    await page.screenshot({ path: 'side-panel-final-state.png', fullPage: true });
  });
});