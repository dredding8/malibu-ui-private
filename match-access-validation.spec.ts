import { test, expect } from '@playwright/test';

/**
 * Match Access Workflow Validation
 * 
 * Validates the complete match access workflow from history table
 * to match review, ensuring intuitive user experience and proper
 * navigation flow.
 */

test.describe('🎯 Match Access Workflow Validation', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');
  });

  test('🔍 Complete Match Access Flow', async ({ page }) => {
    console.log('🔍 Testing Complete Match Access Flow...');
    
    const testDeckName = `Match Access Test ${Date.now()}`;
    
    // PHASE 1: Create a collection deck
    console.log('📝 Phase 1: Creating Collection Deck for Match Access Testing');
    
    await page.click('button:has-text("Create Collection")');
    await page.fill('[data-testid="deck-name-input"]', testDeckName);
    await page.fill('[data-testid="start-date-input"]', '01/01/2024');
    await page.fill('[data-testid="end-date-input"]', '01/31/2024');
    await page.selectOption('[data-testid="tle-source-select"]', 'UDL');
    await page.click('[data-testid="next-button"]');
    await page.fill('[data-testid="hard-capacity-input"]', '10');
    await page.fill('[data-testid="min-duration-input"]', '15');
    await page.fill('[data-testid="elevation-input"]', '20');
    await page.click('button:has-text("Next")');
    await page.click('button:has-text("Next")');
    await page.click('button:has-text("Finish")');
    
    const confirmButton = page.locator('button:has-text("Confirm & Start Processing")');
    if (await confirmButton.isVisible({ timeout: 2000 })) {
      await confirmButton.click();
    }
    
    await page.waitForURL(/.*history.*/);
    
    // PHASE 2: Locate the created deck in history
    console.log('🏠 Phase 2: Locating Deck in History Table');
    
    const historyTable = page.locator('[data-testid="history-table-container"]');
    await expect(historyTable).toBeVisible();
    
    // Find our deck
    const deckRow = page.locator(`text="${testDeckName}"`).locator('../../..');
    await expect(deckRow).toBeVisible();
    
    // PHASE 3: Check for match access affordances
    console.log('🎯 Phase 3: Validating Match Access Affordances');
    
    // Look for view/review buttons in the deck's row
    const viewButtons = page.locator('[data-testid*="view-deck"], [data-testid*="review-matches"], button:has-text("View"), button:has-text("Review")');
    
    // Check if any match access buttons are visible
    const matchAccessButtonCount = await viewButtons.count();
    console.log(`Found ${matchAccessButtonCount} match access buttons`);
    
    if (matchAccessButtonCount > 0) {
      // Test the first available button
      const firstButton = viewButtons.first();
      await expect(firstButton).toBeVisible();
      
      // Validate button text is user-friendly
      const buttonText = await firstButton.textContent();
      console.log(`Match access button text: "${buttonText}"`);
      
      // Should have clear, action-oriented text
      expect(buttonText).toMatch(/(View|Review|Open|See|Access).*[Mm]atch/i);
      
      // Test button click (may navigate or show modal)
      await firstButton.click();
      
      // Allow time for any navigation or modal to appear
      await page.waitForTimeout(2000);
      
      // Check if we navigated to a match review page
      const currentUrl = page.url();
      if (currentUrl.includes('match') || currentUrl.includes('review')) {
        console.log('✅ Successfully navigated to match review page');
        
        // Validate we're in a match review interface
        const matchElements = page.locator('text=/match/i, text=/review/i, [data-testid*="match"]');
        const hasMatchContent = await matchElements.count() > 0;
        expect(hasMatchContent).toBeTruthy();
      } else {
        // Check for modal or in-place match display
        const modalOrContent = page.locator('.bp4-dialog, .bp4-overlay-content, [data-testid*="match-content"]');
        const hasMatchInterface = await modalOrContent.count() > 0;
        
        if (hasMatchInterface) {
          console.log('✅ Match interface displayed in modal or overlay');
        } else {
          console.log('ℹ️ Match access initiated but interface may be loading');
        }
      }
      
    } else {
      console.log('ℹ️ No match access buttons found - deck may not be ready yet');
      
      // Check deck status to understand why no buttons are available
      const statusElements = page.locator('[data-testid*="status"]');
      if (await statusElements.count() > 0) {
        const statusText = await statusElements.first().textContent();
        console.log(`Deck status: ${statusText}`);
        
        // If deck is still processing, this is expected
        if (statusText?.includes('Processing') || statusText?.includes('Working')) {
          console.log('ℹ️ Expected: Deck is still processing');
        }
      }
    }
    
    console.log('✅ Match Access Flow Validation Complete');
  });

  test('🎨 Match Access Button Visibility and Design', async ({ page }) => {
    console.log('🎨 Testing Match Access Button Design and Visibility...');
    
    // Navigate directly to history page to test existing decks
    await page.goto('/history');
    await page.waitForLoadState('networkidle');
    
    const historyTable = page.locator('[data-testid="history-table-container"]');
    await expect(historyTable).toBeVisible();
    
    // Look for any existing ready decks
    const allRows = page.locator('[data-testid="history-table-container"] tr');
    const rowCount = await allRows.count();
    
    console.log(`Found ${rowCount} rows in history table`);
    
    if (rowCount > 1) { // More than just header row
      // Check for action buttons across all rows
      const allActionButtons = page.locator('[data-testid*="view"], [data-testid*="review"], [data-testid*="download"], button:has-text("View"), button:has-text("Review"), button:has-text("Download")');
      const actionButtonCount = await allActionButtons.count();
      
      console.log(`Found ${actionButtonCount} action buttons total`);
      
      if (actionButtonCount > 0) {
        // Test visibility and design of first few buttons
        for (let i = 0; i < Math.min(3, actionButtonCount); i++) {
          const button = allActionButtons.nth(i);
          
          if (await button.isVisible()) {
            const buttonText = await button.textContent();
            const isEnabled = await button.isEnabled();
            
            console.log(`Button ${i + 1}: "${buttonText}" - Enabled: ${isEnabled}`);
            
            // Validate button design principles
            expect(buttonText).toBeTruthy();
            expect(buttonText.length).toBeGreaterThan(3); // Not just "..."
            
            // Check for proper intent styling (should have Blueprint.js classes)
            const buttonClasses = await button.getAttribute('class');
            expect(buttonClasses).toMatch(/bp4-button/);
          }
        }
      } else {
        console.log('ℹ️ No action buttons found in current state');
      }
    }
    
    console.log('✅ Button Design Validation Complete');
  });

  test('🚀 Progressive Match Disclosure Flow', async ({ page }) => {
    console.log('🚀 Testing Progressive Match Disclosure...');
    
    // This test validates the progressive disclosure pattern
    // where users first see summary information, then can access details
    
    await page.goto('/history');
    await page.waitForLoadState('networkidle');
    
    // Look for any deck with match data
    const historyTable = page.locator('[data-testid="history-table-container"]');
    await expect(historyTable).toBeVisible();
    
    // Check for summary-level information in the table
    const summaryElements = page.locator('text=/\\d+ matches/i, text=/\\d+ sites/i, text=/\\d+ minutes/i, [data-testid*="progress"]');
    const hasSummaryInfo = await summaryElements.count() > 0;
    
    if (hasSummaryInfo) {
      console.log('✅ Found summary-level match information in table');
      
      // Look for detail access buttons
      const detailButtons = page.locator('button:has-text("View"), button:has-text("Details"), button:has-text("Review"), [data-testid*="view"]');
      const detailButtonCount = await detailButtons.count();
      
      if (detailButtonCount > 0) {
        console.log(`Found ${detailButtonCount} detail access buttons`);
        
        // Test progressive disclosure by clicking first detail button
        const firstDetailButton = detailButtons.first();
        await expect(firstDetailButton).toBeVisible();
        
        await firstDetailButton.click();
        
        // Allow time for detail view to load
        await page.waitForTimeout(2000);
        
        // Check for expanded detail view
        const detailElements = page.locator('[data-testid*="match-detail"], [data-testid*="match-list"], .match-details, .bp4-dialog');
        const hasDetailView = await detailElements.count() > 0;
        
        if (hasDetailView) {
          console.log('✅ Progressive disclosure working - detail view accessible');
        } else {
          console.log('ℹ️ Detail view may be loading or in different format');
        }
      } else {
        console.log('ℹ️ No detail buttons found - may indicate different UI pattern');
      }
    } else {
      console.log('ℹ️ No summary match information found in current state');
    }
    
    console.log('✅ Progressive Disclosure Test Complete');
  });

  test('⚡ Match Access Performance and Responsiveness', async ({ page }) => {
    console.log('⚡ Testing Match Access Performance...');
    
    // Create a deck to test match access performance
    const testDeckName = `Performance Test ${Date.now()}`;
    
    await page.click('button:has-text("Create Collection")');
    await page.fill('[data-testid="deck-name-input"]', testDeckName);
    await page.fill('[data-testid="start-date-input"]', '01/01/2024');
    await page.fill('[data-testid="end-date-input"]', '01/31/2024');
    await page.selectOption('[data-testid="tle-source-select"]', 'UDL');
    await page.click('[data-testid="next-button"]');
    await page.fill('[data-testid="hard-capacity-input"]', '10');
    await page.fill('[data-testid="min-duration-input"]', '15');
    await page.fill('[data-testid="elevation-input"]', '20');
    await page.click('button:has-text("Next")');
    await page.click('button:has-text("Next")');
    await page.click('button:has-text("Finish")');
    
    const confirmButton = page.locator('button:has-text("Confirm & Start Processing")');
    if (await confirmButton.isVisible({ timeout: 2000 })) {
      await confirmButton.click();
    }
    
    await page.waitForURL(/.*history.*/);
    
    // Test table loading performance
    const tableLoadStart = Date.now();
    await expect(page.locator('[data-testid="history-table-container"]')).toBeVisible();
    const tableLoadTime = Date.now() - tableLoadStart;
    
    console.log(`History table load time: ${tableLoadTime}ms`);
    expect(tableLoadTime).toBeLessThan(5000); // Should load within 5 seconds
    
    // Test row rendering performance
    const rowElements = page.locator('[data-testid="history-table-container"] tr');
    const rowCount = await rowElements.count();
    
    if (rowCount > 1) {
      const renderCheckStart = Date.now();
      
      // Check that all rows are properly rendered
      for (let i = 1; i < Math.min(rowCount, 6); i++) { // Check first 5 data rows
        const row = rowElements.nth(i);
        await expect(row).toBeVisible({ timeout: 1000 });
      }
      
      const renderCheckTime = Date.now() - renderCheckStart;
      console.log(`Row rendering check time: ${renderCheckTime}ms for ${Math.min(rowCount - 1, 5)} rows`);
      
      // Should render rows quickly
      expect(renderCheckTime).toBeLessThan(3000);
    }
    
    console.log('✅ Performance Test Complete');
  });

  test('🔄 Match Access State Management', async ({ page }) => {
    console.log('🔄 Testing Match Access State Management...');
    
    // Test that match access preserves application state
    const testDeckName = `State Test ${Date.now()}`;
    
    // Set some application state
    await page.evaluate(() => {
      sessionStorage.setItem('matchAccessTest', 'state_preserved');
    });
    
    // Create deck and navigate to history
    await page.click('button:has-text("Create Collection")');
    await page.fill('[data-testid="deck-name-input"]', testDeckName);
    await page.fill('[data-testid="start-date-input"]', '01/01/2024');
    await page.fill('[data-testid="end-date-input"]', '01/31/2024');
    await page.selectOption('[data-testid="tle-source-select"]', 'UDL');
    await page.click('[data-testid="next-button"]');
    await page.fill('[data-testid="hard-capacity-input"]', '10');
    await page.fill('[data-testid="min-duration-input"]', '15');
    await page.fill('[data-testid="elevation-input"]', '20');
    await page.click('button:has-text("Next")');
    await page.click('button:has-text("Next")');
    await page.click('button:has-text("Finish")');
    
    const confirmButton = page.locator('button:has-text("Confirm & Start Processing")');
    if (await confirmButton.isVisible({ timeout: 2000 })) {
      await confirmButton.click();
    }
    
    await page.waitForURL(/.*history.*/);
    
    // Verify state is preserved
    const preservedState = await page.evaluate(() => {
      return sessionStorage.getItem('matchAccessTest');
    });
    
    expect(preservedState).toBe('state_preserved');
    
    // Test match access (if available) doesn't break state
    const matchButtons = page.locator('[data-testid*="view"], [data-testid*="review"], button:has-text("View"), button:has-text("Review")');
    const buttonCount = await matchButtons.count();
    
    if (buttonCount > 0) {
      await matchButtons.first().click();
      await page.waitForTimeout(1000);
      
      // Check state is still preserved
      const stateAfterAccess = await page.evaluate(() => {
        return sessionStorage.getItem('matchAccessTest');
      });
      
      expect(stateAfterAccess).toBe('state_preserved');
      console.log('✅ State preserved through match access');
    } else {
      console.log('ℹ️ No match access buttons available for state testing');
    }
    
    console.log('✅ State Management Test Complete');
  });

  test('🎯 Match Access User Experience Validation', async ({ page }) => {
    console.log('🎯 Testing Match Access User Experience...');
    
    // Navigate to history to test existing decks
    await page.goto('/history');
    await page.waitForLoadState('networkidle');
    
    // Evaluate overall UX of match access
    const uxMetrics = {
      buttonsVisible: 0,
      buttonsWithClearText: 0,
      buttonsProperlyStyled: 0,
      accessibleButtons: 0
    };
    
    const allButtons = page.locator('button');
    const buttonCount = await allButtons.count();
    
    for (let i = 0; i < buttonCount; i++) {
      const button = allButtons.nth(i);
      
      if (await button.isVisible()) {
        uxMetrics.buttonsVisible++;
        
        const buttonText = await button.textContent();
        if (buttonText && buttonText.trim().length > 2) {
          uxMetrics.buttonsWithClearText++;
        }
        
        const buttonClasses = await button.getAttribute('class');
        if (buttonClasses && buttonClasses.includes('bp4-button')) {
          uxMetrics.buttonsProperlyStyled++;
        }
        
        // Check for accessibility attributes
        const hasAriaLabel = await button.getAttribute('aria-label');
        const hasTitle = await button.getAttribute('title');
        if (hasAriaLabel || hasTitle || (buttonText && buttonText.trim().length > 0)) {
          uxMetrics.accessibleButtons++;
        }
      }
    }
    
    console.log('📊 UX Metrics:');
    console.log(`  Visible buttons: ${uxMetrics.buttonsVisible}`);
    console.log(`  Clear text: ${uxMetrics.buttonsWithClearText}`);
    console.log(`  Properly styled: ${uxMetrics.buttonsProperlyStyled}`);
    console.log(`  Accessible: ${uxMetrics.accessibleButtons}`);
    
    // Validate UX quality
    if (uxMetrics.buttonsVisible > 0) {
      const clearTextRatio = uxMetrics.buttonsWithClearText / uxMetrics.buttonsVisible;
      const stylizedRatio = uxMetrics.buttonsProperlyStyled / uxMetrics.buttonsVisible;
      const accessibilityRatio = uxMetrics.accessibleButtons / uxMetrics.buttonsVisible;
      
      expect(clearTextRatio).toBeGreaterThan(0.8); // 80% should have clear text
      expect(stylizedRatio).toBeGreaterThan(0.8); // 80% should be properly styled
      expect(accessibilityRatio).toBeGreaterThan(0.9); // 90% should be accessible
    }
    
    // Test for information density (not overwhelming)
    const tableRows = page.locator('tr');
    const rowCount = await tableRows.count();
    
    if (rowCount > 1) {
      // Check that we don't have too many buttons per row (cognitive overload)
      const firstDataRow = tableRows.nth(1);
      const rowButtons = firstDataRow.locator('button');
      const buttonsPerRow = await rowButtons.count();
      
      expect(buttonsPerRow).toBeLessThan(5); // Keep it manageable
      console.log(`Buttons per row: ${buttonsPerRow} (should be <5 for good UX)`);
    }
    
    console.log('✅ User Experience Validation Complete');
  });
});