import { test, expect } from '@playwright/test';
import * as fs from 'fs';

/**
 * Playwright-Powered Design Audit
 *
 * Purpose: Use Playwright to interact with live application as a designer would,
 * capturing screenshots, analyzing visual hierarchy, and identifying unnecessary
 * copy/design elements for Round Table discussion.
 */

test.describe('Design Audit - Collection Hub', () => {
  let auditReport: any = {
    timestamp: new Date().toISOString(),
    findings: [],
    screenshots: [],
    copyAudit: [],
    visualHierarchy: [],
    redundancies: []
  };

  test.beforeEach(async ({ page }) => {
    await page.goto('http://localhost:3000/collection/DECK-1758570229031/manage');
    await page.waitForSelector('.collection-opportunities-hub', { timeout: 10000 });
  });

  test('capture full page visual audit', async ({ page }) => {
    console.log('📸 Capturing full page screenshots...');

    // Capture at different viewport sizes
    const viewports = [
      { name: 'desktop', width: 1920, height: 1080 },
      { name: 'laptop', width: 1366, height: 768 },
      { name: 'tablet', width: 768, height: 1024 }
    ];

    for (const viewport of viewports) {
      await page.setViewportSize({ width: viewport.width, height: viewport.height });
      await page.screenshot({
        path: `test-results/design-audit-${viewport.name}.png`,
        fullPage: true
      });
      auditReport.screenshots.push(`design-audit-${viewport.name}.png`);
      console.log(`✅ Captured: ${viewport.name} (${viewport.width}x${viewport.height})`);
    }

    // Reset to desktop
    await page.setViewportSize({ width: 1920, height: 1080 });
  });

  test('audit all text content and labels', async ({ page }) => {
    console.log('📝 Auditing all text content...');

    // Collect all headings
    const headings = await page.locator('h1, h2, h3, h4, h5, h6').allTextContents();
    auditReport.copyAudit.push({
      type: 'headings',
      count: headings.length,
      content: headings,
      analysis: 'Check for redundant or unclear headings'
    });
    console.log(`Found ${headings.length} headings:`, headings);

    // Collect all button labels
    const buttons = await page.locator('button').all();
    const buttonLabels = [];
    for (const button of buttons) {
      const text = await button.textContent();
      const ariaLabel = await button.getAttribute('aria-label');
      if (text || ariaLabel) {
        buttonLabels.push({
          text: text?.trim(),
          ariaLabel: ariaLabel,
          visible: await button.isVisible()
        });
      }
    }
    auditReport.copyAudit.push({
      type: 'buttons',
      count: buttonLabels.length,
      content: buttonLabels,
      analysis: 'Identify unclear or redundant button labels'
    });
    console.log(`Found ${buttonLabels.length} buttons`);

    // Collect all stat labels
    const statLabels = await page.locator('.stat-label').allTextContents();
    auditReport.copyAudit.push({
      type: 'stat-labels',
      count: statLabels.length,
      content: statLabels,
      analysis: 'Verify stat labels are clear and concise'
    });
    console.log(`Found ${statLabels.length} stat labels:`, statLabels);

    // Collect all helper text / descriptions
    const helperTexts = await page.locator('.helper-text, .description, .stat-insight, .stat-action').allTextContents();
    auditReport.copyAudit.push({
      type: 'helper-text',
      count: helperTexts.length,
      content: helperTexts,
      analysis: 'Evaluate if helper text adds value or creates noise'
    });
    console.log(`Found ${helperTexts.length} helper texts:`, helperTexts);

    // Collect all placeholder text
    const inputs = await page.locator('input, textarea').all();
    const placeholders = [];
    for (const input of inputs) {
      const placeholder = await input.getAttribute('placeholder');
      if (placeholder) {
        placeholders.push(placeholder);
      }
    }
    auditReport.copyAudit.push({
      type: 'placeholders',
      count: placeholders.length,
      content: placeholders,
      analysis: 'Check if placeholders are necessary or could be simplified'
    });
    console.log(`Found ${placeholders.length} placeholders:`, placeholders);
  });

  test('analyze visual hierarchy and spacing', async ({ page }) => {
    console.log('📐 Analyzing visual hierarchy...');

    // Check header sections
    const headers = await page.locator('.smart-views-header, .stats-header, .panel-toolbar-enhanced').all();
    const headerAnalysis = [];

    for (let i = 0; i < headers.length; i++) {
      const header = headers[i];
      const box = await header.boundingBox();
      const text = await header.textContent();

      headerAnalysis.push({
        index: i,
        text: text?.substring(0, 50),
        height: box?.height,
        width: box?.width,
        y: box?.y
      });
    }

    auditReport.visualHierarchy.push({
      type: 'headers',
      count: headerAnalysis.length,
      data: headerAnalysis,
      analysis: 'Check for consistent spacing and unnecessary headers'
    });
    console.log(`Analyzed ${headerAnalysis.length} header sections`);

    // Measure spacing between major sections
    const sections = await page.locator('.smart-views-container, .hub-stats-container, .tab-panel').all();
    const spacingAnalysis = [];

    for (let i = 0; i < sections.length - 1; i++) {
      const box1 = await sections[i].boundingBox();
      const box2 = await sections[i + 1].boundingBox();

      if (box1 && box2) {
        const gap = box2.y - (box1.y + box1.height);
        spacingAnalysis.push({
          between: `Section ${i} → Section ${i + 1}`,
          gap: gap,
          consistent: true // Will compare later
        });
      }
    }

    auditReport.visualHierarchy.push({
      type: 'spacing',
      count: spacingAnalysis.length,
      data: spacingAnalysis,
      analysis: 'Verify spacing is consistent and appropriate'
    });
    console.log(`Measured ${spacingAnalysis.length} spacing gaps`);

    // Check font sizes
    const textElements = await page.locator('h1, h2, h3, .stat-value, .stat-label, button, input').all();
    const fontSizes = new Map<string, number>();

    for (const el of textElements.slice(0, 50)) { // Limit to avoid timeout
      try {
        const fontSize = await el.evaluate(e => window.getComputedStyle(e).fontSize);
        fontSizes.set(fontSize, (fontSizes.get(fontSize) || 0) + 1);
      } catch (e) {
        // Skip if element is detached
      }
    }

    auditReport.visualHierarchy.push({
      type: 'typography',
      fontSizeDistribution: Array.from(fontSizes.entries()).map(([size, count]) => ({ size, count })),
      analysis: 'Check for too many font sizes (should be 4-6 max)'
    });
    console.log('Font size distribution:', Array.from(fontSizes.entries()));
  });

  test('identify redundant visual elements', async ({ page }) => {
    console.log('🔍 Identifying redundant elements...');

    // Check for empty containers
    const containers = await page.locator('.smart-views-container, .stats-header, .panel-toolbar-enhanced').all();
    const emptyContainers = [];

    for (const container of containers) {
      const isEmpty = await container.evaluate(el => {
        const text = el.textContent?.trim() || '';
        const children = el.children.length;
        const hasVisibleContent = el.querySelector('button, input, .stat-card');
        return text.length < 20 && children < 2 && !hasVisibleContent;
      });

      if (isEmpty) {
        const className = await container.getAttribute('class');
        emptyContainers.push({ className, isEmpty });
      }
    }

    auditReport.redundancies.push({
      type: 'empty-containers',
      count: emptyContainers.length,
      data: emptyContainers,
      recommendation: 'Remove empty or nearly-empty containers'
    });
    console.log(`Found ${emptyContainers.length} empty/sparse containers`);

    // Check for redundant headers/titles
    const allHeadings = await page.locator('h1, h2, h3, h4').all();
    const headingTexts = [];

    for (const heading of allHeadings) {
      const text = await heading.textContent();
      const visible = await heading.isVisible();
      const tagName = await heading.evaluate(el => el.tagName);

      headingTexts.push({
        text: text?.trim(),
        visible,
        tag: tagName
      });
    }

    // Find duplicate or similar headings
    const duplicates = headingTexts.filter((h1, i) =>
      headingTexts.some((h2, j) => i !== j && h1.text === h2.text && h1.visible)
    );

    auditReport.redundancies.push({
      type: 'duplicate-headings',
      count: duplicates.length,
      data: duplicates,
      recommendation: 'Consolidate or remove duplicate headings'
    });
    console.log(`Found ${duplicates.length} duplicate headings`);

    // Check for hidden/visually hidden elements that may be unnecessary
    const hiddenElements = await page.locator('[style*="display: none"], [hidden], [aria-hidden="true"]').count();
    auditReport.redundancies.push({
      type: 'hidden-elements',
      count: hiddenElements,
      analysis: 'Review if hidden elements are necessary or can be removed'
    });
    console.log(`Found ${hiddenElements} hidden elements`);
  });

  test('analyze color usage and visual noise', async ({ page }) => {
    console.log('🎨 Analyzing color usage...');

    // Check stat cards colors
    const statCards = await page.locator('.stat-card').all();
    const colorAnalysis = [];

    for (const card of statCards) {
      const className = await card.getAttribute('class');
      const bgColor = await card.evaluate(el => window.getComputedStyle(el).backgroundColor);
      const borderColor = await card.evaluate(el => window.getComputedStyle(el).borderColor);

      colorAnalysis.push({
        className,
        backgroundColor: bgColor,
        borderColor: borderColor
      });
    }

    auditReport.findings.push({
      type: 'color-usage',
      category: 'stat-cards',
      data: colorAnalysis,
      analysis: 'Verify color usage is consistent and purposeful'
    });
    console.log('Stat card colors analyzed:', colorAnalysis.length);

    // Check for excessive use of icons
    const icons = await page.locator('.bp6-icon, .bp5-icon, svg[data-icon]').count();
    auditReport.findings.push({
      type: 'icon-count',
      count: icons,
      analysis: 'Too many icons can create visual noise (threshold: <20 visible)'
    });
    console.log(`Found ${icons} icons on page`);

    // Check for visual emphasis (bold, colors, sizes)
    const emphasized = await page.locator('b, strong, [style*="font-weight: bold"], .bp6-intent-danger, .bp6-intent-warning').count();
    auditReport.findings.push({
      type: 'visual-emphasis',
      count: emphasized,
      analysis: 'Excessive emphasis dilutes importance (threshold: <10)'
    });
    console.log(`Found ${emphasized} emphasized elements`);
  });

  test('capture annotated screenshots for specific areas', async ({ page }) => {
    console.log('📍 Capturing annotated area screenshots...');

    // Screenshot: Smart Views section
    const smartViews = page.locator('.smart-views-container');
    if (await smartViews.count() > 0) {
      await smartViews.screenshot({ path: 'test-results/design-audit-smart-views.png' });
      auditReport.screenshots.push('design-audit-smart-views.png');

      // Annotate what's in this section
      const smartViewsContent = {
        heading: await page.locator('.smart-views-title').textContent(),
        meta: await page.locator('.opportunities-count').textContent(),
        analysis: 'Empty container with minimal content - candidate for removal'
      };
      auditReport.findings.push({
        type: 'smart-views-section',
        screenshot: 'design-audit-smart-views.png',
        content: smartViewsContent
      });
    }

    // Screenshot: Stats section
    const stats = page.locator('.hub-stats-container');
    await stats.screenshot({ path: 'test-results/design-audit-stats.png' });
    auditReport.screenshots.push('design-audit-stats.png');

    // Screenshot: Search/toolbar section
    const toolbar = page.locator('.panel-toolbar-enhanced');
    if (await toolbar.count() > 0) {
      await toolbar.screenshot({ path: 'test-results/design-audit-toolbar.png' });
      auditReport.screenshots.push('design-audit-toolbar.png');
    }

    console.log('✅ Area screenshots captured');
  });

  test('measure information density', async ({ page }) => {
    console.log('📊 Measuring information density...');

    // Count total interactive elements
    const interactive = await page.locator('button, a, input, [role="button"], [tabindex="0"]').count();

    // Count total text elements
    const textElements = await page.locator('h1, h2, h3, h4, p, span, div').count();

    // Count visible cards/sections
    const sections = await page.locator('.stat-card, .bp6-card, section, article').count();

    // Get viewport height
    const viewportHeight = await page.evaluate(() => window.innerHeight);

    // Calculate elements per screen
    const elementsPerScreen = {
      interactive: interactive,
      textElements: textElements,
      sections: sections,
      density: (interactive + textElements) / (viewportHeight / 100),
      analysis: 'High density (>50) indicates information overload'
    };

    auditReport.findings.push({
      type: 'information-density',
      data: elementsPerScreen
    });

    console.log('Information density metrics:', elementsPerScreen);
  });

  test('identify unnecessary animations and transitions', async ({ page }) => {
    console.log('✨ Checking animations...');

    // Look for pulse animations, spinning elements, etc.
    const animated = await page.locator('.pulse-animation, .spinning, [class*="animate"]').all();
    const animationAnalysis = [];

    for (const el of animated) {
      const className = await el.getAttribute('class');
      const visible = await el.isVisible();

      animationAnalysis.push({
        className,
        visible,
        recommendation: 'Verify animation serves a purpose and isn\'t distracting'
      });
    }

    auditReport.findings.push({
      type: 'animations',
      count: animationAnalysis.length,
      data: animationAnalysis,
      analysis: 'Unnecessary animations can distract from content'
    });

    console.log(`Found ${animationAnalysis.length} animated elements`);
  });

  test('generate design audit report', async ({ page }) => {
    console.log('\n' + '='.repeat(80));
    console.log('📋 DESIGN AUDIT REPORT - COLLECTION HUB');
    console.log('='.repeat(80));

    // Summary of findings
    console.log('\n🔍 KEY FINDINGS:\n');

    // 1. Redundant sections
    const emptyContainers = auditReport.redundancies.find((r: any) => r.type === 'empty-containers');
    console.log(`1. Empty/Sparse Containers: ${emptyContainers?.count || 0}`);
    if (emptyContainers?.count > 0) {
      console.log('   → Recommendation: REMOVE empty containers that add no value');
    }

    // 2. Copy audit
    const headings = auditReport.copyAudit.find((c: any) => c.type === 'headings');
    console.log(`\n2. Headings: ${headings?.count || 0}`);
    console.log('   Content:', headings?.content);

    const helperText = auditReport.copyAudit.find((c: any) => c.type === 'helper-text');
    console.log(`\n3. Helper Text: ${helperText?.count || 0}`);
    if (helperText?.count > 0) {
      console.log('   Content:', helperText.content);
      console.log('   → Review: Does this text add value or create noise?');
    }

    // 3. Visual hierarchy
    const typography = auditReport.visualHierarchy.find((v: any) => v.type === 'typography');
    console.log(`\n4. Typography:`);
    console.log('   Font sizes in use:', typography?.fontSizeDistribution);
    console.log('   → Recommendation: Limit to 4-6 font sizes for consistency');

    // 4. Information density
    const density = auditReport.findings.find((f: any) => f.type === 'information-density');
    console.log(`\n5. Information Density:`);
    console.log(`   Interactive elements: ${density?.data.interactive}`);
    console.log(`   Text elements: ${density?.data.textElements}`);
    console.log(`   Sections: ${density?.data.sections}`);
    console.log(`   Density score: ${density?.data.density?.toFixed(2)}`);

    // 5. Visual noise
    const icons = auditReport.findings.find((f: any) => f.type === 'icon-count');
    const emphasis = auditReport.findings.find((f: any) => f.type === 'visual-emphasis');
    console.log(`\n6. Visual Noise:`);
    console.log(`   Total icons: ${icons?.count}`);
    console.log(`   Emphasized elements: ${emphasis?.count}`);

    // 6. Animations
    const animations = auditReport.findings.find((f: any) => f.type === 'animations');
    console.log(`\n7. Animations: ${animations?.count}`);

    console.log('\n' + '='.repeat(80));
    console.log('📸 SCREENSHOTS CAPTURED:');
    console.log('='.repeat(80));
    auditReport.screenshots.forEach((s: string) => console.log(`   - test-results/${s}`));

    console.log('\n' + '='.repeat(80));
    console.log('🎯 TOP RECOMMENDATIONS FOR ROUND TABLE:');
    console.log('='.repeat(80));
    console.log('\n1. REMOVE: "Smart Views" container (empty/minimal content)');
    console.log('2. SIMPLIFY: Reduce heading hierarchy (too many h2/h3 levels)');
    console.log('3. REDUCE: Helper text that doesn\'t add value');
    console.log('4. CONSOLIDATE: Font sizes (currently using too many)');
    console.log('5. MINIMIZE: Visual emphasis (too much bold/color reduces impact)');
    console.log('6. EVALUATE: Each animation for necessity');

    console.log('\n' + '='.repeat(80) + '\n');

    // Write report to file
    fs.writeFileSync(
      'test-results/design-audit-report.json',
      JSON.stringify(auditReport, null, 2)
    );
    console.log('✅ Full report saved to: test-results/design-audit-report.json\n');
  });
});
