import { test, expect } from '@playwright/test';

test.describe('Collection Opportunities URL Navigation Test', () => {
  const baseURL = 'http://localhost:3000';
  
  // List of possible URL patterns to test
  const urlsToTest = [
    '/collection-opportunities',
    '/collections',
    '/collection/123/manage',
    '/history/123/collection-opportunities',
    '/test-opportunities',
    '/create-collection-deck/collection-opportunities',
    '/decks',
    '/collection-opportunities-hub',
    '/opportunities',
    '/manage-collections',
    '/collection-management'
  ];

  test('Navigate to various collection opportunities URLs and identify working pages', async ({ page }) => {
    console.log('🧪 Testing Collection Opportunities URL Navigation');
    
    const results: { url: string; status: string; title: string; hasOpportunities: boolean }[] = [];
    
    for (const testUrl of urlsToTest) {
      try {
        console.log(`\n🔍 Testing URL: ${testUrl}`);
        
        // Navigate to URL
        const response = await page.goto(`${baseURL}${testUrl}`, { 
          waitUntil: 'networkidle',
          timeout: 10000 
        });
        
        // Wait a moment for page to load
        await page.waitForTimeout(2000);
        
        // Get page title
        const title = await page.title();
        
        // Check for collection opportunities related content
        const hasOpportunitiesContent = await page.evaluate(() => {
          const text = document.body.innerText.toLowerCase();
          return text.includes('collection opportunities') || 
                 text.includes('opportunities') ||
                 text.includes('collection management') ||
                 text.includes('manage collection');
        });
        
        // Check if page has table or list content
        const hasTableContent = await page.locator('table, .bp5-table, .collection-opportunities, .opportunities-table, .opportunities-list').count();
        
        // Get status
        const status = response?.status() || 'unknown';
        
        results.push({
          url: testUrl,
          status: status.toString(),
          title,
          hasOpportunities: hasOpportunitiesContent || hasTableContent > 0
        });
        
        console.log(`✅ Status: ${status}, Title: ${title}, Has Opportunities Content: ${hasOpportunitiesContent || hasTableContent > 0}`);
        
        // Take screenshot if it looks like a collection opportunities page
        if (hasOpportunitiesContent || hasTableContent > 0) {
          await page.screenshot({ 
            path: `collection-opportunities-url-${testUrl.replace(/\//g, '-')}.png`,
            fullPage: true 
          });
        }
        
      } catch (error) {
        console.log(`❌ Failed to load ${testUrl}: ${error}`);
        results.push({
          url: testUrl,
          status: 'error',
          title: 'Error loading page',
          hasOpportunities: false
        });
      }
    }
    
    // Print summary
    console.log('\n📊 NAVIGATION RESULTS SUMMARY:');
    console.log('=====================================');
    
    const workingPages = results.filter(r => r.status === '200' && r.hasOpportunities);
    const redirectPages = results.filter(r => r.status.startsWith('3'));
    const errorPages = results.filter(r => r.status === 'error' || r.status === '404');
    
    console.log('\n🟢 WORKING COLLECTION OPPORTUNITIES PAGES:');
    workingPages.forEach(page => {
      console.log(`  → ${page.url} (${page.status}) - "${page.title}"`);
    });
    
    console.log('\n🟡 REDIRECT PAGES:');
    redirectPages.forEach(page => {
      console.log(`  → ${page.url} (${page.status}) - "${page.title}"`);
    });
    
    console.log('\n🔴 ERROR/NOT FOUND PAGES:');
    errorPages.forEach(page => {
      console.log(`  → ${page.url} (${page.status}) - "${page.title}"`);
    });
    
    // Save results to file
    await page.evaluate((results) => {
      console.log('Full test results:', JSON.stringify(results, null, 2));
    }, results);
    
    // At least one working page should exist
    expect(workingPages.length).toBeGreaterThan(0);
  });

  test('Test specific collection ID routing patterns', async ({ page }) => {
    console.log('🧪 Testing Collection ID Routing Patterns');
    
    // Test with a sample collection ID
    const testCollectionId = '550e8400-e29b-41d4-a716-446655440000';
    const idBasedUrls = [
      `/collection/${testCollectionId}/manage`,
      `/history/${testCollectionId}/collection-opportunities`,
      `/history/${testCollectionId}/field-mapping-review`,
      `/collections/${testCollectionId}`,
      `/opportunities/${testCollectionId}`
    ];
    
    for (const url of idBasedUrls) {
      try {
        console.log(`\n🔍 Testing ID-based URL: ${url}`);
        
        const response = await page.goto(`${baseURL}${url}`, { 
          waitUntil: 'networkidle',
          timeout: 10000 
        });
        
        await page.waitForTimeout(2000);
        
        const title = await page.title();
        const status = response?.status() || 'unknown';
        
        // Check for opportunities content or error messages
        const pageContent = await page.evaluate(() => document.body.innerText);
        const hasContent = pageContent.toLowerCase().includes('collection') || 
                          pageContent.toLowerCase().includes('opportunities');
        
        console.log(`✅ ${url}: Status ${status}, Title: "${title}", Has Content: ${hasContent}`);
        
        if (hasContent && status === 200) {
          await page.screenshot({ 
            path: `collection-id-url-${url.split('/').join('-')}.png`,
            fullPage: true 
          });
        }
        
      } catch (error) {
        console.log(`❌ Failed to load ${url}: ${error}`);
      }
    }
  });
});