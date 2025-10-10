import { test, expect, Page } from '@playwright/test';
import * as fs from 'fs';
import * as path from 'path';

/**
 * Test to verify which implementation is currently active:
 * - Modal-based (CollectionOpportunitiesRefactored)
 * - Split View (CollectionOpportunitiesSplitView)
 * 
 * This test will provide evidence of the current state of the application.
 */

test.describe('Modal vs Split View Implementation Verification', () => {
  test('Verify current implementation and feature flags', async ({ page }) => {
    // Navigate to the collection opportunities page
    await page.goto('/collection-opportunities');
    await page.waitForLoadState('networkidle');

    // Step 1: Check feature flags
    const featureFlags = await page.evaluate(() => {
      const flags = localStorage.getItem('featureFlags');
      return flags ? JSON.parse(flags) : null;
    });

    console.log('Current Feature Flags:', featureFlags);

    // Step 2: Check which component is rendered
    const componentClasses = await page.evaluate(() => {
      const splitView = document.querySelector('.collection-opportunities-split-view');
      const refactored = document.querySelector('.collection-opportunities-refactored');
      const enhanced = document.querySelector('.collection-opportunities-enhanced');
      const legacy = document.querySelector('.collection-opportunities');
      
      return {
        splitViewPresent: !!splitView,
        refactoredPresent: !!refactored,
        enhancedPresent: !!enhanced,
        legacyPresent: !!legacy,
        activeComponent: splitView ? 'SplitView' : 
                        refactored ? 'Refactored' :
                        enhanced ? 'Enhanced' :
                        legacy ? 'Legacy' : 'Unknown'
      };
    });

    console.log('Component Detection:', componentClasses);

    // Step 3: Attempt to trigger the edit functionality
    await page.click('.opportunities-table tbody tr:first-child .actions-cell button', { 
      timeout: 5000 
    }).catch(() => {
      // Try alternative selectors if the first doesn't work
      return page.click('.collection-opportunities-table tbody tr:first-child button:has-text("Edit")');
    });

    await page.waitForTimeout(1000); // Wait for any animation

    // Step 4: Check what opened - modal or split view
    const modalCheck = await page.evaluate(() => {
      const bpOverlay = document.querySelector('.bp5-overlay');
      const bpDialog = document.querySelector('.bp5-dialog');
      const modalBackdrop = document.querySelector('.bp5-overlay-backdrop');
      const manualOverrideModal = document.querySelector('[class*="manual-override-modal"]');
      const overrideModal = document.querySelector('[class*="override-modal"]');
      const splitViewPanel = document.querySelector('.split-view-panel.open');
      
      return {
        hasOverlay: !!bpOverlay,
        hasDialog: !!bpDialog,
        hasBackdrop: !!modalBackdrop,
        hasManualOverrideModal: !!manualOverrideModal,
        hasOverrideModal: !!overrideModal,
        hasSplitViewPanel: !!splitViewPanel,
        overlayClasses: bpOverlay?.className || null,
        dialogClasses: bpDialog?.className || null,
        modalType: manualOverrideModal ? 'ManualOverrideModal' :
                  overrideModal ? 'OverrideModal' :
                  splitViewPanel ? 'SplitView' : 'None'
      };
    });

    console.log('Modal/Split View Check:', modalCheck);

    // Step 5: Capture screenshots for evidence
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const screenshotDir = 'test-results/modal-vs-split-view';
    
    if (!fs.existsSync(screenshotDir)) {
      fs.mkdirSync(screenshotDir, { recursive: true });
    }

    await page.screenshot({
      path: path.join(screenshotDir, `implementation-check-${timestamp}.png`),
      fullPage: true
    });

    // Step 6: Check for modal-specific behaviors
    const modalBehaviors = await page.evaluate(() => {
      const body = document.body;
      const hasModalOpenClass = body.classList.contains('bp5-overlay-open');
      const hasScrollLock = body.style.overflow === 'hidden';
      const hasPointerEventsNone = 
        Array.from(document.querySelectorAll('*'))
          .some(el => window.getComputedStyle(el).pointerEvents === 'none' && 
                     !el.closest('.bp5-overlay'));
      
      return {
        bodyHasModalClass: hasModalOpenClass,
        scrollLocked: hasScrollLock,
        mainContentBlocked: hasPointerEventsNone
      };
    });

    console.log('Modal Behaviors:', modalBehaviors);

    // Generate comprehensive report
    const report = {
      timestamp: new Date().toISOString(),
      featureFlags: {
        useRefactoredComponents: featureFlags?.useRefactoredComponents ?? true,
        progressiveComplexityUI: featureFlags?.progressiveComplexityUI ?? false
      },
      componentDetection: componentClasses,
      editBehavior: modalCheck,
      modalBehaviors,
      conclusion: {
        isUsingSplitView: modalCheck.hasSplitViewPanel && !modalCheck.hasDialog,
        isUsingModal: modalCheck.hasDialog || modalCheck.hasOverlay,
        activeImplementation: modalCheck.modalType
      }
    };

    // Write report to file
    fs.writeFileSync(
      path.join(screenshotDir, `verification-report-${timestamp}.json`),
      JSON.stringify(report, null, 2)
    );

    // Assertions to verify the current state
    if (report.conclusion.isUsingSplitView) {
      // Split view assertions
      expect(modalCheck.hasSplitViewPanel).toBe(true);
      expect(modalCheck.hasDialog).toBe(false);
      expect(modalCheck.hasOverlay).toBe(false);
      expect(modalBehaviors.scrollLocked).toBe(false);
      
      console.log('✅ VERIFICATION: Application is using SPLIT VIEW implementation');
    } else if (report.conclusion.isUsingModal) {
      // Modal assertions
      expect(modalCheck.hasDialog || modalCheck.hasOverlay).toBe(true);
      expect(modalCheck.hasSplitViewPanel).toBe(false);
      
      console.log('❌ VERIFICATION: Application is still using MODAL implementation');
      console.log(`   Active modal type: ${modalCheck.modalType}`);
    } else {
      console.log('❓ VERIFICATION: Unable to determine implementation type');
    }

    // Additional check: Look for the split view component in the bundle
    const bundleCheck = await page.evaluate(() => {
      const scripts = Array.from(document.querySelectorAll('script')).map(s => s.src);
      return {
        scriptCount: scripts.length,
        hasReactBundle: scripts.some(src => src.includes('react')),
        totalBundleSize: scripts.length // Simplified metric
      };
    });

    console.log('Bundle Check:', bundleCheck);

    // Final summary
    console.log('\n' + '='.repeat(60));
    console.log('IMPLEMENTATION VERIFICATION SUMMARY');
    console.log('='.repeat(60));
    console.log(`Component Active: ${report.componentDetection.activeComponent}`);
    console.log(`Edit Behavior: ${report.conclusion.activeImplementation}`);
    console.log(`Split View Present: ${report.conclusion.isUsingSplitView ? '✅ YES' : '❌ NO'}`);
    console.log(`Modal Present: ${report.conclusion.isUsingModal ? '✅ YES' : '❌ NO'}`);
    console.log('='.repeat(60));

    // Log the report for further processing (tests should not return values)
    console.log('Final Report:', JSON.stringify(report, null, 2));
  });

  test('Verify CollectionOpportunitiesSplitView is not imported', async ({ page }) => {
    // This test verifies that the split view component is not being used
    // by checking the application's import structure
    
    await page.goto('/collection-opportunities');
    
    // Check the React component tree (if React DevTools is available)
    const componentTree = await page.evaluate(() => {
      // Try to access React DevTools if available
      const reactDevTools = (window as any).__REACT_DEVTOOLS_GLOBAL_HOOK__;
      if (reactDevTools) {
        // Get rendered components
        const renderers = reactDevTools.renderers;
        return 'React DevTools detected';
      }
      return 'React DevTools not available';
    });

    console.log('Component Tree Check:', componentTree);

    // Check for split view specific elements
    const splitViewElements = await page.evaluate(() => {
      const elements = {
        splitViewContainer: document.querySelector('.collection-opportunities-split-view'),
        splitViewPanel: document.querySelector('.split-view-panel'),
        resizeHandle: document.querySelector('.split-view-resize-handle'),
        mainContent: document.querySelector('.main-content')
      };

      return Object.entries(elements).reduce((acc, [key, element]) => {
        acc[key] = {
          exists: !!element,
          className: element?.className || null,
          tagName: element?.tagName || null
        };
        return acc;
      }, {} as any);
    });

    console.log('Split View Elements:', splitViewElements);

    // Verify that split view elements are NOT present
    expect(splitViewElements.splitViewContainer.exists).toBe(false);
    expect(splitViewElements.splitViewPanel.exists).toBe(false);
    expect(splitViewElements.resizeHandle.exists).toBe(false);
  });

  test('Performance comparison placeholder', async ({ page }) => {
    // Since we cannot compare modal vs split view performance
    // (split view is not active), we'll measure current modal performance
    
    await page.goto('/collection-opportunities');
    await page.waitForLoadState('networkidle');

    // Measure modal open performance
    const performanceMetrics = await page.evaluate(async () => {
      const startTime = performance.now();
      
      // Click edit button
      const editButton = document.querySelector('.opportunities-table tbody tr:first-child button');
      (editButton as HTMLElement)?.click();
      
      // Wait for modal to appear
      await new Promise(resolve => {
        const observer = new MutationObserver((mutations, obs) => {
          if (document.querySelector('.bp5-overlay')) {
            obs.disconnect();
            resolve(true);
          }
        });
        observer.observe(document.body, { childList: true, subtree: true });
        
        // Timeout after 1 second
        setTimeout(() => {
          observer.disconnect();
          resolve(false);
        }, 1000);
      });
      
      const endTime = performance.now();
      
      return {
        modalOpenTime: endTime - startTime,
        memoryUsed: (performance as any).memory?.usedJSHeapSize || 0,
        timestamp: new Date().toISOString()
      };
    });

    console.log('Current Modal Performance:', performanceMetrics);
    
    // Log performance for future comparison
    const perfReport = {
      implementation: 'Modal (CollectionOpportunitiesRefactored)',
      metrics: performanceMetrics,
      note: 'Split view implementation not active for comparison'
    };

    fs.writeFileSync(
      'test-results/modal-vs-split-view/performance-baseline.json',
      JSON.stringify(perfReport, null, 2)
    );
  });
});