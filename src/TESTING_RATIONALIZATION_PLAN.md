# Testing Infrastructure Rationalization - Wave 4

**Goal**: Consolidate 42 test scripts → 12 essential commands
**Impact**: Faster CI/CD, improved developer experience, reduced maintenance

---

## 📊 Current Test Infrastructure (Over-Engineered)

### Test Scripts (42 total)
```json
{
  "test": "react-scripts test",
  "test:ux": "./run-ux-tests.sh",
  "test:ux:enhanced": "./run-enhanced-ux-tests.sh",
  "test:playwright": "playwright test",
  "test:playwright:ui": "playwright test --ui",
  "test:playwright:debug": "playwright test --debug",
  "test:accessibility": "playwright test ... --grep 'Advanced Accessibility Testing'",
  "test:performance": "jest src/tests/performance/collection-performance.test.tsx --maxWorkers=1",
  "test:visual": "jest src/tests/visual/collection-visual.test.tsx",
  "test:routes": "playwright test --config=...",
  "test:routes:ui": "...",
  "test:routes:debug": "...",
  "test:routes:chrome": "...",
  "test:routes:firefox": "...",
  "test:routes:webkit": "...",
  "test:routes:mobile": "...",
  "test:routes:all": "./src/tests/e2e/run-route-validation.sh",
  "test:empathy": "./run-empathy-tests.sh",
  "test:empathy:ui": "...",
  "test:empathy:debug": "...",
  "test:empathy:journeys": "...",
  "test:empathy:scenarios": "...",
  "test:empathy:report": "...",
  "test:jtbd": "playwright test --config=playwright.jtbd.config.ts",
  "test:jtbd:ui": "...",
  "test:jtbd:debug": "...",
  "test:jtbd:headed": "...",
  "test:jtbd:chrome": "...",
  "test:jtbd:all-browsers": "...",
  "test:jtbd:mobile": "...",
  "test:jtbd:a11y": "...",
  "test:jtbd:performance": "...",
  "test:jtbd:update-baseline": "...",
  "test:jtbd:report": "...",
  "test:jtbd:complete": "./run-jtbd-tests.sh -a",
  "test:jtbd:quick": "./run-jtbd-tests.sh",
  "test:jtbd:watch": "...",
  "test:visual:capture": "./scripts/manage-visual-baselines.sh capture",
  "test:visual:compare": "...",
  "test:visual:update": "...",
  "test:visual:report": "...",
  "test:visual:clean": "...",
  // ... 10 more scripts
}
```

### Test Directories (16 total)
```
tests/
├── unit/ (Component tests)
├── integration/ (Workflow tests)
├── e2e/ (Playwright E2E)
├── smoke/ (Critical path tests)
├── regression/ (Baseline comparison)
├── performance/ (Benchmark tests)
├── visual/ (Screenshot comparison)
├── accessibility/ (a11y tests)
├── jtbd/ (Job-to-be-Done scenarios)
├── empathy/ (User journey tests)
├── mocks/ (Test data)
├── __fixtures__/ (Shared data)
├── __utils__/ (Test helpers)
└── setup/ (Configuration)
```

---

## 🎯 Target Test Infrastructure (Streamlined)

### Consolidated Test Scripts (12 total)

```json
{
  // UNIT TESTS (Jest + React Testing Library)
  "test": "jest",
  "test:watch": "jest --watch",
  "test:coverage": "jest --coverage",

  // INTEGRATION TESTS (Playwright - User Workflows)
  "test:integration": "playwright test tests/integration",

  // E2E TESTS (Playwright - Critical Paths)
  "test:e2e": "playwright test tests/e2e",
  "test:e2e:headed": "playwright test tests/e2e --headed",
  "test:e2e:debug": "playwright test tests/e2e --debug --headed",

  // ACCESSIBILITY TESTS (axe-core + Playwright)
  "test:a11y": "playwright test tests/accessibility",

  // COMPREHENSIVE TEST SUITES
  "test:all": "npm run test && npm run test:integration && npm run test:e2e",
  "test:ci": "npm run test:coverage && npm run test:integration && npm run test:e2e && npm run test:a11y",

  // DEVELOPMENT UTILITIES
  "test:update-snapshots": "jest --updateSnapshot",
  "test:debug": "node --inspect-brk node_modules/.bin/jest --runInBand"
}
```

### Consolidated Test Structure

