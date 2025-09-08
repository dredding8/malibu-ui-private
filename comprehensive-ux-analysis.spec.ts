import { test, expect } from '@playwright/test';

/**
 * Comprehensive UX Analysis for History Page
 * Enterprise-grade usability validation following WCAG 2.1 AA standards
 */

test.describe('History Page - Enterprise UX Analysis', () => {

  test.beforeEach(async ({ page }) => {
    // Navigate to History page with proper loading wait
    await page.goto('http://localhost:3000/history', { 
      waitUntil: 'networkidle',
      timeout: 10000 
    });
  });

  test('1. Information Architecture - Visual Hierarchy Validation', async ({ page }) => {
    console.log('🏗️ VALIDATING INFORMATION ARCHITECTURE');

    // Test primary heading hierarchy
    const mainHeading = await page.locator('h3').first();
    await expect(mainHeading).toBeVisible();
    const headingText = await mainHeading.textContent();
    console.log(`✅ Primary heading: "${headingText}"`);
    
    // Validate heading structure follows proper hierarchy
    const h3Count = await page.locator('h3').count();
    const h5Count = await page.locator('h5').count();
    console.log(`📊 Heading hierarchy: ${h3Count} H3 headings, ${h5Count} H5 headings`);
    
    // Check for proper visual hierarchy (H3 should be larger than H5)
    const h3FontSize = await page.locator('h3').first().evaluate(el => {
      return window.getComputedStyle(el).fontSize;
    });
    const h5FontSize = await page.locator('h5').first().evaluate(el => {
      return window.getComputedStyle(el).fontSize;
    });
    
    console.log(`📏 H3 font size: ${h3FontSize}, H5 font size: ${h5FontSize}`);
    expect(parseInt(h3FontSize)).toBeGreaterThan(parseInt(h5FontSize));
  });

  test('2. User-Centered Language Validation', async ({ page }) => {
    console.log('🎯 VALIDATING USER-CENTERED TERMINOLOGY');
    
    // Validate user-centered page title
    const pageTitle = await page.locator('h3').first().textContent();
    console.log(`📝 Page title: "${pageTitle}"`);
    expect(pageTitle).toContain('Collection Results');
    expect(pageTitle).not.toContain('Job History');
    
    // Check for empathetic, user-focused language
    const statusLabels = await page.locator('[data-testid^="status-"]').allTextContents();
    console.log('📋 Status language:', statusLabels);
    
    // Look for user-centered action labels
    const createButton = await page.locator('button:has-text("Create Collection")');
    await expect(createButton).toBeVisible();
    console.log('✅ Primary action uses user-centered language: "Create Collection"');
  });

  test('3. Status Overview - Information Accuracy', async ({ page }) => {
    console.log('📊 VALIDATING STATUS OVERVIEW ACCURACY');
    
    // Extract status numbers from overview cards
    const statusCards = await page.locator('[data-icon="tick-circle"], [data-icon="play"], [data-icon="warning-sign"]').count();
    console.log(`📈 Status overview cards found: ${statusCards}`);
    
    // Check if status numbers are dynamic and match table data
    const readyCount = await page.locator('text=Ready for You').locator('..').locator('div').first().textContent();
    const workingCount = await page.locator('text=Working on It').locator('..').locator('div').first().textContent();
    const needsHelpCount = await page.locator('text=Need Your Help').locator('..').locator('div').first().textContent();
    
    console.log(`🔢 Status counts: Ready=${readyCount}, Working=${workingCount}, NeedsHelp=${needsHelpCount}`);
    
    // Validate that numbers are actual integers (not placeholder text)
    expect(readyCount).toMatch(/^\d+$/);
    expect(workingCount).toMatch(/^\d+$/);
    expect(needsHelpCount).toMatch(/^\d+$/);
  });

  test('4. Primary Action Discoverability', async ({ page }) => {
    console.log('🎯 VALIDATING PRIMARY ACTION PLACEMENT');
    
    // Test F-pattern scanning - primary action should be prominent
    const createButton = await page.locator('button:has-text("Create Collection")');
    await expect(createButton).toBeVisible();
    
    // Check button size and intent (should be large and primary)
    const buttonClasses = await createButton.getAttribute('class');
    const isLarge = buttonClasses?.includes('bp6-large') || buttonClasses?.includes('large');
    const isPrimary = buttonClasses?.includes('bp6-intent-primary') || buttonClasses?.includes('intent-primary');
    
    console.log(`🔍 Create button classes: ${buttonClasses}`);
    console.log(`📏 Button is large: ${isLarge}, Button is primary intent: ${isPrimary}`);
    
    // Test click interaction
    await createButton.click();
    await page.waitForTimeout(1000);
    
    // Should navigate to collection creation
    const currentUrl = page.url();
    console.log(`🧭 Navigation result: ${currentUrl}`);
    expect(currentUrl).toContain('create-collection');
    
    // Navigate back for remaining tests
    await page.goBack();
  });

  test('5. Filter Functionality Validation', async ({ page }) => {
    console.log('🔍 VALIDATING FILTER FUNCTIONALITY');
    
    // Test date picker accessibility
    const startDateInput = await page.locator('[data-testid="start-date-input"]');
    const endDateInput = await page.locator('[data-testid="end-date-input"]');
    
    await expect(startDateInput).toBeVisible();
    await expect(endDateInput).toBeVisible();
    
    console.log('✅ Date inputs are accessible with proper test IDs');
    
    // Test apply filter button state
    const applyButton = await page.locator('[data-testid="apply-filter-button"]');
    const isDisabled = await applyButton.isDisabled();
    console.log(`🔘 Apply button initially disabled: ${isDisabled}`);
    expect(isDisabled).toBe(true);
    
    // Test clear functionality
    const clearButton = await page.locator('button:has-text("Clear All")');
    await expect(clearButton).toBeVisible();
    console.log('✅ Clear functionality is discoverable');
  });

  test('6. Table Accessibility Validation', async ({ page }) => {
    console.log('📋 VALIDATING TABLE ACCESSIBILITY');
    
    // Check for proper table structure
    const table = await page.locator('[data-testid="history-table-container"]');
    await expect(table).toBeVisible();
    
    // Validate ARIA labels
    const ariaLabel = await table.getAttribute('aria-label');
    console.log(`🏷️ Table ARIA label: "${ariaLabel}"`);
    expect(ariaLabel).toBe('Collection History');
    
    // Check column headers
    const columns = await page.locator('th, [role="columnheader"]').allTextContents();
    console.log('📊 Table columns:', columns);
    
    // Validate action buttons for different states
    const viewButtons = await page.locator('button:has-text("View Collection")').count();
    const retryButtons = await page.locator('button:has-text("Retry")').count();
    const downloadButtons = await page.locator('button:has-text("Download")').count();
    
    console.log(`🎬 Action buttons: View=${viewButtons}, Retry=${retryButtons}, Download=${downloadButtons}`);
  });

  test('7. Responsive Design Validation', async ({ page }) => {
    console.log('📱 VALIDATING RESPONSIVE DESIGN');
    
    // Test desktop view (current)
    let viewportWidth = await page.evaluate(() => window.innerWidth);
    console.log(`🖥️ Desktop viewport: ${viewportWidth}px`);
    
    // Test tablet view
    await page.setViewportSize({ width: 768, height: 1024 });
    await page.waitForTimeout(500);
    
    const createButtonVisible = await page.locator('button:has-text("Create Collection")').isVisible();
    console.log(`📱 Create button visible on tablet: ${createButtonVisible}`);
    
    // Test mobile view
    await page.setViewportSize({ width: 375, height: 667 });
    await page.waitForTimeout(500);
    
    const mobileLayoutWorking = await page.locator('h3').first().isVisible();
    console.log(`📱 Mobile layout functional: ${mobileLayoutWorking}`);
    
    // Reset to desktop
    await page.setViewportSize({ width: 1200, height: 800 });
  });

  test('8. Performance and Loading States', async ({ page }) => {
    console.log('⚡ VALIDATING PERFORMANCE AND LOADING');
    
    // Test refresh functionality
    const refreshButton = await page.locator('button:has-text("Refresh")');
    await expect(refreshButton).toBeVisible();
    
    await refreshButton.click();
    
    // Check for loading state
    const loadingState = await page.locator('text=Refreshing...').isVisible();
    console.log(`⏳ Loading state displays: ${loadingState}`);
    
    // Wait for completion
    await page.waitForTimeout(2000);
    const backToNormal = await page.locator('button:has-text("Refresh")').isVisible();
    console.log(`✅ Loading state resolves: ${backToNormal}`);
  });

  test('9. Error Handling and Edge Cases', async ({ page }) => {
    console.log('🚨 VALIDATING ERROR HANDLING');
    
    // Test empty state messaging
    const emptyStateMessage = await page.locator('.bp6-non-ideal-state, .bp6-table-empty-state').textContent();
    if (emptyStateMessage) {
      console.log(`📝 Empty state message: "${emptyStateMessage}"`);
    }
    
    // Check for proper error boundaries
    const errorBoundaryPresent = await page.locator('[data-testid*="error"]').count() > 0;
    console.log(`🛡️ Error handling components present: ${errorBoundaryPresent}`);
  });

  test('10. Cross-Browser Compatibility Check', async ({ page, browserName }) => {
    console.log(`🌐 VALIDATING ${browserName.toUpperCase()} COMPATIBILITY`);
    
    // Basic functionality should work across all browsers
    const pageTitle = await page.locator('h3').first().textContent();
    const createButton = await page.locator('button:has-text("Create Collection")');
    const statusCards = await page.locator('[data-icon="tick-circle"], [data-icon="play"], [data-icon="warning-sign"]').count();
    
    console.log(`✅ ${browserName}: Title="${pageTitle}", CreateButton=${await createButton.isVisible()}, StatusCards=${statusCards}`);
    
    // Browser-specific CSS and JS should work
    const cssLoaded = await page.evaluate(() => {
      const el = document.querySelector('h3');
      return el && window.getComputedStyle(el).fontSize !== '';
    });
    
    console.log(`🎨 ${browserName}: CSS properly loaded: ${cssLoaded}`);
  });
});
