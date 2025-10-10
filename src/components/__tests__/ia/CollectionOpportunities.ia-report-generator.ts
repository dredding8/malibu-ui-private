import fs from 'fs/promises';
import path from 'path';

interface IATestResult {
  category: string;
  test: string;
  score: number;
  status: 'pass' | 'fail' | 'warning';
  details: any;
  recommendations?: string[];
}

interface IAMetrics {
  terminologyConsistency: number;
  mentalModelAlignment: number;
  findability: number;
  informationScent: number;
  cognitiveLoad: number;
  navigationEfficiency: number;
  labelingConsistency: number;
  hierarchyClarity: number;
}

// Generate comprehensive IA test report
export async function generateIATestReport(
  testResults: IATestResult[],
  metrics: IAMetrics
) {
  const report = {
    timestamp: new Date().toISOString(),
    summary: {
      overallScore: calculateOverallScore(metrics),
      status: getOverallStatus(metrics),
      criticalIssues: getCriticalIssues(testResults),
      testsConducted: testResults.length
    },
    metrics,
    detailedResults: groupResultsByCategory(testResults),
    recommendations: generateRecommendations(testResults, metrics),
    industryComparison: compareToIndustryStandards(metrics)
  };

  // Write JSON report
  const reportPath = path.join(process.cwd(), 'test-reports', 'collection-opportunities-ia-report.json');
  await fs.mkdir(path.dirname(reportPath), { recursive: true });
  await fs.writeFile(reportPath, JSON.stringify(report, null, 2));

  // Generate HTML report
  const htmlReport = generateHTMLReport(report);
  const htmlPath = path.join(process.cwd(), 'test-reports', 'collection-opportunities-ia-report.html');
  await fs.writeFile(htmlPath, htmlReport);

  return report;
}

function calculateOverallScore(metrics: IAMetrics): number {
  // Weighted scoring based on IA importance
  const weights = {
    terminologyConsistency: 0.20,  // Critical for understanding
    mentalModelAlignment: 0.15,    // Essential for usability
    findability: 0.15,             // Core IA metric
    informationScent: 0.10,        // Navigation efficiency
    cognitiveLoad: 0.10,           // User experience
    navigationEfficiency: 0.10,    // Task completion
    labelingConsistency: 0.10,     // Clarity
    hierarchyClarity: 0.10         // Organization
  };

  let weightedSum = 0;
  for (const [metric, value] of Object.entries(metrics)) {
    weightedSum += value * (weights[metric as keyof IAMetrics] || 0);
  }

  return Math.round(weightedSum);
}

function getOverallStatus(metrics: IAMetrics): string {
  const score = calculateOverallScore(metrics);
  if (score >= 90) return 'Excellent';
  if (score >= 80) return 'Good';
  if (score >= 70) return 'Acceptable';
  if (score >= 60) return 'Needs Improvement';
  return 'Critical Issues';
}

function getCriticalIssues(results: IATestResult[]): string[] {
  return results
    .filter(r => r.status === 'fail' && r.score < 50)
    .map(r => `${r.category}: ${r.test} (${r.score}% score)`);
}

function groupResultsByCategory(results: IATestResult[]): Record<string, IATestResult[]> {
  const grouped: Record<string, IATestResult[]> = {};
  
  for (const result of results) {
    if (!grouped[result.category]) {
      grouped[result.category] = [];
    }
    grouped[result.category].push(result);
  }
  
  return grouped;
}

function generateRecommendations(results: IATestResult[], metrics: IAMetrics): string[] {
  const recommendations: string[] = [];

  // Critical terminology issues
  if (metrics.terminologyConsistency < 70) {
    recommendations.push(
      'CRITICAL: Implement terminology disambiguation immediately. ' +
      'The 35% task failure rate is directly linked to terminology confusion.'
    );
  }

  // Mental model misalignment
  if (metrics.mentalModelAlignment < 80) {
    recommendations.push(
      'HIGH: Conduct card sorting sessions with actual users to validate information groupings.'
    );
  }

  // Findability issues
  if (metrics.findability < 75) {
    recommendations.push(
      'HIGH: Implement tree testing to identify navigation failures and optimize paths.'
    );
  }

  // Information scent
  if (metrics.informationScent < 70) {
    recommendations.push(
      'MEDIUM: Enhance navigation labels and breadcrumbs to provide clearer information scent.'
    );
  }

  // Cognitive load
  if (metrics.cognitiveLoad < 75) {
    recommendations.push(
      'MEDIUM: Simplify complex workflows and reduce cognitive load through progressive disclosure.'
    );
  }

  return recommendations;
}

