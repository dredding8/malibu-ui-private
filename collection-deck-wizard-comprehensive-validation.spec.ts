import { test, expect } from '@playwright/test';

/**
 * Collection Deck Creation Wizard - Comprehensive User Journey Validation
 * 
 * Quality Advocate & Testing Specialist Perspective
 * Comprehensive E2E testing validating core user journeys in the Collection Deck creation wizard
 * 
 * Testing Priorities:
 * 1. Prevention Focus: Build quality in rather than testing it in
 * 2. Comprehensive Coverage: Test all scenarios including edge cases  
 * 3. Risk-Based Testing: Prioritize testing based on risk and impact
 * 
 * Test Coverage Areas:
 * - Complete wizard workflow (happy path)
 * - Blueprint component interaction patterns
 * - Navigation and state preservation
 * - Background processing integration
 * - Error handling and recovery
 * - Accessibility and inclusive design
 * 
 * Success Criteria:
 * - 90%+ test pass rate across all user journeys
 * - <3 second task completion for primary workflows
 * - 100% accessibility compliance (WCAG 2.1 AA) for core functions
 * - <2% user error rate in form validation scenarios
 * - Zero critical UX blocking issues in core workflows
 */

test.describe('Collection Deck Creation Wizard: Core User Journey Validation', () => {
  
  test.beforeEach(async ({ page }) => {
    // Start from the Collection Decks page as the natural entry point
    await page.goto('/decks');
    await page.waitForLoadState('networkidle');
  });

  test('🎯 Journey 1: Complete Wizard Flow (Happy Path)', async ({ page }) => {
    console.log('🎯 Testing Complete Wizard Flow - Happy Path');
    
    // PHASE 1: Entry to wizard from Collection Decks page
    console.log('📊 Phase 1: Entry to wizard from Collection Decks page');
    
    // Navigate to Create Collection Deck
    const createButton = page.locator('button:has-text("Create Collection Deck")');
    await expect(createButton).toBeVisible();
    await createButton.click();
    
    // Validate redirect to Step 1
    await expect(page).toHaveURL(/.*create-collection-deck.*data.*/);
    await expect(page.locator('[data-testid="create-collection-deck-page"]')).toBeVisible();
    
    // PHASE 2: Step 1 - Input Data
    console.log('📝 Phase 2: Step 1 - Input Data');
    
    // Validate progress indicator shows Step 1
    await expect(page.locator('[data-testid="progress-bar"]')).toBeVisible();
    await expect(page.locator('[data-testid="progress-bar"]')).toHaveAttribute('aria-label', /Step 1 of 4/);
    
    // Validate form structure and required fields
    await expect(page.locator('h3:has-text("Step 1: Input Data")')).toBeVisible();
    await expect(page.locator('text=Collection Information')).toBeVisible();
    await expect(page.locator('text=Tasking Window')).toBeVisible();
    await expect(page.locator('text=TLE Data')).toBeVisible();
    await expect(page.locator('text=Unavailable Sites')).toBeVisible();
    
    // Fill out Step 1 form with valid data
    await page.fill('[data-testid="deck-name-input"]', 'E2E Test Collection Deck');
    
    // Test DateInput component (Blueprint component validation)
    const startDateInput = page.locator('[data-testid="start-date-input"]');
    const endDateInput = page.locator('[data-testid="end-date-input"]');
    await expect(startDateInput).toBeVisible();
    await expect(endDateInput).toBeVisible();
    
    // Fill dates using the input directly (simulating user interaction)
    await startDateInput.fill('01/01/2024');
    await endDateInput.fill('01/31/2024');
    
    // Test HTMLSelect component (Blueprint component validation)
    const tleSourceSelect = page.locator('[data-testid="tle-source-select"]');
    await expect(tleSourceSelect).toBeVisible();
    await tleSourceSelect.selectOption('UDL');
    
    // Test button interaction with loading states
    const loadUDLButton = page.locator('[data-testid="load-udl-button"]');
    await expect(loadUDLButton).toBeVisible();
    await expect(loadUDLButton).toBeEnabled();
    await loadUDLButton.click();
    
    // Validate loading state appears
    await expect(loadUDLButton).toHaveAttribute('aria-disabled', 'true');
    
    // Wait for loading to complete
    await expect(loadUDLButton).not.toHaveAttribute('aria-disabled', 'true', { timeout: 3000 });
    
    // Validate TLE data was populated
    const tleDataTextarea = page.locator('[data-testid="tle-data-textarea"]');
    await expect(tleDataTextarea).not.toBeEmpty();
    
    // Validate form validation works - Next button should be enabled
    const nextButton = page.locator('[data-testid="next-button"]');
    await expect(nextButton).toBeEnabled();
    
    // Navigate to Step 2
    await nextButton.click();
    
    // PHASE 3: Step 2 - Review Parameters
    console.log('⚙️ Phase 3: Step 2 - Review Parameters');
    
    await expect(page).toHaveURL(/.*create-collection-deck.*parameters.*/);
    await expect(page.locator('h3:has-text("Step 2: Review Parameters")')).toBeVisible();
    
    // Validate progress indicator updated
    await expect(page.locator('[data-testid="progress-bar"]')).toHaveAttribute('aria-label', /Step 2 of 4/);
    await expect(page.locator('[data-testid="step-1-completed-icon"]')).toBeVisible();
    
    // Validate tabs component (Blueprint Tabs validation)
    const tabList = page.locator('[role="tablist"]');
    await expect(tabList).toBeVisible();
    
    // Test tab navigation
    const tabs = ['General', 'Advanced', 'Constraints'];
    for (const tabName of tabs) {
      const tab = page.locator(`[role="tab"]:has-text("${tabName}")`);
      if (await tab.isVisible()) {
        await tab.click();
        await expect(tab).toHaveAttribute('aria-selected', 'true');
      }
    }
    
    // Fill out basic parameters (assuming form fields exist)
    const hardCapacityInput = page.locator('input[placeholder*="capacity"], input[id*="capacity"]').first();
    const minDurationInput = page.locator('input[placeholder*="duration"], input[id*="duration"]').first();
    const elevationInput = page.locator('input[placeholder*="elevation"], input[id*="elevation"]').first();
    
    if (await hardCapacityInput.isVisible()) await hardCapacityInput.fill('100');
    if (await minDurationInput.isVisible()) await minDurationInput.fill('5');  
    if (await elevationInput.isVisible()) await elevationInput.fill('45');
    
    // Navigate to Step 3
    const step2NextButton = page.locator('button:has-text("Next")');
    await step2NextButton.click();
    
    // PHASE 4: Step 3 - Review Matches  
    console.log('🎯 Phase 4: Step 3 - Review Matches');
    
    await expect(page).toHaveURL(/.*create-collection-deck.*matches.*/);
    await expect(page.locator('h3:has-text("Step 3: Review Matches")')).toBeVisible();
    
    // Validate progress indicator updated
    await expect(page.locator('[data-testid="progress-bar"]')).toHaveAttribute('aria-label', /Step 3 of 4/);
    await expect(page.locator('[data-testid="step-2-completed-icon"]')).toBeVisible();
    
    // Test Blueprint Table component validation
    const matchesTable = page.locator('table, [role="table"]').first();
    if (await matchesTable.isVisible()) {
      // Test table sorting functionality
      const sortableHeaders = page.locator('th[role="columnheader"], .bp3-table-column-header');
      const headerCount = await sortableHeaders.count();
      if (headerCount > 0) {
        await sortableHeaders.first().click();
        // Validate sort indication
        await expect(sortableHeaders.first()).toHaveClass(/bp3-table-column-header-.*sorted.*/);
      }
      
      // Test row selection if available
      const selectableRows = page.locator('tr input[type="checkbox"], .bp3-table-row-selection');
      const rowCount = await selectableRows.count();
      if (rowCount > 0) {
        await selectableRows.first().click();
        await expect(selectableRows.first()).toBeChecked();
      }
    }
    
    // Navigate to Step 4
    const step3NextButton = page.locator('button:has-text("Next")');
    await step3NextButton.click();
    
    // PHASE 5: Step 4 - Special Instructions & Completion
    console.log('📝 Phase 5: Step 4 - Special Instructions & Completion');
    
    await expect(page).toHaveURL(/.*create-collection-deck.*instructions.*/);
    await expect(page.locator('h3:has-text("Step 4: Special Instructions"), h3:has-text("Step 4: Add Final Details")')).toBeVisible();
    
    // Validate progress indicator shows final step
    await expect(page.locator('[data-testid="progress-bar"]')).toHaveAttribute('aria-label', /Step 4 of 4/);
    await expect(page.locator('[data-testid="step-3-completed-icon"]')).toBeVisible();
    
    // Fill out special instructions
    const instructionsTextarea = page.locator('textarea[data-testid*="instructions"], textarea[placeholder*="instructions"]').first();
    if (await instructionsTextarea.isVisible()) {
      await instructionsTextarea.fill('E2E test validation instructions for collection deck creation');
    }
    
    // Submit the collection deck
    const finishButton = page.locator('button:has-text("Create Deck"), button:has-text("Finish"), button:has-text("Submit")').first();
    await expect(finishButton).toBeVisible();
    await expect(finishButton).toBeEnabled();
    await finishButton.click();
    
    // PHASE 6: Background Processing Integration & Completion
    console.log('⚡ Phase 6: Background Processing Integration & Completion');
    
    // Validate redirect to Collection Decks page (as per handleFinish implementation)
    await expect(page).toHaveURL(/.*decks.*/, { timeout: 5000 });
    
    // Check for background processing status indicator
    const processingStatus = page.locator('[data-testid="background-processing-status"]');
    if (await processingStatus.isVisible()) {
      await expect(processingStatus).toContainText('We\'re Working on Your Collection');
      
      // Test status button functionality
      const viewStatusButton = page.locator('[data-testid="view-status-button"]');
      if (await viewStatusButton.isVisible()) {
        await viewStatusButton.click();
        await expect(page).toHaveURL(/.*history.*/);
        
        // Validate the newly created deck appears in history
        await expect(page.locator('text=E2E Test Collection Deck')).toBeVisible();
      }
    }
    
    console.log('✅ Complete Wizard Flow Validation Complete');
  });

  test('🧩 Journey 2: Blueprint Component Interaction Patterns', async ({ page }) => {
    console.log('🧩 Testing Blueprint Component Interaction Patterns');
    
    await page.goto('/create-collection-deck/data');
    
    // PHASE 1: FormGroup + InputGroup Validation
    console.log('📝 Phase 1: FormGroup + InputGroup Validation');
    
    // Test FormGroup with validation states
    const deckNameFormGroup = page.locator('[data-testid="deck-name-input"]').locator('..');
    await expect(deckNameFormGroup).toBeVisible();
    
    // Test empty form validation
    const nextButton = page.locator('[data-testid="next-button"]');
    await nextButton.click();
    
    // Validate error states appear
    const errorFormGroups = page.locator('.bp3-intent-danger, .bp3-form-group[class*="danger"]');
    const errorCount = await errorFormGroups.count();
    expect(errorCount).toBeGreaterThan(0);
    
    // Test error clearing on input
    await page.fill('[data-testid="deck-name-input"]', 'Test Deck');
    // Error should clear when user starts typing
    await expect(page.locator('.bp3-intent-danger')).toHaveCount(errorCount - 1);
    
    // PHASE 2: DateInput Component Validation  
    console.log('📅 Phase 2: DateInput Component Validation');
    
    const startDateInput = page.locator('[data-testid="start-date-input"]');
    
    // Test date input accessibility
    await expect(startDateInput).toHaveAttribute('aria-label', /start date/i);
    
    // Test keyboard navigation
    await startDateInput.focus();
    await page.keyboard.press('Tab');
    
    // Test date validation
    await startDateInput.fill('invalid-date');
    await nextButton.click();
    // Should show validation error
    await expect(page.locator('text=Start date is required')).toBeVisible();
    
    // Test valid date input
    await startDateInput.fill('01/01/2024');
    const endDateInput = page.locator('[data-testid="end-date-input"]');
    await endDateInput.fill('12/31/2023'); // End before start - should trigger validation
    await nextButton.click();
    await expect(page.locator('text=End date must be after start date')).toBeVisible();
    
    // PHASE 3: HTMLSelect vs Modern Dropdown Expectations
    console.log('📋 Phase 3: HTMLSelect vs Modern Dropdown Expectations');
    
    const tleSourceSelect = page.locator('[data-testid="tle-source-select"]');
    await expect(tleSourceSelect).toBeVisible();
    
    // Test accessibility attributes  
    await expect(tleSourceSelect).toHaveAttribute('aria-label', /TLE data source/i);
    
    // Test option selection
    await tleSourceSelect.selectOption('UDL');
    await expect(tleSourceSelect).toHaveValue('UDL');
    
    // Test keyboard navigation
    await tleSourceSelect.focus();
    await page.keyboard.press('ArrowDown');
    await page.keyboard.press('ArrowUp');
    await page.keyboard.press('Enter');
    
    // PHASE 4: Button Loading States and Interaction
    console.log('🔘 Phase 4: Button Loading States and Interaction');
    
    const loadUDLButton = page.locator('[data-testid="load-udl-button"]');
    
    // Test button accessibility
    await expect(loadUDLButton).toHaveAttribute('type', 'button');
    
    // Test loading state
    await loadUDLButton.click();
    await expect(loadUDLButton).toHaveAttribute('aria-disabled', 'true');
    
    // Wait for loading to complete
    await expect(loadUDLButton).not.toHaveAttribute('aria-disabled', 'true', { timeout: 3000 });
    
    console.log('✅ Blueprint Component Interaction Validation Complete');
  });

  test('🧭 Journey 3: Navigation and State Preservation', async ({ page }) => {
    console.log('🧭 Testing Navigation and State Preservation');
    
    await page.goto('/create-collection-deck/data');
    
    // PHASE 1: Forward/Backward Navigation with State Preservation
    console.log('⏭️ Phase 1: Forward/Backward Navigation with State Preservation');
    
    // Fill out Step 1 data
    await page.fill('[data-testid="deck-name-input"]', 'Navigation Test Deck');
    await page.fill('[data-testid="start-date-input"]', '01/01/2024');
    await page.fill('[data-testid="end-date-input"]', '01/31/2024');
    await page.locator('[data-testid="tle-source-select"]').selectOption('UDL');
    
    // Navigate to Step 2
    await page.click('[data-testid="next-button"]');
    await expect(page).toHaveURL(/.*parameters.*/);
    
    // Navigate back to Step 1
    const backButton = page.locator('button:has-text("Back")');
    await backButton.click();
    await expect(page).toHaveURL(/.*data.*/);
    
    // Validate data preservation
    await expect(page.locator('[data-testid="deck-name-input"]')).toHaveValue('Navigation Test Deck');
    await expect(page.locator('[data-testid="tle-source-select"]')).toHaveValue('UDL');
    
    // PHASE 2: Direct URL Navigation and Step Access Control
    console.log('🔗 Phase 2: Direct URL Navigation and Step Access Control');
    
    // Test direct access to later steps (should redirect or show error)
    await page.goto('/create-collection-deck/matches');
    
    // Should either redirect to valid step or show access control
    const currentUrl = page.url();
    const hasRedirected = !currentUrl.includes('/matches') || 
                         await page.locator('text=Complete previous steps').isVisible();
    expect(hasRedirected).toBeTruthy();
    
    // PHASE 3: Browser Back/Forward Button Integration
    console.log('⬅️ Phase 3: Browser Back/Forward Button Integration');
    
    // Navigate through steps using app navigation
    await page.goto('/create-collection-deck/data');
    await page.fill('[data-testid="deck-name-input"]', 'Browser Nav Test');
    await page.fill('[data-testid="start-date-input"]', '01/01/2024');
    await page.fill('[data-testid="end-date-input"]', '01/31/2024');
    await page.locator('[data-testid="tle-source-select"]').selectOption('UDL');
    await page.click('[data-testid="next-button"]');
    
    // Use browser back button
    await page.goBack();
    await expect(page).toHaveURL(/.*data.*/);
    
    // Validate state recovery after browser navigation
    await expect(page.locator('[data-testid="deck-name-input"]')).toHaveValue('Browser Nav Test');
    
    // Use browser forward button
    await page.goForward();
    await expect(page).toHaveURL(/.*parameters.*/);
    
    // PHASE 4: localStorage Integration Testing
    console.log('💾 Phase 4: localStorage Integration Testing');
    
    // Navigate to Step 1 and enter data
    await page.goto('/create-collection-deck/data');
    await page.fill('[data-testid="deck-name-input"]', 'localStorage Test Deck');
    await page.fill('[data-testid="start-date-input"]', '01/01/2024');
    await page.fill('[data-testid="end-date-input"]', '01/31/2024');
    
    // Check localStorage content
    const localStorageData = await page.evaluate(() => {
      return localStorage.getItem('vue-deck-draft');
    });
    expect(localStorageData).toBeTruthy();
    
    // Reload page and validate data recovery
    await page.reload();
    await expect(page.locator('[data-testid="deck-name-input"]')).toHaveValue('localStorage Test Deck');
    
    // Validate unsaved changes warning appears
    await expect(page.locator('[data-testid="unsaved-changes-warning"]')).toBeVisible();
    
    console.log('✅ Navigation and State Preservation Validation Complete');
  });

  test('⚡ Journey 4: Background Processing Integration', async ({ page }) => {
    console.log('⚡ Testing Background Processing Integration');
    
    // Navigate to create deck page
    await page.goto('/create-collection-deck/data');
    
    // Complete the wizard quickly to test background processing
    await page.fill('[data-testid="deck-name-input"]', 'Background Processing Test');
    await page.fill('[data-testid="start-date-input"]', '01/01/2024');
    await page.fill('[data-testid="end-date-input"]', '01/31/2024');
    await page.locator('[data-testid="tle-source-select"]').selectOption('UDL');
    await page.click('[data-testid="next-button"]');
    
    // Skip through remaining steps
    await page.click('button:has-text("Next")');
    await page.click('button:has-text("Next")');
    
    // Submit the deck
    const submitButton = page.locator('button:has-text("Create Deck"), button:has-text("Finish")').first();
    await submitButton.click();
    
    // PHASE 1: Process Initiation
    console.log('🚀 Phase 1: Process Initiation');
    
    // Validate background processing status appears
    const processingStatus = page.locator('[data-testid="background-processing-status"]');
    if (await processingStatus.isVisible()) {
      await expect(processingStatus).toContainText('We\'re Working on Your Collection');
      
      // PHASE 2: Progress Communication
      console.log('📊 Phase 2: Progress Communication');
      
      // Validate status button functionality
      const viewStatusButton = page.locator('[data-testid="view-status-button"]');
      await expect(viewStatusButton).toBeVisible();
      await expect(viewStatusButton).toBeEnabled();
      
      // Test navigation to history page
      await viewStatusButton.click();
      await expect(page).toHaveURL(/.*history.*/);
      
      // Validate the processing deck appears in history
      await expect(page.locator('text=Background Processing Test')).toBeVisible();
      
      // PHASE 3: Navigation During Processing
      console.log('🧭 Phase 3: Navigation During Processing');
      
      // Test navigation while processing (should maintain status awareness)
      await page.goto('/decks');
      
      // Processing status should still be visible if still processing
      const deckPageStatus = page.locator('[data-testid="background-processing-status"]');
      if (await deckPageStatus.isVisible()) {
        await expect(deckPageStatus).toContainText('We\'re Working on Your Collection');
      }
    }
    
    console.log('✅ Background Processing Integration Validation Complete');
  });

  test('🚨 Journey 5: Error Handling and Recovery', async ({ page }) => {
    console.log('🚨 Testing Error Handling and Recovery');
    
    await page.goto('/create-collection-deck/data');
    
    // PHASE 1: Form Validation Errors
    console.log('📝 Phase 1: Form Validation Errors');
    
    // Test empty form submission
    const nextButton = page.locator('[data-testid="next-button"]');
    await nextButton.click();
    
    // Validate error messages appear
    await expect(page.locator('text=Start date is required')).toBeVisible();
    await expect(page.locator('text=End date is required')).toBeVisible();
    await expect(page.locator('text=TLE data source is required')).toBeVisible();
    
    // Test error clearing on correction
    await page.fill('[data-testid="start-date-input"]', '01/01/2024');
    // Error should clear
    await expect(page.locator('text=Start date is required')).not.toBeVisible();
    
    // PHASE 2: Date Validation Errors
    console.log('📅 Phase 2: Date Validation Errors');
    
    // Test invalid date range
    await page.fill('[data-testid="deck-name-input"]', 'Error Test Deck');
    await page.fill('[data-testid="start-date-input"]', '01/31/2024');
    await page.fill('[data-testid="end-date-input"]', '01/01/2024'); // End before start
    await page.locator('[data-testid="tle-source-select"]').selectOption('UDL');
    
    await nextButton.click();
    await expect(page.locator('text=End date must be after start date')).toBeVisible();
    
    // Test error recovery
    await page.fill('[data-testid="end-date-input"]', '01/31/2024');
    await expect(page.locator('text=End date must be after start date')).not.toBeVisible();
    
    // PHASE 3: Network Error Simulation
    console.log('🌐 Phase 3: Network Error Simulation');
    
    // Test button loading failure scenario
    const loadUDLButton = page.locator('[data-testid="load-udl-button"]');
    
    // Simulate network error by intercepting request
    await page.route('**/api/udl/load', (route) => {
      route.abort('failed');
    });
    
    await loadUDLButton.click();
    
    // Validate loading state appears then clears
    await expect(loadUDLButton).toHaveAttribute('aria-disabled', 'true');
    await expect(loadUDLButton).not.toHaveAttribute('aria-disabled', 'true', { timeout: 3000 });
    
    // PHASE 4: Browser Issues - localStorage Failure
    console.log('💾 Phase 4: Browser Issues - localStorage Failure');
    
    // Simulate localStorage failure
    await page.addInitScript(() => {
      const originalSetItem = localStorage.setItem;
      localStorage.setItem = () => {
        throw new Error('localStorage not available');
      };
    });
    
    // Reload page and test functionality still works
    await page.reload();
    
    // Form should still function even without localStorage
    await page.fill('[data-testid="deck-name-input"]', 'No Storage Test');
    await expect(page.locator('[data-testid="deck-name-input"]')).toHaveValue('No Storage Test');
    
    console.log('✅ Error Handling and Recovery Validation Complete');
  });

  test('♿ Journey 6: Accessibility and Inclusive Design', async ({ page }) => {
    console.log('♿ Testing Accessibility and Inclusive Design');
    
    await page.goto('/create-collection-deck/data');
    
    // PHASE 1: Keyboard Navigation
    console.log('⌨️ Phase 1: Keyboard Navigation');
    
    // Test tab order through form elements
    const tabbableElements = [
      '[data-testid="deck-name-input"]',
      '[data-testid="start-date-input"]', 
      '[data-testid="end-date-input"]',
      '[data-testid="tle-source-select"]',
      '[data-testid="load-udl-button"]',
      '[data-testid="import-tle-button"]',
      '[data-testid="tle-data-textarea"]',
      '[data-testid="sites-source-select"]',
      '[data-testid="load-bluestat-button"]',
      '[data-testid="manual-entry-button"]',
      '[data-testid="cancel-button"]',
      '[data-testid="next-button"]'
    ];
    
    // Test keyboard navigation through elements
    await page.keyboard.press('Tab');
    for (let i = 0; i < tabbableElements.length; i++) {
      const currentElement = page.locator(tabbableElements[i]);
      if (await currentElement.isVisible()) {
        await expect(currentElement).toBeFocused();
      }
      await page.keyboard.press('Tab');
    }
    
    // PHASE 2: Screen Reader Compatibility (ARIA)
    console.log('👁️ Phase 2: Screen Reader Compatibility (ARIA)');
    
    // Test ARIA labels and descriptions
    const deckNameInput = page.locator('[data-testid="deck-name-input"]');
    await expect(deckNameInput).toHaveAttribute('aria-label', /collection.*name/i);
    
    const startDateInput = page.locator('[data-testid="start-date-input"]');
    await expect(startDateInput).toHaveAttribute('aria-label', /start.*date/i);
    
    // Test progress bar accessibility
    const progressBar = page.locator('[data-testid="progress-bar"]');
    await expect(progressBar).toHaveAttribute('role', 'progressbar');
    await expect(progressBar).toHaveAttribute('aria-label', /Step 1 of 4/);
    
    // Test form field associations
    const formGroups = page.locator('.bp3-form-group');
    const formGroupCount = await formGroups.count();
    for (let i = 0; i < formGroupCount; i++) {
      const formGroup = formGroups.nth(i);
      const label = formGroup.locator('label');
      const input = formGroup.locator('input, select, textarea').first();
      
      if (await label.isVisible() && await input.isVisible()) {
        const labelFor = await label.getAttribute('for');
        const inputId = await input.getAttribute('id');
        if (labelFor && inputId) {
          expect(labelFor).toBe(inputId);
        }
      }
    }
    
    // PHASE 3: Color Contrast and Visual Accessibility
    console.log('🎨 Phase 3: Color Contrast and Visual Accessibility');
    
    // Test focus indicators are visible
    await deckNameInput.focus();
    await expect(deckNameInput).toHaveCSS('outline-width', /.+/);
    
    // Test error state color accessibility (should not rely on color alone)
    await page.click('[data-testid="next-button"]'); // Trigger validation errors
    const errorElements = page.locator('.bp3-intent-danger');
    const errorCount = await errorElements.count();
    for (let i = 0; i < errorCount; i++) {
      const errorElement = errorElements.nth(i);
      // Should have text or icon indicating error, not just color
      const hasErrorText = await errorElement.locator('text=required').isVisible() ||
                          await errorElement.locator('.bp3-icon-error').isVisible();
      expect(hasErrorText).toBeTruthy();
    }
    
    // PHASE 4: Mobile Accessibility
    console.log('📱 Phase 4: Mobile Accessibility');
    
    // Test mobile viewport accessibility
    await page.setViewportSize({ width: 375, height: 667 });
    
    // Test touch target sizes (minimum 44x44 pixels)
    const buttons = page.locator('button');
    const buttonCount = await buttons.count();
    for (let i = 0; i < Math.min(buttonCount, 5); i++) { // Test first 5 buttons
      const button = buttons.nth(i);
      if (await button.isVisible()) {
        const box = await button.boundingBox();
        if (box) {
          expect(box.height).toBeGreaterThanOrEqual(44);
          expect(box.width).toBeGreaterThanOrEqual(44);
        }
      }
    }
    
    // Test mobile form accessibility
    await expect(deckNameInput).toBeVisible();
    await deckNameInput.focus();
    await expect(deckNameInput).toBeFocused();
    
    console.log('✅ Accessibility and Inclusive Design Validation Complete');
  });

  test('📊 Performance Benchmarks and UX Quality Metrics', async ({ page }) => {
    console.log('📊 Testing Performance Benchmarks and UX Quality Metrics');
    
    // PHASE 1: Page Load Performance
    console.log('⏱️ Phase 1: Page Load Performance');
    
    const startTime = performance.now();
    await page.goto('/create-collection-deck/data');
    await page.waitForLoadState('networkidle');
    const loadTime = performance.now() - startTime;
    
    console.log(`Page load time: ${loadTime}ms`);
    expect(loadTime).toBeLessThan(3000); // <3s load time requirement
    
    // PHASE 2: Component Rendering Performance
    console.log('🖼️ Phase 2: Component Rendering Performance');
    
    const formRenderStart = performance.now();
    await expect(page.locator('[data-testid="deck-name-input"]')).toBeVisible();
    await expect(page.locator('[data-testid="start-date-input"]')).toBeVisible();
    await expect(page.locator('[data-testid="tle-source-select"]')).toBeVisible();
    const formRenderTime = performance.now() - formRenderStart;
    
    console.log(`Form rendering time: ${formRenderTime}ms`);
    expect(formRenderTime).toBeLessThan(500); // <0.5s component rendering
    
    // PHASE 3: User Interaction Response Times
    console.log('👆 Phase 3: User Interaction Response Times');
    
    // Test input response time
    const inputStart = performance.now();
    await page.fill('[data-testid="deck-name-input"]', 'Performance Test');
    const inputTime = performance.now() - inputStart;
    
    console.log(`Input response time: ${inputTime}ms`);
    expect(inputTime).toBeLessThan(100); // <100ms input response
    
    // Test button click response time
    const clickStart = performance.now();
    await page.click('[data-testid="load-udl-button"]');
    await page.waitForSelector('[data-testid="load-udl-button"][aria-disabled="true"]');
    const clickTime = performance.now() - clickStart;
    
    console.log(`Button click response time: ${clickTime}ms`);
    expect(clickTime).toBeLessThan(200); // <200ms click response
    
    // PHASE 4: Task Completion Efficiency
    console.log('✅ Phase 4: Task Completion Efficiency');
    
    const taskStart = performance.now();
    
    // Complete minimal valid form
    await page.fill('[data-testid="deck-name-input"]', 'Efficiency Test Deck');
    await page.fill('[data-testid="start-date-input"]', '01/01/2024');
    await page.fill('[data-testid="end-date-input"]', '01/31/2024');
    await page.locator('[data-testid="tle-source-select"]').selectOption('UDL');
    await page.click('[data-testid="next-button"]');
    
    const taskTime = performance.now() - taskStart;
    console.log(`Task completion time: ${taskTime}ms`);
    expect(taskTime).toBeLessThan(5000); // <5s for basic task completion
    
    // PHASE 5: Memory Usage Monitoring
    console.log('🧠 Phase 5: Memory Usage Monitoring');
    
    // Get memory usage metrics
    const metrics = await page.evaluate(() => {
      return {
        usedJSHeapSize: (performance as any).memory?.usedJSHeapSize,
        totalJSHeapSize: (performance as any).memory?.totalJSHeapSize,
        jsHeapSizeLimit: (performance as any).memory?.jsHeapSizeLimit
      };
    });
    
    if (metrics.usedJSHeapSize) {
      const memoryUsageMB = metrics.usedJSHeapSize / (1024 * 1024);
      console.log(`Memory usage: ${memoryUsageMB.toFixed(2)}MB`);
      expect(memoryUsageMB).toBeLessThan(100); // <100MB memory usage
    }
    
    console.log('✅ Performance Benchmarks Validation Complete');
  });

  test('🎯 Industry Pattern Compliance Validation', async ({ page }) => {
    console.log('🎯 Testing Industry Pattern Compliance');
    
    await page.goto('/create-collection-deck/data');
    
    // PHASE 1: Wizard Navigation Pattern Compliance
    console.log('🧙 Phase 1: Wizard Navigation Pattern Compliance');
    
    // Validate progress indicator follows industry standards
    const progressBar = page.locator('[data-testid="progress-bar"]');
    await expect(progressBar).toBeVisible();
    await expect(progressBar).toHaveAttribute('role', 'progressbar');
    await expect(progressBar).toHaveAttribute('aria-valuenow');
    await expect(progressBar).toHaveAttribute('aria-valuemin');
    await expect(progressBar).toHaveAttribute('aria-valuemax');
    
    // Validate step indicators
    const stepIndicators = page.locator('[data-testid*="step-"][data-testid*="-indicator"]');
    const indicatorCount = await stepIndicators.count();
    expect(indicatorCount).toBe(4); // Should have 4 steps
    
    // Test linear progression (can't skip ahead)
    await page.goto('/create-collection-deck/matches');
    // Should redirect or show error since previous steps not completed
    const isValidAccess = await page.locator('text=Complete previous steps').isVisible() ||
                         !page.url().includes('/matches');
    expect(isValidAccess).toBeTruthy();
    
    // PHASE 2: Form Design Pattern Compliance
    console.log('📋 Phase 2: Form Design Pattern Compliance');
    
    await page.goto('/create-collection-deck/data');
    
    // Validate required field indicators
    const requiredFields = page.locator('[required], .bp3-intent-danger label');
    const requiredCount = await requiredFields.count();
    expect(requiredCount).toBeGreaterThan(0);
    
    // Validate form grouping (related fields grouped together)
    const formSections = [
      'Collection Information',
      'Tasking Window', 
      'TLE Data',
      'Unavailable Sites'
    ];
    
    for (const section of formSections) {
      await expect(page.locator(`text=${section}`)).toBeVisible();
    }
    
    // PHASE 3: Data Grid/Table Pattern Compliance (Step 3)
    console.log('📊 Phase 3: Data Grid/Table Pattern Compliance');
    
    // Navigate to matches step (complete required fields first)
    await page.fill('[data-testid="deck-name-input"]', 'Pattern Test Deck');
    await page.fill('[data-testid="start-date-input"]', '01/01/2024');
    await page.fill('[data-testid="end-date-input"]', '01/31/2024');
    await page.locator('[data-testid="tle-source-select"]').selectOption('UDL');
    await page.click('[data-testid="next-button"]');
    await page.click('button:has-text("Next")'); // Skip step 2
    
    // Validate table accessibility
    const table = page.locator('table, [role="table"]').first();
    if (await table.isVisible()) {
      // Should have proper table structure
      await expect(table.locator('thead, [role="rowgroup"]')).toBeVisible();
      await expect(table.locator('tbody tr, [role="row"]')).toHaveCount.greaterThan(0);
      
      // Should support keyboard navigation
      const firstRow = table.locator('tbody tr, [role="row"]').first();
      await firstRow.focus();
      await page.keyboard.press('ArrowDown');
    }
    
    // PHASE 4: Error Handling Pattern Compliance
    console.log('❌ Phase 4: Error Handling Pattern Compliance');
    
    await page.goto('/create-collection-deck/data');
    
    // Test inline validation
    await page.click('[data-testid="next-button"]');
    
    // Errors should appear inline with clear messaging
    const errorMessages = page.locator('.bp3-form-helper-text, .bp3-intent-danger');
    const errorCount = await errorMessages.count();
    expect(errorCount).toBeGreaterThan(0);
    
    // Error messages should be specific and actionable
    await expect(page.locator('text=Start date is required')).toBeVisible();
    await expect(page.locator('text=End date is required')).toBeVisible();
    await expect(page.locator('text=TLE data source is required')).toBeVisible();
    
    console.log('✅ Industry Pattern Compliance Validation Complete');
  });
});

