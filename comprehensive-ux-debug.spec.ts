import { test, expect, Page } from '@playwright/test';
import { promises as fs } from 'fs';
import path from 'path';

// Utility function to save DOM structure
async function saveDOMStructure(page: Page, filename: string) {
  const html = await page.content();
  await fs.writeFile(`debug-${filename}.html`, html);
}

// Utility function to check if element exists but is hidden
async function checkElementVisibility(page: Page, selector: string, componentName: string) {
  const element = page.locator(selector);
  const exists = await element.count() > 0;
  
  if (exists) {
    const isVisible = await element.isVisible();
    const styles = await element.evaluate(el => {
      const computed = window.getComputedStyle(el);
      return {
        display: computed.display,
        visibility: computed.visibility,
        opacity: computed.opacity,
        position: computed.position,
        zIndex: computed.zIndex,
        transform: computed.transform,
        overflow: computed.overflow
      };
    });
    
    console.log(`${componentName} - Exists: ${exists}, Visible: ${isVisible}`);
    console.log(`${componentName} styles:`, styles);
    
    return { exists, isVisible, styles };
  }
  
  console.log(`${componentName} - Not found in DOM`);
  return { exists: false, isVisible: false, styles: null };
}

// Utility function to capture comprehensive network info
async function captureNetworkInfo(page: Page) {
  const networkErrors: any[] = [];
  const resourceLoads: any[] = [];
  
  page.on('requestfailed', request => {
    networkErrors.push({
      url: request.url(),
      error: request.failure()?.errorText,
      method: request.method(),
      resourceType: request.resourceType()
    });
  });
  
  page.on('response', response => {
    if (!response.ok()) {
      networkErrors.push({
        url: response.url(),
        status: response.status(),
        statusText: response.statusText()
      });
    }
    
    resourceLoads.push({
      url: response.url(),
      status: response.status(),
      contentType: response.headers()['content-type'],
      resourceType: response.request().resourceType()
    });
  });
  
  return { networkErrors, resourceLoads };
}