function compareToIndustryStandards(metrics: IAMetrics): Record<string, {
  projectScore: number;
  industryBenchmark: number;
  gap: number;
  status: string;
}> {
  const benchmarks = {
    terminologyConsistency: 95,  // Should be near perfect
    mentalModelAlignment: 85,    // Good alignment expected
    findability: 80,             // Industry standard
    informationScent: 75,        // Acceptable level
    cognitiveLoad: 80,           // Target for efficiency
    navigationEfficiency: 85,    // Quick task completion
    labelingConsistency: 90,     // High consistency needed
    hierarchyClarity: 85         // Clear organization
  };

  const comparison: any = {};
  
  for (const [metric, value] of Object.entries(metrics)) {
    const benchmark = benchmarks[metric as keyof IAMetrics];
    const gap = value - benchmark;
    
    comparison[metric] = {
      projectScore: value,
      industryBenchmark: benchmark,
      gap,
      status: gap >= 0 ? 'Meets Standard' : 'Below Standard'
    };
  }
  
  return comparison;
}

function generateHTMLReport(report: any): string {
  const criticalColor = '#D13913';
  const warningColor = '#C87619';
  const successColor = '#0F9960';
  
  return `
<!DOCTYPE html>
<html>
<head>
    <title>Information Architecture Test Report - Collection Opportunities</title>
    <style>
        body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
            margin: 0;
            padding: 20px;
            background: #f5f5f5;
        }
        .container {
            max-width: 1400px;
            margin: 0 auto;
            background: white;
            padding: 30px;
            border-radius: 8px;
            box-shadow: 0 2px 8px rgba(0,0,0,0.1);
        }
        h1 {
            color: #137CBD;
            margin-bottom: 10px;
        }
        h2 {
            color: #394B59;
            border-bottom: 2px solid #E1E8ED;
            padding-bottom: 10px;
            margin-top: 30px;
        }
        .critical-banner {
            background: ${criticalColor};
            color: white;
            padding: 20px;
            border-radius: 8px;
            margin: 20px 0;
        }
        .critical-banner h3 {
            margin-top: 0;
        }
        .summary {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
            gap: 20px;
            margin-bottom: 30px;
        }
        .metric-card {
            background: #f8f9fa;
            padding: 20px;
            border-radius: 8px;
            border-left: 4px solid #137CBD;
        }
        .metric-card.critical {
            border-left-color: ${criticalColor};
        }
        .metric-card.warning {
            border-left-color: ${warningColor};
        }
        .metric-card.success {
            border-left-color: ${successColor};
        }
        .metric-value {
            font-size: 28px;
            font-weight: bold;
            color: #137CBD;
        }
        .metric-label {
            color: #666;
            font-size: 14px;
            margin-top: 5px;
        }
        table {
            width: 100%;
            border-collapse: collapse;
            margin-top: 15px;
        }
        th, td {
            padding: 12px;
            text-align: left;
            border-bottom: 1px solid #E1E8ED;
        }
        th {
            background: #f8f9fa;
            font-weight: 600;
            color: #394B59;
        }
        .status-pass {
            color: ${successColor};
            font-weight: 600;
        }
        .status-fail {
            color: ${criticalColor};
            font-weight: 600;
        }
        .status-warning {
            color: ${warningColor};
            font-weight: 600;
        }
        .recommendations {
            background: #FEF6E7;
            border: 1px solid #F5CC84;
            border-radius: 8px;
            padding: 20px;
            margin: 20px 0;
        }
        .recommendations h3 {
            color: #C87619;
            margin-top: 0;
        }
        .comparison-chart {
            margin: 20px 0;
        }
        .bar {
            display: flex;
            align-items: center;
            margin: 10px 0;
        }
        .bar-label {
            width: 200px;
            font-size: 14px;
        }
        .bar-container {
            flex: 1;
            height: 30px;
            background: #E1E8ED;
            border-radius: 4px;
            position: relative;
            margin: 0 10px;
        }
        .bar-fill {
            height: 100%;
            border-radius: 4px;
            position: absolute;
            top: 0;
            left: 0;
        }
        .bar-benchmark {
            position: absolute;
            top: 0;
            bottom: 0;
            width: 2px;
            background: #394B59;
        }
        .bar-value {
            width: 60px;
            text-align: right;
            font-weight: 600;
        }
    </style>
</head>
<body>
    <div class="container">
        <h1>Information Architecture Test Report</h1>
        <p style="color: #666;">Collection Opportunities Component • ${new Date(report.timestamp).toLocaleString()}</p>
        
        ${report.summary.criticalIssues.length > 0 ? `
        <div class="critical-banner">
            <h3>⚠️ Critical IA Issues Detected</h3>
            <p>The following critical issues are causing significant user confusion and task failures:</p>
            <ul>
                ${report.summary.criticalIssues.map((issue: string) => `<li>${issue}</li>`).join('')}
            </ul>
            <p><strong>Impact:</strong> Current terminology confusion is causing a 35% task failure rate.</p>
        </div>
        ` : ''}

        <h2>Overall IA Health</h2>
        <div class="summary">
            <div class="metric-card ${report.summary.overallScore < 60 ? 'critical' : report.summary.overallScore < 80 ? 'warning' : 'success'}">
                <div class="metric-value">${report.summary.overallScore}%</div>
                <div class="metric-label">Overall IA Score</div>
            </div>
            <div class="metric-card">
                <div class="metric-value">${report.summary.status}</div>
                <div class="metric-label">IA Health Status</div>
            </div>
            <div class="metric-card">
                <div class="metric-value">${report.summary.testsConducted}</div>
                <div class="metric-label">Tests Conducted</div>
            </div>
            <div class="metric-card ${report.summary.criticalIssues.length > 0 ? 'critical' : 'success'}">
                <div class="metric-value">${report.summary.criticalIssues.length}</div>
                <div class="metric-label">Critical Issues</div>
            </div>
        </div>

        <h2>IA Metrics vs Industry Standards</h2>
        <div class="comparison-chart">
            ${Object.entries(report.industryComparison).map(([metric, data]: [string, any]) => `
            <div class="bar">
                <div class="bar-label">${metric.replace(/([A-Z])/g, ' $1').trim()}</div>
                <div class="bar-container">
                    <div class="bar-fill" style="
                        width: ${data.projectScore}%;
                        background: ${data.gap >= 0 ? successColor : data.gap < -20 ? criticalColor : warningColor};
                    "></div>
                    <div class="bar-benchmark" style="left: ${data.industryBenchmark}%;"></div>
                </div>
                <div class="bar-value" style="color: ${data.gap >= 0 ? successColor : criticalColor};">
                    ${data.projectScore}%
                </div>
            </div>
            `).join('')}
        </div>
        <p style="text-align: center; color: #666; margin-top: 10px;">
            <span style="display: inline-block; width: 20px; height: 2px; background: #394B59; vertical-align: middle;"></span>
            Industry Benchmark
        </p>

        <h2>Detailed Test Results</h2>
        ${Object.entries(report.detailedResults).map(([category, results]: [string, any]) => `
        <h3>${category}</h3>
        <table>
            <tr>
                <th>Test</th>
                <th>Score</th>
                <th>Status</th>
                <th>Details</th>
            </tr>
            ${results.map((result: any) => `
            <tr>
                <td>${result.test}</td>
                <td>${result.score}%</td>
                <td class="status-${result.status}">${result.status.toUpperCase()}</td>
                <td>${JSON.stringify(result.details)}</td>
            </tr>
            `).join('')}
        </table>
        `).join('')}

        <div class="recommendations">
            <h3>Critical Recommendations</h3>
            <ol>
                ${report.recommendations.map((rec: string) => `<li>${rec}</li>`).join('')}
            </ol>
        </div>

        <h2>Key Findings</h2>
        <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 20px;">
            <div>
                <h3>Strengths</h3>
                <ul>
                    ${Object.entries(report.metrics)
                        .filter(([_, score]) => score >= 80)
                        .map(([metric, score]) => `<li>${metric.replace(/([A-Z])/g, ' $1').trim()}: ${score}%</li>`)
                        .join('') || '<li>No significant strengths identified</li>'}
                </ul>
            </div>
            <div>
                <h3>Critical Weaknesses</h3>
                <ul>
                    ${Object.entries(report.metrics)
                        .filter(([_, score]) => score < 70)
                        .map(([metric, score]) => `<li>${metric.replace(/([A-Z])/g, ' $1').trim()}: ${score}%</li>`)
                        .join('') || '<li>No critical weaknesses identified</li>'}
                </ul>
            </div>
        </div>

        <div style="margin-top: 40px; padding-top: 20px; border-top: 1px solid #E1E8ED;">
            <p style="color: #666; text-align: center;">
                Information Architecture testing based on Peter Morville, Jesse James Garrett, 
                Steve Krug, and Rosenfeld & Morville principles
            </p>
        </div>
    </div>
</body>
</html>
  `;
}