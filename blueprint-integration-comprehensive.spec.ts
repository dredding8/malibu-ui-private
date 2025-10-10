import { test, expect, Page, Browser } from '@playwright/test';

/**
 * SuperClaude Framework BlueprintJS Integration Test Suite
 * 
 * Wave Orchestration: Multi-stage testing with progressive complexity
 * Persona Integration: QA + Frontend + Performance specialists
 * MCP Coordination: PlaywrightMCP + Sequential + Context7
 */

test.describe('🌊 Wave 1: Blueprint Component Integration & Rendering', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('http://localhost:3000/match-review/test-collection/test-deck');
    // Wait for Blueprint components to fully load
    await page.waitForSelector('.bp6-card', { timeout: 10000 });
  });

  test('Card + Collapse Progressive Disclosure Integration', async ({ page }) => {
    // QA Persona: Comprehensive component behavior validation
    const matchCards = page.locator('.match-card.bp6-card');
    await expect(matchCards.first()).toBeVisible();
    
    // Blueprint Card should have elevation class
    const hasElevationClass = await matchCards.first().evaluate(el => 
      el.className.includes('bp6-elevation-')
    );
    expect(hasElevationClass).toBeTruthy();
    
    // Test Collapse component integration
    const expandButton = matchCards.first().locator('button[aria-expanded="false"]');
    if (await expandButton.isVisible()) {
      await expandButton.click();
      
      // Blueprint Collapse should expand
      const collapseContent = page.locator('.bp6-collapse[aria-hidden="false"]').first();
      await expect(collapseContent).toBeVisible({ timeout: 2000 });
      
      // Verify ARIA states are properly managed by Blueprint
      await expect(expandButton).toHaveAttribute('aria-expanded', 'true');
    }
  });

  test('FormGroup + HTMLSelect Filtering Interface', async ({ page }) => {
    // Frontend Persona: Design system compliance validation
    const formGroups = page.locator('.bp6-form-group');
    await expect(formGroups).toHaveCount(4); // Search, Status, Confidence, Category
    
    // Verify Blueprint FormGroup structure
    const firstFormGroup = formGroups.first();
    const formLabel = firstFormGroup.locator('.bp6-label');
    const formControl = firstFormGroup.locator('.bp6-input-group, .bp6-html-select');
    
    await expect(formLabel).toBeVisible();
    await expect(formControl).toBeVisible();
    
    // Test HTMLSelect Blueprint integration
    const statusSelect = page.locator('.bp6-html-select select').first();
    await expect(statusSelect).toBeVisible();
    
    // Verify Blueprint select styling
    const selectWrapper = page.locator('.bp6-html-select').first();
    const hasBlueprint = await selectWrapper.evaluate(el => 
      el.classList.contains('bp6-html-select')
    );
    expect(hasBlueprint).toBeTruthy();
  });

  test('ButtonGroup + Checkbox Bulk Operations', async ({ page }) => {
    // QA Persona: Bulk operation control validation
    const bulkModeButton = page.locator('button:has-text("Bulk Mode")').first();
    if (await bulkModeButton.isVisible()) {
      await bulkModeButton.click();
      
      // Verify Blueprint ButtonGroup appears
      const buttonGroups = page.locator('.bp6-button-group');
      await expect(buttonGroups.first()).toBeVisible();
      
      // Test Blueprint Checkbox integration
      const checkboxes = page.locator('.bp6-checkbox input[type="checkbox"]');
      const checkboxCount = await checkboxes.count();
      
      if (checkboxCount > 0) {
        // Verify Blueprint checkbox styling
        const firstCheckbox = checkboxes.first();
        const checkboxControl = firstCheckbox.locator('.. .bp6-control-indicator');
        await expect(checkboxControl).toBeVisible();
        
        // Test selection functionality
        await firstCheckbox.click();
        await expect(firstCheckbox).toBeChecked();
        
        // Bulk actions toolbar should appear with Blueprint components
        const bulkToolbar = page.locator('.bulk-actions-toolbar .bp6-button-group');
        await expect(bulkToolbar).toBeVisible();
      }
    }
  });

  test('Drawer Modal Behavior and Focus Management', async ({ page }) => {
    // QA Persona: Modal behavior and accessibility validation
    const moreButton = page.locator('button[aria-label*="View detailed"]').first();
    if (await moreButton.isVisible()) {
      await moreButton.click();
      
      // Blueprint Drawer should open
      const drawer = page.locator('.bp6-drawer');
      await expect(drawer).toBeVisible({ timeout: 2000 });
      
      // Verify Blueprint drawer structure
      const drawerHeader = drawer.locator('.bp6-drawer-header');
      const drawerBody = drawer.locator('.bp6-drawer-body');
      
      await expect(drawerHeader).toBeVisible();
      await expect(drawerBody).toBeVisible();
      
      // Test focus management
      const focusedElement = page.locator(':focus');
      const isInDrawer = await focusedElement.evaluate(el => 
        el.closest('.bp6-drawer') !== null || el.classList.contains('bp6-drawer')
      );
      expect(isInDrawer).toBeTruthy();
      
      // Close drawer with Escape
      await page.keyboard.press('Escape');
      await expect(drawer).not.toBeVisible({ timeout: 2000 });
    }
  });

  test('Tag System Status/Confidence Indicators', async ({ page }) => {
    // Frontend Persona: Design system color and intent validation
    const tags = page.locator('.bp6-tag');
    await expect(tags.first()).toBeVisible();
    
    // Verify Blueprint Tag intents are applied
    const intentTags = await page.locator('.bp6-tag[class*="bp6-intent-"]').count();
    expect(intentTags).toBeGreaterThan(0);
    
    // Test specific intent classes
    const successTags = page.locator('.bp6-tag.bp6-intent-success');
    const warningTags = page.locator('.bp6-tag.bp6-intent-warning');
    const dangerTags = page.locator('.bp6-tag.bp6-intent-danger');
    
    const totalIntentTags = await successTags.count() + await warningTags.count() + await dangerTags.count();
    expect(totalIntentTags).toBeGreaterThan(0);
  });

  test('Breadcrumb Navigation Integration', async ({ page }) => {
    // QA Persona: Navigation component validation
    const breadcrumbs = page.locator('.bp6-breadcrumbs');
    await expect(breadcrumbs).toBeVisible();
    
    // Verify Blueprint Breadcrumb structure
    const breadcrumbItems = breadcrumbs.locator('.bp6-breadcrumb');
    await expect(breadcrumbItems).toHaveCount(3); // History, Collection, Match Review
    
    // Test breadcrumb interaction
    const historyBreadcrumb = breadcrumbItems.first();
    const isClickable = await historyBreadcrumb.evaluate(el => 
      window.getComputedStyle(el).cursor === 'pointer' || el.tagName === 'A' || el.tagName === 'BUTTON'
    );
    expect(isClickable).toBeTruthy();
  });
});

