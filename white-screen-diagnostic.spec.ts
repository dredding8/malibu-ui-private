import { test, expect } from '@playwright/test';

/**
 * Emergency White Screen Diagnostic Suite
 * Systematic investigation of application loading issues
 */

test.describe('White Screen Root Cause Analysis', () => {
  test('Initial page load and error detection', async ({ page }) => {
    // Comprehensive error tracking
    const errors: string[] = [];
    const consoleMessages: { type: string; message: string }[] = [];
    const networkFailures: any[] = [];

    // Set up error listeners before navigation
    page.on('console', msg => {
      consoleMessages.push({
        type: msg.type(),
        message: msg.text()
      });
    });

    page.on('pageerror', error => {
      errors.push(error.message);
    });

    page.on('requestfailed', request => {
      networkFailures.push({
        url: request.url(),
        failure: request.failure()?.errorText,
        method: request.method(),
        resourceType: request.resourceType()
      });
    });

    console.log('🔍 Starting white screen diagnostic...');

    try {
      // Navigate to main page
      await page.goto('http://localhost:3000', {
        waitUntil: 'networkidle',
        timeout: 30000
      });

      // Basic page load checks
      const title = await page.title();
      console.log('✅ Page Title:', title);

      // Check if React root exists
      const reactRoot = await page.locator('#root').count();
      console.log('✅ React Root Element Found:', reactRoot > 0);

      if (reactRoot === 0) {
        console.log('❌ CRITICAL: No React root element found in DOM');
      }

      // Check for any visible content
      const bodyText = await page.locator('body').textContent();
      console.log('✅ Body Text Length:', bodyText?.length || 0);
      
      if (bodyText && bodyText.trim().length > 0) {
        console.log('✅ Body Text Preview:', bodyText.substring(0, 200));
      }

      // Take diagnostic screenshot
      await page.screenshot({
        path: 'debug-white-screen.png',
        fullPage: true
      });
      console.log('📸 Screenshot saved as debug-white-screen.png');

    } catch (error) {
      console.log('❌ Page Navigation Error:', error);
    }

    // Report all collected diagnostics
    console.log('\n📋 DIAGNOSTIC SUMMARY:');
    console.log('JavaScript Errors:', errors.length);
    errors.forEach((error, i) => console.log(`  ${i + 1}. ${error}`));

    console.log('Console Messages:', consoleMessages.length);
    consoleMessages.forEach((msg, i) => {
      if (msg.type === 'error' || msg.type === 'warning') {
        console.log(`  ${i + 1}. [${msg.type}] ${msg.message}`);
      }
    });

    console.log('Network Failures:', networkFailures.length);
    networkFailures.forEach((req, i) => {
      console.log(`  ${i + 1}. ${req.method} ${req.url} - ${req.failure}`);
    });
  });

  test('React application state investigation', async ({ page }) => {
    console.log('🔍 Investigating React application state...');

    await page.goto('http://localhost:3000');
    await page.waitForTimeout(5000); // Wait for potential slow loading

    // Check React presence
    const reactCheck = await page.evaluate(() => {
      return {
        React: typeof (window as any).React !== 'undefined',
        ReactDOM: typeof (window as any).ReactDOM !== 'undefined',
        devTools: !!(window as any).__REACT_DEVTOOLS_GLOBAL_HOOK__
      };
    });
    console.log('✅ React Environment:', reactCheck);

    // Check for React error boundaries
    const errorBoundaryMessages = await page.locator('text=/something went wrong/i, text=/error occurred/i').count();
    console.log('❌ Error Boundary Triggered:', errorBoundaryMessages > 0);

    // Check for specific React errors in content
    const reactErrors = await page.locator('text=/element type is invalid/i, text=/cannot read prop/i').count();
    console.log('❌ React Element Errors:', reactErrors > 0);

    // Examine DOM structure
    const rootContent = await page.locator('#root').innerHTML().catch(() => '');
    console.log('✅ Root Content Length:', rootContent.length);
    
    if (rootContent.length === 0) {
      console.log('❌ CRITICAL: React root is empty - app not mounting');
    } else {
      console.log('✅ Root Content Preview:', rootContent.substring(0, 300));
    }
  });

  test('useLocalization hook dependency check', async ({ page }) => {
    console.log('🔍 Checking useLocalization hook implementation...');

    await page.goto('http://localhost:3000');

    // Inject debugging script to test hooks
    await page.addScriptTag({
      content: `
        console.log('🧪 Testing React hooks...');
        
        // Check if React is available
        if (typeof React !== 'undefined') {
          console.log('✅ React is available globally');
          
          // Try to access React hooks
          if (React.useMemo && React.useState) {
            console.log('✅ React hooks are available');
          } else {
            console.log('❌ React hooks not available');
          }
        } else {
          console.log('❌ React not available globally');
        }
      `
    });

    // Wait for script execution
    await page.waitForTimeout(1000);

    // Check if the localization hook can be imported (indirectly)
    const hookTest = await page.evaluate(() => {
      try {
        // This will be undefined if the module system isn't working
        return {
          moduleSystem: typeof require !== 'undefined' || typeof (window as any).import !== 'undefined',
          react: typeof (window as any).React !== 'undefined'
        };
      } catch (e) {
        return { error: e.message };
      }
    });
    console.log('✅ Hook Dependencies Check:', hookTest);
  });

  test('History page direct navigation test', async ({ page }) => {
    console.log('🔍 Testing direct History page navigation...');

    try {
      await page.goto('http://localhost:3000/history', {
        waitUntil: 'networkidle',
        timeout: 15000
      });

      // Check for History page content
      const historyElements = await page.evaluate(() => {
        return {
          h3Count: document.querySelectorAll('h3').length,
          blueprintNavbar: document.querySelectorAll('.bp4-navbar').length,
          blueprintTable: document.querySelectorAll('.bp4-table').length,
          collectionStatus: document.querySelectorAll('[data-testid="collection-status-tag"]').length,
          algorithmStatus: document.querySelectorAll('[data-testid="algorithm-status-indicator"]').length
        };
      });

      console.log('✅ History Page Elements:', historyElements);

      // Check for specific error patterns
      const pageContent = await page.content();
      const hasLocalizationError = pageContent.includes('useLocalization') && pageContent.includes('error');
      console.log('❌ Localization Errors Visible:', hasLocalizationError);

    } catch (error) {
      console.log('❌ History Page Navigation Failed:', error.message);
    }
  });

  test('TypeScript and build configuration check', async ({ page }) => {
    console.log('🔍 Checking build and compilation issues...');

    // Try to access static assets directly
    try {
      const staticCheck = await page.goto('http://localhost:3000/static/css/', {
        waitUntil: 'domcontentloaded',
        timeout: 10000
      });
      console.log('✅ Static CSS Directory Accessible:', staticCheck?.ok());
    } catch (e) {
      console.log('❌ Static Assets Check Failed:', e.message);
    }

    try {
      const jsCheck = await page.goto('http://localhost:3000/static/js/', {
        waitUntil: 'domcontentloaded', 
        timeout: 10000
      });
      console.log('✅ Static JS Directory Accessible:', jsCheck?.ok());
    } catch (e) {
      console.log('❌ Static JS Assets Check Failed:', e.message);
    }

    // Return to main page for final checks
    await page.goto('http://localhost:3000');
    
    // Check for webpack/build related errors
    const buildErrors = await page.evaluate(() => {
      const perfEntries = (window.performance as any).getEntriesByType?.('navigation') || [];
      return perfEntries.map((entry: any) => ({
        name: entry.name,
        duration: entry.duration,
        transferSize: entry.transferSize,
        responseStatus: entry.responseStatus
      }));
    });
    console.log('✅ Build Performance Data:', buildErrors);
  });

  test('Router configuration investigation', async ({ page }) => {
    console.log('🔍 Checking React Router configuration...');

    await page.goto('http://localhost:3000');
    await page.waitForTimeout(2000);

    // Check for router-related elements and errors
    const routerCheck = await page.evaluate(() => {
      return {
        routerDOM: typeof (window as any).ReactRouterDOM !== 'undefined',
        currentURL: window.location.href,
        pathname: window.location.pathname,
        hashrouting: window.location.hash
      };
    });
    console.log('✅ Router Environment:', routerCheck);

    // Test route navigation
    try {
      await page.click('a[href="/history"]', { timeout: 5000 });
      console.log('✅ History link navigation attempted');
      
      await page.waitForTimeout(2000);
      const newURL = page.url();
      console.log('✅ Post-click URL:', newURL);
    } catch (e) {
      console.log('❌ Navigation Link Error:', e.message);
    }
  });

  test('CSS and styling investigation', async ({ page }) => {
    console.log('🔍 Checking CSS and Blueprint styling...');

    await page.goto('http://localhost:3000');
    await page.waitForTimeout(3000);

    // Check if Blueprint CSS is loaded
    const styleCheck = await page.evaluate(() => {
      const stylesheets = Array.from(document.styleSheets);
      const blueprintCSS = stylesheets.some(sheet => {
        try {
          return sheet.href && (sheet.href.includes('blueprint') || 
            Array.from(sheet.cssRules || []).some((rule: any) => 
              rule.selectorText && rule.selectorText.includes('bp4')));
        } catch {
          return false;
        }
      });

      return {
        totalStylesheets: stylesheets.length,
        blueprintDetected: blueprintCSS,
        hasInlineStyles: document.querySelectorAll('style').length
      };
    });
    console.log('✅ CSS Loading Check:', styleCheck);

    // Check if elements have expected Blueprint classes
    const blueprintElements = await page.evaluate(() => {
      return {
        bp4Elements: document.querySelectorAll('[class*="bp4-"]').length,
        navbarElements: document.querySelectorAll('.bp4-navbar').length,
        buttonElements: document.querySelectorAll('.bp4-button').length
      };
    });
    console.log('✅ Blueprint Elements Found:', blueprintElements);
  });
});