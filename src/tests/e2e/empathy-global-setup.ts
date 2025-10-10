import { FullConfig } from '@playwright/test';
import * as fs from 'fs';
import * as path from 'path';

/**
 * Global setup for empathy-driven testing
 * Prepares the testing environment for realistic user scenarios
 */
async function globalSetup(config: FullConfig) {
  console.log('🎯 Setting up empathy-driven testing environment...');
  
  // Create directories for test artifacts
  const artifactDirs = [
    'test-results/empathy-tests',
    'test-results/empathy-tests/screenshots',
    'test-results/empathy-tests/videos',
    'test-results/empathy-tests/traces',
    'test-results/empathy-tests/accessibility-reports',
  ];
  
  artifactDirs.forEach(dir => {
    const fullPath = path.join(process.cwd(), dir);
    if (!fs.existsSync(fullPath)) {
      fs.mkdirSync(fullPath, { recursive: true });
    }
  });
  
  // Set up test data for different user personas
  const testPersonas = {
    nightShiftOperator: {
      name: 'Sarah Chen',
      role: 'Night Shift Lead',
      experience: '5 years',
      challenges: ['Time pressure', 'Critical decisions', 'Limited support'],
      testData: {
        criticalAllocations: 15,
        averageResponseTime: '< 3 minutes',
        shiftDuration: '8 hours',
      },
    },
    newOperator: {
      name: 'Jake Martinez',
      role: 'Junior Operator',
      experience: '1 week',
      challenges: ['Learning curve', 'Unfamiliar UI', 'Fear of mistakes'],
      testData: {
        trainingCompleted: false,
        errorRate: 'High initially',
        confidenceLevel: 'Low',
      },
    },
    fieldEngineer: {
      name: 'Maria Okonkwo',
      role: 'Field Engineer',
      experience: '10 years',
      challenges: ['Mobile device', 'Outdoor conditions', 'Limited connectivity'],
      testData: {
        deviceType: 'iPad Pro',
        networkQuality: 'Variable',
        environmentalFactors: ['Bright sunlight', 'Gloved hands', 'Standing'],
      },
    },
    seniorOperator: {
      name: 'Kim Thompson',
      role: 'Senior Operator',
      experience: '15 years',
      challenges: ['Presbyopia', 'Pattern recognition', 'Training others'],
      testData: {
        preferredZoomLevel: '150%',
        patternsIdentified: 'Monthly capacity issues',
        mentees: 3,
      },
    },
    blindOperator: {
      name: 'Alex Rivera',
      role: 'Operations Specialist',
      experience: '7 years',
      challenges: ['Screen reader dependency', 'Keyboard navigation', 'Complex tables'],
      testData: {
        screenReader: 'NVDA',
        navigationMethod: 'Keyboard only',
        efficiency: 'Equal to sighted operators',
      },
    },
  };
  
  // Write test personas to file for reference in tests
  fs.writeFileSync(
    path.join(process.cwd(), 'test-results/empathy-tests/test-personas.json'),
    JSON.stringify(testPersonas, null, 2)
  );
  
  // Set up performance benchmarks
  const performanceBenchmarks = {
    pageLoad: {
      target: 3000, // 3 seconds
      acceptable: 5000, // 5 seconds
      critical: 10000, // 10 seconds
    },
    interaction: {
      target: 100, // 100ms
      acceptable: 300, // 300ms
      critical: 1000, // 1 second
    },
    search: {
      target: 200, // 200ms
      acceptable: 500, // 500ms
      critical: 2000, // 2 seconds
    },
  };
  
  fs.writeFileSync(
    path.join(process.cwd(), 'test-results/empathy-tests/performance-benchmarks.json'),
    JSON.stringify(performanceBenchmarks, null, 2)
  );
  
  // Set up accessibility standards
  const accessibilityStandards = {
    wcag: '2.1',
    level: 'AA',
    criticalViolations: [
      'color-contrast',
      'button-name',
      'image-alt',
      'label',
      'link-name',
      'region',
    ],
    touchTargets: {
      minimum: 44, // 44x44 pixels
      recommended: 48,
    },
  };
  
  fs.writeFileSync(
    path.join(process.cwd(), 'test-results/empathy-tests/accessibility-standards.json'),
    JSON.stringify(accessibilityStandards, null, 2)
  );
  
  // Initialize test metrics tracking
  const metricsTemplate = {
    testRun: new Date().toISOString(),
    totalScenarios: 0,
    passedScenarios: 0,
    failedScenarios: 0,
    accessibilityViolations: [],
    performanceIssues: [],
    userExperienceIssues: [],
  };
  
  fs.writeFileSync(
    path.join(process.cwd(), 'test-results/empathy-tests/metrics.json'),
    JSON.stringify(metricsTemplate, null, 2)
  );
  
  console.log('✅ Empathy testing environment ready');
  console.log(`📁 Test artifacts will be saved to: test-results/empathy-tests/`);
  console.log(`👥 Testing with ${Object.keys(testPersonas).length} user personas`);
  
  // Set environment variables for tests
  process.env.EMPATHY_TEST_MODE = 'true';
  process.env.TEST_ARTIFACTS_PATH = 'test-results/empathy-tests';
  
  return async () => {
    // Teardown will be handled by global-teardown.ts
  };
}

export default globalSetup;