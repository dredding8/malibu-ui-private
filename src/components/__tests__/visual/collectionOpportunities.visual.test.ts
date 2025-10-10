import { test, expect } from '@playwright/test';
import { CollectionOpportunitiesPage } from '../helpers/collectionOpportunities.helpers';

// Visual regression test suite
test.describe('Collection Opportunities Visual Regression', () => {
  let page: CollectionOpportunitiesPage;

  test.beforeEach(async ({ page: playwrightPage }) => {
    page = new CollectionOpportunitiesPage(playwrightPage);
    await page.navigateTo();
    
    // Wait for animations to settle
    await playwrightPage.waitForTimeout(500);
    
    // Mask dynamic content
    await playwrightPage.addStyleTag({
      content: `
        /* Hide timestamps and dynamic IDs */
        .opportunity-name::after { content: 'Opportunity Name' !important; }
        .capacity-text { visibility: hidden !important; }
        .bp5-tag:has-text("selected")::after { content: '5 selected' !important; }
        
        /* Stabilize progress bars */
        .bp5-progress-bar-meter { transition: none !important; }
        
        /* Hide loading states */
        .bp5-spinner { display: none !important; }
      `
    });
  });

  test.describe('Component States', () => {
    test('default state', async ({ page: pwPage }) => {
      await expect(pwPage).toHaveScreenshot('default-state.png', {
        fullPage: false,
        clip: { x: 0, y: 0, width: 1920, height: 1080 }
      });
    });

    test('with selections', async ({ page: pwPage }) => {
      await page.selectMultipleRows(0, 2);
      await pwPage.waitForTimeout(300);
      
      await expect(pwPage).toHaveScreenshot('selected-state.png', {
        fullPage: false,
        clip: { x: 0, y: 0, width: 1920, height: 1080 }
      });
    });

    test('needs review tab', async ({ page: pwPage }) => {
      await page.selectTab('needs-review');
      await pwPage.waitForTimeout(300);
      
      await expect(pwPage).toHaveScreenshot('needs-review-tab.png', {
        fullPage: false,
        clip: { x: 0, y: 0, width: 1920, height: 1080 }
      });
    });

    test('unmatched tab', async ({ page: pwPage }) => {
      await page.selectTab('unmatched');
      await pwPage.waitForTimeout(300);
      
      await expect(pwPage).toHaveScreenshot('unmatched-tab.png', {
        fullPage: false,
        clip: { x: 0, y: 0, width: 1920, height: 1080 }
      });
    });

    test('with search active', async ({ page: pwPage }) => {
      await page.searchOpportunities('test');
      await pwPage.waitForTimeout(500);
      
      await expect(pwPage).toHaveScreenshot('search-active.png', {
        fullPage: false,
        clip: { x: 0, y: 0, width: 1920, height: 1080 }
      });
    });

    test('with site filter', async ({ page: pwPage }) => {
      await page.filterBySite('site-001');
      await pwPage.waitForTimeout(300);
      
      await expect(pwPage).toHaveScreenshot('site-filtered.png', {
        fullPage: false,
        clip: { x: 0, y: 0, width: 1920, height: 1080 }
      });
    });
  });

  test.describe('Interactive Elements', () => {
    test('tooltip hover states', async ({ page: pwPage }) => {
      // Health indicator tooltip
      await page.hoverOverHealthIndicator(0);
      await pwPage.waitForSelector('.bp5-tooltip');
      
      await expect(pwPage).toHaveScreenshot('health-tooltip.png', {
        fullPage: false,
        clip: { x: 0, y: 0, width: 1920, height: 400 }
      });
    });

    test('priority tag styling', async ({ page: pwPage }) => {
      const prioritySection = pwPage.locator('.opportunities-table');
      
      await expect(prioritySection).toHaveScreenshot('priority-tags.png', {
        clip: { x: 0, y: 100, width: 200, height: 500 }
      });
    });

    test('match status indicators', async ({ page: pwPage }) => {
      const matchStatusSection = pwPage.locator('.opportunities-table');
      
      await expect(matchStatusSection).toHaveScreenshot('match-status-indicators.png', {
        clip: { x: 60, y: 100, width: 300, height: 500 }
      });
    });

    test('action buttons', async ({ page: pwPage }) => {
      const actionsColumn = pwPage.locator('.opportunities-table');
      
      await expect(actionsColumn).toHaveScreenshot('action-buttons.png', {
        clip: { x: 1600, y: 100, width: 300, height: 500 }
      });
    });
  });

  test.describe('Empty States', () => {
    test('no search results', async ({ page: pwPage }) => {
      await page.searchOpportunities('xxxnonexistentxxx');
      await pwPage.waitForSelector('.bp5-non-ideal-state');
      
      await expect(pwPage.locator('.table-container')).toHaveScreenshot(
        'empty-state-search.png'
      );
    });
  });

  test.describe('Loading States', () => {
    test('loading indicator', async ({ page: pwPage }) => {
      // Inject loading state
      await pwPage.evaluate(() => {
        const container = document.querySelector('.collection-opportunities-refactored');
        if (container) {
          container.innerHTML = `
            <div class="collection-opportunities-loading" style="padding: 50px; text-align: center;">
              <div class="bp5-spinner" style="margin: 0 auto;">
                <svg class="bp5-spinner-svg-container" width="50" height="50">
                  <circle class="bp5-spinner-track" cx="25" cy="25" r="20" />
                  <circle class="bp5-spinner-head" cx="25" cy="25" r="20" />
                </svg>
              </div>
              <h3>Loading Collection Opportunities...</h3>
            </div>
          `;
        }
      });
      
      await expect(pwPage.locator('.collection-opportunities-loading')).toHaveScreenshot(
        'loading-state.png'
      );
    });
  });

  test.describe('Responsive Breakpoints', () => {
    const breakpoints = [
      { name: 'desktop-xl', width: 1920, height: 1080 },
      { name: 'desktop', width: 1440, height: 900 },
      { name: 'laptop', width: 1366, height: 768 },
      { name: 'tablet-landscape', width: 1024, height: 768 },
      { name: 'tablet-portrait', width: 768, height: 1024 },
      { name: 'mobile-large', width: 414, height: 896 },
      { name: 'mobile', width: 375, height: 667 }
    ];

    for (const breakpoint of breakpoints) {
      test(`${breakpoint.name} (${breakpoint.width}x${breakpoint.height})`, async ({ page: pwPage }) => {
        await pwPage.setViewportSize({ 
          width: breakpoint.width, 
          height: breakpoint.height 
        });
        
        await page.navigateTo();
        await pwPage.waitForTimeout(500);
        
        await expect(pwPage).toHaveScreenshot(`responsive-${breakpoint.name}.png`, {
          fullPage: false
        });
      });
    }
  });

  test.describe('Accessibility States', () => {
    test('focus indicators', async ({ page: pwPage }) => {
      // Tab through elements to show focus
      await pwPage.keyboard.press('Tab');
      await pwPage.waitForTimeout(100);
      
      await expect(pwPage).toHaveScreenshot('focus-indicators.png', {
        fullPage: false,
        clip: { x: 0, y: 0, width: 1920, height: 200 }
      });
    });

    test('high contrast mode', async ({ page: pwPage, browserName }) => {
      if (browserName === 'chromium') {
        // Simulate high contrast
        await pwPage.emulateMedia({ forcedColors: 'active' });
        
        await expect(pwPage).toHaveScreenshot('high-contrast.png', {
          fullPage: false
        });
      }
    });

    test('reduced motion', async ({ page: pwPage }) => {
      await pwPage.emulateMedia({ reducedMotion: 'reduce' });
      
      // Trigger an animation that should be reduced
      await page.selectRow(0);
      
      await expect(pwPage).toHaveScreenshot('reduced-motion.png', {
        fullPage: false,
        animations: 'disabled'
      });
    });
  });

  test.describe('Dark Mode', () => {
    test.beforeEach(async ({ page: pwPage }) => {
      await pwPage.emulateMedia({ colorScheme: 'dark' });
    });

    test('dark mode appearance', async ({ page: pwPage }) => {
      await expect(pwPage).toHaveScreenshot('dark-mode.png', {
        fullPage: false
      });
    });

    test('dark mode with selections', async ({ page: pwPage }) => {
      await page.selectMultipleRows(0, 2);
      
      await expect(pwPage).toHaveScreenshot('dark-mode-selected.png', {
        fullPage: false
      });
    });
  });
});

// Visual diff utilities for custom comparisons
export async function compareVisualDiff(
  page: any,
  baseline: string,
  options: {
    threshold?: number;
    includeAA?: boolean;
    ignoreColors?: boolean;
  } = {}
) {
  const { 
    threshold = 0.1,
    includeAA = true,
    ignoreColors = false 
  } = options;

  await expect(page).toHaveScreenshot(baseline, {
    threshold,
    animations: 'disabled',
    scale: 'css',
    maxDiffPixelRatio: threshold,
    // Custom comparison options
    _comparator: ignoreColors ? 'ssim-cie94' : 'pixelmatch'
  });
}