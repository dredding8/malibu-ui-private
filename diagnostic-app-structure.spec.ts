import { test, expect } from '@playwright/test';

test('Application Structure Diagnostic', async ({ page }) => {
  console.log('🔍 Diagnosing application structure...');
  
  // Navigate to dashboard
  await page.goto('/');
  await page.waitForLoadState('networkidle');
  await page.screenshot({ path: 'diagnostic-dashboard.png' });
  
  console.log('📊 Dashboard Elements:');
  const buttons = await page.locator('button').allTextContents();
  console.log('Buttons:', buttons);
  
  const headings = await page.locator('h1, h2, h3, h4, h5').allTextContents();
  console.log('Headings:', headings);
  
  // Try to navigate to collections/decks page
  const collectionButtons = page.locator('button:has-text("Collection"), button:has-text("Deck")');
  const collectionButtonCount = await collectionButtons.count();
  
  if (collectionButtonCount > 0) {
    console.log('📦 Found collection-related buttons:', await collectionButtons.allTextContents());
    await collectionButtons.first().click();
    await page.waitForLoadState('networkidle');
    await page.screenshot({ path: 'diagnostic-collections.png' });
    
    console.log('📦 Collections Page Elements:');
    const collectionButtons2 = await page.locator('button').allTextContents();
    console.log('Buttons:', collectionButtons2);
    
    const collectionHeadings = await page.locator('h1, h2, h3, h4, h5').allTextContents();
    console.log('Headings:', collectionHeadings);
    
    // Try to find create button
    const createButtons = page.locator('button:has-text("Create")');
    const createButtonCount = await createButtons.count();
    
    if (createButtonCount > 0) {
      console.log('➕ Found create buttons:', await createButtons.allTextContents());
      await createButtons.first().click();
      await page.waitForLoadState('networkidle');
      await page.screenshot({ path: 'diagnostic-create.png' });
      
      console.log('🛠️ Create Page URL:', page.url());
      console.log('🛠️ Create Page Elements:');
      const createButtons2 = await page.locator('button').allTextContents();
      console.log('Buttons:', createButtons2);
      
      const createHeadings = await page.locator('h1, h2, h3, h4, h5').allTextContents();
      console.log('Headings:', createHeadings);
      
      // Check for form elements
      const inputs = await page.locator('input').count();
      const selects = await page.locator('select').count();
      const textareas = await page.locator('textarea').count();
      console.log(`📝 Form elements: ${inputs} inputs, ${selects} selects, ${textareas} textareas`);
      
      // Check for test IDs
      const testIds = await page.locator('[data-testid]').allTextContents();
      console.log('🧪 Elements with test IDs:', testIds.length);
    }
  }
  
  console.log('✅ Diagnostic complete');
});