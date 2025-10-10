const { chromium } = require('playwright');
const path = require('path');
const fs = require('fs');

/**
 * Quick script to capture the current modal implementation
 * Run with: node capture-current-implementation.js
 */

(async () => {
  const browser = await chromium.launch({ headless: false });
  const context = await browser.newContext({
    viewport: { width: 1440, height: 900 }
  });
  const page = await context.newPage();

  console.log('📸 Capturing current implementation evidence...\n');

  try {
    // Navigate to the application
    await page.goto('http://localhost:3000/collection-opportunities');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(2000);

    // Create screenshots directory
    const screenshotDir = path.join(__dirname, 'test-results', 'implementation-evidence');
    if (!fs.existsSync(screenshotDir)) {
      fs.mkdirSync(screenshotDir, { recursive: true });
    }

    // Capture initial state
    console.log('1. Capturing initial page state...');
    await page.screenshot({
      path: path.join(screenshotDir, '01-initial-state.png'),
      fullPage: true
    });

    // Check for split view elements
    const splitViewCheck = await page.evaluate(() => {
      return {
        hasSplitViewContainer: !!document.querySelector('.collection-opportunities-split-view'),
        hasSplitViewPanel: !!document.querySelector('.split-view-panel'),
        hasRefactoredComponent: !!document.querySelector('.collection-opportunities-refactored'),
        activeComponentClass: document.querySelector('[class*="collection-opportunities"]')?.className || 'none'
      };
    });
    
    console.log('2. Component detection:', splitViewCheck);

    // Try to open edit interface
    console.log('3. Attempting to open edit interface...');
    
    // Try multiple selectors
    const clicked = await page.click('.opportunities-table tbody tr:first-child button', { 
      timeout: 5000 
    }).then(() => true).catch(async () => {
      // Try alternative selector
      return await page.click('button:has-text("Edit"):visible', { timeout: 5000 })
        .then(() => true)
        .catch(() => false);
    });

    if (clicked) {
      await page.waitForTimeout(1500); // Wait for animation

      // Capture what opened
      console.log('4. Capturing edit interface...');
      await page.screenshot({
        path: path.join(screenshotDir, '02-edit-interface.png'),
        fullPage: true
      });

      // Check what type of interface opened
      const interfaceCheck = await page.evaluate(() => {
        const modalOverlay = document.querySelector('.bp5-overlay');
        const modalDialog = document.querySelector('.bp5-dialog');
        const splitViewPanel = document.querySelector('.split-view-panel.open');
        const modalTitle = document.querySelector('.bp5-dialog-header')?.textContent;
        
        return {
          hasModalOverlay: !!modalOverlay,
          hasModalDialog: !!modalDialog,
          hasSplitView: !!splitViewPanel,
          modalTitle: modalTitle || 'none',
          overlayStyles: modalOverlay ? {
            display: window.getComputedStyle(modalOverlay).display,
            position: window.getComputedStyle(modalOverlay).position,
            zIndex: window.getComputedStyle(modalOverlay).zIndex
          } : null,
          bodyClass: document.body.className
        };
      });

      console.log('5. Interface type:', interfaceCheck);

      // Try to interact with main content
      console.log('6. Testing main content interaction...');
      const mainContentClickable = await page.evaluate(() => {
        const mainContent = document.querySelector('.collection-opportunities-table, .opportunities-table');
        if (mainContent) {
          const rect = mainContent.getBoundingClientRect();
          const elementAtPoint = document.elementFromPoint(rect.left + 10, rect.top + 10);
          return {
            clickable: !elementAtPoint?.closest('.bp5-overlay'),
            blockedBy: elementAtPoint?.className || 'none'
          };
        }
        return { clickable: false, blockedBy: 'no main content found' };
      });

      console.log('7. Main content accessibility:', mainContentClickable);

      // Generate summary
      const summary = {
        timestamp: new Date().toISOString(),
        splitViewImplemented: interfaceCheck.hasSplitView,
        modalStillActive: interfaceCheck.hasModalOverlay || interfaceCheck.hasModalDialog,
        implementation: interfaceCheck.hasSplitView ? 'SPLIT VIEW' : 'MODAL',
        evidence: {
          componentDetection: splitViewCheck,
          interfaceType: interfaceCheck,
          contentAccessibility: mainContentClickable
        }
      };

      // Write summary
      fs.writeFileSync(
        path.join(screenshotDir, 'implementation-summary.json'),
        JSON.stringify(summary, null, 2)
      );

      console.log('\n📊 SUMMARY:');
      console.log('==================================================');
      console.log(`Implementation Type: ${summary.implementation}`);
      console.log(`Modal Active: ${summary.modalStillActive ? '✅ YES' : '❌ NO'}`);
      console.log(`Split View Active: ${summary.splitViewImplemented ? '✅ YES' : '❌ NO'}`);
      console.log('==================================================\n');
    } else {
      console.log('❌ Could not find edit button - page structure may have changed');
    }

  } catch (error) {
    console.error('Error during capture:', error);
  } finally {
    console.log('📁 Screenshots saved to:', path.join(__dirname, 'test-results', 'implementation-evidence'));
    await browser.close();
  }
})();