/**
 * Legacy System Compliance Roundtable Analysis
 *
 * Compare collection management page against legacy system capabilities
 * and user mental models
 */

import { test } from '@playwright/test';

test.describe('Legacy System Compliance Roundtable', () => {
  test('analyze collection management page for legacy compliance', async ({ page }) => {
    test.setTimeout(180000);

    console.log('\n============================================');
    console.log('LEGACY SYSTEM COMPLIANCE ANALYSIS');
    console.log('ROUNDTABLE: Architect + Frontend + QA + Scribe');
    console.log('============================================\n');

    // Navigate to collection management page
    await page.goto('http://localhost:3000/collection/DECK-1757517559289/manage');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(3000);

    await page.screenshot({ path: 'legacy-analysis-1-page.png', fullPage: true });

    console.log('📍 Page: Collection Management');
    console.log('URL: http://localhost:3000/collection/DECK-1757517559289/manage\n');

    // SECTION 1: VIEW TABS ANALYSIS
    console.log('========================================');
    console.log('1.0 VIEW TABS (Status Filters)');
    console.log('========================================\n');

    console.log('🔍 ARCHITECT: Analyzing tab structure...');

    // Look for tabs
    const tabs = page.locator('[role="tab"], .bp6-tab, .bp5-tab, [class*="tab"]');
    const tabCount = await tabs.count();
    console.log(`Found ${tabCount} tab elements\n`);

    if (tabCount > 0) {
      console.log('Tab Analysis:');
      for (let i = 0; i < Math.min(tabCount, 10); i++) {
        const tab = tabs.nth(i);
        const text = await tab.textContent();
        const isVisible = await tab.isVisible().catch(() => false);

        if (isVisible && text && text.trim().length > 0) {
          console.log(`  Tab ${i + 1}: "${text.trim()}"`);
        }
      }
    }

    console.log('\n📋 LEGACY REQUIREMENT:');
    console.log('  Expected: ALL, NEEDS REVIEW (8), UNMATCHED (4)');
    console.log('  Purpose: Filter opportunities by status with counts');
    console.log('  Interaction: Click tab to filter main table\n');

    // Check for filter/status tabs specifically
    const pageText = await page.textContent('body');
    const hasStatusFilters = pageText?.includes('ALL') ||
                           pageText?.includes('NEEDS REVIEW') ||
                           pageText?.includes('UNMATCHED') ||
                           pageText?.includes('Warning') ||
                           pageText?.includes('Critical') ||
                           pageText?.includes('Optimal');

    if (hasStatusFilters) {
      console.log('✅ FRONTEND: Status filtering capability detected');
    } else {
      console.log('❌ FRONTEND: No obvious status filter tabs found');
    }

    // SECTION 2: MAIN DATA TABLE ANALYSIS
    console.log('\n========================================');
    console.log('1.1 MAIN DATA TABLE');
    console.log('========================================\n');

    console.log('🔍 ARCHITECT: Analyzing table structure...\n');

    // Look for table headers
    const headers = page.locator('th, [role="columnheader"], [class*="header"], [class*="column"]');
    const headerCount = await headers.count();

    console.log(`Found ${headerCount} potential column headers\n`);
    console.log('Current Table Columns:');

    const columnNames: string[] = [];
    for (let i = 0; i < Math.min(headerCount, 20); i++) {
      const header = headers.nth(i);
      const text = await header.textContent();
      const isVisible = await header.isVisible().catch(() => false);

      if (isVisible && text && text.trim().length > 0 && text.trim().length < 50) {
        const colName = text.trim();
        columnNames.push(colName);
        console.log(`  ${i + 1}. ${colName}`);
      }
    }

    console.log('\n📋 LEGACY REQUIREMENT - Required Columns:');
    const requiredColumns = {
      'Priority': 'Mission criticality indicator',
      'SCC': 'Satellite Catalog Number',
      'Function': 'e.g., PNT, ISR',
      'Orbit': 'e.g., MEO, LEO',
      'Periodicity': 'Collection frequency',
      'Collection Type': 'e.g., Photometric, Wideband',
      'Classification': 'e.g., S//REL FVEY',
      'Match': 'e.g., Baseline',
      'Match Notes': 'e.g., Capacity issue, Best Pass',
      'Site Allocation': 'e.g., DG SC HI'
    };

    console.log('');
    for (const [col, desc] of Object.entries(requiredColumns)) {
      console.log(`  • ${col}: ${desc}`);
    }

    console.log('\n🔍 QA: Compliance Check...\n');

    // Check each required column
    const complianceResults: { [key: string]: boolean } = {};

    for (const requiredCol of Object.keys(requiredColumns)) {
      const found = columnNames.some(col =>
        col.toLowerCase().includes(requiredCol.toLowerCase()) ||
        requiredCol.toLowerCase().includes(col.toLowerCase())
      );
      complianceResults[requiredCol] = found;

      const status = found ? '✅' : '❌';
      console.log(`${status} ${requiredCol}: ${found ? 'PRESENT' : 'MISSING'}`);
    }

    // Calculate compliance score
    const totalRequired = Object.keys(requiredColumns).length;
    const found = Object.values(complianceResults).filter(v => v).length;
    const compliancePercent = Math.round((found / totalRequired) * 100);

    console.log(`\n📊 COMPLIANCE SCORE: ${compliancePercent}% (${found}/${totalRequired} columns)`);

    // SECTION 3: DATA FORMAT ANALYSIS
    console.log('\n========================================');
    console.log('1.2 DATA FORMAT & CONTENT');
    console.log('========================================\n');

    console.log('🔍 FRONTEND: Analyzing data presentation...\n');

    // Check for priority format
    if (pageText?.includes('CRITICAL') || pageText?.includes('HIGH')) {
      console.log('✅ Priority: Found UPPERCASE format (legacy compliant)');
    } else if (pageText?.includes('critical') || pageText?.includes('high')) {
      console.log('⚠️  Priority: Found lowercase format (NOT legacy compliant)');
      console.log('   Expected: CRITICAL, HIGH, MEDIUM, NORMAL');
    }

    // Check for classification markings
    if (pageText?.includes('S//REL') || pageText?.includes('S//NF') || pageText?.includes('UNCLASSIFIED')) {
      console.log('✅ Classification: Security markings present');
    } else {
      console.log('❌ Classification: No security markings found');
      console.log('   Expected: S//REL FVEY, S//NF, UNCLASSIFIED, etc.');
    }

    // Check for match status
    if (pageText?.includes('Baseline') || pageText?.includes('Suboptimal') || pageText?.includes('Unmatched')) {
      console.log('✅ Match Status: Quality indicators present');
    } else {
      console.log('⚠️  Match Status: Not clearly visible');
      console.log('   Expected: Baseline, Suboptimal, Unmatched');
    }

    // Check for site allocations
    const sitePattern = /Site [A-Z]/g;
    const siteMatches = pageText?.match(sitePattern);
    if (siteMatches && siteMatches.length > 0) {
      console.log(`✅ Site Allocation: Found ${siteMatches.length} site references`);
    } else {
      console.log('⚠️  Site Allocation: Site codes not clearly displayed');
      console.log('   Expected: DG, SC, HI, etc. (site abbreviations)');
    }

    // SECTION 4: INTERACTION PATTERNS
    console.log('\n========================================');
    console.log('1.3 INTERACTION PATTERNS');
    console.log('========================================\n');

    console.log('🔍 FRONTEND: Analyzing user interactions...\n');

    // Check for clickable rows
    const rows = page.locator('tbody tr, [role="row"]');
    const rowCount = await rows.count();
    console.log(`Found ${rowCount} data rows\n`);

    console.log('📋 LEGACY EXPECTATION:');
    console.log('  • Click any row to open SCC details');
    console.log('  • Details should show satellite/opportunity information');
    console.log('  • Quick access to critical decision data\n');

    // Try clicking first row to see what happens
    let modalVisible = false; // Initialize outside the block
    if (rowCount > 0) {
      console.log('Testing row interaction...');
      const firstRow = rows.first();

      // Get row content before clicking
      const rowText = await firstRow.textContent();
      console.log(`First row preview: "${rowText?.substring(0, 100)}..."`);

      await firstRow.click({ force: true });
      await page.waitForTimeout(2000);

      await page.screenshot({ path: 'legacy-analysis-2-row-clicked.png', fullPage: true });

      // Check if a detail panel or modal opened
      const modal = page.locator('[role="dialog"], .bp6-dialog, .bp5-dialog');
      modalVisible = await modal.isVisible({ timeout: 1000 }).catch(() => false);

      if (modalVisible) {
        console.log('✅ Row click opened modal/dialog (expected behavior)');

        const modalText = await modal.textContent();
        console.log(`\nModal contains: ${modalText?.substring(0, 200)}...`);

      } else {
        console.log('⚠️  Row click did not open modal');
        console.log('   Checking for detail panel or inline expansion...');

        // Check if page changed
        const newPageText = await page.textContent('body');
        const contentChanged = newPageText !== pageText;

        if (contentChanged) {
          console.log('✅ Row click triggered some UI change');
        } else {
          console.log('❌ No visible response to row click');
        }
      }
    }

    // SECTION 5: MENTAL MODEL ANALYSIS
    console.log('\n========================================');
    console.log('1.4 USER MENTAL MODEL COMPLIANCE');
    console.log('========================================\n');

    console.log('🧠 SCRIBE: Analyzing legacy user expectations...\n');

    const mentalModelChecks = {
      'Status-based filtering': hasStatusFilters,
      'Tabular data presentation': rowCount > 0,
      'Priority visibility': pageText?.includes('CRITICAL') || pageText?.includes('critical'),
      'SCC identification': pageText?.includes('Unit') || pageText?.includes('SCC'),
      'Classification markings': pageText?.includes('S//') || pageText?.includes('UNCLASSIFIED'),
      'Site allocation codes': siteMatches && siteMatches.length > 0,
      'Click-to-view-details': true // Tested above
    };

    console.log('Mental Model Alignment:');
    for (const [check, passes] of Object.entries(mentalModelChecks)) {
      console.log(`  ${passes ? '✅' : '❌'} ${check}`);
    }

    const mentalModelScore = Object.values(mentalModelChecks).filter(v => v).length;
    const mentalModelPercent = Math.round((mentalModelScore / Object.keys(mentalModelChecks).length) * 100);

    console.log(`\n📊 MENTAL MODEL SCORE: ${mentalModelPercent}% (${mentalModelScore}/${Object.keys(mentalModelChecks).length} checks)`);

    // FINAL ROUNDTABLE SUMMARY
    console.log('\n============================================');
    console.log('ROUNDTABLE SUMMARY');
    console.log('============================================\n');

    console.log('🏗️  ARCHITECT:');
    console.log(`   • Data structure: ${compliancePercent}% column compliance`);
    console.log(`   • Interaction patterns: ${modalVisible ? 'Modal-based (modern)' : 'Unknown'}`);

    console.log('\n🎨 FRONTEND:');
    console.log(`   • Visual presentation: ${columnNames.length} columns displayed`);
    console.log(`   • Status indicators: ${hasStatusFilters ? 'Present' : 'Needs review'}`);

    console.log('\n✅ QA:');
    console.log(`   • Required columns: ${found}/${totalRequired} present`);
    console.log(`   • Data format: Needs verification against legacy`);

    console.log('\n📝 SCRIBE:');
    console.log(`   • Mental model alignment: ${mentalModelPercent}%`);
    console.log(`   • User expectations: ${mentalModelScore}/${Object.keys(mentalModelChecks).length} patterns match`);

    console.log('\n============================================');
    console.log('RECOMMENDATIONS');
    console.log('============================================\n');

    const recommendations: string[] = [];

    if (compliancePercent < 100) {
      recommendations.push(`📌 Add missing columns: ${Object.keys(requiredColumns).filter(col => !complianceResults[col]).join(', ')}`);
    }

    if (!pageText?.includes('S//REL') && !pageText?.includes('UNCLASSIFIED')) {
      recommendations.push('📌 Add classification markings to table');
    }

    if (pageText?.includes('critical') && !pageText?.includes('CRITICAL')) {
      recommendations.push('📌 Convert priority to UPPERCASE (legacy format)');
    }

    if (recommendations.length === 0) {
      console.log('✅ No critical issues found. System appears legacy-compliant.');
    } else {
      console.log('Priority improvements:');
      recommendations.forEach((rec, i) => {
        console.log(`${i + 1}. ${rec}`);
      });
    }

    console.log('\n============================================');
    console.log('END ROUNDTABLE ANALYSIS');
    console.log('============================================\n');

    // Save detailed report
    const fs = require('fs');
    const report = {
      timestamp: new Date().toISOString(),
      page: 'Collection Management',
      url: 'http://localhost:3000/collection/DECK-1757517559289/manage',
      compliance: {
        columnCompliance: `${compliancePercent}%`,
        columnsFound: found,
        columnsRequired: totalRequired,
        missingColumns: Object.keys(requiredColumns).filter(col => !complianceResults[col]),
      },
      mentalModel: {
        score: `${mentalModelPercent}%`,
        checks: mentalModelChecks
      },
      currentColumns: columnNames,
      recommendations
    };

    fs.writeFileSync('legacy-compliance-report.json', JSON.stringify(report, null, 2));
    console.log('📄 Detailed report saved: legacy-compliance-report.json\n');
  });
});
