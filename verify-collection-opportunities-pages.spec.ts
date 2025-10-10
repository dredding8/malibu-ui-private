import { test, expect } from '@playwright/test';

test.describe('Collection Opportunities Page Discovery', () => {
  test('Navigate to working collection opportunities URLs and capture screenshots', async ({ page }) => {
    const baseURL = 'http://localhost:3000';
    
    console.log('🧪 Discovering Collection Opportunities Pages');
    
    const workingUrls = [
      {
        url: '/test-opportunities',
        name: 'TestOpportunities Page'
      },
      {
        url: '/collection/550e8400-e29b-41d4-a716-446655440000/manage',
        name: 'Collection Management Hub'
      },
      {
        url: '/history/550e8400-e29b-41d4-a716-446655440000/collection-opportunities',
        name: 'History Collection Opportunities Redirect'
      },
      {
        url: '/decks',
        name: 'Collection Decks'
      }
    ];
    
    for (const { url, name } of workingUrls) {
      console.log(`\n🔍 Testing: ${name} at ${url}`);
      
      try {
        // Navigate to the URL
        await page.goto(`${baseURL}${url}`, {
          waitUntil: 'networkidle',
          timeout: 15000
        });
        
        // Wait for page to fully load
        await page.waitForTimeout(3000);
        
        // Get page title and content info
        const title = await page.title();
        console.log(`📄 Page Title: ${title}`);
        
        // Check for collection opportunities content
        const hasOpportunities = await page.evaluate(() => {
          const text = document.body.innerText.toLowerCase();
          return {
            hasOpportunities: text.includes('collection opportunities') || 
                             text.includes('opportunities') ||
                             text.includes('collection management'),
            hasTables: document.querySelectorAll('table, .bp5-table, .bp6-table').length > 0,
            hasCards: document.querySelectorAll('.bp5-card, .bp6-card').length > 0,
            hasSpinner: text.includes('loading') || document.querySelectorAll('.bp5-spinner, .bp6-spinner').length > 0
          };
        });
        
        console.log(`📊 Content Analysis:`, hasOpportunities);
        
        // Take screenshot
        const screenshotPath = `collection-opportunities-page-${url.replace(/[^a-zA-Z0-9]/g, '-')}.png`;
        await page.screenshot({
          path: screenshotPath,
          fullPage: true
        });
        console.log(`📸 Screenshot saved: ${screenshotPath}`);
        
        // Look for any error messages or navigation issues
        const errorElements = await page.locator('.bp5-callout-intent-danger, .bp6-callout-intent-danger, .error, [data-testid*="error"]').count();
        if (errorElements > 0) {
          console.log(`⚠️  Found ${errorElements} error elements on page`);
        }
        
        // Check if there are any actual opportunity items or data
        const dataElements = await page.evaluate(() => {
          return {
            rows: document.querySelectorAll('tr, .opportunity-row, .collection-item').length,
            buttons: document.querySelectorAll('button').length,
            inputs: document.querySelectorAll('input, select, textarea').length
          };
        });
        console.log(`🎛️  Interactive Elements:`, dataElements);
        
        console.log(`✅ Successfully loaded: ${name}`);
        
      } catch (error) {
        console.log(`❌ Failed to load ${name}: ${error}`);
        
        // Try to take screenshot of error state
        try {
          await page.screenshot({
            path: `error-${url.replace(/[^a-zA-Z0-9]/g, '-')}.png`,
            fullPage: true
          });
        } catch (screenshotError) {
          console.log('Could not take error screenshot');
        }
      }
    }
    
    console.log('\n🎯 SUMMARY: Check the generated screenshots to see the actual pages.');
    console.log('The following URLs should be working:');
    console.log('- /test-opportunities - Direct test page with mock data');
    console.log('- /collection/{id}/manage - Collection management hub');
    console.log('- /decks - Collection decks listing');
  });

  test('Test specific collection management features', async ({ page }) => {
    console.log('🧪 Testing Collection Management Hub Features');
    
    const collectionId = '550e8400-e29b-41d4-a716-446655440000';
    const hubUrl = `http://localhost:3000/collection/${collectionId}/manage`;
    
    await page.goto(hubUrl, { waitUntil: 'networkidle', timeout: 15000 });
    await page.waitForTimeout(3000);
    
    console.log('📄 Collection Management Hub loaded');
    
    // Check for tabs
    const tabs = await page.locator('[role="tab"], .bp5-tab, .bp6-tab').count();
    console.log(`📑 Found ${tabs} tabs in the interface`);
    
    // Check for statistics cards
    const statCards = await page.locator('.stat-card, .bp5-card, .bp6-card').count();
    console.log(`📊 Found ${statCards} stat cards`);
    
    // Check for opportunities content
    const opportunityElements = await page.evaluate(() => {
      const text = document.body.innerText.toLowerCase();
      return {
        hasOpportunitiesText: text.includes('opportunities'),
        hasManageText: text.includes('manage'),
        hasCollectionText: text.includes('collection'),
        hasLoadingState: text.includes('loading'),
        tableCount: document.querySelectorAll('table').length,
        buttonCount: document.querySelectorAll('button').length
      };
    });
    
    console.log('🔍 Hub Content Analysis:', opportunityElements);
    
    // Take detailed screenshot
    await page.screenshot({
      path: 'collection-hub-detailed-view.png',
      fullPage: true
    });
    
    console.log('✅ Collection Management Hub analysis complete');
  });

  test('Verify test opportunities page functionality', async ({ page }) => {
    console.log('🧪 Testing TestOpportunities Page');
    
    await page.goto('http://localhost:3000/test-opportunities', { 
      waitUntil: 'networkidle',
      timeout: 15000 
    });
    await page.waitForTimeout(3000);
    
    // Check for the test page content
    const pageContent = await page.evaluate(() => {
      const text = document.body.innerText;
      return {
        hasTestTitle: text.includes('Collection Opportunities Test Page'),
        hasOpportunityData: text.includes('Opportunity Alpha') || text.includes('SAT-001'),
        tableRows: document.querySelectorAll('tr').length,
        cards: document.querySelectorAll('.bp5-card, .bp6-card').length,
        buttons: document.querySelectorAll('button').length
      };
    });
    
    console.log('📊 Test Page Content:', pageContent);
    
    // Take screenshot
    await page.screenshot({
      path: 'test-opportunities-page.png',
      fullPage: true
    });
    
    // Verify this is actually a working opportunities page
    expect(pageContent.hasTestTitle || pageContent.hasOpportunityData).toBe(true);
    
    console.log('✅ Test Opportunities page verified as working');
  });
});