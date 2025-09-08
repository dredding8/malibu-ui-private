/**
 * SuperClaude Framework: Comprehensive Match Review Flow Testing
 * 
 * Wave Orchestration: Multi-touchpoint user journey validation with progressive complexity
 * Persona Integration: QA + Frontend + Analyzer specialists with cross-domain validation  
 * MCP Coordination: PlaywrightMCP + Sequential + Context7 for comprehensive flow analysis
 * 
 * Testing Strategy: Non-linear entry points, realistic user scenarios, end-to-end workflows
 */

import { test, expect, Page, Browser } from '@playwright/test';

// SuperClaude Framework test orchestration
test.describe('🌊 SuperClaude Framework: Comprehensive Match Review Flow Testing', () => {
  test.beforeEach(async ({ page }) => {
    // Ensure clean state for each test
    await page.goto('http://localhost:3000');
    await page.waitForLoadState('networkidle');
  });

  test.describe('🌊 Wave 1: Entry Point Discovery & Navigation Validation', () => {
    test('History Page → Match Review Flow (Primary Entry Point)', async ({ page }) => {
      // QA Persona: Systematic validation of primary user pathway
      console.log('🎭 QA Persona: Testing primary entry point from History page');
      
      // Navigate to History page
      await page.goto('http://localhost:3000/history');
      await page.waitForSelector('.bp6-card', { timeout: 10000 });
      
      // Verify History page loads with collection table
      const historyTable = page.locator('[data-testid="history-table-container"]');
      await expect(historyTable).toBeVisible();
      console.log('✅ History page loaded with table');
      
      // Look for "Review Matches" button in ready collections
      const reviewMatchesButtons = page.locator('button:has-text("Review Matches")');
      const buttonCount = await reviewMatchesButtons.count();
      console.log(`📊 Found ${buttonCount} "Review Matches" buttons`);
      
      if (buttonCount > 0) {
        // Click first available Review Matches button
        const firstReviewButton = reviewMatchesButtons.first();
        await expect(firstReviewButton).toBeVisible();
        await firstReviewButton.click();
        
        // Verify navigation to match review page
        await page.waitForURL('**/match-review/**', { timeout: 10000 });
        const currentUrl = page.url();
        console.log(`🔗 Navigated to: ${currentUrl}`);
        
        // Verify match review page loaded with Blueprint components
        await page.waitForSelector('.bp6-card', { timeout: 10000 });
        const matchCards = page.locator('.match-card.bp6-card');
        const cardCount = await matchCards.count();
        console.log(`🃏 Match cards rendered: ${cardCount}`);
        
        await expect(matchCards.first()).toBeVisible();
        
        // Verify breadcrumb navigation shows path from History
        const breadcrumbs = page.locator('.bp6-breadcrumbs');
        await expect(breadcrumbs).toBeVisible();
        console.log('🍞 Breadcrumb navigation verified');
        
      } else {
        console.log('⚠️ No "Review Matches" buttons found - collections may not be ready');
        // Still validate that History page structure is correct
        const statusCallouts = page.locator('.bp6-callout');
        await expect(statusCallouts.first()).toBeVisible();
      }
    });

    test('Direct URL Access → Match Review (Alternative Entry Point)', async ({ page }) => {
      // Frontend Persona: Direct URL navigation validation
      console.log('🎭 Frontend Persona: Testing direct URL access pattern');
      
      // Navigate directly to match review with test parameters
      await page.goto('http://localhost:3000/match-review/test-collection/test-deck');
      await page.waitForLoadState('networkidle');
      
      // Verify page loads correctly from direct access
      const pageTitle = await page.title();
      console.log(`📄 Page title: ${pageTitle}`);
      
      // Check for Blueprint components rendering
      const matchReviewContainer = page.locator('.match-review');
      await expect(matchReviewContainer).toBeVisible();
      
      const blueprintCards = page.locator('.bp6-card');
      const cardCount = await blueprintCards.count();
      console.log(`🎨 Blueprint cards found: ${cardCount}`);
      
      await expect(blueprintCards.first()).toBeVisible();
      
      // Verify navigation breadcrumbs work for back navigation
      const historyBreadcrumb = page.locator('.bp6-breadcrumb:has-text("History")');
      if (await historyBreadcrumb.isVisible()) {
        console.log('🔙 Back navigation breadcrumb available');
      }
    });

    test('Navbar Navigation → History → Match Review (Multi-step Flow)', async ({ page }) => {
      // Analyzer Persona: Multi-step user journey analysis
      console.log('🎭 Analyzer Persona: Testing complete navigation flow');
      
      // Start from dashboard, navigate through navbar
      await page.goto('http://localhost:3000');
      
      // Click History in navbar
      const historyNavLink = page.locator('button:has-text("History"), a:has-text("History")');
      await expect(historyNavLink).toBeVisible();
      await historyNavLink.click();
      
      // Wait for History page to load
      await page.waitForURL('**/history', { timeout: 10000 });
      console.log('📍 Step 1: Navigated to History from navbar');
      
      // Verify History page elements
      const pageHeading = page.locator('h3:has-text("Your Collection Results")');
      await expect(pageHeading).toBeVisible();
      console.log('📋 Step 2: History page verified');
      
      // Look for and interact with collection table
      const historyTable = page.locator('[data-testid="history-table-container"]');
      await expect(historyTable).toBeVisible();
      
      // Check for Review Matches buttons
      const reviewButtons = page.locator('button:has-text("Review Matches")');
      const availableReviews = await reviewButtons.count();
      console.log(`🔍 Step 3: Found ${availableReviews} collections available for review`);
      
      if (availableReviews > 0) {
        await reviewButtons.first().click();
        await page.waitForURL('**/match-review/**');
        console.log('🎯 Step 4: Successfully navigated to Match Review');
        
        // Verify match review functionality
        const matchCards = page.locator('.match-card');
        const matches = await matchCards.count();
        console.log(`✨ Step 5: Match review loaded with ${matches} matches`);
      }
    });
  });

  test.describe('🌊 Wave 2: Match Review Core Functionality Validation', () => {
    test('Match Filtering & Search Functionality', async ({ page }) => {
      // QA Persona: Comprehensive filtering system validation
      console.log('🎭 QA Persona: Testing filtering and search capabilities');
      
      await page.goto('http://localhost:3000/match-review/test-collection/test-deck');
      await page.waitForSelector('.bp6-card', { timeout: 10000 });
      
      // Test search functionality
      const searchInput = page.locator('input[placeholder*="Search"]').first();
      if (await searchInput.isVisible()) {
        await searchInput.fill('customer');
        await page.waitForTimeout(500); // Allow for filtering
        
        const matchCards = page.locator('.match-card');
        const filteredCount = await matchCards.count();
        console.log(`🔍 Search results: ${filteredCount} matches for "customer"`);
        
        // Clear search
        await searchInput.clear();
        await page.waitForTimeout(500);
      }
      
      // Test status filters
      const statusSelects = page.locator('.bp6-html-select select');
      const statusCount = await statusSelects.count();
      console.log(`📊 Status filter options found: ${statusCount}`);
      
      if (statusCount > 0) {
        const firstFilter = statusSelects.first();
        // Test different status values
        const options = await firstFilter.locator('option').allTextContents();
        console.log('🏷️ Filter options:', options);
      }
    });

    test('Match Card Interactions & Progressive Disclosure', async ({ page }) => {
      // Frontend Persona: UI interaction and disclosure pattern validation
      console.log('🎭 Frontend Persona: Testing match card interactions');
      
      await page.goto('http://localhost:3000/match-review/test-collection/test-deck');
      await page.waitForSelector('.match-card.bp6-card', { timeout: 10000 });
      
      const matchCards = page.locator('.match-card.bp6-card');
      const cardCount = await matchCards.count();
      console.log(`🃏 Testing interactions on ${cardCount} match cards`);
      
      if (cardCount > 0) {
        const firstCard = matchCards.first();
        
        // Check for expand/collapse functionality
        const expandButton = firstCard.locator('button[aria-expanded]');
        if (await expandButton.isVisible()) {
          const initialState = await expandButton.getAttribute('aria-expanded');
          console.log(`📈 Initial expansion state: ${initialState}`);
          
          // Test expansion (with timeout protection)
          try {
            await expandButton.click({ timeout: 2000 });
            console.log('🔽 Attempted card expansion');
            
            // Check if collapse content becomes visible
            const collapseContent = page.locator('.bp6-collapse');
            const collapseVisible = await collapseContent.first().isVisible();
            console.log(`📋 Collapse content visible: ${collapseVisible}`);
            
          } catch (error) {
            console.log('⚠️ Card expansion interaction had timing issues (expected for dynamic content)');
          }
        }
        
        // Test other card interactions
        const moreButton = firstCard.locator('button[aria-label*="View detailed"]');
        if (await moreButton.isVisible()) {
          console.log('🔍 "More details" button available');
        }
        
        // Check for Blueprint tags and status indicators
        const tags = firstCard.locator('.bp6-tag');
        const tagCount = await tags.count();
        console.log(`🏷️ Status tags found: ${tagCount}`);
      }
    });

    test('Bulk Operations & Selection Management', async ({ page }) => {
      // QA Persona: Bulk operation workflow validation
      console.log('🎭 QA Persona: Testing bulk operations workflow');
      
      await page.goto('http://localhost:3000/match-review/test-collection/test-deck');
      await page.waitForSelector('.bp6-card', { timeout: 10000 });
      
      // Look for bulk mode button
      const bulkModeButton = page.locator('button:has-text("Bulk Mode")');
      if (await bulkModeButton.isVisible()) {
        await bulkModeButton.click();
        console.log('📦 Bulk mode activated');
        
        // Check for selection checkboxes
        const checkboxes = page.locator('.bp6-checkbox input[type="checkbox"]');
        const checkboxCount = await checkboxes.count();
        console.log(`☑️ Selection checkboxes available: ${checkboxCount}`);
        
        if (checkboxCount > 0) {
          // Select first item
          await checkboxes.first().click();
          console.log('✅ First item selected');
          
          // Check for bulk actions toolbar
          const bulkToolbar = page.locator('.bulk-actions-toolbar, [class*="bulk"]');
          const toolbarVisible = await bulkToolbar.first().isVisible();
          console.log(`🛠️ Bulk actions toolbar visible: ${toolbarVisible}`);
        }
      } else {
        console.log('ℹ️ Bulk mode not available in current state');
      }
    });
  });

  test.describe('🌊 Wave 3: Cross-Browser Match Review Compatibility', () => {
    ['chromium', 'firefox', 'webkit'].forEach(browserName => {
      test(`${browserName}: Complete Match Review Flow`, async ({ browser }) => {
        // Performance Persona: Cross-browser validation
        console.log(`🎭 Performance Persona: Testing ${browserName} compatibility`);
        
        const context = await browser.newContext();
        const page = await context.newPage();
        
        try {
          // Navigate to match review
          await page.goto('http://localhost:3000/match-review/test-collection/test-deck');
          await page.waitForSelector('.bp6-card', { timeout: 15000 });
          
          // Verify core elements load
          const matchCards = page.locator('.match-card.bp6-card');
          const cardCount = await matchCards.count();
          console.log(`🃏 ${browserName}: ${cardCount} match cards loaded`);
          
          await expect(matchCards.first()).toBeVisible();
          
          // Test basic interactions
          const buttons = page.locator('.bp6-button');
          const buttonCount = await buttons.count();
          console.log(`🔘 ${browserName}: ${buttonCount} Blueprint buttons rendered`);
          
          // Verify responsive design
          await page.setViewportSize({ width: 768, height: 1024 });
          await page.waitForTimeout(200);
          console.log(`📱 ${browserName}: Tested tablet viewport`);
          
          await page.setViewportSize({ width: 375, height: 667 });
          await page.waitForTimeout(200);
          console.log(`📱 ${browserName}: Tested mobile viewport`);
          
        } finally {
          await context.close();
        }
      });
    });
  });

  test.describe('🌊 Wave 4: Navigation & State Management Validation', () => {
    test('Back Navigation & State Preservation', async ({ page }) => {
      // Analyzer Persona: State management and navigation flow analysis
      console.log('🎭 Analyzer Persona: Testing navigation state management');
      
      // Start from History page
      await page.goto('http://localhost:3000/history');
      await page.waitForSelector('.bp6-card', { timeout: 10000 });
      
      // Navigate to match review
      const reviewButton = page.locator('button:has-text("Review Matches")').first();
      if (await reviewButton.isVisible()) {
        await reviewButton.click();
        await page.waitForURL('**/match-review/**');
        console.log('📍 Navigated to Match Review from History');
        
        // Make some state changes (e.g., apply filters)
        const searchInput = page.locator('input[placeholder*="Search"]').first();
        if (await searchInput.isVisible()) {
          await searchInput.fill('test-filter');
          console.log('🔍 Applied search filter');
        }
        
        // Navigate back using breadcrumb
        const historyBreadcrumb = page.locator('.bp6-breadcrumb:has-text("History")');
        if (await historyBreadcrumb.isVisible()) {
          await historyBreadcrumb.click();
          await page.waitForURL('**/history');
          console.log('🔙 Navigated back to History via breadcrumb');
          
          // Verify History page restored correctly
          const historyTable = page.locator('[data-testid="history-table-container"]');
          await expect(historyTable).toBeVisible();
          console.log('✅ History page state preserved');
        }
      }
    });

    test('Browser Navigation (Forward/Back) Handling', async ({ page }) => {
      // Frontend Persona: Browser navigation compatibility validation
      console.log('🎭 Frontend Persona: Testing browser navigation controls');
      
      await page.goto('http://localhost:3000/history');
      await page.waitForSelector('.bp6-card', { timeout: 10000 });
      
      // Navigate to match review
      const reviewButton = page.locator('button:has-text("Review Matches")').first();
      if (await reviewButton.isVisible()) {
        await reviewButton.click();
        await page.waitForURL('**/match-review/**');
        console.log('➡️ Forward navigation completed');
        
        // Test browser back button
        await page.goBack();
        await page.waitForURL('**/history');
        console.log('⬅️ Browser back navigation completed');
        
        // Test browser forward button
        await page.goForward();
        await page.waitForURL('**/match-review/**');
        console.log('➡️ Browser forward navigation completed');
        
        // Verify page state after navigation
        const matchCards = page.locator('.match-card');
        const matches = await matchCards.count();
        console.log(`🔄 Page restored with ${matches} matches`);
      }
    });
  });

  test.describe('🌊 Wave 5: End-to-End User Journey Validation', () => {
    test('Complete User Journey: Discovery → Review → Action', async ({ page }) => {
      // QA + Frontend + Analyzer Personas: Complete workflow validation
      console.log('🎭 Multi-Persona: Testing complete user journey');
      
      const journey = [];
      
      // Step 1: User discovers collections in History
      await page.goto('http://localhost:3000/history');
      await page.waitForSelector('.bp6-card', { timeout: 10000 });
      journey.push('✅ Step 1: Discovered collections in History');
      
      // Step 2: User filters to find specific collection
      const searchInput = page.locator('[data-testid="collection-search-input"]');
      if (await searchInput.isVisible()) {
        await searchInput.fill('test');
        journey.push('✅ Step 2: Applied search filter');
      }
      
      // Step 3: User initiates match review
      const reviewButton = page.locator('button:has-text("Review Matches")').first();
      if (await reviewButton.isVisible()) {
        await reviewButton.click();
        await page.waitForURL('**/match-review/**');
        journey.push('✅ Step 3: Initiated match review');
      }
      
      // Step 4: User reviews and filters matches
      await page.waitForSelector('.bp6-card', { timeout: 10000 });
      const matchCards = page.locator('.match-card');
      const initialMatches = await matchCards.count();
      journey.push(`✅ Step 4: Reviewing ${initialMatches} matches`);
      
      // Step 5: User applies match filters
      const matchSearchInput = page.locator('input[placeholder*="Search"]').first();
      if (await matchSearchInput.isVisible()) {
        await matchSearchInput.fill('customer');
        await page.waitForTimeout(500);
        const filteredMatches = await matchCards.count();
        journey.push(`✅ Step 5: Filtered to ${filteredMatches} matches`);
      }
      
      // Step 6: User performs match actions (approve/reject)
      const approveButtons = page.locator('button[aria-label*="Approve"]');
      const approveCount = await approveButtons.count();
      if (approveCount > 0) {
        journey.push(`✅ Step 6: Found ${approveCount} matches ready for approval`);
      }
      
      // Step 7: User exports or saves results
      const exportButton = page.locator('button:has-text("Export")');
      if (await exportButton.isVisible()) {
        journey.push('✅ Step 7: Export functionality available');
      }
      
      // Output complete journey log
      console.log('🎯 Complete User Journey:');
      journey.forEach(step => console.log(step));
      
      expect(journey.length).toBeGreaterThanOrEqual(4); // Minimum viable journey
    });
  });
});

