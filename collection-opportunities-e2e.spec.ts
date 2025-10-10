import { test, expect, Page } from '@playwright/test';

test.describe('Collection Opportunities Refactored - E2E Journey', () => {
    let page: Page;

    test.beforeEach(async ({ browser }) => {
        page = await browser.newPage();
        await page.goto('http://localhost:3000');
        
        // Navigate to Collection Opportunities page
        await page.waitForLoadState('networkidle');
        
        // Look for and click on Collection Opportunities navigation
        const navLink = page.locator('a:has-text("Collection Opportunities"), button:has-text("Collection Opportunities")');
        if (await navLink.count() > 0) {
            await navLink.first().click();
        } else {
            // Try to navigate directly if no link found
            await page.goto('http://localhost:3000/collection-opportunities');
        }
        
        // Wait for the component to load
        await page.waitForSelector('.collection-opportunities-refactored', { timeout: 10000 });
    });

    test.afterEach(async () => {
        await page.close();
    });

    test('1. Component loads successfully with all elements', async () => {
        // Check main container exists
        await expect(page.locator('.collection-opportunities-refactored')).toBeVisible();
        
        // Check navbar elements
        await expect(page.locator('.opportunities-navbar h2:has-text("Collection Opportunities")')).toBeVisible();
        await expect(page.locator('#opportunity-search')).toBeVisible();
        await expect(page.locator('.site-filter')).toBeVisible();
        
        // Check tabs
        await expect(page.locator('#opportunity-tabs')).toBeVisible();
        await expect(page.locator('[id="bp5-tab-panel_opportunity-tabs_all"]')).toBeVisible();
        
        // Check table
        await expect(page.locator('.opportunities-table')).toBeVisible();
        
        // Take screenshot for visual verification
        await page.screenshot({ path: 'collection-opportunities-loaded.png', fullPage: true });
    });

    test('2. Search functionality filters opportunities correctly', async () => {
        // Wait for table to have data
        await page.waitForSelector('.opportunities-table .bp5-table-cell', { timeout: 5000 });
        
        // Get initial row count
        const initialRows = await page.locator('.opportunities-table .bp5-table-row-wrapper').count();
        console.log(`Initial row count: ${initialRows}`);
        
        // Type in search box
        const searchBox = page.locator('#opportunity-search');
        await searchBox.fill('test');
        
        // Wait for filtered results
        await page.waitForTimeout(500); // Debounce delay
        
        // Check row count changed
        const filteredRows = await page.locator('.opportunities-table .bp5-table-row-wrapper').count();
        console.log(`Filtered row count: ${filteredRows}`);
        
        // Clear search
        await searchBox.clear();
        await page.waitForTimeout(500);
        
        // Verify rows restored
        const restoredRows = await page.locator('.opportunities-table .bp5-table-row-wrapper').count();
        expect(restoredRows).toBe(initialRows);
    });

    test('3. Site filter dropdown works correctly', async () => {
        // Click on site filter
        const siteFilter = page.locator('.site-filter');
        await siteFilter.selectOption({ index: 1 }); // Select first site after "All Sites"
        
        // Wait for filtering
        await page.waitForTimeout(500);
        
        // Check that table has filtered results
        const filteredRows = await page.locator('.opportunities-table .bp5-table-row-wrapper').count();
        console.log(`Site filtered rows: ${filteredRows}`);
        
        // Reset filter
        await siteFilter.selectOption('');
        await page.waitForTimeout(500);
    });

    test('4. Tab navigation works correctly', async () => {
        // Click on "Needs Review" tab
        const needsReviewTab = page.locator('[id="bp5-tab-title_opportunity-tabs_needs-review"]');
        await needsReviewTab.click();
        
        // Verify tab is active
        await expect(needsReviewTab).toHaveAttribute('aria-selected', 'true');
        
        // Click on "Unmatched" tab
        const unmatchedTab = page.locator('[id="bp5-tab-title_opportunity-tabs_unmatched"]');
        await unmatchedTab.click();
        
        // Verify tab is active
        await expect(unmatchedTab).toHaveAttribute('aria-selected', 'true');
        
        // Return to "All" tab
        const allTab = page.locator('[id="bp5-tab-title_opportunity-tabs_all"]');
        await allTab.click();
        await expect(allTab).toHaveAttribute('aria-selected', 'true');
    });

    test('5. Row selection works correctly', async () => {
        // Single click selection
        const firstRow = page.locator('.opportunities-table .bp5-table-cell').first();
        await firstRow.click();
        
        // Check selection indicator appears
        await expect(page.locator('text=/\\d+ selected/')).toBeVisible();
        
        // Multi-select with Ctrl/Cmd
        const secondRow = page.locator('.opportunities-table .bp5-table-row-wrapper').nth(1).locator('.bp5-table-cell').first();
        await secondRow.click({ modifiers: ['Control'] });
        
        // Check selection count increased
        const selectionText = await page.locator('.bp5-tag:has-text("selected")').textContent();
        expect(selectionText).toContain('2 selected');
        
        // Clear selection
        await page.locator('button:has-text("Clear")').click();
        await expect(page.locator('text=/\\d+ selected/')).not.toBeVisible();
    });

    test('6. Manual Override Modal opens correctly', async () => {
        // Click edit button on first row
        const editButton = page.locator('.opportunities-table button[aria-label*="Edit"]').first();
        await editButton.click();
        
        // Wait for modal
        await expect(page.locator('.bp5-dialog')).toBeVisible({ timeout: 5000 });
        
        // Check modal title
        await expect(page.locator('.bp5-dialog-header')).toContainText('Manual Override');
        
        // Close modal
        const closeButton = page.locator('.bp5-dialog button[aria-label="Close"]');
        await closeButton.click();
        
        // Verify modal closed
        await expect(page.locator('.bp5-dialog')).not.toBeVisible();
    });

    test('7. Keyboard shortcuts work correctly', async () => {
        // Test Ctrl+F focuses search
        await page.keyboard.press('Control+F');
        await expect(page.locator('#opportunity-search')).toBeFocused();
        
        // Test Ctrl+A selects all
        await page.keyboard.press('Control+A');
        await expect(page.locator('text=/\\d+ selected/')).toBeVisible();
        
        // Test Escape clears selection
        await page.keyboard.press('Escape');
        await expect(page.locator('text=/\\d+ selected/')).not.toBeVisible();
        
        // Test Ctrl+1/2/3 for tab navigation
        await page.keyboard.press('Control+2');
        await expect(page.locator('[id="bp5-tab-title_opportunity-tabs_needs-review"]')).toHaveAttribute('aria-selected', 'true');
        
        await page.keyboard.press('Control+1');
        await expect(page.locator('[id="bp5-tab-title_opportunity-tabs_all"]')).toHaveAttribute('aria-selected', 'true');
    });

    test('8. Health indicators and tooltips display correctly', async () => {
        // Hover over health indicator
        const healthTag = page.locator('.health-indicator').first();
        await healthTag.hover();
        
        // Check tooltip appears
        await expect(page.locator('.bp5-tooltip2-content')).toBeVisible({ timeout: 2000 });
        
        // Verify tooltip contains expected content
        const tooltipContent = await page.locator('.bp5-tooltip2-content').textContent();
        expect(tooltipContent).toContain('Coverage:');
        expect(tooltipContent).toContain('Efficiency:');
        expect(tooltipContent).toContain('Balance:');
        
        // Check capacity progress bars
        const progressBar = page.locator('.capacity-cell .bp5-progress-bar').first();
        await expect(progressBar).toBeVisible();
    });

    test('9. Batch operations work correctly', async () => {
        // Select multiple rows
        const firstRow = page.locator('.opportunities-table .bp5-table-cell').first();
        await firstRow.click();
        
        const secondRow = page.locator('.opportunities-table .bp5-table-row-wrapper').nth(1).locator('.bp5-table-cell').first();
        await secondRow.click({ modifiers: ['Control'] });
        
        // Click "Override Selected" button
        const overrideButton = page.locator('button:has-text("Override Selected")');
        await expect(overrideButton).toBeEnabled();
        await overrideButton.click();
        
        // Verify modal opens with selected items
        await expect(page.locator('.bp5-dialog')).toBeVisible();
        
        // Close modal
        await page.keyboard.press('Escape');
    });

    test('10. Help callout displays for new users', async () => {
        // Check if help callout is visible when no selection
        const helpCallout = page.locator('.help-callout');
        
        if (await helpCallout.isVisible()) {
            // Verify help content
            await expect(helpCallout).toContainText('Quick Tips');
            await expect(helpCallout).toContainText('Click a row to select');
            await expect(helpCallout).toContainText('keyboard shortcuts');
        }
        
        // Select a row and verify callout disappears
        const firstRow = page.locator('.opportunities-table .bp5-table-cell').first();
        await firstRow.click();
        
        // Help should be hidden when items are selected
        await expect(helpCallout).not.toBeVisible();
    });

    test('11. Non-ideal state displays when no data', async () => {
        // Search for something that won't exist
        const searchBox = page.locator('#opportunity-search');
        await searchBox.fill('xyzabc123impossible');
        
        await page.waitForTimeout(500);
        
        // Check non-ideal state appears
        const nonIdealState = page.locator('.bp5-non-ideal-state');
        await expect(nonIdealState).toBeVisible();
        await expect(nonIdealState).toContainText('No opportunities found');
        await expect(nonIdealState).toContainText('Try adjusting your filters');
    });

    test('12. Performance and responsiveness', async () => {
        // Measure initial load time
        const startTime = Date.now();
        await page.reload();
        await page.waitForSelector('.opportunities-table', { timeout: 5000 });
        const loadTime = Date.now() - startTime;
        
        console.log(`Page load time: ${loadTime}ms`);
        expect(loadTime).toBeLessThan(5000); // Should load within 5 seconds
        
        // Test rapid interactions
        const searchBox = page.locator('#opportunity-search');
        
        // Rapid typing
        await searchBox.fill('test');
        await searchBox.fill('testing');
        await searchBox.fill('test');
        
        // Rapid tab switching
        await page.locator('[id="bp5-tab-title_opportunity-tabs_needs-review"]').click();
        await page.locator('[id="bp5-tab-title_opportunity-tabs_unmatched"]').click();
        await page.locator('[id="bp5-tab-title_opportunity-tabs_all"]').click();
        
        // Ensure UI remains responsive
        await expect(page.locator('.opportunities-table')).toBeVisible();
    });
});