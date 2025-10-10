/**
 * Global Setup for Regression Testing
 *
 * Responsibilities:
 * - Initialize baseline database
 * - Validate baseline existence
 * - Set up performance baseline tracking
 * - Configure visual regression thresholds
 */

import * as fs from 'fs-extra';
import * as path from 'path';

interface RegressionConfig {
  baselineDir: string;
  performanceBaselineFile: string;
  visualBaselineDir: string;
  functionalBaselineFile: string;
}

const config: RegressionConfig = {
  baselineDir: path.join(__dirname, '../../../test-results/regression-baselines'),
  performanceBaselineFile: path.join(__dirname, '../../../test-results/regression-baselines/performance-baseline.json'),
  visualBaselineDir: path.join(__dirname, '../../../test-results/regression-baselines/visual'),
  functionalBaselineFile: path.join(__dirname, '../../../test-results/regression-baselines/functional-baseline.json'),
};

async function setupRegressionEnvironment(): Promise<void> {
  console.log('🔧 Setting up regression testing environment...');

  // Create baseline directories if they don't exist
  await fs.ensureDir(config.baselineDir);
  await fs.ensureDir(config.visualBaselineDir);

  // Initialize performance baseline if it doesn't exist
  if (!await fs.pathExists(config.performanceBaselineFile)) {
    console.log('📊 Creating initial performance baseline...');
    const initialBaseline = {
      created: new Date().toISOString(),
      version: '1.0.0',
      metrics: {
        renderTime: {},
        loadTime: {},
        interactionTime: {},
        memoryUsage: {},
      },
    };
    await fs.writeJson(config.performanceBaselineFile, initialBaseline, { spaces: 2 });
  }

  // Initialize functional baseline if it doesn't exist
  if (!await fs.pathExists(config.functionalBaselineFile)) {
    console.log('✅ Creating initial functional baseline...');
    const initialBaseline = {
      created: new Date().toISOString(),
      version: '1.0.0',
      tests: {},
    };
    await fs.writeJson(config.functionalBaselineFile, initialBaseline, { spaces: 2 });
  }

  // Validate baselines
  const performanceBaseline = await fs.readJson(config.performanceBaselineFile);
  const functionalBaseline = await fs.readJson(config.functionalBaselineFile);

  console.log('✓ Performance baseline loaded:', Object.keys(performanceBaseline.metrics).length, 'metric categories');
  console.log('✓ Functional baseline loaded:', Object.keys(functionalBaseline.tests).length, 'test scenarios');
  console.log('✓ Visual baseline directory ready:', config.visualBaselineDir);
  console.log('✅ Regression environment setup complete\n');
}

export default setupRegressionEnvironment;
