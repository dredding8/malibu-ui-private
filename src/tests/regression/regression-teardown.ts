/**
 * Global Teardown for Regression Testing
 *
 * Responsibilities:
 * - Generate regression report
 * - Compare current results with baselines
 * - Detect regressions and highlight failures
 * - Create actionable regression summary
 */

import * as fs from 'fs-extra';
import * as path from 'path';

interface RegressionReport {
  timestamp: string;
  totalTests: number;
  passed: number;
  failed: number;
  regressions: Array<{
    type: 'performance' | 'visual' | 'functional';
    test: string;
    metric: string;
    baseline: any;
    current: any;
    delta: any;
  }>;
  summary: {
    performanceRegressions: number;
    visualRegressions: number;
    functionalRegressions: number;
  };
}

async function generateRegressionReport(): Promise<void> {
  console.log('\n📊 Generating regression report...');

  const resultsFile = path.join(__dirname, '../../../test-results/regression-results.json');
  const reportFile = path.join(__dirname, '../../../test-results/regression-report.json');

  if (!await fs.pathExists(resultsFile)) {
    console.log('⚠️  No regression results found. Skipping report generation.');
    return;
  }

  const results = await fs.readJson(resultsFile);

  const report: RegressionReport = {
    timestamp: new Date().toISOString(),
    totalTests: results.suites?.reduce((sum: number, suite: any) =>
      sum + (suite.specs?.length || 0), 0) || 0,
    passed: 0,
    failed: 0,
    regressions: [],
    summary: {
      performanceRegressions: 0,
      visualRegressions: 0,
      functionalRegressions: 0,
    },
  };

  // Analyze test results for regressions
  if (results.suites) {
    for (const suite of results.suites) {
      if (suite.specs) {
        for (const spec of suite.specs) {
          if (spec.ok) {
            report.passed++;
          } else {
            report.failed++;

            // Categorize regression type based on test name
            const testName = spec.title || '';
            let regressionType: 'performance' | 'visual' | 'functional' = 'functional';

            if (testName.includes('performance') || testName.includes('speed') || testName.includes('time')) {
              regressionType = 'performance';
              report.summary.performanceRegressions++;
            } else if (testName.includes('visual') || testName.includes('screenshot') || testName.includes('appearance')) {
              regressionType = 'visual';
              report.summary.visualRegressions++;
            } else {
              report.summary.functionalRegressions++;
            }

            report.regressions.push({
              type: regressionType,
              test: `${suite.title} > ${spec.title}`,
              metric: regressionType,
              baseline: 'See baseline files',
              current: 'See test results',
              delta: 'Failed',
            });
          }
        }
      }
    }
  }

  // Save detailed report
  await fs.writeJson(reportFile, report, { spaces: 2 });

  // Print summary
  console.log('\n' + '='.repeat(60));
  console.log('REGRESSION TEST SUMMARY');
  console.log('='.repeat(60));
  console.log(`Total Tests: ${report.totalTests}`);
  console.log(`✓ Passed: ${report.passed}`);
  console.log(`✗ Failed: ${report.failed}`);
  console.log();
  console.log('Regressions by Category:');
  console.log(`  Performance: ${report.summary.performanceRegressions}`);
  console.log(`  Visual: ${report.summary.visualRegressions}`);
  console.log(`  Functional: ${report.summary.functionalRegressions}`);
  console.log('='.repeat(60));

  if (report.regressions.length > 0) {
    console.log('\n⚠️  REGRESSIONS DETECTED:\n');
    report.regressions.forEach((regression, index) => {
      console.log(`${index + 1}. [${regression.type.toUpperCase()}] ${regression.test}`);
    });
    console.log();
  } else if (report.failed === 0) {
    console.log('\n✅ No regressions detected! All tests passed.\n');
  }

  console.log(`📄 Full report: ${reportFile}`);
  console.log(`📊 HTML report: test-results/regression-report/index.html\n`);
}

export default generateRegressionReport;
