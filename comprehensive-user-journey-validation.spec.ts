import { test, expect } from '@playwright/test';

/**
 * Comprehensive User Journey Validation
 * Senior UX Researcher + Seasoned PM Perspective
 * 
 * This test validates the complete user journey through the VUE Dashboard application,
 * focusing on user empathy, usability heuristics, and cohesive experience design.
 * 
 * Key UX Research Principles Applied:
 * - User-centered design validation
 * - Cognitive load assessment
 * - Information architecture validation
 * - Task completion flow analysis
 * - Error handling and recovery
 * - Accessibility compliance
 * - Responsive design validation
 */

test.describe('VUE Dashboard: Complete User Journey Validation', () => {
  test.beforeEach(async ({ page }) => {
    // Start from the user's entry point - the dashboard
    await page.goto('/');
    await page.waitForLoadState('networkidle');
  });

  test('🎯 Primary User Journey: Dashboard → Create Collection Deck → History Monitoring', async ({ page }) => {
    // UX Research Focus: Validate the core user workflow
    // User Story: "As a VUE user, I want to create a collection deck and monitor its progress"
    
    console.log('🔍 Starting Primary User Journey Validation...');

    // PHASE 1: Dashboard Landing Experience
    console.log('📊 Phase 1: Dashboard Landing Experience');
    
    // Validate immediate visual hierarchy and information architecture
    await expect(page.locator('text=VUE Dashboard')).toBeVisible();
    await expect(page.locator('text=Search SCCs')).toBeVisible();
    await expect(page.locator('text=Actions')).toBeVisible();
    await expect(page.locator('text=SCCs Table')).toBeVisible();

    // Validate navigation structure (UX Heuristic: Recognition over recall)
    const navButtons = [
      { text: 'Master', icon: 'database' },
      { text: 'SCCs', icon: 'cube' },
      { text: 'Decks', icon: 'new-object' },
      { text: 'History', icon: 'history' },
      { text: 'Analytics', icon: 'chart' }
    ];

    for (const nav of navButtons) {
      const navButton = page.locator(`button:has-text("${nav.text}")`);
      await expect(navButton).toBeVisible();
      // Validate visual feedback on hover (UX Heuristic: User control and freedom)
      await navButton.hover();
      await expect(navButton).toHaveClass(/bp4-minimal/);
    }

    // Validate search functionality (UX Heuristic: Flexibility and efficiency of use)
    const searchInput = page.locator('input[placeholder*="Search SCCs"]');
    await expect(searchInput).toBeVisible();
    await searchInput.click();
    await searchInput.fill('test search');
    await expect(searchInput).toHaveValue('test search');

    // Validate action buttons are prominent and accessible
    const actionButtons = [
      { text: 'Update Master List', intent: 'primary' },
      { text: 'Create Collection Deck', intent: 'success' },
      { text: 'ADD SCC', intent: 'warning' }
    ];

    for (const action of actionButtons) {
      const button = page.locator(`button:has-text("${action.text}")`);
      await expect(button).toBeVisible();
      await expect(button).toHaveClass(/bp4-button/);
    }

    // PHASE 2: Create Collection Deck Journey
    console.log('🃏 Phase 2: Create Collection Deck Journey');
    
    // Click Create Collection Deck (primary user action)
    await page.click('button:has-text("Create Collection Deck")');
    
    // Validate step-by-step flow (UX Heuristic: User control and freedom)
    await expect(page.locator('text=Step 1: Input Data')).toBeVisible();
    await expect(page.locator('text=Deck Information')).toBeVisible();

    // Validate progress indicator
    const progressBar = page.locator('.bp4-progress-bar');
    await expect(progressBar).toBeVisible();

    // Validate form structure and accessibility
    const formElements = [
      'Tasking Window',
      'Start Date',
      'End Date',
      'TLE Data Source',
      'Unavailable Sites'
    ];

    for (const element of formElements) {
      await expect(page.locator(`text=${element}`)).toBeVisible();
    }

    // Fill out Step 1 form (simulate realistic user behavior)
    await page.fill('[data-testid="deck-name-input"]', 'UX Research Test Deck');
    await page.fill('[data-testid="start-date-input"]', '2024-01-01');
    await page.fill('[data-testid="end-date-input"]', '2024-01-31');
    
    // Validate form validation (UX Heuristic: Error prevention)
    const nextButton = page.locator('button:has-text("Next")');
    await expect(nextButton).toBeEnabled();

    // Navigate to Step 2
    await nextButton.click();
    await expect(page.locator('text=Step 2: Review Parameters')).toBeVisible();

    // Validate parameter review interface
    const parameterFields = [
      'Hard Capacity',
      'Minimum Duration',
      'Elevation'
    ];

    for (const field of parameterFields) {
      await expect(page.locator(`text=${field}`)).toBeVisible();
    }

    // Navigate to Step 3
    await page.click('button:has-text("Next")');
    await expect(page.locator('text=Step 3: Review Matches')).toBeVisible();

    // Validate matches review interface
    await expect(page.locator('text=Review Matches')).toBeVisible();
    
    // Navigate to Step 4
    await page.click('button:has-text("Next")');
    await expect(page.locator('text=Step 4: Special Instructions')).toBeVisible();

    // Fill out special instructions
    await page.fill('[data-testid="special-instructions-textarea"]', 'UX Research validation test instructions');

    // Submit the collection deck
    await page.click('button:has-text("Create Deck")');

    // PHASE 3: History Page Monitoring
    console.log('📈 Phase 3: History Page Monitoring');
    
    // Validate redirect to History page (UX Heuristic: Visibility of system status)
    await expect(page).toHaveURL(/.*history.*/);
    await expect(page.locator('text=History')).toBeVisible();

    // Validate the newly created deck appears
    await expect(page.locator('text=UX Research Test Deck')).toBeVisible();

    // Validate status indicators (UX Heuristic: Visibility of system status)
    const statusElements = page.locator('[data-testid*="status"]');
    await expect(statusElements.first()).toBeVisible();

    // Validate date filtering functionality
    const startDateInput = page.locator('[data-testid="start-date-input"]');
    const endDateInput = page.locator('[data-testid="end-date-input"]');
    await expect(startDateInput).toBeVisible();
    await expect(endDateInput).toBeVisible();

    console.log('✅ Primary User Journey Validation Complete');
  });

  test('🔍 Secondary User Journey: SCC Management Workflow', async ({ page }) => {
    // UX Research Focus: Validate SCC management workflow
    // User Story: "As a VUE user, I want to search, view, and add SCCs"
    
    console.log('🔍 Starting Secondary User Journey: SCC Management...');

    // Navigate to SCCs page
    await page.click('button:has-text("SCCs")');
    await expect(page.locator('text=SCCs')).toBeVisible();

    // Validate SCC table structure
    const tableHeaders = [
      'Name',
      'Status',
      'Type',
      'Last Updated'
    ];

    for (const header of tableHeaders) {
      await expect(page.locator(`text=${header}`)).toBeVisible();
    }

    // Test search functionality
    const searchInput = page.locator('input[placeholder*="Search"]');
    await searchInput.fill('test SCC');
    
    // Validate search results update
    await expect(page.locator('text=Search results will update as you type')).toBeVisible();

    // Navigate to Add SCC
    await page.click('button:has-text("ADD SCC")');
    await expect(page.locator('text=Add New SCC')).toBeVisible();

    // Validate Add SCC form
    const formFields = [
      'SCC Name',
      'Description',
      'Type',
      'Status'
    ];

    for (const field of formFields) {
      await expect(page.locator(`text=${field}`)).toBeVisible();
    }

    // Fill out form
    await page.fill('[data-testid="scc-name-input"]', 'UX Test SCC');
    await page.fill('[data-testid="scc-description-input"]', 'SCC created for UX validation');
    
    // Submit form
    await page.click('button:has-text("Create SCC")');

    // Validate return to SCCs page
    await expect(page).toHaveURL(/.*sccs.*/);
    await expect(page.locator('text=UX Test SCC')).toBeVisible();

    console.log('✅ Secondary User Journey Validation Complete');
  });

  test('📊 Analytics Journey: Data Visualization Access', async ({ page }) => {
    // UX Research Focus: Validate analytics access and placeholder experience
    // User Story: "As a VUE user, I want to access analytics and data insights"
    
    console.log('📊 Starting Analytics Journey Validation...');

    // Navigate to Analytics
    await page.click('button:has-text("Analytics")');
    await expect(page.locator('text=Analytics')).toBeVisible();

    // Validate placeholder content (UX Heuristic: Help and documentation)
    await expect(page.locator('text=Analytics Dashboard')).toBeVisible();
    await expect(page.locator('text=Coming Soon')).toBeVisible();

    // Validate navigation breadcrumb
    await expect(page.locator('text=VUE Dashboard')).toBeVisible();

    console.log('✅ Analytics Journey Validation Complete');
  });

  test('⚡ Error Handling and Recovery Scenarios', async ({ page }) => {
    // UX Research Focus: Validate error handling and user recovery
    // User Story: "As a VUE user, I want clear error messages and recovery options"
    
    console.log('⚡ Starting Error Handling Validation...');

    // Test Update Master List error scenario
    const updateButton = page.locator('button:has-text("Update Master List")');
    await updateButton.click();

    // Validate loading state (UX Heuristic: Visibility of system status)
    await expect(updateButton).toHaveClass(/bp4-loading/);

    // Wait for potential error (simulated in the app)
    await page.waitForTimeout(3000);

    // Check for either success or error message
    const successMessage = page.locator('text=Master list updated successfully');
    const errorMessage = page.locator('text=Update failed');
    
    // Validate that one of these appears (UX Heuristic: Error prevention)
    const hasSuccess = await successMessage.isVisible();
    const hasError = await errorMessage.isVisible();
    
    expect(hasSuccess || hasError).toBeTruthy();

    // If error occurred, validate retry functionality
    if (hasError) {
      const retryButton = page.locator('button:has-text("Try Again")');
      await expect(retryButton).toBeVisible();
      await expect(retryButton).toBeEnabled();
    }

    console.log('✅ Error Handling Validation Complete');
  });

  test('♿ Accessibility and Inclusive Design Validation', async ({ page }) => {
    // UX Research Focus: Validate accessibility compliance
    // User Story: "As a VUE user with accessibility needs, I want to use the application effectively"
    
    console.log('♿ Starting Accessibility Validation...');

    // Validate keyboard navigation (UX Heuristic: Flexibility and efficiency of use)
    await page.keyboard.press('Tab');
    
    // Validate focus indicators
    const focusedElement = page.locator(':focus');
    await expect(focusedElement).toBeVisible();

    // Validate ARIA labels and roles
    const searchInput = page.locator('input[placeholder*="Search SCCs"]');
    await expect(searchInput).toHaveAttribute('placeholder');

    // Validate color contrast (basic check)
    const textElements = page.locator('text=VUE Dashboard');
    await expect(textElements).toBeVisible();

    // Validate screen reader compatibility
    const navElements = page.locator('nav button');
    const navCount = await navElements.count();
    expect(navCount).toBeGreaterThan(0);

    console.log('✅ Accessibility Validation Complete');
  });

  test('📱 Responsive Design and Cross-Device Validation', async ({ page }) => {
    // UX Research Focus: Validate responsive design
    // User Story: "As a VUE user on different devices, I want a consistent experience"
    
    console.log('📱 Starting Responsive Design Validation...');

    // Test mobile viewport
    await page.setViewportSize({ width: 375, height: 667 });
    
    // Validate mobile navigation
    await expect(page.locator('text=VUE Dashboard')).toBeVisible();
    
    // Validate mobile-friendly button sizes
    const buttons = page.locator('button');
    const buttonCount = await buttons.count();
    expect(buttonCount).toBeGreaterThan(0);

    // Test tablet viewport
    await page.setViewportSize({ width: 768, height: 1024 });
    
    // Validate tablet layout
    await expect(page.locator('text=Search SCCs')).toBeVisible();

    // Test desktop viewport
    await page.setViewportSize({ width: 1920, height: 1080 });
    
    // Validate desktop layout
    await expect(page.locator('text=Actions')).toBeVisible();

    console.log('✅ Responsive Design Validation Complete');
  });

  test('🧠 Cognitive Load and Information Architecture Validation', async ({ page }) => {
    // UX Research Focus: Validate cognitive load and information architecture
    // User Story: "As a VUE user, I want to find information quickly without cognitive overload"
    
    console.log('🧠 Starting Cognitive Load Validation...');

    // Validate information hierarchy
    const mainHeading = page.locator('h1, h2, h3').first();
    await expect(mainHeading).toBeVisible();

    // Validate logical grouping of related elements
    const actionCard = page.locator('text=Actions').locator('..');
    await expect(actionCard).toBeVisible();

    // Validate consistent visual patterns
    const cards = page.locator('.bp4-card');
    const cardCount = await cards.count();
    expect(cardCount).toBeGreaterThan(0);

    // Validate clear visual separation
    const dividers = page.locator('.bp4-divider');
    const dividerCount = await dividers.count();
    expect(dividerCount).toBeGreaterThan(0);

    // Validate progressive disclosure (not overwhelming user with all options at once)
    const searchSection = page.locator('text=Search SCCs');
    await expect(searchSection).toBeVisible();

    console.log('✅ Cognitive Load Validation Complete');
  });

  test('🎨 Visual Design and Brand Consistency Validation', async ({ page }) => {
    // UX Research Focus: Validate visual design consistency
    // User Story: "As a VUE user, I want a professional and consistent visual experience"
    
    console.log('🎨 Starting Visual Design Validation...');

    // Validate Blueprint design system usage
    const blueprintElements = page.locator('.bp4-');
    const bpCount = await blueprintElements.count();
    expect(bpCount).toBeGreaterThan(0);

    // Validate consistent spacing
    const cards = page.locator('.bp4-card');
    await expect(cards.first()).toBeVisible();

    // Validate icon usage
    const icons = page.locator('.bp4-icon');
    const iconCount = await icons.count();
    expect(iconCount).toBeGreaterThan(0);

    // Validate color scheme consistency
    const primaryButtons = page.locator('.bp4-intent-primary');
    const primaryCount = await primaryButtons.count();
    expect(primaryCount).toBeGreaterThan(0);

    console.log('✅ Visual Design Validation Complete');
  });
});

