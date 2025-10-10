import { test, expect } from '@playwright/test';

test('Analyze Collection Management Page - Live Implementation', async ({ page }) => {
  console.log('\n=== COLLECTION MANAGEMENT PAGE ANALYSIS ===\n');

  // Navigate to the collection management page
  const url = 'http://localhost:3000/collection/DECK-1757517559289/manage';
  console.log('Navigating to:', url);

  await page.goto(url, { waitUntil: 'networkidle', timeout: 30000 });

  // Wait for page to be fully loaded
  await page.waitForTimeout(2000);

  // Take screenshot for visual reference
  await page.screenshot({ path: 'collection-manage-page-analysis.png', fullPage: true });
  console.log('✅ Screenshot saved: collection-manage-page-analysis.png\n');

  // ========================================
  // SECTION 1: PAGE STRUCTURE
  // ========================================
  console.log('📋 SECTION 1: PAGE STRUCTURE\n');

  const pageTitle = await page.locator('h1, h2, .page-title').first().textContent();
  console.log('Page Title:', pageTitle);

  const mainContent = await page.locator('[role="main"], .main-content, main').count();
  console.log('Main Content Sections:', mainContent);

  // Check for tabs
  const tabs = await page.locator('[role="tab"], .bp5-tab').allTextContents();
  console.log('Tabs Found:', tabs.length > 0 ? tabs : 'None');

  // Check for modal/dialog
  const modal = await page.locator('[role="dialog"], .bp5-dialog, .bp5-overlay').count();
  console.log('Modal/Dialog Present:', modal > 0 ? 'Yes' : 'No');

  // ========================================
  // SECTION 2: COLLECTION OPPORTUNITIES TABLE
  // ========================================
  console.log('\n📊 SECTION 2: COLLECTION OPPORTUNITIES\n');

  // Check for table
  const table = await page.locator('table, [role="table"], .collection-table').first();
  const tableExists = await table.count() > 0;
  console.log('Table Present:', tableExists);

  if (tableExists) {
    // Get table headers
    const headers = await page.locator('th, [role="columnheader"]').allTextContents();
    console.log('Table Headers:', headers);

    // Get row count
    const rows = await page.locator('tbody tr, [role="row"]').count();
    console.log('Table Rows:', rows);

    // Check for action buttons in rows
    const actionButtons = await page.locator('button[data-action], .action-button, button[aria-label*="Edit"], button[aria-label*="Override"]').count();
    console.log('Action Buttons in Table:', actionButtons);
  }

  // ========================================
  // SECTION 3: OVERRIDE/ALLOCATION WORKFLOW
  // ========================================
  console.log('\n⚙️ SECTION 3: OVERRIDE/ALLOCATION WORKFLOW\n');

  // Check for "Reallocate" or "Override" buttons
  const reallocateButtons = await page.locator('button:has-text("Reallocate"), button:has-text("Override"), button:has-text("Edit Allocation")').count();
  console.log('Reallocate/Override Buttons:', reallocateButtons);

  // Check for detail panel/drawer
  const detailPanel = await page.locator('.detail-panel, [data-testid*="detail"], .side-panel, aside').count();
  console.log('Detail Panel/Drawer:', detailPanel > 0 ? 'Present' : 'Not visible');

  // Check for two-panel layout (legacy pattern)
  const leftPanel = await page.locator('.left-panel, [data-panel="left"], .available-passes').count();
  const rightPanel = await page.locator('.right-panel, [data-panel="right"], .allocation-plan').count();
  console.log('Two-Panel Layout:', leftPanel > 0 && rightPanel > 0 ? 'Yes (Legacy pattern found!)' : 'No');

  // ========================================
  // SECTION 4: INTERACTION MODEL
  // ========================================
  console.log('\n🖱️ SECTION 4: INTERACTION MODEL\n');

  // Check for checkboxes (legacy model)
  const checkboxes = await page.locator('input[type="checkbox"], .bp5-checkbox').count();
  console.log('Checkboxes:', checkboxes);

  // Check for drag-and-drop indicators
  const draggableElements = await page.locator('[draggable="true"], [data-draggable]').count();
  console.log('Draggable Elements:', draggableElements);

  // Check for "Show All" toggle (legacy pattern)
  const showAllToggle = await page.locator('input[type="checkbox"]:has-text("Show All"), label:has-text("Show All")').count();
  console.log('Show All Toggle:', showAllToggle > 0 ? 'Present (Legacy pattern!)' : 'Not found');

  // ========================================
  // SECTION 5: JUSTIFICATION & VALIDATION
  // ========================================
  console.log('\n📝 SECTION 5: JUSTIFICATION & VALIDATION\n');

  // Check for justification form
  const justificationForm = await page.locator('textarea[placeholder*="justification"], textarea[placeholder*="comment"], [data-testid*="justification"]').count();
  console.log('Justification Form:', justificationForm > 0 ? 'Present' : 'Not visible');

  // Check for classification selector
  const classificationSelect = await page.locator('select:has(option:text("SECRET")), [aria-label*="Classification"]').count();
  console.log('Classification Selector:', classificationSelect > 0 ? 'Present' : 'Not visible');

  // Check for warning/alert dialogs
  const alerts = await page.locator('[role="alert"], .bp5-alert, [role="alertdialog"]').count();
  console.log('Alert/Warning Dialogs:', alerts);

  // ========================================
  // SECTION 6: CAPACITY INDICATORS
  // ========================================
  console.log('\n📊 SECTION 6: CAPACITY INDICATORS\n');

  // Check for capacity displays
  const capacityByTestId = await page.locator('[data-testid*="capacity"]').count();
  const capacityByClass = await page.locator('.capacity-indicator').count();
  const capacityByText = await page.locator('text=/\\d+\\/\\d+/').count();
  const capacityIndicators = capacityByTestId + capacityByClass + capacityByText;
  console.log('Capacity Indicators (e.g., "9/100"):', capacityIndicators);

  // Check for progress bars
  const progressBars = await page.locator('.bp5-progress-bar, progress, [role="progressbar"]').count();
  console.log('Progress Bars:', progressBars);

  // ========================================
  // SECTION 7: TIME/DURATION DISPLAY
  // ========================================
  console.log('\n⏰ SECTION 7: TIME/DURATION DISPLAY\n');

  // Check for time windows
  const timeByTestId = await page.locator('[data-testid*="time"]').count();
  const timeZulu = await page.locator('text=/\\d{4}Z/').count();
  const timeDuration = await page.locator('text=/> \\d+m/').count();
  const timeWindows = timeByTestId + timeZulu + timeDuration;
  console.log('Time Windows (Zulu time/Duration):', timeWindows);

  // Check for expandable time details
  const expandableTime = await page.locator('[aria-expanded], .expandable-time, button:has-text("W")').count();
  console.log('Expandable Time Details:', expandableTime > 0 ? 'Present' : 'Not found');

  // ========================================
  // SECTION 8: QUALITY FILTERS
  // ========================================
  console.log('\n🎯 SECTION 8: QUALITY FILTERS\n');

  // Check for quality indicators
  const qualityByAttr = await page.locator('[data-quality]').count();
  const qualityOptimal = await page.locator('text=/optimal/i').count();
  const qualityBaseline = await page.locator('text=/baseline/i').count();
  const qualitySuboptimal = await page.locator('text=/suboptimal/i').count();
  const qualityBadges = qualityByAttr + qualityOptimal + qualityBaseline + qualitySuboptimal;
  console.log('Quality Badges:', qualityBadges);

  // Check for filter controls
  const filterControls = await page.locator('button:has-text("Filter"), [data-testid*="filter"], .filter-controls').count();
  console.log('Filter Controls:', filterControls);

  // ========================================
  // SECTION 9: CLICK FIRST ROW TO TEST WORKFLOW
  // ========================================
  console.log('\n🔍 SECTION 9: TESTING OVERRIDE WORKFLOW\n');

  // Try to click first opportunity row
  const firstRow = page.locator('tbody tr, [role="row"]').first();
  const firstRowExists = await firstRow.count() > 0;

  if (firstRowExists) {
    console.log('Attempting to click first opportunity row...');
    await firstRow.click({ timeout: 5000 }).catch(() => console.log('❌ Could not click row'));

    // Wait for any modal/panel to open
    await page.waitForTimeout(1000);

    // Check what opened
    const modalAfterClick = await page.locator('[role="dialog"], .bp5-dialog').count();
    const drawerAfterClick = await page.locator('.drawer, .side-panel, aside[data-visible="true"]').count();

    console.log('Modal opened:', modalAfterClick > 0 ? 'Yes' : 'No');
    console.log('Drawer/Panel opened:', drawerAfterClick > 0 ? 'Yes' : 'No');

    if (modalAfterClick > 0 || drawerAfterClick > 0) {
      // Take screenshot of opened view
      await page.screenshot({ path: 'collection-manage-modal-open.png', fullPage: true });
      console.log('✅ Screenshot saved: collection-manage-modal-open.png');

      // Analyze modal/drawer content
      const modalTitle = await page.locator('[role="dialog"] h1, [role="dialog"] h2, .bp5-dialog h1, .bp5-dialog h2').first().textContent().catch(() => 'Not found');
      console.log('Modal/Drawer Title:', modalTitle);

      // Check for two-panel layout inside modal
      const leftPanelModal = await page.locator('[role="dialog"] .left-panel, .bp5-dialog .left-panel').count();
      const rightPanelModal = await page.locator('[role="dialog"] .right-panel, .bp5-dialog .right-panel').count();
      console.log('Two-Panel Layout in Modal:', leftPanelModal > 0 && rightPanelModal > 0 ? 'Yes' : 'No');

      // Check for tab interface
      const tabsInModal = await page.locator('[role="dialog"] [role="tab"], .bp5-dialog [role="tab"]').allTextContents();
      console.log('Tabs in Modal:', tabsInModal.length > 0 ? tabsInModal : 'None');
    }
  }

  // ========================================
  // SECTION 10: COMPARISON WITH LEGACY
  // ========================================
  console.log('\n📊 SECTION 10: LEGACY PATTERN COMPARISON\n');

  const legacyPatterns = {
    'Two-Panel Layout': leftPanel > 0 && rightPanel > 0,
    'Checkbox Selection': checkboxes > 5, // Arbitrary threshold
    'Show All Toggle': showAllToggle > 0,
    'Capacity Indicators': capacityIndicators > 0,
    'Time Windows': timeWindows > 0,
    'Quality Badges': qualityBadges > 0,
    'Justification Form': justificationForm > 0,
    'Warning Dialogs': alerts > 0
  };

  console.log('\nLegacy Pattern Matches:');
  let matchCount = 0;
  let totalPatterns = Object.keys(legacyPatterns).length;

  for (const [pattern, found] of Object.entries(legacyPatterns)) {
    const status = found ? '✅ FOUND' : '❌ MISSING';
    console.log(`  ${status}: ${pattern}`);
    if (found) matchCount++;
  }

  const matchPercentage = Math.round((matchCount / totalPatterns) * 100);
  console.log(`\nMental Model Preservation Score: ${matchPercentage}%`);
  console.log(`(${matchCount}/${totalPatterns} legacy patterns found)\n`);

  // ========================================
  // SECTION 11: COMPONENT DETECTION
  // ========================================
  console.log('\n🔧 SECTION 11: REACT COMPONENT DETECTION\n');

  // Check for specific component classes
  const componentClasses = [
    'CollectionOpportunitiesHub',
    'ManualOverrideModal',
    'UnifiedOpportunityEditor',
    'ReallocationWorkspace',
    'CollectionDetailPanel',
    'OverrideJustificationForm'
  ];

  for (const className of componentClasses) {
    const found = await page.locator(`[class*="${className}"], [data-component*="${className}"]`).count();
    console.log(`  ${className}: ${found > 0 ? 'Active' : 'Not detected'}`);
  }

  // ========================================
  // FINAL SUMMARY
  // ========================================
  console.log('\n' + '='.repeat(60));
  console.log('ANALYSIS COMPLETE');
  console.log('='.repeat(60) + '\n');

  console.log('📸 Screenshots saved:');
  console.log('  - collection-manage-page-analysis.png');
  if (firstRowExists && (modalAfterClick > 0 || drawerAfterClick > 0)) {
    console.log('  - collection-manage-modal-open.png');
  }

  console.log('\n💡 Key Findings:');
  console.log(`  - Mental Model Match: ${matchPercentage}%`);
  console.log(`  - Page Type: ${pageTitle || 'Unknown'}`);
  console.log(`  - Primary Interaction: ${checkboxes > draggableElements ? 'Checkbox-based' : 'Drag-and-drop'}`);
  console.log(`  - Override Entry: ${reallocateButtons > 0 ? 'Reallocate button' : 'Unknown'}`);

  console.log('\n');
});
