import { test, expect, Page } from '@playwright/test';

test.describe('Collection Opportunities Refactored - Simple Navigation Test', () => {
    let page: Page;

    test('Navigate to Collection Opportunities Hub and verify component loads', async ({ browser }) => {
        page = await browser.newPage();
        
        // Enable console logs
        page.on('console', msg => console.log(`Browser console: ${msg.type()}: ${msg.text()}`));
        page.on('pageerror', error => console.log(`Browser error: ${error.message}`));
        
        // Navigate to a specific collection ID route
        console.log('Navigating to collection hub...');
        await page.goto('http://localhost:3000/collection/test-collection-1/manage');
        
        // Wait for the page to load
        await page.waitForLoadState('networkidle');
        
        // Take a screenshot to see what's loaded
        await page.screenshot({ path: 'collection-hub-loaded.png', fullPage: true });
        
        // Check if AllocationProvider loaded (parent component)
        const allocationProvider = await page.evaluate(() => {
            return document.querySelector('[data-testid="allocation-provider"]') !== null ||
                   document.querySelector('.collection-opportunities-hub') !== null;
        });
        
        console.log(`AllocationProvider or Hub found: ${allocationProvider}`);
        
        // Look for the CollectionOpportunitiesRefactored component or its elements
        const selectors = [
            '.collection-opportunities-refactored',
            '.collection-opportunities-enhanced',
            '.opportunities-navbar',
            '#opportunity-tabs',
            '.opportunities-table',
            'h2:has-text("Collection Opportunities")',
            '.bp5-card',
            '.bp5-spinner' // Loading state
        ];
        
        let foundElement = null;
        for (const selector of selectors) {
            try {
                const element = await page.locator(selector).first();
                if (await element.isVisible({ timeout: 2000 })) {
                    foundElement = selector;
                    console.log(`Found element: ${selector}`);
                    break;
                }
            } catch (e) {
                console.log(`Selector ${selector} not found`);
            }
        }
        
        // Check page title and content
        const pageTitle = await page.title();
        console.log(`Page title: ${pageTitle}`);
        
        const pageText = await page.textContent('body');
        console.log(`Page contains "Collection": ${pageText?.includes('Collection')}`);
        console.log(`Page contains "Opportunities": ${pageText?.includes('Opportunities')}`);
        
        // Check for any error states
        const errorState = await page.locator('.bp5-non-ideal-state').count();
        if (errorState > 0) {
            const errorText = await page.locator('.bp5-non-ideal-state').textContent();
            console.log(`Error state found: ${errorText}`);
        }
        
        // Assert that we found some relevant element
        expect(foundElement).not.toBeNull();
        
        await page.close();
    });
});