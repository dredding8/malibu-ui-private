import { test, expect } from '@playwright/test';

test.describe('Debug Real Application Structure', () => {
  test('Explore actual page structure and available elements', async ({ page }) => {
    console.log('🔍 Debugging application structure...\n');
    
    // First, go to the main page
    await page.goto('http://localhost:3000');
    await page.waitForLoadState('networkidle');
    
    console.log('📍 Main page URL:', page.url());
    
    // Look for navigation links
    const navLinks = await page.locator('a, button').evaluateAll(elements => 
      elements.map(el => ({
        text: el.textContent?.trim(),
        href: (el as HTMLAnchorElement).href || '',
        type: el.tagName.toLowerCase()
      })).filter(item => item.text)
    );
    
    console.log('\n🔗 Navigation elements found:');
    navLinks.forEach(link => {
      console.log(`   - ${link.type}: "${link.text}" ${link.href ? `(${link.href})` : ''}`);
    });
    
    // Try to find collection-related navigation
    const collectionLinks = navLinks.filter(link => 
      link.text?.toLowerCase().includes('collection') ||
      link.href?.includes('collection')
    );
    
    if (collectionLinks.length > 0) {
      console.log('\n✅ Found collection-related links:', collectionLinks);
      
      // Click on the first collection link
      const firstCollectionLink = collectionLinks[0];
      await page.locator(`text="${firstCollectionLink.text}"`).first().click();
      await page.waitForLoadState('networkidle');
      
      console.log('\n📍 After clicking collection link, URL:', page.url());
    }
    
    // If no collection links, try direct navigation
    console.log('\n🚀 Attempting direct navigation to /collection/1/manage...');
    try {
      await page.goto('http://localhost:3000/collection/1/manage');
      await page.waitForTimeout(2000);
      
      const currentUrl = page.url();
      console.log('📍 Current URL after navigation:', currentUrl);
      
      // Check if we were redirected
      if (currentUrl !== 'http://localhost:3000/collection/1/manage') {
        console.log('⚠️  Redirected from /collection/1/manage to:', currentUrl);
      }
      
      // Get page content
      const pageContent = await page.locator('body').innerText();
      console.log('\n📄 Page content (first 500 chars):\n', pageContent.substring(0, 500));
      
      // Look for any error messages
      const possibleErrors = await page.locator('.error, .warning, [role="alert"], .message').evaluateAll(
        elements => elements.map(el => el.textContent?.trim())
      );
      
      if (possibleErrors.length > 0) {
        console.log('\n⚠️  Possible error messages:', possibleErrors);
      }
      
      // Check what tables exist
      const tables = await page.locator('table').count();
      console.log('\n📊 Tables found:', tables);
      
      if (tables > 0) {
        const tableHeaders = await page.locator('table th').evaluateAll(
          elements => elements.map(el => el.textContent?.trim())
        );
        console.log('📋 Table headers:', tableHeaders);
      }
      
      // Check for data grids or lists
      const dataContainers = await page.evaluate(() => {
        const containers = {
          tables: document.querySelectorAll('table').length,
          grids: document.querySelectorAll('[role="grid"], .grid, .data-grid').length,
          lists: document.querySelectorAll('[role="list"], ul, ol').length,
          cards: document.querySelectorAll('.card, .bp5-card').length
        };
        return containers;
      });
      
      console.log('\n📦 Data containers found:', dataContainers);
      
    } catch (error) {
      console.log('❌ Error navigating to collection page:', error.message);
    }
    
    // Take a screenshot for manual inspection
    await page.screenshot({ 
      path: 'test-results/debug-screenshot.png',
      fullPage: true 
    });
    
    console.log('\n📸 Screenshot saved to: test-results/debug-screenshot.png');
  });
});