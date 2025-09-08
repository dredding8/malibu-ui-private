import { test, expect } from '@playwright/test';

test.describe('HistoryTable Detailed Inspection', () => {
  test.beforeEach(async ({ page }) => {
    // Capture console messages
    page.on('console', msg => {
      if (msg.type() === 'error' || msg.type() === 'warning') {
        console.log(`Console ${msg.type()}: ${msg.text()}`);
      }
    });

    await page.goto('http://localhost:3000/history');
    await page.waitForLoadState('networkidle');
  });

  test('should identify specific visual inconsistencies', async ({ page }) => {
    console.log('=== VISUAL CONSISTENCY ANALYSIS ===');
    
    // Analyze table structure in detail
    const table = page.locator('.bp6-table');
    await expect(table).toBeVisible();

    // Check column header alignment
    const headers = page.locator('.bp6-table-column-name');
    const headerCount = await headers.count();
    console.log(`Found ${headerCount} column headers`);

    // Check each column header styling
    for (let i = 0; i < Math.min(headerCount, 7); i++) {
      const header = headers.nth(i);
      const styles = await header.evaluate(el => {
        const computed = window.getComputedStyle(el);
        return {
          textAlign: computed.textAlign,
          fontWeight: computed.fontWeight,
          fontSize: computed.fontSize,
          padding: computed.padding,
          backgroundColor: computed.backgroundColor,
          borderBottom: computed.borderBottom
        };
      });
      console.log(`Header ${i} styles:`, styles);
    }

    // Analyze cell content alignment and spacing
    const cells = page.locator('.bp6-table-cell');
    const cellCount = await cells.count();
    console.log(`Found ${cellCount} cells`);

    // Check first few cells for consistency
    for (let i = 0; i < Math.min(cellCount, 10); i++) {
      const cell = cells.nth(i);
      const styles = await cell.evaluate(el => {
        const computed = window.getComputedStyle(el);
        return {
          padding: computed.padding,
          textAlign: computed.textAlign,
          verticalAlign: computed.verticalAlign,
          height: computed.height,
          borderRight: computed.borderRight
        };
      });
      console.log(`Cell ${i} styles:`, styles);
    }

    // Check status tag consistency
    const statusTags = page.locator('[data-testid="collection-status-tag"]');
    const tagCount = await statusTags.count();
    console.log(`Found ${tagCount} status tags`);

    for (let i = 0; i < tagCount; i++) {
      const tag = statusTags.nth(i);
      const styles = await tag.evaluate(el => {
        const computed = window.getComputedStyle(el);
        return {
          padding: computed.padding,
          borderRadius: computed.borderRadius,
          fontSize: computed.fontSize,
          fontWeight: computed.fontWeight,
          minWidth: computed.minWidth,
          textAlign: computed.textAlign
        };
      });
      console.log(`Status tag ${i} styles:`, styles);
    }

    // Check algorithm status indicators
    const algorithmIndicators = page.locator('[data-testid="algorithm-status-indicator"]');
    const algCount = await algorithmIndicators.count();
    console.log(`Found ${algCount} algorithm status indicators`);

    for (let i = 0; i < algCount; i++) {
      const indicator = algorithmIndicators.nth(i);
      const styles = await indicator.evaluate(el => {
        const computed = window.getComputedStyle(el);
        return {
          fontFamily: computed.fontFamily,
          fontSize: computed.fontSize,
          padding: computed.padding,
          backgroundColor: computed.backgroundColor,
          border: computed.border,
          borderRadius: computed.borderRadius
        };
      });
      console.log(`Algorithm indicator ${i} styles:`, styles);
    }
  });

  test('should check Blueprint Table2 specific issues', async ({ page }) => {
    console.log('=== BLUEPRINT TABLE2 ANALYSIS ===');

    // Check for proper Blueprint v6 table structure
    const table = page.locator('table.bp6-table-table');
    const isTablePresent = await table.count() > 0;
    console.log('Blueprint Table2 DOM structure present:', isTablePresent);

    // Check table header structure
    const thead = page.locator('.bp6-table-thead');
    const theadPresent = await thead.count() > 0;
    console.log('Table header structure present:', theadPresent);

    // Check table body structure
    const tbody = page.locator('.bp6-table-tbody');
    const tbodyPresent = await tbody.count() > 0;
    console.log('Table body structure present:', tbodyPresent);

    // Check for proper cell rendering
    const cellRenderers = page.locator('.bp6-table-cell > *');
    const renderedCells = await cellRenderers.count();
    console.log('Cells with rendered content:', renderedCells);

    // Check table viewport and scrolling
    const viewport = page.locator('.bp6-table-quadrant-scroll-container');
    const viewportPresent = await viewport.count() > 0;
    console.log('Table viewport structure present:', viewportPresent);

    // Check for accessibility attributes
    const tableElement = page.locator('[role="table"], [role="grid"]');
    const hasTableRole = await tableElement.count() > 0;
    console.log('Table has proper ARIA role:', hasTableRole);

    // Check column headers have proper attributes
    const columnHeaders = page.locator('[role="columnheader"]');
    const columnHeaderCount = await columnHeaders.count();
    console.log('Proper column headers with ARIA:', columnHeaderCount);
  });

  test('should analyze specific Blueprint styling issues', async ({ page }) => {
    console.log('=== BLUEPRINT STYLING ANALYSIS ===');

    // Check for inline styles vs Blueprint classes
    const elementsWithInlineStyles = page.locator('[style]');
    const inlineStyleCount = await elementsWithInlineStyles.count();
    console.log('Elements with inline styles:', inlineStyleCount);

    // List some inline styles for analysis
    for (let i = 0; i < Math.min(inlineStyleCount, 10); i++) {
      const element = elementsWithInlineStyles.nth(i);
      const tagName = await element.evaluate(el => el.tagName.toLowerCase());
      const styleAttr = await element.getAttribute('style');
      console.log(`${tagName} inline style:`, styleAttr);
    }

    // Check for proper Blueprint class usage
    const blueprintElements = page.locator('[class*="bp6-"]');
    const blueprintElementCount = await blueprintElements.count();
    console.log('Elements with Blueprint v6 classes:', blueprintElementCount);

    // Check for consistent sizing classes
    const sizingClasses = ['.bp6-small', '.bp6-large', '.bp6-minimal'];
    for (const className of sizingClasses) {
      const count = await page.locator(className).count();
      console.log(`Elements with ${className}:`, count);
    }

    // Check color consistency
    const intentClasses = ['.bp6-intent-primary', '.bp6-intent-success', '.bp6-intent-warning', '.bp6-intent-danger'];
    for (const className of intentClasses) {
      const count = await page.locator(className).count();
      console.log(`Elements with ${className}:`, count);
    }
  });

  test('should test table interactions and state', async ({ page }) => {
    console.log('=== INTERACTION TESTING ===');

    // Test sorting functionality if available
    const sortableHeaders = page.locator('.bp6-table-column-name:has(.bp6-table-column-name-text)');
    const sortableCount = await sortableHeaders.count();
    console.log('Potentially sortable columns:', sortableCount);

    if (sortableCount > 0) {
      await sortableHeaders.first().click();
      await page.waitForTimeout(500);
      console.log('Clicked first sortable header');
    }

    // Test tooltip interactions
    const elementsWithTooltips = page.locator('[data-tooltip], [title]');
    const tooltipElements = await elementsWithTooltips.count();
    console.log('Elements with tooltips:', tooltipElements);

    // Test button functionality
    const buttons = page.locator('button.bp6-button');
    const buttonCount = await buttons.count();
    console.log('Blueprint buttons found:', buttonCount);

    // Test progress bar rendering
    const progressBars = page.locator('.bp6-progress-bar');
    const progressCount = await progressBars.count();
    console.log('Progress bars found:', progressCount);

    if (progressCount > 0) {
      const progressValue = await progressBars.first().evaluate(el => {
        return el.getAttribute('aria-valuenow') || 'N/A';
      });
      console.log('First progress bar value:', progressValue);
    }
  });
});