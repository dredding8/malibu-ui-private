import { test, expect } from '@playwright/test';

test('Debug Mobile Button Issues', async ({ page, browserName }) => {
  console.log(`🔍 Debugging Mobile Buttons on ${browserName}...`);
  
  // Navigate to history page
  await page.goto('/history');
  await page.waitForLoadState('networkidle');
  await page.waitForTimeout(2000);
  
  console.log('Current URL:', page.url());
  
  // Take screenshot
  await page.screenshot({ path: `debug-mobile-buttons-${browserName}.png`, fullPage: true });
  
  // Check viewport
  const viewport = page.viewportSize();
  console.log('Viewport:', viewport);
  
  // Look for action buttons that should be present
  const actionButtonSelectors = [
    'button:has-text("View")',
    'button:has-text("Review")', 
    'button:has-text("Download")',
    'button:has-text("View Collection")',
    'button:has-text("Review Matches")',
    'button:has-text("Download Results")'
  ];
  
  console.log('\n🔍 Action Button Analysis:');
  for (const selector of actionButtonSelectors) {
    const elements = page.locator(selector);
    const count = await elements.count();
    let visible = false;
    let text = '';
    
    if (count > 0) {
      visible = await elements.first().isVisible();
      text = await elements.first().textContent() || '';
    }
    
    console.log(`  ${selector}: count=${count}, visible=${visible}, text="${text}"`);
  }
  
  // Check all buttons
  const allButtons = page.locator('button');
  const buttonCount = await allButtons.count();
  console.log(`\n📊 Total buttons found: ${buttonCount}`);
  
  // Check first 10 buttons
  console.log('\n🔍 First 10 Button Details:');
  for (let i = 0; i < Math.min(buttonCount, 10); i++) {
    const button = allButtons.nth(i);
    const text = await button.textContent();
    const visible = await button.isVisible();
    const className = await button.getAttribute('class');
    
    console.log(`  Button ${i + 1}: "${text}" visible=${visible} class="${className}"`);
  }
  
  // Check if history table container exists
  const historyTable = page.locator('[data-testid="history-table-container"]');
  const tableExists = await historyTable.count() > 0;
  const tableVisible = tableExists ? await historyTable.isVisible() : false;
  console.log(`\n📋 History table: exists=${tableExists}, visible=${tableVisible}`);
  
  // Check table rows
  if (tableExists) {
    const rows = page.locator('[data-testid="history-table-container"] tr, [data-testid="history-table-container"] .bp4-table-row');
    const rowCount = await rows.count();
    console.log(`📋 Table rows: ${rowCount}`);
    
    // If no rows, that might explain missing action buttons
    if (rowCount === 0) {
      console.log('⚠️  No table rows found - this explains missing action buttons');
    }
  }
  
  // Check status elements
  const statusElements = page.locator('[data-testid*="status"]');
  const statusCount = await statusElements.count();
  console.log(`\n📈 Status elements: ${statusCount}`);
  
  // Check if this is a responsive design issue
  const mainContent = page.locator('.history-content, .main-content, main');
  const mainContentExists = await mainContent.count() > 0;
  console.log(`\n📱 Main content area exists: ${mainContentExists}`);
});

// Run on mobile devices specifically
test.describe('Mobile-specific tests', () => {
  test.use({ 
    viewport: { width: 375, height: 667 } // iPhone SE size
  });
  
  test('Mobile History Page Button Visibility', async ({ page }) => {
    console.log('📱 Testing Mobile History Page...');
    
    await page.goto('/history');
    await page.waitForLoadState('networkidle');
    
    // Check if main heading is visible
    const heading = page.locator('h3').first();
    const headingVisible = await heading.isVisible();
    console.log(`Heading visible: ${headingVisible}`);
    
    // Check Create Collection button
    const createButton = page.locator('button:has-text("Create Collection")');
    const createButtonVisible = await createButton.isVisible();
    console.log(`Create Collection button visible: ${createButtonVisible}`);
    
    // Take mobile screenshot
    await page.screenshot({ path: 'debug-mobile-history.png', fullPage: true });
    
    if (headingVisible) {
      console.log('✅ Mobile heading works');
    } else {
      console.log('❌ Mobile heading fails');
    }
    
    if (createButtonVisible) {
      console.log('✅ Mobile Create button works');
    } else {
      console.log('❌ Mobile Create button fails');
    }
  });
});