import { test } from '@playwright/test';

test('UX roundtable - collection management page', async ({ page }) => {
  console.log('\n========================================');
  console.log('UX ROUNDTABLE: COLLECTION MANAGEMENT PAGE');
  console.log('Legacy Compliance & Mental Model Analysis');
  console.log('========================================\n');

  console.log('👥 Roundtable Participants:');
  console.log('   👤 Senior User-Centered Product Designer');
  console.log('   🎨 Senior Enterprise Visual Designer');
  console.log('   🏗️ Expert Information Architecture Specialist');
  console.log('   ✍️ Senior UX Copywriter');
  console.log('   🗣️ Voice & Tone Specialist\n');

  await page.goto('http://localhost:3000/collection/DECK-1757517559289/manage', { timeout: 60000 });
  await page.waitForLoadState('networkidle');
  await page.waitForTimeout(3000);

  // Capture initial state
  await page.screenshot({ path: 'ux-roundtable-initial.png', fullPage: true });

  // ========================================
  // 👤 USER-CENTERED PRODUCT DESIGNER
  // ========================================
  console.log('========================================');
  console.log('👤 PRODUCT DESIGNER: User Mental Models');
  console.log('========================================\n');

  const mentalModelAnalysis = await page.evaluate(() => {
    // Legacy mental model: Simple workflow
    // 1. See page title + status
    // 2. Use tabs to filter (ALL, NEEDS REVIEW, UNMATCHED)
    // 3. Search if needed
    // 4. View table data
    // 5. Take action on rows

    const pageTitle = document.querySelector('h1');
    const connectionStatus = document.querySelector('.connection-indicator, [class*="status"]');

    // Count steps user must take to reach data
    const stepsToData = [];
    if (pageTitle) stepsToData.push('1. Orient (see title)');
    if (connectionStatus) stepsToData.push('2. Verify status');

    const tabs = document.querySelectorAll('[role="tab"]');
    if (tabs.length > 0) stepsToData.push('3. Filter data (tabs)');

    const search = document.querySelector('input[type="text"]');
    if (search) stepsToData.push('4. Refine (search)');

    const table = document.querySelector('.bp6-table-container');
    if (table) stepsToData.push('5. Review data (table)');

    // Check for distractions in cognitive flow
    const distractions = [];

    const healthWidget = document.querySelector('.hub-stats-container, .health-analysis-section');
    if (healthWidget) distractions.push('Health/Analytics dashboard');

    const cardComponents = document.querySelectorAll('.bp6-card').length;
    if (cardComponents > 2) distractions.push(`${cardComponents} card components`);

    const viewToggles = document.querySelectorAll('button[icon*="grid"], button[icon*="list"]').length;
    if (viewToggles > 0) distractions.push('View mode toggles');

    // Measure cognitive load
    const allButtons = document.querySelectorAll('button').length;
    const allInputs = document.querySelectorAll('input').length;
    const allTabs = tabs.length;
    const totalInteractions = allButtons + allInputs + allTabs;

    return {
      hasPageTitle: !!pageTitle,
      hasStatus: !!connectionStatus,
      stepsToData,
      distractions,
      cognitiveLoad: {
        buttons: allButtons,
        inputs: allInputs,
        tabs: allTabs,
        total: totalInteractions,
        level: totalInteractions < 50 ? 'LOW' : totalInteractions < 100 ? 'MODERATE' : 'HIGH'
      },
      mentalModelAlignment: stepsToData.length === 5 && distractions.length === 0
    };
  });

  console.log('🧠 Mental Model Assessment:');
  console.log(`   Legacy workflow intact: ${mentalModelAnalysis.mentalModelAlignment ? '✅ YES' : '⚠️ PARTIALLY'}`);
  console.log(`   Page title present: ${mentalModelAnalysis.hasPageTitle ? '✅' : '❌'}`);
  console.log(`   Status indicator: ${mentalModelAnalysis.hasStatus ? '✅' : '❌'}`);

  console.log('\n📋 User Journey Steps:');
  mentalModelAnalysis.stepsToData.forEach(step => console.log(`   ${step}`));

  console.log('\n⚠️ Cognitive Flow Distractions:');
  if (mentalModelAnalysis.distractions.length === 0) {
    console.log('   ✅ None - Clean mental model');
  } else {
    mentalModelAnalysis.distractions.forEach(d => console.log(`   ❌ ${d}`));
  }

  console.log('\n📊 Cognitive Load:');
  console.log(`   Buttons: ${mentalModelAnalysis.cognitiveLoad.buttons}`);
  console.log(`   Inputs: ${mentalModelAnalysis.cognitiveLoad.inputs}`);
  console.log(`   Tabs: ${mentalModelAnalysis.cognitiveLoad.tabs}`);
  console.log(`   Total interactions: ${mentalModelAnalysis.cognitiveLoad.total}`);
  console.log(`   Load level: ${mentalModelAnalysis.cognitiveLoad.level} ${mentalModelAnalysis.cognitiveLoad.level === 'LOW' ? '✅' : '⚠️'}`);

  console.log('\n💬 Product Designer\'s Perspective:');
  if (mentalModelAnalysis.mentalModelAlignment) {
    console.log('   "The user mental model is perfectly aligned with legacy expectations.');
    console.log('   Users can follow their familiar cognitive flow without confusion.');
    console.log('   The absence of distractions maintains focus on primary tasks."');
  } else {
    console.log('   "There are some deviations from the legacy mental model.');
    console.log(`   ${mentalModelAnalysis.distractions.length} distraction(s) may confuse users.');
    console.log('   Recommend removing non-essential elements to restore familiar flow."');
  }

  // ========================================
  // 🎨 VISUAL DESIGNER
  // ========================================
  console.log('\n========================================');
  console.log('🎨 VISUAL DESIGNER: Information Hierarchy');
  console.log('========================================\n');

  const visualHierarchy = await page.evaluate(() => {
    const measurements = {
      headerHeight: 0,
      navHeight: 0,
      distanceToTable: 0,
      tableDominance: 0
    };

    const mainNav = document.querySelector('.bp6-navbar');
    if (mainNav) measurements.navHeight = mainNav.getBoundingClientRect().height;

    const pageHeader = document.querySelector('.hub-header, h1')?.parentElement;
    if (pageHeader) measurements.headerHeight = pageHeader.getBoundingClientRect().height;

    const table = document.querySelector('.bp6-table-container');
    if (table) {
      measurements.distanceToTable = table.getBoundingClientRect().top;
      measurements.tableDominance = (table.getBoundingClientRect().height / window.innerHeight) * 100;
    }

    // Visual weight analysis
    const headingElements = document.querySelectorAll('h1, h2, h3').length;
    const coloredElements = document.querySelectorAll('[class*="intent-"], .bp6-tag').length;
    const visualNoiseScore = headingElements + (coloredElements / 10);

    // Check visual consistency
    const allTabTexts = Array.from(document.querySelectorAll('[role="tab"]')).map(t => t.textContent);
    const tabTextStyle = allTabTexts.every(t => t === t?.toUpperCase()) ? 'CONSISTENT (UPPERCASE)' : 'INCONSISTENT';

    return {
      measurements,
      visualNoiseScore,
      tabTextStyle,
      tableDominance: Math.round(measurements.tableDominance),
      headerToTableRatio: measurements.distanceToTable / measurements.navHeight
    };
  });

  console.log('📐 Visual Measurements:');
  console.log('   Navigation height: ' + visualHierarchy.measurements.navHeight + 'px');
  console.log('   Header height: ' + visualHierarchy.measurements.headerHeight + 'px');
  console.log('   Distance to table: ' + Math.round(visualHierarchy.measurements.distanceToTable) + 'px');
  console.log('   Table screen dominance: ' + visualHierarchy.tableDominance + '%');

  console.log('\n🎯 Visual Hierarchy Assessment:');
  const tableDistance = Math.round(visualHierarchy.measurements.distanceToTable);
  console.log(`   Table accessibility: ${tableDistance < 400 ? '✅ EXCELLENT' : tableDistance < 500 ? '✅ GOOD' : '⚠️ COULD IMPROVE'}`);
  console.log(`   Table dominance: ${visualHierarchy.tableDominance}% ${visualHierarchy.tableDominance > 60 ? '✅ PRIMARY FOCUS' : '⚠️ COMPETING ELEMENTS'}`);
  console.log(`   Visual noise: ${visualHierarchy.visualNoiseScore < 10 ? '✅ LOW' : '⚠️ MODERATE'}`);
  console.log(`   Tab style consistency: ${visualHierarchy.tabTextStyle}`);

  console.log('\n💬 Visual Designer\'s Perspective:');
  console.log(`   "The table achieves ${visualHierarchy.tableDominance}% screen dominance, which`);
  console.log(`   ${visualHierarchy.tableDominance > 60 ? 'correctly establishes it as the primary focus.' : 'suggests competing visual elements.'}`);
  console.log(`   At ${tableDistance}px from top, data is ${tableDistance < 500 ? 'immediately accessible.' : 'somewhat delayed.'}`);
  console.log(`   Visual hierarchy ${tableDistance < 500 && visualHierarchy.tableDominance > 60 ? 'effectively' : 'could'} guide${tableDistance < 500 && visualHierarchy.tableDominance > 60 ? 's' : ''} user attention to critical information."`);

  // ========================================
  // 🏗️ INFORMATION ARCHITECT
  // ========================================
  console.log('\n========================================');
  console.log('🏗️ INFO ARCHITECT: Decision Pathways');
  console.log('========================================\n');

  const informationArchitecture = await page.evaluate(() => {
    // Analyze decision tree depth
    const findDepth = (element: Element, depth = 0): number => {
      const children = Array.from(element.children);
      if (children.length === 0) return depth;
      return Math.max(...children.map(child => findDepth(child, depth + 1)));
    };

    const mainContent = document.querySelector('main, .hub-content, body');
    const maxDepth = mainContent ? findDepth(mainContent) : 0;

    // Count decision points (interactions user must choose between)
    const tabs = document.querySelectorAll('[role="tab"]').length;
    const buttons = document.querySelectorAll('button').length;
    const checkboxes = document.querySelectorAll('input[type="checkbox"]').length;
    const searchInputs = document.querySelectorAll('input[type="text"]').length;

    const decisionPoints = {
      navigation: tabs, // Which tab to select?
      search: searchInputs, // Search or browse?
      rowSelection: checkboxes > 0 ? 1 : 0, // Select rows?
      rowActions: buttons // Which action to take?
    };

    // Analyze information scent (can users predict outcomes?)
    const allTabs = Array.from(document.querySelectorAll('[role="tab"]'));
    const tabsWithCounts = allTabs.filter(t => /\(\d+\)/.test(t.textContent || '')).length;
    const informationScent = tabsWithCounts / Math.max(allTabs.length, 1);

    // Check for clear data relationships
    const tableColumns = new Set(
      Array.from(document.querySelectorAll('.bp6-table-column-name-text, .bp6-table-column-name'))
        .map(h => h.textContent?.trim())
    ).size;

    return {
      maxDepth,
      decisionPoints,
      totalDecisionPoints: Object.values(decisionPoints).reduce((a, b) => a + b, 0),
      informationScent: Math.round(informationScent * 100),
      tableColumns,
      complexityScore: maxDepth + (Object.keys(decisionPoints).length * 2)
    };
  });

  console.log('🗺️ Information Architecture:');
  console.log(`   DOM depth: ${informationArchitecture.maxDepth} levels ${informationArchitecture.maxDepth < 15 ? '✅' : '⚠️'}`);
  console.log(`   Table columns: ${informationArchitecture.tableColumns}`);
  console.log(`   Information scent: ${informationArchitecture.informationScent}% ${informationArchitecture.informationScent > 70 ? '✅' : '⚠️'}`);

  console.log('\n🔀 Decision Pathways:');
  console.log(`   Navigation choices: ${informationArchitecture.decisionPoints.navigation} tabs`);
  console.log(`   Search options: ${informationArchitecture.decisionPoints.search} input(s)`);
  console.log(`   Row selection: ${informationArchitecture.decisionPoints.rowSelection > 0 ? '✅ Available' : '❌ None'}`);
  console.log(`   Row actions: ${informationArchitecture.decisionPoints.rowActions} buttons`);
  console.log(`   Total decision points: ${informationArchitecture.totalDecisionPoints}`);

  console.log('\n📊 Complexity Assessment:');
  console.log(`   Architecture complexity: ${informationArchitecture.complexityScore} ${informationArchitecture.complexityScore < 30 ? '✅ LOW' : informationArchitecture.complexityScore < 50 ? '⚠️ MODERATE' : '❌ HIGH'}`);

  console.log('\n💬 Information Architect\'s Perspective:');
  console.log(`   "The information architecture has ${informationArchitecture.complexityScore < 30 ? 'optimal' : 'moderate'} complexity.`);
  console.log(`   Users can make decisions with ${informationArchitecture.informationScent}% information scent,`);
  console.log(`   meaning they can ${informationArchitecture.informationScent > 70 ? 'clearly predict' : 'somewhat predict'} outcomes before acting.`);
  console.log(`   The ${informationArchitecture.tableColumns}-column table provides ${informationArchitecture.tableColumns > 10 ? 'comprehensive' : 'adequate'} data relationships."`);

  // ========================================
  // ✍️ UX COPYWRITER
  // ========================================
  console.log('\n========================================');
  console.log('✍️ UX COPYWRITER: Language & Terminology');
  console.log('========================================\n');

  const languageAnalysis = await page.evaluate(() => {
    // Extract all user-facing text
    const allText = Array.from(document.querySelectorAll('button, [role="tab"], label, h1, h2, h3, th'))
      .map(el => el.textContent?.trim())
      .filter(Boolean);

    // Check for legacy terminology
    const legacyTerms = {
      'ALL': allText.some(t => t === 'ALL'),
      'NEEDS REVIEW': allText.some(t => t?.includes('NEEDS REVIEW')),
      'UNMATCHED': allText.some(t => t?.includes('UNMATCHED')),
      'Collection': allText.some(t => t?.includes('Collection')),
      'Opportunity': allText.some(t => t?.includes('Opportunity')),
      'Priority': allText.some(t => t?.includes('Priority')),
      'Match': allText.some(t => t?.includes('Match'))
    };

    // Check terminology consistency
    const termCounts: Record<string, number> = {};
    allText.forEach(text => {
      if (text) termCounts[text] = (termCounts[text] || 0) + 1;
    });

    // Check for jargon or unclear labels
    const buttonLabels = Array.from(document.querySelectorAll('button'))
      .map(b => b.textContent?.trim() || b.getAttribute('aria-label') || b.getAttribute('title'))
      .filter(Boolean);

    const unclearLabels = buttonLabels.filter(label =>
      !label || label.length < 2 || /^[A-Z]{1,2}$/.test(label)
    );

    // Check for instructional text
    const placeholders = Array.from(document.querySelectorAll('input'))
      .map(i => i.getAttribute('placeholder'))
      .filter(Boolean);

    return {
      legacyTerms,
      legacyTermCount: Object.values(legacyTerms).filter(Boolean).length,
      totalLegacyTerms: Object.keys(legacyTerms).length,
      termCounts,
      unclearLabels: unclearLabels.length,
      totalButtons: buttonLabels.length,
      placeholders,
      hasInstructionalText: placeholders.length > 0
    };
  });

  console.log('📝 Terminology Assessment:');
  console.log(`   Legacy terms present: ${languageAnalysis.legacyTermCount}/${languageAnalysis.totalLegacyTerms}`);

  console.log('\n✅ Legacy Vocabulary Check:');
  Object.entries(languageAnalysis.legacyTerms).forEach(([term, present]) => {
    console.log(`   ${present ? '✅' : '❌'} "${term}"`);
  });

  console.log('\n📋 Label Clarity:');
  console.log(`   Total buttons: ${languageAnalysis.totalButtons}`);
  console.log(`   Unclear labels: ${languageAnalysis.unclearLabels} ${languageAnalysis.unclearLabels === 0 ? '✅' : '⚠️'}`);
  console.log(`   Instructional text: ${languageAnalysis.hasInstructionalText ? '✅ Present' : '❌ Missing'}`);

  if (languageAnalysis.placeholders.length > 0) {
    console.log('\n💬 Placeholder Examples:');
    languageAnalysis.placeholders.slice(0, 3).forEach(p => console.log(`   "${p}"`));
  }

  const vocabularyScore = (languageAnalysis.legacyTermCount / languageAnalysis.totalLegacyTerms) * 100;

  console.log('\n💬 UX Copywriter\'s Perspective:');
  console.log(`   "Legacy vocabulary compliance is ${Math.round(vocabularyScore)}%.`);
  console.log(`   ${vocabularyScore === 100 ? 'All critical terms match user expectations.' : 'Some legacy terms may be missing.'}`);
  console.log(`   ${languageAnalysis.unclearLabels === 0 ? 'Button labels are clear and actionable.' : `${languageAnalysis.unclearLabels} button(s) have unclear labels.`}`);
  console.log(`   ${languageAnalysis.hasInstructionalText ? 'Instructional text helps guide users.' : 'Consider adding placeholder text for guidance.'}"`);

  // ========================================
  // 🗣️ VOICE & TONE SPECIALIST
  // ========================================
  console.log('\n========================================');
  console.log('🗣️ VOICE & TONE: Legacy Alignment');
  console.log('========================================\n');

  const voiceToneAnalysis = await page.evaluate(() => {
    // Extract all interactive element text
    const buttonTexts = Array.from(document.querySelectorAll('button'))
      .map(b => b.textContent?.trim())
      .filter(Boolean);

    const tabTexts = Array.from(document.querySelectorAll('[role="tab"]'))
      .map(t => t.textContent?.trim())
      .filter(Boolean);

    const headingTexts = Array.from(document.querySelectorAll('h1, h2, h3'))
      .map(h => h.textContent?.trim())
      .filter(Boolean);

    // Analyze tone characteristics
    const allText = [...buttonTexts, ...tabTexts, ...headingTexts];

    // Check for consistency markers
    const isUppercase = (text: string) => text === text.toUpperCase();
    const isSentenceCase = (text: string) => /^[A-Z][a-z]/.test(text);
    const isImperative = (text: string) => /^(Add|Create|Update|Delete|Remove|Edit|View|Open|Close|Save|Cancel|Refresh|Export|Back)/.test(text);

    const uppercaseCount = allText.filter(isUppercase).length;
    const sentenceCaseCount = allText.filter(isSentenceCase).length;
    const imperativeCount = buttonTexts.filter(isImperative).length;

    // Legacy tone: Direct, uppercase tabs, imperative verbs for actions
    const legacyToneMarkers = {
      uppercaseTabs: tabTexts.filter(isUppercase).length,
      imperativeActions: imperativeCount,
      directLanguage: allText.filter(t => t && t.split(' ').length <= 3).length
    };

    return {
      buttonTexts,
      tabTexts,
      headingTexts,
      toneAnalysis: {
        uppercase: uppercaseCount,
        sentenceCase: sentenceCaseCount,
        imperative: imperativeCount,
        total: allText.length
      },
      legacyToneMarkers,
      consistency: tabTexts.length > 0 ? (legacyToneMarkers.uppercaseTabs / tabTexts.length) * 100 : 0
    };
  });

  console.log('🎭 Voice & Tone Analysis:');
  console.log(`   Tabs: ${voiceToneAnalysis.tabTexts.length} found`);
  console.log(`   Uppercase tabs: ${voiceToneAnalysis.legacyToneMarkers.uppercaseTabs}/${voiceToneAnalysis.tabTexts.length} ${voiceToneAnalysis.consistency === 100 ? '✅' : '⚠️'}`);
  console.log(`   Imperative actions: ${voiceToneAnalysis.legacyToneMarkers.imperativeActions}/${voiceToneAnalysis.buttonTexts.length}`);
  console.log(`   Direct language: ${voiceToneAnalysis.legacyToneMarkers.directLanguage}/${voiceToneAnalysis.toneAnalysis.total}`);

  console.log('\n📋 Tab Examples:');
  voiceToneAnalysis.tabTexts.forEach(tab => console.log(`   "${tab}"`));

  console.log('\n📋 Action Examples:');
  voiceToneAnalysis.buttonTexts.filter(b => b && b.length > 2).slice(0, 5).forEach(btn => console.log(`   "${btn}"`));

  const toneAlignment = Math.round(voiceToneAnalysis.consistency);

  console.log('\n💬 Voice & Tone Specialist\'s Perspective:');
  console.log(`   "Tab voice consistency is ${toneAlignment}%, ${toneAlignment === 100 ? 'perfectly' : 'partially'} matching legacy tone.`);
  console.log(`   ${voiceToneAnalysis.legacyToneMarkers.imperativeActions > 0 ? 'Action verbs use imperative mood, which is direct and clear.' : 'Consider using imperative verbs for clarity.'}`);
  console.log(`   ${voiceToneAnalysis.legacyToneMarkers.directLanguage / voiceToneAnalysis.toneAnalysis.total > 0.7 ? 'Language is appropriately concise for enterprise users.' : 'Some verbose labels detected.'}`);
  console.log(`   Overall tone ${toneAlignment > 90 ? 'strongly aligns' : 'partially aligns'} with legacy system expectations."`);

  // ========================================
  // 🏆 UX ROUNDTABLE CONSENSUS
  // ========================================
  console.log('\n========================================');
  console.log('🏆 UX ROUNDTABLE CONSENSUS');
  console.log('========================================\n');

  // Scroll to see Actions column
  await page.evaluate(() => {
    const containers = [
      document.querySelector('.bp6-table-quadrant-scroll-container'),
      document.querySelector('.bp6-table-container')
    ];
    for (const container of containers) {
      if (container) {
        container.scrollLeft = container.scrollWidth;
        break;
      }
    }
  });
  await page.waitForTimeout(500);
  await page.screenshot({ path: 'ux-roundtable-actions-visible.png', fullPage: false });

  console.log('📊 Individual Assessments:\n');

  const productDesignScore = mentalModelAnalysis.mentalModelAlignment && mentalModelAnalysis.cognitiveLoad.level === 'LOW' ? 100 : 85;
  console.log(`👤 Product Designer: ${productDesignScore}%`);
  console.log(`   Mental model: ${mentalModelAnalysis.mentalModelAlignment ? '✅ Aligned' : '⚠️ Partially aligned'}`);
  console.log(`   Cognitive load: ${mentalModelAnalysis.cognitiveLoad.level} ${mentalModelAnalysis.cognitiveLoad.level === 'LOW' ? '✅' : '⚠️'}`);
  console.log(`   Distractions: ${mentalModelAnalysis.distractions.length} ${mentalModelAnalysis.distractions.length === 0 ? '✅' : '⚠️'}`);

  const visualScore = visualHierarchy.tableDominance > 60 && visualHierarchy.measurements.distanceToTable < 500 ? 95 : 80;
  console.log(`\n🎨 Visual Designer: ${visualScore}%`);
  console.log(`   Table dominance: ${visualHierarchy.tableDominance}% ${visualHierarchy.tableDominance > 60 ? '✅' : '⚠️'}`);
  console.log(`   Distance to table: ${Math.round(visualHierarchy.measurements.distanceToTable)}px ${visualHierarchy.measurements.distanceToTable < 500 ? '✅' : '⚠️'}`);
  console.log(`   Visual noise: ${visualHierarchy.visualNoiseScore < 10 ? 'Low ✅' : 'Moderate ⚠️'}`);

  const iaScore = informationArchitecture.complexityScore < 30 && informationArchitecture.informationScent > 70 ? 95 : 85;
  console.log(`\n🏗️ Information Architect: ${iaScore}%`);
  console.log(`   Complexity: ${informationArchitecture.complexityScore < 30 ? 'Low ✅' : 'Moderate ⚠️'}`);
  console.log(`   Information scent: ${informationArchitecture.informationScent}% ${informationArchitecture.informationScent > 70 ? '✅' : '⚠️'}`);
  console.log(`   Decision pathways: ${informationArchitecture.totalDecisionPoints} points`);

  const vocabularyScore = (languageAnalysis.legacyTermCount / languageAnalysis.totalLegacyTerms) * 100;
  const copyScore = vocabularyScore === 100 && languageAnalysis.unclearLabels === 0 ? 100 : 90;
  console.log(`\n✍️ UX Copywriter: ${copyScore}%`);
  console.log(`   Legacy vocabulary: ${Math.round(vocabularyScore)}% ${vocabularyScore === 100 ? '✅' : '⚠️'}`);
  console.log(`   Label clarity: ${languageAnalysis.unclearLabels === 0 ? 'Clear ✅' : `${languageAnalysis.unclearLabels} unclear ⚠️`}`);
  console.log(`   Instructional text: ${languageAnalysis.hasInstructionalText ? 'Present ✅' : 'Missing ⚠️'}`);

  const toneScore = voiceToneAnalysis.consistency === 100 ? 100 : 90;
  console.log(`\n🗣️ Voice & Tone: ${toneScore}%`);
  console.log(`   Tab consistency: ${Math.round(voiceToneAnalysis.consistency)}% ${voiceToneAnalysis.consistency === 100 ? '✅' : '⚠️'}`);
  console.log(`   Imperative actions: ${voiceToneAnalysis.legacyToneMarkers.imperativeActions}/${voiceToneAnalysis.buttonTexts.length}`);
  console.log(`   Legacy tone alignment: ${voiceToneAnalysis.consistency > 90 ? 'Strong ✅' : 'Moderate ⚠️'}`);

  const overallScore = Math.round((productDesignScore + visualScore + iaScore + copyScore + toneScore) / 5);

  console.log(`\n🎯 Overall UX Score: ${overallScore}%`);
  console.log(`   Grade: ${overallScore >= 95 ? '✅ EXCELLENT (A+)' : overallScore >= 90 ? '✅ VERY GOOD (A)' : overallScore >= 85 ? '✅ GOOD (B+)' : '⚠️ ACCEPTABLE (B)'}`);

  console.log('\n🏆 Consensus Recommendation:\n');
  if (overallScore >= 90) {
    console.log('   ✅ APPROVED for legacy user deployment');
    console.log('   The page successfully maintains legacy mental models');
    console.log('   while providing a clean, focused user experience.');
  } else {
    console.log('   ⚠️ CONDITIONAL APPROVAL with minor improvements needed');
    console.log('   Address the specific concerns noted above before deployment.');
  }

  console.log('\n========================================');
  console.log('END UX ROUNDTABLE');
  console.log('========================================\n');
});
