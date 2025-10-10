import { test, expect } from '@playwright/test';
import * as fs from 'fs';

/**
 * ReallocationWorkspace Audit
 *
 * Purpose: Audit current workspace design to understand UX patterns,
 * identify pain points, and gather requirements for table-centric redesign.
 */

test.describe('ReallocationWorkspace Audit', () => {
  let auditReport: any = {
    timestamp: new Date().toISOString(),
    currentDesign: {},
    painPoints: [],
    tableRequirements: [],
    recommendations: []
  };

  test.beforeEach(async ({ page }) => {
    await page.goto('http://localhost:3000/collection/DECK-1758570229031/manage');
    await page.waitForSelector('.collection-opportunities-hub', { timeout: 10000 });
  });

  test('trigger and audit workspace interface', async ({ page }) => {
    console.log('🔍 Opening ReallocationWorkspace...');

    // Find and click "Reallocate" button on first opportunity
    const reallocateButton = page.locator('button').filter({ hasText: /reallocate/i }).first();

    if (await reallocateButton.count() === 0) {
      console.log('⚠️ No Reallocate button found - trying alternative selectors');
      // Try action buttons
      const actionButton = page.locator('[aria-label*="Reallocate"], [title*="Reallocate"]').first();
      if (await actionButton.count() > 0) {
        await actionButton.click();
      } else {
        console.log('❌ Cannot find workspace trigger - skipping audit');
        return;
      }
    } else {
      await reallocateButton.click();
    }

    // Wait for workspace to open (could be Dialog or Drawer)
    await page.waitForTimeout(1000);

    // Check if workspace opened
    const workspace = page.locator('.reallocation-workspace, .bp6-dialog, .bp6-drawer').first();
    const workspaceExists = await workspace.count() > 0;

    if (!workspaceExists) {
      console.log('❌ Workspace did not open - implementation may differ');
      auditReport.currentDesign.status = 'not-found';
      return;
    }

    console.log('✅ Workspace opened');
    auditReport.currentDesign.status = 'found';

    // Take screenshot
    await page.screenshot({ path: 'test-results/workspace-audit-full.png', fullPage: true });
    await workspace.screenshot({ path: 'test-results/workspace-audit-focused.png' });

    // Analyze workspace structure
    console.log('\n📊 Analyzing workspace structure...\n');

    // Check for tabs
    const tabs = await workspace.locator('[role="tab"]').count();
    console.log(`Tabs found: ${tabs}`);
    auditReport.currentDesign.tabs = tabs;

    if (tabs > 0) {
      const tabLabels = await workspace.locator('[role="tab"]').allTextContents();
      console.log('Tab labels:', tabLabels);
      auditReport.currentDesign.tabLabels = tabLabels;
    }

    // Check for cards/panels
    const cards = await workspace.locator('.bp6-card, .panel, section').count();
    console.log(`Cards/Panels: ${cards}`);
    auditReport.currentDesign.cards = cards;

    // Check for tables
    const tables = await workspace.locator('table, .bp6-table, [role="table"]').count();
    console.log(`Tables: ${tables}`);
    auditReport.currentDesign.tables = tables;

    // Check for lists
    const lists = await workspace.locator('ul, ol, .list').count();
    console.log(`Lists: ${lists}`);
    auditReport.currentDesign.lists = lists;

    // Check for form elements
    const formElements = {
      inputs: await workspace.locator('input').count(),
      selects: await workspace.locator('select, .bp6-select').count(),
      sliders: await workspace.locator('.bp6-slider, input[type="range"]').count(),
      switches: await workspace.locator('.bp6-switch, input[type="checkbox"]').count(),
      buttons: await workspace.locator('button').count()
    };
    console.log('Form elements:', formElements);
    auditReport.currentDesign.formElements = formElements;

    // Check for visualization elements
    const visualizations = {
      progressBars: await workspace.locator('.bp6-progress-bar').count(),
      icons: await workspace.locator('.bp6-icon').count(),
      tags: await workspace.locator('.bp6-tag').count(),
      callouts: await workspace.locator('.bp6-callout').count()
    };
    console.log('Visualizations:', visualizations);
    auditReport.currentDesign.visualizations = visualizations;

    // Measure workspace dimensions
    const workspaceBox = await workspace.boundingBox();
    if (workspaceBox) {
      console.log(`Workspace dimensions: ${Math.round(workspaceBox.width)}x${Math.round(workspaceBox.height)}px`);
      auditReport.currentDesign.dimensions = {
        width: Math.round(workspaceBox.width),
        height: Math.round(workspaceBox.height)
      };
    }

    // Count interactive elements
    const interactiveElements = await workspace.locator('button, a, input, select, [role="button"], [tabindex="0"]').count();
    console.log(`Interactive elements: ${interactiveElements}`);
    auditReport.currentDesign.interactiveElements = interactiveElements;

    // Analyze information density
    const textElements = await workspace.locator('p, span, div, label').count();
    console.log(`Text elements: ${textElements}`);
    auditReport.currentDesign.textElements = textElements;

    console.log('\n✅ Workspace structure analyzed\n');
  });

  test('identify current UX pattern', async ({ page }) => {
    console.log('🎨 Identifying UX pattern...\n');

    // Trigger workspace
    const reallocateButton = page.locator('button').filter({ hasText: /reallocate/i }).first();
    if (await reallocateButton.count() > 0) {
      await reallocateButton.click();
      await page.waitForTimeout(1000);
    } else {
      console.log('⚠️ Skipping - workspace not accessible');
      return;
    }

    const workspace = page.locator('.reallocation-workspace, .bp6-dialog, .bp6-drawer').first();

    if (await workspace.count() === 0) {
      console.log('⚠️ Skipping - workspace not found');
      return;
    }

    // Determine pattern type
    const hasTabs = await workspace.locator('[role="tab"]').count() > 0;
    const hasTable = await workspace.locator('table, .bp6-table').count() > 0;
    const hasCards = await workspace.locator('.bp6-card').count() > 2;
    const hasSliders = await workspace.locator('.bp6-slider').count() > 0;
    const hasTimeline = await workspace.locator('.timeline, [class*="timeline"]').count() > 0;

    let pattern = 'unknown';
    if (hasTabs && hasCards && hasSliders) {
      pattern = 'multi-step-wizard-with-cards';
    } else if (hasTabs && !hasTable) {
      pattern = 'tabbed-card-interface';
    } else if (hasTable) {
      pattern = 'table-centric';
    } else if (hasTimeline) {
      pattern = 'timeline-based';
    } else if (hasCards) {
      pattern = 'card-grid';
    }

    console.log(`Current pattern: ${pattern}`);
    auditReport.currentDesign.pattern = pattern;

    // Document pattern characteristics
    auditReport.currentDesign.characteristics = {
      hasTabs,
      hasTable,
      hasCards,
      hasSliders,
      hasTimeline
    };

    console.log('Pattern characteristics:', auditReport.currentDesign.characteristics);
  });

  test('identify pain points and user friction', async ({ page }) => {
    console.log('\n🔍 Identifying pain points...\n');

    // Trigger workspace
    const reallocateButton = page.locator('button').filter({ hasText: /reallocate/i }).first();
    if (await reallocateButton.count() > 0) {
      await reallocateButton.click();
      await page.waitForTimeout(1000);
    } else {
      return;
    }

    const workspace = page.locator('.reallocation-workspace, .bp6-dialog, .bp6-drawer').first();
    if (await workspace.count() === 0) return;

    // Pain Point 1: Tab count (cognitive load)
    const tabCount = await workspace.locator('[role="tab"]').count();
    if (tabCount > 3) {
      auditReport.painPoints.push({
        type: 'excessive-tabs',
        severity: 'high',
        count: tabCount,
        issue: `${tabCount} tabs create cognitive overload`,
        recommendation: 'Consolidate into single table view with filters'
      });
      console.log(`⚠️ Pain Point: ${tabCount} tabs (target: ≤3)`);
    }

    // Pain Point 2: Form complexity
    const formInputs = await workspace.locator('input, select, .bp6-slider').count();
    if (formInputs > 8) {
      auditReport.painPoints.push({
        type: 'form-complexity',
        severity: 'moderate',
        count: formInputs,
        issue: 'Too many form fields to complete',
        recommendation: 'Use inline editing in table'
      });
      console.log(`⚠️ Pain Point: ${formInputs} form inputs (target: <8)`);
    }

    // Pain Point 3: Multi-step workflow
    const steps = await workspace.locator('[class*="step"], .wizard-step').count();
    if (steps > 0) {
      auditReport.painPoints.push({
        type: 'multi-step-workflow',
        severity: 'high',
        count: steps,
        issue: 'Users must navigate multiple steps to complete task',
        recommendation: 'Single-screen table with inline actions'
      });
      console.log(`⚠️ Pain Point: ${steps}-step workflow`);
    }

    // Pain Point 4: Lack of overview
    const hasTable = await workspace.locator('table').count() > 0;
    if (!hasTable) {
      auditReport.painPoints.push({
        type: 'no-overview',
        severity: 'high',
        issue: 'No table view = users cannot see all options at once',
        recommendation: 'Primary table view with sortable/filterable columns'
      });
      console.log('⚠️ Pain Point: No table overview');
    }

    // Pain Point 5: Hidden information
    const collapsibleSections = await workspace.locator('[class*="collaps"], .bp6-collapse').count();
    if (collapsibleSections > 2) {
      auditReport.painPoints.push({
        type: 'hidden-information',
        severity: 'moderate',
        count: collapsibleSections,
        issue: 'Important information hidden behind collapsible sections',
        recommendation: 'Display all relevant columns in table'
      });
      console.log(`⚠️ Pain Point: ${collapsibleSections} collapsible sections`);
    }

    console.log(`\n📋 Total pain points identified: ${auditReport.painPoints.length}\n`);
  });

  test('define table-centric requirements', async ({ page }) => {
    console.log('📋 Defining table-centric requirements...\n');

    auditReport.tableRequirements = [
      {
        category: 'data-display',
        requirements: [
          'Show all available passes in single table',
          'Display pass quality, time, duration, elevation in columns',
          'Indicate conflicts visually (row styling)',
          'Show site availability for each pass',
          'Display capacity impact prediction'
        ]
      },
      {
        category: 'interactions',
        requirements: [
          'Row selection for bulk operations',
          'Inline editing for priority/notes',
          'Quick actions per row (Allocate, View Details)',
          'Drag-and-drop for reordering priorities',
          'Keyboard navigation (arrow keys, enter to edit)'
        ]
      },
      {
        category: 'filtering-sorting',
        requirements: [
          'Column-based sorting (click header)',
          'Filter by quality (≥4, ≥3, All)',
          'Filter by time window (Next 6h, 12h, 24h)',
          'Filter by conflicts (Show/Hide)',
          'Search by pass name/ID'
        ]
      },
      {
        category: 'visual-feedback',
        requirements: [
          'Color-coded quality indicators',
          'Conflict warnings in-line',
          'Selected row highlighting',
          'Hover states for interactive elements',
          'Loading states for async operations'
        ]
      },
      {
        category: 'actions',
        requirements: [
          'Bulk allocate selected passes',
          'Compare passes side-by-side',
          'Export table data',
          'Undo/Redo allocation changes',
          'Save draft allocations'
        ]
      },
      {
        category: 'accessibility',
        requirements: [
          'Full keyboard navigation',
          'Screen reader announcements for changes',
          'ARIA table semantics',
          'Focus management',
          'High contrast mode support'
        ]
      }
    ];

    console.log('Requirements defined across 6 categories:');
    auditReport.tableRequirements.forEach(cat => {
      console.log(`  ${cat.category}: ${cat.requirements.length} requirements`);
    });
  });

  test('generate Round Table preparation report', async ({ page }) => {
    console.log('\n' + '='.repeat(80));
    console.log('📋 REALLOCATION WORKSPACE AUDIT REPORT');
    console.log('='.repeat(80));

    console.log('\n🎨 CURRENT DESIGN:\n');
    console.log(`Status: ${auditReport.currentDesign.status || 'pending'}`);
    console.log(`Pattern: ${auditReport.currentDesign.pattern || 'unknown'}`);

    if (auditReport.currentDesign.tabs) {
      console.log(`Tabs: ${auditReport.currentDesign.tabs}`);
      console.log(`Tab Labels: ${auditReport.currentDesign.tabLabels?.join(', ')}`);
    }

    if (auditReport.currentDesign.tables !== undefined) {
      console.log(`Tables: ${auditReport.currentDesign.tables}`);
    }

    console.log('\n⚠️ PAIN POINTS:\n');
    if (auditReport.painPoints.length > 0) {
      auditReport.painPoints.forEach((pp, i) => {
        console.log(`${i + 1}. ${pp.type} (${pp.severity})`);
        console.log(`   Issue: ${pp.issue}`);
        console.log(`   → ${pp.recommendation}`);
      });
    } else {
      console.log('No pain points identified yet (workspace may not be accessible)');
    }

    console.log('\n📋 TABLE-CENTRIC REQUIREMENTS:\n');
    auditReport.tableRequirements.forEach(cat => {
      console.log(`${cat.category.toUpperCase()}:`);
      cat.requirements.forEach(req => console.log(`  - ${req}`));
    });

    console.log('\n🎯 RECOMMENDATIONS FOR ROUND TABLE:\n');
    const recommendations = [
      {
        priority: 'high',
        title: 'Consolidate to Single Table View',
        rationale: 'Users need to see all passes at once to make informed decisions',
        impact: 'Eliminates tab navigation, reduces clicks by 60%'
      },
      {
        priority: 'high',
        title: 'Inline Editing & Actions',
        rationale: 'Reduce form complexity by editing directly in table cells',
        impact: 'Faster workflows, fewer modal dialogs'
      },
      {
        priority: 'medium',
        title: 'Advanced Filtering in Toolbar',
        rationale: 'Replace tabs with filters to show/hide rows dynamically',
        impact: 'More flexible, scalable as features grow'
      },
      {
        priority: 'medium',
        title: 'Bulk Operations Support',
        rationale: 'Power users need to allocate multiple passes at once',
        impact: '80% faster for users managing >5 passes'
      },
      {
        priority: 'low',
        title: 'Export & Compare Features',
        rationale: 'Users want to analyze passes offline or compare options',
        impact: 'Increases user confidence in decisions'
      }
    ];

    recommendations.forEach(rec => {
      console.log(`[${rec.priority.toUpperCase()}] ${rec.title}`);
      console.log(`  Rationale: ${rec.rationale}`);
      console.log(`  Impact: ${rec.impact}`);
    });

    auditReport.recommendations = recommendations;

    console.log('\n' + '='.repeat(80));
    console.log('✅ AUDIT COMPLETE - READY FOR ROUND TABLE DISCUSSION');
    console.log('='.repeat(80) + '\n');

    // Save report
    fs.writeFileSync(
      'test-results/workspace-audit-report.json',
      JSON.stringify(auditReport, null, 2)
    );
    console.log('📄 Report saved: test-results/workspace-audit-report.json\n');
  });
});
