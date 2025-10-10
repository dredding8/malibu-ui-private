import { FullConfig } from '@playwright/test';
import fs from 'fs-extra';
import path from 'path';

async function globalTeardown(config: FullConfig) {
  console.log('🧹 Starting JTBD test cleanup...');
  
  const resultsDir = path.join(config.rootDir, 'test-results');
  const jtbdDir = path.join(resultsDir, 'jtbd-artifacts');
  const metricsFile = process.env.JTBD_METRICS_FILE || path.join(jtbdDir, 'jtbd-metrics.json');
  
  try {
    // Finalize metrics
    if (await fs.pathExists(metricsFile)) {
      const metrics = await fs.readJson(metricsFile);
      
      // Add completion time
      metrics.testRun.endTime = new Date().toISOString();
      metrics.testRun.duration = Date.now() - new Date(metrics.testRun.startTime).getTime();
      
      // Calculate summary statistics
      const workflows = Object.values(metrics.workflows || {}) as any[];
      metrics.summary = {
        totalWorkflows: workflows.length,
        passed: workflows.filter(w => w.passed).length,
        failed: workflows.filter(w => !w.passed).length,
        averageDuration: workflows.reduce((sum, w) => sum + w.duration, 0) / workflows.length || 0,
        totalErrors: workflows.reduce((sum, w) => sum + (w.errors || 0), 0),
        performanceScore: calculatePerformanceScore(workflows),
      };
      
      await fs.writeJson(metricsFile, metrics, { spaces: 2 });
      
      // Generate summary report
      await generateSummaryReport(metrics, jtbdDir);
      
      console.log('📊 Test metrics finalized');
      console.log(`📈 Overall pass rate: ${metrics.summary.passed}/${metrics.summary.totalWorkflows}`);
      console.log(`⚡ Performance score: ${metrics.summary.performanceScore}/100`);
    }
    
    // Cleanup temporary files if needed
    const tempDir = path.join(jtbdDir, 'temp');
    if (await fs.pathExists(tempDir)) {
      await fs.remove(tempDir);
    }
    
  } catch (error) {
    console.error('❌ Error during teardown:', error);
  }
  
  console.log('✅ JTBD test cleanup complete');
}

function calculatePerformanceScore(workflows: any[]): number {
  if (workflows.length === 0) return 0;
  
  const scores = workflows.map(w => {
    if (!w.performance) return 0;
    
    let score = 100;
    
    // Deduct points for exceeding thresholds
    if (w.performance.lcp > w.targetMetrics?.lcp) {
      score -= Math.min(20, (w.performance.lcp - w.targetMetrics.lcp) / 100);
    }
    if (w.performance.fid > w.targetMetrics?.fid) {
      score -= Math.min(20, (w.performance.fid - w.targetMetrics.fid) / 10);
    }
    if (w.performance.cls > w.targetMetrics?.cls) {
      score -= Math.min(20, (w.performance.cls - w.targetMetrics.cls) * 100);
    }
    if (w.performance.ttfb > w.targetMetrics?.ttfb) {
      score -= Math.min(20, (w.performance.ttfb - w.targetMetrics.ttfb) / 100);
    }
    if (w.duration > w.targetDuration) {
      score -= Math.min(20, (w.duration - w.targetDuration) / 1000);
    }
    
    return Math.max(0, score);
  });
  
  return Math.round(scores.reduce((sum, s) => sum + s, 0) / scores.length);
}

