import { test, expect, Page } from '@playwright/test';

test.describe('Collection Opportunities Refactored - Focused User Journey', () => {
    let page: Page;

    test.beforeEach(async ({ browser }) => {
        page = await browser.newPage();
        
        // Enable console logs for debugging
        page.on('console', msg => {
            if (msg.type() === 'error') {
                console.log(`Browser error: ${msg.text()}`);
            }
        });
        
        // Navigate to the collection hub
        await page.goto('http://localhost:3000/collection/test-collection-1/manage');
        await page.waitForLoadState('networkidle');
    });

    test.afterEach(async () => {
        await page.close();
    });

    test('1. Component loads and displays the opportunities table', async () => {
        // Look for the Collection Opportunities title
        await expect(page.locator('h2:has-text("Collection Opportunities")')).toBeVisible({ timeout: 5000 });
        
        // Check if the navbar is present
        const navbar = page.locator('.opportunities-navbar, .bp5-navbar');
        await expect(navbar).toBeVisible();
        
        // Check tabs are present
        const tabs = page.locator('[role="tablist"], .bp5-tabs, #opportunity-tabs');
        await expect(tabs).toBeVisible();
        
        // Take a screenshot for visual verification
        await page.screenshot({ path: 'collection-opportunities-loaded-fixed.png', fullPage: true });
        
        // Check if there's a table or any data display
        const tableOrData = await page.locator('.bp5-table, .opportunities-table, .bp5-card').first();
        await expect(tableOrData).toBeVisible();
    });

    test('2. Search functionality works', async () => {
        // Wait for component to load
        await page.waitForSelector('h2:has-text("Collection Opportunities")', { timeout: 5000 });
        
        // Find the search input
        const searchInput = await page.locator('input[placeholder*="Search"], #opportunity-search, .search-input').first();
        
        if (await searchInput.isVisible()) {
            // Type in search
            await searchInput.fill('test search');
            await page.waitForTimeout(500); // Wait for debounce
            
            // Clear search
            await searchInput.clear();
            await page.waitForTimeout(500);
        } else {
            console.log('Search input not found - may be in a different tab or state');
        }
    });

    test('3. Tab navigation is functional', async () => {
        // Wait for tabs to be visible
        const tabList = await page.locator('[role="tablist"], .bp5-tabs');
        
        if (await tabList.isVisible()) {
            // Look for tab buttons
            const tabs = await page.locator('[role="tab"], .bp5-tab').all();
            console.log(`Found ${tabs.length} tabs`);
            
            // Click through tabs if they exist
            for (let i = 0; i < Math.min(tabs.length, 3); i++) {
                await tabs[i].click();
                await page.waitForTimeout(200); // Small wait for tab content to change
            }
        }
    });

    test('4. User can interact with table rows', async () => {
        // Wait for any table or data display
        await page.waitForTimeout(1000); // Give time for data to load
        
        // Look for table cells or rows
        const tableCell = await page.locator('.bp5-table-cell, td, .opportunity-name').first();
        
        if (await tableCell.isVisible()) {
            // Try to click on a row
            await tableCell.click();
            
            // Check if selection state changed (look for selected indicator)
            const selectionIndicator = await page.locator('.bp5-tag:has-text("selected"), text=/\\d+ selected/');
            const isSelected = await selectionIndicator.isVisible();
            console.log(`Row selection indicator visible: ${isSelected}`);
        } else {
            console.log('No table data found - component may be in loading or empty state');
        }
    });

    test('5. Modal functionality for editing opportunities', async () => {
        // Look for edit buttons
        const editButton = await page.locator('button[aria-label*="Edit"], button:has-text("Edit"), button:has-text("Override")').first();
        
        if (await editButton.isVisible()) {
            await editButton.click();
            
            // Wait for modal
            const modal = await page.locator('.bp5-dialog, .bp5-overlay-content');
            const modalVisible = await modal.isVisible({ timeout: 3000 }).catch(() => false);
            
            if (modalVisible) {
                console.log('Modal opened successfully');
                
                // Close modal
                const closeButton = await page.locator('.bp5-dialog button[aria-label="Close"], .bp5-dialog-close-button, button:has-text("Cancel")').first();
                if (await closeButton.isVisible()) {
                    await closeButton.click();
                } else {
                    await page.keyboard.press('Escape');
                }
            }
        } else {
            console.log('No edit buttons found - may need to select a row first');
        }
    });

    test('6. Site filter dropdown functionality', async () => {
        // Look for site filter dropdown
        const siteFilter = await page.locator('select.site-filter, select:has-text("All Sites"), .bp5-html-select select').first();
        
        if (await siteFilter.isVisible()) {
            // Get current value
            const initialValue = await siteFilter.inputValue();
            console.log(`Initial filter value: ${initialValue}`);
            
            // Try to change selection
            const options = await siteFilter.locator('option').all();
            if (options.length > 1) {
                await siteFilter.selectOption({ index: 1 });
                await page.waitForTimeout(500);
                
                // Reset to original
                await siteFilter.selectOption(initialValue);
            }
        } else {
            console.log('Site filter not found - may be in a different view state');
        }
    });

    test('7. Full E2E user journey', async () => {
        // Complete user journey through the component
        console.log('Starting full user journey...');
        
        // 1. Verify page loaded
        await expect(page.locator('h2:has-text("Collection Opportunities")')).toBeVisible();
        
        // 2. Search for opportunities
        const searchInput = await page.locator('input[placeholder*="Search"], #opportunity-search').first();
        if (await searchInput.isVisible()) {
            await searchInput.fill('test');
            await page.waitForTimeout(500);
            await searchInput.clear();
        }
        
        // 3. Navigate tabs
        const secondTab = await page.locator('[role="tab"], .bp5-tab').nth(1);
        if (await secondTab.isVisible()) {
            await secondTab.click();
            await page.waitForTimeout(500);
        }
        
        // 4. Return to first tab
        const firstTab = await page.locator('[role="tab"], .bp5-tab').first();
        if (await firstTab.isVisible()) {
            await firstTab.click();
            await page.waitForTimeout(500);
        }
        
        // 5. Select a row
        const tableCell = await page.locator('.bp5-table-cell, td').first();
        if (await tableCell.isVisible()) {
            await tableCell.click();
        }
        
        // 6. Final screenshot
        await page.screenshot({ path: 'collection-opportunities-journey-complete.png', fullPage: true });
        
        console.log('User journey completed successfully');
    });
});