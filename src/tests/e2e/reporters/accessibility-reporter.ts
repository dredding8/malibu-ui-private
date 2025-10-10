import type { Reporter, TestCase, TestResult, FullResult } from '@playwright/test/reporter';
import * as fs from 'fs';
import * as path from 'path';

/**
 * Custom reporter for accessibility testing
 * Tracks and reports accessibility violations across all test runs
 */
class AccessibilityReporter implements Reporter {
  private violations: any[] = [];
  private testCount = 0;
  private passedTests = 0;
  private outputPath: string;

  constructor(options: { outputFolder?: string } = {}) {
    this.outputPath = options.outputFolder || 'test-results/empathy-tests';
  }

  onBegin(config: any, suite: any) {
    console.log(`🔍 Accessibility Reporter: Monitoring ${suite.allTests().length} tests`);
    this.violations = [];
    this.testCount = 0;
    this.passedTests = 0;
  }

  onTestEnd(test: TestCase, result: TestResult) {
    this.testCount++;
    
    if (result.status === 'passed') {
      this.passedTests++;
    }
    
    // Extract accessibility violations from test results
    result.attachments.forEach(attachment => {
      if (attachment.name === 'accessibility-violations') {
        try {
          const violations = JSON.parse(attachment.body?.toString() || '[]');
          violations.forEach((violation: any) => {
            this.violations.push({
              test: test.title,
              file: test.location.file,
              ...violation,
            });
          });
        } catch (e) {
          console.error('Failed to parse accessibility violations:', e);
        }
      }
    });
    
    // Check for console warnings about accessibility
    result.stderr.forEach(line => {
      if (line.includes('accessibility') || line.includes('ARIA') || line.includes('contrast')) {
        this.violations.push({
          test: test.title,
          file: test.location.file,
          type: 'console-warning',
          message: line,
        });
      }
    });
  }

  async onEnd(result: FullResult) {
    // Update metrics file
    const metricsPath = path.join(this.outputPath, 'metrics.json');
    try {
      let metrics = JSON.parse(fs.readFileSync(metricsPath, 'utf-8'));
      metrics.totalScenarios = this.testCount;
      metrics.passedScenarios = this.passedTests;
      metrics.failedScenarios = this.testCount - this.passedTests;
      metrics.accessibilityViolations = this.violations;
      
      fs.writeFileSync(metricsPath, JSON.stringify(metrics, null, 2));
    } catch (e) {
      console.error('Failed to update metrics:', e);
    }
    
    // Generate accessibility summary
    const summary = this.generateSummary();
    console.log(summary);
    
    // Save detailed violations
    if (this.violations.length > 0) {
      const violationsPath = path.join(this.outputPath, 'accessibility-violations.json');
      fs.writeFileSync(violationsPath, JSON.stringify(this.violations, null, 2));
      
      console.log(`\n⚠️  Found ${this.violations.length} accessibility issues`);
      console.log(`📄 Details saved to: ${violationsPath}`);
    } else {
      console.log('\n✅ No accessibility violations found!');
    }
  }

  private generateSummary(): string {
    const violationsByType: { [key: string]: number } = {};
    const violationsBySeverity: { [key: string]: number } = {};
    
    this.violations.forEach(v => {
      // Count by type
      const type = v.rule || v.type || 'unknown';
      violationsByType[type] = (violationsByType[type] || 0) + 1;
      
      // Count by severity
      const severity = v.impact || v.severity || 'unknown';
      violationsBySeverity[severity] = (violationsBySeverity[severity] || 0) + 1;
    });
    
    let summary = '\n=== ACCESSIBILITY SUMMARY ===\n';
    summary += `Total Tests: ${this.testCount}\n`;
    summary += `Passed: ${this.passedTests}\n`;
    summary += `Total Violations: ${this.violations.length}\n`;
    
    if (this.violations.length > 0) {
      summary += '\nViolations by Type:\n';
      Object.entries(violationsByType)
        .sort((a, b) => b[1] - a[1])
        .forEach(([type, count]) => {
          summary += `  - ${type}: ${count}\n`;
        });
      
      summary += '\nViolations by Severity:\n';
      Object.entries(violationsBySeverity)
        .sort((a, b) => {
          const order = { critical: 0, serious: 1, moderate: 2, minor: 3, unknown: 4 };
          return (order[a[0] as keyof typeof order] || 4) - (order[b[0] as keyof typeof order] || 4);
        })
        .forEach(([severity, count]) => {
          summary += `  - ${severity}: ${count}\n`;
        });
    }
    
    summary += '===========================\n';
    return summary;
  }
}

export default AccessibilityReporter;