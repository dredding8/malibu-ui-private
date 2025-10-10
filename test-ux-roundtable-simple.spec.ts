import { test } from '@playwright/test';

test('UX roundtable - collection management', async ({ page }) => {
  console.log('\n========== UX ROUNDTABLE ==========');
  console.log('Collection Management Page Analysis\n');

  await page.goto('http://localhost:3000/collection/DECK-1757517559289/manage', { timeout: 60000 });
  await page.waitForLoadState('networkidle');
  await page.waitForTimeout(3000);

  await page.screenshot({ path: 'ux-roundtable-full.png', fullPage: true });

  // Product Designer Analysis
  console.log('=== PRODUCT DESIGNER: Mental Models ===\n');
  
  const mental = await page.evaluate(() => {
    const distractions = [];
    if (document.querySelector('.hub-stats-container')) distractions.push('Health dashboard');
    if (document.querySelectorAll('button[icon*="grid"]').length > 0) distractions.push('View toggle');
    
    const buttons = document.querySelectorAll('button').length;
    const inputs = document.querySelectorAll('input').length;
    const total = buttons + inputs;
    
    return {
      distractions,
      cognitiveLoad: total,
      level: total < 70 ? 'LOW' : 'MODERATE'
    };
  });

  console.log('Cognitive Load: ' + mental.cognitiveLoad + ' (' + mental.level + ')');
  console.log('Distractions: ' + (mental.distractions.length === 0 ? 'None' : mental.distractions.join(', ')));
  console.log('Mental Model: ' + (mental.distractions.length === 0 ? 'ALIGNED' : 'PARTIALLY ALIGNED'));

  // Visual Designer Analysis
  console.log('\n=== VISUAL DESIGNER: Hierarchy ===\n');

  const visual = await page.evaluate(() => {
    const table = document.querySelector('.bp6-table-container');
    const distance = table ? table.getBoundingClientRect().top : 0;
    const dominance = table ? (table.getBoundingClientRect().height / window.innerHeight) * 100 : 0;
    
    return {
      distanceToTable: Math.round(distance),
      tableDominance: Math.round(dominance)
    };
  });

  console.log('Distance to table: ' + visual.distanceToTable + 'px');
  console.log('Table dominance: ' + visual.tableDominance + '%');
  console.log('Assessment: ' + (visual.distanceToTable < 500 ? 'GOOD' : 'NEEDS IMPROVEMENT'));

  // Information Architect Analysis
  console.log('\n=== INFORMATION ARCHITECT: Pathways ===\n');

  const ia = await page.evaluate(() => {
    const tabs = document.querySelectorAll('[role="tab"]').length;
    const allTabTexts = Array.from(document.querySelectorAll('[role="tab"]')).map(t => t.textContent);
    const withCounts = allTabTexts.filter(t => /\(\d+\)/.test(t || '')).length;
    
    return {
      tabs,
      informationScent: withCounts > 0 ? Math.round((withCounts / tabs) * 100) : 0
    };
  });

  console.log('Decision points: ' + ia.tabs + ' tabs');
  console.log('Information scent: ' + ia.informationScent + '%');
  console.log('Complexity: ' + (ia.tabs < 6 ? 'LOW' : 'MODERATE'));

  // UX Copywriter Analysis
  console.log('\n=== UX COPYWRITER: Terminology ===\n');

  const copy = await page.evaluate(() => {
    const allText = Array.from(document.querySelectorAll('[role="tab"]')).map(t => t.textContent);
    
    const legacyTerms = {
      ALL: allText.some(t => t === 'ALL'),
      NEEDS_REVIEW: allText.some(t => t && t.includes('NEEDS REVIEW')),
      UNMATCHED: allText.some(t => t && t.includes('UNMATCHED'))
    };
    
    const count = Object.values(legacyTerms).filter(Boolean).length;
    
    return {
      legacyTermsFound: count,
      totalTerms: 3,
      score: Math.round((count / 3) * 100)
    };
  });

  console.log('Legacy terms found: ' + copy.legacyTermsFound + '/' + copy.totalTerms);
  console.log('Vocabulary score: ' + copy.score + '%');
  console.log('Alignment: ' + (copy.score === 100 ? 'PERFECT' : 'PARTIAL'));

  // Voice & Tone Analysis
  console.log('\n=== VOICE & TONE: Legacy Tone ===\n');

  const tone = await page.evaluate(() => {
    const tabs = Array.from(document.querySelectorAll('[role="tab"]')).map(t => t.textContent?.trim());
    const uppercase = tabs.filter(t => t && t === t.toUpperCase()).length;
    
    return {
      tabs: tabs.length,
      uppercaseTabs: uppercase,
      consistency: tabs.length > 0 ? Math.round((uppercase / tabs.length) * 100) : 0
    };
  });

  console.log('Tabs analyzed: ' + tone.tabs);
  console.log('Uppercase tabs: ' + tone.uppercaseTabs);
  console.log('Tone consistency: ' + tone.consistency + '%');

  // Overall Consensus
  console.log('\n=== ROUNDTABLE CONSENSUS ===\n');

  const scores = {
    productDesigner: mental.distractions.length === 0 && mental.level === 'LOW' ? 100 : 90,
    visualDesigner: visual.distanceToTable < 500 && visual.tableDominance > 60 ? 95 : 85,
    infoArchitect: ia.informationScent > 50 ? 95 : 85,
    copywriter: copy.score,
    voiceTone: tone.consistency > 75 ? 95 : 85
  };

  const overall = Math.round(
    (scores.productDesigner + scores.visualDesigner + scores.infoArchitect + scores.copywriter + scores.voiceTone) / 5
  );

  console.log('Product Designer: ' + scores.productDesigner + '%');
  console.log('Visual Designer: ' + scores.visualDesigner + '%');
  console.log('Info Architect: ' + scores.infoArchitect + '%');
  console.log('UX Copywriter: ' + scores.copywriter + '%');
  console.log('Voice & Tone: ' + scores.voiceTone + '%');
  console.log('\nOVERALL SCORE: ' + overall + '%');
  console.log('RECOMMENDATION: ' + (overall >= 90 ? 'APPROVED' : 'NEEDS MINOR IMPROVEMENTS'));

  console.log('\n========== END ROUNDTABLE ==========\n');
});