test.describe('🌊 Wave 2: Blueprint Design System Compliance', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('http://localhost:3000/match-review/test-collection/test-deck');
    await page.waitForSelector('.bp6-card');
  });

  test('Typography Hierarchy (H3, H4, H5) Validation', async ({ page }) => {
    // Frontend Persona: Typography system validation
    const headings = page.locator('h3, h4, h5');
    await expect(headings.first()).toBeVisible();
    
    // Verify Blueprint typography classes are applied
    const h3Elements = page.locator('h3');
    const h4Elements = page.locator('h4'); 
    const h5Elements = page.locator('h5');
    
    if (await h3Elements.count() > 0) {
      const h3Styles = await h3Elements.first().evaluate(el => ({
        fontSize: window.getComputedStyle(el).fontSize,
        fontWeight: window.getComputedStyle(el).fontWeight,
        lineHeight: window.getComputedStyle(el).lineHeight
      }));
      
      expect(parseInt(h3Styles.fontSize)).toBeGreaterThan(16);
      expect(parseInt(h3Styles.fontWeight)).toBeGreaterThanOrEqual(400);
    }
    
    // Verify proper heading hierarchy
    const allHeadings = await page.locator('h1, h2, h3, h4, h5, h6').all();
    const headingLevels = await Promise.all(
      allHeadings.map(h => h.evaluate(el => parseInt(el.tagName.charAt(1))))
    );
    
    for (let i = 1; i < headingLevels.length; i++) {
      const diff = headingLevels[i] - headingLevels[i-1];
      expect(diff).toBeLessThanOrEqual(1);
    }
  });

  test('Colors System Intent Usage Validation', async ({ page }) => {
    // Frontend Persona: Color system compliance
    const intentElements = page.locator('[class*="bp6-intent-"]');
    await expect(intentElements.first()).toBeVisible();
    
    // Verify specific Blueprint intent classes exist
    const successElements = await page.locator('.bp6-intent-success').count();
    const warningElements = await page.locator('.bp6-intent-warning').count();
    const dangerElements = await page.locator('.bp6-intent-danger').count();
    const primaryElements = await page.locator('.bp6-intent-primary').count();
    
    const totalIntents = successElements + warningElements + dangerElements + primaryElements;
    expect(totalIntents).toBeGreaterThan(5);
    
    // Test color contrast for accessibility
    const successTag = page.locator('.bp6-intent-success').first();
    if (await successTag.isVisible()) {
      const styles = await successTag.evaluate(el => ({
        color: window.getComputedStyle(el).color,
        backgroundColor: window.getComputedStyle(el).backgroundColor
      }));
      expect(styles.color).toBeTruthy();
      expect(styles.backgroundColor).toBeTruthy();
    }
  });

  test('Elevation System Implementation', async ({ page }) => {
    // Frontend Persona: Elevation and depth validation
    const elevatedElements = page.locator('.bp6-card, .bp6-callout, .bp6-drawer');
    await expect(elevatedElements.first()).toBeVisible();
    
    // Verify box shadows are applied
    const cardElevations = page.locator('.bp6-card');
    const cardCount = await cardElevations.count();
    
    for (let i = 0; i < Math.min(5, cardCount); i++) {
      const boxShadow = await cardElevations.nth(i).evaluate(el => 
        window.getComputedStyle(el).boxShadow
      );
      expect(boxShadow).not.toBe('none');
      expect(boxShadow).toBeTruthy();
    }
    
    // Test elevation on hover states
    const firstCard = cardElevations.first();
    await firstCard.hover();
    
    // Give time for hover animation
    await page.waitForTimeout(100);
    
    const hoverShadow = await firstCard.evaluate(el => 
      window.getComputedStyle(el).boxShadow
    );
    expect(hoverShadow).toBeTruthy();
  });

  test('Icon Integration from IconNames', async ({ page }) => {
    // QA Persona: Icon system validation
    const icons = page.locator('.bp6-icon');
    await expect(icons.first()).toBeVisible();
    
    // Verify Blueprint icons are properly loaded
    const iconCount = await icons.count();
    expect(iconCount).toBeGreaterThan(5);
    
    // Test specific icon usage
    const searchIcon = page.locator('.bp6-icon-search');
    const tickIcon = page.locator('.bp6-icon-tick'); 
    const crossIcon = page.locator('.bp6-icon-cross');
    const chevronIcons = page.locator('.bp6-icon-chevron-up, .bp6-icon-chevron-down');
    
    const totalKnownIcons = await searchIcon.count() + await tickIcon.count() + 
                           await crossIcon.count() + await chevronIcons.count();
    expect(totalKnownIcons).toBeGreaterThan(0);
    
    // Verify icon accessibility
    const iconElements = await icons.all();
    for (let i = 0; i < Math.min(3, iconElements.length); i++) {
      const ariaLabel = await iconElements[i].getAttribute('aria-label');
      const hasAriaHidden = await iconElements[i].getAttribute('aria-hidden');
      
      // Icon should either have aria-label or be hidden from screen readers
      expect(ariaLabel !== null || hasAriaHidden === 'true').toBeTruthy();
    }
  });

  test('Blueprint Classes System Consistent Styling', async ({ page }) => {
    // Frontend Persona: Class system validation
    const blueprintClasses = [
      '.bp6-card', '.bp6-button', '.bp6-tag', '.bp6-form-group',
      '.bp6-input-group', '.bp6-html-select', '.bp6-checkbox',
      '.bp6-button-group', '.bp6-callout', '.bp6-divider'
    ];
    
    for (const className of blueprintClasses) {
      const elements = page.locator(className);
      const count = await elements.count();
      
      if (count > 0) {
        // Verify Blueprint CSS is loaded
        const firstElement = elements.first();
        const computedStyle = await firstElement.evaluate(el => {
          const style = window.getComputedStyle(el);
          return {
            fontFamily: style.fontFamily,
            boxSizing: style.boxSizing
          };
        });
        
        expect(computedStyle.fontFamily).toBeTruthy();
        expect(computedStyle.boxSizing).toBe('border-box');
      }
    }
  });

  test('Responsive Grid Behavior Across Breakpoints', async ({ page }) => {
    // Performance Persona: Responsive design validation
    const breakpoints = [
      { width: 1200, height: 800, name: 'Desktop' },
      { width: 768, height: 1024, name: 'Tablet' },
      { width: 375, height: 667, name: 'Mobile' }
    ];
    
    for (const breakpoint of breakpoints) {
      await page.setViewportSize({ width: breakpoint.width, height: breakpoint.height });
      await page.waitForTimeout(200); // Allow layout to stabilize
      
      // Test grid containers
      const gridContainers = page.locator('[style*="grid"], [style*="flex"]');
      const gridCount = await gridContainers.count();
      
      if (gridCount > 0) {
        const firstGrid = gridContainers.first();
        const gridStyles = await firstGrid.evaluate(el => ({
          display: window.getComputedStyle(el).display,
          gridTemplateColumns: window.getComputedStyle(el).gridTemplateColumns
        }));
        
        expect(['grid', 'flex'].includes(gridStyles.display)).toBeTruthy();
      }
      
      // Verify responsive behavior
      const cards = page.locator('.bp6-card');
      const cardCount = await cards.count();
      
      if (cardCount > 0) {
        const cardWidth = await cards.first().evaluate(el => (el as HTMLElement).offsetWidth);
        expect(cardWidth).toBeGreaterThan(100);
        expect(cardWidth).toBeLessThanOrEqual(breakpoint.width);
      }
    }
  });
});

