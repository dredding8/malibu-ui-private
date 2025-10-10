import { FullConfig } from '@playwright/test';
import * as fs from 'fs';
import * as path from 'path';

/**
 * Global teardown for empathy-driven testing
 * Generates comprehensive test reports and insights
 */
async function globalTeardown(config: FullConfig) {
  console.log('\n📊 Generating empathy test reports...');
  
  const resultsPath = path.join(process.cwd(), 'test-results/empathy-tests');
  
  try {
    // Read test metrics
    const metricsPath = path.join(resultsPath, 'metrics.json');
    let metrics = JSON.parse(fs.readFileSync(metricsPath, 'utf-8'));
    
    // Read test personas for reference
    const personasPath = path.join(resultsPath, 'test-personas.json');
    const personas = JSON.parse(fs.readFileSync(personasPath, 'utf-8'));
    
    // Generate executive summary
    const summary = {
      testRunDate: metrics.testRun,
      duration: `${(Date.now() - new Date(metrics.testRun).getTime()) / 1000}s`,
      overallPassRate: metrics.totalScenarios > 0 
        ? `${((metrics.passedScenarios / metrics.totalScenarios) * 100).toFixed(1)}%`
        : 'N/A',
      criticalFindings: {
        accessibilityViolations: metrics.accessibilityViolations.length,
        performanceIssues: metrics.performanceIssues.length,
        userExperienceIssues: metrics.userExperienceIssues.length,
      },
      personasCovered: Object.keys(personas).length,
      recommendations: generateRecommendations(metrics),
    };
    
    // Write executive summary
    fs.writeFileSync(
      path.join(resultsPath, 'executive-summary.json'),
      JSON.stringify(summary, null, 2)
    );
    
    // Generate detailed HTML report
    const htmlReport = generateHTMLReport(summary, metrics, personas);
    fs.writeFileSync(
      path.join(resultsPath, 'empathy-test-report.html'),
      htmlReport
    );
    
    // Generate accessibility report
    if (metrics.accessibilityViolations.length > 0) {
      const a11yReport = generateAccessibilityReport(metrics.accessibilityViolations);
      fs.writeFileSync(
        path.join(resultsPath, 'accessibility-report.html'),
        a11yReport
      );
    }
    
    // Clean up temporary files
    cleanupTempFiles(resultsPath);
    
    console.log('✅ Test reports generated successfully');
    console.log(`📄 View report at: ${path.join(resultsPath, 'empathy-test-report.html')}`);
    
    // Print summary to console
    console.log('\n=== EMPATHY TEST SUMMARY ===');
    console.log(`Pass Rate: ${summary.overallPassRate}`);
    console.log(`Duration: ${summary.duration}`);
    console.log(`Critical Issues Found:`);
    console.log(`  - Accessibility: ${summary.criticalFindings.accessibilityViolations}`);
    console.log(`  - Performance: ${summary.criticalFindings.performanceIssues}`);
    console.log(`  - User Experience: ${summary.criticalFindings.userExperienceIssues}`);
    console.log('===========================\n');
    
  } catch (error) {
    console.error('❌ Error generating test reports:', error);
  }
}

function generateRecommendations(metrics: any): string[] {
  const recommendations = [];
  
  if (metrics.accessibilityViolations.length > 0) {
    recommendations.push('Address accessibility violations to ensure WCAG compliance');
  }
  
  if (metrics.performanceIssues.length > 0) {
    recommendations.push('Optimize performance for users on slower connections');
  }
  
  if (metrics.userExperienceIssues.length > 0) {
    recommendations.push('Review UX issues that impact operator efficiency');
  }
  
  if (recommendations.length === 0) {
    recommendations.push('Continue monitoring user experience metrics');
    recommendations.push('Consider adding more edge case scenarios');
  }
  
  return recommendations;
}