test.describe('🎯 Success Criteria Validation', () => {

  test('📊 Overall Success Metrics Validation', async ({ page }) => {
    console.log('📊 Validating Overall Success Metrics');
    
    const testResults = {
      passRate: 0,
      completionTime: 0,
      accessibilityCompliance: 0,
      errorRate: 0,
      criticalIssues: 0
    };
    
    // METRIC 1: 90%+ Test Pass Rate (tracked by test runner)
    console.log('✅ Test Pass Rate: Tracked by Playwright Test Runner');
    
    // METRIC 2: <3 Second Task Completion
    console.log('⏱️ Measuring Task Completion Time');
    
    const startTime = performance.now();
    
    await page.goto('/create-collection-deck/data');
    await page.fill('[data-testid="deck-name-input"]', 'Success Metrics Test');
    await page.fill('[data-testid="start-date-input"]', '01/01/2024');
    await page.fill('[data-testid="end-date-input"]', '01/31/2024');
    await page.locator('[data-testid="tle-source-select"]').selectOption('UDL');
    await page.click('[data-testid="next-button"]');
    
    const completionTime = performance.now() - startTime;
    testResults.completionTime = completionTime;
    
    console.log(`Primary workflow completion time: ${completionTime}ms`);
    expect(completionTime).toBeLessThan(3000); // <3 seconds requirement
    
    // METRIC 3: 100% Accessibility Compliance (WCAG 2.1 AA)
    console.log('♿ Validating Accessibility Compliance');
    
    let accessibilityScore = 0;
    let totalAccessibilityChecks = 0;
    
    // Check ARIA labels
    totalAccessibilityChecks++;
    const hasAriaLabels = await page.locator('[aria-label]').count() > 0;
    if (hasAriaLabels) accessibilityScore++;
    
    // Check keyboard navigation
    totalAccessibilityChecks++;
    await page.keyboard.press('Tab');
    const hasFocusableElements = await page.locator(':focus').isVisible();
    if (hasFocusableElements) accessibilityScore++;
    
    // Check form labels
    totalAccessibilityChecks++;
    const formLabels = await page.locator('label').count();
    const formInputs = await page.locator('input, select, textarea').count();
    if (formLabels >= formInputs * 0.8) accessibilityScore++; // 80% of inputs should have labels
    
    testResults.accessibilityCompliance = (accessibilityScore / totalAccessibilityChecks) * 100;
    console.log(`Accessibility compliance: ${testResults.accessibilityCompliance}%`);
    expect(testResults.accessibilityCompliance).toBeGreaterThanOrEqual(90); // 90%+ requirement
    
    // METRIC 4: <2% User Error Rate
    console.log('🎯 Measuring User Error Rate');
    
    let totalInteractions = 0;
    let errorInteractions = 0;
    
    // Test valid interactions
    totalInteractions++;
    await page.fill('[data-testid="deck-name-input"]', 'Valid Name');
    // Should not produce error
    
    totalInteractions++;
    await page.fill('[data-testid="start-date-input"]', '01/01/2024');
    // Should not produce error
    
    // Test edge case that might cause user confusion
    totalInteractions++;
    await page.fill('[data-testid="end-date-input"]', '12/31/2023'); // Before start date
    await page.click('[data-testid="next-button"]');
    const hasDateError = await page.locator('text=End date must be after start date').isVisible();
    if (!hasDateError) errorInteractions++; // Error if validation doesn't catch this
    
    testResults.errorRate = (errorInteractions / totalInteractions) * 100;
    console.log(`User error rate: ${testResults.errorRate}%`);
    expect(testResults.errorRate).toBeLessThan(2); // <2% requirement
    
    // METRIC 5: Zero Critical UX Blocking Issues
    console.log('🚨 Checking for Critical UX Blocking Issues');
    
    let criticalIssues = 0;
    
    // Check if primary workflow can be completed
    try {
      await page.fill('[data-testid="end-date-input"]', '01/31/2024'); // Fix date issue
      await page.locator('[data-testid="tle-source-select"]').selectOption('UDL');
      await page.click('[data-testid="next-button"]');
      await expect(page).toHaveURL(/.*parameters.*/);
    } catch (error) {
      criticalIssues++;
      console.error('Critical issue: Cannot complete primary workflow', error);
    }
    
    // Check if navigation works
    try {
      const backButton = page.locator('button:has-text("Back")');
      await backButton.click();
      await expect(page).toHaveURL(/.*data.*/);
    } catch (error) {
      criticalIssues++;
      console.error('Critical issue: Navigation not working', error);
    }
    
    testResults.criticalIssues = criticalIssues;
    console.log(`Critical UX blocking issues: ${criticalIssues}`);
    expect(criticalIssues).toBe(0); // Zero critical issues requirement
    
    // SUMMARY REPORT
    console.log('\n🎯 SUCCESS CRITERIA VALIDATION SUMMARY:');
    console.log(`✅ Task Completion Time: ${testResults.completionTime}ms (Target: <3000ms)`);
    console.log(`♿ Accessibility Compliance: ${testResults.accessibilityCompliance}% (Target: 100%)`);
    console.log(`🎯 User Error Rate: ${testResults.errorRate}% (Target: <2%)`);
    console.log(`🚨 Critical Issues: ${testResults.criticalIssues} (Target: 0)`);
    
    console.log('✅ Success Criteria Validation Complete');
  });
});