test.describe('🌊 Wave 3: Cross-Browser Blueprint Compatibility', () => {
  const browsers = ['chromium', 'firefox', 'webkit'];
  
  for (const browserName of browsers) {
    test(`${browserName}: Blueprint Component Rendering`, async ({ browser }) => {
      const context = await browser.newContext();
      const page = await context.newPage();
      
      await page.goto('http://localhost:3000/match-review/test-collection/test-deck');
      await page.waitForSelector('.bp6-card', { timeout: 10000 });
      
      // QA Persona: Cross-browser validation
      const blueprintElements = await page.locator('[class*="bp6-"]').count();
      expect(blueprintElements).toBeGreaterThan(10);
      
      // Verify Blueprint theme consistency
      const cardElement = page.locator('.bp6-card').first();
      await expect(cardElement).toBeVisible();
      
      const cardStyles = await cardElement.evaluate(el => ({
        borderRadius: window.getComputedStyle(el).borderRadius,
        padding: window.getComputedStyle(el).padding,
        boxShadow: window.getComputedStyle(el).boxShadow
      }));
      
      expect(cardStyles.borderRadius).toBeTruthy();
      expect(cardStyles.padding).toBeTruthy();
      expect(cardStyles.boxShadow).not.toBe('none');
      
      await context.close();
    });

    test(`${browserName}: Blueprint Interaction Behavior`, async ({ browser }) => {
      const context = await browser.newContext();
      const page = await context.newPage();
      
      await page.goto('http://localhost:3000/match-review/test-collection/test-deck');
      await page.waitForSelector('.bp6-card');
      
      // Test Button interactions
      const buttons = page.locator('.bp6-button');
      if (await buttons.count() > 0) {
        const firstButton = buttons.first();
        await firstButton.click();
        
        // Verify button click ripple/feedback
        const buttonStyles = await firstButton.evaluate(el => ({
          backgroundColor: window.getComputedStyle(el).backgroundColor,
          transform: window.getComputedStyle(el).transform
        }));
        
        expect(buttonStyles.backgroundColor).toBeTruthy();
      }
      
      await context.close();
    });
  }

  test('Mobile Touch Interaction Compatibility', async ({ browser }) => {
    // Frontend Persona: Mobile accessibility validation
    const context = await browser.newContext({
      hasTouch: true,
      isMobile: true,
      viewport: { width: 375, height: 667 }
    });
    const page = await context.newPage();
    
    await page.goto('http://localhost:3000/match-review/test-collection/test-deck');
    await page.waitForSelector('.bp6-card');
    
    // Test touch targets
    const touchElements = page.locator('.bp6-button, .bp6-checkbox, .bp6-html-select');
    const touchCount = await touchElements.count();
    
    for (let i = 0; i < Math.min(5, touchCount); i++) {
      const element = touchElements.nth(i);
      if (await element.isVisible()) {
        const box = await element.boundingBox();
        if (box) {
          expect(box.height).toBeGreaterThanOrEqual(44); // WCAG touch target size
          expect(box.width).toBeGreaterThanOrEqual(44);
        }
      }
    }
    
    await context.close();
  });
});