```
tests/
├── unit/                          # Jest + RTL (Component logic)
│   ├── components/
│   ├── hooks/
│   ├── utils/
│   └── services/
│
├── integration/                   # Playwright (User workflows)
│   ├── collection-workflows.test.ts
│   ├── navigation-flows.test.ts
│   └── data-synchronization.test.ts
│
├── e2e/                          # Playwright (Critical paths)
│   ├── smoke/                    # Essential flows (5 min)
│   │   ├── login.spec.ts
│   │   ├── collection-create.spec.ts
│   │   └── collection-manage.spec.ts
│   │
│   └── regression/               # Comprehensive (15 min)
│       ├── collection-crud.spec.ts
│       ├── bulk-operations.spec.ts
│       └── search-filter.spec.ts
│
├── accessibility/                 # axe + Playwright
│   ├── collection-a11y.spec.ts
│   ├── navigation-a11y.spec.ts
│   └── forms-a11y.spec.ts
│
├── __fixtures__/                 # Shared test data
│   ├── collections.ts
│   ├── opportunities.ts
│   └── users.ts
│
├── __mocks__/                    # Service mocks
│   ├── collectionService.ts
│   └── apiClient.ts
│
└── __utils__/                    # Test utilities
    ├── testHelpers.ts
    └── customMatchers.ts
```

---

## 🔄 Migration Plan

### Phase 1: Consolidate Test Scripts

#### Merge Similar Tests
```yaml
BEFORE:
  test:routes, test:routes:chrome, test:routes:firefox, test:routes:webkit

AFTER:
  test:e2e (runs all browsers by default in CI)
  test:e2e:headed (for development)
```

#### Eliminate Redundant Tests
```yaml
REMOVE:
  ❌ test:jtbd:* (15 scripts) → Merge into test:integration
  ❌ test:empathy:* (6 scripts) → Merge into test:integration
  ❌ test:visual:* (5 scripts) → Keep only critical path visual tests in test:e2e
  ❌ test:ux:* (2 scripts) → Merge into test:integration
  ❌ test:routes:* (6 scripts) → Consolidate into test:e2e

KEEP (with consolidation):
  ✅ test (unit tests)
  ✅ test:integration (user workflows)
  ✅ test:e2e (critical paths)
  ✅ test:a11y (accessibility)
```

### Phase 2: Simplify Playwright Configs

#### Before: 5+ configs
```
playwright.config.ts
playwright.jtbd.config.ts
playwright.empathy.config.ts
playwright.visual.config.ts
playwright.regression.config.ts
playwright.route-validation.config.ts
```

#### After: 2 configs
```
playwright.config.ts              # Main config (all tests)
playwright.ci.config.ts           # CI-specific optimizations
```

#### Consolidated Config
```typescript
// playwright.config.ts
import { defineConfig, devices } from '@playwright/test';

export default defineConfig({
  testDir: './tests',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 4 : undefined,
  reporter: process.env.CI
    ? [['html'], ['json', { outputFile: 'test-results/results.json' }]]
    : 'list',

  use: {
    baseURL: 'http://localhost:3000',
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
  },

  projects: [
    // Desktop browsers
    { name: 'chromium', use: { ...devices['Desktop Chrome'] } },
    { name: 'firefox', use: { ...devices['Desktop Firefox'] } },
    { name: 'webkit', use: { ...devices['Desktop Safari'] } },

    // Mobile (run in CI only)
    ...(process.env.CI ? [
      { name: 'mobile-chrome', use: { ...devices['Pixel 5'] } },
      { name: 'mobile-safari', use: { ...devices['iPhone 12'] } },
    ] : []),
  ],

  webServer: {
    command: 'npm start',
    port: 3000,
    reuseExistingServer: !process.env.CI,
  },
});
```

### Phase 3: Optimize Test Execution

#### Jest Configuration
```typescript
// jest.config.js
module.exports = {
  preset: 'ts-jest',
  testEnvironment: 'jsdom',
  setupFilesAfterEnv: ['<rootDir>/tests/setup/jest.setup.ts'],

  // Coverage
  collectCoverageFrom: [
    'src/**/*.{ts,tsx}',
    '!src/**/*.d.ts',
    '!src/**/__tests__/**',
    '!src/**/__mocks__/**',
  ],
  coverageThresholds: {
    global: {
      branches: 80,
      functions: 80,
      lines: 80,
      statements: 80,
    },
  },

  // Performance
  maxWorkers: '50%', // Use half of available CPUs
  testTimeout: 10000,
  clearMocks: true,

  // Module resolution
  moduleNameMapper: {
    '\\.(css|less|scss)$': 'identity-obj-proxy',
    '^@/(.*)$': '<rootDir>/src/$1',
  },
};
```

---

## 🎯 Test Strategy by Type

