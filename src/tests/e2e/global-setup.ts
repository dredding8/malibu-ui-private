import { FullConfig } from '@playwright/test';
import fs from 'fs-extra';
import path from 'path';

async function globalSetup(config: FullConfig) {
  console.log('🎭 Setting up Playwright test environment...');
  
  // Create test results directory
  const resultsDir = path.join(process.cwd(), 'test-results');
  await fs.ensureDir(resultsDir);
  await fs.ensureDir(path.join(resultsDir, 'screenshots'));
  await fs.ensureDir(path.join(resultsDir, 'videos'));
  await fs.ensureDir(path.join(resultsDir, 'traces'));
  await fs.ensureDir(path.join(resultsDir, 'artifacts'));
  
  // Create test data file with collection information
  const testData = {
    collections: [
      {
        id: 'TEST-001',
        name: 'Test Collection 1',
        algorithmStatus: 'converged',
        createdAt: new Date().toISOString(),
      },
      {
        id: 'TEST-002',
        name: 'Test Collection 2',
        algorithmStatus: 'converged',
        createdAt: new Date().toISOString(),
      },
      {
        id: 'TEST-003',
        name: 'Test Collection 3',
        algorithmStatus: 'running',
        createdAt: new Date().toISOString(),
      },
    ],
    opportunities: [
      {
        id: 'OPP-001',
        collectionId: 'TEST-001',
        fieldMappingId: 'FM-001',
        status: 'pending',
        amount: 1000,
      },
      {
        id: 'OPP-002',
        collectionId: 'TEST-001',
        fieldMappingId: 'FM-002',
        status: 'allocated',
        amount: 2000,
      },
    ],
  };
  
  // Write test data to file
  await fs.writeJson(
    path.join(resultsDir, 'test-data.json'),
    testData,
    { spaces: 2 }
  );
  
  // Set environment variables for tests
  process.env.TEST_MODE = 'true';
  process.env.TEST_DATA_PATH = path.join(resultsDir, 'test-data.json');
  
  console.log('✅ Test environment setup complete');
  console.log(`📁 Test results will be saved to: ${resultsDir}`);
  
  return async () => {
    // This function will be called after all tests have run
    console.log('🧹 Cleaning up test environment...');
  };
}

export default globalSetup;