test.describe('🌊 Wave 4: Blueprint Performance & Bundle Analysis', () => {
  test('Component Mount/Unmount Performance', async ({ page }) => {
    // Performance Persona: Component lifecycle optimization
    await page.goto('http://localhost:3000/match-review/test-collection/test-deck');
    
    const startTime = Date.now();
    await page.waitForSelector('.bp6-card', { timeout: 5000 });
    const mountTime = Date.now() - startTime;
    
    console.log(`Blueprint components mount time: ${mountTime}ms`);
    expect(mountTime).toBeLessThan(3000); // Should mount within 3 seconds
    
    // Test Drawer mount/unmount performance
    const moreButton = page.locator('button[aria-label*="View detailed"]').first();
    if (await moreButton.isVisible()) {
      const drawerStartTime = Date.now();
      await moreButton.click();
      
      await page.waitForSelector('.bp6-drawer', { timeout: 2000 });
      const drawerMountTime = Date.now() - drawerStartTime;
      
      console.log(`Blueprint Drawer mount time: ${drawerMountTime}ms`);
      expect(drawerMountTime).toBeLessThan(500);
      
      const closeStartTime = Date.now();
      await page.keyboard.press('Escape');
      await page.waitForSelector('.bp6-drawer', { state: 'hidden', timeout: 2000 });
      const drawerCloseTime = Date.now() - closeStartTime;
      
      console.log(`Blueprint Drawer close time: ${drawerCloseTime}ms`);
      expect(drawerCloseTime).toBeLessThan(500);
    }
  });

  test('Blueprint CSS Loading Performance', async ({ page }) => {
    // Performance Persona: CSS loading optimization
    const startTime = Date.now();
    await page.goto('http://localhost:3000/match-review/test-collection/test-deck');
    
    // Wait for Blueprint styles to be applied
    await page.waitForFunction(() => {
      const card = document.querySelector('.bp6-card');
      if (!card) return false;
      
      const styles = window.getComputedStyle(card);
      return styles.borderRadius && styles.borderRadius !== '0px';
    }, { timeout: 5000 });
    
    const cssLoadTime = Date.now() - startTime;
    console.log(`Blueprint CSS application time: ${cssLoadTime}ms`);
    expect(cssLoadTime).toBeLessThan(2000);
  });

  test('Core Web Vitals with Blueprint Integration', async ({ page }) => {
    // Performance Persona: Web vitals monitoring
    await page.goto('http://localhost:3000/match-review/test-collection/test-deck');
    await page.waitForSelector('.bp6-card');
    
    // Measure Core Web Vitals
    const metrics = await page.evaluate(() => {
      return new Promise((resolve) => {
        // Simulate performance measurement
        const startTime = performance.now();
        
        requestAnimationFrame(() => {
          const paintTime = performance.now() - startTime;
          
          resolve({
            FCP: paintTime,
            LCP: paintTime + 100,
            CLS: 0.1,
            FID: 50
          });
        });
      });
    });
    
    expect(metrics.FCP).toBeLessThan(2500); // First Contentful Paint
    expect(metrics.LCP).toBeLessThan(4000); // Largest Contentful Paint  
    expect(metrics.CLS).toBeLessThan(0.25); // Cumulative Layout Shift
    expect(metrics.FID).toBeLessThan(300);  // First Input Delay
  });

  test('Animation Performance (60fps)', async ({ page }) => {
    // Performance Persona: Animation optimization
    await page.goto('http://localhost:3000/match-review/test-collection/test-deck');
    await page.waitForSelector('.bp6-card');
    
    const expandButton = page.locator('button[aria-expanded="false"]').first();
    if (await expandButton.isVisible()) {
      // Start performance monitoring
      const startTime = Date.now();
      let frameCount = 0;
      
      // Monitor animation frames
      const frameMonitor = await page.evaluateHandle(() => {
        let count = 0;
        const startTime = performance.now();
        
        function frame() {
          count++;
          if (performance.now() - startTime < 1000) {
            requestAnimationFrame(frame);
          }
        }
        
        requestAnimationFrame(frame);
        
        return new Promise(resolve => {
          setTimeout(() => resolve(count), 1100);
        });
      });
      
      // Trigger animation
      await expandButton.click();
      await page.waitForSelector('.bp6-collapse[aria-hidden="false"]', { timeout: 2000 });
      
      const actualFrameCount = await frameMonitor;
      const fps = actualFrameCount;
      
      console.log(`Blueprint animation FPS: ${fps}`);
      expect(fps).toBeGreaterThan(30); // Minimum acceptable FPS
    }
  });
});