### Unit Tests (Jest + RTL) - 60% of tests
**Purpose**: Component logic, hooks, utilities, services
**Speed**: Fast (<5 min for full suite)
**Coverage**: >80% code coverage
**Run**: Every commit (pre-commit hook)

```typescript
// Example: Component unit test
import { render, screen, fireEvent } from '@testing-library/react';
import { Collection } from '../Collection';

describe('Collection Component', () => {
  it('renders collection list', () => {
    const collections = mockCollections();
    render(<Collection collections={collections} />);
    expect(screen.getByText(collections[0].name)).toBeInTheDocument();
  });

  it('handles selection', () => {
    const collections = mockCollections();
    const onSelect = jest.fn();
    render(<Collection collections={collections} onSelect={onSelect} />);
    fireEvent.click(screen.getByTestId('select-all'));
    expect(onSelect).toHaveBeenCalled();
  });
});
```

### Integration Tests (Playwright) - 30% of tests
**Purpose**: User workflows across multiple components
**Speed**: Medium (5-10 min)
**Coverage**: Critical user journeys
**Run**: Pre-push, CI/CD

```typescript
// Example: Integration test
import { test, expect } from '@playwright/test';

test('collection workflow', async ({ page }) => {
  await page.goto('/collections');

  // Create collection
  await page.click('button:has-text("Create")');
  await page.fill('[name="name"]', 'Test Collection');
  await page.click('button:has-text("Save")');

  // Verify created
  await expect(page.locator('text=Test Collection')).toBeVisible();

  // Edit collection
  await page.click('[data-testid="edit-Test Collection"]');
  await page.fill('[name="name"]', 'Updated Collection');
  await page.click('button:has-text("Save")');

  // Verify updated
  await expect(page.locator('text=Updated Collection')).toBeVisible();
});
```

### E2E Tests (Playwright) - 10% of tests
**Purpose**: Critical path smoke tests
**Speed**: Fast for smoke (5 min), longer for comprehensive (15 min)
**Coverage**: Essential user flows
**Run**: CI/CD only (full suite), smoke tests on deploy

```typescript
// Example: E2E smoke test
test('critical path smoke test', async ({ page }) => {
  // Login
  await page.goto('/login');
  await page.fill('[name="username"]', 'testuser');
  await page.fill('[name="password"]', 'password');
  await page.click('button:has-text("Login")');

  // Verify dashboard loads
  await expect(page.locator('h1:has-text("Dashboard")')).toBeVisible();

  // Verify collections load
  await page.goto('/collections');
  await expect(page.locator('[data-testid="collection-grid"]')).toBeVisible();

  // Verify can create
  await page.click('button:has-text("Create")');
  await expect(page.locator('dialog')).toBeVisible();
});
```

### Accessibility Tests (axe + Playwright)
**Purpose**: WCAG compliance
**Speed**: Fast (3-5 min)
**Coverage**: All pages and components
**Run**: CI/CD

```typescript
// Example: Accessibility test
import { test, expect } from '@playwright/test';
import { injectAxe, checkA11y } from 'axe-playwright';

test('collection page accessibility', async ({ page }) => {
  await page.goto('/collections');
  await injectAxe(page);

  await checkA11y(page, null, {
    detailedReport: true,
    detailedReportOptions: { html: true },
  });

  // Check specific component
  await checkA11y(page, '[data-testid="collection-grid"]', {
    rules: {
      'color-contrast': { enabled: true },
      'aria-allowed-attr': { enabled: true },
    },
  });
});
```

---

## 📊 Performance Targets

### Before (Current)
- Full test suite: ~20 minutes
- Unit tests: ~8 minutes
- Integration tests: ~7 minutes
- E2E tests: ~5 minutes
- Scripts to manage: 42

### After (Target)
- Full test suite: ~8 minutes (-60%)
- Unit tests: ~3 minutes (-62%)
- Integration tests: ~3 minutes (-57%)
- E2E tests: ~2 minutes (-60%)
- Scripts to manage: 12 (-71%)

---

## ✅ Success Criteria

### Quantitative
- [ ] Test scripts: 42 → 12 (-71%)
- [ ] Playwright configs: 5 → 2 (-60%)
- [ ] Full suite execution: 20min → 8min (-60%)
- [ ] Test coverage maintained: >80%
- [ ] Zero flaky tests

### Qualitative
- [ ] Clear test organization
- [ ] Easy to run locally
- [ ] Fast feedback loop
- [ ] Comprehensive coverage
- [ ] Minimal maintenance

---

**Status**: Design Complete
**Next**: Implement consolidated test structure