test.describe('Comprehensive UX Component Debug Analysis', () => {
  let consoleMessages: any[] = [];
  let jsErrors: any[] = [];
  let networkInfo: any = {};

  test.beforeEach(async ({ page }) => {
    // Capture console messages
    page.on('console', msg => {
      consoleMessages.push({
        type: msg.type(),
        text: msg.text(),
        timestamp: new Date().toISOString()
      });
    });

    // Capture JavaScript errors
    page.on('pageerror', error => {
      jsErrors.push({
        message: error.message,
        stack: error.stack,
        timestamp: new Date().toISOString()
      });
    });

    // Set up network monitoring
    networkInfo = await captureNetworkInfo(page);
  });

  test('Comprehensive UX Component Analysis - Dashboard', async ({ page }) => {
    console.log('🔍 Starting comprehensive UX component analysis on Dashboard...');

    // Navigate to dashboard
    await page.goto('http://localhost:3000/dashboard');
    
    // Wait for React to initialize
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(3000);

    // 1. Initial page state screenshot
    await page.screenshot({ 
      path: 'debug-01-dashboard-initial-state.png', 
      fullPage: true 
    });

    // 2. Check React mounting
    console.log('🧪 Checking React mounting...');
    const reactRoot = await page.evaluate(() => {
      const rootElement = document.getElementById('root');
      return {
        exists: !!rootElement,
        hasChildren: rootElement?.children.length || 0,
        innerHTML: rootElement?.innerHTML?.slice(0, 500) || 'No content'
      };
    });
    console.log('React root status:', reactRoot);

    // 3. Check App component rendering
    const appComponent = await checkElementVisibility(page, '[data-testid="app"], .App, #app', 'App Component');
    await page.screenshot({ 
      path: 'debug-02-app-component-check.png', 
      fullPage: true 
    });

    // 4. Save initial DOM structure
    await saveDOMStructure(page, 'initial-dashboard');

    // 5. Check CSS loading
    console.log('🎨 Checking CSS loading...');
    const cssInfo = await page.evaluate(() => {
      const stylesheets = Array.from(document.styleSheets);
      return stylesheets.map(sheet => {
        try {
          return {
            href: sheet.href,
            rules: sheet.cssRules?.length || 0,
            disabled: sheet.disabled,
            media: sheet.media.mediaText
          };
        } catch (e) {
          return {
            href: sheet.href,
            error: 'Cannot access stylesheet (CORS?)',
            disabled: sheet.disabled
          };
        }
      });
    });
    console.log('CSS Stylesheets:', cssInfo);

    // 6. Check for NavigationFAB
    console.log('🧭 Checking NavigationFAB...');
    const fabChecks = await Promise.all([
      checkElementVisibility(page, '[data-testid="navigation-fab"]', 'NavigationFAB (data-testid)'),
      checkElementVisibility(page, '.navigation-fab', 'NavigationFAB (class)'),
      checkElementVisibility(page, '.NavigationFAB', 'NavigationFAB (component class)'),
      checkElementVisibility(page, 'button[aria-label*="navigation"], button[aria-label*="Navigation"]', 'NavigationFAB (aria-label)'),
      checkElementVisibility(page, '.fab, .floating-action-button', 'FAB (generic classes)')
    ]);
    
    await page.screenshot({ 
      path: 'debug-03-navigation-fab-check.png', 
      fullPage: true 
    });

    // 7. Check for Breadcrumbs
    console.log('🍞 Checking Breadcrumbs...');
    const breadcrumbChecks = await Promise.all([
      checkElementVisibility(page, '[data-testid="breadcrumbs"]', 'Breadcrumbs (data-testid)'),
      checkElementVisibility(page, '.breadcrumbs', 'Breadcrumbs (class)'),
      checkElementVisibility(page, 'nav[aria-label*="breadcrumb"], .bp5-breadcrumbs', 'Breadcrumbs (semantic/Blueprint)'),
      checkElementVisibility(page, 'ol, ul', 'Breadcrumb lists')
    ]);

    await page.screenshot({ 
      path: 'debug-04-breadcrumbs-check.png', 
      fullPage: true 
    });

    // 8. Check for other navigation components
    console.log('🧩 Checking other navigation components...');
    const navChecks = await Promise.all([
      checkElementVisibility(page, '[data-testid="app-navbar"]', 'AppNavbar (data-testid)'),
      checkElementVisibility(page, '.app-navbar, .navbar', 'AppNavbar (class)'),
      checkElementVisibility(page, 'header, nav', 'Generic navigation elements'),
      checkElementVisibility(page, '.bp5-navbar, .bp5-nav', 'Blueprint navigation')
    ]);

    await page.screenshot({ 
      path: 'debug-05-navigation-components-check.png', 
      fullPage: true 
    });

    // 9. Check for UX enhancement components
    console.log('✨ Checking UX enhancement components...');
    const uxChecks = await Promise.all([
      checkElementVisibility(page, '[data-testid="contextual-help"]', 'ContextualHelp'),
      checkElementVisibility(page, '[data-testid="navigation-aids"]', 'NavigationAids'),
      checkElementVisibility(page, '[data-testid="progressive-disclosure"]', 'ProgressiveDisclosure'),
      checkElementVisibility(page, '[data-testid="predictive-progress"]', 'PredictiveProgress'),
      checkElementVisibility(page, '.contextual-help, .navigation-aids', 'UX components (classes)')
    ]);

    await page.screenshot({ 
      path: 'debug-06-ux-components-check.png', 
      fullPage: true 
    });

    // 10. Check React Router and routing
    console.log('🛣️ Checking React Router...');
    const routingInfo = await page.evaluate(() => {
      // Check if React Router is available
      const hasReactRouter = !!(window as any).React || document.querySelector('[data-reactroot]');
      const currentPath = window.location.pathname;
      const currentHash = window.location.hash;
      const currentSearch = window.location.search;
      
      return {
        hasReactRouter,
        currentPath,
        currentHash,
        currentSearch,
        href: window.location.href
      };
    });
    console.log('Routing info:', routingInfo);

    // 11. Check component imports and modules
    console.log('📦 Checking module loading...');
    const moduleInfo = await page.evaluate(() => {
      // Check for common React/component indicators
      const hasReact = !!(window as any).React;
      const hasReactDOM = !!(window as any).ReactDOM;
      const appElement = document.querySelector('#root > *');
      const hasAppContent = !!appElement;
      
      return {
        hasReact,
        hasReactDOM,
        hasAppContent,
        appElementTag: appElement?.tagName,
        appElementClasses: appElement?.className,
        totalElements: document.querySelectorAll('*').length
      };
    });
    console.log('Module info:', moduleInfo);

    // 12. Detailed DOM inspection for missing components
    console.log('🔬 Performing detailed DOM inspection...');
    const domInspection = await page.evaluate(() => {
      const body = document.body;
      const root = document.getElementById('root');
      
      // Get all elements with common UX component patterns
      const suspiciousElements = Array.from(document.querySelectorAll('*')).filter(el => {
        const className = el.className?.toString() || '';
        const dataTestId = el.getAttribute('data-testid') || '';
        const ariaLabel = el.getAttribute('aria-label') || '';
        
        return className.includes('nav') || 
               className.includes('fab') || 
               className.includes('breadcrumb') ||
               dataTestId.includes('nav') ||
               dataTestId.includes('fab') ||
               ariaLabel.includes('nav');
      });
      
      return {
        bodyChildCount: body.children.length,
        rootChildCount: root?.children.length || 0,
        suspiciousElements: suspiciousElements.map(el => ({
          tagName: el.tagName,
          className: el.className,
          id: el.id,
          dataTestId: el.getAttribute('data-testid'),
          ariaLabel: el.getAttribute('aria-label'),
          textContent: el.textContent?.slice(0, 100)
        })),
        allDataTestIds: Array.from(document.querySelectorAll('[data-testid]')).map(el => 
          el.getAttribute('data-testid')
        ),
        allClasses: Array.from(new Set(
          Array.from(document.querySelectorAll('*'))
            .map(el => el.className?.toString().split(' ') || [])
            .flat()
            .filter(c => c.length > 0)
        )).slice(0, 50) // First 50 unique classes
      };
    });
    console.log('DOM inspection results:', domInspection);

    // 13. Screenshot after detailed inspection
    await page.screenshot({ 
      path: 'debug-07-detailed-dom-inspection.png', 
      fullPage: true 
    });

    // 14. Check specific Blueprint UI components
    console.log('🎯 Checking Blueprint UI components...');
    const blueprintCheck = await page.evaluate(() => {
      const bpElements = Array.from(document.querySelectorAll('[class*="bp5"], [class*="bp4"], [class*="bp3"]'));
      return {
        blueprintElementCount: bpElements.length,
        blueprintClasses: bpElements.map(el => el.className).slice(0, 10),
        hasBlueprintCSS: !!Array.from(document.styleSheets).find(sheet => 
          sheet.href?.includes('blueprint') || 
          (sheet.ownerNode as HTMLElement)?.textContent?.includes('bp5')
        )
      };
    });
    console.log('Blueprint check:', blueprintCheck);

    // 15. Final comprehensive screenshot
    await page.screenshot({ 
      path: 'debug-08-final-comprehensive-state.png', 
      fullPage: true 
    });

    // 16. Save final DOM structure
    await saveDOMStructure(page, 'final-dashboard');

    // Generate summary report
    const debugReport = {
      timestamp: new Date().toISOString(),
      url: page.url(),
      reactRoot,
      appComponent,
      cssInfo,
      fabChecks,
      breadcrumbChecks,
      navChecks,
      uxChecks,
      routingInfo,
      moduleInfo,
      domInspection,
      blueprintCheck,
      consoleMessages: consoleMessages.slice(0, 20), // Last 20 messages
      jsErrors,
      networkErrors: networkInfo.networkErrors,
      resourceLoads: networkInfo.resourceLoads?.filter((r: any) => r.resourceType === 'stylesheet' || r.resourceType === 'script')
    };

    await fs.writeFile('debug-comprehensive-report.json', JSON.stringify(debugReport, null, 2));
    console.log('📊 Debug report saved to debug-comprehensive-report.json');

    // Log summary to console
    console.log('\n📋 SUMMARY OF FINDINGS:');
    console.log(`React mounted: ${reactRoot.exists}`);
    console.log(`App component visible: ${appComponent.isVisible}`);
    console.log(`CSS stylesheets loaded: ${cssInfo.length}`);
    console.log(`NavigationFAB found: ${fabChecks.some(check => check.exists)}`);
    console.log(`Breadcrumbs found: ${breadcrumbChecks.some(check => check.exists)}`);
    console.log(`Navigation components found: ${navChecks.some(check => check.exists)}`);
    console.log(`UX components found: ${uxChecks.some(check => check.exists)}`);
    console.log(`JavaScript errors: ${jsErrors.length}`);
    console.log(`Network errors: ${networkInfo.networkErrors?.length || 0}`);
    console.log(`Total DOM elements: ${domInspection.totalElements}`);
    console.log(`Blueprint components: ${blueprintCheck.blueprintElementCount}`);
  });

  test('Test Other Key Pages', async ({ page }) => {
    const pages = [
      { path: '/collection-decks', name: 'Collection Decks' },
      { path: '/create-collection-deck', name: 'Create Collection Deck' },
      { path: '/history', name: 'History' },
      { path: '/analytics', name: 'Analytics' }
    ];

    for (const pageInfo of pages) {
      console.log(`🔍 Testing ${pageInfo.name} page...`);
      
      try {
        await page.goto(`http://localhost:3000${pageInfo.path}`);
        await page.waitForLoadState('networkidle');
        await page.waitForTimeout(2000);
        
        // Take screenshot
        const safeName = pageInfo.name.toLowerCase().replace(/\s+/g, '-');
        await page.screenshot({ 
          path: `debug-page-${safeName}.png`, 
          fullPage: true 
        });
        
        // Quick component check
        const quickCheck = await Promise.all([
          checkElementVisibility(page, '[data-testid="navigation-fab"]', `${pageInfo.name} - NavigationFAB`),
          checkElementVisibility(page, '[data-testid="breadcrumbs"]', `${pageInfo.name} - Breadcrumbs`),
          checkElementVisibility(page, '[data-testid="app-navbar"]', `${pageInfo.name} - AppNavbar`)
        ]);
        
        console.log(`${pageInfo.name} component visibility:`, quickCheck.map(c => c.exists));
        
      } catch (error) {
        console.log(`❌ Error testing ${pageInfo.name}:`, error);
        await page.screenshot({ 
          path: `debug-error-${pageInfo.name.toLowerCase().replace(/\s+/g, '-')}.png`, 
          fullPage: true 
        });
      }
    }
  });
});