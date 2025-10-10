/**
 * UX Law Compliance Validation
 * Static analysis of component against UX laws
 */

const fs = require('fs');
const path = require('path');

interface ComplianceCheck {
  law: string;
  checks: Array<{
    description: string;
    status: 'pass' | 'fail' | 'warning';
    details: string;
  }>;
  score: number;
}

const validateUXCompliance = () => {
  const componentPath = path.join(__dirname, '../CollectionOpportunitiesRefactored.tsx');
  const componentCode = fs.readFileSync(componentPath, 'utf-8');

  const results: ComplianceCheck[] = [];

  // 1. Fitts's Law - Target Sizes
  const fittsLaw: ComplianceCheck = {
    law: "Fitts's Law",
    checks: [],
    score: 0
  };

  // Check column widths
  const columnWidthMatch = componentCode.match(/columnWidths={?\[([^\]]+)\]/);
  if (columnWidthMatch) {
    const widths = columnWidthMatch[1].split(',').map(w => parseInt(w.trim()));
    const priorityWidth = widths[0];
    fittsLaw.checks.push({
      description: 'Priority column width',
      status: priorityWidth >= 80 ? 'pass' : 'warning',
      details: `Width: ${priorityWidth}px (recommended: 80px+)`
    });
  }

  // Check button sizes
  const hasLargeButtons = componentCode.includes('large={true}') || componentCode.includes('large');
  fittsLaw.checks.push({
    description: 'Button sizing',
    status: hasLargeButtons ? 'pass' : 'warning',
    details: hasLargeButtons ? 'Large buttons implemented' : 'Standard button sizes'
  });

  fittsLaw.score = fittsLaw.checks.filter(c => c.status === 'pass').length / fittsLaw.checks.length * 10;
  results.push(fittsLaw);

  // 2. Hick's Law - Decision Complexity
  const hicksLaw: ComplianceCheck = {
    law: "Hick's Law",
    checks: [],
    score: 0
  };

  // Check number of tabs
  const tabCount = (componentCode.match(/<Tab\s/g) || []).length;
  hicksLaw.checks.push({
    description: 'Tab count',
    status: tabCount <= 4 ? 'pass' : 'warning',
    details: `${tabCount} tabs (optimal: ≤4)`
  });

  // Check context-aware actions
  const hasContextActions = componentCode.includes('getQuickAction') || componentCode.includes('matchStatus');
  hicksLaw.checks.push({
    description: 'Context-aware actions',
    status: hasContextActions ? 'pass' : 'fail',
    details: hasContextActions ? 'Actions adapt to context' : 'Static action set'
  });

  hicksLaw.score = hicksLaw.checks.filter(c => c.status === 'pass').length / hicksLaw.checks.length * 10;
  results.push(hicksLaw);

  // 3. Jakob's Law - Familiar Patterns
  const jakobsLaw: ComplianceCheck = {
    law: "Jakob's Law",
    checks: [],
    score: 0
  };

  // Check keyboard shortcuts
  const shortcuts = [
    { key: 'Ctrl.*A', desc: 'Select All' },
    { key: 'Ctrl.*F', desc: 'Search' },
    { key: 'Escape', desc: 'Clear/Cancel' }
  ];

  shortcuts.forEach(shortcut => {
    const hasShortcut = new RegExp(shortcut.key, 'i').test(componentCode);
    jakobsLaw.checks.push({
      description: `${shortcut.desc} shortcut`,
      status: hasShortcut ? 'pass' : 'fail',
      details: hasShortcut ? 'Implemented' : 'Missing'
    });
  });

  jakobsLaw.score = jakobsLaw.checks.filter(c => c.status === 'pass').length / jakobsLaw.checks.length * 10;
  results.push(jakobsLaw);

  // 4. Miller's Law - Information Chunking
  const millersLaw: ComplianceCheck = {
    law: "Miller's Law",
    checks: [],
    score: 0
  };

  // Check column count
  const columnCount = (componentCode.match(/<Column\s/g) || []).length;
  millersLaw.checks.push({
    description: 'Table columns',
    status: columnCount <= 9 ? 'pass' : 'warning',
    details: `${columnCount} columns (limit: 7±2)`
  });

  // Check site display limiting
  const hasSiteLimit = componentCode.includes('slice(0, 3)') || componentCode.includes('maxVisible');
  millersLaw.checks.push({
    description: 'Site display chunking',
    status: hasSiteLimit ? 'pass' : 'fail',
    details: hasSiteLimit ? 'Limited to 3 visible' : 'All sites shown'
  });

  millersLaw.score = millersLaw.checks.filter(c => c.status === 'pass').length / millersLaw.checks.length * 10;
  results.push(millersLaw);

  // 5. Doherty Threshold - Performance
  const dohertyThreshold: ComplianceCheck = {
    law: "Doherty Threshold",
    checks: [],
    score: 0
  };

  // Check for performance optimizations
  const optimizations = [
    { pattern: 'useMemo', desc: 'Memoization' },
    { pattern: 'debounce', desc: 'Debounced input' },
    { pattern: 'Virtual', desc: 'Virtualization' },
    { pattern: 'useCallback', desc: 'Callback optimization' }
  ];

  optimizations.forEach(opt => {
    const hasOptimization = componentCode.includes(opt.pattern);
    dohertyThreshold.checks.push({
      description: opt.desc,
      status: hasOptimization ? 'pass' : 'warning',
      details: hasOptimization ? 'Implemented' : 'Not found'
    });
  });

  dohertyThreshold.score = dohertyThreshold.checks.filter(c => c.status === 'pass').length / dohertyThreshold.checks.length * 10;
  results.push(dohertyThreshold);

  // 6. Von Restorff Effect - Visual Hierarchy
  const vonRestorff: ComplianceCheck = {
    law: "Von Restorff Effect",
    checks: [],
    score: 0
  };

  // Check for visual differentiation
  const visualElements = [
    { pattern: 'Intent\\.DANGER', desc: 'Critical highlighting' },
    { pattern: 'Intent\\.WARNING', desc: 'Warning indicators' },
    { pattern: 'Intent\\.SUCCESS', desc: 'Success states' },
    { pattern: 'icon=', desc: 'Icon usage' }
  ];

  visualElements.forEach(element => {
    const hasElement = componentCode.includes(element.pattern);
    vonRestorff.checks.push({
      description: element.desc,
      status: hasElement ? 'pass' : 'fail',
      details: hasElement ? 'Present' : 'Missing'
    });
  });

  vonRestorff.score = vonRestorff.checks.filter(c => c.status === 'pass').length / vonRestorff.checks.length * 10;
  results.push(vonRestorff);

  // 7. Peak-End Rule - Positive Completion
  const peakEnd: ComplianceCheck = {
    law: "Peak-End Rule",
    checks: [],
    score: 0
  };

  // Check for success feedback
  const hasToast = componentCode.includes('toast') || componentCode.includes('Toast');
  const hasSuccessFeedback = componentCode.includes('success') && (hasToast || componentCode.includes('notification'));
  
  peakEnd.checks.push({
    description: 'Success notifications',
    status: hasSuccessFeedback ? 'pass' : 'warning',
    details: hasSuccessFeedback ? 'Toast notifications present' : 'Add success feedback'
  });

  peakEnd.score = hasSuccessFeedback ? 9 : 7;
  results.push(peakEnd);

  // 8. Zeigarnik Effect - Progress Indicators
  const zeigarnik: ComplianceCheck = {
    law: "Zeigarnik Effect",
    checks: [],
    score: 0
  };

  const progressIndicators = [
    { pattern: 'ProgressBar', desc: 'Progress bars' },
    { pattern: 'pending.*count|needsReview.*count', desc: 'Count indicators' },
    { pattern: 'Tab.*count|badge', desc: 'Tab badges' }
  ];

  progressIndicators.forEach(indicator => {
    const hasIndicator = new RegExp(indicator.pattern, 'i').test(componentCode);
    zeigarnik.checks.push({
      description: indicator.desc,
      status: hasIndicator ? 'pass' : 'fail',
      details: hasIndicator ? 'Implemented' : 'Missing'
    });
  });

  zeigarnik.score = zeigarnik.checks.filter(c => c.status === 'pass').length / zeigarnik.checks.length * 10;
  results.push(zeigarnik);

  // Calculate overall score
  const overallScore = results.reduce((sum, r) => sum + r.score, 0) / results.length;

  // Display results
  console.log('\n🎯 UX Laws Compliance Validation Results');
  console.log('=====================================\n');

  results.forEach(result => {
    const emoji = result.score >= 9 ? '✅' : result.score >= 7 ? '⚠️' : '❌';
    console.log(`${emoji} ${result.law}: ${result.score.toFixed(1)}/10`);
    
    result.checks.forEach(check => {
      const checkEmoji = check.status === 'pass' ? '✓' : check.status === 'warning' ? '!' : '✗';
      console.log(`   ${checkEmoji} ${check.description}: ${check.details}`);
    });
    console.log('');
  });

  console.log(`\n📊 Overall Compliance Score: ${overallScore.toFixed(1)}/10\n`);

  // Generate report
  const report = {
    timestamp: new Date().toISOString(),
    overallScore: overallScore.toFixed(1),
    results,
    summary: {
      excellent: results.filter(r => r.score >= 9).length,
      good: results.filter(r => r.score >= 7 && r.score < 9).length,
      needsWork: results.filter(r => r.score < 7).length
    }
  };

  // Save report
  const reportPath = path.join(__dirname, '../../../test-results/ux-compliance/validation-report.json');
  const reportDir = path.dirname(reportPath);
  
  if (!fs.existsSync(reportDir)) {
    fs.mkdirSync(reportDir, { recursive: true });
  }
  
  fs.writeFileSync(reportPath, JSON.stringify(report, null, 2));
  console.log(`📁 Report saved to: ${reportPath}\n`);

  return report;
};

// Run validation
validateUXCompliance();