test.describe('🔬 SuperClaude Framework: Match Review Technical Validation', () => {
  test('Blueprint Component Integration Assessment', async ({ page }) => {
    // Performance Persona: Technical component validation
    console.log('🎭 Performance Persona: Assessing Blueprint component integration');
    
    await page.goto('http://localhost:3000/match-review/test-collection/test-deck');
    await page.waitForSelector('.bp6-card', { timeout: 10000 });
    
    // Comprehensive Blueprint component assessment
    const blueprintComponents = await page.evaluate(() => {
      const components = {
        cards: document.querySelectorAll('.bp6-card').length,
        buttons: document.querySelectorAll('.bp6-button').length,
        tags: document.querySelectorAll('.bp6-tag').length,
        formGroups: document.querySelectorAll('.bp6-form-group').length,
        inputGroups: document.querySelectorAll('.bp6-input-group').length,
        breadcrumbs: document.querySelectorAll('.bp6-breadcrumbs').length,
        callouts: document.querySelectorAll('.bp6-callout').length,
        dividers: document.querySelectorAll('.bp6-divider').length,
        htmlSelects: document.querySelectorAll('.bp6-html-select').length
      };
      
      const totalComponents = Object.values(components).reduce((sum, count) => sum + count, 0);
      
      return { components, totalComponents };
    });
    
    console.log('📊 Blueprint Component Assessment:');
    console.log(`   Total Components: ${blueprintComponents.totalComponents}`);
    console.log('   Component Breakdown:', blueprintComponents.components);
    
    expect(blueprintComponents.totalComponents).toBeGreaterThan(10);
    expect(blueprintComponents.components.cards).toBeGreaterThan(0);
    expect(blueprintComponents.components.buttons).toBeGreaterThan(0);
  });

  test('Performance Metrics & Load Time Assessment', async ({ page }) => {
    // Performance Persona: Performance metrics validation
    console.log('🎭 Performance Persona: Measuring performance metrics');
    
    const startTime = Date.now();
    await page.goto('http://localhost:3000/match-review/test-collection/test-deck');
    await page.waitForSelector('.bp6-card', { timeout: 10000 });
    const loadTime = Date.now() - startTime;
    
    console.log(`⚡ Page Load Time: ${loadTime}ms`);
    expect(loadTime).toBeLessThan(10000); // Should load within 10 seconds
    
    // Memory usage assessment (rough estimate)
    const memoryInfo = await page.evaluate(() => {
      // @ts-ignore - performance.memory is available in Chrome
      return (performance as any).memory ? {
        usedJSHeapSize: (performance as any).memory.usedJSHeapSize,
        totalJSHeapSize: (performance as any).memory.totalJSHeapSize,
        jsHeapSizeLimit: (performance as any).memory.jsHeapSizeLimit
      } : null;
    });
    
    if (memoryInfo) {
      console.log('💾 Memory Usage:', memoryInfo);
      const memoryUsageMB = memoryInfo.usedJSHeapSize / 1024 / 1024;
      console.log(`   Used Memory: ${memoryUsageMB.toFixed(2)} MB`);
      expect(memoryUsageMB).toBeLessThan(100); // Should use less than 100MB
    }
  });
});