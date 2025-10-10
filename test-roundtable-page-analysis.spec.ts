import { test, expect } from '@playwright/test';

/**
 * Roundtable Page Analysis - Complete Information Architecture Review
 *
 * Team: Architect + Frontend + QA + Scribe
 *
 * Objective: Analyze the complete collection management page to ensure:
 * 1. Correct information hierarchy and placement
 * 2. No unnecessary features or buttons
 * 3. Clean, focused user experience aligned with legacy expectations
 */

test.describe('Roundtable - Complete Page Analysis', () => {
  test('analyze complete page information architecture', async ({ page }) => {
    console.log('\n========================================');
    console.log('ROUNDTABLE: COMPLETE PAGE ANALYSIS');
    console.log('Team: Architect + Frontend + QA + Scribe');
    console.log('========================================\n');

    // Navigate to page
    await page.goto('http://localhost:3000/collection/DECK-1757517559289/manage');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(2000);

    console.log('📍 Page: Collection Management');
    console.log('URL: http://localhost:3000/collection/DECK-1757517559289/manage\n');

    // Full page screenshot
    await page.screenshot({ path: 'roundtable-full-page.png', fullPage: true });

    console.log('========================================');
    console.log('🏗️  ARCHITECT: Information Hierarchy Analysis');
    console.log('========================================\n');

    // Analyze page structure
    const pageTitle = await page.locator('h1, h2').first().textContent();
    console.log(`📌 Page Title: "${pageTitle}"`);

    // Find all major sections
    const navbars = await page.locator('.bp5-navbar, .opportunities-navbar').count();
    console.log(`📊 Navbars/Headers: ${navbars}`);

    const cards = await page.locator('.bp5-card, .bp5-callout').count();
    console.log(`📦 Cards/Callouts: ${cards}`);

    const buttons = await page.locator('button').count();
    console.log(`🔘 Total Buttons: ${buttons}`);

    const tabs = await page.locator('.bp5-tab').count();
    console.log(`📑 Tabs: ${tabs}`);

    // List all visible buttons
    console.log('\n📋 All Visible Buttons:');
    const buttonTexts = await page.locator('button:visible').allTextContents();
    buttonTexts.forEach((text, index) => {
      if (text.trim()) {
        console.log(`  ${index + 1}. "${text.trim()}"`);
      }
    });

    // Find all input fields
    const inputs = await page.locator('input:visible').count();
    console.log(`\n🔍 Input Fields: ${inputs}`);

    const inputPlaceholders = await page.locator('input:visible').evaluateAll(
      inputs => inputs.map(i => (i as HTMLInputElement).placeholder || (i as HTMLInputElement).type)
    );
    console.log('📋 Input Types:');
    inputPlaceholders.forEach((placeholder, index) => {
      console.log(`  ${index + 1}. ${placeholder}`);
    });

    console.log('\n========================================');
    console.log('🎨 FRONTEND: Visual Hierarchy Assessment');
    console.log('========================================\n');

    // Analyze visual elements above the table
    const elementsAboveTable = await page.evaluate(() => {
      const table = document.querySelector('.bp5-table-container, .opportunities-table, .opportunities-table-enhanced');
      if (!table) return [];

      const tableTop = table.getBoundingClientRect().top;
      const allElements = Array.from(document.querySelectorAll('*'));

      return allElements
        .filter(el => {
          const rect = el.getBoundingClientRect();
          return rect.bottom <= tableTop && rect.height > 20;
        })
        .map(el => ({
          tag: el.tagName.toLowerCase(),
          classes: el.className,
          text: el.textContent?.substring(0, 50)
        }))
        .slice(0, 20);
    });

    console.log('📊 Elements Above Table (Top 20):');
    elementsAboveTable.forEach((el: any, index) => {
      console.log(`  ${index + 1}. <${el.tag}> ${el.classes.substring(0, 40)} - "${el.text}"`);
    });

    // Check for redundant or duplicate sections
    console.log('\n🔍 Checking for Redundancy:');

    const searchInputs = await page.locator('input[placeholder*="Search" i], input[placeholder*="search" i]').count();
    console.log(`  Search inputs: ${searchInputs} ${searchInputs > 1 ? '⚠️  MULTIPLE!' : '✅'}`);

    const filterSelects = await page.locator('select, .bp5-select').count();
    console.log(`  Filter dropdowns: ${filterSelects}`);

    const toolbars = await page.locator('[class*="toolbar"]').count();
    console.log(`  Toolbars: ${toolbars}`);

    console.log('\n========================================');
    console.log('✅ QA: Functionality & Clutter Assessment');
    console.log('========================================\n');

    // Identify potentially unnecessary features
    console.log('🔍 Potentially Unnecessary Features:\n');

    // Check for view mode toggles
    const viewModeButtons = await page.locator('button[icon="grid-view"], button[icon="projects"]').count();
    if (viewModeButtons > 0) {
      console.log(`  ⚠️  View mode toggle (${viewModeButtons} buttons)`);
      console.log(`      Legacy users expect table view only`);
    }

    // Check for analytics/dashboard features
    const analyticsElements = await page.locator('[class*="analytics"], [class*="dashboard"], [class*="kpi"]').count();
    if (analyticsElements > 0) {
      console.log(`  ⚠️  Analytics/Dashboard elements (${analyticsElements} found)`);
      console.log(`      Legacy users focus on data table`);
    }

    // Check for "Show All" toggle
    const showAllToggle = await page.locator('input[type="checkbox"]').filter({ hasText: /show all/i }).count();
    if (showAllToggle > 0) {
      console.log(`  ⚠️  "Show All" toggle found`);
      console.log(`      Redundant with tab filtering`);
    }

    // Check for bulk operations
    const bulkOpButtons = await page.locator('button').filter({ hasText: /bulk|batch/i }).count();
    if (bulkOpButtons > 0) {
      console.log(`  ℹ️  Bulk operation buttons (${bulkOpButtons})`);
      console.log(`      Verify if needed for legacy workflow`);
    }

    // Check for undo/redo
    const undoRedoButtons = await page.locator('button[icon="undo"], button[icon="redo"]').count();
    if (undoRedoButtons > 0) {
      console.log(`  ℹ️  Undo/Redo buttons (${undoRedoButtons})`);
      console.log(`      Verify if part of legacy workflow`);
    }

    console.log('\n========================================');
    console.log('📝 SCRIBE: User Mental Model Alignment');
    console.log('========================================\n');

    console.log('Legacy User Expectations:');
    console.log('  1. Simple header with page title');
    console.log('  2. View tabs (ALL, NEEDS REVIEW, UNMATCHED)');
    console.log('  3. Search bar (optional)');
    console.log('  4. Data table with all 10 columns');
    console.log('  5. Minimal actions per row');
    console.log('\nCurrent Implementation Check:\n');

    // Check what's between page title and table
    const headerHeight = await page.evaluate(() => {
      const table = document.querySelector('.bp5-table-container, .opportunities-table, .opportunities-table-enhanced');
      if (!table) return 0;
      return table.getBoundingClientRect().top;
    });

    console.log(`  Distance from top to table: ${headerHeight}px`);
    if (headerHeight > 400) {
      console.log(`  ⚠️  Significant space before table (${headerHeight}px)`);
      console.log(`      Legacy users expect immediate access to data`);
    }

    // Count interactive elements above table
    const interactiveAboveTable = await page.evaluate(() => {
      const table = document.querySelector('.bp5-table-container, .opportunities-table, .opportunities-table-enhanced');
      if (!table) return 0;

      const tableTop = table.getBoundingClientRect().top;
      const interactive = document.querySelectorAll('button:not([aria-hidden="true"]), input, select, a');

      return Array.from(interactive).filter(el => {
        const rect = el.getBoundingClientRect();
        return rect.top < tableTop;
      }).length;
    });

    console.log(`  Interactive elements before table: ${interactiveAboveTable}`);
    if (interactiveAboveTable > 10) {
      console.log(`  ⚠️  Many interactive elements (${interactiveAboveTable})`);
      console.log(`      May overwhelm legacy users`);
    }

    console.log('\n========================================');
    console.log('🎯 ROUNDTABLE CONSENSUS');
    console.log('========================================\n');

    // Take annotated screenshot
    await page.screenshot({ path: 'roundtable-analysis-complete.png', fullPage: true });

    console.log('Analysis complete. Generating recommendations...\n');

    console.log('========================================');
    console.log('END ROUNDTABLE ANALYSIS');
    console.log('========================================\n');

    // This test always passes - it's for analysis
    expect(true).toBeTruthy();
  });

  test('identify specific elements for cleanup', async ({ page }) => {
    console.log('\n========================================');
    console.log('DETAILED ELEMENT INVENTORY');
    console.log('========================================\n');

    await page.goto('http://localhost:3000/collection/DECK-1757517559289/manage');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(2000);

    // Get detailed element inventory
    const inventory = await page.evaluate(() => {
      const sections: any[] = [];

      // Health & Alerts section
      const healthSection = document.querySelector('[class*="health"]');
      if (healthSection) {
        sections.push({
          name: 'Health & Alerts Section',
          element: 'Card/Section',
          purpose: 'System health dashboard',
          legacy: false,
          recommendation: 'Consider removing - not in legacy system'
        });
      }

      // Stats badges
      const statsBadges = document.querySelectorAll('.stats-badges, [class*="kpi"]');
      if (statsBadges.length > 0) {
        sections.push({
          name: 'Stats Badges (Total, Critical, Warning, Optimal)',
          element: 'Tag badges',
          purpose: 'Show aggregate statistics',
          legacy: false,
          recommendation: 'Info available in tabs - potentially redundant'
        });
      }

      // View mode toggle
      const viewToggle = document.querySelector('button[icon="grid-view"]');
      if (viewToggle) {
        sections.push({
          name: 'View Mode Toggle (Table/Cards)',
          element: 'Button group',
          purpose: 'Switch between table and card view',
          legacy: false,
          recommendation: 'Remove - legacy users expect table only'
        });
      }

      // Bulk operations toolbar
      const bulkToolbar = document.querySelector('[class*="bulk"]');
      if (bulkToolbar) {
        sections.push({
          name: 'Bulk Operations Toolbar',
          element: 'Toolbar',
          purpose: 'Bulk edit selected rows',
          legacy: 'uncertain',
          recommendation: 'Verify if part of legacy workflow'
        });
      }

      return sections;
    });

    console.log('📋 Element Inventory:\n');
    inventory.forEach((item: any, index: number) => {
      console.log(`${index + 1}. ${item.name}`);
      console.log(`   Type: ${item.element}`);
      console.log(`   Purpose: ${item.purpose}`);
      console.log(`   Legacy: ${item.legacy}`);
      console.log(`   📝 ${item.recommendation}\n`);
    });

    expect(true).toBeTruthy();
  });
});
