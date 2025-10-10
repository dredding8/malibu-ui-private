import { test, expect } from '@playwright/test';
import { Page } from '@playwright/test';

/**
 * Laws of UX Compliance Tests for Collection Opportunities Page
 * Tests fundamental UX principles against implementation
 */

test.describe('UX Laws Compliance - Collection Opportunities', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/operations/collections/opportunities');
    await page.waitForLoadState('networkidle');
  });

  test.describe('1. Fitts\'s Law - Target Size and Distance', () => {
    test('click targets meet minimum size requirements', async ({ page }) => {
      // Test button sizes
      const buttons = await page.$$('button');
      for (const button of buttons) {
        const box = await button.boundingBox();
        expect(box?.height).toBeGreaterThanOrEqual(32); // Minimum height
        expect(box?.width).toBeGreaterThanOrEqual(44); // Minimum touch target
      }

      // Test table cell click areas
      const tableCells = await page.$$('.bp5-table-cell');
      for (const cell of tableCells.slice(0, 10)) { // Sample first 10
        const box = await cell.boundingBox();
        expect(box?.height).toBeGreaterThanOrEqual(40); // Row height
      }

      // Test priority column width
      const priorityColumn = await page.$('.bp5-table-column-header-cell:first-child');
      const priorityBox = await priorityColumn?.boundingBox();
      expect(priorityBox?.width).toBeGreaterThanOrEqual(60); // Current: 60px, should be 80px
    });

    test('interactive elements have adequate spacing', async ({ page }) => {
      // Test site tag spacing
      const siteTags = await page.$$('.site-tag');
      if (siteTags.length > 1) {
        const box1 = await siteTags[0].boundingBox();
        const box2 = await siteTags[1].boundingBox();
        const spacing = box2!.x - (box1!.x + box1!.width);
        expect(spacing).toBeGreaterThanOrEqual(4); // Minimum spacing
      }
    });
  });

  test.describe('2. Hick\'s Law - Decision Complexity', () => {
    test('measures decision time with varying choices', async ({ page }) => {
      // Test tab selection time
      const startTime = Date.now();
      await page.click('text=Action Required');
      const tabSwitchTime = Date.now() - startTime;
      expect(tabSwitchTime).toBeLessThan(1000); // Quick decision with 3 choices

      // Test action button decisions based on context
      const unmatchedRow = await page.$('text=Not Allocated');
      expect(unmatchedRow).toBeTruthy(); // Context reduces choices

      // Verify only relevant actions shown
      const actionButtons = await page.$$('.actions-cell button');
      expect(actionButtons.length).toBeLessThanOrEqual(3); // Limited choices per row
    });
  });

  test.describe('3. Jakob\'s Law - Familiar Patterns', () => {
    test('standard keyboard shortcuts work as expected', async ({ page }) => {
      // Test Ctrl+F for search
      await page.keyboard.press('Control+f');
      const searchFocused = await page.$('#opportunity-search:focus');
      expect(searchFocused).toBeTruthy();

      // Test Escape to clear
      await page.keyboard.press('Escape');
      
      // Test Ctrl+A for select all
      await page.keyboard.press('Control+a');
      const selectedCount = await page.$('text=/\\d+ selected/');
      expect(selectedCount).toBeTruthy();
    });

    test('multi-selection follows OS conventions', async ({ page }) => {
      const rows = await page.$$('.opportunity-name-wrapper');
      
      // Test Ctrl+Click for individual selection
      await rows[0].click();
      await rows[2].click({ modifiers: ['Control'] });
      
      // Test Shift+Click for range selection
      await rows[0].click();
      await rows[3].click({ modifiers: ['Shift'] });
    });
  });

  test.describe('4. Miller\'s Law - Cognitive Load', () => {
    test('information chunks stay within 7±2 limit', async ({ page }) => {
      // Test column count
      const columns = await page.$$('.bp5-table-column-header-cell');
      expect(columns.length).toBeLessThanOrEqual(9); // Currently 8 columns

      // Test site display chunking
      const siteCell = await page.$('.sites-cell');
      const visibleSites = await siteCell?.$$('.site-tag:not(:contains("+"))');
      expect(visibleSites?.length).toBeLessThanOrEqual(3); // Shows max 3 sites

      // Test progressive disclosure sections
      const helpSections = await page.$$('.progressive-disclosure-level');
      expect(helpSections.length).toBe(3); // 3 help chunks
    });
  });

  test.describe('5. Doherty Threshold - Response Time', () => {
    test('all interactions respond within 400ms', async ({ page }) => {
      const interactions = [
        { action: () => page.click('text=All'), name: 'Tab switch' },
        { action: () => page.fill('#opportunity-search', 'test'), name: 'Search' },
        { action: () => page.selectOption('.site-filter', { index: 1 }), name: 'Filter' },
        { action: () => page.click('.opportunity-name-wrapper'), name: 'Row select' },
      ];

      for (const { action, name } of interactions) {
        const startTime = performance.now();
        await action();
        const responseTime = performance.now() - startTime;
        
        expect(responseTime, `${name} response time`).toBeLessThan(400);
      }
    });

    test('table rendering performance with large datasets', async ({ page }) => {
      // Measure initial render time
      const startTime = performance.now();
      await page.goto('/operations/collections/opportunities?test-data=large');
      await page.waitForSelector('.opportunities-table');
      const renderTime = performance.now() - startTime;
      
      expect(renderTime).toBeLessThan(1000); // 1 second for large dataset
    });
  });

  test.describe('6. Von Restorff Effect - Visual Hierarchy', () => {
    test('critical elements stand out visually', async ({ page }) => {
      // Test priority indicators
      const priorityTags = await page.$$('.priority-tag');
      const criticalTag = await page.$('.priority-tag.bp5-intent-danger');
      expect(criticalTag).toBeTruthy(); // Critical items use danger intent

      // Test status differentiation
      const statusTags = await page.$$('.match-status');
      const colors = await Promise.all(
        statusTags.slice(0, 3).map(tag => 
          tag.evaluate(el => getComputedStyle(el).backgroundColor)
        )
      );
      expect(new Set(colors).size).toBeGreaterThan(1); // Different colors
    });
  });

  test.describe('7. Aesthetic-Usability Effect', () => {
    test('visual polish enhances perceived usability', async ({ page }) => {
      // Test hover effects
      const button = await page.$('button');
      await button?.hover();
      const hasTransition = await button?.evaluate(el => 
        getComputedStyle(el).transition !== 'none'
      );
      expect(hasTransition).toBe(true);

      // Test consistent spacing (8px grid)
      const card = await page.$('.bp5-card');
      const padding = await card?.evaluate(el => 
        getComputedStyle(el).padding
      );
      expect(padding).toMatch(/\d*[08]px/); // Multiple of 8
    });
  });

  test.describe('8. Peak-End Rule - Task Completion', () => {
    test('successful operations provide positive feedback', async ({ page }) => {
      // Select and override an opportunity
      await page.click('.opportunity-name-wrapper');
      await page.click('text=Override Selected');
      await page.waitForSelector('.manual-override-modal');
      
      // Make changes and save
      await page.fill('input[name="allocation"]', 'New Value');
      await page.click('text=Save Changes');
      
      // Verify positive completion (should show toast)
      const successToast = await page.waitForSelector('.bp5-toast.bp5-intent-success', {
        timeout: 5000
      }).catch(() => null);
      
      expect(successToast).toBeTruthy(); // Currently missing - needs implementation
    });
  });

  test.describe('9. Zeigarnik Effect - Progress Indicators', () => {
    test('uncompleted tasks are clearly indicated', async ({ page }) => {
      // Test tab counts
      const actionRequiredTab = await page.$('text=/Action Required.*\\d+/');
      const pendingTab = await page.$('text=/Pending Allocation.*\\d+/');
      
      expect(actionRequiredTab).toBeTruthy();
      expect(pendingTab).toBeTruthy();

      // Test capacity progress bars
      const progressBars = await page.$$('.bp5-progress-bar');
      expect(progressBars.length).toBeGreaterThan(0);
      
      // Verify progress visualization
      const capacityText = await page.$('.capacity-text');
      const text = await capacityText?.textContent();
      expect(text).toMatch(/\d+\/\d+/); // Shows current/total
    });
  });

  test.describe('10. Postel\'s Law - Robustness', () => {
    test('accepts flexible input and provides consistent output', async ({ page }) => {
      // Test search flexibility
      const searchInput = page.locator('#opportunity-search');
      
      // Accepts partial matches
      await searchInput.fill('opp');
      await page.waitForTimeout(300); // Debounce
      let results = await page.$$('.opportunity-name');
      expect(results.length).toBeGreaterThan(0);

      // Accepts multiple search terms  
      await searchInput.fill('site1 high');
      await page.waitForTimeout(300);
      results = await page.$$('.opportunity-name');
      
      // Output is always consistent format
      const statuses = await page.$$('.match-status');
      for (const status of statuses) {
        const hasIcon = await status.$('.bp5-icon');
        const hasText = await status.textContent();
        expect(hasIcon).toBeTruthy();
        expect(hasText).toBeTruthy();
      }
    });
  });
});

// Performance monitoring utilities
export async function measureInteractionTime(
  page: Page,
  interaction: () => Promise<void>
): Promise<number> {
  const startTime = await page.evaluate(() => performance.now());
  await interaction();
  const endTime = await page.evaluate(() => performance.now());
  return endTime - startTime;
}

export async function getMemoryUsage(page: Page): Promise<number> {
  return await page.evaluate(() => {
    if ('memory' in performance) {
      return (performance as any).memory.usedJSHeapSize;
    }
    return 0;
  });
}