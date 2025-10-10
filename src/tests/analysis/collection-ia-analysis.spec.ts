import { test, expect } from '@playwright/test';
import * as fs from 'fs';
import * as path from 'path';

test.describe('Collection Management IA & Cognitive Load Analysis', () => {
  test('analyze information architecture and cognitive load', async ({ page }) => {
    const analysis = {
      timestamp: new Date().toISOString(),
      url: 'http://localhost:3000/collection/DECK-1758570229031/manage',
      metrics: {
        visualHierarchy: [],
        cognitiveLoad: {},
        informationDensity: {},
        navigationComplexity: {},
        jtbdCompliance: {}
      },
      criticalFindings: [],
      recommendations: []
    };

    // Navigate and wait for full load
    await page.goto('http://localhost:3000/collection/DECK-1758570229031/manage');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(2000);

    // 1. Visual Hierarchy Analysis
    console.log('\n=== VISUAL HIERARCHY ANALYSIS ===');

    const headings = await page.locator('h1, h2, h3, h4, h5, h6').all();
    const headingData = [];
    for (const heading of headings) {
      const tagName = await heading.evaluate(el => el.tagName);
      const text = await heading.textContent();
      const isVisible = await heading.isVisible();
      headingData.push({ tagName, text: text?.trim(), isVisible });
    }
    analysis.metrics.visualHierarchy = headingData;
    console.log('Headings found:', headingData.length);
    headingData.forEach(h => console.log(`  ${h.tagName}: "${h.text}" (visible: ${h.isVisible})`));

    // 2. Cognitive Load Assessment
    console.log('\n=== COGNITIVE LOAD ASSESSMENT ===');

    // Count interactive elements
    const buttons = await page.locator('button').count();
    const inputs = await page.locator('input, textarea, select').count();
    const links = await page.locator('a').count();
    const tables = await page.locator('table').count();
    const forms = await page.locator('form').count();

    analysis.metrics.cognitiveLoad = {
      interactiveElements: buttons + inputs + links,
      buttons,
      inputs,
      links,
      tables,
      forms,
      assessment: ''
    };

    const totalInteractive = buttons + inputs + links;
    console.log('Interactive Elements:');
    console.log(`  Buttons: ${buttons}`);
    console.log(`  Inputs: ${inputs}`);
    console.log(`  Links: ${links}`);
    console.log(`  Tables: ${tables}`);
    console.log(`  Forms: ${forms}`);
    console.log(`  Total Interactive: ${totalInteractive}`);

    // Assess cognitive load
    if (totalInteractive > 50) {
      analysis.metrics.cognitiveLoad.assessment = 'HIGH - May overwhelm users with choices';
      analysis.criticalFindings.push('Excessive interactive elements detected (>50)');
    } else if (totalInteractive > 30) {
      analysis.metrics.cognitiveLoad.assessment = 'MODERATE - Consider grouping related actions';
    } else {
      analysis.metrics.cognitiveLoad.assessment = 'OPTIMAL - Manageable number of interactions';
    }

    // 3. Information Density Analysis
    console.log('\n=== INFORMATION DENSITY ANALYSIS ===');

    const textContent = await page.textContent('body');
    const wordCount = textContent?.split(/\s+/).length || 0;
    const viewportSize = await page.viewportSize();
    const density = viewportSize ? wordCount / (viewportSize.width * viewportSize.height / 1000) : 0;

    analysis.metrics.informationDensity = {
      wordCount,
      viewportSize,
      density: density.toFixed(2),
      assessment: ''
    };

    console.log(`Word Count: ${wordCount}`);
    console.log(`Density: ${density.toFixed(2)} words per 1000px²`);

    if (density > 15) {
      analysis.metrics.informationDensity.assessment = 'HIGH - Text-heavy, may cause fatigue';
      analysis.criticalFindings.push('High information density detected');
    } else if (density > 10) {
      analysis.metrics.informationDensity.assessment = 'MODERATE - Consider progressive disclosure';
    } else {
      analysis.metrics.informationDensity.assessment = 'OPTIMAL - Good balance of content and whitespace';
    }

    // 4. Navigation & Structure Analysis
    console.log('\n=== NAVIGATION & STRUCTURE ANALYSIS ===');

    const tabs = await page.locator('[role="tab"], .bp5-tab').count();
    const panels = await page.locator('[role="tabpanel"], .bp5-tab-panel').count();
    const sections = await page.locator('section, [role="region"]').count();
    const navItems = await page.locator('nav a, nav button').count();

    analysis.metrics.navigationComplexity = {
      tabs,
      panels,
      sections,
      navItems,
      maxNestingDepth: 0,
      assessment: ''
    };

    console.log(`Tabs: ${tabs}`);
    console.log(`Panels: ${panels}`);
    console.log(`Sections: ${sections}`);
    console.log(`Nav Items: ${navItems}`);

    // Calculate max nesting depth
    const maxDepth = await page.evaluate(() => {
      const getDepth = (element: Element): number => {
        let depth = 0;
        let parent = element.parentElement;
        while (parent) {
          depth++;
          parent = parent.parentElement;
        }
        return depth;
      };

      const allElements = Array.from(document.querySelectorAll('*'));
      return Math.max(...allElements.map(getDepth));
    });

    analysis.metrics.navigationComplexity.maxNestingDepth = maxDepth;
    console.log(`Max Nesting Depth: ${maxDepth}`);

    if (maxDepth > 20) {
      analysis.metrics.navigationComplexity.assessment = 'COMPLEX - Deep nesting may impact comprehension';
      analysis.criticalFindings.push('Excessive DOM nesting detected (>20 levels)');
    } else if (maxDepth > 15) {
      analysis.metrics.navigationComplexity.assessment = 'MODERATE - Monitor nesting levels';
    } else {
      analysis.metrics.navigationComplexity.assessment = 'OPTIMAL - Reasonable structure depth';
    }

    // 5. JTBD Compliance Analysis
    console.log('\n=== JTBD COMPLIANCE ANALYSIS ===');

    // Check for key JTBD elements
    const hasCollectionInfo = await page.locator('text=/collection|deck/i').count() > 0;
    const hasStatusIndicators = await page.locator('text=/active|inactive|status/i').count() > 0;
    const hasActionButtons = await page.locator('button:has-text("Edit"), button:has-text("Delete"), button:has-text("Export")').count() > 0;
    const hasSearchFilter = await page.locator('input[type="search"], input[placeholder*="search" i]').count() > 0;
    const hasBulkActions = await page.locator('text=/bulk|select all|batch/i').count() > 0;

    analysis.metrics.jtbdCompliance = {
      hasCollectionInfo,
      hasStatusIndicators,
      hasActionButtons,
      hasSearchFilter,
      hasBulkActions,
      score: 0
    };

    const jtbdScore = [hasCollectionInfo, hasStatusIndicators, hasActionButtons, hasSearchFilter, hasBulkActions]
      .filter(Boolean).length / 5 * 100;

    analysis.metrics.jtbdCompliance.score = jtbdScore;
    console.log('JTBD Elements Present:');
    console.log(`  Collection Info: ${hasCollectionInfo ? '✅' : '❌'}`);
    console.log(`  Status Indicators: ${hasStatusIndicators ? '✅' : '❌'}`);
    console.log(`  Action Buttons: ${hasActionButtons ? '✅' : '❌'}`);
    console.log(`  Search/Filter: ${hasSearchFilter ? '✅' : '❌'}`);
    console.log(`  Bulk Actions: ${hasBulkActions ? '✅' : '❌'}`);
    console.log(`  JTBD Score: ${jtbdScore}%`);

    if (jtbdScore < 60) {
      analysis.criticalFindings.push('Low JTBD compliance - missing key user workflow elements');
    }

    // 6. Critical Questions Analysis
    console.log('\n=== CRITICAL QUESTIONS ANALYSIS ===');

    // Q1: Simultaneous vs Sequential Comparison
    const hasMultiplePassViews = await page.locator('[role="tabpanel"]:visible, .pass-comparison').count();
    const hasComparisonControls = await page.locator('text=/compare|side.by.side/i').count() > 0;

    console.log('Q1: Pass Comparison Pattern');
    console.log(`  Multiple views visible: ${hasMultiplePassViews}`);
    console.log(`  Comparison controls: ${hasComparisonControls ? 'Yes' : 'No'}`);

    if (hasMultiplePassViews > 2) {
      analysis.criticalFindings.push('CRITICAL: Simultaneous multi-pass comparison may cause split attention');
      analysis.recommendations.push('Consider sequential comparison with quick toggle between passes');
    }

    // Q2: Override Reason Dropdowns
    const dropdowns = await page.locator('select, [role="combobox"]').count();
    const hasOverrideUI = await page.locator('text=/override|reason/i').count() > 0;

    console.log('Q2: Override Reason Structure');
    console.log(`  Dropdown controls: ${dropdowns}`);
    console.log(`  Override UI present: ${hasOverrideUI ? 'Yes' : 'No'}`);

    if (hasOverrideUI && dropdowns > 5) {
      analysis.recommendations.push('Review override reason dropdowns - balance consistency with flexibility');
    }

    // Q3: Export Format Complexity
    const hasExportButton = await page.locator('button:has-text("Export"), button:has-text("Download")').count() > 0;
    const hasExportOptions = await page.locator('text=/format|csv|json|excel/i').count() > 0;

    console.log('Q3: Export Format Design');
    console.log(`  Export button: ${hasExportButton ? 'Yes' : 'No'}`);
    console.log(`  Format options: ${hasExportOptions ? 'Yes' : 'No'}`);

    if (hasExportOptions) {
      analysis.recommendations.push('Validate export format complexity - ensure simple default with advanced options hidden');
    }

    // 7. Accessibility Quick Check
    console.log('\n=== ACCESSIBILITY SCAN ===');

    const missingAltText = await page.locator('img:not([alt])').count();
    const missingLabels = await page.locator('input:not([aria-label]):not([aria-labelledby]):not([id])').count();
    const lowContrast = await page.locator('[style*="color: #ccc"], [style*="color: #ddd"]').count();

    console.log(`Missing alt text: ${missingAltText}`);
    console.log(`Missing input labels: ${missingLabels}`);
    console.log(`Potential low contrast: ${lowContrast}`);

    if (missingAltText > 0 || missingLabels > 0) {
      analysis.criticalFindings.push('Accessibility issues detected - missing labels or alt text');
    }

    // Generate final recommendations
    console.log('\n=== RECOMMENDATIONS ===');

    if (analysis.criticalFindings.length === 0) {
      analysis.recommendations.push('Overall IA is solid - focus on incremental improvements');
    } else {
      analysis.recommendations.push('Address critical findings before additional features');
    }

    if (totalInteractive > 30) {
      analysis.recommendations.push('Group related actions into menus or progressive disclosure patterns');
    }

    if (density > 10) {
      analysis.recommendations.push('Implement progressive disclosure for dense information areas');
    }

    analysis.recommendations.forEach((rec, i) => {
      console.log(`${i + 1}. ${rec}`);
    });

    // Take screenshot for reference
    await page.screenshot({
      path: '/Users/damon/malibu/src/tests/analysis/collection-route-screenshot.png',
      fullPage: true
    });

    // Save analysis report
    const reportPath = '/Users/damon/malibu/src/tests/analysis/collection-ia-report.json';
    fs.writeFileSync(reportPath, JSON.stringify(analysis, null, 2));
    console.log(`\n✅ Analysis complete. Report saved to: ${reportPath}`);

    // Output summary
    console.log('\n=== SUMMARY ===');
    console.log(`Critical Findings: ${analysis.criticalFindings.length}`);
    console.log(`Recommendations: ${analysis.recommendations.length}`);
    console.log(`JTBD Score: ${jtbdScore}%`);
    console.log(`Cognitive Load: ${analysis.metrics.cognitiveLoad.assessment}`);
    console.log(`Information Density: ${analysis.metrics.informationDensity.assessment}`);
  });
});
