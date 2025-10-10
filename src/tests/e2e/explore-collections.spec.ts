import { test, expect } from '@playwright/test';

test.describe('Explore Collections Feature', () => {
  test('Navigate to Collections and explore management options', async ({ page }) => {
    // Go to main page
    await page.goto('http://localhost:3000');
    await page.waitForLoadState('networkidle');
    
    // Click on Collections button
    console.log('🔍 Clicking Collections button...');
    await page.locator('button:has-text("Collections")').click();
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(2000);
    
    console.log('📍 Current URL:', page.url());
    
    // Get page content
    const pageContent = await page.locator('body').innerText();
    console.log('\n📄 Collections page content (first 500 chars):\n', pageContent.substring(0, 500));
    
    // Look for collection-related elements
    const collectionElements = await page.evaluate(() => {
      const elements = {
        tables: document.querySelectorAll('table').length,
        buttons: Array.from(document.querySelectorAll('button')).map(b => b.textContent?.trim()).filter(Boolean),
        headings: Array.from(document.querySelectorAll('h1, h2, h3, h4')).map(h => h.textContent?.trim()).filter(Boolean),
        links: Array.from(document.querySelectorAll('a')).map(a => ({ 
          text: a.textContent?.trim(), 
          href: a.href 
        })).filter(item => item.text)
      };
      return elements;
    });
    
    console.log('\n📊 Collection page structure:', JSON.stringify(collectionElements, null, 2));
    
    // Check if there's a "manage" or "view" option for collections
    const hasManageOption = collectionElements.buttons.some(btn => 
      btn.toLowerCase().includes('manage') || 
      btn.toLowerCase().includes('view') ||
      btn.toLowerCase().includes('edit')
    );
    
    console.log('\n✅ Has manage/view options:', hasManageOption);
    
    // Try clicking on Create Collection to see the form
    if (collectionElements.buttons.includes('Create Collection')) {
      console.log('\n🔍 Clicking Create Collection...');
      await page.locator('button:has-text("Create Collection")').click();
      await page.waitForTimeout(2000);
      
      // Check for modal or form
      const hasModal = await page.locator('[role="dialog"], .modal, .bp5-dialog').isVisible();
      const hasForm = await page.locator('form').isVisible();
      
      console.log('📋 Modal visible:', hasModal);
      console.log('📋 Form visible:', hasForm);
      
      if (hasModal || hasForm) {
        // Get form fields
        const formFields = await page.locator('input, select, textarea').evaluateAll(
          elements => elements.map(el => ({
            type: el.tagName.toLowerCase(),
            name: (el as HTMLInputElement).name || '',
            placeholder: (el as HTMLInputElement).placeholder || '',
            label: el.getAttribute('aria-label') || ''
          }))
        );
        
        console.log('\n📝 Form fields found:', formFields);
      }
    }
    
    // Look for any existing collections in a table or list
    const tableRows = await page.locator('table tbody tr, [role="row"]').count();
    console.log('\n📊 Table rows found:', tableRows);
    
    if (tableRows > 0) {
      // Get first row data
      const firstRow = await page.locator('table tbody tr, [role="row"]').first().innerText();
      console.log('📋 First row content:', firstRow);
      
      // Look for action buttons in the row
      const rowButtons = await page.locator('table tbody tr, [role="row"]').first()
        .locator('button').evaluateAll(buttons => 
          buttons.map(b => b.textContent?.trim())
        );
      
      console.log('🔘 Row action buttons:', rowButtons);
    }
    
    // Take screenshot
    await page.screenshot({ 
      path: 'test-results/collections-page.png',
      fullPage: true 
    });
    
    console.log('\n📸 Screenshot saved to: test-results/collections-page.png');
  });
});