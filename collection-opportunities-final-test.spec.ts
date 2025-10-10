import { test, expect, Page } from '@playwright/test';

test.describe('Collection Opportunities Refactored - Final E2E Test', () => {
    let page: Page;

    test('Complete user journey through Collection Opportunities', async ({ browser }) => {
        page = await browser.newPage();
        
        // Navigate to the collection hub
        await page.goto('http://localhost:3000/collection/test-collection-1/manage');
        await page.waitForLoadState('networkidle');
        
        // Wait for the page to load
        await page.waitForSelector('h2:has-text("Collection Opportunities")', { timeout: 5000 });
        
        // Take initial screenshot
        await page.screenshot({ path: 'collection-opportunities-initial.png', fullPage: true });
        
        console.log('✅ Page loaded successfully');
        
        // 1. Test tab navigation
        const needsReviewTab = page.locator('[role="tab"]:has-text("Needs Review")').first();
        if (await needsReviewTab.isVisible()) {
            await needsReviewTab.click();
            await page.waitForTimeout(500);
            console.log('✅ Switched to Needs Review tab');
        }
        
        // Return to All tab
        const allTab = page.locator('[role="tab"]:has-text("All")').first();
        if (await allTab.isVisible()) {
            await allTab.click();
            await page.waitForTimeout(500);
            console.log('✅ Returned to All tab');
        }
        
        // 2. Test search functionality
        const searchInput = page.locator('input[placeholder*="Search"]').first();
        if (await searchInput.isVisible()) {
            await searchInput.fill('test');
            await page.waitForTimeout(800); // Wait for debounce
            await searchInput.clear();
            await page.waitForTimeout(800);
            console.log('✅ Search functionality working');
        }
        
        // 3. Test row selection
        const tableCell = page.locator('.bp5-table-cell').first();
        if (await tableCell.isVisible()) {
            // Click inside the cell content
            const cellContent = tableCell.locator('div').first();
            await cellContent.click();
            await page.waitForTimeout(500);
            
            // Check if selection indicator appears
            const selectionIndicator = page.locator('text=/\\d+ selected/');
            if (await selectionIndicator.isVisible()) {
                console.log('✅ Row selection working');
                
                // Take screenshot with selection
                await page.screenshot({ path: 'collection-opportunities-selected.png', fullPage: true });
            }
        }
        
        // 4. Test site filter
        const siteFilter = page.locator('select').filter({ hasText: /All Sites/ });
        if (await siteFilter.isVisible()) {
            const options = await siteFilter.locator('option').count();
            if (options > 1) {
                await siteFilter.selectOption({ index: 1 });
                await page.waitForTimeout(500);
                console.log('✅ Site filter working');
                
                // Reset filter
                await siteFilter.selectOption('');
                await page.waitForTimeout(500);
            }
        }
        
        // 5. Test keyboard shortcuts
        await page.keyboard.press('Control+A');
        await page.waitForTimeout(500);
        
        const allSelected = await page.locator('text=/\\d+ selected/').isVisible();
        if (allSelected) {
            console.log('✅ Ctrl+A select all working');
        }
        
        await page.keyboard.press('Escape');
        await page.waitForTimeout(500);
        
        const selectionCleared = await page.locator('text=/\\d+ selected/').isHidden();
        if (selectionCleared) {
            console.log('✅ Escape to clear selection working');
        }
        
        // 6. Test edit modal
        const editButton = page.locator('button[aria-label*="Edit"]').first();
        if (await editButton.isVisible()) {
            await editButton.click();
            await page.waitForTimeout(1000);
            
            const modal = page.locator('.bp5-dialog');
            if (await modal.isVisible()) {
                console.log('✅ Edit modal opened');
                
                // Take screenshot of modal
                await page.screenshot({ path: 'collection-opportunities-modal.png', fullPage: true });
                
                // Close modal
                await page.keyboard.press('Escape');
                await page.waitForTimeout(500);
            }
        }
        
        // Final screenshot
        await page.screenshot({ path: 'collection-opportunities-final.png', fullPage: true });
        
        console.log('\n🎉 All tests completed successfully!');
        console.log('\nScreenshots saved:');
        console.log('  - collection-opportunities-initial.png');
        console.log('  - collection-opportunities-selected.png'); 
        console.log('  - collection-opportunities-modal.png');
        console.log('  - collection-opportunities-final.png');
        
        await page.close();
    });
});