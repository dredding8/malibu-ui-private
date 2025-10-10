/**
 * Site Allocation Cell Visual Regression Diagnostic Test
 *
 * Purpose: Systematically diagnose why Site Allocation cells appear blank
 * despite DOM elements existing and containing data.
 *
 * Evidence:
 * - 50 cells with 113 tags = ~2.26 tags per cell (data exists)
 * - Screenshot shows blank white space in column
 * - Other columns render correctly
 *
 * Hypothesis Matrix:
 * H1: CSS visibility/display issue hiding content
 * H2: Blueprint Cell wrapper compatibility with Tag components
 * H3: Z-index stacking context problem
 * H4: Color contrast issue (white text on white background)
 * H5: Missing CSS import or class name mismatch
 */

import { test, expect } from '@playwright/test';

test.describe('Site Allocation Cell Visual Regression Diagnosis', () => {

  test.beforeEach(async ({ page }) => {
    await page.goto('http://localhost:3000/test-opportunities');
    await page.waitForSelector('.bp5-table-container', { timeout: 10000 });
    await page.waitForTimeout(2000); // Wait for full render
  });

  test('Test 1: Verify DOM structure exists', async ({ page }) => {
    // Count cells
    const cellCount = await page.locator('.site-allocation-cell').count();
    console.log(`✓ Site allocation cells in DOM: ${cellCount}`);

    // Count tags
    const tagCount = await page.locator('.site-allocation-tag').count();
    console.log(`✓ Site allocation tags in DOM: ${tagCount}`);

    // Count content wrappers
    const contentCount = await page.locator('.site-allocation-content').count();
    console.log(`✓ Site allocation content wrappers: ${contentCount}`);

    expect(cellCount).toBeGreaterThan(0);
    expect(tagCount).toBeGreaterThan(0);
  });

  test('Test 2: Inspect computed styles on first cell', async ({ page }) => {
    const firstCell = page.locator('.site-allocation-cell').first();
    const firstTag = page.locator('.site-allocation-tag').first();

    // Cell styles
    const cellDisplay = await firstCell.evaluate(el => window.getComputedStyle(el).display);
    const cellVisibility = await firstCell.evaluate(el => window.getComputedStyle(el).visibility);
    const cellOpacity = await firstCell.evaluate(el => window.getComputedStyle(el).opacity);

    console.log('Cell computed styles:', { cellDisplay, cellVisibility, cellOpacity });

    // Tag styles
    const tagDisplay = await firstTag.evaluate(el => window.getComputedStyle(el).display);
    const tagVisibility = await firstTag.evaluate(el => window.getComputedStyle(el).visibility);
    const tagOpacity = await firstTag.evaluate(el => window.getComputedStyle(el).opacity);
    const tagColor = await firstTag.evaluate(el => window.getComputedStyle(el).color);
    const tagBgColor = await firstTag.evaluate(el => window.getComputedStyle(el).backgroundColor);

    console.log('Tag computed styles:', {
      tagDisplay,
      tagVisibility,
      tagOpacity,
      tagColor,
      tagBgColor
    });

    // These should NOT hide content
    expect(cellDisplay).not.toBe('none');
    expect(cellVisibility).not.toBe('hidden');
    expect(tagDisplay).not.toBe('none');
    expect(tagVisibility).not.toBe('hidden');
  });

  test('Test 3: Check text content is present', async ({ page }) => {
    const firstTag = page.locator('.site-allocation-tag').first();

    // Get inner text
    const tagText = await firstTag.innerText();
    console.log('First tag text content:', tagText);

    // Get child elements
    const siteName = await firstTag.locator('.site-allocation-tag__name').first().textContent();
    const siteCount = await firstTag.locator('.site-allocation-tag__count').first().textContent();

    console.log('Site name:', siteName);
    console.log('Site count:', siteCount);

    expect(tagText).toBeTruthy();
    expect(siteName).toBeTruthy();
  });

  test('Test 4: Check Blueprint Tag component rendering', async ({ page }) => {
    const firstTag = page.locator('.site-allocation-tag').first();

    // Check if it's a Blueprint Tag
    const isBpTag = await firstTag.evaluate(el => el.classList.contains('bp5-tag'));
    console.log('Is Blueprint Tag:', isBpTag);

    // Get all classes
    const classes = await firstTag.evaluate(el => Array.from(el.classList));
    console.log('Tag classes:', classes);

    // Check parent structure
    const parentClasses = await firstTag.evaluate(el =>
      el.parentElement ? Array.from(el.parentElement.classList) : []
    );
    console.log('Parent classes:', parentClasses);
  });

  test('Test 5: Compare with working Priority column', async ({ page }) => {
    // Get Priority column cell
    const priorityCell = page.locator('.bp5-table-cell').nth(0); // First column
    const priorityTag = priorityCell.locator('.bp5-tag').first();

    // Priority tag styles
    const priorityDisplay = await priorityTag.evaluate(el => window.getComputedStyle(el).display);
    const priorityColor = await priorityTag.evaluate(el => window.getComputedStyle(el).color);
    const priorityText = await priorityTag.textContent();

    console.log('Working Priority column:', {
      display: priorityDisplay,
      color: priorityColor,
      text: priorityText
    });

    // Site Allocation tag styles
    const siteTag = page.locator('.site-allocation-tag').first();
    const siteDisplay = await siteTag.evaluate(el => window.getComputedStyle(el).display);
    const siteColor = await siteTag.evaluate(el => window.getComputedStyle(el).color);
    const siteText = await siteTag.textContent();

    console.log('Site Allocation column:', {
      display: siteDisplay,
      color: siteColor,
      text: siteText
    });
  });

  test('Test 6: Check CSS import and class application', async ({ page }) => {
    // Check if CSS variables are defined
    const hasGridSize = await page.evaluate(() => {
      const styles = getComputedStyle(document.documentElement);
      return styles.getPropertyValue('--bp5-grid-size');
    });
    console.log('Blueprint grid size variable:', hasGridSize);

    // Check if our CSS file is loaded
    const cssLoaded = await page.evaluate(() => {
      const sheets = Array.from(document.styleSheets);
      return sheets.some(sheet => {
        try {
          return sheet.href?.includes('SiteAllocationCell');
        } catch {
          return false;
        }
      });
    });
    console.log('SiteAllocationCell.css loaded:', cssLoaded);
  });

  test('Test 7: Check z-index and stacking context', async ({ page }) => {
    const firstCell = page.locator('.site-allocation-cell').first();
    const firstTag = page.locator('.site-allocation-tag').first();

    const cellZIndex = await firstCell.evaluate(el => window.getComputedStyle(el).zIndex);
    const tagZIndex = await firstTag.evaluate(el => window.getComputedStyle(el).zIndex);
    const cellPosition = await firstCell.evaluate(el => window.getComputedStyle(el).position);
    const tagPosition = await firstTag.evaluate(el => window.getComputedStyle(el).position);

    console.log('Stacking context:', {
      cellZIndex,
      tagZIndex,
      cellPosition,
      tagPosition
    });
  });

  test('Test 8: Visual regression - take screenshot with highlighting', async ({ page }) => {
    // Highlight the first site allocation cell
    await page.evaluate(() => {
      const cell = document.querySelector('.site-allocation-cell');
      if (cell) {
        (cell as HTMLElement).style.border = '3px solid red';
        (cell as HTMLElement).style.backgroundColor = 'yellow';
      }
    });

    await page.screenshot({
      path: 'test-results/site-allocation-diagnosis-highlighted.png',
      fullPage: false
    });

    console.log('✓ Screenshot saved with highlighted cell');
  });

  test('Test 9: Test without Cell wrapper (isolation test)', async ({ page }) => {
    // Inject a test tag outside table to verify Tag component works
    await page.evaluate(() => {
      const testDiv = document.createElement('div');
      testDiv.id = 'test-tag-container';
      testDiv.style.position = 'fixed';
      testDiv.style.top = '10px';
      testDiv.style.left = '10px';
      testDiv.style.zIndex = '10000';
      testDiv.style.backgroundColor = 'white';
      testDiv.style.padding = '10px';
      testDiv.style.border = '2px solid blue';

      testDiv.innerHTML = `
        <span class="bp5-tag bp5-intent-primary bp5-minimal site-allocation-tag">
          <span class="site-allocation-tag__name">Test Site</span>
          <span class="site-allocation-tag__count">(123)</span>
        </span>
      `;

      document.body.appendChild(testDiv);
    });

    await page.waitForTimeout(500);

    const testTag = page.locator('#test-tag-container .site-allocation-tag');
    const isVisible = await testTag.isVisible();
    const text = await testTag.textContent();

    console.log('Isolated tag test:', { isVisible, text });

    await page.screenshot({
      path: 'test-results/site-allocation-diagnosis-isolated-tag.png'
    });
  });

  test('Test 10: Check Blueprint Table Cell wrapper impact', async ({ page }) => {
    // Find the Cell component wrapping our content
    const tableCells = page.locator('.bp5-table-cell');
    const cellCount = await tableCells.count();
    console.log(`Total Blueprint table cells: ${cellCount}`);

    // Check if site allocation cells are inside .bp5-table-cell
    const siteAllocationInCell = await page.evaluate(() => {
      const cells = Array.from(document.querySelectorAll('.site-allocation-cell'));
      return cells.map(cell => ({
        hasTableCellParent: !!cell.closest('.bp5-table-cell'),
        parentClasses: cell.parentElement?.className || 'no parent',
        cellClasses: cell.className
      }));
    });

    console.log('Site allocation cell parent structure:',
      JSON.stringify(siteAllocationInCell.slice(0, 3), null, 2)
    );
  });

  test('Test 11: Console errors during render', async ({ page }) => {
    const errors: string[] = [];
    const warnings: string[] = [];

    page.on('console', msg => {
      if (msg.type() === 'error') {
        errors.push(msg.text());
      } else if (msg.type() === 'warning') {
        warnings.push(msg.text());
      }
    });

    await page.reload();
    await page.waitForSelector('.bp5-table-container', { timeout: 10000 });
    await page.waitForTimeout(2000);

    console.log('Console errors:', errors);
    console.log('Console warnings:', warnings);

    // Filter for relevant errors
    const relevantErrors = errors.filter(e =>
      e.includes('SiteAllocation') ||
      e.includes('Tag') ||
      e.includes('Cell')
    );

    console.log('Relevant errors:', relevantErrors);
  });

  test('Test 12: Force style override test', async ({ page }) => {
    // Force visibility on all tags
    await page.evaluate(() => {
      document.querySelectorAll('.site-allocation-tag').forEach(tag => {
        (tag as HTMLElement).style.display = 'inline-flex';
        (tag as HTMLElement).style.visibility = 'visible';
        (tag as HTMLElement).style.opacity = '1';
        (tag as HTMLElement).style.color = 'red';
        (tag as HTMLElement).style.backgroundColor = 'yellow';
        (tag as HTMLElement).style.padding = '5px';
        (tag as HTMLElement).style.border = '2px solid blue';
      });
    });

    await page.waitForTimeout(500);

    await page.screenshot({
      path: 'test-results/site-allocation-diagnosis-forced-styles.png',
      fullPage: false
    });

    console.log('✓ Screenshot with forced styles saved');

    // Check if now visible
    const firstTag = page.locator('.site-allocation-tag').first();
    const isVisible = await firstTag.isVisible();
    console.log('Visible after forced styles:', isVisible);
  });
});