function generateHTMLReport(summary: any, metrics: any, personas: any): string {
  return `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Empathy Test Report - ${new Date(summary.testRunDate).toLocaleDateString()}</title>
  <style>
    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
      line-height: 1.6;
      color: #333;
      max-width: 1200px;
      margin: 0 auto;
      padding: 20px;
      background: #f5f5f5;
    }
    .header {
      background: #2c3e50;
      color: white;
      padding: 30px;
      border-radius: 8px;
      margin-bottom: 30px;
    }
    .summary-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
      gap: 20px;
      margin-bottom: 30px;
    }
    .metric-card {
      background: white;
      padding: 20px;
      border-radius: 8px;
      box-shadow: 0 2px 4px rgba(0,0,0,0.1);
    }
    .metric-value {
      font-size: 2em;
      font-weight: bold;
      color: #2c3e50;
    }
    .metric-label {
      color: #666;
      font-size: 0.9em;
    }
    .status-good { color: #27ae60; }
    .status-warning { color: #f39c12; }
    .status-critical { color: #e74c3c; }
    .persona-section {
      background: white;
      padding: 20px;
      border-radius: 8px;
      margin-bottom: 20px;
      box-shadow: 0 2px 4px rgba(0,0,0,0.1);
    }
    .recommendations {
      background: #ecf0f1;
      padding: 20px;
      border-radius: 8px;
      border-left: 4px solid #3498db;
    }
    .issue-list {
      list-style: none;
      padding: 0;
    }
    .issue-item {
      background: #fff;
      padding: 10px;
      margin-bottom: 10px;
      border-radius: 4px;
      border-left: 3px solid #e74c3c;
    }
  </style>
</head>
<body>
  <div class="header">
    <h1>🎯 Empathy Test Report</h1>
    <p>Generated: ${new Date(summary.testRunDate).toLocaleString()}</p>
    <p>Duration: ${summary.duration}</p>
  </div>
  
  <div class="summary-grid">
    <div class="metric-card">
      <div class="metric-value ${getStatusClass(summary.overallPassRate)}">
        ${summary.overallPassRate}
      </div>
      <div class="metric-label">Overall Pass Rate</div>
    </div>
    
    <div class="metric-card">
      <div class="metric-value ${summary.criticalFindings.accessibilityViolations > 0 ? 'status-critical' : 'status-good'}">
        ${summary.criticalFindings.accessibilityViolations}
      </div>
      <div class="metric-label">Accessibility Violations</div>
    </div>
    
    <div class="metric-card">
      <div class="metric-value ${summary.criticalFindings.performanceIssues > 0 ? 'status-warning' : 'status-good'}">
        ${summary.criticalFindings.performanceIssues}
      </div>
      <div class="metric-label">Performance Issues</div>
    </div>
    
    <div class="metric-card">
      <div class="metric-value ${summary.criticalFindings.userExperienceIssues > 0 ? 'status-warning' : 'status-good'}">
        ${summary.criticalFindings.userExperienceIssues}
      </div>
      <div class="metric-label">UX Issues</div>
    </div>
  </div>
  
  <h2>👥 User Personas Tested</h2>
  ${Object.entries(personas).map(([key, persona]: [string, any]) => `
    <div class="persona-section">
      <h3>${persona.name} - ${persona.role}</h3>
      <p><strong>Experience:</strong> ${persona.experience}</p>
      <p><strong>Key Challenges:</strong> ${persona.challenges.join(', ')}</p>
    </div>
  `).join('')}
  
  <h2>💡 Recommendations</h2>
  <div class="recommendations">
    <ul>
      ${summary.recommendations.map((rec: string) => `<li>${rec}</li>`).join('')}
    </ul>
  </div>
  
  ${metrics.accessibilityViolations.length > 0 ? `
    <h2>♿ Accessibility Issues</h2>
    <ul class="issue-list">
      ${metrics.accessibilityViolations.map((issue: any) => `
        <li class="issue-item">
          <strong>${issue.rule}</strong>: ${issue.description}
          <br><small>Impact: ${issue.impact} | Elements: ${issue.nodes}</small>
        </li>
      `).join('')}
    </ul>
  ` : ''}
  
  <footer style="margin-top: 50px; padding-top: 20px; border-top: 1px solid #ddd; text-align: center; color: #666;">
    <p>Generated by Empathy-Driven Testing Framework</p>
  </footer>
</body>
</html>
  `;
}

function getStatusClass(passRate: string): string {
  const rate = parseFloat(passRate);
  if (rate >= 95) return 'status-good';
  if (rate >= 80) return 'status-warning';
  return 'status-critical';
}

function generateAccessibilityReport(violations: any[]): string {
  // Generate detailed accessibility report
  return `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <title>Accessibility Violations Report</title>
  <style>
    body { font-family: Arial, sans-serif; max-width: 1000px; margin: 0 auto; padding: 20px; }
    .violation { background: #fee; padding: 15px; margin: 10px 0; border-radius: 5px; }
    .severity-critical { border-left: 5px solid #d00; }
    .severity-serious { border-left: 5px solid #f60; }
    .severity-moderate { border-left: 5px solid #fa0; }
    .severity-minor { border-left: 5px solid #090; }
  </style>
</head>
<body>
  <h1>Accessibility Violations Report</h1>
  ${violations.map(v => `
    <div class="violation severity-${v.impact}">
      <h3>${v.rule}</h3>
      <p>${v.description}</p>
      <p><strong>Elements affected:</strong> ${v.nodes}</p>
      <p><strong>Fix:</strong> ${v.help}</p>
    </div>
  `).join('')}
</body>
</html>
  `;
}

function cleanupTempFiles(resultsPath: string): void {
  // Clean up any temporary files created during testing
  const tempPatterns = ['*.tmp', '*.log', '.DS_Store'];
  // Implementation would go here
}

export default globalTeardown;