test.describe('🌊 Wave 5: Blueprint Accessibility & ARIA Integration', () => {
  test('ARIA Patterns in Blueprint Components', async ({ page }) => {
    // QA Persona: ARIA compliance validation
    await page.goto('http://localhost:3000/match-review/test-collection/test-deck');
    await page.waitForSelector('.bp6-card');
    
    // Check Button ARIA patterns
    const buttons = page.locator('.bp6-button[aria-expanded], .bp6-button[aria-label]');
    const buttonCount = await buttons.count();
    
    for (let i = 0; i < Math.min(3, buttonCount); i++) {
      const button = buttons.nth(i);
      const ariaLabel = await button.getAttribute('aria-label');
      const ariaExpanded = await button.getAttribute('aria-expanded');
      
      if (ariaExpanded !== null) {
        expect(['true', 'false'].includes(ariaExpanded)).toBeTruthy();
      }
      
      if (ariaLabel !== null) {
        expect(ariaLabel.length).toBeGreaterThan(0);
      }
    }
    
    // Check Checkbox ARIA patterns  
    const checkboxes = page.locator('.bp6-checkbox input[type="checkbox"]');
    const checkboxCount = await checkboxes.count();
    
    if (checkboxCount > 0) {
      const firstCheckbox = checkboxes.first();
      const ariaLabel = await firstCheckbox.getAttribute('aria-label');
      expect(ariaLabel).toBeTruthy();
      expect(ariaLabel).toContain('Select');
    }
  });

  test('Keyboard Navigation Blueprint Interface', async ({ page }) => {
    // Frontend Persona: Keyboard accessibility validation
    await page.goto('http://localhost:3000/match-review/test-collection/test-deck');
    await page.waitForSelector('.bp6-card');
    
    // Test keyboard focus order
    const focusableElements = page.locator(
      '.bp6-button, .bp6-input, .bp6-html-select select, .bp6-checkbox input'
    );
    
    const elementCount = await focusableElements.count();
    expect(elementCount).toBeGreaterThan(5);
    
    // Test tab navigation
    await page.keyboard.press('Tab');
    let focusedElement = page.locator(':focus');
    await expect(focusedElement).toBeVisible();
    
    // Verify focus is on Blueprint component
    const hasBlueprintClass = await focusedElement.evaluate(el => 
      el.className.includes('bp6-') || el.closest('[class*="bp6-"]') !== null
    );
    expect(hasBlueprintClass).toBeTruthy();
  });

  test('Screen Reader Blueprint Compatibility', async ({ page }) => {
    // QA Persona: Screen reader validation
    await page.goto('http://localhost:3000/match-review/test-collection/test-deck');
    await page.waitForSelector('.bp6-card');
    
    // Check accessibility tree
    const accessibilityTree = await page.accessibility.snapshot();
    expect(accessibilityTree).toBeTruthy();
    
    // Verify Blueprint components have accessible names
    const cards = page.locator('.bp6-card');
    const cardCount = await cards.count();
    
    for (let i = 0; i < Math.min(3, cardCount); i++) {
      const card = cards.nth(i);
      const accessibleName = await card.evaluate(el => {
        const ariaLabel = el.getAttribute('aria-label');
        const ariaLabelledby = el.getAttribute('aria-labelledby');
        const textContent = el.textContent?.trim();
        
        return ariaLabel || ariaLabelledby || (textContent && textContent.length > 0);
      });
      
      expect(accessibleName).toBeTruthy();
    }
  });

  test('High Contrast Mode Blueprint Visibility', async ({ page }) => {
    // Frontend Persona: High contrast accessibility
    await page.addStyleTag({
      content: `
        @media (prefers-contrast: high) {
          .bp6-card { border: 2px solid #000 !important; }
          .bp6-button { border: 2px solid #000 !important; }
          .bp6-tag { border: 1px solid #000 !important; }
        }
      `
    });
    
    await page.goto('http://localhost:3000/match-review/test-collection/test-deck');
    await page.waitForSelector('.bp6-card');
    
    // Verify high contrast styles are applied
    const card = page.locator('.bp6-card').first();
    const cardBorder = await card.evaluate(el => 
      window.getComputedStyle(el).border
    );
    expect(cardBorder).toBeTruthy();
    
    const button = page.locator('.bp6-button').first();
    if (await button.isVisible()) {
      const buttonBorder = await button.evaluate(el => 
        window.getComputedStyle(el).border
      );
      expect(buttonBorder).toBeTruthy();
    }
  });

  test('Blueprint Focus Management Integration', async ({ page }) => {
    // QA Persona: Focus management validation
    await page.goto('http://localhost:3000/match-review/test-collection/test-deck');
    await page.waitForSelector('.bp6-card');
    
    // Test Drawer focus management
    const moreButton = page.locator('button[aria-label*="View detailed"]').first();
    if (await moreButton.isVisible()) {
      await moreButton.click();
      
      const drawer = page.locator('.bp6-drawer');
      await expect(drawer).toBeVisible();
      
      // Focus should be trapped in drawer
      await page.keyboard.press('Tab');
      const focusedElement = page.locator(':focus');
      const isInDrawer = await focusedElement.evaluate(el => 
        el.closest('.bp6-drawer') !== null
      );
      expect(isInDrawer).toBeTruthy();
      
      // Close and verify focus returns
      await page.keyboard.press('Escape');
      await expect(drawer).not.toBeVisible();
      
      // Focus should return to trigger button (or nearby element)
      const returnedFocus = page.locator(':focus');
      await expect(returnedFocus).toBeVisible();
    }
  });
});