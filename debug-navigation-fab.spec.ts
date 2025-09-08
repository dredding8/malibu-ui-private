import { test, expect } from '@playwright/test';

test.describe('Debug NavigationFAB', () => {
  test('Check NavigationFAB presence and visibility', async ({ page }) => {
    await page.goto('http://localhost:3000');
    await page.waitForLoadState('networkidle');
    
    // Take initial screenshot
    await page.screenshot({ path: 'debug-fab-01-initial.png', fullPage: true });
    
    // Check if NavigationFAB exists in DOM
    const fabInDOM = await page.locator('.navigation-fab').count();
    console.log(`NavigationFAB elements in DOM: ${fabInDOM}`);
    
    // Check if NavigationAids.css is loaded
    const cssLoaded = await page.evaluate(() => {
      const stylesheets = Array.from(document.styleSheets);
      let fabStyleFound = false;
      let rules: string[] = [];
      
      stylesheets.forEach(sheet => {
        try {
          const cssRules = Array.from(sheet.cssRules || []);
          cssRules.forEach(rule => {
            if (rule.cssText?.includes('navigation-fab')) {
              fabStyleFound = true;
              rules.push(rule.cssText);
            }
          });
        } catch (e) {
          // Cross-origin stylesheets will throw
        }
      });
      
      return { fabStyleFound, rules };
    });
    
    console.log('CSS loaded:', cssLoaded.fabStyleFound);
    console.log('FAB CSS rules:', cssLoaded.rules);
    
    // Check computed styles if element exists
    if (fabInDOM > 0) {
      const fabStyles = await page.locator('.navigation-fab').first().evaluate(el => {
        const styles = window.getComputedStyle(el);
        return {
          display: styles.display,
          visibility: styles.visibility,
          position: styles.position,
          zIndex: styles.zIndex,
          opacity: styles.opacity,
          bottom: styles.bottom,
          right: styles.right,
          width: styles.width,
          height: styles.height
        };
      });
      
      console.log('FAB computed styles:', fabStyles);
    }
    
    // Check if NavigationFAB component is imported in App.tsx
    const appSource = await page.evaluate(() => {
      // Check if NavigationFAB is in the page source
      return document.documentElement.innerHTML.includes('navigation-fab');
    });
    
    console.log('navigation-fab class in HTML:', appSource);
    
    // Try scrolling to bottom to see if FAB appears
    await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight));
    await page.waitForTimeout(1000);
    await page.screenshot({ path: 'debug-fab-02-after-scroll.png', fullPage: true });
    
    // Check React component tree
    const reactComponents = await page.evaluate(() => {
      const getReactFiber = (dom: any) => {
        const key = Object.keys(dom).find(key => key.startsWith('__reactFiber'));
        return key ? dom[key] : null;
      };
      
      const findReactComponents = (fiber: any, components: string[] = []): string[] => {
        if (!fiber) return components;
        
        if (fiber.elementType?.name) {
          components.push(fiber.elementType.name);
        }
        
        if (fiber.child) findReactComponents(fiber.child, components);
        if (fiber.sibling) findReactComponents(fiber.sibling, components);
        
        return components;
      };
      
      const root = document.getElementById('root');
      if (!root) return [];
      
      const fiber = getReactFiber(root);
      return fiber ? findReactComponents(fiber) : [];
    });
    
    console.log('React components found:', reactComponents);
    
    // Final assertion
    if (fabInDOM > 0) {
      const fab = page.locator('.navigation-fab').first();
      await expect(fab).toBeVisible();
    } else {
      console.error('NavigationFAB not found in DOM!');
      expect(fabInDOM).toBeGreaterThan(0);
    }
  });
});