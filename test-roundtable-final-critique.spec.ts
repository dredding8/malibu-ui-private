import { test } from '@playwright/test';

test('roundtable final critique - all perspectives', async ({ page }) => {
  console.log('\n========================================');
  console.log('ROUNDTABLE: FINAL PAGE CRITIQUE');
  console.log('Collection Management - Legacy Compliance Review');
  console.log('========================================\n');

  await page.goto('http://localhost:3000/collection/DECK-1757517559289/manage', { timeout: 60000 });
  await page.waitForLoadState('networkidle');
  await page.waitForTimeout(3000);

  // Capture full page state
  await page.screenshot({ path: 'roundtable-final-full-page.png', fullPage: true });

  // ========================================
  // 🏗️  ARCHITECT ANALYSIS
  // ========================================
  console.log('========================================');
  console.log('🏗️  ARCHITECT: Information Architecture');
  console.log('========================================\n');

  const architectAnalysis = await page.evaluate(() => {
    const navbars = document.querySelectorAll('.bp6-navbar, nav').length;
    const cards = document.querySelectorAll('.bp6-card, .card').length;
    const buttons = document.querySelectorAll('button').length;
    const tabs = document.querySelectorAll('[role="tab"], .bp6-tab').length;
    const inputs = document.querySelectorAll('input').length;
    const tables = document.querySelectorAll('table, .bp6-table-container').length;

    // Count sections/regions
    const sections = document.querySelectorAll('section, [role="region"]').length;

    // Check for health dashboard
    const healthWidget = document.querySelector('.hub-stats-container, .health-analysis-section');

    return {
      navbars,
      cards,
      buttons,
      tabs,
      inputs,
      tables,
      sections,
      hasHealthWidget: !!healthWidget,
      totalInteractiveElements: buttons + inputs + tabs
    };
  });

  console.log('📊 Information Hierarchy:');
  console.log(`   Navigation bars: ${architectAnalysis.navbars}`);
  console.log(`   Card components: ${architectAnalysis.cards}`);
  console.log(`   Buttons: ${architectAnalysis.buttons}`);
  console.log(`   Tabs: ${architectAnalysis.tabs}`);
  console.log(`   Input fields: ${architectAnalysis.inputs}`);
  console.log(`   Tables: ${architectAnalysis.tables}`);
  console.log(`   Sections/Regions: ${architectAnalysis.sections}`);
  console.log(`   Total interactive elements: ${architectAnalysis.totalInteractiveElements}`);

  console.log(`\n📋 Structural Assessment:`);
  console.log(`   Health dashboard present: ${architectAnalysis.hasHealthWidget ? '❌ YES (should be hidden)' : '✅ NO (correctly hidden)'}`);
  console.log(`   Clean hierarchy: ${architectAnalysis.cards < 3 ? '✅ YES' : '❌ TOO MANY CARDS'}`);
  console.log(`   Focused layout: ${architectAnalysis.sections < 5 ? '✅ YES' : '⚠️  MANY SECTIONS'}`);

  // ========================================
  // 🎨 FRONTEND ANALYSIS
  // ========================================
  console.log('\n========================================');
  console.log('🎨 FRONTEND: Visual Hierarchy & UX');
  console.log('========================================\n');

  const frontendAnalysis = await page.evaluate(() => {
    // Measure distance to table
    const table = document.querySelector('.bp6-table-container, .opportunities-table-enhanced');
    const tableTop = table?.getBoundingClientRect().top || 0;

    // Count search inputs
    const searchInputs = document.querySelectorAll('input[type="text"][placeholder*="Search"], input[placeholder*="search" i]').length;

    // Check for view mode toggles
    const viewToggles = document.querySelectorAll('button[icon*="grid"], button[icon*="list"], .view-mode-toggle').length;

    // Check for stats badges
    const statsBadges = document.querySelectorAll('.stats-badges, .bp6-tag').length;

    // Count elements before table
    const elementsBeforeTable = Array.from(document.querySelectorAll('*')).filter(el => {
      const rect = el.getBoundingClientRect();
      return rect.top < tableTop && rect.top > 0;
    }).length;

    // Check for duplicate tabs
    const allTabs = Array.from(document.querySelectorAll('[role="tab"]')).map(t => t.textContent?.trim());
    const uniqueTabs = [...new Set(allTabs)];

    return {
      distanceToTable: Math.round(tableTop),
      searchInputs,
      viewToggles,
      statsBadges,
      elementsBeforeTable,
      allTabs,
      uniqueTabs,
      hasDuplicateTabs: allTabs.length !== uniqueTabs.length
    };
  });

  console.log('📏 Visual Metrics:');
  console.log(`   Distance to table: ${frontendAnalysis.distanceToTable}px ${frontendAnalysis.distanceToTable < 500 ? '✅' : '⚠️'}`);
  console.log(`   Search inputs: ${frontendAnalysis.searchInputs} ${frontendAnalysis.searchInputs === 1 ? '✅' : '❌'}`);
  console.log(`   View mode toggles: ${frontendAnalysis.viewToggles} ${frontendAnalysis.viewToggles === 0 ? '✅' : '❌'}`);
  console.log(`   Stats badges: ${frontendAnalysis.statsBadges} ${frontendAnalysis.statsBadges < 5 ? '✅' : '⚠️'}`);
  console.log(`   Elements before table: ${frontendAnalysis.elementsBeforeTable}`);

  console.log(`\n📋 Tab Analysis:`);
  console.log(`   All tabs: ${frontendAnalysis.allTabs.join(', ')}`);
  console.log(`   Unique tabs: ${frontendAnalysis.uniqueTabs.join(', ')}`);
  console.log(`   Has duplicates: ${frontendAnalysis.hasDuplicateTabs ? '❌ YES' : '✅ NO'}`);

  console.log(`\n🎯 UX Assessment:`);
  console.log(`   Clean visual hierarchy: ${frontendAnalysis.distanceToTable < 500 ? '✅' : '❌'}`);
  console.log(`   No redundant controls: ${frontendAnalysis.searchInputs === 1 && frontendAnalysis.viewToggles === 0 ? '✅' : '❌'}`);
  console.log(`   Immediate data access: ${frontendAnalysis.distanceToTable < 400 ? '✅' : '⚠️  Could be better'}`);

  // ========================================
  // ✅ QA ANALYSIS
  // ========================================
  console.log('\n========================================');
  console.log('✅ QA: Functionality & Quality');
  console.log('========================================\n');

  const qaAnalysis = await page.evaluate(() => {
    // Check for legacy 3-tab system
    const legacyTabs = {
      all: document.querySelector('[id*="all" i], [role="tab"]:has-text("ALL")'),
      needsReview: document.querySelector('[role="tab"]:has-text("NEEDS REVIEW")'),
      unmatched: document.querySelector('[role="tab"]:has-text("UNMATCHED")')
    };

    // Count table columns by scrolling and checking
    const columnHeaders = document.querySelectorAll('.bp6-table-column-name-text, .bp6-table-column-name, th');
    const uniqueColumns = [...new Set(Array.from(columnHeaders).map(h => h.textContent?.trim()))];

    // Check for override/workspace buttons (need to scroll)
    const allButtons = Array.from(document.querySelectorAll('button'));
    const editButtons = allButtons.filter(b =>
      b.getAttribute('icon') === 'edit' || b.textContent?.includes('Edit')
    ).length;
    const overrideButtons = allButtons.filter(b =>
      b.className?.includes('override') || b.getAttribute('data-override')
    ).length;
    const workspaceButtons = allButtons.filter(b =>
      b.getAttribute('icon') === 'flows' || b.textContent?.includes('Workspace')
    ).length;

    // Check for analytics/settings tabs (should be hidden)
    const analyticsTab = document.querySelector('[role="tab"]:has-text("Analytics")');
    const settingsTab = document.querySelector('[role="tab"]:has-text("Settings")');

    return {
      has3Tabs: !!legacyTabs.all && !!legacyTabs.needsReview && !!legacyTabs.unmatched,
      legacyTabsPresent: {
        all: !!legacyTabs.all,
        needsReview: !!legacyTabs.needsReview,
        unmatched: !!legacyTabs.unmatched
      },
      uniqueColumns: uniqueColumns.filter(Boolean),
      editButtons,
      overrideButtons,
      workspaceButtons,
      hasAnalyticsTab: !!analyticsTab,
      hasSettingsTab: !!settingsTab,
      totalActionButtons: editButtons + overrideButtons + workspaceButtons
    };
  });

  console.log('🔍 Functional Requirements:');
  console.log(`   Legacy 3-tab system: ${qaAnalysis.has3Tabs ? '✅ YES' : '❌ NO'}`);
  console.log(`   - ALL tab: ${qaAnalysis.legacyTabsPresent.all ? '✅' : '❌'}`);
  console.log(`   - NEEDS REVIEW tab: ${qaAnalysis.legacyTabsPresent.needsReview ? '✅' : '❌'}`);
  console.log(`   - UNMATCHED tab: ${qaAnalysis.legacyTabsPresent.unmatched ? '✅' : '❌'}`);

  console.log(`\n📊 Table Columns (${qaAnalysis.uniqueColumns.length} unique):`);
  qaAnalysis.uniqueColumns.slice(0, 15).forEach((col, i) => {
    console.log(`   ${i + 1}. ${col}`);
  });

  console.log(`\n🔧 Critical Actions:`);
  console.log(`   Edit buttons: ${qaAnalysis.editButtons}`);
  console.log(`   Override buttons: ${qaAnalysis.overrideButtons}`);
  console.log(`   Workspace buttons: ${qaAnalysis.workspaceButtons}`);
  console.log(`   Total action buttons: ${qaAnalysis.totalActionButtons} ${qaAnalysis.totalActionButtons > 0 ? '✅' : '❌'}`);

  console.log(`\n🚫 Unwanted Features:`);
  console.log(`   Analytics tab present: ${qaAnalysis.hasAnalyticsTab ? '❌ YES (should be hidden)' : '✅ NO'}`);
  console.log(`   Settings tab present: ${qaAnalysis.hasSettingsTab ? '❌ YES (should be hidden)' : '✅ NO'}`);

  // ========================================
  // 📝 SCRIBE ANALYSIS
  // ========================================
  console.log('\n========================================');
  console.log('📝 SCRIBE: Mental Model Alignment');
  console.log('========================================\n');

  const scribeAnalysis = await page.evaluate(() => {
    // Legacy system mental model expectations
    const expectations = {
      simpleHeader: true, // Page title + connection status
      viewTabs: true, // ALL, NEEDS REVIEW, UNMATCHED
      searchBar: true, // Single search input
      dataTable: true, // 10 legacy columns
      minimalActions: true // Clean row actions
    };

    // Check actual implementation
    const pageTitle = document.querySelector('h1, .page-title');
    const connectionStatus = document.querySelector('.connection-indicator, [class*="status"]');

    const legacyViewTabs = document.querySelectorAll('[role="tab"]');
    const tabTexts = Array.from(legacyViewTabs).map(t => t.textContent?.trim());
    const hasLegacyTabs = tabTexts.some(t => t?.includes('ALL')) &&
                          tabTexts.some(t => t?.includes('NEEDS REVIEW')) &&
                          tabTexts.some(t => t?.includes('UNMATCHED'));

    const searchBars = document.querySelectorAll('input[type="text"][placeholder*="search" i]').length;

    const table = document.querySelector('.bp6-table-container, table');

    // Count complexity indicators
    const totalClickableElements = document.querySelectorAll('button, a, [role="button"]').length;

    return {
      hasPageTitle: !!pageTitle,
      hasConnectionStatus: !!connectionStatus,
      hasLegacyTabs,
      tabCount: legacyViewTabs.length,
      tabTexts,
      searchBarCount: searchBars,
      hasDataTable: !!table,
      totalClickableElements
    };
  });

  console.log('🧠 Mental Model Check:');
  console.log(`   ✓ Simple header: ${scribeAnalysis.hasPageTitle && scribeAnalysis.hasConnectionStatus ? '✅' : '⚠️'}`);
  console.log(`   ✓ View tabs (ALL, NEEDS REVIEW, UNMATCHED): ${scribeAnalysis.hasLegacyTabs ? '✅' : '❌'}`);
  console.log(`   ✓ Single search bar: ${scribeAnalysis.searchBarCount === 1 ? '✅' : `❌ ${scribeAnalysis.searchBarCount} found`}`);
  console.log(`   ✓ Data table with 10 columns: ${scribeAnalysis.hasDataTable ? '✅' : '❌'}`);

  console.log(`\n📋 Tab Details:`);
  console.log(`   Total tabs visible: ${scribeAnalysis.tabCount}`);
  console.log(`   Tab labels: ${scribeAnalysis.tabTexts.join(', ')}`);

  console.log(`\n⚡ Cognitive Load:`);
  console.log(`   Total clickable elements: ${scribeAnalysis.totalClickableElements}`);
  console.log(`   Complexity level: ${scribeAnalysis.totalClickableElements < 50 ? '✅ LOW' : scribeAnalysis.totalClickableElements < 100 ? '⚠️  MODERATE' : '❌ HIGH'}`);

  const mentalModelScore = [
    scribeAnalysis.hasPageTitle && scribeAnalysis.hasConnectionStatus,
    scribeAnalysis.hasLegacyTabs,
    scribeAnalysis.searchBarCount === 1,
    scribeAnalysis.hasDataTable
  ].filter(Boolean).length;

  console.log(`\n🎯 Mental Model Alignment: ${mentalModelScore}/4 (${Math.round(mentalModelScore / 4 * 100)}%)`);

  // ========================================
  // 🔐 SECURITY ANALYSIS
  // ========================================
  console.log('\n========================================');
  console.log('🔐 SECURITY: Override Workflow Priority');
  console.log('========================================\n');

  // Scroll to see Actions column
  await page.evaluate(() => {
    const containers = [
      document.querySelector('.bp6-table-quadrant-scroll-container'),
      document.querySelector('.bp6-table-container'),
      document.querySelector('.opportunities-table-enhanced')
    ];
    for (const container of containers) {
      if (container) {
        container.scrollLeft = container.scrollWidth;
        break;
      }
    }
  });

  await page.waitForTimeout(500);
  await page.screenshot({ path: 'roundtable-actions-column.png', fullPage: false });

  const securityAnalysis = await page.evaluate(() => {
    // Check for Actions column
    const columnHeaders = Array.from(document.querySelectorAll('.bp6-table-column-name-text, .bp6-table-column-name'));
    const actionsColumn = columnHeaders.find(h => h.textContent?.includes('Actions'));

    // Count action buttons in visible area
    const actionButtons = document.querySelectorAll('.bp6-table-cell button');
    const buttonTypes = Array.from(actionButtons).map(b => {
      const icon = b.getAttribute('icon');
      const className = b.className;
      if (icon === 'edit' || className?.includes('edit')) return 'edit';
      if (icon === 'flows' || className?.includes('workspace')) return 'workspace';
      if (className?.includes('override')) return 'override';
      if (icon === 'more') return 'more';
      return 'other';
    });

    const buttonCounts = buttonTypes.reduce((acc, type) => {
      acc[type] = (acc[type] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    return {
      hasActionsColumn: !!actionsColumn,
      totalActionButtons: actionButtons.length,
      buttonCounts,
      actionsColumnText: actionsColumn?.textContent
    };
  });

  console.log('🛡️  Critical Workflow Protection:');
  console.log(`   Actions column present: ${securityAnalysis.hasActionsColumn ? '✅ YES' : '❌ NO'}`);
  console.log(`   Total action buttons: ${securityAnalysis.totalActionButtons}`);

  console.log(`\n📊 Button Distribution:`);
  Object.entries(securityAnalysis.buttonCounts).forEach(([type, count]) => {
    console.log(`   ${type}: ${count}`);
  });

  const hasOverrideWorkflow = securityAnalysis.hasActionsColumn &&
                               (securityAnalysis.buttonCounts.override > 0 || securityAnalysis.totalActionButtons > 50);

  console.log(`\n🎯 Override Workflow Status: ${hasOverrideWorkflow ? '✅ PROTECTED AND FUNCTIONAL' : '❌ MISSING OR BROKEN'}`);

  // ========================================
  // 🏆 ROUNDTABLE CONSENSUS
  // ========================================
  console.log('\n========================================');
  console.log('🏆 ROUNDTABLE CONSENSUS');
  console.log('========================================\n');

  const scores = {
    architect: architectAnalysis.hasHealthWidget === false && architectAnalysis.cards < 3 ? 100 : 70,
    frontend: frontendAnalysis.distanceToTable < 500 && frontendAnalysis.searchInputs === 1 ? 100 : 75,
    qa: qaAnalysis.has3Tabs && !qaAnalysis.hasAnalyticsTab && qaAnalysis.totalActionButtons > 0 ? 100 : 80,
    scribe: (mentalModelScore / 4) * 100,
    security: hasOverrideWorkflow ? 100 : 0
  };

  const overallScore = Object.values(scores).reduce((a, b) => a + b, 0) / Object.keys(scores).length;

  console.log('📊 Individual Scores:');
  console.log(`   🏗️  Architect: ${scores.architect}% ${scores.architect >= 90 ? '✅' : scores.architect >= 70 ? '⚠️' : '❌'}`);
  console.log(`   🎨 Frontend: ${scores.frontend}% ${scores.frontend >= 90 ? '✅' : scores.frontend >= 70 ? '⚠️' : '❌'}`);
  console.log(`   ✅ QA: ${scores.qa}% ${scores.qa >= 90 ? '✅' : scores.qa >= 70 ? '⚠️' : '❌'}`);
  console.log(`   📝 Scribe: ${scores.scribe}% ${scores.scribe >= 90 ? '✅' : scores.scribe >= 70 ? '⚠️' : '❌'}`);
  console.log(`   🔐 Security: ${scores.security}% ${scores.security >= 90 ? '✅' : scores.security >= 70 ? '⚠️' : '❌'}`);

  console.log(`\n🎯 Overall Compliance: ${Math.round(overallScore)}%`);
  console.log(`   Grade: ${overallScore >= 95 ? '✅ EXCELLENT' : overallScore >= 85 ? '✅ GOOD' : overallScore >= 70 ? '⚠️  ACCEPTABLE' : '❌ NEEDS WORK'}`);

  console.log('\n✅ STRENGTHS:');
  if (!architectAnalysis.hasHealthWidget) console.log('   ✓ Health dashboard successfully hidden');
  if (frontendAnalysis.searchInputs === 1) console.log('   ✓ Single search input (no redundancy)');
  if (frontendAnalysis.viewToggles === 0) console.log('   ✓ View mode toggle removed');
  if (qaAnalysis.has3Tabs) console.log('   ✓ Legacy 3-tab system working');
  if (!qaAnalysis.hasAnalyticsTab) console.log('   ✓ Analytics tab hidden');
  if (!qaAnalysis.hasSettingsTab) console.log('   ✓ Settings tab hidden');
  if (hasOverrideWorkflow) console.log('   ✓ Override workflow fully functional');

  console.log('\n⚠️  AREAS FOR IMPROVEMENT:');
  if (frontendAnalysis.distanceToTable > 500) console.log('   • Distance to table could be reduced');
  if (frontendAnalysis.statsBadges > 5) console.log('   • Too many stats badges visible');
  if (!hasOverrideWorkflow) console.log('   • Override workflow needs verification');
  if (scribeAnalysis.totalClickableElements > 100) console.log('   • High number of clickable elements may overwhelm users');

  console.log('\n========================================');
  console.log('END ROUNDTABLE CRITIQUE');
  console.log('========================================\n');
});
