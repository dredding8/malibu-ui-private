import { test, expect } from '@playwright/test';

test.describe('HistoryTable Analysis', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('http://localhost:3000/history');
    await page.waitForLoadState('networkidle');
  });

  test('should analyze table visual consistency and identify issues', async ({ page }) => {
    // Check if table container is properly rendered
    const tableContainer = page.locator('[data-testid="history-table-container"]');
    await expect(tableContainer).toBeVisible();

    // Analyze table structure and styling
    const table = page.locator('.bp6-table');
    await expect(table).toBeVisible();

    // Check column headers
    const columnHeaders = page.locator('.bp6-table-column-name');
    console.log('Column headers found:', await columnHeaders.count());

    // Check for visual inconsistencies in spacing
    const cells = page.locator('.bp6-table-cell');
    const cellCount = await cells.count();
    console.log(`Found ${cellCount} table cells`);

    // Analyze row height consistency
    const rows = page.locator('.bp6-table-row');
    const rowHeights = [];
    for (let i = 0; i < Math.min(5, await rows.count()); i++) {
      const height = await rows.nth(i).boundingBox();
      if (height) {
        rowHeights.push(height.height);
      }
    }
    console.log('Row heights:', rowHeights);

    // Check for console errors
    const errors: string[] = [];
    page.on('console', msg => {
      if (msg.type() === 'error') {
        errors.push(msg.text());
      }
    });

    // Analyze color consistency
    const statusTags = page.locator('[data-testid="collection-status-tag"]');
    if (await statusTags.count() > 0) {
      for (let i = 0; i < Math.min(3, await statusTags.count()); i++) {
        const bgColor = await statusTags.nth(i).evaluate((el) => 
          window.getComputedStyle(el).backgroundColor
        );
        console.log(`Status tag ${i} background color:`, bgColor);
      }
    }

    // Check typography consistency
    const nameCell = page.locator('.bp6-table-cell').first();
    const fontSize = await nameCell.evaluate((el) => 
      window.getComputedStyle(el).fontSize
    );
    const fontWeight = await nameCell.evaluate((el) => 
      window.getComputedStyle(el).fontWeight  
    );
    console.log('Name cell typography:', { fontSize, fontWeight });

    // Check for proper Blueprint classes
    await expect(table).toHaveClass(/bp6-table/);
    
    // Verify accessibility attributes
    const progressBars = page.locator('.bp6-progress-bar');
    if (await progressBars.count() > 0) {
      await expect(progressBars.first()).toHaveAttribute('role');
    }

    console.log('Console errors found:', errors);
    expect(errors).toHaveLength(0);
  });

  test('should test table responsiveness and layout', async ({ page }) => {
    // Test mobile viewport
    await page.setViewportSize({ width: 375, height: 667 });
    await page.reload();
    
    const tableContainer = page.locator('[data-testid="history-table-container"]');
    await expect(tableContainer).toBeVisible();
    
    const containerWidth = await tableContainer.boundingBox();
    console.log('Mobile container width:', containerWidth?.width);

    // Test tablet viewport  
    await page.setViewportSize({ width: 768, height: 1024 });
    await page.reload();
    
    const tabletWidth = await tableContainer.boundingBox();
    console.log('Tablet container width:', tabletWidth?.width);

    // Test desktop viewport
    await page.setViewportSize({ width: 1200, height: 800 });
    await page.reload();
    
    const desktopWidth = await tableContainer.boundingBox();
    console.log('Desktop container width:', desktopWidth?.width);
  });

  test('should test table functionality and interactions', async ({ page }) => {
    // Check if action buttons are properly rendered
    const viewButtons = page.locator('[data-testid^="view-deck-"]');
    const retryButtons = page.locator('[data-testid^="retry-deck-"]');
    const downloadButtons = page.locator('[data-testid^="download-deck-"]');

    console.log('View buttons found:', await viewButtons.count());
    console.log('Retry buttons found:', await retryButtons.count());  
    console.log('Download buttons found:', await downloadButtons.count());

    // Test button interactions if available
    if (await viewButtons.count() > 0) {
      await viewButtons.first().click();
      // Check for any navigation or modal opening
    }

    // Test tooltips
    const statusTags = page.locator('[data-testid="collection-status-tag"]');
    if (await statusTags.count() > 0) {
      await statusTags.first().hover();
      await page.waitForTimeout(500);
      // Check if tooltip appears
    }
  });

  test('should analyze Blueprint version compatibility', async ({ page }) => {
    // Check if proper Blueprint classes are applied
    const table = page.locator('.bp6-table');
    await expect(table).toBeVisible();

    // Verify Blueprint v6 specific classes
    const cells = page.locator('.bp6-table-cell');
    expect(await cells.count()).toBeGreaterThan(0);

    // Check for deprecated classes or patterns
    const deprecatedClasses = [
      '.bp3-table',
      '.bp4-table', 
      '.bp5-table'
    ];

    for (const className of deprecatedClasses) {
      const elements = page.locator(className);
      const count = await elements.count();
      console.log(`Deprecated class ${className} found:`, count);
      expect(count).toBe(0);
    }
  });
});