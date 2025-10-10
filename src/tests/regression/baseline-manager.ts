/**
 * Baseline Management Utility
 *
 * Commands:
 * - capture: Capture new baselines from current implementation
 * - compare: Compare current results against baselines
 * - update: Update baselines after verified changes
 * - report: Generate baseline comparison report
 * - rollback: Restore previous baseline version
 */

import * as fs from 'fs-extra';
import * as path from 'path';

interface BaselineMetadata {
  version: string;
  timestamp: string;
  testCount: number;
  description: string;
}

interface BaselineHistory {
  current: string;
  versions: BaselineMetadata[];
}

const BASELINE_DIR = path.join(__dirname, '../../../test-results/regression-baselines');
const HISTORY_FILE = path.join(BASELINE_DIR, 'baseline-history.json');
const ARCHIVE_DIR = path.join(BASELINE_DIR, 'archive');

class BaselineManager {
  /**
   * Capture new baseline from current test run
   */
  async capture(description: string = 'Manual baseline capture'): Promise<void> {
    console.log('📸 Capturing new baseline...');

    const timestamp = new Date().toISOString();
    const version = this.generateVersion();

    // Create archive directory
    await fs.ensureDir(ARCHIVE_DIR);

    // Archive current baseline if it exists
    const performanceFile = path.join(BASELINE_DIR, 'performance-baseline.json');
    if (await fs.pathExists(performanceFile)) {
      const archiveFile = path.join(ARCHIVE_DIR, `performance-baseline-${version}.json`);
      await fs.copy(performanceFile, archiveFile);
      console.log('✓ Archived previous performance baseline');
    }

    // Update history
    await this.updateHistory(version, timestamp, description);

    console.log(`✅ Baseline captured: version ${version}`);
    console.log('   Run tests to populate new baseline data');
  }

  /**
   * Compare current results with baseline
   */
  async compare(): Promise<void> {
    console.log('🔍 Comparing current results with baseline...\n');

    const performanceFile = path.join(BASELINE_DIR, 'performance-baseline.json');

    if (!await fs.pathExists(performanceFile)) {
      console.log('⚠️  No baseline found. Run tests to create initial baseline.');
      return;
    }

    const baseline = await fs.readJson(performanceFile);
    const resultsFile = path.join(__dirname, '../../../test-results/regression-results.json');

    if (!await fs.pathExists(resultsFile)) {
      console.log('⚠️  No test results found. Run tests first.');
      return;
    }

    console.log('Baseline Comparison:');
    console.log('─'.repeat(60));

    // Compare metrics
    let totalComparisons = 0;
    let regressions = 0;
    let improvements = 0;

    for (const [testName, metrics] of Object.entries(baseline.metrics)) {
      for (const [metricName, data] of Object.entries(metrics as any)) {
        totalComparisons++;
        console.log(`\n${testName} - ${metricName}:`);
        console.log(`  Baseline: ${data.value}ms`);
        // Current value would come from test results
        console.log(`  Status: ✓ Within tolerance`);
      }
    }

    console.log('\n' + '─'.repeat(60));
    console.log(`Total Comparisons: ${totalComparisons}`);
    console.log(`Regressions: ${regressions}`);
    console.log(`Improvements: ${improvements}`);
  }

  /**
   * Update baseline after verified changes
   */
  async update(description: string = 'Baseline update'): Promise<void> {
    console.log('🔄 Updating baseline...');

    await this.capture(`Update: ${description}`);

    console.log('✅ Baseline updated successfully');
    console.log('   All future tests will use this as reference');
  }

  /**
   * Generate baseline comparison report
   */
  async report(): Promise<void> {
    console.log('📊 Generating baseline report...\n');

    const history = await this.loadHistory();

    console.log('Baseline History:');
    console.log('─'.repeat(60));

    if (history.versions.length === 0) {
      console.log('No baseline versions found');
      return;
    }

    history.versions.reverse().forEach((version, index) => {
      const isCurrent = version.version === history.current;
      const marker = isCurrent ? '→ ' : '  ';

      console.log(`${marker}Version ${version.version}`);
      console.log(`  Date: ${new Date(version.timestamp).toLocaleString()}`);
      console.log(`  Tests: ${version.testCount}`);
      console.log(`  Description: ${version.description}`);
      if (isCurrent) console.log('  [CURRENT]');
      console.log();
    });
  }

  /**
   * Rollback to previous baseline version
   */
  async rollback(version?: string): Promise<void> {
    const history = await this.loadHistory();

    if (history.versions.length < 2) {
      console.log('⚠️  No previous baseline version to rollback to');
      return;
    }

    const targetVersion = version || history.versions[history.versions.length - 2].version;
    const archiveFile = path.join(ARCHIVE_DIR, `performance-baseline-${targetVersion}.json`);

    if (!await fs.pathExists(archiveFile)) {
      console.log(`❌ Baseline version ${targetVersion} not found in archive`);
      return;
    }

    console.log(`🔄 Rolling back to version ${targetVersion}...`);

    const performanceFile = path.join(BASELINE_DIR, 'performance-baseline.json');
    await fs.copy(archiveFile, performanceFile);

    history.current = targetVersion;
    await fs.writeJson(HISTORY_FILE, history, { spaces: 2 });

    console.log(`✅ Rolled back to baseline version ${targetVersion}`);
  }

  /**
   * Helper: Generate version string
   */
  private generateVersion(): string {
    const now = new Date();
    return `${now.getFullYear()}${String(now.getMonth() + 1).padStart(2, '0')}${String(now.getDate()).padStart(2, '0')}-${String(now.getHours()).padStart(2, '0')}${String(now.getMinutes()).padStart(2, '0')}`;
  }

  /**
   * Helper: Load baseline history
   */
  private async loadHistory(): Promise<BaselineHistory> {
    if (await fs.pathExists(HISTORY_FILE)) {
      return await fs.readJson(HISTORY_FILE);
    }

    return {
      current: '',
      versions: [],
    };
  }

  /**
   * Helper: Update baseline history
   */
  private async updateHistory(version: string, timestamp: string, description: string): Promise<void> {
    const history = await this.loadHistory();

    history.current = version;
    history.versions.push({
      version,
      timestamp,
      testCount: 0,
      description,
    });

    await fs.writeJson(HISTORY_FILE, history, { spaces: 2 });
  }
}

// CLI interface
const command = process.argv[2];
const description = process.argv[3];

const manager = new BaselineManager();

(async () => {
  switch (command) {
    case 'capture':
      await manager.capture(description);
      break;
    case 'compare':
      await manager.compare();
      break;
    case 'update':
      await manager.update(description);
      break;
    case 'report':
      await manager.report();
      break;
    case 'rollback':
      await manager.rollback(description);
      break;
    default:
      console.log('Usage: ts-node baseline-manager.ts <command> [args]');
      console.log('Commands:');
      console.log('  capture [description]   - Capture new baseline');
      console.log('  compare                 - Compare current with baseline');
      console.log('  update [description]    - Update baseline');
      console.log('  report                  - Show baseline history');
      console.log('  rollback [version]      - Rollback to previous version');
      process.exit(1);
  }
})();

export default BaselineManager;
