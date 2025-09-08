import { test, expect } from '@playwright/test';

test('Simple History Page Check', async ({ page }) => {
  console.log('🚀 Starting history page test...');
  
  // Navigate to the history page
  await page.goto('http://localhost:3000/history');
  console.log('📍 Navigated to history page');
  
  // Wait for page to load
  await page.waitForLoadState('networkidle');
  console.log('⏳ Waited for network idle');
  
  // Wait a bit more for React to render
  await page.waitForTimeout(3000);
  console.log('⏲️  Additional wait completed');
  
  // Take screenshot first
  await page.screenshot({ 
    path: 'simple-history-check.png', 
    fullPage: true 
  });
  console.log('📸 Screenshot taken');

  // Check page title
  const title = await page.title();
  console.log(`📄 Page title: ${title}`);

  // Look for any text content that indicates the page loaded
  const bodyText = await page.locator('body').textContent();
  console.log('📝 Page contains text:', bodyText ? 'Yes' : 'No');
  
  if (bodyText) {
    console.log('📝 First 200 chars:', bodyText.substring(0, 200));
    
    // Check for key terms
    const hasHistoryText = bodyText.includes('History') || bodyText.includes('Collection Deck');
    const hasTableHeaders = bodyText.includes('Deck Name') || bodyText.includes('Processing Status');
    const hasData = bodyText.includes('UX Test') || bodyText.includes('Sample Analytics');
    
    console.log('🔍 Analysis:');
    console.log(`  - Has History/Collection text: ${hasHistoryText ? '✅' : '❌'}`);
    console.log(`  - Has table headers: ${hasTableHeaders ? '✅' : '❌'}`);
    console.log(`  - Has sample data: ${hasData ? '✅' : '❌'}`);
    
    if (hasTableHeaders) {
      // Look for duplicate header patterns in the text
      const deckNameMatches = (bodyText.match(/Deck Name/g) || []).length;
      const processingStatusMatches = (bodyText.match(/Processing Status/g) || []).length;
      
      console.log(`📊 Header occurrence counts:`);
      console.log(`  - "Deck Name" appears ${deckNameMatches} times`);
      console.log(`  - "Processing Status" appears ${processingStatusMatches} times`);
      
      if (deckNameMatches > 1 || processingStatusMatches > 1) {
        console.log('❌ HEADER DUPLICATION DETECTED');
      } else {
        console.log('✅ No obvious header duplication in text');
      }
    }
  }

  // Try to find any table-like elements
  const divs = await page.locator('div').count();
  console.log(`📦 Found ${divs} div elements`);
  
  // Check for common table-related attributes or classes
  const tableClasses = [
    'table',
    'data-table', 
    'history-table',
    'bp6-table',
    '[role="table"]',
    '[role="grid"]'
  ];
  
  for (const className of tableClasses) {
    const count = await page.locator(className).count();
    if (count > 0) {
      console.log(`🎯 Found ${count} elements matching '${className}'`);
      
      // If we found something, take a screenshot of it
      try {
        await page.locator(className).first().screenshot({
          path: `element-${className.replace(/[\[\]"':]/g, '_')}.png`
        });
        console.log(`📸 Screenshot taken of ${className}`);
      } catch (e) {
        console.log(`⚠️  Could not screenshot ${className}`);
      }
    }
  }
  
  console.log('✅ Simple check completed');
});