async function generateSummaryReport(metrics: any, outputDir: string) {
  const reportPath = path.join(outputDir, 'jtbd-summary.html');
  
  const html = `
<!DOCTYPE html>
<html>
<head>
  <title>JTBD Test Summary - ${new Date().toLocaleDateString()}</title>
  <style>
    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
      margin: 40px;
      background: #f5f5f5;
    }
    .header {
      background: #2c3e50;
      color: white;
      padding: 20px;
      border-radius: 8px;
      margin-bottom: 30px;
    }
    .metric-card {
      background: white;
      padding: 20px;
      border-radius: 8px;
      box-shadow: 0 2px 4px rgba(0,0,0,0.1);
      margin-bottom: 20px;
    }
    .metric-value {
      font-size: 36px;
      font-weight: bold;
      color: #2c3e50;
    }
    .metric-label {
      color: #666;
      font-size: 14px;
      text-transform: uppercase;
    }
    .grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
      gap: 20px;
    }
    .pass { color: #27ae60; }
    .fail { color: #e74c3c; }
    .workflow-table {
      width: 100%;
      border-collapse: collapse;
      margin-top: 20px;
    }
    .workflow-table th {
      background: #ecf0f1;
      padding: 12px;
      text-align: left;
      border-bottom: 2px solid #bdc3c7;
    }
    .workflow-table td {
      padding: 12px;
      border-bottom: 1px solid #ecf0f1;
    }
    .performance-badge {
      display: inline-block;
      padding: 4px 8px;
      border-radius: 4px;
      font-size: 12px;
      font-weight: bold;
    }
    .performance-good { background: #d4edda; color: #155724; }
    .performance-warning { background: #fff3cd; color: #856404; }
    .performance-poor { background: #f8d7da; color: #721c24; }
  </style>
</head>
<body>
  <div class="header">
    <h1>JTBD Test Execution Report</h1>
    <p>Test Run: ${metrics.testRun.startTime} - ${metrics.testRun.endTime}</p>
    <p>Environment: ${metrics.testRun.environment} | Base URL: ${metrics.testRun.config.baseURL}</p>
  </div>
  
  <div class="grid">
    <div class="metric-card">
      <div class="metric-label">Pass Rate</div>
      <div class="metric-value ${metrics.summary.passed === metrics.summary.totalWorkflows ? 'pass' : 'fail'}">
        ${Math.round((metrics.summary.passed / metrics.summary.totalWorkflows) * 100)}%
      </div>
      <div>${metrics.summary.passed} of ${metrics.summary.totalWorkflows} workflows passed</div>
    </div>
    
    <div class="metric-card">
      <div class="metric-label">Performance Score</div>
      <div class="metric-value">${metrics.summary.performanceScore}/100</div>
      <div>Overall performance rating</div>
    </div>
    
    <div class="metric-card">
      <div class="metric-label">Average Duration</div>
      <div class="metric-value">${Math.round(metrics.summary.averageDuration / 1000)}s</div>
      <div>Per workflow execution</div>
    </div>
    
    <div class="metric-card">
      <div class="metric-label">Total Errors</div>
      <div class="metric-value ${metrics.summary.totalErrors === 0 ? 'pass' : 'fail'}">
        ${metrics.summary.totalErrors}
      </div>
      <div>Across all workflows</div>
    </div>
  </div>
  
  <div class="metric-card">
    <h2>Workflow Details</h2>
    <table class="workflow-table">
      <thead>
        <tr>
          <th>Workflow</th>
          <th>Status</th>
          <th>Duration</th>
          <th>Performance</th>
          <th>Errors</th>
          <th>Actions</th>
        </tr>
      </thead>
      <tbody>
        ${Object.entries(metrics.workflows || {}).map(([id, w]: [string, any]) => `
          <tr>
            <td>${w.name || id}</td>
            <td class="${w.passed ? 'pass' : 'fail'}">${w.passed ? '✓ Passed' : '✗ Failed'}</td>
            <td>${Math.round(w.duration / 1000)}s</td>
            <td>
              <span class="performance-badge ${getPerformanceClass(w.performanceScore)}">
                ${w.performanceScore || 'N/A'}
              </span>
            </td>
            <td>${w.errors || 0}</td>
            <td>${w.actionCount || 0}</td>
          </tr>
        `).join('')}
      </tbody>
    </table>
  </div>
  
  <script>
    // Add any interactive features here
    console.log('JTBD Test Results:', ${JSON.stringify(metrics)});
  </script>
</body>
</html>
  `;
  
  await fs.writeFile(reportPath, html);
  console.log(`📄 Summary report generated: ${reportPath}`);
}

function getPerformanceClass(score: number): string {
  if (score >= 80) return 'performance-good';
  if (score >= 60) return 'performance-warning';
  return 'performance-poor';
}

export default globalTeardown;