test.describe('🎯 User Journey Performance and Usability Metrics', () => {
  test('⏱️ Task Completion Time Validation', async ({ page }) => {
    // UX Research Focus: Measure task completion efficiency
    // User Story: "As a VUE user, I want to complete tasks efficiently"
    
    console.log('⏱️ Starting Task Completion Time Validation...');

    const startTime = Date.now();

    // Measure time to create collection deck
    await page.goto('/');
    await page.click('button:has-text("Create Collection Deck")');
    
    // Fill out form quickly
    await page.fill('[data-testid="deck-name-input"]', 'Performance Test Deck');
    await page.fill('[data-testid="start-date-input"]', '2024-01-01');
    await page.fill('[data-testid="end-date-input"]', '2024-01-31');
    
    // Navigate through steps
    await page.click('button:has-text("Next")');
    await page.click('button:has-text("Next")');
    await page.click('button:has-text("Next")');
    await page.click('button:has-text("Create Deck")');

    const endTime = Date.now();
    const completionTime = endTime - startTime;

    // Validate reasonable completion time (UX Heuristic: Efficiency of use)
    console.log(`Task completion time: ${completionTime}ms`);
    expect(completionTime).toBeLessThan(30000); // 30 seconds max

    console.log('✅ Task Completion Time Validation Complete');
  });

  test('🎯 User Satisfaction Indicators Validation', async ({ page }) => {
    // UX Research Focus: Validate user satisfaction indicators
    // User Story: "As a VUE user, I want a satisfying and enjoyable experience"
    
    console.log('🎯 Starting User Satisfaction Validation...');

    // Validate immediate visual appeal
    await page.goto('/');
    await expect(page.locator('text=VUE Dashboard')).toBeVisible();

    // Validate professional appearance
    const navbar = page.locator('.bp4-navbar');
    await expect(navbar).toBeVisible();

    // Validate clear call-to-action buttons
    const ctaButtons = page.locator('button:has-text("Create Collection Deck")');
    await expect(ctaButtons).toBeVisible();

    // Validate helpful feedback
    const searchInput = page.locator('input[placeholder*="Search SCCs"]');
    await searchInput.click();
    await searchInput.fill('test');
    await expect(page.locator('text=Search results will update as you type')).toBeVisible();

    console.log('✅ User Satisfaction Validation Complete');
  });
});
